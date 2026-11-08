// every measurement the checks, the tables and the website data share, so a number in the
// README is always the number CI enforced
import { DEFICIENCIES, contrast, distance, luminance, oklab, ratio, simulate } from "./colour.mjs";
import { CURSOR_NEIGHBOURS, LINE_NEIGHBOURS, SELECTION_NEIGHBOURS, SELECTION_TEXT, TEXT_SURFACES, UI_TEXT, UI_NON_TEXT, rulesFor, styleOf, terminalText } from "./palette.mjs";

// tone is the cube root of relative luminance: the OKLab lightness of the grey with the same
// luminance, which is all a viewer with no colour vision has to go on
export const tone = (hex) => Math.cbrt(luminance(hex));

// Windows Terminal has no selected text setting: it draws selected text black or white, white
// when the selection's OKLab lightness is under 0.5 (ColorFix::GetLightness in AtlasEngine.cpp)
export const windowsSelectionText = (selection) => (oklab(selection)[0] < 0.5 ? "#ffffff" : "#000000");

// the smallest OKLab distance between two colours in normal vision and under each simulated
// colour vision deficiency
const SIMULATIONS = DEFICIENCIES.filter((d) => d !== "achromatopsia");
export const leastDistance = (a, b) => Math.min(distance(a, b), ...SIMULATIONS.map((d) => distance(simulate(a, d), simulate(b, d))));

const row = (theme, item, colour, on, background, floor) => {
  const value = contrast(colour, background);
  return { theme: theme.id, item, colour, on, background, ratio: ratio(colour, background), floor, pass: value >= floor };
};

