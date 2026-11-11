#!/bin/bash
# usage: render_all.sh <t_start_sec> <t_end_sec> <out_name> [workers=4] [chunk_sec=30] [query]
# renders [t0,t1) in parallel chunks -> ../out/<out_name>_video.mp4 (no audio)
S=/tmp/claude-0/-home-user-ZAVRAYA/11d60b1e-ec95-526d-bd06-3bd05d7e3343/scratchpad
T0=$1; T1=$2; NAME=$3; W=${4:-4}; CH=${5:-30}; Q=${6:-}
cd $S/film; mkdir -p $S/out/chunks/$NAME
F0=$(python3 -c "print(int(round($T0*30)))"); F1=$(python3 -c "print(int(round($T1*30)))"); CF=$(python3 -c "print(int($CH*30))")
: > $S/out/chunks/$NAME/list.txt; jobs_list=()
f=$F0; i=0
while [ $f -lt $F1 ]; do
  g=$((f+CF)); [ $g -gt $F1 ] && g=$F1
  o=$S/out/chunks/$NAME/c_$(printf %04d $i).mp4
  echo "file '$o'" >> $S/out/chunks/$NAME/list.txt
  jobs_list+=("$f $g $o")
  f=$g; i=$((i+1))
done
printf '%s\n' "${jobs_list[@]}" | xargs -P $W -L 1 bash -c 'if [ -s "$2" ] && [ -f "$2.done" ]; then echo "skip $2"; else node render.js $0 $1 $2 '"$Q"' && touch $2.done; fi'
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $S/out/chunks/$NAME/list.txt -c copy $S/out/${NAME}_video.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 $S/out/${NAME}_video.mp4
