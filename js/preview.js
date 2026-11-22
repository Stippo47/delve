// The Book's preview player (round 13, lane K): plays one stage of js/preview-sim.js live in a small canvas on the
// page, the way the Riffle showcase clips looked, but simulated.
//   const p = makePlayer(canvas, { onLoop, onFrame }); p.play(spec); p.stop();
// Only one player plays at a time (playing one stops any other). It pauses itself when its canvas is off screen, the
// page is hidden, or stop() is called (the Book closing), and starts again where it was.
// What it costs: one world of a handful of units stepped at the screen's rate (capped at 60 a second), drawn by
// render.js into a canvas the size of the stage on the page with the pixel ratio capped at 2. Its room is built once
// per loop and its floor is cached (render.js keeps one floor picture, keyed by the world; the stage keeps its world's
// size so the cache key holds), and sprites are asked for at one size per stage (the scale never changes while one
// plays). Nothing runs when nothing is showing.
// render.js keeps its camera in one module-level object (view), shared with the run: the player saves it before each
// frame and puts it back after, so a run or battle underneath never sees the preview's camera.
// The run's dice and sounds: each frame runs inside numbers.js quietly() with the preview's own seed swapped in and
// out, so the run's random numbers are untouched and the preview makes no sound.
import { layout, draw, view } from './render.js';
import { makeStage } from './preview-sim.js';
import { quietly } from './numbers.js';
import { getSeed, setSeed } from './util.js';

const DPR_CAP = 2;
let playing = null; // the one player running

export function makePlayer(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let stage = null, spec = null, raf = 0, last = 0, seed = 0x5eed, visible = true, stopped = true, err = null, lastLoopT = 0;
  const cam = { camX: null, camY: null }; // the preview's own camera
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); kick(); }, { threshold: 0.05 }) : null;
  if (io) io.observe(canvas);
  const onVis = () => kick();
  document.addEventListener('visibilitychange', onVis);

  function withView(fn) {
    const saved = { ...view, m: view.m.slice() };
    try {
      Object.assign(view, cam); view.dprCap = DPR_CAP; view.manualT = 0; view.snap = true;
      return fn();
    } finally {
      cam.camX = view.camX; cam.camY = view.camY;
      for (const k of Object.keys(view)) if (!(k in saved)) delete view[k];
      Object.assign(view, saved);
    }
  }
  // the zoom that fits the stage's room (plus a little of its walls) into the canvas
  function fit() {
    const [W, H] = stage.size, cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1;
    view.zoom = 1; layout(canvas, stage.w, 0, 0, 0);
    const s = Math.min(cw / (W + 24), ch / (H + 24));
    view.zoom = s / view.base;
    layout(canvas, stage.w, 0, 0, 0);
  }
  function frame(now) {
    raf = 0;
    if (!running()) return;
    const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)); last = now;
    try {
      quietly(() => {
        setSeed(seed);
        const t0 = stage.t;
        stage.step(dt);
        if (stage.t < t0 && opts.onLoop) opts.onLoop(stage);
        seed = getSeed();
        withView(() => { fit(); draw(ctx, stage.w); });
      });
      if (opts.onFrame) opts.onFrame(stage);
    } catch (e) { err = e; console.error('preview', spec, e); stopped = true; if (opts.onError) opts.onError(e); return; }
    raf = requestAnimationFrame(frame);
  }
  const running = () => !stopped && visible && !document.hidden && stage && playing === api;
  function kick() { if (running() && !raf) { last = 0; raf = requestAnimationFrame(frame); } }

  const api = {
    play(s) {
      if (playing && playing !== api) playing.stop();
      playing = api; spec = s; err = null; stopped = false;
      try { quietly(() => { setSeed(seed); stage = makeStage(s); seed = getSeed(); }); } catch (e) { err = e; stage = null; console.error('preview', s, e); if (opts.onError) opts.onError(e); return null; }
      cam.camX = cam.camY = null; lastLoopT = 0;
      kick();
      return stage;
    },
    stop() { stopped = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
    resume() { if (stage) { stopped = false; playing = api; kick(); } },
    restart() { if (stage) { quietly(() => { setSeed(seed); stage.reset(); seed = getSeed(); }); } },
    destroy() { api.stop(); if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis); if (playing === api) playing = null; stage = null; },
    get stage() { return stage; },
    get spec() { return spec; },
    get error() { return err; },
    // for the test tools: step a fixed time without the clock (shots of a preview mid-play)
    advance(secs, dt = 1 / 30) {
      if (!stage) return;
      quietly(() => { setSeed(seed); for (let t = 0; t < secs; t += dt) stage.step(dt); seed = getSeed(); withView(() => { fit(); draw(ctx, stage.w); }); });
    },
  };
  void lastLoopT;
  return api;
}
export const stopAll = () => { if (playing) playing.stop(); };
