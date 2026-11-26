#!/bin/bash
# Lane troll19b: both sets on the lane's one port, one after the other. The "before" set is filmed from a copy of the
# tree as it was before the lane (scratch/before: git archive 085fcc6 | tar -x -C scratch/before), the "after" set from
# the worktree.   bash tools/troll19b/film-all.sh [before|after|both] [name-filter]
W=${1:-both}; F=${2:-.}
if [ $W != after ]; then bash tools/troll19b/serve.sh scratch/before; bash tools/troll19b/clips.sh before "$F"; fi
bash tools/troll19b/serve.sh .
if [ $W != before ]; then bash tools/troll19b/clips.sh after "$F"; fi
echo all filmed
