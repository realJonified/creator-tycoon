// Hoverboard-Modell: flaches, abgerundetes Deck, Leuchtstreifen, zwei Schwebepolster und ein Lichtschein am Boden.
// Alles aus einfachen Formen. Pro Board-Art wird genau ein Modell gebaut und wiederverwendet.
// Das Board hängt direkt an der Szene (nicht an der Map) und überlebt deshalb jeden Map-Wechsel.
import * as THREE from '../../vendor/three.module.min.js';
import { W } from '../data/balance.js';

export const DECK_TOP = 0.07; // Oberkante des Decks über seiner Mitte

function buildModel(board) {
  const g = new THREE.Group();
  const deckMat = new THREE.MeshLambertMaterial({ color: board.deck });
  deckMat.userData.noDetail = true;
  // Deck: Kapsel, flach gedrückt und hingelegt (Länge entlang z = Fahrtrichtung)
  const deck = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.0, 4, 16), deckMat);
  deck.rotation.x = Math.PI / 2; deck.scale.set(1, 1, 0.2);
  deck.castShadow = true;
  g.add(deck);
  const glowMat = new THREE.MeshBasicMaterial({ color: board.glow });
  // Leuchtstreifen rundherum (etwas grösser, knapp unter dem Deck) und Griffband oben
  const rim = new THREE.Mesh(new THREE.CapsuleGeometry(0.37, 1.0, 4, 16), glowMat);
  rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1, 0.06); rim.position.y = -0.03;
  g.add(rim);
  const tapeMat = new THREE.MeshLambertMaterial({ color: '#1f2937' });
  tapeMat.userData.noDetail = true;
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 1.2), tapeMat);
  tape.position.y = DECK_TOP;
  g.add(tape);
  // Schwebepolster vorne und hinten
  const padGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.07, 16);
  for (const z of [-0.5, 0.5]) {
    const pad = new THREE.Mesh(padGeo, glowMat);
    pad.position.set(0, -0.08, z);
    g.add(pad);
  }
  // Lichtschein am Boden (liegt auf Bodenhöhe, Position wird beim Schweben ausgeglichen)
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({
    color: board.glow, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.rotation.x = -Math.PI / 2; halo.scale.set(0.7, 1.25, 1);
  g.add(halo);
  g.userData.halo = halo;
  return g;
}

export function createHoverboard(scene) {
  const root = new THREE.Group();
  root.rotation.order = 'YXZ'; // erst Richtung, dann Neigung um die Längsachse
  root.visible = false;
  scene.add(root);
  const models = new Map();
  let current = null, state = 'off', timer = 0, scale = 0, bob = 0;

  // Gibt true zurück, wenn das Modell neu gebaut wurde
  function show(board) {
    let built = false;
    let m = models.get(board.id);
    if (!m) { m = buildModel(board); models.set(board.id, m); root.add(m); built = true; }
    if (current && current !== m) current.visible = false;
    current = m; m.visible = true;
    return built;
  }

  return {
    root,
    get state() { return state; },
    // Aufsteigen: Board erscheint unter der Figur (wächst kurz auf)
    mount(board) { const built = show(board); state = 'ride'; root.visible = true; if (scale > 0.99) scale = 0.6; return built; },
    // Absteigen: Board bleibt kurz an der Stelle schweben und verschwindet dann
    park() { if (state === 'ride') { state = 'park'; timer = W.board.parkSeconds; } },
    // Sofort weg (Haus betreten, Arena, Map-Wechsel)
    hide() { state = 'off'; root.visible = false; scale = 0; },
    // x, z, groundY = Boden unter dem Board, heading, lean (rad)
    update(dt, x, z, groundY, heading, lean) {
      if (state === 'off') return;
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
      const halo = current?.userData.halo;
      if (halo) { halo.position.y = -hover + 0.03; halo.material.opacity = 0.25 + Math.sin(bob * 6) * 0.06; }
    },
    // Höhe der Deck-Oberkante über dem Boden (dort stehen die Füsse)
    standHeight() { return W.board.hover + DECK_TOP + Math.sin(bob * 3) * 0.03; },
  };
}
