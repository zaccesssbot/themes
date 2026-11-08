# Zacess for Obsidian

Five Obsidian themes, one for each pair of Zacess looks. A community theme carries one light and one
dark look, so each theme follows Obsidian's own **Base color scheme** setting between its two and
needs no plugin.

| Theme | Light mode | Dark mode | Folder | Read-only copy |
| --- | --- | --- | --- | --- |
| Zacess | Zacess Light | Zacess Dark | [zacess](zacess/README.md) | [zacesshq/obsidian-theme](https://github.com/zacesshq/obsidian-theme) |
| Zacess Cream | Zacess Cream | Zacess Yellow on Black | [zacess-cream](zacess-cream/README.md) | `zacesshq/obsidian-theme-cream` |
| Zacess High Contrast | Zacess High Contrast Light | Zacess High Contrast Dark | [zacess-high-contrast](zacess-high-contrast/README.md) | `zacesshq/obsidian-theme-high-contrast` |
| Zacess Deep Contrast | Zacess Deep Contrast Light | Zacess Deep Contrast Dark | [zacess-deep-contrast](zacess-deep-contrast/README.md) | `zacesshq/obsidian-theme-deep-contrast` |
| Zacess Warm | Zacess Warm Light | Zacess Warm Dark | [zacess-warm](zacess-warm/README.md) | `zacesshq/obsidian-theme-warm` |

Each folder holds the theme's `manifest.json`, `theme.css`, README and `screenshot.png`. The
manifest and the stylesheet are written by `scripts/build.mjs` from the palette and the screenshot
by `scripts/screenshot/render.mjs`, a mock of an Obsidian window drawn from the theme's own
variables with its light look on the left and its dark look on the right. Each release copies the folder to the
theme's read-only repository, which Obsidian's community directory installs from.

## Install

Zacess is in the [Obsidian community directory](https://community.obsidian.md/themes/zacess): open
**Settings**, then **Appearance**, select **Manage** under **Themes**, search for **Zacess** and
select **Install and use**.

To install any of the five by hand, download `<folder>-obsidian-<version>.zip` from the
[latest release](https://github.com/zacesshq/themes/releases/latest), put `manifest.json` and
`theme.css` in a folder named after the theme inside your vault's `.obsidian/themes/` folder and
choose the theme under **Settings**, **Appearance**, **Themes**. The same two files are in each
folder here.

To follow the system, choose **Adapt to system** under **Base color scheme**, which gives the
theme's light look by day and its dark look at night.

## What the theme covers

Every surface Obsidian draws takes its colours from the Zacess palette: the editor in reading and
editing view, headings, links, lists, quotes, rules, inline code and code blocks, tables, embeds,
properties, footnotes, every callout type, the file explorer and every other tree, tabs, the ribbon,
dividers, the status bar, the title bar, menus, the command palette and every other prompt,
suggestions, modals, settings, notices, tooltips, inputs, toggles, sliders, the graph view, canvas,
Bases table, card and kanban views, the PDF viewer, Sync avatars and Mermaid diagrams.

Every text colour keeps 7:1 on every fill it can sit on (4.5:1 in Zacess Warm, the gentler pair), secondary text keeps 4.5:1 over a selection
or a hovered row and every border, outline, icon and mark keeps 3:1. Colour is never the only signal:
links are underlined, the active tab, the open file, a selected row and a selected suggestion carry a
bar, a highlight is underlined, a matched bracket is outlined and bold, a finished task is struck
through, callouts keep their icon and every control shows a focus ring.

`npm run check` reads every theme's light and dark blocks back out of its `theme.css` and measures
each of those pairs, so a colour below its floor cannot be committed.

## Upgrading from an earlier release

Releases before 0.9.0 shipped one theme with the other looks behind the Style Settings plugin. That
plugin is no longer needed and its **Contrast theme** option has no effect on these themes: choose
the theme that carries the pair you want instead.
