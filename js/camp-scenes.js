// The camp's two layouts (round 7, lane C). Each returns { html, foot }: the scene for #campMain and the bar for
// #campFoot. camp.js owns the state and the taps (data-act); this file only draws.
//   Clearing: top-down. The fire in the middle with its seats; round the edge the tent (heroes), the trader's cart,
//             the book on its stump and the sellswords by their lantern; the road out runs off the bottom of the
//             screen to a signpost (the dungeon pick).
//   Fireside: side-on. The night sky with every dungeon glowing on the mountains; the party on two logs either side
//             of the fire; the bench of heroes below (tap one to sit them down). Setting out climbs a switchback
//             road up the mountain to the dungeon gates.
import { HEROES, HERO_IDS } from './heroes.js';
import * as P from './progress.js';
import { icon } from './icons.js';
import { I, gold, gems, ROLE, ROLE_COL, mmss, ownedHeroes, bagCount, themeColors, themeLine } from './camp-kit.js';

const INK = '#15111C';

// ---------------------------------------------------------------- shared pictures
const fireHtml = (cls = '') => {
  const sparks = Array.from({ length: 9 }, (_, i) => `<i style="--sx:${(i * 37) % 30 - 15}px;--sd:${(i * 0.43) % 2.6}s;--sr:${0.9 + (i % 3) * 0.35}"></i>`).join('');
  const stones = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<b style="--x:${Math.cos(a) * 40}px;--y:${Math.sin(a) * 40}px"></b>`; }).join('');
  return `<div class="fire ${cls}"><div class="stones">${stones}</div>
    <svg class="logs" viewBox="0 0 100 100"><g stroke="${INK}" stroke-width="16" stroke-linecap="round"><path d="M18 30L82 70M18 70L82 30"/></g><g stroke="#6A4028" stroke-width="9" stroke-linecap="round"><path d="M18 30L82 70M18 70L82 30"/></g></svg>
    <svg class="flame" viewBox="0 0 100 100"><path class="f1" d="M50 6C62 26 84 34 84 58a34 34 0 0 1-68 0C16 40 30 30 34 18c4 12 10 16 14 16C50 24 46 14 50 6z" fill="${INK}"/><path class="f2" d="M50 16c8 16 26 24 26 42a26 26 0 0 1-52 0c0-12 8-20 13-26 2 9 7 13 11 13 2-10-2-20 2-29z" fill="#FF8A3D"/><path class="f3" d="M50 40c5 8 13 12 13 21a13 13 0 0 1-26 0c0-7 6-12 13-21z" fill="#FFE07A"/></svg>
    <div class="sparks">${sparks}</div></div>`;
};
// Top-down: the tent, the cart, the book on a stump, a lantern, trees.
const ART = {
  tentTop: `<svg viewBox="0 0 130 120"><path d="M8 20L65 4l57 16-8 92H16z" fill="${INK}"/><path d="M16 24L65 10v52z" fill="#8E6A43"/><path d="M114 24L65 10v52z" fill="#6F5034"/>
    <path d="M18 106l47-44 47 44z" fill="#5B412B"/><path d="M16 24l49 38-47 44z" fill="#7B5A3A"/><path d="M114 24L65 62l47 44z" fill="#5E432C"/>
    <path d="M65 62l-12 44h24z" fill="#1E1611"/><path d="M65 10v52" stroke="#A88560" stroke-width="2.4"/><circle cx="65" cy="10" r="4" fill="#C9A26A" stroke="${INK}" stroke-width="2"/></svg>`,
  cartTop: `<svg viewBox="0 0 130 120"><rect x="2" y="26" width="18" height="40" rx="6" fill="${INK}"/><rect x="110" y="26" width="18" height="40" rx="6" fill="${INK}"/><rect x="2" y="74" width="18" height="40" rx="6" fill="${INK}"/><rect x="110" y="74" width="18" height="40" rx="6" fill="${INK}"/>
    <rect x="6" y="30" width="10" height="32" rx="4" fill="#5A4030"/><rect x="114" y="30" width="10" height="32" rx="4" fill="#5A4030"/><rect x="6" y="78" width="10" height="32" rx="4" fill="#5A4030"/><rect x="114" y="78" width="10" height="32" rx="4" fill="#5A4030"/>
    <path d="M60 4h10v20H60z" fill="${INK}"/><rect x="14" y="18" width="102" height="100" rx="8" fill="${INK}"/><rect x="19" y="23" width="92" height="90" rx="5" fill="#7A5236"/>
    <g fill="#A14A3A"><path d="M19 23h18v90H19zM55 23h18v90H55zM91 23h20v90H91z"/></g><g fill="#D9C7A1" opacity=".85"><path d="M37 23h18v90H37zM73 23h18v90H73z"/></g>
    <path d="M19 68h92" stroke="${INK}" stroke-width="3"/><circle cx="92" cy="96" r="7" fill="#FFD45A" stroke="${INK}" stroke-width="2.5"/></svg>`,
  stumpBook: `<svg viewBox="0 0 100 90"><ellipse cx="50" cy="52" rx="44" ry="36" fill="${INK}"/><ellipse cx="50" cy="52" rx="38" ry="30" fill="#8A6040"/>
    <ellipse cx="50" cy="52" rx="27" ry="21" fill="none" stroke="#6E4A30" stroke-width="2.5"/><ellipse cx="50" cy="52" rx="15" ry="11" fill="none" stroke="#6E4A30" stroke-width="2.5"/>
    <path d="M18 34c10-6 21-6 32 0 11-6 22-6 32 0v32c-10-6-21-6-32 0-11-6-22-6-32 0z" fill="${INK}"/><path d="M22 36c9-4 18-4 26 1v26c-8-4-17-4-26-1zM52 37c8-5 17-5 26-1v26c-9-3-18-3-26 1z" fill="#EDE2C8"/>
    <path d="M56 44c6-2 12-2 17 0M56 50c6-2 12-2 17 0M27 44c6-2 12-2 17 0" stroke="#9A8A70" stroke-width="2"/><circle cx="35" cy="53" r="4.5" fill="#C8553D"/></svg>`,
  lantern: `<svg viewBox="0 0 30 40"><path d="M10 6h10M15 2v4" stroke="${INK}" stroke-width="3"/><path d="M7 9h16l-2 26H9z" fill="${INK}"/><path d="M10 12h10l-1.4 20h-7.2z" fill="#FFD45A"/><path d="M15 16c2 2.4 3 4 3 5.6a3 3 0 0 1-6 0c0-1.6 1-3 3-5.6z" fill="#FFF3C4"/></svg>`,
  bedroll: `<svg viewBox="0 0 60 80"><rect x="4" y="4" width="52" height="72" rx="20" fill="${INK}"/><rect x="9" y="9" width="42" height="62" rx="16" fill="#4E6A9A"/><rect x="9" y="40" width="42" height="31" rx="12" fill="#3D5580"/></svg>`,
  sack: `<svg viewBox="0 0 70 70"><path d="M24 12c4-6 18-6 22 0l-3 8c12 6 20 18 20 30 0 12-12 16-28 16S7 62 7 50c0-12 8-24 20-30z" fill="${INK}"/>
    <path d="M28 14c3-3 11-3 14 0l-2 7c11 5 18 16 18 27 0 9-9 13-23 13S12 57 12 48c0-11 7-22 18-27z" fill="#9A6A42"/><path d="M26 22h18" stroke="#5E3E26" stroke-width="4" stroke-linecap="round"/>
    <path d="M18 46c2-8 7-14 14-17" stroke="#C08A5A" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
};
const tree = (x, y, s, k = 0) => `<i class="ctree" style="left:${x}%;top:${y}px;--s:${s}px;--k:${k}"></i>`;

