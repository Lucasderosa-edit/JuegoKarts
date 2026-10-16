import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { buildKartModel } from './kartModel.js';

const tmpFwd = new THREE.Vector2();
const tmpRight = new THREE.Vector2();

// Kart con física arcade en el plano XZ.
// rotation.y = yaw; el frente local (+Z) apunta a (sin yaw, cos yaw).
export class Kart {
  constructor({ colors, stats = {}, name = 'Kart' } = {}) {
    this.name = name;
    this.stats = { ...CONFIG.kart, ...stats };
    this.model = buildKartModel(colors);
    this.object = this.model.root;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector2(); // (x, z)
    this.yaw = 0;
    this.speed = 0;      // velocidad hacia adelante (puede ser negativa)
    this.steer = 0;      // dirección suavizada (-1 a 1)
    this.wheelSpin = 0;
    this.visualLean = 0;
  }

  get forward() {
    return tmpFwd.set(Math.sin(this.yaw), Math.cos(this.yaw));
  }

  setPose(x, z, yaw) {
    this.position.set(x, 0, z);
    this.yaw = yaw;
    this.velocity.set(0, 0);
    this.speed = 0;
    this.syncObject();
  }

  update(dt, controls) {
    const s = this.stats;
    const fwd = tmpFwd.set(Math.sin(this.yaw), Math.cos(this.yaw));
    const right = tmpRight.set(-Math.cos(this.yaw), Math.sin(this.yaw));

    // Separar la velocidad en componente hacia adelante y lateral
    let fwdSpeed = this.velocity.dot(fwd);
    let latSpeed = this.velocity.dot(right);

    // Acelerar / frenar / reversa
    const maxSpeed = s.maxSpeed;
    if (controls.throttle > 0 && !(controls.brake > 0)) {
      if (fwdSpeed < 0) fwdSpeed = Math.min(0, fwdSpeed + s.brakeDecel * dt);
      else {
        const t = Math.min(1, fwdSpeed / maxSpeed);
        const accel = s.acceleration * (1 - s.accelCurve * t * t);
        if (fwdSpeed < maxSpeed) fwdSpeed = Math.min(maxSpeed, fwdSpeed + accel * dt);
        else fwdSpeed = Math.max(maxSpeed, fwdSpeed - s.coastDrag * dt);
      }
    } else if (controls.brake > 0) {
      if (fwdSpeed > 0.5) fwdSpeed = Math.max(0, fwdSpeed - s.brakeDecel * dt);
      else fwdSpeed = Math.max(-s.reverseMaxSpeed, fwdSpeed - s.reverseAccel * dt);
    } else {
      const drag = s.coastDrag * dt;
      fwdSpeed = Math.abs(fwdSpeed) <= drag ? 0 : fwdSpeed - Math.sign(fwdSpeed) * drag;
    }

    // Agarre lateral: el kart deja de patinar de a poco
    latSpeed *= Math.exp(-s.grip * dt);

    // Dirección suavizada
    this.steer += (controls.steer - this.steer) * Math.min(1, s.steerResponse * dt);

    // Giro: depende de la velocidad (parado no gira) y se invierte en reversa
    const absSpeed = Math.abs(fwdSpeed);
    const lowSpeedFactor = Math.min(1, absSpeed / s.turnSpeedRef);
    const highSpeedFactor = 1 - s.highSpeedTurnLoss * Math.min(1, absSpeed / maxSpeed);
    const dir = fwdSpeed >= 0 ? 1 : -1;
    this.yaw -= this.steer * s.turnRate * lowSpeedFactor * highSpeedFactor * dir * dt;

    this.velocity.set(fwd.x * fwdSpeed + right.x * latSpeed, fwd.y * fwdSpeed + right.y * latSpeed);
    this.speed = fwdSpeed;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.y * dt;

    // Animaciones visuales
    this.wheelSpin += fwdSpeed * dt / 0.37;
    const targetLean = -this.steer * Math.min(1, absSpeed / maxSpeed) * 0.08;
    this.visualLean += (targetLean - this.visualLean) * Math.min(1, 8 * dt);
    this.syncObject();
  }

  syncObject() {
    this.object.position.copy(this.position);
    this.object.rotation.y = this.yaw;
    const m = this.model;
    m.chassis.rotation.z = this.visualLean;
    for (const w of m.wheels) w.rotation.x = this.wheelSpin;
    for (const p of m.frontPivots) p.rotation.y = -this.steer * 0.45;
  }
}
