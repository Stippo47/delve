#!/bin/sh
# Lane stilts19: where the Canopy Idol sits, beside Old Longlegs. The bench party of the third dungeon's boss (level 25)
# and three other parties, n fights each in the boss room (tools/runs.mjs --boss --bossid <id>). Each line: wins of n and
# the average fight.
#   sh tools/stilts19/measure.sh [n=40] [levels="25"] [bosses="stiltIdol ikSpider"]
n="${1:-40}"; levels="${2:-25}"; bosses="${3:-stiltIdol ikSpider}"
for lv in $levels; do
  for party in paladin,archer,cleric,twinfang tower,berserker,wildmane,cleric paladin,archer,pyromancer,marksman paladin,frost,storm,cleric; do
    for b in $bosses; do
      printf 'L%s %-36s %-10s ' "$lv" "$party" "$b"
      node tools/runs.mjs --boss --theme sewers --bossid "$b" --level "$lv" --party "$party" --n "$n" 2>&1 | tail -1 | sed -e 's/ | ended.*avg/ avg/; s/ 1 rooms.*//'
    done
  done
done
