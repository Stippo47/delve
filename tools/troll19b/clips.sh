#!/bin/bash
# Lane troll19b: every staged clip, before or after (the same scenes, seeds and views).
#   bash tools/troll19b/clips.sh before|after [name-filter]
P=$1; F=${2:-.}
run() { echo "$1" | grep -q -E "$F" || return 0; bash tools/troll19b/clip.sh "$P-$@" 2>&1 | tail -1; }
run bowl-troll troll bowl 16 1.0 640,480
run near-troll troll near 10 1.0 640,480
run stand-troll troll stand 12 1.0 640,480
run fetch-troll troll fetch 9 1.0 640,480
run break-troll troll break 16 1.0 640,480 paladin,archer
run bowl-rocktroll rockTroll bowl 16 1.0 640,480
run stand-rocktroll rockTroll stand 14 1.0 640,480
run break-rocktroll rockTroll break 18 1.0 640,480 paladin,archer
run bowl-yeti yeti bowl 16 1.0 640,480
run live-troll troll live 20 1.1 640,480 paladin,archer
run live-rocktroll rockTroll live 20 1.1 640,480 paladin,archer
run live-yeti yeti live 20 1.1 640,480 paladin,archer
