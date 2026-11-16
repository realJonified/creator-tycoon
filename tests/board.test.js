// Hoverboards (Update 3): Fahrphysik, Kollision, Besitz, Spielstand.
import test from 'node:test';
import assert from 'node:assert/strict';
import { W } from '../js3d/data/balance.js';
import { BOARDS, STARTER_BOARD } from '../js3d/data/content.js';
import { createRide, stepRide, boardStats, findBoard, ownsBoard, equipBoard, equippedBoard, BOARD_RADIUS } from '../js3d/core/board.js';
import { newState, VERSION, tickEconomy, moneyPerSec } from '../js3d/core/economy.js';
import { migrate, sanitize, saveWorld, loadWorld } from '../js3d/core/save.js';

const open = { circles: [], boxes: [] };
const STEP = 1 / 60;
const kiesel = findBoard(STARTER_BOARD);
// Fährt n Sekunden mit fester Eingabe. Kamera schaut nach yaw 0 → "vorwärts" (move.y = 1) ist -z.
function drive(ride, pos, seconds, move, { stats = boardStats(kiesel), colliders = open, bounds = null, camYaw = 0 } = {}) {
  let hits = 0;
  for (let t = 0; t < seconds; t += STEP) if (stepRide(ride, pos, STEP, move, camYaw, stats, colliders, bounds)) hits++;
  return hits;
}

test('Board beschleunigt bis zum Höchsttempo, nicht darüber', () => {
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  drive(ride, pos, 0.25, { x: 0, y: 1 });
  assert.ok(ride.speed > 1 && ride.speed < kiesel.speed, 'nach 0,25 s schon unterwegs, aber nicht voll');
  drive(ride, pos, 4, { x: 0, y: 1 });
  assert.ok(Math.abs(ride.speed - kiesel.speed) < 0.05, `Höchsttempo erreicht (${ride.speed})`);
  assert.ok(pos.z < -30, 'fährt vorwärts (von der Kamera weg)');
  assert.ok(Math.abs(pos.x) < 1e-6);
  assert.ok(kiesel.speed > 10, 'schneller als rennen');
});

test('Ohne Eingabe bremst die Reibung bis zum Stillstand', () => {
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  drive(ride, pos, 3, { x: 0, y: 1 });
  const z = pos.z;
  drive(ride, pos, 1, { x: 0, y: 0 });
  assert.ok(ride.speed < kiesel.speed * 0.4, 'nach 1 s deutlich langsamer');
  drive(ride, pos, 6, { x: 0, y: 0 });
  assert.equal(ride.speed, 0);
  assert.ok(pos.z < z, 'rollt noch ein Stück weiter');
});

test('Wendigkeit begrenzt die Drehung, in der Kurve neigt sich das Board', () => {
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  drive(ride, pos, 2, { x: 0, y: 1 });
  const h0 = ride.heading;
  stepRide(ride, pos, STEP, { x: 1, y: 0 }, 0, boardStats(kiesel), open); // scharf nach rechts
  const turned = Math.abs(Math.atan2(Math.sin(ride.heading - h0), Math.cos(ride.heading - h0)));
  assert.ok(turned <= kiesel.turn * STEP + 1e-9, 'pro Schritt höchstens turn × dt');
  drive(ride, pos, 0.3, { x: 1, y: 0 });
  assert.ok(Math.abs(ride.lean) > 0.05 && Math.abs(ride.lean) <= W.board.maxLean + 1e-9, `Neigung ${ride.lean}`);
  drive(ride, pos, 3, { x: 1, y: 0 });
  assert.ok(Math.abs(ride.lean) < 0.02, 'geradeaus wieder aufrecht');
});

test('Kein Durchfahren: Hauswand (gedrehtes Rechteck) und Baum stoppen das Board', () => {
  const house = { circles: [], boxes: [{ x: 0, z: -10, hw: 4, hd: 0.3, rot: 0.3 }] };
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  const hits = drive(ride, pos, 4, { x: 0, y: 1 }, { colliders: house });
  assert.ok(hits > 0, 'Aufprall gemeldet');
  assert.ok(pos.z > -10, `nicht durch die Wand (z = ${pos.z})`);
  const tree = { circles: [{ x: 0, z: -8, r: 0.5 }], boxes: [] };
  const r2 = createRide(Math.PI), p2 = { x: 0, z: 0 };
  drive(r2, p2, 3, { x: 0, y: 1 }, { colliders: tree });
  assert.ok(Math.hypot(p2.x, p2.z + 8) >= 0.5 + BOARD_RADIUS - 1e-6, 'nicht im Baum');
  assert.ok(p2.z > -8 || Math.abs(p2.x) > 0.5, 'nicht hindurch, höchstens daran vorbei');
});

