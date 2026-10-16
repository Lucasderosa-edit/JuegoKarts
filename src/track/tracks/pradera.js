// Circuito Pradera: pista inicial, colinas verdes y curvas variadas.
export default {
  id: 'pradera',
  name: 'Circuito Pradera',
  description: 'Colinas verdes y curvas para aprender a derrapar.',
  width: 18,
  offroadWidth: 9,
  points: [
    [-40, -90], [40, -92], [110, -88], [155, -62], [170, -10], [150, 38],
    [105, 50], [70, 34], [35, 48], [28, 95], [52, 140], [30, 182], [-25, 190],
    [-62, 160], [-70, 112], [-110, 92], [-160, 70], [-180, 18], [-168, -40], [-120, -80],
  ],
  theme: {
    sky: '#8fd3ff', fog: '#bfe6ff', ground: '#6cc04a', offroad: '#5eb23f',
    road: '#5b5f6b', roadLine: '#e9edf2', curbA: '#e8483b', curbB: '#ffffff',
    wallA: '#ffffff', wallB: '#e8483b', dust: '#9fc56a',
    sunColor: '#fff4e0', sunIntensity: 2.4, hemiSky: '#ffffff', hemiGround: '#4f7a33', hemiIntensity: 1.25,
  },
  decor: 'meadow',
};
