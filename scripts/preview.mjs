#!/usr/bin/env node
// draws previews/<theme>.svg as real SVG text in each theme's colours and writes
// previews/themes.json, the data the website's themes page is built from; PNG copies for the
// VS Code Marketplace, which refuses SVG images, are drawn with rsvg-convert when it is installed
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, REPO, loadPalette, styleOf } from "./lib/palette.mjs";
import { measureAll } from "./lib/measure.mjs";
import { ratio } from "./lib/colour.mjs";
import { SAMPLE, lineTokens } from "./lib/sample.mjs";

const palette = loadPalette();
const results = measureAll(palette);
const out = join(ROOT, "previews");
mkdirSync(out, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONT = "'Atkinson Hyperlegible Mono', 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";
const W = 720;
const LINE = 26;
const TOP = 64;
const GUTTER = 56;

function svg(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const height = TOP + SAMPLE.length * LINE + 24;
  const label = `${theme.name} code theme preview: TypeScript, Python, Rust, HTML and diff lines in ${theme.syntax.foreground} on ${u.background}. Keywords are bold, comments and parameters italic and invalid code underlined.`;
  const lines = [];
  SAMPLE.forEach((line, i) => {
    const y = TOP + i * LINE;
    if (line.highlight) lines.push(`  <rect x="0" y="${y - 18}" width="${W}" height="${LINE}" fill="${u.lineHighlight}"/>`);
    const numberColour = line.highlight ? u.lineNumberActive : u.lineNumber;
    lines.push(`  <text x="${GUTTER - 16}" y="${y}" fill="${numberColour}" text-anchor="end">${i + 1}</text>`);
    const spans = lineTokens(line).map(([token, text]) => {
      const style = styleOf(palette, token);
      const attrs = [`fill="${s[token]}"`];
      if (style.includes("bold")) attrs.push('font-weight="700"');
      if (style.includes("italic")) attrs.push('font-style="italic"');
      if (style.includes("underline")) attrs.push('text-decoration="underline"');
      return `<tspan ${attrs.join(" ")}>${esc(text)}</tspan>`;
    });
    if (spans.length) lines.push(`  <text x="${GUTTER}" y="${y}" xml:space="preserve">${spans.join("")}</text>`);
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(label)}">`,
    `  <title>${esc(label)}</title>`,
    `  <rect width="${W}" height="${height}" fill="${u.background}"/>`,
    `  <rect width="${W}" height="40" fill="${u.surfaceAlt}"/>`,
    `  <rect y="40" width="${W}" height="1" fill="${u.border}"/>`,
    `  <g font-family="${esc(FONT)}" font-size="15">`,
    `  <text x="20" y="26" fill="${u.foreground}" font-weight="700">${esc(theme.name)}</text>`,
    ...lines,
    "  </g>",
    "</svg>",
    "",
  ].join("\n");
}

const pngTool = spawnSync("rsvg-convert", ["--version"], { encoding: "utf8" });
const canPng = pngTool.status === 0;

for (const theme of palette.themes) {
  const file = join(out, `zacess-${theme.id}.svg`);
  writeFileSync(file, svg(theme));
  if (canPng) {
    const png = join(out, `zacess-${theme.id}.png`);
    const run = spawnSync("rsvg-convert", ["--zoom", "2", "--output", png, file], { encoding: "utf8" });
    if (run.status !== 0) throw new Error(`rsvg-convert failed for ${file}: ${run.stderr}`);
  }
}

// the store image for each browser theme, drawn from the colours in its own Chrome manifest the way
// Firefox Add-ons draws a theme's preview: the tab strip, the toolbar and the new tab page
const UI_FONT = "'Atkinson Hyperlegible', -apple-system, 'Segoe UI', Roboto, sans-serif";
function browserSvg(theme) {
  const colours = JSON.parse(readFileSync(join(ROOT, "browsers", "chrome", `zacess-${theme.id}`, "manifest.json"), "utf8")).theme.colors;
  const c = Object.fromEntries(Object.entries(colours).map(([k, [r, g, b]]) => [k, `rgb(${r}, ${g}, ${b})`]));
  const icon = (x, path) => `    <path transform="translate(${x} 60)" d="${path}" fill="none" stroke="${c.toolbar_button_icon}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800" role="img" aria-label="${esc(theme.name)} in a browser: the tab strip, toolbar and new tab page">`,
    `  <title>${esc(theme.name)} browser theme</title>`,
    `  <g font-family="${esc(UI_FONT)}">`,
    `    <rect width="1280" height="800" fill="${c.ntp_background}"/>`,
    `    <rect width="1280" height="46" fill="${c.frame}"/>`,
    `    <circle cx="22" cy="23" r="6" fill="${c.tab_background_text}" opacity="0.55"/>`,
    `    <circle cx="42" cy="23" r="6" fill="${c.tab_background_text}" opacity="0.55"/>`,
    `    <circle cx="62" cy="23" r="6" fill="${c.tab_background_text}" opacity="0.55"/>`,
    `    <path d="M 84 46 Q 92 46 92 38 L 92 18 Q 92 8 102 8 L 330 8 Q 340 8 340 18 L 340 38 Q 340 46 348 46 Z" fill="${c.toolbar}"/>`,
    `    <text x="112" y="32" font-size="15" fill="${c.tab_text}">New Tab</text>`,
    `    <text x="364" y="32" font-size="15" fill="${c.tab_background_text}">Zacess Themes</text>`,
    `    <rect y="46" width="1280" height="48" fill="${c.toolbar}"/>`,
    icon(20, "M 10 0 L 0 10 L 10 20 M 0 10 L 20 10"),
    icon(56, "M 10 0 L 20 10 L 10 20 M 20 10 L 0 10"),
    icon(92, "M 18 6 A 9 9 0 1 0 19 13 M 18 0 L 18 6 L 12 6"),
    `    <rect x="132" y="53" width="1060" height="34" rx="17" fill="${c.omnibox_background}"/>`,
    `    <text x="156" y="76" font-size="15" fill="${c.omnibox_text}">Search or type a web address</text>`,
    `    <text x="640" y="330" font-size="44" font-weight="700" text-anchor="middle" fill="${c.ntp_text}">${esc(theme.name)}</text>`,
    `    <text x="640" y="384" font-size="20" text-anchor="middle" fill="${c.ntp_text}">${esc(theme.description.replace(/, the reader's .+ theme\.$/, "."))}</text>`,
    `    <text x="640" y="440" font-size="20" text-anchor="middle" fill="${c.ntp_link}" text-decoration="underline">zacess.com</text>`,
    "  </g>",
    "</svg>",
    "",
  ].join("\n");
}

