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
  }

  snap(kart) {
    this.initialized = false;
    this.update(kart, 1);
  }

  update(kart, dt) {
    const c = CONFIG.camera;
    // La cámara sigue la dirección del kart, pero con retraso (se nota en las curvas)
    let diff = kart.yaw - this.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const k = this.initialized ? 1 - Math.exp(-c.followSharpness * dt) : 1;
    this.yaw += diff * k;

    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    tmpTarget.set(
      kart.position.x - fx * c.distance,
      kart.position.y + c.height,
      kart.position.z - fz * c.distance,
    );
    tmpLook.set(
      kart.position.x + fx * c.lookAhead,
      kart.position.y + c.lookHeight,
      kart.position.z + fz * c.lookAhead,
    );
    if (!this.initialized) {
      this.camera.position.copy(tmpTarget);
      this.look.copy(tmpLook);
      this.initialized = true;
    } else {
      const kp = 1 - Math.exp(-c.followSharpness * 1.6 * dt);
      this.camera.position.lerp(tmpTarget, kp);
      this.look.lerp(tmpLook, kp);
    }
    this.camera.lookAt(this.look);
  }
}