// The header picture on a place's page (both layouts use them).
export function placeHead(kind, title, line) {
  const pic = kind === 'tent' ? ART.tentTop : kind === 'cart' ? ART.cartTop : ART.stumpBook;
  return `<header class="place-head ph-${kind}"><span class="ph-pic">${pic}</span><span class="ph-text"><h1>${title}</h1><span class="muted">${line}</span></span></header>`;
}

// A hero's potion pouch: what they were handed, or an empty flask when there's something in the bag to give.
function pouch(ctx, id, cls = '') {
  const mine = ctx.potionFor[id] || [];
  const any = bagCount(ctx.save) > 0;
  if (!mine.length && !any) return '';
  return `<button class="pouch ${cls} ${mine.length ? 'on' : ''}" data-act="pack:${id}" aria-label="potions">${mine.length ? mine.map((p) => icon('potion', p)).join('') : `${I.flask}<b>+</b>`}</button>`;
}

// The seats round the fire: the party, the empty seats, and the next seat the trader sells.
function seatList(save) {
  const seats = [];
  for (let i = 0; i < save.slots; i++) seats.push({ i, id: save.party[i] || null });
  if (P.slotPrice(save) && seats.length < P.SLOT_MAX) seats.push({ i: seats.length, locked: true });
  return seats;
}

