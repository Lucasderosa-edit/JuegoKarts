import * as THREE from 'three';
import { flatMat } from '../kart/kartModel.js';
import { bake } from '../core/bake.js';

// Obstáculos propios de cada pista: cangrejos, olas, conos, colectivo,
// bolas de nieve y placas de hielo.

const tmp = new THREE.Vector3();

function inRange(d, s0, len, total) {
  return ((d - s0) % total + total) % total < len;
}

export class Obstacles {
  constructor(track, defs, quality) {
    this.track = track;
    this.path = track.path;
    this.group = new THREE.Group();
    this.shadows = quality.shadows;
    this.items = [];
    this.ice = [];
    this.time = 0;
    for (const d of defs) {
      const make = this[`make_${d.type}`];
      if (make) make.call(this, d);
    }
  }

  // --- Cangrejos que cruzan la pista de un lado al otro ---
  make_crab(d) {
    const s0 = this.path.distanceAtControl(d.at);
    for (let k = 0; k < (d.count || 3); k++) {
      const mesh = crabMesh();
      mesh.traverse((o) => { o.castShadow = this.shadows; });
      this.group.add(mesh);
      this.items.push({
        type: 'crab', mesh, s: s0 + k * 7, phase: k * 2.1, speed: 0.7 + k * 0.15, cooldown: 0, radius: 1.0,
        update(dt, t, path) {
          this.cooldown = Math.max(0, this.cooldown - dt);
          const lat = Math.sin(t * this.speed + this.phase) * path.halfWidth * 0.85;
          path.pointAt(this.s, lat, tmp);
          this.x = tmp.x; this.z = tmp.z;
          mesh.position.set(tmp.x, 0.1 + Math.abs(Math.sin(t * 14 + this.phase)) * 0.08, tmp.z);
          mesh.rotation.y = path.yawAt(path.indexAt(this.s));
          const sc = this.cooldown > 0 ? 0.35 : 1;
          mesh.scale.setScalar(mesh.scale.x + (sc - mesh.scale.x) * Math.min(1, dt * 8));
        },
        collide(kart, race) {
          if (this.cooldown > 0) return;
          if (dist2(kart, this) < (kart.stats.radius + this.radius) ** 2) {
            this.cooldown = 3;
            race.items.hit(kart, null);
            race.burst(this.x, 0.6, this.z, ['#ff5a3c', '#ffd0c2'], 10);
            race.emit('obstacle', { kart, type: 'crab' });
          }
        },
      });
    }
  }

