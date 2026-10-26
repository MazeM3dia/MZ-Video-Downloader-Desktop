# How to troubleshoot a failed download

## Fetch failed with a specific message

The app translates common yt-dlp errors into plain messages on the fetch screen:

| Message shown | What it means |
|---|---|
| Video is private | The video requires the uploader's permission to view. |
| Video unavailable | It's been removed or the ID is wrong. |
| Age-restricted — sign in required | yt-dlp can't bypass YouTube's age gate without a login; not supported. |
| Geo-blocked in your region | Not available in your country — a VPN may help. |
| Could not extract video info | yt-dlp couldn't parse the page; often fixed by [updating yt-dlp](update-ytdlp-manually.md). |
| Unsupported URL | The site isn't one yt-dlp recognizes. |
| Error fetching video | A generic catch-all — see below. |

## Generic "Error fetching video"

This covers everything not matched above, including yt-dlp failing to even start. Two common
causes:

- **yt-dlp.exe or ffmpeg.exe missing from `bin/`.** Confirm both files exist next to the app
  (`bin/yt-dlp.exe`, `bin/ffmpeg.exe` for a portable install, or beside the installed exe
  otherwise).
- **Outdated yt-dlp.** YouTube changes its site often enough that yt-dlp needs regular updates to
  keep extracting correctly. Try [updating it](update-ytdlp-manually.md) — or wait for the
  in-app update banner, which checks automatically on launch.

## Download starts but fails partway through

Check the status line under the progress bar on that card — yt-dlp's own stderr output surfaces
there, prefixed `ERROR:`. The card also offers **Retry** (tries again fresh) or **Resume** (if
cancelled rather than failed) once it stops.

## A music track downloaded as a video (no MP3, no metadata)

This usually isn't a bug — see
[Why some tracks are detected as video, not music](../explanation/music-track-detection.md) for
why a playlist slot can genuinely point at non-song content even when it looks like a song.

## Audio won't play on Windows after downloading

Older downloads may have used Opus audio, which Windows Media Player doesn't support natively.
Current versions default to AAC/MP3 for exactly this reason — re-download if you still hit this.
