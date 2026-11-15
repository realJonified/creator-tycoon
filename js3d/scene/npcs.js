// NPC-YouTuber zeichnen. Leistung:
// - Alle NPCs einer Map teilen sich 8 InstancedMeshes (ein Draw-Call pro Körperteil, egal wie viele NPCs).
// - Namensschilder: EIN Canvas als Atlas (eine Zeile pro NPC); jedes Schild ist ein Ausschnitt davon.
// - NPCs ausserhalb der Sichtweite werden ausgeblendet und pausieren.
import * as THREE from '../../vendor/three.module.min.js';
import { textSprite } from './build.js';
import { disposeObject } from './dispose.js';
import { createNpc, stepNpc, talkTo, npcSubs } from '../core/npc.js';
import { fmt } from '../../js/core/format.js';

// Körperteile: Grösse, Gelenk (relativ zur Figur), Mitte des Quaders relativ zum Gelenk, Farbe, Schwung
const PARTS = [
  { size: [0.24, 0.8, 0.26], joint: [-0.15, 0.8, 0], off: [0, -0.4, 0], color: 'pants', swing: 1 },
  { size: [0.24, 0.8, 0.26], joint: [0.15, 0.8, 0], off: [0, -0.4, 0], color: 'pants', swing: -1 },
  { size: [0.62, 0.72, 0.36], joint: [0, 0.8, 0], off: [0, 0.36, 0], color: 'shirt', swing: 0 },
  { size: [0.18, 0.66, 0.22], joint: [-0.41, 1.48, 0], off: [0, -0.3, 0], color: 'shirt', swing: -0.9 },
  { size: [0.18, 0.66, 0.22], joint: [0.41, 1.48, 0], off: [0, -0.3, 0], color: 'shirt', swing: 0.9, wave: true },
  { size: [0.52, 0.5, 0.48], joint: [0, 1.52, 0], off: [0, 0.26, 0], color: 'skin', swing: 0 },
  { size: [0.56, 0.16, 0.52], joint: [0, 1.52, 0], off: [0, 0.54, -0.01], color: 'hair', swing: 0 },
  { size: [0.34, 0.08, 0.04], joint: [0, 1.52, 0], off: [0, 0.3, 0.25], color: 'eyes', swing: 0 },
];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const ROW = 64, W = 512;

