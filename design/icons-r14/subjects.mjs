// The sample's subjects: the same ones in every style, so the styles compare like for like.
export const ROLE_COL = { tank: '#5B8CDB', melee: '#D0664E', skirmish: '#7DB046', ranged: '#4FA37A', caster: '#9B7BD6', support: '#E6A935' }; // js/ui-kit.js
export const RARITY_COL = { common: '#8F97A3', rare: '#3E8FC7', epic: '#9B5BC9', legendary: '#D9822B' }; // js/progress.js
// docs/FX-STYLE.md, the palette per element: [dark, main, light]
export const ELEMENT = {
  steel: ['#5E6678', '#8A94A6', '#EEF3F8'], holy: ['#9A6E1E', '#E2A93A', '#FFE7A0'], frost: ['#235E8C', '#4A9CC8', '#DDF6FF'],
  storm: ['#2E3A6E', '#5B6C9A', '#FFF7C2'], nature: ['#24552A', '#4E8A3A', '#A9D47A'], shadow: ['#2E2440', '#5A4A7A', '#9B86C9'],
  necrotic: ['#35275E', '#6A4FA8', '#D9C8FF'], blood: ['#5E1E30', '#B03A38', '#FF8A7A'], fire: ['#8A2A14', '#E0602A', '#FFC85A'],
  earth: ['#4E4034', '#8A7660', '#E9DDC2'],
};
export const ABILITIES = [
  { id: 'shieldBash', name: 'Shield Bash', hero: 'Paladin', role: 'tank', element: 'holy', today: 'shield', shares: 10 },
  { id: 'barrage', name: 'Barrage', hero: 'Archer', role: 'ranged', element: 'nature', today: 'arrows', shares: 4 },
  { id: 'frostArrow', name: 'Frost Arrow', hero: 'Archer', role: 'ranged', element: 'frost', today: 'snow', shares: 3 },
  { id: 'roll', name: 'Roll', hero: 'Archer', role: 'ranged', element: 'earth', today: 'dash', shares: 9 },
  { id: 'whirl', name: 'Whirl', hero: 'Berserker', role: 'melee', element: 'blood', today: 'swirl', shares: 8 },
  { id: 'chainLightning', name: 'Chain Lightning', hero: 'Storm Mage', role: 'caster', element: 'storm', today: 'bolt', shares: 6 },
  { id: 'sanctuary', name: 'Sanctuary', hero: 'Cleric', role: 'support', element: 'holy', today: 'sun', shares: 9 },
  { id: 'raiseDead', name: 'Raise Dead', hero: 'Necromancer', role: 'caster', element: 'necrotic', today: 'skull', shares: 7 },
  { id: 'backstab', name: 'Backstab', hero: 'Twinfang', role: 'skirmish', element: 'shadow', today: 'dagger', shares: 7 },
  { id: 'callWolf', name: 'Call Wolf', hero: 'Druid', role: 'support', element: 'nature', today: 'paw', shares: 2 },
];
export const TRINKETS = [
  { id: 'vampTooth', name: 'Vampire Tooth', rarity: 'common', element: 'blood' },
  { id: 'hookChain', name: 'Hook and Chain', rarity: 'rare', element: 'steel' },
  { id: 'whirlingKnives', name: 'Whirling Knives', rarity: 'epic', element: 'steel' },
  { id: 'phoenixFeather', name: 'Phoenix Feather', rarity: 'legendary', element: 'fire' },
];
export const STATS = [
  { id: 'dmg', name: 'Damage', col: '#FF8A6E', val: '24' },
  { id: 'hp', name: 'Health', col: '#F0606A', val: '180' },
  { id: 'armor', name: 'Armour', col: '#6FA3F0', val: '6' },
  { id: 'atkSpeed', name: 'Attack speed', col: '#FFD23A', val: '1.4/s' },
  { id: 'moveSpeed', name: 'Move speed', col: '#5FD0B8', val: '92' },
  { id: 'range', name: 'Range', col: '#C9A8F0', val: '240' },
];
export const ALL = [...ABILITIES.map((a) => ({ ...a, kind: 'ability' })), ...TRINKETS.map((t) => ({ ...t, kind: 'trinket' })), ...STATS.map((s) => ({ ...s, kind: 'stat' }))];
