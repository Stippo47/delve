#!/bin/sh
# Lane spider19: where Old Longlegs sits. The bench party of the third dungeon's boss (the Great Ooze: level 25) and
# three other parties, n fights each in the boss room (tools/runs.mjs --boss --bossid ikSpider), and the level either
# side. Each line: wins of n, the average fight, and the boss's own log of the last fight with --v.
#   sh tools/spider19/measure.sh [n=40] [levels="25"]
n="${1:-40}"; levels="${2:-25}"
for lv in $levels; do
  for party in paladin,archer,cleric,twinfang tower,berserker,wildmane,cleric paladin,archer,pyromancer,marksman paladin,frost,storm,cleric; do
    printf 'L%s %-36s ' "$lv" "$party"
    node tools/runs.mjs --boss --theme sewers --bossid ikSpider --level "$lv" --party "$party" --n "$n" 2>&1 | tail -1
  done
done
