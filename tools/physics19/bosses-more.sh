#!/bin/bash
# Lane physics19: the bosses whose rooms moved most in bosses.sh, again with other seeds and more fights.
#   bash tools/physics19/bosses-more.sh [tree=.] [n=200]
T=${1:-.}; N=${2:-200}
cd "$T" || exit 1
run() { printf '%-13s %-8s L%-3s ' "$1" "$2" "$3"; node tools/runs.mjs --boss --theme "$2" --bossid "$1" --level "$3" --party paladin,archer,cleric,twinfang --n "$N" --seed 9000 2>&1 | tail -1 | sed -E 's/ \| ended on floor[^|]*\| minis [^|]*//; s/ [0-9]+ gold.*//'; }
run ikSpider sewers 25
run cinder ember 44
run winterQueen frost 36
run chieftain warren 13
run sandWurm dunes 51
