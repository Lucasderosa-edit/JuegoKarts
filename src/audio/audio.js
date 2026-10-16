// Audio generado por código (Web Audio API): efectos y música chiptune.
// No usa archivos externos, así que no hay problemas de derechos.

import { settings, onSettingsChange } from '../core/settings.js';

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI → Hz

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
    this.engines = [];
    this.music = null;
    // El navegador solo deja arrancar el audio después de una interacción
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    onSettingsChange(() => this.applyVolumes());
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      // Un compresor suave evita que se sature cuando suenan muchas cosas
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.ratio.value = 4;
      this.comp.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.comp);
      this.sfxGain.connect(this.comp);
      this.noiseBuffer = this.makeNoise();
      this.applyVolumes();
      if (this.pendingMusic) this.playMusic(this.pendingMusic);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(settings.musicVolume * 0.5, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(settings.sfxVolume * 0.9, t, 0.05);
  }

  makeNoise() {
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  get ready() {
    return this.ctx && this.ctx.state === 'running';
  }

  // --- Bloques básicos ---
  tone({ type = 'square', freq = 440, to = null, dur = 0.15, vol = 0.3, attack = 0.005, at = 0, dest = this.sfxGain, detune = 0 }) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + at;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.detune.value = detune;
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise({ dur = 0.2, vol = 0.3, filter = 'lowpass', freq = 1200, to = null, q = 1, at = 0, dest = this.sfxGain }) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + at;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // --- Efectos ---
  sfx(name, k = 1) {
    if (!this.ready || k <= 0.02) return;
    const v = (x) => x * k;
    switch (name) {
      case 'click': this.tone({ type: 'square', freq: 660, to: 990, dur: 0.06, vol: v(0.12) }); break;
      case 'count': this.tone({ type: 'square', freq: 440, dur: 0.22, vol: v(0.25) }); break;
      case 'go': this.tone({ type: 'square', freq: 880, dur: 0.5, vol: v(0.28) }); this.tone({ type: 'square', freq: 1320, dur: 0.5, vol: v(0.12), at: 0.02 }); break;
      case 'boost':
        this.noise({ dur: 0.6, vol: v(0.35), filter: 'bandpass', freq: 400, to: 3000, q: 2 });
        this.tone({ type: 'sawtooth', freq: 180, to: 520, dur: 0.45, vol: v(0.12) });
        break;
      case 'driftLevel': this.tone({ type: 'triangle', freq: 1200 + k * 0, to: 1800, dur: 0.12, vol: 0.18 }); break;
      case 'bump':
        this.noise({ dur: 0.18, vol: v(0.5), freq: 900, to: 200 });
        this.tone({ type: 'sine', freq: 140, to: 50, dur: 0.2, vol: v(0.5) });
        break;
      case 'wall':
        this.noise({ dur: 0.25, vol: v(0.45), freq: 1400, to: 300 });
        this.tone({ type: 'square', freq: 90, to: 45, dur: 0.15, vol: v(0.2) });
        break;
      case 'itemBox':
        [0, 4, 7, 12].forEach((n, i) => this.tone({ type: 'square', freq: NOTE(76 + n), dur: 0.08, vol: v(0.12), at: i * 0.045 }));
        break;
      case 'itemGot': this.tone({ type: 'triangle', freq: NOTE(84), dur: 0.25, vol: v(0.22) }); this.tone({ type: 'triangle', freq: NOTE(91), dur: 0.3, vol: v(0.16), at: 0.06 }); break;
      case 'roll': this.tone({ type: 'square', freq: NOTE(72 + Math.floor(Math.random() * 12)), dur: 0.04, vol: v(0.06) }); break;
      case 'projectile': this.tone({ type: 'sawtooth', freq: 1400, to: 300, dur: 0.3, vol: v(0.2) }); this.noise({ dur: 0.3, vol: v(0.15), filter: 'highpass', freq: 2000 }); break;
      case 'trap': this.tone({ type: 'sine', freq: 220, to: 90, dur: 0.35, vol: v(0.35) }); this.noise({ dur: 0.2, vol: v(0.15), freq: 500 }); break;
      case 'shield': [0, 4, 7, 11].forEach((n, i) => this.tone({ type: 'triangle', freq: NOTE(79 + n), dur: 0.5, vol: v(0.08), at: i * 0.03 })); break;
      case 'shieldBreak': this.noise({ dur: 0.4, vol: v(0.35), filter: 'highpass', freq: 3000 }); this.tone({ type: 'triangle', freq: NOTE(91), to: NOTE(72), dur: 0.35, vol: v(0.15) }); break;
      case 'hit':
        this.noise({ dur: 0.35, vol: v(0.5), freq: 1600, to: 200 });
        this.tone({ type: 'square', freq: 600, to: 120, dur: 0.6, vol: v(0.18) });
        break;
      case 'splash': this.noise({ dur: 0.6, vol: v(0.4), filter: 'bandpass', freq: 800, to: 300, q: 0.8 }); break;
      case 'lap': [0, 4, 7].forEach((n, i) => this.tone({ type: 'square', freq: NOTE(72 + n), dur: 0.16, vol: v(0.16), at: i * 0.09 })); break;
      case 'finalLap': [0, 4, 7, 12, 7, 12].forEach((n, i) => this.tone({ type: 'square', freq: NOTE(72 + n), dur: 0.14, vol: v(0.16), at: i * 0.1 })); break;
      case 'finish':
        [0, 4, 7, 12].forEach((n, i) => this.tone({ type: 'square', freq: NOTE(72 + n), dur: 0.2, vol: v(0.18), at: i * 0.12 }));
        this.tone({ type: 'square', freq: NOTE(84), dur: 0.9, vol: v(0.18), at: 0.5 });
        this.tone({ type: 'triangle', freq: NOTE(60), dur: 0.9, vol: v(0.2), at: 0.5 });
        break;
      default: break;
    }
  }

  // --- Motor (sonido continuo por jugador) ---
  createEngine(pan = 0) {
    if (!this.ctx) return null;
    const c = this.ctx;
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    o2.detune.value = 7;
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 3;
    const g = c.createGain();
    g.gain.value = 0;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    o1.connect(f); o2.connect(f); f.connect(g);
    if (p) { p.pan.value = pan; g.connect(p).connect(this.sfxGain); } else g.connect(this.sfxGain);
    // Derrape: ruido filtrado
    const ns = c.createBufferSource();
    ns.buffer = this.noiseBuffer; ns.loop = true;
    const nf = c.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 1500; nf.Q.value = 1.5;
    const ng = c.createGain();
    ng.gain.value = 0;
    ns.connect(nf).connect(ng);
    if (p) ng.connect(p); else ng.connect(this.sfxGain);
    o1.start(); o2.start(); ns.start();
    const e = { o1, o2, f, g, ng, nf, ns, lastLevel: 0, lastBoost: 0 };
    this.engines.push(e);
    return e;
  }

  updateEngine(e, kart, active = true) {
    if (!e || !this.ctx) return;
    const t = this.ctx.currentTime;
    const sp = Math.abs(kart.speed);
    const boost = kart.boostTime > 0 ? 1 : 0;
    const base = 48 + sp * 3.1 + boost * 22;
    e.o1.frequency.setTargetAtTime(base, t, 0.05);
    e.o2.frequency.setTargetAtTime(base * 0.5, t, 0.05);
    e.f.frequency.setTargetAtTime(380 + sp * 38 + boost * 600, t, 0.08);
    e.g.gain.setTargetAtTime(active ? 0.09 + Math.min(1, sp / 30) * 0.08 : 0, t, 0.08);
    const drifting = kart.drifting && kart.hopY === 0;
    e.ng.gain.setTargetAtTime(active && drifting ? 0.09 : (active && kart.surface.offroad && sp > 5 ? 0.04 : 0), t, 0.05);
    e.nf.frequency.setTargetAtTime(kart.surface.offroad ? 500 : 1300 + kart.driftLevel * 400, t, 0.05);
    if (active && kart.driftLevel > e.lastLevel) this.sfx('driftLevel');
    e.lastLevel = kart.driftLevel;
    if (active && kart.boostTime > 0 && e.lastBoost <= 0) this.sfx('boost');
    e.lastBoost = kart.boostTime;
  }

  stopEngines() {
    for (const e of this.engines) {
      try { e.o1.stop(); e.o2.stop(); e.ns.stop(); } catch { /* ya detenido */ }
      e.g.disconnect(); e.ng.disconnect();
    }
    this.engines = [];
  }

  // --- Música ---
  playMusic(theme) {
    this.pendingMusic = theme;
    if (!this.ctx) return;
    if (this.music?.theme === theme) return;
    this.stopMusic();
    this.music = new Sequencer(this, theme);
  }

  setMusicTempo(mult) {
    if (this.music) this.music.tempoMult = mult;
  }

  stopMusic() {
    this.music?.stop();
    this.music = null;
  }

  duck(on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime((on ? 0.35 : 1) * settings.musicVolume * 0.5, t, 0.1);
    for (const e of this.engines) if (on) { e.g.gain.setTargetAtTime(0, t, 0.05); e.ng.gain.setTargetAtTime(0, t, 0.05); }
  }
}

