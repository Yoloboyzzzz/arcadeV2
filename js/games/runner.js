// runner.js — endless runner. A jumps, B ducks/slides. Auto-run left-to-right.

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const GROUND = H - 60;
  const player = { x: 50, y: GROUND - 30, w: 20, h: 30, vy: 0, ducking: false, onGround: true };
  const GRAVITY = 900, JUMP = -360;
  let speed = 180;
  const obstacles = [];
  let spawnTimer = 0;
  let dist = 0;

  input.onPress('A', () => {
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      api.sfx.jump();
      api.burst(player.x + player.w / 2, GROUND, '#0ff', 8, { speed: 60, life: 0.3, size: 2 });
    }
  });
  input.onPress('B', () => (player.ducking = true));
  input.onRelease('B', () => (player.ducking = false));

  function spawn() {
    const type = Math.random() < 0.5 ? 'ground' : 'air';
    obstacles.push({ x: W + 20, type, w: 18, h: type === 'ground' ? 26 : 20 });
  }

  function update(dt) {
    speed += dt * 4;
    dist += speed * dt;
    api.setScore(Math.floor(dist / 10));

    player.h = player.ducking && player.onGround ? 16 : 30;
    if (!player.onGround) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND - player.h) {
        player.y = GROUND - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    } else {
      player.y = GROUND - player.h;
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(0.5, 1.4 - speed / 400);
      spawn();
    }

    for (const o of obstacles) o.x -= speed * dt;
    while (obstacles.length && obstacles[0].x < -30) obstacles.shift();

    for (const o of obstacles) {
      const oy = o.type === 'ground' ? GROUND - o.h : GROUND - 60;
      const overlapX = player.x + player.w > o.x && player.x < o.x + o.w;
      const overlapY = player.y + player.h > oy && player.y < oy + o.h;
      if (overlapX && overlapY) {
        api.burst(player.x + player.w / 2, player.y + player.h / 2, '#f44', 20, { speed: 130, life: 0.5 });
        api.shake(7, 0.3);
        return api.gameOver('CRASHED');
      }
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#333';
    ctx.fillRect(0, GROUND, W, H - GROUND);

    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#f44';
    for (const o of obstacles) {
      const oy = o.type === 'ground' ? GROUND - o.h : GROUND - 60;
      ctx.fillRect(o.x, oy, o.w, o.h);
    }
    ctx.restore();
  }

  return { update, render };
}

export default { id: 'runner', name: 'Runner', init };
