import * as THREE from 'three';
import { bake } from '../core/bake.js';

// Decoración de cada pista (árboles, rocas, colinas, nubes...).
// Se usan InstancedMesh para dibujar cientos de objetos de una vez.

export function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dummy = new THREE.Object3D();
const col = new THREE.Color();

// Crea un InstancedMesh a partir de una lista de {x,y,z,s,sy,ry,color}
export function instanced(geometry, list, { shadows = false, material } = {}) {
  if (!list.length) return null;
  const mat = material || new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, mat, list.length);
  list.forEach((o, i) => {
    dummy.position.set(o.x, o.y || 0, o.z);
    dummy.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    dummy.scale.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, col.set(o.color || '#ffffff'));
  });
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
}

// Distancia mínima de un punto a la pista (aproximada, con los puntos muestreados)
export function distanceToTrack(path, x, z, stride = 2) {
  let best = Infinity;
  for (let i = 0; i < path.count; i += stride) {
    const dx = x - path.px[i], dz = z - path.pz[i];
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

export function trackBounds(path) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < path.count; i++) {
    minX = Math.min(minX, path.px[i]); maxX = Math.max(maxX, path.px[i]);
    minZ = Math.min(minZ, path.pz[i]); maxZ = Math.max(maxZ, path.pz[i]);
  }
  return { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, w: maxX - minX, h: maxZ - minZ };
}

// Genera puntos al azar alrededor de la pista que no la pisen
export function scatter(path, rand, count, { minDist, maxDist = 90, tries = 30 } = {}) {
  const b = trackBounds(path);
  const out = [];
  for (let k = 0; k < count; k++) {
    for (let t = 0; t < tries; t++) {
      const x = b.minX - maxDist + rand() * (b.w + maxDist * 2);
      const z = b.minZ - maxDist + rand() * (b.h + maxDist * 2);
      const d = distanceToTrack(path, x, z, 3);
      if (d > minDist && d < maxDist) { out.push({ x, z, d }); break; }
    }
  }
  return out;
}

export const DECOR_BUILDERS = {};

export function buildDecor(kind, path, theme, quality, extra = {}) {
  const fn = DECOR_BUILDERS[kind];
  return fn ? fn(path, theme, quality, extra) : new THREE.Group();
}

// Nubes y colinas lejanas (comunes a varias pistas)
export function addSkyAndHills(group, path, rand, { hillColors, cloudColor = '#ffffff', hills = 14, clouds = 10, shadows = false }) {
  const b = trackBounds(path);
  const r = Math.max(b.w, b.h) / 2 + 150;
  const hillList = [];
  for (let i = 0; i < hills; i++) {
    const a = (i / hills) * Math.PI * 2 + rand() * 0.3;
    const rr = r + rand() * 80;
    hillList.push({
      x: b.cx + Math.cos(a) * rr, y: -6, z: b.cz + Math.sin(a) * rr,
      sx: 40 + rand() * 50, sy: 18 + rand() * 30, sz: 40 + rand() * 50,
      ry: rand() * 6, color: hillColors[i % hillColors.length],
    });
  }
  const hm = instanced(new THREE.IcosahedronGeometry(1, 1), hillList, { shadows });
  if (hm) group.add(hm);
  const cloudList = [];
  for (let i = 0; i < clouds; i++) {
    const cx = b.cx + (rand() - 0.5) * (b.w + 300), cz = b.cz + (rand() - 0.5) * (b.h + 300);
    const cy = 55 + rand() * 30;
    for (let k = 0; k < 4; k++) {
      cloudList.push({ x: cx + (k - 1.5) * 7 + rand() * 3, y: cy + rand() * 3, z: cz + rand() * 5, s: 5 + rand() * 4, color: cloudColor });
    }
  }
  const cm = instanced(new THREE.IcosahedronGeometry(1, 0), cloudList, { material: new THREE.MeshLambertMaterial({ flatShading: true, emissive: '#555555' }) });
  if (cm) group.add(cm);
}

