#!/bin/sh
# tools/melee19/sheet.sh <clip.mp4> <out.png> [first frame] [last frame] [every] [cols] [crop w:h:x:y]
# A contact sheet of a clip's frames, cropped to the play area round the followed hero.
in=$1; out=$2; a=${3:-0}; b=${4:-60}; s=${5:-3}; c=${6:-4}; cr=${7:-700:480:250:130}
n=$(( (b - a) / s + 1 )); r=$(( (n + c - 1) / c ))
ffmpeg -y -loglevel error -i "$in" -vf "select='between(n,$a,$b)*not(mod(n-$a,$s))',crop=$cr,scale=500:-1,drawtext=text='%{n}':x=6:y=6:fontsize=22:fontcolor=red,tile=${c}x${r}" -frames:v 1 "$out"
