# Android TV update by Rasheed: project plan

An open-source (MIT) screensaver, home screen and setup toolkit for Android TV / Google TV boxes,
written from scratch. Arabic and English, UAE defaults.

## Parts

| Part | Folder | What it is | Status |
|---|---|---|---|
| Screensaver page | `web/` | One HTML page (no build step): clock, Hijri and Gregorian dates, prayer times, weather, matches, a content card, themed photos with captions | **v0.1 written** |
| Screensaver app | `android/` | A thin Android app: a `DreamService` (the screensaver) and a Settings icon, both showing `web/` from the app's assets | **v0.1 installed on the ARRIS box** |
| Home screen | `android/` + `web/js/home.js` | The same page with a favourites row, All apps (where favourites are chosen) and a Settings tile; `HomeActivity` lists and opens apps | **v0.2 is the ARRIS box's Home** |
| Setup scripts | `scripts/` | `install.sh` (build, install, set as screensaver) and `restore-screensaver.sh` (undo) so far; finding the TV, debloat and the rest next | started |

The Android apps are kept thin on purpose: everything you see is in `web/`, packed into the app at build
time, so a change there only needs `scripts/install.sh` (about a minute), never Java code.

## Decisions

- **Language:** Arabic (right-to-left) and English (left-to-right), one setting switches the whole page,
  layout direction included. Digits: Arabic-Indic or Latin, independent of the language.
- **Location defaults:** Sharjah, `Asia/Dubai`.
- **Prayer times:** Aladhan API. Method is a setting: `0` Shia Ithna-Ashari (Jafari, default),
  `16` Dubai, `4` Umm al-Qura, and the rest of Aladhan's list.
- **Hijri date:** the browser's Umm al-Qura calendar plus a ±2 day offset setting, so it can follow
  the local moon sighting.
- **Hadith and adhkar:** only from al-Kafi, Man La Yahduruhu al-Faqih, Tahdhib al-Ahkam and
  al-Istibsar (`web/data/hadith.js`, `web/data/adhkar.js`). Verses: any verse of the Quran.
- **Wisdom card:** sayings of Imam Ali, from Nahj al-Balagha (`web/data/imam-ali.js`).
- **Photos:** themes picked at random from Wikimedia Commons categories (UAE cities, cars, world
  nature, a favourite player), each shown with its caption, author and license. Only freely
  licensed photos, so the project can be public.
- **Matches:** TheSportsDB (free key), teams set by id.
- **Data sources:** all free and keyless: Aladhan, Open-Meteo, AlQuran Cloud, TheSportsDB,
  Wikimedia Commons.

## Religious texts need a human check

Every hadith, dhikr and saying in `web/data/` carries its reference and a `checked` flag that starts as
`false`. Before a public release, someone qualified should check each text and reference against the
printed books and set `checked: true`. The page shows unchecked entries too; set
`onlyChecked=1` to hide them.

## Roadmap

1. v0.1 `web/` screensaver page, runs in any browser. (done)
2. Install a JDK 17 and the Android command-line tools on this computer. (done: `C:\Android`)
3. `android/`: DreamService + WebView + settings screen; build and install on the ARRIS box. (done)
4. `scripts/`: find, connect, back up, install, set as screensaver, undo. (install and undo done)
4b. Adhan at any time, not only while the screensaver runs (a small background service with alarms).
5. Home screen, and `scripts/home.sh on|off` (switches Home, checks it came up, falls back to the previous home). (done)
6. Debloat lists for the ARRIS VIP7802 and common TVs, with a protected list that can never be disabled.
