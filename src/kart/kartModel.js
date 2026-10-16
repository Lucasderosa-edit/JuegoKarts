import * as THREE from 'three';

// Modelo low-poly del kart, con colores planos.
// El personaje se agrega encima en `driverSlot`.

const geoCache = {};
function geo(key, make) {
  return geoCache[key] || (geoCache[key] = make());
}
const matCache = {};
export function flatMat(color) {
  const key = String(color);
  return matCache[key] || (matCache[key] = new THREE.MeshLambertMaterial({ color, flatShading: true }));
}

export function buildKartModel({ body = '#ffcc33', accent = '#e8483b', trim = '#2b2d42' } = {}) {
  const root = new THREE.Group();
  const chassis = new THREE.Group();
  root.add(chassis);

  const add = (parent, geometry, color, x, y, z) => {
    const m = new THREE.Mesh(geometry, flatMat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Chasis
  add(chassis, geo('base', () => new THREE.BoxGeometry(1.5, 0.3, 2.4)), body, 0, 0.45, 0);
  add(chassis, geo('nose', () => new THREE.BoxGeometry(1.2, 0.3, 0.7)), accent, 0, 0.55, 1.15);
  add(chassis, geo('bumper', () => new THREE.BoxGeometry(1.7, 0.22, 0.25)), trim, 0, 0.38, 1.55);
  add(chassis, geo('rearBumper', () => new THREE.BoxGeometry(1.7, 0.25, 0.25)), trim, 0, 0.42, -1.3);
  add(chassis, geo('stripe', () => new THREE.BoxGeometry(0.35, 0.05, 2.0)), accent, 0, 0.62, 0.05);
  add(chassis, geo('seat', () => new THREE.BoxGeometry(0.9, 0.7, 0.25)), trim, 0, 0.9, -0.6);
  add(chassis, geo('engine', () => new THREE.BoxGeometry(0.9, 0.4, 0.5)), '#8d99ae', 0, 0.75, -1.05);
  add(chassis, geo('pipe', () => new THREE.CylinderGeometry(0.09, 0.11, 0.35, 6)), '#5c677d', 0.3, 0.75, -1.4).rotation.x = Math.PI / 2;
  add(chassis, geo('pipe', () => new THREE.CylinderGeometry(0.09, 0.11, 0.35, 6)), '#5c677d', -0.3, 0.75, -1.4).rotation.x = Math.PI / 2;
  const wheel = add(chassis, geo('steer', () => new THREE.TorusGeometry(0.2, 0.05, 4, 8)), trim, 0, 1.0, 0.35);
  wheel.rotation.x = -Math.PI / 3;

  // Ruedas
  const wheelGeo = geo('wheel', () => new THREE.CylinderGeometry(0.36, 0.36, 0.34, 10).rotateZ(Math.PI / 2));
  const hubGeo = geo('hub', () => new THREE.CylinderGeometry(0.16, 0.16, 0.36, 6).rotateZ(Math.PI / 2));
  const wheels = [];
  const frontPivots = [];
  for (const [x, z, front] of [[0.85, 0.85, true], [-0.85, 0.85, true], [0.9, -0.85, false], [-0.9, -0.85, false]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.36, z);
    root.add(pivot);
    const w = new THREE.Mesh(front ? wheelGeo : geo('wheelBig', () => new THREE.CylinderGeometry(0.38, 0.38, 0.42, 10).rotateZ(Math.PI / 2)), flatMat('#23232e'));
    w.castShadow = true;
    w.add(new THREE.Mesh(hubGeo, flatMat(accent)));
    pivot.add(w);
    wheels.push(w);
    if (front) frontPivots.push(pivot);
  }

  // Lugar donde va el personaje
  const driverSlot = new THREE.Group();
  driverSlot.position.set(0, 0.6, -0.25);
  chassis.add(driverSlot);

  return { root, chassis, wheels, frontPivots, driverSlot };
}
