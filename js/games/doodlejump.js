// doodlejump.js — LEFT/RIGHT move, auto-bounce up platforms. Tilt-free variant.

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const player = { x: W / 2, y: H - 60, vy: -300, w: 22, h: 22 };
  const GRAVITY = 500;
  const platforms = [];
  const PLAT_W = 50, PLAT_H = 10;
  let cameraY = 0;

  for (let i = 0; i < 8; i++) {
    platforms.push({ x: Math.random() * (W - PLAT_W), y: H - i * 60 });
  }

  function update(dt) {
    const SPEED = 220;
    if (input.isDown('LEFT')) player.x -= SPEED * dt;
    if (input.isDown('RIGHT')) player.x += SPEED * dt;
    if (player.x < -player.w) player.x = W;
    if (player.x > W) player.x = -player.w;

    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.vy > 0) {
      for (const p of platforms) {
        if (
          player.x + player.w > p.x && player.x < p.x + PLAT_W &&
          player.y + player.h > p.y && player.y + player.h < p.y + PLAT_H + 10 &&
          player.y < p.y
        ) {
          player.vy = -330;
          api.sfx.jump();
          api.burst(player.x + player.w / 2, player.y + player.h, '#0f0', 8, { speed: 60, life: 0.3, size: 2 });
        }
      }
    }

    // Scroll camera up when player rises past midpoint.
    if (player.y < H / 2) {
      const dy = H / 2 - player.y;
      player.y = H / 2;
      cameraY += dy;
      for (const p of platforms) p.y += dy;
      platforms.forEach((p) => {
        if (p.y > H) {
          p.y = Math.min(...platforms.map((pp) => pp.y)) - 60;
          p.x = Math.random() * (W - PLAT_W);
          api.addScore(1);
        }
      });
    }

    if (player.y > H) {
      api.burst(player.x + player.w / 2, H - 10, '#ff0', 16, { speed: 100, life: 0.4 });
      api.shake(6, 0.25);
      api.gameOver('FELL');
    }
  }

  function render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#013');
    sky.addColorStop(1, '#001a33');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#0f0';
    for (const p of platforms) ctx.fillRect(p.x, p.y, PLAT_W, PLAT_H);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();
  }

  return { update, render };
}

export default { id: 'doodlejump', name: 'Doodle Jump', init };
