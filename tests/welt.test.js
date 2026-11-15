// Tests für die 3D-Welt (Kanalbucht): Preise, Video, Boss, Kiste, Speichern und Migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { W } from '../js3d/data/balance.js';
import { PARTS, HOUSES, BUTTONS, RARITIES, GAMES, CHARMS } from '../js3d/data/content.js';
import {
  newState, partPrice, buyPart, pcQuality, cutPower, uploadSeconds, uploadSpeed, nextHouse, buyHouse, houseMult,
  checkButtons, videoOutcome, finishVideo, tickPortal, portalIsOpen, earn, applyOffline, moneyPerSec,
} from '../js3d/core/economy.js';
import { startRecording, stepRecording, hitLetter, hitChar, startCut, tapCut, stepCut } from '../js3d/core/video.js';
import { startFight, stepFight } from '../js3d/core/boss.js';
import { rollRarity, openChest } from '../js3d/core/rewards.js';
import { loadWorld, saveWorld, migrate, sanitize, SAVE_KEY } from '../js3d/core/save.js';
import { mulberry32 } from '../tools/balance.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), data: m }; };

test('Häuser auf Map 1: Wohnung 50 m² gratis, dann 50.000, 500.000 und immer × 10', () => {
  assert.equal(HOUSES[0].price, 0);
  assert.equal(HOUSES[0].size, 50);
  assert.equal(HOUSES[1].price, 5e4);
  assert.equal(HOUSES[2].price, 5e5);
  const M1 = HOUSES.filter(h => h.map === 'bucht');
  for (let i = 2; i < M1.length; i++) near(M1[i].price / M1[i - 1].price, 10);
  for (let i = 1; i < HOUSES.length; i++) assert.ok(HOUSES[i].size > HOUSES[i - 1].size, 'mehr Platz, auch über Maps hinweg');
});

test('PC-Teile werden mit jedem Kauf teurer und machen das Video besser', () => {
  const S = newState(0);
  const p0 = partPrice(S, 'cpu');
  assert.equal(p0, PARTS.find(p => p.id === 'cpu').base);
  assert.equal(buyPart(S, 'cpu'), false); // kein Geld
  S.money = 1e9;
  assert.equal(buyPart(S, 'cpu'), true);
  assert.equal(S.money, 1e9 - p0);
  assert.ok(partPrice(S, 'cpu') > p0);
  assert.equal(partPrice(S, 'cpu'), Math.ceil(p0 * PARTS[0].growth));
  near(pcQuality(S), 1 + PARTS[0].quality);
  assert.ok(videoOutcome(S, { points: 100, quality: 1, game: GAMES[0] }).views > videoOutcome(newState(0), { points: 100, quality: 1, game: GAMES[0] }).views);
  assert.equal(partPrice(S, 'gibtsnicht'), Infinity);
  assert.equal(buyPart(S, 'gibtsnicht'), false);
  for (const id of ['cpu', 'gpu', 'maus', 'tastatur', 'monitor']) assert.ok(PARTS.some(p => p.id === id), id);
});

test('WLAN: Router macht den Upload schneller, Maus/Tastatur den Schnitt', () => {
  const S = newState(0);
  assert.equal(uploadSeconds(S), W.uploadMB / W.baseMBs);
  S.parts.router = 3;
  near(uploadSpeed(S), W.baseMBs * 1.35 ** 3);
  S.parts.router = 99;
  assert.equal(uploadSeconds(S), W.minUploadSeconds);
  S.parts.maus = 2; S.parts.tastatur = 1;
  near(cutPower(S), 1 + 3 * 0.15);
});

test('Häuser der Reihe nach kaufen', () => {
  const S = newState(0);
  assert.equal(nextHouse(S).id, HOUSES[1].id);
  S.money = 1e7;
  assert.equal(buyHouse(S, HOUSES[2].id), false); // nicht überspringen
  assert.equal(buyHouse(S, HOUSES[1].id), true);
  assert.equal(S.home, HOUSES[1].id);
  near(houseMult(S), 2.5);
  assert.equal(S.money, 1e7 - 5e4);
  S.houses = { bucht: HOUSES.filter(h => h.map === 'bucht').map(h => h.id) };
  assert.equal(nextHouse(S), null);
});

test('Play-Buttons bei den richtigen Abo-Zahlen', () => {
  assert.deepEqual(BUTTONS.map(b => b.subs), [1e5, 1e6, 1e7, 1e8, 5e8, 1e9, 5e10, 5e11, 1e12]);
  const S = newState(0);
  S.subs = 99999;
  assert.deepEqual(checkButtons(S), []);
  S.subs = 1e6;
  assert.deepEqual(checkButtons(S).map(b => b.id), ['silber', 'gold']);
  assert.deepEqual(checkButtons(S), []);
});

