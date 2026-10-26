# Explanation: Versioning and releases

## The pattern so far

Every release so far has bumped the **minor** version number for a new user-facing feature
(`0.3.0` → `0.4.0` → `0.5.0` → `0.6.0`), reserving patch bumps for fixes alone — though in
practice every release to date has shipped at least one new capability, so no patch release has
happened yet:

| Version | Headline feature |
|---|---|
| 0.3.0 | Migrated from Electron to Tauri v2 |
| 0.4.0 | YT Music track auto-detection, MP3 metadata embedding |
| 0.5.0 | Playlist/album bulk downloads, custom title bar |
| 0.6.0 | In-app yt-dlp update checker |

## Why three files have to agree on the version string

`package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` each carry their own
`version` field, and none of them read from each other — `get_app_version` (the command backing
the version shown in the app's own title bar) reads specifically from `tauri.conf.json` via
`app.config().version`, while `package.json`'s version only matters for `npm`'s own bookkeeping
and `Cargo.toml`'s only matters for the Rust crate. There's no single source of truth enforced by
tooling; keeping them in sync is a manual step during a release (see
[Create a release build](../how-to/create-a-release-build.md)).

## Why there's no CI/automated release pipeline

Releases are built and published manually: bump versions, run `npm run build`, assemble the
portable zip by hand, and create the GitHub release through the web UI with the artifacts
attached directly. This matches the project's current scale — a single maintainer, infrequent
releases — rather than being a deliberate rejection of automation; it's simply not been needed
yet.

## Why git pushes in this environment need a real terminal

Pushing to GitHub needs a credential prompt the first time (or after a cached credential goes
stale), and that prompt needs an interactive terminal with a real TTY to render. Automated/piped
shell environments without one get `fatal: could not read Username` instead of a prompt — this
is a property of the credential helper, not of git itself, and is why pushes sometimes need to
be run from an actual terminal window rather than through tooling.