// ================================================================ the clearing
const SPOTS = { 1: [90], 2: [128, 52], 3: [180, 90, 0], 4: [195, 125, 55, -15] };
export function clearingHome(ctx) {
  const { save } = ctx, now = Date.now();
  const seats = seatList(save), angs = SPOTS[seats.length] || SPOTS[4];
  const sitters = seats.map((s, k) => {
    const a = angs[k] * Math.PI / 180, x = Math.cos(a) * 130, y = Math.sin(a) * 112;
    const rot = angs[k] + 90; // the sprites face down: turn each to face the fire
    const pos = `--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--r:${rot.toFixed(0)}deg;--d:${(k * 0.7) % 2}s`;
    if (s.locked) {
      const p = P.slotPrice(save);
      return `<button class="cseat locked" data-act="seat" style="${pos}"><span class="stump">${I.lock}</span><span class="cname">Another seat<br>${gold(p.gold)}</span></button>`;
    }
    if (!s.id) return `<button class="cseat empty" data-act="slot:${s.i}" style="${pos}"><span class="ring">+</span><span class="cname">Empty seat</span></button>`;
    const h = HEROES[s.id], left = P.recoverLeft(save, s.id, now);
    return `<div class="cseat ${left ? 'resting' : ''}" style="${pos}">
      <button class="sitter" data-act="hero:${s.id}" data-hero="${s.id}"><img src="${h.art}" alt="${h.name}">${left ? I.zzz : ''}</button>
      <button class="cname plate" data-act="slot:${s.i}">${left ? `<span class="timer" data-until="${save.heroes[s.id].recoverUntil}">${mmss(left)}</span>` : h.name}<i>swap</i></button>
      ${left ? '' : pouch(ctx, s.id)}
    </div>`;
  }).join('');
  const resting = ownedHeroes(save).filter((id) => P.recoverLeft(save, id, now) && !save.party.includes(id)).slice(0, 2);
  const beds = resting.map((id, j) => `<button class="bedroll" data-act="hero:${id}" style="--j:${j}">${ART.bedroll}<img src="${HEROES[id].art}" alt="">${I.zzz}
    <span class="timer" data-until="${save.heroes[id].recoverUntil}">${mmss(P.recoverLeft(save, id, now))}</span></button>`).join('');
  const bag = bagCount(save), handed = Object.values(ctx.potionFor).reduce((a, l) => a + l.length, 0);
  const trees = [tree(-6, 150, 90, 1), tree(92, 140, 80, 2), tree(-8, 300, 110), tree(93, 330, 96, 1), tree(-10, 470, 100, 2), tree(94, 500, 110),
    tree(40, -40, 70, 2), tree(60, -50, 60, 1)].join('');
  const mercs = P.MERCS.map((m, j) => `<img class="merc m${j}" src="${m.art}" alt="">`).join('');
  return {
    html: `<div class="clearing">
      <div class="cl-ground"></div><div class="cl-dirt"></div><div class="cl-road"></div>${trees}
      <div class="cl-glow"></div>
      <button class="place tent" data-act="place:heroes"><span class="pic">${ART.tentTop}</span><span class="sign">Heroes</span></button>
      <div class="beds">${beds}</div>
      <button class="place cart" data-act="place:shop"><span class="pic">${ART.cartTop}</span><span class="sign">Trader</span></button>
      <button class="place book" data-act="place:book"><span class="pic">${ART.stumpBook}</span><span class="sign">Book</span></button>
      <button class="place mercs ${save.mercs ? 'on' : ''}" data-act="mercs"><span class="pic">${mercs}<span class="lamp">${ART.lantern}</span></span>
        <span class="sign">${save.mercs ? `${I.check} Hired` : 'Sellswords'}</span><span class="hint">${save.mercs ? 'They take half the gold' : 'Tap to hire two'}</span></button>
      <div class="cl-fire">${fireHtml()}
        <button class="satchel ${bag ? '' : 'empty'}" data-act="${bag ? 'pack' : 'place:shop'}">${ART.sack}<span class="sign small">${bag ? `${bag - handed} potions` : 'No potions'}</span></button>
        <div class="seats">${sitters}</div>
      </div>
    </div>`,
    foot: `<div class="footbar road"><span class="note">${save.runs ? `${save.runs} ${save.runs === 1 ? 'run' : 'runs'} · ${save.wins} cleared` : 'Gold you bring out is yours, win or lose.'}</span>
      <button class="btn big setout" data-act="setout">${I.fire}<span>Set out</span></button></div>`,
  };
}

