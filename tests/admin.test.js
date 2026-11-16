// Versteckter Entwickler-Modus (intern "Admin"): Geste, Werte setzen, sehr grosse Zahlen, Zurücksetzen, Sichtbarkeit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  createTapGesture, createAdmin, toggleAdmin, setMoney, setSubs, unlockAll, resetUnlocks, resetAll,
  settingsSections, timeScale, ADMIN_TAPS,
} from '../js3d/core/admin.js';
import { parseAmount, groupDigits, AMOUNT_UNITS, canAfford } from '../js3d/core/num.js';
import { newState, nextHouse, ownsHouse } from '../js3d/core/economy.js';
import { saveWorld, loadWorld } from '../js3d/core/save.js';
import { fmt, eur } from '../js/core/format.js';
import { W } from '../js3d/data/balance.js';
import { MAPS } from '../js3d/data/maps.js';
import { BOARDS, BUTTONS } from '../js3d/data/content.js';

const tapN = (g, n, start = 0, gap = 200) => { let hit = false; for (let i = 0; i < n; i++) hit = g.tap(start + i * gap) || hit; return hit; };

test('Geste: 19 schnelle Tipps = nichts, 20 = an', () => {
  assert.equal(ADMIN_TAPS, 20);
  const g = createTapGesture();
  assert.equal(tapN(g, 19), false);
  assert.equal(g.count, 19);
  assert.equal(g.tap(19 * 200), true, 'der 20. Tipp schaltet');
  assert.equal(g.count, 0, 'danach beginnt die Zählung neu');
});

test('Geste: Pause über 1 s setzt den Zähler zurück, knapp darunter nicht', () => {
  const g = createTapGesture();
  tapN(g, 15);                       // 0 … 2800 ms
  assert.equal(g.tap(2800 + 1200), false, 'Pause 1,2 s');
  assert.equal(g.count, 1, 'neu angefangen');
  assert.equal(tapN(g, 18, 4000 + 1000, 1000), false, '18 weitere mit genau 1 s Abstand: zusammen 19');
  assert.equal(g.tap(4000 + 18 * 1000 + 999), true, 'der 20. mit 0,999 s Abstand');
  const g2 = createTapGesture();
  for (let i = 0; i < 100; i++) assert.equal(g2.tap(i * 1500), false, 'langsames Tippen schaltet nie');
});

test('Ein- und Ausschalten mit derselben Geste, Schalter gehen beim Ausschalten aus', () => {
  const A = createAdmin(), S = newState(0), g = createTapGesture();
  assert.equal(A.on, false);
  if (tapN(g, 20)) toggleAdmin(A, S);
  assert.equal(A.on, true);
  A.fast = true; A.skipBoss = true;
  assert.equal(timeScale(A), 10);
  if (tapN(g, 20, 10000)) toggleAdmin(A, S);
  assert.equal(A.on, false);
  assert.equal(A.fast, false); assert.equal(A.skipBoss, false);
  assert.equal(timeScale(A), 1);
});

test('Der Modus wird nicht gespeichert: nach dem Laden ist er aus, Geld bleibt', () => {
  const store = new Map(), storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const A = createAdmin(), S = newState(0);
  toggleAdmin(A, S);
  setMoney(S, 1e26);
  saveWorld(storage, S, 1);
  const text = store.values().next().value;
  assert.ok(!/admin|entwickler|snapshot|skipBoss/i.test(text), 'nichts davon im Spielstand');
  const L = loadWorld(storage, 2).state;
  assert.equal(L.money, 1e26);
  assert.equal(createAdmin().on, false, 'neue Sitzung: aus');
});

test('Sehr grosse Zahlen: Eingabe mit Einheit wird exakt (BigInt) eingelesen', () => {
  const r = parseAmount("100'000", 'trd');            // 100'000 Trilliarden
  assert.equal(r.big, 10n ** 26n);
  assert.equal(r.value, 1e26);
  assert.equal(groupDigits(r.big), "100'000'000'000'000'000'000'000'000");
  assert.equal(fmt(r.value), '100 Quadr.');
  assert.equal(parseAmount('1,5', 'mrd').big, 1500000000n);
  assert.equal(parseAmount('1.000.000', '').big, 1000000n);
  assert.equal(parseAmount('2 500', 'mio').big, 2500000000n);
  assert.equal(parseAmount('3e9', 'bio').big, 3n * 10n ** 21n);
  assert.equal(parseAmount('0,5', '').big, 0n, 'unter 1 € fällt weg');
  assert.equal(parseAmount('12345678901234567890123', '').big, 12345678901234567890123n, 'mehr Stellen als ein double hat');
  assert.equal(parseAmount('1', 'dezd').value, 1e63);
  assert.equal(parseAmount('1e299', 'bio').value, W.maxValue, 'begrenzt, nie Infinity');
  for (const bad of ['', 'abc', '-5', '1,2,3', '1e', null]) assert.equal(parseAmount(bad, 'mio'), null, String(bad));
  assert.equal(parseAmount('5', 'gibtsnicht'), null);
  for (let i = 1; i < AMOUNT_UNITS.length; i++) assert.equal(AMOUNT_UNITS[i].exp, AMOUNT_UNITS[i - 1].exp + 3);
});

