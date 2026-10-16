import { CONFIG } from './config.js';
import { GameLoop } from './core/loop.js';
import { createRenderer } from './core/renderer.js';
import { KEY_BINDINGS, createControlState, readKeyboard, endInputFrame, wasPressed } from './core/input.js';
import { QUALITY_PRESETS } from './core/quality.js';
import { settings, onSettingsChange } from './core/settings.js';
import { Race } from './race/race.js';
import { getTrack } from './track/tracks/index.js';
import { getCharacter } from './kart/characters.js';
import { showResults } from './ui/results.js';
import { formatTime } from './ui/format.js';
import * as screens from './ui/screens.js';
import { AudioEngine } from './audio/audio.js';
import { attachRaceAudio } from './audio/raceAudio.js';
import { getPads, readGamepad, readMenuPad, padJustPressed } from './core/gamepad.js';
import { TouchControls, isTouchDevice } from './ui/touchControls.js';

// Controla el flujo del juego: menús, carrera, pausa y resultados.
export class App {
  constructor() {
    this.container = document.getElementById('game');
    this.ui = document.getElementById('ui');
    this.hudLayer = document.createElement('div');
    this.screenLayer = document.createElement('div');
    this.hudLayer.className = 'layer';
    this.screenLayer.className = 'layer';
    this.ui.append(this.hudLayer, this.screenLayer);
    this.fadeEl = document.createElement('div');
    this.fadeEl.className = 'fade';
    document.body.appendChild(this.fadeEl);

    const { renderer } = createRenderer(this.container);
    this.renderer = renderer;
    this.applyQuality();
    onSettingsChange(() => { this.applyQuality(); this.updateFpsLabel(); });

    this.fpsLabel = document.createElement('div');
    this.fpsLabel.className = 'debug-fps';
    this.ui.appendChild(this.fpsLabel);
    this.updateFpsLabel();

    this.audio = new AudioEngine();
    this.raceAudio = null;
    // Sonido al tocar cualquier botón de los menús
    this.ui.addEventListener('click', (e) => { if (e.target.closest('button')) this.audio.sfx('click'); });

    this.race = null;
    this.paused = false;
    this.screen = null;
    this.lastConfig = null;

    this.loop = new GameLoop({
      hz: CONFIG.physicsHz,
      maxSteps: CONFIG.maxStepsPerFrame,
      update: (dt) => this.update(dt),
      render: (dt) => this.render(dt),
    });
    this.loop.start();

    window.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });

    this.showMainMenu();
  }

  applyQuality() {
    const q = QUALITY_PRESETS[settings.quality] || QUALITY_PRESETS.media;
    this.quality = q;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatio));
    this.renderer.shadowMap.enabled = q.shadows;
  }

  updateFpsLabel() {
    this.fpsLabel.style.display = settings.showFps ? '' : 'none';
  }

  // --- Pantallas ---
  setScreen(el) {
    if (this.screen) this.screen.remove();
    this.screen = el;
    if (el) {
      el.classList.add('enter');
      this.screenLayer.appendChild(el);
      setTimeout(() => (el.focusFirst ? el.focusFirst() : el.querySelector('button')?.focus()), 30);
    }
  }

  async fade(fn) {
    this.fadeEl.classList.add('on');
    await new Promise((r) => setTimeout(r, 280));
    await fn();
    requestAnimationFrame(() => this.fadeEl.classList.remove('on'));
  }

  showMainMenu() {
    this.endRace();
    this.audio.playMusic('menu');
    this.setScreen(screens.mainMenu({
      onSolo: () => this.chooseCharacters(1),
      onDuo: () => this.chooseCharacters(2),
      onOptions: () => this.setScreen(screens.optionsScreen({ onBack: () => this.showMainMenu() })),
      onHowTo: () => this.setScreen(screens.howToScreen({ onBack: () => this.showMainMenu() })),
    }));
    this.menuBack = null;
  }

  chooseCharacters(players) {
    const picks = [];
    const next = () => {
      const n = picks.length;
      this.setScreen(screens.characterSelect({
        title: players === 1 ? 'Elegí tu personaje' : `Jugador ${n + 1}: elegí personaje`,
        hint: players === 1 ? 'Cada uno tiene sus fortalezas' : (n === 0 ? 'Jugador 1 maneja con W A S D' : 'Jugador 2 maneja con las flechas'),
        taken: picks,
        onPick: (id) => {
          picks.push(id);
          if (picks.length < players) next();
          else this.chooseTrack({ players, characters: picks });
        },
        onBack: () => (n === 0 ? this.showMainMenu() : (picks.pop(), next())),
      }));
      this.menuBack = () => (n === 0 ? this.showMainMenu() : (picks.pop(), next()));
    };
    next();
  }

  chooseTrack(config) {
    this.audio.playMusic('menu');
    this.setScreen(screens.trackSelect({
      bestTimes: this.bestTimes?.() || {},
      onPick: (trackId) => this.startRace({ ...config, trackId }),
      onBack: () => this.chooseCharacters(config.players),
    }));
    this.menuBack = () => this.chooseCharacters(config.players);
  }

  // --- Carrera ---
  startRace(config) {
    this.lastConfig = config;
    this.fade(async () => {
      this.endRace();
      this.setScreen(screens.loadingScreen());
      await new Promise((r) => setTimeout(r, 30));
      const trackDef = getTrack(config.trackId);
      const players = config.characters.map((id, i) => ({
        characterId: id,
        controls: createControlState(),
        readInput: this.makeInputReader(config.players === 1 ? 'solo' : `p${i + 1}`, i),
      }));
      this.race = new Race({
        renderer: this.renderer,
        trackDef,
        quality: this.quality,
        uiRoot: this.hudLayer,
        players,
        rivalCount: CONFIG.ai.count + 1 - config.players,
      });
      this.race.onFinish = (race) => setTimeout(() => this.showRaceResults(race), 2500);
      this.raceAudio = attachRaceAudio(this.race, this.audio);
      if (config.players === 1 && isTouchDevice()) {
        this.touch = new TouchControls(this.hudLayer, { onPause: () => this.pause() });
        document.body.classList.add('touch');
      }
      this.audio.playMusic(trackDef.id);
      this.audio.setMusicTempo(1);
      this.onRaceCreated?.(this.race);
      this.paused = false;
      this.setScreen(null);
    });
  }

  // Cada jugador combina teclado, joystick y (en 1 jugador) botones táctiles
  makeInputReader(binding, index) {
    return (c) => {
      readKeyboard(KEY_BINDINGS[binding], c);
      const pads = getPads();
      if (binding === 'solo') for (const pad of pads) readGamepad(pad, c);
      else readGamepad(pads[index], c);
      if (binding === 'solo' && this.touch) this.touch.read(c);
    };
  }

  endRace() {
    this.results?.close();
    this.results = null;
    this.raceAudio?.dispose();
    this.raceAudio = null;
    this.touch?.dispose();
    this.touch = null;
    document.body.classList.remove('touch');
    if (this.race) {
      this.onRaceEnded?.(this.race);
      this.race.dispose();
      this.race = null;
    }
    this.paused = false;
  }

  showRaceResults(race) {
    if (race !== this.race || this.results) return;
    const rows = race.getResults();
    const humans = race.players.map((p) => p.kart);
    const best = rows.find((x) => humans.includes(x.kart));
    const solo = humans.length === 1;
    const winnerChar = best.kart.character;
    const videoKind = best.position <= 3 ? 'victory' : 'idle';
    const media = winnerChar.playable
      ? `<video autoplay muted loop playsinline src="${screens.asset(`video/char_${winnerChar.id}_${videoKind}.mp4`)}"></video>` : '';
    const label = (k) => (solo ? 'vos' : `J${humans.indexOf(k) + 1}`);
    let title;
    if (solo) title = best.position === 1 ? '¡GANASTE!' : `Llegaste ${best.position}.º`;
    else title = `¡Ganó el Jugador ${humans.indexOf(best.kart) + 1}!`;
    const bestLap = Math.min(...humans.flatMap((k) => k.progress.lapTimes));
    this.results = showResults(this.screenLayer, {
      title,
      subtitle: `${race.track.def.name} · Mejor vuelta ${formatTime(bestLap)}`,
      media,
      rows: rows.map((x) => ({
        position: x.position, name: x.kart.name, color: x.kart.character.kart.body, time: x.time, estimated: x.estimated,
        me: humans.includes(x.kart), playerLabel: label(x.kart),
      })),
      buttons: [
        { label: 'Correr de nuevo', onClick: () => this.startRace(this.lastConfig) },
        { label: 'Elegir pista', secondary: true, onClick: () => this.fade(() => { this.endRace(); this.chooseTrack(this.lastConfig); }) },
        { label: 'Menú principal', secondary: true, onClick: () => this.fade(() => this.showMainMenu()) },
      ],
    });
    this.onResults?.(race, rows);
  }

  pause() {
    if (!this.race || this.paused || this.results || this.race.state === 'finished') return;
    this.paused = true;
    this.audio.duck(true);
    this.onPause?.(true);
    this.showPauseMenu();
  }

  showPauseMenu() {
    this.setScreen(screens.pauseScreen({
      onResume: () => this.resume(),
      onRestart: () => this.startRace(this.lastConfig),
      onOptions: () => this.setScreen(screens.optionsScreen({ inRace: true, onBack: () => this.showPauseMenu() })),
      onQuit: () => this.fade(() => this.showMainMenu()),
    }));
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.audio.duck(false);
    this.onPause?.(false);
    this.setScreen(null);
  }

  onKey(e) {
    const inRace = this.race && !this.results;
    if (e.code === 'Escape' || (e.code === 'KeyP' && inRace)) {
      if (inRace) { if (this.paused) this.resume(); else this.pause(); }
      else if (this.menuBack) this.menuBack();
      return;
    }
    // Navegación de menús con flechas
    if (this.screen || this.results) {
      const root = this.results ? this.results.el : this.screen;
      const nav = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.code];
      if (nav) {
        const items = [...root.querySelectorAll('button:not([disabled]), input')];
        if (!items.length) return;
        const i = items.indexOf(document.activeElement);
        if (document.activeElement?.type === 'range' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) return;
        e.preventDefault();
        items[(i + nav + items.length) % items.length].focus();
      }
    }
  }

  // Joystick en los menús y botón Start para pausar
  pollGamepadUI(dt) {
    if (!getPads().length) return;
    const nav = readMenuPad(dt);
    const inRace = this.race && !this.results;
    if (nav.start && inRace) { if (this.paused) this.resume(); else this.pause(); return; }
    if (!(this.screen || this.results)) return;
    const root = this.results ? this.results.el : this.screen;
    if (nav.move) {
      const items = [...root.querySelectorAll('button:not([disabled])')];
      if (items.length) {
        const i = items.indexOf(document.activeElement);
        items[(i + nav.move + items.length) % items.length].focus();
      }
    }
    if (nav.accept) {
      const f = document.activeElement;
      if (f && root.contains(f) && f.tagName === 'BUTTON') f.click();
      else root.querySelector('button:not([disabled])')?.focus();
    }
    if (nav.back) {
      if (inRace && this.paused) this.resume();
      else if (this.menuBack && !this.race) this.menuBack();
    }
  }

  // --- Loop ---
  update(dt) {
    if (this.race && !this.paused) this.race.update(dt);
    endInputFrame();
  }

  render(dt) {
    if (this.race) {
      this.race.render(this.paused ? 0 : dt);
      this.raceAudio?.update(dt, this.paused);
    } else {
      this.renderer.clear();
    }
    this.pollGamepadUI(dt);
    if (settings.showFps) this.fpsLabel.textContent = `${this.loop.fps} FPS`;
  }
}

export { wasPressed, getCharacter, padJustPressed };
