import fs from 'node:fs';
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(f + ' bad ' + a.slice(0, 90)); s = s.slice(0, i) + b + s.slice(i + a.length); }
  fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', f);
}
edit('js/heroes2.js', [
  [`  alchemist: {\n    name: 'Alchemist',`, `  alchemist: { // (round 19: the designer, "They. Pronouns.": the Alchemist is they/them in every text)\n    name: 'Alchemist',`],
  [`fun: 'Lost her eyebrows in the first week.`, `fun: 'Lost their eyebrows in the first week.`],
  [`nothing can hurt her or put a status on her, she is hard to shove, but it burns through a third of her health.'`, `nothing can hurt them or put a status on them, they are hard to shove, but it burns through a third of their health.'`],
  [`'Her blows land 25% harder.'`, `'Their blows land 25% harder.'`],
  [`desc: 'The statuses she causes build 30% faster.'`, `desc: 'The statuses they cause build 30% faster.'`],
]);
edit('js/fx2.js', [[`// the Alchemist's hand: the flask she'll throw next`, `// the Alchemist's hand: the flask they'll throw next`]]);
edit('js/kits2.js', [[`// the Alchemist's brews: six pools (Brew Pools), three elixirs, her monstrous form`, `// the Alchemist's brews: six pools (Brew Pools), three elixirs, their monstrous form`],
  [`  // the Alchemist's hand shows the next flask she'll throw (round 13:`, `  // the Alchemist's hand shows the next flask they'll throw (round 13:`]]);
