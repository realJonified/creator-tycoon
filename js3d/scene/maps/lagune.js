// Map 2 "Wolkenlagune": Ringinsel um eine Lagune.
// Ebenen (Zonen): Boden (Ring), Wolkeninsel in 16 m Höhe (Sprungpad), Lagunengrund in 7 m Tiefe (Tauchsteg).
import * as THREE from '../../../vendor/three.module.min.js';
import { Builder, matrix, LAMBERT, textSprite } from '../build.js';
import { buildHouse, rotY } from '../world.js';
import { disposeObject } from '../dispose.js';

const C = { grass: '#86d16a', grass2: '#73c25a', sand: '#f6e2a8', sand2: '#eccf86', rock: '#8d99a6', water: '#3cc3d8', deep: '#1e88a8', wood: '#a0673f' };

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function buildLagune(engine, S, map) {
  const { details } = engine;
  const group = new THREE.Group();
  const LR = map.lagoonRadius, OR = map.walkRadius + 4;
  const SKY = map.zones.sky, UNDER = map.zones.under;
  const ground = { circles: [], boxes: [] }, skyCols = { circles: [], boxes: [] }, underCols = { circles: [], boxes: [] };
  const triggers = [], houseSigns = [];

  // ---------- Ringinsel ----------
  const g = new Builder();
  g.disc(LR, OR, 0, 0, 0, C.grass, 64);
  g.disc(LR, LR + 4, 0, 0.02, 0, C.sand, 64);
  g.disc(OR - 6, OR, 0, 0.02, 0, C.sand, 64);
  g.add(new THREE.CylinderGeometry(OR, OR + 3, 3, 64, 1, true), C.sand2, matrix(0, -1.5, 0));
  // Innenwand der Lagune: gespiegelt, damit die Fläche nach innen zeigt
  g.add(new THREE.CylinderGeometry(LR, LR, 7.4, 48, 1, true), C.rock, matrix(0, -3.7, 0, 0, 0, 0, -1, 1, 1));
  const r = rng(21);
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, d = LR + 8 + r() * 30; g.disc(0, 2.5 + r() * 3, Math.cos(a) * d, 0.01, Math.sin(a) * d, C.grass2, 9); }
  // Wege: Ringweg und Weg vom Portal zum Tauchsteg
  g.disc(LR + 9, LR + 12, 0, 0.03, 0, '#e7dcc6', 64);
  g.box(3, 0.04, map.portal.z - LR - 2, 0, 0.02, (map.portal.z + LR + 2) / 2, '#e7dcc6');
  group.add(g.mesh(LAMBERT, { cast: false, receive: true }));

  // ---------- Lagunengrund ----------
  const u = new Builder();
  u.disc(0, LR, 0, UNDER.y, 0, '#e9d9a6', 48);
  const ru = rng(5);
  for (let i = 0; i < 30; i++) {
    const a = ru() * Math.PI * 2, d = 4 + ru() * (LR - 6), x = Math.cos(a) * d, z = Math.sin(a) * d;
    // frei halten: Kuppel mit Tür, Weg von der Landestelle zur Kuppel
    if (Math.hypot(x, z + 8) < 11 || Math.abs(x) < 4 && z > -3) continue;
    if (i % 3 === 0) { u.cone(0.4, 2 + ru() * 2, x, UNDER.y, z, '#2f9e6a', 5); u.cone(0.3, 1.5 + ru(), x + 0.5, UNDER.y, z + 0.3, '#3fbf7f', 5); }
    else if (i % 3 === 1) u.sphere(0.5 + ru() * 0.8, x, UNDER.y + 0.4, z, ['#ff7f6e', '#f4a261', '#e76f9a'][i % 3], 0);
    else u.add(new THREE.DodecahedronGeometry(0.9 + ru(), 0), C.rock, matrix(x, UNDER.y + 0.3, z, i));
    if (i % 3 !== 0) underCols.circles.push({ x, z, r: 0.9 });
  }
  group.add(u.mesh());

  // Wasseroberflächen: Meer aussen, Lagune durchsichtig (Kuppel von oben sichtbar)
  const sea = new THREE.Mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshLambertMaterial({ color: C.water }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.35;
  group.add(sea);
  const lagoonMat = new THREE.MeshLambertMaterial({ color: '#4fd1e0', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const lagoon = new THREE.Mesh(new THREE.CircleGeometry(LR, 48), lagoonMat);
  lagoon.rotation.x = -Math.PI / 2; lagoon.position.y = -0.3; lagoon.renderOrder = 2;
  group.add(lagoon);

  // Blasen (Partikel), steigen in der Lagune auf
  const N = 140, pos = new Float32Array(N * 3), speed = new Float32Array(N);
  const rb = rng(8);
  for (let i = 0; i < N; i++) { const a = rb() * Math.PI * 2, d = rb() * (LR - 2); pos[i * 3] = Math.cos(a) * d; pos[i * 3 + 1] = UNDER.y + rb() * 7; pos[i * 3 + 2] = Math.sin(a) * d; speed[i] = 0.6 + rb() * 1.2; }
  const bubbleGeo = new THREE.BufferGeometry(); bubbleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // Runde Blase als kleine, per Code erzeugte Textur (16 × 16 Pixel, Ring mit hellem Punkt)
  const T = 16, px = new Uint8Array(T * T * 4);
  for (let yy = 0; yy < T; yy++) for (let xx = 0; xx < T; xx++) {
    const d = Math.hypot(xx - 7.5, yy - 7.5) / 7.5, i4 = (yy * T + xx) * 4;
    const ring = d > 1 ? 0 : d > 0.7 ? 1 : 0.25 + (Math.hypot(xx - 5, yy - 5) < 2 ? 0.75 : 0);
    px[i4] = px[i4 + 1] = px[i4 + 2] = 255; px[i4 + 3] = Math.round(ring * 255);
  }
  const bubbleTex = new THREE.DataTexture(px, T, T); bubbleTex.needsUpdate = true;
  const bubbles = new THREE.Points(bubbleGeo, new THREE.PointsMaterial({ color: '#e0fbff', size: 0.35, map: bubbleTex, transparent: true, opacity: 0.9, depthWrite: false, alphaTest: 0.05 }));
  group.add(bubbles);

  // ---------- Statische Bauten ----------
  const p = new Builder();
  // Portal im Süden
  for (const sx of [-1, 1]) { p.box(0.9, 4.6, 0.9, sx * 2.9, 0, map.portal.z, '#4c4f6b'); p.box(1.2, 0.4, 1.2, sx * 2.9, 4.6, map.portal.z, '#facc15'); ground.circles.push({ x: sx * 2.9, z: map.portal.z, r: 0.75 }); }
  p.add(new THREE.TorusGeometry(2.9, 0.4, 8, 24, Math.PI), '#4c4f6b', matrix(0, 4.6, map.portal.z));
  p.cyl(4, 0.3, 0, 0, map.portal.z, '#9ca3af', 20);
  // Tauchsteg in die Lagune
  p.box(3, 0.25, 7, 0, 0.05, LR + 0.5, C.wood);
  for (const sx of [-1.4, 1.4]) p.box(0.15, 1, 7, sx, 0.3, LR + 0.5, '#7a4b2a');
  p.box(1.2, 1.6, 0.1, 0, 0.3, LR - 2.9, '#facc15');
  // Sprungpad unten
  const pad = { x: 26, z: -26 };
  p.cyl(1.6, 0.3, pad.x, 0, pad.z, '#334155', 16); p.cyl(1.2, 0.35, pad.x, 0.05, pad.z, '#22d3ee', 16);
  // Boote, Bojen, Sonnenschirme
  for (const [x, z, c] of [[-10, -12, '#e5384f'], [12, 6, '#facc15'], [-6, 15, '#ffffff']]) { p.add(new THREE.SphereGeometry(0.7, 8, 6), c, matrix(x, -0.25, z)); p.cyl(0.08, 1.4, x, 0.2, z, '#334155', 5); }
  for (const [x, z, a] of [[-92, 20, 0.4], [80, -50, 2], [20, 95, 1.2]]) { p.box(2.4, 0.8, 6, x, -0.4, z, '#f8fafc', a); p.cyl(0.1, 5, x, 0.4, z, '#7a4b2a', 5); p.add(new THREE.ConeGeometry(1.8, 4, 3), '#fef3c7', matrix(x + Math.sin(a) * 0.6, 3, z + Math.cos(a) * 0.6, a, 0, 0, 0.2, 1, 1)); }
  for (const [x, z, c] of [[-30, 50, '#ff7f6e'], [30, 52, '#2a9d8f'], [-60, -22, '#e9c46a']]) { p.cyl(0.08, 2.4, x, 0, z, '#f5f5f4', 5); p.cone(1.8, 0.7, x, 2.3, z, c, 8); }

  // ---------- Häuser ----------
  const zoneY = z => (z === 'sky' ? SKY.y : z === 'under' ? UNDER.y : 0);
  const skyB = new Builder(), underB = new Builder();
  map.houses.forEach((h, i) => {
    const zone = h.zone || 'ground';
    const into = zone === 'sky' ? skyB : zone === 'under' ? underB : p;
    // Auf der Wolkeninsel ist wenig Platz: dort ein kleineres Modell
    const size = buildHouse(into, h, zone === 'sky' ? 1 : Math.min(8, 3 + i), h.x, h.z, h.rot);
    const cols = zone === 'sky' ? skyCols : zone === 'under' ? underCols : ground;
    if (h.kind === 'kuppel') cols.circles.push({ x: h.x, z: h.z, r: 6.2 });
    else cols.boxes.push({ x: h.x, z: h.z, hw: size.w / 2 + 0.3, hd: size.d / 2 + 0.3, rot: h.rot });
    const door = rotY(0, size.d / 2 + 2.2, h.rot), top = rotY(0, size.d / 2 + 3.6, h.rot);
    const sign = textSprite(['', ''], { scale: 4.4 });
    sign.position.set(h.x + top.x, zoneY(zone) + 3.3, h.z + top.z);
    group.add(sign);
    houseSigns.push({ house: h, sign });
    triggers.push({ id: 'haus:' + h.id, kind: 'house', house: h, zone, x: h.x + door.x, z: h.z + door.z, r: 2.6 });
  });

  // Wolkeninsel: schwebender Fels mit Gras, Wasserfall, Bäumen, Ballons
  skyB.disc(0, SKY.r + 1, SKY.x, 0.02, SKY.z, C.grass, 28);
  skyB.add(new THREE.ConeGeometry(SKY.r + 1, 9, 9), C.rock, matrix(SKY.x, -4.5, SKY.z, 0, Math.PI, 0));
  skyB.add(new THREE.CylinderGeometry(SKY.r + 1, SKY.r + 1, 0.6, 28), '#6b8f4a', matrix(SKY.x, -0.3, SKY.z));
  skyB.box(1.2, 10, 0.4, SKY.x - SKY.r - 0.6, -10, SKY.z + 2, '#bae6fd');
  for (const [dx, dz] of [[-10, 2], [-3, -10], [2, 10]]) { skyB.cyl(0.25, 1.6, SKY.x + dx, 0, SKY.z + dz, '#8b5a34', 6); skyB.sphere(1.3, SKY.x + dx, 2.4, SKY.z + dz, '#4ca146', 0); skyCols.circles.push({ x: SKY.x + dx, z: SKY.z + dz, r: 0.6 }); }
  const padTop = { x: SKY.x - 6, z: SKY.z + 6 };
  skyB.cyl(1.4, 0.25, padTop.x, 0, padTop.z, '#334155', 16); skyB.cyl(1.0, 0.3, padTop.x, 0.04, padTop.z, '#f472b6', 16);
  for (const [dx, dz, c] of [[10, -2, '#ef4444'], [9, 6, '#facc15'], [-10, -5, '#3b82f6']]) { skyB.cyl(0.03, 5, SKY.x + dx, 0, SKY.z + dz, '#e5e7eb', 4); skyB.sphere(0.9, SKY.x + dx, 5.6, SKY.z + dz, c, 1); }
  const skyMesh = skyB.mesh(); skyMesh.position.y = SKY.y; skyMesh.updateMatrix();
  const underMesh = underB.mesh(); underMesh.position.y = UNDER.y; underMesh.updateMatrix();
  group.add(p.mesh(), skyMesh, underMesh);

  // ---------- Palmen und Steine (Instanzen) ----------
  const palms = [], rp = rng(13);
  for (let n = 0; palms.length < 34 && n < 3000; n++) {
    const a = rp() * Math.PI * 2, d = LR + 5 + rp() * (OR - LR - 8), x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (map.houses.some(h => !h.zone && Math.hypot(x - h.x, z - h.z) < 11) || Math.hypot(x, z - map.portal.z) < 8 || Math.abs(x) < 3 && z > LR || Math.hypot(x - pad.x, z - pad.z) < 4 || palms.some(q => Math.hypot(q.x - x, q.z - z) < 4.5)) continue;
    palms.push({ x, z, s: 0.9 + rp() * 0.4, lean: (rp() - 0.5) * 0.4 });
  }
  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, place, cast = true) => {
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => { place(dummy, t); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.castShadow = cast; m.instanceMatrix.needsUpdate = true;
    return m;
  };
  const leaves = new Builder();
  for (let i = 0; i < 6; i++) leaves.add(new THREE.ConeGeometry(0.5, 3, 4), '#ffffff', matrix(Math.cos(i) * 1.2, 5, Math.sin(i) * 1.2, -i, 0, Math.PI / 2.3, 1, 1, 0.3));
  const leafGeo = leaves.geometry(); leafGeo.deleteAttribute('color');
  group.add(inst(new THREE.CylinderGeometry(0.16, 0.28, 5, 6).translate(0, 2.5, 0), new THREE.MeshLambertMaterial({ color: '#8b5a34', flatShading: true }), palms, (o, q) => { o.position.set(q.x, 0, q.z); o.scale.setScalar(q.s); o.rotation.set(q.lean, 0, q.lean); }));
  group.add(inst(leafGeo, new THREE.MeshLambertMaterial({ color: '#35a14a', flatShading: true }), palms, (o, q) => { o.position.set(q.x + q.lean * 2.5 * q.s, 0, q.z - q.lean * 2.5 * q.s); o.scale.setScalar(q.s); o.rotation.set(0, q.x, 0); }));
  for (const q of palms) ground.circles.push({ x: q.x, z: q.z, r: 0.45 });
  const rocks = [];
  for (let i = 0; i < 40; i++) { const a = rp() * Math.PI * 2; rocks.push({ x: Math.cos(a) * (OR + 1 + rp() * 3), z: Math.sin(a) * (OR + 1 + rp() * 3), s: 0.8 + rp() * 1.5, r: rp() * 6 }); }
  group.add(inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#9aa0a6', flatShading: true }), rocks, (o, k) => { o.position.set(k.x, -0.2, k.z); o.scale.set(k.s, k.s * 0.7, k.s); o.rotation.set(k.r, k.r, 0); }));

  // Wolken (Detail ab "Mittel")
  const cl = new Builder(), rc = rng(17);
  for (let i = 0; i < 10; i++) { const a = rc() * Math.PI * 2, d = 50 + rc() * 110, x = Math.cos(a) * d, z = Math.sin(a) * d, y = 30 + rc() * 16; for (let k = 0; k < 4; k++) cl.sphere(3 + rc() * 3, x + k * 3.4 - 5, y + rc(), z + rc() * 2, '#ffffff', 1); }
  const clouds = new THREE.Mesh(cl.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#dfe9f5', emissiveIntensity: 0.35 }));
  group.add(clouds); details.push(clouds);

  // ---------- Portal, Schilder ----------
  const portalDisc = new THREE.Mesh(new THREE.CircleGeometry(2.55, 32), new THREE.MeshBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  portalDisc.position.set(0, 2.75, map.portal.z);
  group.add(portalDisc);
  const mk = (lines, x, y, z, opt) => { const s = textSprite(lines, opt); s.position.set(x, y, z); group.add(s); return s; };
  mk(['WELTKARTE', 'Portal'], 0, 7, map.portal.z, { scale: 4.4, bg: '#312e81', accent: '#c4b5fd' });
  mk(['🤿 Tauchsteg', 'zur Tiefseekuppel'], 2.6, 3, LR + 3, { scale: 3.4, bg: '#0e7490', accent: '#a5f3fc' });
  mk(['🚀 Sprungpad', 'zur Wolkeninsel'], pad.x, 3, pad.z, { scale: 3.4, bg: '#be185d', accent: '#fbcfe8' });

  // ---------- Auslöser ----------
  triggers.push({ id: 'portal', kind: 'portal', zone: 'ground', x: 0, z: map.portal.z - 2.2, r: 3 });
  triggers.push({ id: 'pad-hoch', kind: 'pad', zone: 'ground', x: pad.x, z: pad.z, r: 2, to: { x: padTop.x + 2, z: padTop.z - 2, zone: 'sky' } });
  triggers.push({ id: 'pad-runter', kind: 'pad', zone: 'sky', x: padTop.x, z: padTop.z, r: 1.8, to: { x: pad.x - 3, z: pad.z + 3, zone: 'ground' } });
  triggers.push({ id: 'tauchen', kind: 'dive', zone: 'ground', x: 0, z: LR + 1.2, r: 2.4, to: { x: 0, z: 14, zone: 'under' } });
  triggers.push({ id: 'auftauchen', kind: 'surface', zone: 'under', x: 0, z: 18, r: 2.4, to: { x: 0, z: LR + 3, zone: 'ground' } });
  const surfaceRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 24), new THREE.MeshBasicMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  surfaceRing.rotation.x = -Math.PI / 2; surfaceRing.position.set(0, UNDER.y + 0.05, 18);
  group.add(surfaceRing);
  ground.boxes.push({ x: 0, z: map.portal.z, hw: 2.1, hd: 0.25, rot: 0 });

  engine.scene.add(group);
  return {
    group, triggers, houseSigns,
    colliders: ground, // für die Kamera-Kollision am Boden
    zones: {
      ground: { y: 0, bounds: { x: 0, z: 0, r: map.walkRadius, inner: LR + 0.6 }, colliders: ground },
      sky: { y: SKY.y, bounds: { x: SKY.x, z: SKY.z, r: SKY.r - 0.5 }, colliders: skyCols },
      under: { y: UNDER.y, bounds: { x: UNDER.x, z: UNDER.z, r: UNDER.r }, colliders: underCols, underwater: true },
    },
    update(t, dt = 1 / 60) {
      clouds.rotation.y = t * 0.004;
      portalDisc.rotation.z = t;
      lagoonMat.opacity = 0.5 + Math.sin(t * 0.8) * 0.05;
      surfaceRing.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      const a = bubbleGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        a[i * 3 + 1] += speed[i] * dt;
        a[i * 3] += Math.sin(t * 2 + i) * 0.004;
        if (a[i * 3 + 1] > -0.4) a[i * 3 + 1] = UNDER.y;
      }
      bubbleGeo.attributes.position.needsUpdate = true;
    },
    dispose() { const i = details.indexOf(clouds); if (i >= 0) details.splice(i, 1); return disposeObject(group); },
  };
}
