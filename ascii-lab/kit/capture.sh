#!/bin/bash
# usage: capture.sh file.html out.png [width height]
# Headless Chrome screenshot after 2.5s of virtual time, software WebGL on.
set -u
if [ $# -lt 2 ]; then echo "usage: capture.sh file.html out.png [width height]" >&2; exit 2; fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W="${3:-1440}"; H="${4:-900}"
[ -f "$1" ] || { echo "capture: no such file: $1" >&2; exit 1; }

SRC="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT_DIR="$(cd "$(dirname "$2")" && pwd)" || exit 1
OUT="$OUT_DIR/$(basename "$2")"
URL="file://$(printf '%s' "$SRC" | sed 's/ /%20/g')"

PROFILE="$(mktemp -d "${TMPDIR:-/tmp}/labcap.XXXXXX")"
trap 'rm -rf "$PROFILE"' EXIT
rm -f "$OUT"

"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --allow-file-access-from-files --user-data-dir="$PROFILE" --no-first-run --no-default-browser-check \
  --disable-extensions --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=2500 --window-size="$W,$H" --screenshot="$OUT" "$URL" >/dev/null 2>&1 &
PID=$!

# macOS ships no timeout(1); a stuck renderer gets 45s.
for _ in $(seq 1 450); do
  kill -0 "$PID" 2>/dev/null || break
  sleep 0.1
done
kill -9 "$PID" 2>/dev/null
wait "$PID" 2>/dev/null

[ -s "$OUT" ] || { echo "capture: no screenshot for $1" >&2; exit 1; }
