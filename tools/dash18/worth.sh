#!/bin/sh
# Round 18, lane dash18: the worth of the heroes whose dash moves changed, before (base) and after.
#   sh tools/dash18/worth.sh base|after [n]
# Four batches side by side, tiers 1 and 3, the same parties and seeds each time (tools/ability-worth.mjs).
out=tools/dash18/$1; n=${2:-12}; mkdir -p $out
run() { for h in "$@"; do for t in 1 3; do node tools/ability-worth.mjs --heroes $h --tier $t --n $n --out $out/$h-t$t.json > $out/$h-t$t.txt 2>&1; done; done; }
run tower twinfang shade &
run samurai gladiator huntress &
run werewolf bearskin warhelm &
run marksman paladin valkyrie &
wait
echo done > $out/DONE