test('Auch bei sehr hohem Tempo kein Durchtunneln dünner Wände', () => {
  const wall = { circles: [], boxes: [{ x: 0, z: -5, hw: 10, hd: 0.05, rot: 0 }] };
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  const fast = { speed: 200, accel: 2000, turn: 3 };
  drive(ride, pos, 1, { x: 0, y: 1 }, { stats: fast, colliders: wall });
  assert.ok(pos.z > -5, `z = ${pos.z}`);
});

test('Grenzen der Ebene (Insel, Lagunenrand) halten das Board', () => {
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  drive(ride, pos, 5, { x: 0, y: 1 }, { bounds: { x: 0, z: 0, r: 12 } });
  assert.ok(Math.hypot(pos.x, pos.z) <= 12 + 1e-6);
});

test('Unter Wasser langsamer', () => {
  const dry = boardStats(kiesel), wet = boardStats(kiesel, true);
  assert.ok(wet.speed < dry.speed && wet.accel < dry.accel);
  assert.equal(wet.speed, kiesel.speed * W.board.underwater);
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  drive(ride, pos, 5, { x: 0, y: 1 }, { stats: wet });
  assert.ok(ride.speed <= wet.speed + 1e-9);
});

test('Halb gedrückter Joystick: halbes Tempo', () => {
  const ride = createRide(Math.PI), pos = { x: 0, z: 0 };
  drive(ride, pos, 5, { x: 0, y: 0.5 });
  assert.ok(Math.abs(ride.speed - kiesel.speed * 0.5) < 0.1, `${ride.speed}`);
});

test('Erstes Board: jeder hat es, ausrüsten nur eigene Boards', () => {
  const S = newState(0);
  assert.deepEqual(S.boards, [STARTER_BOARD]);
  assert.equal(equippedBoard(S).id, STARTER_BOARD);
  assert.ok(ownsBoard(S, STARTER_BOARD));
  assert.equal(equipBoard(S, 'gibtsnicht'), false);
  assert.equal(equipBoard(S, null), true);
  assert.equal(equippedBoard(S), null);
  assert.equal(equipBoard(S, STARTER_BOARD), true);
  assert.ok(BOARDS.every(b => b.speed > 0 && b.accel > 0 && b.turn > 0 && b.deck && b.glow));
});

test('Spielstand Version 3: Migration von Version 2 gibt das erste Board, nichts geht verloren', () => {
  assert.equal(VERSION, 3);
  const v2 = { v: 2, money: 123456, subs: 789, maps: ['bucht', 'lagune'], map: 'lagune', houses: { bucht: ['wohnung', 'strand1'], lagune: [] }, home: 'strand1', parts: { cpu: 4 }, buttons: ['silber'], player: { x: 3, z: 4, yaw: 1, zone: 'sky' } };
  const S = migrate(v2, 5);
  assert.equal(S.v, 3);
  assert.equal(S.money, 123456); assert.equal(S.subs, 789);
  assert.deepEqual(S.maps, ['bucht', 'lagune']); assert.equal(S.map, 'lagune');
  assert.deepEqual(S.houses.bucht, ['wohnung', 'strand1']); assert.equal(S.home, 'strand1');
  assert.equal(S.parts.cpu, 4); assert.deepEqual(S.buttons, ['silber']);
  assert.equal(S.player.zone, 'sky');
  assert.deepEqual(S.boards, [STARTER_BOARD]); assert.equal(S.board, STARTER_BOARD);
  // auch ein Version-1-Stand kommt über beide Schritte an
  const S1 = migrate({ v: 1, money: 10, houses: ['wohnung'] }, 5);
  assert.equal(S1.v, 3); assert.deepEqual(S1.boards, [STARTER_BOARD]);
});

test('Boards werden gespeichert und geprüft geladen', () => {
  const store = new Map(), storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const S = newState(0); S.board = null;
  saveWorld(storage, S, 1);
  assert.equal(loadWorld(storage, 2).state.board, null, 'abgelegt bleibt abgelegt');
  const bad = sanitize({ v: 3, boards: ['erfunden', 'kiesel', 'kiesel'], board: 'erfunden' }, 1);
  assert.deepEqual(bad.boards, [STARTER_BOARD]);
  assert.equal(bad.board, STARTER_BOARD);
});

test('Das Board bringt kein Geld: Einnahmen sind mit und ohne Board gleich', () => {
  const a = newState(0), b = newState(0);
  a.subs = b.subs = 5e6; b.board = null;
  assert.equal(moneyPerSec(a), moneyPerSec(b));
  tickEconomy(a, 60); tickEconomy(b, 60);
  assert.equal(a.money, b.money);
});

// ---------- Etappe 2: mehrere Boards, Shop, Kisten ----------
import { buyBoard, canBuyBoard, chestBoards, grantBoard } from '../js3d/core/board.js';
import { openChest } from '../js3d/core/rewards.js';
import { RARITIES } from '../js3d/data/content.js';

