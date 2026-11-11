#!/bin/bash
# final picture encode in 4 parallel groups of render chunks (the grain filter is single-threaded), then joined without re-encoding
# usage: encode_par.sh <crf> <out.mp4>
S=/tmp/claude-0/-home-user-ZAVRAYA/11d60b1e-ec95-526d-bd06-3bd05d7e3343/scratchpad
E=$S/v14/out/enc2
CRF=${1:-21}; OUT=${2:-$S/v14/out/final_video.mp4}
for g in 0 1 2 3; do
  ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $E/g$g.txt -filter_complex "[0:v]noise=alls=3:allf=t,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -preset medium -crf $CRF -profile:v high -level 4.2 -bf 2 -g 60 -threads 3 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 $E/e$g.mp4 &
done
wait
printf "file '%s'\n" $E/e0.mp4 $E/e1.mp4 $E/e2.mp4 $E/e3.mp4 > $E/elist.txt
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $E/elist.txt -c copy -movflags +faststart "$OUT"
ls -la "$OUT" | awk '{print $5/1048576 " MiB"}'; ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
