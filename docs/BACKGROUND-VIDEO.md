# Background video activation

The player is implemented, but no footage is supplied or active yet. The existing gold device animation remains visible. An empty playlist makes no video network requests.

Supply licensed MP4 clips for at least twelve distinct devices: desktop, mouse, power extension, external drive, laptop, drone, camera, server, keyboard, router, printer and monitor. These are technology showcase visuals, not claims of current stock.

Use silent H.264 MP4, preferably 1280 × 720, roughly 10–20 seconds each. Keep all files together below the AppDeploy resource upload limit of 100 MB. Upload and bind actual binary files through AppDeploy resources before adding their served paths to `backgroundClips` in `src/components/BackgroundVideo.tsx`. Record the original source and applicable commercial-use license for each entry. Do not put nonexistent paths or fabricated licenses in the playlist.

The player cuts to the next clip after at most 20 seconds of playback, or at its end if shorter. Twelve playable clips cycle in at most four minutes of active playback, excluding network loading. Page navigation keeps the shared background mounted. Pausing, hiding the tab or enabling reduced motion stops movement. Missing clips are skipped and all-failed playlists reveal the existing animation.

After footage is configured, verify: all twelve devices appear in a complete cycle, navigation does not restart the sequence, no audio plays, full viewport coverage on mobile and desktop, controls stay clickable, pause/resume persists, reduced motion avoids video loading, tab visibility pauses playback, and unavailable clips fall back without an empty page. These footage-dependent checks are pending until real files are supplied.
