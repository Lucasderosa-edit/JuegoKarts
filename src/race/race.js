import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Track } from '../track/track.js';
import { Kart } from '../kart/kart.js';
import { ChaseCamera } from '../kart/chaseCamera.js';
import { Particles } from '../fx/particles.js';
import { setupEnvironment } from './environment.js';
import { RaceProgress } from './progress.js';
import { Hud } from '../ui/hud.js';
import { formatTime } from '../ui/format.js';
import { CHARACTERS, getCharacter, physicsStats } from '../kart/characters.js';
import { AIDriver } from '../ai/aiDriver.js';
import { resolveKartCollisions } from '../kart/collisions.js';
import { ItemManager } from '../items/itemManager.js';

const NO_INPUT = { throttle: 0, brake: 0, steer: 0, drift: false, item: false, itemPressed: false };

// Una carrera: pista, karts, cámaras y reglas.
export class Race {
  constructor({ renderer, trackDef, quality, players, uiRoot, rivalCount }) {
    this.renderer = renderer;
    this.quality = quality;
    this.scene = new THREE.Scene();
    this.track = new Track(trackDef, quality);
    this.scene.add(this.track.group);
    this.env = setupEnvironment(this.scene, trackDef.theme, quality);
    this.particles = new Particles(this.scene);
    this.particles.density = quality.particles;

    this.karts = [];
    this.players = [];
    this.ais = [];

    // Lugares de largada: los jugadores atrás, los rivales adelante
    const total = players.length + (rivalCount ?? CONFIG.ai.count);
    const playerSlots = players.length === 1 ? [Math.min(CONFIG.race.playerGridSlot, total - 1)] : players.map((_, i) => total - players.length + i);
    const freeSlots = [];
    for (let i = 0; i < total; i++) if (!playerSlots.includes(i)) freeSlots.push(i);

    players.forEach((p, idx) => {
      const character = getCharacter(p.characterId);
      const kart = this.addKart(character, playerSlots[idx]);
      kart.isPlayer = true;
      const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.1, quality.drawDistance + 200);
      const chase = new ChaseCamera(camera);
      chase.snap(kart);
      const hud = new Hud(uiRoot);
      this.players.push({ kart, controls: p.controls, readInput: p.readInput, camera, chase, hud, throttleSince: null, autopilot: null });
    });

    // Rivales: los personajes que no eligieron los jugadores
    const taken = new Set(players.map((p) => p.characterId));
    const rivals = CHARACTERS.filter((c) => !taken.has(c.id)).slice(0, freeSlots.length);
    const ai = CONFIG.ai;
    // Habilidades repartidas entre los rivales, en orden variado según la pista
    const skills = rivals.map((_, i) => ai.skillMax - (ai.skillMax - ai.skillMin) * (i / Math.max(1, rivals.length - 1)));
    const shift = trackDef.id.length;
    rivals.forEach((character, i) => {
      const skill = skills[(i * 3 + shift) % skills.length];
      const kart = this.addKart(character, freeSlots[i]);
      const driver = new AIDriver(kart, this.track, { skill, seed: 17 + i * 31 });
      driver.controls = { throttle: 0, brake: 0, steer: 0, drift: false, item: false, itemPressed: false };
      driver.baseSkill = skill;
      kart.ai = driver;
      this.ais.push(driver);
    });

    // Eventos para el audio y los efectos
    this.listeners = {};
    this.track.onWallHit = (kart, strength, x, z) => {
      this.sparks(x, z, Math.min(14, 3 + strength), '#ffe08a');
      this.emit('wall', { kart, strength });
    };

    for (const p of this.players) p.hud.setupMinimap(this.track.path, this.karts, p.kart);

    this.items = new ItemManager(this);
    for (const d of this.ais) d.items = this.items;

