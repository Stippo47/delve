#!/bin/bash
# Lane toggles19: frames of a clip at the given seconds, side by side (tools/toggles19/f/<name>-tile.png)
# bash tools/toggles19/tile.sh <clip.mp4> <width> <sec> [sec...]
clip=$1; W=$2; shift 2; name=$(basename "$clip" .mp4); out=tools/toggles19/f; mkdir -p $out; ins=(); n=0
for t in "$@"; do ffmpeg -y -loglevel error -ss $t -i "$clip" -frames:v 1 $out/$name-$t.png; ins+=(-i $out/$name-$t.png); n=$((n+1)); done
ffmpeg -y -loglevel error "${ins[@]}" -filter_complex "hstack=inputs=$n,scale=$W:-1" $out/$name-tile.png && echo $out/$name-tile.png
