#!/bin/sh
# tools/art-hitfx/sheet.sh <clip> <out.png> <from> <to> [fps 10] [cols 6] [crop w:h:x:y] [scale 1]
in=$1; out=$2; a=$3; b=$4; f=${5:-10}; c=${6:-6}; cr=${7:-700:525:250:190}; s=${8:-0.6}
ffmpeg -y -loglevel error -ss $a -to $b -i "$in" -vf "fps=$f,crop=$cr,scale=iw*$s:-1,tile=${c}x5:padding=4" -frames:v 1 "$out" 2>/dev/null
