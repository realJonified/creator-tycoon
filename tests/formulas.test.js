import test from 'node:test';
import assert from 'node:assert/strict';
import { newState } from '../js/core/game.js';
import {
  subMult, awardMult, moneyMult, clickBase, clickMoney, clickSubs, viewsPerSec, moneyPerSec, subsPerSec,
  bulkCost, maxAffordable, cost, maxBuy, buyCount, nextAward, buffMult, fameMult, startMoney,
} from '../js/core/formulas.js';
import { BALANCE as B } from '../js/data/balance.js';
import { AWARDS } from '../js/data/awards.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

test('frischer Spielstand: ein Video bringt 1 € und 1 Abo', () => {
  const S = newState(0);
  assert.equal(clickBase(S), 1);
  assert.equal(clickMoney(S), 1);
  assert.equal(clickSubs(S), 1);
  assert.equal(moneyPerSec(S), 0);
});

test('Abo-Bonus wächst mit der Wurzel der Abos', () => {
  const S = newState(0);
  S.subs = 1600;
  near(subMult(S), 1 + 40 / B.subDivisor);
  S.subs = -5; // darf nie NaN ergeben
  assert.equal(subMult(S), 1);
});

test('Awards, Ruhm und Boni multiplizieren die Einnahmen', () => {
  const S = newState(0);
  S.awards = [AWARDS[0].id, AWARDS[1].id];
  near(awardMult(S), 1 + 2 * B.awardBonus);
  S.fameTotal = 4;
  near(fameMult(S), 1 + 4 * B.famePassive);
  S.perks = { einnahmen: 2 };
  S.buffs = [{ id: 'x', target: 'money', mult: 3, left: 10 }, { id: 'y', target: 'subs', mult: 5, left: 10 }];
  assert.equal(buffMult(S, 'money'), 3);
  near(moneyMult(S), awardMult(S) * fameMult(S) * 1.3 * 3);
  near(clickSubs(S), 5);
});

test('Ausrüstung und Team', () => {
  const S = newState(0);
  S.up = { cam: 3, mic: 1 };
  assert.equal(clickBase(S), 1 + 3 * 1 + 6);
  S.w = { cut: 4, thumb: 1 };
  assert.equal(viewsPerSec(S), 4 * 0.5 + 4);
  near(moneyPerSec(S), 6 * moneyMult(S));
  near(subsPerSec(S), 6 * B.viewSubs);
});

test('Kosten: Summe mehrerer Stück entspricht der geometrischen Reihe', () => {
  assert.equal(bulkCost(25, 1.15, 0, 1), 25);
  assert.equal(bulkCost(25, 1.15, 0, 0), 0);
  let sum = 0;
  for (let k = 5; k < 15; k++) sum += 25 * 1.15 ** k;
  near(bulkCost(25, 1.15, 5, 10), Math.ceil(sum), 1e-12);
  const S = newState(0);
  S.w = { cut: 5 };
  assert.equal(cost(S, 'w', 'cut', 10), bulkCost(25, 1.15, 5, 10));
  assert.equal(cost(S, 'w', 'gibtsnicht'), Infinity);
});

test('Max-Kauf: nie zu teuer, nie eins zu wenig (auch an Rundungsgrenzen)', () => {
  for (const [base, growth] of [[25, 1.15], [15, 1.5], [9e6, 1.15]]) {
    for (let have = 0; have < 60; have += 7) {
      for (let n = 1; n <= 40; n += 3) {
        const exact = bulkCost(base, growth, have, n);
        // genau genug Geld -> genau n
        assert.equal(maxAffordable(base, growth, have, exact), n, `genau: ${base} ${have} ${n}`);
        // ein Euro zu wenig -> n - 1 (nur prüfbar, solange 1 € in der Zahl noch darstellbar ist)
        if (exact - 1 < exact) assert.equal(maxAffordable(base, growth, have, exact - 1), n - 1, `knapp: ${base} ${have} ${n}`);
      }
    }
  }
  assert.equal(maxAffordable(25, 1.15, 0, 0), 0);
  assert.equal(maxAffordable(25, 1.15, 0, NaN), 0);
  assert.equal(maxAffordable(25, 1.15, 0, Infinity), 0);
});

test('Kaufmodus', () => {
  const S = newState(0);
  S.money = 1000;
  assert.equal(buyCount(S, 'w', 'cut', 1), 1);
  assert.equal(buyCount(S, 'w', 'cut', 10), 10);
  assert.equal(buyCount(S, 'w', 'cut', 'max'), maxBuy(S, 'w', 'cut'));
  S.money = 0;
  assert.equal(buyCount(S, 'w', 'cut', 'max'), 1); // zeigt den Preis für 1 Stück
});

test('nächster Award und Startkapital', () => {
  const S = newState(0);
  assert.equal(nextAward(S).id, AWARDS[0].id);
  S.awards = AWARDS.map(a => a.id);
  assert.equal(nextAward(S), null);
  assert.equal(startMoney(S), 0);
  S.perks = { start: 3 };
  assert.equal(startMoney(S), B.startMoneyBase * B.startMoneyFactor ** 2);
});
