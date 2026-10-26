# How to build the app from source

## Prerequisites

- [Rust](https://rustup.rs/) (edition 2021, see `src-tauri/Cargo.toml` for the minimum version)
- [Node.js](https://nodejs.org/) with npm
- Windows: the WebView2 runtime (pre-installed on Windows 11, downloadable for Windows 10)
- `bin/yt-dlp.exe` and `bin/ffmpeg.exe` present at the repo root — these are **not** checked into
  git (see `.gitignore`'s `bin/*.exe` rule). Download them yourself from
  [yt-dlp's releases](https://github.com/yt-dlp/yt-dlp/releases/latest) and
  [a static ffmpeg build](https://www.gyan.dev/ffmpeg/builds/), and place both `.exe` files
  directly in `bin/`.

## Install dependencies

```sh
npm install
```

This installs `@tauri-apps/cli`, the only npm dependency — the frontend itself
(`www/*.html,js,css`) has no build step and no other packages.

## Run in development mode

```sh
npm run dev
```

This runs `tauri dev`, which compiles the Rust backend and opens a window loading `www/`
directly. Two things to know about dev mode specifically:

- `tauri dev` runs cargo with its working directory set to `src-tauri/`, not the repo root. The
  binary-path lookup in `lib.rs` (`get_bin_path`) walks up from the current directory to find
  `bin/` for exactly this reason — see
  [Bundled binaries and the update mechanism](../explanation/bundled-binaries-and-updates.md).
- The frontend is **not** hot-reloaded. Since `build.frontendDist` in `tauri.conf.json` points at
  the static `www/` folder with no dev server, editing `www/*.js`/`*.css`/`*.html` while the app
  is running has no effect on the open window — restart `npm run dev` to see frontend changes.

## Where things live

See [Project structure](../reference/project-structure.md) for the full layout; the short version
is Rust backend in `src-tauri/src/lib.rs`, plain JS/HTML/CSS frontend in `www/`.
