# Zacess for Helix

Ten themes, `zacess_light`, `zacess_dark`, `zacess_yellow_on_black`, `zacess_cream`,
`zacess_high_contrast_dark`, `zacess_high_contrast_light`, `zacess_deep_contrast_dark`,
`zacess_deep_contrast_light`, `zacess_warm_dark` and `zacess_warm_light`. Each names
every palette colour once in a `[palette]` table, then sets the interface, the diagnostics, the diff
gutter, Markdown and the syntax scopes from it. Bold, italic and underline follow the palette's font
styles, as in every other editor.

## Install

Copy the theme files into your Helix config:

```sh
mkdir -p ~/.config/helix/themes
cp themes/*.toml ~/.config/helix/themes/
```

On Windows the folder is `%AppData%\helix\themes\`.

Then set the theme in `~/.config/helix/config.toml`:

```toml
theme = "zacess_dark"
```

Or try one in a running editor with `:theme zacess_dark`.

> [!IMPORTANT]
> The themes use exact colours. If Helix does not detect a true colour terminal, set
> `true-color = true` under `[editor]`. Without true colour each colour is rounded to the nearest of
> 256 and the contrast is no longer what was measured.

> [!NOTE]
> Helix has no scope for invalid code, so invalid code is marked by the error diagnostic's curly
> underline instead of its own colour. Search results show as selections: a bold block with every
> selected character in one colour at 7:1 or more (4.5:1 in the Warm pair).
