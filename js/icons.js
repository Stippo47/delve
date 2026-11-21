// Little sprites for the UI: every trinket, potion, status and ability gets one. Same look as the game's art: flat
// colour, a soft highlight, a heavy ink outline. Each is the inside of a 32x32 SVG; icon(id) wraps it.
//   icon(kind, id, cls)   kind: 'trinket' | 'potion' | 'status' | 'ability'  -> '<svg ...>' markup
// Anything without a drawing falls back to a gem in the item's colour, so new trinkets still show.
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
  // cursed builds (a purple skull-drop), hexed is the armed curse (an eye in a ring)
  curse: `<path d="M16 3c6 0 10 4.4 10 10 0 4-2 6.4-4 7.6V26h-12v-5.4C8 19.4 6 17 6 13 6 7.4 10 3 16 3z" fill="#9A5CC8"/><circle cx="12.2" cy="13.5" r="2.6" fill="${INK}" ${H}/><circle cx="19.8" cy="13.5" r="2.6" fill="${INK}" ${H}/><path d="M13 22v3M16 22v3M19 22v3" stroke="${INK}" stroke-width="1.6" ${H}/>`,
  hexed: `<circle cx="16" cy="16" r="12" fill="none" stroke="${INK}" stroke-width="5.4"/><circle cx="16" cy="16" r="12" fill="none" stroke="#9A5CC8" stroke-width="2.6" ${H}/>
    <path d="M6 16c3-5 6.4-7 10-7s7 2 10 7c-3 5-6.4 7-10 7s-7-2-10-7z" fill="#E6D2F6"/><circle cx="16" cy="16" r="3.6" fill="#5A2A80" ${H}/>`,
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
  drain: '#C8553D', wall: '#9FDDF6', sleep: '#C9B8FF', vines: '#7FA04A', wave: '#E0B070' };
export const abilityGlyph = (id) => ABILITY_GLYPH[id] || 'burst';

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