// Árboles low-poly (tronco + copa), en dos InstancedMesh
export function addTrees(group, points, rand, { foliage, trunk = '#7a5230', shape = 'round', shadows = false, scale = 1 }) {
  const trunks = [], tops = [];
  for (const p of points) {
    const s = (0.8 + rand() * 0.6) * scale;
    trunks.push({ x: p.x, y: 1.2 * s, z: p.z, sx: s, sy: s, sz: s, color: trunk });
    const c = foliage[Math.floor(rand() * foliage.length)];
    if (shape === 'pine') {
      tops.push({ x: p.x, y: 4.2 * s, z: p.z, sx: 2.4 * s, sy: 4.5 * s, sz: 2.4 * s, ry: rand() * 6, color: c });
    } else {
      tops.push({ x: p.x, y: 3.6 * s, z: p.z, s: 2.4 * s, ry: rand() * 6, color: c });
    }
  }
  const tg = new THREE.CylinderGeometry(0.25, 0.4, 2.4, 6);
  const fg = shape === 'pine' ? new THREE.ConeGeometry(1, 1, 7) : new THREE.IcosahedronGeometry(1, 0);
  const a = instanced(tg, trunks, { shadows });
  const b = instanced(fg, tops, { shadows });
  if (a) group.add(a);
  if (b) group.add(b);
}

// Tribuna con público (cubitos de colores) junto a la largada
export function addGrandstand(group, path, { side = 1, colors, offset = 6, shadows = false }) {
  const g = new THREE.Group();
  const i = path.wrap(Math.round(-12 / path.spacing));
  const x = path.px[i] + path.nx[i] * side * (path.wallOffset + offset);
  const z = path.pz[i] + path.nz[i] * side * (path.wallOffset + offset);
  g.position.set(x, 0, z);
  g.rotation.y = path.yawAt(i) + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
  const steps = 4, len = 34;
  const stepMat = new THREE.MeshLambertMaterial({ color: '#d9dde8', flatShading: true });
  const people = [];
  const rand = seededRandom(77);
  for (let k = 0; k < steps; k++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(len, 1 + k * 1.1, 2.2), stepMat);
    step.position.set(0, (1 + k * 1.1) / 2, -k * 2.2);
    step.castShadow = shadows;
    step.receiveShadow = shadows;
    g.add(step);
    for (let p = 0; p < 14; p++) {
      if (rand() < 0.25) continue;
      people.push({ x: -len / 2 + 1.5 + p * 2.3 + rand() * 0.5, y: 1 + k * 1.1 + 0.55, z: -k * 2.2, s: 0.8, color: colors[Math.floor(rand() * colors.length)] });
    }
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 0.4, 10), new THREE.MeshLambertMaterial({ color: '#e8483b', flatShading: true }));
  roof.position.set(0, 9, -3.5);
  roof.castShadow = shadows;
  g.add(roof);
  for (const x of [-len / 2, len / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), stepMat);
    post.position.set(x, 4.5, -7.5);
    g.add(post);
  }
  const pm = instanced(new THREE.BoxGeometry(0.9, 1.1, 0.9), people);
  if (pm) g.add(pm);
  group.add(bake(g));
}

