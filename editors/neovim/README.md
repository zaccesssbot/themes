# Zacess for Neovim

Ten colour schemes, `zacess-light`, `zacess-dark`, `zacess-yellow-on-black`, `zacess-cream`,
`zacess-high-contrast-dark`, `zacess-high-contrast-light`, `zacess-deep-contrast-dark`,
`zacess-deep-contrast-light`, `zacess-warm-dark` and `zacess-warm-light`.
Each sets `background`, the standard highlight groups, the Tree-sitter `@` groups, the LSP semantic
token groups and the 16 terminal colours.

## Install

zacess.nvim is listed in [awesome-neovim](https://github.com/rockerBOO/awesome-neovim), the community
list of Neovim plugins and colour schemes.

Install [zacesshq/zacess.nvim](https://github.com/zacesshq/zacess.nvim), a read-only copy of this
folder that each release updates, with any plugin manager. With
[lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{ "zacesshq/zacess.nvim", lazy = false, priority = 1000 }
```

To install by hand instead, copy the `colors` folder into your Neovim config:

```sh
mkdir -p ~/.config/nvim/colors
cp colors/*.lua ~/.config/nvim/colors/
```

Then in `init.lua`:

```lua
vim.o.termguicolors = true
vim.cmd.colorscheme("zacess-dark")
```

> [!IMPORTANT]
> The schemes use exact colours, so `termguicolors` must be on and the terminal must support true
> colour. Without it Neovim rounds each colour to the nearest of 256 and the contrast is no longer
> what was measured.
