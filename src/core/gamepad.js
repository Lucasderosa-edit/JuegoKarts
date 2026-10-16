// Joysticks (Gamepad API, mapeo estándar tipo Xbox/PlayStation).

const DEAD = 0.2;
const prevButtons = new Map();

export function getPads() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  return [...list].filter(Boolean);
}

function pressed(pad, i) {
  const b = pad.buttons[i];
  return !!b && (b.pressed || b.value > 0.5);
}

function value(pad, i) {
  const b = pad.buttons[i];
  return b ? b.value : 0;
}

// Botón que se acaba de apretar (flanco), por joystick
export function padJustPressed(pad, i) {
  const key = `${pad.index}:${i}`;
  const now = pressed(pad, i);
  const before = prevButtons.get(key) || false;
  prevButtons.set(key, now);
  return now && !before;
}

// Lee un joystick y lo suma al estado de controles
export function readGamepad(pad, state) {
  if (!pad) return state;
  let steer = pad.axes[0] || 0;
  if (Math.abs(steer) < DEAD) steer = 0;
  else steer = Math.sign(steer) * (Math.abs(steer) - DEAD) / (1 - DEAD);
  if (pressed(pad, 14)) steer = -1;
  if (pressed(pad, 15)) steer = 1;
  const throttle = Math.max(pressed(pad, 0) ? 1 : 0, value(pad, 7), pressed(pad, 12) ? 1 : 0);
  const brake = Math.max(pressed(pad, 1) ? 1 : 0, value(pad, 6) > 0.3 ? 1 : 0, pressed(pad, 13) ? 1 : 0);
  if (Math.abs(steer) > Math.abs(state.steer)) state.steer = steer;
  state.throttle = Math.max(state.throttle, throttle > 0.15 ? throttle : 0);
  state.brake = Math.max(state.brake, brake);
  state.drift = state.drift || pressed(pad, 5);
  const item = padJustPressed(pad, 2) | padJustPressed(pad, 4) | padJustPressed(pad, 3);
  state.itemPressed = state.itemPressed || !!item;
  return state;
}

// Para los menús: dirección y botones de un joystick cualquiera
const navState = { dir: 0, repeat: 0 };
export function readMenuPad(dt) {
  const out = { move: 0, accept: false, back: false, start: false };
  for (const pad of getPads()) {
    const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    let dir = 0;
    if (pressed(pad, 14) || pressed(pad, 12) || ax < -0.5 || ay < -0.5) dir = -1;
    if (pressed(pad, 15) || pressed(pad, 13) || ax > 0.5 || ay > 0.5) dir = 1;
    if (dir) {
      if (dir !== navState.dir) { out.move = dir; navState.repeat = 0.35; }
      else {
        navState.repeat -= dt;
        if (navState.repeat <= 0) { out.move = dir; navState.repeat = 0.15; }
      }
    }
    navState.dir = dir;
    if (padJustPressed(pad, 0)) out.accept = true;
    if (padJustPressed(pad, 1)) out.back = true;
    if (padJustPressed(pad, 9)) out.start = true;
    if (dir || out.accept || out.back || out.start) break;
  }
  return out;
}
