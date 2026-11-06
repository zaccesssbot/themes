# Zacess for browsers

All eight Zacess themes for Chrome and Firefox. A theme colours the browser's tab strip, toolbar,
address bar and new tab page. Web pages keep their own colours.

| Browser | Folder | Store |
| --- | --- | --- |
| Chrome plus the Chromium browsers that install from the Chrome Web Store | [`chrome/`](chrome/) | [Chrome Web Store](https://chromewebstore.google.com/search/zacess) |
| Firefox | [`firefox/`](firefox/) | [Firefox Add-ons](https://addons.mozilla.org/firefox/search/?q=zacess&type=statictheme) |

> [!NOTE]
> Microsoft Edge Add-ons does not accept themes. Edge installs the Chrome versions from the Chrome
> Web Store once **Allow extensions from other stores** is turned on.

## The themes in each store

| Theme | Chrome | Firefox |
| --- | --- | --- |
| Zacess Light | [Chrome Web Store](https://chromewebstore.google.com/detail/nnpaobhoflcmeichelgbbbdnkdmcgokn) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-light/) |
| Zacess Dark | [Chrome Web Store](https://chromewebstore.google.com/detail/pgbncbfpkagnjdkjiljplaekolkoobgo) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-dark/) |
| Zacess Yellow on Black | [Chrome Web Store](https://chromewebstore.google.com/detail/nhhdbchelioanecdinloahbgkidblknc) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-yellow-on-black/) |
| Zacess Cream | [Chrome Web Store](https://chromewebstore.google.com/detail/djplikakdodgljiigpjpbngpplkippgn) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-cream/) |
| Zacess High Contrast Dark | [Chrome Web Store](https://chromewebstore.google.com/detail/jonipbnecoekmlnojmdfnkpinflcbmja) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-high-contrast-dark/) |
| Zacess High Contrast Light | [Chrome Web Store](https://chromewebstore.google.com/detail/khmfjccebfgnbeanmknhcgjhjpojadie) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-high-contrast-light/) |
| Zacess Deep Contrast Dark | [Chrome Web Store](https://chromewebstore.google.com/detail/hempingnjhdnpkdnhhhheocbnidjlhnd) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-deep-contrast-dark/) |
| Zacess Deep Contrast Light | [Chrome Web Store](https://chromewebstore.google.com/detail/pdmcgfeljojjckjmoojocbljmldckahm) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zacess-deep-contrast-light/) |

## Install

Pick a theme from the table above or search for **Zacess** in either store. To try a theme from
this repository before it is released:

- **Chrome:** open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and
  choose a folder in `chrome/`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on** and
  choose the `manifest.json` in a folder in `firefox/`. It stays until Firefox restarts.

Each [release](https://github.com/zacesshq/themes/releases/latest) attaches a zip of every theme for
each browser.

## How the colours are chosen

`npm run build` writes both folders from the palette. The tab strip takes the theme's border colour
in the high and deep contrast themes, the strong frame those themes are built around. Every other
theme uses its second surface. Where a surface is too close to the background to see, the tab strip
and address bar take the theme's list selection tint instead.

The build refuses to write a theme that falls below these floors:

| Pair | Floor |
| --- | --- |
| Text on the tab strip, toolbar and address bar | 7:1 |
| Links on the new tab page | 7:1 |
| Highlighted text in the address bar and menus | 4.5:1 |
| The active tab line, focus outline and address bar border on the toolbar | 3:1 |

Firefox also draws the active tab line, the address bar border and the focus outline. Chrome themes
have no colour for those, so Chrome draws its own.

The store images in [`../previews/browsers/`](../previews/browsers/) are drawn by
`npm run preview` from the colours in each Chrome manifest, the way Firefox Add-ons draws a theme's
preview.
