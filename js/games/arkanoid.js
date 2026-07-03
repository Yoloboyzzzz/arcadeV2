// arkanoid.js — fuller Breakout: levels, brick types, power-ups, lives, multi-ball, paddle gun.
// Ported from the standalone /arkanoid prototype's default settings & level layouts, but
// driven by this arcade's shared input/engine/audio modules instead of its own DOM+Tone.js app.
//
// LEFT/RIGHT move the paddle (only horizontal axis in this game), so the extra buttons
// double up as actions: A / UP launch the ball, B / DOWN fire the paddle gun power-up.

const PADDLE_W_DEFAULT = 56, PADDLE_H = 10;
const BALL_R = 5;
const PADDLE_SPEED = 260;
const BALL_BASE_SPEED = 200;
const COLS = 9;
const BRICK_H = 14, BRICK_TOP = 36;
const LEVEL_SPEED_INCREMENT = 0.12;
const EXTRA_LIFE_SCORE_STEP = 250;

const BRICK_TYPES = {
  1: { maxHits: 1, score: 10, color: '#0ff' },
  2: { maxHits: 2, score: 15, color: '#f80', hitColor: '#ff0' },
  3: { maxHits: Infinity, score: 0, color: '#555' },
};

// Same 15 layouts as the original prototype (9 columns; 0 empty, 1 normal, 2 strong, 3 indestructible).
const LEVEL_LAYOUTS = [
  [[0,1,1,1,1,1,1,1,0],[1,1,2,1,2,1,2,1,1],[1,2,1,1,1,1,1,2,1],[0,1,1,1,1,1,1,1,0]],
  [[3,1,1,1,1,1,1,1,3],[1,2,2,2,2,2,2,2,1],[1,2,0,0,0,0,0,2,1],[1,2,2,3,3,3,2,2,1],[0,1,1,1,1,1,1,1,0]],
  [[2,2,2,2,2,2,2,2,2],[2,1,1,1,1,1,1,1,2],[2,1,3,0,3,0,3,1,2],[2,1,1,1,1,1,1,1,2],[2,2,2,2,2,2,2,2,2]],
  [[0,0,1,1,3,1,1,0,0],[0,1,2,1,3,1,2,1,0],[1,2,1,2,3,2,1,2,1],[0,1,2,1,0,1,2,1,0],[0,0,1,1,1,1,1,0,0]],
  [[3,3,3,3,3,3,3,3,3],[3,1,2,1,2,1,2,1,3],[3,2,1,2,1,2,1,2,3],[3,1,2,1,2,1,2,1,3],[3,3,3,3,3,3,3,3,3]],
  [[1,1,1,1,1,1,1,1,1],[1,0,2,0,2,0,2,0,1],[1,2,0,2,0,2,0,2,1],[1,0,2,0,2,0,2,0,1],[1,1,1,1,1,1,1,1,1]],
  [[0,0,0,0,1,0,0,0,0],[0,0,0,1,2,1,0,0,0],[0,0,1,2,3,2,1,0,0],[0,1,2,3,1,3,2,1,0],[1,2,3,1,2,1,3,2,1]],
  [[1,3,1,3,1,3,1,3,1],[3,2,3,2,3,2,3,2,3],[1,3,1,3,1,3,1,3,1],[3,2,3,2,3,2,3,2,3],[1,3,1,3,1,3,1,3,1]],
  [[2,2,2,2,2,2,2,2,2],[2,0,0,0,0,0,0,0,2],[2,0,1,1,1,1,1,0,2],[2,0,0,0,0,0,0,0,2],[2,2,2,2,2,2,2,2,2]],
  [[1,1,1,1,1,1,1,1,1],[2,2,2,2,2,2,2,2,2],[3,3,3,3,3,3,3,3,3],[2,2,2,2,2,2,2,2,2],[1,1,1,1,1,1,1,1,1]],
  [[0,1,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0],[1,0,0,0,3,0,0,0,1],[0,1,0,0,0,0,0,1,0],[0,0,1,1,1,1,1,0,0]],
  [[0,0,0,0,1,0,0,0,0],[0,0,0,2,0,2,0,0,0],[0,0,1,0,3,0,1,0,0],[0,2,0,0,0,0,0,2,0],[1,0,0,0,0,0,0,0,1]],
  [[0,0,1,0,3,0,1,0,0],[0,0,1,0,2,0,1,0,0],[1,1,3,2,1,2,3,1,1],[0,0,1,0,2,0,1,0,0],[0,0,1,0,3,0,1,0,0]],
  [[0,2,0,0,2,0,0,2,0],[1,0,1,0,1,0,1,0,1],[0,0,2,0,2,0,2,0,0],[1,0,1,0,1,0,1,0,1],[0,2,0,0,2,0,0,2,0]],
  [[3,1,2,1,3,1,2,1,3],[1,2,1,2,1,2,1,2,1],[2,1,3,1,2,1,3,1,2],[1,2,1,2,1,2,1,2,1],[3,1,2,1,3,1,2,1,3]],
];

