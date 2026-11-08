# Zacess for Sublime Text

Ten colour schemes, `Zacess Light`, `Zacess Dark`, `Zacess Yellow on Black`, `Zacess Cream`,
`Zacess High Contrast Dark`, `Zacess High Contrast Light`, `Zacess Deep Contrast Dark`,
`Zacess Deep Contrast Light`, `Zacess Warm Dark` and `Zacess Warm Light`, in the `.sublime-color-scheme` format. Each names every palette colour once as a variable, sets the
editor colours and maps the same TextMate scopes as the VS Code themes, plus the region colours that
packages such as LSP use for their marks.

## Install

Copy the scheme files into your `Packages/User` folder. **Preferences**, **Browse Packages...** opens
the `Packages` folder on any system. On macOS:

```sh
cp *.sublime-color-scheme "$HOME/Library/Application Support/Sublime Text/Packages/User/"
```

On Linux the folder is `~/.config/sublime-text/Packages/User/` and on Windows it is
`%APPDATA%\Sublime Text\Packages\User\`.

Then run **UI: Select Color Scheme** from the command palette (`Cmd+Shift+P` on macOS,
`Ctrl+Shift+P` elsewhere) and choose a Zacess scheme. It can also be set in your preferences:

```json
{
  "color_scheme": "Zacess Dark.sublime-color-scheme"
}
```

> [!TIP]
> The **Adaptive** interface theme takes its colours from the colour scheme, so the side bar and
> tabs match the editor. Choose it with **UI: Select Theme**.

> [!NOTE]
> The schemes need Sublime Text 4, which supports the underline font style used for invalid code.
> A Package Control listing is planned. Until then, install from this folder or the
> [latest release](https://github.com/zacesshq/themes/releases/latest).
