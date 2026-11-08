# Installs the Zacess themes on Windows without editing any settings file. By default it adds the
# ten colour schemes for Windows Terminal as a settings fragment. Set $env:ZACESS_THEMES_APP to
# btop to copy the ten btop themes beside btop4win instead.
#
#   irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 | iex
#   $env:ZACESS_THEMES_APP = 'btop'; irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 | iex
#
# Set $env:ZACESS_THEMES_REF to a tag such as v0.6.0 to install that release instead of main.

$ErrorActionPreference = 'Stop'
$ref = if ($env:ZACESS_THEMES_REF) { $env:ZACESS_THEMES_REF } else { 'main' }
$base = if ($env:ZACESS_THEMES_BASE) { $env:ZACESS_THEMES_BASE } else { "https://raw.githubusercontent.com/zacesshq/themes/$ref/editors/terminals" }
$app = if ($env:ZACESS_THEMES_APP) { $env:ZACESS_THEMES_APP } else { 'windows-terminal' }

# ids in the palette's order; npm run check proves this list matches palette/zacess.json
$ids = @('light', 'dark', 'yellow-on-black', 'cream', 'high-contrast-dark', 'high-contrast-light', 'deep-contrast-dark', 'deep-contrast-light', 'warm-dark', 'warm-light')

if ($app -eq 'btop') {
    $command = Get-Command btop4win, btop -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $command) {
        throw 'btop4win was not found. Install it with: winget install --id aristocratos.btop4win -e'
    }
    # btop4win reads the themes folder beside the path it was started from. A winget install starts
    # it through a link in WinGet\Links, so the folder beside the link and the folder beside the
    # real exe both get a copy
    $folders = @(Split-Path $command.Source)
    $target = (Get-Item $command.Source).Target | Select-Object -First 1
    if ($target) { $folders += Split-Path $target }
    foreach ($dir in $folders | Select-Object -Unique) {
        $themes = Join-Path $dir 'themes'
        New-Item -ItemType Directory -Force -Path $themes | Out-Null
        foreach ($id in $ids) {
            Invoke-WebRequest -UseBasicParsing -Uri "$base/btop/zacess-$id.theme" -OutFile (Join-Path $themes "zacess-$id.theme")
        }
        Write-Output "Copied the ten Zacess themes to $themes"
    }
    Write-Output 'To turn one on, open btop, press Esc, choose Options and set Color theme to a Zacess theme.'
} elseif ($app -eq 'windows-terminal') {
    $folder = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows Terminal\Fragments\Zacess'
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    Invoke-WebRequest -UseBasicParsing -Uri "$base/windows-terminal/zacess.json" -OutFile (Join-Path $folder 'zacess.json')
    Write-Output "Copied the ten Zacess colour schemes to $folder"
    Write-Output 'To turn one on, restart Windows Terminal, open Settings, choose a profile, then Appearance, Color scheme.'
} else {
    throw "Unknown app '$app'. Use windows-terminal or btop."
}