// parent = Gruppe der Map (dann verschwinden die NPCs mit der Map, z. B. im Haus oder in der Arena)
export function createNpcs(engine, map, getHours, parent = engine.scene) {
  const defs = map.npcPaths || [];
  const group = new THREE.Group();
  const npcs = defs.map((d, i) => createNpc(d, i * 3.3));
  const count = Math.max(1, npcs.length);

  // ---------- Körper (Instanzen) ----------
  const box = new THREE.BoxGeometry(1, 1, 1);
  const meshes = PARTS.map(() => {
    const m = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: '#ffffff' }), count);
    m.castShadow = true; m.frustumCulled = false;
    group.add(m);
    return m;
  });
  const color = new THREE.Color();
  npcs.forEach((n, i) => {
    const pal = { shirt: n.def.shirt, hair: n.def.hair, pants: '#334155', skin: SKINS[i % SKINS.length], eyes: '#111827' };
    PARTS.forEach((p, k) => meshes[k].setColorAt(i, color.set(pal[p.color])));
  });
  meshes.forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });

  // ---------- Namensschilder (ein Atlas) ----------
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = ROW * count;
  const atlas = new THREE.CanvasTexture(canvas);
  atlas.colorSpace = THREE.SRGBColorSpace;
  const labels = npcs.map((n, i) => {
    const t = atlas.clone();                      // teilt sich das Bild (eine GPU-Textur) mit dem Atlas
    t.repeat.set(1, 1 / count); t.offset.set(0, 1 - (i + 1) / count);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }));
    s.scale.set(3.4, 3.4 * ROW / W, 1);
    group.add(s);
    return s;
  });
  let lastHours = -1;
  function drawAtlas(hours) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, ROW * count);
    npcs.forEach((n, i) => {
      const y = i * ROW;
      ctx.fillStyle = 'rgba(17,24,39,0.82)';
      ctx.beginPath(); ctx.roundRect?.(40, y + 4, W - 80, ROW - 8, 24); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff'; ctx.font = '700 27px system-ui, "Segoe UI", sans-serif';
      ctx.fillText(n.def.name, W / 2, y + 22);
      ctx.fillStyle = '#fde68a'; ctx.font = '700 22px system-ui, "Segoe UI", sans-serif';
      ctx.fillText(`👥 ${fmt(npcSubs(n.def, hours))} Abos`, W / 2, y + 47);
    });
    for (const l of labels) l.material.map.needsUpdate = true;
  }

  // ---------- Sprechblase (nur eine, weil man nur mit einem NPC redet) ----------
  const bubble = textSprite(['', ''], { width: 768, height: 230, scale: 4, bg: '#ffffff', fg: '#111827', accent: '#111827' });
  bubble.visible = false;
  group.add(bubble);
  let talking = null;

  parent.add(group);

  const tmp = new THREE.Matrix4(), root = new THREE.Matrix4(), joint = new THREE.Matrix4(), rot = new THREE.Matrix4(), part = new THREE.Matrix4();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const view = () => Math.min(70, engine.camera.far * 0.45);

  return {
    group,
    npcs,
    // Logik: nur NPCs in Sichtweite bewegen sich (die anderen pausieren).
    step(dt, player) {
      const far = view();
      for (const n of npcs) {
        n.near = Math.hypot(n.x - player.x, n.z - player.z);
        if (n.near < far || n.talk > 0) stepNpc(n, dt);
      }
      if (talking && talking.talk <= 0) { talking = null; bubble.visible = false; }
    },
    // Zeichnen: Matrizen der sichtbaren NPCs setzen, Schilder positionieren.
    render() {
      const hours = getHours();
      if (Math.floor(hours * 360) !== lastHours) { lastHours = Math.floor(hours * 360); drawAtlas(hours); } // alle 10 s Spielzeit neu
      const far = view();
      npcs.forEach((n, i) => {
        const visible = (n.near ?? 0) < far;
        labels[i].visible = visible && n.near < 32;
        if (!visible) { for (const m of meshes) m.setMatrixAt(i, ZERO); return; }
        const swing = n.walking ? Math.sin(n.phase * (3 + n.def.speed * 2)) * 0.6 : 0;
        const bob = n.walking ? Math.abs(Math.sin(n.phase * (3 + n.def.speed * 2))) * 0.05 : 0;
        root.makeRotationY(n.heading).setPosition(n.x, bob, n.z);
        PARTS.forEach((p, k) => {
          let angle = swing * p.swing;
          if (p.wave && n.talk > 0) angle = Math.PI - 0.3 + Math.sin(n.phase * 12) * 0.3; // Winken
          joint.makeTranslation(p.joint[0], p.joint[1], p.joint[2]);
          rot.makeRotationX(angle);
          part.makeTranslation(p.off[0], p.off[1], p.off[2]).multiply(tmp.makeScale(p.size[0], p.size[1], p.size[2]));
          meshes[k].setMatrixAt(i, tmp.copy(root).multiply(joint).multiply(rot).multiply(part));
        });
        labels[i].position.set(n.x, 2.75, n.z);
      });
      for (const m of meshes) m.instanceMatrix.needsUpdate = true;
      if (talking) bubble.position.set(talking.x, 3.45, talking.z);
    },
    // Auslöser zum Reden für NPCs in der Nähe (werden jeden Schritt neu berechnet)
    triggers() {
      return npcs.filter(n => n.near < 3.2).map(n => ({ id: 'npc:' + n.def.id, kind: 'npc', zone: 'ground', npc: n, name: n.def.name, x: n.x, z: n.z, r: 2.6 }));
    },
    talk(n, player) {
      const line = talkTo(n, player, getHours());
      talking = n;
      // Satz auf zwei Zeilen umbrechen
      const words = line.split(' '); let a = '', b = '';
      for (const w of words) { if ((a + ' ' + w).trim().length <= 26 && !b) a = (a + ' ' + w).trim(); else b = (b + ' ' + w).trim(); }
      bubble.update([`${n.def.name}:`, a, b].filter(Boolean), { bg: '#ffffff', fg: '#0e7490', accent: '#111827' });
      bubble.visible = true;
      return line;
    },
    dispose() { return disposeObject(group); },
  };
}
