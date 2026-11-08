// the markdown tables build.mjs writes into README.md and ACCESSIBILITY.md
import { contrast } from "./colour.mjs";
import { measureAll } from "./measure.mjs";
import { ANSI_NAMES, UI_NON_TEXT, UI_TEXT, rulesFor, styleOf } from "./palette.mjs";

// one decimal place, floored, so a printed 7.0:1 is never really 6.96:1
const floor1 = (n) => Math.floor(n * 10) / 10;
const r1 = (n) => `${floor1(n).toFixed(1)}:1`;
const floor3 = (n) => (Math.floor(n * 1000) / 1000).toFixed(3);

export function contrastTables(palette) {
  const all = measureAll(palette);
  // the surfaces a lowest ratio was measured on, named as a reader sees them
  const SURFACE_NAMES = {
    listSelection: "a selected row",
    lineHighlight: "the current line",
    diffAddedBackground: "an added line",
    diffRemovedBackground: "a removed line",
    findMatch: "a find match",
    background: "the background",
  };
  const name = (x) => x.item.replace("syntax.", "");
  const find = (rows, item, on) => rows.find((x) => x.item === item && (!on || x.on === on));
  const summary = [
    "| Theme | Text on background | Lowest syntax colour on background | Lowest syntax colour over a diff or a selected row | Current line | Selection |",
    "| --- | --- | --- | --- | --- | --- |",
    ...all.map(({ theme, contrastRows, lowestOnBackground, lowestText, lowestOnSelection, lowestOnLine }) => {
      const u = theme.ui;
      const text = find(contrastRows, "syntax.foreground", "background");
      const strong = find(contrastRows, "ui.selectionForeground");
      const selection = `\`${u.selectionForeground}\` on \`${u.selectionStrong}\`, ${r1(strong.ratio)}; background only \`${u.selection}\`, syntax ${r1(lowestOnSelection.ratio)} (${name(lowestOnSelection)})`;
      const band = find(contrastRows, "ui.lineHighlight");
      const line = `\`${u.lineHighlight}\` ${r1(band.ratio)} on the background, syntax ${r1(lowestOnLine.ratio)} (${name(lowestOnLine)})`;
      return `| ${theme.name} | \`${u.foreground}\` on \`${u.background}\`, ${r1(text.ratio)} | ${r1(lowestOnBackground.ratio)} (${name(lowestOnBackground)}) | ${r1(lowestText.ratio)} (${name(lowestText)} on ${SURFACE_NAMES[lowestText.on]}) | ${line} | ${selection} |`;
    }),
  ].join("\n");

  const tokens = Object.keys(palette.themes[0].syntax);
  const detail = [
    "Each cell gives the colour, its contrast on the background, its lowest contrast over a diff background or a selected row, its contrast over the current line and its contrast over the background only selection.",
    "",
    `| Token | Style | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    ...tokens.map((token) => {
      const style = token === "foreground" ? "" : styleOf(palette, token).join(", ");
      const cells = all.map(({ contrastRows }) => {
        const rows = contrastRows.filter((x) => x.item === `syntax.${token}`);
        const bg = rows.find((x) => x.on === "background");
        const overlays = ["listSelection", "diffAddedBackground", "diffRemovedBackground"];
        const low = Math.min(...rows.filter((x) => overlays.includes(x.on)).map((x) => x.ratio));
        const line = rows.find((x) => x.on === "lineHighlight");
        const selected = rows.find((x) => x.on === "selection");
        return `\`${bg.colour}\` ${r1(bg.ratio)}, ${r1(low)}, ${r1(line.ratio)}, ${r1(selected.ratio)}`;
      });
      return `| ${token} | ${style || "regular"} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  // the selection in each kind of editor, with the floors the checks hold it to
  const r = palette.rules;
  // the text floor column names any theme that sets its own, such as 7:1 with 4.5:1 for a gentler pair
  const own = new Map();
  for (const theme of palette.themes) {
    const floor = rulesFor(palette, theme).textContrast;
    if (floor !== r.textContrast) own.set(floor, [...(own.get(floor) ?? []), theme.name.replace(/^Zacess /, "")]);
  }
  const textFloor = [`${r.textContrast}:1`, ...[...own].map(([floor, names]) => `${floor}:1 in ${names.join(" and ")}`)].join(", ");
  const selectionRow = (label, floor, cell) => `| ${label} | ${floor} | ${all.map(cell).join(" | ")} |`;
  const selection = [
    `| Measure | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    selectionRow("Selected text on the selection block", textFloor, ({ theme, contrastRows }) =>
      `\`${theme.ui.selectionForeground}\` on \`${theme.ui.selectionStrong}\`, ${r1(find(contrastRows, "ui.selectionForeground").ratio)}`),
    selectionRow("The block on the background", `${r.nonTextContrast}:1`, ({ contrastRows }) => r1(find(contrastRows, "ui.selectionStrong").ratio)),
    selectionRow("Windows Terminal's own black or white text on the block", textFloor, ({ contrastRows }) => {
      const x = find(contrastRows, "windowsTerminal.selectionText");
      return `\`${x.colour}\` ${r1(x.ratio)}`;
    }),
    selectionRow("Background only selection on the background", "none, explained below", ({ theme }) =>
      `\`${theme.ui.selection}\` ${r1(contrast(theme.ui.selection, theme.ui.background))}`),
    selectionRow("Lowest syntax colour over it", `${r.selectionContrast}:1`, ({ lowestOnSelection }) => `${r1(lowestOnSelection.ratio)} (${name(lowestOnSelection)})`),
    selectionRow("Plain text over it", textFloor, ({ contrastRows }) => r1(find(contrastRows, "syntax.foreground", "selection").ratio)),
    selectionRow("Muted text and links over it", `${r.selectionContrast}:1`, ({ contrastRows }) =>
      r1(Math.min(...contrastRows.filter((x) => x.item.startsWith("selectionText.")).map((x) => x.ratio)))),
    selectionRow("Closest fill, least OKLab distance in normal vision and the three simulations", `${r.selectionDistance}`, ({ selectionRows }) => {
      const x = selectionRows.reduce((m, y) => (y.distance < m.distance ? y : m));
      return `${floor3(x.distance)} (${x.item === "selection" ? "background only selection" : "selection block"} and ${SURFACE_NAMES[x.on]})`;
    }),
  ].join("\n");

  // the signals that show where the reader is: the cursor, the current line and the find match
  const closest = (rows, item) => rows.filter((x) => x.item === item).reduce((m, y) => (y.distance < m.distance ? y : m));
  const FILL_NAMES = { ...SURFACE_NAMES, selection: "the background only selection", selectionStrong: "the selection block", cursor: "the cursor" };
  const lowestUi = (contrastRows, item) => contrastRows.filter((x) => x.item === item).reduce((m, y) => (y.ratio < m.ratio ? y : m));
  const signals = [
    `| Measure | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    selectionRow("Cursor on the background and the current line", textFloor, ({ theme, contrastRows }) => `\`${theme.ui.cursor}\` ${r1(lowestUi(contrastRows, "ui.cursor").ratio)}`),
    selectionRow("Character under a block cursor, in the background colour", textFloor, ({ contrastRows }) => r1(lowestUi(contrastRows, "ui.background").ratio)),
    selectionRow("Cursor and its closest fill, least OKLab distance", `${r.selectionDistance}`, ({ selectionRows }) => {
      const x = closest(selectionRows, "cursor");
      return `${floor3(x.distance)} (${FILL_NAMES[x.on]})`;
    }),
    selectionRow("Terminal cursor and the character under it", textFloor, ({ theme, contrastRows }) => {
      const c = find(contrastRows, "terminal.cursor");
      return `\`${c.colour}\` ${r1(c.ratio)}, text ${r1(find(contrastRows, "terminal.cursorText").ratio)}`;
    }),
    selectionRow("Terminal cursor and its closest fill, least OKLab distance", `${r.selectionDistance}`, ({ selectionRows }) => {
      const x = closest(selectionRows, "terminal.cursor");
      return `${floor3(x.distance)} (${FILL_NAMES[x.on]})`;
    }),
    selectionRow("Current line on the background", `${r.signalContrast}:1`, ({ theme, contrastRows }) => `\`${theme.ui.lineHighlight}\` ${r1(find(contrastRows, "ui.lineHighlight").ratio)}`),
    selectionRow("Lowest syntax colour over the current line", `${r.signalTextContrast}:1`, ({ lowestOnLine }) => `${r1(lowestOnLine.ratio)} (${name(lowestOnLine)})`),
    selectionRow("Plain text over the current line", textFloor, ({ contrastRows }) => r1(find(contrastRows, "syntax.foreground", "lineHighlight").ratio)),
    selectionRow("Current line and the find match, least OKLab distance", `${r.selectionDistance}`, ({ selectionRows }) => floor3(closest(selectionRows, "lineHighlight").distance)),
    selectionRow("Find match on the background", "none, it carries a border", ({ theme }) => `\`${theme.ui.findMatch}\` ${r1(contrast(theme.ui.findMatch, theme.ui.background))}`),
    selectionRow("Plain text over the find match", textFloor, ({ contrastRows }) => r1(find(contrastRows, "syntax.foreground", "findMatch").ratio)),
    selectionRow("Lowest syntax colour over the find match", `${r.findMatchContrast}:1`, ({ lowestOnFind }) => `${r1(lowestOnFind.ratio)} (${name(lowestOnFind)})`),
    selectionRow("Find match border on the match, the background and the current line", `${r.nonTextContrast}:1`, ({ theme, contrastRows }) => `\`${theme.ui.findMatchBorder}\` ${r1(lowestUi(contrastRows, "ui.findMatchBorder").ratio)}`),
    selectionRow("Word and bracket outlines on the background and the current line", `${r.nonTextContrast}:1`, ({ theme, contrastRows }) => {
      const rows = contrastRows.filter((x) => x.item === "ui.border" || x.item === "ui.matchOutline");
      return `\`${theme.ui.border}\` and \`${theme.ui.matchOutline ?? theme.ui.accent}\`, ${r1(Math.min(...rows.map((x) => x.ratio)))}`;
    }),
    selectionRow("Word and bracket outlines and the find match outline, least OKLab distance", `${r.selectionDistance}`, ({ selectionRows }) => {
      const x = selectionRows.filter((y) => y.on === "findMatchBorder").reduce((m, y) => (y.distance < m.distance ? y : m));
      return floor3(x.distance);
    }),
  ].join("\n");

  const terminal = [
    `| Colour | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | ${all.map(() => "---").join(" | ")} |`,
    ...ANSI_NAMES.map((name, i) => {
      const cells = all.map(({ terminalRows }) => {
        const t = terminalRows[i];
        return t.role === "background"
          ? `\`${t.colour}\` background shade, text on it ${r1(t.ratio)}`
          : `\`${t.colour}\` ${r1(t.ratio)}`;
      });
      return `| ${i} ${name} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  // interface text first at the text floor, then the marks at the non-text floor; an accent is
  // listed under both, as text and as an outline
  const uiItems = [...UI_TEXT.map(([item]) => [item, "text"]), ...[...new Set(UI_NON_TEXT.map(([item]) => item))].map((item) => [item, "nonText"])];
  const floorOf = (theme, kind) => (kind === "text" ? rulesFor(palette, theme).textContrast : palette.rules.nonTextContrast);
  // the background is measured here as the character under a block cursor
  const UI_LABELS = { background: "background, as text under the cursor" };
  const ui = [
    "Each cell gives the colour and its lowest contrast on the surfaces it is drawn on.",
    "",
    `| Interface colour | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    ...uiItems.map(([item, kind]) => {
      const cells = all.map(({ theme, contrastRows }) => {
        const rows = contrastRows.filter((x) => x.item === `ui.${item}` && x.floor === floorOf(theme, kind));
        return `\`${rows[0].colour}\` ${r1(Math.min(...rows.map((x) => x.ratio)))}`;
      });
      const label = UI_LABELS[item] ?? (item === "accent" && kind === "nonText" ? "accent, as an outline" : item);
      return `| ${label} | ${kind === "text" ? textFloor : `${palette.rules.nonTextContrast}:1`} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  const kinds = ["protanopia", "deuteranopia", "tritanopia"];
  const vision = [
    `| Measure | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    (() => {
      const cells = all.map(({ pairRows }) => {
        const p = pairRows.filter((x) => x.sameStyle || x.lightness).reduce((m, x) => (x.toneDiff < m.toneDiff ? x : m));
        return `${floor3(p.toneDiff)} (${p.a} and ${p.b})`;
      });
      return `| Closest tone | ${palette.rules.toneStep} | ${cells.join(" | ")} |`;
    })(),
    ...kinds.map((kind) => {
      const cells = all.map(({ pairRows }) => {
        const p = pairRows.filter((x) => x.sameStyle || x.lightness).reduce((m, x) => (x.simulated[kind] < m.simulated[kind] ? x : m));
        return `${floor3(p.simulated[kind])} (${p.a} and ${p.b})`;
      });
      return `| Closest OKLab distance, ${kind} | ${palette.rules.deficiencyDistance} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  return { summary, detail, selection, signals, terminal, ui, vision };
}
