#!/usr/bin/env node
// writes every editor's theme files from palette/zacess.json; the outputs are committed so each
// editor folder stands alone, with `npm run verify` proving they match the palette
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ROOT, HEADER, REPO, ANSI_NAMES, loadPalette, loadSchema, styleOf, terminalText } from "./lib/palette.mjs";
import { parseHex } from "./lib/colour.mjs";
import { UID, bplist } from "./lib/bplist.mjs";
import { validate } from "./lib/schema.mjs";
import { contrastTables } from "./lib/tables.mjs";

const palette = loadPalette();
const schemaErrors = validate(loadSchema(), palette);
if (schemaErrors.length) {
  console.error(`palette/zacess.json does not match palette/schema.json:\n${schemaErrors.join("\n")}`);
  process.exit(1);
}

const written = [];
function write(path, content) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  written.push(path);
}
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fontStyle = (token) => styleOf(palette, token).join(" ");
const has = (token, style) => styleOf(palette, token).includes(style);
const slug = (theme) => `zacess-${theme.id}`;
// the outline for a written word and a matched bracket: the accent, unless the theme names its own
// because its accent is also its find match outline
const matchOutline = (u) => u.matchOutline ?? u.accent;
const matchOutlineName = (u) => (u.matchOutline ? "match_outline" : "accent");
const dashedWord = (theme) => theme.wordOutline === "dashed";

// ---------------------------------------------------------------- VS Code

// the TextMate scope rules VS Code and Sublime Text share, so both editors colour a scope alike
function textmateRules(s) {
  const rule = (name, scope, token, colour = s[token], style = fontStyle(token)) => ({ name, scope, token, colour, style });
  return [
    rule("Comments", ["comment", "punctuation.definition.comment", "string.quoted.docstring.multi.python"], "comment"),
    rule("Strings", ["string", "punctuation.definition.string", "constant.character", "markup.inline.raw"], "string"),
    rule("Regular expressions", ["string.regexp", "constant.character.escape", "constant.other.character-class.regexp"], "regex"),
    rule("Numbers and constants", ["constant.numeric", "constant.language", "constant.other", "support.constant", "variable.other.constant", "variable.other.enummember", "entity.name.constant"], "number"),
    rule("Keywords", ["keyword", "storage", "storage.type", "storage.modifier", "keyword.operator.new", "keyword.operator.expression", "keyword.operator.logical.python", "variable.language", "support.type.primitive.ts", "keyword.other"], "keyword"),
    rule("Control flow", ["keyword.control", "keyword.control.flow", "keyword.control.import", "keyword.control.conditional", "keyword.control.loop", "keyword.control.trycatch"], "control"),
    rule("Operators and punctuation", ["keyword.operator", "punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator", "punctuation.accessor"], "operator"),
    rule("Functions", ["entity.name.function", "support.function", "meta.function-call entity.name.function", "variable.function", "entity.name.function.macro", "meta.decorator", "entity.name.function.decorator"], "function"),
    rule("Types", ["entity.name.type", "entity.name.class", "entity.name.namespace", "entity.other.inherited-class", "support.type", "support.class", "storage.type.primitive", "entity.name.type.primitive", "entity.name.type.parameter"], "type"),
    rule("Variables", ["variable", "variable.other.readwrite", "meta.definition.variable", "support.variable"], "variable"),
    rule("Parameters", ["variable.parameter", "meta.parameters variable", "entity.name.variable.parameter"], "parameter"),
    rule("Properties", ["variable.other.property", "variable.other.object.property", "variable.other.member", "support.type.property-name", "meta.object-literal.key", "entity.name.tag.yaml", "support.variable.property", "entity.name.field"], "property"),
    rule("Tags", ["entity.name.tag", "punctuation.definition.tag"], "tag"),
    rule("Attributes", ["entity.other.attribute-name", "meta.attribute", "entity.other.attribute-name.id", "entity.other.attribute-name.class"], "attribute"),
    rule("Invalid", ["invalid", "invalid.illegal", "invalid.deprecated"], "invalid"),
    rule("Added", ["markup.inserted", "meta.diff.header.to-file", "punctuation.definition.inserted"], "added"),
    rule("Removed", ["markup.deleted", "meta.diff.header.from-file", "punctuation.definition.deleted"], "removed"),
    rule("Changed", ["markup.changed", "punctuation.definition.changed"], "changed"),
    rule("Headings", ["markup.heading", "entity.name.section"], "keyword", s.keyword, "bold"),
    rule("Bold", ["markup.bold"], "variable", s.foreground, "bold"),
    rule("Italic", ["markup.italic"], "variable", s.foreground, "italic"),
    rule("Links", ["markup.underline.link", "string.other.link"], "function", s.function, "underline"),
    rule("Quotes", ["markup.quote"], "comment"),
  ];
}

function vscodeTokenColors(s) {
  return textmateRules(s).map(({ name, scope, colour, style }) => ({ name, scope, settings: { foreground: colour, fontStyle: style } }));
}

function vscodeSemantic(s) {
  const style = (token, colour = s[token]) => {
    const out = { foreground: colour };
    if (has(token, "bold")) out.bold = true;
    if (has(token, "italic")) out.italic = true;
    if (has(token, "underline")) out.underline = true;
    return out;
  };
  return {
    namespace: style("type"),
    class: style("type"),
    interface: style("type"),
    enum: style("type"),
    struct: style("type"),
    type: style("type"),
    typeParameter: style("type"),
    function: style("function"),
    method: style("function"),
    macro: style("function"),
    decorator: style("function"),
    parameter: style("parameter"),
    variable: style("variable"),
    property: style("property"),
    enumMember: style("number"),
    keyword: style("keyword"),
    selfKeyword: style("keyword"),
    comment: style("comment"),
    string: style("string"),
    number: style("number"),
    regexp: style("regex"),
    operator: style("operator"),
    label: style("control"),
  };
}

function vscodeColors(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const a = theme.terminal.ansi;
  const highContrast = theme.vscodeUiTheme.startsWith("hc");
  const colours = {
    foreground: u.foreground,
    descriptionForeground: u.muted,
    disabledForeground: u.muted,
    errorForeground: u.error,
    focusBorder: u.borderActive,
    "widget.border": u.border,
    // text fields and the find widget keep their own text colour over a selection
    "selection.background": u.selection,
    "icon.foreground": u.foreground,
    "textLink.foreground": u.link,
    "textLink.activeForeground": u.link,
    "textPreformat.foreground": u.code ?? s.string,
    "textPreformat.background": u.surface,
    "textBlockQuote.border": u.border,
    "textBlockQuote.background": u.surface,
    "textCodeBlock.background": u.surface,
    "textSeparator.foreground": u.border,
    "editor.background": u.background,
    "editor.foreground": u.foreground,
    "editorLineNumber.foreground": u.lineNumber,
    "editorLineNumber.activeForeground": u.lineNumberActive,
    "editorCursor.foreground": u.cursor,
    "editorCursor.background": u.background,
    // VS Code draws editor.selectionForeground only in high contrast themes, so those take the
    // selection block with one text colour; the others keep each token's colour over the
    // background only selection. The unfocused selection matches the focused one, because the
    // high contrast text colour is drawn on both
    "editor.selectionBackground": highContrast ? u.selectionStrong : u.selection,
    "editor.inactiveSelectionBackground": highContrast ? u.selectionStrong : u.selection,
    // these are drawn over the selection and the text, so they stay transparent and rely on a
    // border; an opaque colour would hide the selection and change the measured contrast
    "editor.selectionHighlightBackground": `${u.background}00`,
    "editor.selectionHighlightBorder": u.border,
    "editorOverviewRuler.selectionHighlightForeground": u.border,
    "minimap.selectionHighlight": u.selectionStrong,
    "minimap.selectionOccurrenceHighlight": u.border,
    // the current line is a band the syntax colours keep the signal floor over
    "editor.lineHighlightBackground": u.lineHighlight,
    "editor.lineHighlightBorder": u.lineHighlight,
    // the current find match is filled and outlined, the other matches outlined only, so the
    // two are told apart by the fill and each keeps its border on the current line and a selection
    "editor.findMatchBackground": u.findMatch,
    "editor.findMatchBorder": u.findMatchBorder,
    "editor.findMatchHighlightBackground": `${u.background}00`,
    "editor.findMatchHighlightBorder": u.findMatchBorder,
    // the word under the cursor and a matched bracket are outlined with no fill, so they never
    // hide a character or pass for a selection or a find match
    "editor.wordHighlightBackground": `${u.background}00`,
    "editor.wordHighlightBorder": u.border,
    "editor.wordHighlightStrongBackground": `${u.background}00`,
    "editor.wordHighlightStrongBorder": matchOutline(u),
    "editor.wordHighlightTextBackground": `${u.background}00`,
    "editor.wordHighlightTextBorder": u.border,
    "editorBracketMatch.background": `${u.background}00`,
    "editorBracketMatch.border": matchOutline(u),
    "editorGutter.background": u.gutter,
    // every changed line carries a gutter mark as well as its fill, so colour is never the only sign
    "editorGutter.addedBackground": s.added,
    "editorGutter.modifiedBackground": s.changed,
    "editorGutter.deletedBackground": s.removed,
    "editorOverviewRuler.addedForeground": s.added,
    "editorOverviewRuler.modifiedForeground": s.changed,
    "editorOverviewRuler.deletedForeground": s.removed,
    "editorOverviewRuler.wordHighlightForeground": u.border,
    "editorOverviewRuler.wordHighlightStrongForeground": matchOutline(u),
    "editorOverviewRuler.bracketMatchForeground": matchOutline(u),
    "editorError.foreground": u.error,
    "editorWarning.foreground": u.warning,
    "editorInfo.foreground": u.info,
    "editorLink.activeForeground": u.link,
    "editorIndentGuide.background1": u.indentGuide,
    "editorIndentGuide.activeBackground1": u.foreground,
    "editorWhitespace.foreground": u.whitespace,
    "editorRuler.foreground": u.indentGuide,
    "editorCodeLens.foreground": u.muted,
    "editorInlayHint.foreground": u.muted,
    "editorInlayHint.background": u.surface,
    "editorWidget.background": u.surface,
    "editorWidget.foreground": u.foreground,
    "editorWidget.border": u.border,
    "editorHoverWidget.background": u.surface,
    "editorHoverWidget.foreground": u.foreground,
    "editorHoverWidget.border": u.border,
    "editorHoverWidget.statusBarBackground": u.surfaceAlt,
    "editorSuggestWidget.background": u.surface,
    "editorSuggestWidget.foreground": u.foreground,
    "editorSuggestWidget.border": u.border,
    "editorSuggestWidget.selectedBackground": u.listSelection,
    "editorSuggestWidget.selectedForeground": u.foreground,
    "editorSuggestWidget.highlightForeground": u.accent,
    "editorOverviewRuler.errorForeground": u.error,
    "editorOverviewRuler.warningForeground": u.warning,
    "editorOverviewRuler.infoForeground": u.info,
    "editorOverviewRuler.findMatchForeground": u.findMatchBorder,
    // diff lines carry a border in the added or removed colour as well as their fill; the
    // gutter of the diff editor marks them too
    "diffEditor.insertedTextBackground": u.diffAddedBackground,
    "diffEditor.removedTextBackground": u.diffRemovedBackground,
    "diffEditor.insertedTextBorder": s.added,
    "diffEditor.removedTextBorder": s.removed,
    "diffEditor.insertedLineBackground": u.diffAddedBackground,
    "diffEditor.removedLineBackground": u.diffRemovedBackground,
    "diffEditorGutter.insertedLineBackground": u.diffAddedBackground,
    "diffEditorGutter.removedLineBackground": u.diffRemovedBackground,
    "diffEditorOverview.insertedForeground": s.added,
    "diffEditorOverview.removedForeground": s.removed,
    "editorGroup.border": u.border,
    "editorGroupHeader.tabsBackground": u.surface,
    "editorGroupHeader.tabsBorder": u.border,
    "tab.activeBackground": u.background,
    "tab.activeForeground": u.foreground,
    "tab.activeBorderTop": u.borderActive,
    "tab.inactiveBackground": u.surface,
    "tab.inactiveForeground": u.muted,
    "tab.border": u.border,
    "tab.hoverBackground": u.lineHighlight,
    "sideBar.background": u.surface,
    "sideBar.foreground": u.foreground,
    "sideBar.border": u.border,
    "sideBarTitle.foreground": u.foreground,
    "sideBarSectionHeader.background": u.surfaceAlt,
    "sideBarSectionHeader.foreground": u.foreground,
    "sideBarSectionHeader.border": u.border,
    "activityBar.background": u.surfaceAlt,
    "activityBar.foreground": u.foreground,
    "activityBar.inactiveForeground": u.muted,
    "activityBar.border": u.border,
    "activityBar.activeBorder": u.borderActive,
    "activityBarBadge.background": u.accent,
    "activityBarBadge.foreground": u.accentForeground,
    "statusBar.background": u.surfaceAlt,
    "statusBar.foreground": u.foreground,
    "statusBar.border": u.border,
    "statusBar.noFolderBackground": u.surfaceAlt,
    "statusBar.noFolderForeground": u.foreground,
    "statusBar.debuggingBackground": u.accent,
    "statusBar.debuggingForeground": u.accentForeground,
    "statusBarItem.hoverBackground": u.surface,
    "statusBarItem.remoteBackground": u.accent,
    "statusBarItem.remoteForeground": u.accentForeground,
    "titleBar.activeBackground": u.surfaceAlt,
    "titleBar.activeForeground": u.foreground,
    "titleBar.inactiveBackground": u.surface,
    "titleBar.inactiveForeground": u.muted,
    "titleBar.border": u.border,
    "panel.background": u.surface,
    "panel.border": u.border,
    "panelTitle.activeForeground": u.foreground,
    "panelTitle.inactiveForeground": u.muted,
    "panelTitle.activeBorder": u.borderActive,
    "breadcrumb.foreground": u.muted,
    "breadcrumb.focusForeground": u.foreground,
    "breadcrumb.activeSelectionForeground": u.foreground,
    "input.background": u.background,
    "input.foreground": u.foreground,
    "input.border": u.border,
    "input.placeholderForeground": u.muted,
    "inputOption.activeBorder": u.borderActive,
    "inputOption.activeBackground": u.listSelection,
    "inputOption.activeForeground": u.foreground,
    "inputValidation.errorBorder": u.error,
    "inputValidation.warningBorder": u.warning,
    "inputValidation.infoBorder": u.info,
    "dropdown.background": u.background,
    "dropdown.foreground": u.foreground,
    "dropdown.border": u.border,
    "dropdown.listBackground": u.surface,
    "button.background": u.accent,
    "button.foreground": u.accentForeground,
    "button.hoverBackground": u.accent,
    "button.secondaryBackground": u.surfaceAlt,
    "button.secondaryForeground": u.foreground,
    "button.secondaryHoverBackground": u.lineHighlight,
    "button.border": u.border,
    "badge.background": u.accent,
    "badge.foreground": u.accentForeground,
    "checkbox.background": u.background,
    "checkbox.border": u.border,
    "checkbox.foreground": u.foreground,
    "list.activeSelectionBackground": u.listSelection,
    "list.activeSelectionForeground": u.foreground,
    "list.inactiveSelectionBackground": u.lineHighlight,
    "list.inactiveSelectionForeground": u.foreground,
    "list.hoverBackground": u.lineHighlight,
    "list.hoverForeground": u.foreground,
    "list.focusBackground": u.listSelection,
    "list.focusForeground": u.foreground,
    "list.focusOutline": u.borderActive,
    "list.highlightForeground": u.accent,
    "list.errorForeground": u.error,
    "list.warningForeground": u.warning,
    "menu.background": u.surface,
    "menu.foreground": u.foreground,
    "menu.selectionBackground": u.listSelection,
    "menu.selectionForeground": u.foreground,
    "menu.border": u.border,
    "menu.separatorBackground": u.border,
    "menubar.selectionBackground": u.listSelection,
    "menubar.selectionForeground": u.foreground,
    "notifications.background": u.surface,
    "notifications.foreground": u.foreground,
    "notifications.border": u.border,
    "notificationCenterHeader.background": u.surfaceAlt,
    "notificationCenterHeader.foreground": u.foreground,
    "notificationLink.foreground": u.link,
    "quickInput.background": u.surface,
    "quickInput.foreground": u.foreground,
    "quickInputTitle.background": u.surfaceAlt,
    "quickInputList.focusBackground": u.listSelection,
    "quickInputList.focusForeground": u.foreground,
    "keybindingLabel.background": u.surface,
    "keybindingLabel.foreground": u.foreground,
    "keybindingLabel.border": u.border,
    "keybindingLabel.bottomBorder": u.border,
    "pickerGroup.foreground": u.accent,
    "pickerGroup.border": u.border,
    "peekView.border": u.accent,
    "peekViewEditor.background": u.surface,
    "peekViewResult.background": u.surface,
    "peekViewTitle.background": u.surfaceAlt,
    "peekViewEditor.matchHighlightBackground": `${u.background}00`,
    "peekViewEditor.matchHighlightBorder": u.findMatchBorder,
    "peekViewResult.matchHighlightBackground": u.listSelection,
    "peekViewResult.selectionBackground": u.listSelection,
    "peekViewResult.selectionForeground": u.foreground,
    "gitDecoration.addedResourceForeground": s.added,
    "gitDecoration.untrackedResourceForeground": s.added,
    "gitDecoration.modifiedResourceForeground": s.changed,
    "gitDecoration.deletedResourceForeground": s.removed,
    "gitDecoration.ignoredResourceForeground": u.muted,
    "gitDecoration.conflictingResourceForeground": u.error,
    "scrollbarSlider.background": `${u.indentGuide}80`,
    "scrollbarSlider.hoverBackground": `${u.indentGuide}b3`,
    "scrollbarSlider.activeBackground": u.indentGuide,
    "terminal.background": u.background,
    "terminal.foreground": terminalText(theme).foreground,
    // the block cursor draws the background colour as the character under it
    "terminalCursor.foreground": terminalText(theme).cursor,
    "terminalCursor.background": u.background,
    "terminal.selectionBackground": u.selectionStrong,
    "terminal.selectionForeground": u.selectionForeground,
    "terminal.inactiveSelectionBackground": u.selectionStrong,
  };
  ANSI_NAMES.forEach((name, i) => {
    colours[`terminal.ansi${name[0].toUpperCase()}${name.slice(1)}`] = a[i];
  });
  if (highContrast) {
    // high contrast themes draw contrastBorder around nearly every part, so it takes the calm
    // border colour and only focus, through contrastActiveBorder, takes the strong one
    colours.contrastBorder = u.border;
    colours.contrastActiveBorder = u.borderActive;
    colours["editor.selectionForeground"] = u.selectionForeground;
  }
  return colours;
}

