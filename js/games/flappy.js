// flappy.js — sprite-based Flappy Bird, ported from a standalone canvas game
// (theme1/theme2 spritesheet + wav SFX) into the arcade's engine/input contract.
// A flaps. Engine's shared HUD/game-over/restart replace the original's
// get-ready/game-over screens and score-restart click handler.

const DEG = Math.PI / 180;

const theme1 = new Image();
theme1.src = 'assets/flappy/img/og-theme.png';
const theme2 = new Image();
theme2.src = 'assets/flappy/img/og-theme-2.png';

const SFX_SCORE = new Audio('assets/flappy/audio/sfx_point.wav');
const SFX_FLAP = new Audio('assets/flappy/audio/sfx_wing.wav');
const SFX_COLLISION = new Audio('assets/flappy/audio/sfx_hit.wav');
const SFX_FALL = new Audio('assets/flappy/audio/sfx_die.wav');

const MAP = [
  { imgX: 496, imgY: 60, width: 12, height: 18 },  // 0
  { imgX: 135, imgY: 455, width: 10, height: 18 }, // 1
  { imgX: 292, imgY: 160, width: 12, height: 18 }, // 2
  { imgX: 306, imgY: 160, width: 12, height: 18 }, // 3
  { imgX: 320, imgY: 160, width: 12, height: 18 }, // 4
  { imgX: 334, imgY: 160, width: 12, height: 18 }, // 5
  { imgX: 292, imgY: 184, width: 12, height: 18 }, // 6
  { imgX: 306, imgY: 184, width: 12, height: 18 }, // 7
  { imgX: 320, imgY: 184, width: 12, height: 18 }, // 8
  { imgX: 334, imgY: 184, width: 12, height: 18 }, // 9
];

