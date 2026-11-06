# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The Zacess Themes mark in `assets/` in light, dark, automatic and single colour versions, with a light and a dark lockup at the head of the README. A dark and a light banner and a 1280 by 640 social preview image sit beside them.
- The VS Code and JetBrains icons use the Zacess Themes mark. The stores show it from the next release.
- All eight themes for Chrome and Firefox in `browsers/`, written by `npm run build` from the palette. Each colours the tab strip, toolbar, address bar and new tab page. The build refuses one whose text falls below 7:1 on any of them. The high and deep contrast themes draw the tab strip in their border colour. They are submitted to the Chrome Web Store and Firefox Add-ons. Microsoft Edge Add-ons does not accept themes, so Edge installs the Chrome versions.
- `npm run preview` draws a 1280 by 800 store image of each browser theme in `previews/browsers/`. `assets/` has the 128 pixel store icon and a 440 by 280 promotional tile.
- Each release attaches a Chrome zip and a Firefox zip of every browser theme.

## [0.12.1] - 2026-11-05

### Fixed

- Errors and warnings no longer look alike under simulated colour vision deficiency. In Zacess Light, Dark, Cream, High Contrast Light and Deep Contrast Light the two colours were under 0.05 apart in tone and under 0.04 apart in OKLab under protanopia, deuteranopia or tritanopia (Machado 2009 at full severity), so a warning could pass for an error. On the four light themes the warning becomes a burnt orange, the most colourful shade that still meets 7:1. Zacess Dark keeps its hue and moves in lightness. Each is given with its lowest contrast on the background and the two surfaces: Zacess Light `#583600` to `#843800` (7.0:1), Zacess Dark `#ffd182` to `#edc071` (9.2:1), Zacess Cream `#513100` to `#803200` (7.0:1), Zacess High Contrast Light `#5a3a00` to `#4e1c00` (12.2:1) and Zacess Deep Contrast Light `#674100` to `#642600` (11.5:1). Every editor and terminal colour drawn from the warning follows it, as does the orange highlight tint in Obsidian.

### Added

- `npm run check` measures error and warning as a colour vision pair in every theme, held to the same tone step (0.05) and simulated OKLab distance (0.04) as the paired syntax tokens. A pair in the palette can name two interface colours with `"ui": true`.

## [0.12.0] - 2026-11-04

### Added

- The btop themes set the process list's paused, followed and banner rows (`proc_pause_bg`, `proc_follow_bg`, `proc_banner_bg`, `proc_banner_fg`, `followed_bg` and `followed_fg`), which newer btop releases read. Each takes a palette background the main text keeps at 9:1 or better. The three differ in hue from one another and from the selected row.

## [0.11.0] - 2026-11-04

### Fixed

- The Obsidian themes pass the theme directory's lint. Each manifest names Obsidian 1.5.0 as its lowest version, so the lint no longer checks the stylesheet against an old Obsidian and reports `text-decoration` as partly supported. The reduced-motion rule wins on specificity alone (its selector carries an id, which outranks every animation and transition rule in Obsidian's own stylesheet) instead of `!important`, which the lint refuses. `npm run check` now fails on any `!important` in an Obsidian theme and on any other lowest version.
- `scripts/release.mjs` attaches the workflow's built files to a GitHub release that exists already, uploading only the files the release lacks, where it skipped the release altogether and left one made from the tag with no files. A dry run says how many of the built files are attached and which it would upload.

## [0.10.0] - 2026-11-04

### Fixed

- The Obsidian themes paint the workspace chrome (the ribbon, both sidebars, the tab bars, the vault profile, the status bar and the title bar) in each mode's own colours with rules that outrank a body class left behind by another theme's plugin or an old setting, so light mode no longer shows dark sidebars where such a class is present. The variable blocks carry the same precedence.
- The graph view draws every node in a palette colour: notes in the outline colour, the open note in the find match outline colour, tags in the added colour, attachments in the warning colour and unresolved notes in the text colour. Nodes were the muted grey before.

