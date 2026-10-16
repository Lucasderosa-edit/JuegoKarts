import * as THREE from 'three';
import { TrackPath } from './trackPath.js';
import { buildTrackMeshes } from './trackMesh.js';
import { buildDecor, trackBounds } from './decor.js';
import { CONFIG } from '../config.js';

const q = {};

// Pista completa: geometría, meshes, decoración y efectos sobre los karts.
export class Track {
  constructor(def, quality) {
    this.def = def;
    this.theme = def.theme;
    this.path = new TrackPath(def);
    this.group = new THREE.Group();

    const b = trackBounds(this.path);
    const groundSize = Math.max(b.w, b.h) + 900;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      new THREE.MeshLambertMaterial({ color: this.theme.ground }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(b.cx, 0, b.cz);
    ground.receiveShadow = quality.shadows;
    this.group.add(ground);

    this.group.add(buildTrackMeshes(this.path, this.theme, { shadows: quality.shadows }));
    this.group.add(buildDecor(def.decor, this.path, this.theme, quality, def.decorOptions));
  }

  // Posiciones de largada (dos columnas, escalonadas, detrás de la línea)
  gridSlot(k) {
    const row = Math.floor(k / 2), col = k % 2;
    const s = -9 - row * 7 - col * 3;
    const lateral = (col === 0 ? -1 : 1) * this.path.halfWidth * 0.42;
    const p = this.path.pointAt(s, lateral);
    return { x: p.x, z: p.z, yaw: this.path.yawAt(this.path.indexAt(s)) };
  }

  // Actualiza la superficie bajo el kart y lo mantiene dentro de los bordes.
  applyToKart(kart) {
    const path = this.path;
    path.query(kart.position.x, kart.position.z, kart.trackIndex ?? -1, q);
    kart.trackIndex = q.index;
    kart.trackLateral = q.lateral;
    kart.trackDistance = q.distance;

    const abs = Math.abs(q.lateral);
    const surf = kart.surface;
    if (abs > path.halfWidth + 0.6) {
      surf.speed = CONFIG.track.offroadSpeed;
      surf.grip = CONFIG.track.offroadGrip;
      surf.offroad = true;
      surf.dustColor = this.theme.dust;
    } else {
      surf.speed = 1; surf.grip = 1; surf.offroad = false;
    }

    // Choque contra el borde
    const limit = path.wallOffset - kart.stats.radius;
    if (abs > limit) {
      const side = Math.sign(q.lateral);
      const nx = path.nx[q.index] * side, nz = path.nz[q.index] * side;
      const push = abs - limit;
      kart.position.x -= nx * push;
      kart.position.z -= nz * push;
      const vn = kart.velocity.x * nx + kart.velocity.y * nz;
      if (vn > 0) {
        const t = CONFIG.track;
        kart.velocity.x -= (1 + t.wallBounce) * vn * nx;
        kart.velocity.y -= (1 + t.wallBounce) * vn * nz;
        kart.velocity.multiplyScalar(t.wallSpeedKeep);
        // Enderezar el kart a lo largo del borde para que no quede trabado
        const along = Math.atan2(path.tx[q.index], path.tz[q.index]);
        const dir = Math.cos(kart.yaw - along) >= 0 ? along : along + Math.PI;
        let d = dir - kart.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        kart.yaw += d * t.wallAlign * Math.min(1, vn / 10);
        kart.bump(Math.min(1, vn / 12));
        this.onWallHit?.(kart, vn, kart.position.x + nx * kart.stats.radius, kart.position.z + nz * kart.stats.radius);
      }
    }
  }
}
