import * as THREE from 'three';

// Geometría de la pista: una curva cerrada muestreada cada ~2 m.
// Sirve para dibujar la pista y para saber dónde está cada kart
// (sobre el asfalto, en el pasto o contra el borde) y cuánto avanzó.

export class TrackPath {
  constructor(def) {
    this.def = def;
    this.halfWidth = def.width / 2;
    this.offroadWidth = def.offroadWidth;              // pasto entre el asfalto y el borde
    this.wallOffset = this.halfWidth + this.offroadWidth; // distancia del centro al borde

    const pts = def.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    this.length = curve.getLength();
    const n = Math.max(64, Math.round(this.length / (def.sampleSpacing || 2)));
    const spaced = curve.getSpacedPoints(n); // n+1 puntos, el último repite el primero
    spaced.pop();
    this.count = spaced.length;
    this.spacing = this.length / this.count;

    this.px = new Float32Array(this.count);
    this.pz = new Float32Array(this.count);
    this.tx = new Float32Array(this.count); // tangente (dirección de carrera)
    this.tz = new Float32Array(this.count);
    this.nx = new Float32Array(this.count); // normal hacia la derecha
    this.nz = new Float32Array(this.count);
    this.curv = new Float32Array(this.count); // curvatura con signo (+ = curva a la izquierda)
    for (let i = 0; i < this.count; i++) {
      this.px[i] = spaced[i].x;
      this.pz[i] = spaced[i].z;
    }
    for (let i = 0; i < this.count; i++) {
      const a = this.wrap(i - 1), b = this.wrap(i + 1);
      let tx = this.px[b] - this.px[a], tz = this.pz[b] - this.pz[a];
      const l = Math.hypot(tx, tz) || 1;
      tx /= l; tz /= l;
      this.tx[i] = tx; this.tz[i] = tz;
      // Mismo criterio que el kart: derecha = (-cos yaw, sin yaw) con frente (sin yaw, cos yaw)
      this.nx[i] = -tz; this.nz[i] = tx;
    }
    for (let i = 0; i < this.count; i++) {
      const a = this.wrap(i - 2), b = this.wrap(i + 2);
      const ya = Math.atan2(this.tx[a], this.tz[a]), yb = Math.atan2(this.tx[b], this.tz[b]);
      let d = yb - ya;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.curv[i] = d / (4 * this.spacing);
    }
  }

  // Índice de muestra para una posición expresada en puntos de control
  // (ej. 4.5 = a mitad de camino entre el punto 4 y el 5)
  sampleAtControl(at) {
    if (!this._cpIndex) {
      this._cpIndex = this.def.points.map(([x, z]) => this.nearest(x, z));
    }
    const n = this._cpIndex.length;
    const a = Math.floor(at) % n, b = (a + 1) % n;
    const t = at - Math.floor(at);
    let ia = this._cpIndex[a], ib = this._cpIndex[b];
    if (ib < ia) ib += this.count;
    return this.wrap(Math.round(ia + (ib - ia) * t));
  }

  distanceAtControl(at) {
    return this.sampleAtControl(at) * this.spacing;
  }

  wrap(i) {
    return ((i % this.count) + this.count) % this.count;
  }

  yawAt(i) {
    i = this.wrap(i);
    return Math.atan2(this.tx[i], this.tz[i]);
  }

  // Busca el punto de la pista más cercano. Con "hint" (el índice anterior)
  // busca solo cerca, así no se confunde con otro tramo de la pista que pase al lado.
  nearest(x, z, hint = -1, window = 24) {
    let best = -1, bestD = Infinity;
    if (hint >= 0) {
      for (let k = -window; k <= window; k++) {
        const i = this.wrap(hint + k);
        const dx = x - this.px[i], dz = z - this.pz[i];
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; best = i; }
      }
    } else {
      for (let i = 0; i < this.count; i++) {
        const dx = x - this.px[i], dz = z - this.pz[i];
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  // Información de un punto respecto de la pista.
  query(x, z, hint = -1, out = {}) {
    const i = this.nearest(x, z, hint);
    const dx = x - this.px[i], dz = z - this.pz[i];
    const along = dx * this.tx[i] + dz * this.tz[i];
    out.index = i;
    out.lateral = dx * this.nx[i] + dz * this.nz[i];
    out.distance = this.wrapDistance(i * this.spacing + along);
    out.onRoad = Math.abs(out.lateral) <= this.halfWidth;
    return out;
  }

  wrapDistance(s) {
    return ((s % this.length) + this.length) % this.length;
  }

  // Punto de la pista a una distancia s desde la largada, con un corrimiento lateral.
  pointAt(s, lateral = 0, out = new THREE.Vector3()) {
    s = this.wrapDistance(s);
    const f = s / this.spacing;
    const i = Math.floor(f) % this.count, j = (i + 1) % this.count;
    const t = f - Math.floor(f);
    const x = this.px[i] + (this.px[j] - this.px[i]) * t;
    const z = this.pz[i] + (this.pz[j] - this.pz[i]) * t;
    const nx = this.nx[i] + (this.nx[j] - this.nx[i]) * t;
    const nz = this.nz[i] + (this.nz[j] - this.nz[i]) * t;
    return out.set(x + nx * lateral, 0, z + nz * lateral);
  }

  indexAt(s) {
    return Math.floor(this.wrapDistance(s) / this.spacing) % this.count;
  }
}
