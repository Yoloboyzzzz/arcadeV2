// tetris.js — LEFT/RIGHT move, DOWN soft-drop, UP rotate, A hard-drop.

const COLS = 10;
const ROWS = 20;
const CELL = 24; // 10*24=240 fits in 320 width, centered

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};
const COLORS = { I: '#0ff', O: '#ff0', T: '#f0f', S: '#0f0', Z: '#f00', J: '#08f', L: '#f80' };
const KEYS = Object.keys(SHAPES);

function rotate(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  const out = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = matrix[r][c];
  return out;
}

function init(ctx, input, api) {
  const OFFSET_X = (api.width - COLS * CELL) / 2;
  const board = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
  let cur = spawn();
  let dropTimer = 0;
  let dropInterval = 0.6;

  function spawn() {
    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    return { key, shape: SHAPES[key], x: Math.floor(COLS / 2) - 1, y: 0 };
  }

  function collides(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = x + c, by = y + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function lock() {
    cur.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) {
        const by = cur.y + r, bx = cur.x + c;
        if (by >= 0) board[by][bx] = cur.key;
      }
    }));
    clearLines();
    cur = spawn();
    if (collides(cur.shape, cur.x, cur.y)) api.gameOver('BOARD FULL');
  }

  function ghostY() {
    let y = cur.y;
    while (!collides(cur.shape, cur.x, y + 1)) y++;
    return y;
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v)) {
        for (let c = 0; c < COLS; c++) {
          api.burst(OFFSET_X + c * CELL + CELL / 2, r * CELL + CELL / 2, COLORS[board[r][c]], 6, { speed: 90, life: 0.4, size: 2 });
        }
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      api.addScore([0, 40, 100, 300, 1200][cleared] || cleared * 100);
      api.sfx.clear();
      api.shake(cleared >= 4 ? 8 : 3, 0.2);
    }
  }

  input.onPress('LEFT', () => { if (!collides(cur.shape, cur.x - 1, cur.y)) { cur.x--; api.sfx.blip(); } });
  input.onPress('RIGHT', () => { if (!collides(cur.shape, cur.x + 1, cur.y)) { cur.x++; api.sfx.blip(); } });
  input.onPress('UP', () => {
    const rotated = rotate(cur.shape);
    if (!collides(rotated, cur.x, cur.y)) cur.shape = rotated;
    else if (!collides(rotated, cur.x - 1, cur.y)) { cur.shape = rotated; cur.x--; }
    else if (!collides(rotated, cur.x + 1, cur.y)) { cur.shape = rotated; cur.x++; }
    else return;
    api.sfx.blip();
  });
  input.onPress('A', () => {
    while (!collides(cur.shape, cur.x, cur.y + 1)) cur.y++;
    api.shake(3, 0.12);
    lock();
  });

  function update(dt) {
    const fast = input.isDown('DOWN');
    dropTimer += dt;
    if (dropTimer > (fast ? dropInterval / 8 : dropInterval)) {
      dropTimer = 0;
      if (!collides(cur.shape, cur.x, cur.y + 1)) cur.y++;
      else lock();
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, api.width, api.height);

    ctx.strokeStyle = '#022';
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(OFFSET_X, r * CELL);
      ctx.lineTo(OFFSET_X + COLS * CELL, r * CELL);
      ctx.stroke();
    }

    board.forEach((row, r) => row.forEach((key, c) => {
      if (key) {
        ctx.fillStyle = COLORS[key];
        ctx.fillRect(OFFSET_X + c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }));

    const gy = ghostY();
    ctx.strokeStyle = COLORS[cur.key];
    ctx.globalAlpha = 0.35;
    cur.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) ctx.strokeRect(OFFSET_X + (cur.x + c) * CELL + 2, (gy + r) * CELL + 2, CELL - 4, CELL - 4);
    }));
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.shadowColor = COLORS[cur.key];
    ctx.shadowBlur = 8;
    ctx.fillStyle = COLORS[cur.key];
    cur.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) ctx.fillRect(OFFSET_X + (cur.x + c) * CELL + 1, (cur.y + r) * CELL + 1, CELL - 2, CELL - 2);
    }));
    ctx.restore();
  }

  return { update, render };
}

export default { id: 'tetris', name: 'Tetris', init };
