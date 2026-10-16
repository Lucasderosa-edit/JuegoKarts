// Mejores tiempos por pista, guardados en el navegador (localStorage).
const KEY = 'turbo-ruedas:records';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function getRecords() {
  return load();
}

// Guarda si mejora. Devuelve qué récords se batieron.
export function submitRecord(trackId, { total, lap, character }) {
  const all = load();
  const cur = all[trackId] || {};
  const result = { total: false, lap: false };
  if (total && (!cur.total || total < cur.total)) { cur.total = total; cur.totalBy = character; result.total = true; }
  if (lap && (!cur.lap || lap < cur.lap)) { cur.lap = lap; cur.lapBy = character; result.lap = true; }
  all[trackId] = cur;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Sin almacenamiento disponible
  }
  return result;
}
