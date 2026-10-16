// Loop de juego con paso fijo para la física y render en cada frame.

export class GameLoop {
  constructor({ hz = 60, maxSteps = 5, update, render }) {
    this.step = 1 / hz;
    this.maxSteps = maxSteps;
    this.update = update;
    this.render = render;
    this.accumulator = 0;
    this.last = 0;
    this.running = false;
    this.fps = 0;
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(now) {
    if (!this.running) return;
    let frameTime = (now - this.last) / 1000;
    this.last = now;
    // Si la pestaña estuvo en segundo plano, no intentar "alcanzar" el tiempo perdido.
    if (frameTime > 0.25) frameTime = 0.25;
    // El tiempo del cuadro puede ser anterior a start() si hubo una tarea larga
    if (frameTime < 0) frameTime = 0;

    this.accumulator += frameTime;
    let steps = 0;
    while (this.accumulator >= this.step && steps < this.maxSteps) {
      this.update(this.step);
      this.accumulator -= this.step;
      steps++;
    }
    if (steps === this.maxSteps) this.accumulator = 0;

    this.render(frameTime);

    this._fpsFrames++;
    this._fpsTime += frameTime;
    if (this._fpsTime >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsTime);
      this._fpsFrames = 0;
      this._fpsTime = 0;
    }
    requestAnimationFrame(this._tick);
  }
}
