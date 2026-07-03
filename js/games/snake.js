// snake.js — classic snake. LEFT/RIGHT/UP/DOWN steer, A/B unused.

const GRID = 16; // cell size in logical px
const COLS = 20; // 320 / 16
const ROWS = 30; // 480 / 16
const STEP_TIME = 0.12; // seconds per grid step

function init(ctx, input, api) {
  let snake = [{ x: 10, y: 15 }, { x: 9, y: 15 }, { x: 8, y: 15 }];
  let dir = { x: 1, y: 0 };
  let pendingDir = dir;
  let food = spawnFood(snake);
  let timer = 0;

  input.onPress('LEFT', () => trySetDir(-1, 0));
  input.onPress('RIGHT', () => trySetDir(1, 0));
  input.onPress('UP', () => trySetDir(0, -1));
  input.onPress('DOWN', () => trySetDir(0, 1));

  function trySetDir(x, y) {
    // Prevent reversing directly into self.
    if (snake.length > 1 && dir.x === -x && dir.y === -y) return;
    pendingDir = { x, y };
  }

  function spawnFood(body) {
    let f;
    do {
      f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (body.some((s) => s.x === f.x && s.y === f.y));
    return f;
  }

  function update(dt) {
    timer += dt;
    if (timer < STEP_TIME) return;
    timer = 0;
    dir = pendingDir;

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (
      head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      api.burst(head.x * GRID + GRID / 2, head.y * GRID + GRID / 2, '#2e8b3d', 24, { speed: 160, life: 0.6 });
      api.shake(6, 0.25);
      api.gameOver('YOU DIED');
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      api.addScore(10);
      api.sfx.point();
      api.burst(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, '#e8231a', 14, { speed: 90, life: 0.4, size: 2 });
      food = spawnFood(snake);
    } else {
      snake.pop();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrass(ctx) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#3fa34d' : '#379143';
        ctx.fillRect(x * GRID, y * GRID, GRID, GRID);
      }
    }
  }

  function drawApple(ctx) {
    const cx = food.x * GRID + GRID / 2;
    const cy = food.y * GRID + GRID / 2;
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.08;
    const r = (GRID / 2 - 2) * pulse;

    ctx.save();
    // leaf
    ctx.fillStyle = '#2ecc40';
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy - r - 1, 4, 2.5, -0.6, 0, Math.PI * 2);
    ctx.fill();
    // stem
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r + 1);
    ctx.lineTo(cx - 1, cy - r - 4);
    ctx.stroke();
    // apple body
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8;
    const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 1, cx, cy, r);
    grad.addColorStop(0, '#ff6b6b');
    grad.addColorStop(0.6, '#e8231a');
    grad.addColorStop(1, '#a8140d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // shine
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.25, r * 0.15, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSnake(ctx) {
    // Body: overlapping rounded segments so it reads as one continuous snake.
    for (let i = snake.length - 1; i >= 1; i--) {
      const s = snake[i];
      const t = i / Math.max(1, snake.length - 1);
      const shade = Math.floor(150 - t * 70);
      ctx.fillStyle = `rgb(20,${shade},40)`;
      const pad = 1;
      roundRect(ctx, s.x * GRID + pad, s.y * GRID + pad, GRID - pad * 2, GRID - pad * 2, 5);
      ctx.fill();
      // scale highlight
      ctx.fillStyle = `rgba(255,255,255,0.08)`;
      ctx.beginPath();
      ctx.arc(s.x * GRID + GRID / 2, s.y * GRID + GRID / 2, GRID / 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head: direction-aware, with eyes + tongue.
    const head = snake[0];
    const hx = head.x * GRID + GRID / 2;
    const hy = head.y * GRID + GRID / 2;
    const angle = Math.atan2(dir.y, dir.x);

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    ctx.shadowColor = '#3f6';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#2e8b3d';
    roundRect(ctx, -GRID / 2 + 1, -GRID / 2 + 1, GRID - 2, GRID - 2, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // tongue flicks in and out
    if (Math.sin(performance.now() / 120) > 0.3) {
      ctx.strokeStyle = '#e6294b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(GRID / 2 - 1, 0);
      ctx.lineTo(GRID / 2 + 6, 0);
      ctx.moveTo(GRID / 2 + 6, 0);
      ctx.lineTo(GRID / 2 + 9, -2.5);
      ctx.moveTo(GRID / 2 + 6, 0);
      ctx.lineTo(GRID / 2 + 9, 2.5);
      ctx.stroke();
    }

    // eyes (offset toward direction of travel, forward of center)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(GRID / 6, -GRID / 5, 2.6, 0, Math.PI * 2);
    ctx.arc(GRID / 6, GRID / 5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(GRID / 6 + 1, -GRID / 5, 1.3, 0, Math.PI * 2);
    ctx.arc(GRID / 6 + 1, GRID / 5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function render(ctx) {
    drawGrass(ctx);
    drawApple(ctx);
    drawSnake(ctx);
  }

  return { update, render };
}

export default { id: 'snake', name: 'Snake', init };
