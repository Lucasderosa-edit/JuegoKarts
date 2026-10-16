import pradera from './pradera.js';

// Pistas disponibles, en el orden en que aparecen en el menú
export const TRACKS = [pradera];

export function getTrack(id) {
  return TRACKS.find((t) => t.id === id) || TRACKS[0];
}
