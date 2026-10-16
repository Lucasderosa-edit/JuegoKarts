import { App } from './app.js';

const app = new App();

// Acceso para pruebas automáticas
window.__game = {
  app,
  get loop() { return app.loop; },
  get race() { return app.race; },
  get kart() { return app.race?.players[0].kart; },
};
