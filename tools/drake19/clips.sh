#!/bin/bash
# Lane drake19: the "after" clips (needs this lane's server: node tools/serve.mjs 8962 .). bash tools/drake19/clips.sh [set]
# set a: the full fight (the same party, level, seed and view as before-full-fight.mp4); set b: the close ones.
C=docs/clips/drake19; W="node tools/drake19/watch.mjs"; Z="--w 1280 --h 720 --scale 1 --follow"
P="--party paladin,twinfang,cleric" # the close clips of one move: three heroes, so less of their own effects lies over it
if [ "${1:-a}" = a ]; then
  $W $C/after-full --secs 240 --until --zoom 0.62 --mp4 $C/after-full-fight.mp4
else
  $W $C/after-p1 --secs 50 $Z --zoom 1.25 --mp4 $C/after-phase1-zoomed.mp4
  $W $C/after-bite --secs 14 $Z --zoom 1.3 $P --q "bossmove=bite" --mp4 $C/after-bite.mp4
  $W $C/after-claw --secs 16 $Z --zoom 1.3 $P --q "bossmove=claw" --mp4 $C/after-claw.mp4
  $W $C/after-tail --secs 16 $Z --zoom 1.3 $P --q "bossmove=tail" --mp4 $C/after-tail.mp4
  $W $C/after-scorch --secs 12 $Z --zoom 1.1 $P --q "bossmove=scorch" --mp4 $C/after-scorch.mp4
  $W $C/after-rush --secs 12 $Z --zoom 1.1 $P --q "bossmove=rush" --mp4 $C/after-rush.mp4
  $W $C/after-ring --secs 22 $Z --zoom 0.9 --q "bossphase=2&bossmove=ring" --mp4 $C/after-ring-firecall.mp4
  $W $C/after-turn --secs 14 $Z --zoom 1.1 --q "bossphase=2" --mp4 $C/after-phase-turn.mp4
  $W $C/after-molten --secs 26 $Z --zoom 1.0 --q "bossphase=3" --mp4 $C/after-phase3-molten.mp4
  $W $C/after-death --secs 14 $Z --zoom 1.1 --q "bossmove=death" --until --mp4 $C/after-death.mp4
fi
