# Contributing to the Zacess themes

Thank you for helping make code easier to read. This guide covers how a change to the themes is made
and checked.

## How a change happens

1. Every change starts from an issue that says what "done" means. A readability problem uses the
   [readability form](https://github.com/zacesshq/themes/issues/new?template=readability.yml).
2. Work on a branch named after its type and topic, such as `fix/dark-comment-contrast` or
   `feat/helix-theme`.
3. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`,
   `fix:`, `docs:`, `refactor:` and `chore:`.
4. Open a pull request that closes its issue. It is squash-merged once the checks pass and it is
   reviewed.

## Changing a colour

> [!IMPORTANT]
> Every colour lives in `palette/zacess.json`. Never edit a generated file by hand: the next build
> overwrites it and `npm run verify` fails until the palette and the files agree.

The generated files are everything under `editors/` except the hand-written READMEs, the VS Code
README and changelog, the icon and the JetBrains Gradle build, plus `previews/` and the tables
between the markers in `README.md` and `ACCESSIBILITY.md`.

With Node.js 24 installed:

```sh
# 1. change palette/zacess.json, then write every editor's files from it
npm run build

# 2. measure contrast, test the paired tokens and parse every generated file
npm run check

# 3. redraw the previews and the website data, then look at the previews
npm run preview

# 4. prove nothing generated is left out of the commit
npm run verify

# 5. after changing the installer
shellcheck install.sh
```

Commit the palette change together with every file the build and the previews rewrote. When a check
fails it prints a table naming the theme, the colour, the surface and the floor it missed.

## Adding an editor

Add a function to `scripts/build.mjs` that writes the editor's files from the palette, use the
existing token names so the font styles carry over, add a parse check for the new file type to
`scripts/check.mjs`, read its selection and its cursor, current line and find colours back in the
same file and document the install step in the editor's own README and in the root README. A new
terminal also goes into `install.sh`.

## Project conventions

- **Contrast is a requirement.** Every text and syntax colour keeps 7:1 on every surface it is drawn
  on (4.5:1 in Zacess Warm Dark and Zacess Warm Light, which set their own `textContrast`), apart from the floors the README lists for find matches, the current line and the background
  only selection. A change that lowers a ratio below a floor cannot merge.
- **Where you are stays visible.** The cursor, the current line, find matches, word and bracket
  outlines and diff marks each have their own floor. `npm run check` reads every one back out of
  each generated file. A target that draws a fill where the palette expects an outline fails the
  check, as does one that draws a colour the palette did not measure.
- **Colour is never the only signal.** Keep keywords bold, comments and parameters italic and invalid
  code underlined. Two tokens that sit side by side must differ in tone or font style, not only in
  hue.
- **No runtime dependencies.** The scripts run on a bare Node.js install so anyone can check a
  change.
- Documentation uses UK English.

## Building the editor packages

- VS Code: `npx @vscode/vsce@4.0.0 package --no-dependencies` in `editors/vscode`.
- JetBrains: `./gradlew buildPlugin` in `editors/jetbrains`, with Java 21.

CI runs both on every pull request.

## Releasing

A release is two steps: the workflow publishes to the stores, then a maintainer's machine makes the
GitHub release and updates the read-only copies, so every tag and release is signed by a maintainer.

1. Bump `version` in `palette/zacess.json`, `package.json` and
   `editors/jetbrains/gradle.properties`, then run `npm run build` and `npm run preview` so every
   generated manifest follows. If an Obsidian colour changed, redraw the five Obsidian screenshots
   with `npm ci` and `node render.mjs` in `scripts/screenshot` (Playwright, pinned there). Move the changelog's `Unreleased` entries into a section for the
   version, add a matching section to `editors/vscode/CHANGELOG.md` and merge that through a pull
   request.
2. Tag the merged commit with a signed annotated tag and push it:

   ```sh
   git tag -s v0.2.1 -m "Zacess Themes 0.2.1"
   git push origin v0.2.1
   ```

3. The tag runs [`release.yml`](.github/workflows/release.yml). It checks and builds everything,
   publishes to the VS Code Marketplace, Open VSX and the JetBrains Marketplace and uploads the
   built files as a workflow artifact named `zacess-themes-<version>`. Its last step sends a
   `themes-release` dispatch to zacesshq/website, which rebuilds [zacess.com](https://zacess.com/themes/)
   with the new palette. Without the `SITE_DISPATCH_TOKEN` secret it skips that and the website's
   daily deploy picks the release up instead.
4. Once the workflow succeeds, with `gh` signed in to your own account and commit signing set up,
   run:

   ```sh
   # see what it would do first
   node scripts/release.mjs 0.2.1 --dry-run
   node scripts/release.mjs 0.2.1
   ```

   The script downloads the artifact and creates the GitHub release with this version's changelog
   section as the notes. It then updates the read-only copies with a signed commit, a signed
   annotated tag and a release in each: the five Obsidian copies, one per folder under
   `editors/obsidian/` ([zacesshq/obsidian-theme](https://github.com/zacesshq/obsidian-theme) for
   Zacess, then `obsidian-theme-cream`, `obsidian-theme-high-contrast`,
   `obsidian-theme-deep-contrast` and `obsidian-theme-warm`) plus [zacesshq/zacess.nvim](https://github.com/zacesshq/zacess.nvim).
   An Obsidian copy takes its `manifest.json`, `theme.css`, `README.md`, `screenshot.png` and the
   licence from the tag, so each is edited here and never in the copy. The Obsidian tag is the bare
   version, such as `0.2.1`. Its release carries `manifest.json` and `theme.css` because
   Obsidian installs from them. A copy that does not exist yet stops the script with the command
   that creates it. Running it again skips anything already done. A release that exists before the
   script runs (one made from the tag by hand) keeps its notes and gets whichever of the built
   files it lacks.

## Using AI

AI tools are welcome within the [AI policy](https://github.com/zacesshq/.github/blob/main/AI_POLICY.md). **Every pull request must say how AI was used, even when the answer is None.** Write your own issue and pull request titles and descriptions, understand everything you submit and test it before you open it.
