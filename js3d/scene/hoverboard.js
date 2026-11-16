// Hoverboard-Modell und Spur. Alles aus einfachen Formen und Partikeln, keine fremden Designs.
// Pro Board-Art wird genau ein Modell gebaut und wiederverwendet (zwei zusammengefügte Meshes: Deck und Leuchtteile,
// dazu der Lichtschein am Boden und bei Legendär ein schwebender Ring).
// Je seltener, desto mehr Schmuck: Selten = Mittelstreifen und Flossen, Episch = Seitenleuchten, Legendär = Ring und Pulsieren.
// Die Spur ist EIN Partikelsystem mit fester Obergrenze (W.trailMax) für alle Boards. Bei Grafik Niedrig ist sie aus.
// Board und Spur hängen an der Szene (nicht an der Map) und überstehen deshalb jeden Map-Wechsel.
import * as THREE from '../../vendor/three.module.min.js';
import { W } from '../data/balance.js';
import { Builder, matrix } from './build.js';

export const DECK_TOP = 0.07; // Oberkante des Decks über seiner Mitte
const RANK = { gewoehnlich: 0, selten: 1, episch: 2, legendaer: 3 };

function buildModel(board) {
  const rank = RANK[board.rarity] ?? 0;
  const g = new THREE.Group();
  const glow2 = board.glow2 || board.glow;
  // Deck (matt): flach gedrückte, hingelegte Kapsel, Griffband, bei Selten und besser zwei Heckflossen
  const deck = new Builder()
    .add(new THREE.CapsuleGeometry(0.34, 1.0, 3, 12), board.deck, matrix(0, 0, 0, 0, Math.PI / 2, 0, 1, 1, 0.2))
    .box(0.5, 0.012, 1.2, 0, DECK_TOP - 0.006, 0, '#1f2937');
  if (rank >= 1) for (const s of [-1, 1]) deck.box(0.04, 0.16, 0.3, s * 0.22, -0.02, -0.62, board.deck, 0, 0, s * 0.35);
  const deckMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  deckMat.userData.noDetail = true;
  const deckMesh = deck.mesh(deckMat, { cast: true, receive: false });
  g.add(deckMesh);
  // Leuchtteile (unbeleuchtet, leuchten auch im Schatten): Rand, Schwebepolster, Streifen
  const glow = new Builder()
    .add(new THREE.CapsuleGeometry(0.37, 1.0, 3, 12), board.glow, matrix(0, -0.03, 0, 0, Math.PI / 2, 0, 1, 1, 0.06));
  const pad = new THREE.CylinderGeometry(rank >= 2 ? 0.2 : 0.17, rank >= 2 ? 0.23 : 0.2, 0.07, 12);
  for (const z of [-0.5, 0.5]) glow.add(pad, board.glow, matrix(0, -0.08, z));
  if (rank >= 1) glow.box(0.07, 0.014, 1.0, 0, DECK_TOP, 0, glow2);                       // Mittelstreifen
  if (rank >= 2) for (const s of [-1, 1]) glow.box(0.03, 0.03, 0.9, s * 0.33, 0.0, 0, glow2); // Seitenleuchten
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const glowMesh = glow.mesh(glowMat, { cast: false, receive: false });
  g.add(glowMesh);
  // Lichtschein am Boden (wird beim Schweben auf Bodenhöhe gehalten)
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({
    color: board.glow, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.rotation.x = -Math.PI / 2; halo.scale.set(0.7 + rank * 0.08, 1.25 + rank * 0.1, 1);
  g.add(halo);
  // Legendär: schwebender Ring um das Deck
  let ring = null;
  if (rank >= 3) {
    ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 40), new THREE.MeshBasicMaterial({ color: glow2 }));
    ring.rotation.x = Math.PI / 2; ring.scale.set(0.85, 1.35, 1);
    g.add(ring);
  }
  g.userData = { halo, ring, glowMat, rank, haloBase: 0.22 + rank * 0.05 };
  return g;
}