test('Sehr grosse Zahlen: Anzeige ohne Sprünge, Vergleiche bleiben richtig', () => {
  assert.equal(eur(1e26), '100 Quadr. €');
  assert.equal(fmt(1e33), '1 Quintd.');
  assert.equal(fmt(1.5e70), '1,5e70');
  const S = newState(0);
  setMoney(S, parseAmount("100'000", 'trd').value);
  assert.ok(canAfford(S.money, 1e26));
  assert.ok(!canAfford(S.money, 1.0000001e26));
  setMoney(S, Infinity); assert.equal(S.money, 0, 'Unsinn wird 0');
  setMoney(S, 1e305); assert.equal(S.money, W.maxValue);
});

test('Abos setzen vergibt alle erreichten Kanalknöpfe auf einmal', () => {
  const S = newState(0);
  const got = setSubs(S, 2e9);
  assert.deepEqual(got.map(b => b.id), BUTTONS.filter(b => b.subs <= 2e9).map(b => b.id));
  assert.deepEqual(S.buttons, got.map(b => b.id));
  assert.deepEqual(setSubs(S, 2e9), [], 'nichts doppelt');
  setSubs(S, 10);
  assert.equal(S.buttons.length, got.length, 'verdiente Knöpfe bleiben beim Senken');
  assert.equal(setSubs(S, 2e12).length, BUTTONS.length - got.length);
});

test('Alles freischalten und wieder zurücksetzen', () => {
  const S = newState(0), A = createAdmin();
  S.money = 777;
  toggleAdmin(A, S);
  unlockAll(S);
  const ready = MAPS.filter(m => m.ready);
  assert.deepEqual(S.maps, ready.map(m => m.id));
  for (const m of ready) for (const h of m.houses) assert.ok(ownsHouse(S, h.id), h.id);
  assert.equal(nextHouse(S, 'bucht'), null);
  assert.deepEqual(S.boards, BOARDS.map(b => b.id));
  S.map = 'lagune'; S.board = 'sternenstaub';
  const lost = resetUnlocks(S, A);
  assert.equal(lost, true, 'Lagune war vorher gesperrt');
  assert.equal(S.map, 'bucht');
  assert.deepEqual(S.maps, ['bucht']);
  assert.deepEqual(S.houses, { bucht: ['wohnung'] });
  assert.deepEqual(S.boards, ['kiesel']); assert.equal(S.board, 'kiesel');
  assert.equal(S.money, 777, 'Geld bleibt bei "Freischaltungen zurücksetzen"');
});

test('Entwicklerdaten zurücksetzen: alles auf den Stand vor dem Einschalten', () => {
  const S = newState(0), A = createAdmin();
  S.money = 1234; S.subs = 50; S.houses.bucht.push('strand1');
  toggleAdmin(A, S);
  setMoney(S, 1e26); setSubs(S, 1e12); unlockAll(S); A.fast = true; A.skipBoss = true;
  toggleAdmin(A, S); toggleAdmin(A, S); // aus und wieder an: der gemerkte Stand bleibt der erste
  setMoney(S, 5);
  resetAll(S, A);
  assert.equal(S.money, 1234); assert.equal(S.subs, 50);
  assert.deepEqual(S.buttons, []);
  assert.deepEqual(S.houses, { bucht: ['wohnung', 'strand1'] });
  assert.equal(A.fast, false); assert.equal(A.skipBoss, false);
});

test('Sichtbarkeit: Bereich "entwickler" nur, wenn der Modus an ist', () => {
  const A = createAdmin();
  assert.ok(!settingsSections(A).includes('entwickler'));
  A.on = true;
  assert.ok(settingsSections(A).includes('entwickler'));
  assert.ok(settingsSections(A).includes('grafik'));
});

test('Das Wort "Admin" steht nirgends im sichtbaren Text (nur im Code)', () => {
  const files = ['index.html', ...readdirSync('js3d/ui').map(f => 'js3d/ui/' + f)];
  for (const f of files) {
    // Kommentare sind Code, nicht Oberfläche: vorher entfernen
    const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, '');
    // Text in Anführungszeichen (ohne Dateipfade und Bezeichner wie data-…)
    const strings = src.match(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g) || [];
    for (const s of strings) if (/admin/i.test(s) && !/\.js['"`]$/.test(s)) assert.fail(`${f}: ${s}`);
    if (f.endsWith('.html')) assert.ok(!/admin/i.test(src.replace(/<script[\s\S]*?<\/script>/g, '')), f);
  }
});
