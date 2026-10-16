// Todos los valores de jugabilidad del juego.
// Cambiá estos números para ajustar cómo se siente el juego.

export const CONFIG = {
  // Loop de juego: la física corre a paso fijo.
  physicsHz: 60,
  maxStepsPerFrame: 5,

  // Cámara en tercera persona
  camera: {
    fov: 70,
    distance: 6.5,      // metros detrás del kart
    height: 2.8,        // metros sobre el kart
    lookAhead: 4,       // a qué distancia adelante del kart mira
    lookHeight: 1.0,
    followSharpness: 6, // más alto = sigue más pegada
  },
};
