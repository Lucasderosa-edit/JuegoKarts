// Formatea segundos como 1:23.45
export function formatTime(t) {
  if (t == null || !isFinite(t)) return '-:--.--';
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

export function ordinal(n) {
  return `${n}.º`;
}
