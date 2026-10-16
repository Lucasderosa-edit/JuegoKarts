import { CONFIG } from '../config.js';

// Choques entre karts: círculos en el plano, con impulso según la masa.
export function resolveKartCollisions(karts, onBump) {
  const c = CONFIG.collisions;
  for (let i = 0; i < karts.length; i++) {
    const a = karts[i];
    for (let j = i + 1; j < karts.length; j++) {
      const b = karts[j];
      const dx = b.position.x - a.position.x, dz = b.position.z - a.position.z;
      const r = a.stats.radius + b.stats.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r || d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d, nz = dz / d;
      const ma = a.stats.mass * (a.shieldTime > 0 ? 3 : 1), mb = b.stats.mass * (b.shieldTime > 0 ? 3 : 1);
      const inv = 1 / (ma + mb);

      // Separarlos (el más pesado se mueve menos)
      const overlap = r - d;
      a.position.x -= nx * overlap * mb * inv;
      a.position.z -= nz * overlap * mb * inv;
      b.position.x += nx * overlap * ma * inv;
      b.position.z += nz * overlap * ma * inv;

      // Impulso en la dirección del choque
      const rvx = b.velocity.x - a.velocity.x, rvz = b.velocity.y - a.velocity.y;
      const vn = rvx * nx + rvz * nz;
      if (vn >= 0) continue; // ya se están separando
      const jImp = -(1 + c.restitution) * vn / (1 / ma + 1 / mb);
      const push = jImp + c.minPush;
      a.velocity.x -= (push / ma) * nx;
      a.velocity.y -= (push / ma) * nz;
      b.velocity.x += (push / mb) * nx;
      b.velocity.y += (push / mb) * nz;

      // Un pequeño giro al que recibe el golpe de costado
      const strength = Math.min(1, -vn / 15);
      a.bump(strength * mb * inv * 2);
      b.bump(strength * ma * inv * 2);
      onBump?.(a, b, strength, (a.position.x + b.position.x) / 2, (a.position.z + b.position.z) / 2);
    }
  }
}
