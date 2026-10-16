import * as THREE from 'three';
import { flatMat } from './kartModel.js';

// Pilotos low-poly basados en los diseños de referencia (referencias/flow/images/characters).
// Cada función devuelve { root, head } para poder animar la cabeza.

const G = {
  sphere: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  ico: (r, d = 1) => new THREE.IcosahedronGeometry(r, d),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s),
  cone: (r, h, s = 6) => new THREE.ConeGeometry(r, h, s),
  torus: (r, t, rs = 5, ts = 10, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc),
};

function part(parent, geometry, color, [x, y, z] = [0, 0, 0], { rot, scale, basic } = {}) {
  const m = new THREE.Mesh(geometry, basic ? new THREE.MeshBasicMaterial({ color }) : flatMat(color));
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true;
  parent.add(m);
  return m;
}

// Brazos que van al volante
function arms(root, color, { y = 0.55, spread = 0.36, len = 0.6 } = {}) {
  for (const side of [-1, 1]) {
    const a = part(root, G.cyl(0.08, 0.09, len, 5), color, [side * spread, y, 0.3], { rot: [Math.PI / 2.6, 0, side * 0.35] });
    part(a, G.sphere(0.11, 6, 4), color, [0, -len / 2, 0]);
  }
}

function eyes(head, [x, y, z], { r = 0.07, white = false, spread } = {}) {
  for (const side of [-1, 1]) {
    if (white) {
      const e = part(head, G.sphere(r * 1.6, 8, 6), '#ffffff', [side * (spread ?? x), y, z]);
      part(e, G.sphere(r, 6, 4), '#1b1f3a', [0, 0, r * 1.1]);
    } else {
      part(head, G.sphere(r, 6, 4), '#1b1f3a', [side * (spread ?? x), y, z]);
    }
  }
}

