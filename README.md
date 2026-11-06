# Android TV update by Rasheed

An open-source screensaver, home screen and setup toolkit for Android TV / Google TV, in Arabic and
English. Written from scratch; MIT licensed.

> Status: **v0.2.4**. A screensaver and a home screen for Android TV, with a settings panel for everything.
> The debloat scripts are next: see [docs/PLAN.md](docs/PLAN.md).

## Install it on your TV (no computer needed)

Works on Android TV and Google TV (Android 7 or newer): Sony, TCL, Hisense, Philips, Xiaomi boxes, Chromecast
with Google TV, operator boxes… Not on Samsung (Tizen) or LG (webOS) TVs.

1. On the TV, install **Downloader** (by AFTVnews) from the Play Store.
2. Allow it to install apps: **Settings → Apps → Security & restrictions → Unknown sources → Downloader: on**
   (on some TVs: **Settings → Privacy → Security → Install unknown apps**).
3. Open Downloader, type the link to `RasheedTV.apk` from this repository's **Releases** page (it has the form
   `https://github.com/<user>/rasheed-tv/releases/latest/download/RasheedTV.apk`), press **Go**, then **Install**.

4. **Screensaver:** Settings → Device Preferences (or System) → **Screen saver** → **Rasheed TV screensaver**.
5. **Settings:** open the **Rasheed TV** app: language, city, prayer method, cards, colours, photos…
6. **Home screen (optional):** some TVs ask which home to use the first time you press Home; pick **Rasheed TV**.
   Others need it set once from a computer with `adb`
   (`adb shell cmd package set-home-activity com.rasheed.atvu/.HomeActivity`), or `scripts/home.sh on`.

The shared app has no adhan recording (recordings belong to whoever made them): the adhan works when you build
the app yourself with your own `web/audio/adhan.mp3` (below).

## Build it and install it from your computer

Needs Java 17, the Android SDK (platform 34) and Gradle 8.10 (here in `C:\Android`). In Git Bash:

```bash
scripts/install.sh 192.168.70.166
```

It builds the app with your `web/` files (and `web/audio/adhan.mp3`) inside, installs it over Wi-Fi and makes it the
screensaver. The app's **Rasheed TV** icon opens the settings. `scripts/restore-screensaver.sh` puts the previous
screensaver back (`--uninstall` also removes the app, after putting the previous home screen back).

### The home screen

```bash
scripts/home.sh on     # Home opens Rasheed TV (the previous home is saved in backup/home-before.txt)
scripts/home.sh off    # the previous home back (Projectivy on the ARRIS box)
```

Your design on top, your favourite apps below. Left/right and OK on the remote; the last two tiles are
**All apps** (with **Choose favourites**: OK on an app adds or removes it) and **Settings**.

To change the order: **hold OK** on an app in the row (or All apps → **Arrange favourites**). OK picks an app up,
left/right moves it, OK puts it down; **Done** or Back finishes. The order is saved on the TV.

## The screensaver page

- Clock in the chosen city's time, with the Hijri date (adjustable ±2 days) and the Gregorian date
- Next prayer with a countdown; prayer method is a setting (Jafari by default, Dubai, Umm al-Qura…)
- Weather now and today's high/low, a 5-day forecast card
- Your teams' next matches (club names always in English)
- Three countdowns side by side: Ramadan, the Prophet's birthday (17 Rabi al-Awwal) and Imam Ali's birthday (13 Rajab)
- One card beside the clock:
  - verse and hadith of the day (one day a verse, the next a hadith)
  - morning and evening adhkar (morning Fajr–Dhuhr, evening Asr–Maghrib)
  - sayings of Imam Ali, from Nahj al-Balagha
  - prayer times, weather, matches, or nothing
- Background photos at random from the themes you pick (UAE cities, cars, world nature, a favourite
  player), each with its caption, photographer and license, from Wikimedia Commons
- Arabic or English, Arabic-Indic or Latin digits

### Try it on the computer

```bash
python -m http.server 8765 --directory web
```

Then open http://127.0.0.1:8765. Press **Enter** (or **OK** on a TV remote, or **S**) for the settings panel.
Everything on the page can be changed there:

- **General:** language, digits, 12/24-hour clock, text size, background dimming
- **Colours:** six themes (Desert gold, Emerald, Night blue, Rose, Royal purple, Black and white), then your own
  accent, text and card colours on top
