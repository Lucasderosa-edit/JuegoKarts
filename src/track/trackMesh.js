import * as THREE from 'three';
import { bake } from '../core/bake.js';

// Construye los meshes de la pista a partir de un TrackPath.
// Todo con colores planos por vértice, en pocas mallas (rápido de dibujar).

const col = new THREE.Color();

function ribbon(path, inner, outer, y, colorFn) {
  // Franja entre dos distancias laterales (pueden ser negativas = izquierda)
  const n = path.count;
  const pos = [], colors = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p = (k, off) => [path.px[k] + path.nx[k] * off, y, path.pz[k] + path.nz[k] * off];
    const a = p(i, inner), b = p(i, outer), c = p(j, inner), d = p(j, outer);
    // Dos triángulos mirando hacia arriba
    const flip = outer > inner;
    const tri = flip ? [a, b, c, b, d, c] : [a, c, b, b, c, d];
    for (const v of tri) pos.push(...v);
    col.set(colorFn(i));
    for (let k = 0; k < 6; k++) colors.push(col.r, col.g, col.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

function wall(path, offset, height, thickness, colorFn) {
  // Muro bajo a lo largo de la pista: cara interna, externa y tapa
  const n = path.count;
  const pos = [], colors = [];
  const side = Math.sign(offset);
  const inner = offset, outer = offset + side * thickness;
  const pt = (k, off, y) => [path.px[k] + path.nx[k] * off, y, path.pz[k] + path.nz[k] * off];
  const quad = (a, b, c, d, color) => {
    for (const v of [a, b, c, b, d, c]) pos.push(...v);
    col.set(color);
    for (let k = 0; k < 6; k++) colors.push(col.r, col.g, col.b);
  };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const c = colorFn(i);
    const faceIn = side > 0;
    // cara hacia la pista
    if (faceIn) quad(pt(i, inner, 0), pt(j, inner, 0), pt(i, inner, height), pt(j, inner, height), c);
    else quad(pt(j, inner, 0), pt(i, inner, 0), pt(j, inner, height), pt(i, inner, height), c);
    // tapa
    if (faceIn) quad(pt(i, inner, height), pt(j, inner, height), pt(i, outer, height), pt(j, outer, height), c);
    else quad(pt(j, inner, height), pt(i, inner, height), pt(j, outer, height), pt(i, outer, height), c);
    // cara de afuera
    if (faceIn) quad(pt(j, outer, 0), pt(i, outer, 0), pt(j, outer, height), pt(i, outer, height), c);
    else quad(pt(i, outer, 0), pt(j, outer, 0), pt(i, outer, height), pt(j, outer, height), c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function buildTrackMeshes(path, theme, { shadows = true, zones = [] } = {}) {
  const group = new THREE.Group();
  const hw = path.halfWidth;
  const curbW = 1.3;
  // Color de cada muestra según la zona (muelle, etc.)
  const zoneAt = new Array(path.count).fill(null);
  for (const z of zones) {
    const a = path.sampleAtControl(z.from), b = path.sampleAtControl(z.to);
    for (let i = a; i !== b; i = (i + 1) % path.count) zoneAt[i] = z;
  }
  const pick = (key) => (i) => (zoneAt[i]?.[key] ?? theme[key]);
  const vc = (opts = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...opts });

  // Pasto lento entre el asfalto y el borde (un poco más oscuro)
  const off = new THREE.Mesh(
    new THREE.BufferGeometry(), vc(),
  );
  const offL = ribbon(path, -path.wallOffset, -hw - curbW, 0.015, pick('offroad'));
  const offR = ribbon(path, hw + curbW, path.wallOffset, 0.015, pick('offroad'));
  off.geometry = mergeGeometries([offL, offR]);
  off.receiveShadow = shadows;
  group.add(off);

  // Asfalto
  const road = new THREE.Mesh(ribbon(path, -hw, hw, 0.03, pick('road')), vc());
  road.receiveShadow = shadows;
  group.add(road);

  // Línea central discontinua
  const road_ = pick('road'), line_ = pick('roadLine');
  const dash = (i) => (Math.floor(i / 3) % 2 === 0 ? line_(i) : road_(i));
  const center = new THREE.Mesh(ribbon(path, -0.22, 0.22, 0.035, dash), theme.night ? new THREE.MeshBasicMaterial({ vertexColors: true }) : vc());
  center.receiveShadow = shadows;
  group.add(center);

  // Cordones rojos y blancos
  const ca = pick('curbA'), cb = pick('curbB');
  const curbColor = (i) => (Math.floor(i / 2) % 2 === 0 ? ca(i) : cb(i));
  const curbs = new THREE.Mesh(mergeGeometries([
    ribbon(path, -hw - curbW, -hw, 0.04, curbColor),
    ribbon(path, hw, hw + curbW, 0.04, curbColor),
  ]), vc());
  curbs.receiveShadow = shadows;
  group.add(curbs);

  // Bordes de la pista
  const wa = pick('wallA'), wb = pick('wallB');
  const wallColor = (i) => (Math.floor(i / 3) % 2 === 0 ? wa(i) : wb(i));
  const walls = new THREE.Mesh(mergeGeometries([
    wall(path, path.wallOffset, 0.9, 0.7, wallColor),
    wall(path, -path.wallOffset, 0.9, 0.7, wallColor),
  ]), theme.wallEmissive ? new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }) : vc({ side: THREE.DoubleSide }));
  walls.castShadow = shadows;
  walls.receiveShadow = shadows;
  group.add(walls);

  group.add(buildStartLine(path, theme, shadows));
  return group;
}

function buildStartLine(path, theme, shadows) {
  const g = new THREE.Group();
  const yaw = path.yawAt(0);
  g.position.set(path.px[0], 0, path.pz[0]);
  g.rotation.y = yaw;
  const hw = path.halfWidth;

  // Línea a cuadros sobre el asfalto
  const cols = 12, rows = 2, size = (hw * 2) / cols;
  const black = new THREE.MeshLambertMaterial({ color: '#1d1d24' });
  const white = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const tile = new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const m = new THREE.Mesh(tile, (r + c) % 2 ? black : white);
      m.position.set(-hw + size * (c + 0.5), 0.05, (r - 0.5) * size);
      m.receiveShadow = shadows;
      g.add(m);
    }
  }

  // Arco de largada
  const postGeo = new THREE.BoxGeometry(0.8, 7, 0.8);
  const postMat = new THREE.MeshLambertMaterial({ color: '#3b3f58', flatShading: true });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(side * (hw + 2), 3.5, 0);
    post.castShadow = shadows;
    g.add(post);
  }
  const bannerCols = 16, bw = (hw * 2 + 4.8) / bannerCols;
  const cell = new THREE.BoxGeometry(bw, bw, 0.5);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < bannerCols; c++) {
      const m = new THREE.Mesh(cell, (r + c) % 2 ? black : white);
      m.position.set(-(hw + 2.4) + bw * (c + 0.5), 6.6 + r * bw, 0);
      g.add(m);
    }
  }
  return bake(g);
}

// Une varias geometrías no indexadas con los mismos atributos.
export function mergeGeometries(list) {
  const attrs = Object.keys(list[0].attributes);
  const merged = new THREE.BufferGeometry();
  for (const name of attrs) {
    const size = list[0].attributes[name].itemSize;
    let total = 0;
    for (const g of list) total += g.attributes[name].array.length;
    const arr = new Float32Array(total);
    let o = 0;
    for (const g of list) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
    merged.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return merged;
}
