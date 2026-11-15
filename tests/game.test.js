// Tests für Formeln, Kosten, Video-Ablauf, Spielzüge, Store und Loop.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, finishVideo, buyGear, buyHouse, tick, applyOffline, earn, checkAwards } from '../js/core/game.js';
import {
  gearMult, recordPower, cutPower, uploadSeconds, uploadSpeed, houseMult, houseStep, viewMult, audience,
  videoOutcome, moneyPerSec, nextGear, nextHouse, awardMult, boardBonus, partBonus, topicUnlocked,
} from '../js/core/formulas.js';
import { startRecording, stepRecording, hitLetter, hitChar, letterValue, startCut, tapCut, stepCut } from '../js/core/video.js';
import { createStore } from '../js/core/store.js';
import { createLoop } from '../js/core/loop.js';
import { BALANCE as B } from '../js/data/balance.js';
import { HOUSES } from '../js/data/houses.js';
import { GEAR, GEAR_CATS } from '../js/data/gear.js';
import { AWARDS } from '../js/data/awards.js';
import { TOPICS } from '../js/data/topics.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

test('Häuser: erstes gratis, dann 50.000 und jedes weitere × 10, insgesamt 20', () => {
  assert.equal(HOUSES.length, 20);
  assert.equal(HOUSES[0].price, 0);
  assert.equal(HOUSES[1].price, 50000);
  for (let i = 2; i < HOUSES.length; i++) near(HOUSES[i].price / HOUSES[i - 1].price, 10);
  assert.equal(new Set(HOUSES.map(h => h.id)).size, 20);
});

test('Erstes Handy kostet 50.000, Geräte-Leitern steigen im Preis', () => {
  assert.equal(GEAR.handy[1].price, 50000);
  for (const [cat, list] of Object.entries(GEAR)) {
    assert.equal(list[0].price, 0, `${cat}: Stufe 0 gratis`);
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i].price > list[i - 1].price, `${cat}: Preis steigt`);
      assert.ok(list[i].mult > list[i - 1].mult, `${cat}: Wirkung steigt`);
      assert.ok(list[i].house >= list[i - 1].house, `${cat}: Haus-Anforderung fällt nicht`);
    }
  }
});

test('Frischer Spielstand: Grundwerte', () => {
  const S = newState(0);
  assert.equal(gearMult(S, 'record'), 1);
  assert.equal(recordPower(S), 1);
  assert.equal(cutPower(S), 1);
  assert.equal(houseMult(S), 1);
  assert.equal(viewMult(S), 1);
  assert.equal(audience(S), 1);
  assert.equal(uploadSeconds(S), B.uploadSizeMB / B.baseUploadMBs);
  assert.equal(moneyPerSec(S), 0);
  assert.equal(S.gems, B.startGems);
  assert.ok(topicUnlocked(S, TOPICS[0]));
  assert.ok(!topicUnlocked(S, TOPICS[1]));
});

test('Geräte kaufen: Geld, Haus-Anforderung, nächste Stufe', () => {
  const S = newState(0);
  assert.equal(buyGear(S, 'pc'), null); // kein Geld
  S.money = 1e9;
  assert.equal(buyGear(S, 'pc').id, 'pc1');
  assert.equal(buyGear(S, 'pc'), null); // pc2 braucht Haus 1
  assert.equal(S.money, 1e9 - GEAR.pc[1].price);
  assert.equal(recordPower(S), GEAR.pc[1].mult);
  S.house = 1;
  assert.equal(buyGear(S, 'pc').id, 'pc2');
  assert.equal(nextGear(S, 'pc').id, 'pc3');
  assert.equal(buyGear(S, 'gibtsnicht'), null);
});

