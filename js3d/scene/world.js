// Die Insel Kanalbucht: Kreisel mit Portal in der Mitte, Weg nach rechts (Osten) zum Shop,
// Strand mit Häusern im Westen, weitere Häuser verteilt. Statische Teile sind zusammengefügt,
// gleiche Objekte (Bäume, Palmen, Laternen, Blumen, Steine) sind Instanzen.
import * as THREE from '../../vendor/three.module.min.js';
import { Builder, matrix, LAMBERT, textSprite } from './build.js';
import { disposeObject } from './dispose.js';

export const ISLAND_R = 82;
export const WALK_R = 78.5;
export const SPAWN = { x: 0, z: 19, yaw: 0 }; // yaw = Kamerarichtung: 0 = Blick nach Norden zum Portal
export const SHOP = { x: 56, z: 0, door: { x: 47.5, z: 0 } };
const C = {
  grass: '#7cc95a', grass2: '#6dbb4f', sand: '#f2d898', sand2: '#e9c97c', stone: '#d9d3c7', stone2: '#bfb7a8',
  road: '#5b6270', line: '#f5f5f0', water: '#3fb8d8', trunk: '#8b5a34',
};

// Drehung um die Hochachse (wie three.js): lokaler Punkt -> Welt.
export function rotY(x, z, rot) { return { x: x * Math.cos(rot) + z * Math.sin(rot), z: -x * Math.sin(rot) + z * Math.cos(rot) }; }

// Seeded Zufall, damit die Welt bei jedem Start gleich aussieht.
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- Hausmodelle ----------
export function houseSize(i) { return { w: 8 + Math.min(i, 8) * 0.9, d: 7 + Math.min(i, 8) * 0.7 }; }

