import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { buildKartModel, flatMat } from './kartModel.js';

const tmpFwd = new THREE.Vector2();
const tmpRight = new THREE.Vector2();
const tmpV = new THREE.Vector3();

// Kart con física arcade en el plano XZ.
// rotation.y = yaw; el frente local (+Z) apunta a (sin yaw, cos yaw).
export class Kart {
  constructor({ colors, stats = {}, name = 'Kart', particles = null } = {}) {
    this.name = name;
    this.stats = { ...CONFIG.kart, ...stats };
    this.model = buildKartModel(colors);
    this.object = this.model.root;
    this.particles = particles;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector2(); // (x, z)
    this.yaw = 0;
    this.speed = 0;      // velocidad hacia adelante (puede ser negativa)
    this.steer = 0;      // dirección suavizada (-1 a 1)

    // Derrape
    this.drifting = false;
    this.driftDir = 0;
    this.driftTime = 0;
    this.driftLevel = 0;
    this.driftVisual = 0;
    this._driftHeld = false;

    // Turbo
    this.boostTime = 0;

    // Superficie actual (la pista la actualiza: pasto, hielo, etc.)
    this.surface = { speed: 1, grip: 1, offroad: false };

    // Animaciones
    this.wheelSpin = 0;
    this.visualLean = 0;
    this.hopY = 0;
    this.hopV = 0;
    this.time = 0;

    // Llama del turbo
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 6).rotateX(-Math.PI / 2), flatMat('#ff8a1f'));
    flame.position.set(0, 0.75, -1.85);
    flame.visible = false;
    this.model.chassis.add(flame);
    this.flame = flame;
  }

  get forward() {
    return tmpFwd.set(Math.sin(this.yaw), Math.cos(this.yaw));
  }

  get isBoosting() {
    return this.boostTime > 0;
  }

  setPose(x, z, yaw) {
    this.position.set(x, 0, z);
    this.yaw = yaw;
    this.velocity.set(0, 0);
    this.speed = 0;
    this.drifting = false;
    this.boostTime = 0;
    this.syncObject();
  }

  // Turbo por derrape, ítem o rampa. Si ya había uno, se queda con el más largo.
  boost(duration) {
    this.boostTime = Math.max(this.boostTime, duration);
    const max = this.stats.maxSpeed * CONFIG.boost.speedMultiplier;
    const fwd = this.forward;
    const kick = Math.max(this.speed, Math.min(max, this.speed + 6));
    const lat = this.velocity.dot(tmpRight.set(-fwd.y, fwd.x));
    this.velocity.set(fwd.x * kick - fwd.y * lat, fwd.y * kick + fwd.x * lat);
  }

  update(dt, controls) {
    const s = this.stats;
    const d = CONFIG.drift;
    this.time += dt;
    const fwd = tmpFwd.set(Math.sin(this.yaw), Math.cos(this.yaw));
    const right = tmpRight.set(-Math.cos(this.yaw), Math.sin(this.yaw));

    // Separar la velocidad en componente hacia adelante y lateral
    let fwdSpeed = this.velocity.dot(fwd);
    let latSpeed = this.velocity.dot(right);
    // Al derrapar, el kart conserva su velocidad aunque vaya cruzado
    if (this.drifting) fwdSpeed = this.velocity.length();

    // Turbo
    const boosting = this.boostTime > 0;
    if (boosting) this.boostTime = Math.max(0, this.boostTime - dt);

    let maxSpeed = s.maxSpeed * this.surface.speed;
    let accelBase = s.acceleration;
    if (boosting) {
      maxSpeed = s.maxSpeed * CONFIG.boost.speedMultiplier * Math.max(this.surface.speed, 0.85);
      accelBase += CONFIG.boost.extraAccel;
    }

    // Acelerar / frenar / reversa
    const throttle = boosting ? 1 : controls.throttle;
    if (throttle > 0 && !(controls.brake > 0 && !boosting)) {
      if (fwdSpeed < 0) fwdSpeed = Math.min(0, fwdSpeed + s.brakeDecel * dt);
      else {
        const t = Math.min(1, fwdSpeed / maxSpeed);
        const accel = accelBase * (1 - s.accelCurve * t * t) * throttle;
        if (fwdSpeed < maxSpeed) fwdSpeed = Math.min(maxSpeed, fwdSpeed + accel * dt);
        else fwdSpeed = Math.max(maxSpeed, fwdSpeed - (s.coastDrag + 18 * (1 - this.surface.speed)) * dt);
      }
    } else if (controls.brake > 0) {
      if (fwdSpeed > 0.5) fwdSpeed = Math.max(0, fwdSpeed - s.brakeDecel * dt);
      else fwdSpeed = Math.max(-s.reverseMaxSpeed * this.surface.speed, fwdSpeed - s.reverseAccel * dt);
    } else {
      const drag = (s.coastDrag + (fwdSpeed > maxSpeed ? 18 : 0)) * dt;
      fwdSpeed = Math.abs(fwdSpeed) <= drag ? 0 : fwdSpeed - Math.sign(fwdSpeed) * drag;
    }

    // Dirección suavizada
    this.steer += (controls.steer - this.steer) * Math.min(1, s.steerResponse * dt);

    // --- Derrape ---
    const driftPressedNow = controls.drift && !this._driftHeld;
    this._driftHeld = controls.drift;
    if (!this.drifting) {
      if (driftPressedNow && this.hopY <= 0.001 && fwdSpeed > 2) this.hopV = d.hop; // saltito
      if (controls.drift && Math.abs(controls.steer) > 0.2 && fwdSpeed > d.minSpeed && !this.surface.offroad) {
        this.drifting = true;
        this.driftDir = Math.sign(controls.steer);
        this.driftTime = 0;
        this.driftLevel = 0;
      }
    } else {
      const cancel = fwdSpeed < d.minSpeed * 0.55 || controls.brake > 0;
      if (!controls.drift || cancel) {
        // Soltar el derrape: turbo según el nivel alcanzado
        if (!cancel && this.driftLevel > 0) this.boost(d.boostDuration[this.driftLevel - 1]);
        this.drifting = false;
        this.driftLevel = 0;
        this.driftTime = 0;
      } else {
        const tight = Math.max(0, controls.steer * this.driftDir);
        this.driftTime += dt * (1 + d.chargeTight * tight) * (this.surface.offroad ? 0.3 : 1);
        let level = 0;
        for (const t of d.levels) if (this.driftTime >= t) level++;
        this.driftLevel = level;
      }
    }

    if (this.drifting) {
      // Deslizamiento hacia afuera de la curva, sin perder velocidad total
      const targetLat = -this.driftDir * Math.sin(d.slideAngle) * fwdSpeed;
      latSpeed += (targetLat - latSpeed) * Math.min(1, d.grip * this.surface.grip * dt);
      fwdSpeed = Math.sqrt(Math.max(0, fwdSpeed * fwdSpeed - latSpeed * latSpeed));
    } else {
      // Agarre lateral: el kart deja de patinar de a poco
      latSpeed *= Math.exp(-s.grip * this.surface.grip * dt);
    }

    // Giro: depende de la velocidad (parado no gira) y se invierte en reversa
    const absSpeed = Math.abs(fwdSpeed);
    const lowSpeedFactor = Math.min(1, absSpeed / s.turnSpeedRef);
    const highSpeedFactor = 1 - s.highSpeedTurnLoss * Math.min(1, absSpeed / s.maxSpeed);
    let yawRate;
    if (this.drifting) {
      const amount = d.baseTurn + d.steerRange * controls.steer * this.driftDir;
      yawRate = this.driftDir * s.turnRate * amount * (s.driftHandling || 1);
    } else {
      const dir = fwdSpeed >= 0 ? 1 : -1;
      yawRate = this.steer * s.turnRate * lowSpeedFactor * highSpeedFactor * dir;
    }
    this.yaw -= yawRate * dt;

    this.velocity.set(fwd.x * fwdSpeed + right.x * latSpeed, fwd.y * fwdSpeed + right.y * latSpeed);
    this.speed = fwdSpeed;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.y * dt;

    // Saltito del derrape
    if (this.hopY > 0 || this.hopV > 0) {
      this.hopV -= 30 * dt;
      this.hopY = Math.max(0, this.hopY + this.hopV * dt);
      if (this.hopY === 0) this.hopV = 0;
    }

    this.emitEffects(dt, absSpeed);

    // Animaciones visuales
    this.wheelSpin += fwdSpeed * dt / 0.37;
    const targetLean = -this.steer * Math.min(1, absSpeed / s.maxSpeed) * 0.08;
    this.visualLean += (targetLean - this.visualLean) * Math.min(1, 8 * dt);
    const targetDrift = this.drifting ? -this.driftDir * d.visualAngle : 0;
    this.driftVisual += (targetDrift - this.driftVisual) * Math.min(1, 10 * dt);
  }

  emitEffects(dt, absSpeed) {
    const p = this.particles;
    if (!p) return;
    const sinY = Math.sin(this.yaw + this.driftVisual), cosY = Math.cos(this.yaw + this.driftVisual);
    const rear = (side) => tmpV.set(
      this.position.x + cosY * 0.9 * side - sinY * 0.95,
      0.15,
      this.position.z - sinY * 0.9 * side - cosY * 0.95,
    );
    // Chispas del derrape (color según el nivel)
    if (this.drifting && this.hopY === 0) {
      const lvl = this.driftLevel;
      const colorHex = lvl > 0 ? CONFIG.drift.sparkColors[lvl - 1] : '#c9c9c9';
      const n = lvl > 0 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        for (const side of [-1, 1]) {
          const r = rear(side);
          p.emit(r.x, r.y, r.z,
            (Math.random() - 0.5) * 4 - this.velocity.x * 0.15, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 4 - this.velocity.y * 0.15,
            colorHex, { life: 0.25 + Math.random() * 0.15, size: lvl > 0 ? 0.16 : 0.22, gravity: 12, drag: 3 });
        }
      }
    }
    // Polvo al andar por el pasto
    if (this.surface.offroad && absSpeed > 4 && Math.random() < 0.6) {
      const r = rear(Math.random() < 0.5 ? -1 : 1);
      p.emit(r.x, 0.2, r.z, (Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2,
        this.surface.dustColor || '#b59a6a', { life: 0.5, size: 0.35, gravity: 1, drag: 2 });
    }
    // Fuego del turbo
    if (this.boostTime > 0) {
      const bx = this.position.x - Math.sin(this.yaw) * 1.6, bz = this.position.z - Math.cos(this.yaw) * 1.6;
      p.emit(bx, 0.75 + this.hopY, bz, -this.velocity.x * 0.2 + (Math.random() - 0.5), 0.5, -this.velocity.y * 0.2 + (Math.random() - 0.5),
        Math.random() < 0.5 ? '#ffb000' : '#ff5a1f', { life: 0.25, size: 0.3, gravity: -2, drag: 4 });
    }
  }

  syncObject() {
    this.object.position.set(this.position.x, this.position.y + this.hopY, this.position.z);
    this.object.rotation.y = this.yaw + this.driftVisual;
    const m = this.model;
    m.chassis.rotation.z = this.visualLean;
    for (const w of m.wheels) w.rotation.x = this.wheelSpin;
    for (const p of m.frontPivots) p.rotation.y = -this.steer * 0.45;
    this.flame.visible = this.boostTime > 0;
    if (this.flame.visible) this.flame.scale.set(1, 1, 0.8 + Math.sin(this.time * 60) * 0.3);
  }
}