// Weiches, rundes Leuchtteilchen als kleine, per Code erzeugte Textur
function dotTexture() {
  const T = 16, px = new Uint8Array(T * T * 4);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const d = Math.min(1, Math.hypot(x - 7.5, y - 7.5) / 7.5), i = (y * T + x) * 4;
    px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = Math.round((d < 0.4 ? 1 : Math.pow((1 - d) / 0.6, 1.3)) * 255); // heller Kern, weicher Rand
  }
  const t = new THREE.DataTexture(px, T, T); t.needsUpdate = true;
  return t;
}

// Spurarten: rate = Teilchen pro Sekunde bei voller Fahrt, life = Lebensdauer, size = Grösse, up/spread = Streuung
const TRAILS = {
  glow:   { rate: 40, life: 0.7,  size: 0.75, spread: 0.06, up: 0.1, gravity: 0 },
  sparks: { rate: 90, life: 0.55, size: 0.42, spread: 1.6,  up: 1.4, gravity: -6 },
  stars:  { rate: 100, life: 0.8, size: 0.48, spread: 1.2,  up: 1.8, gravity: -3, twinkle: true },
};

function createTrail(scene) {
  const N = W.trailMax;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 4); // Farbe mit Deckkraft (RGBA)
  const vel = new Float32Array(N * 3), age = new Float32Array(N).fill(1), life = new Float32Array(N).fill(1);
  const base = new Float32Array(N * 3); // Grundfarbe; mit dem Alter sinkt die Deckkraft
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.PointsMaterial({ size: 0.3, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false });
  // Normale Mischung statt additiv: so sind die Teilchen auch vor hellem Gras und Sand gut zu sehen
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // Teilchen liegen in Weltkoordinaten, die Hülle ändert sich ständig
  points.visible = false;
  scene.add(points);
  let next = 0, carry = 0, alive = 0;
  const c1 = new THREE.Color(), c2 = new THREE.Color();
  return {
    points,
    get alive() { return alive; },
    clear() { age.fill(1); life.fill(1); col.fill(0); alive = 0; points.visible = false; geo.attributes.color.needsUpdate = true; },
    // spawn = { x, y, z, hx, hz (Fahrtrichtung), amount 0..1, board } oder null
    update(dt, spawn) {
      const kind = spawn && TRAILS[spawn.board.trail];
      if (kind) {
        mat.size = kind.size;
        c1.set(spawn.board.glow); c2.set(spawn.board.glow2 || spawn.board.glow);
        carry += kind.rate * spawn.amount * dt;
        while (carry >= 1) {
          carry -= 1;
          const i = next; next = (next + 1) % N;
          const side = (Math.random() - 0.5) * 0.5;
          pos[i * 3] = spawn.x - spawn.hx * 0.75 + spawn.hz * side;
          pos[i * 3 + 1] = spawn.y + (Math.random() - 0.3) * 0.12;
          pos[i * 3 + 2] = spawn.z - spawn.hz * 0.75 - spawn.hx * side;
          vel[i * 3] = -spawn.hx * 1.5 + (Math.random() - 0.5) * kind.spread;
          vel[i * 3 + 1] = Math.random() * kind.up;
          vel[i * 3 + 2] = -spawn.hz * 1.5 + (Math.random() - 0.5) * kind.spread;
          const c = Math.random() < 0.5 ? c1 : c2;
          base[i * 3] = c.r; base[i * 3 + 1] = c.g; base[i * 3 + 2] = c.b;
          age[i] = 0; life[i] = kind.life * (0.7 + Math.random() * 0.6);
        }
      } else carry = 0;
      const grav = kind?.gravity ?? -3, twinkle = !!kind?.twinkle;
      alive = 0;
      for (let i = 0; i < N; i++) {
        if (age[i] >= life[i]) { col[i * 4 + 3] = 0; continue; }
        alive++;
        age[i] += dt;
        vel[i * 3 + 1] += grav * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        let k = Math.max(0, 1 - age[i] / life[i]);
        if (twinkle) k *= 0.6 + 0.4 * Math.sin(age[i] * 40 + i);
        col[i * 4] = base[i * 3]; col[i * 4 + 1] = base[i * 3 + 1]; col[i * 4 + 2] = base[i * 3 + 2]; col[i * 4 + 3] = k;
      }
      points.visible = alive > 0;
      if (alive > 0 || kind) { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; }
    },
  };
}

