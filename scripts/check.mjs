#!/usr/bin/env node
// measures the palette and proves every generated file parses; exits non-zero with a table of
// every failure so CI shows exactly which colour or file to fix
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ANSI_NAMES, OBSIDIAN_NON_TEXT_PAIRS, OBSIDIAN_SELECTION_TEXT_PAIRS, OBSIDIAN_SIGNAL_PAIRS, OBSIDIAN_SIGNAL_TEXT_PAIRS, OBSIDIAN_TEXT_PAIRS, OBSIDIAN_THEMES, ROOT, VSCODE_FALLBACK_KEYS, VSCODE_FILL_TEXT_PAIRS, VSCODE_HC_TEXT_PAIRS, VSCODE_NON_TEXT_PAIRS, VSCODE_TEXT_PAIRS, XCODE_KEYS, XCODE_SYNTAX_KEYS, loadPalette, loadSchema, rulesFor, styleOf } from "./lib/palette.mjs";
import { validate } from "./lib/schema.mjs";
import { measureAll, windowsSelectionText } from "./lib/measure.mjs";
import { contrast, ratio } from "./lib/colour.mjs";
import { parseToml } from "./lib/toml.mjs";
import { checkXml } from "./lib/xml.mjs";

const failures = [];
const TERMINAL_APP_NAMES = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];

// colours as Eclipse (r,g,b) and the property list formats (unit floats) write them
const fromRgb = (value) => `#${value.split(",").map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
const fromUnit = (r, g, b) => `#${[r, g, b].map((v) => Math.round(Number(v) * 255).toString(16).padStart(2, "0")).join("")}`;
const fail = (area, item, detail) => failures.push({ area, item, detail });
const palette = loadPalette();

// 1. the palette matches its schema
for (const error of validate(loadSchema(), palette)) fail("schema", "palette/zacess.json", error);
if (failures.length) report();

// 2. the font styles that carry meaning without colour are present
const REQUIRED_STYLES = { keyword: "bold", control: "bold", tag: "bold", comment: "italic", parameter: "italic", invalid: "underline" };
for (const [token, style] of Object.entries(REQUIRED_STYLES)) {
  if (!styleOf(palette, token).includes(style)) fail("style", token, `must be ${style}`);
}

// a misspelt pair would otherwise crash the measurements instead of reporting
const UI_COLOURS = loadSchema().$defs.theme.properties.ui.required;
for (const { pair, ui = false } of palette.pairs) {
  for (const token of pair) {
    if (ui && !UI_COLOURS.includes(token)) fail("pairs", pair.join(" and "), `${token} is not a colour every theme's ui has`);
    if (!ui && !(token in palette.tokens)) fail("pairs", pair.join(" and "), `${token} is not a token in palette.tokens`);
  }
}
report();

// 3. contrast, terminal colours and the colour vision deficiency pairs
const results = measureAll(palette);
for (const { theme, contrastRows, terminalRows, terminalTextRows, pairRows, selectionRows } of results) {
  for (const x of contrastRows.filter((r) => !r.pass)) {
    fail("contrast", `${theme.id} ${x.item} on ${x.on}`, `${x.colour} on ${x.background} is ${x.ratio}:1, needs ${x.floor}:1`);
  }
  for (const x of selectionRows.filter((r) => !r.pass)) {
    fail("distance", `${theme.id} ${x.item} and ${x.on}`, `${x.colour} and ${x.background} are ${x.distance.toFixed(3)} apart in OKLab at the closest, needs ${x.floor}`);
  }
  const dim = theme.terminal.dim ?? [];
  for (const x of terminalRows) {
    const index = Number(x.item.split(".")[1]);
    const floor = dim.includes(index) ? palette.rules.ansiFloor : rulesFor(palette, theme).textContrast;
    if (x.ratio < floor) {
      const what = x.role === "background" ? `${x.text} text on the background shade ${x.colour}` : `${x.colour} on ${x.background}`;
      fail("terminal", `${theme.id} ${x.item}`, `${what} is ${x.ratio}:1, needs ${floor}:1`);
    }
  }
  for (const x of terminalTextRows.filter((r) => !r.pass)) {
    const sims = Object.entries(x.simulated).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(", ");
    fail("terminal", `${theme.id} ansi.${x.index} and the default text`, `${x.colour} and ${x.foreground}: tone difference ${x.toneDiff.toFixed(3)} (needs ${palette.rules.toneStep}) or OKLab distance ${sims} (each needs ${palette.rules.deficiencyDistance})`);
  }
  for (const x of pairRows.filter((r) => !r.pass)) {
    const sims = Object.entries(x.simulated).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(", ");
    fail("pairs", `${theme.id} ${x.a} and ${x.b}`, `tone difference ${x.toneDiff.toFixed(3)} (needs ${palette.rules.toneStep}), OKLab distance ${sims} (needs ${palette.rules.deficiencyDistance})`);
  }
}

// 4. every border, outline and divider the VS Code themes draw keeps the non-text floor on each
// surface it can sit on, so a calmer border can never fade below WCAG 1.4.11
const BORDER_KEY = /(border|outline|separator)/i;
// the current line border repeats the line highlight on purpose, so the line is marked by its
// background alone and no boundary is drawn
const NOT_A_BOUNDARY = new Set(["editor.lineHighlightBorder"]);
for (const theme of palette.themes) {
  const file = `editors/vscode/themes/zacess-${theme.id}-color-theme.json`;
  if (!existsSync(join(ROOT, file))) continue;
  const { colors } = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  for (const [key, value] of Object.entries(colors)) {
    if (!BORDER_KEY.test(key) || NOT_A_BOUNDARY.has(key) || !/^#[0-9a-f]{6}$/i.test(value)) continue;
    for (const surface of ["background", "surface", "surfaceAlt"]) {
      const measured = contrast(value, theme.ui[surface]);
      if (measured < palette.rules.nonTextContrast) {
        fail("non-text", `${theme.id} ${key} on ${surface}`, `${value} on ${theme.ui[surface]} is ${ratio(value, theme.ui[surface])}:1, needs ${palette.rules.nonTextContrast}:1`);
      }
    }
  }
}

// the keys VS Code would otherwise fill from its defaults are all set; the text and marks on
// them keep their floors; a high contrast base makes a missing key far worse, so it is named
for (const theme of palette.themes) {
  const file = `editors/vscode/themes/zacess-${theme.id}-color-theme.json`;
  if (!existsSync(join(ROOT, file))) continue;
  const { colors } = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  const highContrast = theme.vscodeUiTheme.startsWith("hc");
  const textFloor = rulesFor(palette, theme).textContrast;
  for (const key of VSCODE_FALLBACK_KEYS) {
    if (!(key in colors)) {
      fail("vscode", `${theme.id} ${key}`, highContrast ? `unset on the ${theme.vscodeUiTheme} base, which would fall back to the built in high contrast colour` : "unset, so it would fall back to a VS Code default");
    }
  }
  const pairs = [
    ...VSCODE_TEXT_PAIRS.map((p) => [...p, textFloor]),
    ...VSCODE_FILL_TEXT_PAIRS.map((p) => [...p, textFloor]),
    ...(highContrast ? VSCODE_HC_TEXT_PAIRS.map((p) => [...p, textFloor]) : []),
    ...VSCODE_NON_TEXT_PAIRS.map((p) => [...p, palette.rules.nonTextContrast]),
  ];
  for (const [fg, bg, floor] of pairs) {
    const a = colors[fg];
    const b = colors[bg];
    if (!a || !b) {
      fail("vscode", `${theme.id} ${fg} on ${bg}`, "one of the two keys is unset");
      continue;
    }
    if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) continue;
    if (contrast(a, b) < floor) fail("vscode", `${theme.id} ${fg} on ${bg}`, `${a} on ${b} is ${ratio(a, b)}:1, needs ${floor}:1`);
  }
}

