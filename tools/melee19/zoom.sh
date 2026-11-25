#!/bin/sh
# tools/melee19/zoom.sh <clip.mp4> <out.png> <from s> <to s> [fps 10] [cols 5] [crop w:h:x:y]
# Frames at fps between two times, cropped round the middle (the camera is on the hero), each labelled with its time.
in=$1; out=$2; a=$3; b=$4; f=${5:-10}; c=${6:-5}; cr=${7:-560:420:320:240}
ffmpeg -y -loglevel error -ss $a -to $b -i "$in" -vf "fps=$f,crop=$cr,drawtext=text='%{pts\:flt}':x=6:y=6:fontsize=20:fontcolor=red,tile=${c}x4" -frames:v 1 "$out"
