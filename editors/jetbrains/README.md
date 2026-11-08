# Zacess Themes for JetBrains IDEs

A theme plugin for IntelliJ IDEA, PyCharm, WebStorm, CLion, Rider and the other JetBrains IDEs
built on the IntelliJ Platform 2025.3 or later. Each of the ten themes pairs an interface theme
(`*.theme.json`) with a matching editor colour scheme (`*.xml`) that uses the same token colours and
font styles as every other Zacess theme.

## Install

1. Open **Settings**, then **Plugins** and select the **Marketplace** tab.
2. Search for Zacess Themes and select **Install**. The listing is also on the
   [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/35082-zacess-themes).
3. Open **Settings**, then **Appearance & Behavior**, then **Appearance** and choose a Zacess theme.
   The matching editor colour scheme switches with it.

### Install from a release

For an offline install or to try a specific version:

1. Download `zacess-themes-<version>.zip` from the
   [latest release](https://github.com/zacesshq/themes/releases/latest).
2. Open **Settings**, then **Plugins**, select the gear icon and choose **Install Plugin from Disk...**.
   Pick the zip and restart the IDE if asked.
3. Open **Settings**, then **Appearance & Behavior**, then **Appearance** and choose a Zacess theme.
   The matching editor colour scheme switches with it.

## Build from source

The build needs Java 21. The Gradle wrapper downloads Gradle and the IntelliJ Platform itself.

```sh
./gradlew buildPlugin
```

The zip is written to `build/distributions/`. Everything under `src/main/resources/themes/` and
`src/main/resources/META-INF/plugin.xml` is generated from `palette/zacess.json` by
`npm run build` at the root of the repository. Never edit those files by hand.
