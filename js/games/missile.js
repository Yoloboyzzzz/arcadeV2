// missile.js — Missile Command. LEFT/RIGHT move crosshair, UP/DOWN fine-adjust, A fires.

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const GROUND = H - 20;
  const crosshair = { x: W / 2, y: H / 2 };
  const cities = [];
  const CITY_W = 24;
  for (let i = 0; i < 5; i++) cities.push({ x: 20 + i * (W - 40) / 4, alive: true });

  const missiles = []; // incoming
  const shots = []; // player projectiles
  const explosions = [];
  let spawnTimer = 0;
  let spawnInterval = 1.6;

  input.onPress('A', () => {
    shots.push({ x: W / 2, y: GROUND, tx: crosshair.x, ty: crosshair.y, speed: 260 });
    api.sfx.laser();
  });

  function spawnMissile() {
    const fromX = Math.random() * W;
    const target = cities.filter((c) => c.alive);
    if (!target.length) return;
    const t = target[Math.floor(Math.random() * target.length)];
    missiles.push({ x: fromX, y: 0, tx: t.x, ty: GROUND, speed: 40 + Math.random() * 20 });
  }

  function update(dt) {
    const CROSS_SPEED = 200;
    if (input.isDown('LEFT')) crosshair.x -= CROSS_SPEED * dt;
    if (input.isDown('RIGHT')) crosshair.x += CROSS_SPEED * dt;
    if (input.isDown('UP')) crosshair.y -= CROSS_SPEED * dt;
    if (input.isDown('DOWN')) crosshair.y += CROSS_SPEED * dt;
    crosshair.x = Math.max(0, Math.min(W, crosshair.x));
    crosshair.y = Math.max(0, Math.min(H - 30, crosshair.y));

    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnInterval = Math.max(0.5, spawnInterval - 0.02);
      spawnMissile();
    }

    for (const m of missiles) {
      const dx = m.tx - m.x, dy = m.ty - m.y;
      const d = Math.hypot(dx, dy) || 1;
      m.x += (dx / d) * m.speed * dt;
      m.y += (dy / d) * m.speed * dt;
    }
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      if (Math.hypot(m.tx - m.x, m.ty - m.y) < 4) {
        explosions.push({ x: m.x, y: m.y, r: 4, growing: true });
        api.sfx.explosion();
        const city = cities.find((c) => c.alive && Math.abs(c.x - m.x) < CITY_W);
        if (city) { city.alive = false; api.shake(6, 0.2); }
        missiles.splice(i, 1);
      }
    }

    for (const s of shots) {
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < s.speed * dt) {
        explosions.push({ x: s.tx, y: s.ty, r: 4, growing: true });
        s.done = true;
      } else {
        s.x += (dx / d) * s.speed * dt;
        s.y += (dy / d) * s.speed * dt;
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].done) shots.splice(i, 1);

    for (const e of explosions) {
      if (e.growing) {
        e.r += 90 * dt;
        if (e.r > 26) e.growing = false;
      } else {
        e.r -= 60 * dt;
      }
    }
    for (let i = explosions.length - 1; i >= 0; i--) if (explosions[i].r <= 0) explosions.splice(i, 1);

    for (const e of explosions) {
      for (let i = missiles.length - 1; i >= 0; i--) {
        if (Math.hypot(missiles[i].x - e.x, missiles[i].y - e.y) < e.r) {
          api.burst(missiles[i].x, missiles[i].y, '#ff0', 8, { speed: 70, life: 0.3, size: 2 });
          missiles.splice(i, 1);
          api.addScore(25);
        }
      }
    }

    if (cities.every((c) => !c.alive)) api.gameOver('CITIES DESTROYED');
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#040';
    ctx.fillRect(0, GROUND, W, H - GROUND);

    ctx.fillStyle = '#0f0';
    for (const c of cities) {
      if (!c.alive) continue;
      ctx.fillRect(c.x - CITY_W / 2, GROUND - 14, CITY_W, 14);
    }

    ctx.strokeStyle = '#f00';
    ctx.fillStyle = '#f00';
    for (const m of missiles) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#0ff';
    for (const s of shots) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#ff0';
    for (const e of explosions) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(crosshair.x - 8, crosshair.y);
    ctx.lineTo(crosshair.x + 8, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - 8);
    ctx.lineTo(crosshair.x, crosshair.y + 8);
    ctx.stroke();
  }

  return { update, render };
}

export default { id: 'missile', name: 'Missile Command', init };
