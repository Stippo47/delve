// Shared set-up for the foes audit (tools/audit/foes/*.mjs): node stubs, the game modules, one save.
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DT = 1 / 60;
const js = (f) => import(pathToFileURL(resolve(ROOT, 'js', f)).href);

export async function boot() {
  globalThis.location = { search: '?x' };
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const B = await js('battle.js');
  const { setSeed } = await js('util.js');
  const { freshSave } = await js('save.js');
  const { DEFS } = await js('units.js');
  const S = await js('stats.js');
  const D = await js('dungeon.js');
  const sim = await js('sim.js');
  const save = freshSave(); save.cheat = true;
  const names = (k) => (DEFS[k] && DEFS[k].name) || k;
  return { B, setSeed, save, DEFS, S, D, sim, names };
}

export const opt = (k, d) => { const a = process.argv, i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
export const flag = (k) => process.argv.includes('--' + k);
