import './results.css';
import { formatTime, ordinal } from './format.js';

// Pantalla de resultados al terminar la carrera.
export function showResults(root, { title, subtitle, rows, buttons, media }) {
  const el = document.createElement('div');
  el.className = 'results';
  el.innerHTML = `
    <div class="results-card" role="dialog" aria-label="Resultados">
      ${media ? `<div class="results-media">${media}</div>` : ''}
      <h2>${title}</h2>
      <div class="sub">${subtitle || ''}</div>
      <table>${rows.map((r) => `
        <tr class="${r.me ? 'me' : ''}">
          <td class="pos">${ordinal(r.position)}</td>
          <td><span class="dot" style="background:${r.color}"></span>${r.name}${r.me ? ` <small>(${r.playerLabel || 'vos'})</small>` : ''}</td>
          <td class="time">${r.estimated ? '~' : ''}${formatTime(r.time)}</td>
        </tr>`).join('')}
      </table>
      <div class="buttons"></div>
    </div>`;
  const bar = el.querySelector('.buttons');
  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.className = `btn ${b.secondary ? 'secondary' : ''}`;
    btn.textContent = b.label;
    btn.addEventListener('click', () => b.onClick());
    bar.appendChild(btn);
  }
  root.appendChild(el);
  setTimeout(() => bar.querySelector('button')?.focus(), 50);
  return { el, close: () => el.remove() };
}
