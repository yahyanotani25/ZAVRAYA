#!/bin/bash
# usage: frames.sh <clip.mp4 in assets/video> <start_sec> <dur_sec_of_source> <name> [step]
#  -> frames/<name>/00001.jpg ...  every source frame (or every <step>-th), 1920x1080 cover-crop, no frame-rate conversion.
#  In a scene: footage(s, '<name>', {n: <count>, speed: 1})  plays one extracted frame per output frame (30 fps).
S=/tmp/claude-0/-home-user-ZAVRAYA/11d60b1e-ec95-526d-bd06-3bd05d7e3343/scratchpad
ST=${5:-1}
mkdir -p "$S/frames/$4"
ffmpeg -hide_banner -loglevel error -y -ss "$2" -t "$3" -i "$S/assets/video/$1" -vf "select='not(mod(n\,$ST))',scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -vsync vfr -q:v 3 "$S/frames/$4/%05d.jpg"
echo "$4: $(ls "$S/frames/$4" | wc -l) frames"
