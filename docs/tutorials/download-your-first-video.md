# Tutorial: Download your first video

This walks through downloading a single video from a cold start. By the end you'll have a video
file on disk and understand the three basic steps every download follows: paste, fetch, start.

## 1. Open the app

Launch **MZ Video Downloader**. You'll see an empty list and a URL field in the sidebar on the
left, with a **Fetch Video** button beneath it.

## 2. Paste a URL

Copy any video link — YouTube, Instagram, TikTok, Twitter/X, Facebook, Vimeo, or one of the
[1000+ supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) — and
paste it into the URL field.

Two shortcuts exist for this:

- If you focus the URL field while your clipboard already holds a link, it's auto-pasted for you.
- If you paste a link (Ctrl+V) directly into the field, the app fetches it automatically — you
  don't need to click **Fetch Video** yourself in that case.

## 3. Fetch

Click **Fetch Video** (or press Enter). The app asks yt-dlp for the video's title, thumbnail, and
duration. A card appears in the main area showing this information, with:

- An editable title (used as the downloaded filename)
- A quality dropdown (1080p by default, down to 360p, or **MP3 Audio**)
- A save-location button (defaults to your Downloads folder)

If the fetch fails, the app explains why (private video, age-restricted, geo-blocked, etc.)
instead of a raw error — see [Troubleshoot a failed download](../how-to/troubleshoot-a-failed-download.md)
if you get stuck here.

## 4. Choose a format and start

Pick a quality from the dropdown if you want something other than 1080p, then click **Start**.
Progress (percentage, speed, ETA, file size) updates live on the card.

## 5. Open the result

Once it finishes, two buttons appear: **Show in folder** (opens the containing folder) and
**Play** (opens the file with your system's default player).

## What's next

- Try pasting a music link from YouTube Music instead — see
  [Download a song with full metadata](download-music-with-metadata.md) for what changes.
- Have a playlist or album link instead of a single video? See
  [Bulk-download a playlist or album](bulk-download-a-playlist.md).
