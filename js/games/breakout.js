// breakout.js — LEFT/RIGHT move paddle, A launches ball.

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const PADDLE_W = 56, PADDLE_H = 10;
  const paddle = { x: W / 2 - PADDLE_W / 2, y: H - 30 };
  const ball = { x: W / 2, y: H - 40, r: 5, vx: 0, vy: 0, launched: false };
  const SPEED = 260;

  const ROWS = 6, COLS = 10;
  const BRICK_W = W / COLS, BRICK_H = 14, BRICK_TOP = 40;
  const colors = ['#f0f', '#0ff', '#0f0', '#ff0', '#f80', '#08f'];
  let bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({ x: c * BRICK_W, y: BRICK_TOP + r * BRICK_H, w: BRICK_W, h: BRICK_H, alive: true, color: colors[r % colors.length] });
    }
  }

  function launch() {
    if (ball.launched) return;
    ball.launched = true;
    ball.vx = SPEED * (Math.random() > 0.5 ? 0.5 : -0.5);
    ball.vy = -SPEED;
  }
  input.onPress('A', launch);

  function update(dt) {
    const dir = (input.isDown('RIGHT') ? 1 : 0) - (input.isDown('LEFT') ? 1 : 0);
    paddle.x += dir * SPEED * dt;
    paddle.x = Math.max(0, Math.min(W - PADDLE_W, paddle.x));

    if (!ball.launched) {
      ball.x = paddle.x + PADDLE_W / 2;
      ball.y = paddle.y - 10;
      return;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
    if (ball.y - ball.r < 0) ball.vy *= -1;

    if (ball.y > H) {
      api.shake(6, 0.25);
      api.gameOver('BALL LOST');
      return;
    }

    // Paddle collision
    if (
      ball.vy > 0 &&
      ball.y + ball.r > paddle.y &&
      ball.y < paddle.y + PADDLE_H &&
      ball.x > paddle.x &&
      ball.x < paddle.x + PADDLE_W
    ) {
      ball.vy = -Math.abs(ball.vy);
      const hitPos = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
      ball.vx = SPEED * hitPos;
      api.sfx.hit();
    }

    // Brick collision
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
        api.addScore(5);
        api.sfx.blip();
        api.burst(b.x + b.w / 2, b.y + b.h / 2, b.color, 12, { speed: 100, life: 0.35, size: 2.5 });
        break;
      }
    }

    if (bricks.every((b) => !b.alive)) {
      api.sfx.clear();
      api.gameOver('YOU CLEARED IT');
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

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
    ctx.fillRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    if (!ball.launched) {
      ctx.fillStyle = '#8ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS A TO LAUNCH', W / 2, H - 60);
      ctx.textAlign = 'left';
    }
  }

  return { update, render };
}

export default { id: 'breakout', name: 'Breakout', init };
