// pong.js — single player vs CPU. UP/DOWN move paddle. First to 5 wins (then restarts).

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const PADDLE_W = 8, PADDLE_H = 60;
  const player = { x: 10, y: H / 2 - PADDLE_H / 2, score: 0 };
  const cpu = { x: W - 10 - PADDLE_W, y: H / 2 - PADDLE_H / 2, score: 0 };
  const ball = { x: W / 2, y: H / 2, vx: 140, vy: 90, r: 5 };
  const SPEED = 220;

  function resetBall(dir) {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = SPEED * dir;
    ball.vy = (Math.random() * 2 - 1) * 140;
  }

  function update(dt) {
    if (input.isDown('UP')) player.y -= SPEED * dt;
    if (input.isDown('DOWN')) player.y += SPEED * dt;
    player.y = Math.max(0, Math.min(H - PADDLE_H, player.y));

    // Simple CPU tracking with limited speed.
    const cpuCenter = cpu.y + PADDLE_H / 2;
    const cpuSpeed = SPEED * 0.65;
    if (ball.y < cpuCenter - 10) cpu.y -= cpuSpeed * dt;
    else if (ball.y > cpuCenter + 10) cpu.y += cpuSpeed * dt;
    cpu.y = Math.max(0, Math.min(H - PADDLE_H, cpu.y));

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y - ball.r < 0 || ball.y + ball.r > H) ball.vy *= -1;

    if (
      ball.vx < 0 &&
      ball.x - ball.r < player.x + PADDLE_W &&
      ball.x > player.x &&
      ball.y > player.y &&
      ball.y < player.y + PADDLE_H
    ) {
      ball.vx *= -1.05;
      ball.vy += (ball.y - (player.y + PADDLE_H / 2)) * 4;
      api.sfx.hit();
      api.burst(ball.x, ball.y, '#0ff', 8, { speed: 80, life: 0.3, size: 2 });
    }
    if (
      ball.vx > 0 &&
      ball.x + ball.r > cpu.x &&
      ball.x < cpu.x + PADDLE_W &&
      ball.y > cpu.y &&
      ball.y < cpu.y + PADDLE_H
    ) {
      ball.vx *= -1.05;
      ball.vy += (ball.y - (cpu.y + PADDLE_H / 2)) * 4;
      api.sfx.hit();
      api.burst(ball.x, ball.y, '#f0f', 8, { speed: 80, life: 0.3, size: 2 });
    }

    if (ball.x < 0) {
      cpu.score++;
      api.setScore(player.score);
      api.shake(4, 0.15);
      if (cpu.score >= 5) return api.gameOver('CPU WINS');
      resetBall(1);
    } else if (ball.x > W) {
      player.score++;
      api.setScore(player.score);
      api.sfx.point();
      api.shake(4, 0.15);
      if (player.score >= 5) return api.gameOver('YOU WIN');
      resetBall(-1);
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#044';
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, PADDLE_W, PADDLE_H);
    ctx.shadowColor = '#f0f';
    ctx.fillStyle = '#f0f';
    ctx.fillRect(cpu.x, cpu.y, PADDLE_W, PADDLE_H);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    ctx.font = '20px monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(player.score, W / 2 - 40, 30);
    ctx.fillStyle = '#f0f';
    ctx.fillText(cpu.score, W / 2 + 25, 30);
  }

  return { update, render };
}

export default { id: 'pong', name: 'Pong', init };
