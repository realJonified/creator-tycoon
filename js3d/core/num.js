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
