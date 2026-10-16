import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameLoop } from './core/loop.js';
import { createRenderer } from './core/renderer.js';

const container = document.getElementById('game');
const ui = document.getElementById('ui');
const { renderer, onResize } = createRenderer(container);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fd6ff');
scene.fog = new THREE.Fog('#9fd6ff', 80, 300);

const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12);
camera.lookAt(0, 0, 0);
onResize((w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); });

// Luces
scene.add(new THREE.HemisphereLight('#ffffff', '#5a7d3a', 1.2));
const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// Piso
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshLambertMaterial({ color: '#6cc04a' }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Cubo de prueba para ver que el loop corre
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.MeshLambertMaterial({ color: '#ffcc33', flatShading: true }),
);
cube.position.y = 1.5;
cube.castShadow = true;
scene.add(cube);

const fpsLabel = document.createElement('div');
fpsLabel.className = 'debug-fps';
ui.appendChild(fpsLabel);

let time = 0;
const loop = new GameLoop({
  hz: CONFIG.physicsHz,
  maxSteps: CONFIG.maxStepsPerFrame,
  update(dt) {
    time += dt;
    cube.rotation.y += dt * 1.2;
    cube.position.y = 1.5 + Math.sin(time * 2) * 0.3;
  },
  render() {
    renderer.render(scene, camera);
    fpsLabel.textContent = `${loop.fps} FPS`;
  },
});
loop.start();

// Acceso para pruebas automáticas
window.__game = { loop, scene };
