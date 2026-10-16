// Costa Coral: playa tropical con un muelle de madera sobre el mar.
// Obstáculos: cangrejos que cruzan la pista y olas que salpican el camino.
export default {
  id: 'costa',
  name: 'Costa Coral',
  description: 'Arena, palmeras y un muelle sobre el mar. ¡Cuidado con los cangrejos!',
  width: 18,
  offroadWidth: 9,
  points: [
    [0, -100], [80, -102], [140, -82], [168, -32], [152, 18], [112, 40], [98, 85], [128, 128], [108, 172],
    [48, 186], [-2, 156], [-22, 106], [-62, 84], [-112, 96], [-160, 66], [-170, 4], [-140, -46], [-90, -70], [-45, -98],
  ],
  // Tramos con otra superficie (por índice de punto de control)
  zones: [
    { from: 13.5, to: 16.5, road: '#b07a45', roadLine: '#d9a86c', offroad: '#2aa7d6', curbA: '#7a4f2a', curbB: '#d9a86c', wallA: '#8a5a30', wallB: '#c48a52', offroadSpeed: 0.42, dust: '#bfe9ff' },
  ],
  obstacles: [
    { type: 'crab', at: 4.5, count: 3 },
    { type: 'crab', at: 9.5, count: 3 },
    { type: 'wave', at: 15, length: 34, period: 4.7 },
  ],
  theme: {
    sky: '#7fd0ff', fog: '#cdeeff', ground: '#f2d896', offroad: '#e9c97a',
    road: '#9a8a78', roadLine: '#fff6dc', curbA: '#ff7a59', curbB: '#ffffff',
    wallA: '#ffffff', wallB: '#2ec4b6', dust: '#f5dfa8',
    sunColor: '#fff1d6', sunIntensity: 2.6, hemiSky: '#ffffff', hemiGround: '#d9b77a', hemiIntensity: 1.2,
  },
  decor: 'beach',
};