// Temas musicales: tonalidad, tempo, escala y semilla de la melodía
const THEMES = {
  menu: { root: 60, bpm: 112, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 4], seed: 3, swing: 0.08 },
  pradera: { root: 62, bpm: 138, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], seed: 11 },
  costa: { root: 65, bpm: 128, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 3], seed: 21, swing: 0.12 },
  neon: { root: 57, bpm: 144, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], seed: 33 },
  cumbre: { root: 60, bpm: 132, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], seed: 41 },
  results: { root: 60, bpm: 120, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 0], seed: 7 },
};

// Secuenciador simple: bajo, melodía, acordes y batería
class Sequencer {
  constructor(audio, themeId) {
    this.audio = audio;
    this.theme = themeId;
    this.t = THEMES[themeId] || THEMES.menu;
    this.tempoMult = 1;
    this.step = 0;
    this.next = audio.ctx.currentTime + 0.1;
    this.rand = mulberry(this.t.seed);
    this.melody = this.makeMelody();
    this.timer = setInterval(() => this.schedule(), 25);
  }

  makeMelody() {
    // 4 compases de 16 semicorcheas; -1 = silencio
    const out = [];
    const sc = this.t.scale;
    let idx = 2;
    for (let i = 0; i < 64; i++) {
      if (i % 2 === 1 && this.rand() < 0.55) { out.push(-1); continue; }
      if (this.rand() < 0.18) { out.push(-1); continue; }
      idx = Math.max(0, Math.min(sc.length * 2 - 1, idx + Math.floor(this.rand() * 5) - 2));
      out.push(sc[idx % sc.length] + 12 * Math.floor(idx / sc.length));
    }
    // La segunda mitad repite la primera con una variación al final (más pegadiza)
    for (let i = 32; i < 56; i++) out[i] = out[i - 32];
    return out;
  }

