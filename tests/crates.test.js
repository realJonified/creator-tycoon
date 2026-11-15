// Tests für Kisten: Wahrscheinlichkeiten, Inhalt, Doppelte, Ausrüsten.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newState } from '../js/core/game.js';
import { rollRarity, itemsFor, openCrate, equipBoard, findCrate } from '../js/core/crates.js';
import { bestPart } from '../js/core/formulas.js';
import { mulberry32 } from '../tools/balance.js';
import { CRATES, RARITIES, BOARDS, PARTS, SLOTS } from '../js/data/crates.js';

test('Wahrscheinlichkeiten jeder Kiste ergeben zusammen 100 %', () => {
  for (const c of CRATES) {
    const sum = Object.values(c.odds).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-12, `${c.id}: ${sum}`);
    for (const id of Object.keys(c.odds)) assert.ok(RARITIES.some(r => r.id === id), `${c.id}: ${id}`);
  }
});

test('rollRarity ordnet den Zufallswert genau den Bereichen zu', () => {
  const c = findCrate('board'); // 0.6 / 0.28 / 0.1 / 0.02
  assert.equal(rollRarity(c, () => 0), 'gewoehnlich');
  assert.equal(rollRarity(c, () => 0.599), 'gewoehnlich');
  assert.equal(rollRarity(c, () => 0.6), 'selten');
  assert.equal(rollRarity(c, () => 0.879), 'selten');
  assert.equal(rollRarity(c, () => 0.88), 'episch');
  assert.equal(rollRarity(c, () => 0.979), 'episch');
  assert.equal(rollRarity(c, () => 0.981), 'legendaer'); // genau 0,98 liegt wegen Gleitkomma-Rundung auf der Kante
  assert.equal(rollRarity(c, () => 0.9999999), 'legendaer');
});

test('Gezogene Häufigkeiten passen zu den angegebenen Wahrscheinlichkeiten', () => {
  const rng = mulberry32(42), N = 200000;
  for (const c of CRATES) {
    const count = {};
    for (let i = 0; i < N; i++) { const r = rollRarity(c, rng); count[r] = (count[r] || 0) + 1; }
    for (const [id, p] of Object.entries(c.odds)) {
      const got = (count[id] || 0) / N, sd = Math.sqrt(p * (1 - p) / N);
      assert.ok(Math.abs(got - p) < 5 * sd + 1e-4, `${c.id}/${id}: ${got} statt ${p}`);
    }
  }
});

test('Jede Kiste hat zu jeder Seltenheit mit Chance > 0 auch Inhalt', () => {
  for (const c of CRATES) {
    for (const [id, p] of Object.entries(c.odds)) if (p > 0) assert.ok(itemsFor(c, id).length > 0, `${c.id}/${id}`);
  }
  assert.ok(itemsFor(findCrate('board'), 'episch').every(x => x.kind === 'board'));
  assert.ok(itemsFor(findCrate('teile'), 'episch').every(x => x.kind === 'part'));
  const gold = itemsFor(findCrate('gold'), 'legendaer');
  assert.ok(gold.some(x => x.kind === 'board') && gold.some(x => x.kind === 'part'));
});

test('Kiste öffnen: kostet Juwelen, erstes Hoverboard wird ausgerüstet', () => {
  const S = newState(0);
  S.gems = 29;
  assert.equal(openCrate(S, 'board', () => 0), null);
  S.gems = 100;
  const r = openCrate(S, 'board', () => 0);
  assert.equal(r.kind, 'board');
  assert.equal(r.rarity, 'gewoehnlich');
  assert.equal(r.isNew, true);
  assert.equal(S.gems, 70);
  assert.equal(S.board, r.item.id);
  assert.equal(S.stats.crates, 1);
  assert.equal(openCrate(S, 'gibtsnicht'), null);
});

test('Doppelte bringen Juwelen zurück', () => {
  const S = newState(0);
  S.gems = 100;
  openCrate(S, 'board', () => 0);
  const again = openCrate(S, 'board', () => 0);
  assert.equal(again.isNew, false);
  assert.equal(again.refund, RARITIES[0].refund);
  assert.equal(S.gems, 100 - 60 + RARITIES[0].refund);
});

test('PC-Teile: nur ein stärkeres Teil ersetzt das eingebaute', () => {
  const S = newState(0);
  S.gems = 1000;
  S.parts = { cpu3: 1 };
  // gewöhnliches CPU-Teil ziehen (erstes Teil der Liste)
  const r = openCrate(S, 'teile', () => 0);
  assert.equal(r.item.id, 'cpu1');
  assert.equal(r.upgrade, false);
  assert.equal(bestPart(S, 'cpu').id, 'cpu3');
});

test('Hoverboard ausrüsten geht nur mit eigenen Boards', () => {
  const S = newState(0);
  assert.equal(equipBoard(S, 'phoenix'), false);
  S.boards = { phoenix: 1 };
  assert.equal(equipBoard(S, 'phoenix'), true);
  assert.equal(S.board, 'phoenix');
});

test('Inhaltsdaten: eindeutige ids, jede Seltenheit und jeder Steckplatz belegt', () => {
  for (const list of [BOARDS, PARTS, CRATES]) assert.equal(new Set(list.map(x => x.id)).size, list.length);
  for (const r of RARITIES) {
    assert.ok(BOARDS.some(b => b.rarity === r.id), `Board ${r.id}`);
    for (const s of SLOTS) assert.ok(PARTS.some(p => p.rarity === r.id && p.slot === s.id), `Teil ${s.id}/${r.id}`);
  }
});
