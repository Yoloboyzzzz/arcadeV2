// invaders.js — LEFT/RIGHT move, A fires.

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const player = { x: W / 2 - 12, y: H - 30, w: 24, h: 10 };
  const bullets = []; // player bullets
  const enemyBullets = [];
  const SPEED = 200;
  let fireCooldown = 0;

  const ROWS = 4, COLS = 8;
  const ENEMY_W = 20, ENEMY_H = 14, GAP_X = 8, GAP_Y = 12;
  const gridW = COLS * (ENEMY_W + GAP_X) - GAP_X;
  const startX = (W - gridW) / 2;
  let enemies = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      enemies.push({ x: startX + c * (ENEMY_W + GAP_X), y: 40 + r * (ENEMY_H + GAP_Y), alive: true });
    }
  }
  let dir = 1;
  let dropQueued = false;
  let enemySpeed = 24;
  let shotTimer = 0;

  input.onPress('A', () => {
    if (fireCooldown <= 0 && bullets.length < 3) {
      bullets.push({ x: player.x + player.w / 2, y: player.y });
      fireCooldown = 0.35;
      api.sfx.laser();
    }
  });

  function update(dt) {
    if (input.isDown('LEFT')) player.x -= SPEED * dt;
    if (input.isDown('RIGHT')) player.x += SPEED * dt;
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    fireCooldown -= dt;

    bullets.forEach((b) => (b.y -= 260 * dt));
    for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].y < 0) bullets.splice(i, 1);

    enemyBullets.forEach((b) => (b.y += 160 * dt));
    for (let i = enemyBullets.length - 1; i >= 0; i--) if (enemyBullets[i].y > H) enemyBullets.splice(i, 1);

    const alive = enemies.filter((e) => e.alive);
    if (alive.length === 0) return api.gameOver('YOU WIN');

    let hitEdge = false;
    for (const e of alive) {
      e.x += dir * enemySpeed * dt;
      if (e.x < 0 || e.x + ENEMY_W > W) hitEdge = true;
    }
    if (hitEdge) {
      dir *= -1;
      alive.forEach((e) => (e.y += 12));
      enemySpeed += 3;
    }

    shotTimer -= dt;
    if (shotTimer <= 0 && alive.length) {
      shotTimer = Math.max(0.3, 1.2 - alive.length * 0.01);
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      enemyBullets.push({ x: shooter.x + ENEMY_W / 2, y: shooter.y + ENEMY_H });
    }

    for (const e of alive) {
      if (e.y + ENEMY_H > player.y) {
        api.burst(player.x + player.w / 2, player.y, '#0ff', 20, { speed: 140, life: 0.5 });
        api.shake(8, 0.3);
        return api.gameOver('INVADED');
      }
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.x > e.x && b.x < e.x + ENEMY_W && b.y > e.y && b.y < e.y + ENEMY_H) {
          e.alive = false;
          bullets.splice(i, 1);
          api.addScore(10);
          api.sfx.hit();
          api.burst(e.x + ENEMY_W / 2, e.y + ENEMY_H / 2, '#0f0', 10, { speed: 90, life: 0.35, size: 2.5 });
          break;
        }
      }
    }

    for (const b of enemyBullets) {
      if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
        api.burst(player.x + player.w / 2, player.y, '#0ff', 20, { speed: 140, life: 0.5 });
        api.shake(8, 0.3);
        return api.gameOver('SHOT DOWN');
      }
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#0f0';
    for (const e of enemies) {
      if (!e.alive) continue;
      ctx.fillRect(e.x, e.y, ENEMY_W, ENEMY_H);
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();

    ctx.fillStyle = '#fff';
    bullets.forEach((b) => ctx.fillRect(b.x - 1, b.y - 6, 2, 6));
    ctx.fillStyle = '#f00';
    enemyBullets.forEach((b) => ctx.fillRect(b.x - 1, b.y, 2, 6));
  }

  return { update, render };
}

export default { id: 'invaders', name: 'Space Invaders', init };