function init(ctx, input, api) {
  const W = api.width, H = api.height;
  let frame = 0;
  let ended = false;

  const bg = {
    imgX: 0, imgY: 0, width: 276, height: 228,
    x: 0, y: H - 228, w: 276, h: 228, dx: 0.2,
    render() {
      ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x, this.y, this.w, this.h);
      ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x + this.w, this.y, this.w, this.h);
      ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x + this.w * 2, this.y, this.w, this.h);
    },
    position() { this.x = (this.x - this.dx) % this.w; },
  };

  const ground = {
    imgX: 276, imgY: 0, width: 224, height: 112,
    x: 0, y: H - 112, w: 224, h: 112, dx: 2,
    render() {
      ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x, this.y, this.w, this.h);
      ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x + this.w, this.y, this.w, this.h);
    },
    position() { this.x = (this.x - this.dx) % (this.w / 2); },
  };

  const pipes = {
    top: { imgX: 56, imgY: 323 },
    bot: { imgX: 84, imgY: 323 },
    width: 26, height: 160,
    w: 55, h: 300, gap: 85, dx: 2,
    minY: -(ground.h + 220), maxY: -(ground.h + 40),
    list: [],
    render() {
      for (const pg of this.list) {
        const topPipe = pg.y, bottomPipe = pg.y + this.gap + this.h;
        ctx.drawImage(theme2, this.top.imgX, this.top.imgY, this.width, this.height, pg.x, topPipe, this.w, this.h);
        ctx.drawImage(theme2, this.bot.imgX, this.bot.imgY, this.width, this.height, pg.x, bottomPipe, this.w, this.h);
      }
    },
    position() {
      if (frame % 100 === 0) {
        this.list.push({ x: W, y: Math.floor(Math.random() * (this.maxY - this.minY + 1)) + this.minY });
      }
      for (const pg of this.list) {
        pg.x -= this.dx;

        const b = { left: bird.x - bird.r, right: bird.x + bird.r, top: bird.y - bird.r, bottom: bird.y + bird.r };
        const p = {
          top: { top: pg.y, bottom: pg.y + this.h },
          bot: { top: pg.y + this.h + this.gap, bottom: pg.y + this.h * 2 + this.gap },
          left: pg.x, right: pg.x + this.w,
        };

        if (b.left < p.right && b.right > p.left && b.top < p.top.bottom && b.bottom > p.top.top) {
          endGame('CRASHED', SFX_COLLISION);
        }
        if (b.left < p.right && b.right > p.left && b.top < p.bot.bottom && b.bottom > p.bot.top) {
          endGame('CRASHED', SFX_COLLISION);
        }
      }
      while (this.list.length && this.list[0].x < -this.w) {
        this.list.shift();
        api.addScore(1);
        SFX_SCORE.currentTime = 0;
        SFX_SCORE.play();
      }
    },
  };

  const score = {
    x: W / 2, y: 40, w: 15, h: 25,
    render() {
      const s = api.getScore().toString();
      const ones = +s.charAt(s.length - 1);
      const tens = s.length > 1 ? +s.charAt(s.length - 2) : null;
      const hundreds = s.length > 2 ? +s.charAt(s.length - 3) : null;
      const draw = (digit, dx) => {
        const m = MAP[digit];
        ctx.drawImage(theme2, m.imgX, m.imgY, m.width, m.height, dx, this.y, this.w, this.h);
      };
      if (hundreds !== null) {
        draw(hundreds, this.x - this.w / 2 - this.w - 3);
        draw(tens, this.x - this.w / 2);
        draw(ones, this.x - this.w / 2 + this.w + 3);
      } else if (tens !== null) {
        draw(tens, this.x - this.w / 2 - this.w / 2 - 3);
        draw(ones, this.x - this.w / 2 + this.w / 2 + 3);
      } else {
        draw(ones, this.x - this.w / 2);
      }
    },
  };

  const bird = {
    animation: [
      { imgX: 276, imgY: 114 },
      { imgX: 276, imgY: 140 },
      { imgX: 276, imgY: 166 },
      { imgX: 276, imgY: 140 },
    ],
    fr: 0,
    width: 34, height: 24,
    x: 50, y: 160, w: 34, h: 24,
    r: 12,
    fly: 5.25,
    gravity: 0.32,
    velocity: 0,
    rotation: 0,
    render() {
      const frameSprite = this.animation[this.fr];
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.drawImage(theme1, frameSprite.imgX, frameSprite.imgY, this.width, this.height, -this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    },
    flap() { this.velocity = -this.fly; },
    position() {
      if (frame % 4 === 0) this.fr = (this.fr + 1) % this.animation.length;

      this.velocity += this.gravity;
      this.y += this.velocity;

      if (this.velocity <= this.fly) this.rotation = -15 * DEG;
      else if (this.velocity >= this.fly + 2) { this.rotation = 70 * DEG; this.fr = 1; }
      else this.rotation = 0;

      if (this.y + this.h / 2 >= H - ground.h) {
        this.y = H - ground.h - this.h / 2;
        this.fr = 2;
        this.rotation = 70 * DEG;
        endGame('CRASHED', SFX_FALL);
      }
      if (this.y - this.h / 2 <= 0) this.y = this.r;
    },
  };

  function endGame(message, sfx) {
    if (ended) return;
    ended = true;
    sfx.play();
    api.burst(bird.x, bird.y, '#ff0', 18, { speed: 130, life: 0.5 });
    api.shake(6, 0.25);
    api.gameOver(message);
  }

  input.onPress('A', () => {
    if (ended) return;
    bird.flap();
    SFX_FLAP.currentTime = 0;
    SFX_FLAP.play();
  });

  // Original game logic assumes a fixed 60Hz step (frame++ per tick). Our
  // engine drives update(dt) via requestAnimationFrame, which fires at the
  // display's native refresh rate (can be 120Hz/144Hz) — running the
  // frame-based physics directly off rAF would make it 2x+ too fast on those
  // screens. Sub-step at a fixed 1/60s tick instead, however often rAF fires.
  const FIXED_DT = 1 / 60;
  let acc = 0;

  function update(dt) {
    acc += dt;
    while (acc >= FIXED_DT) {
      bird.position();
      bg.position();
      pipes.position();
      ground.position();
      frame++;
      acc -= FIXED_DT;
    }
  }

  function render(ctx) {
    ctx.fillStyle = '#00bbc4';
    ctx.fillRect(0, 0, W, H);
    bg.render();
    pipes.render();
    ground.render();
    score.render();
    bird.render();
  }

  return { update, render };
}

export default { id: 'flappy', name: 'Flappy Bird', init };
