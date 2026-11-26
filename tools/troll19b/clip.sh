#!/bin/bash
# Lane troll19b: one staged clip (needs a server on the lane's port: node tools/serve.mjs 8976 <root>).
#   bash tools/troll19b/clip.sh <out name> <kind[@rank]> <scene> [secs=10] [zoom=1] [cam: room|hero|troll|mid|x,y] [blue units]
# Scenes: tools/troll19b/stage.js (bowl, near, stand, fetch, break) and tools/troll19/stage.js's own (live, push, wall, ...).
out=$1; kind=$2; scene=$3; secs=${4:-10}; zoom=${5:-1}; cam=${6:-room}; blue=${7:-paladin}
case $cam in
  hero) C='const c={x:S.h.x,y:S.h.y};' ;;
  troll) C='const c={x:S.u.x,y:S.u.y};' ;;
  mid) C='const c={x:(S.h.x+S.u.x)/2,y:(S.h.y+S.u.y)/2};' ;;
  room) C='const c={x:S.w.W/2,y:S.w.H/2};' ;;
  *) C="const c={x:${cam%,*},y:${cam#*,}};" ;;
esac
case $scene in
  bowl|near|stand|fetch|break) ST="T19.stage2('$scene')" ;;
  live) ST="T19.stage('live',{fight:true})" ;;
  *) ST="T19.stage('$scene')" ;;
esac
js="$(cat tools/troll19/stage.js);$(cat tools/troll19b/stage.js);(()=>{const S=$ST;$C S.w.camAt=c;import('./js/render.js').then((R)=>{if(R.snapCamera)R.snapCamera();});})()"
mkdir -p docs/clips/troll19b
node tools/clip.mjs docs/clips/troll19b/$out.mp4 --port ${PORT:-8976} --seed ${SEED:-7} --battle "$kind|$blue" --arena ${ARENA:-crypt} --skip 3.5 --secs $secs --w 700 --h 640 --zoom $zoom ${Q:+--q "$Q"} --eval "$js"
ffmpeg -y -loglevel error -i docs/clips/troll19b/$out.mp4 -vf "trim=start_frame=2,setpts=PTS-STARTPTS" -c:v libx264 -pix_fmt yuv420p -crf 22 -movflags +faststart docs/clips/troll19b/.$out.tmp.mp4 && mv docs/clips/troll19b/.$out.tmp.mp4 docs/clips/troll19b/$out.mp4
