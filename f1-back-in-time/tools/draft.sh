#!/bin/bash
# quick half-res draft of the whole film (4 parallel workers) muxed with a sound file
# usage: tools/draft.sh <vo.wav> <audio for mux> <out.mp4> [scale]
set -e
VO=$1; AUD=$2; OUT=$3; SC=${4:-0.5}; TMP=$(mktemp -d)
cd "$(dirname "$0")/.."
python3 - "$TMP" <<'PY'
import sys
from anim.render import DURATION
n=4; d=DURATION/n
open(sys.argv[1]+"/parts.txt","w").write("".join(f"{i*d:.4f} {(i+1)*d:.4f}\n" for i in range(n)))
PY
i=0
while read a b; do
  python3 -m anim.render --range $a $b --out $TMP/p$i.mp4 --vo "$VO" --scale $SC 2>/dev/null &
  echo "file '$TMP/p$i.mp4'" >> $TMP/list.txt; i=$((i+1))
done < $TMP/parts.txt
wait
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $TMP/list.txt -i "$AUD" -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
rm -rf $TMP
