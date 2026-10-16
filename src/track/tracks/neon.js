// Neón Nocturno: ciudad de noche con luces de neón.
// Obstáculos: conos naranjas en la pista y un colectivo que cruza una esquina.
export default {
  id: 'neon',
  name: 'Neón Nocturno',
  description: 'Calles mojadas y luces de neón. Atención al colectivo en el cruce.',
  width: 18,
  offroadWidth: 7,
  points: [
    [0, -122], [90, -122], [122, -96], [122, -42], [96, -14], [62, -6], [46, 24], [62, 58], [102, 72], [124, 104],
    [112, 144], [70, 156], [22, 144], [-10, 112], [-52, 100], [-102, 112], [-134, 82], [-130, 22], [-96, -4],
    [-98, -58], [-104, -100], [-70, -126], [-36, -126],
  ],
  obstacles: [
    { type: 'cones', at: 2.6, count: 4 },
    { type: 'cones', at: 12, count: 3 },
    { type: 'cones', at: 19.5, count: 4 },
    { type: 'bus', at: 16.4, period: 7.3, travel: 3.2 },
  ],
  theme: {
    sky: '#14102e', fog: '#1d1640', ground: '#232036', offroad: '#2c2944',
    road: '#2d2f3f', roadLine: '#5ef2ff', curbA: '#ff3fb4', curbB: '#2a2c3d',
    wallA: '#ff3fb4', wallB: '#2be4ff', wallEmissive: true, dust: '#6c6a8a',
    sunColor: '#c9b8ff', sunIntensity: 1.4, hemiSky: '#9a8cff', hemiGround: '#3a2f55', hemiIntensity: 1.6,
    ambient: '#ffffff', ambientIntensity: 1.1,
    night: true,
  },
  decor: 'city',
};