// 5. every generated file parses and points at files that exist
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (["node_modules", "build", ".gradle", ".intellijPlatform", ".kotlin"].includes(name)) return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const files = walk(join(ROOT, "editors")).concat(walk(join(ROOT, "palette")), walk(join(ROOT, "previews")));
const rel = (f) => relative(ROOT, f);
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const name = rel(file);
  try {
    if (file.endsWith(".json")) {
      const data = JSON.parse(text);
      if (name.includes("vscode/themes/")) {
        for (const [k, v] of Object.entries(data.colors)) if (!HEX.test(v)) fail("vscode", name, `${k} is not a colour: ${v}`);
        if (!Array.isArray(data.tokenColors) || !data.tokenColors.length) fail("vscode", name, "tokenColors is empty");
      }
      if (name.endsWith(".theme.json")) {
        const scheme = join(ROOT, "editors/jetbrains/src/main/resources", data.editorScheme);
        if (!existsSync(scheme)) fail("jetbrains", name, `editorScheme ${data.editorScheme} does not exist`);
        // IntelliJ 2026.2 ignores a scheme path that does not end in .xml and keeps the default scheme
        if (!data.editorScheme.endsWith(".xml")) fail("jetbrains", name, `editorScheme ${data.editorScheme} must be an .xml file`);
      }
    } else if (file.endsWith(".sublime-color-scheme")) {
      checkSublime(JSON.parse(text), name);
    } else if (file.endsWith(".toml")) {
      const data = parseToml(text);
      if (name.startsWith("editors/helix/")) checkHelix(data, name);
      if (name.startsWith("editors/terminals/wezterm/")) checkWezterm(data, name);
    } else if (file.endsWith(".el")) {
      checkElisp(text, name);
    } else if (file.endsWith(".epf")) {
      checkEclipse(text, name);
    } else if (file.endsWith(".xccolortheme")) {
      checkXcode(text, name);
    } else if (file.endsWith(".terminal")) {
      checkTerminalApp(text, name);
    } else if (/\.(xml|itermcolors|svg)$/.test(file)) {
      checkXml(text);
    } else if (file.endsWith(".yaml")) {
      checkWarp(text, name);
    } else if (file.endsWith(".lua")) {
      checkLua(text);
    } else if (file.endsWith(".css")) {
      checkCss(text);
    } else if (name.startsWith("editors/terminals/ghostty/")) {
      checkLines(text, /^(palette = \d{1,2}=#[0-9a-f]{6}|[a-z-]+ = #[0-9a-f]{6})$/);
    } else if (file.endsWith(".conf")) {
      checkLines(text, /^[a-z_0-9]+ #[0-9a-f]{6}$/);
    }
  } catch (error) {
    fail("parse", name, error.message);
  }
}

// 6. every target reads its selection back out of the file it ships: a target that can set the
// selected text colour holds that colour to the text floor on its selection, a target that cannot
// must use the background only selection the palette measures, so no file drifts from the checks
const read = (path) => readFileSync(join(ROOT, path), "utf8");
const hexOf = (text, pattern, where) => {
  const m = pattern.exec(text);
  if (!m) throw new Error(`${where}: no selection colour found`);
  return m[1].toLowerCase();
};
function shippedSelections(theme) {
  const id = theme.id;
  const snakeId = id.replace(/-/g, "_");
  const pairs = [];
  const keeps = [];
  const kitty = read(`editors/terminals/kitty/zacess-${id}.conf`);
  pairs.push(["kitty", hexOf(kitty, /^selection_foreground (#\w+)$/m, "kitty"), hexOf(kitty, /^selection_background (#\w+)$/m, "kitty")]);
  const ghostty = read(`editors/terminals/ghostty/zacess-${id}`);
  pairs.push(["Ghostty", hexOf(ghostty, /^selection-foreground = (#\w+)$/m, "Ghostty"), hexOf(ghostty, /^selection-background = (#\w+)$/m, "Ghostty")]);
  const btop = read(`editors/terminals/btop/zacess-${id}.theme`);
  pairs.push(["btop", hexOf(btop, /^theme\[selected_fg\]="(#\w+)"$/m, "btop"), hexOf(btop, /^theme\[selected_bg\]="(#\w+)"$/m, "btop")]);
  const alacritty = parseToml(read(`editors/terminals/alacritty/zacess-${id}.toml`)).colors.selection;
  pairs.push(["Alacritty", alacritty.text, alacritty.background]);
  const iterm = read(`editors/terminals/iterm2/${theme.name}.itermcolors`);
  const itermColour = (key) => {
    const body = new RegExp(`<key>${key}</key>\\s*<dict>([\\s\\S]*?)</dict>`).exec(iterm)?.[1] ?? "";
    const part = (c) => new RegExp(`<key>${c} Component</key>\\s*<real>([\\d.]+)</real>`).exec(body)?.[1];
    return fromUnit(part("Red"), part("Green"), part("Blue"));
  };
  pairs.push(["iTerm2", itermColour("Selected Text Color"), itermColour("Selection Color")]);
  const wt = JSON.parse(read("editors/terminals/windows-terminal/zacess.json")).schemes.find((x) => x.name === theme.name);
  pairs.push(["Windows Terminal", windowsSelectionText(wt.selectionBackground), wt.selectionBackground]);
  const wez = parseToml(read(`editors/terminals/wezterm/${theme.name}.toml`)).colors;
  pairs.push(["WezTerm", wez.selection_fg, wez.selection_bg]);
  // Terminal.app has no selected text colour, so its selection is the background only one
  keeps.push(["Terminal.app", terminalAppColours(read(`editors/terminals/terminal-app/${theme.name}.terminal`)).SelectionColor]);
  const vscodeColours = JSON.parse(read(`editors/vscode/themes/zacess-${id}-color-theme.json`)).colors;
  pairs.push(["VS Code terminal", vscodeColours["terminal.selectionForeground"], vscodeColours["terminal.selectionBackground"]]);
  if (theme.vscodeUiTheme.startsWith("hc")) pairs.push(["VS Code editor", vscodeColours["editor.selectionForeground"], vscodeColours["editor.selectionBackground"]]);
  else keeps.push(["VS Code editor", vscodeColours["editor.selectionBackground"]], ["VS Code unfocused editor", vscodeColours["editor.inactiveSelectionBackground"]]);
  keeps.push(["VS Code text fields", vscodeColours["selection.background"]]);
  const scheme = read(`editors/jetbrains/src/main/resources/themes/zacess-${id}.xml`);
  const option = (key) => `#${hexOf(scheme, new RegExp(`<option name="${key}" value="(\\w+)" />`), `JetBrains ${key}`)}`;
  pairs.push(["JetBrains editor, console and terminal", option("SELECTION_FOREGROUND"), option("SELECTION_BACKGROUND")]);
  pairs.push(["JetBrains unfocused editor", option("SELECTION_FOREGROUND"), option("SELECTION_BACKGROUND_INACTIVE")]);
  const laf = JSON.parse(read(`editors/jetbrains/src/main/resources/themes/zacess-${id}.theme.json`)).ui;
  for (const component of ["TextField", "TextArea", "TextPane", "EditorPane", "PasswordField", "FormattedTextField"]) {
    pairs.push([`JetBrains ${component}`, laf[component].selectionForeground, laf[component].selectionBackground]);
  }
  const epf = read(`editors/eclipse/${theme.name}.epf`);
  const pref = (key) => fromRgb(hexOf(epf, new RegExp(`/${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([\\d,]+)$`, "m"), `Eclipse ${key}`));
  pairs.push(["Eclipse editors", pref("org.eclipse.ui.editors/AbstractTextEditor.Color.SelectionForeground"), pref("org.eclipse.ui.editors/AbstractTextEditor.Color.SelectionBackground")]);
  pairs.push(["Eclipse Terminal view", pref("org.eclipse.terminal.control/SELECTION_FOREGROUND"), pref("org.eclipse.terminal.control/SELECTION_BACKGROUND")]);
  const css = read(`editors/eclipse/plugin/css/zacess-${id}.css`);
  const cssPref = (key) => fromRgb(hexOf(css, new RegExp(`'${key}=([\\d,]+)'`), `Eclipse plugin ${key}`));
  pairs.push(["Eclipse plugin editors", cssPref("AbstractTextEditor.Color.SelectionForeground"), cssPref("AbstractTextEditor.Color.SelectionBackground")]);
  pairs.push(["Eclipse plugin Terminal view", cssPref("SELECTION_FOREGROUND"), cssPref("SELECTION_BACKGROUND")]);
  const sublime = JSON.parse(read(`editors/sublime/${theme.name}.sublime-color-scheme`));
  const sublimeVar = (key) => sublime.variables[/^var\((\w+)\)$/.exec(sublime.globals[key])[1]];
  pairs.push(["Sublime Text", sublimeVar("selection_foreground"), sublimeVar("selection")]);
  pairs.push(["Sublime Text unfocused", sublimeVar("inactive_selection_foreground"), sublimeVar("inactive_selection")]);
  const helix = parseToml(read(`editors/helix/themes/zacess_${snakeId}.toml`));
  for (const scope of ["ui.selection", "ui.selection.primary"]) {
    pairs.push([`Helix ${scope}`, helix.palette[helix[scope].fg], helix.palette[helix[scope].bg]]);
  }
  const lua = read(`editors/neovim/colors/zacess-${id}.lua`);
  for (const group of ["Visual", "VisualNOS"]) {
    const line = hexOf(lua, new RegExp(`^(hl\\(0, "${group}", .*)$`, "m"), `Neovim ${group}`);
    pairs.push([`Neovim ${group}`, /fg = "(#\w+)"/.exec(line)?.[1], /bg = "(#\w+)"/.exec(line)?.[1]]);
  }
  const el = read(`editors/emacs/zacess-${id}-theme.el`);
  const region = hexOf(el, /^ '\(region \(\(t \((.*)\)\)\)\)$/m, "Emacs region");
  pairs.push(["Emacs region", /:foreground "(#\w+)"/.exec(region)?.[1], /:background "(#\w+)"/.exec(region)?.[1]]);
  const zed = JSON.parse(read("editors/zed/themes/zacess.json")).themes.find((x) => x.name === theme.name);
  keeps.push(["Zed editor and terminal", zed.style.players[0].selection]);
  const xcode = read(`editors/xcode/${theme.name}.xccolortheme`);
  for (const key of ["DVTSourceTextSelectionColor", "DVTConsoleTextSelectionColor"]) {
    const m = new RegExp(`<key>${key}</key>\\s*<string>([\\d.]+) ([\\d.]+) ([\\d.]+) 1</string>`).exec(xcode);
    keeps.push([`Xcode ${key}`, m ? fromUnit(m[1], m[2], m[3]) : undefined]);
  }
  return { pairs, keeps };
}
// each Obsidian theme file carries a light block and a dark block of variables, one per look;
// every colour the checks need is read back out of the block for that look
const obsidianFiles = new Map();
const obsidianBlocks = new Map();
for (const target of OBSIDIAN_THEMES) {
  const file = `editors/obsidian/${target.id}/theme.css`;
  const text = read(file);
  obsidianFiles.set(file, text);
  for (const [mode, themeId] of [["light", target.light], ["dark", target.dark]]) {
    const block = new RegExp(`^\\.theme-${mode}\\.theme-${mode} \\{\\n([\\s\\S]*?)\\n\\}`, "m").exec(text);
    if (!block) {
      fail("obsidian", file, `has no .theme-${mode} block`);
      continue;
    }
    const vars = {};
    for (const [, name, value] of block[1].matchAll(/^ {2}--([a-z0-9-]+): ([^;]+);$/gm)) vars[name] = value;
    obsidianBlocks.set(themeId, { file, mode, vars });
  }
}
const obsidianVar = (themeId, name) => obsidianBlocks.get(themeId)?.vars[name];
for (const theme of palette.themes) {
  let shipped;
  try {
    shipped = shippedSelections(theme);
  } catch (error) {
    fail("selection", theme.id, error.message);
    continue;
  }
  for (const [target, fg, bg] of shipped.pairs) {
    if (!fg || !bg) { fail("selection", `${theme.id} ${target}`, "the selected text colour or the selection is missing"); continue; }
    const floor = rulesFor(palette, theme).textContrast;
    if (contrast(fg, bg) < floor) fail("selection", `${theme.id} ${target}`, `selected text ${fg} on ${bg} is ${ratio(fg, bg)}:1, needs ${floor}:1`);
  }
  for (const [target, colour] of shipped.keeps) {
    if (colour?.toLowerCase() !== theme.ui.selection) fail("selection", `${theme.id} ${target}`, `${colour} is not the background only selection ${theme.ui.selection} the checks measure`);
  }
}
for (const theme of palette.themes) {
  const selection = obsidianVar(theme.id, "text-selection");
  if (selection !== theme.ui.selection) fail("selection", `${theme.id} Obsidian`, `--text-selection is ${selection}, not ${theme.ui.selection}`);
}
report();

// 7. the cursor, the current line, the find match, the word and bracket outlines and the diff marks
// are read back out of every file that ships them, so each target draws the colour the palette
// measures: a fill must be the measured fill, an outline the measured outline and a mark the token
// colour; the highlights that must not fill a character carry no fill at all
function shippedSignals(theme) {
  const id = theme.id;
  const snakeId = id.replace(/-/g, "_");
  const u = theme.ui;
  const s = theme.syntax;
  const same = []; // [target, what, shipped, expected]
  const none = []; // [target, what, shipped] where shipped must be no fill at all
  const term = { cursor: theme.terminal.cursor ?? u.cursor };
  const outline = u.matchOutline ?? u.accent;
  const kitty = read(`editors/terminals/kitty/zacess-${id}.conf`);
  same.push(["kitty", "cursor", hexOf(kitty, /^cursor (#\w+)$/m, "kitty"), term.cursor], ["kitty", "cursor text", hexOf(kitty, /^cursor_text_color (#\w+)$/m, "kitty"), u.background]);
  const ghostty = read(`editors/terminals/ghostty/zacess-${id}`);
  same.push(["Ghostty", "cursor", hexOf(ghostty, /^cursor-color = (#\w+)$/m, "Ghostty"), term.cursor], ["Ghostty", "cursor text", hexOf(ghostty, /^cursor-text = (#\w+)$/m, "Ghostty"), u.background]);
  const alacritty = parseToml(read(`editors/terminals/alacritty/zacess-${id}.toml`)).colors;
  same.push(["Alacritty", "cursor", alacritty.cursor.cursor, term.cursor], ["Alacritty", "cursor text", alacritty.cursor.text, u.background]);
  ANSI_NAMES.slice(0, 8).forEach((name, i) => same.push(["Alacritty", `dim ${name}`, alacritty.dim[name], theme.terminal.ansi[i]]));
  const iterm = read(`editors/terminals/iterm2/${theme.name}.itermcolors`);
  const itermColour = (key) => {
    const body = new RegExp(`<key>${key}</key>\\s*<dict>([\\s\\S]*?)</dict>`).exec(iterm)?.[1] ?? "";
    const part = (c) => new RegExp(`<key>${c} Component</key>\\s*<real>([\\d.]+)</real>`).exec(body)?.[1];
    return fromUnit(part("Red"), part("Green"), part("Blue"));
  };
  same.push(["iTerm2", "cursor", itermColour("Cursor Color"), term.cursor], ["iTerm2", "cursor text", itermColour("Cursor Text Color"), u.background], ["iTerm2", "bold text", itermColour("Bold Color"), theme.terminal.foreground ?? u.foreground]);
  const wt = JSON.parse(read("editors/terminals/windows-terminal/zacess.json")).schemes.find((x) => x.name === theme.name);
  same.push(["Windows Terminal", "cursor", wt.cursorColor, term.cursor]);
  const termText = theme.terminal.foreground ?? u.foreground;
  const wez = parseToml(read(`editors/terminals/wezterm/${theme.name}.toml`)).colors;
  same.push(["WezTerm", "cursor", wez.cursor_bg, term.cursor], ["WezTerm", "cursor border", wez.cursor_border, term.cursor], ["WezTerm", "cursor text", wez.cursor_fg, u.background], ["WezTerm", "text", wez.foreground, termText]);
  const app = terminalAppColours(read(`editors/terminals/terminal-app/${theme.name}.terminal`));
  same.push(["Terminal.app", "cursor", app.CursorColor, term.cursor], ["Terminal.app", "text", app.TextColor, termText], ["Terminal.app", "bold text", app.TextBoldColor, termText]);
  const warpTheme = read(`editors/terminals/warp/zacess-${id}.yaml`);
  same.push(["Warp", "text", /^foreground: '(#\w+)'$/m.exec(warpTheme)?.[1], termText], ["Warp", "background", /^background: '(#\w+)'$/m.exec(warpTheme)?.[1], u.background]);
  for (const [target, shipped] of [["kitty", hexOf(kitty, /^foreground (#\w+)$/m, "kitty")], ["Ghostty", hexOf(ghostty, /^foreground = (#\w+)$/m, "Ghostty")], ["Alacritty", alacritty.primary.foreground], ["Windows Terminal", wt.foreground], ["iTerm2", itermColour("Foreground Color")]]) same.push([target, "text", shipped, termText]);
  const vscode = JSON.parse(read(`editors/vscode/themes/zacess-${id}-color-theme.json`)).colors;
  const v = (key, what, expected) => same.push(["VS Code", what, vscode[key], expected]);
  v("editorCursor.foreground", "cursor", u.cursor); v("editorCursor.background", "cursor text", u.background);
  v("terminalCursor.foreground", "terminal cursor", term.cursor); v("terminalCursor.background", "terminal cursor text", u.background);
  v("editor.lineHighlightBackground", "current line", u.lineHighlight);
  v("editor.findMatchBackground", "current find match", u.findMatch); v("editor.findMatchBorder", "current find match border", u.findMatchBorder);
  v("editor.findMatchHighlightBorder", "other find match border", u.findMatchBorder);
  v("editor.wordHighlightBorder", "word border", u.border); v("editor.wordHighlightStrongBorder", "written word border", outline); v("editorBracketMatch.border", "bracket border", outline);
  v("editorGutter.addedBackground", "added mark", s.added); v("editorGutter.modifiedBackground", "changed mark", s.changed); v("editorGutter.deletedBackground", "removed mark", s.removed);
  v("diffEditor.insertedLineBackground", "added line", u.diffAddedBackground); v("diffEditor.removedLineBackground", "removed line", u.diffRemovedBackground);
  v("diffEditor.insertedTextBorder", "added border", s.added); v("diffEditor.removedTextBorder", "removed border", s.removed);
  for (const key of ["editor.findMatchHighlightBackground", "editor.wordHighlightBackground", "editor.wordHighlightStrongBackground", "editor.wordHighlightTextBackground", "editorBracketMatch.background"]) none.push(["VS Code", key, vscode[key]]);
  const scheme = read(`editors/jetbrains/src/main/resources/themes/zacess-${id}.xml`);
  const colour = (key) => `#${hexOf(scheme, new RegExp(`<option name="${key}" value="(\\w+)" />`), `JetBrains ${key}`)}`;
  const attribute = (name) => {
    const body = new RegExp(`<option name="${name}">\\s*<value>([\\s\\S]*?)</value>`).exec(scheme)?.[1];
    if (body === undefined) throw new Error(`JetBrains ${name}: no attribute`);
    const get = (k) => { const m = new RegExp(`<option name="${k}" value="(\\w+)" />`).exec(body); return m ? (k === "EFFECT_TYPE" || k === "FONT_TYPE" ? m[1] : `#${m[1]}`) : undefined; };
    return { bg: get("BACKGROUND"), effect: get("EFFECT_COLOR"), type: get("EFFECT_TYPE") };
  };
  same.push(["JetBrains", "cursor", colour("CARET_COLOR"), u.cursor], ["JetBrains", "current line", colour("CARET_ROW_COLOR"), u.lineHighlight]);
  for (const key of ["ADDED_LINES_COLOR", "MODIFIED_LINES_COLOR", "DELETED_LINES_COLOR"]) same.push(["JetBrains", `${key} mark`, colour(key), s[{ ADDED_LINES_COLOR: "added", MODIFIED_LINES_COLOR: "changed", DELETED_LINES_COLOR: "removed" }[key]]]);
  for (const name of ["SEARCH_RESULT_ATTRIBUTES", "TEXT_SEARCH_RESULT_ATTRIBUTES"]) {
    const a = attribute(name);
    same.push(["JetBrains", `${name} fill`, a.bg, u.findMatch], ["JetBrains", `${name} box`, a.effect, u.findMatchBorder], ["JetBrains", `${name} effect type`, a.type, "0"]);
  }
  const wordEffect = theme.wordOutline === "dashed" ? "5" : "0";
  for (const [name, box, type] of [["IDENTIFIER_UNDER_CARET_ATTRIBUTES", u.border, wordEffect], ["WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES", outline, wordEffect], ["MATCHED_BRACE_ATTRIBUTES", outline, "0"]]) {
    const a = attribute(name);
    none.push(["JetBrains", name, a.bg]);
    same.push(["JetBrains", `${name} box`, a.effect, box], ["JetBrains", `${name} effect type`, a.type, type]);
  }
  same.push(["JetBrains", "DIFF_INSERTED", attribute("DIFF_INSERTED").bg, u.diffAddedBackground], ["JetBrains", "DIFF_DELETED", attribute("DIFF_DELETED").bg, u.diffRemovedBackground]);
  const lua = read(`editors/neovim/colors/zacess-${id}.lua`);
  const group = (name) => {
    const line = hexOf(lua, new RegExp(`^(hl\\(0, "${name}", .*)$`, "m"), `Neovim ${name}`);
    return { fg: /fg = "(#\w+)"/.exec(line)?.[1], bg: /bg = "(#\w+)"/.exec(line)?.[1], sp: /sp = "(#\w+)"/.exec(line)?.[1], underline: /under(line|dashed) = true/.test(line), dashed: /underdashed = true/.test(line) };
  };
  same.push(["Neovim", "Cursor", group("Cursor").bg, u.cursor], ["Neovim", "Cursor text", group("Cursor").fg, u.background], ["Neovim", "TermCursor", group("TermCursor").bg, u.cursor]);
  same.push(["Neovim", "CursorLine", group("CursorLine").bg, u.lineHighlight], ["Neovim", "CurSearch", group("CurSearch").bg, u.findMatch], ["Neovim", "IncSearch", group("IncSearch").bg, u.findMatch]);
  same.push(["Neovim", "Search underline", group("Search").sp, u.findMatchBorder], ["Neovim", "MatchParen underline", group("MatchParen").sp, outline], ["Neovim", "LspReferenceWrite underline", group("LspReferenceWrite").sp, outline]);
  for (const name of ["Search", "MatchParen", "LspReferenceText", "LspReferenceRead", "LspReferenceWrite"]) { none.push(["Neovim", name, group(name).bg]); if (!group(name).underline) same.push(["Neovim", `${name} underline`, "none", "underline"]); }
  for (const name of ["LspReferenceText", "LspReferenceRead", "LspReferenceWrite"]) same.push(["Neovim", `${name} dashed`, String(group(name).dashed), String(theme.wordOutline === "dashed")]);
  same.push(["Neovim", "DiffAdd", group("DiffAdd").bg, u.diffAddedBackground], ["Neovim", "DiffDelete", group("DiffDelete").bg, u.diffRemovedBackground]);
  for (const [name, token] of [["GitSignsAdd", "added"], ["GitSignsChange", "changed"], ["GitSignsDelete", "removed"]]) same.push(["Neovim", `${name} mark`, group(name).fg, s[token]]);
  const zed = JSON.parse(read("editors/zed/themes/zacess.json")).themes.find((x) => x.name === theme.name).style;
  same.push(["Zed", "cursor", zed.players[0].cursor, u.cursor], ["Zed", "current line", zed["editor.active_line.background"], u.lineHighlight], ["Zed", "find match", zed["search.match_background"], u.findMatch]);
  for (const key of ["editor.document_highlight.read_background", "editor.document_highlight.write_background", "editor.document_highlight.bracket_background"]) same.push(["Zed", key, zed[key], u.listSelection]);
  same.push(["Zed", "added line", zed["created.background"], u.diffAddedBackground], ["Zed", "removed line", zed["deleted.background"], u.diffRemovedBackground]);
  for (const [key, token] of [["version_control.added", "added"], ["version_control.modified", "changed"], ["version_control.deleted", "removed"], ["created.border", "added"], ["deleted.border", "removed"]]) same.push(["Zed", `${key} mark`, zed[key], s[token]]);
  const sublime = JSON.parse(read(`editors/sublime/${theme.name}.sublime-color-scheme`));
  const sublimeVar = (key) => sublime.variables[/^var\((\w+)\)$/.exec(sublime.globals[key])[1]];
  same.push(["Sublime Text", "caret", sublimeVar("caret"), u.cursor], ["Sublime Text", "line_highlight", sublimeVar("line_highlight"), u.lineHighlight], ["Sublime Text", "find_highlight", sublimeVar("find_highlight"), u.findMatch], ["Sublime Text", "highlight", sublimeVar("highlight"), u.findMatchBorder], ["Sublime Text", "brackets_foreground", sublimeVar("brackets_foreground"), outline], ["Sublime Text", "brackets_options", sublime.globals.brackets_options, "underline"]);
  for (const [key, token] of [["line_diff_added", "added"], ["line_diff_modified", "changed"], ["line_diff_deleted", "removed"]]) same.push(["Sublime Text", `${key} mark`, sublimeVar(key), s[token]]);
  const helix = parseToml(read(`editors/helix/themes/zacess_${snakeId}.toml`));
  const hx = (ref) => helix.palette[ref];
  same.push(["Helix", "ui.cursor", hx(helix["ui.cursor"].bg), u.cursor], ["Helix", "ui.cursor text", hx(helix["ui.cursor"].fg), u.background], ["Helix", "ui.cursorline.primary", hx(helix["ui.cursorline.primary"].bg), u.lineHighlight], ["Helix", "ui.cursor.match underline", hx(helix["ui.cursor.match"].underline?.color), outline]);
  none.push(["Helix", "ui.cursor.match", helix["ui.cursor.match"].bg]);
  for (const [scope, token] of [["diff.plus", "added"], ["diff.delta", "changed"], ["diff.minus", "removed"]]) same.push(["Helix", `${scope} mark`, hx(helix[scope].fg), s[token]]);
  const el = read(`editors/emacs/zacess-${id}-theme.el`);
  const face = (name) => {
    const body = hexOf(el, new RegExp(`^ '\\(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(\\(t \\((.*)\\)\\)\\)\\)?$`, "m"), `Emacs ${name}`);
    return { fg: /:foreground "(#\w+)"/.exec(body)?.[1], bg: /(?<!:color ":)(?<=:background ")(#\w+)/.exec(body)?.[1], underline: /:underline \(:color "(#\w+)"/.exec(body)?.[1] ?? (/:underline t/.test(body) ? "t" : undefined) };
  };
  same.push(["Emacs", "cursor", face("cursor").bg, u.cursor], ["Emacs", "hl-line", face("hl-line").bg, u.lineHighlight], ["Emacs", "isearch", face("isearch").bg, u.findMatch], ["Emacs", "lazy-highlight underline", face("lazy-highlight").underline, u.findMatchBorder], ["Emacs", "show-paren-match underline", face("show-paren-match").underline, outline]);
  for (const name of ["lazy-highlight", "match", "show-paren-match"]) none.push(["Emacs", name, face(name).bg]);
  same.push(["Emacs", "diff-added", face("diff-added").bg, u.diffAddedBackground], ["Emacs", "diff-removed", face("diff-removed").bg, u.diffRemovedBackground]);
  for (const [name, token] of [["diff-indicator-added", "added"], ["diff-indicator-changed", "changed"], ["diff-indicator-removed", "removed"]]) same.push(["Emacs", `${name} mark`, face(name).fg, s[token]]);
  const epf = read(`editors/eclipse/${theme.name}.epf`);
  const pref = (key) => fromRgb(hexOf(epf, new RegExp(`/${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([\\d,]+)$`, "m"), `Eclipse ${key}`));
  const flag = (key) => new RegExp(`/${key}=(\\w+)$`, "m").exec(epf)?.[1];
  same.push(["Eclipse", "current line", pref("org.eclipse.ui.editors/currentLineColor"), u.lineHighlight], ["Eclipse", "matching brackets", pref("org.eclipse.jdt.ui/matchingBracketsColor"), outline]);
  for (const key of ["searchResult", "occurrence", "writeOccurrence"]) same.push(["Eclipse", `${key} box`, pref(`org.eclipse.ui.editors/${key}IndicationColor`), u.findMatchBorder], ["Eclipse", `${key} style`, flag(`org.eclipse.ui.editors/${key}TextStyle`), "BOX"], ["Eclipse", `${key} fill`, flag(`org.eclipse.ui.editors/${key}Highlighting`), "false"]);
  for (const [key, token] of [["addition", "added"], ["change", "changed"], ["deletion", "removed"]]) same.push(["Eclipse", `${key} mark`, pref(`org.eclipse.ui.editors/${key}IndicationColor`), s[token]]);
  const xcode = read(`editors/xcode/${theme.name}.xccolortheme`);
  const xc = (key) => { const m = new RegExp(`<key>${key}</key>\\s*<string>([\\d.]+) ([\\d.]+) ([\\d.]+) 1</string>`).exec(xcode); return m ? fromUnit(m[1], m[2], m[3]) : undefined; };
  same.push(["Xcode", "cursor", xc("DVTSourceTextInsertionPointColor"), u.cursor], ["Xcode", "current line", xc("DVTSourceTextCurrentLineHighlightColor"), u.lineHighlight]);
  // every terminal port carries the palette's 16 colours in order
  const ansi = theme.terminal.ansi;
  const wtNames = ["black", "red", "green", "yellow", "blue", "purple", "cyan", "white"];
  const lists = {
    kitty: ansi.map((_, i) => hexOf(kitty, new RegExp(`^color${i} (#\\w+)$`, "m"), "kitty")),
    Ghostty: ansi.map((_, i) => hexOf(ghostty, new RegExp(`^palette = ${i}=(#\\w+)$`, "m"), "Ghostty")),
    Alacritty: [...ANSI_NAMES.slice(0, 8).map((n) => alacritty.normal[n]), ...ANSI_NAMES.slice(0, 8).map((n) => alacritty.bright[n])],
    iTerm2: ansi.map((_, i) => itermColour(`Ansi ${i} Color`)),
    "Windows Terminal": [...wtNames.map((n) => wt[n]), ...wtNames.map((n) => wt[`bright${n[0].toUpperCase()}${n.slice(1)}`])],
    WezTerm: [...wez.ansi, ...wez.brights],
    "Terminal.app": [...TERMINAL_APP_NAMES.map((n) => app[`ANSI${n}Color`]), ...TERMINAL_APP_NAMES.map((n) => app[`ANSIBright${n}Color`])],
    Warp: [...warpTheme.split("terminal_colors:")[1].matchAll(/'(#\w+)'/g)].map((m) => m[1]),
  };
  for (const [target, list] of Object.entries(lists)) ansi.forEach((c, i) => same.push([target, `ANSI ${i}`, list[i], c]));
  return { same, none };
}
palette.themes.forEach((theme, i) => {
  let shipped;
  try {
    shipped = shippedSignals(theme);
  } catch (error) {
    fail("signals", theme.id, error.message);
    return;
  }
  shipped.same.push(["Obsidian", "current line", obsidianVar(theme.id, "zacess-line-highlight"), theme.ui.lineHighlight], ["Obsidian", "find match border", obsidianVar(theme.id, "zacess-find-border"), theme.ui.findMatchBorder], ["Obsidian", "cursor", obsidianVar(theme.id, "caret-color"), theme.ui.cursor], ["Obsidian", "bracket outline", obsidianVar(theme.id, "zacess-match-outline"), theme.ui.matchOutline ?? theme.ui.accent]);
  for (const [target, what, value, expected] of shipped.same) {
    if (String(value).toLowerCase() !== String(expected).toLowerCase()) fail("signals", `${theme.id} ${target} ${what}`, `${value} is not ${expected}, which the checks measure`);
  }
  for (const [target, what, value] of shipped.none) {
    if (value !== undefined && !/^#[0-9a-f]{6}00$/i.test(value)) fail("signals", `${theme.id} ${target} ${what}`, `has a fill ${value}, which could hide a character or pass for a selection`);
  }
});
for (const [file, text] of obsidianFiles) {
  for (const css of ["--zacess-find-border", "--zacess-line-highlight", "--zacess-match-outline", "--zacess-focus", "--zacess-active-tab", "--zacess-on-signal"]) {
    if (!text.includes(`var(${css})`)) fail("signals", file, `${css} is defined but never drawn`);
  }
}
report();

// 8. every colour an Obsidian theme sets is read back out of its light and dark blocks and held to
// its floor: text on every fill it can sit on, secondary text over a selection or a row band, and
// every border, outline, icon and mark on the fill it divides; both blocks of every file set the
// same variables and every var() inside a block names one of them, so no look is left on an
// Obsidian default
// the text floor is each look's own, so a gentler theme's block is held to its theme's floor
const obsidianPairs = (themeId) => [
  ["text", OBSIDIAN_TEXT_PAIRS, rulesFor(palette, palette.themes.find((t) => t.id === themeId)).textContrast],
  ["selection text", OBSIDIAN_SELECTION_TEXT_PAIRS, palette.rules.selectionContrast],
  ["row text", OBSIDIAN_SIGNAL_TEXT_PAIRS, palette.rules.signalTextContrast],
  ["non-text", OBSIDIAN_NON_TEXT_PAIRS, palette.rules.nonTextContrast],
  ["signal", OBSIDIAN_SIGNAL_PAIRS, palette.rules.signalContrast],
];
const obsidianNames = new Set([...obsidianBlocks.values()].map(({ vars }) => Object.keys(vars).sort().join(" ")));
if (obsidianNames.size > 1) fail("obsidian", "theme blocks", "the light and dark blocks of the Obsidian themes do not set the same variables");
for (const [themeId, { file, mode, vars }] of obsidianBlocks) {
  const where = `${themeId} (${file} ${mode})`;
  for (const value of Object.values(vars)) {
    for (const [, name] of value.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
      if (!(name in vars)) fail("obsidian", where, `--${name} is referenced but not set in the block`);
    }
  }
  for (const [kind, pairs, floor] of obsidianPairs(themeId)) {
    for (const [fg, backgrounds] of pairs) {
      for (const bg of backgrounds) {
        const a = vars[fg];
        const b = vars[bg];
        if (!a || !b) {
          fail("obsidian", `${where} ${fg} on ${bg}`, "one of the two variables is unset");
          continue;
        }
        if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) {
          fail("obsidian", `${where} ${fg} on ${bg}`, "one of the two variables is not a colour");
          continue;
        }
        if (contrast(a, b) < floor) fail("obsidian", `${where} ${fg} on ${bg}`, `${kind}: ${a} on ${b} is ${ratio(a, b)}:1, needs ${floor}:1`);
      }
    }
  }
}
for (const [file, text] of obsidianFiles) {
  // the theme directory's lint refuses !important, so every rule wins on specificity alone; a
  // comment may name the flag, a declaration may not
  if (text.replace(/\/\*[\s\S]*?\*\//g, "").includes("!important")) fail("obsidian", file, "uses !important");
}
for (const target of OBSIDIAN_THEMES) {
  const manifest = JSON.parse(read(`editors/obsidian/${target.id}/manifest.json`));
  if (manifest.name !== target.name) fail("obsidian", `${target.id} manifest.json`, `name ${manifest.name} is not ${target.name}`);
  if (manifest.version !== palette.version) fail("obsidian", `${target.id} manifest.json`, `version ${manifest.version} differs from the palette's ${palette.version}`);
  if (manifest.minAppVersion !== "1.5.0") fail("obsidian", `${target.id} manifest.json`, `minAppVersion ${manifest.minAppVersion} is not 1.5.0`);
}
report();

const vscode = JSON.parse(readFileSync(join(ROOT, "editors/vscode/package.json"), "utf8"));
for (const t of vscode.contributes.themes) {
  if (!existsSync(join(ROOT, "editors/vscode", t.path))) fail("vscode", "package.json", `${t.path} does not exist`);
}
if (vscode.version !== palette.version) fail("vscode", "package.json", `version ${vscode.version} differs from the palette's ${palette.version}`);
const gradleVersion = /^pluginVersion = (.+)$/m.exec(readFileSync(join(ROOT, "editors/jetbrains/gradle.properties"), "utf8"))?.[1];
if (gradleVersion !== palette.version) fail("jetbrains", "gradle.properties", `pluginVersion ${gradleVersion} differs from the palette's ${palette.version}`);
const rootVersion = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
if (rootVersion !== palette.version) fail("repo", "package.json", `version ${rootVersion} differs from the palette's ${palette.version}`);
const pluginXml = readFileSync(join(ROOT, "editors/jetbrains/src/main/resources/META-INF/plugin.xml"), "utf8");
for (const [, path] of pluginXml.matchAll(/path="([^"]+)"/g)) {
  if (!existsSync(join(ROOT, "editors/jetbrains/src/main/resources", path))) fail("jetbrains", "plugin.xml", `${path} does not exist`);
}

// the installer names every theme in the palette's order, so it downloads exactly the files the
// build writes
const installer = readFileSync(join(ROOT, "install.sh"), "utf8");
const listed = (name) => /^readonly \w+=\((.*)\)$/m.exec(installer.split("\n").filter((l) => l.startsWith(`readonly ${name}=(`)).join("\n"))?.[1] ?? "";
const ids = listed("IDS").split(" ");
const names = [...listed("NAMES").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
if (ids.join() !== palette.themes.map((t) => t.id).join()) fail("install", "install.sh", `IDS lists ${ids.join(", ")}, not the palette's themes`);
if (names.join() !== palette.themes.map((t) => t.name).join()) fail("install", "install.sh", `NAMES lists ${names.join(", ")}, not the palette's themes`);
const psIds = [.../^\$ids = @\((.*)\)$/m.exec(readFileSync(join(ROOT, "install.ps1"), "utf8"))?.[1].matchAll(/'([^']+)'/g) ?? []].map((m) => m[1]);
if (psIds.join() !== palette.themes.map((t) => t.id).join()) fail("install", "install.ps1", `$ids lists ${psIds.join(", ")}, not the palette's themes`);

// every theme has its file in each editor that keeps one file per theme
for (const theme of palette.themes) {
  for (const path of [
    `editors/sublime/${theme.name}.sublime-color-scheme`,
    `editors/helix/themes/zacess_${theme.id.replace(/-/g, "_")}.toml`,
    `editors/emacs/zacess-${theme.id}-theme.el`,
    `editors/eclipse/${theme.name}.epf`,
    `editors/xcode/${theme.name}.xccolortheme`,
    `editors/terminals/terminal-app/${theme.name}.terminal`,
    `editors/terminals/warp/zacess-${theme.id}.yaml`,
    `editors/terminals/wezterm/${theme.name}.toml`,
  ]) {
    if (!existsSync(join(ROOT, path))) fail("files", path, `missing for ${theme.name}`);
  }
}

// the theme a per-theme file belongs to, found from its file name
function themeOf(name) {
  const base = name.split("/").pop();
  const theme = palette.themes.find((t) => [
    `${t.name}.sublime-color-scheme`,
    `zacess_${t.id.replace(/-/g, "_")}.toml`,
    `zacess-${t.id}-theme.el`,
    `${t.name}.epf`,
    `${t.name}.xccolortheme`,
  ].includes(base));
  if (!theme) throw new Error("matches no theme in the palette");
  return theme;
}

// every colour a theme may use, so a generated file can never carry a colour the checks did not measure
function coloursOf(theme) {
  const t = theme.terminal;
  return new Set([...Object.values(theme.ui), ...Object.values(theme.syntax), ...t.ansi, t.foreground, t.cursor].filter(Boolean).map((c) => c.toLowerCase()));
}

function checkSublime(data, name) {
  const colours = coloursOf(themeOf(name));
  const vars = data.variables ?? {};
  for (const [k, v] of Object.entries(vars)) {
    if (!colours.has(String(v).toLowerCase())) throw new Error(`variable ${k} is ${v}, which is not a palette colour`);
  }
  const resolve = (where, value) => {
    const ref = /^var\(([a-z_]+)\)$/.exec(value);
    if (!ref) throw new Error(`${where} is ${value}, not a var() of a palette colour`);
    if (!Object.hasOwn(vars, ref[1])) throw new Error(`${where} refers to ${ref[1]}, which is not a variable`);
  };
  for (const [k, v] of Object.entries(data.globals ?? {})) {
    if (/_options$|_width$/.test(k)) continue;
    resolve(`globals.${k}`, v);
  }
  if (!Array.isArray(data.rules) || !data.rules.length) throw new Error("rules is empty");
  for (const rule of data.rules) {
    if (typeof rule.scope !== "string" || !rule.scope) throw new Error(`rule ${rule.name} has no scope`);
    resolve(`rule ${rule.name}`, rule.foreground);
    for (const style of (rule.font_style ?? "").split(" ").filter(Boolean)) {
      if (!["bold", "italic", "underline"].includes(style)) throw new Error(`rule ${rule.name} has an unknown font style ${style}`);
    }
  }
}

function checkHelix(data, name) {
  const colours = coloursOf(themeOf(name));
  const { palette: named, ...styles } = data;
  if (!named) throw new Error("no [palette] table");
  for (const [k, v] of Object.entries(named)) {
    if (!colours.has(String(v).toLowerCase())) throw new Error(`palette.${k} is ${v}, which is not a palette colour`);
  }
  const known = (where, ref) => {
    if (!Object.hasOwn(named, ref)) throw new Error(`${where} refers to ${ref}, which is not in [palette]`);
  };
  const MODIFIERS = ["bold", "dim", "italic", "slow_blink", "rapid_blink", "reversed", "hidden", "crossed_out"];
  const UNDERLINES = ["line", "curl", "dashed", "dotted", "double_line"];
  for (const [scope, style] of Object.entries(styles)) {
    if (typeof style === "string") { known(scope, style); continue; }
    for (const [k, v] of Object.entries(style)) {
      if (k === "fg" || k === "bg") known(`${scope}.${k}`, v);
      else if (k === "modifiers") {
        for (const m of v) if (!MODIFIERS.includes(m)) throw new Error(`${scope} has an unknown modifier ${m}`);
      } else if (k === "underline") {
        if (v.color) known(`${scope}.underline.color`, v.color);
        if (v.style && !UNDERLINES.includes(v.style)) throw new Error(`${scope} has an unknown underline style ${v.style}`);
      } else throw new Error(`${scope} has an unknown key ${k}`);
    }
  }
}

function checkElisp(text, name) {
  const theme = themeOf(name);
  const colours = coloursOf(theme);
  // a reader for all of Emacs Lisp is not needed: brackets are counted outside strings and
  // comments, which catches a broken face spec before Emacs refuses to load the theme
  let depth = 0;
  let line = 1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\n") line += 1;
    else if (ch === ";") { while (i < text.length && text[i] !== "\n") i += 1; line += 1; }
    else if (ch === "\"") {
      for (i += 1; i < text.length && text[i] !== "\""; i += 1) {
        if (text[i] === "\\") i += 1;
        else if (text[i] === "\n") line += 1;
      }
      if (i >= text.length) throw new Error("an unterminated string");
    } else if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth < 0) throw new Error(`line ${line} closes a bracket that was never opened`);
    }
  }
  if (depth !== 0) throw new Error(`${depth} bracket(s) left open`);
  const id = `zacess-${theme.id}`;
  if (!text.includes(`(deftheme ${id}\n`)) throw new Error(`no (deftheme ${id})`);
  if (!text.includes(`(provide-theme '${id})`)) throw new Error(`no (provide-theme '${id})`);
  if (!text.includes(";;;###autoload\n")) throw new Error("no autoload cookie for custom-theme-load-path");
  for (const [, hex] of text.matchAll(/"(#[0-9a-zA-Z]+)"/g)) {
    if (!/^#[0-9a-f]{6}$/.test(hex)) throw new Error(`${hex} is not a six digit colour`);
    if (!colours.has(hex)) throw new Error(`${hex} is not a palette colour`);
  }
}

function checkEclipse(text, name) {
  // the preference nodes the Eclipse files write to (the Terminal view's included) and the text
  // styles an annotation accepts
  const NODES = ["org.eclipse.jdt.ui", "org.eclipse.ui.editors", "org.eclipse.ui.workbench", "org.eclipse.terminal.control"];
  const STYLES = ["NONE", "SQUIGGLES", "PROBLEM_UNDERLINE", "BOX", "DASHED_BOX", "UNDERLINE", "IBEAM"];
  const colours = coloursOf(themeOf(name));
  const values = new Map();
  let version = false;
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("#")) return;
    // an export root line makes the import clear every preference under it first
    if (line.startsWith("!") || line.startsWith("\\!")) throw new Error(`line ${i + 1} is an export root, which would clear the user's preferences on import`);
    if (line === "file_export_version=3.0") { version = true; return; }
    const m = /^\/instance\/([a-z.]+)\/([A-Za-z0-9_.]+)=(.+)$/.exec(line);
    if (!m) throw new Error(`line ${i + 1} is not an instance preference: ${line}`);
    const [, node, key, value] = m;
    if (!NODES.includes(node)) throw new Error(`line ${i + 1} writes to ${node}, which is not an editor colour node`);
    if (values.has(`${node}/${key}`)) throw new Error(`${node}/${key} is set twice`);
    values.set(`${node}/${key}`, value);
    const rgb = /^(\d{1,3}),(\d{1,3}),(\d{1,3})$/.exec(value);
    if (rgb) {
      if (rgb.slice(1).some((v) => Number(v) > 255)) throw new Error(`${key} has a channel above 255`);
      const hex = `#${rgb.slice(1).map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
      if (!colours.has(hex)) throw new Error(`${key} is ${value} (${hex}), which is not a palette colour`);
    } else if (key.endsWith("TextStyle")) {
      if (!STYLES.includes(value)) throw new Error(`${key} has an unknown text style ${value}`);
    } else if (value !== "true" && value !== "false") {
      throw new Error(`${key} is ${value}, which is neither a colour, a text style nor a boolean`);
    }
  });
  if (!version) throw new Error("no file_export_version=3.0 line, so Eclipse would read it as a legacy file");
  // Eclipse ignores these colours and draws the operating system's while their SystemDefault flag is on
  for (const key of values.keys()) {
    if (!/(AbstractTextEditor\.Color\.(Background|Foreground|SelectionBackground|SelectionForeground)|hyperlinkColor|sourceHoverBackgroundColor)$/.test(key)) continue;
    if (values.get(`${key}.SystemDefault`) !== "false") throw new Error(`${key} is set without ${key.split("/")[1]}.SystemDefault=false`);
  }
}

function checkXcode(text, name) {
  checkXml(text);
  const colours = coloursOf(themeOf(name));
  // the two syntax dictionaries are the only nested ones, so they are lifted out before the
  // top level entries are read
  const nested = {};
  const top = text.replace(/\t<key>(DVTSourceTextSyntax(?:Colors|Fonts))<\/key>\n\t<dict>\n([\s\S]*?)\t<\/dict>\n/g, (_, key, inner) => {
    nested[key] = inner;
    return `\t<key>${key}</key>\n\t<dict/>\n`;
  });
  const entries = (body) => {
    const out = new Map();
    for (const [, key, type, value] of body.matchAll(/<key>([^<]+)<\/key>\s*<(string|integer|real|dict)(?:\/>|>([^<]*)<\/\2>)/g)) {
      if (out.has(key)) throw new Error(`${key} is set twice`);
      out.set(key, { type, value });
    }
    return out;
  };
  const colour = (key, value) => {
    const m = /^([\d.]+) ([\d.]+) ([\d.]+) 1$/.exec(value);
    if (!m) throw new Error(`${key} is ${value}, not an opaque "r g b 1" colour`);
    const channels = m.slice(1).map(Number);
    if (channels.some((v) => v > 1)) throw new Error(`${key} has a channel above 1`);
    const hex = `#${channels.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
    if (!colours.has(hex)) throw new Error(`${key} is ${value} (${hex}), which is not a palette colour`);
  };
  // the SF Mono cuts Xcode registers and the system fonts its own themes use for documentation
  const font = (key, value) => {
    if (!/^(SFMono-(Regular|Bold|RegularItalic|BoldItalic)|\.AppleSystemUIFont(Italic|Bold)?) - \d+\.0$/.test(value)) throw new Error(`${key} has an unknown font ${value}`);
  };
  const values = entries(top);
  for (const key of XCODE_KEYS) if (!values.has(key)) throw new Error(`${key} is missing`);
  for (const [key, { value }] of values) {
    if (!XCODE_KEYS.includes(key)) throw new Error(`${key} is not a key in Xcode's own themes`);
    if (key.endsWith("Font")) font(key, value);
    else if (key === "DVTFontAndColorVersion") { if (value !== "1") throw new Error(`${key} is ${value}, not 1`); }
    else if (key === "DVTLineSpacing") { if (!(Number(value) >= 1)) throw new Error(`${key} is ${value}`); }
    else if (!key.startsWith("DVTSourceTextSyntax")) colour(key, value);
  }
  for (const [dict, check] of [["DVTSourceTextSyntaxColors", colour], ["DVTSourceTextSyntaxFonts", font]]) {
    const syntax = entries(nested[dict] ?? "");
    for (const key of XCODE_SYNTAX_KEYS) if (!syntax.has(key)) throw new Error(`${dict} has no ${key}`);
    for (const [key, { value }] of syntax) {
      if (!XCODE_SYNTAX_KEYS.includes(key)) throw new Error(`${dict} has ${key}, which is not a syntax type in Xcode's own themes`);
      check(`${dict} ${key}`, value);
    }
  }
}

// each Terminal.app colour is a base64 NSKeyedArchiver archive whose NSRGB value is the sRGB
// components as text ending in a nul byte, so a reader for all of NSKeyedArchiver is not needed
function terminalAppColours(text) {
  const out = {};
  for (const [, key, body] of text.matchAll(/<key>(\w+)<\/key>\s*<data>([\s\S]*?)<\/data>/g)) {
    const bytes = Buffer.from(body.replace(/\s+/g, ""), "base64");
    if (bytes.subarray(0, 8).toString("latin1") !== "bplist00") throw new Error(`${key} is not a binary property list`);
    const m = /([\d.]+) ([\d.]+) ([\d.]+) 1\x00/.exec(bytes.toString("latin1"));
    if (!m) throw new Error(`${key} holds no sRGB components`);
    if (!bytes.includes(Buffer.from("NSSpaceID"))) throw new Error(`${key} is not in the sRGB colour space`);
    out[key] = fromUnit(m[1], m[2], m[3]);
  }
  return out;
}

function checkTerminalApp(text, name) {
  checkXml(text);
  const theme = palette.themes.find((t) => name.endsWith(`/${t.name}.terminal`));
  if (!theme) throw new Error("matches no theme in the palette");
  const colours = coloursOf(theme);
  const found = terminalAppColours(text);
  for (const key of ["BackgroundColor", "TextColor", "TextBoldColor", "CursorColor", "SelectionColor", ...TERMINAL_APP_NAMES.flatMap((n) => [`ANSI${n}Color`, `ANSIBright${n}Color`])]) {
    if (!found[key]) throw new Error(`${key} is missing`);
    if (!colours.has(found[key])) throw new Error(`${key} is ${found[key]}, which is not a palette colour`);
  }
  if (!text.includes(`<string>${theme.name}</string>`)) throw new Error(`the profile is not named ${theme.name}`);
}

function checkWarp(text, name) {
  const theme = palette.themes.find((t) => name.endsWith(`/zacess-${t.id}.yaml`));
  if (!theme) throw new Error("matches no theme in the palette");
  const colours = coloursOf(theme);
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("#")) return;
    const ok = /^(name: .+|details: (darker|lighter)|terminal_colors:|  (normal|bright):|(accent|background|foreground): '#[0-9a-f]{6}'|    (black|red|green|yellow|blue|magenta|cyan|white): '#[0-9a-f]{6}')$/.test(line);
    if (!ok) throw new Error(`line ${i + 1} is not a Warp theme setting: ${line}`);
    const hex = /'(#[0-9a-f]{6})'/.exec(line)?.[1];
    if (hex && !colours.has(hex)) throw new Error(`line ${i + 1}: ${hex} is not a palette colour`);
  });
}

function checkWezterm(data, name) {
  const theme = palette.themes.find((t) => name.endsWith(`/${t.name}.toml`));
  if (!theme) throw new Error("matches no theme in the palette");
  const colours = coloursOf(theme);
  if (data.metadata?.name !== theme.name) throw new Error(`metadata.name is not ${theme.name}`);
  const c = data.colors ?? {};
  for (const key of ["background", "foreground", "cursor_bg", "cursor_border", "cursor_fg", "selection_bg", "selection_fg"]) {
    if (!colours.has(String(c[key]).toLowerCase())) throw new Error(`colors.${key} is ${c[key]}, which is not a palette colour`);
  }
  for (const key of ["ansi", "brights"]) {
    if (!Array.isArray(c[key]) || c[key].length !== 8) throw new Error(`colors.${key} must list 8 colours`);
    for (const v of c[key]) if (!colours.has(v)) throw new Error(`colors.${key} has ${v}, which is not a palette colour`);
  }
}

function checkLines(text, pattern) {
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("#")) return;
    if (!pattern.test(line)) throw new Error(`line ${i + 1} is not a colour setting: ${line}`);
  });
}

function checkLua(text) {
  // the colour files are plain assignments; a parser for all of Lua is not needed to catch a broken line
  let depth = 0;
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("--")) return;
    const ok = /^hl\(0, "[@A-Za-z.]+", \{ .* \}\)$/.test(line)
      || /^vim\.g\.terminal_color_\d{1,2} = "#[0-9a-f]{6}"$/.test(line)
      || /^(vim\.cmd\(".*"\)|if vim\.fn\.exists\("syntax_on"\) == 1 then|  vim\.cmd\("syntax reset"\)|end|vim\.o\.background = "(light|dark)"|vim\.g\.colors_name = "[a-z-]+"|local hl = vim\.api\.nvim_set_hl)$/.test(line);
    if (!ok) throw new Error(`line ${i + 1} is not a recognised statement: ${line}`);
    for (const ch of line) depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
    if (depth !== 0) throw new Error(`line ${i + 1} has unbalanced braces`);
  });
}

function checkCss(text) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "");
  if (stripped.includes("/*") || stripped.includes("*/")) throw new Error("an unclosed comment");
  let depth = 0;
  for (const ch of stripped) {
    depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
    if (depth < 0) throw new Error("a closing brace with no opening brace");
  }
  if (depth !== 0) throw new Error("unbalanced braces");
  // a theme must never load anything from elsewhere, which could track whoever installs it
  if (/@import|url\(/i.test(stripped)) throw new Error("an @import or url() that loads an outside resource");
  for (const [, value] of stripped.matchAll(/:\s*(#[0-9a-zA-Z]+)\s*;/g)) {
    if (!/^#[0-9a-f]{6}$/.test(value)) throw new Error(`${value} is not a six digit colour`);
  }
}

function report() {
  if (!failures.length) return;
  const widths = ["area", "item", "detail"].map((k) => Math.max(k.length, ...failures.map((f) => f[k].length)));
  const line = (cells) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
  console.error(`${failures.length} check(s) failed:\n`);
  console.error(line(["area", "item", "detail"]));
  console.error(line(widths.map((w) => "-".repeat(w))));
  for (const f of failures) console.error(line([f.area, f.item, f.detail]));
  process.exit(1);
}

report();

const lines = results.map(({ theme, contrastRows, lowestOnBackground, lowestText, lowestOnSelection, lowestOnLine, pairRows }) => {
  const minSim = Math.min(...pairRows.filter((p) => p.sameStyle || p.lightness).flatMap((p) => Object.values(p.simulated)));
  const minTone = Math.min(...pairRows.filter((p) => p.sameStyle || p.lightness).map((p) => p.toneDiff));
  const block = contrastRows.find((x) => x.item === "ui.selectionForeground");
  const line = contrastRows.find((x) => x.item === "ui.lineHighlight");
  return `${theme.name.padEnd(24)} lowest syntax on background ${lowestOnBackground.ratio.toFixed(2)}:1, over any text surface ${lowestText.ratio.toFixed(2)}:1, over the current line ${lowestOnLine.ratio.toFixed(2)}:1 (band ${line.ratio.toFixed(2)}:1), over the background only selection ${lowestOnSelection.ratio.toFixed(2)}:1, selected text on the selection block ${block.ratio.toFixed(2)}:1, closest pair tone ${minTone.toFixed(3)}, OKLab ${minSim.toFixed(3)}`;
});
console.log(lines.join("\n"));
console.log(`all checks passed: ${files.length} generated and source files parse`);
