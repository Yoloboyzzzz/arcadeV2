// 2048.js — LEFT/RIGHT/UP/DOWN slide tiles.

const SIZE = 4;

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  const BOARD = Math.min(W, H) - 40;
  const CELL = BOARD / SIZE;
  const OX = (W - BOARD) / 2, OY = (H - BOARD) / 2;

  let grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
  addTile(); addTile();
  let dirty = true;

  function addTile() {
    const empty = [];
    grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideRow(row) {
    const vals = row.filter((v) => v);
    const merged = [];
    let gained = 0;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        merged.push(vals[i] * 2);
        gained += vals[i] * 2;
        i++;
      } else {
        merged.push(vals[i]);
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return { merged, gained };
  }

  function transpose(g) {
    return g[0].map((_, c) => g.map((row) => row[c]));
  }

  function move(dir) {
    let g = grid.map((r) => r.slice());
    let vertical = dir === 'UP' || dir === 'DOWN';
    let reverse = dir === 'RIGHT' || dir === 'DOWN';
    if (vertical) g = transpose(g);
    if (reverse) g = g.map((r) => r.slice().reverse());

    let totalGain = 0;
    let changed = false;
    const newG = g.map((row) => {
      const before = row.join(',');
      const { merged, gained } = slideRow(row);
      totalGain += gained;
      if (merged.join(',') !== before) changed = true;
      return merged;
    });

    let result = newG;
    if (reverse) result = result.map((r) => r.slice().reverse());
    if (vertical) result = transpose(result);

    if (changed) {
      grid = result;
      api.addScore(totalGain);
      if (totalGain > 0) {
        api.sfx.point();
        for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
            if (grid[r][c]) api.burst(OX + c * CELL + CELL / 2, OY + r * CELL + CELL / 2, colors[grid[r][c]] || '#fff', 4, { speed: 40, life: 0.3, size: 2 });
          }
        }
      } else {
        api.sfx.blip();
      }
      addTile();
      dirty = true;
      if (isGameOver()) api.gameOver('NO MORE MOVES');
    }
  }

  function isGameOver() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!grid[r][c]) return false;
        if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
        if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  input.onPress('LEFT', () => move('LEFT'));
  input.onPress('RIGHT', () => move('RIGHT'));
  input.onPress('UP', () => move('UP'));
  input.onPress('DOWN', () => move('DOWN'));

  const colors = {
    2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f',
    64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
  };

  function update() {}

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#221';
    ctx.fillRect(OX, OY, BOARD, BOARD);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c];
        const x = OX + c * CELL, y = OY + r * CELL;
        ctx.save();
        if (v >= 128) { ctx.shadowColor = colors[v] || '#fff'; ctx.shadowBlur = 10; }
        ctx.fillStyle = v ? colors[v] || '#3c3a32' : '#333';
        ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
        ctx.restore();
        if (v) {
          ctx.fillStyle = v <= 4 ? '#333' : '#fff';
          ctx.font = `${CELL / 3}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(v, x + CELL / 2, y + CELL / 2);
        }
      }
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  return { update, render };
}

export default { id: '2048', name: '2048', init };
