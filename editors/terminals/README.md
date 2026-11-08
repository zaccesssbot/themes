# Zacess for terminals

The ten Zacess themes for Terminal.app, iTerm2, Ghostty, kitty, WezTerm, Warp, Alacritty and
Windows Terminal. In the dark
themes every one of the 16 terminal colours keeps at least 7:1 contrast on the background, ANSI
black included: in Zacess Dark, Zacess Yellow on Black and Zacess High Contrast Dark it is a mid
grey, so text a program prints in black stays readable. Zacess Deep Contrast Dark keeps ANSI black true black for use as a
background. The light themes keep their coloured slots vivid at the 4.5:1 terminal allowance, since
at 7:1 they would read as black, while their black, white and grey slots keep 7:1.
Zacess Warm Dark and Zacess Warm Light are the gentler pair: every one of their 16 colours keeps
4.5:1, the floor the Warm pair is held to.
[ACCESSIBILITY.md](../../ACCESSIBILITY.md#terminal-colours) explains all three.

> [!NOTE]
> The Zacess themes are also in the
> [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) collection, which ships
> ports for dozens more terminals.
> Terminals that bundle that collection, such as Ghostty and WezTerm, list them by name from their
> next update.

The quickest route is the installer, run in the terminal you want to theme. It copies all ten
themes to the folder that terminal reads and prints the step that turns one on, without editing any
configuration file:

```sh
curl -fsSL https://raw.githubusercontent.com/zacesshq/themes/main/install.sh | bash
```

| Terminal | Files | Install |
| --- | --- | --- |
| Terminal.app | [`terminal-app/`](terminal-app/) | Open a `.terminal` file once to add the profile, then choose it under **Terminal**, **Settings**, **Profiles** and select **Default** |
| iTerm2 | [`iterm2/`](iterm2/) | **Settings**, **Profiles**, **Colors**, then **Color Presets...** and **Import...**. Choose the `.itermcolors` file, then pick it from the same menu |
| Alacritty | [`alacritty/`](alacritty/) | Copy the file to `~/.config/alacritty/` and add `import = ["~/.config/alacritty/zacess-dark.toml"]` under `[general]` in `alacritty.toml` |
| kitty | [`kitty/`](kitty/) | Copy the file to `~/.config/kitty/` and add `include zacess-dark.conf` to `kitty.conf` |
| WezTerm | [`wezterm/`](wezterm/) | Copy the files to `~/.config/wezterm/colors/` and set `config.color_scheme = "Zacess Dark"` in `wezterm.lua` |
| Warp | [`warp/`](warp/) | Copy the files to `~/.warp/themes/` on macOS or `~/.local/share/warp-terminal/themes/` on Linux, then choose one under **Settings**, **Appearance**, **Themes** |
| Ghostty | [`ghostty/`](ghostty/) | Copy the files to `~/.config/ghostty/themes/` and add `theme = light:zacess-light,dark:zacess-dark` to the config to follow the system appearance |
| btop | [`btop/`](btop/) | Run the installer with `bash -s -- btop`, which copies the files to `~/.config/btop/themes/`. Then open btop, press `Esc`, choose **Options** and set **Color theme**. On Windows, run `$env:ZACESS_THEMES_APP = 'btop'; irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 \| iex` in PowerShell, which copies them to the `themes` folder btop4win reads beside its exe |
| Windows Terminal | [`windows-terminal/zacess.json`](windows-terminal/zacess.json) | Run `irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 \| iex` in PowerShell, which copies the file to the `Fragments\Zacess` folder Windows Terminal reads. You can also add the ten objects to the `schemes` list in the settings file yourself. Then choose **Color scheme** under a profile's **Appearance** |

btop is a system monitor, not a terminal, but it draws in the terminal and takes the same
colours. Every btop text colour is the terminal text, the muted text or one of the 16 terminal
colours, so it keeps the contrast above. The CPU, memory, network and process boxes each keep their
own colour as well as their title, so they are told apart by more than colour.

Every port sets the cursor and, where the terminal allows it, the character under the cursor and
the selected text colour from the palette. Terminal.app has no selected text colour, so its
selection is the background only selection with the terminal text at the text floor over it. Warp's themes
set no cursor or selection colour, so Warp draws its own.

The full colour table with every measured ratio is in
[ACCESSIBILITY.md](../../ACCESSIBILITY.md#terminal-colours).
