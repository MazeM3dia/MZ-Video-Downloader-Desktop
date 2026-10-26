# How to change the default save location

Every download defaults to your system's Downloads folder unless told otherwise. There are two
levels of control:

## Set a default for all future downloads

Open the settings popover (gear icon, top right) and click **Default save location**. Pick a
folder. Every new card you create afterward inherits this as its starting save path.

This only affects **new** cards — cards already on screen keep whatever save path they had when
created.

## Override it for a single download

Each card has its own **folder** button next to the quality dropdown, showing the current save
path (truncated to the last two path segments, e.g. `.../Videos`). Click it to pick a different
folder for just that one download, regardless of the app-wide default.

## Where this is stored

Nowhere persistent — the default save location lives only in memory for the current app session
(`defaultSavePath` in `www/renderer.js`). Restarting the app resets it back to the system
Downloads folder.
