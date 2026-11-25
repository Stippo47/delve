// Round 17 (lane tags17): every tag and the unit kinds that have it (for docs/tags17.md). node tools/tags17/list.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { DEFS } = await import('../../js/units.js');
const { tagsOf, TAG_IDS, TAG_INFO } = await import('../../js/tags.js');
const by = {};
for (const [k, d] of Object.entries(DEFS)) for (const t of tagsOf(k, d)) (by[t] || (by[t] = [])).push(d.name + (d.team === 'hero' && !d.hero ? ' (summon)' : ''));
for (const t of TAG_IDS) console.log(`| ${TAG_INFO[t].name} | ${(by[t] || []).length} | ${[...new Set(by[t] || [])].join(', ') || '(none yet)'} |`);
