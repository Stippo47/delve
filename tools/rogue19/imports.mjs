globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
for (const m of ['sim', 'kits', 'kits2', 'tags', 'statuses', 'heroes', 'heroes2', 'enemies', 'bestiary', 'icons', 'dashes', 'preview-scenes', 'preview-sim']) {
  try { await import('../../js/' + m + '.js'); console.log('ok', m); } catch (e) { console.log('FAIL', m, e.message); }
}
