# Security Policy

The themes are colour files, but they are installed into editors and terminals that run them on
people's own machines. The scripts that build them run on contributors' machines and in CI. A flaw
in any of these is taken seriously.

## Scope

In scope:

- A generated file that makes an editor or terminal load an outside resource, run code or track the
  person who installed it, such as a CSS `@import` or `url()` in the Obsidian theme
- A change to the generator or the checks that runs code from the palette or writes outside the
  repository
- The release workflow publishing something other than what the tagged commit builds
- The release workflow exposing a marketplace token
- The Gradle build fetching code from an unexpected source

## Out of scope

- How an editor, terminal or marketplace itself handles themes (report those to their makers)
- Vulnerabilities in GitHub Actions, Gradle or the IntelliJ Platform with no demonstrated impact on
  these themes (report those upstream)

## Supported versions

Only the latest release and the latest commit on `main` receive security fixes.

## Reporting a vulnerability

> [!IMPORTANT]
> Report privately, never in a public issue or discussion. Use
> [GitHub private vulnerability reporting](https://github.com/zacesshq/themes/security/advisories/new)
> or email [security@zacess.com](mailto:security@zacess.com) with details and reproduction steps.
> Expect an acknowledgement within a few days.
