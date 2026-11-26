#!/bin/bash
# Lane toggles19: the proof clips (needs this lane's server: node tools/serve.mjs 8963 .). bash tools/toggles19/clips.sh
C=docs/clips/toggles19; mkdir -p $C
CL="node tools/clip.mjs"; P="--port 8963"
B="rattlerMace*2,brute*1,slime*2,rat*2,goblin*2|paladin,archer,cleric,necromancer"
F="--battle $B --seed 3 --skip 3 --secs 5 --zoom 1.2"
$CL $C/fight-both-on.mp4 $P $F --q "outlines=1&hpbars=1"
$CL $C/fight-outlines-off.mp4 $P $F --q "outlines=0&hpbars=1"
$CL $C/fight-bars-off.mp4 $P $F --q "outlines=1&hpbars=0"
$CL $C/fight-both-off.mp4 $P $F --q "outlines=0&hpbars=0"
# a boss with outlines off (and its bar at the top hidden in the bars-off one)
R="--party paladin,archer,cleric --level 6 --skip 3 --secs 6 --zoom 0.9"
$CL $C/boss-spider-outlines-off.mp4 $P $R --q "bossroom&boss=ikSpider&outlines=0"
$CL $C/boss-spider-both-on.mp4 $P $R --q "bossroom&boss=ikSpider&outlines=1"
$CL $C/boss-drake-outlines-off.mp4 $P $R --q "theme=ember&bossroom&boss=cinder&outlines=0"
$CL $C/boss-drake-both-off.mp4 $P $R --q "theme=ember&bossroom&boss=cinder&outlines=0&hpbars=0"
# the camp: outlines on, then off (real time), and the Settings screen flipping the switches live
node tools/toggles19/rt-clip.mjs $C/camp-outlines-on.mp4 --secs 4 --q "outlines=1"
node tools/toggles19/rt-clip.mjs $C/camp-outlines-off.mp4 --secs 4 --q "outlines=0"
node tools/toggles19/rt-clip.mjs $C/settings-flip.mp4 --settings --secs 11
