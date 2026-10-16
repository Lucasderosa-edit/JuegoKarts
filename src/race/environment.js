import * as THREE from 'three';

// Cielo, niebla y luces según el tema de la pista.
export function setupEnvironment(scene, theme, quality) {
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.fog, quality.drawDistance * 0.35, quality.drawDistance);

  const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiIntensity);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
  sun.castShadow = quality.shadows;
  if (quality.shadows) {
    sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    const r = 45;
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 160 });
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.06;
  }
  scene.add(sun, sun.target);
  const sunOffset = new THREE.Vector3(40, 70, 25);

  return {
    hemi,
    sun,
    // La luz acompaña al foco de la cámara para que siempre haya sombras cerca
    follow(target) {
      sun.position.set(target.x + sunOffset.x, sunOffset.y, target.z + sunOffset.z);
      sun.target.position.set(target.x, 0, target.z);
    },
  };
}
