import { CONFIG } from '../config.js';

// Personajes del juego. Stats de 1 a 5 (todos suman 12 para que sea parejo).
// Los 4 primeros se pueden elegir; los otros 4 corren solo como rivales.
export const CHARACTERS = [
  {
    id: 'chispa', name: 'Chispa', species: 'Carpincho', playable: true,
    stats: { speed: 2, accel: 5, handling: 4, weight: 1 },
    kart: { body: '#ffcc33', accent: '#e8483b', trim: '#2b2d42' },
    tagline: 'Liviana y explosiva: sale primera de cada curva.',
  },
  {
    id: 'tronco', name: 'Tronco', species: 'Rinoceronte', playable: true,
    stats: { speed: 5, accel: 1, handling: 2, weight: 4 },
    kart: { body: '#8d99ae', accent: '#ff8c1a', trim: '#2b2d42' },
    tagline: 'Pesado y veloz: difícil de frenar una vez que arranca.',
  },
  {
    id: 'pixel', name: 'Pixel', species: 'Robot', playable: true,
    stats: { speed: 3, accel: 3, handling: 3, weight: 3 },
    kart: { body: '#1fc8b8', accent: '#ffffff', trim: '#16324f' },
    tagline: 'Equilibrado en todo: ideal para empezar.',
  },
  {
    id: 'brisa', name: 'Brisa', species: 'Ajolote', playable: true,
    stats: { speed: 3, accel: 3, handling: 5, weight: 1 },
    kart: { body: '#ff8fc7', accent: '#9b5de5', trim: '#3d2352' },
    tagline: 'La reina del derrape: dobla como nadie.',
  },
  {
    id: 'coco', name: 'Coco', species: 'Tortuga', playable: false,
    stats: { speed: 3, accel: 2, handling: 3, weight: 4 },
    kart: { body: '#3fae5a', accent: '#f4d35e', trim: '#24412c' },
  },
  {
    id: 'rulo', name: 'Rulo', species: 'Oveja', playable: false,
    stats: { speed: 2, accel: 4, handling: 4, weight: 2 },
    kart: { body: '#f1f5f9', accent: '#4cc9f0', trim: '#2b2d42' },
  },
  {
    id: 'mora', name: 'Mora', species: 'Rana', playable: false,
    stats: { speed: 3, accel: 4, handling: 3, weight: 2 },
    kart: { body: '#a7e34b', accent: '#e63946', trim: '#2b2d42' },
  },
  {
    id: 'nube', name: 'Nube', species: 'Búho', playable: false,
    stats: { speed: 4, accel: 2, handling: 4, weight: 2 },
    kart: { body: '#6d5bd0', accent: '#ffd166', trim: '#231942' },
  },
];

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

// Convierte los stats (1-5) en valores de física. Las fórmulas están en config.js.
export function physicsStats(character) {
  const m = CONFIG.characterStats;
  const st = character.stats;
  return {
    maxSpeed: m.maxSpeed.base + st.speed * m.maxSpeed.perPoint,
    acceleration: m.acceleration.base + st.accel * m.acceleration.perPoint,
    turnRate: m.turnRate.base + st.handling * m.turnRate.perPoint,
    grip: m.grip.base + st.handling * m.grip.perPoint,
    driftHandling: m.driftHandling.base + st.handling * m.driftHandling.perPoint,
    mass: m.mass.base + st.weight * m.mass.perPoint,
  };
}
