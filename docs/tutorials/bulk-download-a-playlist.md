# Tutorial: Bulk-download a playlist or album

This tutorial downloads several tracks at once from a playlist, using the track-picker that
appears instead of a single card.

## 1. Find a playlist or album link

Any of these work:

- A YouTube Music playlist: `https://music.youtube.com/playlist?list=PL...`
- A YouTube Music album: `https://music.youtube.com/playlist?list=OLAK5uy_...`
- A plain YouTube playlist: `https://www.youtube.com/playlist?list=PL...`

## 2. Paste it into the app

Paste the link and let it fetch, exactly like a single video. The app notices the `list=`
parameter in the URL and fetches the playlist's contents instead of a single video.

## 3. The track-picker opens

Instead of one card, a modal appears showing:

- The playlist or album's name, with a badge classifying it as an **Album**, **Music playlist**,
  or plain **Playlist** (see [the explanation](../explanation/music-track-detection.md) for how
  that's decided), the owner/artist name, and the item count.
- A grid of every track: cover art, title, artist/channel, and duration.
- Every available track is pre-selected with a checkbox. Unavailable tracks (deleted, private)
  are greyed out and already unchecked.

## 4. Adjust the selection

Click any card to toggle it — the whole card is clickable, not just the checkbox. Selected cards
get a highlighted border. Use **Select all** / **Select none** to jump to either extreme. The
counter at the top right ("12 of 35 selected") tracks your current selection.

## 5. Add the selected tracks

Click **Add selected**. The app fetches each track's full metadata one at a time and adds a
regular download card for each — the exact same pipeline as pasting each link individually, so
MP3 detection, metadata embedding, and cover-art cropping all apply per track automatically.

While this runs:

- The picker locks (you can't change the selection mid-batch).
- A status line shows progress ("Adding 7 of 35…").
- If you click **Cancel** while it's still adding, a confirmation appears warning you that
  stopping now removes any tracks already added in this batch. Choose **Keep adding** to let it
  finish, or **Discard & close** to stop and remove them.

## 6. Start the downloads

Once added, you'll have one card per track in the main list, same as any other download — review
quality/format per card if you want, then click **Start** on each (or go through them one at a
time).

## A heads-up on mismatches

Occasionally a playlist slot points to something other than the actual studio track — a live
performance video, for instance, uploaded separately from the song itself. When that happens the
app correctly shows it as a video, not a song, because that's genuinely what the link points to.
This isn't a bug in the app; see
[Why some tracks are detected as video, not music](../explanation/music-track-detection.md) for
why YouTube Music's own interface can mask this while the raw data doesn't.
