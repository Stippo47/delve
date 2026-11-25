# Round 19 art: dungeon walls

The ask: walls for every dungeon that match the doors and are taller than them, the doors sitting in the wall and the
wall rising above. 22 options across the 9 dungeons. Nothing is wired into the game; no js changed.

## The pieces (one folder per option, `<theme>-<letter>/`)
- `run-a.svg`, `run-b.svg`: 160 units of straight wall; they tile end to end. `run-b` carries the option's one feature
  (a niche, a lantern, a drain...): mix it in now and then.
- `bay.svg`: an overlay for a door. Draw the runs right along the wall, then the bay over them wherever a door stands,
  centred on the door, then the door art (`art/props/door-*.svg`, unchanged) on top.
- `corner-out.svg`: the room's corner (the floor's corner at its bottom left). `corner-in.svg`: a rock corner jutting
  into the floor (L, T and + rooms). Both are an H x H square split on the diagonal.
- 1 SVG unit = 1 room unit. In each piece's frame y = 0 is the foot (where wall meets floor, room below) and y < 0 rises
  away from the room: the face (the wall's inner side, folded flat like the doors' arch) is y -F..0 and the cap (its top,
  seen from above) y -H..-F. Each file says its F and H; `index.json` lists them all. H is 96-110 against the doors' 57.
- Every side of the room uses the same pieces, turned so their foot meets the floor (the side walls' u runs down the
  screen). Turned walls keep the "faces sloping out on all four sides" look of env.js.
- No outline in the files: the renderer grows the one ink outline (`OUTLINE`) round the whole wall layer, as it does
  for props. The pictures also darken faces turned from the top-left light a little and lighten the ones turned to it.
- The walls grow outward from the floor's edge, so the floor keeps its size; the floor cache's pad (48 now) would have
  to reach H + a little.

## Pictures and the preview
`<id>/<id>.png`: a stretch of far wall with a shut door and an open treasure door, the room's corner, the side wall
down to a rock corner, at 2 px per room unit, on the theme's own floor (env.js, Carved), the game's own door art and
outline, and the Archer for size. Drawn by `tools/art-walls/scene.html?walls=<id>` (also a live preview: serve the
worktree root and open it). Rebuild: `node tools/art-walls/gen.mjs` (pieces), `node tools/art-walls/shots.mjs`
(pictures, needs `node tools/serve.mjs 8941 .`), `node tools/art-walls/deck.mjs` (the Riffle deck).
