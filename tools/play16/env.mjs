// The node stand-ins the game's modules expect (as tools/runs.mjs sets them). Import this first.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
