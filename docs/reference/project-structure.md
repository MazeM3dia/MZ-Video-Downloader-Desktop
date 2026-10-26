# Reference: Project structure

```
.
├── bin/                        # yt-dlp.exe, ffmpeg.exe — gitignored, download separately
├── docs/                       # this documentation
├── images/                     # screenshots used in readme.md
├── readme.md                   # project overview, install instructions, changelog
├── package.json                # npm scripts (dev, build) and the @tauri-apps/cli dependency
│
├── src-tauri/                  # Rust backend
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # app config — see configuration.md
│   ├── capabilities/
│   │   └── default.json        # IPC permission grants — see configuration.md
│   ├── icons/                  # app icons for bundling
│   └── src/
│       ├── main.rs             # entry point, just calls app_lib::run()
│       └── lib.rs              # everything: commands, download logic, window setup
│
└── www/                        # frontend — plain HTML/CSS/JS, no build step
    ├── index.html              # markup: header/titlebar, sidebar, card template, modals
    ├── styles.css              # all styling, including light/dark theme tokens
    ├── api.js                  # window.api — the only bridge to Tauri's invoke()/listen()
    ├── renderer.js             # all UI behavior: fetch, cards, playlist modal, progress
    └── fonts/                  # bundled Inter font (system-ui/Arial fallback otherwise)
```

## Why the frontend has no framework

`www/` is deliberately plain JS/HTML/CSS with no build step, no bundler, and no framework. There
is no `npm run build` step for the frontend — `tauri.conf.json`'s `build.frontendDist` points
directly at `www/` as a static directory. This means:

- Editing `www/*.js|css|html` takes effect on the next full app restart, not live.
- There's exactly one script tag loading `api.js`, then `renderer.js` — no module bundler, no
  imports. Everything in `renderer.js` is in one global scope.

## Build output (not checked into git)

- `target/` — Rust build artifacts, including `target/release/bundle/{nsis,msi}/` for installers.
- `dist/` — manually-assembled portable package (see
  [Create a release build](../how-to/create-a-release-build.md)).
- `src-tauri/gen/` — Tauri's generated platform scaffolding.

## Where a new Tauri command would go

Add the `#[tauri::command]` function to `src-tauri/src/lib.rs`, register it in the
`tauri::generate_handler![...]` list near the bottom of `run()`, add any new required permission
to `src-tauri/capabilities/default.json`, then add a matching wrapper in `www/api.js`'s
`window.api` object for the frontend to call it through.
