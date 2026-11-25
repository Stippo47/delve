#!/bin/sh
# Round 18, lane dash18: frames of a clip laid side by side, to look a move over frame by frame.
#   sh tools/dash18/sheet.sh <clip.mp4> <from s> <frames> [fps=30] [cols=3] [out.png]     (every frame from `from`)
in=$1; from=$2; n=$3; fps=${4:-30}; cols=${5:-3}; out=${6:-${in%.mp4}-$from.png}
rows=$(( (n + cols - 1) / cols ))
ffmpeg -y -loglevel error -ss $from -i "$in" -vf "fps=$fps,scale=iw/2:ih/2,tile=${cols}x${rows}" -frames:v 1 "$out" && echo "$out"