function buildVscode() {
  const contributes = [];
  for (const theme of palette.themes) {
    const file = `themes/${slug(theme)}-color-theme.json`;
    write(`editors/vscode/${file}`, json({
      $schema: "vscode://schemas/color-theme",
      name: theme.name,
      type: theme.vscodeUiTheme === "vs" ? "light" : theme.vscodeUiTheme === "vs-dark" ? "dark" : theme.vscodeUiTheme === "hc-black" ? "hcDark" : "hcLight",
      semanticHighlighting: true,
      colors: vscodeColors(theme),
      tokenColors: vscodeTokenColors(theme.syntax),
      semanticTokenColors: vscodeSemantic(theme.syntax),
    }));
    contributes.push({ label: theme.name, uiTheme: theme.vscodeUiTheme, path: `./${file}` });
  }
  write("editors/vscode/package.json", json({
    name: "zacess-themes",
    displayName: "Zacess Themes",
    description: "Eight high contrast code themes matching the Zacess reader: Light, Dark, Yellow on Black for low vision, Cream for dyslexia and four maximum contrast themes, High Contrast Dark, High Contrast Light, Deep Contrast Dark and Deep Contrast Light. Every text and syntax colour keeps 7:1 contrast on the background and selections stand out in a colour of their own.",
    version: palette.version,
    publisher: "zacess",
    license: "MIT",
    icon: "icon.png",
    galleryBanner: { color: "#111111", theme: "dark" },
    homepage: REPO,
    repository: { type: "git", url: `${REPO}.git`, directory: "editors/vscode" },
    bugs: { url: `${REPO}/issues` },
    engines: { vscode: "^1.85.0" },
    categories: ["Themes"],
    keywords: ["theme", "high contrast", "accessibility", "low vision", "dyslexia", "WCAG", "AAA", "colour blind", "yellow on black", "cream"],
    contributes: { themes: contributes },
  }));
  copyFileSync(join(ROOT, "LICENSE"), join(ROOT, "editors/vscode/LICENSE"));
  written.push("editors/vscode/LICENSE");
}

// ---------------------------------------------------------------- JetBrains

const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bare = (hex) => hex.slice(1);

function iclsAttribute(name, { fg, bg, token, effect, effectColour, fontType }) {
  const lines = [`    <option name="${name}">`, "      <value>"];
  if (fg) lines.push(`        <option name="FOREGROUND" value="${bare(fg)}" />`);
  if (bg) lines.push(`        <option name="BACKGROUND" value="${bare(bg)}" />`);
  // FONT_TYPE is a bit set: 1 bold, 2 italic
  const type = fontType ?? (token ? (has(token, "bold") ? 1 : 0) + (has(token, "italic") ? 2 : 0) : 0);
  if (type) lines.push(`        <option name="FONT_TYPE" value="${type}" />`);
  const underline = token && has(token, "underline");
  if (effect !== undefined || underline) {
    lines.push(`        <option name="EFFECT_COLOR" value="${bare(effectColour ?? fg)}" />`);
    // EFFECT_TYPE 0 boxed, 1 underline, 2 wavy underline
    lines.push(`        <option name="EFFECT_TYPE" value="${effect ?? 1}" />`);
  }
  lines.push("      </value>", "    </option>");
  return lines.join("\n");
}

function icls(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const a = theme.terminal.ansi;
  const colours = {
    CARET_COLOR: u.cursor,
    CARET_ROW_COLOR: u.lineHighlight,
    SELECTION_BACKGROUND: u.selectionStrong,
    SELECTION_FOREGROUND: u.selectionForeground,
    // the selected text colour is drawn on an unfocused selection too, so it keeps the same block
    SELECTION_BACKGROUND_INACTIVE: u.selectionStrong,
    GUTTER_BACKGROUND: u.gutter,
    LINE_NUMBERS_COLOR: u.lineNumber,
    LINE_NUMBER_ON_CARET_ROW_COLOR: u.lineNumberActive,
    INDENT_GUIDE: u.indentGuide,
    SELECTED_INDENT_GUIDE: u.foreground,
    RIGHT_MARGIN_COLOR: u.indentGuide,
    WHITESPACES: u.whitespace,
    METHOD_SEPARATORS_COLOR: u.border,
    TEARLINE_COLOR: u.border,
    ADDED_LINES_COLOR: s.added,
    MODIFIED_LINES_COLOR: s.changed,
    DELETED_LINES_COLOR: s.removed,
    WHITESPACES_MODIFIED_LINES_COLOR: s.changed,
    DOCUMENTATION_COLOR: u.surface,
    ERROR_HINT: u.surface,
    INFORMATION_HINT: u.surface,
    QUESTION_HINT: u.surface,
    LOOKUP_COLOR: u.surface,
    CONSOLE_BACKGROUND_KEY: u.background,
    FILESTATUS_ADDED: s.added,
    FILESTATUS_MODIFIED: s.changed,
    FILESTATUS_DELETED: s.removed,
    FILESTATUS_UNKNOWN: s.added,
    FILESTATUS_IDEA_FILESTATUS_IGNORED: u.muted,
  };
  const t = (token) => ({ fg: s[token], token });
  const attributes = {
    TEXT: { fg: u.foreground, bg: u.background },
    DEFAULT_KEYWORD: t("keyword"),
    DEFAULT_IDENTIFIER: t("variable"),
    DEFAULT_LOCAL_VARIABLE: t("variable"),
    DEFAULT_GLOBAL_VARIABLE: t("variable"),
    DEFAULT_REASSIGNED_LOCAL_VARIABLE: t("variable"),
    DEFAULT_PARAMETER: t("parameter"),
    DEFAULT_REASSIGNED_PARAMETER: t("parameter"),
    DEFAULT_INSTANCE_FIELD: t("property"),
    DEFAULT_STATIC_FIELD: t("property"),
    DEFAULT_FUNCTION_DECLARATION: t("function"),
    DEFAULT_FUNCTION_CALL: t("function"),
    DEFAULT_INSTANCE_METHOD: t("function"),
    DEFAULT_STATIC_METHOD: t("function"),
    DEFAULT_CLASS_NAME: t("type"),
    DEFAULT_CLASS_REFERENCE: t("type"),
    DEFAULT_INTERFACE_NAME: t("type"),
    DEFAULT_STRING: t("string"),
    DEFAULT_VALID_STRING_ESCAPE: t("regex"),
    DEFAULT_INVALID_STRING_ESCAPE: { fg: s.invalid, token: "invalid" },
    DEFAULT_NUMBER: t("number"),
    DEFAULT_CONSTANT: t("number"),
    DEFAULT_PREDEFINED_SYMBOL: t("number"),
    DEFAULT_LINE_COMMENT: t("comment"),
    DEFAULT_BLOCK_COMMENT: t("comment"),
    DEFAULT_DOC_COMMENT: t("comment"),
    DEFAULT_DOC_COMMENT_TAG: { fg: s.comment, fontType: 3 },
    DEFAULT_DOC_MARKUP: t("comment"),
    DEFAULT_OPERATION_SIGN: t("operator"),
    DEFAULT_BRACES: t("operator"),
    DEFAULT_BRACKETS: t("operator"),
    DEFAULT_PARENTHS: t("operator"),
    DEFAULT_COMMA: t("operator"),
    DEFAULT_SEMICOLON: t("operator"),
    DEFAULT_DOT: t("operator"),
    DEFAULT_METADATA: t("function"),
    DEFAULT_LABEL: t("control"),
    DEFAULT_TAG: t("tag"),
    DEFAULT_ATTRIBUTE: t("attribute"),
    DEFAULT_ENTITY: t("number"),
    DEFAULT_TEMPLATE_LANGUAGE_COLOR: t("variable"),
    "REGEXP.CHAR_CLASS": t("regex"),
    "REGEXP.BRACKETS": t("regex"),
    "REGEXP.META": t("regex"),
    "JS.REGEXP": t("regex"),
    "TS.TYPE_PARAMETER": t("type"),
    "PY.KEYWORD": t("keyword"),
    "PY.DOC_COMMENT": t("string"),
    "PY.DECORATOR": t("function"),
    "PY.BUILTIN_NAME": t("function"),
    "PY.SELF_PARAMETER": t("keyword"),
    BAD_CHARACTER: { fg: s.invalid, token: "invalid" },
    WRONG_REFERENCES_ATTRIBUTES: { fg: s.invalid, token: "invalid" },
    ERRORS_ATTRIBUTES: { effect: 2, effectColour: u.error },
    WARNING_ATTRIBUTES: { effect: 2, effectColour: u.warning },
    INFO_ATTRIBUTES: { effect: 2, effectColour: u.info },
    TYPO: { effect: 2, effectColour: u.info },
    HYPERLINK_ATTRIBUTES: { fg: u.link, effect: 1, effectColour: u.link },
    FOLLOWED_HYPERLINK_ATTRIBUTES: { fg: u.link, effect: 1, effectColour: u.link },
    SEARCH_RESULT_ATTRIBUTES: { bg: u.findMatch, effect: 0, effectColour: u.findMatchBorder },
    TEXT_SEARCH_RESULT_ATTRIBUTES: { bg: u.findMatch, effect: 0, effectColour: u.findMatchBorder },
    WRITE_SEARCH_RESULT_ATTRIBUTES: { bg: u.findMatch, effect: 0, effectColour: u.findMatchBorder },
    // the word under the caret and a matched brace are boxed with no fill, so they never hide a
    // character and stay apart from the filled search results and the selection
    // EFFECT_TYPE 5 is a bold dotted underline, the nearest the IDE gets to a dashed outline
    IDENTIFIER_UNDER_CARET_ATTRIBUTES: { effect: dashedWord(theme) ? 5 : 0, effectColour: u.border },
    WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES: { effect: dashedWord(theme) ? 5 : 0, effectColour: matchOutline(u) },
    MATCHED_BRACE_ATTRIBUTES: { effect: 0, effectColour: matchOutline(u), fontType: 1 },
    UNMATCHED_BRACE_ATTRIBUTES: { fg: s.invalid, token: "invalid" },
    TODO_DEFAULT_ATTRIBUTES: { fg: s.control, fontType: 3 },
    // the diff fills are matched by the gutter stripes in ADDED_LINES_COLOR, MODIFIED_LINES_COLOR
    // and DELETED_LINES_COLOR above; a modified line takes the selected row fill, which every
    // syntax colour keeps the text floor over
    DIFF_INSERTED: { bg: u.diffAddedBackground },
    DIFF_DELETED: { bg: u.diffRemovedBackground },
    DIFF_MODIFIED: { bg: u.listSelection },
    DELETED_TEXT_ATTRIBUTES: { fg: s.removed, effect: 3, effectColour: s.removed },
    INJECTED_LANGUAGE_FRAGMENT: {},
    CONSOLE_NORMAL_OUTPUT: { fg: terminalText(theme).foreground },
    CONSOLE_ERROR_OUTPUT: { fg: u.error },
    CONSOLE_SYSTEM_OUTPUT: { fg: u.muted },
    CONSOLE_USER_INPUT: { fg: s.function, fontType: 2 },
    LOG_ERROR_OUTPUT: { fg: u.error },
    LOG_WARNING_OUTPUT: { fg: u.warning },
    LOG_INFO_OUTPUT: { fg: u.info },
  };
  const consoleNames = ["BLACK", "RED", "GREEN", "YELLOW", "BLUE", "MAGENTA", "CYAN", "GRAY"];
  const brightNames = ["DARKGRAY", "RED_BRIGHT", "GREEN_BRIGHT", "YELLOW_BRIGHT", "BLUE_BRIGHT", "MAGENTA_BRIGHT", "CYAN_BRIGHT", "WHITE"];
  consoleNames.forEach((n, i) => { attributes[`CONSOLE_${n}_OUTPUT`] = { fg: a[i] }; });
  brightNames.forEach((n, i) => { attributes[`CONSOLE_${n}_OUTPUT`] = { fg: a[i + 8] }; });

  const parent = theme.appearance === "dark" ? "Darcula" : "Default";
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    `<!-- ${HEADER} -->`,
    `<scheme name="${xmlEscape(theme.name)}" version="142" parent_scheme="${parent}">`,
    "  <metaInfo>",
    `    <property name="ide">idea</property>`,
    `    <property name="originalScheme">${xmlEscape(theme.name)}</property>`,
    "  </metaInfo>",
    "  <colors>",
    ...Object.entries(colours).map(([k, v]) => `    <option name="${k}" value="${bare(v)}" />`),
    "  </colors>",
    "  <attributes>",
    ...Object.entries(attributes).map(([k, v]) => iclsAttribute(k, v)),
    "  </attributes>",
    "</scheme>",
    "",
  ].join("\n");
}

