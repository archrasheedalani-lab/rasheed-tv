# The adhan audio file

The screensaver plays `web/audio/adhan.mp3` at the prayers chosen in the settings (Settings → Call to prayer).

The file is **not** in the repository: recordings belong to whoever made or published them, and this project is
MIT licensed. Each person adds the recording they want on their own TV, for example the adhan in the voice of
Sheikh Abdul Basit Abdul Samad.

1. Get the adhan as an MP3 from a source you trust that allows personal use.
2. Name it `adhan.mp3` and put it in this folder (`web/audio/adhan.mp3`).
3. In the settings, turn the adhan on, pick the prayers and the volume, and press **Test the adhan**.

A different file name or format works too: set `adhanFile` (for example `#adhanFile=audio/fajr.ogg`).

In a desktop browser, sound only plays after the first key press or click on the page (pressing OK to open the
settings counts). The Android TV app will allow it without that.