test('Video: Buchstaben, Serie, Schnitt und Ergebnis', () => {
  const S = newState(0);
  const rec = startRecording('kugel');
  stepRecording(rec, 0.5, () => 0.5);
  const l = rec.letters[0];
  assert.ok(hitLetter(rec, l.id) > 0);
  assert.equal(hitLetter(rec, l.id), 0);
  let spawned = 0;
  for (let i = 0; i < 200; i++) for (const e of stepRecording(rec, 0.1, () => 0.3)) if (e.type === 'spawn') spawned++;
  assert.equal(rec.left, 0);
  assert.ok(spawned > 12 && spawned < 35, `${spawned}`);
  const r2 = startRecording('kugel');
  r2.letters = [{ id: 1, char: 'K', age: 1 }, { id: 2, char: 'K', age: 0.1 }];
  assert.equal(hitChar(r2, 'k').id, 1);
  const cut = startCut();
  for (let i = 0; i < W.cutNeed; i++) tapCut(S, cut);
  near(cut.quality, 1);
  assert.equal(stepCut(cut, 99), true);
  assert.equal(tapCut(S, cut), null);
  const out = finishVideo(S, { points: 200, quality: 1, game: GAMES[0] });
  near(out.views, 200 * (W.qualityBase + 1));
  assert.equal(S.videos, 1);
  near(S.money, out.money);
});

test('Portal: alle 5 Minuten für 60 Sekunden offen', () => {
  const S = newState(0);
  assert.equal(portalIsOpen(S), false);
  let opened = null;
  for (let t = 0; t < 400; t++) if (tickPortal(S, 1) === 'open') { opened = t + 1; break; }
  assert.equal(opened, W.portalEvery);
  assert.equal(portalIsOpen(S), true);
  let closed = null;
  for (let t = 0; t < 100; t++) if (tickPortal(S, 1) === 'close') { closed = t + 1; break; }
  assert.equal(closed, W.portalOpen);
  assert.equal(S.portal.in, W.portalEvery);
});

test('Boss: 150 Leben, automatische Schüsse, Sieg wenn man ausweicht', () => {
  const f = startFight();
  assert.equal(f.bossHp, 150);
  let t = 0, warned = false;
  // Spieler läuft im Kreis und weicht so jedem Zielkreis aus.
  while (!f.over && t < 120) {
    const p = { x: Math.cos(t * 1.4) * 12, z: Math.sin(t * 1.4) * 12 };
    for (const e of stepFight(f, 1 / 60, p, () => 0.5)) if (e.type === 'warn') warned = true;
    t += 1 / 60;
  }
  assert.equal(f.over, 'win');
  assert.ok(warned);
  assert.ok(f.playerHp > 0);
  near(t, (W.bossHp / W.shotDamage - 1) * W.shotEvery + 0.6, 0.05);
});

test('Boss: wer stehen bleibt, verliert nach drei Treffern', () => {
  const f = startFight();
  let hits = 0;
  while (!f.over) for (const e of stepFight(f, 1 / 60, { x: 0, z: 10 }, () => 0.5)) if (e.type === 'hit') hits++;
  assert.equal(f.over, 'lose');
  assert.equal(hits, Math.ceil(W.playerHp / W.attackDamage));
});

test('Kiste: Wahrscheinlichkeiten ergeben 100 %, seltene sind wirklich selten', () => {
  near(RARITIES.reduce((s, r) => s + r.odds, 0), 1);
  for (let i = 1; i < RARITIES.length; i++) assert.ok(RARITIES[i].odds < RARITIES[i - 1].odds);
  assert.ok(RARITIES.find(r => r.id === 'legendaer').odds <= 0.02);
  assert.equal(rollRarity(() => 0).id, 'gewoehnlich');
  assert.equal(rollRarity(() => 0.71).id, 'gewoehnlich');
  assert.equal(rollRarity(() => 0.73).id, 'selten');
  assert.equal(rollRarity(() => 0.95).id, 'episch');
  assert.equal(rollRarity(() => 0.995).id, 'legendaer');
  const rng = mulberry32(7), N = 200000, count = {};
  for (let i = 0; i < N; i++) { const r = rollRarity(rng).id; count[r] = (count[r] || 0) + 1; }
  for (const r of RARITIES) {
    const sd = Math.sqrt(r.odds * (1 - r.odds) / N);
    assert.ok(Math.abs(count[r.id] / N - r.odds) < 5 * sd + 1e-4, `${r.id}: ${count[r.id] / N}`);
  }
});

