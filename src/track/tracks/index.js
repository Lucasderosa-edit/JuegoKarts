import pradera from './pradera.js';
import costa from './costa.js';
import neon from './neon.js';
import cumbre from './cumbre.js';

// Pistas disponibles, en el orden en que aparecen en el menú
export const TRACKS = [pradera, costa, neon, cumbre];

export function getTrack(id) {
  return TRACKS.find((t) => t.id === id) || TRACKS[0];
}
