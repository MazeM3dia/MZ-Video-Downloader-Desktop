# Explanation: Architecture overview

## Why Tauri, and why this version migrated from Electron

The app was originally an Electron app (see the `v0.1.0`/`v0.2.0` entries in the changelog) and
was rewritten onto Tauri v2 for `v0.3.0`. Electron ships a full Chromium + Node.js runtime per
app; Tauri uses the OS's own WebView (WebView2 on Windows) and a native Rust backend instead,
which is why the portable build is tens of megabytes rather than Electron's typical 100MB+
baseline — the only large files left are the bundled `yt-dlp.exe` and `ffmpeg.exe` themselves,
not the app runtime.

## The split: Rust backend, plain JS frontend

Everything that touches the filesystem, spawns processes, or makes network calls lives in
`src-tauri/src/lib.rs` as `#[tauri::command]` functions (see
[Tauri commands](../reference/tauri-commands.md)). Everything visual lives in `www/` as plain
HTML/CSS/JS with no framework and no build step. The two sides only talk through two
channels:

- **Commands** (`invoke(...)`) — frontend asks, backend answers, once. Used for anything with a
  clear request/response shape: fetch metadata, start a download, pick a folder.
- **Events** (`emit(...)`/`listen(...)`) — backend tells, frontend listens, repeatedly. Used for
  anything that happens over time: download progress lines, update-download progress percentages.
  See [IPC events](../reference/ipc-events.md).

There's no shared state object between them beyond what's passed in each message — the backend
keeps its own `AppState` (active process IDs, active URLs, guarded by a `Mutex`) and the
frontend keeps its own `activeUI` map keyed by download ID, and the two stay in sync purely
through the command/event messages crossing the boundary.

## Why yt-dlp and ffmpeg are separate bundled binaries, not Rust crates

yt-dlp is a large, actively-maintained Python project with no practical Rust equivalent of
comparable extraction coverage (1000+ sites); ffmpeg is a C project with no safe way to vendor
its full feature set as a Rust library without an enormous build. Both are shipped as prebuilt
Windows executables and invoked as subprocesses (`tokio::process::Command`), with their stdout
parsed line-by-line for progress. This is also why the app needs
[a binary-location strategy](bundled-binaries-and-updates.md) at all — it's gluing together two
external tools, not reimplementing their logic.

## Why the window has no native title bar

See [the configuration reference](../reference/configuration.md#src-tauricapabilitiesdefaultjson)
for what permissions this needed; the short version is the native decorations were replaced with
a custom-drawn header so the title bar could match the app's own light/dark theme instead of
looking like a mismatched OS chrome element bolted onto a themed app body.
