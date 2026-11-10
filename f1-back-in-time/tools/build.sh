#!/bin/bash
# Full build: sound mix + 1080p render (4 parallel workers) -> out/<name>.mp4
# usage: tools/build.sh <voiceover audio file> [output.mp4] [scale]
set -e
cd "$(dirname "$0")/.."
VO_SRC=$1; OUT=${2:-out/F1_Back_In_Time_1080p.mp4}; SC=${3:-1.0}
mkdir -p out; TMP=$(mktemp -d)
ffmpeg -hide_banner -loglevel error -y -i "$VO_SRC" -t 56 -ac 1 -ar 48000 $TMP/vo.wav      # mouth-flap envelope source
python3 -m anim.sound "$VO_SRC" $TMP/mix.wav
python3 - "$TMP" <<'PY'
import sys
from anim.render import DURATION
n = 4; d = DURATION / n
open(sys.argv[1] + "/parts.txt", "w").write("".join(f"{i*d:.4f} {(i+1)*d:.4f}\n" for i in range(n)))
PY
i=0
while read a b; do
  python3 -m anim.render --range $a $b --out $TMP/p$i.mp4 --vo $TMP/vo.wav --scale $SC 2>$TMP/err$i.log &
  echo "file '$TMP/p$i.mp4'" >> $TMP/list.txt; i=$((i+1))
done < $TMP/parts.txt
wait
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $TMP/list.txt -i $TMP/mix.wav -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -movflags +faststart -shortest "$OUT"
rm -rf $TMP
echo "wrote $OUT"
