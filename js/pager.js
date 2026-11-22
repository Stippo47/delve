// Pages side by side, swiped between (round 14, lane U; the designer: "You can show multiple pages side by side I can
// swipe between like clash royal"). One strip of tabs on top that also taps; under it the pages sit in a row and the
// row follows the finger and snaps to the nearest page when it lifts.
//   const pg = makePager(host, { tabs: [{ id, name }], at: 0, onChange(i, id), onMove(i, id) });
//   pg.pages[i]            each page's element, to fill
//   pg.go(i, animate)      to a page
//   pg.index / pg.id       where it is
// A sideways drag turns the page only if it starts sideways (a page still scrolls up and down), and never from inside
// something that owns its own drags: mark that with data-noswipe (the skill web pans under one finger).
// iPhone Safari: the row is moved with a transform; the pages keep their own vertical scrolling (touch-action: pan-y).
export function makePager(host, opts) {
  const tabs = opts.tabs, n = tabs.length;
  host.classList.add('pg');
  host.innerHTML = `<div class="pg-tabs" style="--n:${n}">${tabs.map((t, i) => `<div role="button" class="pg-tab" data-pg="${i}">${t.name}</div>`).join('')}<i class="pg-ind"></i></div>
    <div class="pg-view"><div class="pg-track" style="width:${n * 100}%">${tabs.map((t) => `<section class="pg-page" data-page="${t.id}" style="width:${100 / n}%"></section>`).join('')}</div></div>`;
  const strip = host.querySelector('.pg-tabs'), view = host.querySelector('.pg-view'), track = host.querySelector('.pg-track'), ind = host.querySelector('.pg-ind');
  const pages = [...track.children], tabEls = [...strip.querySelectorAll('.pg-tab')];
  let index = Math.max(0, Math.min(n - 1, opts.at | 0)), drag = null;
  const width = () => view.clientWidth || 1;
  // pos: where the row is, in pages (1.5 = half way from the second page to the third)
  function place(pos, animate) {
    const tr = animate ? 'transform .26s cubic-bezier(.2,.8,.2,1)' : 'none';
    track.style.transition = tr; ind.style.transition = tr;
    track.style.transform = `translate3d(${(-pos * 100 / n).toFixed(3)}%,0,0)`;
    ind.style.transform = `translate3d(${(pos * 100).toFixed(2)}%,0,0)`;
  }
  function mark() { tabEls.forEach((t, i) => t.classList.toggle('on', i === index)); pages.forEach((p, i) => p.classList.toggle('on', i === index)); }
  function go(i, animate = true) {
    i = Math.max(0, Math.min(n - 1, i));
    const was = index; index = i; mark(); place(index, animate);
    if (was !== index && opts.onChange) opts.onChange(index, tabs[index].id, was);
  }
  strip.addEventListener('click', (e) => { const t = e.target.closest('[data-pg]'); if (t) go(+t.dataset.pg); });
  const start = (e) => {
    if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target.closest && e.target.closest('[data-noswipe]')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), on: false, dx: 0, lx: e.clientX, lt: performance.now(), v: 0 };
  };
  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // an up-and-down scroll: the page's own
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.on = true; drag.x = e.clientX; host.classList.add('dragging');
      try { view.setPointerCapture(e.pointerId); } catch {}
    }
    const now = performance.now();
    if (now > drag.lt) drag.v = 0.6 * drag.v + 0.4 * (e.clientX - drag.lx) / (now - drag.lt);
    drag.lx = e.clientX; drag.lt = now;
    let d = (e.clientX - drag.x) / width();
    if ((index === 0 && d > 0) || (index === n - 1 && d < 0)) d *= 0.3; // the ends give a little, then hold
    drag.dx = d; place(index - d, false);
    if (e.cancelable) e.preventDefault();
  };
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; host.classList.remove('dragging');
    if (!d.on) return;
    const fling = Math.abs(d.v) > 0.45 ? -Math.sign(d.v) : 0;
    const step = Math.abs(d.dx) > 0.22 ? -Math.sign(d.dx) : fling && Math.sign(fling) === -Math.sign(d.dx) ? fling : 0;
    go(index + step);
    // the tap that ends a drag isn't a tap on whatever was under the finger
    const eat = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    view.addEventListener('click', eat, { capture: true, once: true });
    setTimeout(() => view.removeEventListener('click', eat, { capture: true }), 60);
  };
  for (const el of [view, strip]) {
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  mark(); place(index, false);
  return { el: host, pages, go, get index() { return index; }, get id() { return tabs[index].id; }, page: (id) => pages[tabs.findIndex((t) => t.id === id)] };
}