// The signpost where the road forks: one arm for each dungeon, the way down written on it.
export function clearingRoad(ctx) {
  const { save, themes } = ctx;
  const opts = P.runOptions(save, null, ctx.potionFor);
  const who = [...opts.party.map((id) => HEROES[id].art), ...(save.mercs ? P.MERCS.map((m) => m.art) : [])];
  const arms = Object.entries(themes).map(([id, t], i) => {
    const c = themeColors(t), rec = save.dungeons[id], side = i % 2 ? 'r' : 'l';
    return `<button class="arm ${side}" data-act="enter:${id}" style="--floor:${c.floor};--wall:${c.wall};--rock:${c.rock};--accent:${c.accent};--d:${i * 0.07}s">
      <span class="door"><svg viewBox="0 0 60 70"><rect width="60" height="70" fill="var(--rock)"/><path d="M0 70V18h60v52z" fill="var(--wall)"/><path d="M14 70V36a16 16 0 0 1 32 0v34z" fill="${INK}"/><path class="door-glow" d="M19 70V38a11 11 0 0 1 22 0v32z" fill="var(--accent)"/></svg></span>
      <span class="armtext"><b>${t.name}</b><span>${t.blurb || ''}</span><span class="muted">${rec && rec.cleared ? I.star : ''}${themeLine(rec)}</span></span>
      <span class="tip"></span></button>`;
  }).join('');
  return {
    html: `<div class="signpost">
      <div class="sp-head"><h1>Where to?</h1><span class="muted">The road forks under the trees. Each arm points to a way down.</span></div>
      <div class="post"></div><div class="arms">${arms}</div>
      <div class="walkers">${who.length ? who.map((a, i) => `<img src="${a}" alt="" style="--d:${i * 0.25}s">`).join('') : '<span class="muted">Nobody is ready. Sit a hero at the fire or hire the sellswords.</span>'}</div>
    </div>`,
    foot: `<div class="footbar"><button class="btn back-btn" data-act="back">${I.back}<span>Back to the fire</span></button></div>`,
  };
}

// ================================================================ fireside
// Where the stars are (fixed, so they don't jump on every redraw).
const STARS = Array.from({ length: 34 }, (_, i) => ({ x: (i * 53.7) % 100, y: (i * 31.3) % 92, s: 1 + (i % 4 === 0) + (i % 9 === 0), d: (i * 0.37) % 4 }));
const starHtml = () => STARS.map((s) => `<i style="left:${s.x}%;top:${s.y}%;--s:${s.s}px;--d:${s.d}s"></i>`).join('');

