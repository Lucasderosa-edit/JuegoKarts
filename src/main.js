import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameLoop } from './core/loop.js';
import { createRenderer } from './core/renderer.js';
import { KEY_BINDINGS, createControlState, readKeyboard, endInputFrame } from './core/input.js';
import { Kart } from './kart/kart.js';
import { ChaseCamera } from './kart/chaseCamera.js';

const container = document.getElementById('game');
const ui = document.getElementById('ui');
const { renderer, onResize } = createRenderer(container);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fd6ff');
scene.fog = new THREE.Fog('#9fd6ff', 80, 300);

const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
onResize((w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); });

// Luces
scene.add(new THREE.HemisphereLight('#ffffff', '#5a7d3a', 1.2));
const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40 });
scene.add(sun, sun.target);

// Piso con grilla para notar el movimiento
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshLambertMaterial({ color: '#6cc04a' }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(400, 80, '#4e9a33', '#5aae3c');
grid.position.y = 0.01;
scene.add(grid);

const kart = new Kart({ colors: { body: '#ffcc33', accent: '#e8483b' } });
scene.add(kart.object);
kart.setPose(0, 0, 0);

const chase = new ChaseCamera(camera);
chase.snap(kart);

const controls = createControlState();

const fpsLabel = document.createElement('div');
fpsLabel.className = 'debug-fps';
ui.appendChild(fpsLabel);

const loop = new GameLoop({
  hz: CONFIG.physicsHz,
  maxSteps: CONFIG.maxStepsPerFrame,
  update(dt) {
    readKeyboard(KEY_BINDINGS.solo, controls);
    kart.update(dt, controls);
    endInputFrame();
  },
  render(frameDt) {
    chase.update(kart, frameDt);
    // La luz del sol acompaña al kart para que siempre tenga sombra
    sun.position.set(kart.position.x + 30, 50, kart.position.z + 20);
    sun.target.position.copy(kart.position);
    renderer.render(scene, camera);
    fpsLabel.textContent = `${loop.fps} FPS · ${Math.round(Math.abs(kart.speed) * 3.6)} km/h`;
  },
});
loop.start();

// Acceso para pruebas automáticas
window.__game = { loop, scene, kart };