function jetbrainsTheme(theme) {
  const u = theme.ui;
  const selectedText = { selectionBackground: u.selectionStrong, selectionForeground: u.selectionForeground };
  return {
    name: theme.name,
    dark: theme.appearance === "dark",
    author: "Zacess",
    // IntelliJ 2026.2 no longer resolves an editorScheme path ending in .icls and falls back to the
    // default scheme, so the scheme ships with an .xml extension like other theme plugins
    editorScheme: `/themes/${slug(theme)}.xml`,
    ui: {
      "*": {
        background: u.surface,
        foreground: u.foreground,
        infoForeground: u.muted,
        disabledForeground: u.muted,
        inactiveForeground: u.muted,
        selectionBackground: u.listSelection,
        selectionForeground: u.foreground,
        selectionInactiveBackground: u.lineHighlight,
        selectionBackgroundInactive: u.lineHighlight,
        selectionInactiveForeground: u.foreground,
        hoverBackground: u.lineHighlight,
        borderColor: u.border,
        separatorColor: u.border,
        focusColor: u.borderActive,
        focusedBorderColor: u.borderActive,
        errorForeground: u.error,
        acceleratorForeground: u.muted,
      },
      Component: {
        focusWidth: 2,
        focusColor: u.borderActive,
        focusedBorderColor: u.borderActive,
        borderColor: u.border,
        errorFocusColor: u.error,
        inactiveErrorFocusColor: u.error,
        warningFocusColor: u.warning,
        inactiveWarningFocusColor: u.warning,
      },
      Link: {
        activeForeground: u.link,
        hoverForeground: u.link,
        pressedForeground: u.link,
        visitedForeground: u.link,
      },
      Button: {
        startBackground: u.surfaceAlt,
        endBackground: u.surfaceAlt,
        foreground: u.foreground,
        startBorderColor: u.border,
        endBorderColor: u.border,
        focusedBorderColor: u.borderActive,
        "default.startBackground": u.accent,
        "default.endBackground": u.accent,
        "default.foreground": u.accentForeground,
        "default.startBorderColor": u.accent,
        "default.endBorderColor": u.accent,
        "default.focusColor": u.foreground,
        "default.focusedBorderColor": u.foreground,
      },
      // selected text in text fields takes the editor's selection block and one text colour,
      // overriding the selected row colour that "*" gives every component
      TextField: { background: u.background, foreground: u.foreground, ...selectedText },
      TextArea: { background: u.background, foreground: u.foreground, ...selectedText },
      TextPane: selectedText,
      PasswordField: selectedText,
      FormattedTextField: selectedText,
      ComboBox: { background: u.background, foreground: u.foreground, nonEditableBackground: u.background },
      EditorPane: { background: u.background, ...selectedText },
      EditorTabs: {
        background: u.surface,
        underlinedTabBackground: u.background,
        underlinedTabForeground: u.foreground,
        underlineColor: u.borderActive,
        underlineHeight: 3,
        inactiveUnderlineColor: u.border,
      },
      ToolWindow: {
        "Header.background": u.surfaceAlt,
        "Header.inactiveBackground": u.surface,
        "HeaderTab.selectedInactiveBackground": u.lineHighlight,
        "Button.selectedBackground": u.listSelection,
        "Button.selectedForeground": u.foreground,
      },
      MainToolbar: { background: u.surfaceAlt, inactiveBackground: u.surface },
      StatusBar: { background: u.surfaceAlt, borderColor: u.border },
      Tree: { background: u.surface, foreground: u.foreground, selectionBackground: u.listSelection, selectionForeground: u.foreground, selectionInactiveBackground: u.lineHighlight },
      List: { background: u.surface, foreground: u.foreground, selectionBackground: u.listSelection, selectionForeground: u.foreground, selectionInactiveBackground: u.lineHighlight },
      Table: { background: u.surface, foreground: u.foreground, selectionBackground: u.listSelection, selectionForeground: u.foreground },
      Popup: { background: u.surface, borderColor: u.border },
      ToolTip: { background: u.surface, foreground: u.foreground, borderColor: u.border },
      Notification: { background: u.surface, foreground: u.foreground, borderColor: u.border },
      SearchMatch: { startBackground: u.findMatch, endBackground: u.findMatch },
      Counter: { background: u.accent, foreground: u.accentForeground },
      ScrollBar: { "Mac.thumbColor": u.indentGuide, "Mac.hoverThumbColor": u.border, thumbColor: u.indentGuide, hoverThumbColor: u.border },
    },
  };
}

function buildJetbrains() {
  const base = "editors/jetbrains/src/main/resources";
  const providers = [];
  for (const theme of palette.themes) {
    write(`${base}/themes/${slug(theme)}.theme.json`, json(jetbrainsTheme(theme)));
    write(`${base}/themes/${slug(theme)}.xml`, icls(theme));
    providers.push(`    <themeProvider id="${slug(theme)}" path="/themes/${slug(theme)}.theme.json" />`);
  }
  const names = palette.themes.map((t) => t.name);
  write(`${base}/META-INF/plugin.xml`, [
    `<!-- ${HEADER} -->`,
    "<idea-plugin>",
    "  <id>com.zacess.themes</id>",
    "  <name>Zacess Themes</name>",
    "  <vendor url=\"https://zacess.com\" email=\"contact@zacess.com\">Zacess</vendor>",
    "  <description><![CDATA[",
    "<p>Eight high contrast themes that match the Zacess reader, so a page looks the same in the reader and in the IDE.</p>",
    "<ul>",
    ...palette.themes.map((t) => `<li><b>${t.name}</b>: ${t.description}</li>`),
    "</ul>",
    "<p>Every text and syntax colour keeps at least 7:1 contrast (WCAG AAA) on the background. The current line is a visible band with plain text at 7:1 and every syntax colour at 4.5:1 or more over it. Comments are never dimmed below 7:1. Selected text takes one colour at 7:1 or more on a bold selection block. Keywords are bold, comments italic and invalid code underlined, so colour is never the only signal.</p>",
    `<p>Source, contrast tables and issues: <a href="${REPO}">${REPO}</a></p>`,
    "]]></description>",
    "  <depends>com.intellij.modules.platform</depends>",
    "  <extensions defaultExtensionNs=\"com.intellij\">",
    ...providers,
    "  </extensions>",
    "</idea-plugin>",
    "",
  ].join("\n"));
  return names;
}

// ---------------------------------------------------------------- Obsidian

function obsidianVars(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  return [
    `color-scheme: ${theme.appearance};`,
    // Obsidian derives form fields and many panels from the base scale, so it is set too; without
    // it a theme chosen in the other mode keeps the wrong mode's field colours
    `--color-base-00: ${u.background};`,
    `--color-base-05: ${u.surface};`,
    `--color-base-10: ${u.surface};`,
    `--color-base-20: ${u.surfaceAlt};`,
    `--color-base-25: ${u.surfaceAlt};`,
    `--color-base-30: ${u.border};`,
    `--color-base-35: ${u.border};`,
    `--color-base-40: ${u.border};`,
    `--color-base-50: ${u.muted};`,
    `--color-base-60: ${u.muted};`,
    `--color-base-70: ${u.muted};`,
    `--color-base-100: ${u.foreground};`,
    `--background-modifier-form-field: ${u.background};`,
    `--background-primary: ${u.background};`,
    `--background-primary-alt: ${u.surface};`,
    `--background-secondary: ${u.surface};`,
    `--background-secondary-alt: ${u.surfaceAlt};`,
    `--background-modifier-border: ${u.border};`,
    `--background-modifier-border-hover: ${u.foreground};`,
    `--background-modifier-border-focus: ${u.borderActive};`,
    `--background-modifier-hover: ${u.lineHighlight};`,
    `--background-modifier-active-hover: ${u.lineHighlight};`,
    `--background-modifier-error: ${u.error};`,
    `--background-modifier-success: ${s.added};`,
    `--text-normal: ${u.foreground};`,
    `--text-muted: ${u.muted};`,
    `--text-faint: ${u.muted};`,
    `--text-error: ${u.error};`,
    `--text-warning: ${u.warning};`,
    `--text-success: ${s.added};`,
    `--text-accent: ${u.accent};`,
    `--text-accent-hover: ${u.accent};`,
    `--text-on-accent: ${u.accentForeground};`,
    `--text-on-accent-inverted: ${u.accentForeground};`,
    `--text-selection: ${u.selection};`,
    `--text-highlight-bg: ${u.findMatch};`,
    `--zacess-find-border: ${u.findMatchBorder};`,
    `--zacess-line-highlight: ${u.lineHighlight};`,
    `--zacess-match-outline: ${matchOutline(u)};`,
    `--interactive-normal: ${u.surfaceAlt};`,
    `--interactive-hover: ${u.lineHighlight};`,
    `--interactive-accent: ${u.accent};`,
    `--interactive-accent-hover: ${u.accent};`,
    `--link-color: ${u.link};`,
    `--link-color-hover: ${u.link};`,
    `--link-external-color: ${u.link};`,
    `--link-external-color-hover: ${u.link};`,
    `--link-unresolved-color: ${u.link};`,
    `--link-unresolved-opacity: 1;`,
    `--link-decoration: underline;`,
    `--link-decoration-hover: underline;`,
    `--link-external-decoration: underline;`,
    `--link-unresolved-decoration-style: dashed;`,
    `--code-background: ${u.surface};`,
    `--code-normal: ${s.foreground};`,
    `--code-comment: ${s.comment};`,
    `--code-function: ${s.function};`,
    `--code-important: ${s.control};`,
    `--code-keyword: ${s.keyword};`,
    `--code-operator: ${s.operator};`,
    `--code-property: ${s.property};`,
    `--code-punctuation: ${s.operator};`,
    `--code-string: ${s.string};`,
    `--code-tag: ${s.tag};`,
    `--code-value: ${s.number};`,
    `--caret-color: ${u.cursor};`,
    `--checkbox-color: ${u.accent};`,
    `--checkbox-border-color: ${u.border};`,
    `--blockquote-border-color: ${u.border};`,
    `--hr-color: ${u.border};`,
    `--tag-color: ${u.accent};`,
    `--tag-background: ${u.surface};`,
    `--tag-border-color: ${u.border};`,
    `--tag-border-width: 1px;`,
    `--zacess-focus: ${u.borderActive};`,
    `--zacess-added: ${s.added};`,
    `--zacess-removed: ${s.removed};`,
  ];
}

