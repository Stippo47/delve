import { HEROES } from '../../js/heroes.js';
for (const [id, h] of Object.entries(HEROES)) for (const a of h.abilities || []) console.log(`${id}\t${a.id}\t${a.name}\t${a.tags}\t${(a.desc||'').slice(0,150)}`);
