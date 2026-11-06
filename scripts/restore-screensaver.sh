#!/usr/bin/env bash
# Put back the screensaver the TV had before scripts/install.sh (saved in backup/screensaver-before.txt).
# Our app stays installed; add --uninstall to remove it too (the previous home screen comes back first).
# Usage (Git Bash):  scripts/restore-screensaver.sh [TV address] [--uninstall]
set -euo pipefail

TV="${1:-192.168.70.166}:5555"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADB="${ANDROID_HOME:-C:/Android/sdk}/platform-tools/adb.exe"
if [ -f "$USERPROFILE/.urtv/adbkey" ]; then export ADB_VENDOR_KEYS="$USERPROFILE/.urtv/adbkey"; fi

before="$(sed -n 's/^screensaver_components=//p' "$ROOT/backup/screensaver-before.txt")"
"$ADB" connect "$TV" >/dev/null
# If the old screensaver's app is gone (UrTV's was removed on 2026-11-06), let the TV pick its own.
if [ -n "$before" ] && "$ADB" -s "$TV" shell pm list packages "${before%%/*}" | grep -qx "package:${before%%/*}"; then
  "$ADB" -s "$TV" shell settings put secure screensaver_components "$before"
else
  "$ADB" -s "$TV" shell settings delete secure screensaver_components
fi
echo "Screensaver now: $("$ADB" -s "$TV" shell settings get secure screensaver_components | tr -d '\r')"
if [ "${2:-}" = "--uninstall" ]; then
  # Never leave the TV without a home screen: the previous home first, then remove ours.
  if [ -f "$ROOT/backup/home-before.txt" ]; then bash "$ROOT/scripts/home.sh" off "${1:-192.168.70.166}"; fi
  "$ADB" -s "$TV" uninstall com.rasheed.atvu
fi
