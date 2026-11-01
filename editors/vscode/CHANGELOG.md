# Changelog

All notable changes to the Zacess Themes extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-11-01

### Added

- The repository now also carries the eight themes for the btop system monitor. The VS Code themes are unchanged.

## [0.6.1] - 2026-10-29

### Changed

- The README is a short front page with an install line for each editor. The full contrast summary, the palette and the recommended settings, including following the system light and dark setting and the terminal minimum contrast, are in the repository's `docs` folder.

## [0.6.0] - 2026-10-28

### Changed

- The current line is a visible band in all eight themes, at 1.3:1 to 1.4:1 on the background, with plain text at 7:1 and every syntax colour at 4.5:1 or more over it.
- The find match is stronger in Zacess Dark, Yellow on Black, High Contrast Dark and Deep Contrast Dark, so it stays apart from the current line.
- Zacess Yellow on Black draws terminal text in its yellow instead of white.

### Added

- Diff lines carry a border and an overview ruler mark as well as their fill. The gutter marks added, changed and removed lines in every theme: `diffEditor.insertedTextBorder`, `diffEditor.removedTextBorder`, `diffEditorGutter.insertedLineBackground`, `diffEditorGutter.removedLineBackground`, `diffEditorOverview.insertedForeground`, `diffEditorOverview.removedForeground` and `editorOverviewRuler.addedForeground`, `modifiedForeground` and `deletedForeground`.
- `editor.wordHighlightTextBackground` and `editor.wordHighlightTextBorder`, overview ruler marks for the word under the cursor and a matched bracket and `terminalCursor.background`, so the character under the terminal cursor keeps 7:1.

## [0.5.0] - 2026-10-28

### Changed

- Selected text stands out in every theme. In the five high contrast themes the editor draws a selection as a bold block with every selected character in one colour at 7:1 or more. In Zacess Light, Dark and Cream the editor keeps each token's colour inside a selection, so the selection is a fill in the theme's own hue with every token at 4.5:1 or more over it. The terminal draws the block in all eight themes.
- Selected rows in lists, trees, menus and completion popups keep their calmer colour, with every text and syntax colour at 7:1 over it.

### Added

- `terminal.selectionForeground`, `terminal.inactiveSelectionBackground`, `minimap.selectionHighlight`, `minimap.selectionOccurrenceHighlight` and `editorOverviewRuler.selectionHighlightForeground`, which the themes did not set before.

## [0.4.0] - 2026-10-22

### Changed

- Released alongside new Xcode themes, an Eclipse plugin and a fix for the JetBrains editor colours. The VS Code themes are unchanged.

## [0.3.0] - 2026-10-21

### Added

- Zacess Deep Contrast Dark and Zacess Deep Contrast Light: deep, fully saturated syntax colours on pure black and pure white, with yellow and red focus outlines, for low vision.

### Changed

- Every theme's syntax and terminal colours are now fully saturated at unchanged contrast.
- Comments have their own colour instead of grey in the six original themes, still at 7:1 or more and italic.
- The light themes' coloured terminal slots use the 4.5:1 terminal allowance so they stay vivid. Every code colour keeps 7:1 or more.

## [0.2.1] - 2026-10-19

### Fixed

- The JetBrains Marketplace listing shows update notes, as the VS Code Marketplace and Open VSX already do. No changes to the VS Code themes.

### Changed

- Includes the two high contrast themes from 0.2.0, Zacess High Contrast Dark and Zacess High Contrast Light.

## [0.2.0] - 2026-10-19

### Added

- Zacess High Contrast Dark: white on pure black with a yellow accent and focus ring, built on VS Code's high contrast dark base.
- Zacess High Contrast Light: black on pure white with deep blue focus outlines, built on VS Code's high contrast light base.

## [0.1.5] - 2026-10-14

### Changed

- In Zacess Dark and Zacess Yellow on Black, the integrated terminal's ANSI black is a readable mid grey, so text printed in black no longer disappears.

## [0.1.4] - 2026-10-14

### Changed

- No changes to the VS Code themes. This release adds Sublime Text, Helix and Emacs versions in the [zacesshq/themes](https://github.com/zacesshq/themes) repository.

## [0.1.3] - 2026-10-14

### Changed

- The extension page links the VS Code Marketplace and Open VSX listings and explains installing from the Extensions view.

## [0.1.2] - 2026-10-14

### Changed

- Zacess Yellow on Black draws types and classes in lavender instead of light green, so strings are the only green in code.
- Zacess Yellow on Black draws inline code in white in Markdown previews, hovers, settings and extension pages.

## [0.1.1] - 2026-10-14

### Changed

- Zacess Yellow on Black draws the borders, dividers and outlines that only separate areas in a neutral grey, including `contrastBorder`. Yellow stays for focus (`focusBorder` and `contrastActiveBorder`), the active tab, selected list items, buttons and badges.
- Zacess Yellow on Black draws the integrated terminal's default text in white with a yellow cursor, so yellow warnings and other light ANSI output stand apart from normal text. ANSI white is a light grey so it stays distinct too.
- Zacess Cream keeps cream for the editor and the terminal and uses a quieter warm neutral for the side bar, activity bar, title bar, status bar and tabs.
- Each theme uses one accent for focus and active states.

### Fixed

- Zacess Cream builds on the normal light base instead of the high contrast light one. Every theme now sets the inline code, code block, quote, hover, notification, quick input, menu, list, input, dropdown, badge, button and keybinding colours itself. Inline code in Markdown previews and extension pages is readable in Cream again.

## [0.1.0] - 2026-10-14

### Added

- Zacess Light, Zacess Dark, Zacess Yellow on Black and Zacess Cream, matching the four contrast themes in the Zacess reader.
- Editor, workbench, terminal and semantic token colours, with every text and syntax colour at 7:1 contrast or more.
- Bold keywords, italic comments and parameters and underlined invalid code, so colour is never the only signal.

[0.5.0]: https://github.com/zacesshq/themes/releases/tag/v0.5.0
[0.4.0]: https://github.com/zacesshq/themes/releases/tag/v0.4.0
[0.3.0]: https://github.com/zacesshq/themes/releases/tag/v0.3.0
[0.2.0]: https://github.com/zacesshq/themes/releases/tag/v0.2.0
[0.1.5]: https://github.com/zacesshq/themes/releases/tag/v0.1.5
[0.1.4]: https://github.com/zacesshq/themes/releases/tag/v0.1.4
[0.1.3]: https://github.com/zacesshq/themes/releases/tag/v0.1.3
[0.1.2]: https://github.com/zacesshq/themes/releases/tag/v0.1.2
[0.1.1]: https://github.com/zacesshq/themes/releases/tag/v0.1.1
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0
