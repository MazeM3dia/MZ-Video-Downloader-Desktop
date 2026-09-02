# MZ Video Downloader

> **Heads up:** This tool is for personal use only. Please be mindful of content creators and only download videos you have the right to. We're not responsible for how you use it — use it wisely!

A lightweight desktop app for downloading videos from YouTube, Instagram, TikTok, Twitter/X, Facebook, Twitch, SoundCloud, Vimeo, and [1000+ more sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) — powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp) and ffmpeg.

> NOTE: The downloaded .zip contains a few files and folders:

* **MZ Video Downloader.exe** — the app itself, click to open.
* **bin/** — folder with `ffmpeg.exe` and `yt-dlp.exe`.

If downloads start failing (yt-dlp errors, "unsupported URL", etc.), download the latest [yt-dlp.exe](https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe) and replace the one inside the **bin** folder.

## Screenshots

![Main screen](images/image-1.png)
![Fetch video](images/image-2.png)
![Downloading](images/image-3.png)
![Completed](images/image-4.png)

## Features

- **Multi-format downloads** — 1080p, 720p, 480p, 360p video (MP4) or MP3 audio
- **Batch downloads** — queue multiple videos simultaneously
- **Real-time progress** — speed, ETA, and file size shown during download
- **Custom save location** — pick any folder per session
- **Auto-paste URL** — clipboard URL is pasted automatically on focus
- **Smart error messages** — identifies private, unavailable, age-restricted, and geo-blocked videos
- **Clean UI** — polished interface with dark/light mode toggle

## System Requirements

- **OS:** Windows 10 / 11 (x64)
- **WebView2** — required on Windows 10 (built-in on Windows 11)
- **No installation required** — portable, just extract and run

## Supported Sites

YouTube, Instagram, TikTok, Twitter/X, Facebook, Twitch, SoundCloud, Vimeo, and [1000+ more](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).

## How To Use

1. **Paste URL** — copy a video link; it auto-pastes when you click the URL field
2. **Fetch Video** — click **Fetch Video** (or press Enter) to load title, thumbnail, and duration
3. **Choose Format** — select quality (default: 1080p) or MP3 audio
4. **Select Location** — (optional) click **Download Location** to change save folder
5. **Download** — click **Start Download**; progress, speed, and ETA update in real time
6. **Open File** — click **Show in folder** once download completes
7. **New Download** — click **New Download** (top right) to download another video

## Troubleshooting

| Problem                     | Cause                                            | Fix                                                                                                                                                       |
| --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Video is private"          | Video requires login                             | Use a public video                                                                                                                                        |
| "Age-restricted"            | Platform requires sign-in                        | Not supported                                                                                                                                             |
| "Geo-blocked"               | Not available in your region                     | Use a VPN                                                                                                                                                 |
| Audio won't play on Windows | Opus codec not supported by Windows Media Player | Download again — app now prefers AAC                                                                                                                     |
| Download fails              | yt-dlp outdated                                  | Update `yt-dlp.exe` in the bin folder — see note above                                                                                                    |

## Changelog

**v0.3.0** — 2026-07-02

- Migrated from Electron to Tauri v2 — significantly smaller portable package
- UI overhaul with improved styling, custom dropdowns, and inline URL clear button
- Fixed window size (non-resizable, maximize disabled)
- Dark/light mode toggle

**V0.2.0**

- Removed yt-dlp auto-update feature
- Fixed startup crash on Electron 40
- Fixed audio downloads producing double extension (`.mp3.mp3`)
- System font fallback (Arial / system-ui) for consistent UI across machines

**V0.1.0**

- Initial release
- Multi-format video/audio download via yt-dlp + ffmpeg
- Real-time progress with speed, ETA, and file size
- Smart error messages for private/unavailable/geo-blocked videos
- Auto-paste URL from clipboard on focus
- Open downloaded file location from UI
- Duplicate download guard
- AAC audio preference for YouTube (fixes Windows playback issue)
