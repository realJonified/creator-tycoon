import test from 'node:test';
import assert from 'node:assert/strict';
import { fmt, eur, fmtTime, fmtPercent, fmtMult } from '../js/core/format.js';

test('kleine Zahlen', () => {
  assert.equal(fmt(0), '0');
  assert.equal(fmt(0.5), '0,5');
  assert.equal(fmt(9.96), '9,9');   // schneidet ab, rundet nie auf
  assert.equal(fmt(12.7), '12');
  assert.equal(fmt(999.9), '999');
});

test('Einheiten', () => {
  assert.equal(fmt(1000), '1 Tsd.');
  assert.equal(fmt(1500), '1,5 Tsd.');
  assert.equal(fmt(1234567), '1,23 Mio.');
  assert.equal(fmt(2.5e9), '2,5 Mrd.');
  assert.equal(fmt(7e12), '7 Bio.');
  assert.equal(fmt(1e15), '1 Brd.');
});

test('springt an der Grenze nie auf "1000 Tsd."', () => {
  assert.equal(fmt(999999.99), '999,99 Tsd.');
  assert.equal(fmt(999999999.9), '999,99 Mio.');
});

test('sehr grosse Zahlen und Sonderfälle', () => {
  assert.equal(fmt(1e33), '1 Quintd.');
  assert.equal(fmt(1.5e40), '1,5e40');
  assert.equal(fmt(1e300), '1e300');
  assert.equal(fmt(Infinity), '∞');
  assert.equal(fmt(NaN), '0');
  assert.equal(fmt(undefined), '0');
  assert.equal(fmt(-1500), '−1,5 Tsd.');
});

test('Hilfsformate', () => {
  assert.equal(eur(2500), '2,5 Tsd. €');
  assert.equal(fmtPercent(0.25), '25 %');
  assert.equal(fmtMult(1.5), '×1,5');
  assert.equal(fmtTime(45), '45 s');
  assert.equal(fmtTime(200), '3 min 20 s');
  assert.equal(fmtTime(3600 * 8), '8 h');
  assert.equal(fmtTime(3725), '1 h 2 min');
});
