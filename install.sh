#!/usr/bin/env bash
# Installs the eight Zacess themes for the terminal this script runs in. A terminal named as the
# first argument is used instead. It only copies theme files into the folder the terminal reads them from
# and prints the step that turns one on: it never edits a configuration file.
#
#   curl -fsSL https://raw.githubusercontent.com/zacesshq/themes/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/zacesshq/themes/main/install.sh | bash -s -- wezterm
#
# Terminals: terminal-app, iterm2, ghostty, kitty, wezterm, warp, alacritty, windows-terminal.
# The btop system monitor is named the same way: bash -s -- btop
# Set ZACESS_THEMES_REF to a tag such as v0.6.0 to install that release instead of main.

set -euo pipefail

readonly REF="${ZACESS_THEMES_REF:-main}"
readonly BASE="${ZACESS_THEMES_BASE:-https://raw.githubusercontent.com/zacesshq/themes/${REF}/editors/terminals}"
readonly CONFIG="${XDG_CONFIG_HOME:-${HOME}/.config}"

# ids and names in the palette's order; npm run check proves this list matches palette/zacess.json
readonly IDS=(light dark yellow-on-black cream high-contrast-dark high-contrast-light deep-contrast-dark deep-contrast-light)
readonly NAMES=("Zacess Light" "Zacess Dark" "Zacess Yellow on Black" "Zacess Cream" "Zacess High Contrast Dark" "Zacess High Contrast Light" "Zacess Deep Contrast Dark" "Zacess Deep Contrast Light")

say() { printf '%s\n' "$1"; }
fail() { printf 'zacess themes: %s\n' "$1" >&2; exit 1; }

# the terminal this script runs in, from the variables each terminal sets for its shells
detect() {
    if [[ -n "${WT_SESSION:-}" ]]; then say windows-terminal; return; fi
    case "${TERM_PROGRAM:-}" in
        Apple_Terminal) say terminal-app; return ;;
        iTerm.app) say iterm2; return ;;
        WezTerm) say wezterm; return ;;
        ghostty) say ghostty; return ;;
        WarpTerminal) say warp; return ;;
        vscode) say vscode; return ;;
    esac
    if [[ -n "${GHOSTTY_RESOURCES_DIR:-}" ]]; then say ghostty; return; fi
    if [[ -n "${KITTY_WINDOW_ID:-}" || "${TERM:-}" == "xterm-kitty" ]]; then say kitty; return; fi
    if [[ -n "${WEZTERM_EXECUTABLE:-}" ]]; then say wezterm; return; fi
    if [[ -n "${ALACRITTY_WINDOW_ID:-}" || "${TERM:-}" == "alacritty" ]]; then say alacritty; return; fi
    say unknown
}

# downloads one published file into a folder, keeping its name
fetch() {
    local path="$1" folder="$2" name
    name="${path##*/}"
    mkdir -p "$folder"
    curl -fsSL "${BASE}/${path// /%20}" -o "${folder}/${name}.part" || fail "could not download ${path}"
    mv "${folder}/${name}.part" "${folder}/${name}"
}

# downloads all eight themes; the pattern names each file from the theme's id or name
fetch_all() {
    local folder="$1" kind="$2" ext="$3" i file
    for i in "${!IDS[@]}"; do
        if [[ "$kind" == "id" ]]; then file="zacess-${IDS[$i]}${ext}"; else file="${NAMES[$i]}${ext}"; fi
        fetch "${4}/${file}" "$folder"
    done
    say "Copied the eight Zacess themes to ${folder}"
}

support_folder() {
    if [[ "$(uname -s)" == "Darwin" ]]; then
        say "${HOME}/Library/Application Support/Zacess Themes/$1"
    else
        say "${XDG_DATA_HOME:-${HOME}/.local/share}/zacess-themes/$1"
    fi
}

install_for() {
    local folder
    case "$1" in
        terminal-app)
            folder="$(support_folder Terminal)"
            fetch_all "$folder" name .terminal terminal-app
            say "To turn one on, open it once, which adds it to Terminal.app's profiles:"
            say "  open \"${folder}/Zacess Dark.terminal\""
            say "Then choose it under Terminal, Settings, Profiles and select Default."
            ;;
        iterm2)
            folder="$(support_folder iTerm2)"
            fetch_all "$folder" name .itermcolors iterm2
            say "To turn one on, open iTerm2's Settings, Profiles, Colors, then Color Presets..., Import..."
            say "Choose a file from ${folder}, then pick it from the same menu."
            ;;
        ghostty)
            folder="${CONFIG}/ghostty/themes"
            fetch_all "$folder" id "" ghostty
            say "To turn one on, add this line to Ghostty's config:"
            say "  theme = light:zacess-light,dark:zacess-dark"
            ;;
        kitty)
            folder="${CONFIG}/kitty/themes"
            fetch_all "$folder" id .conf kitty
            say "To turn one on, add this line to kitty.conf:"
            say "  include themes/zacess-dark.conf"
            ;;
        wezterm)
            folder="${CONFIG}/wezterm/colors"
            fetch_all "$folder" name .toml wezterm
            say "To turn one on, set this in wezterm.lua:"
            say "  config.color_scheme = \"Zacess Dark\""
            ;;
        warp)
            if [[ "$(uname -s)" == "Darwin" ]]; then folder="${HOME}/.warp/themes"; else folder="${XDG_DATA_HOME:-${HOME}/.local/share}/warp-terminal/themes"; fi
            fetch_all "$folder" id .yaml warp
            say "To turn one on, open Warp's Settings, Appearance, Themes and choose a Zacess theme."
            ;;
        alacritty)
            folder="${CONFIG}/alacritty/themes"
            fetch_all "$folder" id .toml alacritty
            say "To turn one on, add this under [general] in alacritty.toml:"
            say "  import = [\"${folder}/zacess-dark.toml\"]"
            ;;
        btop)
            folder="${CONFIG}/btop/themes"
            fetch_all "$folder" id .theme btop
            say "To turn one on, open btop, press Esc, choose Options and set Color theme to a Zacess theme."
            ;;
        windows-terminal)
            if [[ -n "${LOCALAPPDATA:-}" ]]; then
                # Windows Terminal reads colour schemes from a fragment folder, so its settings
                # file is never touched
                folder="$(cygpath -u "$LOCALAPPDATA" 2>/dev/null || say "$LOCALAPPDATA")/Microsoft/Windows Terminal/Fragments/Zacess"
                fetch windows-terminal/zacess.json "$folder"
                say "Copied the eight Zacess colour schemes to ${folder}"
                say "To turn one on, restart Windows Terminal, open Settings, choose a profile, then Appearance, Color scheme."
            else
                say "Windows Terminal reads its themes from Windows itself. Run this in PowerShell:"
                say "  irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 | iex"
            fi
            ;;
        vscode)
            say "This is the VS Code terminal. It takes its colours from the Zacess Themes extension:"
            say "  code --install-extension zacess.zacess-themes"
            ;;
        *)
            say "Could not tell which terminal this is. Name it, for example:"
            say "  curl -fsSL https://raw.githubusercontent.com/zacesshq/themes/main/install.sh | bash -s -- kitty"
            say "Terminals: terminal-app, iterm2, ghostty, kitty, wezterm, warp, alacritty, windows-terminal"
            say "Apps: btop"
            exit 1
            ;;
    esac
}

command -v curl >/dev/null 2>&1 || fail "curl is needed to download the themes"
install_for "${1:-$(detect)}"
