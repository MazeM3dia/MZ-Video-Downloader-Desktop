# Reference: Tauri commands

All commands are defined in `src-tauri/src/lib.rs` and exposed to the frontend via
`window.api` in `www/api.js`. Arguments and return values below are the JSON shapes crossing the
IPC boundary, not the Rust types directly.

## `get_app_version`

No arguments. Returns the version string from `tauri.conf.json` (e.g. `"0.6.0"`), or `"0.0.0"` if
unreadable.

## `fetch_metadata(url: string)`

Runs `yt-dlp -j --no-playlist <url>`. Returns the full parsed JSON metadata object yt-dlp
produces for a single video (title, thumbnail, duration, uploader, and — for recognized songs —
`track`/`artist`/`album`/`release_year`). Rejects with the raw stderr text on failure.

## `fetch_playlist(url: string)`

Runs `yt-dlp --flat-playlist -J --no-warnings <url>`. Returns the playlist wrapper object:
`_type: "playlist"`, `title`, `id`, `uploader`/`channel`, `original_url`, and an `entries` array
(one flat entry per item — `id`, `title`, `channel`/`uploader`, `duration`, `thumbnails`, `url`).
Flat entries do **not** include `track`/`artist`/`album` — only a full `fetch_metadata` call per
entry has those.

## `check_ytdlp_update()`

No arguments. Runs the active `yt-dlp --version`, then queries
`https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest`. Returns:

```json
{
  "current": "2026.08.19",
  "latest": "2026.10.21",
  "downloadUrl": "https://github.com/yt-dlp/yt-dlp/releases/download/.../yt-dlp.exe",
  "updateAvailable": true
}
```

`updateAvailable` is `true` only when `latest` is non-empty, differs from `current`, and a
`yt-dlp.exe` asset was actually found on the release.

## `download_ytdlp_update(url: string)`

Streams the given URL to a `.tmp` file in the app's local data directory, emitting
`ytdlp-update-progress` events as it goes, then renames it into place as the active override.
See [IPC events](ipc-events.md) and
[Bundled binaries and the update mechanism](../explanation/bundled-binaries-and-updates.md).

## `start_download(args: StartDownloadArgs)`

```ts
{
  url: string,
  formatTag: string,       // "audio" | "1080" | "720" | "480" | "360"
  outputFilename: string,
  savePath?: string,       // defaults to the system Downloads folder
  isMusic?: boolean,       // triggers music-specific ffmpeg args
}
```

Spawns yt-dlp in the background. Returns immediately with `{ success: true, id: "<download id>" }`
(an epoch-millisecond string) or `{ success: false, error: "already-downloading" }` if the same
URL is already active. Progress and completion arrive later via events, not a return value — see
[IPC events](ipc-events.md).

When `formatTag` is `"audio"`: extracts to MP3 at maximum VBR quality, embeds metadata and cover
art. When `isMusic` is also `true`: additionally crops the cover art to 1:1 and forces the ID3
date tag to the song's `release_year` instead of YouTube's upload date.

## `cancel_download(id: string)`

Force-kills the process tree for that download ID (`taskkill /PID <pid> /T /F` on Windows).
Returns `true` if a matching active process was found and killed, `false` otherwise.

## `open_folder(path: string)` / `open_file(path: string)`

Reveal a file in the system file manager, or open it with the default associated application.

## `select_folder()`

Opens a native folder-picker dialog. Returns the chosen path, or `null` if cancelled.

## `delete_file(path: string)`

Deletes the file if it exists; no-op (not an error) if it doesn't.

## `read_clipboard()`

Returns the current clipboard text content.