export function firesideHome(ctx) {
  const { save, themes, focus } = ctx, now = Date.now();
  // the mountains, with every dungeon a lit gate somewhere on the range
  const ids = Object.keys(themes);
  const gates = ids.map((id, i) => {
    const c = themeColors(themes[id]), n = ids.length;
    const x = 11 + (n === 1 ? 38 : (i / (n - 1)) * 70), y = 64 - (i % 2 ? 18 : 4) - (i / Math.max(1, n - 1)) * 14;
    return `<button class="gate" data-act="setout" style="left:${x}%;top:${y}%;--accent:${c.accent}" aria-label="${themes[id].name}"><i></i><span>${themes[id].name.replace(/^The /, '')}</span></button>`;
  }).join('');
  // the logs: two seats left of the fire, two right
  const seats = seatList(save);
  const order = [1, 2, 0, 3]; // seat 0 sits just right of the fire, seat 1 just left, then the outer ends
  const xs = [-64, -142, 64, 142];
  const sitters = seats.map((s, k) => {
    const x = xs[order.indexOf(k)] ?? 0;
    const pos = `--x:${x}px;--d:${(k * 0.6) % 2}s`;
    if (s.locked) return `<button class="fseat locked" data-act="seat" style="${pos}"><span class="ring">${I.lock}</span><span class="cname">Seat ${gold(P.slotPrice(save).gold)}</span></button>`;
    if (!s.id) return `<button class="fseat empty" data-act="slot:${s.i}" style="${pos}"><span class="ring">+</span><span class="cname">Empty</span></button>`;
    const h = HEROES[s.id], left = P.recoverLeft(save, s.id, now);
    return `<div class="fseat ${left ? 'resting' : ''} ${focus === s.id ? 'focus' : ''}" style="${pos}">
      <button class="sitter" data-act="focus:${s.id}" data-hero="${s.id}"><img src="${h.art}" alt="${h.name}">${left ? I.zzz : ''}</button>
      ${left ? `<span class="cname"><span class="timer" data-until="${save.heroes[s.id].recoverUntil}">${mmss(left)}</span></span>` : pouch(ctx, s.id)}
    </div>`;
  }).join('');
  // the hero picked at the fire gets a fan of what you can do with them
  let fan = '';
  if (focus && save.party.includes(focus)) {
    const k = save.party.indexOf(focus), x = xs[order.indexOf(k)] ?? 0;
    const cx = Math.max(-ctx.width / 2 + 100, Math.min(ctx.width / 2 - 100, x));
    const any = bagCount(save) > 0, rest = P.recoverLeft(save, focus, now);
    fan = `<div class="fan" style="--x:${cx}px"><span class="fname">${HEROES[focus].name}</span>
      ${rest ? `<button class="fanbtn" data-act="speed:${focus}">${I.zzz}<span>Rest less ${gold(P.speedUpCost(rest))}</span></button>`
        : any ? `<button class="fanbtn" data-act="pack:${focus}">${I.flask}<span>Potions</span></button>` : ''}
      <button class="fanbtn" data-act="hero:${focus}">${I.tree}<span>Skills</span></button>
      <button class="fanbtn" data-act="stand:${focus}">${I.stand}<span>Stand up</span></button></div>`;
  }
  const mercs = P.MERCS.map((m, j) => `<img class="merc m${j}" src="${m.art}" alt="">`).join('');
  // the bench: every hero, owned first
  const list = [...HERO_IDS].sort((a, b) => save.heroes[b].owned - save.heroes[a].owned);
  const bench = list.map((id) => {
    const h = HEROES[id], sv = save.heroes[id], left = sv.owned && P.recoverLeft(save, id, now), seated = save.party.includes(id);
    const tag = !sv.owned ? gems(P.heroPrice(id)) : left ? `<span class="timer" data-until="${sv.recoverUntil}">${mmss(left)}</span>` : seated ? `${I.fire}At the fire` : ROLE[h.role];
    return `<div class="bcard ${sv.owned ? '' : 'locked'} ${left ? 'resting' : ''} ${seated ? 'seated' : ''}" style="--rc:${ROLE_COL[h.role]}">
      <button class="bfig" data-act="${sv.owned && !left ? 'sit' : 'hero'}:${id}" data-hero="${id}"><span class="brug"></span><img src="${h.art}" alt="">${left ? I.zzz : ''}${sv.feat ? `<span class="bfeat">${I.star}</span>` : ''}
        <b>${h.name}</b><span class="btag">${tag}</span></button>
      <button class="bskills" data-act="hero:${id}">${I.tree}<span>Skills</span></button>
    </div>`;
  }).join('');
  const bag = bagCount(save);
  return {
    html: `<div class="fireside ${focus ? 'focusing' : ''}">
      <div class="fs-sky" data-act="unfocus"><div class="stars">${starHtml()}</div><i class="moon"></i>
        <svg class="range far" viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 100V58l30-20 26 14 40-34 34 22 30-16 44 30 36-26 40 18 30-28 46 32 44-22v102z"/></svg>
        <svg class="range near" viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 100V70l44-26 38 22 30-12 50 26 46-36 40 24 34-10 52 30 40-18 26 10v50z"/></svg>
        ${gates}
        <span class="sky-hint">${ids.length} ways down. Tap a light to set out.<br>${save.runs ? `${save.runs} ${save.runs === 1 ? 'run' : 'runs'} · ${save.wins} cleared` : 'Gold you bring out is yours, win or lose.'}</span>
      </div>
      <div class="fs-camp" data-act="unfocus">
        <div class="fs-glow"></div>
        <button class="fs-prop fs-book" data-act="place:book"><svg viewBox="0 0 110 90"><path d="M14 46h82l-6 8H20z" fill="${INK}"/><rect x="22" y="52" width="8" height="36" fill="${INK}"/><rect x="80" y="52" width="8" height="36" fill="${INK}"/>
          <rect x="24" y="54" width="4" height="32" fill="#5A3E2A"/><rect x="82" y="54" width="4" height="32" fill="#5A3E2A"/><path d="M17 47h76l-4 5H21z" fill="#7A5236"/>
          <path d="M26 44c9-8 20-8 29-2 9-6 20-6 29 2l-2 4c-9-6-18-6-27 0-9-6-18-6-27 0z" fill="${INK}"/><path d="M29 43c8-6 17-6 25-1v3c-8-4-17-4-25 0zM56 42c8-5 17-5 25 1v2c-8-4-17-4-25 0z" fill="#EDE2C8"/>
          <rect x="84" y="22" width="7" height="22" rx="2" fill="#EDE2C8" stroke="${INK}" stroke-width="2"/><path d="M87.5 6c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#FFD45A" stroke="${INK}" stroke-width="1.6"/></svg><span class="sign">Book</span></button>
        <button class="fs-prop fs-cart" data-act="place:shop"><svg viewBox="0 0 140 100"><path d="M14 30c0-18 112-18 112 0v38H14z" fill="${INK}"/><path d="M20 32c0-13 100-13 100 0v34H20z" fill="#B8A88A"/><path d="M20 32c0-13 100-13 100 0" fill="none" stroke="#8C3E32" stroke-width="7"/>
          <rect x="8" y="62" width="124" height="14" rx="3" fill="${INK}"/><rect x="12" y="65" width="116" height="8" rx="2" fill="#6A4630"/><circle cx="34" cy="80" r="16" fill="${INK}"/><circle cx="34" cy="80" r="10" fill="#5A4030"/><circle cx="106" cy="80" r="16" fill="${INK}"/><circle cx="106" cy="80" r="10" fill="#5A4030"/>
          <circle cx="122" cy="40" r="6" fill="#FFD45A" stroke="${INK}" stroke-width="2.5"/></svg><span class="sign">Trader</span></button>
        <button class="fs-prop fs-mercs ${save.mercs ? 'on' : ''}" data-act="mercs">${mercs}<span class="sign">${save.mercs ? `${I.check} Hired` : 'Hire two'}</span></button>
        <div class="fs-fire">${fireHtml('side')}</div>
        <div class="logs"><i class="log l"></i><i class="log r"></i></div>
        <div class="fseats">${sitters}${fan}</div>
      </div>
      <div class="fs-bench"><div class="bench-h"><b>The bench</b><span class="muted">Tap a hero to sit them by the fire, again to stand them up</span></div>
        <div class="bench">${bench}</div></div>
    </div>`,
    foot: `<div class="footbar three">
      <button class="btn side" data-act="place:shop">${I.bag}<span>Trader</span></button>
      <button class="btn big setout" data-act="setout">${I.fire}<span>Set out</span></button>
      <button class="btn side" data-act="place:book">${I.book}<span>Book</span></button></div>`,
  };
}
// After drawing: keep the bench where it was scrolled to.
let benchScroll = 0;
export function firesideAfter(main) {
  const b = main.querySelector('.bench'); if (!b) return;
  b.scrollLeft = benchScroll;
  b.addEventListener('scroll', () => { benchScroll = b.scrollLeft; }, { passive: true });
}