function buildObsidian() {
  const byId = Object.fromEntries(palette.themes.map((t) => [t.id, t]));
  const block = (selector, theme) => `${selector} {\n${obsidianVars(theme).map((v) => `  ${v}`).join("\n")}\n}\n`;
  const css = [
    `/* ${HEADER} */`,
    "",
    "/* @settings",
    "name: Zacess",
    "id: zacess-theme",
    "settings:",
    "  - id: zacess-contrast",
    "    title: Contrast theme",
    "    description: Light and Dark follow Obsidian's own appearance setting. The others replace both.",
    "    type: class-select",
    "    allowEmpty: false",
    "    default: zacess-follow",
    "    options:",
    "      - label: Light or Dark, following Obsidian",
    "        value: zacess-follow",
    "      - label: Yellow on Black (low vision)",
    "        value: zacess-yellow-on-black",
    "      - label: Cream (dyslexia friendly)",
    "        value: zacess-cream",
    "      - label: High Contrast Dark",
    "        value: zacess-high-contrast-dark",
    "      - label: High Contrast Light",
    "        value: zacess-high-contrast-light",
    "      - label: Deep Contrast Dark",
    "        value: zacess-deep-contrast-dark",
    "      - label: Deep Contrast Light",
    "        value: zacess-deep-contrast-light",
    "*/",
    "",
    block(".theme-light", byId.light),
    block(".theme-dark", byId.dark),
    "/* the class-select option sits on body, so it outranks the light and dark blocks above */",
    block("body.zacess-yellow-on-black.theme-light,\nbody.zacess-yellow-on-black.theme-dark", byId["yellow-on-black"]),
    block("body.zacess-cream.theme-light,\nbody.zacess-cream.theme-dark", byId.cream),
    block("body.zacess-high-contrast-dark.theme-light,\nbody.zacess-high-contrast-dark.theme-dark", byId["high-contrast-dark"]),
    block("body.zacess-high-contrast-light.theme-light,\nbody.zacess-high-contrast-light.theme-dark", byId["high-contrast-light"]),
    block("body.zacess-deep-contrast-dark.theme-light,\nbody.zacess-deep-contrast-dark.theme-dark", byId["deep-contrast-dark"]),
    block("body.zacess-deep-contrast-light.theme-light,\nbody.zacess-deep-contrast-light.theme-dark", byId["deep-contrast-light"]),
    "/* Obsidian fills search matches in the editor with the selection colour; they take the find",
    "   match colour instead, so a selection never passes for a search hit; the match the",
    "   cursor is on is outlined as well */",
    ".cm-s-obsidian span.cm-highlight.obsidian-search-match-highlight,",
    ".cm-s-obsidian .cm-searchMatch {",
    "  background-color: var(--text-highlight-bg);",
    "}",
    "",
    ".cm-s-obsidian .cm-searchMatch.cm-searchMatch-selected {",
    "  outline: 2px solid var(--zacess-find-border);",
    "  outline-offset: 1px;",
    "}",
    "",
    "/* the line the cursor is on is a visible band in editing view */",
    ".cm-s-obsidian .cm-active.cm-line,",
    ".cm-s-obsidian .cm-activeLine {",
    "  background-color: var(--zacess-line-highlight);",
    "}",
    "",
    "/* a matched bracket is outlined and bold with no fill, so it never hides the character */",
    ".cm-s-obsidian .cm-matchingBracket,",
    ".cm-s-obsidian span.cm-matchingBracket {",
    "  background-color: transparent;",
    "  outline: 2px solid var(--zacess-match-outline);",
    "  font-weight: 700;",
    "}",
    "",
    "/* links are underlined so colour is never the only signal */",
    ".markdown-rendered a,",
    ".cm-s-obsidian span.cm-hmd-internal-link,",
    ".cm-s-obsidian span.cm-url,",
    ".cm-s-obsidian span.cm-link {",
    "  text-decoration: underline;",
    "  text-decoration-thickness: 1px;",
    "  text-underline-offset: 2px;",
    "}",
    "",
    "/* a visible focus ring on every control, never removed */",
    ":focus-visible {",
    "  outline: 3px solid var(--zacess-focus);",
    "  outline-offset: 2px;",
    "}",
    "",
    "/* font styles in code match every other editor, so styles carry meaning without colour */",
    ".cm-s-obsidian .cm-keyword,",
    ".markdown-rendered .token.keyword {",
    "  font-weight: 700;",
    "}",
    "",
    ".cm-s-obsidian .cm-comment,",
    ".markdown-rendered .token.comment {",
    "  font-style: italic;",
    "}",
    "",
    ".markdown-rendered .token.tag {",
    "  font-weight: 700;",
    "}",
    "",
    ".markdown-rendered .token.parameter {",
    "  font-style: italic;",
    "}",
    "",
    ".markdown-rendered .token.inserted {",
    "  color: var(--zacess-added);",
    "}",
    "",
    ".markdown-rendered .token.deleted {",
    "  color: var(--zacess-removed);",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  * {",
    "    animation-duration: 0.01ms !important;",
    "    transition-duration: 0.01ms !important;",
    "  }",
    "}",
    "",
  ].join("\n");
  write("editors/obsidian/theme.css", css);
  write("editors/obsidian/manifest.json", json({
    name: "Zacess",
    version: palette.version,
    minAppVersion: "1.0.0",
    author: "Zacess",
    authorUrl: "https://zacess.com",
  }));
}

// ---------------------------------------------------------------- Neovim

function neovim(theme) {
  const u = theme.ui;
  const wordLine = dashedWord(theme) ? { underdashed: true } : { underline: true };
  const s = theme.syntax;
  const spec = (token, extra = {}) => {
    const out = { fg: s[token], ...extra };
    if (has(token, "bold")) out.bold = true;
    if (has(token, "italic")) out.italic = true;
    if (has(token, "underline")) { out.underline = true; out.sp = s[token]; }
    return out;
  };
  const groups = {
    Normal: { fg: u.foreground, bg: u.background },
    NormalNC: { fg: u.foreground, bg: u.background },
    NormalFloat: { fg: u.foreground, bg: u.surface },
    FloatBorder: { fg: u.border, bg: u.surface },
    FloatTitle: { fg: u.foreground, bg: u.surface, bold: true },
    Cursor: { fg: u.background, bg: u.cursor },
    lCursor: { fg: u.background, bg: u.cursor },
    CursorIM: { fg: u.background, bg: u.cursor },
    TermCursor: { fg: u.background, bg: u.cursor },
    CursorLine: { bg: u.lineHighlight },
    CursorColumn: { bg: u.lineHighlight },
    ColorColumn: { bg: u.lineHighlight },
    CursorLineNr: { fg: u.lineNumberActive, bg: u.lineHighlight, bold: true },
    LineNr: { fg: u.lineNumber, bg: u.gutter },
    SignColumn: { fg: u.lineNumber, bg: u.gutter },
    FoldColumn: { fg: u.lineNumber, bg: u.gutter },
    Folded: { fg: u.muted, bg: u.surface, italic: true },
    // every selected character takes one colour on the selection block, in every buffer
    // including terminal buffers
    Visual: { fg: u.selectionForeground, bg: u.selectionStrong },
    VisualNOS: { fg: u.selectionForeground, bg: u.selectionStrong },
    // the current match is filled and bold, the other matches underlined in the find match
    // outline colour with no fill, so they stay apart from each other and from the current line
    Search: { underline: true, sp: u.findMatchBorder },
    CurSearch: { fg: u.foreground, bg: u.findMatch, bold: true },
    IncSearch: { fg: u.foreground, bg: u.findMatch, bold: true },
    Substitute: { fg: u.foreground, bg: u.findMatch },
    // a matched bracket and the word under the cursor are underlined with no fill, so they never
    // hide a character and show on the current line too
    MatchParen: { bold: true, underline: true, sp: matchOutline(u) },
    NonText: { fg: u.whitespace },
    Whitespace: { fg: u.whitespace },
    SpecialKey: { fg: u.whitespace },
    EndOfBuffer: { fg: u.whitespace },
    Conceal: { fg: u.muted },
    Directory: { fg: s.function, bold: true },
    Title: { fg: s.keyword, bold: true },
    ErrorMsg: { fg: u.error, bold: true },
    WarningMsg: { fg: u.warning, bold: true },
    ModeMsg: { fg: u.foreground, bold: true },
    MoreMsg: { fg: u.accent, bold: true },
    Question: { fg: u.accent, bold: true },
    StatusLine: { fg: u.foreground, bg: u.surfaceAlt },
    StatusLineNC: { fg: u.muted, bg: u.surface },
    TabLine: { fg: u.muted, bg: u.surface },
    TabLineFill: { bg: u.surface },
    TabLineSel: { fg: u.foreground, bg: u.background, bold: true, underline: true, sp: u.accent },
    WinSeparator: { fg: u.border },
    VertSplit: { fg: u.border },
    WinBar: { fg: u.foreground, bg: u.background, bold: true },
    WinBarNC: { fg: u.muted, bg: u.background },
    Pmenu: { fg: u.foreground, bg: u.surface },
    PmenuSel: { fg: u.foreground, bg: u.listSelection, bold: true },
    PmenuSbar: { bg: u.surfaceAlt },
    PmenuThumb: { bg: u.indentGuide },
    PmenuMatch: { fg: u.accent, bold: true },
    WildMenu: { fg: u.foreground, bg: u.listSelection },
    QuickFixLine: { bg: u.listSelection },
    SpellBad: { undercurl: true, sp: u.error },
    SpellCap: { undercurl: true, sp: u.warning },
    SpellLocal: { undercurl: true, sp: u.info },
    SpellRare: { undercurl: true, sp: u.info },
    // diff fills with the sign column marks that gitsigns, mini.diff and vim-signify draw beside them
    DiffAdd: { bg: u.diffAddedBackground },
    DiffDelete: { fg: s.removed, bg: u.diffRemovedBackground },
    DiffChange: { bg: u.listSelection },
    DiffText: { bg: u.listSelection, bold: true, underline: true, sp: s.changed },
    GitSignsAdd: { fg: s.added, bg: u.gutter },
    GitSignsChange: { fg: s.changed, bg: u.gutter },
    GitSignsDelete: { fg: s.removed, bg: u.gutter },
    GitSignsChangedelete: { fg: s.changed, bg: u.gutter },
    GitSignsTopdelete: { fg: s.removed, bg: u.gutter },
    GitSignsUntracked: { fg: s.added, bg: u.gutter },
    MiniDiffSignAdd: { fg: s.added, bg: u.gutter },
    MiniDiffSignChange: { fg: s.changed, bg: u.gutter },
    MiniDiffSignDelete: { fg: s.removed, bg: u.gutter },
    SignifySignAdd: { fg: s.added, bg: u.gutter },
    SignifySignChange: { fg: s.changed, bg: u.gutter },
    SignifySignDelete: { fg: s.removed, bg: u.gutter },
    Added: spec("added"),
    Removed: spec("removed"),
    Changed: spec("changed"),
    diffAdded: spec("added"),
    diffRemoved: spec("removed"),
    diffChanged: spec("changed"),
    Comment: spec("comment"),
    Constant: spec("number"),
    String: spec("string"),
    Character: spec("string"),
    Number: spec("number"),
    Boolean: spec("number"),
    Float: spec("number"),
    Identifier: spec("variable"),
    Function: spec("function"),
    Statement: spec("keyword"),
    Conditional: spec("control"),
    Repeat: spec("control"),
    Label: spec("control"),
    Operator: spec("operator"),
    Keyword: spec("keyword"),
    Exception: spec("control"),
    PreProc: spec("keyword"),
    Include: spec("control"),
    Define: spec("keyword"),
    Macro: spec("function"),
    PreCondit: spec("keyword"),
    Type: spec("type"),
    StorageClass: spec("keyword"),
    Structure: spec("keyword"),
    Typedef: spec("keyword"),
    Special: spec("regex"),
    SpecialChar: spec("regex"),
    Tag: spec("tag"),
    Delimiter: spec("operator"),
    SpecialComment: spec("comment"),
    Debug: spec("control"),
    Underlined: { fg: u.link, underline: true },
    Error: spec("invalid"),
    Todo: { fg: s.control, bold: true, italic: true },
    DiagnosticError: { fg: u.error },
    DiagnosticWarn: { fg: u.warning },
    DiagnosticInfo: { fg: u.info },
    DiagnosticHint: { fg: u.muted },
    DiagnosticOk: { fg: s.added },
    DiagnosticUnderlineError: { undercurl: true, sp: u.error },
    DiagnosticUnderlineWarn: { undercurl: true, sp: u.warning },
    DiagnosticUnderlineInfo: { undercurl: true, sp: u.info },
    DiagnosticUnderlineHint: { undercurl: true, sp: u.muted },
    DiagnosticUnnecessary: { fg: u.muted, italic: true },
    DiagnosticDeprecated: { strikethrough: true, sp: u.muted },
    LspReferenceText: { ...wordLine, sp: u.border },
    LspReferenceRead: { ...wordLine, sp: u.border },
    LspReferenceWrite: { ...wordLine, sp: matchOutline(u) },
    LspInlayHint: { fg: u.muted, bg: u.surface },
    "@variable": spec("variable"),
    "@variable.builtin": spec("keyword"),
    "@variable.parameter": spec("parameter"),
    "@variable.parameter.builtin": spec("parameter"),
    "@variable.member": spec("property"),
    "@property": spec("property"),
    "@constant": spec("number"),
    "@constant.builtin": spec("number"),
    "@constant.macro": spec("number"),
    "@module": spec("type"),
    "@label": spec("control"),
    "@string": spec("string"),
    "@string.documentation": spec("string"),
    "@string.regexp": spec("regex"),
    "@string.escape": spec("regex"),
    "@string.special": spec("regex"),
    "@string.special.url": { fg: u.link, underline: true },
    "@character": spec("string"),
    "@boolean": spec("number"),
    "@number": spec("number"),
    "@number.float": spec("number"),
    "@type": spec("type"),
    "@type.builtin": spec("type"),
    "@type.definition": spec("type"),
    "@attribute": spec("function"),
    "@function": spec("function"),
    "@function.builtin": spec("function"),
    "@function.call": spec("function"),
    "@function.macro": spec("function"),
    "@function.method": spec("function"),
    "@function.method.call": spec("function"),
    "@constructor": spec("type"),
    "@operator": spec("operator"),
    "@keyword": spec("keyword"),
    "@keyword.function": spec("keyword"),
    "@keyword.operator": spec("keyword"),
    "@keyword.import": spec("control"),
    "@keyword.type": spec("keyword"),
    "@keyword.modifier": spec("keyword"),
    "@keyword.repeat": spec("control"),
    "@keyword.return": spec("control"),
    "@keyword.exception": spec("control"),
    "@keyword.conditional": spec("control"),
    "@keyword.coroutine": spec("control"),
    "@keyword.directive": spec("keyword"),
    "@punctuation": spec("operator"),
    "@punctuation.delimiter": spec("operator"),
    "@punctuation.bracket": spec("operator"),
    "@punctuation.special": spec("operator"),
    "@comment": spec("comment"),
    "@comment.documentation": spec("comment"),
    "@comment.error": { fg: u.error, bold: true, italic: true },
    "@comment.warning": { fg: u.warning, bold: true, italic: true },
    "@comment.todo": { fg: s.control, bold: true, italic: true },
    "@comment.note": { fg: u.info, bold: true, italic: true },
    "@markup.strong": { bold: true },
    "@markup.italic": { italic: true },
    "@markup.strikethrough": { strikethrough: true },
    "@markup.underline": { underline: true },
    "@markup.heading": { fg: s.keyword, bold: true },
    "@markup.quote": spec("comment"),
    "@markup.link": { fg: u.link, underline: true },
    "@markup.link.url": { fg: u.link, underline: true },
    "@markup.link.label": { fg: u.link },
    "@markup.raw": spec("string"),
    "@markup.list": spec("operator"),
    "@diff.plus": spec("added"),
    "@diff.minus": spec("removed"),
    "@diff.delta": spec("changed"),
    "@tag": spec("tag"),
    "@tag.builtin": spec("tag"),
    "@tag.attribute": spec("attribute"),
    "@tag.delimiter": spec("operator"),
    "@lsp.type.parameter": spec("parameter"),
    "@lsp.type.property": spec("property"),
    "@lsp.type.function": spec("function"),
    "@lsp.type.method": spec("function"),
    "@lsp.type.type": spec("type"),
    "@lsp.type.class": spec("type"),
    "@lsp.type.interface": spec("type"),
    "@lsp.type.enum": spec("type"),
    "@lsp.type.enumMember": spec("number"),
    "@lsp.type.namespace": spec("type"),
    "@lsp.type.keyword": spec("keyword"),
    "@lsp.type.comment": spec("comment"),
    "@lsp.type.variable": spec("variable"),
    "@lsp.type.decorator": spec("function"),
  };
  const lua = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));
  const tableOf = (obj) => `{ ${Object.entries(obj).map(([k, v]) => `${k} = ${lua(v)}`).join(", ")} }`;
  return [
    `-- ${theme.name}`,
    `-- ${HEADER}`,
    "-- needs a terminal or GUI with true colour and vim.o.termguicolors = true",
    "",
    "vim.cmd(\"highlight clear\")",
    "if vim.fn.exists(\"syntax_on\") == 1 then",
    "  vim.cmd(\"syntax reset\")",
    "end",
    `vim.o.background = "${theme.appearance}"`,
    `vim.g.colors_name = "${slug(theme)}"`,
    "",
    "local hl = vim.api.nvim_set_hl",
    "",
    ...Object.entries(groups).map(([g, v]) => `hl(0, ${JSON.stringify(g)}, ${tableOf(v)})`),
    "",
    ...theme.terminal.ansi.map((c, i) => `vim.g.terminal_color_${i} = "${c}"`),
    "",
  ].join("\n");
}

function buildNeovim() {
  for (const theme of palette.themes) write(`editors/neovim/colors/${slug(theme)}.lua`, neovim(theme));
}

// ---------------------------------------------------------------- Zed

