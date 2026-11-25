// Round 19, icons-misc lane: the set sheets (every icon big, then at the sizes the game shows it) as HTML pages for
// snap.mjs. Imported by build.mjs.
import { Ctx } from '../../design/icons-r14/kit.mjs';
let uid = 0;
// one icon as inline svg at px (ids made unique on the page)
export function inline(fn, px, pre = 'x') {
  const c = new Ctx(`${pre}${uid++}`);
  return c.svg(fn(c), { size: px }).replace(/^<svg /, '<svg style="display:block;flex:none" ');
}
export const CSS = `*{box-sizing:border-box}html,body{margin:0;background:#0E1120;color:#F2E8D2;font:650 13px/1.3 ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-variant-numeric:tabular-nums}
b{font-weight:850}.cap{font-size:10px;font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:#9BA2C0}.q{color:#9BA2C0}
h1{font-size:17px;font-weight:850;margin:0}.sub{font-size:11.5px;color:#9BA2C0;margin-top:2px}
.grid{display:grid;gap:10px 6px;margin-top:8px}.cell{text-align:center}.cell .n{font-size:9px;line-height:1.15;margin-top:3px;color:#C8CCE0;min-height:20px}
.cell svg{margin:0 auto}.panel{background:#171B2E;border-radius:14px;box-shadow:inset 0 0 0 1px #2E3560;padding:10px;margin-top:10px}
.chip{display:inline-flex;align-items:center;gap:5px;font-weight:850}.row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.tile{display:grid;place-items:center;border-radius:12px;background:#1F2440;box-shadow:inset 0 0 0 1.5px var(--rar,#3B4478)}`;
export const page = (body, w = 390, extra = '') => `<!doctype html><meta charset="utf-8"><style>${CSS}body{width:${w}px}${extra}</style><body><div id="shot" style="padding:12px 10px 14px">${body}</div></body>\n`;
