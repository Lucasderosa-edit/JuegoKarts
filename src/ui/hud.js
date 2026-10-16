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
      <div class="hud-center"><div data-center></div></div>`;
    parent.appendChild(this.el);
    this.q = (sel) => this.el.querySelector(sel);
    this.lapEl = this.q('[data-lap]');
    this.lapsEl = this.q('[data-laps]');
    this.timeEl = this.q('[data-time]');
    this.lapListEl = this.q('[data-lap-list]');
    this.centerEl = this.q('[data-center]');
    this.warnEl = this.q('[data-warn]');
    this.posEl = this.q('[data-pos]');
    this.itemBoxEl = this.q('[data-item-box]');
    this.itemEl = this.q('[data-item]');
    this._lastItem = null;
    this._lastLapCount = -1;
    this._lastPos = '';
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
  }

  dispose() {
    this.el.remove();
  }
}
