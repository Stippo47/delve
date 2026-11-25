#!/bin/sh
# A sheet of frames from a clip, with the clip time burned on each: sheet.sh <clip> <out.png> <start s> <length s> [fps 10] [cols 5] [width 300]
in="$1"; out="$2"; ss="$3"; t="$4"; fps="${5:-10}"; cols="${6:-5}"; wd="${7:-300}"
n=$(awk "BEGIN{print int($t*$fps+0.5)}"); rows=$(( (n + cols - 1) / cols ))
ffmpeg -y -loglevel error -ss "$ss" -t "$t" -i "$in" -vf "fps=$fps,scale=$wd:-2,drawtext=text='%{pts\:flt}':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" -frames:v 1 "$out"