// Baut ein Haus (Tür zeigt nach lokal +z) in den Builder b, verschoben nach (x, z) und gedreht.
export function buildHouse(b, h, i, x, z, rot) {
  if (h.kind === 'kuppel') return buildDome(b, h, x, z, rot);
  const { w, d } = houseSize(i);
  const fh = 3, H = h.floors * fh;
  const M = (lx, ly, lz, ry = 0, sx = 1, sy = 1, sz = 1) => { const p = rotY(lx, lz, rot); return matrix(x + p.x, ly, z + p.z, rot + ry, 0, 0, sx, sy, sz); };
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const box = (lw, lh, ld, lx, ly, lz, color) => b.add(BOX, color, M(lx, ly + lh / 2, lz, 0, lw, lh, ld));
  const win = '#2b4a6f', frame = '#ffffff';
  // Sockel und Weg zur Tür
  box(w + 0.6, 0.3, d + 0.6, 0, 0, 0, '#a8a29e');
  box(1.6, 0.06, 3.2, 0, 0, d / 2 + 1.6, C.stone);
  if (h.kind === 'villa') {
    box(w, H, d, 0, 0.3, 0, h.wall);
    box(w * 0.55, fh, d * 0.9, w * 0.62, 0.3, -d * 0.05, h.wall);
    box(w + 0.4, 0.35, d + 0.4, 0, 0.3 + H, 0, h.roof);
    box(w * 0.55 + 0.3, 0.3, d * 0.9 + 0.3, w * 0.62, 0.3 + fh, -d * 0.05, h.roof);
    box(w * 0.5, 0.15, 2.6, -w * 0.1, 0.05, d / 2 + 3.8, '#38bdf8'); // Pool
  } else {
    box(w, H, d, 0, 0.3, 0, h.wall);
    if (h.kind === 'block') {
      box(w + 0.4, 0.4, d + 0.4, 0, 0.3 + H, 0, h.roof);
      box(1.2, 0.8, 1.2, w * 0.25, 0.7 + H, -d * 0.2, '#9ca3af'); // Dachaufbau
    } else {
      const roofH = 2.4 + i * 0.15, s = 1.12 / Math.SQRT1_2;
      b.add(new THREE.ConeGeometry(1, 1, 4), h.roof, M(0, 0.3 + H + roofH / 2, 0, Math.PI / 4, (w / 2) * s, roofH, (d / 2) * s));
      box(0.7, 1.4, 0.7, w * 0.28, 0.3 + H + roofH * 0.35, -d * 0.15, '#7c4a3a'); // Schornstein
    }
    if (h.kind === 'turm') {
      const tx = -w / 2 - 0.4, tz = -d / 2 + 0.6, th = H + 3.5;
      const p = rotY(tx, tz, rot);
      b.add(new THREE.CylinderGeometry(1.6, 1.8, th, 10), h.wall, matrix(x + p.x, 0.3 + th / 2, z + p.z));
      b.add(new THREE.ConeGeometry(2.1, 2.8, 10), h.roof, matrix(x + p.x, 0.3 + th + 1.4, z + p.z));
    }
  }
  // Fenster auf allen Seiten, Tür vorne
  for (let f = 0; f < h.floors; f++) {
    const y = 0.3 + f * fh + 1.1;
    const cols = Math.max(2, Math.round(w / 2.6));
    for (let c = 0; c < cols; c++) {
      const lx = -w / 2 + (c + 0.5) * (w / cols);
      if (f === 0 && Math.abs(lx) < 1.2) continue;
      box(1.15, 1.2, 0.12, lx, y, d / 2 + 0.02, frame); box(0.9, 0.95, 0.14, lx, y + 0.12, d / 2 + 0.04, win);
      box(1.15, 1.2, 0.12, lx, y, -d / 2 - 0.02, frame); box(0.9, 0.95, 0.14, lx, y + 0.12, -d / 2 - 0.04, win);
    }
    for (const sx of [-1, 1]) {
      box(0.12, 1.2, 1.15, sx * (w / 2 + 0.02), y, 0, frame); box(0.14, 0.95, 0.9, sx * (w / 2 + 0.04), y + 0.12, 0, win);
    }
  }
  box(1.5, 2.3, 0.2, 0, 0.3, d / 2 + 0.05, '#6b4226');
  box(0.16, 0.16, 0.08, 0.45, 1.5, d / 2 + 0.18, '#facc15');
  // Briefkasten und Büsche
  box(0.35, 1.1, 0.35, 1.8, 0, d / 2 + 2.6, '#334155'); box(0.6, 0.45, 0.4, 1.8, 1.1, d / 2 + 2.6, '#ef4444');
  for (const sx of [-1, 1]) { const p = rotY(sx * (w / 2 - 0.6), d / 2 + 1, rot); b.add(new THREE.IcosahedronGeometry(0.75, 0), '#4f9d3a', matrix(x + p.x, 0.6, z + p.z)); }
  return { w: w + (h.kind === 'villa' ? w * 0.3 : 0) + (h.kind === 'turm' ? 2 : 0), d, H };
}

// Bau-Funktion für Map 1 (Kanalbucht). map = Datensatz aus js3d/data/maps.js.
// Glaskuppel für den Meeresgrund (Tür zeigt nach lokal +z). Liefert dieselben Masse wie buildHouse.
export function buildDome(b, h, x, z, rot) {
  const R = 5.5;
  const M = (lx, ly, lz, sx = 1, sy = 1, sz = 1) => { const p = rotY(lx, lz, rot); return matrix(x + p.x, ly, z + p.z, rot, 0, 0, sx, sy, sz); };
  b.add(new THREE.CylinderGeometry(R + 0.6, R + 0.9, 0.7, 20), '#5b6b7a', M(0, 0.35, 0));
  b.add(new THREE.SphereGeometry(R, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), h.wall, M(0, 0.7, 0));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.add(new THREE.BoxGeometry(0.25, 0.25, 0.25), '#fde68a', M(Math.cos(a) * (R + 0.4), 0.9, Math.sin(a) * (R + 0.4))); }
  b.add(new THREE.TorusGeometry(R * 0.7, 0.18, 6, 24), h.roof, matrix(x, 0.7 + R * 0.72, z, 0, Math.PI / 2, 0));
  b.add(new THREE.BoxGeometry(2.4, 2.6, 3), h.roof, M(0, 1.3, R - 0.2));       // Eingangsröhre
  b.add(new THREE.BoxGeometry(1.4, 2.1, 0.2), '#0f3b52', M(0, 1.05, R + 1.35));  // Schleusentür
  b.add(new THREE.CylinderGeometry(0.15, 0.15, 3, 6), '#94a3b8', M(0, R + 2.2, 0)); // Antenne
  return { w: R * 2 + 1, d: R * 2 + 1, H: R };
}