function zedTheme(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const a = theme.terminal.ansi;
  const syn = (token, colour = s[token]) => {
    const out = { color: colour, font_style: has(token, "italic") ? "italic" : null, font_weight: has(token, "bold") ? 700 : null };
    return out;
  };
  const style = {
    background: u.surface,
    border: u.border,
    "border.variant": u.border,
    "border.focused": u.borderActive,
    "border.selected": u.borderActive,
    "border.transparent": `${u.surface}00`,
    "border.disabled": u.border,
    "elevated_surface.background": u.surface,
    "surface.background": u.surface,
    "element.background": u.surfaceAlt,
    "element.hover": u.lineHighlight,
    "element.active": u.listSelection,
    "element.selected": u.listSelection,
    "element.disabled": u.surface,
    "drop_target.background": u.listSelection,
    "ghost_element.background": `${u.surface}00`,
    "ghost_element.hover": u.lineHighlight,
    "ghost_element.active": u.listSelection,
    "ghost_element.selected": u.listSelection,
    "ghost_element.disabled": `${u.surface}00`,
    text: u.foreground,
    "text.muted": u.muted,
    "text.placeholder": u.muted,
    "text.disabled": u.muted,
    "text.accent": u.accent,
    icon: u.foreground,
    "icon.muted": u.muted,
    "icon.disabled": u.muted,
    "icon.placeholder": u.muted,
    "icon.accent": u.accent,
    "status_bar.background": u.surfaceAlt,
    "title_bar.background": u.surfaceAlt,
    "title_bar.inactive_background": u.surface,
    "toolbar.background": u.background,
    "tab_bar.background": u.surface,
    "tab.inactive_background": u.surface,
    "tab.active_background": u.background,
    "search.match_background": u.findMatch,
    "panel.background": u.surface,
    "panel.focused_border": u.borderActive,
    "pane.focused_border": u.borderActive,
    "scrollbar.thumb.background": `${u.indentGuide}80`,
    "scrollbar.thumb.hover_background": u.indentGuide,
    "scrollbar.thumb.border": u.indentGuide,
    "scrollbar.track.background": `${u.background}00`,
    "scrollbar.track.border": `${u.background}00`,
    "editor.foreground": u.foreground,
    "editor.background": u.background,
    "editor.gutter.background": u.gutter,
    "editor.subheader.background": u.surface,
    "editor.active_line.background": u.lineHighlight,
    "editor.highlighted_line.background": u.lineHighlight,
    "editor.line_number": u.lineNumber,
    "editor.active_line_number": u.lineNumberActive,
    "editor.invisible": u.whitespace,
    "editor.wrap_guide": u.indentGuide,
    "editor.active_wrap_guide": u.border,
    "editor.indent_guide": u.indentGuide,
    "editor.indent_guide_active": u.foreground,
    // Zed draws the word under the cursor and a matched bracket as a fill with no outline, so they
    // take the selected row colour, which every syntax colour keeps the text floor over
    "editor.document_highlight.read_background": u.listSelection,
    "editor.document_highlight.write_background": u.listSelection,
    "editor.document_highlight.bracket_background": u.listSelection,
    // the gutter marks beside changed lines
    "version_control.added": s.added,
    "version_control.modified": s.changed,
    "version_control.deleted": s.removed,
    "version_control.conflict_marker.ours": u.diffAddedBackground,
    "version_control.conflict_marker.theirs": u.diffRemovedBackground,
    "terminal.background": u.background,
    "terminal.foreground": terminalText(theme).foreground,
    "terminal.bright_foreground": terminalText(theme).foreground,
    "terminal.dim_foreground": u.muted,
    "link_text.hover": u.link,
    conflict: u.warning,
    "conflict.background": u.surface,
    "conflict.border": u.warning,
    created: s.added,
    "created.background": u.diffAddedBackground,
    "created.border": s.added,
    deleted: s.removed,
    "deleted.background": u.diffRemovedBackground,
    "deleted.border": s.removed,
    error: u.error,
    "error.background": u.surface,
    "error.border": u.error,
    hidden: u.muted,
    "hidden.background": u.surface,
    "hidden.border": u.border,
    hint: u.muted,
    "hint.background": u.surface,
    "hint.border": u.border,
    ignored: u.muted,
    "ignored.background": u.surface,
    "ignored.border": u.border,
    info: u.info,
    "info.background": u.surface,
    "info.border": u.info,
    modified: s.changed,
    "modified.background": u.listSelection,
    "modified.border": s.changed,
    predictive: u.muted,
    "predictive.background": u.surface,
    "predictive.border": u.border,
    renamed: s.changed,
    "renamed.background": u.surface,
    "renamed.border": s.changed,
    success: s.added,
    "success.background": u.surface,
    "success.border": s.added,
    unreachable: u.muted,
    "unreachable.background": u.surface,
    "unreachable.border": u.border,
    warning: u.warning,
    "warning.background": u.surface,
    "warning.border": u.warning,
    // Zed has no selected text colour, so the local player's selection, which the editor and the
    // terminal both draw, is the background only selection
    players: [{ cursor: u.cursor, background: u.cursor, selection: u.selection }],
    syntax: {
      attribute: syn("attribute"),
      boolean: syn("number"),
      comment: syn("comment"),
      "comment.doc": syn("comment"),
      constant: syn("number"),
      constructor: syn("type"),
      embedded: syn("variable"),
      emphasis: { color: s.foreground, font_style: "italic", font_weight: null },
      "emphasis.strong": { color: s.foreground, font_style: null, font_weight: 700 },
      enum: syn("type"),
      function: syn("function"),
      hint: { color: u.muted, font_style: "italic", font_weight: null },
      keyword: syn("keyword"),
      label: syn("control"),
      link_text: { color: u.link, font_style: null, font_weight: null },
      link_uri: { color: u.link, font_style: null, font_weight: null },
      number: syn("number"),
      operator: syn("operator"),
      predictive: { color: u.muted, font_style: "italic", font_weight: null },
      preproc: syn("keyword"),
      primary: syn("variable"),
      property: syn("property"),
      punctuation: syn("operator"),
      "punctuation.bracket": syn("operator"),
      "punctuation.delimiter": syn("operator"),
      "punctuation.list_marker": syn("operator"),
      "punctuation.special": syn("operator"),
      string: syn("string"),
      "string.escape": syn("regex"),
      "string.regex": syn("regex"),
      "string.special": syn("regex"),
      "string.special.symbol": syn("number"),
      tag: syn("tag"),
      "text.literal": syn("string"),
      title: { color: s.keyword, font_style: null, font_weight: 700 },
      type: syn("type"),
      variable: syn("variable"),
      "variable.special": syn("keyword"),
      variant: syn("type"),
    },
  };
  ANSI_NAMES.forEach((name, i) => {
    const key = name.startsWith("bright") ? `bright_${name.slice(6).toLowerCase()}` : name;
    style[`terminal.ansi.${key}`] = a[i];
  });
  return { name: theme.name, appearance: theme.appearance, style };
}

function buildZed() {
  write("editors/zed/themes/zacess.json", json({
    $schema: "https://zed.dev/schema/themes/v0.2.0.json",
    name: "Zacess",
    author: "Zacess",
    themes: palette.themes.map(zedTheme),
  }));
  write("editors/zed/extension.toml", [
    `# ${HEADER}`,
    "id = \"zacess-themes\"",
    "name = \"Zacess Themes\"",
    `version = "${palette.version}"`,
    "schema_version = 1",
    "authors = [\"Zacess <contact@zacess.com>\"]",
    "description = \"High contrast themes matching the Zacess reader: Light, Dark, Yellow on Black, Cream, High Contrast Dark, High Contrast Light, Deep Contrast Dark and Deep Contrast Light, every text and syntax colour at 7:1 or more on the background.\"",
    `repository = "${REPO}"`,
    "",
  ].join("\n"));
  copyFileSync(join(ROOT, "LICENSE"), join(ROOT, "editors/zed/LICENSE"));
  written.push("editors/zed/LICENSE");
}

// ---------------------------------------------------------------- shared palette names

// Sublime Text and Helix both name their colours once and refer to them by name, so both use the
// palette's own role names; the syntax text colour is renamed because the interface has a
// foreground of its own
const snake = (key) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const uiName = (key) => snake(key);
const synName = (token) => (token === "foreground" ? "syntax_foreground" : token);
function namedColours(theme) {
  const out = {};
  for (const [k, v] of Object.entries(theme.ui)) out[uiName(k)] = v;
  for (const [k, v] of Object.entries(theme.syntax)) out[synName(k)] = v;
  return out;
}

// ---------------------------------------------------------------- Sublime Text

function sublimeScheme(theme) {
  const s = theme.syntax;
  const v = (name) => `var(${name})`;
  // a rule's colour is one of the syntax tokens, so it is written as that token's variable
  const synVar = (colour, token) => v(synName(colour === s[token] ? token : Object.keys(s).find((k) => s[k] === colour)));
  const rules = textmateRules(s).map(({ name, scope, token, colour, style }) => {
    const out = { name, scope: scope.join(", "), foreground: synVar(colour, token) };
    if (style) out.font_style = style;
    return out;
  });
  // region colours are what packages such as LSP and the built in diff use for marks and outlines
  const regions = [
    ["redish", "error"], ["orangish", "warning"], ["yellowish", "warning"], ["greenish", null, "added"],
    ["cyanish", "info"], ["bluish", "info"], ["purplish", null, "keyword"], ["pinkish", null, "control"],
  ];
  for (const [region, ui, token] of regions) {
    rules.push({ name: `Region ${region}`, scope: `region.${region}`, foreground: ui ? v(uiName(ui)) : v(synName(token)) });
  }
  return {
    name: theme.name,
    author: "Zacess",
    variables: namedColours(theme),
    globals: {
      background: v("background"),
      foreground: v("foreground"),
      caret: v("cursor"),
      line_highlight: v("line_highlight"),
      selection: v("selection_strong"),
      selection_foreground: v("selection_foreground"),
      inactive_selection: v("selection_strong"),
      inactive_selection_foreground: v("selection_foreground"),
      gutter: v("gutter"),
      gutter_foreground: v("line_number"),
      gutter_foreground_highlight: v("line_number_active"),
      invisibles: v("whitespace"),
      guide: v("indent_guide"),
      active_guide: v("foreground"),
      stack_guide: v("indent_guide"),
      rulers: v("indent_guide"),
      minimap_border: v("border"),
      accent: v("accent"),
      // the current find match is filled and the other matches are outlined, as in VS Code
      find_highlight: v("find_match"),
      find_highlight_foreground: v("foreground"),
      highlight: v("find_match_border"),
      brackets_options: "underline",
      brackets_foreground: v(matchOutlineName(theme.ui)),
      bracket_contents_options: "underline",
      bracket_contents_foreground: v(matchOutlineName(theme.ui)),
      tags_options: "underline",
      tags_foreground: v("accent"),
      line_diff_width: "3",
      line_diff_added: v("added"),
      line_diff_modified: v("changed"),
      line_diff_deleted: v("removed"),
      misspelling: v("error"),
    },
    rules,
  };
}

function buildSublime() {
  for (const theme of palette.themes) write(`editors/sublime/${theme.name}.sublime-color-scheme`, json(sublimeScheme(theme)));
}

// ---------------------------------------------------------------- Helix

function helix(theme) {
  const tok = (token, extra = {}) => {
    const out = { fg: synName(token) };
    const modifiers = [];
    if (has(token, "bold")) modifiers.push("bold");
    if (has(token, "italic")) modifiers.push("italic");
    if (modifiers.length) out.modifiers = modifiers;
    if (has(token, "underline")) out.underline = { color: synName(token), style: "line" };
    return { ...out, ...extra };
  };
  const ui = (fg, bg, extra = {}) => ({ ...(fg ? { fg } : {}), ...(bg ? { bg } : {}), ...extra });
  const bold = { modifiers: ["bold"] };
  const styles = {
    "ui.background": ui(null, "background"),
    "ui.background.separator": ui("border"),
    "ui.text": ui("foreground"),
    "ui.text.focus": ui("foreground", null, bold),
    "ui.text.inactive": ui("muted"),
    "ui.text.info": ui("foreground", "surface"),
    "ui.cursor": ui("background", "cursor"),
    "ui.cursor.primary": ui("background", "cursor"),
    // a matched bracket is bold and underlined with no fill, so it shows on the current line too
    "ui.cursor.match": { modifiers: ["bold"], underline: { color: matchOutlineName(theme.ui), style: "line" } },
    "ui.cursorline.primary": ui(null, "line_highlight"),
    "ui.gutter": ui(null, "gutter"),
    "ui.linenr": ui("line_number"),
    "ui.linenr.selected": ui("line_number_active", null, bold),
    // search results show as selections too, so they take the same block and text colour
    "ui.selection": ui("selection_foreground", "selection_strong"),
    "ui.selection.primary": ui("selection_foreground", "selection_strong"),
    "ui.highlight": ui(null, "line_highlight"),
    "ui.statusline": ui("foreground", "surface_alt"),
    "ui.statusline.inactive": ui("muted", "surface"),
    "ui.statusline.normal": ui("accent_foreground", "accent", bold),
    "ui.statusline.insert": ui("accent_foreground", "accent", bold),
    "ui.statusline.select": ui("accent_foreground", "accent", bold),
    "ui.bufferline": ui("muted", "surface"),
    "ui.bufferline.active": ui("foreground", "background", { modifiers: ["bold"], underline: { color: "accent", style: "line" } }),
    "ui.bufferline.background": ui(null, "surface"),
    "ui.window": ui("border"),
    "ui.help": ui("foreground", "surface"),
    "ui.popup": ui("foreground", "surface"),
    "ui.popup.info": ui("foreground", "surface"),
    "ui.menu": ui("foreground", "surface"),
    "ui.menu.selected": ui("foreground", "list_selection", bold),
    "ui.menu.scroll": ui("indent_guide", "surface_alt"),
    "ui.picker.header": ui("foreground", "surface_alt", bold),
    "ui.virtual.whitespace": ui("whitespace"),
    "ui.virtual.indent-guide": ui("indent_guide"),
    "ui.virtual.ruler": ui(null, "line_highlight"),
    "ui.virtual.inlay-hint": ui("muted", "surface"),
    "ui.virtual.jump-label": ui("accent", null, { modifiers: ["bold"], underline: { color: "accent", style: "line" } }),
    "diagnostic.error": { underline: { color: "error", style: "curl" } },
    "diagnostic.warning": { underline: { color: "warning", style: "curl" } },
    "diagnostic.info": { underline: { color: "info", style: "curl" } },
    "diagnostic.hint": { underline: { color: "muted", style: "curl" } },
    "diagnostic.deprecated": { modifiers: ["crossed_out"] },
    error: ui("error", null, bold),
    warning: ui("warning", null, bold),
    info: ui("info", null, bold),
    hint: ui("muted", null, bold),
    "diff.plus": tok("added"),
    "diff.minus": tok("removed"),
    "diff.delta": tok("changed"),
    "markup.heading": ui("keyword", null, bold),
    "markup.bold": bold,
    "markup.italic": { modifiers: ["italic"] },
    "markup.strikethrough": { modifiers: ["crossed_out"] },
    "markup.link.url": ui("link", null, { underline: { color: "link", style: "line" } }),
    "markup.link.text": ui("link"),
    "markup.link.label": ui("link"),
    "markup.quote": tok("comment"),
    "markup.raw": tok("string"),
    "markup.list": tok("operator"),
    keyword: tok("keyword"),
    "keyword.control": tok("control"),
    "keyword.directive": tok("keyword"),
    "keyword.function": tok("keyword"),
    "keyword.storage": tok("keyword"),
    "keyword.operator": tok("keyword"),
    label: tok("control"),
    function: tok("function"),
    "function.builtin": tok("function"),
    "function.macro": tok("function"),
    type: tok("type"),
    "type.builtin": tok("type"),
    constructor: tok("type"),
    namespace: tok("type"),
    variable: tok("variable"),
    "variable.builtin": tok("keyword"),
    "variable.parameter": tok("parameter"),
    "variable.other.member": tok("property"),
    string: tok("string"),
    "string.regexp": tok("regex"),
    "string.special": tok("regex"),
    "string.special.url": ui("link", null, { underline: { color: "link", style: "line" } }),
    "constant.character": tok("string"),
    "constant.character.escape": tok("regex"),
    "constant.numeric": tok("number"),
    constant: tok("number"),
    comment: tok("comment"),
    operator: tok("operator"),
    punctuation: tok("operator"),
    special: tok("regex"),
    tag: tok("tag"),
    attribute: tok("attribute"),
  };
  const value = (x) => {
    if (typeof x === "string") return JSON.stringify(x);
    if (Array.isArray(x)) return `[${x.map(value).join(", ")}]`;
    return `{ ${Object.entries(x).map(([k, val]) => `${k} = ${value(val)}`).join(", ")} }`;
  };
  return [
    `# ${theme.name}`,
    `# ${HEADER}`,
    "",
    ...Object.entries(styles).map(([k, x]) => `${JSON.stringify(k)} = ${value(x)}`),
    "",
    "[palette]",
    ...Object.entries(namedColours(theme)).map(([k, x]) => `${k} = "${x}"`),
    "",
  ].join("\n");
}

function buildHelix() {
  for (const theme of palette.themes) write(`editors/helix/themes/${slug(theme).replace(/-/g, "_")}.toml`, helix(theme));
}

// ---------------------------------------------------------------- Emacs

