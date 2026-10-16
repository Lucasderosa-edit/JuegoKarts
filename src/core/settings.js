// Opciones del jugador, guardadas en el navegador (si se puede).
import { defaultQualityId } from './quality.js';

const KEY = 'turbo-ruedas:settings';
const defaults = {
  quality: defaultQualityId(),
  musicVolume: 0.6,
  sfxVolume: 0.8,
  showFps: false,
  dynamicResolution: true,
  autoAccelerate: false,
};

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

export const settings = load();

const listeners = new Set();
export function onSettingsChange(fn) {
  listeners.add(fn);
}

export function saveSettings(patch = {}) {
  Object.assign(settings, patch);
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Sin almacenamiento (modo privado): las opciones duran hasta cerrar la pestaña
  }
  for (const fn of listeners) fn(settings);
}
