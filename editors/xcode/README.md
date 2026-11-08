# Zacess for Xcode

Ten themes, `Zacess Light`, `Zacess Dark`, `Zacess Yellow on Black`, `Zacess Cream`,
`Zacess High Contrast Dark`, `Zacess High Contrast Light`, `Zacess Deep Contrast Dark`,
`Zacess Deep Contrast Light`, `Zacess Warm Dark` and `Zacess Warm Light`, in Xcode's `.xccolortheme` format. Each sets the colour and font of
every syntax type Xcode colours, the editor background, cursor, selection, current line, invisible
characters and the debugger's current line, the console's text, prompt, background and selection,
rendered documentation and the issue, breakpoint and change marks in the scroll bar. Bold and italic
follow the palette's font styles, as in every other editor.

Every key in the files was confirmed against the themes Xcode 27.1 ships. An older or newer Xcode
ignores any key it does not know.

## Install

Xcode has no store for themes, so this folder and the
[latest release](https://github.com/zacesshq/themes/releases/latest) are where they come from. Copy
the files into Xcode's theme folder:

```sh
mkdir -p ~/Library/Developer/Xcode/UserData/FontAndColorThemes
cp *.xccolortheme ~/Library/Developer/Xcode/UserData/FontAndColorThemes/
```

Xcode 27 builds its own themes in **Settings...** (`Cmd+,`), **Themes** and brings in a file in this
format as a classic theme:

1. Open **Xcode**, **Settings...** and select **Themes**.
2. Choose **Import Classic Theme** and pick a Zacess file from the `FontAndColorThemes` folder.
3. Keep the colours and fonts selected and finish the import. Repeat for each theme you want.

Xcode 26 and earlier list the files under **Settings...**, **Themes** straight away, so choose a
Zacess theme there. If one is missing, quit and reopen Xcode. Those versions keep one theme for the
light appearance and one for the dark: choose a light Zacess theme while macOS is in Light mode and
a dark one while it is in Dark mode.

| Zacess theme | macOS appearance |
| --- | --- |
| Zacess Light | Light |
| Zacess Dark | Dark |
| Zacess Yellow on Black | Dark |
| Zacess Cream | Light |
| Zacess High Contrast Dark | Dark |
| Zacess High Contrast Light | Light |
| Zacess Deep Contrast Dark | Dark |
| Zacess Deep Contrast Light | Light |
| Zacess Warm Dark | Dark |
| Zacess Warm Light | Light |

> [!NOTE]
> The themes use SF Mono at 12 points, Xcode's own default. Change the size in the **Themes** pane
> after choosing a theme.

## Known limits

- Xcode has no syntax type for operators, parameters or invalid code, so those show in the plain
  text colour, which keeps the theme's text floor. Local variables are plain too. Instance variables and globals take
  the property colour.
- Xcode fonts carry weight and slant but no underline, so links in comments are told apart by
  colour alone.
- The find match highlight, the minimap and the window around the editor follow Xcode's own colours
  for the macOS appearance rather than the palette.

All ten files are generated from `palette/zacess.json` by `npm run build` at the root of the
repository. Never edit them by hand.
