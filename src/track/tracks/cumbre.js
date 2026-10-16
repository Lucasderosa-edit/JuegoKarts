// Cumbre Helada: montaña nevada con pinos.
// Obstáculos: bolas de nieve gigantes que bajan rodando y placas de hielo resbaladizas.
export default {
  id: 'cumbre',
  name: 'Cumbre Helada',
  description: 'Nieve, pinos y hielo que patina. Esquivá las bolas de nieve.',
  width: 18,
  offroadWidth: 9,
  points: [
    [0, -112], [90, -116], [150, -92], [172, -42], [142, 0], [92, -4], [60, 26], [82, 66], [140, 82],
    [162, 128], [122, 172], [50, 178], [4, 154], [-30, 124], [-80, 126], [-132, 100], [-156, 52], [-132, 6],
    [-146, -46], [-118, -94], [-62, -112],
  ],
  obstacles: [
    { type: 'snowball', at: 0.6, period: 6.5 },
    { type: 'snowball', at: 11.3, period: 7.5 },
    { type: 'ice', at: 4.2, length: 30 },
    { type: 'ice', at: 15.8, length: 34 },
    { type: 'ice', at: 9.4, length: 26 },
  ],
  theme: {
    sky: '#bfe3ff', fog: '#e6f4ff', ground: '#f4f8ff', offroad: '#e3edf8',
    road: '#a9bdd3', roadLine: '#ffffff', curbA: '#e8483b', curbB: '#ffffff',
    wallA: '#7aa0c4', wallB: '#ffffff', dust: '#ffffff',
    sunColor: '#ffffff', sunIntensity: 2.2, hemiSky: '#ffffff', hemiGround: '#b8cde0', hemiIntensity: 1.3,
  },
  decor: 'snow',
};