const RANK = Object.fromEntries(RARITIES.map((r, i) => [r.id, i]));

test('Boards: jede Seltenheit vorhanden, bessere Seltenheit = schneller, Shop teurer je Stufe', () => {
  for (const r of RARITIES) assert.ok(BOARDS.some(b => b.rarity === r.id), r.id);
  const ids = new Set(BOARDS.map(b => b.id));
  assert.equal(ids.size, BOARDS.length, 'ids eindeutig');
  const best = r => Math.max(...BOARDS.filter(b => b.rarity === r).map(b => b.speed));
  for (let i = 1; i < RARITIES.length; i++) assert.ok(best(RARITIES[i].id) > best(RARITIES[i - 1].id));
  const shop = BOARDS.filter(b => b.price != null).sort((a, b) => a.price - b.price);
  for (let i = 1; i < shop.length; i++) assert.ok(RANK[shop[i].rarity] >= RANK[shop[i - 1].rarity], 'Preis steigt mit der Seltenheit');
  assert.equal(findBoard(STARTER_BOARD).price, null, 'erstes Board kostet nichts');
  for (const r of RARITIES.slice(1)) assert.ok(BOARDS.some(b => b.rarity === r.id && b.price == null), `${r.id}: auch ein Board nur aus Kisten`);
  assert.ok(BOARDS.every(b => ['none', 'glow', 'sparks', 'stars'].includes(b.trail)));
});

test('Board kaufen: Geld reicht genau, danach ausgerüstet, kein zweites Mal, Kisten-Boards nicht kaufbar', () => {
  const S = newState(0);
  const brise = findBoard('brise');
  S.money = brise.price - 1;
  assert.equal(buyBoard(S, 'brise'), false);
  S.money = brise.price;
  assert.equal(buyBoard(S, 'brise'), true);
  assert.equal(S.money, 0);
  assert.deepEqual(S.boards, [STARTER_BOARD, 'brise']);
  assert.equal(S.board, 'brise');
  S.money = 1e30;
  assert.equal(canBuyBoard(S, 'brise'), false, 'schon gekauft');
  assert.equal(buyBoard(S, 'polar'), false, 'nur aus Kisten');
  assert.equal(buyBoard(S, 'gibtsnicht'), false);
  assert.equal(equipBoard(S, STARTER_BOARD), true);
  assert.equal(S.board, STARTER_BOARD);
});

test('Kiste: seltene Kisten können ein Kisten-Board geben, nie doppelt, nie bei gewöhnlich', () => {
  const S = newState(0); S.subs = 1e6;
  // rng: erst Seltenheit (0.99 → legendär), dann Board-Chance (0), dann Auswahl (0), dann Glücksbringer-Würfe
  const seq = (...v) => { let i = 0; return () => v[Math.min(i++, v.length - 1)]; };
  const r = openChest(S, seq(0.995, 0.9, 0, 0, 0));
  assert.equal(r.rarity.id, 'legendaer');
  assert.ok(r.board, 'Board erhalten');
  assert.equal(r.board.rarity, 'legendaer');
  assert.ok(S.boards.includes(r.board.id));
  assert.notEqual(S.board, r.board.id, 'nicht automatisch ausgerüstet');
  assert.deepEqual(chestBoards(S, 'legendaer'), [], 'alle legendären Kisten-Boards im Besitz');
  const r2 = openChest(S, seq(0.995, 0.9, 0, 0, 0));
  assert.equal(r2.board, null, 'nichts doppelt');
  const common = openChest(S, seq(0.1, 0, 0, 0));
  assert.equal(common.rarity.id, 'gewoehnlich'); assert.equal(common.board, null);
  assert.equal(grantBoard(S, r.board.id), false);
});

test('Kisten-Boards sind selten: im Schnitt dauert es lange (Erwartung pro Bosssieg)', () => {
  const chance = id => RARITIES.find(r => r.id === id);
  const perWin = r => chance(r).odds * chance(r).board;
  assert.ok(1 / perWin('selten') > 20, 'seltenes Kisten-Board: im Schnitt nach über 20 Siegen');
  assert.ok(1 / perWin('legendaer') > 100, 'legendäres: über 100 Siege');
});

test('Gekaufte Boards und das ausgerüstete Board überstehen Speichern und Laden', () => {
  const store = new Map(), storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const S = newState(0); S.money = 1e12;
  buyBoard(S, 'brise'); buyBoard(S, 'koralle'); grantBoard(S, 'polar'); equipBoard(S, 'polar');
  saveWorld(storage, S, 1);
  const L = loadWorld(storage, 2).state;
  assert.deepEqual(L.boards, [STARTER_BOARD, 'brise', 'koralle', 'polar']);
  assert.equal(L.board, 'polar');
});
