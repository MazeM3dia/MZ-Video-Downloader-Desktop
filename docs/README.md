# MZ Video Downloader — Documentation

This documentation follows the [Diátaxis](https://diataxis.fr) framework. It's split into four
kinds of writing, each answering a different question:

| Section | Answers | Start here if... |
|---|---|---|
| [Tutorials](tutorials/) | "Can you teach me?" | You're new to the app and want a guided first run. |
| [How-to guides](how-to/) | "How do I do X?" | You have a specific task and know roughly what you're doing. |
| [Reference](reference/) | "What exactly is X?" | You need exact facts — a command's signature, a file's purpose. |
| [Explanation](explanation/) | "Why does it work this way?" | You want the reasoning behind a design decision. |

## Tutorials

- [Download your first video](tutorials/download-your-first-video.md)
- [Download a song with full metadata](tutorials/download-music-with-metadata.md)
- [Bulk-download a playlist or album](tutorials/bulk-download-a-playlist.md)

## How-to guides

- [Build the app from source](how-to/build-from-source.md)
- [Create a release build (installer + portable)](how-to/create-a-release-build.md)
- [Update yt-dlp manually](how-to/update-ytdlp-manually.md)
- [Change the default save location](how-to/change-the-default-save-location.md)
- [Troubleshoot a failed download](how-to/troubleshoot-a-failed-download.md)

## Reference

- [Tauri commands](reference/tauri-commands.md)
- [IPC events](reference/ipc-events.md)
- [Project structure](reference/project-structure.md)
- [Configuration files](reference/configuration.md)

## Explanation

- [Architecture overview](explanation/architecture.md)
- [Bundled binaries and the update mechanism](explanation/bundled-binaries-and-updates.md)
- [Why some tracks are detected as video, not music](explanation/music-track-detection.md)
- [Versioning and releases](explanation/versioning-and-releases.md)

---

For a quick project overview, installation, and the changelog, see the main [readme](../readme.md).
This folder is for anyone building, maintaining, or deeply using the app — not a replacement for
the readme's quick start.
