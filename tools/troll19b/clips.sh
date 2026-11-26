#!/bin/bash
# Lane troll19b: every staged clip, before or after (the same scenes, seeds and views).
#   bash tools/troll19b/clips.sh before|after [name-filter]
P=$1; F=${2:-.}
run() { echo "$1" | grep -q -E "$F" || return 0; bash tools/troll19b/clip.sh "$P-$@" 2>&1 | tail -1; }
run bowl-troll troll bowl 16 0.85 room
run near-troll troll near 10 0.85 room
run stand-troll troll stand 12 0.85 room
run stand-archer troll stand 10 0.85 room archer
run fetch-troll troll fetch 9 0.85 room
run break-troll troll break 16 0.85 follow paladin,archer,berserker
run bowl-rocktroll rockTroll bowl 16 0.85 room
run stand-rocktroll rockTroll stand 14 0.85 room
run break-rocktroll rockTroll break 26 0.85 follow paladin,archer,berserker
run bowl-yeti yeti bowl 16 0.85 room
run live-troll troll live 20 0.9 room paladin,archer
run live-rocktroll rockTroll live 20 0.9 room paladin,archer
run live-yeti yeti live 20 0.9 room paladin,archer
