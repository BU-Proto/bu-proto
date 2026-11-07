#!/bin/bash
# usage: sheet.sh roundDir
# Builds roundDir/sheet-N.png, 12 captioned thumbnails each. Any .html without a matching .png is captured first.
set -u
if [ $# -lt 1 ] || [ ! -d "$1" ]; then echo "usage: sheet.sh roundDir" >&2; exit 2; fi

KIT="$(cd "$(dirname "$0")" && pwd)"
ROUND="$(cd "$1" && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/labsheet.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
rm -f "$ROUND"/sheet-*.png

for f in "$ROUND"/*.html; do
  [ -e "$f" ] || continue
  png="${f%.html}.png"
  [ -s "$png" ] || "$KIT/capture.sh" "$f" "$png" 1440 900
done

ls -1 "$ROUND" | grep -E '\.png$' | grep -vE '^sheet-[0-9]+\.png$' | sort -V > "$WORK/list"
TOTAL=$(wc -l < "$WORK/list" | tr -d ' ')
[ "$TOTAL" -gt 0 ] || { echo "sheet: no png files in $ROUND" >&2; exit 1; }

page() { # page N names-file
  {
    cat <<'HTML'
<!doctype html><meta charset="utf-8"><title>sheet</title>
<style>
html,body{margin:0;background:#061a2e;color:#f6fbff;font:13px/1.3 ui-monospace,Menlo,monospace}
main{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:14px;padding:14px;height:1172px;box-sizing:border-box}
figure{margin:0;min-width:0;display:flex;flex-direction:column;gap:6px}
img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:#0b2a46}
figcaption{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style><main>
HTML
    while IFS= read -r name; do
      href=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$ROUND/$name")
      label=$(printf '%s' "${name%.png}" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
      printf '<figure><img src="file://%s"><figcaption>%s</figcaption></figure>\n' "$href" "$label"
    done < "$2"
    echo '</main>'
  } > "$WORK/sheet-$1.html"
}

split -l 12 "$WORK/list" "$WORK/part."
n=0
for part in "$WORK"/part.*; do
  n=$((n + 1))
  page "$n" "$part"
  "$KIT/capture.sh" "$WORK/sheet-$n.html" "$ROUND/sheet-$n.png" 1920 1200 || exit 1
  echo "$ROUND/sheet-$n.png"
done