test('WLAN: Router und Boxen machen den Upload schneller', () => {
  const S = newState(0);
  const slow = uploadSeconds(S);
  S.gear.router = 1; S.gear.boxen = 1;
  near(uploadSpeed(S), B.baseUploadMBs * GEAR.router[1].mult * GEAR.boxen[1].mult);
  assert.ok(uploadSeconds(S) < slow);
  S.gear.router = GEAR.router.length - 1; S.gear.boxen = GEAR.boxen.length - 1; S.parts = { ssd4: 1 };
  S.boards = { blitz: 1 }; S.board = 'blitz';
  assert.equal(uploadSeconds(S), B.minUploadSeconds);
});

test('Umzug: Preis, Juwelen, Hausbonus', () => {
  const S = newState(0);
  assert.equal(buyHouse(S), null);
  S.money = 60000;
  assert.equal(buyHouse(S).id, HOUSES[1].id);
  assert.equal(S.money, 10000);
  assert.equal(S.gems, B.startGems + B.gemsPerHouse);
  near(houseMult(S), houseStep(1));
  S.house = 3;
  near(houseMult(S), houseStep(1) * houseStep(2) * houseStep(3));
  S.house = HOUSES.length - 1;
  assert.equal(nextHouse(S), null);
  S.money = 1e30;
  assert.equal(buyHouse(S), null);
});

test('Aufnahme: Buchstaben erscheinen, verschwinden, Treffer bringen Punkte mit Serie', () => {
  const S = newState(0);
  const rec = startRecording('schleim');
  let spawned = 0, missed = 0;
  const rng = () => 0.5;
  stepRecording(rec, 0.4, rng);
  assert.equal(rec.letters.length, 1);
  const first = rec.letters[0];
  const v0 = letterValue(S, rec);
  assert.equal(hitLetter(S, rec, first.id), v0);
  assert.equal(hitLetter(S, rec, first.id), 0); // nicht doppelt
  assert.equal(rec.combo, 1);
  assert.ok(letterValue(S, rec) > v0, 'Serie erhöht den Wert');
  for (let t = 0; t < 200; t++) for (const e of stepRecording(rec, 0.1, rng)) { if (e.type === 'spawn') spawned++; if (e.type === 'miss') missed++; }
  assert.equal(rec.left, 0);
  assert.equal(rec.letters.length, 0);
  assert.ok(spawned > 15 && spawned < 40, `${spawned} Buchstaben`);
  assert.ok(missed > 0);
  assert.equal(rec.combo, 0);
});

test('Aufnahme: Tastatur trifft den ältesten passenden Buchstaben', () => {
  const S = newState(0);
  const rec = startRecording('schleim');
  rec.letters = [{ id: 1, char: 'A', age: 0.2 }, { id: 2, char: 'A', age: 1.5 }, { id: 3, char: 'B', age: 1 }];
  assert.equal(hitChar(S, rec, 'a').id, 2);
  assert.equal(hitChar(S, rec, 'Q'), null);
});

test('Schnitt: Qualität steigt mit Tippern und Geräten, ist gedeckelt und endet mit der Zeit', () => {
  const S = newState(0);
  const cut = startCut();
  for (let i = 0; i < B.cutNeed; i++) tapCut(S, cut);
  near(cut.quality, 1);
  for (let i = 0; i < 500; i++) tapCut(S, cut);
  assert.equal(cut.quality, B.qualityCap);
  const fast = newState(0);
  fast.gear.maus = 2; fast.gear.tastatur = 2;
  const c2 = startCut();
  tapCut(fast, c2);
  near(c2.quality, cutPower(fast) / B.cutNeed);
  assert.equal(stepCut(c2, B.cutSeconds), true);
  assert.equal(tapCut(fast, c2), null); // Zeit vorbei
});

test('Video-Ergebnis: Aufrufe aus Punkten, Qualität, Thema und Boni', () => {
  const S = newState(0);
  const topic = TOPICS[0];
  const out = videoOutcome(S, { points: 1000, quality: 1, topic });
  near(out.views, 1000 * (B.qualityBase + 1));
  near(out.money, out.views * B.moneyPerView * topic.money);
  near(out.subs, B.subsPerView * Math.pow(out.views, B.subsExp) * topic.subs);
  assert.equal(videoOutcome(S, { points: 1000, quality: 99, topic }).views, 1000 * (B.qualityBase + B.qualityCap));
  const r = finishVideo(S, { topic, points: 1000, quality: 1 });
  assert.equal(r.gems, B.gemsPerVideo + B.gemsPerfect);
  assert.equal(S.videos, 1);
  assert.equal(S.stats.perfect, 1);
  near(S.money, out.money);
  assert.equal(finishVideo(S, { topic, points: 10, quality: 0.5 }).gems, B.gemsPerVideo);
});

