// Tests für Update 2, Etappe 1: Map-Daten, Freischalten, Häuser pro Map, Laden/Entsorgen, Migration v1 → v2.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { MAPS, ALL_HOUSES, findMap } from '../js3d/data/maps.js';
import { REMOVED_V1_HOUSES } from '../js3d/data/content.js';
import {
  newState, VERSION, unlockMap, canUnlockMap, nextLockedMap, mapUnlocked, buyHouse, nextHouse, ownsHouse, houseMult, bestHouseIndex,
} from '../js3d/core/economy.js';
import { createMapManager } from '../js3d/core/maps.js';
import { disposeObject } from '../js3d/scene/dispose.js';
import { migrate, loadWorld, saveWorld, SAVE_KEY } from '../js3d/core/save.js';
import { BUILDERS } from '../js3d/scene/maps/index.js';

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), data: m }; };

test('Map-Daten sind vollständig und eindeutig', () => {
  assert.ok(MAPS.length >= 3);
  assert.equal(new Set(MAPS.map(m => m.id)).size, MAPS.length);
  assert.equal(new Set(ALL_HOUSES.map(h => h.id)).size, ALL_HOUSES.length, 'Haus-ids über alle Maps eindeutig');
  for (const m of MAPS) {
    for (const k of ['id', 'name', 'icon', 'theme', 'build', 'spawn', 'portal', 'sky', 'houses', 'npcPaths']) assert.ok(m[k] != null, `${m.id}.${k}`);
    assert.ok(typeof m.unlock === 'number' && m.unlock >= 0);
    assert.ok(BUILDERS[m.build], `Bau-Funktion ${m.build}`);
    for (const k of ['top', 'bottom', 'hemiSky', 'hemiGround', 'sun']) assert.match(m.sky[k], /^#[0-9a-f]{6}$/i);
  }
  for (let i = 1; i < MAPS.length; i++) assert.ok(MAPS[i].unlock > MAPS[i - 1].unlock, 'spätere Maps sind teurer');
});

test('Map 1 ist die Insel aus Version 1 mit den ersten 5 Häusern, Map 2 kostet 1 Billion', () => {
  const m1 = MAPS[0];
  assert.equal(m1.id, 'bucht');
  assert.equal(m1.unlock, 0);
  assert.deepEqual(m1.houses.map(h => h.id), ['wohnung', 'strand1', 'strand2', 'strand3', 'strand4']);
  assert.deepEqual(m1.houses.map(h => h.price), [0, 5e4, 5e5, 5e6, 5e7]);
  assert.equal(findMap('lagune').unlock, 1e12);
  assert.equal(findMap('frost').ready, false); // Gerüst für Map 3
});

test('Maps der Reihe nach freischalten, nur fertige und nur mit genug Geld', () => {
  const S = newState(0);
  assert.equal(VERSION, 2);
  assert.deepEqual(S.maps, ['bucht']);
  assert.equal(nextLockedMap(S).id, 'lagune');
  S.money = 5e12;
  // Map 2 ist in Etappe 1 noch nicht gebaut
  const lagune = findMap('lagune');
  assert.equal(canUnlockMap(S, 'lagune'), lagune.ready);
  lagune.ready = true;
  try {
    assert.equal(canUnlockMap(S, 'frost'), false, 'nicht überspringen');
    assert.equal(unlockMap(S, 'lagune'), true);
    assert.equal(S.money, 4e12);
    assert.ok(mapUnlocked(S, 'lagune'));
    assert.deepEqual(S.houses.lagune, []);
    assert.equal(unlockMap(S, 'lagune'), false, 'nicht doppelt');
    const poor = newState(0); poor.money = 1e12 - 1;
    assert.equal(unlockMap(poor, 'lagune'), false);
  } finally { lagune.ready = false; }
});

test('Häuser gehören zu ihrer Map, der Hausbonus gilt über alle Maps', () => {
  const S = newState(0);
  S.money = 1e9;
  assert.equal(nextHouse(S).id, 'strand1');
  assert.equal(buyHouse(S, 'strand1'), true);
  assert.deepEqual(S.houses.bucht, ['wohnung', 'strand1']);
  assert.ok(ownsHouse(S, 'strand1'));
  assert.equal(bestHouseIndex(S), 1);
  assert.equal(houseMult(S), 2.5);
  // Häuser einer nicht freigeschalteten Map kann man nicht kaufen
  S.money = 1e13;
  assert.equal(buyHouse(S, 'pfahl'), false);
  S.maps.push('lagune'); S.houses.lagune = [];
  assert.equal(nextHouse(S, 'lagune').id, 'pfahl');
  assert.equal(nextHouse(S, 'bucht').id, 'strand2', 'jede Map hat ihre eigene Reihenfolge');
  assert.equal(buyHouse(S, 'pfahl'), true);
  assert.deepEqual(S.houses.lagune, ['pfahl']);
  assert.equal(houseMult(S), Math.pow(2.5, ALL_HOUSES.findIndex(h => h.id === 'pfahl')), 'Bonus nach globaler Reihenfolge');
});

test('Migration v1 → v2: Häuser pro Map, Kaufpreis für weggefallene Häuser zurück, nichts verloren', () => {
  const v1 = {
    v: 1, money: 1000, subs: 5e6, views: 1e9, videos: 300,
    parts: { cpu: 7, gpu: 3, maus: 1, tastatur: 2, monitor: 4, router: 5 },
    houses: ['wohnung', 'strand1', 'strand2', 'strand3', 'strand4', 'wald', 'hang'], home: 'hang',
    buttons: ['silber', 'gold'], charms: { kleeblatt: 1 }, portal: { in: 100, open: 0 }, lastGame: 'moos',
    stats: { videos: 300, earned: 9e9, bossWins: 4, bossLosses: 2, chests: 4, bestVideo: 1e6, seconds: 5000 },
    settings: { sound: true, graphics: 'hoch', fps: true, sensitivity: 1.2 }, player: { x: 50, z: 40, yaw: 1 },
    tutorialDone: true, last: 123,
  };
  const S = migrate(v1, 200);
  assert.equal(S.v, 2);
  assert.equal(S.money, 1000 + REMOVED_V1_HOUSES.wald + REMOVED_V1_HOUSES.hang);
  assert.equal(S.migratedRefund, 5e8 + 5e9);
  assert.deepEqual(S.maps, ['bucht']);
  assert.equal(S.map, 'bucht');
  assert.deepEqual(S.houses, { bucht: ['wohnung', 'strand1', 'strand2', 'strand3', 'strand4'] });
  assert.equal(S.home, 'strand4'); // bestes verbleibendes Haus
  // Alles andere bleibt genau gleich
  assert.equal(S.subs, 5e6); assert.equal(S.views, 1e9); assert.equal(S.videos, 300);
  assert.deepEqual(S.parts, v1.parts);
  assert.deepEqual(S.buttons, v1.buttons); assert.deepEqual(S.charms, v1.charms);
  assert.deepEqual(S.stats, v1.stats); assert.deepEqual(S.settings, v1.settings);
  assert.deepEqual(S.player, v1.player);
  assert.equal(S.portal.in, 100); assert.equal(S.lastGame, 'moos'); assert.equal(S.last, 123);
});

test('Migration v1 ohne weggefallene Häuser: kein Geld dazu, Zuhause bleibt', () => {
  const S = migrate({ v: 1, money: 50, subs: 1, houses: ['wohnung', 'strand1'], home: 'wohnung' }, 1);
  assert.equal(S.money, 50);
  assert.equal(S.migratedRefund, undefined);
  assert.equal(S.home, 'wohnung');
  assert.deepEqual(S.houses.bucht, ['wohnung', 'strand1']);
});

test('Gespeicherter v1-Stand wird beim Laden migriert und als v2 gespeichert', () => {
  const st = mem({ [SAVE_KEY]: JSON.stringify({ v: 1, money: 7, subs: 8, houses: ['wohnung', 'krone'], home: 'krone' }) });
  const r = loadWorld(st, 10);
  assert.equal(r.source, 'welt');
  assert.equal(r.state.money, 7 + 5e14);
  saveWorld(st, r.state, 11);
  const again = loadWorld(st, 12).state;
  assert.equal(again.v, 2);
  assert.equal(again.money, 7 + 5e14, 'Rückerstattung nur einmal');
});

test('Karten-Verwalter: immer nur eine Map, alte wird vor dem Bau der neuen entsorgt', async () => {
  const log = [];
  const live = new Set();
  const mgr = createMapManager({
    build: async id => { log.push('build:' + id); live.add(id); return { id }; },
    dispose: inst => { log.push('dispose:' + inst.id); live.delete(inst.id); },
    onLoading: async (on, id) => { log.push((on ? 'laden:' : 'fertig:') + id); },
  });
  await mgr.load('bucht');
  await mgr.load('bucht'); // gleiche Map: nichts passiert
  await mgr.load('lagune');
  await mgr.load('bucht');
  assert.deepEqual(log, [
    'laden:bucht', 'build:bucht', 'fertig:bucht',
    'laden:lagune', 'dispose:bucht', 'build:lagune', 'fertig:lagune',
    'laden:bucht', 'dispose:lagune', 'build:bucht', 'fertig:bucht',
  ]);
  assert.deepEqual([...live], ['bucht']);
  assert.equal(mgr.id, 'bucht');
  // Gleichzeitige Wechsel laufen nacheinander, am Ende ist genau eine Map da
  await Promise.all([mgr.load('lagune'), mgr.load('frost'), mgr.load('bucht')]);
  assert.equal(live.size, 1);
  assert.equal(mgr.id, 'bucht');
});

test('disposeObject gibt Geometrien, Materialien und Texturen frei, geteilte Materialien nicht', () => {
  const root = new THREE.Group();
  const count = { geo: 0, mat: 0, tex: 0 };
  const watch = (o, key) => { o.addEventListener('dispose', () => count[key]++); return o; };
  const geo = watch(new THREE.BoxGeometry(), 'geo');
  const tex = watch(new THREE.Texture(), 'tex');
  const mat = watch(new THREE.MeshBasicMaterial({ map: tex }), 'mat');
  const shared = watch(new THREE.MeshLambertMaterial(), 'mat'); shared.userData.shared = true;
  const sprite = new THREE.Sprite(watch(new THREE.SpriteMaterial({ map: watch(new THREE.Texture(), 'tex') }), 'mat'));
  const inst = new THREE.InstancedMesh(watch(new THREE.SphereGeometry(), 'geo'), watch(new THREE.MeshBasicMaterial(), 'mat'), 10);
  const shaderTex = watch(new THREE.Texture(), 'tex');
  const shader = new THREE.Mesh(watch(new THREE.PlaneGeometry(), 'geo'), watch(new THREE.ShaderMaterial({ uniforms: { t: { value: shaderTex } } }), 'mat'));
  const child = new THREE.Group();
  child.add(new THREE.Mesh(geo, mat), new THREE.Mesh(geo, shared), sprite);
  root.add(child, inst, shader);
  const scene = new THREE.Scene(); scene.add(root);
  const res = disposeObject(root);
  assert.equal(count.geo, 3);       // Box (zweimal benutzt, einmal freigegeben), Kugel, Ebene
  assert.equal(count.mat, 4);       // alle ausser dem geteilten
  assert.equal(count.tex, 3);
  assert.deepEqual(res, { geometries: 3 + 1, materials: 4, textures: 3 }); // + Sprite-Geometrie von three.js
  assert.equal(root.parent, null, 'aus der Szene entfernt');
});

test('disposeObject gibt bei Grafik "Hoch" auch das ursprüngliche Material frei', () => {
  const low = new THREE.MeshLambertMaterial(), high = new THREE.MeshStandardMaterial();
  let freed = 0; low.addEventListener('dispose', () => freed++); high.addEventListener('dispose', () => freed++);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), high);
  mesh.userData.lowMat = low;
  const g = new THREE.Group(); g.add(mesh);
  disposeObject(g);
  assert.equal(freed, 2);
});
