import { CONFIG } from '../config.js';

// Lleva la cuenta de checkpoints, vueltas y tiempos de un kart.
// La pista se divide en N tramos; solo cuenta pasar al tramo que sigue,
// así cortar camino por el pasto no adelanta vueltas.
export class RaceProgress {
  constructor(path, laps = CONFIG.race.laps, checkpoints = CONFIG.race.checkpoints) {
    this.path = path;
    this.laps = laps;
    this.k = checkpoints;
    this.segLen = path.length / checkpoints;
    this.passed = 0;          // checkpoints pasados en total
    this.lapStartTime = 0;
    this.lapTimes = [];
    this.finished = false;
    this.finishTime = 0;
    this.wrongWay = false;
    this._lastS = null;
  }

  get lap() {
    // 0 = todavía no cruzó la largada
    return this.passed === 0 ? 0 : Math.min(this.laps, Math.floor((this.passed - 1) / this.k) + 1);
  }

  // Distancia total recorrida en la carrera (para calcular posiciones)
  get raceDistance() {
    if (this.finished) return this.laps * this.path.length + 1e6 - this.finishTime;
    const s = this._lastS ?? 0;
    if (this.passed === 0) return s - this.path.length; // detrás de la línea
    const lastCp = (this.passed - 1) % this.k;
    const base = (this.passed - 1) * this.segLen;
    let ahead = s - lastCp * this.segLen;
    if (ahead < -this.path.length / 2) ahead += this.path.length;
    return base + Math.max(-this.segLen, Math.min(this.segLen * 1.5, ahead));
  }

  // Devuelve un evento si pasó algo: 'start' (cruzó la largada), 'lap', 'finish'
  update(s, raceTime) {
    if (this.finished) return null;
    const prev = this._lastS;
    this._lastS = s;
    if (prev !== null) {
      // Marcha atrás: la distancia baja de forma sostenida
      let ds = s - prev;
      if (ds > this.path.length / 2) ds -= this.path.length;
      if (ds < -this.path.length / 2) ds += this.path.length;
      this._wrongAccum = Math.max(0, Math.min(2, (this._wrongAccum || 0) + (ds < -0.05 ? 1 : -1) / 60));
      this.wrongWay = this._wrongAccum > 1;
    }
    const seg = Math.floor(s / this.segLen) % this.k;
    const expected = this.passed % this.k;
    if (seg !== expected) return null;
    this.passed++;
    // La primera vuelta se cuenta desde el ¡YA! (lapStartTime = 0)
    if (this.passed === 1) return 'start';
    if ((this.passed - 1) % this.k === 0) {
      this.lapTimes.push(raceTime - this.lapStartTime);
      this.lapStartTime = raceTime;
      if (this.lapTimes.length >= this.laps) {
        this.finished = true;
        this.finishTime = raceTime;
        return 'finish';
      }
      return 'lap';
    }
    return null;
  }
}
