import * as THREE from 'three';
import { CONFIG } from '../config.js';

const tmpTarget = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

// Cámara en tercera persona que sigue al kart con suavidad.
export class ChaseCamera {
  constructor(camera) {
    this.camera = camera;
    this.look = new THREE.Vector3();
    this.yaw = 0;
    this.initialized = false;
    this.fov = CONFIG.camera.fov;
    this.shake = 0;
    this.intro = 0; // 0..1: cuánto falta de la presentación
  }

  addShake(amount) {
    this.shake = Math.min(0.6, this.shake + amount);
  }

  snap(kart) {
    this.initialized = false;
    this.update(kart, 1);
  }

  update(kart, dt) {
    const c = CONFIG.camera;
    dt = Math.min(0.25, Math.max(0, dt));
    // La cámara sigue la dirección del kart, pero con retraso (se nota en las curvas)
    let diff = kart.yaw - this.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const k = this.initialized ? 1 - Math.exp(-c.followSharpness * dt) : 1;
    this.yaw += diff * k;

    // Presentación: la cámara arranca adelante del kart y gira hasta quedar atrás
    const e = this.intro * this.intro * (3 - 2 * this.intro);
    const camYaw = this.yaw + e * Math.PI * 0.6;
    const dist = c.distance * (1 + e * 0.25);
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    tmpTarget.set(
      kart.position.x - fx * dist,
      kart.position.y + c.height + e * 2.2,
      kart.position.z - fz * dist,
    );
    tmpLook.set(
      kart.position.x + fx * c.lookAhead,
      kart.position.y + c.lookHeight,
      kart.position.z + fz * c.lookAhead,
    );
    if (e > 0) tmpLook.set(kart.position.x, kart.position.y + 1.1, kart.position.z);
    if (!this.initialized || e > 0) {
      this.camera.position.copy(tmpTarget);
      this.look.copy(tmpLook);
      this.initialized = true;
    } else {
      const kp = 1 - Math.exp(-c.followSharpness * 1.6 * dt);
      this.camera.position.lerp(tmpTarget, kp);
      this.look.lerp(tmpLook, kp);
    }
    // Sacudida por golpes
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.8);
      const s = this.shake * this.shake;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(this.look);

    // Más campo visual cuanto más rápido (sensación de velocidad)
    const speedT = Math.min(1, Math.max(0, kart.speed) / 32);
    const targetFov = c.fov + speedT * c.speedFov + (kart.boostTime > 0 ? c.boostFov : 0);
    this.fov += (targetFov - this.fov) * Math.min(1, dt * 4);
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }
}
