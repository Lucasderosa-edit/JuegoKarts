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

  // Cómo se traducen los stats de cada personaje (1 a 5) a la física:
  // valor = base + puntos × perPoint
  characterStats: {
    maxSpeed: { base: 28.4, perPoint: 0.6 },       // m/s
    acceleration: { base: 11.5, perPoint: 2 },   // m/s²
    turnRate: { base: 1.95, perPoint: 0.12 },    // rad/s
    grip: { base: 7.5, perPoint: 0.6 },
    driftHandling: { base: 0.9, perPoint: 0.04 },
    mass: { base: 0.8, perPoint: 0.12 },         // para los choques
  },

  // Rivales manejados por la computadora
  ai: {
    count: 7,
    skillMin: 0.92,        // multiplicador de velocidad del rival más lento
    skillMax: 0.985,        // ... y del más rápido
    lookAheadBase: 9,      // metros adelante que mira para doblar
    lookAheadPerSpeed: 0.45,
    steerGain: 2.6,
    laneWidth: 0.55,       // qué tanto usan el ancho de la pista (0-1)
    driftCurvature: 0.022, // curvatura a partir de la cual derrapan
    driftChance: 0.75,     // probabilidad de aprovechar una curva para derrapar
    // Para que la carrera sea pareja: si un rival va muy adelante del
    // jugador afloja un poco, y si va muy atrás acelera un poco.
    rubberBand: { aheadDistance: 70, behindDistance: 90, slowdown: 0.92, speedup: 1.07 },
    stuckRespawnSeconds: 3,
  },

  // Derrape (mantener Espacio mientras se dobla)
  drift: {
    minSpeed: 11,          // velocidad mínima para empezar a derrapar (m/s)
    grip: 5,               // qué tan rápido se acomoda el deslizamiento lateral
    slideAngle: 0.22,      // ángulo con el que el kart se desliza hacia afuera (radianes)
    baseTurn: 0.62,        // giro mínimo hacia el lado del derrape (fracción de turnRate)
    steerRange: 0.36,      // cuánto se puede abrir o cerrar el derrape con la dirección
    visualAngle: 0.38,     // cuánto se cruza el kart (solo visual, en radianes)
    hop: 4.5,              // saltito al empezar el derrape
    chargeTight: 0.8,      // carga extra al cerrar el derrape
    levels: [0.8, 1.7, 2.7],          // segundos de derrape para cada nivel de turbo
    boostDuration: [0.55, 1.0, 1.6],  // segundos de turbo según el nivel
    sparkColors: ['#ffffff', '#ffd23f', '#3dff7a'], // chispas: blanco → amarillo → verde
  },

  // Turbo (derrape, ítem turbo, etc.)
  boost: {
    speedMultiplier: 1.32, // velocidad máxima durante el turbo
    extraAccel: 32,        // aceleración extra durante el turbo
  },

  // Carrera
  race: {
    laps: 3,
    checkpoints: 10,       // puntos de control por vuelta (evitan atajos)
    countdownSeconds: 3,
    startBoostWindow: 0.55, // acelerar justo antes del ¡YA! da un turbo de largada
    startBoostDuration: 0.9,
    playerGridSlot: 7,     // el jugador larga último (0 = primero)
  },

  // Ítems
  items: {
    boxRows: [0.16, 0.46, 0.75],   // dónde hay filas de cajas (fracción de la vuelta)
    boxesPerRow: 5,
    boxRespawn: 2.5,       // segundos hasta que reaparece una caja
    rouletteTime: 1.1,     // segundos que gira la ruleta antes de dar el ítem
    turboDuration: 1.5,
    projectileSpeed: 52,   // m/s
    projectileLife: 3.5,
    projectileBounces: 2,  // rebotes contra los bordes antes de romperse
    trapLife: 45,
    shieldDuration: 8,
    spinDuration: 1.1,     // segundos que gira un kart al ser golpeado
    spinSpeedKeep: 0.35,   // velocidad que conserva al ser golpeado
    // Probabilidad de cada ítem según la posición (los de atrás reciben más turbo)
    weights: {
      front: { turbo: 15, proyectil: 25, trampa: 42, escudo: 18 },
      middle: { turbo: 30, proyectil: 35, trampa: 15, escudo: 20 },
      back: { turbo: 52, proyectil: 30, trampa: 4, escudo: 14 },
    },
  },

  // Choques entre karts
  collisions: {
    restitution: 0.55,     // qué tan elástico es el choque (0-1)
    minPush: 2.2,          // empujón mínimo para que no queden pegados
  },

  // Pista
  track: {
    offroadSpeed: 0.5,     // en el pasto, la velocidad máxima baja a la mitad
    offroadGrip: 0.75,
    wallBounce: 0.45,      // cuánto rebota el kart contra el borde (0-1)
    wallSpeedKeep: 0.9,    // velocidad que conserva al chocar
    wallAlign: 0.35,       // cuánto se endereza el kart al rozar el borde
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
