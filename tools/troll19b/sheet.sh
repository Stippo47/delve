#!/bin/bash
# Lane troll19b: a sheet of frames from a clip, for the lane's own checking (not for showing).
#   bash tools/troll19b/sheet.sh <clip.mp4> <out.jpg> [from s=0] [to s=end] [fps=3] [cols=4] [width=480] [crop w:h:x:y]
in=$1; out=$2; from=${3:-0}; to=${4:-99}; fps=${5:-3}; cols=${6:-4}; wd=${7:-480}; crop=${8:-}
vf="fps=$fps"; [ -n "$crop" ] && vf="$vf,crop=$crop"
ffmpeg -y -loglevel error -ss $from -to $to -i "$in" -vf "$vf,scale=$wd:-1,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${9:-8}:padding=4" -frames:v 1 "$out"