    this.state = 'countdown';
    this.countdown = CONFIG.race.countdownSeconds;
    this.raceTime = 0;
    this.time = 0;
    this._lastCount = null;
    this.onFinish = null;
  }

  addKart(character, slotIndex) {
    const kart = new Kart({ colors: character.kart, stats: physicsStats(character), name: character.name, particles: this.particles, characterId: character.id });
    kart.character = character;
    const slot = this.track.gridSlot(slotIndex);
    kart.setPose(slot.x, slot.z, slot.yaw);
    kart.progress = new RaceProgress(this.track.path);
    this.track.applyToKart(kart);
    kart.progress.update(kart.trackDistance, 0);
    this.scene.add(kart.object);
    this.karts.push(kart);
    kart.rank = this.karts.length;
    return kart;
  }

  update(dt) {
    this.time += dt;
    for (const pl of this.players) pl.readInput(pl.controls);

    if (this.state === 'countdown') {
      this.updateCountdown(dt);
    } else {
      this.raceTime += dt;
    }

    const racing = this.state !== 'countdown';
    for (const pl of this.players) {
      if (pl.autopilot) {
        pl.autopilot.update(dt, pl.autopilot.controls);
        this.items.updateAI(pl.autopilot, dt);
        pl.kart.update(dt, pl.autopilot.controls);
      } else {
        if (racing && pl.controls.itemPressed) this.items.use(pl.kart);
        pl.kart.update(dt, racing ? pl.controls : NO_INPUT);
      }
    }
    this.updateRubberBand();
    for (const d of this.ais) {
      if (racing) {
        d.update(dt, d.controls);
        this.items.updateAI(d, dt);
      }
      d.kart.update(dt, racing ? d.controls : NO_INPUT);
    }
    if (racing) this.items.update(dt);
    this.track.update(dt, racing ? this : null);
    resolveKartCollisions(this.karts, (a, b, strength, x, z) => {
      if (strength > 0.15) this.sparks(x, z, Math.round(4 + strength * 10), '#ffffff');
      this.emit('bump', { a, b, strength });
    });
    for (const k of this.karts) {
      this.track.applyToKart(k);
      if (racing) this.handleProgress(k, k.progress.update(k.trackDistance, this.raceTime));
    }
    this.updateRanks();
  }

  on(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }

  emit(type, data) {
    for (const fn of this.listeners[type] || []) fn(data);
  }

  burst(x, y, z, colors, n) {
    for (let i = 0; i < n; i++) {
      this.particles.emit(x, y, z, (Math.random() - 0.5) * 9, 1 + Math.random() * 5, (Math.random() - 0.5) * 9,
        colors[i % colors.length], { life: 0.4 + Math.random() * 0.3, size: 0.22, gravity: 10, drag: 2 });
    }
  }

  sparks(x, z, n, color) {
    for (let i = 0; i < n; i++) {
      this.particles.emit(x, 0.6, z, (Math.random() - 0.5) * 8, 2 + Math.random() * 4, (Math.random() - 0.5) * 8, color,
        { life: 0.3 + Math.random() * 0.2, size: 0.14, gravity: 14, drag: 2 });
    }
  }

  // Posiciones en tiempo real: los que terminaron por tiempo, el resto por distancia
  updateRanks() {
    const sorted = [...this.karts].sort((a, b) => {
      const pa = a.progress, pb = b.progress;
      if (pa.finished && pb.finished) return pa.finishTime - pb.finishTime;
      if (pa.finished) return -1;
      if (pb.finished) return 1;
      return pb.raceDistance - pa.raceDistance;
    });
    sorted.forEach((k, i) => { k.rank = i + 1; });
    this.ranking = sorted;
  }

  // Resultados finales (los que no llegaron reciben un tiempo estimado)
  getResults() {
    const total = this.track.path.length * CONFIG.race.laps;
    const rows = this.karts.map((k) => {
      const p = k.progress;
      if (p.finished) return { kart: k, time: p.finishTime, estimated: false };
      const done = Math.max(1, p.raceDistance);
      const avg = Math.max(12, done / Math.max(1, this.raceTime));
      return { kart: k, time: this.raceTime + (total - done) / avg, estimated: true };
    });
    rows.sort((a, b) => a.time - b.time);
    return rows.map((r, i) => ({ ...r, position: i + 1 }));
  }

  updateCountdown(dt) {
    const prev = this.countdown;
    this.countdown -= dt;
    const shown = Math.ceil(this.countdown);
    if (shown !== this._lastCount && shown > 0) {
      this._lastCount = shown;
      for (const pl of this.players) pl.hud.showCountdown(shown);
      this.onCountdownTick?.(shown);
    }
    // Turbo de largada: acelerar en la ventana justa antes del ¡YA!
    for (const pl of this.players) {
      if (pl.controls.throttle > 0) { if (pl.throttleSince === null) pl.throttleSince = this.countdown; } else pl.throttleSince = null;
    }
    if (this.countdown <= 0 && prev > 0) {
      this.state = 'racing';
      this.raceTime = -this.countdown;
      for (const pl of this.players) {
        pl.hud.showCountdown('¡YA!', true);
        if (pl.throttleSince !== null && pl.throttleSince <= CONFIG.race.startBoostWindow) pl.kart.boost(CONFIG.race.startBoostDuration);
      }
      this.onCountdownTick?.(0);
    }
  }

  // Ajusta la velocidad de los rivales según la distancia al mejor jugador
  updateRubberBand() {
    const rb = CONFIG.ai.rubberBand;
    let best = -Infinity;
    for (const p of this.players) best = Math.max(best, p.kart.progress.raceDistance);
    for (const d of this.ais) {
      const diff = d.kart.progress.raceDistance - best;
      let f = 1;
      if (diff > 0) f = 1 - (1 - rb.slowdown) * Math.min(1, diff / rb.aheadDistance);
      else f = 1 + (rb.speedup - 1) * Math.min(1, -diff / rb.behindDistance);
      d.kart.speedFactor = d.baseSkill * f;
    }
  }

  handleProgress(kart, event) {
    if (!event) return;
    const pl = this.players.find((p) => p.kart === kart);
    if (event === 'lap' && pl) {
      const p = kart.progress;
      const last = p.lapTimes[p.lapTimes.length - 1];
      pl.hud.showMessage(p.lap === p.laps ? `¡ÚLTIMA VUELTA!<br><small>${formatTime(last)}</small>` : `VUELTA ${p.lap}<br><small>${formatTime(last)}</small>`);
    }
    if (event === 'finish') {
      if (pl) {
        pl.hud.showMessage('¡LLEGADA!');
        // Al terminar, la computadora sigue manejando el kart del jugador
        pl.autopilot = new AIDriver(kart, this.track, { seed: 5 });
        pl.autopilot.items = this.items;
        pl.autopilot.controls = { ...NO_INPUT };
      }
      if (this.players.every((p) => p.kart.progress.finished)) {
        this.state = 'finished';
        this.onFinish?.(this);
      }
    }
  }

  render(frameDt) {
    for (const k of this.karts) k.syncObject();
    this.particles.update(frameDt);
    const r = this.renderer;
    const w = r.domElement.clientWidth, h = r.domElement.clientHeight;
    const pl = this.players[0];
    pl.chase.update(pl.kart, frameDt);
    pl.camera.aspect = w / h;
    pl.camera.updateProjectionMatrix();
    this.env.follow(pl.kart.position);
    this.track.animate(frameDt, pl.kart.position);
    r.render(this.scene, pl.camera);
    for (const p of this.players) p.hud.update({ kart: p.kart, progress: p.kart.progress, raceTime: Math.max(0, this.raceTime), rank: p.kart.rank || this.karts.length, total: this.karts.length });
  }

  dispose() {
    this.items.dispose();
    for (const p of this.players) p.hud.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}
