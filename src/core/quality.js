// Niveles de calidad gráfica (no afectan la jugabilidad).
export const QUALITY_PRESETS = {
  baja: { id: 'baja', label: 'Baja', pixelRatio: 0.75, antialias: false, shadows: false, shadowMapSize: 512, decorDensity: 0.35, particles: 0.4, drawDistance: 260 },
  media: { id: 'media', label: 'Media', pixelRatio: 1, antialias: false, shadows: true, shadowMapSize: 1024, decorDensity: 0.65, particles: 0.75, drawDistance: 360 },
  alta: { id: 'alta', label: 'Alta', pixelRatio: 2, antialias: true, shadows: true, shadowMapSize: 2048, decorDensity: 1, particles: 1, drawDistance: 480 },
};

export function defaultQualityId() {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
  return mobile ? 'baja' : 'alta';
}
