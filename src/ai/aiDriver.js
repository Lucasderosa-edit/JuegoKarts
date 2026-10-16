import { CONFIG } from '../config.js';

// Piloto automático para los rivales (y para el jugador al terminar la carrera).
// Sigue la pista mirando un punto adelante, con un carril propio que va cambiando,
// y derrapa en las curvas largas para cargar turbo.
export class AIDriver {
  constructor(kart, track, { skill = 1, seed = Math.random() * 1000 } = {}) {
    this.kart = kart;
    this.track = track;
    this.path = track.path;
    this.skill = skill;
    this.seed = seed;
    this.time = seed;
    this.speedFactor = 1;
    this.driftTarget = 1;
    this.wantDrift = false;
    this.stuckTime = 0;
    this.avoid = 0;        // corrimiento lateral para esquivar cosas
    this.useItemsAt = 0;
  }

  // Carril preferido: un corrimiento lateral que cambia de a poco
  lane() {
    const a = CONFIG.ai.laneWidth * this.path.halfWidth;
    return Math.sin(this.time * 0.13 + this.seed) * a * 0.7 + Math.sin(this.time * 0.37 + this.seed * 2) * a * 0.3;
  }

  update(dt, controls) {
    const ai = CONFIG.ai;
    const k = this.kart;
    const path = this.path;
    this.time += dt;
    const s = k.trackDistance ?? 0;
    const speed = Math.max(0, k.speed);

    // Curvatura de la pista que viene
    const i0 = path.indexAt(s);
    const ahead = Math.round(28 / path.spacing);
    let curvSum = 0, curvMax = 0;
    for (let j = 2; j < ahead; j++) {
      const c = path.curv[path.wrap(i0 + j)];
      curvSum += c;
      if (Math.abs(c) > Math.abs(curvMax)) curvMax = c;
    }
    const curvAvg = curvSum / (ahead - 2);

    // En las curvas se tira hacia adentro
    const inside = -Math.sign(curvAvg) * Math.min(1, Math.abs(curvAvg) / 0.03) * path.halfWidth * 0.45;
    let wanted = this.lane() * 0.6 + inside;
    // Sin ítem: ir a buscar una caja
    if (this.items && !k.item && k.itemRoll <= 0) {
      const box = this.items.findBoxAhead(k);
      if (box) wanted = box.lateral;
    }
    const lateral = Math.max(-path.halfWidth * 0.8, Math.min(path.halfWidth * 0.8, wanted + this.avoid));
    this.avoid *= Math.exp(-2 * dt);

    const look = ai.lookAheadBase + speed * ai.lookAheadPerSpeed;
    const target = path.pointAt(s + look, lateral);
    const ang = Math.atan2(target.x - k.position.x, target.z - k.position.z);
    let diff = ang - k.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));

    controls.throttle = 1;
    controls.brake = 0;
    controls.steer = Math.max(-1, Math.min(1, -diff * ai.steerGain));
    controls.itemPressed = false;

    // Si quedó mirando para atrás (por un choque), dar vuelta
    if (Math.abs(diff) > 1.9 && speed < 8) {
      controls.throttle = 0;
      controls.brake = 1;
      controls.steer = diff > 0 ? 1 : -1; // en reversa la dirección se invierte
    }

    // Derrape en curvas largas
    const curvy = Math.abs(curvAvg) > ai.driftCurvature;
    if (!k.drifting) {
      if (curvy && speed > CONFIG.drift.minSpeed + 3 && !k.surface.offroad && this.wantDrift) {
        controls.drift = true;
        controls.steer = -Math.sign(curvAvg);
      } else {
        controls.drift = false;
        if (!curvy) this.wantDrift = this.rand() < ai.driftChance * this.skill;
      }
    } else {
      const sameWay = Math.sign(-curvAvg) === k.driftDir;
      const keep = sameWay && Math.abs(curvAvg) > ai.driftCurvature * 0.45;
      controls.drift = keep && Math.abs(diff) < 0.8;
      if (k.driftLevel >= this.driftTarget && Math.abs(curvAvg) < ai.driftCurvature) controls.drift = false;
    }

    // Atascado contra algo: reaparece en la pista
    if (speed < 2 && k.boostTime <= 0) this.stuckTime += dt; else this.stuckTime = 0;
    if (this.stuckTime > ai.stuckRespawnSeconds) {
      this.respawn();
      this.stuckTime = 0;
    }
  }

  respawn() {
    const k = this.kart;
    const s = (k.trackDistance ?? 0) - 4;
    const p = this.path.pointAt(s, 0);
    k.setPose(p.x, p.z, this.path.yawAt(this.path.indexAt(s)));
  }

  rand() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
