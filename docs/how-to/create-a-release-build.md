# How to create a release build

This produces the three artifacts that get attached to a GitHub release: an NSIS installer, an
MSI installer, and a portable zip.

## 1. Bump the version

Three files need the same version string kept in sync:

- `package.json` → `"version"`
- `src-tauri/tauri.conf.json` → `"version"`
- `src-tauri/Cargo.toml` → `version = "..."`

Add a changelog entry in `readme.md` under `## Changelog`, following the existing format (version,
date, bullet list of what changed).

## 2. Build the installers

```sh
npm run build
```

This runs `tauri build`, which compiles a release binary and packages it twice — once as an NSIS
installer, once as an MSI — per the `bundle.targets` list in `tauri.conf.json`. Output lands at:

```
target/release/bundle/nsis/MZ Video Downloader_<version>_x64-setup.exe
target/release/bundle/msi/MZ Video Downloader_<version>_x64_en-US.msi
```

The `bundle.resources` entry in `tauri.conf.json` copies `bin/yt-dlp.exe` and `bin/ffmpeg.exe`
into a `bin/` folder next to the installed executable — this has to land at `bin/<name>.exe`
specifically, matching what `get_bin_path`'s release-mode branch expects
(`exe_dir/bin/<name>.exe`), not flattened into the resource root.

## 3. Assemble the portable package

`tauri build` doesn't produce a portable zip on its own — assemble it manually from the same
release output:

```sh
rm -rf dist/portable dist/MZ-Video-Downloader-Portable.zip
mkdir -p dist/portable
cp target/release/mz-video-downloader.exe "dist/portable/MZ Video Downloader.exe"
cp -r target/release/bin dist/portable/bin
cd dist && powershell -Command "Compress-Archive -Path 'portable\*' -DestinationPath 'MZ-Video-Downloader-Portable.zip' -Force"
```

`target/release/bin/` already has the correct layout (populated by the same `bundle.resources`
step), so this just copies the plain exe plus that `bin/` folder — no installer wrapper. `dist/`
is gitignored; nothing here gets committed.

## 4. Commit and tag

Commit the version bump and any code changes together, then push. Create the GitHub release
pointing at the new tag (`vX.Y.Z`), pasting the changelog entry as the release notes, and attach
all three files from steps 2–3 as release assets.

See [Versioning and releases](../explanation/versioning-and-releases.md) for how version numbers
are chosen.