- **Call to prayer (adhan):** on/off, which prayers, volume, and a test button. Plays `web/audio/adhan.mp3`, a
  recording you add yourself (for example Sheikh Abdul Basit Abdul Samad's): see [web/audio/README.md](web/audio/README.md)
- **City and time zone:** a built-in city, or search any city in the world (English or Arabic; it brings its own
  coordinates and time zone), and a time zone list to override the city's zone
- **Prayer and date:** prayer method, which date is on top (Islamic or Gregorian, one only, or switching every 10 seconds), Hijri date offset
- **Show on screen:** turn each part on or off (dates, weather, clock, card, next prayer, countdowns, matches, photo caption)
- **Card**, **countdowns** (up to 4 of 10 occasions), **followed teams** (search and add any club, remove any)
- **Background photos:** themes and how often they change
- **Reset to defaults**

Settings can also go in the address, for example
`http://127.0.0.1:8765/#lang=en&card=imam_ali&themes=uae,nature`.

| Setting | Values | Default |
|---|---|---|
| `lang` | `ar`, `en` | `en` |
| `digits` | `auto`, `arab`, `latn` | `auto` |
| `place` | a key of `web/data/places.js` (`sharjah`, `dubai`, `abudhabi`, `karbala`…) | `sharjah` |
| `name`, `lat`, `lon`, `cityTz` | any other place (the settings panel's city search fills these) | |
| `tz` | an IANA time zone (`Asia/Dubai`, `Europe/London`…) overriding the city's own | the city's |
| `clock24` | `true`, `false` | `false` |
| `scale` | `0.9`, `1`, `1.15`, `1.3` | `1` |
| `theme` | `desert`, `emerald`, `night`, `rose`, `royal`, `mono` | `desert` |
| `accent`, `textColor`, `cardColor` | a colour like `#5FC9A0` (in the address, write `%235FC9A0`) | the theme's |
| `adhan` | `1` on, `0` off | off |
| `adhanPrayers` | comma list of `Fajr`, `Dhuhr`, `Asr`, `Maghrib`, `Isha` | all five |
| `adhanVolume` | `0` … `1` | `0.8` |
| `adhanFile` | path of the audio file, relative to `web/` | `audio/adhan.mp3` |
| `dim` | `light`, `medium`, `strong` | `medium` |
| `show` | comma list of `dates`, `weather`, `clock`, `card`, `prayer`, `countdowns`, `matches`, `caption` | all |
| `countdowns` | up to 4 of `ramadan`, `mawlid`, `aliBirth`, `fitr`, `adha`, `ghadir`, `newYear`, `ashura`, `mabath`, `shaban` | `ramadan,mawlid,aliBirth` |
| `method` | an [Aladhan method](https://aladhan.com/calculation-methods) number: `0` Jafari, `16` Dubai, `4` Umm al-Qura, `7` Tehran… | `0` |
| `hijriOffset` | `-2` … `2` | `0` |
| `dateMode` | `hijri_first`, `greg_first`, `hijri_only`, `greg_only`, `alternate` (swap every 10 s) | `hijri_first` |
| `card` | `verse_hadith`, `adhkar`, `imam_ali`, `prayers`, `forecast`, `matches`, `none` | `verse_hadith` |
| `themes` | comma list of `uae`, `cars`, `nature`, `player` | all four |
| `photoMinutes` | `5`, `10`, `15`, `30`, `60` | `30` |
| `onlyChecked` | `1` shows only texts marked as checked | off |

## Content

| File | What | Sources |
|---|---|---|
| `web/data/hadith.js` | hadith of the day | al-Kafi, Man La Yahduruhu al-Faqih, Tahdhib al-Ahkam, al-Istibsar |
| `web/data/adhkar.js` | morning and evening adhkar | the same four books |
| `web/data/imam-ali.js` | sayings of Imam Ali | Nahj al-Balagha |
| `web/data/photo-themes.js` | photo themes | Wikimedia Commons categories |
| `web/data/places.js` | cities and followed teams | |

**Every religious text starts with `checked: false`.** Please compare each text and reference with the
printed book before relying on it, then set `checked: true`. Corrections and additions are welcome.

## Data sources (all free, no keys)

[Aladhan](https://aladhan.com) (prayer times) · [Open-Meteo](https://open-meteo.com) (weather) ·
[AlQuran Cloud](https://alquran.cloud) (verses, Sahih International translation) ·
[TheSportsDB](https://www.thesportsdb.com) (matches) · [Wikimedia Commons](https://commons.wikimedia.org) (photos,
each under its own free license, credited on screen) · Fonts: Noto Kufi Arabic, Noto Naskh Arabic,
Playfair Display (SIL Open Font License, via Google Fonts).

## License

MIT, © 2026 Rasheed. See [LICENSE](LICENSE).

## Releasing a new version

1. Raise `versionCode` and `versionName` in `android/app/build.gradle`.
2. Build the shareable file (no recordings, signed with the release key from `~/.rasheed-tv-signing/`):

   ```bash
   cd android && gradle assembleRelease
   ```

3. Attach it to a GitHub release as `RasheedTV.apk`, so the Downloader link above always gets the newest one.

Keep `~/.rasheed-tv-signing/` (the key and its password) backed up somewhere safe: TVs only accept an update
signed with the same key as the version they have.
