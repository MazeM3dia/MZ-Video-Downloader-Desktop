# Tutorial: Download a song with full metadata

This tutorial downloads a real song from YouTube Music and shows you the extra information the
app attaches automatically — something a plain video download doesn't get.

## 1. Find a song on YouTube Music

Go to [music.youtube.com](https://music.youtube.com), find a track, and copy its link. It'll look
like `https://music.youtube.com/watch?v=...`.

## 2. Paste it into the app

Paste the link into the URL field, same as any other link. Let it fetch.

## 3. Notice the difference

Compare this card to a regular video card:

- The **title** shown is the song's actual track name, not the raw YouTube video title.
- Instead of an uploader name and upload date, you see the **artist**, the **album**, and the
  **release year**.
- The quality dropdown has already jumped to **MP3 Audio** by itself — you don't need to pick it.

This happens because the app checks whether yt-dlp's metadata for that link includes `track` and
`artist` fields — fields only present when YouTube has the video registered as an actual song,
not just because the link came from YouTube Music. See
[Why some tracks are detected as video, not music](../explanation/music-track-detection.md) if
you want the full story, including why this occasionally guesses wrong.

## 4. Start the download

Click **Start** as usual. Behind the scenes, this download does three things a plain video
download doesn't:

1. Extracts the best available audio and encodes it to MP3 at the highest quality setting.
2. Embeds ID3 tags — title, artist, album, and release year — read straight from the song's own
   metadata.
3. Embeds the cover art as the file's thumbnail, cropped from its original 16:9 video thumbnail
   to a proper 1:1 square album-art shape.

## 5. Check the result

Open the finished MP3 in any player or file browser that shows tags (Windows Explorer's
"Details" view works fine) — you should see the title, artist, album, and year filled in, plus a
square cover image.

## What's next

Got a whole album or playlist of songs like this? See
[Bulk-download a playlist or album](bulk-download-a-playlist.md) — it applies this same treatment
to every track automatically.
