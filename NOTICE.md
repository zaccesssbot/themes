# Licensing notice

The Zacess themes are licensed under the [MIT licence](LICENSE). The VS Code extension and the Zed
extension each carry a copy of the same licence file.

## The Zacess mark

The icons in `editors/vscode/icon.png` and `editors/jetbrains/src/main/resources/META-INF/` are made
from the Zacess Themes mark in `assets/themes-light.svg` and `assets/themes-dark.svg`, which is built on
the Zacess mark in `assets/zacess-mark.svg`. The MIT licence covers the themes and the code. It
does not grant any right to use the Zacess name or mark to suggest that another product is Zacess or
is endorsed by it.

## Bundled third-party files

| File | What it is | Licence |
| --- | --- | --- |
| `editors/jetbrains/gradlew`, `editors/jetbrains/gradlew.bat` and `editors/jetbrains/gradle/wrapper/gradle-wrapper.jar` | The Gradle wrapper, written by Gradle 9.8.1 | Apache-2.0 |

## Tools used but not bundled

| Tool | Used for | Licence |
| --- | --- | --- |
| Node.js | Running the generator, the checks and the previews | MIT |
| `@vscode/vsce` | Packaging and publishing the VS Code extension | MIT |
| `ovsx` | Publishing to Open VSX | EPL-2.0 |
| IntelliJ Platform Gradle Plugin | Building the JetBrains plugin | Apache-2.0 |
| rsvg-convert (librsvg) | Drawing the PNG previews when it is installed | LGPL-2.1 or later |

## Methods

- The contrast ratios use the relative luminance and contrast formulas from
  [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- Lightness and colour distances use OKLab, published by Björn Ottosson in
  [A perceptual color space for image processing](https://bottosson.github.io/posts/oklab/) (2020).
- Colour vision deficiencies are simulated with the matrices from Machado, Oliveira and Fernandes,
  "A Physiologically-based Model for Simulation of Color Vision Deficiency", IEEE Transactions on
  Visualization and Computer Graphics, 2009.

## Fonts

The previews name Atkinson Hyperlegible Mono first and fall back to the system's monospace font. No
font is bundled in this repository.
