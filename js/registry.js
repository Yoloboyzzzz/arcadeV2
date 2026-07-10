// registry.js — list of all games. Add one line here per new game/js/games/*.js file.

export const GAMES = [
  { id: 'snake', name: 'Snake', module: './js/games/snake.js' },
  { id: 'pong', name: 'Pong', module: './js/games/pong.js' },
  { id: 'arkanoid', name: 'Arkanoid', module: './js/games/arkanoid.js' },
  { id: 'tetris', name: 'Tetris', module: './js/games/tetris.js' },
  { id: 'invaders', name: 'Space Invaders', module: './js/games/invaders.js' },
  { id: 'flappy', name: 'Flappy Bird', module: './js/games/flappy.js' },
  { id: 'crossy', name: 'Crossy Road', path: './crossy_roads/index.html' },
  { id: 'pacman', name: 'Pacman', path: './pacman/index.html' },
  { id: '2048', name: '2048', module: './js/games/2048.js' },
  { id: 'doodlejump', name: 'Doodle Jump', path: './doodle-jump/index.html' },
  { id: 'missile', name: 'Missile Command', module: './js/games/missile.js' },
  { id: 'asteroids', name: 'Asteroids', module: './js/games/asteroids.js' },
  { id: 'runner', name: 'Runner', module: './js/games/runner.js' },
];

export function getGame(id) {
  return GAMES.find((g) => g.id === id);
}
