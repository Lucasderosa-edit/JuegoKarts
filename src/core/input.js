// Teclado → estado de controles. Cada jugador lee un "ControlState".

const pressed = new Set();
const justPressed = new Set();

window.addEventListener('keydown', (e) => {
  if (!pressed.has(e.code)) justPressed.add(e.code);
  pressed.add(e.code);
  // Evita que las flechas y la barra espaciadora muevan la página
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => pressed.delete(e.code));
window.addEventListener('blur', () => pressed.clear());

// Llamar una vez por frame, después de leer los "justPressed".
export function endInputFrame() {
  justPressed.clear();
}

export function isDown(code) {
  return pressed.has(code);
}

export function wasPressed(code) {
  return justPressed.has(code);
}

export const KEY_BINDINGS = {
  // Un jugador: flechas o WASD
  solo: {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    drift: ['Space', 'ShiftLeft', 'ShiftRight'],
    item: ['KeyE', 'KeyX', 'Enter', 'ControlLeft', 'ControlRight'],
  },
  // Pantalla dividida: jugador 1 con WASD, jugador 2 con flechas
  p1: {
    up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
    drift: ['Space'], item: ['KeyE', 'KeyQ'],
  },
  p2: {
    up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
    drift: ['ShiftRight', 'Slash', 'Numpad0'], item: ['Enter', 'ControlRight', 'Period', 'NumpadEnter'],
  },
};

export function createControlState() {
  return { throttle: 0, brake: 0, steer: 0, drift: false, item: false, itemPressed: false };
}

// Lee el teclado según un juego de teclas y lo vuelca en "state".
export function readKeyboard(bindings, state) {
  const any = (codes) => codes.some(isDown);
  const anyNew = (codes) => codes.some(wasPressed);
  state.throttle = any(bindings.up) ? 1 : 0;
  state.brake = any(bindings.down) ? 1 : 0;
  state.steer = (any(bindings.right) ? 1 : 0) - (any(bindings.left) ? 1 : 0);
  state.drift = any(bindings.drift);
  state.item = any(bindings.item);
  state.itemPressed = anyNew(bindings.item);
  return state;
}