// --- Pradera ---
DECOR_BUILDERS.meadow = (path, theme, quality) => {
  const group = new THREE.Group();
  const rand = seededRandom(11);
  const density = quality.decorDensity;
  const shadows = quality.shadows;
  const minDist = path.wallOffset + 5;
  const trees = scatter(path, rand, Math.round(260 * density), { minDist, maxDist: 120 });
  addTrees(group, trees, rand, { foliage: ['#3f9c35', '#4fb33f', '#2f8a3a', '#62c04b'], shadows });
  const bushes = scatter(path, rand, Math.round(160 * density), { minDist: path.wallOffset + 2, maxDist: 60 });
  const bm = instanced(new THREE.IcosahedronGeometry(1, 0), bushes.map((p) => ({
    x: p.x, y: 0.5, z: p.z, s: 0.9 + rand() * 0.9, ry: rand() * 6, color: rand() < 0.2 ? '#f7a8c8' : '#4a9f3c',
  })));
  if (bm) group.add(bm);
  const rocks = scatter(path, rand, Math.round(50 * density), { minDist: path.wallOffset + 3, maxDist: 100 });
  const rm = instanced(new THREE.DodecahedronGeometry(1, 0), rocks.map((p) => ({
    x: p.x, y: 0.4, z: p.z, s: 0.8 + rand() * 1.6, ry: rand() * 6, color: rand() < 0.5 ? '#a7a9b5' : '#8e909c',
  })), { shadows });
  if (rm) group.add(rm);
  addSkyAndHills(group, path, rand, { hillColors: ['#5fb847', '#4ea83b', '#79c75a'] });
  addGrandstand(group, path, { side: 1, colors: ['#ffcc33', '#e8483b', '#3a86ff', '#ffffff', '#8338ec', '#06d6a0'], shadows });
  return group;
};