function emacs(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const a = theme.terminal.ansi;
  const tok = (token, extra = {}) => {
    const out = { foreground: s[token] };
    if (has(token, "bold")) out.weight = "bold";
    if (has(token, "italic")) out.slant = "italic";
    if (has(token, "underline")) out.underline = true;
    return { ...out, ...extra };
  };
  const wave = (colour) => ({ underline: { color: colour, style: "wave" } });
  const box = (colour) => ({ box: { "line-width": 1, color: colour } });
  const faces = {
    default: { foreground: u.foreground, background: u.background },
    cursor: { background: u.cursor },
    region: { foreground: u.selectionForeground, background: u.selectionStrong, extend: true },
    "secondary-selection": { background: u.lineHighlight, extend: true },
    highlight: { background: u.lineHighlight },
    "hl-line": { background: u.lineHighlight, extend: true },
    fringe: { foreground: u.lineNumber, background: u.gutter },
    "line-number": { foreground: u.lineNumber, background: u.gutter },
    "line-number-current-line": { foreground: u.lineNumberActive, background: u.lineHighlight, weight: "bold" },
    "mode-line": { foreground: u.foreground, background: u.surfaceAlt, ...box(u.border) },
    "mode-line-inactive": { foreground: u.muted, background: u.surface, ...box(u.border) },
    "header-line": { foreground: u.foreground, background: u.surfaceAlt },
    "vertical-border": { foreground: u.border },
    "window-divider": { foreground: u.border },
    "minibuffer-prompt": { foreground: u.accent, weight: "bold" },
    tooltip: { foreground: u.foreground, background: u.surface },
    shadow: { foreground: u.muted },
    link: { foreground: u.link, underline: true },
    "link-visited": { foreground: u.link, underline: true },
    error: { foreground: u.error, weight: "bold" },
    warning: { foreground: u.warning, weight: "bold" },
    success: { foreground: s.added, weight: "bold" },
    "trailing-whitespace": { background: u.diffRemovedBackground },
    "font-lock-keyword-face": tok("keyword"),
    "font-lock-builtin-face": tok("function"),
    "font-lock-function-name-face": tok("function"),
    "font-lock-function-call-face": tok("function"),
    "font-lock-type-face": tok("type"),
    "font-lock-variable-name-face": tok("variable"),
    "font-lock-variable-use-face": tok("variable"),
    "font-lock-property-name-face": tok("property"),
    "font-lock-property-use-face": tok("property"),
    "font-lock-string-face": tok("string"),
    "font-lock-doc-face": tok("comment"),
    "font-lock-doc-markup-face": tok("comment", { weight: "bold" }),
    "font-lock-constant-face": tok("number"),
    "font-lock-number-face": tok("number"),
    "font-lock-comment-face": tok("comment"),
    "font-lock-comment-delimiter-face": tok("comment"),
    "font-lock-preprocessor-face": tok("keyword"),
    "font-lock-regexp-grouping-backslash": tok("regex", { weight: "bold" }),
    "font-lock-regexp-grouping-construct": tok("regex", { weight: "bold" }),
    "font-lock-escape-face": tok("regex"),
    "font-lock-operator-face": tok("operator"),
    "font-lock-punctuation-face": tok("operator"),
    "font-lock-bracket-face": tok("operator"),
    "font-lock-delimiter-face": tok("operator"),
    "font-lock-misc-punctuation-face": tok("operator"),
    "font-lock-negation-char-face": tok("control"),
    "font-lock-warning-face": tok("invalid", { weight: "bold" }),
    // a matched bracket is bold and underlined with no fill; the other search matches are
    // underlined in the find match outline colour while the current one is filled and bold
    "show-paren-match": { weight: "bold", underline: { color: matchOutline(u) } },
    "show-paren-mismatch": tok("invalid", { weight: "bold" }),
    isearch: { foreground: u.foreground, background: u.findMatch, weight: "bold" },
    "isearch-fail": { foreground: u.error, weight: "bold" },
    "lazy-highlight": { underline: { color: u.findMatchBorder } },
    match: { underline: { color: u.findMatchBorder } },
    // diff lines carry an indicator in the fringe and a coloured marker column as well as the fill
    "diff-added": { foreground: s.added, background: u.diffAddedBackground, extend: true },
    "diff-removed": { foreground: s.removed, background: u.diffRemovedBackground, extend: true },
    "diff-changed": { foreground: s.changed, background: u.listSelection, extend: true },
    "diff-indicator-added": { foreground: s.added, background: u.diffAddedBackground, weight: "bold" },
    "diff-indicator-removed": { foreground: s.removed, background: u.diffRemovedBackground, weight: "bold" },
    "diff-indicator-changed": { foreground: s.changed, background: u.listSelection, weight: "bold" },
    "diff-refine-added": { foreground: s.added, background: u.diffAddedBackground, weight: "bold", underline: true },
    "diff-refine-removed": { foreground: s.removed, background: u.diffRemovedBackground, weight: "bold", underline: true },
    "diff-refine-changed": { foreground: s.changed, background: u.listSelection, weight: "bold", underline: true },
    "diff-hl-insert": { foreground: s.added, background: u.gutter },
    "diff-hl-delete": { foreground: s.removed, background: u.gutter },
    "diff-hl-change": { foreground: s.changed, background: u.gutter },
    "diff-header": { foreground: u.foreground, background: u.surfaceAlt },
    "diff-file-header": { foreground: u.foreground, background: u.surfaceAlt, weight: "bold" },
    "flymake-error": wave(u.error),
    "flymake-warning": wave(u.warning),
    "flymake-note": wave(u.info),
    "flycheck-error": wave(u.error),
    "flycheck-warning": wave(u.warning),
    "flycheck-info": wave(u.info),
  };
  ANSI_NAMES.forEach((name, i) => {
    const face = `ansi-color-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    faces[face] = { foreground: a[i], background: a[i] };
  });
  const lisp = (key, x) => {
    if (x === true) return "t";
    if (typeof x === "number") return String(x);
    if (typeof x === "object") return `(${Object.entries(x).map(([k, val]) => `:${k} ${lisp(k, val)}`).join(" ")})`;
    // weight, slant and style take a symbol rather than a string
    return ["weight", "slant", "style"].includes(key) ? x : JSON.stringify(x);
  };
  const name = slug(theme);
  const spec = (attrs) => Object.entries(attrs).map(([k, x]) => `:${k} ${lisp(k, x)}`).join(" ");
  return [
    `;;; ${name}-theme.el --- ${theme.name} theme -*- lexical-binding: t; -*-`,
    "",
    `;; ${HEADER}`,
    "",
    ";; Author: Zacess <contact@zacess.com>",
    `;; URL: ${REPO}`,
    `;; Version: ${palette.version}`,
    ";; SPDX-License-Identifier: MIT",
    "",
    ";;; Commentary:",
    "",
    `;; ${theme.description}`,
    ";; Every text and syntax colour keeps at least 7:1 contrast on the",
    ";; background and 4.5:1 or more over the current line. Selected text",
    ";; takes one colour at 7:1 or more on a bold selection block.",
    "",
    ";;; Code:",
    "",
    `(deftheme ${name}`,
    `  ${JSON.stringify(theme.description)})`,
    "",
    "(custom-theme-set-faces",
    ` '${name}`,
    ...Object.entries(faces).map(([face, attrs], i, all) => ` '(${face} ((t (${spec(attrs)}))))${i === all.length - 1 ? ")" : ""}`),
    "",
    ";;;###autoload",
    "(when (and (boundp 'custom-theme-load-path) load-file-name)",
    "  (add-to-list 'custom-theme-load-path",
    "               (file-name-as-directory (file-name-directory load-file-name))))",
    "",
    `(provide-theme '${name})`,
    "",
    `;;; ${name}-theme.el ends here`,
    "",
  ].join("\n");
}

function buildEmacs() {
  for (const theme of palette.themes) write(`editors/emacs/${slug(theme)}-theme.el`, emacs(theme));
}

// ---------------------------------------------------------------- Eclipse

// Eclipse keeps its colours as preferences, so each theme is a preference export (.epf) that
// File > Import > Preferences applies; every key here was read from the installed plugins' own
// constants and plugin.xml; keys that Eclipse only migrates from older versions are left out
const rgb = (hex) => parseHex(hex).join(",");

// the semantic highlightings JDT registers, each with the token that colours it; enabling every
// one that is coloured stops Eclipse's dark appearance from filling any of them with its own colours
const ECLIPSE_SEMANTIC = [
  ["staticFinalField", "number"],
  ["staticField", "property"],
  ["field", "property"],
  ["inheritedField", "property"],
  ["annotationElementReference", "property"],
  ["methodDeclarationName", "function"],
  ["method", "function"],
  ["staticMethodInvocation", "function"],
  ["inheritedMethodInvocation", "function"],
  ["abstractMethodInvocation", "function"],
  ["annotation", "function"],
  ["localVariableDeclaration", "variable"],
  ["localVariable", "variable"],
  ["parameterVariable", "parameter"],
  ["class", "type"],
  ["abstractClass", "type"],
  ["interface", "type"],
  ["enum", "type"],
  ["record", "type"],
  ["typeParameter", "type"],
  ["typeArgument", "type"],
  ["number", "number"],
  ["restrictedKeywords", "keyword"],
];

function eclipsePrefs(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const jdt = [];
  const editors = [];
  const workbench = [];
  const styled = (out, key, token, { colour = s[token], bold = has(token, "bold"), italic = has(token, "italic"), underline = has(token, "underline") } = {}) => {
    out.push([key, rgb(colour)], [`${key}_bold`, bold], [`${key}_italic`, italic], [`${key}_underline`, underline], [`${key}_strikethrough`, false]);
  };

  // Java syntax colours; return is the only control keyword the Java scanner colours on its own
  styled(jdt, "java_default", "variable");
  styled(jdt, "java_keyword", "keyword");
  styled(jdt, "java_keyword_return", "control");
  styled(jdt, "java_operator", "operator");
  styled(jdt, "java_bracket", "operator");
  styled(jdt, "java_string", "string");
  styled(jdt, "java_single_line_comment", "comment");
  styled(jdt, "java_multi_line_comment", "comment");
  styled(jdt, "java_doc_default", "comment");
  styled(jdt, "java_doc_tag", "comment");
  // Javadoc @tags and TODO markers are bold italic, as in the JetBrains scheme
  styled(jdt, "java_doc_keyword", "comment", { bold: true, italic: true });
  styled(jdt, "java_comment_task_tag", "control", { bold: true, italic: true });
  // a {@link} reads as a link: the function colour, underlined, as the TextMate link rule
  styled(jdt, "java_doc_link", "function", { italic: false, underline: true });

  // properties files
  styled(jdt, "pf_coloring_key", "property");
  styled(jdt, "pf_coloring_value", "string");
  styled(jdt, "pf_coloring_assignment", "operator");
  styled(jdt, "pf_coloring_argument", "parameter");
  styled(jdt, "pf_coloring_comment", "comment");

  for (const [name, token] of ECLIPSE_SEMANTIC) {
    const key = `semanticHighlighting.${name}`;
    jdt.push(
      [`${key}.color`, rgb(s[token])], [`${key}.bold`, has(token, "bold")], [`${key}.italic`, has(token, "italic")],
      [`${key}.underline`, has(token, "underline")], [`${key}.strikethrough`, false], [`${key}.enabled`, true],
    );
  }
  // deprecated members keep Eclipse's own strikethrough in the text colour; autoboxing stays off
  // as in Eclipse, with a palette colour in case it is turned on
  jdt.push(
    ["semanticHighlighting.deprecatedMember.color", rgb(s.variable)], ["semanticHighlighting.deprecatedMember.bold", false],
    ["semanticHighlighting.deprecatedMember.italic", false], ["semanticHighlighting.deprecatedMember.underline", false],
    ["semanticHighlighting.deprecatedMember.strikethrough", true], ["semanticHighlighting.deprecatedMember.enabled", true],
    ["semanticHighlighting.autoboxing.color", rgb(s.variable)], ["semanticHighlighting.autoboxing.enabled", false],
  );

  jdt.push(
    ["matchingBracketsColor", rgb(matchOutline(u))],
    ["sourceHoverBackgroundColor", rgb(u.surface)],
    ["sourceHoverBackgroundColor.SystemDefault", false],
    ["content_assist_proposals_background", rgb(u.surface)],
    ["content_assist_proposals_foreground", rgb(u.foreground)],
    ["content_assist_parameters_background", rgb(u.surface)],
    ["content_assist_parameters_foreground", rgb(u.foreground)],
    ["content_assist_completion_replacement_background", rgb(u.listSelection)],
    ["content_assist_completion_replacement_foreground", rgb(u.foreground)],
  );

  // the text editor colours every Eclipse editor shares; each SystemDefault flag must be false or
  // Eclipse keeps drawing the operating system's colour
  editors.push(
    ["AbstractTextEditor.Color.Background", rgb(u.background)],
    ["AbstractTextEditor.Color.Background.SystemDefault", false],
    ["AbstractTextEditor.Color.Foreground", rgb(u.foreground)],
    ["AbstractTextEditor.Color.Foreground.SystemDefault", false],
    ["AbstractTextEditor.Color.SelectionBackground", rgb(u.selectionStrong)],
    ["AbstractTextEditor.Color.SelectionBackground.SystemDefault", false],
    ["AbstractTextEditor.Color.SelectionForeground", rgb(u.selectionForeground)],
    ["AbstractTextEditor.Color.SelectionForeground.SystemDefault", false],
    ["currentLineColor", rgb(u.lineHighlight)],
    ["lineNumberColor", rgb(u.lineNumber)],
    ["printMarginColor", rgb(u.indentGuide)],
    ["hyperlinkColor", rgb(u.link)],
    ["hyperlinkColor.SystemDefault", false],
    ["org.eclipse.ui.editors.stickyLinesSeparatorColor", rgb(u.border)],
  );
  const annotation = (prefix, colour, { text, highlight, style } = {}) => {
    editors.push([`${prefix}IndicationColor`, rgb(colour)]);
    if (text !== undefined) editors.push([`${prefix}Indication`, text]);
    if (highlight !== undefined) editors.push([`${prefix}Highlighting`, highlight]);
    if (style) editors.push([`${prefix}TextStyle`, style]);
  };
  // marked occurrences and search results are boxed in the find match outline rather than
  // filled, as in VS Code's high contrast themes, so every token keeps its own colour on the
  // editor background at full contrast and the box carries the non-text floor
  annotation("occurrence", u.findMatchBorder, { text: true, highlight: false, style: "BOX" });
  annotation("writeOccurrence", u.findMatchBorder, { text: true, highlight: false, style: "BOX" });
  annotation("searchResult", u.findMatchBorder, { text: true, highlight: false, style: "BOX" });
  annotation("error", u.error);
  annotation("warning", u.warning);
  annotation("info", u.info);
  annotation("spelling", u.info);
  annotation("change", s.changed);
  annotation("addition", s.added);
  annotation("deletion", s.removed);
  // linked mode fills the other copies of a renamed name behind their own colours, so it uses the
  // selected row colour, which every syntax colour keeps 7:1 over
  editors.push(["linked.slave.color", rgb(u.listSelection)], ["jdt.linked.slave.color", rgb(u.listSelection)]);

  // code minings and other inline annotations take a workbench colour rather than an editor one
  workbench.push(["org.eclipse.ui.editors.inlineAnnotationColor", rgb(u.muted)]);

  // the Terminal view keeps its own palette under its plugin's node; the key names are the
  // TerminalColor constants in the installed org.eclipse.terminal.control plugin
  const t = terminalColours(theme);
  const terminal = [
    ...ANSI_NAMES.map((name, i) => [name.replace(/([A-Z])/g, "_$1").toUpperCase(), rgb(t.ansi[i])]),
    ["FOREGROUND", rgb(t.foreground)],
    ["BACKGROUND", rgb(t.background)],
    ["SELECTION_FOREGROUND", rgb(t.selectionText)],
    ["SELECTION_BACKGROUND", rgb(t.selection)],
  ];

  return [
    ["org.eclipse.jdt.ui", jdt],
    ["org.eclipse.ui.editors", editors],
    ["org.eclipse.ui.workbench", workbench],
    ["org.eclipse.terminal.control", terminal],
  ];
}

function eclipseEpf(theme) {
  const lines = (node, entries) => entries.map(([k, v]) => `/instance/${node}/${k}=${v}`);
  return [
    `# ${theme.name} for Eclipse, ${HEADER}`,
    "# editor and Terminal view colours; import with File > Import > General > Preferences, then restart Eclipse",
    // no export root line (\!/=) is written: on import it would first clear every preference
    // under the root, the user's own settings included
    "file_export_version=3.0",
    ...eclipsePrefs(theme).flatMap(([node, entries]) => lines(node, entries)),
    "",
  ].join("\n");
}

// the plugin registers each theme with the e4 theme engine, so it is picked under General >
// Appearance like Eclipse's own; the window, views and toolbars come from Eclipse's Light or
// Dark stylesheets and the editor colours from the same preferences the .epf files set, written
// as CSS preference rules that the engine applies whenever the theme is chosen
const ECLIPSE_PLUGIN = "com.zacess.themes.eclipse";
// Maven needs the feature's artifact id to differ from the bundle's while Tycho needs each to match
const ECLIPSE_FEATURE = `${ECLIPSE_PLUGIN}.feature`;
const ECLIPSE_BASE = {
  dark: { macosx: "e4-dark_mac.css", win32: "e4-dark_win.css", linux: "e4-dark_linux.css" },
  light: { macosx: "e4_default_mac.css", win32: "e4_default_win.css", linux: "e4_default_gtk.css" },
};
// the engine reads a theme as dark when its id contains "dark", which tells the TextMate editors
// and the operating system window frames which way to go, so the appearance leads every id
const eclipseThemeId = (theme) => `${ECLIPSE_PLUGIN}.${theme.appearance}.${theme.id}`;

function eclipseCss(theme) {
  const u = theme.ui;
  // Eclipse's Dark appearance colours the Console from a stylesheet bound to its own theme id
  // only, so a Zacess theme sets the Console from the palette instead
  const console = ["org.eclipse.debug.ui", [
    ["org.eclipse.debug.ui.consoleBackground", rgb(u.background)],
    ["org.eclipse.debug.ui.outColor", rgb(u.foreground)],
    ["org.eclipse.debug.ui.errorColor", rgb(u.error)],
    ["org.eclipse.debug.ui.inColor", rgb(theme.syntax.function)],
  ]];
  // the pseudo class names this plugin, so its rules sit beside every other plugin's rules for
  // the same preference node instead of replacing them
  const rule = ([node, entries]) => [
    `IEclipsePreferences#${node.replaceAll(".", "-")}:${ECLIPSE_PLUGIN.replaceAll(".", "-")} {`,
    "\tpreferences:",
    ...entries.map(([k, v]) => `\t\t'${k}=${v}'`),
    "}",
    "",
  ];
  return [
    `/* ${theme.name} for Eclipse, ${HEADER} */`,
    "",
    // Eclipse's own Dark preference stylesheet is not imported: its rules for the same keys would
    // win over these, whatever their order
    ...[...eclipsePrefs(theme), console].flatMap(rule),
  ].join("\n");
}

function eclipsePluginXml() {
  const themes = palette.themes.flatMap((theme) => Object.entries(ECLIPSE_BASE[theme.appearance]).map(([os, css]) =>
    `    <theme id="${eclipseThemeId(theme)}" label="${theme.name}" os="${os}" basestylesheeturi="platform:/plugin/org.eclipse.ui.themes/css/${css}"/>`));
  const sheets = palette.themes.map((theme) =>
    `    <stylesheet uri="css/${slug(theme)}.css">\n      <themeid refid="${eclipseThemeId(theme)}"/>\n    </stylesheet>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?eclipse version="3.4"?>',
    `<!-- ${HEADER} -->`,
    "<plugin>",
    '  <extension point="org.eclipse.e4.ui.css.swt.theme">',
    ...themes,
    ...sheets,
    "  </extension>",
    "</plugin>",
    "",
  ].join("\n");
}

// the feature, the update site and the Maven build that packs them; the bundle holds no code,
// so it needs nothing from Eclipse to build and the version is the palette's, with no qualifier
function eclipseBuildFiles() {
  const v = palette.version;
  const dir = "editors/eclipse";
  const licence = readFileSync(join(ROOT, "LICENSE"), "utf8").trim();
  const xml = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const pom = (artifactId, packaging, extra = "") => [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<!-- ${HEADER} -->`,
    '<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">',
    "  <modelVersion>4.0.0</modelVersion>",
    "  <parent>",
    "    <groupId>com.zacess.themes</groupId>",
    "    <artifactId>eclipse-parent</artifactId>",
    `    <version>${v}</version>`,
    "  </parent>",
    `  <artifactId>${artifactId}</artifactId>`,
    `  <packaging>${packaging}</packaging>`,
    ...(extra ? [extra] : []),
    "</project>",
    "",
  ].join("\n");
  return {
    [`${dir}/pom.xml`]: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!-- ${HEADER} -->`,
      '<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">',
      "  <modelVersion>4.0.0</modelVersion>",
      "  <groupId>com.zacess.themes</groupId>",
      "  <artifactId>eclipse-parent</artifactId>",
      `  <version>${v}</version>`,
      "  <packaging>pom</packaging>",
      "  <properties>",
      "    <tycho.version>5.0.4</tycho.version>",
      "    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>",
      "  </properties>",
      "  <modules>",
      "    <module>plugin</module>",
      "    <module>feature</module>",
      "    <module>site</module>",
      "  </modules>",
      "  <build>",
      "    <plugins>",
      "      <plugin>",
      "        <groupId>org.eclipse.tycho</groupId>",
      "        <artifactId>tycho-maven-plugin</artifactId>",
      "        <version>${tycho.version}</version>",
      "        <extensions>true</extensions>",
      "      </plugin>",
      "    </plugins>",
      "  </build>",
      "</project>",
      "",
    ].join("\n"),
    [`${dir}/plugin/pom.xml`]: pom(ECLIPSE_PLUGIN, "eclipse-plugin"),
    [`${dir}/plugin/build.properties`]: `# ${HEADER}\nbin.includes = META-INF/,plugin.xml,css/\n`,
    [`${dir}/plugin/META-INF/MANIFEST.MF`]: [
      "Manifest-Version: 1.0",
      "Bundle-ManifestVersion: 2",
      "Bundle-Name: Zacess Themes",
      "Bundle-Vendor: Zacess",
      // singleton, as every bundle that contributes extensions must be
      `Bundle-SymbolicName: ${ECLIPSE_PLUGIN};singleton:=true`,
      `Bundle-Version: ${v}`,
      "Bundle-License: MIT",
      `Bundle-DocURL: ${REPO}`,
      "Automatic-Module-Name: com.zacess.themes.eclipse",
      "",
    ].join("\n"),
    [`${dir}/plugin/plugin.xml`]: eclipsePluginXml(),
    [`${dir}/feature/pom.xml`]: pom(ECLIPSE_FEATURE, "eclipse-feature"),
    [`${dir}/feature/build.properties`]: `# ${HEADER}\nbin.includes = feature.xml\n`,
    [`${dir}/feature/feature.xml`]: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!-- ${HEADER} -->`,
      `<feature id="${ECLIPSE_FEATURE}" label="Zacess Themes" version="${v}" provider-name="Zacess">`,
      `  <description url="${REPO}">${xml(`High contrast colour themes with every text and syntax colour at 7:1 contrast or more: ${palette.themes.map((t) => t.name).join(", ").replace(/, ([^,]*)$/, " and $1")}. Choose one under General, Appearance.`)}</description>`,
      `  <copyright url="${REPO}">Copyright (c) 2026 Zacess</copyright>`,
      `  <license url="${REPO}/blob/main/LICENSE">${xml(licence)}</license>`,
      `  <plugin id="${ECLIPSE_PLUGIN}" version="${v}"/>`,
      "</feature>",
      "",
    ].join("\n"),
    [`${dir}/site/pom.xml`]: pom("eclipse-site", "eclipse-repository", [
      "  <build>",
      "    <plugins>",
      "      <plugin>",
      "        <groupId>org.eclipse.tycho</groupId>",
      "        <artifactId>tycho-p2-repository-plugin</artifactId>",
      "        <version>${tycho.version}</version>",
      "        <configuration>",
      "          <repositoryName>Zacess Themes</repositoryName>",
      "          <includeAllDependencies>false</includeAllDependencies>",
      "        </configuration>",
      "      </plugin>",
      "    </plugins>",
      "  </build>",
    ].join("\n")),
    [`${dir}/site/category.xml`]: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!-- ${HEADER} -->`,
      "<site>",
      `  <feature id="${ECLIPSE_FEATURE}" version="0.0.0">`,
      '    <category name="zacess"/>',
      "  </feature>",
      '  <category-def name="zacess" label="Zacess Themes"/>',
      "</site>",
      "",
    ].join("\n"),
  };
}

