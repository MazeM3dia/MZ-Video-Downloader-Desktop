# Explanation: Bundled binaries and the update mechanism

## Three different "where is yt-dlp.exe" questions

`get_bin_path` in `lib.rs` has to answer "where's the bundled binary" differently depending on
how the app is currently running:

- **`tauri dev`** runs cargo with its working directory set to `src-tauri/`, not the repo root.
  A naive `./bin/yt-dlp.exe` lookup would resolve to a `bin/` folder that doesn't exist at that
  location. The debug-mode branch instead walks up from the current directory until it finds a
  `bin/` folder, which works regardless of exactly how deep `cargo run` happens to nest its
  working directory.
- **Installed or portable release build** runs from wherever the `.exe` actually sits — inside
  `Program Files` for an installer, or wherever the user extracted the portable zip. The
  release-mode branch resolves `bin/` relative to `std::env::current_exe()`'s directory instead
  of the process's working directory, since those can differ (e.g. launched via a desktop
  shortcut with a different working directory).

Both branches exist because there's no single relative path that's correct in both dev and
release contexts — the only way to ship one code path would be to require the same folder
layout in both, which `tauri dev`'s cargo invocation doesn't allow.

## Why updates don't touch `bin/` at all

The naive approach — have the self-update feature overwrite `bin/yt-dlp.exe` directly — breaks
for the installed build: `bin/` lives under `Program Files`, which a non-elevated process can't
write to. Rather than special-case "elevate if installed, write directly if portable," the app
uses one mechanism for both: a possible override file in the app's local data directory
(`get_ytdlp_override_path`, → `app_local_data_dir()/yt-dlp.exe`), which is always writable by the
current user regardless of install type. `get_ytdlp_path` checks there first and only falls back
to the bundled `bin/yt-dlp.exe` if no override exists.

This also means the originally-shipped binary is never mutated — if a downloaded update ever
turns out to be broken, deleting the override file alone reverts to the known-good bundled copy,
with no reinstall needed.

## Why this writes to `app_local_data_dir()`, not `app_data_dir()`

Windows draws a line between **Roaming** AppData (small, essential per-user settings meant to
follow a domain-joined user between machines on login) and **Local** AppData (larger,
machine-specific, disposable cache-like data). A downloaded ~20MB executable is squarely the
second kind — it doesn't need to roam, and roaming it would just bloat login/logout time on
domain-joined machines for no benefit. `app_local_data_dir()` is Tauri's equivalent of the Local
folder; an earlier version of this feature used the Roaming equivalent by mistake and was
switched over once that was noticed.

## Why this isn't yt-dlp's own `-U` self-update flag

yt-dlp ships a built-in `-U`/`--update` flag that overwrites its own running executable in
place. That's a reasonable approach for a standalone CLI tool, but doing it to a binary another
process (this app) is actively managing invites exactly the kind of file-locking and
antivirus-flagging friction Windows is known for around self-replacing executables. Downloading
to a separate override file and only ever reading the "current" path fresh on each invocation
sidesteps that entirely — nothing ever tries to replace a file that might be open.

## Why no restart is needed after updating

`get_ytdlp_path` is called fresh inside every command that needs it (`fetch_metadata`,
`fetch_playlist`, `check_ytdlp_update`, `start_download`) — there's no cached path stored
anywhere. The moment `download_ytdlp_update` finishes writing the override file, the very next
download or fetch call already resolves to it, with no signal or restart required to pick up the
change.

## Why this exact mechanism already existed once before

The original Electron version of this app (`v0.1.0`) had the same design — a
`checkYtdlpUpdate`/`download-ytdlp-update` pair, a user-data override path checked ahead of the
bundled copy. It was removed in `v0.2.0` as a simplification with no documented bug behind the
removal, and was reintroduced here once the project needed to hand the app to less technical
users who wouldn't know to replace `bin/yt-dlp.exe` themselves.