const POWERUP_META = {
  slow: { name: 'SLOW BALL', color: '#08f', symbol: 'S', duration: 10 },
  fast: { name: 'FAST BALL', color: '#f42', symbol: 'F', duration: 10 },
  gun: { name: 'PADDLE GUN', color: '#f84', symbol: 'G', duration: 15 },
  wide: { name: 'WIDE PADDLE', color: '#fd0', symbol: 'E', duration: 12 },
  narrow: { name: 'NARROW PADDLE', color: '#a0f', symbol: 's', duration: 10 },
};
const POWERUP_IDS = Object.keys(POWERUP_META);

function dropInfo(id) {
  if (id === 'multi') return { color: '#0f8', symbol: 'M' };
  if (id === 'life') return { color: '#f0a', symbol: '+' };
  return POWERUP_META[id];
}

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const BRICK_W = W / COLS;

  let level = 1;
  let lives = 3;
  let nextLifeScore = EXTRA_LIFE_SCORE_STEP;
  let speedMult = 1;
  let gunAmmo = 0;

  const paddle = { x: W / 2 - PADDLE_W_DEFAULT / 2, y: H - 24, w: PADDLE_W_DEFAULT };
  let balls = [];
  let bricks = [];
  let drops = [];
  let bullets = [];
  let activePowerUps = [];

  function clampPaddle() {
    paddle.w = Math.max(30, Math.min(W - 4, paddle.w));
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
  }

  function rescaleBalls() {
    const target = BALL_BASE_SPEED * speedMult;
    balls.forEach((b) => {
      if (b.onPaddle) return;
      const mag = Math.hypot(b.vx, b.vy) || 1;
      b.vx = (b.vx / mag) * target;
      b.vy = (b.vy / mag) * target;
    });
  }

  const POWERUP_EFFECTS = {
    slow: { apply: () => { speedMult *= 0.65; rescaleBalls(); }, revert: () => { speedMult /= 0.65; rescaleBalls(); } },
    fast: { apply: () => { speedMult *= 1.5; rescaleBalls(); }, revert: () => { speedMult /= 1.5; rescaleBalls(); } },
    gun: { apply: () => { gunAmmo = 15; }, revert: () => { gunAmmo = 0; } },
    wide: { apply: () => { paddle.w *= 1.5; clampPaddle(); }, revert: () => { paddle.w /= 1.5; clampPaddle(); } },
    narrow: { apply: () => { paddle.w *= 0.65; clampPaddle(); }, revert: () => { paddle.w /= 0.65; clampPaddle(); } },
  };

  function newBall() {
    return { x: paddle.x + paddle.w / 2, y: paddle.y - BALL_R - 1, vx: 0, vy: 0, onPaddle: true };
  }

  function resetBallsAndPaddle() {
    paddle.w = PADDLE_W_DEFAULT;
    paddle.x = W / 2 - paddle.w / 2;
    balls = [newBall()];
  }

  function buildLevel(n) {
    const layout = LEVEL_LAYOUTS[(n - 1) % LEVEL_LAYOUTS.length];
    bricks = [];
    layout.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell <= 0) return;
        const type = BRICK_TYPES[cell];
        bricks.push({
          x: c * BRICK_W, y: BRICK_TOP + r * BRICK_H, w: BRICK_W, h: BRICK_H,
          hits: 0, maxHits: type.maxHits, score: type.score, color: type.color, hitColor: type.hitColor, alive: true,
        });
      });
    });
  }

  buildLevel(level);
  resetBallsAndPaddle();

  function launch() {
    balls.forEach((b) => {
      if (!b.onPaddle) return;
      b.onPaddle = false;
      const speed = BALL_BASE_SPEED * speedMult;
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
      b.vx = speed * Math.sin(angle);
      b.vy = -speed * Math.cos(angle);
    });
  }
  input.onPress('A', launch);
  input.onPress('UP', launch);

  function fireBullet() {
    if (gunAmmo <= 0) return;
    bullets.push({ x: paddle.x + paddle.w / 2, y: paddle.y, vy: -320 });
    gunAmmo--;
    api.sfx.laser();
  }
  input.onPress('B', fireBullet);
  input.onPress('DOWN', fireBullet);

  function doMultiBall() {
    if (balls.length >= 6) return;
    if (balls.every((b) => b.onPaddle)) launch();
    const base = balls.find((b) => !b.onPaddle) || balls[0];
    const speed = Math.hypot(base.vx, base.vy) || BALL_BASE_SPEED * speedMult;
    const baseAngle = Math.atan2(base.vy, base.vx);
    [20, -20].forEach((deg) => {
      if (balls.length >= 6) return;
      const a = baseAngle + (deg * Math.PI) / 180;
      balls.push({ x: base.x, y: base.y, vx: speed * Math.cos(a), vy: speed * Math.sin(a), onPaddle: false });
    });
  }

  function spawnPowerUpDrop(x, y) {
    if (Math.random() > 0.22) return;
    const roll = Math.random();
    let id;
    if (roll < 0.15) id = 'multi';
    else if (roll < 0.25) id = 'life';
    else id = POWERUP_IDS[Math.floor(Math.random() * POWERUP_IDS.length)];
    drops.push({ x, y, vy: 90, id });
  }

  function activatePowerUp(id) {
    if (id === 'multi') {
      doMultiBall();
      api.sfx.point();
      return;
    }
    if (id === 'life') {
      lives++;
      api.sfx.point();
      return;
    }
    const meta = POWERUP_META[id];
    const effect = POWERUP_EFFECTS[id];
    const existing = activePowerUps.find((p) => p.id === id);
    if (existing) {
      existing.timeLeft = meta.duration;
    } else {
      effect.apply();
      activePowerUps.push({ id, name: meta.name, timeLeft: meta.duration, revert: effect.revert });
    }
    api.sfx.blip();
  }

  function checkExtraLife() {
    if (api.getScore() >= nextLifeScore) {
      lives++;
      nextLifeScore += EXTRA_LIFE_SCORE_STEP;
      api.sfx.point();
    }
  }

  function hitBrick(brick) {
    if (brick.maxHits === Infinity) {
      api.sfx.blip();
      return;
    }
    brick.hits++;
    if (brick.hits >= brick.maxHits) {
      brick.alive = false;
      api.addScore(brick.score);
      api.sfx.blip();
      api.burst(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 10, { speed: 100, life: 0.35, size: 2.5 });
      spawnPowerUpDrop(brick.x + brick.w / 2, brick.y + brick.h / 2);
      checkExtraLife();
    } else {
      if (brick.hitColor) brick.color = brick.hitColor;
      api.sfx.hit();
    }
  }

  function nextLevelUp() {
    level++;
    if (level > LEVEL_LAYOUTS.length) {
      api.sfx.clear();
      api.gameOver('ALL LEVELS CLEARED');
      return;
    }
    speedMult = 1 + (level - 1) * LEVEL_SPEED_INCREMENT;
    bullets = [];
    drops = [];
    buildLevel(level);
    resetBallsAndPaddle();
    api.sfx.clear();
  }

  function update(dt) {
    const dir = (input.isDown('RIGHT') ? 1 : 0) - (input.isDown('LEFT') ? 1 : 0);
    paddle.x += dir * PADDLE_SPEED * dt;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

    balls.forEach((b) => {
      if (b.onPaddle) {
        b.x = paddle.x + paddle.w / 2;
        b.y = paddle.y - BALL_R - 1;
        return;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx *= -1; }
      if (b.x + BALL_R > W) { b.x = W - BALL_R; b.vx *= -1; }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy *= -1; }

      if (
        b.vy > 0 &&
        b.y + BALL_R > paddle.y &&
        b.y - BALL_R < paddle.y + PADDLE_H &&
        b.x + BALL_R > paddle.x &&
        b.x - BALL_R < paddle.x + paddle.w
      ) {
        b.y = paddle.y - BALL_R;
        const speed = BALL_BASE_SPEED * speedMult;
        const hitPos = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        const angle = hitPos * (Math.PI / 3);
        b.vx = speed * Math.sin(angle);
        b.vy = -speed * Math.cos(angle);
        if (Math.abs(b.vy) < speed * 0.5) b.vy = -speed * 0.5;
        api.sfx.hit();
      }
    });

    balls = balls.filter((b) => b.y - BALL_R < H);
    if (balls.length === 0) {
      lives--;
      if (lives <= 0) {
        api.shake(6, 0.3);
        api.gameOver('BALL LOST');
        return;
      }
      resetBallsAndPaddle();
    }

    bullets.forEach((bl) => { bl.y += bl.vy * dt; });
    bullets = bullets.filter((bl) => bl.y > -10);

    for (const brick of bricks) {
      if (!brick.alive) continue;
      for (const b of balls) {
        if (
          b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + brick.w &&
          b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + brick.h
        ) {
          hitBrick(brick);
          const overlapX = Math.min(b.x + BALL_R - brick.x, brick.x + brick.w - (b.x - BALL_R));
          const overlapY = Math.min(b.y + BALL_R - brick.y, brick.y + brick.h - (b.y - BALL_R));
          if (overlapX < overlapY) b.vx *= -1; else b.vy *= -1;
          break;
        }
      }
    }

    for (const bl of bullets) {
      for (const brick of bricks) {
        if (!brick.alive) continue;
        if (bl.x > brick.x && bl.x < brick.x + brick.w && bl.y > brick.y && bl.y < brick.y + brick.h) {
          hitBrick(brick);
          bl.hit = true;
        }
      }
    }
    bullets = bullets.filter((bl) => !bl.hit);

    drops.forEach((d) => { d.y += d.vy * dt; });
    drops = drops.filter((d) => {
      if (d.y > paddle.y && d.y < paddle.y + PADDLE_H && d.x > paddle.x && d.x < paddle.x + paddle.w) {
        activatePowerUp(d.id);
        return false;
      }
      return d.y < H + 20;
    });

    activePowerUps = activePowerUps.filter((p) => {
      p.timeLeft -= dt;
      if (p.timeLeft <= 0) { p.revert(); return false; }
      return true;
    });

    if (bricks.every((br) => !br.alive || br.maxHits === Infinity)) {
      nextLevelUp();
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#8ff';
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES ${lives}`, 4, 12);
    ctx.textAlign = 'right';
    ctx.fillText(`LV ${level}`, W - 4, 12);
    ctx.textAlign = 'left';

    if (activePowerUps.length) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#ff0';
      const label = activePowerUps.map((p) => `${p.name} ${Math.ceil(p.timeLeft)}s`).join('  ');
      ctx.fillText(label, 4, 22);
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }

    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, PADDLE_H);
    ctx.restore();

    ctx.fillStyle = '#ff0';
    for (const bl of bullets) ctx.fillRect(bl.x - 1, bl.y - 6, 2, 6);

    for (const d of drops) {
      const info = dropInfo(d.id);
      ctx.save();
      ctx.fillStyle = info.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.symbol, d.x, d.y + 0.5);
      ctx.restore();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    for (const b of balls) {
      ctx.save();
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }

    if (balls.some((b) => b.onPaddle)) {
      ctx.fillStyle = '#8ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('A/UP: LAUNCH', W / 2, H - 70);
      ctx.fillText('B/DOWN: FIRE GUN', W / 2, H - 58);
      ctx.textAlign = 'left';
    }
  }

  return { update, render };
}

export default { id: 'arkanoid', name: 'Arkanoid', init };
