#!/usr/bin/env node
// finishes a release once release.yml has published a tag to the stores: creates the GitHub release
// from the workflow's artifact (a release made from the tag already gets the files it lacks) and
// updates the five read-only Obsidian copies and the Neovim copy. It runs on a
// maintainer's machine with their own gh login and git identity, so every commit, tag and release it
// makes is theirs and signed with their key. Safe to run again: anything already done is skipped.
//
//   node scripts/release.mjs [version] [--dry-run]
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OBSIDIAN_THEMES, ROOT, loadPalette } from "./lib/palette.mjs";

const OWNER = "zacesshq";
const SOURCE = `${OWNER}/themes`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const version = args.find((arg) => !arg.startsWith("--")) ?? loadPalette().version;
const tag = `v${version}`;

function run(command, commandArgs, { cwd = ROOT, allowFail = false, input } = {}) {
  const result = spawnSync(command, commandArgs, { cwd, encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
  if (result.status !== 0 && !allowFail) {
    console.error(`${command} ${commandArgs.join(" ")} failed:\n${result.stderr || result.stdout}`);
    process.exit(1);
  }
  return { ok: result.status === 0, out: (result.stdout ?? "").trim() };
}

// a write step only prints what it would do in a dry run
function act(description, command, commandArgs, options) {
  console.log(`${dryRun ? "would run" : "running"}: ${description}`);
  if (!dryRun) run(command, commandArgs, options);
}

// the commits, tags and releases must be a person's, never an automation account's
const login = run("gh", ["api", "user", "--jq", ".login + \" \" + .type"]).out;
const [account, accountType] = login.split(" ");
if (accountType !== "User" || /bot$/i.test(account)) {
  console.error(`gh is signed in as ${account}. Switch to a maintainer's own account first with gh auth switch.`);
  process.exit(1);
}
console.log(`Releasing ${tag} as ${account}${dryRun ? " (dry run)" : ""}.`);

// the release builds from the signed tag, so the local copy of the tag must match the remote one
run("git", ["fetch", "--quiet", "origin", `refs/tags/${tag}:refs/tags/${tag}`]);
if (run("git", ["cat-file", "-t", tag]).out !== "tag") {
  console.error(`${tag} is not an annotated tag. Create it with git tag -s ${tag} -m "Zacess Themes ${version}".`);
  process.exit(1);
}

// the stores are published by release.yml; a GitHub release before that succeeds would announce a version the stores lack
const runs = JSON.parse(run("gh", ["run", "list", "--repo", SOURCE, "--workflow", "release.yml", "--branch", tag, "--limit", "1", "--json", "databaseId,status,conclusion"]).out);
if (!runs.length || runs[0].conclusion !== "success") {
  const state = runs.length ? `${runs[0].status} ${runs[0].conclusion || ""}`.trim() : "not found";
  console.error(`The release workflow for ${tag} is ${state}. Wait for it to succeed, then run this again.`);
  process.exit(1);
}

// the notes are this version's section of the changelog, read from the tagged commit
const changelog = run("git", ["show", `${tag}:CHANGELOG.md`]).out.split("\n");
const notes = [];
let inSection = false;
for (const line of changelog) {
  if (line.startsWith("## [")) inSection = line.startsWith(`## [${version}]`);
  else if (inSection) notes.push(line);
}
const notesText = notes.join("\n").trim();
if (!notesText) {
  console.error(`CHANGELOG.md at ${tag} has no section for ${version}.`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), `zacess-release-${version}-`));
const notesFile = join(work, "notes.md");
writeFileSync(notesFile, `${notesText}\n`);
// each copy's release carries the same section, so its notes are never a bare version line
const mirrorNotesFile = join(work, "mirror-notes.md");
writeFileSync(mirrorNotesFile, `${notesText}\n\nMatches [${SOURCE} ${tag}](https://github.com/${SOURCE}/releases/tag/${tag}).\n`);

const hasRelease = (repo, releaseTag) => run("gh", ["release", "view", releaseTag, "--repo", repo], { allowFail: true }).ok;

// 1. the GitHub release on the source repository, with the files the workflow built; a release
// that exists already (one made from the tag by hand or by another tool) keeps its notes and
// gets whichever of those files it lacks, so a run after the workflow always ends with every
// built file attached
{
  const dist = join(work, "dist");
  const attached = hasRelease(SOURCE, tag)
    ? run("gh", ["release", "view", tag, "--repo", SOURCE, "--json", "assets", "--jq", ".assets[].name"]).out.split("\n").filter(Boolean)
    : null;
  const download = run("gh", ["run", "download", String(runs[0].databaseId), "--repo", SOURCE, "--name", `zacess-themes-${version}`, "--dir", dist], { allowFail: true });
  if (!download.ok) {
    console.error(`Could not download the zacess-themes-${version} artifact from run ${runs[0].databaseId}. Artifacts expire after the repository's retention period, so rerun the workflow if it has gone.`);
    // without the release there is nothing to attach the files to later, so this stops; with it,
    // the files it has stay and the copies can still be brought up to date
    if (!dryRun && attached === null) process.exit(1);
  }
  const built = download.ok ? readdirSync(dist).sort() : [];
  if (attached === null) {
    console.log(`assets: ${built.join(", ") || "none"}`);
    act(`create the ${tag} release on ${SOURCE}`, "gh", ["release", "create", tag, ...built.map((name) => join(dist, name)), "--repo", SOURCE, "--verify-tag", "--title", `Zacess Themes ${version}`, "--notes-file", notesFile]);
  } else {
    const missing = built.filter((name) => !attached.includes(name));
    console.log(`${SOURCE} already has the ${tag} release with ${attached.length} of the ${built.length} built files attached.`);
    if (missing.length) {
      console.log(`missing: ${missing.join(", ")}`);
      // --clobber covers a file that lands between the listing and the upload
      act(`upload ${missing.length} missing ${missing.length === 1 ? "file" : "files"} to the ${tag} release on ${SOURCE}`, "gh", ["release", "upload", tag, ...missing.map((name) => join(dist, name)), "--repo", SOURCE, "--clobber"]);
    } else if (built.length) {
      console.log(`every built file is attached, so there is nothing to upload.`);
    }
  }
}

// 2. the read-only copies: an Obsidian copy takes its README, screenshot and licence from the source
// along with the generated files, so it carries nothing the source does not; the Neovim copy keeps
// its own README and licence, only the colour schemes move
// read untrimmed so each copied file is byte for byte what the tag holds; a file the tag does not
// hold, such as a screenshot not yet taken, is skipped
const fromTag = (path) => {
  const result = spawnSync("git", ["show", `${tag}:${path}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
};

// the issue links every Obsidian copy carries, so a report lands where the theme is made
const obsidianIssueConfig = (target) => `# this repository is a read-only copy, so every report goes to the repository the theme is made in
blank_issues_enabled: false
contact_links:
  - name: Report a problem or suggest a change
    url: https://github.com/${SOURCE}/issues/new/choose
    about: ${target.name} for Obsidian is made in ${SOURCE}. Problems, ideas and colour requests go there.
  - name: Ask a question
    url: https://github.com/orgs/${OWNER}/discussions
    about: Questions and ideas about Zacess themes.
  - name: AI policy
    url: https://github.com/${OWNER}/.github/blob/main/AI_POLICY.md
    about: How AI may and may not be used in issues and pull requests here.
`;
const neovimColours = run("git", ["ls-tree", "--name-only", tag, "editors/neovim/colors/"]).out.split("\n").filter((path) => path.endsWith(".lua"));

const mirrors = [
  // Obsidian installs each theme from a release tagged exactly as the manifest version, with both
  // generated files attached
  ...OBSIDIAN_THEMES.map((target) => ({
    repo: target.repo,
    tag: version,
    files: {
      "manifest.json": `editors/obsidian/${target.id}/manifest.json`,
      "theme.css": `editors/obsidian/${target.id}/theme.css`,
      "README.md": `editors/obsidian/${target.id}/README.md`,
      "screenshot.png": `editors/obsidian/${target.id}/screenshot.png`,
      LICENSE: "LICENSE",
    },
    written: { ".github/ISSUE_TEMPLATE/config.yml": obsidianIssueConfig(target) },
    assets: ["manifest.json", "theme.css"],
    clear: () => {},
  })),
  {
    repo: "zacess.nvim",
    tag,
    files: Object.fromEntries(neovimColours.map((path) => [`colors/${path.split("/").pop()}`, path])),
    assets: [],
    // a scheme removed from the palette must disappear from the copy too
    clear: (dir) => {
      const colours = join(dir, "colors");
      for (const name of readdirSync(colours)) if (name.endsWith(".lua")) rmSync(join(colours, name));
    },
  },
];

for (const mirror of mirrors) {
  const repo = `${OWNER}/${mirror.repo}`;
  const dir = join(work, mirror.repo);
  if (!run("gh", ["repo", "view", repo, "--json", "name"], { allowFail: true }).ok) {
    console.error(`${repo} does not exist. Create it first with gh repo create ${repo} --public, then run this again.`);
    process.exit(1);
  }
  run("gh", ["repo", "clone", repo, dir, "--", "--quiet"]);
  mirror.clear(dir);
  for (const [target, source] of Object.entries(mirror.files)) {
    const content = fromTag(source);
    if (content === null) {
      console.log(`${tag} has no ${source}, so ${repo} keeps its own ${target}`);
      continue;
    }
    mkdirSync(join(dir, target, ".."), { recursive: true });
    writeFileSync(join(dir, target), content);
  }
  for (const [target, content] of Object.entries(mirror.written ?? {})) {
    mkdirSync(join(dir, target, ".."), { recursive: true });
    writeFileSync(join(dir, target), content);
  }
  run("git", ["add", "-A"], { cwd: dir });
  const changed = !run("git", ["diff", "--cached", "--quiet"], { cwd: dir, allowFail: true }).ok;
  if (changed) {
    console.log(run("git", ["diff", "--cached", "--stat"], { cwd: dir }).out);
    act(`commit and push the ${version} files to ${repo}`, "git", ["commit", "--quiet", "-S", "-m", `chore: update to Zacess Themes ${version}`], { cwd: dir });
    act(`push ${repo}`, "git", ["push", "--quiet", "origin", "HEAD"], { cwd: dir });
  } else {
    console.log(`${repo} already matches ${version}.`);
  }
  if (hasRelease(repo, mirror.tag)) {
    console.log(`${repo} already has the ${mirror.tag} release.`);
    continue;
  }
  if (!run("git", ["rev-parse", "--verify", "--quiet", `refs/tags/${mirror.tag}`], { cwd: dir, allowFail: true }).ok) {
    act(`tag ${repo} ${mirror.tag} with a signed annotated tag`, "git", ["tag", "-s", mirror.tag, "-m", `Zacess Themes ${version}`], { cwd: dir });
    act(`push the ${mirror.tag} tag to ${repo}`, "git", ["push", "--quiet", "origin", mirror.tag], { cwd: dir });
  }
  const assets = mirror.assets.map((name) => join(dir, name));
  act(`create the ${mirror.tag} release on ${repo}`, "gh", ["release", "create", mirror.tag, ...assets, "--repo", repo, "--verify-tag", "--title", mirror.tag, "--notes-file", mirrorNotesFile]);
}

if (dryRun) console.log(`Dry run finished. Nothing was committed, tagged or released. Working files are in ${work}.`);
else {
  rmSync(work, { recursive: true, force: true });
  console.log(`Released ${tag}.`);
}
