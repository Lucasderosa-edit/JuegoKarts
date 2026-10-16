import './menus.css';
import { CHARACTERS } from '../kart/characters.js';
import { TRACKS } from '../track/tracks/index.js';
import { QUALITY_PRESETS } from '../core/quality.js';
import { settings, saveSettings } from '../core/settings.js';
import { formatTime } from './format.js';

const base = import.meta.env.BASE_URL;
export const asset = (p) => `${base}assets/${p}`;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function button(label, onClick, cls = '') {
  const b = el(`<button class="btn ${cls}">${label}</button>`);
  b.addEventListener('click', onClick);
  return b;
}

// Fondo del menú: el video en loop de los 4 personajes en la largada
export function menuBackground() {
  const portrait = window.innerHeight > window.innerWidth;
  const src = asset(`video/menu_bg_${portrait ? '9x16' : '16x9'}.mp4`);
  const bg = el(`<div class="menu-bg" style="background-image:url('${asset('img/menu_bg.webp')}')">
    <video muted loop playsinline autoplay preload="auto" src="${src}"></video></div>`);
  const v = bg.querySelector('video');
  v.play?.().catch(() => {});
  return bg;
}

export function mainMenu({ onSolo, onDuo, onOptions, onHowTo }) {
  const s = el(`<div class="screen">
    <div class="logo">TURBO<span>RUEDAS</span></div>
    <div class="tagline">Carreras de karts con derrapes, turbos y muchos ítems</div>
    <div class="menu-list"></div>
  </div>`);
  s.prepend(menuBackground());
  const list = s.querySelector('.menu-list');
  list.append(
    button('1 jugador', onSolo),
    button('2 jugadores', onDuo, 'secondary'),
    button('Cómo jugar', onHowTo, 'secondary'),
    button('Opciones', onOptions, 'secondary'),
  );
  return s;
}

function statBars(stats) {
  const row = (label, v) => `<span>${label}</span><span class="bar"><i style="width:${v * 20}%"></i></span>`;
  return `<div class="stats">${row('Velocidad', stats.speed)}${row('Aceleración', stats.accel)}${row('Manejo', stats.handling)}${row('Peso', stats.weight)}</div>`;
}

// Hace que el video de una tarjeta se reproduzca al pasar o elegir
function hookCardVideo(card) {
  const v = card.querySelector('video');
  if (!v) return;
  const play = () => { v.play?.().then(() => v.classList.add('playing')).catch(() => {}); };
  const stop = () => { if (!card.classList.contains('selected')) { v.pause?.(); v.classList.remove('playing'); } };
  card.addEventListener('mouseenter', play);
  card.addEventListener('focus', play);
  card.addEventListener('mouseleave', stop);
  card.addEventListener('blur', stop);
  card._play = play;
  card._stop = () => { v.pause?.(); v.classList.remove('playing'); };
}

function selectable(container, cards, onConfirm) {
  let selected = null;
  let soft = false; // seleccionada solo por el foco automático (no por el jugador)
  const select = (card, isSoft = false) => {
    if (selected && selected !== card) { selected.classList.remove('selected'); selected._stop?.(); }
    selected = card;
    soft = isSoft;
    card.classList.add('selected');
    card._play?.();
  };
  for (const card of cards) {
    // Primer clic: elige y muestra el video. Segundo clic (o Enter): confirma.
    card.addEventListener('pointerdown', () => { card._wasSelected = selected === card && !soft; });
    card.addEventListener('click', (e) => {
      const confirm = e.detail === 0 ? selected === card : card._wasSelected;
      card._wasSelected = false;
      if (confirm) onConfirm(card.dataset.id);
      else select(card);
    });
    card.addEventListener('focus', () => select(card, !!card._autoFocus));
    card.addEventListener('dblclick', () => onConfirm(card.dataset.id));
  }
  return { get selected() { return selected; }, select };
}

export function characterSelect({ title, hint, taken = [], onPick, onBack }) {
  const s = el(`<div class="screen dim">
    <h1>${title}</h1>
    <div class="hint">${hint}</div>
    <div class="cards"></div>
    <div class="row-buttons"></div>
  </div>`);
  s.prepend(menuBackground());
  const grid = s.querySelector('.cards');
  const cards = [];
  for (const c of CHARACTERS.filter((x) => x.playable)) {
    const isTaken = taken.includes(c.id);
    const card = el(`<button class="card" data-id="${c.id}" ${isTaken ? 'disabled style="opacity:.4"' : ''}>
      <div class="media"><img src="${asset(`img/char_${c.id}.webp`)}" alt="">
        <video muted loop playsinline preload="none" src="${asset(`video/char_${c.id}_idle.mp4`)}"></video></div>
      <h3>${c.name}</h3><div class="species">${c.species}</div>
      ${statBars(c.stats)}
      <p>${c.tagline}</p>
    </button>`);
    hookCardVideo(card);
    grid.appendChild(card);
    if (!isTaken) cards.push(card);
  }
  const sel = selectable(grid, cards, onPick);
  s.querySelector('.row-buttons').append(
    button('Volver', onBack, 'secondary'),
    button('¡Elegir!', () => sel.selected && onPick(sel.selected.dataset.id)),
  );
  s.focusFirst = () => autoFocus(cards[0]);
  return s;
}

function autoFocus(card) {
  if (!card) return;
  card._autoFocus = true;
  card.focus();
  card._autoFocus = false;
}

