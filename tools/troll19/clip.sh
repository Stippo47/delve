#!/bin/bash
# Lane troll19: one staged clip (needs this lane's server: node tools/serve.mjs 8972 .).
#   bash tools/troll19/clip.sh <out name> <kind[@rank]> <scene> [secs=10] [zoom=1] [cam: hero|troll|mid|x,y] [extra blue,units]
# The scene is tools/troll19/stage.js (wall, corner, thin, pillar, crate, door, turn90, turn135, turn180, friends, live).
out=$1; kind=$2; scene=$3; secs=${4:-10}; zoom=${5:-1}; cam=${6:-hero}; blue=${7:-paladin}
k=${kind%@*}; red=$kind; [ "$scene" = friends ] && red="$kind,orc"
case $cam in
  hero) C='const c={x:S.h.x,y:S.h.y};' ;;
  troll) C='const c={x:S.u.x,y:S.u.y};' ;;
  mid) C='const c={x:(S.h.x+S.u.x)/2,y:(S.h.y+S.u.y)/2};' ;;
  *) C="const c={x:${cam%,*},y:${cam#*,}};" ;;
esac
live=""; [ "$scene" = live ] && live=",{fight:true}"
js="$(cat tools/troll19/stage.js);(()=>{const S=T19.stage('$scene'$live);$C S.w.camAt=c;})()"
node tools/clip.mjs docs/clips/troll19/$out.mp4 --port 8972 --seed ${SEED:-7} --battle "$red|$blue" --arena ${ARENA:-crypt} --skip 3.5 --secs $secs --w 700 --h 640 --zoom $zoom --eval "$js"