test('Hoverboards und PC-Teile wirken auf ihre Werte', () => {
  const S = newState(0);
  S.boards = { lava: 1, welle: 1 }; S.board = 'lava';
  assert.equal(boardBonus(S, 'money'), 0.8);
  assert.equal(boardBonus(S, 'subs'), 0);
  S.board = 'gibtsnicht';
  assert.equal(boardBonus(S, 'money'), 0);
  S.parts = { cpu1: 2, cpu3: 1, gpu2: 1, ram1: 1 };
  near(partBonus(S, 'record'), 1.2 + 0.5); // bestes CPU-Teil + GPU
  near(recordPower(S), 2.7);
  near(cutPower(S), 1.2);
});

test('Awards: einmalig, mit Juwelen und Aufrufe-Bonus', () => {
  const S = newState(0);
  S.subs = 2e6;
  const got = checkAwards(S);
  assert.deepEqual(got.map(a => a.id), ['funke', 'stern']);
  assert.equal(S.gems, B.startGems + AWARDS[0].gems + AWARDS[1].gems);
  assert.deepEqual(checkAwards(S), []);
  near(awardMult(S), 1 + AWARDS[0].bonus + AWARDS[1].bonus);
  assert.deepEqual(AWARDS.map(a => a.subs), [1e5, 1e6, 1e7, 1e8, 5e8, 1e9, 5e10, 5e11, 1e12]);
});

test('Passives Geld und Offline-Gewinn', () => {
  const S = newState(0);
  S.subs = 1000;
  near(moneyPerSec(S), 1000 * B.passiveViewsPerSub * B.moneyPerView);
  tick(S, 2);
  near(S.money, moneyPerSec(S) * 2);
  const off = newState(0); off.subs = 1000;
  const r = applyOffline(off, 100 * 3600);
  assert.equal(r.seconds, B.offlineMaxSeconds);
  near(r.money, moneyPerSec(off) * B.offlineMaxSeconds * B.offlineRate);
  assert.equal(applyOffline(newState(0), 500), null);
  assert.equal(applyOffline(off, -5), null);
});

test('Werte laufen nie über, auch bei Billionen und mehr', () => {
  const S = newState(0);
  earn(S, 1e308, 1e308, 1e308);
  earn(S, 1e308, 1e308);
  assert.equal(S.money, B.maxValue);
  assert.equal(S.subs, B.maxValue);
  assert.ok(Number.isFinite(S.gems));
  earn(S, -Infinity);
  assert.equal(S.money, 0);
  const big = newState(0);
  big.money = 5e22; big.house = 18;
  assert.equal(buyHouse(big).id, HOUSES[19].id);
  assert.equal(big.money, 0); // 5e22 - 5e22, ohne Rundungsrest
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
});

test('Loop: feste Schritte, lange Pause zählt als Abwesenheit', () => {
  const steps = [];
  let away = 0;
  const loop = createLoop({ step: 0.1, update: dt => steps.push(dt), onAway: s => { away += s; } });
  loop.frame(1000);
  assert.equal(loop.frame(1100), 1);
  assert.equal(loop.frame(1450), 3);
  assert.equal(loop.frame(1500), 1);
  assert.equal(loop.frame(61500), 0);
  assert.equal(away, 60);
  assert.ok(steps.every(dt => dt === 0.1));
});

test('Jede Kategorie aus GEAR_CATS hat Geräte', () => {
  for (const c of GEAR_CATS) assert.ok(GEAR[c.id]?.length >= 2, c.id);
});
