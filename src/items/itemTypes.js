import { CONFIG } from '../config.js';

const base = import.meta.env.BASE_URL;

export const ITEM_TYPES = {
  turbo: { id: 'turbo', name: 'Turbo picante', icon: `${base}assets/items/turbo.png` },
  proyectil: { id: 'proyectil', name: 'Bola de energía', icon: `${base}assets/items/proyectil.png` },
  trampa: { id: 'trampa', name: 'Charco pegajoso', icon: `${base}assets/items/trampa.png` },
  escudo: { id: 'escudo', name: 'Escudo burbuja', icon: `${base}assets/items/escudo.png` },
};

export const ITEM_IDS = Object.keys(ITEM_TYPES);

// Elige un ítem al azar según la posición en carrera
export function rollItem(rank, total, rand = Math.random) {
  const w = CONFIG.items.weights;
  const t = total > 1 ? (rank - 1) / (total - 1) : 0;
  const table = t < 0.3 ? w.front : t < 0.7 ? w.middle : w.back;
  let sum = 0;
  for (const id of ITEM_IDS) sum += table[id];
  let r = rand() * sum;
  for (const id of ITEM_IDS) {
    r -= table[id];
    if (r <= 0) return id;
  }
  return ITEM_IDS[0];
}
