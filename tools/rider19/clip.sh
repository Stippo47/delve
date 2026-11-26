#!/bin/bash
# Lane rider19: one staged clip of the tumble troll (needs node tools/serve.mjs 8978 running).
#   bash tools/rider19/clip.sh <out name> <scene> [secs=10] [zoom=1] [cam: room|follow|x,y] [blue units=paladin] [red=tumbleTroll]
out=$1; scene=$2; secs=${3:-10}; zoom=${4:-1}; cam=${5:-room}; blue=${6:-paladin}; red=${7:-tumbleTroll}
case $cam in
  room) C='const c={x:S.w.W/2,y:S.w.H/2};' ;;
  follow) C='const c={get x(){return S.u.dead?c._x:(c._x=S.u.x)},get y(){return S.u.dead?c._y:(c._y=S.u.y)}};' ;;
  *) C="const c={x:${cam%,*},y:${cam#*,}};" ;;
esac
js="$(cat tools/rider19/stage.js);(()=>{const S=R19.stage('$scene');$C S.w.camAt=c;})()"
mkdir -p docs/clips/rider19
node tools/clip.mjs docs/clips/rider19/$out.mp4 --port ${PORT:-8978} --seed ${SEED:-7} --battle "$red|$blue" --arena ${ARENA:-warren} --skip ${SKIP:-1} --secs $secs --w 700 --h 640 --zoom $zoom ${Q:+--q "$Q"} --eval "$js"