export function createHoverboard(scene) {
  const root = new THREE.Group();
  root.rotation.order = 'YXZ'; // erst Richtung, dann Neigung um die Längsachse
  root.visible = false;
  scene.add(root);
  const trail = createTrail(scene);
  const models = new Map();
  let current = null, board = null, state = 'off', timer = 0, scale = 0, bob = 0;

  // Gibt true zurück, wenn das Modell neu gebaut wurde
  function show(b) {
    let built = false;
    let m = models.get(b.id);
    if (!m) { m = buildModel(b); models.set(b.id, m); root.add(m); built = true; }
    if (current && current !== m) current.visible = false;
    current = m; m.visible = true; board = b;
    return built;
  }

  return {
    root, trail,
    get state() { return state; },
    get modelCount() { return models.size; },
    // Aufsteigen: Board erscheint unter der Figur (wächst kurz auf)
    mount(b) { const built = show(b); state = 'ride'; root.visible = true; if (scale > 0.99) scale = 0.6; return built; },
    // Anderes Board ausgerüstet, während man fährt
    swap(b) { if (state !== 'off' && b && b !== board) return show(b); return false; },
    // Absteigen: Board bleibt kurz an der Stelle schweben und verschwindet dann
    park() { if (state === 'ride') { state = 'park'; timer = W.board.parkSeconds; } },
    // Sofort weg (Haus betreten, Arena, Map-Wechsel)
    hide() { state = 'off'; root.visible = false; scale = 0; trail.clear(); },
    // x, z, groundY = Boden unter dem Board, heading, lean (rad), speed01 = Tempo 0..1, trailOn = Spur erlaubt (nicht bei Niedrig)
    update(dt, x, z, groundY, heading, lean, speed01 = 0, trailOn = true) {
      if (state === 'off') { if (trail.alive) trail.update(dt, null); return; }
      if (state === 'park') {
        timer -= dt;
        if (timer <= 0) { scale -= dt * 4; if (scale <= 0) { this.hide(); return; } }
      } else scale = Math.min(1, scale + dt * 5);
      bob += dt;
      const hover = W.board.hover + Math.sin(bob * 3) * 0.03;
      if (state === 'ride') root.position.set(x, groundY + hover, z);
      else root.position.y = groundY + hover;
      if (state === 'ride') { root.rotation.y = heading; root.rotation.z = -lean; }
      else root.rotation.z *= Math.max(0, 1 - dt * 4);
      root.scale.setScalar(Math.max(0.001, scale));
      const u = current.userData;
      u.halo.position.y = -hover + 0.03;
      u.halo.material.opacity = u.haloBase + Math.sin(bob * 6) * 0.06;
      if (u.ring) { u.ring.rotation.z += dt * 1.5; u.ring.position.y = 0.05 + Math.sin(bob * 2.2) * 0.05; }
      if (u.rank >= 3) u.glowMat.color.setScalar(1 + Math.sin(bob * 4) * 0.25); // Legendär pulsiert
      // Spur: nur beim Fahren, stärker bei mehr Tempo
      const p = root.position, h = root.rotation.y;
      const ride = state === 'ride' && trailOn && speed01 > 0.15;
      trail.update(dt, ride ? { x: p.x, y: p.y - 0.05, z: p.z, hx: Math.sin(h), hz: Math.cos(h), amount: Math.min(1, speed01 * 1.2), board } : null);
    },
    // Höhe der Deck-Oberkante über dem Boden (dort stehen die Füsse)
    standHeight() { return W.board.hover + DECK_TOP + Math.sin(bob * 3) * 0.03; },
  };
}