// --- Playa ---
DECOR_BUILDERS.beach = (path, theme, quality, def) => {
  const group = new THREE.Group();
  const rand = seededRandom(23);
  const density = quality.decorDensity;
  const shadows = quality.shadows;
  const b = trackBounds(path);

  // Mar al oeste
  const seaEdge = b.minX + 20;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1600), new THREE.MeshLambertMaterial({ color: '#2aa7d6' }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(seaEdge - 600, 0.008, b.cz);
  group.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(4, 1600), new THREE.MeshBasicMaterial({ color: '#e9fbff' }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(seaEdge, 0.012, b.cz);
  group.add(foam);
  const onLand = (p) => p.x > seaEdge + 6;

  // Palmeras: tronco curvo de 3 partes y hojas alrededor
  const palms = scatter(path, rand, Math.round(110 * density), { minDist: path.wallOffset + 4, maxDist: 90 }).filter(onLand);
  const trunks = [], leaves = [], coconuts = [];
  for (const p of palms) {
    const s = 0.9 + rand() * 0.5;
    const lean = (rand() - 0.5) * 0.5, dir = rand() * Math.PI * 2;
    let x = p.x, y = 0, z = p.z;
    for (let k = 0; k < 3; k++) {
      const tilt = lean * (k + 1) * 0.5;
      trunks.push({ x, y: y + 1.4 * s, z, sx: s * (1 - k * 0.12), sy: s, sz: s * (1 - k * 0.12), rx: Math.cos(dir) * tilt, rz: Math.sin(dir) * tilt, color: k % 2 ? '#9c6b3c' : '#b07d48' });
      x += Math.sin(dir) * tilt * 2.6 * s; z += Math.cos(dir) * tilt * 2.6 * s; y += 2.7 * s;
    }
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + rand() * 0.3;
      leaves.push({ x: x + Math.sin(a) * 1.6 * s, y: y + 0.1, z: z + Math.cos(a) * 1.6 * s, sx: 0.8 * s, sy: 0.12 * s, sz: 3.6 * s, ry: a, rx: 0.35, color: rand() < 0.5 ? '#3fae5a' : '#2f9a4c' });
    }
    if (rand() < 0.6) coconuts.push({ x, y: y - 0.3, z, s: 0.35 * s, color: '#6b4a2b' });
  }
  for (const [geo, list] of [[new THREE.CylinderGeometry(0.32, 0.4, 2.8, 6), trunks], [new THREE.BoxGeometry(1, 1, 1), leaves], [new THREE.IcosahedronGeometry(1, 0), coconuts]]) {
    const m = instanced(geo, list, { shadows });
    if (m) group.add(m);
  }

  // Sombrillas y toallas
  const umbrellas = scatter(path, rand, Math.round(40 * density), { minDist: path.wallOffset + 3, maxDist: 40 }).filter(onLand);
  const poles = [], tops = [], towels = [];
  const umbrellaColors = ['#ff5d8f', '#ffd23f', '#3dd6ff', '#ff8a3d', '#7bff6b'];
  for (const p of umbrellas) {
    const c = umbrellaColors[Math.floor(rand() * umbrellaColors.length)];
    poles.push({ x: p.x, y: 1.3, z: p.z, s: 1, color: '#f1f1f1' });
    tops.push({ x: p.x, y: 2.7, z: p.z, sx: 2.2, sy: 0.8, sz: 2.2, ry: rand() * 3, color: c });
    towels.push({ x: p.x + 1.5, y: 0.03, z: p.z + 0.5, sx: 1.2, sy: 0.05, sz: 2.2, ry: rand() * 3, color: umbrellaColors[Math.floor(rand() * 5)] });
  }
  for (const [geo, list] of [[new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), poles], [new THREE.ConeGeometry(1, 1, 8), tops], [new THREE.BoxGeometry(1, 1, 1), towels]]) {
    const m = instanced(geo, list, { shadows });
    if (m) group.add(m);
  }

  // Pilotes del muelle
  for (const z of def.zones || []) {
    const a = path.sampleAtControl(z.from), bIdx = path.sampleAtControl(z.to);
    const posts = [];
    for (let i = a; i !== bIdx; i = (i + 1) % path.count) {
      if (i % 4) continue;
      for (const side of [-1, 1]) {
        const off = side * (path.wallOffset + 0.4);
        posts.push({ x: path.px[i] + path.nx[i] * off, y: 0.5, z: path.pz[i] + path.nz[i] * off, sx: 0.5, sy: 2.2, sz: 0.5, color: '#6b4a2b' });
      }
    }
    const pm = instanced(new THREE.BoxGeometry(1, 1, 1), posts, { shadows });
    if (pm) group.add(pm);
  }

  // Casitas de playa
  const huts = scatter(path, rand, Math.round(8 * density) + 2, { minDist: path.wallOffset + 10, maxDist: 60 }).filter(onLand);
  for (const p of huts) {
    const h = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), new THREE.MeshLambertMaterial({ color: '#f6e3b4', flatShading: true }));
    body.position.y = 1.5;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 4), new THREE.MeshLambertMaterial({ color: '#c98b4a', flatShading: true }));
    roof.position.y = 4.2;
    roof.rotation.y = Math.PI / 4;
    h.add(body, roof);
    h.position.set(p.x, 0, p.z);
    h.rotation.y = rand() * 6;
    h.traverse((o) => { o.castShadow = shadows; });
    group.add(bake(h));
  }
  const rocks = scatter(path, rand, Math.round(30 * density), { minDist: path.wallOffset + 3, maxDist: 100 });
  const rm = instanced(new THREE.DodecahedronGeometry(1, 0), rocks.map((p) => ({ x: p.x, y: 0.3, z: p.z, s: 0.8 + rand() * 1.8, ry: rand() * 6, color: '#b9a88f' })), { shadows });
  if (rm) group.add(rm);
  addSkyAndHills(group, path, rand, { hillColors: ['#5fb847', '#e9cf8c', '#79c75a'], hills: 10 });
  addGrandstand(group, path, { side: 1, colors: ['#ff5d8f', '#ffd23f', '#3dd6ff', '#ffffff', '#ff8a3d'], shadows });
  return group;
};

