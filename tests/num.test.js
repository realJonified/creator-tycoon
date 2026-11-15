// Tests für grosse Zahlen: Vergleiche, Abziehen, Obergrenze und Anzeige (Mio., Mrd., Bio. …).
import test from 'node:test';
import assert from 'node:assert/strict';
import { canAfford, spend, addClamped } from '../js3d/core/num.js';
import { fmt, eur } from '../js/core/format.js';
import { newState, buyHouse, unlockMap, buyPart, partPrice } from '../js3d/core/economy.js';
import { W } from '../js3d/data/balance.js';

test('Über 2^53: Rundungsreste verhindern keinen Kauf und hinterlassen keinen Mini-Rest', () => {
  const price = 2e18;
  // Geld auf "krummem" Weg angespart: dieselbe Summe, aber mit Rundungsrest
  let money = 0;
  for (let i = 0; i < 10; i++) money += price / 10;
  assert.ok(canAfford(money, price));
  assert.equal(spend(money, price), 0);
  // 2^53 + 1 ist als double nicht darstellbar: trotzdem stimmen Vergleich und Abzug
  const big = 2 ** 53;
  assert.ok(canAfford(big + 1, big));
  assert.equal(spend(big, big), 0);
  assert.equal(spend(3e18, 1e18), 2e18);
  // Deutlich zu wenig Geld bleibt zu wenig
  assert.equal(canAfford(price * 0.999, price), false);
  assert.equal(canAfford(1e12 - 1, 1e12), false, 'ein Euro zu wenig ist zu wenig');
  assert.equal(canAfford(Infinity, NaN), false);
});

test('Klassisches Rundungsbeispiel 0,1 + 0,2', () => {
  assert.ok(canAfford(0.1 + 0.2, 0.3));
  assert.equal(spend(0.1 + 0.2, 0.3), 0);
  assert.ok(spend(1, 0.3) > 0.69);
});

test('Addieren bleibt endlich und nicht negativ', () => {
  assert.equal(addClamped(1e308, 1e308), W.maxValue);
  assert.equal(addClamped(5, -10), 0);
  assert.equal(addClamped(NaN, 3), 3);
  assert.equal(addClamped(2, Infinity), 2);
});

test('Käufe mit sehr grossen Beträgen: Geld geht exakt auf 0 statt ins Minus', () => {
  const S = newState(0);
  S.houses.bucht = ['wohnung', 'strand1', 'strand2', 'strand3', 'strand4'];
  S.money = W.mapUnlock.lagune * (1 + 1e-15);
  assert.equal(unlockMap(S, 'lagune'), true);
  assert.equal(S.money, 0);
  S.money = W.housePrices.lagune[0];
  assert.equal(buyHouse(S, 'pfahl'), true);
  assert.equal(S.money, 0);
  S.parts.cpu = 80; // Preis weit über 2^53
  const p = partPrice(S, 'cpu');
  assert.ok(p > 2 ** 53 && Number.isFinite(p));
  S.money = p;
  assert.equal(buyPart(S, 'cpu'), true);
  assert.equal(S.money, 0);
});

test('Anzeige grosser Zahlen mit Einheiten', () => {
  assert.equal(fmt(1.5e6), '1,5 Mio.');
  assert.equal(fmt(2.5e9), '2,5 Mrd.');
  assert.equal(fmt(1e12), '1 Bio.');
  assert.equal(eur(2e18), '2 Trill. €');
  assert.equal(fmt(9007199254740993), '9 Brd.');
  assert.equal(fmt(W.maxValue), '1e300');
});