export function trackSelect({ onPick, onBack, bestTimes = {} }) {
  const s = el(`<div class="screen dim">
    <h1>Elegí la pista</h1>
    <div class="hint">3 vueltas · 8 corredores</div>
    <div class="cards"></div>
    <div class="row-buttons"></div>
  </div>`);
  s.prepend(menuBackground());
  const grid = s.querySelector('.cards');
  const cards = [];
  for (const t of TRACKS) {
    const best = bestTimes[t.id];
    const card = el(`<button class="card" data-id="${t.id}">
      <div class="media"><img src="${asset(`img/track_${t.id}.webp`)}" alt="">
        <video muted loop playsinline preload="none" src="${asset(`video/track_${t.id}.mp4`)}"></video></div>
      <h3>${t.name}</h3>
      <p>${t.description}</p>
      <div class="best">${best ? `Récord: ${formatTime(best.total)} · Vuelta: ${formatTime(best.lap)}` : 'Sin récord todavía'}</div>
    </button>`);
    hookCardVideo(card);
    grid.appendChild(card);
    cards.push(card);
  }
  const sel = selectable(grid, cards, onPick);
  s.querySelector('.row-buttons').append(
    button('Volver', onBack, 'secondary'),
    button('¡A correr!', () => sel.selected && onPick(sel.selected.dataset.id)),
  );
  s.focusFirst = () => autoFocus(cards[0]);
  return s;
}

export function optionsScreen({ onBack, inRace = false }) {
  const s = el(`<div class="screen ${inRace ? 'pause-overlay' : 'dim'}">
    <div class="panel">
      <h2>Opciones</h2>
      <label class="option">Música <input type="range" min="0" max="1" step="0.05" data-k="musicVolume"></label>
      <label class="option">Efectos de sonido <input type="range" min="0" max="1" step="0.05" data-k="sfxVolume"></label>
      <div class="option">Calidad gráfica <div class="segmented" data-quality></div></div>
      <div class="hint" style="text-align:left;margin:0">Baja: sin sombras y menos decoración (celulares). Las sombras y la decoración cambian en la próxima carrera.</div>
      <label class="option">Resolución automática (si va lento) <input type="checkbox" data-k="dynamicResolution"></label>
      <label class="option">Acelerar solo (pantalla táctil) <input type="checkbox" data-k="autoAccelerate"></label>
      <label class="option">Mostrar FPS <input type="checkbox" data-k="showFps"></label>
      <div class="row-buttons"></div>
    </div>
  </div>`);
  if (!inRace) s.prepend(menuBackground());
  for (const input of s.querySelectorAll('input[data-k]')) {
    const k = input.dataset.k;
    if (input.type === 'checkbox') {
      input.checked = !!settings[k];
      input.addEventListener('change', () => saveSettings({ [k]: input.checked }));
    } else {
      input.value = settings[k];
      input.addEventListener('input', () => saveSettings({ [k]: parseFloat(input.value) }));
    }
  }
  const seg = s.querySelector('[data-quality]');
  for (const q of Object.values(QUALITY_PRESETS)) {
    const b = el(`<button class="${settings.quality === q.id ? 'on' : ''}">${q.label}</button>`);
    b.addEventListener('click', () => {
      saveSettings({ quality: q.id });
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    });
    seg.appendChild(b);
  }
  s.querySelector('.row-buttons').append(button('Listo', onBack));
  return s;
}

export function howToScreen({ onBack }) {
  const s = el(`<div class="screen dim">
    <div class="panel howto">
      <h2>Cómo jugar</h2>
      <h3>Teclado</h3>
      <div><kbd>↑</kbd><kbd>W</kbd> acelerar · <kbd>↓</kbd><kbd>S</kbd> frenar / reversa</div>
      <div><kbd>←</kbd><kbd>→</kbd><kbd>A</kbd><kbd>D</kbd> doblar</div>
      <div><kbd>Espacio</kbd> o <kbd>Shift</kbd> derrapar (mantener mientras doblás)</div>
      <div><kbd>E</kbd><kbd>X</kbd> o <kbd>Enter</kbd> usar ítem · <kbd>Esc</kbd><kbd>P</kbd> pausa</div>
      <h3>2 jugadores</h3>
      <div>Jugador 1: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, derrape <kbd>Espacio</kbd>, ítem <kbd>E</kbd></div>
      <div>Jugador 2: flechas, derrape <kbd>Shift der.</kbd> o <kbd>-</kbd>, ítem <kbd>Enter</kbd> o <kbd>.</kbd></div>
      <h3>Joystick</h3>
      <div>Stick o cruceta para doblar · <kbd>A</kbd>/<kbd>RT</kbd> acelerar · <kbd>B</kbd>/<kbd>LT</kbd> frenar · <kbd>RB</kbd> derrape · <kbd>X</kbd>/<kbd>LB</kbd> ítem</div>
      <h3>Consejos</h3>
      <div>Cuanto más largo el derrape, más fuerte el turbo: las chispas pasan de <b>blanco</b> a <b>amarillo</b> y a <b style="color:#3dff7a">verde</b>.</div>
      <div>Acelerá justo cuando la cuenta regresiva está por terminar para salir con turbo.</div>
      <div>El pasto te frena: ¡quedate en el asfalto!</div>
      <div class="row-buttons"></div>
    </div>
  </div>`);
  s.prepend(menuBackground());
  s.querySelector('.row-buttons').append(button('Volver', onBack));
  return s;
}

export function pauseScreen({ onResume, onRestart, onOptions, onQuit }) {
  const s = el(`<div class="screen pause-overlay">
    <div class="panel"><h2>Pausa</h2><div class="menu-list" style="margin:0 auto"></div></div>
  </div>`);
  s.querySelector('.menu-list').append(
    button('Continuar', onResume),
    button('Reiniciar carrera', onRestart, 'secondary'),
    button('Opciones', onOptions, 'secondary'),
    button('Salir al menú', onQuit, 'secondary'),
  );
  return s;
}

export function loadingScreen(text = 'Preparando la pista…') {
  return el(`<div class="screen dim"><div class="loading">${text}</div></div>`);
}
