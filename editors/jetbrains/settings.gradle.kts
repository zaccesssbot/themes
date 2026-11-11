import org.jetbrains.intellij.platform.gradle.extensions.intellijPlatform

rootProject.name = "zacess-themes"

plugins {
    // lets Gradle download the Java 21 toolchain when the machine has a different JDK
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
    id("org.jetbrains.intellij.platform.settings") version "2.20.0"
}

@Suppress("UnstableApiUsage")
dependencyResolutionManagement {
    repositories {
        mavenCentral()
        intellijPlatform {
            defaultRepositories()
        }
    }
}
