#!/bin/bash
# usage: cap.sh option time out.png [w h]  -- renders one fixed frame headless with a real query string
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
P=$(mktemp -d /tmp/h3.XXXX)
"$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --user-data-dir=$P --no-first-run --force-device-scale-factor=1 --hide-scrollbars --virtual-time-budget=1500 --window-size=${4:-1440},${5:-900} --screenshot="$3" "file://$PWD/index.html?clean&o=$1&t=$2" >/dev/null 2>&1
rm -rf $P
