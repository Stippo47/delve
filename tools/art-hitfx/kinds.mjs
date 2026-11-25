// lists kinds per family (tags.js), to pick clip units
const U = await import('../../js/units.js'); const T = await import('../../js/tags.js');
const out = {};
for (const [k, d] of Object.entries(U.DEFS)) { for (const t of ['undead','slime','beast','construct','spirit']) if (T.hasTag({ kind: k, def: d }, t)) (out[t] ||= []).push(k + (d.art ? '' : '*')); }
for (const [t, l] of Object.entries(out)) console.log(t, l.join(' '));
