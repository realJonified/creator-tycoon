// Tests für Update 2, Etappe 2: Map 2 (Wolkenlagune) und das Gerüst für Map 3.
// Die echten Bau-Funktionen laufen hier in Node: Für die Schilder (Canvas) gibt es eine Mini-Attrappe.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { MAPS, findMap } from '../js3d/data/maps.js';
import { BUILDERS, buildMap } from '../js3d/scene/maps/index.js';
import { createMapManager } from '../js3d/core/maps.js';
import { newState, unlockMap, buyHouse, nextHouse, houseMult } from '../js3d/core/economy.js';

// Canvas-Attrappe für textSprite
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };

const fakeEngine = () => ({ scene: new THREE.Scene(), details: [] });
const lagune = findMap('lagune');

test('Map 2: 1 Billion, mehr Häuser als Map 1, darunter Luft- und Unterwasserhaus, Preise steigen weiter', () => {
  assert.equal(lagune.unlock, 1e12);
  assert.equal(lagune.ready, true);
  assert.ok(lagune.houses.length > MAPS[0].houses.length);
  const sky = lagune.houses.filter(h => h.zone === 'sky'), under = lagune.houses.filter(h => h.zone === 'under');
  assert.equal(sky.length, 1); assert.equal(under.length, 1);
  assert.ok(lagune.houses[0].price > MAPS[0].houses.at(-1).price, 'teurer als das letzte Haus auf Map 1');
  for (let i = 1; i < lagune.houses.length; i++) assert.ok(lagune.houses[i].price > lagune.houses[i - 1].price);
  for (let i = 1; i < lagune.houses.length; i++) assert.ok(lagune.houses[i].size > lagune.houses[i - 1].size);
  // Häuser auf einer Ebene stehen innerhalb dieser Ebene
  for (const h of [...sky, ...under]) {
    const z = lagune.zones[h.zone];
    assert.ok(Math.hypot(h.x - z.x, h.z - z.z) < z.r, h.id);
  }
});

test('Map 2 freischalten und Häuser dort kaufen, Hausbonus steigt über Map 1 hinaus', () => {
  const S = newState(0);
  S.houses.bucht = MAPS[0].houses.map(h => h.id);
  const bonusMap1 = houseMult(S);
  S.money = 1e12 + 2e12;
  assert.equal(unlockMap(S, 'lagune'), true);
  assert.equal(nextHouse(S, 'lagune').id, 'pfahl');
  assert.equal(buyHouse(S, 'pfahl'), true);
  assert.equal(S.money, 0);
  assert.ok(houseMult(S) > bonusMap1);
});

test('Jede Map lässt sich in Node bauen und vollständig entsorgen', () => {
  for (const m of MAPS) {
    const engine = fakeEngine();
    const world = buildMap(engine, newState(0), m);
    assert.ok(engine.scene.children.includes(world.group), `${m.id} hängt in der Szene`);
    assert.ok(world.triggers.some(t => t.kind === 'portal'), `${m.id} hat ein Portal`);
    let geos = 0; world.group.traverse(o => { if (o.geometry) geos++; });
    assert.ok(geos > 0);
    const freed = world.dispose();
    assert.ok(freed.geometries > 0 && freed.materials > 0, `${m.id} gibt Ressourcen frei`);
    assert.equal(engine.scene.children.includes(world.group), false, `${m.id} ist aus der Szene entfernt`);
    assert.equal(engine.details.length, 0, `${m.id} hinterlässt keine Detail-Objekte`);
  }
});

test('Map 2: Ebenen, Sprungpad, Tauchsteg und Haustüren liegen in ihrer Ebene', () => {
  const engine = fakeEngine();
  const w = BUILDERS.lagune(engine, newState(0), lagune);
  assert.deepEqual(Object.keys(w.zones).sort(), ['ground', 'sky', 'under']);
  assert.equal(w.zones.sky.y, 16); assert.equal(w.zones.under.y, -7); assert.ok(w.zones.under.underwater);
  const inZone = (t) => { const z = w.zones[t.zone]; const b = z.bounds; const d = Math.hypot(t.x - b.x, t.z - b.z); return d <= b.r + t.r && (!b.inner || d >= b.inner - t.r); };
  for (const t of w.triggers) assert.ok(inZone(t), `${t.id} erreichbar in ${t.zone}`);
  // Jeder Ebenenwechsel landet innerhalb der Ziel-Ebene, und es gibt immer einen Weg zurück
  for (const t of w.triggers.filter(t => t.to)) {
    const b = w.zones[t.to.zone].bounds;
    assert.ok(Math.hypot(t.to.x - b.x, t.to.z - b.z) < b.r, `${t.id} landet in ${t.to.zone}`);
  }
  assert.ok(w.triggers.some(t => t.zone === 'sky' && t.to?.zone === 'ground'), 'von der Wolkeninsel zurück');
  assert.ok(w.triggers.some(t => t.zone === 'under' && t.to?.zone === 'ground'), 'vom Grund zurück');
  for (const h of lagune.houses) assert.ok(w.triggers.some(t => t.id === 'haus:' + h.id && t.zone === (h.zone || 'ground')), h.id);
  w.dispose();
});

test('Map-Wechsel mit echten Bau-Funktionen: nach 10 Wechseln hängt genau eine Map in der Szene', async () => {
  const engine = fakeEngine();
  const S = newState(0);
  const mgr = createMapManager({ build: id => buildMap(engine, S, findMap(id)), dispose: w => w.dispose() });
  for (let i = 0; i < 10; i++) await mgr.load(i % 2 ? 'bucht' : 'lagune');
  assert.equal(engine.scene.children.length, 1);
  assert.equal(mgr.id, 'bucht');
  assert.equal(engine.details.length, 3, 'nur die Details von Map 1 (Blumen, Wolken, Horizont)');
});

test('Map 3 ist als Gerüst angelegt', () => {
  const frost = findMap('frost');
  assert.equal(frost.ready, false);
  assert.equal(frost.build, 'frost');
  assert.ok(BUILDERS.frost);
  assert.ok(frost.unlock > lagune.unlock);
});