test('Kiste öffnen: Geld nach Seltenheit, Glücksbringer bei episch/legendär', () => {
  const S = newState(0);
  const c = openChest(S, () => 0); // gewöhnlich
  assert.equal(c.rarity.id, 'gewoehnlich');
  assert.ok(S.money >= 1000);
  assert.equal(c.charm, null);
  const L = newState(0); L.subs = 1e6;
  const seq = [0.999, 0, 0.9]; let i = 0;
  const leg = openChest(L, () => seq[i++] ?? 0);
  assert.equal(leg.rarity.id, 'legendaer');
  assert.equal(leg.charm.id, 'krone');
  assert.equal(L.charms.krone, 1);
  assert.equal(L.subs, 1e6 + 1e5);
  assert.equal(L.stats.chests, 1);
  assert.ok(CHARMS.every(ch => RARITIES.some(r => r.id === ch.rarity && r.charm > 0)));
});

test('Migration: Geld und Abos aus dem alten Spielstand (creatorTycoonSave_v1)', () => {
  const v1 = { money: 123456.78, subs: 54321.5, videos: 987, up: { cam: 3 }, w: { cut: 4 }, awards: [0, 1], last: 1 };
  const r = loadWorld(mem({ creatorTycoonSave_v1: JSON.stringify(v1) }), 100);
  assert.equal(r.source, 'creatorTycoonSave_v1');
  assert.equal(r.state.money, v1.money);
  assert.equal(r.state.subs, v1.subs);
  assert.equal(r.state.videos, 987);
  assert.deepEqual(r.state.houses, { bucht: ['wohnung'] });
  assert.deepEqual(r.state.maps, ['bucht']);
  // Neuere 2D-Stände haben Vorrang
  const st = mem({ creatorTycoonSave_v1: JSON.stringify(v1), vlogvillaSave_v3: JSON.stringify({ v: 3, money: 5, subs: 7 }) });
  assert.equal(loadWorld(st, 1).source, 'vlogvillaSave_v3');
  // Der 2D-Stand bleibt unberührt liegen, die Welt speichert unter eigenem Schlüssel
  saveWorld(st, r.state, 200);
  assert.ok(st.data.has('creatorTycoonSave_v1'));
  assert.equal(loadWorld(st, 300).source, 'welt');
  assert.equal(loadWorld(mem(), 1).source, 'new');
});

test('Speichern und Laden ergibt denselben Zustand, auch bei Billionen', () => {
  const S = newState(5);
  Object.assign(S, { money: 4.2e22, subs: 1.3e12, views: 9e18, videos: 777, home: 'strand4', tutorialDone: true, lastGame: 'nebel' });
  S.houses = { bucht: HOUSES.filter(h => h.map === 'bucht').map(h => h.id) };
  S.parts.cpu = 40; S.parts.router = 12;
  S.buttons = BUTTONS.map(b => b.id);
  S.charms = { krone: 2 };
  S.portal = { in: 12.5, open: 0 };
  S.settings = { sound: true, graphics: 'hoch', fps: true, sensitivity: 1.4 };
  S.player = { x: 3.5, z: -7, yaw: 1 };
  Object.assign(S.stats, { videos: 777, earned: 9e22, bossWins: 3, bossLosses: 1, chests: 3, bestVideo: 5e15, seconds: 999 });
  const st = mem();
  saveWorld(st, S, 10);
  assert.deepEqual(loadWorld(st, 11).state, S);
});

test('Kaputte oder unsinnige Spielstände werden repariert oder abgelehnt', () => {
  const st = mem({ [SAVE_KEY]: '{kaputt' });
  assert.equal(loadWorld(st, 1).source, 'new');
  assert.equal(st.data.get(SAVE_KEY + '_defekt'), '{kaputt');
  const S = sanitize({ money: -1, subs: NaN, houses: { bucht: ['erfunden', 'strand1'], mond: ['x'] }, maps: ['bucht', 'mond'], map: 'mond', home: 'erfunden', v: 2, parts: { cpu: 2.7, x: 5 }, buttons: ['gold', 'gold', 'nix'], settings: { graphics: 'ultra' } }, 9);
  assert.equal(S.money, 0);
  assert.deepEqual(S.houses, { bucht: ['wohnung', 'strand1'] });
  assert.deepEqual(S.maps, ['bucht']);
  assert.equal(S.map, 'bucht');
  assert.equal(S.home, 'strand1');
  assert.equal(S.parts.cpu, 2);
  assert.deepEqual(S.buttons, ['gold']);
  assert.equal(S.settings.graphics, 'auto');
  assert.throws(() => migrate(null));
  assert.throws(() => migrate({ v: 99 }), /neueren/);
});

test('Geld läuft nie über, passives Geld und offline', () => {
  const S = newState(0);
  earn(S, 1e308); earn(S, 1e308);
  assert.equal(S.money, W.maxValue);
  const P = newState(0); P.subs = 1000;
  near(moneyPerSec(P), 1000 * W.passiveViewsPerSub * W.moneyPerView);
  assert.equal(applyOffline(P, 1e9).seconds, W.offlineMaxSeconds);
  assert.equal(applyOffline(newState(0), 100), null);
});
