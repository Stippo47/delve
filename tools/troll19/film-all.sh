#!/bin/bash
# Lane troll19: both sets, one after the other on the lane's one port. The "before" set is filmed from a copy of the
# tree as it was before the lane (scratch/before: git archive ac21d0c | tar -x -C scratch/before), the "after" set from
# the worktree. bash tools/troll19/film-all.sh [name-filter]
F=${1:-.}
stop() { for p in $(ps -ef | grep "[s]erve.mjs 8972" | awk '{print $2}'); do kill -9 $p 2>/dev/null; done; sleep 1; }
stop; (node tools/serve.mjs 8972 . > /dev/null 2>&1 &); sleep 2
bash tools/troll19/clips.sh after "$F"
stop; (node tools/serve.mjs 8972 scratch/before > /dev/null 2>&1 &); sleep 2
bash tools/troll19/clips.sh before "$F"
stop; (node tools/serve.mjs 8972 . > /dev/null 2>&1 &); sleep 2
echo all filmed