const BUILDERS = {
  // Carpincho con antiparras rojas y mameluco amarillo
  chispa() {
    const root = new THREE.Group();
    const fur = '#c8834a', dark = '#9c5f30';
    part(root, G.box(0.85, 0.7, 0.6), '#ffcc33', [0, 0.45, 0]);
    for (const side of [-1, 1]) part(root, G.box(0.1, 0.5, 0.62), '#e0a812', [side * 0.25, 0.75, 0]);
    part(root, G.box(0.9, 0.35, 0.62), fur, [0, 0.95, 0]);
    arms(root, fur);
    const head = new THREE.Group();
    head.position.set(0, 1.35, 0.05);
    root.add(head);
    part(head, G.box(0.72, 0.62, 0.7), fur, [0, 0, 0]);
    part(head, G.box(0.6, 0.42, 0.35), dark, [0, -0.08, 0.45]);
    part(head, G.box(0.16, 0.08, 0.06), '#3b2414', [0, 0.04, 0.63]);
    for (const side of [-1, 1]) part(head, G.sphere(0.11, 6, 4), dark, [side * 0.3, 0.36, -0.12]);
    eyes(head, [0.2, 0.12, 0.36], { r: 0.065 });
    // Antiparras en la frente
    for (const side of [-1, 1]) {
      const g = part(head, G.torus(0.12, 0.045), '#e8483b', [side * 0.16, 0.35, 0.2], { rot: [-0.4, 0, 0] });
      part(g, G.cyl(0.1, 0.1, 0.03, 8), '#ffb3a6', [0, 0, 0], { rot: [Math.PI / 2, 0, 0] });
    }
    part(head, G.box(0.76, 0.06, 0.74), '#a8322a', [0, 0.32, 0]);
    return { root, head };
  },

  // Rinoceronte con casco naranja y chaleco azul
  tronco() {
    const root = new THREE.Group();
    const skin = '#8d939e', dark = '#6f7580';
    part(root, G.box(1.05, 0.9, 0.75), '#2b3a67', [0, 0.55, 0]);
    part(root, G.box(0.5, 0.88, 0.78), skin, [0, 0.55, 0]);
    arms(root, skin, { spread: 0.48, len: 0.62 });
    const head = new THREE.Group();
    head.position.set(0, 1.35, 0.08);
    root.add(head);
    part(head, G.box(0.7, 0.62, 0.72), skin, [0, 0, 0]);
    part(head, G.box(0.56, 0.42, 0.5), skin, [0, -0.1, 0.5]);
    part(head, G.cone(0.13, 0.42, 6), '#e9e2d0', [0, 0.18, 0.68], { rot: [0.5, 0, 0] });
    part(head, G.cone(0.08, 0.2, 6), '#e9e2d0', [0, 0.18, 0.38], { rot: [0.3, 0, 0] });
    for (const side of [-1, 1]) part(head, G.cone(0.1, 0.25, 4), dark, [side * 0.3, 0.38, -0.15]);
    eyes(head, [0.22, 0.1, 0.37], { r: 0.06 });
    // Casco de obra
    part(head, G.sphere(0.44, 10, 6, 0), '#ff8c1a', [0, 0.3, -0.02], { scale: [1, 0.55, 1] });
    part(head, G.cyl(0.5, 0.5, 0.05, 12), '#ff8c1a', [0, 0.3, 0.06]);
    return { root, head };
  },

  // Robot turquesa con pantalla y ojos que brillan
  pixel() {
    const root = new THREE.Group();
    const teal = '#1fc8b8';
    part(root, G.cyl(0.38, 0.45, 0.75, 10), teal, [0, 0.5, 0]);
    part(root, G.box(0.4, 0.3, 0.08), '#16324f', [0, 0.6, 0.38]);
    arms(root, '#e9edf2', { spread: 0.42 });
    const head = new THREE.Group();
    head.position.set(0, 1.35, 0.02);
    root.add(head);
    part(head, G.sphere(0.5, 12, 9), teal, [0, 0, 0]);
    part(head, G.sphere(0.4, 12, 8), '#0e1b2f', [0, -0.02, 0.17], { scale: [1.05, 0.8, 0.8] });
    for (const side of [-1, 1]) part(head, G.box(0.1, 0.16, 0.05), '#9ff6ff', [side * 0.13, 0.02, 0.5], { basic: true });
    part(head, G.cyl(0.03, 0.03, 0.3, 5), '#e9edf2', [0, 0.6, 0]);
    part(head, G.sphere(0.08, 6, 4), '#1fc8b8', [0, 0.78, 0]);
    for (const side of [-1, 1]) part(head, G.cyl(0.12, 0.12, 0.1, 8), '#e9edf2', [side * 0.5, 0, 0], { rot: [0, 0, Math.PI / 2] });
    return { root, head };
  },

  // Ajolote rosa con branquias y bufanda violeta
  brisa() {
    const root = new THREE.Group();
    const pink = '#ff9ccc', magenta = '#d94f9e';
    part(root, G.sphere(0.42, 8, 6), pink, [0, 0.55, 0], { scale: [1, 1.1, 0.9] });
    arms(root, pink, { spread: 0.36 });
    // Bufanda
    part(root, G.torus(0.3, 0.1, 5, 10), '#9b5de5', [0, 0.95, 0], { rot: [Math.PI / 2, 0, 0] });
    const tail = part(root, G.box(0.18, 0.06, 0.7), '#9b5de5', [0.2, 0.95, -0.55], { rot: [0.25, 0.3, 0] });
    tail.userData.flutter = true;
    const head = new THREE.Group();
    head.position.set(0, 1.3, 0.05);
    root.add(head);
    part(head, G.sphere(0.5, 10, 8), pink, [0, 0, 0], { scale: [1.25, 0.85, 0.95] });
    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        part(head, G.cone(0.08, 0.42, 4), magenta, [side * 0.62, 0.05 + (k - 1) * 0.17, -0.05], { rot: [0, 0, side * (-1.2 + (k - 1) * 0.45)] });
      }
    }
    eyes(head, [0.28, 0.08, 0.4], { r: 0.065 });
    part(head, G.torus(0.09, 0.025, 4, 8, Math.PI), '#a3336e', [0, -0.12, 0.45], { rot: [0, 0, Math.PI] });
    return { root, head };
  },

  // Tortuga verde con caparazón
  coco() {
    const root = new THREE.Group();
    const green = '#5cb85c';
    part(root, G.sphere(0.5, 10, 6, 0), '#7a5a2c', [0, 0.65, -0.18], { scale: [1, 1.05, 0.8] });
    part(root, G.sphere(0.38, 8, 6), '#f4d35e', [0, 0.55, 0.12], { scale: [1, 1.1, 0.6] });
    arms(root, green);
    const head = new THREE.Group();
    head.position.set(0, 1.25, 0.15);
    root.add(head);
    part(head, G.sphere(0.36, 8, 6), green, [0, 0, 0], { scale: [1, 0.9, 1.1] });
    eyes(head, [0.15, 0.08, 0.3], { r: 0.05, white: true });
    part(head, G.box(0.5, 0.1, 0.42), '#e63946', [0, 0.22, 0]);
    return { root, head };
  },

  // Oveja esponjosa
  rulo() {
    const root = new THREE.Group();
    for (const [x, y, z] of [[0, 0.55, 0], [0.25, 0.7, 0.05], [-0.25, 0.7, 0.05], [0, 0.85, -0.1], [0.15, 0.4, 0.15], [-0.15, 0.4, 0.15]]) {
      part(root, G.ico(0.3, 0), '#f6f6f2', [x, y, z]);
    }
    arms(root, '#2b2d42');
    const head = new THREE.Group();
    head.position.set(0, 1.3, 0.12);
    root.add(head);
    part(head, G.box(0.42, 0.5, 0.45), '#2b2d42', [0, -0.05, 0.05]);
    for (const [x, y, z] of [[0, 0.25, -0.05], [0.18, 0.2, -0.1], [-0.18, 0.2, -0.1]]) part(head, G.ico(0.18, 0), '#f6f6f2', [x, y, z]);
    for (const side of [-1, 1]) part(head, G.box(0.28, 0.1, 0.14), '#2b2d42', [side * 0.3, 0.05, 0]);
    eyes(head, [0.11, 0.02, 0.28], { r: 0.045, white: true });
    part(head, G.box(0.3, 0.06, 0.06), '#4cc9f0', [0, 0.28, 0.2]);
    return { root, head };
  },

  // Rana verde con ojos grandes
  mora() {
    const root = new THREE.Group();
    const lime = '#7ccf3a';
    part(root, G.sphere(0.4, 8, 6), lime, [0, 0.5, 0], { scale: [1.1, 1, 0.9] });
    part(root, G.sphere(0.3, 8, 6), '#e9f7c9', [0, 0.45, 0.15], { scale: [1, 1, 0.6] });
    arms(root, lime);
    const head = new THREE.Group();
    head.position.set(0, 1.18, 0.08);
    root.add(head);
    part(head, G.sphere(0.45, 10, 6), lime, [0, 0, 0], { scale: [1.25, 0.7, 1] });
    for (const side of [-1, 1]) {
      const e = part(head, G.sphere(0.17, 8, 6), lime, [side * 0.3, 0.28, 0.12]);
      part(e, G.sphere(0.11, 8, 6), '#ffffff', [0, 0.04, 0.09]);
      part(e, G.sphere(0.06, 6, 4), '#1b1f3a', [0, 0.05, 0.18]);
    }
    part(head, G.torus(0.2, 0.025, 4, 10, Math.PI), '#3d6b1f', [0, -0.05, 0.4], { rot: [0, 0, Math.PI] });
    part(head, G.box(0.85, 0.09, 0.2), '#e63946', [0, 0.05, -0.3]);
    return { root, head };
  },

  // Búho violeta con ojos enormes
  nube() {
    const root = new THREE.Group();
    const purple = '#6d5bd0';
    part(root, G.sphere(0.45, 8, 6), purple, [0, 0.6, 0], { scale: [1, 1.15, 0.9] });
    part(root, G.sphere(0.32, 8, 6), '#c9bff5', [0, 0.55, 0.16], { scale: [1, 1.1, 0.6] });
    arms(root, purple);
    const head = new THREE.Group();
    head.position.set(0, 1.35, 0.05);
    root.add(head);
    part(head, G.sphere(0.45, 10, 8), purple, [0, 0, 0]);
    for (const side of [-1, 1]) {
      const ring = part(head, G.cyl(0.2, 0.2, 0.06, 10), '#ffd166', [side * 0.19, 0.04, 0.37], { rot: [Math.PI / 2, 0, 0] });
      part(ring, G.cyl(0.14, 0.14, 0.07, 10), '#ffffff', [0, 0.01, 0]);
      part(ring, G.cyl(0.07, 0.07, 0.08, 8), '#1b1f3a', [0, 0.02, 0]);
      part(head, G.cone(0.1, 0.3, 4), purple, [side * 0.3, 0.45, -0.05], { rot: [0, 0, side * -0.4] });
    }
    part(head, G.cone(0.07, 0.18, 4), '#ffb000', [0, -0.12, 0.45], { rot: [Math.PI / 2, 0, 0] });
    return { root, head };
  },
};

export function buildDriver(characterId) {
  const build = BUILDERS[characterId] || BUILDERS.pixel;
  const d = build();
  d.root.scale.setScalar(0.85);
  return d;
}
