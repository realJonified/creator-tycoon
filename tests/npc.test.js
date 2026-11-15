// Tests für Update 2, Etappe 3: NPC-YouTuber (Daten, Wege, Abozahlen, Reden, Grafik-Aufbau).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { MAPS, findMap } from '../js3d/data/maps.js';
import { createNpc, stepNpc, npcSubs, talkTo, NPC_PAUSE, TALK_SECONDS, LINES } from '../js3d/core/npc.js';

const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const { createNpcs } = await import('../js3d/scene/npcs.js');

// Kürzester Abstand eines Punktes zu einer Strecke a-b
function distToSeg(p, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / L));
  return Math.hypot(p.x - (a[0] + t * dx), p.z - (a[1] + t * dz));
}

test('Jede fertige Map hat 6 bis 10 NPCs mit eindeutigen, erfundenen Namen und gültigen Wegen', () => {
  const allNames = new Set();
  for (const m of MAPS.filter(m => m.ready)) {
    assert.ok(m.npcPaths.length >= 6 && m.npcPaths.length <= 10, `${m.id}: ${m.npcPaths.length}`);
    for (const n of m.npcPaths) {
      assert.ok(!allNames.has(n.name), `Name doppelt: ${n.name}`); allNames.add(n.name);
      assert.ok(n.path.length >= 2 && n.speed > 0 && n.subs > 0 && n.growth > 0 && n.growth < 0.2, n.id);
      for (const [x, z] of n.path) {
        assert.ok(Math.hypot(x, z) <= m.walkRadius, `${n.id} bleibt auf der Insel`);
        if (m.lagoonRadius) assert.ok(Math.hypot(x, z) > m.lagoonRadius + 1, `${n.id} läuft nicht ins Wasser`);
      }
    }
  }
});

test('Abozahlen passen zur Map: Map 1 kleinere Kanäle, Map 2 grössere', () => {
  const max1 = Math.max(...findMap('bucht').npcPaths.map(n => n.subs));
  const min2 = Math.min(...findMap('lagune').npcPaths.map(n => n.subs));
  assert.ok(max1 < 1e6, 'Map 1 unter 1 Mio.');
  assert.ok(min2 > max1, 'jeder Kanal auf Map 2 ist grösser als jeder auf Map 1');
});

test('Abozahl wächst langsam mit der Spielzeit und nie rückwärts', () => {
  const def = { subs: 1000, growth: 0.05 };
  assert.equal(npcSubs(def, 0), 1000);
  assert.equal(npcSubs(def, 1), 1050);
  assert.equal(npcSubs(def, -5), 1000);
  let prev = 0;
  for (let h = 0; h < 100; h += 0.5) { const s = npcSubs(def, h); assert.ok(s >= prev); prev = s; }
  assert.ok(npcSubs(def, 10) < 2000, 'nach 10 Stunden noch nicht verdoppelt');
});

test('NPC läuft seine Wegpunkte als Schleife ab und bleibt immer auf dem Weg', () => {
  const def = { speed: 2, path: [[0, 0], [10, 0], [10, 10], [0, 10]] };
  const n = createNpc(def);
  const segs = def.path.map((a, i) => [a, def.path[(i + 1) % def.path.length]]);
  const visited = new Set();
  for (let i = 0; i < 60 * 40; i++) {
    stepNpc(n, 1 / 60);
    assert.ok(Math.min(...segs.map(([a, b]) => distToSeg(n, a, b))) < 1e-6, 'auf dem Weg');
    visited.add(n.seg);
  }
  assert.deepEqual([...visited].sort(), [0, 1, 2, 3], 'alle Strecken besucht, also Schleife');
});

test('Tempo und Pause an Wegpunkten stimmen', () => {
  const n = createNpc({ speed: 2, path: [[0, 0], [10, 0]] });
  stepNpc(n, 2.5);
  assert.ok(Math.abs(n.x - 5) < 1e-9, '2 m/s × 2,5 s = 5 m');
  stepNpc(n, 2.5);                 // am Ende angekommen → Pause
  assert.equal(n.seg, 1); assert.ok(n.pause > 0); assert.equal(n.walking, false);
  const x = n.x;
  stepNpc(n, NPC_PAUSE * 0.5);
  assert.equal(n.x, x, 'steht während der Pause');
  stepNpc(n, NPC_PAUSE);
  assert.ok(n.x < x, 'läuft danach zurück');
});

test('Reden: NPC bleibt stehen, schaut zum Spieler, sagt einen Satz', () => {
  const n = createNpc({ speed: 2, subs: 4200, growth: 0.01, path: [[0, 0], [10, 0]] });
  stepNpc(n, 1);
  const line = talkTo(n, { x: n.x, z: 5 }, 0, () => 0.55);
  assert.equal(line, LINES[5].replace('{sub}', '4,2 Tsd.')); // gleiches Zahlenformat wie überall
  assert.ok(Math.abs(n.heading - 0) < 1e-9, 'schaut nach +z zum Spieler');
  const x = n.x;
  stepNpc(n, TALK_SECONDS - 0.1);
  assert.equal(n.x, x);
  stepNpc(n, 0.2); stepNpc(n, 1);
  assert.notEqual(n.x, x, 'läuft nach dem Gespräch weiter');
});

test('Grafik: ein InstancedMesh pro Körperteil, ein gemeinsamer Atlas, sauberes Entsorgen, Pause ausserhalb der Sicht', () => {
  const engine = { scene: new THREE.Scene(), camera: { far: 180 } };
  const m = findMap('lagune');
  const npcs = createNpcs(engine, m, () => 2);
  const inst = npcs.group.children.filter(o => o.isInstancedMesh);
  assert.equal(inst.length, 8, '8 Körperteile = 8 Draw-Calls, egal wie viele NPCs');
  assert.ok(inst.every(o => o.count === m.npcPaths.length));
  const sprites = npcs.group.children.filter(o => o.isSprite);
  const labelSources = new Set(sprites.slice(0, m.npcPaths.length).map(s => s.material.map.source));
  assert.equal(labelSources.size, 1, 'alle Namensschilder teilen sich ein Bild');
  // Spieler weit weg: niemand bewegt sich
  const before = npcs.npcs.map(n => [n.x, n.z]);
  npcs.step(1, { x: 5000, z: 5000 });
  assert.deepEqual(npcs.npcs.map(n => [n.x, n.z]), before, 'pausieren ausserhalb der Sichtweite');
  // Spieler in der Nähe eines NPC: Auslöser zum Reden
  const n0 = npcs.npcs[0];
  npcs.step(0.01, { x: n0.x + 1, z: n0.z });
  assert.ok(npcs.triggers().some(t => t.npc === n0 && t.kind === 'npc'));
  npcs.render();
  const freed = npcs.dispose();
  assert.ok(freed.materials >= 8 + m.npcPaths.length);
  assert.equal(npcs.group.parent, null);
});
