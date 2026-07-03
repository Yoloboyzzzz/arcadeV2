// input.js — single source of truth for controller input.
// Physical source is a BLE keyboard (ESP32) OR a real keyboard OR the on-screen
// touch d-pad. All three feed the same logical buttons: LEFT RIGHT UP DOWN A B.

const KEY_MAP = {
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  a: 'LEFT', A: 'LEFT',
  d: 'RIGHT', D: 'RIGHT',
  w: 'UP', W: 'UP',
  s: 'DOWN', S: 'DOWN',
  z: 'A', Z: 'A',
  x: 'B', X: 'B',
};

const BUTTONS = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'A', 'B'];

class InputManager {
  constructor() {
    this._down = Object.fromEntries(BUTTONS.map((b) => [b, false]));
    this._pressListeners = Object.fromEntries(BUTTONS.map((b) => [b, []]));
    this._releaseListeners = Object.fromEntries(BUTTONS.map((b) => [b, []]));
    this._anyInputListeners = [];

    window.addEventListener('keydown', (e) => this._handleKey(e, true));
    window.addEventListener('keyup', (e) => this._handleKey(e, false));

    this._buildTouchControls();
  }

  _handleKey(e, isDown) {
    const btn = KEY_MAP[e.key];
    if (!btn) return;
    // Stop arrow keys / space from scrolling the page.
    if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
    this._setButton(btn, isDown);
  }

  _setButton(btn, isDown) {
    const wasDown = this._down[btn];
    this._down[btn] = isDown;
    if (isDown && !wasDown) {
      this._pressListeners[btn].forEach((cb) => cb());
      this._anyInputListeners.forEach((cb) => cb());
    } else if (!isDown && wasDown) {
      this._releaseListeners[btn].forEach((cb) => cb());
    }
  }

  isDown(btn) {
    return !!this._down[btn];
  }

  onPress(btn, cb) {
    this._pressListeners[btn].push(cb);
  }

  onRelease(btn, cb) {
    this._releaseListeners[btn].push(cb);
  }

  onAnyInput(cb) {
    this._anyInputListeners.push(cb);
  }

  // Reset all held state — call on game transitions so a stuck key from the
  // previous screen doesn't leak into the next one.
  reset() {
    BUTTONS.forEach((b) => (this._down[b] = false));
  }

  _buildTouchControls() {
    const wrap = document.createElement('div');
    wrap.id = 'touch-controls';
    wrap.innerHTML = `
      <div class="tc-dpad">
        <button class="tc-btn tc-up" data-btn="UP" aria-label="Up">&#9650;</button>
        <button class="tc-btn tc-left" data-btn="LEFT" aria-label="Left">&#9664;</button>
        <button class="tc-btn tc-right" data-btn="RIGHT" aria-label="Right">&#9654;</button>
        <button class="tc-btn tc-down" data-btn="DOWN" aria-label="Down">&#9660;</button>
      </div>
      <div class="tc-actions">
        <button class="tc-btn tc-action tc-b" data-btn="B" aria-label="B">B</button>
        <button class="tc-btn tc-action tc-a" data-btn="A" aria-label="A">A</button>
      </div>
    `;
    document.body.appendChild(wrap);

    wrap.querySelectorAll('.tc-btn').forEach((el) => {
      const btn = el.dataset.btn;
      const start = (e) => {
        e.preventDefault();
        this._setButton(btn, true);
        el.classList.add('active');
      };
      const end = (e) => {
        e.preventDefault();
        this._setButton(btn, false);
        el.classList.remove('active');
      };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    });
  }
}

export const input = new InputManager();
export { BUTTONS };