## [0.9.0] - 2026-11-03

### Changed

- Obsidian ships as four community themes instead of one theme with a plugin option: Zacess (Light and Dark), Zacess Cream (Cream and Yellow on Black), Zacess High Contrast and Zacess Deep Contrast, each following Obsidian's own base colour scheme setting between its light and dark look. The Style Settings plugin is no longer needed. Each theme has its own folder under `editors/obsidian/` and its own read-only copy: zacesshq/obsidian-theme, obsidian-theme-cream, obsidian-theme-high-contrast and obsidian-theme-deep-contrast.
- The Obsidian themes cover every surface Obsidian draws, where they covered tags, checkboxes, hover states and search before: headings, links, lists, quotes, rules, code in reading and editing view, tables, embeds, properties, footnotes, every callout type, the file explorer and every other tree, tabs, the ribbon, dividers, the status bar, the title bar, menus, the command palette and every other prompt, suggestions, modals, settings, notices, tooltips, inputs, toggles, sliders, pills, the graph view, canvas, Bases table, card and kanban views, the PDF viewer, Sync avatars and Mermaid diagrams. Every colour is a palette colour and the six named highlight colours are measured tints of one.
- Colour is never the only signal in Obsidian: the active tab, the open file, a selected row and a selected suggestion carry a bar in the focus colour, a highlight is underlined in the find match outline colour, callouts keep their icon and a thicker start edge, inputs and buttons have a real border and every control shows a focus ring.
- Community files follow the [AI policy](https://github.com/zacesshq/.github/blob/main/AI_POLICY.md): pull requests declare AI use and issue forms ask whether AI helped. Security reports go to security@zacess.com.
- Routine tidy-up.

### Added

- `npm run check` reads every Obsidian theme's light and dark blocks back out of its stylesheet and measures every text colour at 7:1 on every fill it can sit on, secondary text at 4.5:1 over a selection or a hovered row and every border, outline, icon and mark at 3:1. It also proves both blocks of every theme set the same variables and that every variable a block refers to is set.
- `scripts/screenshot/`: a mock of an Obsidian window drawn from each theme's variables and a Playwright script that renders it as the theme's `screenshot.png`, light look on the left and dark look on the right, so the directory screenshots follow the palette.
- `scripts/release.mjs` updates all four Obsidian copies, copying each theme's README, screenshot and licence with the generated files. The release workflow attaches one zip per Obsidian theme.

## [0.8.0] - 2026-11-01

### Added

- `install.ps1` installs the btop themes on Windows: set `$env:ZACESS_THEMES_APP` to `btop` and it finds btop4win (winget installs included) and copies the eight themes into the `themes` folder beside it. Windows Terminal stays the default. `npm run check` now proves the PowerShell installer lists every theme too.

## [0.7.0] - 2026-11-01

### Added

- btop themes: all eight Zacess themes for the btop system monitor (btop4win on Windows) in `editors/terminals/btop/`, written by `scripts/build.mjs` from the palette. Every text slot is the terminal text, the muted text or a terminal colour, so btop keeps the terminal contrast. The four boxes keep their own colours as well as their titles. `install.sh` copies them with `bash -s -- btop` and `npm run check` measures the selected row.

## [0.6.1] - 2026-10-29

### Changed

- The README is a short front page: the themes, their previews, a one-line install for each app that links to its own guide and the terminal installer. The contrast summary and floors moved to `docs/contrast.md`, the pipeline and layout to `docs/how-it-works.md` and the shell colour settings to `docs/shell-colours.md`. `scripts/build.mjs` writes the contrast summary into `docs/contrast.md`.

### Added

- `docs/palette.md`, a table of every syntax role with its font style and its colour in all eight themes, written by `scripts/build.mjs` from the palette.
- `docs/recommended-settings.md`: following the system light and dark setting in VS Code, Zed, the JetBrains IDEs, Ghostty and Obsidian. It also lists the minimum contrast setting in each terminal that has one.

## [0.6.0] - 2026-10-28

### Changed

- The current line is a visible band in all eight themes. It sat at about 1.1:1 on the background, so the line the cursor was on could be lost. It now sits at 1.3:1 to 1.4:1 in a neutral or calm tint from each theme's palette: Zacess Light `#d6dde8`, Dark `#2f2f2f`, Yellow on Black `#262626`, Cream `#c8dadd`, High Contrast Dark `#262626`, High Contrast Light `#c3e5fe`, Deep Contrast Dark `#262626` and Deep Contrast Light `#c8debd`. Plain text, the active line number and the cursor keep 7:1 over it and every syntax colour keeps 4.5:1 or more.
- The find match is stronger in the dark themes so it stays apart from the new current line: Zacess Dark `#4d4000`, Yellow on Black `#4b3a00`, High Contrast Dark `#493900` and Deep Contrast Dark `#453800`. Plain text keeps 9:1 or more over it and every syntax colour 4.5:1 or more.
- Other find matches, the word under the cursor and a matched bracket are outlined or underlined with no fill in VS Code, the JetBrains IDEs, Neovim, Helix, Emacs and Obsidian, so they never hide a character or pass for the current match or a selection. Zed, which cannot draw an outline there, fills them in the calm selected row colour.
- Zacess Yellow on Black draws terminal text in its yellow `#ffeb3b` (17.1:1 on black) instead of white, matching its editor. The cursor stays yellow.
- Zacess Yellow on Black marks the word under the cursor with a dashed underline in Neovim and a dotted one in the JetBrains IDEs, set by the new optional `wordOutline` in the palette, so it no longer relies on colour alone to stand apart from the outlined find matches. VS Code and Zed offer no line style there, so they keep the solid outline.
- Bold text in Terminal.app keeps its colour and Alacritty's dim text keeps the normal colours.

### Added

- Terminal.app, Warp and WezTerm themes for all eight themes in `editors/terminals`. Terminal.app and WezTerm carry the cursor and WezTerm the selection block and the character under the cursor too.
- `install.sh`, which finds the terminal it runs in (Terminal.app, iTerm2, Ghostty, kitty, WezTerm, Warp, Alacritty or Windows Terminal), copies all eight themes to the folder that terminal reads and prints the one step that turns one on. It never edits a configuration file. `install.ps1` does the same for Windows Terminal through its settings fragments.
- The README has a table of every terminal with its file, where it goes and how to turn it on, plus zsh-syntax-highlighting and fish settings that use the ANSI colour names so command colours follow the active theme.
- Diff marks beside changed lines: the diff borders, overview ruler and gutter colours in VS Code, the gitsigns, mini.diff and vim-signify sign groups in Neovim, the `version_control` colours in Zed and the `diff-indicator` and `diff-hl` faces in Emacs.
- `rules.signalContrast` (1.3:1) and `rules.signalTextContrast` (4.5:1) in the palette. `npm run check` measures the current line band, every syntax colour over it, the cursor and the character under it in the editors and the terminals and the OKLab distance from the cursor to both selections, the current line and the find match. It reads the cursor, current line, find match, outlines, diff marks and the 16 terminal colours back out of every generated file and fails a highlight that should be an outline but has a fill. ACCESSIBILITY.md has a new Where you are section with every measurement.
- An optional `ui.matchOutline` in the palette for a theme whose accent is also its find match outline. Zacess High Contrast Dark outlines a written word and a matched bracket in light blue `#8fd0ff` so they never look like another find match.
- `terminal.nearText` in the palette lists the ANSI slots allowed to sit close to the terminal text in tone. Zacess Yellow on Black lists its bright red, green, yellow and magenta there.
- CI runs ShellCheck on the installer.

## [0.5.0] - 2026-10-28

### Changed

- Selected text is now easy to find in all eight themes. In the dark themes the old selection sat at only 1.2:1 to 1.4:1 on the background and in the light themes at about 1.1:1, so a selection could pass for the background. Each theme now has a selection block in a colour from its own palette with every selected character in one text colour, the way a terminal draws a selection: Zacess Light `#ffffff` on blue `#0150b2`, Dark `#121212` on sky blue `#4fbdff`, Yellow on Black `#000000` on cyan `#09bcc4`, Cream `#fdf6e3` on purple `#7401ca`, High Contrast Dark `#000000` on violet `#bf96ff`, High Contrast Light `#ffffff` on teal `#015f5e`, Deep Contrast Dark `#000000` on magenta `#ff70ff` and Deep Contrast Light `#ffffff` on magenta `#990098`. The text keeps 7.4:1 to 9:1 on the block and the block sits at 7.4:1 to 9:1 on the background.
- The block is used wherever a theme can set the colour of selected text: iTerm2, Ghostty, kitty, Alacritty, Windows Terminal, the VS Code terminal, the VS Code editor in the five high contrast themes, the JetBrains editor, console, terminal and text fields, the Eclipse editors and Terminal view, Sublime Text, Helix, Neovim in every buffer and Emacs.
- Where selected text keeps its own colour (the VS Code editor in Zacess Light, Dark and Cream, text fields in VS Code, Zed, Obsidian and Xcode) the selection is a fill in the same hue, as strong as the floors allow: 1.5:1 to 2.1:1 on the background with every syntax colour, muted text and link at 4.5:1 or more over it and plain text at 7:1.
- Selected rows in lists, trees, menus and completion popups keep their colours, now named `ui.listSelection` in the palette.

### Added

- `ui.selectionStrong`, `ui.selectionForeground` and `ui.listSelection` in the palette, with `rules.selectionContrast` (4.5:1) and `rules.selectionDistance` (0.08). `npm run check` measures both selections, the black or white text Windows Terminal draws on a selection and each selection's OKLab distance from the background, the current line, a find match and both diff backgrounds. It also reads the selection back out of every generated file. ACCESSIBILITY.md has a new Selection section with every measurement.
- Selection keys the themes did not set before: `terminal.selectionForeground`, `terminal.inactiveSelectionBackground`, `minimap.selectionHighlight`, `minimap.selectionOccurrenceHighlight` and `editorOverviewRuler.selectionHighlightForeground` in VS Code, `SELECTION_BACKGROUND_INACTIVE` and the text field selection colours in the JetBrains IDEs and `selection_foreground` with `inactive_selection_foreground` in Sublime Text.

## [0.4.0] - 2026-10-22

### Added

- The release workflow tells zacess.com about each new version through a `themes-release` repository dispatch, so the website rebuilds its themes page from the new palette straight away. It needs the `SITE_DISPATCH_TOKEN` secret and is skipped without it.
- Xcode themes in `editors/xcode`, one `.xccolortheme` per theme, copied into `~/Library/Developer/Xcode/UserData/FontAndColorThemes` and imported with Import Classic Theme under Settings, Themes in Xcode 27 or chosen there directly in Xcode 26 and earlier. Each sets the colour and font of every Xcode syntax type, the editor background, cursor, selection, current line, invisible characters and the debugger's current line, the console, rendered documentation and the scroll bar marks. Keywords are bold, comments italic and documentation tags bold italic. Every key was confirmed against the themes Xcode 27.1 ships.
- `npm run check` parses the Xcode themes, refuses any key Xcode's own themes do not use and proves every colour in them comes from the palette.
- An Eclipse plugin, `com.zacess.themes.eclipse`, that adds the eight themes to **General**, **Appearance**, **Theme**, installed from the update site at https://zacesshq.github.io/themes/eclipse/. Each theme builds on Eclipse's Light or Dark window and sets the same editor and Terminal colours as its `.epf` file, plus the Console's background, output, error and input colours. `scripts/build.mjs` writes the plugin, the feature and the update site build from the palette.
- The Eclipse update site shows a short install page to anyone opening its address in a browser. The Pages root forwards to the repository.
- Zacess Themes is listed on the Eclipse Marketplace (https://marketplace.eclipse.org/content/zacess-themes-0), linked from the README and the Eclipse guide.
- A workflow that builds the update site with Maven and Tycho and publishes it to GitHub Pages on each release. A CI job builds it on every pull request.

### Fixed

- JetBrains IDEs now apply each theme's editor colours. In IntelliJ IDEA 2026.2 the editor kept the default scheme because the scheme files used an extension the IDE no longer loads. The schemes now ship as `.xml` files.

## [0.3.0] - 2026-10-21

### Added

- Zacess Deep Contrast Dark: white on pure black with deep, fully saturated syntax colours, cyan frames and yellow focus outlines and find boxes, for low vision. Keywords, comments and numbers sit at 9:1 on the background and paired tokens step up in lightness from there.
- Zacess Deep Contrast Light: black on pure white with vivid deep syntax colours, navy frames and red focus outlines and find boxes, for low vision. Syntax colours sit between 7.7:1 and 15:1 so they stay vivid, with a faint blue selection every token keeps 7:1 over.
- Both Deep Contrast themes for every editor and terminal: VS Code, the JetBrains IDEs, Obsidian, Neovim, Zed, Sublime Text, Helix, Emacs, Eclipse, iTerm2, Alacritty, kitty, Ghostty and Windows Terminal.
- Eclipse preference files in `editors/eclipse`, one `.epf` per theme, imported with File, Import, Preferences. Each sets the Java editor's syntax colours and font styles, Javadoc and task tags, Java semantic highlighting, the properties file editor and the shared text editor colours: background, text, selection, current line, line numbers, links, marked occurrences, search results, problem underlines and quick diff marks, plus the Terminal view's 16 colours, text, background and selection. Marked occurrences and search results are boxed in the find match border colour. Every key was confirmed against Eclipse 4.41.
- `npm run check` parses the Eclipse files, proves every colour in them comes from the palette and refuses an export root line, which would clear a user's other preferences on import.

### Changed

- The syntax and terminal colours of every theme are now fully saturated at unchanged contrast. Each coloured token, ANSI colour, link and error colour has its OKLab chroma raised to the edge of the sRGB gamut while its luminance and hue stay fixed, so every contrast ratio is exactly as before. Text and the black, white and grey terminal slots stay neutral. `scripts/saturate.mjs` applies the change to the palette and can be run again safely.
- Comments have a real colour instead of grey in Zacess Light, Dark, Yellow on Black, Cream, High Contrast Dark and High Contrast Light: in each theme the hue furthest from every other syntax colour, in normal vision and under simulated protanopia, deuteranopia and tritanopia, fully saturated and still at 7:1 or more on every text surface. Comments stay italic.
- The coloured terminal slots in the four light themes (ANSI 1 to 6 and 9 to 14) use the 4.5:1 terminal allowance so they stay vivid instead of reading as black, with each bright colour a step lighter than its normal form. Their black, white and grey slots keep 7:1 and every code colour keeps 7:1 or more.
- Zacess Deep Contrast Light keeps its terminal green, yellow, bright green and bright yellow at 4.5:1, the documented `rules.ansiFloor` allowance, because at 7:1 they read as black on white. ACCESSIBILITY.md lists them.
- The release workflow only builds, publishes to the stores and keeps the built files as a workflow artifact. A maintainer then runs `scripts/release.mjs`, which creates the GitHub release and updates zacesshq/obsidian-theme and zacesshq/zacess.nvim with signed commits, signed annotated tags and releases. CONTRIBUTING.md describes the steps.

## [0.2.1] - 2026-10-19

### Fixed

- The JetBrains Marketplace listing shows these update notes: the plugin build takes its change notes from this changelog's section for the version. A version with no section fails the build.
- The releases in zacesshq/obsidian-theme and zacesshq/zacess.nvim carry this changelog's section as their notes instead of a single line.

### Changed

- Includes the two high contrast themes from 0.2.0, Zacess High Contrast Dark and Zacess High Contrast Light, for every editor and terminal.

## [0.2.0] - 2026-10-19

### Added

- Zacess High Contrast Dark: white on pure black with strong grey borders, a yellow accent and a yellow focus ring, for the highest contrast on a dark screen. Every syntax colour keeps 10.5:1 or more on the background.
- Zacess High Contrast Light: black on pure white with strong dark borders and deep blue focus outlines, for the highest contrast on a light screen. Every syntax colour keeps 9:1 or more on the background.
- Both themes ship for every editor and terminal: VS Code (on the high contrast bases), the JetBrains IDEs, Obsidian (through the Style Settings contrast option), Neovim, Zed, Sublime Text, Helix, Emacs, iTerm2, Alacritty, kitty, Ghostty and Windows Terminal, with previews and issue form options.

### Changed

- Every install guide, store description and issue form names all six themes.
- zacess.nvim is listed in awesome-neovim, so the README and the Neovim guide link to the listing.
- Releases publish to the VS Code Marketplace through a Microsoft Entra identity that trusts this repository's `release` environment, so no Marketplace access token is stored. A manual workflow checks the identity's publish rights.
- Releases publish to Open VSX through trusted publishing: the registry accepts this repository's release workflow directly, so no Open VSX access token is stored as a secret.
- Zacess Themes is on the JetBrains Marketplace, so the JetBrains install guides install from there first. The plugin zip on each release stays available for offline installs.
- Zacess Themes is in the Zed extension store, so the Zed install guides point there first. The dev extension and the copied theme file stay as ways to try unreleased changes.

## [0.1.5] - 2026-10-14

### Changed

- ANSI black in Zacess Dark and Zacess Yellow on Black is a mid grey (`#a3a3a3`) instead of a near black, so text a program prints in black stays readable at 7:1 or more. Bright black moves to `#c8c8c8` so the two stay apart. Every one of the 16 terminal colours in every theme is now measured as text on the background, with no exceptions, which lets terminal theme catalogues grade all four themes AAA.
- The install guides note that the four themes are in the iTerm2 Color Schemes collection, which Ghostty, WezTerm and other terminals draw from.

## [0.1.4] - 2026-10-14

### Added

- Sublime Text colour schemes in `editors/sublime`, one `.sublime-color-scheme` per theme. Each names the palette colours as variables, sets the editor colours and maps the same TextMate scopes as the VS Code themes, with bold, italic and underline from the palette's font styles.
- Helix themes in `editors/helix/themes`, one per theme, with a `[palette]` table and the interface, diagnostic, diff, Markdown and syntax scopes. Font styles map to Helix modifiers and underlines.
- Emacs themes in `editors/emacs`, one `deftheme` file per theme, covering the default, region, current line, line number, mode line, search, parenthesis, diff, Flymake and Flycheck faces, every `font-lock` face and the 16 `ansi-color` faces. Each file adds its folder to `custom-theme-load-path` when loaded.
- `npm run check` parses the new files: the Sublime Text schemes as JSON, the Helix themes as TOML and the Emacs themes by their brackets. It also proves that every colour, variable and palette name they use comes from the palette.
- Each release attaches `zacess-sublime-<version>.zip`, `zacess-helix-<version>.zip` and `zacess-emacs-<version>.zip`.
- Each release updates two read-only copies with a matching release in each: [zacesshq/obsidian-theme](https://github.com/zacesshq/obsidian-theme) for the Obsidian community directory and [zacesshq/zacess.nvim](https://github.com/zacesshq/zacess.nvim) for Neovim plugin managers.

### Changed

- The install guides link the [Obsidian community directory](https://community.obsidian.md/themes/zacess) listing and install Neovim from `zacesshq/zacess.nvim`.

## [0.1.3] - 2026-10-14

### Changed

- The install guides link the VS Code Marketplace, Open VSX and JetBrains Marketplace listings. The VS Code guide installs by extension ID instead of a downloaded file. The release files stay available for offline installs.

## [0.1.2] - 2026-10-14

### Changed

- Fewer greens in Zacess Yellow on Black: types and classes are lavender (`#e5c7ff`) instead of light green in VS Code, the JetBrains IDEs, Zed and Neovim, so strings are the only green in code.
- Zacess Yellow on Black in VS Code draws inline code in white, for example in Markdown previews, hovers, settings and extension pages, instead of the string green.
- A new optional `code` palette role sets the inline code colour. A theme without it keeps the string colour.

## [0.1.1] - 2026-10-14

### Changed

- Calmer borders in Zacess Yellow on Black: the borders, dividers and outlines that only separate areas are a neutral grey (`#7a7a7a`, 4.8:1 on black) in VS Code, the JetBrains IDEs, Obsidian, Zed, Neovim and kitty. Yellow stays for focus, the active tab, selections, buttons and badges, which now share that one yellow accent.
- Zacess Yellow on Black terminals draw their default text in white with a yellow cursor, so yellow and other light ANSI output no longer blends into normal text. ANSI white is `#d9d9d9` so it stays distinct from the default text. This covers VS Code, the JetBrains console, Zed, iTerm2, Alacritty, kitty, Ghostty and Windows Terminal.
- Calmer chrome in Zacess Cream: the side bar, activity bar, title bar, status bar and tabs use a quieter warm neutral, while the editor, the terminal and reading surfaces keep the cream `#fdf6e3`.
- A new `borderActive` palette role for focus and active borders, so each theme keeps one accent for focus and active states.
- The checks hold every border and divider role, focus and active borders and every border, outline and separator key in the generated VS Code themes to 3:1 on each surface they divide, require every ANSI colour to stay distinct from the terminal's default text and require every fallback sensitive VS Code key to be set with its text at 7:1.

### Fixed

- Zacess Cream in VS Code now builds on the normal light base instead of the high contrast light one. Every theme now sets the inline code, code block, quote, separator, hover, notification, quick input, menu, list, input, dropdown, badge, button and keybinding colours itself. Inline code in Markdown previews and extension pages, which showed dark green on navy in Cream, is readable again.

## [0.1.0] - 2026-10-14

### Added

- Four themes matching the Zacess reader's contrast themes: Zacess Light, Zacess Dark, Zacess Yellow on Black for low vision and Zacess Cream for dyslexia friendly reading.
- One palette in `palette/zacess.json` with a JSON schema, holding the interface, syntax and terminal colours of every theme, the font style of each token and the floors the checks enforce.
- A generator that writes a VS Code extension, a JetBrains theme plugin with editor colour schemes, an Obsidian theme with Style Settings options, Neovim colour schemes, a Zed theme extension and iTerm2, Alacritty, kitty, Ghostty and Windows Terminal themes.
- Checks that hold every text and syntax colour to 7:1 contrast on the background, the selection, the current line and the diff backgrounds, test paired tokens for tone and under simulated protanopia, deuteranopia and tritanopia and parse every generated file.
- SVG previews drawn as real text and the data for the themes page on the Zacess website.
- CI that runs the checks, proves the committed files are current, packages the VS Code extension and builds the JetBrains plugin. A release workflow that attaches the `.vsix`, the JetBrains zip and an Obsidian zip to each GitHub release and publishes to each marketplace once its token is set.

[Unreleased]: https://github.com/zacesshq/themes/compare/v0.12.1...HEAD
[0.12.1]: https://github.com/zacesshq/themes/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/zacesshq/themes/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/zacesshq/themes/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/zacesshq/themes/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/zacesshq/themes/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/zacesshq/themes/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/zacesshq/themes/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/zacesshq/themes/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/zacesshq/themes/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/zacesshq/themes/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/zacesshq/themes/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/zacesshq/themes/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/zacesshq/themes/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zacesshq/themes/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/zacesshq/themes/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/zacesshq/themes/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/zacesshq/themes/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/zacesshq/themes/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/zacesshq/themes/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0
