// engine.js — game loop, canvas scaling, shared HUD (score, pause, back-to-menu, fx, sfx).

import { createFx } from './fx.js';
import { sfx } from './audio.js';

const LOGICAL_W = 320;
const LOGICAL_H = 480;

export function createEngine({ canvas, input, onExit, gameId }) {
  const ctx = canvas.getContext('2d');
  canvas.width = LOGICAL_W;
  canvas.height = LOGICAL_H;
  const fx = createFx();

  const storageKey = `arcade-highscore-${gameId}`;
  let highScore = Number(localStorage.getItem(storageKey)) || 0;

  function resize() {
    const scale = Math.min(
      window.innerWidth / LOGICAL_W,
      (window.innerHeight - 140) / LOGICAL_H // leave room for touch controls
    );
    canvas.style.width = `${LOGICAL_W * scale}px`;
    canvas.style.height = `${LOGICAL_H * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  let score = 0;
  let paused = false;
  let over = false;
  let game = null;
  let rafId = null;
  let last = 0;

  const hud = document.getElementById('hud-score');
  const hudBest = document.getElementById('hud-best');
  const overlay = document.getElementById('hud-overlay');

  function setScore(v) {
    score = v;
    if (hud) hud.textContent = `SCORE ${score}`;
  }

  function setHighScore(v) {
    highScore = v;
    if (hudBest) hudBest.textContent = `BEST ${highScore}`;
  }
  setHighScore(highScore);

  function gameOver(finalMessage = 'GAME OVER') {
    over = true;
    sfx.gameOver();
    const isNewHigh = score > highScore;
    if (isNewHigh) {
      setHighScore(score);
      localStorage.setItem(storageKey, String(highScore));
    }
    if (overlay) {
      const highLine = isNewHigh ? 'NEW HIGH SCORE!' : `BEST ${highScore}`;
      overlay.textContent = `${finalMessage}\nSCORE ${score}\n${highLine}\nPress A to restart`;
      overlay.style.display = 'block';
    }
  }

  function restart() {
    over = false;
    paused = false;
    setScore(0);
    fx.clear();
    if (overlay) overlay.style.display = 'none';
    game = engineApi._initFn(ctx, input, engineApi);
  }

  // Pause: hold A+B together. Restart: press A while game-over.
  input.onPress('A', () => {
    if (over) restart();
  });

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (overlay) {
      overlay.style.display = paused ? 'block' : 'none';
      overlay.textContent = 'PAUSED';
    }
  }
  input.onPress('B', () => {
    if (input.isDown('A')) togglePause();
  });

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min((ts - last) / 1000, 0.05) || 0;
    last = ts;
    if (paused || !game) return;
    if (!over) game.update(dt);
    fx.update(dt);

    const shakeOffset = fx.getShakeOffset();
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);
    game.render(ctx);
    fx.render(ctx);
    ctx.restore();
  }

  function stop() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  }

  const engineApi = {
    ctx,
    width: LOGICAL_W,
    height: LOGICAL_H,
    setScore,
    addScore: (n) => setScore(score + n),
    getScore: () => score,
    gameOver,
    stop,
    burst: (x, y, color, count, opts) => fx.burst(x, y, color, count, opts),
    shake: (magnitude, duration) => fx.shake(magnitude, duration),
    sfx,
    _initFn: null,
  };

  function start(initFn) {
    engineApi._initFn = initFn;
    setScore(0);
    fx.clear();
    game = initFn(ctx, input, engineApi);
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  return { start, stop, api: engineApi };
}
