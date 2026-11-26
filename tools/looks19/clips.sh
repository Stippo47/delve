#!/bin/bash
# Lane looks19: the comparison clips, the same fight under each look (needs this lane's server: node tools/serve.mjs 8971 .).
#   bash tools/looks19/clips.sh [spider|drake|idol ...]
# Files: docs/clips/looks19/<fight>-<n>-<look>.mp4, n in the order to watch them.
C=docs/clips/looks19; mkdir -p $C
CL="node tools/clip.mjs"; P="--port 8971 --w 414 --h 896"
LOOKS=("1-ink:olcolor=ink" "2-own-deep:olcolor=dark" "3-own:olcolor=mid" "4-own-bright:olcolor=light" "5-one-colour:olcolor=figure" "6-pixel2:olcolor=ink&pixel=2" "7-pixel3:olcolor=ink&pixel=3" "8-pixel4:olcolor=ink&pixel=4" "9-pixel2-own:olcolor=mid&pixel=2")
run() { # fight name, args, extra q, looks...
  local name=$1 args=$2 q=$3; shift 3
  for L in "$@"; do local tag=${L%%:*} lq=${L#*:}; $CL $C/$name-$tag.mp4 $P $args --q "${q:+$q&}$lq" > $C/.log-$name-$tag.txt 2>&1 & 
    while [ $(jobs -r | wc -l) -ge 3 ]; do sleep 2; done; done
  wait
}
for F in ${@:-spider drake idol}; do case $F in
  spider) run spider '--battle ikSpider*1,slime*2,goblin*2,rattlerMace*1,brute*1|paladin,archer,cleric,necromancer --seed 3 --skip 2 --secs 6 --zoom 1.1' '' "${LOOKS[@]}" ;;
  drake) run drake '--party paladin,archer,cleric --level 6 --seed 3 --skip 3 --secs 6 --zoom 1.0' 'theme=ember&bossroom&boss=cinder' "${LOOKS[@]}" ;;
  idol) run idol '--battle stiltIdol*1,goblin*2,slime*1|paladin,archer,cleric,necromancer --seed 4 --skip 2 --secs 6 --zoom 0.9' '' "${LOOKS[0]}" "${LOOKS[2]}" "${LOOKS[5]}" "${LOOKS[8]}" ;;
  spider08) run spider-zoom08 '--battle ikSpider*1,slime*2,goblin*2,rattlerMace*1,brute*1|paladin,archer,cleric,necromancer --seed 3 --skip 2 --secs 6 --zoom 0.8' '' "${LOOKS[5]}" "${LOOKS[8]}" ;;
esac; done
grep -h "page errors\|Error" $C/.log-* | sort | uniq -c
