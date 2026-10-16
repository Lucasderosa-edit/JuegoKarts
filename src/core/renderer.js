import * as THREE from 'three';

// Crea el renderer de Three.js y lo mantiene del tamaño de la ventana.
export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  const listeners = new Set();
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    for (const fn of listeners) fn(window.innerWidth, window.innerHeight);
  });

  return {
    renderer,
    onResize(fn) { listeners.add(fn); },
  };
}
