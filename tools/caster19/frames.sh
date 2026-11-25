#!/bin/sh
# Frames out of a clip for checking by eye: frames.sh <clip.mp4> <out.png> <fps-to-sample> [crop w:h:x:y] [cols]
# Samples the clip at the given rate, optionally crops (in the clip's own pixels), tiles them into one sheet.
in="$1"; out="$2"; rate="${3:-6}"; crop="$4"; cols="${5:-4}"
n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$in")
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print $1/$2}')
dur=$(awk "BEGIN{print $n/$fps}")
k=$(awk "BEGIN{print int($dur*$rate+0.999)}")
rows=$(( (k + cols - 1) / cols ))
vf="fps=$rate"
[ -n "$crop" ] && vf="$vf,crop=$crop"
vf="$vf,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}"
ffmpeg -y -loglevel error -i "$in" -vf "$vf" -frames:v 1 "$out" && echo "$out ($k frames)"
