import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { rollItem } from './itemTypes.js';

const q = {};

function boxGeometry() {
  // Cubo con caras de distintos colores (sin texto)
  const g = new THREE.BoxGeometry(1.4, 1.4, 1.4).toNonIndexed();
  const faces = ['#ff5d8f', '#ffd23f', '#3dd6ff', '#7bff6b', '#b46bff', '#ff8a3d'];
  const c = new THREE.Color();
  const colors = [];
  for (let f = 0; f < 6; f++) {
    c.set(faces[f]);
    for (let v = 0; v < 6; v++) colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return g;
}

// Cajas de ítems, ruleta, uso de ítems, proyectiles, trampas y escudos.
export class ItemManager {
  constructor(race) {
    this.race = race;
    this.scene = race.scene;
    this.path = race.track.path;
    this.boxes = [];
    this.projectiles = [];
    this.traps = [];
    this.time = 0;

    const cfg = CONFIG.items;
    const boxGeo = boxGeometry();
    const boxMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.88, emissive: '#333333' });
    const coreGeo = new THREE.OctahedronGeometry(0.42, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    for (const f of cfg.boxRows) {
      const s = f * this.path.length;
      for (let i = 0; i < cfg.boxesPerRow; i++) {
        const lateral = (i / (cfg.boxesPerRow - 1) - 0.5) * 2 * this.path.halfWidth * 0.72;
        const p = this.path.pointAt(s, lateral);
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.add(new THREE.Mesh(coreGeo, coreMat));
        mesh.position.set(p.x, 1.25, p.z);
        mesh.castShadow = race.quality.shadows;
        this.scene.add(mesh);
        this.boxes.push({ mesh, x: p.x, z: p.z, s, lateral, respawn: 0, phase: i * 0.7 });
      }
    }

    this.projectileGeo = new THREE.IcosahedronGeometry(0.6, 0);
    this.projectileMat = new THREE.MeshLambertMaterial({ color: '#2f8dff', emissive: '#1b4fff', emissiveIntensity: 0.8, flatShading: true });
    this.trapMat = new THREE.MeshLambertMaterial({ color: '#9b4dff', emissive: '#3d1070', flatShading: true });
    this.shieldGeo = new THREE.IcosahedronGeometry(1.9, 1);
    this.shieldMat = new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending });
  }

  // Para la IA: la caja disponible más conveniente en los próximos metros
  findBoxAhead(kart, maxAhead = 45) {
    let best = null, bestScore = Infinity;
    for (const b of this.boxes) {
      if (b.respawn > 0) continue;
      let ds = b.s - kart.trackDistance;
      if (ds < 0) ds += this.path.length;
      if (ds < 4 || ds > maxAhead) continue;
      const score = Math.abs(b.lateral - (kart.trackLateral || 0)) + ds * 0.05;
      if (score < bestScore) { bestScore = score; best = b; }
    }
    return best;
  }

  update(dt) {
    this.time += dt;
    const race = this.race;
    for (const b of this.boxes) {
      if (b.respawn <= 0) {
        b.mesh.rotation.y = this.time * 1.4 + b.phase;
        b.mesh.rotation.x = Math.sin(this.time * 1.1 + b.phase) * 0.4;
        b.mesh.position.y = 1.25 + Math.sin(this.time * 2.2 + b.phase) * 0.15;
      }
    }
    const karts = race.karts;
    const cfg = CONFIG.items;

    // Cajas: animación, recoger y reaparecer
    for (const b of this.boxes) {
      if (b.respawn > 0) {
        b.respawn -= dt;
        if (b.respawn <= 0) b.mesh.visible = true;
        continue;
      }
      for (const k of karts) {
        const dx = k.position.x - b.x, dz = k.position.z - b.z;
        if (dx * dx + dz * dz < 2.3 * 2.3) {
          b.respawn = cfg.boxRespawn;
          b.mesh.visible = false;
          race.burst(b.x, 1.2, b.z, ['#ff5d8f', '#ffd23f', '#3dd6ff', '#7bff6b'], 14);
          if (!k.item && k.itemRoll <= 0) {
            k.itemRoll = cfg.rouletteTime;
            race.emit('itemBox', { kart: k });
          }
          break;
        }
      }
    }

    // Ruleta
    for (const k of karts) {
      if (k.itemRoll > 0) {
        k.itemRoll -= dt;
        if (k.itemRoll <= 0) {
          k.item = rollItem(k.rank || karts.length, karts.length);
          k.itemHeldTime = 0;
          race.emit('itemGot', { kart: k, item: k.item });
        }
      } else if (k.item) {
        k.itemHeldTime += dt;
      }
    }

    this.updateProjectiles(dt);
    this.updateTraps(dt);
  }

  use(kart) {
    const id = kart.item;
    if (!id || kart.itemRoll > 0 || kart.spinTime > 0) return false;
    kart.item = null;
    const cfg = CONFIG.items;
    const fwd = kart.forward;
    if (id === 'turbo') {
      kart.boost(cfg.turboDuration);
    } else if (id === 'proyectil') {
      const mesh = new THREE.Mesh(this.projectileGeo, this.projectileMat);
      const x = kart.position.x + fwd.x * 2.4, z = kart.position.z + fwd.y * 2.4;
      mesh.position.set(x, 0.8, z);
      this.scene.add(mesh);
      const speed = cfg.projectileSpeed + Math.max(0, kart.speed) * 0.4;
      this.projectiles.push({ mesh, x, z, vx: fwd.x * speed, vz: fwd.y * speed, life: cfg.projectileLife, bounces: 0, owner: kart, grace: 0.4, hint: kart.trackIndex });
    } else if (id === 'trampa') {
      const x = kart.position.x - fwd.x * 2.8, z = kart.position.z - fwd.y * 2.8;
      const mesh = this.makeTrapMesh();
      mesh.position.set(x, 0.05, z);
      this.scene.add(mesh);
      this.traps.push({ mesh, x, z, life: cfg.trapLife, owner: kart, grace: 0.6 });
    } else if (id === 'escudo') {
      kart.shieldTime = cfg.shieldDuration;
      if (!kart.shieldMesh) {
        kart.shieldMesh = new THREE.Mesh(this.shieldGeo, this.shieldMat);
        kart.shieldMesh.position.y = 0.9;
        kart.object.add(kart.shieldMesh);
      }
    }
    this.race.emit('itemUse', { kart, item: id });
    return true;
  }

  makeTrapMesh() {
    const g = new THREE.Group();
    const blob = new THREE.SphereGeometry(1, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    for (const [x, z, s] of [[0, 0, 1.25], [0.9, 0.4, 0.6], [-0.8, -0.5, 0.7], [0.3, -0.9, 0.5], [-0.6, 0.8, 0.5]]) {
      const m = new THREE.Mesh(blob, this.trapMat);
      m.position.set(x, 0, z);
      m.scale.set(s, 0.3, s);
      g.add(m);
    }
    return g;
  }

  // Golpe a un kart: si tiene escudo, se rompe el escudo
  hit(kart, by) {
    if (kart.shieldTime > 0) {
      kart.shieldTime = 0;
      this.race.burst(kart.position.x, 1, kart.position.z, ['#ffd23f', '#fff3b0'], 18);
      this.race.emit('shieldBreak', { kart, by });
      return;
    }
    kart.spinOut();
    this.race.emit('hit', { kart, by });
  }

  updateProjectiles(dt) {
    const cfg = CONFIG.items;
    const path = this.path;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.grace -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      path.query(p.x, p.z, p.hint, q);
      p.hint = q.index;
      const limit = path.wallOffset - 0.6;
      let dead = p.life <= 0;
      if (Math.abs(q.lateral) > limit) {
        // Rebote contra el borde
        const side = Math.sign(q.lateral);
        const nx = path.nx[q.index] * side, nz = path.nz[q.index] * side;
        const vn = p.vx * nx + p.vz * nz;
        if (vn > 0) { p.vx -= 2 * vn * nx; p.vz -= 2 * vn * nz; }
        p.x -= nx * (Math.abs(q.lateral) - limit);
        p.z -= nz * (Math.abs(q.lateral) - limit);
        p.bounces++;
        this.race.sparks(p.x, p.z, 6, '#7fc4ff');
        if (p.bounces > cfg.projectileBounces) dead = true;
      }
      if (!dead) {
        for (const k of this.race.karts) {
          if (k === p.owner && p.grace > 0) continue;
          const dx = k.position.x - p.x, dz = k.position.z - p.z;
          if (dx * dx + dz * dz < (k.stats.radius + 0.7) ** 2) {
            this.hit(k, p.owner);
            dead = true;
            break;
          }
        }
      }
      if (!dead) {
        for (let t = this.traps.length - 1; t >= 0; t--) {
          const tr = this.traps[t];
          if ((tr.x - p.x) ** 2 + (tr.z - p.z) ** 2 < 2.2 ** 2) {
            this.removeTrap(t);
            dead = true;
            break;
          }
        }
      }
      p.mesh.position.set(p.x, 0.8 + Math.sin(this.time * 20) * 0.08, p.z);
      p.mesh.rotation.x += dt * 12;
      p.mesh.rotation.y += dt * 9;
      if (Math.random() < 0.7) this.race.particles.emit(p.x, 0.8, p.z, 0, 0.3, 0, '#7fc4ff', { life: 0.25, size: 0.25, drag: 5 });
      if (dead) {
        this.race.burst(p.x, 0.8, p.z, ['#2f8dff', '#bfe3ff'], 12);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateTraps(dt) {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i];
      t.life -= dt;
      t.grace -= dt;
      t.mesh.rotation.y += dt * 0.5;
      if (t.life <= 0) { this.removeTrap(i); continue; }
      for (const k of this.race.karts) {
        if (k === t.owner && t.grace > 0) continue;
        const dx = k.position.x - t.x, dz = k.position.z - t.z;
        if (dx * dx + dz * dz < (k.stats.radius + 1.0) ** 2) {
          this.hit(k, t.owner);
          this.race.burst(t.x, 0.4, t.z, ['#9b4dff', '#d6b3ff'], 14);
          this.removeTrap(i);
          break;
        }
      }
    }
  }

  removeTrap(i) {
    this.scene.remove(this.traps[i].mesh);
    this.traps.splice(i, 1);
  }

  // Decisiones de ítems para la computadora
  updateAI(driver, dt) {
    const k = driver.kart;
    if (!k.item || k.itemRoll > 0 || k.spinTime > 0) return;
    const held = k.itemHeldTime;
    let use = false;
    const fwd = k.forward;
    if (k.item === 'turbo') {
      const i0 = this.path.indexAt(k.trackDistance + 10);
      let c = 0;
      for (let j = 0; j < 15; j++) c += Math.abs(this.path.curv[this.path.wrap(i0 + j)]);
      use = (c / 15 < 0.01 && held > 0.5) || held > 5;
    } else if (k.item === 'proyectil') {
      for (const o of this.race.karts) {
        if (o === k) continue;
        const dx = o.position.x - k.position.x, dz = o.position.z - k.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 45 && d > 3 && (dx * fwd.x + dz * fwd.y) / d > 0.985) { use = true; break; }
      }
      if (held > 8) use = true;
    } else if (k.item === 'trampa') {
      for (const o of this.race.karts) {
        if (o === k) continue;
        const dx = o.position.x - k.position.x, dz = o.position.z - k.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 14 && (dx * fwd.x + dz * fwd.y) < 0) { use = true; break; }
      }
      if (held > 9) use = true;
    } else if (k.item === 'escudo') {
      use = held > 1 + driver.skill;
    }
    if (use) this.use(k);
  }

  dispose() {
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    for (const t of this.traps) this.scene.remove(t.mesh);
  }
}
