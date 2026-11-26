#!/bin/bash
# Lane troll19b: (re)start the lane's own server on 8976 from a root (default: the worktree). bash tools/troll19b/serve.sh [root]
for p in $(ps -ef | grep "[s]erve.mjs 8976" | awk '{print $2}'); do kill -9 $p 2>/dev/null; done; sleep 1
(node tools/serve.mjs 8976 ${1:-.} > /dev/null 2>&1 &); sleep 2
