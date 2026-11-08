# Zacess Themes

Ten accessible code themes. Four match the [Zacess](https://zacess.com) reader, so a student sees
the same page in the reader and in the editor. Four more give the highest contrast a screen can show.
Every text and syntax colour keeps at least 7:1 contrast (WCAG AAA) on the background, comments
included. Zacess Warm Dark and Zacess Warm Light are the gentler pair for anyone who finds high
contrast too intense: warm, earthy colours held to 4.5:1 (WCAG AA) instead, with every other check
unchanged. The current line is a visible band with plain text at the text floor and every syntax colour at
4.5:1 or more over it. In the five high contrast themes and in the terminal a selection is a bold
block with every selected character in one colour at 7:1 or more (4.5:1 or more in the Warm
pair). In Zacess Light, Dark, Cream,
Warm Dark and Warm Light the editor keeps each token's colour inside a selection, at 4.5:1 or more. The current find match
is filled and outlined while the other matches, the word under the cursor and a matched bracket
are outlined only. Changed lines carry a gutter mark as well as their fill.

| Theme | For | Text on background |
| --- | --- | --- |
| Zacess Light | Everyday use in a bright room | `#111111` on `#ffffff` |
| Zacess Dark | Everyday use in a dim room | `#f5f5f5` on `#121212` |
| Zacess Yellow on Black | Low vision | `#ffeb3b` on `#000000` |
| Zacess Cream | Dyslexia friendly reading | `#000000` on `#fdf6e3` |
| Zacess High Contrast Dark | The highest contrast on a dark screen | `#ffffff` on `#000000` |
| Zacess High Contrast Light | The highest contrast on a light screen | `#000000` on `#ffffff` |
| Zacess Deep Contrast Dark | Low vision: deep, fully saturated colours on black | `#ffffff` on `#000000` |
| Zacess Deep Contrast Light | Low vision: vivid deep colours on white | `#000000` on `#ffffff` |
| Zacess Warm Dark | A gentler dark theme: cream and earthy colours on warm brown, 4.5:1 floor | `#e5d5b6` on `#211b17` |
| Zacess Warm Light | A gentler light theme: dark brown and earthy colours on warm paper, 4.5:1 floor | `#342410` on `#f4ead5` |

![Zacess Light: TypeScript, Python, Rust and HTML lines in dark colours on white, with keywords in bold and comments in italics](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-light.png)

![Zacess Dark: the same code in light colours on near black](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-dark.png)

![Zacess Yellow on Black: the same code in yellow, white and pale colours on black](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-yellow-on-black.png)

![Zacess Cream: the same code in dark colours on a cream background](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-cream.png)

![Zacess High Contrast Dark: the same code in white and bright colours on black, with a yellow accent](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-high-contrast-dark.png)

![Zacess High Contrast Light: the same code in black and deep colours on white](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-high-contrast-light.png)

![Zacess Deep Contrast Dark: the same code in white and saturated blue, magenta, gold, teal and orange on black](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-deep-contrast-dark.png)

![Zacess Deep Contrast Light: the same code in black and vivid blue, magenta, brown, teal and red on white](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-deep-contrast-light.png)

![Zacess Warm Dark: the same code in cream and soft amber, rust, olive, teal and rose on warm dark brown](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-warm-dark.png)

![Zacess Warm Light: the same code in dark brown and deep rust, olive, teal and plum on warm paper](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-warm-light.png)

## Colour is never the only signal

- Keywords, control flow and markup tags are **bold**.
- Comments and parameters are *italic*.
- Invalid code is underlined.
- Tokens that often sit side by side differ in lightness or font style, not only in hue. Strings and
  numbers, added and removed lines and other red and green pairs are checked under simulated
  protanopia, deuteranopia and tritanopia.

## Install

1. Search for **Zacess Themes** in the Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X`
   elsewhere) and select **Install**. It is on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=zacess.zacess-themes)
   and, for Cursor, Windsurf, VSCodium, Antigravity, Kiro and other editors built on VS Code, on
   [Open VSX](https://open-vsx.org/extension/zacess/zacess-themes).
2. Run **Preferences: Color Theme** (`Cmd+K Cmd+T` on macOS, `Ctrl+K Ctrl+T` elsewhere) and pick a
   Zacess theme.

From a terminal the first step is:

```sh
code --install-extension zacess.zacess-themes
```

To install offline, download `zacess-themes-<version>.vsix` from the
[latest release](https://github.com/zacesshq/themes/releases/latest) and run
**Extensions: Install from VSIX...**.

## More

The contrast tables, the palette and the same themes for JetBrains IDEs, Obsidian, Neovim, Zed and
terminals are in the [zacesshq/themes](https://github.com/zacesshq/themes) repository.

## Licence

[MIT](LICENSE).
