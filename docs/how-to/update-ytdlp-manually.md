# How to update yt-dlp manually

The app checks for yt-dlp updates on startup and offers a one-click update (see
[Bundled binaries and the update mechanism](../explanation/bundled-binaries-and-updates.md)). If
that fails, isn't available, or you just prefer doing it yourself:

## Find where the active copy lives

The app uses, in order of priority:

1. A previously-downloaded override at `%LOCALAPPDATA%\com.mzmd.videodownloader\yt-dlp.exe`
   (only exists if you've used the in-app updater before).
2. The bundled copy — `bin/yt-dlp.exe` next to the app's executable (installed or portable).

## Replace it

1. Download the latest `yt-dlp.exe` from
   [yt-dlp's releases page](https://github.com/yt-dlp/yt-dlp/releases/latest).
2. Close the app if it's running.
3. Replace whichever file from the list above you want to update — replacing the override takes
   priority over the bundled copy, so if one already exists there, replace that one instead of
   `bin/yt-dlp.exe`.
4. Relaunch the app. No other steps needed — the binary path is resolved fresh on every download,
   so there's no cache to clear.

## Updating the project's own bundled copy (for maintainers)

If you're preparing a new release and want to ship a newer yt-dlp by default, replace
`bin/yt-dlp.exe` at the **repo root** (not inside `dist/` or `target/`) before running
`npm run build` — see [Create a release build](create-a-release-build.md).
