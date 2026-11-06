#!/usr/bin/env bash
# Build the app from web/ and android/, install it on the TV over Wi-Fi, and make it the screensaver.
# Usage (Git Bash):  scripts/install.sh [TV address, default 192.168.70.166]
set -euo pipefail

TV="${1:-192.168.70.166}:5555"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-C:/Android/jdk17}"
export ANDROID_HOME="${ANDROID_HOME:-C:/Android/sdk}"
GRADLE="${GRADLE:-C:/Android/gradle-8.10.2/bin/gradle.bat}"
ADB="$ANDROID_HOME/platform-tools/adb.exe"
APK="${ATVU_BUILD_DIR:-C:/Android/build/atvu}/app/outputs/apk/debug/app-debug.apk"

# The TV already trusts the ADB key from the UrTV setup; use it so no "Allow USB debugging?" is needed.
if [ -f "$USERPROFILE/.urtv/adbkey" ]; then export ADB_VENDOR_KEYS="$USERPROFILE/.urtv/adbkey"; fi

echo "== Building"
(cd "$ROOT/android" && "$GRADLE" --project-cache-dir C:/Android/build/atvu-cache assembleDebug --console=plain -q)

echo "== Connecting to $TV"
"$ADB" connect "$TV"
for _ in $(seq 1 40); do
  [ "$("$ADB" -s "$TV" get-state 2>/dev/null)" = "device" ] && break
  echo "   waiting: press Allow on the TV if it asks"; sleep 3
done

mkdir -p "$ROOT/backup"
if [ ! -f "$ROOT/backup/screensaver-before.txt" ]; then
  echo "screensaver_components=$("$ADB" -s "$TV" shell settings get secure screensaver_components | tr -d '\r')" > "$ROOT/backup/screensaver-before.txt"
fi

echo "== Installing"
"$ADB" -s "$TV" install -r "$APK"
"$ADB" -s "$TV" shell settings put secure screensaver_components com.rasheed.atvu/.SaverDream
echo "Screensaver now: $("$ADB" -s "$TV" shell settings get secure screensaver_components | tr -d '\r')"