  // --- Olas que barren el muelle de costado ---
  make_wave(d) {
    const s0 = this.path.distanceAtControl(d.at) - d.length / 2;
    const len = d.length;
    const group = new THREE.Group();
    const water = new THREE.MeshLambertMaterial({ color: '#3fb5e8', transparent: true, opacity: 0.8, flatShading: true });
    const foam = flatMat('#f2fbff');
    const parts = [];
    const n = Math.ceil(len / 4);
    for (let i = 0; i <= n; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 4.6), water);
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 4.8), foam);
      f.position.y = 0.75;
      w.add(f);
      group.add(w);
      parts.push({ mesh: w, s: s0 + (i / n) * len });
    }
    group.visible = false;
    this.group.add(group);
    const path = this.path;
    const W = path.wallOffset;
    this.items.push({
      type: 'wave', period: d.period || 4.7, travel: 2.2, hits: new WeakMap(),
      update(dt, t) {
        const ph = t % this.period;
        this.active = ph < this.travel;
        group.visible = this.active;
        if (!this.active) return;
        this.front = W - (ph / this.travel) * (2 * W);
        const h = Math.sin((ph / this.travel) * Math.PI);
        for (const p of parts) {
          path.pointAt(p.s, this.front, tmp);
          p.mesh.position.set(tmp.x, 0.2 + h * 0.4, tmp.z);
          p.mesh.rotation.y = path.yawAt(path.indexAt(p.s));
          p.mesh.scale.y = 0.4 + h;
        }
      },
      collide(kart, race) {
        if (!this.active) return;
        if (!inRange(kart.trackDistance, s0, len, path.length)) return;
        if (Math.abs(kart.trackLateral - this.front) > 2.4) return;
        const last = this.hits.get(kart) || -10;
        if (race.time - last < 1) return;
        this.hits.set(kart, race.time);
        const i = kart.trackIndex;
        // Empuja el kart en la dirección de la ola (hacia la izquierda de la pista)
        kart.velocity.x -= path.nx[i] * 11;
        kart.velocity.y -= path.nz[i] * 11;
        kart.bump(0.8);
        race.burst(kart.position.x, 0.8, kart.position.z, ['#bfe9ff', '#ffffff', '#3fb5e8'], 16);
        race.emit('obstacle', { kart, type: 'wave' });
      },
    });
  }

  // --- Conos naranjas que salen volando al chocarlos ---
  make_cones(d) {
    const s0 = this.path.distanceAtControl(d.at);
    for (let k = 0; k < (d.count || 3); k++) {
      const lat = (((k * 0.618 + d.at * 0.37) % 1) - 0.5) * this.path.halfWidth * 1.3;
      const p = this.path.pointAt(s0 + k * 6, lat);
      const mesh = coneMesh();
      mesh.traverse((o) => { o.castShadow = this.shadows; });
      mesh.position.copy(p);
      this.group.add(mesh);
      this.items.push({
        type: 'cone', mesh, home: p.clone(), x: p.x, z: p.z, vx: 0, vy: 0, vz: 0, y: 0, flying: 0, radius: 0.55,
        update(dt) {
          if (this.flying > 0) {
            this.flying -= dt;
            this.vy -= 25 * dt;
            this.x += this.vx * dt; this.z += this.vz * dt; this.y = Math.max(0, this.y + this.vy * dt);
            if (this.y === 0) { this.vx *= 0.8; this.vz *= 0.8; this.vy = Math.abs(this.vy) * 0.3; }
            mesh.position.set(this.x, this.y, this.z);
            mesh.rotation.x += dt * 9; mesh.rotation.z += dt * 6;
            if (this.flying <= 0) {
              this.x = this.home.x; this.z = this.home.z; this.y = 0;
              mesh.position.copy(this.home); mesh.rotation.set(0, 0, 0);
            }
          }
        },
        collide(kart, race) {
          if (this.flying > 0) return;
          if (dist2(kart, this) < (kart.stats.radius + this.radius) ** 2) {
            this.flying = 5;
            this.vx = kart.velocity.x * 1.2 + (Math.random() - 0.5) * 4;
            this.vz = kart.velocity.y * 1.2 + (Math.random() - 0.5) * 4;
            this.vy = 7;
            kart.velocity.multiplyScalar(0.82);
            kart.bump(0.5);
            race.emit('obstacle', { kart, type: 'cone' });
          }
        },
      });
    }
  }

  // --- Colectivo que cruza la pista en una esquina ---
  make_bus(d) {
    const path = this.path;
    const s0 = path.distanceAtControl(d.at);
    const i0 = path.indexAt(s0);
    const mesh = busMesh();
    mesh.traverse((o) => { o.castShadow = this.shadows; });
    this.group.add(mesh);
    // Calle transversal y senda peatonal (decoración)
    const street = new THREE.Mesh(new THREE.PlaneGeometry(9, path.wallOffset * 2 + 80).rotateX(-Math.PI / 2), flatMat('#34364a'));
    street.position.set(path.px[i0], 0.01, path.pz[i0]);
    street.rotation.y = path.yawAt(i0);
    this.group.add(street);
    const zebraMat = flatMat('#e8e8f0');
    for (let k = -4; k <= 4; k++) {
      const z = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 6).rotateX(-Math.PI / 2), zebraMat);
      path.pointAt(s0 + 7, k * 2.2, tmp);
      z.position.set(tmp.x, 0.05, tmp.z);
      z.rotation.y = path.yawAt(i0);
      this.group.add(z);
    }
    const W = path.wallOffset + 18;
    const yaw = path.yawAt(i0);
    const warn = mesh.userData.warn;
    this.items.push({
      type: 'bus', period: d.period || 7.3, travel: d.travel || 3.2, active: false, hits: new WeakMap(),
      update(dt, t) {
        const ph = t % this.period;
        this.active = ph < this.travel;
        const f = this.active ? ph / this.travel : 0;
        this.lat = -W + f * 2 * W;
        if (!this.active) this.lat = -W;
        path.pointAt(s0, this.lat, tmp);
        mesh.position.set(tmp.x, 0, tmp.z);
        mesh.rotation.y = yaw - Math.PI / 2; // de frente hacia la derecha de la pista
        // Luces de aviso un segundo antes de arrancar
        warn.visible = !this.active && ph > this.period - 1.2 && Math.sin(t * 20) > 0;
      },
      collide(kart, race) {
        if (!this.active) return;
        const dx = kart.position.x - path.px[i0], dz = kart.position.z - path.pz[i0];
        const along = dx * path.tx[i0] + dz * path.tz[i0];
        const lat = dx * path.nx[i0] + dz * path.nz[i0];
        if (Math.abs(lat - this.lat) < 5.4 && Math.abs(along) < 1.7 + kart.stats.radius) {
          if (race.time - (this.hits.get(kart) ?? -10) < 2) return;
          this.hits.set(kart, race.time);
          const side = along >= 0 ? 1 : -1;
          kart.position.x += path.tx[i0] * side * 1.2;
          kart.position.z += path.tz[i0] * side * 1.2;
          kart.velocity.x = path.tx[i0] * side * 10 + path.nx[i0] * 8;
          kart.velocity.y = path.tz[i0] * side * 10 + path.nz[i0] * 8;
          race.items.hit(kart, null);
          race.emit('obstacle', { kart, type: 'bus' });
        }
      },
    });
  }

  // --- Bola de nieve gigante que cruza rodando ---
  make_snowball(d) {
    const path = this.path;
    const s0 = path.distanceAtControl(d.at);
    const i0 = path.indexAt(s0);
    const r = 2.4;
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), flatMat('#f7fbff'));
    mesh.castShadow = this.shadows;
    this.group.add(mesh);
    const W = path.wallOffset + 10;
    const offset = d.at * 1.7;
    this.items.push({
      type: 'snowball', period: d.period || 7, travel: 3.6, radius: r, hits: new WeakMap(),
      update(dt, t) {
        const ph = (t + offset) % this.period;
        this.active = ph < this.travel;
        mesh.visible = this.active;
        if (!this.active) return;
        this.lat = W - (ph / this.travel) * 2 * W;
        path.pointAt(s0, this.lat, tmp);
        this.x = tmp.x; this.z = tmp.z;
        mesh.position.set(tmp.x, r, tmp.z);
        mesh.rotation.y = path.yawAt(i0);
        mesh.rotation.x = 0;
        mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), -this.lat / r);
      },
      collide(kart, race) {
        if (!this.active) return;
        if (dist2(kart, this) < (kart.stats.radius + r) ** 2) {
          if (race.time - (this.hits.get(kart) ?? -10) < 2) return;
          this.hits.set(kart, race.time);
          kart.velocity.x -= path.nx[i0] * 12;
          kart.velocity.y -= path.nz[i0] * 12;
          race.items.hit(kart, null);
          race.burst(kart.position.x, 1, kart.position.z, ['#ffffff', '#dcefff'], 18);
          race.emit('obstacle', { kart, type: 'snowball' });
        }
      },
    });
  }

  // --- Placa de hielo: el kart patina ---
  make_ice(d) {
    const path = this.path;
    const s0 = path.distanceAtControl(d.at) - d.length / 2;
    const center = (((d.at * 0.71) % 1) - 0.5) * path.halfWidth * 0.8;
    const half = path.halfWidth * 0.55;
    const pos = [];
    const n = Math.ceil(d.length / 2);
    for (let k = 0; k < n; k++) {
      const a = s0 + (k / n) * d.length, b = s0 + ((k + 1) / n) * d.length;
      // Bordes irregulares para que parezca hielo
      const wa = half * (0.75 + 0.25 * Math.sin(k * 1.7)), wb = half * (0.75 + 0.25 * Math.sin((k + 1) * 1.7));
      const ta = Math.sin((k / n) * Math.PI) ** 0.4, tb = Math.sin(((k + 1) / n) * Math.PI) ** 0.4;
      const p1 = path.pointAt(a, center - wa * ta), p2 = path.pointAt(a, center + wa * ta);
      const p3 = path.pointAt(b, center - wb * tb), p4 = path.pointAt(b, center + wb * tb);
      for (const v of [p1, p2, p3, p2, p4, p3]) pos.push(v.x, 0.05, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#dff6ff', emissive: '#6fb7d9', emissiveIntensity: 0.35, side: THREE.DoubleSide }));
    mesh.receiveShadow = this.shadows;
    this.group.add(mesh);
    this.ice.push({ s0, len: d.length, center, half });
  }

  applySurface(kart, q, surf) {
    for (const p of this.ice) {
      if (inRange(q.distance, p.s0, p.len, this.path.length) && Math.abs(q.lateral - p.center) < p.half) {
        surf.grip = 0.22;
        surf.ice = true;
      }
    }
  }

  update(dt, race) {
    this.time += dt;
    for (const o of this.items) o.update(dt, this.time, this.path);
    if (!race) return;
    for (const o of this.items) {
      for (const k of race.karts) o.collide(k, race);
    }
  }
}

function dist2(kart, o) {
  const dx = kart.position.x - o.x, dz = kart.position.z - o.z;
  return dx * dx + dz * dz;
}

function crabMesh() {
  const g = new THREE.Group();
  const red = flatMat('#ff5a3c'), dark = flatMat('#c63a22'), white = flatMat('#ffffff'), black = flatMat('#1b1f3a');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 5), red);
  body.scale.set(1, 0.45, 0.75);
  body.position.y = 0.45;
  g.add(body);
  for (const side of [-1, 1]) {
    const claw = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), dark);
    claw.position.set(side * 0.95, 0.55, 0.35);
    g.add(claw);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 4), dark);
    stalk.position.set(side * 0.25, 0.85, 0.3);
    g.add(stalk);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), white);
    eye.position.set(side * 0.25, 1.08, 0.3);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 3), black);
    pupil.position.set(0, 0, 0.09);
    eye.add(pupil);
    g.add(eye);
    for (let k = 0; k < 3; k++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), dark);
      leg.position.set(side * 0.8, 0.25, -0.25 + k * 0.25);
      leg.rotation.z = side * -0.5;
      g.add(leg);
    }
  }
  return bake(g);
}

