#!/usr/bin/env sh
set -eu

BASE_URL="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72"
OUT_DIR="assets/emoji/twemoji/72x72"

mkdir -p "$OUT_DIR"

python3 - <<'PY' | while IFS= read -r name; do
import sys

cue_texts = [
"👶😴🎶",
"⚰️💀🕯️",
"⚰️💀🕯️",
"🌅🥶❄️",
"⚰️🪦🌑",
"😭🌫️💔",
"🌑⚰️🪦",
"🌿🔪🧺",
"🥞🔥🍽️",
"🚶🕯️🙏",
"⛪️🍽️⚫",
"🛏️⚠️🕳️",
"🌅🥶❄️",
"👤➡️⚰️",
"👶😴🌙",
"🍂🕰️🔄",
"⚠️🕒",
"🔔⛪️⚰️",
"👶😴🎶",
"🛏️⚠️🕳️",
"📝"
]

SKIN_MODS = set(range(0x1F3FB, 0x1F400))

def split_clusters(text: str):
    clusters = []
    i = 0
    while i < len(text):
        cluster = text[i]
        i += 1
        while i < len(text):
            code = ord(text[i])
            prev = ord(cluster[-1])

            if code == 0xFE0F or code in SKIN_MODS:
                cluster += text[i]; i += 1; continue

            if prev == 0x200D or code == 0x200D:
                cluster += text[i]; i += 1; continue

            if 0x1F1E6 <= prev <= 0x1F1FF and 0x1F1E6 <= code <= 0x1F1FF:
                cluster += text[i]; i += 1; continue

            if code == 0x20E3:
                cluster += text[i]; i += 1; continue

            break

        if cluster and not cluster.isspace():
            clusters.append(cluster)

    return clusters

def to_filename(cluster: str) -> str:
    points = [f"{ord(ch):x}" for ch in cluster if ord(ch) != 0xFE0F]
    return "-".join(points) + ".png"

seen = set()
for t in cue_texts:
    for c in split_clusters(t):
        fn = to_filename(c)
        if fn not in seen:
            seen.add(fn)
            sys.stdout.write(fn + "\n")
PY
  dest="$OUT_DIR/$name"
  if [ -f "$dest" ]; then
    continue
  fi
  url="$BASE_URL/$name"
  echo "Downloading $name"
  curl -fsSL "$url" -o "$dest"
done