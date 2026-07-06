# Neon ArcadeV2

A browser-based arcade of classic games, built to be controlled by a **6-button
ESP32 Bluetooth controller** (Left, Right, Up, Down, Action 1, Action 2), and
playable straight from a phone slotted into a mini arcade cabinet. Zero build
step — plain HTML/CSS/JS, deployable to GitHub Pages as-is.

Also fully playable with a real keyboard or the on-screen touch d-pad, so it
works even without the ESP32 hardware.

## Play it

Open `index.html` via a local web server (ES modules need `http://`, not
`file://`):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Controls: Arrow keys (or WASD) to move, `Z` for Action 1, `X` for Action 2.
On a touchscreen, use the on-screen d-pad + A/B buttons in the bottom corners.

## Games included

Snake, Pong, Breakout, Tetris, Space Invaders, Flappy Bird, Frogger, 2048,
Doodle Jump, Missile Command, Asteroids, Runner.

To add a new one: drop a file in `js/games/`, add a line to `js/registry.js`.
Each game file default-exports `{ id, name, init(ctx, input, api) }` — see
`js/games/snake.js` for the simplest example. `input.isDown('A'|'B'|'LEFT'|...)`
and `input.onPress(btn, cb)` are the whole input API; `api.addScore()` /
`api.gameOver()` hook into the shared HUD in `js/engine.js`.

## The ESP32 controller

Firmware lives in `firmware/arcade_controller/arcade_controller.ino`. It makes
the ESP32 present itself as a **BLE HID keyboard** named `Arcade Pad` —
the simplest, most compatible option (works on iOS Safari and Android Chrome
identically, no in-page Bluetooth pairing code needed).

### Flashing

1. Arduino IDE → Boards Manager → install **esp32** (by Espressif Systems).
2. Library Manager → install **ESP32 BLE Keyboard** by T-vK.
3. Wire 6 buttons between the GPIOs below and GND (internal pull-ups used,
   no external resistors needed). Change pins in the sketch if your wiring
   differs.

   | Button   | GPIO |
   |----------|------|
   | Left     | 13   |
   | Right    | 12   |
   | Up       | 14   |
   | Down     | 27   |
   | Action 1 | 26   |
   | Action 2 | 25   |

4. Select your ESP32 board + port, upload `arcade_controller.ino`.

### Pairing

On the phone: Settings → Bluetooth → pair **"Arcade Pad"** like any keyboard.
Once paired, open the website — button presses arrive as key events, exactly
like a physical keyboard would.

### Key mapping contract

Firmware and website must agree on this mapping (defined in
`js/input.js` on the web side):

| Button   | Key sent | Logical input |
|----------|----------|---------------|
| Left     | Arrow Left  | LEFT  |
| Right    | Arrow Right | RIGHT |
| Up       | Arrow Up    | UP    |
| Down     | Arrow Down  | DOWN  |
| Action 1 | `z`         | A     |
| Action 2 | `x`         | B     |

## Deploying to GitHub Pages

```bash
git init
git add .
git commit -m "Initial arcade site"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` /
`root`**. The `.nojekyll` file is already included so GitHub doesn't run
Jekyll processing on the raw static files. Site goes live at:

```
https://<your-username>.github.io/<repo-name>/
```

All asset paths in the site are relative, so it works whether hosted at the
domain root or under a repo subpath.
