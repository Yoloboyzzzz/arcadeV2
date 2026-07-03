// fx.js — shared particle burst system + screen-shake helper for game juice.

export function createFx() {
  let particles = [];
  let shakeTime = 0;
  let shakeMag = 0;

  function burst(x, y, color, count = 16, opts = {}) {
    const speed = opts.speed || 120;
    const life = opts.life || 0.5;
    const size = opts.size || 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = speed * (0.4 + Math.random() * 0.6);
      particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
      });
    }
  }

  function shake(magnitude = 6, duration = 0.2) {
    shakeMag = Math.max(shakeMag, magnitude);
    shakeTime = Math.max(shakeTime, duration);
  }

  function update(dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);

    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
  }

  function render(ctx) {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function getShakeOffset() {
    if (shakeTime <= 0) return { x: 0, y: 0 };
    const mag = shakeMag * (shakeTime / 0.2 > 1 ? 1 : shakeTime / 0.2);
    return { x: (Math.random() * 2 - 1) * mag, y: (Math.random() * 2 - 1) * mag };
  }

  function clear() {
    particles = [];
    shakeTime = 0;
  }

  return { burst, shake, update, render, getShakeOffset, clear };
}