function buildEclipse() {
  for (const theme of palette.themes) {
    write(`editors/eclipse/${theme.name}.epf`, eclipseEpf(theme));
    write(`editors/eclipse/plugin/css/${slug(theme)}.css`, eclipseCss(theme));
  }
  for (const [path, content] of Object.entries(eclipseBuildFiles())) write(path, content);
}

// ---------------------------------------------------------------- Xcode

// an Xcode theme is an XML property list in ~/Library/Developer/Xcode/UserData/FontAndColorThemes,
// named after its file; Xcode 26 and earlier use it as it is and Xcode 27 imports it as a classic
// theme; every key here appears in the themes Xcode 27.1 ships, listed in XCODE_KEYS and
// XCODE_SYNTAX_KEYS
const xcodeColour = (hex) => `${parseHex(hex).map((v) => Number((v / 255).toFixed(6))).join(" ")} 1`;

// Xcode registers SF Mono in its Regular, Bold and italic cuts at launch, so these names resolve
// on any Mac with Xcode installed; 12 points is Xcode's own default size
const XCODE_SIZE = "12.0";
const xcodeFont = (bold, italic) => `SFMono-${bold ? "Bold" : "Regular"}${italic ? "Italic" : ""} - ${XCODE_SIZE}`;

// each Xcode syntax type with the palette token that colours it; Xcode has no type for operators,
// parameters or invalid code, so those show in the plain text colour, which keeps 7:1
const XCODE_SYNTAX = [
  ["plain", "foreground"],
  ["keyword", "keyword"],
  ["preprocessor", "control"],
  ["comment", "comment"],
  ["comment.doc", "comment"],
  ["comment.doc.keyword", "comment"],
  ["mark", "control"],
  ["string", "string"],
  ["character", "string"],
  ["number", "number"],
  ["url", "function"],
  ["attribute", "attribute"],
  ["declaration.type", "type"],
  ["declaration.other", "function"],
  ["identifier.class", "type"],
  ["identifier.class.system", "type"],
  ["identifier.type", "type"],
  ["identifier.type.system", "type"],
  ["identifier.function", "function"],
  ["identifier.function.system", "function"],
  ["identifier.macro", "function"],
  ["identifier.macro.system", "function"],
  ["identifier.constant", "number"],
  ["identifier.constant.system", "number"],
  // Xcode colours instance variables and globals here and leaves locals plain, so these are properties
  ["identifier.variable", "property"],
  ["identifier.variable.system", "property"],
  ["markup.aside.kind", "keyword"],
  ["markup.code", "foreground"],
];

function xcodeTheme(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const colours = {};
  const fonts = {};
  for (const [type, token] of XCODE_SYNTAX) {
    const key = `xcode.syntax.${type}`;
    colours[key] = xcodeColour(s[token]);
    fonts[key] = xcodeFont(has(token, "bold"), has(token, "italic"));
  }
  // documentation tags such as - Parameter, aside kinds such as - Note and MARK: comments are bold
  // italic, as the Javadoc tags and TODO markers are in the JetBrains scheme; Xcode fonts have no
  // underline, so links are told apart by colour alone
  for (const type of ["comment.doc.keyword", "markup.aside.kind", "mark"]) fonts[`xcode.syntax.${type}`] = xcodeFont(true, true);

  const keys = {
    DVTSourceTextBackground: xcodeColour(u.background),
    DVTSourceTextCurrentLineHighlightColor: xcodeColour(u.lineHighlight),
    DVTSourceTextInsertionPointColor: xcodeColour(u.cursor),
    DVTSourceTextInvisiblesColor: xcodeColour(u.whitespace),
    // Xcode has no selected text colour, so its selections keep each token's own colour
    DVTSourceTextSelectionColor: xcodeColour(u.selection),
    // the dimmed area around a focused block keeps text on it, so it is a surface every syntax
    // colour keeps 7:1 over
    DVTSourceTextBlockDimBackgroundColor: xcodeColour(u.surfaceAlt),
    // the line the debugger is stopped on is filled, so it uses the added line background, which
    // every syntax colour keeps 7:1 over
    DVTDebuggerInstructionPointerColor: xcodeColour(u.diffAddedBackground),
    // the console sets the program's output apart from the debugger's by weight and the muted colour
    DVTConsoleTextBackgroundColor: xcodeColour(u.background),
    DVTConsoleTextInsertionPointColor: xcodeColour(u.cursor),
    DVTConsoleTextSelectionColor: xcodeColour(u.selection),
    DVTConsoleExectuableOutputTextColor: xcodeColour(u.foreground),
    DVTConsoleExectuableOutputTextFont: xcodeFont(false, false),
    DVTConsoleExectuableInputTextColor: xcodeColour(u.foreground),
    DVTConsoleExectuableInputTextFont: xcodeFont(true, false),
    DVTConsoleDebuggerOutputTextColor: xcodeColour(u.muted),
    DVTConsoleDebuggerOutputTextFont: xcodeFont(false, false),
    DVTConsoleDebuggerInputTextColor: xcodeColour(u.foreground),
    DVTConsoleDebuggerInputTextFont: xcodeFont(true, false),
    DVTConsoleDebuggerPromptTextColor: xcodeColour(u.accent),
    DVTConsoleDebuggerPromptTextFont: xcodeFont(true, false),
    // rendered documentation sits on a panel, so its text uses the interface colours, which keep
    // 7:1 on the panel surface; the fonts are the sizes Xcode's own themes use
    DVTMarkupTextBackgroundColor: xcodeColour(u.surface),
    DVTMarkupTextBorderColor: xcodeColour(u.border),
    DVTMarkupTextNormalColor: xcodeColour(u.foreground),
    DVTMarkupTextNormalFont: ".AppleSystemUIFont - 10.0",
    DVTMarkupTextEmphasisColor: xcodeColour(u.foreground),
    DVTMarkupTextEmphasisFont: ".AppleSystemUIFontItalic - 10.0",
    DVTMarkupTextStrongColor: xcodeColour(u.foreground),
    DVTMarkupTextStrongFont: ".AppleSystemUIFontBold - 10.0",
    DVTMarkupTextLinkColor: xcodeColour(u.link),
    DVTMarkupTextLinkFont: ".AppleSystemUIFont - 10.0",
    DVTMarkupTextInlineCodeColor: xcodeColour(u.foreground),
    DVTMarkupTextCodeFont: "SFMono-Regular - 10.0",
    DVTMarkupTextPrimaryHeadingColor: xcodeColour(u.foreground),
    DVTMarkupTextPrimaryHeadingFont: ".AppleSystemUIFont - 24.0",
    DVTMarkupTextSecondaryHeadingColor: xcodeColour(u.foreground),
    DVTMarkupTextSecondaryHeadingFont: ".AppleSystemUIFont - 18.0",
    DVTMarkupTextOtherHeadingColor: xcodeColour(u.muted),
    DVTMarkupTextOtherHeadingFont: ".AppleSystemUIFont - 14.0",
    DVTScrollbarMarkerErrorColor: xcodeColour(u.error),
    DVTScrollbarMarkerWarningColor: xcodeColour(u.warning),
    DVTScrollbarMarkerAnalyzerColor: xcodeColour(u.info),
    DVTScrollbarMarkerRuntimeIssueColor: xcodeColour(s.keyword),
    DVTScrollbarMarkerBreakpointColor: xcodeColour(u.accent),
    DVTScrollbarMarkerDiffColor: xcodeColour(s.changed),
    DVTScrollbarMarkerDiffConflictColor: xcodeColour(u.error),
  };

  const entry = (key, value, indent) => [`${indent}<key>${key}</key>`, `${indent}<string>${value}</string>`];
  const dict = (key, values) => [
    `\t<key>${key}</key>`,
    "\t<dict>",
    ...Object.keys(values).sort().flatMap((k) => entry(k, values[k], "\t\t")),
    "\t</dict>",
  ];
  const body = {
    ...Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, entry(k, v, "\t")])),
    DVTFontAndColorVersion: ["\t<key>DVTFontAndColorVersion</key>", "\t<integer>1</integer>"],
    DVTLineSpacing: ["\t<key>DVTLineSpacing</key>", "\t<real>1.1</real>"],
    DVTSourceTextSyntaxColors: dict("DVTSourceTextSyntaxColors", colours),
    DVTSourceTextSyntaxFonts: dict("DVTSourceTextSyntaxFonts", fonts),
  };
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
    `<!-- ${theme.name} for Xcode, ${HEADER} -->`,
    "<plist version=\"1.0\">",
    "<dict>",
    ...Object.keys(body).sort().flatMap((k) => body[k]),
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

