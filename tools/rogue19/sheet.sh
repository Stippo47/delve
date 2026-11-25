#!/bin/sh
# frames of a clip as one sheet (for checking by eye): sheet.sh clip.mp4 out.png [fps] [from] [secs] [crop w:h]
f=$1; o=$2; fps=${3:-5}; ss=${4:-0}; t=${5:-6}; cr=${6:-560:560}
ffmpeg -v error -y -ss $ss -t $t -i "$f" -vf "fps=$fps,crop=$cr,scale=280:-1,tile=6x5:padding=4:color=white" -frames:v 1 "$o"
