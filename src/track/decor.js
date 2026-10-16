import * as THREE from 'three';

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
  group.add(g);
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
