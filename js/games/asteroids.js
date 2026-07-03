// asteroids.js — LEFT/RIGHT rotate, UP thrust, A fires.

function wrap(v, max) {
  if (v < 0) return v + max;
  if (v > max) return v - max;
  return v;
}

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const ship = { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 };
  const bullets = [];
  let asteroids = [];
  let invuln = 2;

  function spawnAsteroid(x, y, size) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 30 * (4 - size);
    asteroids.push({
      x, y, size, // size 3=big,2=med,1=small
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 2,
    });
  }
  for (let i = 0; i < 5; i++) {
    let x, y;
    do { x = Math.random() * W; y = Math.random() * H; } while (Math.hypot(x - ship.x, y - ship.y) < 80);
    spawnAsteroid(x, y, 3);
  }

  input.onPress('A', () => {
    if (bullets.length < 4) {
      bullets.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.angle) * 220 + ship.vx, vy: Math.sin(ship.angle) * 220 + ship.vy, life: 1.2 });
      api.sfx.laser();
    }
  });

  function update(dt) {
    if (input.isDown('LEFT')) ship.angle -= 3.2 * dt;
    if (input.isDown('RIGHT')) ship.angle += 3.2 * dt;
    if (input.isDown('UP')) {
      ship.vx += Math.cos(ship.angle) * 140 * dt;
      ship.vy += Math.sin(ship.angle) * 140 * dt;
    }
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x = wrap(ship.x + ship.vx * dt, W);
    ship.y = wrap(ship.y + ship.vy * dt, H);
    if (invuln > 0) invuln -= dt;

    for (const b of bullets) {
      b.x = wrap(b.x + b.vx * dt, W);
      b.y = wrap(b.y + b.vy * dt, H);
      b.life -= dt;
    }
    for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].life <= 0) bullets.splice(i, 1);

    for (const a of asteroids) {
      a.x = wrap(a.x + a.vx * dt, W);
      a.y = wrap(a.y + a.vy * dt, H);
      a.rot += a.spin * dt;
    }

    const next = [];
    for (const a of asteroids) {
      let hit = false;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.size * 10) {
          bullets.splice(i, 1);
          hit = true;
          api.addScore((4 - a.size) * 20);
          break;
        }
      }
      if (hit) {
        api.sfx.explosion();
        api.burst(a.x, a.y, '#aaa', a.size * 6, { speed: 80, life: 0.4, size: 2.5 });
        if (a.size > 1) {
          spawnAsteroid(a.x, a.y, a.size - 1);
          spawnAsteroid(a.x, a.y, a.size - 1);
        }
      } else {
        next.push(a);
      }
    }
    asteroids = next;

    if (invuln <= 0) {
      for (const a of asteroids) {
        if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.size * 10 + 6) {
          api.burst(ship.x, ship.y, '#0ff', 24, { speed: 150, life: 0.5 });
          api.shake(8, 0.3);
          return api.gameOver('DESTROYED');
        }
      }
    }

    if (asteroids.length === 0) api.gameOver('FIELD CLEARED');
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = invuln > 0 && Math.floor(invuln * 8) % 2 ? '#066' : '#0ff';
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fff';
    for (const b of bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#aaa';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      const r = a.size * 10;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const rr = r * (0.8 + 0.2 * Math.sin(i * 7 + a.size));
        const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  return { update, render };
}

export default { id: 'asteroids', name: 'Asteroids', init };
