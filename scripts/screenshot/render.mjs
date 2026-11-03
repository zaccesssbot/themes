#!/usr/bin/env node
// draws each Obsidian theme's screenshot.png for the theme directory: a two-pane mock of an
// Obsidian window (mock.html) with the theme's light look on the left and its dark look on the
// right, rendered by Playwright's Chromium at 1024 by 576. Run from this folder after npm ci:
//
//   node render.mjs            every theme
//   node render.mjs zacess     one theme, by folder name
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { OBSIDIAN_THEMES } from "../lib/palette.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const only = process.argv[2];
const targets = OBSIDIAN_THEMES.filter((t) => !only || t.id === only);
if (!targets.length) {
  console.error(`no Obsidian theme is called ${only}; the folders are ${OBSIDIAN_THEMES.map((t) => t.id).join(", ")}`);
  process.exit(1);
}

const mock = readFileSync(join(here, "mock.html"), "utf8");
const browser = await chromium.launch();
// device scale 1 keeps the file small and the directory shows it at this size anyway
const page = await browser.newPage({ viewport: { width: 1024, height: 576 }, deviceScaleFactor: 1 });
for (const target of targets) {
  const folder = join(root, "editors", "obsidian", target.id);
  const css = readFileSync(join(folder, "theme.css"), "utf8");
  await page.setContent(mock.replace("{{THEME_CSS}}", css), { waitUntil: "load" });
  const png = await page.screenshot({ type: "png", fullPage: false });
  writeFileSync(join(folder, "screenshot.png"), png);
  console.log(`wrote editors/obsidian/${target.id}/screenshot.png`);
}
await browser.close();
