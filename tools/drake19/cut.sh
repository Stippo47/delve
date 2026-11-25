#!/bin/bash
# cut.sh <framedir> <first> <last> <out.mp4> [crop=w:h:x:y]   an mp4 (30 a second) of frames first..last of a watch.mjs folder
d=$1; a=$2; b=$3; out=$4; crop=${5:-}
vf="scale=trunc(iw/2)*2:trunc(ih/2)*2"; [ -n "$crop" ] && vf="crop=$crop,$vf"
ffmpeg -y -loglevel error -framerate 30 -start_number $a -i "$d/f%05d.jpg" -frames:v $((b - a + 1)) -vf "$vf" -c:v libx264 -pix_fmt yuv420p -crf 22 -movflags +faststart "$out" && echo "$out ($((b - a + 1)) frames)"
