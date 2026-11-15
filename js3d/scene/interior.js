// Innenraum eines Hauses. Grösse und Einrichtung hängen vom Haus ab (Wohnung 50 m² … Schloss).
// Puppenhaus-Trick: Wände sind Flächen, die nach innen zeigen. Steht die Kamera draussen,
// sieht sie die Rückseite, und die wird nicht gezeichnet. So bleibt der Blick frei.
import * as THREE from '../../vendor/three.module.min.js';
import { Builder, matrix, LAMBERT, textSprite } from './build.js';
import { HOUSES, BUTTONS, PARTS } from '../data/content.js';

const WALL_MAT = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.FrontSide });

export function roomSize(houseIdx) {
  return Math.max(7.5, Math.min(28, Math.sqrt(HOUSES[houseIdx].size) * 1.05));
}

export function buildInterior(engine, S, houseIdx) {
  const h = HOUSES[houseIdx];
  const L = roomSize(houseIdx), half = L / 2, Hh = 3.2;
  const group = new THREE.Group();
  const colliders = { circles: [], boxes: [] };
  const triggers = [];
  const b = new Builder(), walls = new Builder();
  const solid = (w, d, x, z) => colliders.boxes.push({ x, z, hw: w / 2, hd: d / 2, rot: 0 });

  // Garten rundherum und Boden
  b.disc(0, L * 1.6 + 12, 0, -0.02, 0, '#7cc95a', 32);
  b.box(L + 0.6, 0.2, L + 0.6, 0, -0.1, 0, '#8b5e3c');
  const planks = Math.ceil(L / 0.9);
  for (let i = 0; i < planks; i++) b.box(L / planks - 0.04, 0.02, L, -half + (i + 0.5) * (L / planks), 0.1, 0, i % 2 ? '#c08a5a' : '#b57c4c');
  // Wände (nach innen zeigend)
  const wallColor = new THREE.Color(h.wall).lerp(new THREE.Color('#ffffff'), 0.45).getStyle();
  const plane = new THREE.PlaneGeometry(1, 1);
  walls.add(plane, wallColor, matrix(0, Hh / 2, -half, 0, 0, 0, L, Hh, 1));
  walls.add(plane, wallColor, matrix(0, Hh / 2, half, Math.PI, 0, 0, L, Hh, 1));
  walls.add(plane, wallColor, matrix(-half, Hh / 2, 0, Math.PI / 2, 0, 0, L, Hh, 1));
  walls.add(plane, wallColor, matrix(half, Hh / 2, 0, -Math.PI / 2, 0, 0, L, Hh, 1));
  // Sockelleisten (von beiden Seiten sichtbar, sehen aus wie Wandkanten)
  for (const [w, d, x, z] of [[L, 0.2, 0, -half], [L, 0.2, 0, half], [0.2, L, -half, 0], [0.2, L, half, 0]]) b.box(w, 0.25, d, x, 0.1, z, '#f8fafc');

  // ---------- Schreibtisch mit PC (der wichtigste Ort) ----------
  const dx = -half * 0.35, dz = -half + 0.75;
  b.box(2.4, 0.08, 1.1, dx, 0.82, dz, '#4b5563');
  for (const sx of [-1.1, 1.1]) b.box(0.08, 0.82, 1, dx + sx, 0, dz, '#374151');
  const lv = id => S.parts[id] || 0;
  const monitors = 1 + Math.min(2, Math.floor(lv('monitor') / 3));
  for (let m = 0; m < monitors; m++) {
    const mx = dx + (m - (monitors - 1) / 2) * 0.85;
    b.box(0.08, 0.35, 0.08, mx, 0.9, dz - 0.3, '#111827');
    b.box(0.8, 0.5, 0.06, mx, 1.22, dz - 0.32, '#111827');
    b.box(0.72, 0.42, 0.02, mx, 1.26, dz - 0.285, lv('monitor') > 0 ? '#38bdf8' : '#64748b');
  }
  const gpuGlow = ['#64748b', '#22c55e', '#06b6d4', '#a855f7', '#f43f5e'][Math.min(4, Math.floor(lv('gpu') / 2))];
  b.box(0.45, 0.9, 0.9, dx + 1.6, 0, dz, '#1f2937'); b.box(0.04, 0.7, 0.6, dx + 1.38, 0.1, dz, gpuGlow);
  b.box(0.5, 0.04, 0.18, dx - 0.1, 0.86, dz + 0.15, lv('tastatur') > 0 ? '#e5e7eb' : '#9ca3af');
  b.box(0.12, 0.04, 0.18, dx + 0.45, 0.86, dz + 0.2, lv('maus') > 0 ? '#f43f5e' : '#6b7280');
  b.box(0.6, 0.08, 0.6, dx, 0.5, dz + 0.9, '#111827'); b.box(0.6, 0.7, 0.08, dx, 0.55, dz + 1.2, '#e5384f'); b.cyl(0.05, 0.5, dx, 0, dz + 0.9, '#374151', 6);
  solid(3.4, 1.3, dx + 0.4, dz);
  const pcSign = textSprite(['🎬 PC', 'Video machen'], { scale: 2.4, bg: '#0f766e', accent: '#ccfbf1' });
  pcSign.position.set(dx, 2.3, dz);
  group.add(pcSign);
  triggers.push({ id: 'pc', kind: 'pc', x: dx, z: dz + 1.5, r: 1.7 });

  // Router (zeigt die WLAN-Stufe)
  b.box(0.4, 0.1, 0.25, dx - 1.0, 0.86, dz - 0.25, '#f8fafc');
  for (let a = 0; a < Math.min(4, 1 + lv('router')); a++) b.box(0.03, 0.25 + a * 0.06, 0.03, dx - 1.15 + a * 0.1, 0.96, dz - 0.3, '#111827');

  // ---------- Bett, Teppich, Pflanze ----------
  b.box(1.6, 0.45, 2.2, -half + 1.0, 0, half * 0.25, '#7c5c3b'); b.box(1.5, 0.2, 2.1, -half + 1.0, 0.45, half * 0.25, '#e0f2fe');
  b.box(1.4, 0.2, 0.5, -half + 1.0, 0.65, half * 0.25 - 0.7, '#ffffff'); b.box(1.5, 0.12, 1.2, -half + 1.0, 0.62, half * 0.25 + 0.4, '#6366f1');
  solid(1.7, 2.3, -half + 1.0, half * 0.25);
  b.box(Math.min(4, L * 0.35), 0.02, Math.min(3, L * 0.28), 0.3, 0.11, 0.2, '#f59e0b');
  b.cyl(0.25, 0.4, half - 0.6, 0, -half + 0.6, '#b45309', 8); b.sphere(0.45, half - 0.6, 0.85, -half + 0.6, '#3f8f3a', 0);
  colliders.circles.push({ x: half - 0.6, z: -half + 0.6, r: 0.4 });

  // ---------- Mehr Möbel in grösseren Häusern ----------
  const extras = [
    [1, () => { b.box(2.2, 0.45, 0.9, half * 0.35, 0, half - 1.0, '#2563eb'); b.box(2.2, 0.6, 0.25, half * 0.35, 0.45, half - 0.6, '#1d4ed8'); solid(2.3, 1, half * 0.35, half - 1.0); }],
    [1, () => { b.cyl(0.05, 1.6, half - 0.5, 0, half - 0.5, '#111827', 6); b.cone(0.35, 0.4, half - 0.5, 1.6, half - 0.5, '#fde68a', 8); }],
    [2, () => { b.box(1.8, 1.05, 0.08, half * 0.35, 0.8, -half + 0.06, '#111827'); b.box(1.7, 0.95, 0.02, half * 0.35, 0.85, -half + 0.11, '#0ea5e9'); }],
    [2, () => { b.box(0.4, 2.2, 1.6, -half + 0.25, 0, -half * 0.4, '#7c4a2a'); for (let k = 0; k < 4; k++) b.box(0.3, 0.35, 1.4, -half + 0.3, 0.2 + k * 0.5, -half * 0.4, ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][k]); solid(0.5, 1.7, -half + 0.25, -half * 0.4); }],
    [4, () => { b.box(1.6, 0.7, 0.6, half * 0.6, 0, half * 0.1, '#334155'); b.box(1.5, 0.8, 0.5, half * 0.6, 0.7, half * 0.1, '#67e8f9'); solid(1.7, 0.7, half * 0.6, half * 0.1); }],
    [5, () => { b.box(1.6, 0.9, 0.7, -half * 0.55, 0, half - 0.6, '#111827'); b.box(1.5, 0.05, 0.25, -half * 0.55, 0.9, half - 0.75, '#f8fafc'); solid(1.7, 0.8, -half * 0.55, half - 0.6); }],
    [6, () => { b.box(2.4, 0.8, 1.4, half * 0.15, 0, half * 0.55, '#7c3f1d'); b.box(2.2, 0.06, 1.2, half * 0.15, 0.8, half * 0.55, '#15803d'); solid(2.5, 1.5, half * 0.15, half * 0.55); }],
    [7, () => { for (const k of [0, 1]) { b.box(0.8, 1.8, 0.7, half - 0.5, 0, -half * 0.1 + k * 1.1, ['#7c3aed', '#db2777'][k]); b.box(0.05, 0.6, 0.5, half - 0.92, 1.0, -half * 0.1 + k * 1.1, '#22d3ee'); } solid(0.9, 2, half - 0.5, -half * 0.1 + 0.55); }],
    [9, () => { b.cyl(0.6, 0.5, 0, 0, -half * 0.45, '#e5e7eb', 8); b.sphere(0.55, 0, 1.1, -half * 0.45, '#facc15', 0); colliders.circles.push({ x: 0, z: -half * 0.45, r: 0.7 }); }],
    [11, () => { b.box(1.2, 0.5, 1.2, -half * 0.6, 0, -half * 0.5, '#facc15'); b.box(1.2, 1.6, 0.25, -half * 0.6, 0.5, -half * 0.5 - 0.5, '#facc15'); b.box(1, 0.1, 1, -half * 0.6, 0.5, -half * 0.5, '#b91c1c'); solid(1.3, 1.3, -half * 0.6, -half * 0.5); }],
  ];
  for (const [min, fn] of extras) if (houseIdx >= min) fn();

  // ---------- Play-Button-Wand (Ostwand) ----------
  const per = Math.min(5, Math.max(3, Math.floor((L - 2) / 1.3)));
  BUTTONS.forEach((btn, i) => {
    const row = Math.floor(i / per), col = i % per;
    const z = -((per - 1) * 1.15) / 2 + col * 1.15, y = 2.25 - row * 0.85;
    const got = S.buttons.includes(btn.id);
    const x = half - 0.08;
    if (got) {
      b.box(0.08, 0.66, 0.92, x, y - 0.33, z, '#1f2937');                     // Rahmen
      b.box(0.06, 0.56, 0.82, x - 0.03, y - 0.28, z, btn.color);               // Platte
      b.add(new THREE.ConeGeometry(0.2, 0.06, 5), '#ffffff', matrix(x - 0.08, y, z, 0, 0, Math.PI / 2)); // Stern-Emblem
    } else {
      b.box(0.04, 0.66, 0.92, x, y - 0.33, z, '#cbd5e1');                     // leerer Platz
    }
  });
  const wallSign = textSprite(['Kanalknöpfe', `${S.buttons.length} von ${BUTTONS.length}`], { scale: 2.6, bg: '#1f2937', accent: '#fde68a' });
  wallSign.position.set(half - 0.8, 3.1, 0);
  group.add(wallSign);

  // ---------- Tür nach draussen ----------
  // Tür als Fläche nach innen (wie die Wände), damit sie von draussen nicht die Sicht verdeckt
  walls.add(plane, '#6b4226', matrix(0, 1.15, half - 0.02, Math.PI, 0, 0, 1.4, 2.3, 1));
  walls.add(plane, '#facc15', matrix(-0.45, 1.15, half - 0.04, Math.PI, 0, 0, 0.12, 0.12, 1));
  triggers.push({ id: 'exit', kind: 'exit', x: 0, z: half - 1, r: 1.5 });
  const title = textSprite([h.name, `${h.size} m²`], { scale: 3, bg: '#ffffff', fg: '#1f2937', accent: '#e5384f' });
  title.position.set(0, 3.6, -half + 0.2);
  group.add(title);

  group.add(b.mesh(), walls.mesh(WALL_MAT, { cast: false, receive: true }));
  engine.scene.add(group);
  return {
    group, colliders, triggers, size: L,
    spawn: { x: 0, z: half - 1.6, yaw: 0 },
    bounds: { x: 0, z: 0, r: Math.SQRT2 * half - 0.4 },
    clamp(pos) { pos.x = Math.max(-half + 0.45, Math.min(half - 0.45, pos.x)); pos.z = Math.max(-half + 0.45, Math.min(half - 0.45, pos.z)); },
    dispose() { engine.scene.remove(group); group.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); }); },
  };
}

export { PARTS };
