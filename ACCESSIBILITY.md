# Accessibility

These themes exist for people who need high contrast to read code, so every colour in them is
measured and every rule below is enforced in CI by `scripts/check.mjs`. A change that breaks a rule
cannot be merged.

## The rules

- Every text and syntax colour keeps at least **7:1** contrast (WCAG AAA) on the background, on
  panels, over a selected row and over both diff backgrounds. Comments are held to the same floor
  and are never dimmed below it. The current line is a visible band, so over it plain text keeps
  7:1 and syntax colours keep 4.5:1. [Where you are](#where-you-are) has the detail.
- Selected text is a bold block wherever a theme can set the colour of selected text. Every selected
  character takes one colour at 7:1 or more on the block and the block keeps at least 3:1 on the
  background. Where a selection must keep each character's own colour, every syntax colour, muted
  text and link keeps at least 4.5:1 over it and plain text keeps 7:1. Either kind of selection
  stays at least 0.08 apart in OKLab from the background, the current line, a find match and both
  diff backgrounds, in normal vision and under each simulation. [Selection](#selection) has the
  detail.
- The text colour keeps 7:1 over a find match and syntax colours keep at least 4.5:1 over it. The
  current match and the other matches look different from each other and from a selection, with
  an outline or underline wherever the editor can draw one. [Where you are](#where-you-are) lists
  what each editor draws.
- Interface text, including muted text, links, errors, warnings, information, line numbers and the
  text on buttons and badges, keeps 7:1 on every surface it is drawn on.
- Borders, dividers, focus outlines, indent guides and whitespace markers keep at least 3:1, the WCAG
  floor for interface boundaries, on every surface they divide. Every border, outline and separator
  key in the generated VS Code themes is measured too.
- Borders that only divide areas use a calm grey. Focus, the active tab and other active states use
  the theme's one accent, so the place the reader is working stands out. The two Deep Contrast
  themes frame areas in a strong colour instead, cyan on black and navy on white, with focus in
  yellow and red.
- Every terminal colour in a dark theme keeps 7:1 on the terminal background. In the light themes
  the twelve coloured slots use the 4.5:1 terminal allowance, listed in `terminal.dim` and named
  under [Terminal colours](#terminal-colours), so they stay vivid. Every code colour in every theme
  keeps 7:1 or more.
- Coloured terminal output never blends into normal terminal text. Each ANSI colour differs from the
  terminal's default text by at least 0.05 in tone or by at least 0.04 in OKLab both in normal
  vision and under simulated protanopia, deuteranopia and tritanopia. The slots that stand for the
  default text by convention, such as bright white on a dark theme, are listed in
  `terminal.textRole` and skipped. Zacess Yellow on Black draws terminal text in the same yellow as
  its editor text, so four of its pale bright slots sit close to it in tone: they are listed in
  `terminal.nearText` and named under [Terminal colours](#terminal-colours).
- Every VS Code colour key that would otherwise fall back to a VS Code default, such as inline code,
  quotes, menus, hovers, notifications and buttons, is set by the theme. The text on each keeps
  7:1.
- Every colour the four Obsidian themes set, from the page and the panels to callouts, tables,
  properties, the graph, canvas, Bases views, the PDF viewer and Mermaid diagrams, is read back out
  of each theme's light and dark blocks and measured: text at 7:1 on every fill it can sit on,
  secondary text at 4.5:1 over a selection or a hovered row and every border, outline, icon and
  mark at 3:1. The active tab, the open file, a selected row and a selected suggestion carry a bar
  and a highlight is underlined, so none of them is marked by a fill alone.
- Colour is never the only signal. Keywords, control flow and markup tags are bold. Comments and
  parameters are italic. Invalid code is underlined. Links are underlined in Obsidian and in markup.
- Tokens that often sit side by side are listed as pairs in the palette. When two paired tokens share
  a font style they must differ in tone by at least 0.05. Under simulated protanopia, deuteranopia
  and tritanopia they must also stay at least 0.04 apart in OKLab. Pairs that are often red
  and green, such as strings and numbers, strings and invalid code and the three diff colours, must
  meet both rules whatever their font style. The interface's error and warning colours are a pair
  too and meet both rules in every theme, so a warning never passes for an error.

## How the colour vision check works

Tone is the cube root of relative luminance: the lightness of the grey with the same luminance. It is
all a person with no colour vision (achromatopsia) has to go on, so a tone difference keeps two
tokens apart even in greyscale.

For the three common colour vision deficiencies, each colour is passed through the matrices from
Machado, Oliveira and Fernandes (2009) at full severity, applied to linear sRGB. The two results are
then compared in OKLab. The 0.04 floor was chosen so the difference is plainly visible side by side,
not only measurable. A simulation is a model: real colour vision varies from person to person, which
is why font styles carry meaning too.

## Selection

Each theme has two selection colours, both from its own palette. Every editor and terminal uses the
one it can draw well.

- **The selection block** (`ui.selectionStrong` with `ui.selectionForeground`) is used wherever a
  theme can set the colour of selected text: iTerm2, Ghostty, kitty, Alacritty, btop, Windows Terminal,
  the VS Code terminal, the VS Code editor in the five high contrast themes, the JetBrains editor,
  console, terminal and text fields, the Eclipse editors and Terminal view, Sublime Text, Helix,
  Neovim (in every buffer, terminal buffers included) and Emacs. Every selected character takes that
  one text colour, so the block can be as bold as the theme's own colours. Search results in Helix show as selections, so they take the block too.
- **The background only selection** (`ui.selection`) is used where selected text keeps its own
  colour: the VS Code editor in Zacess Light, Dark and Cream (VS Code draws a selected text colour
  only in high contrast themes), text fields and the find widget in VS Code, Zed's editor and
  terminal, Obsidian in editing and reading view and Xcode's editor and console. It is drawn in the
  same hue as the block, as far from the background as the floors allow.

Windows Terminal has no selected text setting. It draws selected text black or white by the
selection's lightness, so the checks work out which one it draws and hold that to 7:1.

<!-- selection detail start: generated by scripts/build.mjs -->
| Measure | Floor | Zacess Light | Zacess Dark | Zacess Yellow on Black | Zacess Cream | Zacess High Contrast Dark | Zacess High Contrast Light | Zacess Deep Contrast Dark | Zacess Deep Contrast Light |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected text on the selection block | 7:1 | `#ffffff` on `#0150b2`, 7.5:1 | `#121212` on `#4fbdff`, 8.9:1 | `#000000` on `#09bcc4`, 9.0:1 | `#fdf6e3` on `#7401ca`, 7.4:1 | `#000000` on `#bf96ff`, 9.0:1 | `#ffffff` on `#015f5e`, 7.5:1 | `#000000` on `#ff70ff`, 9.0:1 | `#ffffff` on `#990098`, 7.4:1 |
| The block on the background | 3:1 | 7.5:1 | 8.9:1 | 9.0:1 | 7.4:1 | 9.0:1 | 7.5:1 | 9.0:1 | 7.4:1 |
| Windows Terminal's own black or white text on the block | 7:1 | `#ffffff` 7.5:1 | `#000000` 10.0:1 | `#000000` 9.0:1 | `#ffffff` 8.0:1 | `#000000` 9.0:1 | `#ffffff` 7.5:1 | `#000000` 9.0:1 | `#ffffff` 7.4:1 |
| Background only selection on the background | none, explained below | `#9bc3ff` 1.8:1 | `#004769` 1.8:1 | `#024b4e` 2.1:1 | `#c8a9ff` 1.8:1 | `#6501ae` 2.1:1 | `#00d3d0` 1.8:1 | `#720072` 1.9:1 | `#ffbcfa` 1.5:1 |
| Lowest syntax colour over it | 4.5:1 | 4.5:1 (comment) | 4.5:1 (comment) | 4.6:1 (comment) | 4.5:1 (added) | 4.5:1 (comment) | 4.6:1 (comment) | 4.6:1 (property) | 5.0:1 (number) |
| Plain text over it | 7:1 | 10.4:1 | 9.1:1 | 8.1:1 | 10.5:1 | 9.6:1 | 11.2:1 | 10.7:1 | 13.8:1 |
| Muted text and links over it | 4.5:1 | 4.6:1 | 5.1:1 | 6.3:1 | 4.6:1 | 5.8:1 | 5.2:1 | 4.6:1 | 4.6:1 |
| Closest fill, least OKLab distance in normal vision and the three simulations | 0.08 | 0.092 (selection block and a find match) | 0.080 (selection block and a find match) | 0.096 (selection block and undefined) | 0.095 (background only selection and the current line) | 0.089 (background only selection and a find match) | 0.091 (background only selection and the current line) | 0.087 (selection block and a find match) | 0.082 (selection block and a find match) |
<!-- selection detail end -->

> [!NOTE]
> The background only selection cannot reach 3:1 on the background. On black, a fill at 3:1 has a
> relative luminance of 0.1 and every syntax colour would then need a luminance of 0.63 to keep
> 4.5:1 over it, brighter than most of the palette. On white the same squeeze runs the other way.
> The fill is therefore as strong as the syntax colour, muted text or link with the least contrast
> over it allows at 4.5:1, which is between 1.5:1 and 2.1:1 on the background. Its hue and its OKLab
> distance from the other fills carry the rest. The editors that can draw the selection block use it
> instead.

Selected rows in lists, trees, menus and completion popups use a calmer colour of their own
(`ui.listSelection`) with every text and syntax colour at 7:1 over it. In VS Code the focused row
also carries a focus outline.

## Where you are

The cursor, the current line, find matches, the word under the cursor, a matched bracket and changed
lines tell the reader where they are. Each one is measured on the palette and read back out of
every file that ships it, so no editor can draw a colour the checks did not measure.

- **The cursor** keeps 7:1 on the background and the current line and stays at least 0.08 apart in
  OKLab from both selections, the current line and a find match. Where a block cursor draws the
  character under it (VS Code, Neovim, Helix, kitty, Ghostty, Alacritty, iTerm2 and WezTerm) that
  character takes the background colour at 7:1 or more on the cursor. The terminal cursor keeps the
  same floors.
- **The current line** is a band at 1.3:1 or more on the background in a neutral or calm tint of
  the theme's own palette, with plain text, the active line number and the cursor at 7:1 over it and
  every syntax colour at 4.5:1. It stays at least 0.08 apart in OKLab from the find match and, through
  the selection rule, from both selections. Every editor that has a current line uses it: VS Code,
  the JetBrains IDEs, Obsidian in editing view, Neovim, Zed, Sublime Text, Helix, Emacs, Eclipse
  and Xcode.
- **Find matches.** The current match is filled in the find match colour, with an outline wherever
  the editor can draw one. The other matches are outlined or underlined with no fill, so the two
  never look alike and a match never passes for a selection.
  - VS Code fills and outlines the current match and outlines the other matches.
  - Sublime Text fills the current match and outlines the others.
  - Neovim fills the current match (`CurSearch`, `IncSearch`) in bold and underlines the others
    (`Search`). Emacs does the same with `isearch` and `lazy-highlight`.
  - The JetBrains IDEs fill and box every match. The match you move to is also selected, so it
    shows as the selection block.
  - Eclipse boxes search results and marked occurrences in the find match border colour with no fill.
  - Obsidian fills every match in the find match colour and, in editing view, outlines the current one.
  - Zed fills every match in the find match colour. Its theme format has no outline for a match and
    no colour for the current one.
  - Helix shows search results as selections, so they take the selection block.
  - Xcode draws matches in its own colour, which a theme cannot set.
- **The word under the cursor and a matched bracket** are never a solid fill that could hide the
  character. VS Code outlines them: the word in the border colour, a written word and a bracket in
  the accent. Zacess High Contrast Dark's accent is also its find match outline, so it draws these
  in its own `ui.matchOutline` instead. Both outlines stay at least 0.08 apart in OKLab from the
  find match outline. The JetBrains IDEs box them in the same colours. Neovim and Emacs underline them and
  draw the bracket in bold. Helix underlines a matched bracket in bold. Sublime Text underlines
  brackets and tags in the accent. Obsidian outlines a matched bracket. Each outline keeps 3:1 on the
  background and the current line. Zed has no outline for these, so it fills them with the calm
  selected row colour, which every text and syntax colour keeps 7:1 over.
- **Diffs carry a mark, not colour alone.** Added and removed lines keep their fills and gain a mark
  in the added, changed or removed colour wherever the editor can draw one: the gutter and the
  diff borders in VS Code, the gutter stripes in the JetBrains IDEs, Sublime Text, Zed and
  Eclipse, the sign column for gitsigns, mini.diff and vim-signify in Neovim, the fringe and the
  `diff-hl` faces in Emacs and the `diff.plus`, `diff.minus` and `diff.delta` gutter marks in Helix.
  Each mark keeps 3:1 or more on the gutter. A changed line takes the calm selected row colour.
- **Bold and dim terminal text.** Every ANSI colour keeps 4.5:1 or more on the terminal background,
  so bold text that a terminal draws in the bright colour stays readable. iTerm2 draws bold text in
  the text colour and Terminal.app keeps each colour when bold. Alacritty's dim colours are the
  normal colours. kitty, Ghostty, WezTerm, Warp and Windows Terminal draw dim text by fading the
  colour themselves, which a theme cannot set.

<!-- signals detail start: generated by scripts/build.mjs -->
| Measure | Floor | Zacess Light | Zacess Dark | Zacess Yellow on Black | Zacess Cream | Zacess High Contrast Dark | Zacess High Contrast Light | Zacess Deep Contrast Dark | Zacess Deep Contrast Light |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cursor on the background and the current line | 7:1 | `#111111` 13.8:1 | `#ffd400` 9.3:1 | `#ffffff` 15.1:1 | `#000000` 14.5:1 | `#f5c400` 9.2:1 | `#000000` 15.9:1 | `#ffff00` 14.0:1 | `#000000` 14.6:1 |
| Character under a block cursor, in the background colour | 7:1 | 18.8:1 | 13.0:1 | 21.0:1 | 19.4:1 | 12.7:1 | 21.0:1 | 19.5:1 | 21.0:1 |
| Cursor and its closest fill, least OKLab distance | 0.08 | 0.312 (the selection block) | 0.223 (the selection block) | 0.233 (the selection block) | 0.460 (the selection block) | 0.125 (the selection block) | 0.436 (the selection block) | 0.251 (the selection block) | 0.446 (the selection block) |
| Terminal cursor and the character under it | 7:1 | `#111111` 18.8:1, text 18.8:1 | `#ffd400` 13.0:1, text 13.0:1 | `#ffeb3b` 17.1:1, text 17.1:1 | `#000000` 19.4:1, text 19.4:1 | `#f5c400` 12.7:1, text 12.7:1 | `#000000` 21.0:1, text 21.0:1 | `#ffff00` 19.5:1, text 19.5:1 | `#000000` 21.0:1, text 21.0:1 |
| Terminal cursor and its closest fill, least OKLab distance | 0.08 | 0.312 (the selection block) | 0.223 (the selection block) | 0.242 (the selection block) | 0.460 (the selection block) | 0.125 (the selection block) | 0.436 (the selection block) | 0.251 (the selection block) | 0.446 (the selection block) |
| Current line on the background | 1.3:1 | `#d6dde8` 1.3:1 | `#2f2f2f` 1.3:1 | `#262626` 1.3:1 | `#c8dadd` 1.3:1 | `#262626` 1.3:1 | `#c3e5fe` 1.3:1 | `#262626` 1.3:1 | `#c8debd` 1.4:1 |
| Lowest syntax colour over the current line | 4.5:1 | 6.0:1 (comment) | 6.1:1 (comment) | 7.0:1 (comment) | 6.2:1 (added) | 7.1:1 (comment) | 6.5:1 (comment) | 6.4:1 (property) | 5.3:1 (number) |
| Plain text over the current line | 7:1 | 13.8:1 | 12.2:1 | 12.3:1 | 14.5:1 | 15.1:1 | 15.9:1 | 15.1:1 | 14.6:1 |
| Current line and the find match, least OKLab distance | 0.08 | 0.092 | 0.080 | 0.101 | 0.101 | 0.096 | 0.136 | 0.087 | 0.082 |
| Find match on the background | none, it carries a border | `#ffd400` 1.4:1 | `#4d4000` 1.8:1 | `#4b3a00` 1.9:1 | `#ffd400` 1.3:1 | `#493900` 1.8:1 | `#ffd400` 1.4:1 | `#453800` 1.8:1 | `#fff1a0` 1.1:1 |
| Plain text over the find match | 7:1 | 13.1:1 | 9.4:1 | 9.0:1 | 14.6:1 | 11.2:1 | 14.6:1 | 11.5:1 | 18.3:1 |
| Lowest syntax colour over the find match | 4.5:1 | 5.7:1 (comment) | 4.7:1 (comment) | 5.1:1 (comment) | 6.3:1 (added) | 5.3:1 (comment) | 6.0:1 (comment) | 4.9:1 (property) | 6.7:1 (number) |
| Find match border on the match, the background and the current line | 3:1 | `#111111` 13.1:1 | `#ffd400` 7.1:1 | `#ffffff` 11.0:1 | `#000000` 14.5:1 | `#f5c400` 6.8:1 | `#000000` 14.6:1 | `#ffff00` 10.7:1 | `#b5200d` 4.6:1 |
| Word and bracket outlines on the background and the current line | 3:1 | `#707070` and `#0049a3`, 3.6:1 | `#7a7a7a` and `#8cbcff`, 3.1:1 | `#7a7a7a` and `#ffeb3b`, 3.5:1 | `#6e6555` and `#004498`, 3.9:1 | `#a6a6a6` and `#8fd0ff`, 6.2:1 | `#262626` and `#003d99`, 7.5:1 | `#00ffff` and `#00ffff`, 12.0:1 | `#0f4a85` and `#0f4a85`, 6.2:1 |
| Word and bracket outlines and the find match outline, least OKLab distance | 0.08 | 0.282 | 0.191 | 0.096 | 0.426 | 0.141 | 0.268 | 0.181 | 0.181 |
<!-- signals detail end -->

## Syntax colours

<!-- contrast detail start: generated by scripts/build.mjs -->
Each cell gives the colour, its contrast on the background, its lowest contrast over a diff background or a selected row, its contrast over the current line and its contrast over the background only selection.

| Token | Style | Zacess Light | Zacess Dark | Zacess Yellow on Black | Zacess Cream | Zacess High Contrast Dark | Zacess High Contrast Light | Zacess Deep Contrast Dark | Zacess Deep Contrast Light |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| foreground | regular | `#111111` 18.8:1, 16.3:1, 13.8:1, 10.4:1 | `#f5f5f5` 17.1:1, 14.1:1, 12.2:1, 9.1:1 | `#ffeb3b` 17.1:1, 12.4:1, 12.3:1, 8.1:1 | `#000000` 19.4:1, 16.9:1, 14.5:1, 10.5:1 | `#ffffff` 21.0:1, 15.0:1, 15.1:1, 9.6:1 | `#000000` 21.0:1, 17.3:1, 15.9:1, 11.2:1 | `#ffffff` 21.0:1, 16.5:1, 15.1:1, 10.7:1 | `#000000` 21.0:1, 19.2:1, 14.6:1, 13.8:1 |
| keyword | bold | `#59029f` 10.8:1, 9.3:1, 7.9:1, 6.0:1 | `#d3bdff` 11.1:1, 9.1:1, 7.9:1, 5.9:1 | `#ffffff` 21.0:1, 15.2:1, 15.1:1, 9.9:1 | `#530093` 10.8:1, 9.4:1, 8.1:1, 5.9:1 | `#f5c400` 12.7:1, 9.1:1, 9.2:1, 5.8:1 | `#4b0091` 12.2:1, 10.1:1, 9.3:1, 6.5:1 | `#67aeff` 9.0:1, 7.1:1, 6.5:1, 4.6:1 | `#002ec2` 9.6:1, 8.8:1, 6.7:1, 6.3:1 |
| control | bold | `#5e003c` 13.6:1, 11.7:1, 9.9:1, 7.5:1 | `#ffd2e6` 13.9:1, 11.4:1, 9.9:1, 7.4:1 | `#0cedf6` 14.4:1, 10.4:1, 10.4:1, 6.8:1 | `#550036` 13.5:1, 11.7:1, 10.0:1, 7.3:1 | `#ffcdf0` 15.2:1, 10.8:1, 10.9:1, 7.0:1 | `#8a0046` 9.6:1, 8.0:1, 7.3:1, 5.1:1 | `#ffabfd` 12.4:1, 9.8:1, 9.0:1, 6.3:1 | `#950094` 7.7:1, 7.1:1, 5.4:1, 5.1:1 |
| function | regular | `#0049a3` 8.4:1, 7.3:1, 6.1:1, 4.6:1 | `#84b7fa` 9.0:1, 7.4:1, 6.4:1, 4.8:1 | `#88c3ff` 11.2:1, 8.1:1, 8.1:1, 5.3:1 | `#004498` 8.5:1, 7.4:1, 6.3:1, 4.6:1 | `#8fd0ff` 12.6:1, 9.0:1, 9.1:1, 5.8:1 | `#00347f` 11.6:1, 9.6:1, 8.8:1, 6.2:1 | `#ffdf5a` 15.9:1, 12.5:1, 11.4:1, 8.1:1 | `#824100` 7.7:1, 7.1:1, 5.4:1, 5.1:1 |
| type | regular | `#003737` 13.1:1, 11.3:1, 9.5:1, 7.2:1 | `#03dedd` 11.1:1, 9.1:1, 7.9:1, 5.9:1 | `#e5c7ff` 13.9:1, 10.1:1, 10.0:1, 6.5:1 | `#003232` 12.9:1, 11.2:1, 9.6:1, 7.0:1 | `#00f4e0` 15.0:1, 10.7:1, 10.8:1, 6.9:1 | `#004f4e` 9.4:1, 7.8:1, 7.1:1, 5.0:1 | `#00ebb1` 13.5:1, 10.6:1, 9.7:1, 6.9:1 | `#003a39` 12.6:1, 11.5:1, 8.7:1, 8.3:1 |
| variable | regular | `#111111` 18.8:1, 16.3:1, 13.8:1, 10.4:1 | `#f5f5f5` 17.1:1, 14.1:1, 12.2:1, 9.1:1 | `#ffeb3b` 17.1:1, 12.4:1, 12.3:1, 8.1:1 | `#000000` 19.4:1, 16.9:1, 14.5:1, 10.5:1 | `#ffffff` 21.0:1, 15.0:1, 15.1:1, 9.6:1 | `#000000` 21.0:1, 17.3:1, 15.9:1, 11.2:1 | `#ffffff` 21.0:1, 16.5:1, 15.1:1, 10.7:1 | `#000000` 21.0:1, 19.2:1, 14.6:1, 13.8:1 |
| parameter | italic | `#4c2300` 13.5:1, 11.7:1, 9.9:1, 7.5:1 | `#ffb97f` 11.1:1, 9.1:1, 7.9:1, 5.9:1 | `#ffcca3` 14.4:1, 10.4:1, 10.3:1, 6.8:1 | `#441f00` 13.5:1, 11.7:1, 10.0:1, 7.3:1 | `#ffcf9e` 14.6:1, 10.4:1, 10.5:1, 6.7:1 | `#6b3100` 10.1:1, 8.4:1, 7.7:1, 5.4:1 | `#ffffff` 21.0:1, 16.5:1, 15.1:1, 10.7:1 | `#000000` 21.0:1, 19.2:1, 14.6:1, 13.8:1 |
| property | regular | `#030075` 16.6:1, 14.3:1, 12.1:1, 9.2:1 | `#c5e1ff` 13.9:1, 11.4:1, 9.9:1, 7.4:1 | `#ffffff` 21.0:1, 15.2:1, 15.1:1, 9.9:1 | `#020068` 16.1:1, 14.0:1, 12.0:1, 8.7:1 | `#c9a8ff` 10.5:1, 7.5:1, 7.5:1, 4.8:1 | `#1e0090` 14.4:1, 11.9:1, 10.9:1, 7.7:1 | `#c195ff` 9.0:1, 7.0:1, 6.4:1, 4.6:1 | `#2e0078` 15.1:1, 13.8:1, 10.5:1, 9.9:1 |
| string | regular | `#004a0e` 10.5:1, 9.1:1, 7.7:1, 5.8:1 | `#1ee646` 11.1:1, 9.1:1, 7.9:1, 5.9:1 | `#43f480` 14.4:1, 10.5:1, 10.4:1, 6.8:1 | `#00440c` 10.6:1, 9.2:1, 7.9:1, 5.7:1 | `#20fe34` 15.2:1, 10.9:1, 11.0:1, 7.0:1 | `#005518` 9.0:1, 7.5:1, 6.9:1, 4.8:1 | `#ffaa7c` 11.2:1, 8.8:1, 8.1:1, 5.7:1 | `#870000` 10.3:1, 9.4:1, 7.2:1, 6.8:1 |
| number | regular | `#4c1b00` 14.3:1, 12.3:1, 10.4:1, 7.9:1 | `#ffd9ba` 14.1:1, 11.6:1, 10.1:1, 7.5:1 | `#ffa77e` 11.0:1, 8.0:1, 7.9:1, 5.2:1 | `#451700` 14.1:1, 12.3:1, 10.5:1, 7.6:1 | `#ffb27a` 11.9:1, 8.5:1, 8.5:1, 5.4:1 | `#521e00` 13.5:1, 11.2:1, 10.3:1, 7.2:1 | `#e19e00` 9.0:1, 7.1:1, 6.5:1, 4.6:1 | `#a3005f` 7.7:1, 7.0:1, 5.3:1, 5.0:1 |
| comment | italic | `#97016b` 8.2:1, 7.1:1, 6.0:1, 4.5:1 | `#80c201` 8.5:1, 7.0:1, 6.1:1, 4.5:1 | `#88c200` 9.7:1, 7.0:1, 7.0:1, 4.6:1 | `#8b0162` 8.5:1, 7.4:1, 6.3:1, 4.6:1 | `#c7b404` 9.9:1, 7.1:1, 7.1:1, 4.5:1 | `#1701fb` 8.6:1, 7.1:1, 6.5:1, 4.6:1 | `#00c600` 9.0:1, 7.1:1, 6.5:1, 4.6:1 | `#006108` 7.7:1, 7.0:1, 5.3:1, 5.0:1 |
| operator | regular | `#111111` 18.8:1, 16.3:1, 13.8:1, 10.4:1 | `#f5f5f5` 17.1:1, 14.1:1, 12.2:1, 9.1:1 | `#ffeb3b` 17.1:1, 12.4:1, 12.3:1, 8.1:1 | `#000000` 19.4:1, 16.9:1, 14.5:1, 10.5:1 | `#ffffff` 21.0:1, 15.0:1, 15.1:1, 9.6:1 | `#000000` 21.0:1, 17.3:1, 15.9:1, 11.2:1 | `#ffffff` 21.0:1, 16.5:1, 15.1:1, 10.7:1 | `#000000` 21.0:1, 19.2:1, 14.6:1, 13.8:1 |
| tag | bold | `#59029f` 10.8:1, 9.3:1, 7.9:1, 6.0:1 | `#d3bdff` 11.1:1, 9.1:1, 7.9:1, 5.9:1 | `#ffffff` 21.0:1, 15.2:1, 15.1:1, 9.9:1 | `#530093` 10.8:1, 9.4:1, 8.1:1, 5.9:1 | `#f5c400` 12.7:1, 9.1:1, 9.2:1, 5.8:1 | `#4b0091` 12.2:1, 10.1:1, 9.3:1, 6.5:1 | `#67aeff` 9.0:1, 7.1:1, 6.5:1, 4.6:1 | `#002ec2` 9.6:1, 8.8:1, 6.7:1, 6.3:1 |
| attribute | regular | `#412300` 14.3:1, 12.3:1, 10.4:1, 7.9:1 | `#ffdb9e` 14.1:1, 11.6:1, 10.1:1, 7.5:1 | `#ffffff` 21.0:1, 15.2:1, 15.1:1, 9.9:1 | `#3a1f00` 14.1:1, 12.3:1, 10.5:1, 7.6:1 | `#fff0b8` 18.4:1, 13.1:1, 13.2:1, 8.4:1 | `#4f3200` 11.7:1, 9.7:1, 8.9:1, 6.2:1 | `#c195ff` 9.0:1, 7.0:1, 6.4:1, 4.6:1 | `#2e0078` 15.1:1, 13.8:1, 10.5:1, 9.9:1 |
| regex | regular | `#5b0020` 14.3:1, 12.3:1, 10.4:1, 7.9:1 | `#f3989e` 8.7:1, 7.1:1, 6.2:1, 4.6:1 | `#ffa1ce` 11.2:1, 8.1:1, 8.1:1, 5.3:1 | `#52001c` 14.1:1, 12.3:1, 10.5:1, 7.6:1 | `#ffa6c9` 11.5:1, 8.2:1, 8.3:1, 5.3:1 | `#720030` 11.9:1, 9.8:1, 9.0:1, 6.3:1 | `#ff80c5` 9.1:1, 7.1:1, 6.5:1, 4.6:1 | `#a60049` 7.7:1, 7.0:1, 5.3:1, 5.0:1 |
| invalid | underline | `#5d0002` 14.3:1, 12.3:1, 10.4:1, 7.9:1 | `#ffd7d2` 14.1:1, 11.6:1, 10.1:1, 7.5:1 | `#ffa59d` 11.1:1, 8.0:1, 8.0:1, 5.2:1 | `#540002` 14.1:1, 12.2:1, 10.5:1, 7.6:1 | `#ff9e94` 10.5:1, 7.5:1, 7.6:1, 4.8:1 | `#600000` 14.0:1, 11.6:1, 10.6:1, 7.4:1 | `#fd8b78` 9.1:1, 7.1:1, 6.5:1, 4.6:1 | `#aa0000` 7.7:1, 7.0:1, 5.4:1, 5.1:1 |
| added | regular | `#005b14` 8.3:1, 7.2:1, 6.1:1, 4.6:1 | `#01ea45` 11.4:1, 9.4:1, 8.1:1, 6.1:1 | `#28f74f` 14.5:1, 10.5:1, 10.4:1, 6.8:1 | `#005512` 8.4:1, 7.3:1, 6.2:1, 4.5:1 | `#3bff59` 15.6:1, 11.1:1, 11.2:1, 7.2:1 | `#005518` 9.0:1, 7.5:1, 6.9:1, 4.8:1 | `#00f000` 13.4:1, 10.5:1, 9.7:1, 6.8:1 | `#006108` 7.7:1, 7.0:1, 5.3:1, 5.0:1 |
| removed | regular | `#5d0002` 14.3:1, 12.3:1, 10.4:1, 7.9:1 | `#f39992` 8.7:1, 7.1:1, 6.2:1, 4.6:1 | `#ffa59d` 11.1:1, 8.0:1, 8.0:1, 5.2:1 | `#540002` 14.1:1, 12.2:1, 10.5:1, 7.6:1 | `#ffaba3` 11.6:1, 8.2:1, 8.3:1, 5.3:1 | `#4a0000` 16.2:1, 13.4:1, 12.3:1, 8.6:1 | `#ffaa7c` 11.2:1, 8.8:1, 8.1:1, 5.7:1 | `#730000` 12.1:1, 11.1:1, 8.4:1, 7.9:1 |
| changed | regular | `#001940` 17.3:1, 14.9:1, 12.6:1, 9.5:1 | `#c9e0ff` 13.9:1, 11.4:1, 9.9:1, 7.4:1 | `#ddedff` 17.6:1, 12.7:1, 12.7:1, 8.3:1 | `#001538` 16.7:1, 14.5:1, 12.4:1, 9.0:1 | `#e6f2ff` 18.5:1, 13.2:1, 13.3:1, 8.5:1 | `#00307a` 12.3:1, 10.2:1, 9.3:1, 6.5:1 | `#67aeff` 9.0:1, 7.1:1, 6.5:1, 4.6:1 | `#002ec2` 9.6:1, 8.8:1, 6.7:1, 6.3:1 |
<!-- contrast detail end -->

## Interface colours

<!-- interface detail start: generated by scripts/build.mjs -->
Each cell gives the colour and its lowest contrast on the surfaces it is drawn on.

| Interface colour | Floor | Zacess Light | Zacess Dark | Zacess Yellow on Black | Zacess Cream | Zacess High Contrast Dark | Zacess High Contrast Light | Zacess Deep Contrast Dark | Zacess Deep Contrast Light |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| foreground | 7:1 | `#111111` 10.4:1 | `#f5f5f5` 9.1:1 | `#ffeb3b` 8.1:1 | `#000000` 10.5:1 | `#ffffff` 9.6:1 | `#000000` 11.2:1 | `#ffffff` 10.7:1 | `#000000` 13.8:1 |
| muted | 7:1 | `#424242` 8.5:1 | `#c8c8c8` 9.3:1 | `#e6e6e6` 15.5:1 | `#3f382c` 9.2:1 | `#e0e0e0` 14.5:1 | `#2e2e2e` 11.8:1 | `#b3b3b3` 9.4:1 | `#4d4d4d` 8.4:1 |
| accent | 7:1 | `#0049a3` 7.2:1 | `#8cbcff` 7.9:1 | `#ffeb3b` 12.4:1 | `#004498` 7.3:1 | `#f5c400` 9.1:1 | `#003d99` 8.5:1 | `#00ffff` 13.1:1 | `#0f4a85` 8.2:1 |
| link | 7:1 | `#0049a3` 7.2:1 | `#8cbcff` 8.0:1 | `#1be4ed` 12.3:1 | `#004498` 7.3:1 | `#8fd0ff` 11.5:1 | `#003d99` 8.5:1 | `#1db4ff` 8.5:1 | `#003df6` 7.0:1 |
| error | 7:1 | `#810005` 9.2:1 | `#ffccc4` 10.9:1 | `#ffbeb5` 12.2:1 | `#770004` 9.3:1 | `#ff9e94` 9.6:1 | `#8b0000` 8.7:1 | `#fe8167` 8.0:1 | `#aa0000` 7.7:1 |
| warning | 7:1 | `#843800` 7.0:1 | `#edc071` 9.2:1 | `#ffd8ab` 14.4:1 | `#803200` 7.0:1 | `#ffd28a` 13.5:1 | `#4e1c00` 12.2:1 | `#ffd370` 13.9:1 | `#642600` 11.5:1 |
| info | 7:1 | `#003a84` 9.2:1 | `#bddaff` 10.9:1 | `#a6d2ff` 12.2:1 | `#00357a` 9.3:1 | `#a9d4ff` 12.3:1 | `#00337f` 10.2:1 | `#59a4f9` 7.6:1 | `#002ec2` 9.6:1 |
| lineNumber | 7:1 | `#4d4d4d` 8.4:1 | `#b8b8b8` 9.4:1 | `#d9d9d9` 14.8:1 | `#4a4337` 9.0:1 | `#e6e6e6` 16.8:1 | `#262626` 15.1:1 | `#ffffff` 21.0:1 | `#000000` 21.0:1 |
| lineNumberActive | 7:1 | `#111111` 13.8:1 | `#f5f5f5` 12.2:1 | `#ffeb3b` 12.3:1 | `#000000` 14.5:1 | `#f5c400` 9.2:1 | `#000000` 15.9:1 | `#ffff00` 14.0:1 | `#000000` 14.6:1 |
| accentForeground | 7:1 | `#ffffff` 8.4:1 | `#121212` 9.5:1 | `#000000` 17.1:1 | `#ffffff` 9.2:1 | `#000000` 12.7:1 | `#ffffff` 9.8:1 | `#000000` 16.7:1 | `#ffffff` 8.9:1 |
| selectionForeground | 7:1 | `#ffffff` 7.5:1 | `#121212` 8.9:1 | `#000000` 9.0:1 | `#fdf6e3` 7.4:1 | `#000000` 9.0:1 | `#ffffff` 7.5:1 | `#000000` 9.0:1 | `#ffffff` 7.4:1 |
| cursor | 7:1 | `#111111` 13.8:1 | `#ffd400` 9.3:1 | `#ffffff` 15.1:1 | `#000000` 14.5:1 | `#f5c400` 9.2:1 | `#000000` 15.9:1 | `#ffff00` 14.0:1 | `#000000` 14.6:1 |
| background, as text under the cursor | 7:1 | `#ffffff` 18.8:1 | `#121212` 13.0:1 | `#000000` 21.0:1 | `#fdf6e3` 19.4:1 | `#000000` 12.7:1 | `#ffffff` 21.0:1 | `#000000` 19.5:1 | `#ffffff` 21.0:1 |
| border | 3:1 | `#707070` 3.6:1 | `#7a7a7a` 3.1:1 | `#7a7a7a` 3.5:1 | `#6e6555` 3.9:1 | `#a6a6a6` 6.2:1 | `#262626` 11.5:1 | `#00ffff` 12.0:1 | `#0f4a85` 6.2:1 |
| borderActive | 3:1 | `#0049a3` 7.2:1 | `#8cbcff` 8.0:1 | `#ffeb3b` 15.9:1 | `#004498` 7.3:1 | `#f5c400` 11.6:1 | `#003d99` 8.5:1 | `#ffff00` 18.4:1 | `#b5200d` 6.6:1 |
| findMatchBorder | 3:1 | `#111111` 13.1:1 | `#ffd400` 7.1:1 | `#ffffff` 11.0:1 | `#000000` 14.5:1 | `#f5c400` 6.8:1 | `#000000` 14.6:1 | `#ffff00` 10.7:1 | `#b5200d` 4.6:1 |
| accent, as an outline | 3:1 | `#0049a3` 5.9:1 | `#8cbcff` 5.2:1 | `#ffeb3b` 9.0:1 | `#004498` 6.3:1 | `#f5c400` 6.8:1 | `#003d99` 6.8:1 | `#00ffff` 9.2:1 | `#0f4a85` 6.2:1 |
| selectionStrong | 3:1 | `#0150b2` 7.5:1 | `#4fbdff` 8.9:1 | `#09bcc4` 9.0:1 | `#7401ca` 7.4:1 | `#bf96ff` 9.0:1 | `#015f5e` 7.5:1 | `#ff70ff` 9.0:1 | `#990098` 7.4:1 |
| indentGuide | 3:1 | `#8a8a8a` 3.4:1 | `#6b6b6b` 3.5:1 | `#8c8c8c` 6.2:1 | `#857b69` 3.8:1 | `#8c8c8c` 6.2:1 | `#6e6e6e` 5.0:1 | `#8c8c8c` 6.2:1 | `#6e6e6e` 5.0:1 |
| whitespace | 3:1 | `#767676` 4.5:1 | `#7a7a7a` 4.3:1 | `#9a9a9a` 7.4:1 | `#766c5b` 4.7:1 | `#8c8c8c` 6.2:1 | `#6e6e6e` 5.0:1 | `#8c8c8c` 6.2:1 | `#6e6e6e` 5.0:1 |
<!-- interface detail end -->

## Terminal colours

<!-- terminal detail start: generated by scripts/build.mjs -->
| Colour | Zacess Light | Zacess Dark | Zacess Yellow on Black | Zacess Cream | Zacess High Contrast Dark | Zacess High Contrast Light | Zacess Deep Contrast Dark | Zacess Deep Contrast Light |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 black | `#111111` 18.8:1 | `#a3a3a3` 7.4:1 | `#a3a3a3` 8.3:1 | `#000000` 19.4:1 | `#b3b3b3` 10.0:1 | `#000000` 21.0:1 | `#000000` background shade, text on it 21.0:1 | `#000000` 21.0:1 |
| 1 red | `#ca010e` 5.9:1 | `#ffa79b` 10.0:1 | `#ffa79b` 11.2:1 | `#c1000a` 5.9:1 | `#ff9e94` 10.5:1 | `#ca0000` 5.9:1 | `#ff5f5f` 7.0:1 | `#ca0000` 5.9:1 |
| 2 green | `#01751c` 5.8:1 | `#1bdb41` 10.0:1 | `#01dc3f` 11.3:1 | `#016f1b` 5.9:1 | `#26f444` 14.1:1 | `#017424` 5.9:1 | `#00cd00` 9.7:1 | `#00892e` 4.5:1 |
| 3 yellow | `#885a00` 5.9:1 | `#f0b40b` 10.0:1 | `#edb618` 11.3:1 | `#815601` 5.9:1 | `#f5c400` 12.7:1 | `#875b00` 5.9:1 | `#cdcd00` 12.3:1 | `#ad6500` 4.5:1 |
| 4 blue | `#005fcc` 5.9:1 | `#90c1ff` 10.0:1 | `#90c1ff` 11.2:1 | `#015ac2` 6.0:1 | `#8fd0ff` 12.6:1 | `#005bdc` 5.9:1 | `#8888ff` 7.0:1 | `#0040ff` 6.6:1 |
| 5 magenta | `#b301ae` 5.9:1 | `#f7a0f1` 10.0:1 | `#fd9cf8` 11.2:1 | `#a901a6` 6.0:1 | `#f2a6ff` 11.6:1 | `#b400ac` 5.9:1 | `#ff2aff` 7.0:1 | `#cd01cd` 4.6:1 |
| 6 cyan | `#026f6f` 5.9:1 | `#37d2cf` 10.0:1 | `#1fd3d3` 11.3:1 | `#016969` 6.0:1 | `#00f4e0` 15.0:1 | `#006f6e` 6.0:1 | `#00cdcd` 10.6:1 | `#016e78` 5.9:1 |
| 7 white | `#484848` 9.1:1 | `#e6e6e6` 15.0:1 | `#d9d9d9` 14.8:1 | `#434343` 9.1:1 | `#e0e0e0` 15.9:1 | `#3d3d3d` 10.8:1 | `#e5e5e5` 16.6:1 | `#595959` 7.0:1 |
| 8 brightBlack | `#4d4d4d` 8.4:1 | `#c8c8c8` 11.1:1 | `#c8c8c8` 12.5:1 | `#484848` 8.4:1 | `#cccccc` 13.0:1 | `#333333` 12.6:1 | `#b8b8b8` 10.5:1 | `#404040` 10.3:1 |
| 9 brightRed | `#e90112` 4.6:1 | `#ffd5ce` 13.9:1 | `#ffd5ce` 15.6:1 | `#df0010` 4.6:1 | `#ffc4bd` 13.8:1 | `#e90100` 4.6:1 | `#ff9e9e` 10.6:1 | `#d14100` 4.7:1 |
| 10 brightGreen | `#008722` 4.6:1 | `#34ff57` 13.9:1 | `#3cff5d` 15.6:1 | `#008120` 4.6:1 | `#95ff98` 17.0:1 | `#018726` 4.6:1 | `#00ff00` 15.3:1 | `#00884f` 4.5:1 |
| 11 brightYellow | `#9d6902` 4.7:1 | `#ffda8a` 13.9:1 | `#ffda8a` 15.6:1 | `#966501` 4.6:1 | `#ffe08a` 16.2:1 | `#9c6a01` 4.6:1 | `#ffff00` 19.5:1 | `#907300` 4.5:1 |
| 12 brightBlue | `#006eed` 4.7:1 | `#c9e0ff` 13.9:1 | `#c9e0ff` 15.5:1 | `#0069e3` 4.7:1 | `#c8e6ff` 16.2:1 | `#016eee` 4.7:1 | `#b0b0ff` 10.5:1 | `#0d00ff` 8.5:1 |
| 13 brightMagenta | `#cf01c7` 4.6:1 | `#ffd0fa` 13.9:1 | `#ffd0fa` 15.6:1 | `#c500bf` 4.7:1 | `#ffcdf7` 15.3:1 | `#cf00c6` 4.6:1 | `#ff8fff` 10.6:1 | `#db009a` 4.6:1 |
| 14 brightCyan | `#028181` 4.7:1 | `#23f6f8` 13.9:1 | `#00f7f5` 15.6:1 | `#027b7b` 4.7:1 | `#56fff3` 16.9:1 | `#028181` 4.7:1 | `#00ffff` 16.7:1 | `#0178c1` 4.7:1 |
| 15 brightWhite | `#111111` 18.8:1 | `#ffffff` 18.7:1 | `#ffffff` 21.0:1 | `#000000` 19.4:1 | `#ffffff` 21.0:1 | `#000000` 21.0:1 | `#ffffff` 21.0:1 | `#000000` 21.0:1 |
<!-- terminal detail end -->

Zacess Yellow on Black draws terminal text in its yellow, `#ffeb3b` at 17.1:1 on black, like its
editor. Its bright red, bright green, bright yellow and bright magenta (ANSI 9, 10, 11 and 13) are
pale enough to sit within 0.05 of that yellow in tone. They still differ from it in hue by 0.08 or
more in OKLab in normal vision, but less under simulated tritanopia, so they are listed in
`terminal.nearText` rather than failed. Each keeps 11:1 or more on the background.

Every one of the 16 colours is measured as text on the background, ANSI black included, apart from
the slots a theme lists in `terminal.backgroundRole`. In Zacess Dark and Zacess Yellow on Black, ANSI
black is a mid grey rather than a near black, so a program that prints in black stays readable. In
Zacess Deep Contrast Dark, ANSI black is true black and is used as a background: the terminal text is
measured on it instead, at 21:1.

The four light themes (Zacess Light, Zacess Cream, Zacess High Contrast Light and Zacess Deep
Contrast Light) use the 4.5:1 terminal allowance in `rules.ansiFloor` for their red, green, yellow,
blue, magenta and cyan and the bright forms of each (ANSI 1 to 6 and 9 to 14). At 7:1 on white those
colours are so dark that they read as black or grey. At the allowance each one sits between about
4.5:1 and 6:1, fully saturated at its hue, with the bright form a step lighter than the normal one
so the two stay apart. Their black, white and grey slots and every terminal colour in the dark
themes keep 7:1. Code colours are not affected: every syntax colour in every theme keeps 7:1 or
more.

## Colour vision results

The closest pair in each theme under each measure, from the pairs that share a font style or are
always checked.

<!-- colour vision detail start: generated by scripts/build.mjs -->
| Measure | Floor | Zacess Light | Zacess Dark | Zacess Yellow on Black | Zacess Cream | Zacess High Contrast Dark | Zacess High Contrast Light | Zacess Deep Contrast Dark | Zacess Deep Contrast Light |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Closest tone | 0.05 | 0.053 (function and string) | 0.052 (error and warning) | 0.051 (error and warning) | 0.053 (function and string) | 0.053 (function and type) | 0.052 (function and type) | 0.052 (function and type) | 0.051 (control and keyword) |
| Closest OKLab distance, protanopia | 0.04 | 0.093 (number and variable) | 0.053 (type and property) | 0.041 (function and type) | 0.094 (error and warning) | 0.078 (type and variable) | 0.046 (function and property) | 0.053 (control and keyword) | 0.051 (error and warning) |
| Closest OKLab distance, deuteranopia | 0.04 | 0.047 (string and invalid) | 0.078 (number and variable) | 0.040 (string and number) | 0.047 (string and invalid) | 0.041 (function and property) | 0.042 (string and regex) | 0.054 (string and invalid) | 0.052 (function and string) |
| Closest OKLab distance, tritanopia | 0.04 | 0.045 (error and warning) | 0.050 (error and warning) | 0.058 (error and warning) | 0.047 (error and warning) | 0.078 (function and type) | 0.041 (function and type) | 0.045 (string and number) | 0.059 (function and string) |
<!-- colour vision detail end -->

## Known limits

> [!NOTE]
> Holding 7:1 over a selected row keeps the syntax colours in Zacess Light and Zacess Cream dark,
> so several hues sit close together. Lightness steps and font styles carry the difference between
> neighbouring tokens there.

- Zed's theme format sets colour, font style and weight for syntax tokens but has no underline, so
  invalid code relies on Zed's own diagnostic underline.
- Helix has no scope for invalid code, so invalid code there is marked by the error diagnostic's
  curly underline rather than a colour and underline of its own.
- Emacs before version 29 has no faces for function calls, numbers, properties, operators and
  punctuation, so those show in the text colour, which keeps 7:1.
- Eclipse's Java editor colours `return` apart from the other keywords but not `if`, `for` or
  `while`, which take the keyword colour. Both are bold. Eclipse has no preference for the cursor
  colour and no colour for the character under it. Its window follows its own Light or Dark appearance rather than the palette. The Terminal
  view takes the theme's 16 terminal colours, text, background and selection, but its cursor is
  drawn by Eclipse.
- Xcode has no syntax type for operators, parameters or invalid code, so those show in the text
  colour, which keeps 7:1. Its fonts have no underline, so links in comments are told apart by
  colour alone. The find match, the minimap and the window follow Xcode's own colours.
- Language extensions can add their own scopes or semantic tokens. A token the themes do not name
  falls back to the text colour, which keeps 7:1.
- In Zacess Light, Zacess Cream, Zacess High Contrast Light and Zacess Deep Contrast Light, ANSI white and bright white are dark so that white text stays
  readable on the light background. A program that draws white text on an ANSI black background
  shows it dark on dark there.
- In Zacess Yellow on Black the one accent is the same yellow as the text, so the matched letters in
  VS Code's quick open and suggestions, which take the accent colour, are told apart by their bold
  weight rather than by colour.
- Zed has no selected text colour and its terminal draws the editor's selection, so over a selection
  in Zed's terminal some ANSI colours fall below 4.5:1: to about 2.5:1 for the bright coloured slots
  of the four light themes, which already sit near 4.5:1 on the background, to about 3.9:1 for ANSI
  black in Zacess Dark and Zacess Yellow on Black and to about 3.6:1 for red, blue and magenta in
  Zacess Deep Contrast Dark. The terminal's default text keeps 7:1 there.
- The cursor is drawn on top of a selection in the theme's cursor colour. It stays at least 0.08
  apart in OKLab from both selections. It sits at the edge of the selection, beside the
  background, where it keeps its full contrast.
- Terminal.app, Warp, Windows Terminal and Zed set no colour for the character under a block
  cursor, so the terminal chooses it. Warp's themes set no cursor or selection colour at all.
  Terminal.app has no selected text colour, so its selection is the background only selection with
  the terminal text at 7:1 over it.
- The current line cannot reach 3:1 on the background for the same reason the background only
  selection cannot: every syntax colour would then fall below 4.5:1 over it. It is a band of 1.3:1
  to 1.4:1, held apart from the find match and both selections by OKLab distance.
- Programs in a terminal sometimes choose their own colours, such as a 256 colour or true colour
  value, which these themes cannot control.
- In Neovim the colours are exact only with `termguicolors` on and a true colour terminal. The same
  holds for Helix and Emacs in a terminal.
- The PNG previews for the VS Code Marketplace are drawn with the fonts installed where they are made,
  so their letter shapes can differ from the SVG previews. The colours are the same.

## Preferences

Many settings are preferences. Change them in your own copy of a theme file. Open an issue or a pull
request if a change would help others. A change to a colour goes into `palette/zacess.json` and
must pass the checks above.

## Reporting a barrier

A contrast or readability problem is a bug. Open an issue with the
[readability form](https://github.com/zacesshq/themes/issues/new?template=readability.yml). You never
need to share a diagnosis or anything personal. To report privately, email
[contact@zacess.com](mailto:contact@zacess.com).

## The shared statement

The organisation's [accessibility statement](https://github.com/zacesshq/.github/blob/main/ACCESSIBILITY.md)
covers every Zacess repository. This file takes precedence where the two differ.
