#!/bin/bash
# Lane troll19: every staged clip, before or after (the same scenes, seeds and views). bash tools/troll19/clips.sh before|after [name-filter]
P=$1; F=${2:-.}
run() { echo "$1" | grep -q -E "$F" || return 0; bash tools/troll19/clip.sh "$P-$@" 2>&1 | tail -1; }
run wall-troll troll wall 9 1.3 hero
run thin-troll troll thin 10 1.15 640,470
run corner-rocktroll rockTroll corner 10 1.3 hero
run door-troll troll door 12 1.15 640,470
run pillar-rocktroll-elite rockTroll@1 pillar 10 1.15 640,480
run crate-troll troll crate 10 1.2 700,480
run friends-troll troll friends 9 1.3 troll
run turn90-troll troll turn90 9 1.25 troll
run turn180-troll troll turn180 10 1.25 troll
run turn135-rocktroll rockTroll turn135 10 1.25 troll
run turn180-rocktroll rockTroll turn180 11 1.25 troll
run yeti-corner yeti corner 12 1.3 hero
run yeti-wall yeti wall 12 1.3 hero
run yeti-door yeti door 12 1.15 640,470
run yeti-turn180 yeti turn180 12 1.25 troll
run live-troll troll live 20 1.1 640,480 paladin,archer
run live-rocktroll rockTroll live 20 1.1 640,480 paladin,archer
run live-yeti yeti live 20 1.1 640,480 paladin,archer