export function measureTheme(palette, theme) {
  const r = rulesFor(palette, theme);
  const u = theme.ui;
  const contrastRows = [];
  for (const [token, colour] of Object.entries(theme.syntax)) {
    for (const surface of TEXT_SURFACES) contrastRows.push(row(theme, `syntax.${token}`, colour, surface, u[surface], r.textContrast));
    const floor = token === "foreground" ? r.textContrast : r.findMatchContrast;
    contrastRows.push(row(theme, `syntax.${token}`, colour, "findMatch", u.findMatch, floor));
    // the background only selection keeps each character's own colour, so the plain text keeps
    // the text floor over it and the syntax colours the selection floor
    const selectionFloor = token === "foreground" ? r.textContrast : r.selectionContrast;
    contrastRows.push(row(theme, `syntax.${token}`, colour, "selection", u.selection, selectionFloor));
    // the current line is a band strong enough to see, so the syntax colours keep the signal floor
    // over it and the plain text the text floor
    const lineFloor = token === "foreground" ? r.textContrast : r.signalTextContrast;
    contrastRows.push(row(theme, `syntax.${token}`, colour, "lineHighlight", u.lineHighlight, lineFloor));
  }
  // the band itself must be visible on the background
  contrastRows.push(row(theme, "ui.lineHighlight", u.lineHighlight, "background", u.background, r.signalContrast));
  for (const item of SELECTION_TEXT) contrastRows.push(row(theme, `selectionText.${item}`, u[item], "selection", u.selection, r.selectionContrast));
  for (const [item, surfaces] of UI_TEXT) {
    for (const surface of surfaces) contrastRows.push(row(theme, `ui.${item}`, u[item], surface, u[surface], r.textContrast));
  }
  for (const [item, surface] of UI_NON_TEXT) contrastRows.push(row(theme, `ui.${item}`, u[item], surface, u[surface], r.nonTextContrast));
  const term = terminalText(theme);
  contrastRows.push(row(theme, "terminal.foreground", term.foreground, "background", u.background, r.textContrast));
  // Zed's terminal draws the editor's background only selection under the terminal text
  contrastRows.push(row(theme, "terminal.foreground", term.foreground, "selection", u.selection, r.textContrast));
  // the terminal cursor is a block with the background colour drawn as the text under it, so both
  // keep the text floor; in a terminal buffer the cursor can sit over the selection block
  contrastRows.push(row(theme, "terminal.cursor", term.cursor, "background", u.background, r.textContrast));
  contrastRows.push(row(theme, "terminal.cursorText", u.background, "terminal.cursor", term.cursor, r.textContrast));
  contrastRows.push(row(theme, "windowsTerminal.selectionText", windowsSelectionText(u.selectionStrong), "selectionStrong", u.selectionStrong, r.textContrast));

  // each selection colour, the cursor and the current line stay apart from the fills they could be
  // mistaken for
  const distanceRow = (item, colour, on) => {
    const value = leastDistance(colour, u[on]);
    return { theme: theme.id, item, colour, on, background: u[on], distance: value, floor: r.selectionDistance, pass: value >= r.selectionDistance };
  };
  // the word and bracket outlines keep the non-text floor where they are drawn and stay apart from
  // the find match outline, so an outlined word never passes for another find match
  const outlines = [["ui.border", u.border], ["ui.matchOutline", u.matchOutline ?? u.accent]];
  for (const [item, colour] of outlines) {
    for (const on of ["background", "lineHighlight"]) contrastRows.push(row(theme, item, colour, on, u[on], r.nonTextContrast));
  }
  const outlineRows = outlines.map(([item, colour]) => {
    const value = leastDistance(colour, u.findMatchBorder);
    return { theme: theme.id, item: item.replace("ui.", ""), colour, on: "findMatchBorder", background: u.findMatchBorder, distance: value, floor: r.selectionDistance, pass: value >= r.selectionDistance };
  });
  const selectionRows = [
    ...outlineRows,
    ...["selection", "selectionStrong"].flatMap((item) => SELECTION_NEIGHBOURS.map((on) => distanceRow(item, u[item], on))),
    ...CURSOR_NEIGHBOURS.map((on) => distanceRow("cursor", u.cursor, on)),
    ...CURSOR_NEIGHBOURS.map((on) => distanceRow("terminal.cursor", term.cursor, on)),
    ...LINE_NEIGHBOURS.map((on) => distanceRow("lineHighlight", u.lineHighlight, on)),
  ];

  const terminalRows = theme.terminal.ansi.map((colour, i) => {
    if (theme.terminal.backgroundRole.includes(i)) {
      // a background role colour sits under text, so the text is measured on it instead
      const measured = row(theme, `ansi.${i}`, term.foreground, `ansi.${i}`, colour, r.textContrast);
      return { ...measured, role: "background", colour, text: term.foreground };
    }
    const measured = row(theme, `ansi.${i}`, colour, "background", u.background, r.textContrast);
    return { ...measured, role: "text" };
  });

  // coloured program output must never blend into normal terminal text: each ANSI colour differs
  // from the default foreground in tone or, under every simulation, in OKLab; the slots that stand
  // for the default text by convention are listed in terminal.textRole and skipped
  const textRole = theme.terminal.textRole ?? [];
  const nearText = theme.terminal.nearText ?? [];
  const terminalTextRows = theme.terminal.ansi.flatMap((colour, i) => {
    if (textRole.includes(i) || theme.terminal.backgroundRole.includes(i)) return [];
    const toneDiff = Math.abs(tone(term.foreground) - tone(colour));
    const simulated = Object.fromEntries(
      ["normal", ...DEFICIENCIES.filter((d) => d !== "achromatopsia")].map((d) => [
        d,
        d === "normal" ? distance(term.foreground, colour) : distance(simulate(term.foreground, d), simulate(colour, d)),
      ]),
    );
    const apart = toneDiff >= r.toneStep || Object.values(simulated).every((v) => v >= r.deficiencyDistance);
    // a slot listed in terminal.nearText is reported but not failed; ACCESSIBILITY.md names it
    const pass = apart || nearText.includes(i);
    return [{ theme: theme.id, index: i, colour, foreground: term.foreground, toneDiff, simulated, apart, pass }];
  });

  // a ui pair names two interface colours, which carry no font style, so it always needs both
  // the tone step and the simulated distance
  const pairRows = palette.pairs.map(({ pair: [a, b], lightness = false, ui = false }) => {
    const colours = ui ? theme.ui : theme.syntax;
    const ca = colours[a];
    const cb = colours[b];
    const sameStyle = ui || styleOf(palette, a).join() === styleOf(palette, b).join();
    const toneDiff = Math.abs(tone(ca) - tone(cb));
    const simulated = Object.fromEntries(
      DEFICIENCIES.filter((d) => d !== "achromatopsia").map((d) => [d, distance(simulate(ca, d), simulate(cb, d))]),
    );
    const needsColour = sameStyle || lightness;
    const toneOk = !needsColour || toneDiff >= r.toneStep;
    const deficiencyOk = !needsColour || Object.values(simulated).every((v) => v >= r.deficiencyDistance);
    return { theme: theme.id, a, b, sameStyle, lightness, toneDiff, simulated, pass: toneOk && deficiencyOk };
  });

  const syntaxOnBackground = contrastRows.filter((x) => x.item.startsWith("syntax.") && x.on === "background");
  // the surfaces drawn over the background and held to the text floor, which is what the third
  // column of the summary reports; the selection and the current line have columns of their own
  const OVERLAYS = ["listSelection", "diffAddedBackground", "diffRemovedBackground"];
  const textRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && OVERLAYS.includes(x.on));
  const selectionTextRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && x.item !== "syntax.foreground" && x.on === "selection");
  const lineRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && x.item !== "syntax.foreground" && x.on === "lineHighlight");
  const findRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && x.item !== "syntax.foreground" && x.on === "findMatch");
  const lowest = (rows) => rows.reduce((m, x) => (x.ratio < m.ratio ? x : m));
  return {
    lowestOnLine: lowest(lineRows),
    lowestOnFind: lowest(findRows),
    contrastRows,
    terminalRows,
    terminalTextRows,
    pairRows,
    selectionRows,
    lowestOnBackground: lowest(syntaxOnBackground),
    lowestText: lowest(textRows),
    lowestOnSelection: lowest(selectionTextRows),
  };
}

export const measureAll = (palette) => palette.themes.map((t) => ({ theme: t, ...measureTheme(palette, t) }));
