// Kleine Zahlen-Hilfe für grosse Geldbeträge.
// JavaScript-Zahlen (double) sind bis etwa 1e308 gross und auf ~16 Stellen genau. Ab 2^53 (9 Brd.)
// lässt sich nicht mehr jeder einzelne Euro darstellen. Für ein Spiel ist die relative Genauigkeit
// mehr als genug (BigInt wäre langsamer und überall umständlich). Es gibt nur zwei Fallen, und die
// fängt diese Datei ab:
//  1. Ein Vergleich "Geld reicht" scheitert an einem winzigen Rundungsrest (z. B. 0,1 + 0,2 ≠ 0,3).
//  2. Nach einem Kauf bleibt ein Mini-Rest oder ein negativer Betrag übrig.
import { W } from '../data/balance.js';

const REL = 1e-14; // relative Toleranz: ein paar Rundungsschritte von double (≈ 2e-16), bei 1 Bio. € nur 1 Cent

// Reicht das Geld für den Preis? Toleriert nur Rundungsreste (14. Stelle).
export function canAfford(money, price) {
  if (!Number.isFinite(price) || price < 0) return false;
  return money >= price * (1 - REL);
}

// Zieht den Preis ab, nie unter 0. Ein Rest unterhalb der Rundungsgenauigkeit wird zu 0.
export function spend(money, price) {
  const left = money - price;
  return left <= Math.max(price, 1) * REL ? 0 : left;
}

// Addiert und begrenzt auf [0, maxValue]. Nie NaN, nie Infinity.
export function addClamped(a, b) {
  const r = (Number.isFinite(a) ? a : 0) + (Number.isFinite(b) ? b : 0);
  return r > W.maxValue ? W.maxValue : r > 0 ? r : 0;
}

// ---------- Sehr grosse Beträge eingeben (Update 3, Entwickler-Werkzeug) ----------
// Eingaben wie "100'000" + "Trilliarde" werden mit BigInt exakt ausgerechnet (keine Rundung beim Einlesen)
// und erst am Ende in eine normale Zahl umgewandelt (auf ~16 Stellen genau, begrenzt auf W.maxValue).
// Lange Skala wie im Deutschen: Billion = 10^12, Billiarde = 10^15, Trillion = 10^18 …
export const AMOUNT_UNITS = [
  { id: '', name: '', exp: 0 },
  { id: 'tsd', name: 'Tausend', exp: 3 },
  { id: 'mio', name: 'Millionen', exp: 6 },
  { id: 'mrd', name: 'Milliarden', exp: 9 },
  { id: 'bio', name: 'Billionen', exp: 12 },
  { id: 'brd', name: 'Billiarden', exp: 15 },
  { id: 'trill', name: 'Trillionen', exp: 18 },
  { id: 'trd', name: 'Trilliarden', exp: 21 },
  { id: 'quadr', name: 'Quadrillionen', exp: 24 },
  { id: 'quadrd', name: 'Quadrilliarden', exp: 27 },
  { id: 'quint', name: 'Quintillionen', exp: 30 },
  { id: 'quintd', name: 'Quintilliarden', exp: 33 },
  { id: 'sext', name: 'Sextillionen', exp: 36 },
  { id: 'sextd', name: 'Sextilliarden', exp: 39 },
  { id: 'sept', name: 'Septillionen', exp: 42 },
  { id: 'septd', name: 'Septilliarden', exp: 45 },
  { id: 'okt', name: 'Oktillionen', exp: 48 },
  { id: 'oktd', name: 'Oktilliarden', exp: 51 },
  { id: 'non', name: 'Nonillionen', exp: 54 },
  { id: 'nond', name: 'Nonilliarden', exp: 57 },
  { id: 'dez', name: 'Dezillionen', exp: 60 },
  { id: 'dezd', name: 'Dezilliarden', exp: 63 },
];

// Liest "100'000", "1.000.000", "2 500", "1,5" oder "3e9" ein. Gibt { big (BigInt, ganze Euro), value (Zahl) } zurück
// oder null bei ungültiger Eingabe. Negative Werte gibt es nicht.
export function parseAmount(text, unitId = '') {
  const unit = AMOUNT_UNITS.find(u => u.id === unitId);
  if (!unit) return null;
  let t = String(text ?? '').trim().replace(/[\s'’_]/g, '');
  if (!t) return null;
  let exp = unit.exp;
  const sci = t.match(/^(.*)e(\d{1,3})$/i);
  if (sci) { t = sci[1]; exp += Number(sci[2]); }
  // Punkte als Tausendertrenner (1.000.000), Komma als Dezimalzeichen (1,5)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '');
  const m = t.match(/^(\d+)(?:[,.](\d+))?$/);
  if (!m) return null;
  const digits = (m[1] + (m[2] || '')).replace(/^0+(?=\d)/, '');
  const shift = exp - (m[2] ? m[2].length : 0);
  // ganze Euro: Nachkommastellen unter 1 € werden abgeschnitten
  const big = shift >= 0 ? BigInt(digits) * 10n ** BigInt(shift) : BigInt(digits) / 10n ** BigInt(-shift);
  return { big, value: bigToNumber(big) };
}

// BigInt → Zahl, begrenzt auf W.maxValue (nie Infinity)
const MAX_BIG = BigInt(W.maxValue); // 1e300 ist als double eine ganze Zahl, BigInt() übernimmt sie exakt
export function bigToNumber(big) {
  return big >= MAX_BIG ? W.maxValue : Number(big);
}

// Exakte Schreibweise mit Tausender-Apostroph, z. B. 100'000'000'000'000'000'000'000'000
export function groupDigits(big) {
  return String(big).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}
