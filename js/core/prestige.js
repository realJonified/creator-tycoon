// Prestige: "Neuer Kanal" setzt den Fortschritt zurück und gibt Ruhm für dauerhafte Boni.
import { BALANCE as B } from '../data/balance.js';
import { PERKS } from '../data/prestige.js';
import { perkLevel, startMoney } from './formulas.js';
import { scheduleNext } from './events.js';

// Ruhm, den ein neuer Kanal jetzt bringen würde.
export function fameGain(S) {
  if (!(S.subs >= B.prestigeMinSubs)) return 0;
  return Math.floor(B.fameBase * Math.pow(S.subs / B.prestigeMinSubs, B.fameExponent) + 1e-9);
}

export const canPrestige = S => fameGain(S) > 0;

// Abos, die für den nächsten Ruhm-Punkt nötig sind.
export function subsForFame(points) {
  return B.prestigeMinSubs * Math.pow(Math.max(points, B.fameBase) / B.fameBase, 1 / B.fameExponent);
}

// Behält Ruhm, Boni, Statistik, Einstellungen und Tagesziele. Alles andere beginnt neu.
export function doPrestige(S, rng = Math.random) {
  const gain = fameGain(S);
  if (gain <= 0) return 0;
  S.fame += gain;
  S.fameTotal += gain;
  S.prestiges++;
  S.subs = 0; S.videos = 0;
  S.up = {}; S.w = {}; S.awards = []; S.buffs = []; S.event = null;
  S.money = startMoney(S);
  scheduleNext(S, rng);
  return gain;
}

export const findPerk = id => PERKS.find(p => p.id === id) || null;

export function perkCost(S, id) {
  const p = findPerk(id);
  if (!p) return Infinity;
  const level = perkLevel(S, id);
  return level >= p.max ? Infinity : p.cost + level * p.costStep;
}

export function buyPerk(S, id) {
  const price = perkCost(S, id);
  if (!Number.isFinite(price) || S.fame < price) return false;
  S.fame -= price;
  S.perks[id] = perkLevel(S, id) + 1;
  return true;
}
