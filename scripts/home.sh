#!/usr/bin/env bash
# Make Rasheed TV the TV's home screen, or put the previous one back.
#   scripts/home.sh on  [TV address]   our home; the one before is saved in backup/home-before.txt
#   scripts/home.sh off [TV address]   the saved one back (Projectivy on the ARRIS box)
# "on" presses Home and checks ours came up; if it didn't, it puts the previous home back at once.
set -euo pipefail

MODE="${1:-}"
TV="${2:-192.168.70.166}:5555"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADB="${ANDROID_HOME:-C:/Android/sdk}/platform-tools/adb.exe"
OURS="com.rasheed.atvu/.HomeActivity"
if [ -f "$USERPROFILE/.urtv/adbkey" ]; then export ADB_VENDOR_KEYS="$USERPROFILE/.urtv/adbkey"; fi

sh_() { "$ADB" -s "$TV" shell "$@" | tr -d '\r'; }
current_home() { sh_ cmd package resolve-activity --brief -c android.intent.category.HOME -a android.intent.action.MAIN | tail -n 1; }
on_screen() { sh_ dumpsys activity activities | grep -m1 -E 'mResumedActivity|topResumedActivity' || true; }

"$ADB" connect "$TV" > /dev/null
mkdir -p "$ROOT/backup"

case "$MODE" in
  on)
    before="$(current_home)"
    if [ "$before" != "com.rasheed.atvu/.HomeActivity" ] && [ ! -f "$ROOT/backup/home-before.txt" ]; then
      echo "$before" > "$ROOT/backup/home-before.txt"
    fi
    sh_ cmd package set-home-activity "$OURS"
    sh_ input keyevent KEYCODE_WAKEUP; sleep 1
    sh_ input keyevent KEYCODE_HOME
    for _ in 1 2 3 4 5; do
      sleep 3
      if on_screen | grep -q "com.rasheed.atvu/.HomeActivity"; then echo "OK: Home opens Rasheed TV"; exit 0; fi
    done
    prev="$(cat "$ROOT/backup/home-before.txt")"
    echo "!! Rasheed TV did not come up on Home: putting $prev back"
    sh_ cmd package set-home-activity "$prev"
    sh_ input keyevent KEYCODE_HOME
    exit 1
    ;;
  off)
    prev="$(cat "$ROOT/backup/home-before.txt" 2>/dev/null || true)"
    [ -n "$prev" ] || { echo "!! No backup/home-before.txt: nothing saved to go back to"; exit 1; }
    sh_ cmd package set-home-activity "$prev"
    sh_ input keyevent KEYCODE_HOME
    echo "Home now: $(current_home)"
    ;;
  *) echo "Usage: scripts/home.sh on|off [TV address]"; exit 2 ;;
esac
