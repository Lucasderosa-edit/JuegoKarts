import './hud.css';
import { formatTime } from './format.js';
import { ITEM_TYPES, ITEM_IDS } from '../items/itemTypes.js';

// HUD de un jugador (en pantalla dividida hay uno por mitad).
export class Hud {
  constructor(parent) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-top-left">
        <div class="hud-lap">VUELTA <span data-lap>1</span><small>/<span data-laps>3</span></small></div>
        <div class="hud-time" data-time>0:00.00</div>
        <div class="hud-laps" data-lap-list></div>
      </div>
      <div class="hud-top-right"><div class="hud-pos" data-pos>8.º<small>/8</small></div></div>
      <div class="hud-item" data-item-box><img data-item alt="" hidden></div>
      <div class="hud-warn" data-warn>¡CONTRAMANO!</div>
      <div class="hud-center"><div data-center></div></div>
      <div class="hud-speed">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <path class="track" d="M 22 98 A 50 50 0 1 1 98 98" />
          <path class="fill" data-speed-arc d="M 22 98 A 50 50 0 1 1 98 98" />
        </svg>
        <div class="num" data-speed>0</div><div class="unit">km/h</div>
      </div>
      <svg class="hud-map" data-map aria-hidden="true"></svg>`;
    parent.appendChild(this.el);
    this.q = (sel) => this.el.querySelector(sel);
    this.lapEl = this.q('[data-lap]');
    this.lapsEl = this.q('[data-laps]');
    this.timeEl = this.q('[data-time]');
    this.lapListEl = this.q('[data-lap-list]');
    this.centerEl = this.q('[data-center]');
    this.warnEl = this.q('[data-warn]');
    this.posEl = this.q('[data-pos]');
    this.speedEl = this.q('[data-speed]');
    this.speedArc = this.q('[data-speed-arc]');
    this.arcLen = this.speedArc.getTotalLength?.() || 260;
    this.speedArc.style.strokeDasharray = `${this.arcLen}`;
    this.mapEl = this.q('[data-map]');
    this.mapDots = [];
    this.itemBoxEl = this.q('[data-item-box]');
    this.itemEl = this.q('[data-item]');
    this._lastItem = null;
    this._lastLapCount = -1;
    this._lastPos = '';
  }

  // Minimapa: el trazado de la pista y un punto por kart
  setupMinimap(path, karts, me) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < path.count; i++) {
      minX = Math.min(minX, path.px[i]); maxX = Math.max(maxX, path.px[i]);
      minZ = Math.min(minZ, path.pz[i]); maxZ = Math.max(maxZ, path.pz[i]);
    }
    const size = Math.max(maxX - minX, maxZ - minZ) + 40;
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    // Se mira desde arriba con el norte hacia arriba (x a la derecha, z hacia abajo invertida)
    this.mapTf = (x, z) => [((cx - x) / size + 0.5) * 100, ((cz - z) / size + 0.5) * 100];
    let d = '';
    for (let i = 0; i < path.count; i += 2) {
      const [x, y] = this.mapTf(path.px[i], path.pz[i]);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    const [sx, sy] = this.mapTf(path.px[0], path.pz[0]);
    this.mapEl.setAttribute('viewBox', '0 0 100 100');
    this.mapEl.innerHTML = `<path d="${d}Z" class="road"/><path d="${d}Z" class="line"/><circle cx="${sx}" cy="${sy}" r="2.2" class="start"/>`;
    this.mapKarts = karts;
    this.mapDots = karts.map((k) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', k === me ? 3.4 : 2.4);
      c.setAttribute('fill', k.character?.kart.body || '#fff');
      c.setAttribute('class', k === me ? 'me' : 'other');
      return c;
    });
    // El jugador se dibuja arriba de todos
    const order = this.mapDots.map((c, i) => [c, karts[i] === me]).sort((a, b) => a[1] - b[1]);
    for (const [c] of order) this.mapEl.appendChild(c);
  }

  showCountdown(text, go = false) {
    this.centerEl.innerHTML = `<div class="hud-count pop ${go ? 'go' : ''}">${text}</div>`;
  }

  showMessage(text) {
    this.centerEl.innerHTML = `<div class="hud-msg pop">${text}</div>`;
  }

  update({ kart, progress, raceTime, rank, total }) {
    let icon = null;
    if (kart.itemRoll > 0) icon = ITEM_IDS[Math.floor(kart.itemRoll * 14) % ITEM_IDS.length];
    else if (kart.item) icon = kart.item;
    if (icon !== this._lastItem) {
      this._lastItem = icon;
      this.itemEl.hidden = !icon;
      if (icon) this.itemEl.src = ITEM_TYPES[icon].icon;
      this.itemBoxEl.classList.toggle('rolling', kart.itemRoll > 0);
    }
    this.itemBoxEl.classList.toggle('ready', !!kart.item && kart.itemRoll <= 0);
    const posText = `${rank}.º<small>/${total}</small>`;
    if (posText !== this._lastPos) {
      this._lastPos = posText;
      this.posEl.innerHTML = posText;
      this.posEl.classList.toggle('p1', rank === 1);
    }
    this.lapEl.textContent = Math.max(1, progress.lap);
    this.lapsEl.textContent = progress.laps;
    this.timeEl.textContent = formatTime(progress.finished ? progress.finishTime : raceTime);
    if (progress.lapTimes.length !== this._lastLapCount) {
      this._lastLapCount = progress.lapTimes.length;
      this.lapListEl.innerHTML = progress.lapTimes.map((t, i) => `V${i + 1} ${formatTime(t)}`).join('<br>');
    }
    this.warnEl.classList.toggle('show', progress.wrongWay && !progress.finished);

    const kmh = Math.round(Math.abs(kart.speed) * 3.6);
    this.speedEl.textContent = kmh;
    const frac = Math.min(1, kmh / 160);
    this.speedArc.style.strokeDashoffset = `${this.arcLen * (1 - frac)}`;
    this.speedArc.classList.toggle('boost', kart.boostTime > 0);

    for (let i = 0; i < this.mapDots.length; i++) {
      const k = this.mapKarts[i];
      const [x, y] = this.mapTf(k.position.x, k.position.z);
      this.mapDots[i].setAttribute('cx', x.toFixed(1));
      this.mapDots[i].setAttribute('cy', y.toFixed(1));
    }
  }

  dispose() {
    this.el.remove();
  }
}