function coneMesh() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), flatMat('#ff7a1a'));
  base.position.y = 0.06;
  g.add(base);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.1, 8), flatMat('#ff7a1a'));
  cone.position.y = 0.65;
  g.add(cone);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.18, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  stripe.position.y = 0.72;
  g.add(stripe);
  return bake(g);
}

function busMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.8, 10), flatMat('#ffb703'));
  body.position.y = 1.9;
  g.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.4, 10.05), flatMat('#e8483b'));
  stripe.position.y = 1.2;
  g.add(stripe);
  const glass = new THREE.MeshBasicMaterial({ color: '#9ff3ff' });
  const windows = new THREE.Mesh(new THREE.BoxGeometry(3.08, 0.9, 8.6), glass);
  windows.position.y = 2.6;
  g.add(windows);
  const front = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.1), glass);
  front.position.set(0, 2.5, 5.02);
  g.add(front);
  const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10).rotateZ(Math.PI / 2);
  for (const [x, z] of [[1.4, 3.3], [-1.4, 3.3], [1.4, -3.3], [-1.4, -3.3]]) {
    const w = new THREE.Mesh(wheelGeo, flatMat('#1b1f3a'));
    w.position.set(x, 0.6, z);
    g.add(w);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: '#fff6b0' });
  for (const x of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.1), lightMat);
    l.position.set(x, 1.1, 5.03);
    g.add(l);
  }
  // Balizas de aviso
  const warn = new THREE.Group();
  const warnMat = new THREE.MeshBasicMaterial({ color: '#ff9f1a' });
  for (const x of [-1.4, 1.4]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 4), warnMat);
    b.position.set(x, 3.5, 4.6);
    warn.add(b);
  }
  g.add(warn);
  g.userData.warn = warn;
  return bake(g, (o) => o === warn);
}
