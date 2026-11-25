#!/bin/bash
# Lane drake19: the win rates and the probe, to tools/drake19/<tag>-*.txt.   bash tools/drake19/measure.sh after
T=${1:-after}; D=tools/drake19; R="node tools/runs.mjs --boss --bossid cinder --theme ember"
for L in 41 44 47; do $R --level $L --party paladin,archer,cleric,twinfang --n 100 --v > $D/$T-L$L.txt 2>&1; done
$R --level 44 --party paladin,archer,cleric,twinfang --n 100 --seed 5000 --v > $D/$T-L44-seed5000.txt 2>&1
for P in paladin,berserker,twinfang,tower archer,pyromancer,frost,storm; do $R --level 44 --party $P --n 40 > $D/$T-party-${P//,/-}.txt 2>&1; done
node $D/probe.mjs --n 20 > $D/probe-$T.txt 2>&1
for f in $D/$T-L*.txt $D/$T-party-*.txt; do echo "$f: $(tail -1 $f | cut -c1-60)"; done
