import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Track } from '../track/track.js';
import { Kart } from '../kart/kart.js';
import { ChaseCamera } from '../kart/chaseCamera.js';
import { Particles } from '../fx/particles.js';
import { setupEnvironment } from './environment.js';

// Una carrera: pista, karts, cámaras y reglas.
export class Race {
  constructor({ renderer, trackDef, quality, players }) {
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
    players.forEach((p, idx) => {
      const kart = new Kart({ colors: p.colors, stats: p.stats, name: p.name, particles: this.particles });
      kart.isPlayer = true;
      const slot = this.track.gridSlot(idx);
      kart.setPose(slot.x, slot.z, slot.yaw);
      this.scene.add(kart.object);
      this.karts.push(kart);
      const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.1, quality.drawDistance + 200);
      const chase = new ChaseCamera(camera);
      chase.snap(kart);
      this.players.push({ kart, controls: p.controls, readInput: p.readInput, camera, chase });
    });
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    for (const pl of this.players) pl.readInput(pl.controls);
    for (const pl of this.players) pl.kart.update(dt, pl.controls);
    for (const k of this.karts) this.track.applyToKart(k);
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
    r.render(this.scene, pl.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}
