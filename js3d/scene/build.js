// Baukasten für Low-Poly-Modelle: viele einfache Formen werden zu EINEM Mesh mit Vertexfarben
// zusammengefügt. Das spart Draw-Calls (ein Haus = ein Draw-Call statt zwanzig).
import * as THREE from '../../vendor/three.module.min.js';

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();

export function matrix(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  tmpE.set(rx, ry, rz);
  tmpQ.setFromEuler(tmpE);
  return new THREE.Matrix4().compose(tmpP.set(x, y, z), tmpQ, tmpS.set(sx, sy, sz));
}

export class Builder {
  constructor() { this.pos = []; this.nor = []; this.col = []; }

  // Fügt eine Geometrie mit Farbe und Lage hinzu. Flache Normalen = Low-Poly-Look.
  add(geo, color, m) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m);
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    const c = new THREE.Color(color);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]);
      this.nor.push(n[i], n[i + 1], n[i + 2]);
      this.col.push(c.r, c.g, c.b);
    }
    g.dispose();
    return this;
  }

  // Bequeme Formen. y ist immer die Unterkante (Objekte stehen auf dem Boden).
  box(w, h, d, x, y, z, color, ry = 0, rx = 0, rz = 0) { return this.add(BOX, color, matrix(x, y + h / 2, z, ry, rx, rz, w, h, d)); }
  cyl(r, h, x, y, z, color, seg = 8, rTop = r) {
    return this.add(new THREE.CylinderGeometry(rTop, r, h, seg), color, matrix(x, y + h / 2, z));
  }
  cone(r, h, x, y, z, color, seg = 7, ry = 0) { return this.add(new THREE.ConeGeometry(r, h, seg), color, matrix(x, y + h / 2, z, ry)); }
  sphere(r, x, y, z, color, detail = 0) { return this.add(new THREE.IcosahedronGeometry(r, detail), color, matrix(x, y, z)); }
  // Flache Scheibe oder Ring auf dem Boden (y = Höhe).
  disc(inner, outer, x, y, z, color, seg = 48, start = 0, len = Math.PI * 2) {
    return this.add(new THREE.RingGeometry(inner, outer, seg, 1, start, len), color, matrix(x, y, z, 0, -Math.PI / 2));
  }

  get empty() { return this.pos.length === 0; }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }

  mesh(material = LAMBERT, { cast = true, receive = true } = {}) {
    const m = new THREE.Mesh(this.geometry(), material);
    m.castShadow = cast; m.receiveShadow = receive;
    m.matrixAutoUpdate = false; m.updateMatrix();
    return m;
  }
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
export const LAMBERT = new THREE.MeshLambertMaterial({ vertexColors: true });
LAMBERT.userData.shared = true; // wird von Insel, Häusern und Arena gemeinsam benutzt

// Text als Schild (Canvas-Textur, keine Schriftdateien: Systemschrift).
export function textSprite(lines, { width = 512, height = 192, bg = '#1f2937', fg = '#ffffff', accent = '#facc15', scale = 4 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale * height / width, 1);
  sprite.update = (newLines, opts = {}) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = opts.bg || bg;
    const r = 28;
    ctx.beginPath(); ctx.roundRect(6, 6, width - 12, height - 12, r); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = opts.accent || accent; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ls = [].concat(newLines);
    ls.forEach((t, i) => {
      ctx.fillStyle = i === 0 ? (opts.fg || fg) : (opts.accent || accent);
      ctx.font = `${i === 0 ? 800 : 700} ${i === 0 ? 58 : 46}px system-ui, "Segoe UI", sans-serif`;
      ctx.fillText(t, width / 2, height / 2 + (i - (ls.length - 1) / 2) * 62);
    });
    tex.needsUpdate = true;
  };
  sprite.update(lines);
  return sprite;
}

// Grasbüschel als EIN InstancedMesh (nur bei Grafik "Hoch" sichtbar). points = [{ x, z, s, r }].
export function grassTufts(points) {
  const b = new Builder();
  for (let k = 0; k < 3; k++) b.add(new THREE.ConeGeometry(0.06, 0.55, 3), '#ffffff', matrix(Math.cos(k * 2.1) * 0.12, 0.27, Math.sin(k * 2.1) * 0.12, k, Math.cos(k * 2.1) * 0.25, 0, 1, 1, 1));
  const geo = b.geometry(); geo.deleteAttribute('color');
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), Math.max(1, points.length));
  const o = new THREE.Object3D(), c = new THREE.Color();
  const greens = ['#5aa83f', '#6cbf4a', '#4e9a38', '#7ccf55'];
  points.forEach((p, i) => {
    o.position.set(p.x, 0, p.z); o.rotation.set(0, p.r, 0); o.scale.setScalar(p.s); o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix); mesh.setColorAt(i, c.set(greens[i % greens.length]));
  });
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  return mesh;
}