// --- Ciudad de noche ---
function windowsTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000000';
  g.fillRect(0, 0, 64, 128);
  const rand = seededRandom(5);
  for (let y = 4; y < 124; y += 10) {
    for (let x = 4; x < 60; x += 10) {
      if (rand() < 0.55) {
        g.fillStyle = rand() < 0.7 ? '#ffd98a' : '#8fe9ff';
        g.fillRect(x, y, 6, 6);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

DECOR_BUILDERS.city = (path, theme, quality) => {
  const group = new THREE.Group();
  const rand = seededRandom(31);
  const density = quality.decorDensity;
  const shadows = quality.shadows;

  // Edificios con ventanas iluminadas
  const tex = typeof document !== 'undefined' ? windowsTexture() : null;
  const mat = new THREE.MeshLambertMaterial({ emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 1, flatShading: true });
  const spots = scatter(path, rand, Math.round(170 * density) + 30, { minDist: path.wallOffset + 10, maxDist: 150 });
  const buildings = spots.map((p) => {
    const w = 10 + rand() * 14, d = 10 + rand() * 14;
    const h = 14 + rand() * (p.d > 60 ? 70 : 40);
    return { x: p.x, y: h / 2, z: p.z, sx: w, sy: h, sz: d, ry: Math.round(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.2,
      color: ['#2a2350', '#30285e', '#1f2a4f', '#3a2a55'][Math.floor(rand() * 4)] };
  });
  const bm = instanced(new THREE.BoxGeometry(1, 1, 1), buildings, { material: mat, shadows: false });
  if (bm) group.add(bm);

  // Carteles de neón
  const neonColors = ['#ff3fb4', '#2be4ff', '#ffe14d', '#7dff6a', '#b26bff'];
  const signs = [];
  for (const b of buildings) {
    if (rand() > 0.55) continue;
    const ang = b.ry + Math.floor(rand() * 4) * (Math.PI / 2);
    const fx = Math.sin(ang), fz = Math.cos(ang);
    const half = Math.max(b.sx, b.sz) / 2;
    signs.push({ x: b.x + fx * (half + 0.3), y: 6 + rand() * (b.sy - 10), z: b.z + fz * (half + 0.3), sx: 4 + rand() * 6, sy: 1 + rand() * 1.4, sz: 0.3, ry: ang, color: neonColors[Math.floor(rand() * neonColors.length)] });
  }
  const sm = instanced(new THREE.BoxGeometry(1, 1, 1), signs, { material: new THREE.MeshBasicMaterial() });
  if (sm) group.add(sm);

  // Faroles a los costados
  const poles = [], lamps = [];
  for (let i = 0; i < path.count; i += Math.round(36 / path.spacing)) {
    for (const side of [-1, 1]) {
      const off = side * (path.wallOffset + 2);
      const x = path.px[i] + path.nx[i] * off, z = path.pz[i] + path.nz[i] * off;
      poles.push({ x, y: 3, z, sx: 0.25, sy: 6, sz: 0.25, color: '#3b3f58' });
      lamps.push({ x: x - path.nx[i] * side * 0.8, y: 6.1, z: z - path.nz[i] * side * 0.8, s: 0.45, color: '#fff3c4' });
    }
  }
  const pm = instanced(new THREE.BoxGeometry(1, 1, 1), poles, { shadows });
  if (pm) group.add(pm);
  const lm = instanced(new THREE.SphereGeometry(1, 8, 6), lamps, { material: new THREE.MeshBasicMaterial() });
  if (lm) group.add(lm);

  // Estrellas y luna
  const b = trackBounds(path);
  const starPos = [];
  for (let i = 0; i < 500; i++) {
    const a = rand() * Math.PI * 2, e = 0.15 + rand() * 1.2, r = 700;
    starPos.push(b.cx + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r * 0.6 + 60, b.cz + Math.sin(a) * Math.cos(e) * r);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false }));
  group.add(stars);
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(30, 1), new THREE.MeshBasicMaterial({ color: '#fff4c9', fog: false }));
  moon.position.set(b.cx + 300, 260, b.cz - 500);
  group.add(moon);
  return group;
};

// --- Montaña nevada ---
DECOR_BUILDERS.snow = (path, theme, quality) => {
  const group = new THREE.Group();
  const rand = seededRandom(47);
  const density = quality.decorDensity;
  const shadows = quality.shadows;

  // Pinos con nieve en la punta
  const pines = scatter(path, rand, Math.round(300 * density), { minDist: path.wallOffset + 4, maxDist: 120 });
  const trunks = [], greens = [], caps = [];
  for (const p of pines) {
    const s = 0.8 + rand() * 0.8;
    trunks.push({ x: p.x, y: 0.8 * s, z: p.z, sx: s, sy: s * 0.7, sz: s, color: '#6b4a2b' });
    greens.push({ x: p.x, y: 3.6 * s, z: p.z, sx: 2.6 * s, sy: 5.5 * s, sz: 2.6 * s, ry: rand() * 6, color: rand() < 0.5 ? '#2f6f4f' : '#2a6146' });
    caps.push({ x: p.x, y: 5.6 * s, z: p.z, sx: 1.3 * s, sy: 2 * s, sz: 1.3 * s, ry: rand() * 6, color: '#ffffff' });
  }
  for (const [geo, list] of [[new THREE.CylinderGeometry(0.25, 0.35, 2.4, 6), trunks], [new THREE.ConeGeometry(1, 1, 7), greens], [new THREE.ConeGeometry(1, 1, 7), caps]]) {
    const m = instanced(geo, list, { shadows });
    if (m) group.add(m);
  }
  const mounds = scatter(path, rand, Math.round(80 * density), { minDist: path.wallOffset + 2, maxDist: 70 });
  const mm = instanced(new THREE.IcosahedronGeometry(1, 1), mounds.map((p) => ({ x: p.x, y: 0, z: p.z, sx: 2 + rand() * 3, sy: 0.8 + rand(), sz: 2 + rand() * 3, color: '#ffffff' })));
  if (mm) group.add(mm);
  const rocks = scatter(path, rand, Math.round(40 * density), { minDist: path.wallOffset + 3, maxDist: 100 });
  const rm = instanced(new THREE.DodecahedronGeometry(1, 0), rocks.map((p) => ({ x: p.x, y: 0.4, z: p.z, s: 1 + rand() * 2, ry: rand() * 6, color: '#7d8597' })), { shadows });
  if (rm) group.add(rm);

  // Montañas lejanas con picos nevados
  const b = trackBounds(path);
  const r = Math.max(b.w, b.h) / 2 + 220;
  const peaks = [], snowCaps = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.2;
    const rr = r + rand() * 120, h = 90 + rand() * 110, w = 70 + rand() * 60;
    const x = b.cx + Math.cos(a) * rr, z = b.cz + Math.sin(a) * rr;
    peaks.push({ x, y: h / 2, z, sx: w, sy: h, sz: w, ry: rand() * 6, color: '#8a9bb5' });
    snowCaps.push({ x, y: h * 0.8, z, sx: w * 0.42, sy: h * 0.42, sz: w * 0.42, ry: rand() * 6, color: '#ffffff' });
  }
  const pk = instanced(new THREE.ConeGeometry(0.5, 1, 6), peaks);
  const sc = instanced(new THREE.ConeGeometry(0.5, 1, 6), snowCaps);
  if (pk) group.add(pk);
  if (sc) group.add(sc);

  // Nieve que cae
  const count = Math.round(1800 * density);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * 220;
    pos[i * 3 + 1] = rand() * 60;
    pos[i * 3 + 2] = (rand() - 0.5) * 220;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.35 }));
  snow.frustumCulled = false;
  group.add(snow);
  group.userData.update = (dt, focus) => {
    const a = sg.attributes.position.array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= dt * (3 + (i % 5));
      a[i * 3] += Math.sin(i + a[i * 3 + 1] * 0.1) * dt * 0.6;
      if (a[i * 3 + 1] < 0) a[i * 3 + 1] += 60;
    }
    sg.attributes.position.needsUpdate = true;
    if (focus) snow.position.set(focus.x, 0, focus.z);
  };
  addGrandstand(group, path, { side: 1, colors: ['#e8483b', '#3a86ff', '#ffffff', '#ffd23f', '#06d6a0'], shadows });
  return group;
};