function buildXcode() {
  for (const theme of palette.themes) write(`editors/xcode/${theme.name}.xccolortheme`, xcodeTheme(theme));
}

// ---------------------------------------------------------------- terminals

function terminalColours(theme) {
  const u = theme.ui;
  return {
    background: u.background,
    ...terminalText(theme),
    cursorText: u.background,
    selection: u.selectionStrong,
    selectionText: u.selectionForeground,
    ansi: theme.terminal.ansi,
  };
}

function iterm(theme) {
  const t = terminalColours(theme);
  const entry = (key, hex) => {
    const [r, g, b] = parseHex(hex).map((v) => (v / 255).toFixed(6));
    return [
      `\t<key>${key}</key>`,
      "\t<dict>",
      "\t\t<key>Alpha Component</key>",
      "\t\t<real>1</real>",
      "\t\t<key>Blue Component</key>",
      `\t\t<real>${b}</real>`,
      "\t\t<key>Color Space</key>",
      "\t\t<string>sRGB</string>",
      "\t\t<key>Green Component</key>",
      `\t\t<real>${g}</real>`,
      "\t\t<key>Red Component</key>",
      `\t\t<real>${r}</real>`,
      "\t</dict>",
    ].join("\n");
  };
  const keys = {};
  t.ansi.forEach((c, i) => { keys[`Ansi ${i} Color`] = c; });
  Object.assign(keys, {
    "Background Color": t.background,
    "Badge Color": theme.ui.accent,
    "Bold Color": t.foreground,
    "Cursor Color": t.cursor,
    "Cursor Guide Color": theme.ui.lineHighlight,
    "Cursor Text Color": t.cursorText,
    "Foreground Color": t.foreground,
    "Link Color": theme.ui.link,
    "Selected Text Color": t.selectionText,
    "Selection Color": t.selection,
  });
  const sorted = Object.keys(keys).sort();
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
    `<!-- ${HEADER} -->`,
    "<plist version=\"1.0\">",
    "<dict>",
    ...sorted.map((k) => entry(k, keys[k])),
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

function alacritty(theme) {
  const t = terminalColours(theme);
  const names = ANSI_NAMES.slice(0, 8);
  return [
    `# ${theme.name}`,
    `# ${HEADER}`,
    "",
    "[colors.primary]",
    `background = "${t.background}"`,
    `foreground = "${t.foreground}"`,
    "",
    "[colors.cursor]",
    `cursor = "${t.cursor}"`,
    `text = "${t.cursorText}"`,
    "",
    "[colors.selection]",
    `background = "${t.selection}"`,
    `text = "${t.selectionText}"`,
    "",
    "[colors.normal]",
    ...names.map((n, i) => `${n} = "${t.ansi[i]}"`),
    "",
    "[colors.bright]",
    ...names.map((n, i) => `${n} = "${t.ansi[i + 8]}"`),
    "",
    "# dim text keeps the normal colours, so it never drops below their floor",
    "[colors.dim]",
    ...names.map((n, i) => `${n} = "${t.ansi[i]}"`),
    "",
  ].join("\n");
}

function kitty(theme) {
  const t = terminalColours(theme);
  return [
    `# ${theme.name}`,
    `# ${HEADER}`,
    "",
    `background ${t.background}`,
    `foreground ${t.foreground}`,
    `cursor ${t.cursor}`,
    `cursor_text_color ${t.cursorText}`,
    `selection_background ${t.selection}`,
    `selection_foreground ${t.selectionText}`,
    `url_color ${theme.ui.link}`,
    `active_border_color ${theme.ui.accent}`,
    `inactive_border_color ${theme.ui.border}`,
    `active_tab_background ${theme.ui.background}`,
    `active_tab_foreground ${theme.ui.foreground}`,
    `inactive_tab_background ${theme.ui.surfaceAlt}`,
    `inactive_tab_foreground ${theme.ui.muted}`,
    ...t.ansi.map((c, i) => `color${i} ${c}`),
    "",
  ].join("\n");
}

function ghostty(theme) {
  const t = terminalColours(theme);
  return [
    `# ${theme.name}`,
    `# ${HEADER}`,
    "",
    ...t.ansi.map((c, i) => `palette = ${i}=${c}`),
    `background = ${t.background}`,
    `foreground = ${t.foreground}`,
    `cursor-color = ${t.cursor}`,
    `cursor-text = ${t.cursorText}`,
    `selection-background = ${t.selection}`,
    `selection-foreground = ${t.selectionText}`,
    "",
  ].join("\n");
}

function windowsTerminal() {
  const names = ["black", "red", "green", "yellow", "blue", "purple", "cyan", "white"];
  const cap = (n) => n[0].toUpperCase() + n.slice(1);
  return json({
    schemes: palette.themes.map((theme) => {
      const t = terminalColours(theme);
      const scheme = {
        name: theme.name,
        background: t.background,
        foreground: t.foreground,
        cursorColor: t.cursor,
        selectionBackground: t.selection,
      };
      names.forEach((n, i) => { scheme[n] = t.ansi[i]; });
      names.forEach((n, i) => { scheme[`bright${cap(n)}`] = t.ansi[i + 8]; });
      return scheme;
    }),
  });
}

// Terminal.app stores each colour as an NSKeyedArchiver archive of an NSColor in sRGB (NSSpaceID
// 12), so the profile shows exactly the palette's values; the device RGB form Terminal.app's own
// older profiles use is converted to the display's space and comes out darker
function nsColour(hex) {
  const unit = (v) => String(Number((v / 255).toFixed(10)));
  const components = new TextEncoder().encode(`${parseHex(hex).map(unit).join(" ")} 1`);
  return bplist({
    $archiver: "NSKeyedArchiver",
    $version: 100000,
    $top: { root: new UID(1) },
    $objects: [
      "$null",
      { $class: new UID(4), NSColorSpace: 1, NSComponents: components, NSCustomColorSpace: new UID(2), NSRGB: new Uint8Array([...components, 0]) },
      { $class: new UID(3), NSSpaceID: 12 },
      { $classes: ["NSColorSpace", "NSObject"], $classname: "NSColorSpace" },
      { $classes: ["NSColor", "NSObject"], $classname: "NSColor" },
    ],
  });
}

const TERMINAL_APP_ANSI = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];

function terminalApp(theme) {
  const t = terminalColours(theme);
  const data = (bytes) => {
    const b64 = Buffer.from(bytes).toString("base64");
    return ["\t<data>", ...b64.match(/.{1,68}/g).map((l) => `\t${l}`), "\t</data>"];
  };
  const colours = {
    BackgroundColor: t.background,
    TextColor: t.foreground,
    TextBoldColor: t.foreground,
    CursorColor: t.cursor,
    // Terminal.app has no selected text colour: selected text keeps its own colour, so the
    // selection is the background only one the checks hold the terminal text to 7:1 over
    SelectionColor: theme.ui.selection,
  };
  TERMINAL_APP_ANSI.forEach((n, i) => {
    colours[`ANSI${n}Color`] = t.ansi[i];
    colours[`ANSIBright${n}Color`] = t.ansi[i + 8];
  });
  const entries = {
    ...Object.fromEntries(Object.entries(colours).map(([k, v]) => [k, ["\t<key>" + k + "</key>", ...data(nsColour(v))]])),
    ProfileCurrentVersion: ["\t<key>ProfileCurrentVersion</key>", "\t<real>2.09</real>"],
    // bold text keeps its own colour rather than switching to the bright row
    UseBrightBold: ["\t<key>UseBrightBold</key>", "\t<false/>"],
    name: ["\t<key>name</key>", `\t<string>${xmlEscape(theme.name)}</string>`],
    type: ["\t<key>type</key>", "\t<string>Window Settings</string>"],
  };
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
    `<!-- ${HEADER} -->`,
    "<plist version=\"1.0\">",
    "<dict>",
    ...Object.keys(entries).sort().flatMap((k) => entries[k]),
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

// Warp's custom themes set the background, the text, an accent and the 16 colours; Warp draws its
// cursor and selection itself, so the theme cannot set them
function warp(theme) {
  const t = terminalColours(theme);
  const names = ANSI_NAMES.slice(0, 8);
  return [
    `# ${theme.name}`,
    `# ${HEADER}`,
    `name: ${theme.name}`,
    `accent: '${theme.ui.accent}'`,
    `background: '${t.background}'`,
    `foreground: '${t.foreground}'`,
    `details: ${theme.appearance === "dark" ? "darker" : "lighter"}`,
    "terminal_colors:",
    "  normal:",
    ...names.map((n, i) => `    ${n}: '${t.ansi[i]}'`),
    "  bright:",
    ...names.map((n, i) => `    ${n}: '${t.ansi[i + 8]}'`),
    "",
  ].join("\n");
}

// a WezTerm colour scheme file, read from ~/.config/wezterm/colors and chosen by its name
function wezterm(theme) {
  const t = terminalColours(theme);
  const list = (values) => `[${values.map((v) => `"${v}"`).join(", ")}]`;
  return [
    `# ${theme.name}`,
    `# ${HEADER}`,
    "",
    "[colors]",
    `background = "${t.background}"`,
    `foreground = "${t.foreground}"`,
    `cursor_bg = "${t.cursor}"`,
    `cursor_border = "${t.cursor}"`,
    `cursor_fg = "${t.cursorText}"`,
    `selection_bg = "${t.selection}"`,
    `selection_fg = "${t.selectionText}"`,
    `ansi = ${list(t.ansi.slice(0, 8))}`,
    `brights = ${list(t.ansi.slice(8))}`,
    "",
    "[metadata]",
    `name = "${theme.name}"`,
    `origin_url = "${REPO}"`,
    "",
  ].join("\n");
}

// btop draws every text slot straight on the terminal background, so each text slot is the
// terminal text, the muted text or one of the 16 terminal colours, which already keep their
// contrast on it. A slot a theme uses as a background shade gives way to the text colour. Box
// outlines, meters and graphs are not text; each box keeps its own hue so the four boxes are told
// apart by colour as well as by their titles
function btop(theme) {
  const t = terminalColours(theme);
  const u = theme.ui;
  const slot = (i) => (theme.terminal.backgroundRole.includes(i) ? t.foreground : t.ansi[i]);
  const [red, green, yellow, blue, magenta, cyan] = [1, 2, 3, 4, 5, 6].map(slot);
  const [brightRed, brightGreen, brightBlue, brightMagenta, brightCyan] = [9, 10, 12, 13, 14].map(slot);
  const values = [
    ["main_bg", t.background], ["main_fg", t.foreground], ["title", t.foreground],
    ["hi_fg", cyan], ["selected_bg", t.selection], ["selected_fg", t.selectionText],
    ["inactive_fg", u.muted], ["graph_text", t.foreground], ["meter_bg", u.lineHighlight],
    ["proc_misc", cyan], ["cpu_box", green], ["mem_box", yellow], ["net_box", magenta], ["proc_box", blue],
    ["div_line", u.muted],
    ["temp_start", green], ["temp_mid", yellow], ["temp_end", red],
    ["cpu_start", green], ["cpu_mid", yellow], ["cpu_end", red],
    ["free_start", green], ["free_mid", green], ["free_end", brightGreen],
    ["cached_start", blue], ["cached_mid", blue], ["cached_end", brightBlue],
    ["available_start", cyan], ["available_mid", cyan], ["available_end", brightCyan],
    ["used_start", red], ["used_mid", red], ["used_end", brightRed],
    ["download_start", magenta], ["download_mid", magenta], ["download_end", brightMagenta],
    ["upload_start", green], ["upload_mid", green], ["upload_end", brightGreen],
    ["process_start", cyan], ["process_mid", blue], ["process_end", magenta],
  ];
  return [`# ${theme.name}`, `# ${HEADER}`, "", ...values.map(([key, value]) => `theme[${key}]="${value}"`), ""].join("\n");
}

function buildTerminals() {
  for (const theme of palette.themes) {
    const name = slug(theme);
    write(`editors/terminals/iterm2/${theme.name}.itermcolors`, iterm(theme));
    write(`editors/terminals/alacritty/${name}.toml`, alacritty(theme));
    write(`editors/terminals/kitty/${name}.conf`, kitty(theme));
    write(`editors/terminals/ghostty/${name}`, ghostty(theme));
    write(`editors/terminals/terminal-app/${theme.name}.terminal`, terminalApp(theme));
    write(`editors/terminals/warp/${name}.yaml`, warp(theme));
    write(`editors/terminals/wezterm/${theme.name}.toml`, wezterm(theme));
    write(`editors/terminals/btop/${name}.theme`, btop(theme));
  }
  write("editors/terminals/windows-terminal/zacess.json", windowsTerminal());
}

// ---------------------------------------------------------------- docs

function replaceBetween(path, marker, body) {
  const full = join(ROOT, path);
  const text = readFileSync(full, "utf8");
  const start = `<!-- ${marker} start: generated by scripts/build.mjs -->`;
  const end = `<!-- ${marker} end -->`;
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i < 0 || j < 0) throw new Error(`${path} is missing the ${marker} markers`);
  const next = `${text.slice(0, i + start.length)}\n${body}\n${text.slice(j)}`;
  if (next !== text) writeFileSync(full, next);
  written.push(path);
}

// every syntax role with its font style and its colour in each theme, so the palette can be read
// without opening palette/zacess.json
function paletteTable() {
  const names = palette.themes.map((theme) => theme.name.replace(/^Zacess /, ""));
  const lines = [`| Role | Style | ${names.join(" | ")} |`, `| --- | --- | ${names.map(() => "---").join(" | ")} |`];
  const cell = (hex) => `\`${hex}\``;
  lines.push(`| Background | | ${palette.themes.map((theme) => cell(theme.ui.background)).join(" | ")} |`);
  lines.push(`| Text | | ${palette.themes.map((theme) => cell(theme.syntax.foreground)).join(" | ")} |`);
  for (const [token, spec] of Object.entries(palette.tokens)) {
    const style = (spec.style ?? []).join(", ") || "plain";
    lines.push(`| ${token}: ${spec.description} | ${style} | ${palette.themes.map((theme) => cell(theme.syntax[token])).join(" | ")} |`);
  }
  return lines.join("\n");
}

function buildDocs() {
  const tables = contrastTables(palette);
  replaceBetween("docs/palette.md", "palette table", paletteTable());
  replaceBetween("docs/contrast.md", "contrast summary", tables.summary);
  replaceBetween("ACCESSIBILITY.md", "contrast detail", tables.detail);
  replaceBetween("ACCESSIBILITY.md", "selection detail", tables.selection);
  replaceBetween("ACCESSIBILITY.md", "signals detail", tables.signals);
  replaceBetween("ACCESSIBILITY.md", "interface detail", tables.ui);
  replaceBetween("ACCESSIBILITY.md", "terminal detail", tables.terminal);
  replaceBetween("ACCESSIBILITY.md", "colour vision detail", tables.vision);
}

buildVscode();
buildJetbrains();
buildObsidian();
buildNeovim();
buildZed();
buildSublime();
buildHelix();
buildEmacs();
buildEclipse();
buildXcode();
buildTerminals();
buildDocs();
console.log(`wrote ${written.length} files from palette/zacess.json`);
