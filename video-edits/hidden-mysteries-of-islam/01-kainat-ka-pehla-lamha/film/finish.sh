#!/bin/bash
# usage: finish.sh <video_noaudio.mp4> <audio.wav> <out.mp4> [crf=18] [audio_start_sec=0]
# final encode: fine film grain + audio mux (AAC 256k), faststart
V=$1; A=$2; O=$3; CRF=${4:-18}; SS=${5:-0}
ffmpeg -hide_banner -loglevel error -y -i "$V" -ss $SS -i "$A" -filter_complex "[0:v]noise=alls=4:allf=t,format=yuv420p[v]" -map "[v]" -map 1:a -c:v libx264 -preset medium -crf $CRF -profile:v high -level 4.2 -bf 2 -g 60 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$O"
ls -la "$O" | awk '{print $5/1048576 " MB"}'
