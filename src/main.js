import { CONFIG } from './config.js';
import { GameLoop } from './core/loop.js';
import { createRenderer } from './core/renderer.js';
import { KEY_BINDINGS, createControlState, readKeyboard, endInputFrame } from './core/input.js';
import { QUALITY_PRESETS, defaultQualityId } from './core/quality.js';
import { Race } from './race/race.js';
import pradera from './track/tracks/pradera.js';

const container = document.getElementById('game');
const ui = document.getElementById('ui');
const { renderer } = createRenderer(container);
const quality = QUALITY_PRESETS[defaultQualityId()];
renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
renderer.shadowMap.enabled = quality.shadows;

const race = new Race({
  renderer,
  trackDef: pradera,
  quality,
  uiRoot: ui,
  players: [{
    name: 'Jugador',
    colors: { body: '#ffcc33', accent: '#e8483b' },
    controls: createControlState(),
    readInput: (c) => readKeyboard(KEY_BINDINGS.solo, c),
  }],
});

const fpsLabel = document.createElement('div');
fpsLabel.className = 'debug-fps';
ui.appendChild(fpsLabel);

const loop = new GameLoop({
  hz: CONFIG.physicsHz,
  maxSteps: CONFIG.maxStepsPerFrame,
  update(dt) {
    race.update(dt);
    endInputFrame();
  },
  render(frameDt) {
    race.render(frameDt);
    const k = race.players[0].kart;
    fpsLabel.textContent = `${loop.fps} FPS · ${Math.round(Math.abs(k.speed) * 3.6)} km/h`;
  },
});
loop.start();

// Acceso para pruebas automáticas
window.__game = { loop, race, get kart() { return race.players[0].kart; } };
