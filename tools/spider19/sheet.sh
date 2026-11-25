#!/bin/sh
# A contact sheet of a clip's frames, to look at it frame by frame: sheet.sh clip.mp4 out.png [first=0] [step=3] [cols=4] [rows=2] [crop=780:900:0:420] [scale=0.5]
in="$1"; out="$2"; first="${3:-0}"; step="${4:-3}"; cols="${5:-4}"; rows="${6:-2}"; crop="${7:-780:900:0:420}"; sc="${8:-0.5}"
n=$((cols*rows))
ffmpeg -y -loglevel error -i "$in" -vf "select='gte(n\,$first)*not(mod(n-$first\,$step))',crop=$crop,scale=iw*$sc:ih*$sc,drawtext=text='%{n}':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" -frames:v 1 "$out"
