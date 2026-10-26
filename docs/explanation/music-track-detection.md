# Explanation: Why some tracks are detected as video, not music

## The detection rule

The app treats a fetched link as a music track only when yt-dlp's metadata for that *exact*
video includes both `track` and `artist` fields (`isMusicTrack = Boolean(meta.track && meta.artist)`
in `www/renderer.js`). When true: the title shown is the song name instead of the raw YouTube
title, the meta row shows artist/album/release-year instead of uploader/upload-date, the quality
dropdown jumps to MP3 automatically, and the eventual download embeds ID3 metadata with a
square cropped cover.

This is deliberately narrower than "did this link come from YouTube Music" or "is this playlist
labeled as music" — see why below.

## Why it's not based on the source URL (music.youtube.com vs youtube.com)

yt-dlp doesn't actually have a dedicated YouTube Music extractor. A `music.youtube.com` URL gets
redirected to the plain `youtube.com` extractor (yt-dlp prints a warning to this effect), which
returns exactly the same metadata shape either way. The *origin* of the link tells you nothing
extra about whether the underlying video is a song — it's the video's own metadata that matters,
regardless of which domain you copied the link from.

## Why `track`/`artist` specifically, not just any music-sounding metadata

YouTube attaches `track`, `artist`, `album`, and `release_year` to a video only when that video
is registered in its backend as an actual song — typically because it went through Content ID
or was uploaded as official audio with song metadata attached. A `categories: ["Music"]` tag is
much weaker — a huge range of unrelated content (official music videos, live performances, lyric
videos, podcasts about music) also gets tagged `Music` as a broad category without ever carrying
song-specific fields. Checking `track`+`artist` instead of `categories` is what correctly
separates "SaWaDiKa (Official Music Video)" (categories: Music, but `track`/`artist` both
`None`) from an actual song upload of the same artist.

## Why the same song can show differently from two different links

YouTube frequently has **two separate videos** for one song: an "official audio" upload (the one
carrying song metadata) and an "official music video" (a distinct upload with visuals, treated as
a plain video). A playlist slot points at one specific video ID — not at "this song" abstractly
— so whichever of the two got added to that playlist is what the app sees and classifies.
Re-adding "the same song" to a playlist later, via a different search result, can link the other
video ID, producing a different classification for what a human would call the same track.

This isn't limited to the audio/MV pair either — a playlist can link a completely separate
recording, like a Vevo-uploaded live performance, under a slot that visually reads as "the song."
One confirmed example from testing: a playlist slot titled
`Future - "Promise U That" Official Live Performance | Vevo` (duration 3:17) correctly showed as
a video, while the actual studio track (duration 3:25, from the album *Future Hndrxx Presents:
The WIZRD*) correctly showed as a song — different durations because they're genuinely different
pieces of content, not a classification bug.

## Why YouTube Music's own app can mask this

YouTube Music's web/app frontend has a private backend feature — song matching via audio
fingerprinting/Content ID — that recognizes a linked video corresponds to a known song and
displays that song's canonical metadata and cover art in its UI, even when the underlying video
is technically something else (like the live-performance example above). That matching logic is
internal to YouTube Music's product surface and isn't exposed through the public
`youtube.com/playlist` data yt-dlp reads — being logged into YouTube Music changes what *you*
see in *their* app, not what data is available to yt-dlp's extraction, authenticated or not.