// The mountain road: a switchback climbing from the camp to each dungeon's gate, the first nearest.
export function firesideRoad(ctx) {
  const { save, themes } = ctx;
  const opts = P.runOptions(save, null, ctx.potionFor);
  const who = [...opts.party.map((id) => HEROES[id].art), ...(save.mercs ? P.MERCS.map((m) => m.art) : [])];
  const ids = Object.keys(themes), n = ids.length, STEP = 168, top = 70, H = top + n * STEP + 150;
  // the path: from the walkers at the bottom, zig-zag up through each gate
  const pts = ids.map((_, i) => ({ x: i % 2 ? 72 : 28, y: H - 150 - (i + 0.5) * STEP }));
  let d = `M50 ${H}`;
  let px = 50, py = H - 40;
  d += ` L${px} ${py}`;
  for (const p of pts) { d += ` C${px} ${py - STEP * 0.45} ${p.x} ${p.y + STEP * 0.45} ${p.x} ${p.y}`; px = p.x; py = p.y; }
  const gates = ids.map((id, i) => {
    const t = themes[id], c = themeColors(t), rec = save.dungeons[id], p = pts[i];
    return `<button class="mgate ${i % 2 ? 'r' : 'l'}" data-act="enter:${id}" style="top:${p.y}px;--floor:${c.floor};--wall:${c.wall};--rock:${c.rock};--accent:${c.accent};--d:${(n - i) * 0.06}s">
      <span class="cave"><svg viewBox="0 0 120 96"><path d="M0 96V40C10 14 34 2 60 2s50 12 60 38v56z" fill="${INK}"/><path d="M6 96V42C16 20 36 9 60 9s44 11 54 33v54z" fill="var(--wall)"/>
        <path d="M30 96V58a30 30 0 0 1 60 0v38z" fill="${INK}"/><path class="door-glow" d="M37 96V60a23 23 0 0 1 46 0v36z" fill="var(--accent)"/><path d="M6 86h108v10H6z" fill="var(--floor)"/></svg>
        <span class="depth">${i + 1}</span></span>
      <span class="gtext"><b>${t.name}</b><span>${t.blurb || ''}</span><span class="muted">${rec && rec.cleared ? I.star : ''}${themeLine(rec)}</span></span></button>`;
  }).join('');
  return {
    html: `<div class="mountain" style="height:${H}px"><div class="stars">${starHtml()}</div>
      <svg class="mpath" viewBox="0 0 100 ${H}" preserveAspectRatio="none"><path d="${d}" vector-effect="non-scaling-stroke"/></svg>
      <div class="m-head"><h1>Up the mountain</h1><span class="muted">The first gate is the gentlest. Higher up, the dark gets meaner.</span></div>
      ${gates}
      <div class="walkers">${who.length ? who.map((a, i) => `<img src="${a}" alt="" style="--d:${i * 0.25}s">`).join('') : '<span class="muted">Nobody is ready. Sit a hero at the fire or hire the sellswords.</span>'}</div>
    </div>`,
    foot: `<div class="footbar"><button class="btn back-btn" data-act="back">${I.back}<span>Back to the fire</span></button></div>`,
    scrollToEnd: true,
  };
}