  schedule() {
    const ctx = this.audio.ctx;
    const spb = 60 / (this.t.bpm * this.tempoMult) / 4; // segundos por semicorchea
    while (this.next < ctx.currentTime + 0.12) {
      this.play(this.step, this.next - ctx.currentTime, spb);
      this.step = (this.step + 1) % 64;
      const swing = this.step % 2 ? (this.t.swing || 0) : -(this.t.swing || 0);
      this.next += spb * (1 + swing);
    }
  }

  play(step, at, spb) {
    const a = this.audio;
    const dest = a.musicGain;
    const bar = Math.floor(step / 16);
    const sc = this.t.scale;
    const chordRoot = this.t.root + (sc[this.t.prog[bar] % sc.length] ?? 0) - 12;
    const beat = step % 16;
    // Bajo
    if (beat % 4 === 0 || beat === 10) a.tone({ type: 'triangle', freq: NOTE(chordRoot - 12 + (beat === 10 ? 7 : 0)), dur: spb * 1.8, vol: 0.5, at, dest });
    // Acorde suave en los tiempos 1 y 3
    if (beat === 0 || beat === 8) {
      for (const n of [0, 4, 7]) a.tone({ type: 'sine', freq: NOTE(chordRoot + 12 + n), dur: spb * 7, vol: 0.06, attack: 0.04, at, dest });
    }
    // Melodía
    const m = this.melody[step];
    if (m >= 0) a.tone({ type: 'square', freq: NOTE(this.t.root + 12 + m), dur: spb * 1.4, vol: 0.12, at, dest, detune: 4 });
    // Batería
    if (beat % 8 === 0) a.tone({ type: 'sine', freq: 150, to: 45, dur: 0.18, vol: 0.7, at, dest });
    if (beat % 8 === 4) a.noise({ dur: 0.14, vol: 0.32, filter: 'highpass', freq: 1500, at, dest });
    if (beat % 2 === 0) a.noise({ dur: 0.04, vol: 0.12, filter: 'highpass', freq: 7000, at, dest });
  }

  stop() {
    clearInterval(this.timer);
  }
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
