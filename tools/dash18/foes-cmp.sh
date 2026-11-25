#!/bin/sh
# Round 18, lane dash18: two foes16/worth.mjs logs side by side for the dashers.   sh tools/dash18/foes-cmp.sh base.txt after.txt
for k in wolf direWolf frostWolf hellhound jackal rat ratPlague spiderHunter sproutling goblin goblinOrange banditDagger lizardBlade crab banditSpear rattlerSpear wolfRider devil angel bat cinderBat succubus bee wasp orc dragonborn; do
  b=$(grep " $k cost" "$1" | sed 's/.*worth \([0-9.]*\) | panel \([0-9.]*\) duel \([0-9.]*\).*/\1 \2 \3/'); a=$(grep " $k cost" "$2" | sed 's/.*worth \([0-9.]*\) | panel \([0-9.]*\) duel \([0-9.]*\).*/\1 \2 \3/')
  [ -n "$a" ] && echo "$k $b $a" | awk '{ printf "%-13s %.2f -> %.2f  %+4.0f%%   (panel %s -> %s, duel %s -> %s)\n", $1, $2, $5, ($5/$2-1)*100, $3, $6, $4, $7 }'
done
