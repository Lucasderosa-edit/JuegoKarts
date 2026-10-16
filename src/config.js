// Todos los valores de jugabilidad del juego.
// Cambiá estos números para ajustar cómo se siente el juego.

export const CONFIG = {
  // Loop de juego: la física corre a paso fijo.
  physicsHz: 60,
  maxStepsPerFrame: 5,

  // Física del kart (valores base; cada personaje los modifica con sus stats)
  kart: {
    maxSpeed: 30,          // m/s (≈108 km/h)
    acceleration: 16,      // m/s² con el acelerador a fondo
    accelCurve: 0.55,      // cuánto pierde de aceleración cerca de la velocidad máxima (0-1)
    brakeDecel: 38,        // m/s² frenando
    reverseMaxSpeed: 9,
    reverseAccel: 12,
    coastDrag: 5,          // m/s² que pierde sin acelerar
    turnRate: 2.3,         // rad/s girando a fondo
    turnSpeedRef: 9,       // velocidad a la que el giro llega al máximo
    highSpeedTurnLoss: 0.25, // cuánto giro pierde a velocidad máxima (0-1)
    grip: 9,               // agarre lateral (más alto = menos patina)
    steerResponse: 12,     // qué tan rápido responde la dirección
    radius: 1.1,           // radio para colisiones (m)
  },

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
