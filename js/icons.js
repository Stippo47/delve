// Little sprites for the UI: every trinket, potion, status and ability gets one. Same look as the game's art: flat
// colour, a soft highlight, a heavy ink outline. Each is the inside of a 32x32 SVG; icon(id) wraps it.
//   icon(kind, id, cls)   kind: 'trinket' | 'potion' | 'status' | 'ability'  -> '<svg ...>' markup
// Anything without a drawing falls back to a gem in the item's colour, so new trinkets still show.
import { GLYPH2 } from './heroes2.js';
const INK = '#2B2230';
const O = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"`;
const H = 'stroke="none"'; // highlights: no outline
// a highlight line that names its own stroke keeps it (the stroke="none" is only for filled highlights)
const tidy = (s) => s.replace(/<[^>]+>/g, (t) => ((t.match(/ stroke="/g) || []).length > 1 ? t.replace(' stroke="none"', '') : t));
const wrap = (inner, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 32 32" aria-hidden="true"><g ${O}>${inner}</g></svg>`;

// ---------------------------------------------------------------- shared bits
const ringBand = (gem, glint = '#FFFFFF') => `
  <ellipse cx="16" cy="20" rx="10" ry="8.5" fill="none" stroke="${INK}" stroke-width="7"/>
  <ellipse cx="16" cy="20" rx="10" ry="8.5" fill="none" stroke="#E8B53A" stroke-width="3.2" ${H}/>
  <path d="M8.6 16.4a10 8.5 0 0 1 6-4.6" fill="none" stroke="#FFE7A0" stroke-width="1.4" ${H}/>
  <path d="M16 3l6 5-6 7-6-7z" fill="${gem}"/><path d="M16 3l6 5h-12z" fill="${glint}" opacity=".55" ${H}/>`;
const flaskRound = (liquid, light, cork = '#B07A45') => `
  <path d="M13 4h6v6.2a9 9 0 1 1-6 0z" fill="#E9F1F4"/>
  <path d="M10.4 16.5a6.6 6.6 0 1 0 11.2 0z" fill="${liquid}" ${H}/>
  <path d="M11.6 15.2h8.8" stroke="${light}" stroke-width="1.6" ${H}/>
  <rect x="12.2" y="2" width="7.6" height="4.4" rx="1.6" fill="${cork}"/>
  <path d="M10 19.5a6 6 0 0 0 2 5" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".7" ${H}/>`;

// ---------------------------------------------------------------- trinkets
const TRINKET = {
  phoenixFeather: `<path d="M8 28C9 18 14 8 25 3c1 8-3 17-11 21z" fill="#FF7A2F"/><path d="M11 24c3-6 7-12 13-18-1 7-4 12-9 16z" fill="#FFD45A" ${H}/>
    <path d="M7 29l10-14" fill="none"/><path d="M14 13l-4-3M18 9l-4-4M12 18l-5-1" fill="none" stroke="#C8452A" stroke-width="1.6" ${H}/>`,
  wraithVeil: `<path d="M16 3c7 0 10 6 10 13v11l-3-2-3 3-4-3-4 3-3-3-3 2V16C6 9 9 3 16 3z" fill="#DCE8FF"/>
    <path d="M10 15c0-5 2-9 6-9" fill="none" stroke="#FFFFFF" stroke-width="2" ${H}/><ellipse cx="12.5" cy="15" rx="1.8" ry="2.6" fill="${INK}" ${H}/><ellipse cx="19.5" cy="15" rx="1.8" ry="2.6" fill="${INK}" ${H}/>`,
  timeSand: `<rect x="6" y="3" width="20" height="4" rx="1.5" fill="#B07A45"/><rect x="6" y="25" width="20" height="4" rx="1.5" fill="#B07A45"/>
    <path d="M9 7h14c0 5-5 7-5 9s5 4 5 9H9c0-5 5-7 5-9s-5-4-5-9z" fill="#E6F2F6"/>
    <path d="M11.5 9h9c-1 3-4 4-4.5 6h0c-.5-2-3.5-3-4.5-6zM11 24c1-3 4-4 5-6 1 2 4 3 5 6z" fill="#E8C878" ${H}/>`,
  impLantern: `<path d="M12 4h8M16 4v3" fill="none"/><path d="M10 9h12l-1 16H11z" fill="#3B2C25"/>
    <path d="M12.5 11h7l-.8 12h-5.4z" fill="#FFB347" ${H}/><path d="M16 13c2 2.5 3 4 3 5.6a3 3 0 0 1-6 0c0-1.6 1-3 3-5.6z" fill="#FFF0A0" ${H}/>
    <rect x="9" y="7" width="14" height="3" rx="1" fill="#8A6A40"/><rect x="9" y="24" width="14" height="4" rx="1.2" fill="#8A6A40"/>`,
  blinkStone: `<path d="M16 3l10 8-4 16H10L6 11z" fill="#9B6BE8"/><path d="M16 3l10 8H6z" fill="#C9A7FF" ${H}/><path d="M6 11h20l-10 6z" fill="#B58CFF" ${H}/>
    <path d="M24 2l1 2.4L27.4 5 25 6l-1 2.4L23 6l-2.4-1L23 4z" fill="#FFFFFF"/>`,
  thunderRing: ringBand('#FFF27A') + `<path d="M17 5l-3 4h2.6l-2 3" fill="none" stroke="${INK}" stroke-width="1.2" ${H}/>`,
  boneCharm: `<path d="M16 2v6" fill="none" stroke="#8A6A40" stroke-width="2"/>
    <path d="M9 12a3 3 0 1 1 3.6-2.6L20 17a3 3 0 1 1 2.4 4 3 3 0 1 1-3.6 2.6L11.4 16A3 3 0 1 1 9 12z" fill="#EDE6D0"/>
    <path d="M12 12l8 7" stroke="#FFFFFF" stroke-width="1.4" ${H}/>`,
  widowLocket: `<path d="M16 3a2 2 0 0 0 0 4" fill="none" stroke="#C8A13A" stroke-width="2"/>
    <path d="M16 29C6 22 4 17 4 13a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 4-2 9-12 16z" fill="#E8B53A"/>
    <path d="M16 24c-6-4-8-7-8-10a3 3 0 0 1 6-1h4a3 3 0 0 1 6 1c0 3-2 6-8 10z" fill="#FFE7A0" ${H}/><circle cx="16" cy="16" r="2.4" fill="#9B5BC9"/>`,
  whirlingKnives: `<path d="M4 16a12 12 0 0 1 20-8.6" fill="none" stroke="#B8C4D4" stroke-width="2" stroke-dasharray="3 3" ${H}/>
    <path d="M28 16a12 12 0 0 1-20 8.6" fill="none" stroke="#B8C4D4" stroke-width="2" stroke-dasharray="3 3" ${H}/>
    <path d="M7 25L19 8l3 2-11 17z" fill="#E8EEF6"/><rect x="5" y="24" width="5" height="4" rx="1" fill="#8A5A30" transform="rotate(-55 7.5 26)"/><g transform="matrix(-1 0 0 1 32 0)"><path d="M7 25L19 8l3 2-11 17z" fill="#E8EEF6"/><rect x="5" y="24" width="5" height="4" rx="1" fill="#8A5A30" transform="rotate(-55 7.5 26)"/></g>`,
  splitShard: `<path d="M2 16l12-5 4 5-4 5z" fill="#9FDDF6"/><path d="M17 14l12-10-3 9z" fill="#BFEFFF"/><path d="M17 18l12 10-9-3z" fill="#BFEFFF"/>
    <path d="M4 16h10" stroke="#FFFFFF" stroke-width="1.6" ${H}/>`,
  cinderBoots: `<path d="M9 4h9v13l8 4c2 1 2 3 2 5v2H6V12z" fill="#7A4A2A"/><path d="M6 24h22v4H6z" fill="#3B2C25"/>
    <path d="M10 6h6v9h-6z" fill="#9A623A" ${H}/>
    <circle cx="24" cy="10" r="2" fill="#FF8A3D"/><circle cx="27" cy="15" r="1.4" fill="#FFD45A"/><circle cx="21" cy="5" r="1.4" fill="#FF7A2F"/>`,
  brambleVest: `<path d="M9 4l4 3h6l4-3 5 5-3 4v15H7V13L4 9z" fill="#6E9440"/><path d="M13 7l3 6 3-6" fill="#4F6A30"/>
    <path d="M16 13v15" fill="none" stroke="${INK}" stroke-width="1.4" ${H}/>
    <path d="M7 16l-3 1 3 1M25 16l3 1-3 1M7 22l-3 1 3 1M25 22l3 1-3 1" fill="#9BCB3C"/>`,
  soulJar: `<rect x="11" y="3" width="10" height="4" rx="1.5" fill="#8A6A40"/><path d="M10 7h12c3 3 4 6 4 10 0 7-4 11-10 11S6 24 6 17c0-4 1-7 4-10z" fill="#DDF2FF"/>
    <path d="M16 11c4 2 5 5 3 8s-6 3-6 0 4-3 4-1" fill="none" stroke="#7FB8E8" stroke-width="2.4" ${H}/><path d="M9 14c-1 3-1 6 1 9" fill="none" stroke="#FFFFFF" stroke-width="1.8" ${H}/>`,
  frostBloom: `<g fill="#BFEFFF"><path d="M16 2l3 9-3 3-3-3z"/><path d="M16 30l3-9-3-3-3 3z"/><path d="M2 16l9-3 3 3-3 3z"/><path d="M30 16l-9-3-3 3 3 3z"/>
    <path d="M6 6l8 5v3h-3z"/><path d="M26 26l-8-5v-3h3z"/><path d="M26 6l-5 8h-3v-3z"/><path d="M6 26l5-8h3v3z"/></g><circle cx="16" cy="16" r="3.5" fill="#FFFFFF"/>`,
  galeFeather: `<path d="M7 27C8 17 13 8 24 4c1 8-3 16-11 20z" fill="#F2F6F8"/><path d="M7 28l10-14" fill="none"/>
    <path d="M14 22c2-5 5-10 9-15" fill="none" stroke="#C8D8E0" stroke-width="1.6" ${H}/>
    <path d="M20 22h8M22 26h6M24 18h5" fill="none" stroke="#9FC8DD" stroke-width="2"/>`,
  salamanderScale: `<path d="M16 3c7 3 11 8 11 14 0 6-5 11-11 12C10 28 5 23 5 17 5 11 9 6 16 3z" fill="#FF6A3D"/>
    <path d="M16 7c5 2 7 6 7 10 0 4-3 7-7 8-4-1-7-4-7-8 0-4 2-8 7-10z" fill="#FFB347" ${H}/><path d="M16 9v14M11 15l5 3 5-3" fill="none" stroke="#E0482A" stroke-width="1.6" ${H}/>`,
  snakeCharm: `<path d="M22 6c4 0 6 3 4 6-2 4-12 2-14 6-2 3 1 6 6 6 4 0 6-2 7-4" fill="none" stroke="${INK}" stroke-width="8"/>
    <path d="M22 6c4 0 6 3 4 6-2 4-12 2-14 6-2 3 1 6 6 6 4 0 6-2 7-4" fill="none" stroke="#9BCB3C" stroke-width="4.2" ${H}/>
    <ellipse cx="21" cy="6.5" rx="4" ry="3" fill="#9BCB3C"/><circle cx="22" cy="5.6" r="1" fill="${INK}" ${H}/><path d="M17 6.5h-3l-1-1M14 6.5l-1 1" fill="none" stroke="#C8553D" stroke-width="1.2" ${H}/>`,
  kindlingFlask: flaskRound('#FF8A3D', '#FFD45A') + `<path d="M16 15c2 2 2.6 3.4 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.2.6-2.6 2.6-4.6z" fill="#FFF0A0" ${H}/>`,
  hookChain: `<path d="M8 3l3 3M11 6l3 3M14 9l2 2" fill="none" stroke="#A8A8B0" stroke-width="3.2"/>
    <path d="M16 11v8a5 5 0 0 1-10 0" fill="none" stroke="${INK}" stroke-width="7"/><path d="M16 11v8a5 5 0 0 1-10 0" fill="none" stroke="#C8CCD4" stroke-width="3.4" ${H}/>
    <path d="M6 19l-2-3 4 0z" fill="#C8CCD4"/><circle cx="23" cy="23" r="4" fill="none" stroke="#A8A8B0" stroke-width="2.6"/><circle cx="26" cy="27" r="2" fill="#A8A8B0"/>`,
  howlingSkull: `<path d="M16 3c7 0 11 5 11 11 0 4-2 6-4 7v5h-4v-3h-2v3h-2v-3h-2v3H9v-5c-2-1-4-3-4-7C5 8 9 3 16 3z" fill="#E8E2D0"/>
    <ellipse cx="11.5" cy="14" rx="2.8" ry="3.2" fill="${INK}" ${H}/><ellipse cx="20.5" cy="14" rx="2.8" ry="3.2" fill="${INK}" ${H}/><ellipse cx="16" cy="20.5" rx="2" ry="2.6" fill="${INK}" ${H}/>
    <path d="M28 9l3-2M29 14h3M2 9L-1 7M3 14H0" fill="none" stroke="#D9D2C0" stroke-width="1.6"/>`,
  lastBreath: `<rect x="11" y="13" width="10" height="15" rx="2" fill="#F6F0E2"/><path d="M13 15h2v11h-2z" fill="#FFFFFF" ${H}/>
    <path d="M16 13v-2" fill="none"/><path d="M16 2c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1-4 4-7z" fill="#FFE7A0"/><path d="M16 6c1.4 1.6 2 2.6 2 3.4a2 2 0 0 1-4 0c0-.8.6-1.8 2-3.4z" fill="#FFFFFF" ${H}/>`,
  volatile: `<circle cx="15" cy="19" r="10" fill="#4A3B4F"/><path d="M9 15a7 7 0 0 1 6-4" fill="none" stroke="#8C7A94" stroke-width="2.4" ${H}/>
    <path d="M21 10l3-3" fill="none" stroke="#B07A45" stroke-width="2.6"/><path d="M26 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#FF8A3D"/><circle cx="25.5" cy="6" r="1.4" fill="#FFF0A0" ${H}/>`,
  frostRing: ringBand('#7FD6F5'),
  emberRing: ringBand('#FF7A2F', '#FFD45A'),
  venomFang: `<path d="M9 3h14c0 8-3 16-7 26C12 19 9 11 9 3z" fill="#F6F0E2"/><path d="M12 9c1 5 2 9 4 14 2-5 3-9 4-14z" fill="#9BCB3C" ${H}/>
    <circle cx="16" cy="29" r="1.8" fill="#9BCB3C"/><path d="M11 4c0 4 1 7 2 10" fill="none" stroke="#FFFFFF" stroke-width="1.6" ${H}/>`,
  tideShell: `<path d="M16 4C8 4 3 11 4 19l12 9 12-9c1-8-4-15-12-15z" fill="#6FB7E8"/>
    <path d="M16 6v20M10 8l3 18M22 8l-3 18M6 14l7 12M26 14l-7 12" fill="none" stroke="#A8DAF5" stroke-width="1.6" ${H}/><path d="M12 27h8v3h-8z" fill="#4F8FC0"/>`,
  leadWeight: `<path d="M12 5a4 4 0 0 1 8 0v3h-8z" fill="none" stroke="${INK}" stroke-width="5"/><path d="M12 5a4 4 0 0 1 8 0v3" fill="none" stroke="#8C8C96" stroke-width="2" ${H}/>
    <path d="M9 9h14l4 19H5z" fill="#6E6E78"/><path d="M11 12h4l-2 13H8z" fill="#9A9AA6" ${H}/>`,
  vampTooth: `<path d="M8 3h16c0 8-4 14-8 26C12 17 8 11 8 3z" fill="#F6F0E2"/><path d="M13 19c1 3 2 6 3 10 1-4 2-7 3-10-2 1-4 1-6 0z" fill="#C8553D" ${H}/>
    <circle cx="16" cy="29.5" r="1.8" fill="#C8553D"/><path d="M10 4c0 4 1 7 3 10" fill="none" stroke="#FFFFFF" stroke-width="1.6" ${H}/>`,
  ironSkin: `<path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#B8BCC4"/>
    <path d="M16 6l8 3v6c0 5-3 9-8 11z" fill="#8F97A3" ${H}/><circle cx="10" cy="10" r="1.3" fill="${INK}" ${H}/><circle cx="22" cy="10" r="1.3" fill="${INK}" ${H}/><circle cx="16" cy="23" r="1.3" fill="${INK}" ${H}/>`,
  swiftBoots: `<path d="M9 4h9v13l8 4c2 1 2 3 2 5v2H6V12z" fill="#D8C08A"/><path d="M6 24h22v4H6z" fill="#8A6A40"/><path d="M10 6h6v9h-6z" fill="#EAD7A8" ${H}/>
    <path d="M18 8c4-3 8-4 12-3-2 2-5 3-8 3 3 0 5 0 7 1-3 2-7 2-11 1z" fill="#FFFFFF"/>`,
};

// ---------------------------------------------------------------- potions (bottle shape and colour tell them apart)
const POTION = {
  heal: flaskRound('#E0604B', '#F7B3A3') + `<path d="M13 18h6M16 15v6" stroke="#FFFFFF" stroke-width="2.2" ${H}/>`,
  haste: `<path d="M12 4h8v5l5 5v12a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V14l5-5z" fill="#E9F1F4"/><path d="M8.6 16h14.8v9.6a1.6 1.6 0 0 1-1.6 1.6H10.2a1.6 1.6 0 0 1-1.6-1.6z" fill="#E8D84A" ${H}/>
    <rect x="11" y="2" width="10" height="4" rx="1.5" fill="#B07A45"/><path d="M12 19c3-2 6-2 9 0-3 0-5 1-6 3 0-2-1-3-3-3z" fill="#FFFFFF" ${H}/><path d="M25 14l4-2M25 18h5M25 22l4 2" fill="none" stroke="#E8D84A" stroke-width="2"/>`,
  quick: `<path d="M13 4h6v4c5 2 8 6 8 11a11 11 0 0 1-22 0c0-5 3-9 8-11z" fill="#E9F1F4"/><path d="M7.6 18a8.4 8.4 0 0 0 16.8 0z" fill="#5FA8F0" ${H}/>
    <rect x="12" y="2" width="8" height="4" rx="1.5" fill="#6B4A8A"/><path d="M16 14v5l3 2" fill="none" stroke="#FFFFFF" stroke-width="2" ${H}/><circle cx="16" cy="19" r="6.4" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".7" ${H}/>`,
  fireproof: `<path d="M11 4h10v4l2 2v17a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V10l2-2z" fill="#E9F1F4"/><path d="M10.6 14h10.8v12.4H10.6z" fill="#3E8FC7" ${H}/>
    <rect x="10.4" y="2" width="11.2" height="4" rx="1.4" fill="#B07A45"/><path d="M16 15.5c2 2.2 3 3.6 3 5a3 3 0 0 1-6 0c0-1.4 1-2.8 3-5z" fill="#FF8A3D" ${H}/><path d="M12 25l8-9" stroke="#FFFFFF" stroke-width="2" ${H}/>`,
  ironskin: `<path d="M10 4h12v4l3 3v15a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V11l3-3z" fill="#E9F1F4"/><path d="M8.6 15h14.8v10.6a1.6 1.6 0 0 1-1.6 1.6H10.2a1.6 1.6 0 0 1-1.6-1.6z" fill="#8F97A3" ${H}/>
    <rect x="9.6" y="2" width="12.8" height="4" rx="1.4" fill="#5A5A64"/><path d="M16 16l5 2v3c0 2.6-2 4.4-5 5.4-3-1-5-2.8-5-5.4v-3z" fill="#D8DCE2" ${H}/>`,
  regen: flaskRound('#5FB55A', '#BFE8A8', '#6E9440') + `<path d="M13 21c0-3 2-5 5-6-1 2-1 4-3 5 2 0 3-1 4-2 0 3-2 5-6 5z" fill="#E6F6D8" ${H}/>`,
};

// ---------------------------------------------------------------- statuses (the HUD's shrinking rings hold these)
const STATUS = {
  burn: `<path d="M16 3c2 5 9 8 9 15a9 9 0 0 1-18 0c0-4 3-7 4-9 0 3 1 4 3 5 0-4-1-7 2-11z" fill="#FF7A2F"/><path d="M16 15c2 2 4 3.4 4 6a4 4 0 0 1-8 0c0-2 2-4 4-6z" fill="#FFE07A" ${H}/>`,
  chill: `<path d="M16 3v26M4.7 9.5l22.6 13M4.7 22.5l22.6-13" fill="none" stroke="${INK}" stroke-width="6"/><path d="M16 3v26M4.7 9.5l22.6 13M4.7 22.5l22.6-13" fill="none" stroke="#9FDDF6" stroke-width="2.6" ${H}/>
    <path d="M12.5 5.5L16 8.5l3.5-3M12.5 26.5L16 23.5l3.5 3" fill="none" stroke="#9FDDF6" stroke-width="2" ${H}/>`,
  frozen: `<path d="M5 9l11-5 11 5v14l-11 5-11-5z" fill="#BFEFFF"/><path d="M5 9l11 5 11-5M16 14v14" fill="none" stroke="#7FC8E8" stroke-width="1.8" ${H}/><path d="M8 11l5 2v6" fill="none" stroke="#FFFFFF" stroke-width="1.8" ${H}/>`,
  poison: `<path d="M16 3c4 7 9 11 9 17a9 9 0 0 1-18 0c0-6 5-10 9-17z" fill="#9BCB3C"/><circle cx="13" cy="19" r="2" fill="${INK}" ${H}/><circle cx="19" cy="19" r="2" fill="${INK}" ${H}/><path d="M13 24h6" stroke="${INK}" stroke-width="1.8" ${H}/>`,
  wet: `<path d="M16 3c4 7 9 11 9 17a9 9 0 0 1-18 0c0-6 5-10 9-17z" fill="#6FB7E8"/><path d="M11 20a5 5 0 0 0 4 5" fill="none" stroke="#DDF2FF" stroke-width="2.2" ${H}/>`,
  shock: `<path d="M19 2L7 18h7l-3 12 14-17h-8z" fill="#FFF27A"/>`,
  stagger: `<circle cx="16" cy="16" r="11" fill="none" stroke="#E8E2D0" stroke-width="2.4" stroke-dasharray="4 4"/><path d="M16 9l2 4.4 4.6.4-3.5 3 1.1 4.6L16 19l-4.2 2.4 1.1-4.6-3.5-3 4.6-.4z" fill="#FFE7A0"/>`,
  stun: `<path d="M9 6l1.6 3.2 3.4.5-2.5 2.4.6 3.4L9 13.9l-3.1 1.6.6-3.4L4 9.7l3.4-.5zM23 4l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5zM16 16l1.6 3.2 3.4.5-2.5 2.4.6 3.4L16 23.9l-3.1 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#FFE14D"/>`,
  root: `<path d="M6 28c2-8 6-10 10-10s8 2 10 10" fill="none" stroke="${INK}" stroke-width="6"/><path d="M6 28c2-8 6-10 10-10s8 2 10 10" fill="none" stroke="#7FA04A" stroke-width="3" ${H}/>
    <path d="M16 18V6" fill="none" stroke="${INK}" stroke-width="6"/><path d="M16 18V6" fill="none" stroke="#7FA04A" stroke-width="3" ${H}/><path d="M16 9c3-4 7-4 9-3-2 3-5 4-9 3zM16 13c-3-3-7-3-9-2 2 3 5 3 9 2z" fill="#9BCB3C"/>`,
  sleep: `<path d="M20 4a12 12 0 1 0 8 18A10 10 0 0 1 20 4z" fill="#C9B8FF"/><path d="M8 12a9 9 0 0 1 4-5" fill="none" stroke="#FFFFFF" stroke-width="1.8" ${H}/>`,
  ko: `<path d="M16 2l3 8 8-3-4 8 7 4-8 2 2 9-8-5-8 5 2-9-8-2 7-4-4-8 8 3z" fill="#FFE7A0"/><circle cx="16" cy="17" r="3" fill="#FFFFFF" ${H}/>`,
  guard: `<path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#5B8CDB"/><path d="M16 7v18M9 13h14" fill="none" stroke="#FFE7A0" stroke-width="2.6" ${H}/>`,
  buff: `<path d="M16 3l11 12h-6v13H11V15H5z" fill="#7CC06F"/><path d="M16 7l6 6" fill="none" stroke="#C8F0B8" stroke-width="1.8" ${H}/>`,
  debuff: `<path d="M16 29L5 17h6V4h10v13h6z" fill="#C8553D"/>`,
  invuln: `<ellipse cx="16" cy="9" rx="10" ry="4" fill="none" stroke="${INK}" stroke-width="6"/><ellipse cx="16" cy="9" rx="10" ry="4" fill="none" stroke="#FFE07A" stroke-width="2.8" ${H}/>
    <path d="M16 15l2 4.4 4.6.4-3.5 3 1.1 4.6L16 25l-4.2 2.4 1.1-4.6-3.5-3 4.6-.4z" fill="#FFF6C8"/>`,
  rage: `<path d="M8 14c0-4 3-6 5-6h7c3 0 5 2 5 5v6c0 5-4 9-9 9s-8-4-8-8z" fill="#E0604B"/><path d="M12 8v7M16 8v7M20 8v7" fill="none" stroke="${INK}" stroke-width="1.6" ${H}/>`,
  taunt: `<circle cx="16" cy="16" r="12" fill="#E0604B"/><circle cx="16" cy="16" r="7" fill="#FFFFFF" ${H}/><circle cx="16" cy="16" r="3" fill="#E0604B" ${H}/>`,
  // round 8: radiance builds (a halo over a small sun), radiant is the burst's glow (rays all round)
  radiance: `<ellipse cx="16" cy="8" rx="9" ry="3.4" fill="none" stroke="${INK}" stroke-width="5.4"/><ellipse cx="16" cy="8" rx="9" ry="3.4" fill="none" stroke="#FFE48A" stroke-width="2.4" ${H}/>
    <circle cx="16" cy="20" r="7.5" fill="#FFE48A"/><circle cx="14" cy="18" r="2.6" fill="#FFF8DC" ${H}/>`,
  radiant: `<path d="M16 2l2.6 7.4L26 6l-3.4 7.4L30 16l-7.4 2.6L26 26l-7.4-3.4L16 30l-2.6-7.4L6 26l3.4-7.4L2 16l7.4-2.6L6 6l7.4 3.4z" fill="#FFE48A"/><circle cx="16" cy="16" r="5.5" fill="#FFFFFF" ${H}/>`,
  // round 11: sickened, poison's burst (a green drop with a queasy line through it, bubbles coming off)
  sick: `<path d="M15 3c5 7 9 11 9 16a9 9 0 0 1-18 0c0-5 4-9 9-16z" fill="#9BCB3C"/><path d="M9.5 19.5c2-2.2 3.6 2.2 5.5 0s3.600 2.2 5.5 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" ${H}/><circle cx="25" cy="7" r="2.6" fill="#B6E05A"/><circle cx="28" cy="13.500" r="1.7" fill="#B6E05A"/>`,
  // cursed builds (a purple skull-drop), hexed is the armed curse (an eye in a ring)
  curse: `<path d="M16 3c6 0 10 4.4 10 10 0 4-2 6.4-4 7.6V26h-12v-5.4C8 19.4 6 17 6 13 6 7.4 10 3 16 3z" fill="#9A5CC8"/><circle cx="12.2" cy="13.5" r="2.6" fill="${INK}" ${H}/><circle cx="19.8" cy="13.5" r="2.6" fill="${INK}" ${H}/><path d="M13 22v3M16 22v3M19 22v3" stroke="${INK}" stroke-width="1.6" ${H}/>`,
  // round 9: entangle builds (a curl of vine); round 13: its burst roots (tangled and rooted are one state: the root icon)
  entangle: `<path d="M8 26c0-8 4-12 9-12 4 0 6-3 6-6" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M8 26c0-8 4-12 9-12 4 0 6-3 6-6" fill="none" stroke="#7FA04A" stroke-width="2.6" stroke-linecap="round" ${H}/>
    <path d="M13 17c-3-1-5-3-5-6 3 0 5 2 5 6zM20 12c1-3 4-4 6-3-1 3-3 4-6 3z" fill="#9BCB3C"/>`,
  hexed: `<circle cx="16" cy="16" r="12" fill="none" stroke="${INK}" stroke-width="5.4"/><circle cx="16" cy="16" r="12" fill="none" stroke="#9A5CC8" stroke-width="2.6" ${H}/>
    <path d="M6 16c3-5 6.4-7 10-7s7 2 10 7c-3 5-6.4 7-10 7s-7-2-10-7z" fill="#E6D2F6"/><circle cx="16" cy="16" r="3.6" fill="#5A2A80" ${H}/>`,
  // ---- round 13 (lane S): the new build-ups and their bursts
  // charm builds (a pink heart pierced by a little arrow), charmed is the burst (the heart with a halo of sparks)
  charm: `<path d="M16 28C6 21 3 16 3 11.5a6.5 6.5 0 0 1 13-1.5 6.5 6.5 0 0 1 13 1.5C29 16 26 21 16 28z" fill="#FF8AC8"/><path d="M8 10a4 4 0 0 1 4-3" fill="none" stroke="#FFE0F0" stroke-width="2" ${H}/>
    <path d="M3 27L27 5" fill="none" stroke="${INK}" stroke-width="4.6"/><path d="M3 27L27 5" fill="none" stroke="#F2E6C8" stroke-width="2" ${H}/><path d="M29 3l-7 1.6 5.4 5.4z" fill="#E8EEF6"/><path d="M3 27l1-5 4 4z" fill="#FF8AC8"/>`,
  charmed: `<path d="M16 27C7 21 4 16.5 4 12.5a6 6 0 0 1 12-1.4 6 6 0 0 1 12 1.4C28 16.5 25 21 16 27z" fill="#FF5AAE"/><path d="M9 11a4 4 0 0 1 4-3" fill="none" stroke="#FFE0F0" stroke-width="2" ${H}/>
    <path d="M5 4l1 2.4L8.4 7 6 8 5 10.4 4 8 1.6 7 4 6zM27 3l1 2.4 2.4.6L28 7l-1 2.4L26 7l-2.4-1 2.4-.6zM28 22l.8 1.8 1.8.6-1.8.6-.8 1.8-.8-1.8-1.8-.6 1.8-.6z" fill="#FFE7A0"/>`,
  // confused builds (a lilac question mark), addled is the burst (two spirals spinning the other way)
  confuse: `<path d="M10 11a6 6 0 1 1 9.4 5c-2 1.4-3.4 2.6-3.4 5" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M10 11a6 6 0 1 1 9.4 5c-2 1.4-3.4 2.6-3.4 5" fill="none" stroke="#C9A8F0" stroke-width="3.4" stroke-linecap="round" ${H}/><circle cx="16" cy="27" r="2.8" fill="#C9A8F0"/>`,
  addled: `<path d="M10 16a4 4 0 1 1 4 4 6 6 0 1 1 6-6" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M10 16a4 4 0 1 1 4 4 6 6 0 1 1 6-6" fill="none" stroke="#C9A8F0" stroke-width="2.4" stroke-linecap="round" ${H}/>
    <path d="M25 4l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4zM6 24l1 2 2.2.3-1.6 1.5.4 2.2L6 29l-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#FFE14D"/>`,
  // sleepy builds (a drooping eyelid and a small z); asleep keeps the moon
  sleepy: `<path d="M4 15c4-6 8-8 12-8s8 2 12 8c-4 6-8 8-12 8s-8-2-12-8z" fill="#E8E2F6"/><path d="M4 15c4-6 8-8 12-8s8 2 12 8z" fill="#A99CD8" ${H}/><path d="M4 15h24" stroke="${INK}" stroke-width="2.4" ${H}/>
    <circle cx="16" cy="17.400" r="3" fill="#5A4A7A" ${H}/><path d="M21 24h6l-6 6h6" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M21 24h6l-6 6h6" fill="none" stroke="#C9B8FF" stroke-width="2" ${H}/>`,
  // bleeding builds (blood running in two drops); its burst is a moment, not a state (no icon of its own)
  bleed: `<path d="M11 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z" fill="#C8453D"/><path d="M22 12c2.6 4 5 6.4 5 9.6a5 5 0 0 1-10 0c0-3.2 2.4-5.6 5-9.6z" fill="#A02A30"/>
    <path d="M8 15a3 3 0 0 0 2 3" fill="none" stroke="#FF9A8A" stroke-width="1.8" ${H}/>`,
  // fear builds (a pale face, eyes wide, a drop of sweat), terrified is the burst (the face running off, speed lines)
  fear: `<path d="M16 3c6.6 0 11 5 11 12 0 6-3 12-11 13-8-1-11-7-11-13 0-7 4.400-12 11-12z" fill="#E8EEE0"/><circle cx="12" cy="14" r="3.2" fill="#FFFFFF" ${H}/><circle cx="20" cy="14" r="3.2" fill="#FFFFFF" ${H}/>
    <circle cx="12" cy="14" r="1.3" fill="${INK}" ${H}/><circle cx="20" cy="14" r="1.3" fill="${INK}" ${H}/><ellipse cx="16" cy="22" rx="2.6" ry="3.2" fill="${INK}" ${H}/><path d="M26 4c1.6 2.4 2.6 3.8 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.2 1-2.6 2.6-5z" fill="#9FDDF6"/>`,
  terrified: `<path d="M18 4c6 0 10 4.6 10 11 0 5.6-2.8 11-10 12-7.200-1-10-6.400-10-12 0-6.400 4-11 10-11z" fill="#DCE4D0"/><circle cx="14.400" cy="13" r="2.8" fill="#FFFFFF" ${H}/><circle cx="21.600" cy="13" r="2.8" fill="#FFFFFF" ${H}/>
    <circle cx="14.400" cy="13" r="1.1" fill="${INK}" ${H}/><circle cx="21.600" cy="13" r="1.1" fill="${INK}" ${H}/><ellipse cx="18" cy="21" rx="3" ry="3.800" fill="${INK}" ${H}/><path d="M1 12h5M2 18h5M1 24h5" fill="none" stroke="#DCE4D0" stroke-width="2.4"/>`,
  // round 15 (lane N): shackles build (an open iron cuff and two links), shackled is the burst (two cuffs locked together)
  shackle: `<path d="M8 21a8 8 0 1 1 12-7" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M8 21a8 8 0 1 1 12-7" fill="none" stroke="#A9B4C6" stroke-width="3.2" stroke-linecap="round" ${H}/>
    <ellipse cx="22" cy="20" rx="4" ry="2.800" fill="none" stroke="${INK}" stroke-width="5"/><ellipse cx="22" cy="20" rx="4" ry="2.800" fill="none" stroke="#DCE3EC" stroke-width="1.800" ${H}/><ellipse cx="26.500" cy="25.500" rx="2.800" ry="4" fill="none" stroke="${INK}" stroke-width="5"/><ellipse cx="26.500" cy="25.500" rx="2.800" ry="4" fill="none" stroke="#A9B4C6" stroke-width="1.800" ${H}/>`,
  shackled: `<circle cx="9" cy="15" r="6" fill="none" stroke="${INK}" stroke-width="7"/><circle cx="9" cy="15" r="6" fill="none" stroke="#A9B4C6" stroke-width="3.200" ${H}/><circle cx="23" cy="15" r="6" fill="none" stroke="${INK}" stroke-width="7"/><circle cx="23" cy="15" r="6" fill="none" stroke="#A9B4C6" stroke-width="3.200" ${H}/>
    <path d="M12 6.500h8v6h-8z" fill="#E8B53A"/><circle cx="16" cy="9.500" r="1.300" fill="${INK}" ${H}/><path d="M6 25h20" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M6 25h20" fill="none" stroke="#DCE3EC" stroke-width="2.400" stroke-dasharray="3 2.500" ${H}/>`,
  // round 17 (lane tags17): silenced, a speech bubble struck through in red (its mouth shut)
  silenced: `<path d="M16 5c7 0 12 4 12 9.500S23 24 16 24c-1.400 0-2.800-.200-4-.500L5 28l2.400-6C5.300 20 4 17.400 4 14.500 4 9 9 5 16 5z" fill="#FFFBEA" stroke="${INK}" stroke-width="2.600" stroke-linejoin="round"/>
    <circle cx="11" cy="14.500" r="1.700" fill="${INK}"/><circle cx="16" cy="14.500" r="1.700" fill="${INK}"/><circle cx="21" cy="14.500" r="1.700" fill="${INK}"/><path d="M5 24L27 6" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M5 24L27 6" fill="none" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/>`,
  // ---- round 15 (lane E): the newer heroes' eight, lifted into the statuses (plain stand-ins in the look above)
  // whirled builds (a white curl of wind and two gusts), spun builds (a gold arrow turning back on itself)
  whirled: `<path d="M17 15.500a2.600 2.600 0 1 0-3.200 3 5.600 5.600 0 1 0 7.400-6.800A9 9 0 1 0 8.500 24" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M17 15.500a2.600 2.600 0 1 0-3.200 3 5.600 5.600 0 1 0 7.400-6.800A9 9 0 1 0 8.500 24" fill="none" stroke="#EEF3F8" stroke-width="2.600" stroke-linecap="round" ${H}/>
    <path d="M22 26h7M25 22h4" fill="none" stroke="${INK}" stroke-width="4.400" stroke-linecap="round"/><path d="M22 26h7M25 22h4" fill="none" stroke="#C9D2DE" stroke-width="1.800" stroke-linecap="round" ${H}/>`,
  spun: `<path d="M9 22a9 9 0 1 1 13 2" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M9 22a9 9 0 1 1 13 2" fill="none" stroke="#FFE7A0" stroke-width="3.200" stroke-linecap="round" ${H}/><path d="M17 20l9 2.500-5.500 7z" fill="#E8B53A"/>`,
  // dirty (clods of earth), targeted (a red crosshair), tracked (an amber crosshair with a falcon over it), trapped (jaws)
  dirty: `<path d="M5 21c0-4 3-6 6-6 2-3 6-4 9-2 4 0 7 3 7 7 0 3-2 6-6 6H10c-3 0-5-2-5-5z" fill="#9C7650"/><circle cx="12" cy="19" r="2.200" fill="#7A5A3A" ${H}/><circle cx="20" cy="21" r="2.600" fill="#7A5A3A" ${H}/><circle cx="17" cy="15.500" r="1.400" fill="#C9A47A" ${H}/>`,
  targeted: `<circle cx="16" cy="16" r="9.500" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="16" cy="16" r="9.500" fill="none" stroke="#FF5A4A" stroke-width="2.600" ${H}/>
    <path d="M16 2v8M16 22v8M2 16h8M22 16h8" fill="none" stroke="${INK}" stroke-width="5.400" stroke-linecap="round"/><path d="M16 2v8M16 22v8M2 16h8M22 16h8" fill="none" stroke="#FF5A4A" stroke-width="2.200" stroke-linecap="round" ${H}/><circle cx="16" cy="16" r="2.400" fill="#FF5A4A"/>`,
  tracked: `<circle cx="16" cy="18" r="9" fill="none" stroke="${INK}" stroke-width="5.600"/><circle cx="16" cy="18" r="9" fill="none" stroke="#E0A060" stroke-width="2.400" stroke-dasharray="4 3" ${H}/>
    <path d="M4 7c4-1 8 1 12 5 4-4 8-6 12-5-3 2-6 6-12 9-6-3-9-7-12-9z" fill="#5A6478"/><path d="M14 12h4l-2 3z" fill="#E8B53A" ${H}/>`,
  trapped: `<path d="M3 17a13 13 0 0 1 26 0z" fill="#A8B0BA"/><path d="M3 17a13 13 0 0 0 26 0z" fill="#8A94A6"/><path d="M6 17l2.400-4 2.400 4 2.400-4 2.400 4 2.400-4 2.400 4 2.400-4 2.400 4 2.400-4L26 17l-2.400 4-2.400-4-2.400 4-2.400-4-2.400 4-2.400-4-2.400 4-2.400-4-2.400 4z" fill="#EEF3F8" ${H}/>`,
  // warded (a pale blue shield of light), weakened (grey chevrons sinking)
  warded: `<path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#BFE9F8" opacity=".6"/><path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="none" stroke="#9FE0FF" stroke-width="2.600" ${H}/><path d="M11 10l4 2" fill="none" stroke="#FFFFFF" stroke-width="2" ${H}/>`,
  weakened: `<path d="M6 6l10 8 10-8M6 15l10 8 10-8" fill="none" stroke="${INK}" stroke-width="6.400" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l10 8 10-8M6 15l10 8 10-8" fill="none" stroke="#7E8794" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${H}/>`,
  // ---- round 13: helpful states (shown on the cards and in the pause panel with their own names: bestiary.js BUFFS)
  haste: `<path d="M4 10h9M2 16h11M4 22h9" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M4 10h9M2 16h11M4 22h9" fill="none" stroke="#FFF0A0" stroke-width="2" stroke-linecap="round" ${H}/><path d="M14 5l14 11-14 11 4-11z" fill="#E8D84A"/>`,
  might: `<path d="M16 2l4.400 4.400V20h-8.800V6.400z" fill="#E8EEF6"/><path d="M16 5v14" stroke="#FFFFFF" stroke-width="1.6" ${H}/><path d="M7 20h18v3.400H7z" fill="#E8B53A"/><path d="M14 23.400h4V30h-4z" fill="#8A5A30"/>`,
  ward: `<circle cx="16" cy="16" r="13" fill="#BFE9F8" opacity=".55"/><circle cx="16" cy="16" r="13" fill="none" stroke="#5DB7E0" stroke-width="2.2" ${H}/>
    <path d="M16 7l7 2.600v5c0 4.600-3 7.600-7 9-4-1.400-7-4.400-7-9v-5z" fill="#5B8CDB"/><path d="M11 10a14 14 0 0 1 4-1.4" fill="none" stroke="#FFFFFF" stroke-width="1.6" ${H}/>`,
  stance: `<path d="M16 3l10 3.600v9c0 6.400-4.600 10.400-10 12-5.400-1.600-10-5.600-10-12v-9z" fill="#8F97A3"/><path d="M16 7v17M10 12h12" fill="none" stroke="#D8DCE2" stroke-width="2.4" ${H}/><path d="M2 29h28" fill="none" stroke="${INK}" stroke-width="4"/><path d="M2 29h28" fill="none" stroke="#A99C8B" stroke-width="1.8" ${H}/>`,
  regen: `<circle cx="16" cy="16" r="12" fill="#7CC06F"/><path d="M16 9v14M9 16h14" fill="none" stroke="#FFFFFF" stroke-width="3.6" ${H}/><path d="M24 3c3 0 5 2 5 5-3 0-5-2-5-5z" fill="#A9D47A"/>`,
  lifesteal: `<path d="M16 3c4 7 9 11 9 17a9 9 0 0 1-18 0c0-6 5-10 9-17z" fill="#C8453D"/><path d="M16 25c-4-3-6-5-6-7.400a3 3 0 0 1 6-.6 3 3 0 0 1 6 .6c0 2.400-2 4.400-6 7.400z" fill="#FFB0A8" ${H}/>`,
  focus: `<path d="M3 16c4-6.400 8.400-9 13-9s9 2.600 13 9c-4 6.400-8.400 9-13 9s-9-2.600-13-9z" fill="#FFFFFF"/><circle cx="16" cy="16" r="5" fill="#E8B53A" ${H}/><circle cx="16" cy="16" r="2.200" fill="${INK}" ${H}/><path d="M16 1v4M16 27v4M1 16h3M28 16h3" fill="none" stroke="#FFE7A0" stroke-width="2"/>`,
  immune: `<path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#FFE07A"/><path d="M10 15.400l4.400 4.400L23 11" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M10 15.400l4.400 4.400L23 11" fill="none" stroke="#FFFFFF" stroke-width="2.400" stroke-linecap="round" ${H}/>`,
  hidden: `<path d="M2 26c3-8 8-12 14-12s11 4 14 12z" fill="#9C7650"/><path d="M8 22c2-3 5-5 8-5" fill="none" stroke="#C8A070" stroke-width="2" ${H}/><circle cx="9" cy="10" r="2" fill="#9C7650"/><circle cx="22" cy="7" r="2.400" fill="#9C7650"/>`,
  form: `<ellipse cx="16" cy="21" rx="7" ry="6" fill="#6E6A6A"/><circle cx="8" cy="13" r="3" fill="#6E6A6A"/><circle cx="13" cy="8" r="3" fill="#6E6A6A"/><circle cx="19" cy="8" r="3" fill="#6E6A6A"/><circle cx="24" cy="13" r="3" fill="#6E6A6A"/><path d="M14 19a3 3 0 0 1 4 0" fill="none" stroke="#A8A4A4" stroke-width="1.6" ${H}/>`,
};

// ---------------------------------------------------------------- ability glyphs (by ability id; a few shapes shared)
const G = {
  shield: STATUS.guard,
  sun: `<circle cx="16" cy="16" r="6.5" fill="#FFE07A"/><path d="M16 2v5M16 25v5M2 16h5M25 16h5M6 6l3.5 3.5M22.5 22.5L26 26M6 26l3.5-3.5M22.5 9.5L26 6" fill="none" stroke="#FFE07A" stroke-width="2.6"/>`,
  dash: `<path d="M4 12h10M2 17h12M5 22h9" fill="none" stroke="#E8E2D0" stroke-width="2.6"/><path d="M14 8l14 8-14 8 4-8z" fill="#E8E2D0"/>`,
  burst: `<path d="M16 2l3 8 8-3-4 8 7 4-8 2 2 9-8-5-8 5 2-9-8-2 7-4-4-8 8 3z" fill="#E0B070"/>`,
  arrows: `<path d="M5 27L24 8M10 28L27 12M4 22L20 5" fill="none" stroke="${INK}" stroke-width="5"/><path d="M5 27L24 8M10 28L27 12M4 22L20 5" fill="none" stroke="#D8C08A" stroke-width="2" ${H}/>
    <path d="M26 6l-6 1 5 5zM29 10l-6 1 5 5zM22 3l-6 1 5 5z" fill="#E8EEF6"/>`,
  snow: STATUS.chill,
  dagger: `<path d="M24 3l5 5-15 14-4-4z" fill="#E8EEF6"/><path d="M8 16l8 8M12 22l-6 6-3-3 6-6" fill="#8A5A30"/><path d="M24 6L13 17" stroke="#FFFFFF" stroke-width="1.4" ${H}/>`,
  flame: STATUS.burn,
  bolt: STATUS.shock,
  cloud: `<path d="M9 21a6 6 0 0 1 1-12 8 8 0 0 1 14 2 5 5 0 0 1 0 10z" fill="#B8C4D4"/><path d="M15 21l-3 6h4l-2 4" fill="none" stroke="#FFF27A" stroke-width="2.2"/>`,
  heart: `<path d="M16 28C6 21 3 16 3 11.5a6.5 6.5 0 0 1 13-1.5 6.5 6.5 0 0 1 13 1.5C29 16 26 21 16 28z" fill="#7CC06F"/><path d="M16 11v10M11 16h10" stroke="#FFFFFF" stroke-width="2.8" ${H}/>`,
  note: `<path d="M12 22V6l14-3v15" fill="none" stroke="${INK}" stroke-width="5"/><path d="M12 22V6l14-3v15" fill="none" stroke="#FFD27A" stroke-width="2" ${H}/><ellipse cx="9" cy="23" rx="4" ry="3.2" fill="#FFD27A"/><ellipse cx="23" cy="19" rx="4" ry="3.2" fill="#FFD27A"/>`,
  leaf: `<path d="M5 27C5 13 13 5 27 5c0 14-8 22-22 22z" fill="#7FA04A"/><path d="M6 26L22 10" fill="none" stroke="#C8E0A0" stroke-width="2" ${H}/>`,
  skull: TRINKET.howlingSkull.replace(/<path d="M28 9[^>]*\/>/, ''),
  vial: `<path d="M12 3h8v6l5 12a5 5 0 0 1-4.5 7h-9A5 5 0 0 1 7 21l5-12z" fill="#E9F1F4"/><path d="M9.4 19h13.2l1 2.6a2.6 2.6 0 0 1-2.4 3.4H10.8a2.6 2.6 0 0 1-2.4-3.4z" fill="#9BCB3C" ${H}/>`,
  swirl: `<path d="M16 4a12 12 0 1 1-11 7" fill="none" stroke="${INK}" stroke-width="6"/><path d="M16 4a12 12 0 1 1-11 7" fill="none" stroke="#E8EEF6" stroke-width="2.6" ${H}/><path d="M2 8l4 6 4-5z" fill="#E8EEF6"/><circle cx="16" cy="16" r="3" fill="#E8EEF6"/>`,
  hook: TRINKET.hookChain,
  fist: STATUS.rage,
  up: `<path d="M16 3l11 11h-7v6h-8v-6H5z" fill="#E8B53A"/><ellipse cx="16" cy="26" rx="10" ry="3" fill="#B07A45"/>`,
  paw: `<ellipse cx="16" cy="21" rx="7" ry="6" fill="#A0683A"/><circle cx="8" cy="13" r="3" fill="#A0683A"/><circle cx="13" cy="8" r="3" fill="#A0683A"/><circle cx="19" cy="8" r="3" fill="#A0683A"/><circle cx="24" cy="13" r="3" fill="#A0683A"/>`,
  drain: `<path d="M16 3c4 7 9 11 9 17a9 9 0 0 1-18 0c0-6 5-10 9-17z" fill="#C8553D"/><path d="M11 20a5 5 0 0 0 4 5" fill="none" stroke="#F7B3A3" stroke-width="2.2" ${H}/>`,
  wall: `<path d="M4 10h24v18H4z" fill="#9FDDF6"/><path d="M4 16h24M4 22h24M12 10v6M20 16v6M12 22v6" fill="none" stroke="#5FA8D0" stroke-width="1.8" ${H}/>`,
  sleep: STATUS.sleep,
  vines: STATUS.root,
  wave: `<path d="M3 20c4-6 8-6 12 0s8 6 14 0" fill="none" stroke="${INK}" stroke-width="7"/><path d="M3 20c4-6 8-6 12 0s8 6 14 0" fill="none" stroke="#E0B070" stroke-width="3.4" ${H}/><path d="M6 11h20" fill="none" stroke="#E0B070" stroke-width="2.4"/>`,
  // round 15 (lane N): the six newer heroes
  clock: `<circle cx="16" cy="17" r="11.500" fill="#F6E3A6"/><circle cx="16" cy="17" r="8" fill="#FFFBEA" ${H}/><path d="M16 11v6l4.500 3" fill="none" stroke="${INK}" stroke-width="2.600" stroke-linecap="round"/><path d="M13 3h6" fill="none" stroke="#DEAF59" stroke-width="3"/>`,
  chain: `<ellipse cx="9" cy="9" rx="5.500" ry="4" transform="rotate(45 9 9)" fill="none" stroke="${INK}" stroke-width="6.500"/><ellipse cx="9" cy="9" rx="5.500" ry="4" transform="rotate(45 9 9)" fill="none" stroke="#C9D2DE" stroke-width="2.800" ${H}/>
    <ellipse cx="16" cy="16" rx="5.500" ry="4" transform="rotate(-45 16 16)" fill="none" stroke="${INK}" stroke-width="6.500"/><ellipse cx="16" cy="16" rx="5.500" ry="4" transform="rotate(-45 16 16)" fill="none" stroke="#8A94A6" stroke-width="2.800" ${H}/>
    <ellipse cx="23" cy="23" rx="5.500" ry="4" transform="rotate(45 23 23)" fill="none" stroke="${INK}" stroke-width="6.500"/><ellipse cx="23" cy="23" rx="5.500" ry="4" transform="rotate(45 23 23)" fill="none" stroke="#C9D2DE" stroke-width="2.800" ${H}/>`,
  null: `<circle cx="16" cy="16" r="11" fill="none" stroke="${INK}" stroke-width="7.500"/><circle cx="16" cy="16" r="11" fill="none" stroke="#C9D2DE" stroke-width="3.400" ${H}/><path d="M8 24L24 8" fill="none" stroke="${INK}" stroke-width="7.500" stroke-linecap="round"/><path d="M8 24L24 8" fill="none" stroke="#C9D2DE" stroke-width="3.400" stroke-linecap="round" ${H}/>`,
  rock: `<path d="M6 20l3-10 8-5 9 4 2 10-6 8H10z" fill="#A99C8B"/><path d="M9 10l8-5 3 7-7 4z" fill="#E9DDC2" ${H}/><path d="M3 6l3 2M26 3l-2 3M29 24l-3-1" fill="none" stroke="#B58CFF" stroke-width="2.400" stroke-linecap="round"/>`,
  spike: `<path d="M3 28l5-15 4 9 4-19 4 19 4-9 5 15z" fill="#A99C8B"/><path d="M16 3l-2 12 2 6z" fill="#E9DDC2" ${H}/><path d="M8 13l-1 8 2 4z" fill="#E9DDC2" ${H}/>`,
  // round 13 (lane S): the Enchantress
  kiss: `<path d="M16 28C6 21 3 16 3 11.5a6.5 6.5 0 0 1 13-1.5 6.5 6.5 0 0 1 13 1.5C29 16 26 21 16 28z" fill="#FF8AC8"/><path d="M10 15c2 2 4 2 6 0 2 2 4 2 6 0-2 3.6-10 3.6-12 0z" fill="#C8306E" ${H}/><path d="M8 10a4 4 0 0 1 4-3" fill="none" stroke="#FFE0F0" stroke-width="2" ${H}/>`,
  string: `<path d="M4 26C10 20 8 10 16 10s6 10 12 4" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M4 26C10 20 8 10 16 10s6 10 12 4" fill="none" stroke="#FF8AC8" stroke-width="2.2" stroke-linecap="round" ${H}/>
    <path d="M24 9c-2.400-3.400 1-6 3-3.600 2-2.400 5.400.2 3 3.600l-3 3z" fill="#FF5AAE"/>`,
  heartbreak: `<path d="M15 28C6 21 3 16 3 11.5a6.5 6.5 0 0 1 12-3.400L12 15l4 3-2 6z" fill="#FF5AAE"/><path d="M18 27l2-5-4-4 3-5-2-4.600A6.5 6.5 0 0 1 29 11.5C29 16 26 21 18 27z" fill="#FF8AC8"/>`,
};
const ABILITY_GLYPH = {
  shieldBash: 'shield', guard: 'shield', consecrate: 'sun', holdTheLine: 'shield', charge: 'dash', groundPound: 'wave',
  barrage: 'arrows', frostArrow: 'snow', roll: 'dash', backstab: 'dagger', dash: 'dash', fanOfKnives: 'dagger',
  rage: 'fist', leap: 'up', cleave: 'swirl', shockwave: 'wave', whirl: 'swirl', unstoppable: 'shield',
  reap: 'swirl', hook: 'hook', oldBones: 'skull', fireball: 'flame', flameWall: 'flame', inferno: 'flame',
  iceShard: 'snow', frostNova: 'snow', iceWall: 'wall', chainLightning: 'bolt', thunderclap: 'bolt', stormCloud: 'bolt',
  mend: 'heart', sanctuary: 'sun', smite: 'sun', warSong: 'note', lullaby: 'sleep', encore: 'note',
  entangle: 'vines', rejuvenate: 'leaf', callWolf: 'paw', raiseDead: 'skull', lifeDrain: 'drain', boneSpear: 'skull',
  miasma: 'vial', cure: 'heart', leeches: 'cloud',
};
// A colour per ability glyph for its ring in the HUD.
export const ABILITY_COLOR = { shield: '#5B8CDB', sun: '#F2C84A', dash: '#C8C0B0', burst: '#E0B070', arrows: '#D8C08A', snow: '#7FD6F5',
  dagger: '#B8C4D4', flame: '#FF7A2F', bolt: '#F2E04A', cloud: '#9AA8BC', heart: '#7CC06F', note: '#FFD27A', leaf: '#7FA04A',
  skull: '#D9D2C0', vial: '#9BCB3C', swirl: '#D8DEE8', hook: '#A8A8B0', fist: '#E0604B', up: '#E8B53A', paw: '#A0683A',
  drain: '#C8553D', wall: '#9FDDF6', sleep: '#C9B8FF', vines: '#7FA04A', wave: '#E0B070', kiss: '#FF8AC8', string: '#FF8AC8', heartbreak: '#FF5AAE',
  clock: '#DEAF59', chain: '#A9B4C6', null: '#C9D2DE', rock: '#B58CFF', spike: '#A99C8B' }; // (round 15, lane N: the last five)
export const abilityGlyph = (id) => ABILITY_GLYPH[id] || GLYPH2[id] || 'burst';

// ---------------------------------------------------------------- the one entry point
const gemFallback = (color = '#9B7BD6') => `<path d="M16 3l11 9-11 17L5 12z" fill="${color}"/><path d="M16 3l11 9H5z" fill="#FFFFFF" opacity=".45" ${H}/>`;
export function icon(kind, id, cls = '', color) {
  let inner;
  if (kind === 'trinket') inner = TRINKET[id] || gemFallback(color);
  else if (kind === 'potion') inner = POTION[id] || POTION.heal;
  else if (kind === 'status') inner = STATUS[id] || STATUS.buff;
  else if (kind === 'ability') inner = G[abilityGlyph(id)] || G.burst;
  else inner = gemFallback(color);
  return wrap(tidy(inner), cls);
}
export const hasIcon = (kind, id) => !!({ trinket: TRINKET, potion: POTION, status: STATUS }[kind] || {})[id];
export const TRINKET_ICON_IDS = Object.keys(TRINKET);
export const STATUS_ICON_IDS = Object.keys(STATUS);
export const POTION_ICON_IDS = Object.keys(POTION);

// ---------------------------------------------------------------- stat icons (round 14, lane U)
// The designer: "I want every stat to have a readable icon so u can see sword + a number for damage for example."
// Every stat icon in the game comes through statIcon(id): one place to drop the picked icon style into (the designer is
// choosing between the three in design/icons-r14). Until then a plain, clear set in the look of the icons above.
const LINE = (d, col, w = 3.2) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3.4}"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
const STAT = {
  hp: `<path d="M16 28S4 20 4 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12 3.5C28 20 16 28 16 28z" fill="#E8604C"/><path d="M8.2 10.2c-1.300.8-2 2-2 3.600" fill="none" stroke="#FFD2C8" stroke-width="2"/>`,
  armor: `<path d="M16 3l11 4v8c0 7-4.600 11.600-11 14C9.600 26.600 5 22 5 15V7z" fill="#8FA3C4"/><path d="M16 4.600v22.600C10.600 25 6.500 21 6.500 15V8z" fill="#C3D0E6" ${H}/>`,
  speed: `<path d="M12 4h8v11l7 3.500c1.600.8 2.500 2 2.500 3.500V27H12z" fill="#C89A5A"/><path d="M12 22.500h17.500V27H12z" fill="#7A5230" ${H}/>${LINE('M2.500 9h5M1.500 15.500h6M2.500 22h5', '#F2E8D2', 2.200)}`,
  dmg: `<path d="M28.500 3.500l-1.500 7-11 11-5.500-5.500 11-11z" fill="#DDE4EE"/><path d="M6.500 14l11.500 11.500-3 3L3.500 17z" fill="#D9A441"/><path d="M8.500 21l2.500 2.500-5.500 5.500-2.500-2.500z" fill="#8A5A30"/>`,
  aps: LINE('M5 6l9.500 10L5 26M16.500 6L26 16l-9.500 10', '#FFD45A'),
  range: LINE('M4 7v18M28 7v18M9 16h14M13 11.500L8.500 16l4.500 4.500M19 11.500l4.500 4.500-4.500 4.500', '#9FDDF6', 2.600),
  cd: `<path d="M7.500 3.500h17v4.500l-6 8 6 8v4.500h-17V24l6-8-6-8z" fill="#F2E8D2"/><path d="M11 25.500l5-5.500 5 5.500z" fill="#E6A935" ${H}/><path d="M12.500 8.500h7L16 13z" fill="#E6A935" ${H}/>`,
  heal: `<path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8z" fill="#5CC45A"/><path d="M13.500 6h2.500v7.500H6.500V13.500h7z" fill="#A8EBA0" ${H}/>`,
  potency: `<path d="M16 3c5 7 9 11 9 16a9 9 0 0 1-18 0c0-5 4-9 9-16z" fill="#B58CFF"/><path d="M11.500 18c0 2.600 1.500 4.500 3.800 5" fill="none" stroke="#E6D8FF" stroke-width="2"/>`,
  haste: `<path d="M18.500 2L6 18h8l-2.500 12L26 13h-8.500z" fill="#4FD8C8"/>`,
  kills: `<path d="M5 14a11 11 0 0 1 22 0v5.500l-3 2V27H8v-5.500l-3-2z" fill="#E8E2D0"/><circle cx="11.500" cy="15.500" r="2.800" fill="${INK}" ${H}/><circle cx="20.500" cy="15.500" r="2.800" fill="${INK}" ${H}/><path d="M13 27v-3M16 27v-3M19 27v-3" fill="none" stroke-width="1.800"/>`,
  runs: `${LINE('M8 29V4', '#C89A5A', 2.600)}<path d="M9.500 5h16.500l-4 5.500 4 5.500H9.500z" fill="#E8604C"/>`,
  taken: `<path d="M16 2l3.300 7.700 8.200-2.700-3.700 7.800 5.700 5-7.800 2 .8 8.700-6.500-5.300-6.500 5.300.8-8.700-7.800-2 5.700-5-3.700-7.800 8.200 2.700z" fill="#FF8A6E"/>`,
  blocked: `<path d="M16 3l11 4v8c0 7-4.600 11.600-11 14C9.600 26.600 5 22 5 15V7z" fill="#7FB8E8"/><path d="M10.500 15.500l4 4 7.500-8" fill="none" stroke="#FFFFFF" stroke-width="3"/>`,
  downs: `<path d="M11 3h10v13h7L16 29 4 16h7z" fill="#9BA2C0"/>`,
  revives: `<path d="M11 29h10V16h7L16 3 4 16h7z" fill="#7CE0A0"/>`,
  best: `<path d="M16 2.500l4.200 8.500 9.300 1.400-6.700 6.600 1.600 9.300L16 23.900l-8.400 4.400 1.600-9.300L2.500 12.400l9.300-1.400z" fill="#F5B841"/>`,
  xp: `<path d="M16 2.500L28 16 16 29.500 4 16z" fill="#8C7CFF"/><path d="M16 6.500L8 16h8z" fill="#C9C0FF" ${H}/>`,
  gold: `<circle cx="16" cy="16" r="12" fill="#FFCB4A"/><circle cx="16" cy="16" r="7" fill="#F0A92E" stroke-width="2"/>`,
  found: `<path d="M16 29.500s9.500-9.500 9.500-16.500a9.500 9.500 0 0 0-19 0c0 7 9.500 16.500 9.500 16.500z" fill="#E8604C"/><circle cx="16" cy="13" r="3.600" fill="#F4EDE0" ${H}/>`,
  elite: `<path d="M16 3l3.600 9.400L29 16l-9.400 3.600L16 29l-3.600-9.400L3 16l9.400-3.600z" fill="#FFE6A0"/>`,
  major: `<path d="M4 9.500l6.500 6L16 5.500l5.500 10 6.500-6-2.500 16.500h-19z" fill="#F5B841"/><path d="M8 22h16" fill="none" stroke-width="1.800"/>`,
  tier: `<path d="M16 3l11 6.500v13L16 29 5 22.500v-13z" fill="#F5B841"/><path d="M16 9.500l5 3v6.500l-5 3-5-3v-6.500z" fill="#FFE6A0" stroke-width="1.800"/>`,
  fill: `<path d="M5 12h22v9H5z" fill="#3A2F3E"/><path d="M6.500 13.500h13v6h-13z" fill="#F5B841" ${H}/>`,
  decay: `<path d="M5 12h22v9H5z" fill="#3A2F3E"/><path d="M6.500 13.500h6v6h-6z" fill="#9BA2C0" ${H}/>${LINE('M24 5l-5 5M19 5.500V10h4.500', '#9BA2C0', 2)}`,
  time: `<circle cx="16" cy="17" r="11" fill="#F2E8D2"/><path d="M16 10.500V17l4.500 3" fill="none" stroke-width="2.600"/><path d="M13 3h6" fill="none"/>`,
  bag: `<path d="M10 9h12l5 15a4 4 0 0 1-4 5H9a4 4 0 0 1-4-5z" fill="#C89A5A"/><path d="M11 4h10l-1.500 5h-7z" fill="#A7774A"/><path d="M9.500 9h13" fill="none" stroke="#F2E8D2" stroke-width="2"/>`,
  floor: `<path d="M4 25h8v-6h8v-6h8" fill="none" stroke="${INK}" stroke-width="7"/><path d="M4 25h8v-6h8v-6h8" fill="none" stroke="#C3D0E6" stroke-width="3.200"/>`,
};
export const STAT_ICON_IDS = Object.keys(STAT);
export function statIcon(id, cls = '') { return wrap(tidy(STAT[id] || STAT.best), 'stat ' + cls); }
