#!/bin/bash
# sheet.sh <framedir> <first> <step> <count> <cols> <out.jpg> [crop=w:h:x:y] [scale width per tile]
# A contact sheet of frames first, first+step, ... (count of them), cols across, each frame's number burnt in.
d=$1; first=$2; step=$3; count=$4; cols=$5; out=$6; crop=${7:-}; tw=${8:-390}
tmp=$(mktemp -d)
i=0; n=$first
while [ $i -lt $count ]; do
  f=$(printf "%s/f%05d.jpg" "$d" $n)
  [ -f "$f" ] || break
  cp "$f" "$(printf "%s/s%04d.jpg" "$tmp" $i)"
  i=$((i+1)); n=$((n+step))
done
rows=$(( (i + cols - 1) / cols ))
vf=""
[ -n "$crop" ] && vf="crop=$crop,"
ffmpeg -y -loglevel error -start_number 0 -i "$tmp/s%04d.jpg" -vf "${vf}scale=$tw:-1,drawtext=text='%{eif\:$first+n*$step\:d}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" -frames:v 1 -q:v 3 "$out"
rm -rf "$tmp"
echo "$out ($i frames)"
