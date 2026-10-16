import * as THREE from 'three';

// Sistema de partículas simple con un único InstancedMesh (barato de dibujar).
const dummy = new THREE.Object3D();
const color = new THREE.Color();

export class Particles {
  constructor(scene, max = 800) {
    this.max = max;
    const geometry = new THREE.OctahedronGeometry(0.5, 0);
    const material = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 });
    this.mesh = new THREE.InstancedMesh(geometry, material, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, color.set('#ffffff'));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.items = [];
    for (let i = 0; i < max; i++) {
      this.items.push({ life: 0, maxLife: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0.2, gravity: 0, drag: 0, spin: 0 });
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.cursor = 0;
    this.enabled = true;
    this.density = 1;
  }

  emit(x, y, z, vx, vy, vz, hex, { life = 0.4, size = 0.2, gravity = 0, drag = 2 } = {}) {
    if (!this.enabled) return;
    if (this.density < 1 && Math.random() > this.density) return;
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    const p = this.items[i];
    Object.assign(p, { life, maxLife: life, x, y, z, vx, vy, vz, size, gravity, drag, spin: Math.random() * 6 });
    this.mesh.setColorAt(i, color.set(hex));
    this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt) {
    let any = false;
    for (let i = 0; i < this.max; i++) {
      const p = this.items[i];
      if (p.life <= 0) continue;
      any = true;
      p.life -= dt;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k; p.vz *= k;
      p.vy = p.vy * k - p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05) { p.y = 0.05; p.vy = Math.abs(p.vy) * 0.3; }
      const t = Math.max(0, p.life / p.maxLife);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.spin * t, p.spin * 1.3 * t, 0);
      dummy.scale.setScalar(p.life > 0 ? p.size * (0.3 + 0.7 * t) : 0);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
