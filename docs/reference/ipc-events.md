# Reference: IPC events

Events the Rust backend emits (`app.emit(...)` in `src-tauri/src/lib.rs`) and the frontend
subscribes to via `window.api.on*` in `www/api.js`. Unlike commands, these are fire-and-forget —
the frontend has no return value to await, only a callback.

## `yt-output`

```json
{ "id": "<download id>", "text": "<one line of yt-dlp's stdout or stderr>" }
```

Emitted once per line of output from the yt-dlp process spawned by `start_download`. Stderr
lines are prefixed `ERROR: ` before emitting. The frontend (`www/renderer.js`,
`onYtOutput`) parses this text for `[download] NN.N% of SIZE at SPEED ETA TIME` patterns to drive
the progress bar, and watches for `[Merger]`/`[ffmpeg]` to show a "Merging streams…" state.

## `download-finished`

```json
{
  "id": "<download id>",
  "success": true,
  "exitCode": 0,
  "outPath": "/path/to/output/file"
}
```

Emitted exactly once per download, when the spawned process exits. `exitCode` is `null` if the
process was killed (e.g. via `cancel_download`) rather than exiting normally — the frontend uses
this to distinguish "Cancelled" from "Failed (exit N)" and shows **Resume** vs **Retry**
accordingly.

## `ytdlp-update-progress`

```json
42
```

A bare integer percentage (0–100), emitted repeatedly during `download_ytdlp_update` as chunks of
the new binary are written to disk. No "finished" event exists for this one — the frontend knows
the download command's promise resolving means it's done.

## Subscription pattern

Each `on*` wrapper in `api.js` unsubscribes any previous listener before attaching a new one
(`if (xUnlisten) xUnlisten();`), so calling `onYtOutput`/`onDownloadFinished` again replaces the
handler rather than stacking duplicates. This matters because the frontend currently has exactly
one global handler per event type, dispatching by `id` to the right card's UI state
(`activeUI` map in `renderer.js`) — not one listener per download.