// Little schematic pictures for the settings' layout buttons.
export function miniPicture(act, id) {
  const g = '#FFB347', d = '#3A4466', l = '#8C97BA';
  if (act === 'layout' && id === 'clearing') return `<svg viewBox="0 0 80 50"><rect width="80" height="50" rx="6" fill="#121726"/><circle cx="40" cy="28" r="12" fill="#2A2418"/><circle cx="40" cy="28" r="4" fill="${g}"/>
    <circle cx="28" cy="36" r="3" fill="${l}"/><circle cx="52" cy="36" r="3" fill="${l}"/><circle cx="31" cy="20" r="3" fill="${l}"/><path d="M6 6l10-3 10 3v9H6z" fill="${d}"/><rect x="56" y="5" width="18" height="12" rx="2" fill="${d}"/><path d="M36 50l2-8h4l2 8z" fill="#4A3A28"/></svg>`;
  if (act === 'layout') return `<svg viewBox="0 0 80 50"><rect width="80" height="50" rx="6" fill="#121726"/><path d="M0 22l14-8 10 5 14-10 12 7 14-6 16 8v6H0z" fill="${d}"/><circle cx="20" cy="17" r="1.6" fill="${g}"/><circle cx="52" cy="14" r="1.6" fill="${g}"/>
    <rect x="0" y="27" width="80" height="11" fill="#1C2236"/><path d="M38 34l2-6 2 6z" fill="${g}"/><rect x="12" y="32" width="20" height="4" rx="2" fill="#6A4630"/><rect x="48" y="32" width="20" height="4" rx="2" fill="#6A4630"/>
    <g fill="${l}"><rect x="5" y="41" width="9" height="7" rx="2"/><rect x="18" y="41" width="9" height="7" rx="2"/><rect x="31" y="41" width="9" height="7" rx="2"/><rect x="44" y="41" width="9" height="7" rx="2"/><rect x="57" y="41" width="9" height="7" rx="2"/><rect x="70" y="41" width="9" height="7" rx="2"/></g></svg>`;
  if (id === 'grove') return `<svg viewBox="0 0 80 50"><rect width="80" height="50" rx="6" fill="#121726"/><path d="M40 40V12M40 34C30 30 24 24 22 12M40 34c10-4 16-10 18-22M40 40l-14 7M40 40l14 7" stroke="${l}" stroke-width="2.4" fill="none"/>
    <circle cx="22" cy="12" r="3.4" fill="${g}"/><circle cx="40" cy="12" r="3.4" fill="${g}"/><circle cx="58" cy="12" r="3.4" fill="${d}"/><circle cx="26" cy="24" r="3" fill="${g}"/><circle cx="54" cy="24" r="3" fill="${d}"/><circle cx="40" cy="38" r="4.6" fill="#E6D2B0"/></svg>`;
  return `<svg viewBox="0 0 80 50"><rect width="80" height="50" rx="6" fill="#121726"/><circle cx="40" cy="25" r="20" fill="none" stroke="${d}" stroke-width="1.6" stroke-dasharray="3 2"/><circle cx="40" cy="25" r="13" fill="none" stroke="${d}" stroke-width="1.6"/>
    <path d="M40 25V5M40 25l17 10M40 25L23 35" stroke="${l}" stroke-width="2"/><circle cx="40" cy="12" r="3" fill="${g}"/><circle cx="40" cy="5" r="3" fill="${g}"/><circle cx="51" cy="31.5" r="3" fill="${d}"/><circle cx="29" cy="31.5" r="3" fill="${g}"/><circle cx="40" cy="25" r="5" fill="#E6D2B0"/></svg>`;
}
