# Rabbit Hole Injector

This is a tool to inject scripts and assets into the game [Rabbit Hole](https://store.steampowered.com/app/2831340/Rabbit_Hole/) by [ShortCake_Cafe](https://twitter.com/ShortCake_Cafe).

Rabbit Hole is made in Scratch and is packaged into a 64-bit Electron app, so this script can manage safe injection while creating proper backups of the original files.

## Installation

1. Download the release zip file from the [releases page](https://github.com/AshtonMemer/rabbit-hole-injector/releases).
2. Extract the zip file into your Rabbit Hole base directory.

## Usage

Once you have the injector extracted into its own folder in the Rabbit Hole base directory, you can place any extensions and skins into the `extensions` folder and inject by running `injector.exe`.

The injector is a console-based UI that will allow you to select which extensions and skins you would like to inject. You can also restore the original files by selecting the option to restore.

## Documentation

If you are interested in creating your own extensions or skins, you can find documentation I have created on the standalone [docs page](https://shortcake-cafe.github.io/Rabbit-Hole-Doc/ext/introduction).

## Building from Source

The injector is made in Bun, so ensure you have Bun installed.
1. Clone the repository.
2. Run `bun install` to install dependencies.
3. Run `bun run build` to run the custom build script.