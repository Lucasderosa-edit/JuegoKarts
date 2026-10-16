import * as THREE from 'three';

// Une las piezas fijas de un objeto (muchos meshes de un color cada uno)
// en una o dos mallas con colores por vértice. Menos llamadas de dibujo = más FPS.
const inv = new THREE.Matrix4();
const m = new THREE.Matrix4();
const col = new THREE.Color();

export function bake(root, skip = () => false) {
  root.updateMatrixWorld(true);
  inv.copy(root.matrixWorld).invert();
  const buckets = { lambert: [], basic: [] };
  let castShadow = false, receiveShadow = false;

  const walk = (node) => {
    for (const child of [...node.children]) {
      if (skip(child)) continue;
      walk(child);
      const mat = child.material;
      if (!child.isMesh || child.isInstancedMesh || child.children.length || !mat?.color || mat.transparent || mat.vertexColors || mat.map) continue;
      const kind = mat.isMeshBasicMaterial ? 'basic' : mat.isMeshLambertMaterial ? 'lambert' : null;
      if (!kind) continue;
      buckets[kind].push(child);
      castShadow ||= child.castShadow;
      receiveShadow ||= child.receiveShadow;
    }
  };
  walk(root);

  for (const [kind, meshes] of Object.entries(buckets)) {
    if (meshes.length < 2) continue;
    const pos = [], nor = [], colors = [];
    for (const mesh of meshes) {
      let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      m.multiplyMatrices(inv, mesh.matrixWorld);
      g.applyMatrix4(m);
      if (!g.attributes.normal) g.computeVertexNormals();
      col.copy(mesh.material.color);
      const p = g.attributes.position.array, n = g.attributes.normal.array;
      for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
      for (let i = 0; i < p.length / 3; i++) colors.push(col.r, col.g, col.b);
      g.dispose();
      mesh.parent.remove(mesh);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = kind === 'basic'
      ? new THREE.MeshBasicMaterial({ vertexColors: true })
      : bakedLambert();
    const merged = new THREE.Mesh(geo, material);
    merged.castShadow = castShadow;
    merged.receiveShadow = receiveShadow;
    merged.name = `baked-${kind}`;
    root.add(merged);
  }
  return root;
}

let sharedLambert = null;
function bakedLambert() {
  return sharedLambert || (sharedLambert = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
}
