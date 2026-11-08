# Zacess for Emacs

Ten themes, `zacess-light`, `zacess-dark`, `zacess-yellow-on-black`, `zacess-cream`,
`zacess-high-contrast-dark`, `zacess-high-contrast-light`, `zacess-deep-contrast-dark`,
`zacess-deep-contrast-light`, `zacess-warm-dark` and `zacess-warm-light`, written with `deftheme`. Each sets the default, cursor, region, current line, line number, mode line, link,
search, parenthesis, diff, Flymake and Flycheck faces, every `font-lock` face and the 16
`ansi-color` faces used by shells and compilation buffers.

## Install

Copy the theme files into a folder of their own:

```sh
mkdir -p ~/.emacs.d/themes
cp *-theme.el ~/.emacs.d/themes/
```

Then add that folder to the theme path and load a theme in your init file:

```elisp
(add-to-list 'custom-theme-load-path (expand-file-name "themes" user-emacs-directory))
(load-theme 'zacess-dark t)
```

Copying the files straight into `custom-theme-directory`, which is `~/.emacs.d/` by default, works
without the first line. **M-x customize-themes** lists the themes once Emacs can find them.

> [!IMPORTANT]
> The themes use exact colours, so use the graphical Emacs or a terminal with true colour support.
> In a terminal, Emacs 28 or later uses true colour when `COLORTERM` is `truecolor`. Without it
> Emacs rounds each colour and the contrast is no longer what was measured.

> [!NOTE]
> The themes need Emacs 27 or later. The faces for function calls, numbers, properties, operators and
> punctuation arrived in Emacs 29, so earlier versions show those in the text colour, which keeps
> the theme's text floor.
