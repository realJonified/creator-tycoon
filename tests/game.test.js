import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, recordVideo, buy, tick, applyOffline, checkAwards, addBuff, earn } from '../js/core/game.js';
import { moneyPerSec, subsPerSec } from '../js/core/formulas.js';
import { createStore } from '../js/core/store.js';
import { createLoop } from '../js/core/loop.js';
import { createActions } from '../js/core/actions.js';
import { BALANCE as B } from '../js/data/balance.js';
import { AWARDS } from '../js/data/awards.js';

test('Video aufnehmen, normal und viral', () => {
  const S = newState(0);
  const normal = recordVideo(S, () => 0.99);
  assert.deepEqual(normal, { money: 1, subs: 1, viral: false });
  const viral = recordVideo(S, () => 0);
  assert.equal(viral.viral, true);
  assert.ok(viral.money > 9.9);
  assert.equal(S.videos, 2);
  assert.equal(S.stats.virals, 1);
});

test('Kaufen zieht Geld ab und lehnt ab, wenn es nicht reicht', () => {
  const S = newState(0);
  S.money = 20;
  assert.equal(buy(S, 'up', 'cam', 1), true);
  assert.equal(S.money, 5);
  assert.equal(S.up.cam, 1);
  assert.equal(buy(S, 'up', 'cam', 1), false);
  assert.equal(buy(S, 'up', 'cam', 0), false);
  assert.equal(buy(S, 'up', 'gibtsnicht', 1), false);
  assert.equal(S.money, 5);
  assert.equal(S.stats.purchases, 1);
});

test('Tick bringt Einnahmen und Awards, Boni laufen ab', () => {
  const S = newState(0);
  S.w = { cut: 10 };
  addBuff(S, { id: 'test', target: 'money', mult: 2, left: 0.25 });
  const before = moneyPerSec(S);
  tick(S, 0.1);
  assert.ok(Math.abs(S.money - before * 0.1) < 1e-9);
  tick(S, 0.1); tick(S, 0.1);
  assert.equal(S.buffs.length, 0);
  S.subs = AWARDS[0].subs;
  const out = tick(S, 0.1);
  assert.equal(out[0].type, 'award');
  assert.equal(out[0].award.id, AWARDS[0].id);
  assert.deepEqual(checkAwards(S), []); // kein Award doppelt
});

test('Offline-Gewinn: 50 %, höchstens 8 Stunden, ohne zeitliche Boni', () => {
  const S = newState(0);
  S.w = { thumb: 5 };
  addBuff(S, { id: 'test', target: 'all', mult: 100, left: 999 });
  S.buffs = S.buffs; // Boni bleiben erhalten, zählen aber nicht
  const plain = newState(0);
  plain.w = { thumb: 5 };
  const perSec = moneyPerSec(plain), subsSec = subsPerSec(plain);
  const r = applyOffline(S, 100);
  assert.ok(Math.abs(r.money - perSec * 100 * B.offlineRate) < 1e-9);
  assert.ok(Math.abs(r.subs - subsSec * 100 * B.offlineRate) < 1e-9);
  assert.equal(r.notice, true);
  assert.equal(S.buffs.length, 1);
  const long = applyOffline(newStateWithTeam(), 100 * 3600);
  assert.equal(long.seconds, B.offlineMaxSeconds);
  assert.equal(applyOffline(newState(0), 500), null);       // ohne Team kein Gewinn
  assert.equal(applyOffline(newStateWithTeam(), -5), null); // Uhr zurückgestellt
  assert.equal(applyOffline(newStateWithTeam(), 10).notice, false);
});

function newStateWithTeam() {
  const S = newState(0);
  S.w = { cut: 2 };
  return S;
}

test('Werte laufen nie über', () => {
  const S = newState(0);
  earn(S, 1e308, 1e308);
  earn(S, 1e308, 1e308);
  assert.equal(S.money, B.maxValue);
  assert.equal(S.subs, B.maxValue);
  earn(S, -Infinity, 0);
  assert.equal(S.money, 0);
});

test('Store meldet Ereignisse und lässt sich abbestellen', () => {
  const store = createStore({ n: 1 });
  const seen = [];
  const off = store.on('x', p => seen.push(p));
  store.on('*', e => seen.push(e.type));
  store.emit('x', 1);
  off();
  store.emit('x', 2);
  store.replace({ n: 2 });
  assert.deepEqual(seen, [1, 'x', 'x', 'replace']);
  assert.equal(store.state.n, 2);
});

test('Actions melden Käufe und Awards über den Store', () => {
  const S = newState(0);
  S.money = 100;
  const store = createStore(S);
  const game = createActions(store, { rng: () => 0.99 });
  const seen = [];
  store.on('*', e => seen.push(e.type));
  game.buy('w', 'cut', 1);
  game.buy('w', 'ai', 1);
  game.record();
  S.subs = AWARDS[0].subs;
  game.tick(0.1);
  assert.deepEqual(seen.filter(t => t !== 'goals'), ['purchase', 'denied', 'video', 'award']);
});

test('Loop: feste Schritte, Rest wird mitgenommen', () => {
  const steps = [];
  let renders = 0;
  const loop = createLoop({ step: 0.1, update: dt => steps.push(dt), render: () => renders++ });
  loop.frame(1000);            // erster Aufruf setzt nur die Uhr
  assert.equal(loop.frame(1050), 0);
  assert.equal(loop.frame(1100), 1);
  assert.equal(loop.frame(1450), 3);
  assert.equal(loop.frame(1500), 1); // 50 ms Rest + 50 ms
  assert.ok(steps.every(dt => dt === 0.1));
  assert.equal(steps.length, 5);
});

test('Loop: Ersatz-Takt springt ein, wenn keine Bild-Takte kommen, aber nicht bei verstecktem Tab', () => {
  let clock = 0, hidden = false, updates = 0, timerFn = null, cleared = false;
  const loop = createLoop({
    step: 0.1, update: () => updates++, now: () => clock, isHidden: () => hidden,
    raf: () => 1, cancel: () => {},           // der Browser liefert nie einen Bild-Takt
    every: fn => { timerFn = fn; return 7; }, clearEvery: id => { cleared = id === 7; },
  });
  loop.start();
  clock = 100; timerFn();                     // zu früh für den Ersatz-Takt
  assert.equal(updates, 0);
  clock = 300; timerFn();
  assert.equal(updates, 3);
  hidden = true; clock = 900; timerFn();      // versteckt: nichts rechnen
  assert.equal(updates, 3);
  loop.stop();
  assert.equal(cleared, true);
  clock = 2000; timerFn();
  assert.equal(updates, 3);
});

test('Loop: lange Pause wird als Abwesenheit gemeldet statt nachgerechnet', () => {
  let updates = 0, away = 0;
  const loop = createLoop({ step: 0.1, awayAfter: 2, update: () => updates++, onAway: s => { away += s; } });
  loop.frame(0);
  loop.frame(100);
  assert.equal(loop.frame(60100), 0);
  assert.equal(away, 60);
  assert.equal(updates, 1);
  assert.equal(loop.frame(50000), 0); // Uhr springt zurück: nichts passiert
  assert.equal(updates, 1);
});
