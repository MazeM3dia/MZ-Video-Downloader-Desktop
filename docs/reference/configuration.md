# Reference: Configuration files

## `src-tauri/tauri.conf.json`

| Key | Value | Meaning |
|---|---|---|
| `identifier` | `com.mzmd.videodownloader` | Used to resolve per-user app-data paths (`app_data_dir`, `app_local_data_dir`) and as the Windows app ID. Changing this orphans any existing user data/overrides under the old identifier. |
| `build.frontendDist` | `../www` | Static frontend directory — no dev server, no bundler. |
| `app.withGlobalTauri` | `true` | Exposes `window.__TAURI__` directly, which `www/api.js` relies on instead of ES module imports. |
| `app.windows[0].decorations` | `false` | Native OS title bar is disabled — the app draws its own (header in `index.html` with `data-tauri-drag-region`, minimize/close wired through `getCurrentWindow()`). |
| `app.windows[0].resizable` / `maximizable` | `false` | Fixed 1000×700 window; this is also why there's no maximize button in the custom title bar. |
| `app.security.csp` | `default-src 'self'; img-src 'self' https: data:; ...` | Allows loading video/album-art thumbnails from arbitrary `https:` hosts (YouTube's CDN), nothing else external. |
| `bundle.resources` | `../bin/yt-dlp.exe → bin/yt-dlp.exe`, same for ffmpeg | Copies both binaries into a `bin/` subfolder beside the installed/portable executable. The destination path must be `bin/<name>.exe`, not the resource root — this has to match `get_bin_path`'s expectation in `lib.rs`. |
| `bundle.targets` | `["nsis", "msi"]` | The two installer formats `tauri build` produces. The portable zip is not a Tauri bundle target — it's assembled manually, see [Create a release build](../how-to/create-a-release-build.md). |

## `src-tauri/capabilities/default.json`

Tauri v2's permission system — commands and plugin APIs the frontend is allowed to call. Current
grants and why each exists:

| Permission | Used for |
|---|---|
| `core:default` | Baseline command set (window queries, etc.). |
| `core:window:allow-minimize` | Custom title bar's minimize button. |
| `core:window:allow-close` | Custom title bar's close button. |
| `core:window:allow-start-dragging` | Dragging the window by the custom title bar (`data-tauri-drag-region`). |
| `dialog:allow-open` | `select_folder` command's native folder picker. |
| `shell:allow-open` | Opening external links (e.g. the supported-sites link in the empty state). |
| `clipboard-manager:allow-read-text` / `allow-write-text` | Auto-paste on focus, paste context-menu item. |
| `opener:allow-open-path` | **Show in folder** / **Play** buttons on completed downloads. |

Note that `check_ytdlp_update`/`download_ytdlp_update` need **no** capability entry — they use
the `reqwest` crate directly inside the Rust command's own implementation, not a Tauri HTTP
plugin, so there's no IPC-exposed permission surface for it.

## Adding a new permission

If a new Tauri command needs a plugin capability (e.g. a new dialog type, a new window action),
add the specific `plugin:allow-*` string here rather than reaching for a broader wildcard —
match the existing style of one narrow grant per actual use.
