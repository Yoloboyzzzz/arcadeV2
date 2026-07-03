// frogger.js — LEFT/RIGHT/UP/DOWN hop one grid cell. Cross the road & river.

const CELL = 32; // 320/32 = 10 cols
const COLS = 10;
const ROWS = 15; // 480/32

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  let frog = { col: 4, row: ROWS - 1 };
  let ridingVx = 0;

  // Lanes: rows 1-6 river (must ride logs), rows 8-12 road (avoid cars), row 0 goal, row ROWS-1 start.
  const lanes = [];
  for (let r = 1; r <= 6; r++) {
    const dir = r % 2 === 0 ? 1 : -1;
    const speed = 30 + r * 8;
    const gap = 90;
    const objs = [];
    for (let i = 0; i < 4; i++) objs.push({ x: i * gap, w: 60 });
    lanes.push({ row: r, type: 'log', dir, speed, objs, gap });
  }
  for (let r = 8; r <= 12; r++) {
    const dir = r % 2 === 0 ? 1 : -1;
    const speed = 50 + r * 6;
    const gap = 110;
    const objs = [];
    for (let i = 0; i < 3; i++) objs.push({ x: i * gap, w: 30 });
    lanes.push({ row: r, type: 'car', dir, speed, objs, gap });
  }

  function laneAt(row) {
    return lanes.find((l) => l.row === row);
  }

  function move(dc, dr) {
    const nc = frog.col + dc, nr = frog.row - dr; // UP decreases row
    if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return;
    frog.col = nc;
    frog.row = nr;
    api.sfx.blip();
    if (nr === 0) {
      api.addScore(50);
      api.sfx.point();
      api.burst(frog.col * CELL + CELL / 2, CELL / 2, '#0f0', 14, { speed: 90, life: 0.4 });
      frog = { col: 4, row: ROWS - 1 };
    }
  }
  input.onPress('LEFT', () => move(-1, 0));
  input.onPress('RIGHT', () => move(1, 0));
  input.onPress('UP', () => move(0, 1));
  input.onPress('DOWN', () => move(0, -1));

  function update(dt) {
    for (const lane of lanes) {
      const totalW = lane.objs.length * lane.gap;
      for (const o of lane.objs) {
        o.x += lane.dir * lane.speed * dt;
        if (lane.dir > 0 && o.x > W) o.x -= totalW;
        if (lane.dir < 0 && o.x < -o.w) o.x += totalW;
      }
    }

    const frogX = frog.col * CELL + CELL / 2;
    const lane = laneAt(frog.row);
    ridingVx = 0;
    if (lane) {
      const hit = lane.objs.find((o) => frogX > o.x && frogX < o.x + o.w);
      if (lane.type === 'car' && hit) {
        api.burst(frogX, frog.row * CELL + CELL / 2, '#0f0', 16, { speed: 100, life: 0.4 });
        api.shake(6, 0.2);
        return api.gameOver('SQUASHED');
      }
      if (lane.type === 'log') {
        if (!hit) {
          api.burst(frogX, frog.row * CELL + CELL / 2, '#0af', 12, { speed: 70, life: 0.4 });
          return api.gameOver('DROWNED');
        }
        ridingVx = lane.dir * lane.speed;
      }
    }
    frog.col = Math.max(0, Math.min(COLS - 1, frog.col + (ridingVx * dt) / CELL));
  }

  function render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#052';
    ctx.fillRect(0, 0, W, CELL); // goal
    ctx.fillStyle = '#049';
    ctx.fillRect(0, CELL, W, 6 * CELL); // river
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 7 * CELL, W, CELL); // median
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 8 * CELL, W, 5 * CELL); // road
    ctx.fillStyle = '#052';
    ctx.fillRect(0, 13 * CELL, W, 2 * CELL); // start

    for (const lane of lanes) {
      ctx.fillStyle = lane.type === 'log' ? '#850' : '#f22';
      for (const o of lane.objs) ctx.fillRect(o.x, lane.row * CELL + 4, o.w, CELL - 8);
    }

    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(frog.col * CELL + 4, frog.row * CELL + 4, CELL - 8, CELL - 8);
    ctx.restore();
  }

  return { update, render };
}

export default { id: 'frogger', name: 'Frogger', init };
