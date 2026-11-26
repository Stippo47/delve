#!/bin/bash
# Lane physics19: each designed boss in its own room (tools/runs.mjs --boss, as docs/DECISIONS.md measures them), the
# same party, level and seeds on a tree: how often the party wins and how long the fight is.
#   bash tools/physics19/bosses.sh [tree=.] [n=40]      (tree: . or scratch/before; run from the worktree's root)
T=${1:-.}; N=${2:-40}
cd "$T" || exit 1
run() { printf '%-13s %-8s L%-3s ' "$1" "$2" "$3"; node tools/runs.mjs --boss --theme "$2" --bossid "$1" --level "$3" --party paladin,archer,cleric,twinfang --n "$N" 2>&1 | tail -1 | sed -E 's/ \| ended on floor[^|]*\| minis [^|]*//; s/ [0-9]+ gold.*//'; }
run ikSpider sewers 25
run stiltIdol sewers 25
run greatOoze sewers 25
run cinder ember 44
run sandWurm dunes 51
run greatEngine foundry 56
run boneKing crypt 33
run winterQueen frost 36
run gildedSeraph spire 48
run chieftain warren 13
run elderEnt wildwood 6