mkdirSync(join(out, "browsers"), { recursive: true });
for (const theme of palette.themes) {
  const file = join(out, "browsers", `zacess-${theme.id}.svg`);
  writeFileSync(file, browserSvg(theme));
  if (canPng) {
    const run = spawnSync("rsvg-convert", ["--output", file.replace(/\.svg$/, ".png"), file], { encoding: "utf8" });
    if (run.status !== 0) throw new Error(`rsvg-convert failed for ${file}: ${run.stderr}`);
  }
}

const data = {
  generatedFrom: "palette/zacess.json",
  repository: REPO,
  version: palette.version,
  rules: palette.rules,
  styles: Object.fromEntries(Object.entries(palette.tokens).map(([k, v]) => [k, v.style])),
  sample: SAMPLE.map((line) => ({ lang: line.lang, highlight: Boolean(line.highlight), tokens: lineTokens(line) })),
  themes: results.map(({ theme, contrastRows, pairRows, lowestOnBackground, lowestText, lowestOnSelection }) => {
    const ratioOf = (token, on) => contrastRows.find((x) => x.item === `syntax.${token}` && x.on === on).ratio;
    const shared = pairRows.filter((p) => p.sameStyle || p.lightness);
    return {
      id: theme.id,
      name: theme.name,
      appearance: theme.appearance,
      readerProfile: theme.readerProfile,
      description: theme.description,
      ui: theme.ui,
      syntax: theme.syntax,
      ratios: Object.keys(theme.syntax).map((token) => ({
        token,
        colour: theme.syntax[token],
        style: token === "foreground" ? [] : styleOf(palette, token),
        background: ratioOf(token, "background"),
        selection: ratioOf(token, "selection"),
        lineHighlight: ratioOf(token, "lineHighlight"),
      })),
      lowest: {
        background: { token: lowestOnBackground.item.replace("syntax.", ""), ratio: lowestOnBackground.ratio },
        anySurface: { token: lowestText.item.replace("syntax.", ""), on: lowestText.on, ratio: lowestText.ratio },
      },
      // the selection block where an editor can set the selected text colour and the background
      // only selection where it cannot
      selection: {
        block: theme.ui.selectionStrong,
        text: theme.ui.selectionForeground,
        textOnBlock: ratio(theme.ui.selectionForeground, theme.ui.selectionStrong),
        blockOnBackground: ratio(theme.ui.selectionStrong, theme.ui.background),
        backgroundOnly: theme.ui.selection,
        backgroundOnlyOnBackground: ratio(theme.ui.selection, theme.ui.background),
        lowestSyntax: { token: lowestOnSelection.item.replace("syntax.", ""), ratio: lowestOnSelection.ratio },
      },
      pairs: {
        closestTone: Math.floor(Math.min(...shared.map((p) => p.toneDiff)) * 1000) / 1000,
        closestSimulated: Math.floor(Math.min(...shared.flatMap((p) => Object.values(p.simulated))) * 1000) / 1000,
      },
    };
  }),
};
writeFileSync(join(out, "themes.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${palette.themes.length} SVG previews${canPng ? ", their PNG copies" : ""} and previews/themes.json`);
