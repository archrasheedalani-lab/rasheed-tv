# Set up a TV with Rasheed TV: the instructions for Claude

**For the person:** open Claude on a computer that is on the **same Wi-Fi as the TV** (the Claude desktop app,
**Code** tab, with a folder on this computer; a chat in a web browser can't reach your TV), and paste this one line:

> Set up my TV with Rasheed TV from https://github.com/archrasheedalani-lab/rasheed-tv: follow docs/SETUP-PROMPT.md step by step. You are on a computer on the same Wi-Fi as the TV.

Everything below the line is for Claude.

---

Install **Rasheed TV** (a screensaver and an optional home screen for Android TV / Google TV) on the person's TV
over Wi-Fi with `adb`, from the latest release of https://github.com/archrasheedalani-lab/rasheed-tv. Talk to the
person in their language (Arabic or English); keep commands in English. Read this whole file before starting.

## Rules (these win over everything else here)

- **Ask before anything that changes the TV or this computer**, one clear question at a time: installing `adb`,
  installing the app, switching the screensaver, switching the home screen, removing anything.
- **Never** factory-reset, uninstall or disable the TV's own apps, `pm clear`, change Wi-Fi, network, account or
  developer settings, or send `reboot`. Turning debugging off is the person's job, never yours (it locks you out).
- **Never leave the TV without a home screen.** Only switch Home with `cmd package set-home-activity`, never by
  disabling the TV's own launcher; and before removing the app, put the previous home back.
- **Save before you change:** the TV's screensaver and home, in `rasheed-tv-backup.txt` in the working folder (step 4).
- **Proof, not hope:** say a step worked only after its check passed or you looked at a screenshot of the TV.
- If something fails twice, stop, show the person the output, and say what you think it is.
- The app's own settings (language, city, prayer method, cards, colours, photos, adhan, favourites) are changed
  **on the TV with the remote**, in the Rasheed TV app. There is no `adb` command for them; guide the person instead.

## 1. On the TV first (the person does this; tell them, in their language)

1. **Settings → System (or Device Preferences) → About → Build**: press OK on **Build** 7 times
   ("You are now a developer").
2. Back → **Developer options** → turn on **USB debugging** (and **Network debugging** if it is there).
3. **Settings → Network & Internet → their Wi-Fi**: read out the TV's **IP address** (like `192.168.1.23`).

Then ask for that IP address and wait for it.

## 2. `adb` on this computer

Check with `adb version`. If it is missing, ask once, then install it:

| System | Command |
|---|---|
| Windows | `winget install -e --id Google.PlatformTools --source winget` (then a new terminal) |
| macOS | `brew install android-platform-tools` |
| Linux | `sudo apt install adb` (or the distribution's package) |

## 3. Connect, and check it is an Android TV

Tell the person, **before** you connect: *a message "Allow USB debugging?" will appear on the TV: press **Allow**
and tick **Always allow from this computer**.* Then:

```
adb connect <IP>:5555
adb -s <IP>:5555 get-state                     # "device" = connected; "unauthorized" = Allow not pressed yet: wait, try again
adb -s <IP>:5555 shell getprop ro.product.model
adb -s <IP>:5555 shell getprop ro.build.version.release
adb -s <IP>:5555 shell pm list features         # must include feature:android.software.leanback
```

- No `android.software.leanback`: it is not an Android TV (Samsung and LG TVs can't run it). Stop, change nothing,
  and tell the person.
- Android 7 (SDK 24) or newer is needed.
- **Android 11+ and port 5555 refuses:** use **Wireless debugging** (Developer options): the person opens
  *Pair device with pairing code* and reads you the `IP:port` and the 6 digits; run `adb pair <IP:port> <code>`, then
  `adb connect` to the `IP:port` shown on the main Wireless debugging screen.

Tell the person the model and Android version.

## 4. Save the TV's settings first

```
adb -s <IP>:5555 shell settings get secure screensaver_components
adb -s <IP>:5555 shell settings get secure screensaver_enabled
adb -s <IP>:5555 shell cmd package resolve-activity --brief -c android.intent.category.HOME -a android.intent.action.MAIN
```

Write the three answers, labelled, into `rasheed-tv-backup.txt` in the working folder (the last line of the third
command is the home screen, like `com.google.android.apps.tv.launcherx/.home.HomeActivity`). Don't overwrite the
file if it is already there: it holds the settings from before the first install.

## 5. Install the app

Ask, then download the newest release and install it:

```
https://github.com/archrasheedalani-lab/rasheed-tv/releases/latest/download/RasheedTV.apk
adb -s <IP>:5555 install -r RasheedTV.apk       # ends with "Success"
```

- `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: a copy signed with another key is already there (someone's own build).
  Stop and ask; removing it loses that copy's settings.
- `INSTALL_FAILED_VERIFICATION_FAILURE` or a Play Protect message on the TV: ask the person to choose
  **Install anyway** on the TV, then run the same command again. Never switch Play Protect off.

## 6. Make it the screensaver (ask first)

```
adb -s <IP>:5555 shell settings put secure screensaver_components com.rasheed.atvu/.SaverDream
adb -s <IP>:5555 shell settings put secure screensaver_enabled 1
adb -s <IP>:5555 shell am start -n com.android.systemui/.Somnambulator    # start it now
adb -s <IP>:5555 exec-out screencap -p > screensaver.png                  # wait ~20 s first: photos and data load
```

Look at `screensaver.png` and describe it: clock, dates, weather, prayer, countdowns, a photo with its caption.
(Some TVs start the screensaver only on their own timer; then open the app instead:
`adb -s <IP>:5555 shell am start -n com.rasheed.atvu/.SettingsActivity`.) Any button on the remote ends it.

## 7. The home screen (optional: ask first, explain it)

Rasheed TV can also be the screen **Home** opens: the same design with a row of the person's favourite apps.
The TV's own home stays installed. Only if they want it:

```
adb -s <IP>:5555 shell cmd package set-home-activity com.rasheed.atvu/.HomeActivity
adb -s <IP>:5555 shell input keyevent KEYCODE_HOME
adb -s <IP>:5555 shell dumpsys activity activities | grep -m1 -E "mResumedActivity|topResumedActivity"
```

The last line must name `com.rasheed.atvu/.HomeActivity` (try again after a few seconds). If it doesn't after
15 seconds, put the saved home back at once (`set-home-activity <the home from rasheed-tv-backup.txt>`, then
`KEYCODE_HOME`) and tell the person. Then take a screenshot and look at it.

## 8. Show the person how to use it

- **Settings:** the **Rasheed TV** app (or the **Settings** tile at the end of the home row): language, digits,
  12/24 h, text size, colours and themes, city (search any city) and time zone, prayer method, Islamic/Gregorian date,
  what shows on screen, the card beside the clock, countdowns, teams, photo themes, adhan. **Save** at the bottom.
- **Home row:** left/right and OK. **All apps** → **Choose favourites** (OK adds or removes ★).
  **Hold OK** on an app to move it, OK to put it down, **Done**.
- The shared app has **no adhan recording**: the adhan needs the person's own build (README, "Build it").

## 9. Undo (if the person asks, now or later)

In this order:

```
adb -s <IP>:5555 shell cmd package set-home-activity <the saved home>      # only if Rasheed TV was made Home
adb -s <IP>:5555 shell input keyevent KEYCODE_HOME                        # check the TV's own home is on screen
adb -s <IP>:5555 shell settings put secure screensaver_components <the saved screensaver>
adb -s <IP>:5555 uninstall com.rasheed.atvu
```

If the saved screensaver was `null`, use `settings delete secure screensaver_components` instead.

## 10. Finish

Tell the person what is now on their TV, with the screenshots you looked at; how to change things (the Rasheed TV
app); how to undo (step 9, from any Claude on this computer: "remove Rasheed TV from my TV, following
docs/SETUP-PROMPT.md step 9"); and that they may turn **USB/Network debugging** off on the TV for privacy (then a
later change from the computer needs it on again).
