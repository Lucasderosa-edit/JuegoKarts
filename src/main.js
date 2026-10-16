import { CONFIG } from './config.js';
import { GameLoop } from './core/loop.js';
import { createRenderer } from './core/renderer.js';
import { KEY_BINDINGS, createControlState, readKeyboard, endInputFrame } from './core/input.js';
import { QUALITY_PRESETS, defaultQualityId } from './core/quality.js';
import { Race } from './race/race.js';
import pradera from './track/tracks/pradera.js';
import { showResults } from './ui/results.js';
import { formatTime } from './ui/format.js';

const container = document.getElementById('game');
const ui = document.getElementById('ui');
const { renderer } = createRenderer(container);
const quality = QUALITY_PRESETS[defaultQualityId()];
renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
renderer.shadowMap.enabled = quality.shadows;

let race;
let results = null;

function startRace() {
  results?.close();
  results = null;
  if (race) race.dispose();
  race = new Race({
  renderer,
  trackDef: pradera,
  quality,
  uiRoot: ui,
  players: [{
    characterId: 'chispa',
    controls: createControlState(),
    readInput: (c) => readKeyboard(KEY_BINDINGS.solo, c),
  }],
  });
  race.onFinish = () => setTimeout(() => showRaceResults(race), 2500);
}

function showRaceResults(r) {
  if (r !== race || results) return;
  const rows = r.getResults();
  const me = rows.find((x) => x.kart.isPlayer);
  results = showResults(ui, {
    title: me.position === 1 ? '¡GANASTE!' : `Llegaste ${me.position}.º`,
    subtitle: `${r.track.def.name} · Mejor vuelta ${formatTime(Math.min(...me.kart.progress.lapTimes))}`,
    rows: rows.map((x) => ({ position: x.position, name: x.kart.name, color: x.kart.character.kart.body, time: x.time, estimated: x.estimated, me: x.kart.isPlayer })),
    buttons: [{ label: 'Correr de nuevo', onClick: startRace }],
  });
}
startRace();

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
window.__game = { loop, get race() { return race; }, get kart() { return race.players[0].kart; }, startRace };
