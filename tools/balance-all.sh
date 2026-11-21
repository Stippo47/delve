#!/usr/bin/env bash
# The whole balance batch (tools/balance.mjs), both tiers, split over several processes and added up.
#   bash tools/balance-all.sh <outDir> [reps=2] [chunks=6]
# Tier I plays every dungeon at the Wildwood's strength (rank 0), tier III at the Warren's (rank 1).
# Writes <outDir>/t1.txt and t3.txt (the tables) and the chunks' json beside them.
set -u
out="${1:?out dir}"; reps="${2:-2}"; chunks="${3:-6}"
mkdir -p "$out"
ids=$(node --input-type=module -e "globalThis.location={search:'?x'};globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};const {HERO_IDS}=await import('./js/heroes.js');console.log(HERO_IDS.join(' '))")
arr=($ids); n=${#arr[@]}; per=$(( (n + chunks - 1) / chunks ))
for tier in 1 3; do
  rank=0; [ "$tier" = 3 ] && rank=1
  for ((c=0; c<chunks; c++)); do
    part=$(IFS=,; echo "${arr[*]:$((c*per)):$per}")
    [ -z "$part" ] && continue
    node tools/balance.mjs --tier $tier --rank $rank --reps $reps --seed $((c+1)) --heroes "$part" --out "$out/t$tier-$c.json" > "$out/t$tier-$c.log" 2>&1 &
  done
done
wait
for tier in 1 3; do
  files=$(ls "$out"/t$tier-*.json | paste -sd, -)
  rank=0; [ "$tier" = 3 ] && rank=1
  node tools/balance.mjs --tier $tier --rank $rank --merge "$files" > "$out/t$tier.txt" 2>&1
  grep -h "ERROR" "$out"/t$tier-*.log | head -20 >> "$out/t$tier.txt"
done
echo done
