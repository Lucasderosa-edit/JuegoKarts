import './touch.css';
import { settings } from '../core/settings.js';

// Botones en pantalla para celulares y tablets (multitáctil).
export class TouchControls {
  constructor(parent, { onPause }) {
    this.state = { left: false, right: false, gas: false, brake: false, drift: false, item: false };
    this.itemQueued = false;
    this.el = document.createElement('div');
    this.el.className = 'touch-controls';
    const arrow = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
    this.el.innerHTML = `
      <div class="tc-btn tc-left" data-k="left">${arrow('M15 4 L6 12 L15 20 Z')}</div>
      <div class="tc-btn tc-right" data-k="right">${arrow('M9 4 L18 12 L9 20 Z')}</div>
      <div class="tc-btn tc-gas" data-k="gas">ACELERAR</div>
      <div class="tc-btn tc-brake" data-k="brake">FRENO</div>
      <div class="tc-btn tc-drift" data-k="drift">DERRAPE</div>
      <div class="tc-btn tc-item" data-k="item">ÍTEM</div>
      <div class="tc-btn tc-pause" data-k="pause">II</div>`;
    parent.appendChild(this.el);
    this.pointers = new Map(); // pointerId → botón
    for (const b of this.el.querySelectorAll('.tc-btn')) {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { b.setPointerCapture?.(e.pointerId); } catch { /* algunos navegadores no lo permiten */ }
        const k = b.dataset.k;
        if (k === 'pause') { onPause(); return; }
        this.pointers.set(e.pointerId, k);
        if (k === 'item') this.itemQueued = true;
        this.refresh();
      });
      const up = (e) => { this.pointers.delete(e.pointerId); this.refresh(); };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    }
    // Deslizar el dedo de una flecha a la otra cambia la dirección
    this.el.addEventListener('pointermove', (e) => {
      const k = this.pointers.get(e.pointerId);
      if (k !== 'left' && k !== 'right') return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tc-btn');
      const nk = target?.dataset.k;
      if ((nk === 'left' || nk === 'right') && nk !== k) { this.pointers.set(e.pointerId, nk); this.refresh(); }
    });
  }

  refresh() {
    for (const k of Object.keys(this.state)) this.state[k] = false;
    for (const k of this.pointers.values()) this.state[k] = true;
    for (const b of this.el.querySelectorAll('.tc-btn')) b.classList.toggle('on', !!this.state[b.dataset.k]);
  }

  read(c) {
    const s = this.state;
    const steer = (s.right ? 1 : 0) - (s.left ? 1 : 0);
    if (steer) c.steer = steer;
    const gas = s.gas || (settings.autoAccelerate && !s.brake);
    if (gas) c.throttle = 1;
    if (s.brake) c.brake = 1;
    if (s.drift) c.drift = true;
    if (this.itemQueued) { c.itemPressed = true; this.itemQueued = false; }
  }

  dispose() {
    this.el.remove();
  }
}

export function isTouchDevice() {
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
}