export function buildBucht(engine, S, map) {
  const HOUSES = map.houses;
  const { scene, details } = engine;
  const group = new THREE.Group();
  scene.add(group);
  const colliders = { circles: [], boxes: [] };
  const triggers = [];

  // ---------- Boden, Strand, Wasser ----------
  const ground = new Builder();
  ground.add(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 3, 3, 64), C.grass, matrix(0, -1.5, 0));
  ground.disc(76, ISLAND_R + 0.2, 0, 0.02, 0, C.sand, 64);                            // Sandrand ringsum
  ground.disc(46, ISLAND_R + 0.2, 0, 0.03, 0, C.sand, 40, Math.PI * 0.62, Math.PI * 0.76); // Strand im Westen
  ground.disc(66, 76, 0, 0.035, 0, C.sand2, 40, Math.PI * 0.62, Math.PI * 0.76);
  // Wiesenflecken für Farbe
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, rad = 18 + r() * 52, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (x < -42) continue;
    ground.disc(0, 3 + r() * 4, x, 0.01, z, C.grass2, 9);
  }
  // Kreisel: Platz, Rundweg mit Markierung, Blumenring
  ground.disc(0, 9, 0, 0.05, 0, C.stone, 40);
  ground.disc(6.2, 7, 0, 0.06, 0, C.stone2, 40);
  ground.disc(9, 13.5, 0, 0.05, 0, C.road, 48);
  for (let i = 0; i < 24; i++) ground.disc(11.1, 11.4, 0, 0.06, 0, C.line, 2, (i / 24) * Math.PI * 2, 0.12);
  ground.disc(13.5, 14.2, 0, 0.055, 0, C.stone2, 48);
  // Wege: Osten zum Shop, Norden zur Wohnung, Westen zum Strand, Süden zum Start
  const road = (x1, z1, x2, z2, wdt = 5) => {
    const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(x2 - x1, z2 - z1);
    ground.box(wdt, 0.05, len, (x1 + x2) / 2, 0.01, (z1 + z2) / 2, C.road, ang);
    ground.box(0.25, 0.06, len, (x1 + x2) / 2, 0.012, (z1 + z2) / 2, C.line, ang);
  };
  road(13, 0, 48, 0, 6);
  road(0, -13, 0, -31);
  road(-13, 0, -46, 0);
  road(0, 13, 0, 24, 4);
  for (const [x1, z1, x2, z2] of [[-46, -26, -46, 34], [0, -31, -32, -42], [0, -31, 34, -46], [24, 0, 34, 40], [-13, 8, -30, 46], [6, 24, 6, 50]]) {
    const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(x2 - x1, z2 - z1);
    ground.box(2.6, 0.04, len, (x1 + x2) / 2, 0.008, (z1 + z2) / 2, x1 < -40 ? C.sand2 : C.stone, ang);
  }
  const groundMesh = ground.mesh(LAMBERT, { cast: false, receive: true });
  group.add(groundMesh);

  const water = new THREE.Mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshLambertMaterial({ color: C.water }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.35; water.receiveShadow = false;
  group.add(water);
  const foam = new THREE.Mesh(new THREE.RingGeometry(ISLAND_R + 2.6, ISLAND_R + 4.2, 64), new THREE.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: 0.55 }));
  foam.rotation.x = -Math.PI / 2; foam.position.y = -0.3;
  group.add(foam);

  // ---------- Statische Bauten (ein Mesh) ----------
  const props = new Builder();
  // Bänke und Pflanzkübel am Platz
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6, x = Math.cos(a) * 7.8, z = Math.sin(a) * 7.8, ry = -a + Math.PI / 2;
    props.box(2.2, 0.12, 0.6, x, 0.45, z, '#a0673f', ry); props.box(2.2, 0.6, 0.12, x - Math.cos(a) * 0.3, 0.55, z - Math.sin(a) * 0.3, '#a0673f', ry);
    for (const s of [-0.9, 0.9]) props.box(0.12, 0.45, 0.5, x + Math.sin(a) * s, 0, z - Math.cos(a) * s, '#374151', ry);
  }
  // Portal: Sockel, zwei Säulen, Bogen
  props.cyl(4.2, 0.35, 0, 0, 0, '#9ca3af', 20); props.cyl(3.6, 0.2, 0, 0.35, 0, '#6b7280', 20);
  for (const sx of [-1, 1]) { props.box(0.9, 4.6, 0.9, sx * 2.9, 0.55, 0, '#4c4f6b'); props.box(1.2, 0.4, 1.2, sx * 2.9, 5.1, 0, '#facc15'); colliders.circles.push({ x: sx * 2.9, z: 0, r: 0.75 }); }
  props.add(new THREE.TorusGeometry(2.9, 0.4, 8, 24, Math.PI), '#4c4f6b', matrix(0, 5.1, 0));
  // Shop "Bitbazar"
  const sx = SHOP.x, sz = SHOP.z;
  props.box(12, 0.3, 16, sx, 0, sz, '#a8a29e');
  props.box(10, 6, 14, sx + 1, 0.3, sz, '#f8fafc');
  props.box(10.6, 0.5, 14.6, sx + 1, 6.3, sz, '#334155');
  props.box(0.3, 3.4, 10, sx - 4.1, 0.3, sz, '#7dd3fc');         // Glasfront
  props.box(0.4, 0.35, 10.4, sx - 4.15, 3.7, sz, '#334155');
  for (let i = 0; i < 7; i++) props.box(1.6, 0.25, 1.48, sx - 4.9, 4.0 - (i % 2) * 0.05, sz - 5.2 + i * 1.48, i % 2 ? '#ffffff' : '#e5384f', 0, 0, 0.35); // Markise
  props.box(0.2, 2.6, 2, sx - 4.25, 0.3, sz, '#1f2937');           // Tür
  colliders.boxes.push({ x: sx + 1, z: sz, hw: 5.4, hd: 7.4, rot: 0 });
  // Steg am Strand
  props.box(3, 0.25, 12, -80, 0.0, -2, '#a0673f', Math.PI / 2);
  for (let i = 0; i < 4; i++) props.cyl(0.18, 1.2, -76 - i * 3.2, -0.9, -0.6, '#7a4b2a', 6);
  // Sonnenschirme am Strand
  for (const [x, z, c] of [[-68, -16, '#e5384f'], [-71, 4, '#2fb3c6'], [-67, 24, '#facc15']]) {
    props.cyl(0.08, 2.4, x, 0, z, '#f5f5f4', 5); props.cone(1.8, 0.7, x, 2.3, z, c, 8);
    props.box(1.8, 0.1, 0.9, x + 1.2, 0.05, z, '#ffffff');
  }

  // ---------- Häuser ----------
  const houseSigns = [];
  HOUSES.forEach((h, i) => {
    const size = buildHouse(props, h, i, h.x, h.z, h.rot);
    colliders.boxes.push({ x: h.x, z: h.z, hw: size.w / 2 + 0.3, hd: size.d / 2 + 0.3, rot: h.rot });
    const door = rotY(0, size.d / 2 + 2.2, h.rot);
    const sign = textSprite(['', ''], { scale: 4.4 });
    const top = rotY(0, size.d / 2 + 3.6, h.rot);
    sign.position.set(h.x + top.x, 3.3, h.z + top.z);
    group.add(sign);
    houseSigns.push({ house: h, sign, index: i });
    triggers.push({ id: 'haus:' + h.id, kind: 'house', house: h, index: i, x: h.x + door.x, z: h.z + door.z, r: 2.6 });
  });
  const propsMesh = props.mesh();
  group.add(propsMesh);

  const shopSign = textSprite(['BITBAZAR', 'Technik & PC-Teile'], { scale: 7, bg: '#e5384f', accent: '#ffffff' });
  shopSign.position.set(sx - 4.3, 8.2, sz);
  group.add(shopSign);
  triggers.push({ id: 'shop', kind: 'shop', x: SHOP.door.x, z: SHOP.door.z, r: 3.2 });

  // ---------- Bäume, Palmen, Laternen, Steine, Blumen (Instanzen) ----------
  const blocked = (x, z) => {
    const d = Math.hypot(x, z);
    if (d < 17 || d > 74) return true;
    if (Math.abs(z) < 5 && x > 10 && x < 64) return true;               // Shopweg + Shop
    if (Math.abs(x) < 4.5 && z < -10 && z > -33) return true;
    if (Math.abs(z) < 4.5 && x < -10) return true;
    if (Math.abs(x) < 4 && z > 10 && z < 26) return true;
    if (x < -44) return true;                                             // Strand: dort nur Palmen
    for (const h of HOUSES) if (Math.hypot(x - h.x, z - h.z) < 12) return true;
    return false;
  };
  const trees = [];
  const rt = rng(42);
  for (let n = 0; trees.length < 120 && n < 4000; n++) {
    const x = (rt() * 2 - 1) * 76, z = (rt() * 2 - 1) * 76;
    if (blocked(x, z) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 3.2)) continue;
    trees.push({ x, z, s: 0.8 + rt() * 0.7, kind: rt() < 0.65 ? 0 : 1 });
  }
  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, place, { cast = true, receive = false } = {}) => {
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => { place(dummy, t, i); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.castShadow = cast; m.receiveShadow = receive;
    m.instanceMatrix.needsUpdate = true;
    return m;
  };
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 2, 6).translate(0, 1, 0);
  const pineGeo = new THREE.ConeGeometry(1.7, 3.6, 7).translate(0, 3.4, 0);
  const pineTop = new THREE.ConeGeometry(1.15, 2.4, 7).translate(0, 5.1, 0);
  const roundGeo = new THREE.IcosahedronGeometry(1.8, 0).translate(0, 3.4, 0);
  const leaf = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
  const trunkMat = new THREE.MeshLambertMaterial({ color: C.trunk, flatShading: true });
  group.add(inst(trunkGeo, trunkMat, trees, (o, t) => { o.position.set(t.x, 0, t.z); o.scale.setScalar(t.s); o.rotation.set(0, 0, 0); }));
  const pines = trees.filter(t => t.kind === 0), rounds = trees.filter(t => t.kind === 1);
  const greens = ['#3f8f3a', '#4ca146', '#2f7d3b', '#5fae4b'];
  const colorize = (m, list) => { list.forEach((t, i) => m.setColorAt(i, new THREE.Color(greens[Math.floor(Math.abs(Math.sin(t.x * 3.1 + t.z)) * 4)]))); m.instanceColor.needsUpdate = true; return m; };
  group.add(colorize(inst(pineGeo, leaf, pines, (o, t) => { o.position.set(t.x, 0, t.z); o.scale.setScalar(t.s); o.rotation.y = t.x; }), pines));
  group.add(colorize(inst(pineTop, leaf, pines, (o, t) => { o.position.set(t.x, 0, t.z); o.scale.setScalar(t.s); o.rotation.y = t.z; }), pines));
  group.add(colorize(inst(roundGeo, leaf, rounds, (o, t) => { o.position.set(t.x, 0, t.z); o.scale.setScalar(t.s); o.rotation.y = t.x; }), rounds));
  for (const t of trees) colliders.circles.push({ x: t.x, z: t.z, r: 0.5 * t.s + 0.2 });

  // Palmen am Strand
  const palms = [];
  const rp = rng(9);
  for (let n = 0; palms.length < 16 && n < 2000; n++) {
    const a = Math.PI * 0.64 + rp() * Math.PI * 0.72, rad = 50 + rp() * 25, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (HOUSES.some(h => Math.hypot(x - h.x, z - h.z) < 9) || Math.abs(z) < 4 || palms.some(p => Math.hypot(p.x - x, p.z - z) < 5)) continue;
    palms.push({ x, z, s: 0.9 + rp() * 0.4, lean: (rp() - 0.5) * 0.4 });
  }
  const palmTrunk = new THREE.CylinderGeometry(0.16, 0.28, 5, 6).translate(0, 2.5, 0);
  const palmLeaves = new Builder();
  for (let i = 0; i < 6; i++) palmLeaves.add(new THREE.ConeGeometry(0.5, 3, 4), '#ffffff', matrix(Math.cos(i) * 1.2, 5, Math.sin(i) * 1.2, -i, 0, Math.PI / 2.3, 1, 1, 0.3));
  const palmLeafGeo = palmLeaves.geometry(); palmLeafGeo.deleteAttribute('color');
  group.add(inst(palmTrunk, trunkMat, palms, (o, p) => { o.position.set(p.x, 0, p.z); o.scale.setScalar(p.s); o.rotation.set(p.lean, 0, p.lean); }));
  group.add(inst(palmLeafGeo, new THREE.MeshLambertMaterial({ color: '#3ea84a', flatShading: true }), palms, (o, p) => { o.position.set(p.x + p.lean * 2.5 * p.s, 0, p.z - p.lean * 2.5 * p.s); o.scale.setScalar(p.s); o.rotation.set(0, p.x, 0); }));
  for (const p of palms) colliders.circles.push({ x: p.x, z: p.z, r: 0.45 });

  // Laternen am Kreisel und am Shopweg
  const lamps = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.31; lamps.push({ x: Math.cos(a) * 15, z: Math.sin(a) * 15 }); }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) lamps.push({ x: 18 + i * 8.5, z: s * 4.2 });
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.13, 4, 6).translate(0, 2, 0);
  const headGeo = new THREE.BoxGeometry(0.55, 0.45, 0.55).translate(0, 4.2, 0);
  group.add(inst(lampGeo, new THREE.MeshLambertMaterial({ color: '#2f3542' }), lamps, (o, l) => o.position.set(l.x, 0, l.z)));
  group.add(inst(headGeo, new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#ffd27a', emissiveIntensity: 0.6 }), lamps, (o, l) => o.position.set(l.x, 0, l.z), { cast: false }));
  for (const l of lamps) colliders.circles.push({ x: l.x, z: l.z, r: 0.3 });

  // Steine am Ufer
  const rocks = [];
  const rr = rng(3);
  for (let i = 0; i < 38; i++) { const a = rr() * Math.PI * 2; if (Math.cos(a) < -0.5) continue; rocks.push({ x: Math.cos(a) * (79 + rr() * 3), z: Math.sin(a) * (79 + rr() * 3), s: 0.7 + rr() * 1.4, r: rr() * 6 }); }
  group.add(inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#9aa0a6', flatShading: true }), rocks, (o, k) => { o.position.set(k.x, -0.2, k.z); o.scale.set(k.s, k.s * 0.7, k.s); o.rotation.set(k.r, k.r, 0); }));

  // Details (ab Grafik "Mittel"): Blumen, Wolken, Inseln am Horizont
  const flowers = [];
  const rf = rng(11);
  for (let n = 0; flowers.length < 260 && n < 6000; n++) {
    const x = (rf() * 2 - 1) * 74, z = (rf() * 2 - 1) * 74;
    if (blocked(x, z) && !(Math.hypot(x, z) > 6.3 && Math.hypot(x, z) < 6.9)) continue;
    flowers.push({ x, z, c: ['#f472b6', '#facc15', '#ffffff', '#a78bfa', '#fb7185'][Math.floor(rf() * 5)] });
  }
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; flowers.push({ x: Math.cos(a) * 6.6, z: Math.sin(a) * 6.6, c: i % 2 ? '#f472b6' : '#facc15' }); }
  const fl = inst(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({ color: '#ffffff' }), flowers, (o, f) => o.position.set(f.x, 0.25, f.z), { cast: false });
  flowers.forEach((f, i) => fl.setColorAt(i, new THREE.Color(f.c))); fl.instanceColor.needsUpdate = true;
  group.add(fl); details.push(fl);

  const clouds = new Builder();
  const rc = rng(5);
  for (let i = 0; i < 12; i++) {
    const a = rc() * Math.PI * 2, rad = 60 + rc() * 120, x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = 38 + rc() * 18;
    for (let k = 0; k < 4; k++) clouds.sphere(3 + rc() * 3, x + k * 3.5 - 5, y + rc() * 1.5, z + rc() * 2, '#ffffff', 1);
  }
  const cloudMesh = new THREE.Mesh(clouds.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#dfe9f5', emissiveIntensity: 0.35 }));
  group.add(cloudMesh); details.push(cloudMesh);
  const far = new Builder();
  for (const [a, rad, s] of [[0.3, 230, 1], [1.4, 260, 1.4], [2.6, 240, 1.1], [3.7, 280, 1.6], [4.6, 250, 1.2], [5.6, 270, 1]]) {
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    far.cone(28 * s, 26 * s, x, -2, z, '#5e9c62', 7); far.cone(16 * s, 30 * s, x + 14 * s, -2, z + 6, '#6aa86c', 6);
  }
  const farMesh = far.mesh(LAMBERT, { cast: false, receive: false });
  group.add(farMesh); details.push(farMesh);

  // ---------- Portal (animiert) ----------
  const portalMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { time: { value: 0 }, open: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float time; uniform float open; varying vec2 vUv;
      void main(){ vec2 p = vUv*2.0-1.0; float r = length(p); if(r>1.0) discard;
        float a = atan(p.y,p.x); float swirl = sin(a*5.0 + r*12.0 - time*4.0)*0.5+0.5;
        vec3 closed = vec3(0.32,0.33,0.42) + swirl*0.05;
        vec3 opened = mix(vec3(0.45,0.15,0.95), vec3(0.2,0.9,1.0), swirl) * (1.2 - r*0.5);
        gl_FragColor = vec4(mix(closed, opened, open), mix(0.55, 0.95, open)); }`,
  });
  const portalDisc = new THREE.Mesh(new THREE.CircleGeometry(2.55, 32), portalMat);
  portalDisc.position.set(0, 2.75, 0);
  group.add(portalDisc);
  const portalSign = textSprite(['PORTAL', '5:00'], { scale: 4.4, bg: '#312e81', accent: '#c4b5fd' });
  portalSign.position.set(0, 7.4, 0);
  group.add(portalSign);
  triggers.push({ id: 'portal', kind: 'portal', x: 0, z: 2.2, r: 3 });
  colliders.boxes.push({ x: 0, z: 0, hw: 2.1, hd: 0.25, rot: 0 });

  return {
    group, colliders, triggers, houseSigns, cloudMesh,
    zones: { ground: { y: 0, bounds: { x: 0, z: 0, r: map.walkRadius }, colliders } },
    update(t) { cloudMesh.rotation.y = t * 0.004; },
    dispose() { for (const d of [fl, cloudMesh, farMesh]) { const i = details.indexOf(d); if (i >= 0) details.splice(i, 1); } return disposeObject(group); },
    updatePortal(t, open, text) {
      portalMat.uniforms.time.value = t;
      portalMat.uniforms.open.value += ((open ? 1 : 0) - portalMat.uniforms.open.value) * 0.05;
      if (text !== portalSign.lastText) { portalSign.lastText = text; portalSign.update(['PORTAL', text], open ? { bg: '#6d28d9', accent: '#fde68a' } : {}); }
    },
    stats: { trees: trees.length, palms: palms.length, lamps: lamps.length, flowers: flowers.length },
  };
}
