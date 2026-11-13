// Alle Formeln des Spiels. Reine Funktionen: lesen den Zustand S, ändern nichts.
import { BALANCE as B } from '../data/balance.js';
import { EQUIPMENT } from '../data/equipment.js';
import { TEAM } from '../data/team.js';
import { AWARDS } from '../data/awards.js';
import { PERKS } from '../data/prestige.js';

// Kaufbare Dinge: "up" = Ausrüstung, "w" = Team (so heissen die Felder im Spielstand).
export const KINDS = {
  up: { list: EQUIPMENT, growth: B.equipGrowth },
  w: { list: TEAM, growth: B.teamGrowth },
};

export const owned = (S, kind, id) => Math.max(0, Math.floor(S[kind]?.[id] || 0));
export const findItem = (kind, id) => KINDS[kind]?.list.find(i => i.id === id) || null;

// ---------- Multiplikatoren ----------
export const subMult = S => 1 + Math.sqrt(Math.max(0, S.subs)) / B.subDivisor;

export function awardMult(S) {
  let bonus = 0;
  for (const a of AWARDS) if (S.awards.includes(a.id)) bonus += a.bonus ?? B.awardBonus;
  return 1 + bonus;
}

export const perkLevel = (S, id) => Math.max(0, Math.floor(S.perks?.[id] || 0));

export function perkEffect(S, effect) {
  let sum = 0;
  for (const p of PERKS) if (p.effect === effect) sum += perkLevel(S, p.id) * p.per;
  return sum;
}

export const fameMult = S => 1 + Math.max(0, S.fameTotal || 0) * B.famePassive;

// Zeitlich begrenzte Boni: target ist "money", "subs" oder "all".
export function buffMult(S, target) {
  let m = 1;
  for (const b of S.buffs || []) if (b.target === target || b.target === 'all') m *= b.mult;
  return m;
}

export const moneyMult = S =>
  subMult(S) * awardMult(S) * fameMult(S) * (1 + perkEffect(S, 'money')) * buffMult(S, 'money');
export const subsGainMult = S => (1 + perkEffect(S, 'subs')) * buffMult(S, 'subs');

// ---------- Einnahmen ----------
export const clickBase = S => 1 + EQUIPMENT.reduce((sum, u) => sum + owned(S, 'up', u.id) * u.add, 0);
export const viewsPerSec = S => TEAM.reduce((sum, w) => sum + owned(S, 'w', w.id) * w.rate, 0);
export const clickMoney = S => clickBase(S) * moneyMult(S);
export const clickSubs = S => Math.max(1, clickBase(S) * B.clickSubs) * subsGainMult(S);
export const moneyPerSec = S => viewsPerSec(S) * moneyMult(S);
export const subsPerSec = S => viewsPerSec(S) * B.viewSubs * subsGainMult(S);
export const viralChance = S => Math.min(1, B.viralChance + perkEffect(S, 'viral'));
export const offlineRate = S => Math.min(1, B.offlineRate + perkEffect(S, 'offline'));

export function startMoney(S) {
  const level = perkEffect(S, 'startMoney');
  return level > 0 ? B.startMoneyBase * Math.pow(B.startMoneyFactor, level - 1) : 0;
}

// ---------- Kosten ----------
// Preis für n Stück, wenn man schon "have" besitzt (geometrische Reihe, aufgerundet).
export function bulkCost(base, growth, have, n) {
  if (!(n > 0)) return 0;
  return Math.ceil(base * Math.pow(growth, have) * (Math.pow(growth, n) - 1) / (growth - 1));
}

// Grösste Stückzahl, die man sich leisten kann. Die Formel liefert nur eine Schätzung
// (Gleitkomma!), deshalb wird das Ergebnis gegen bulkCost geprüft und korrigiert.
export function maxAffordable(base, growth, have, money) {
  if (!(money > 0) || !Number.isFinite(money)) return 0;
  let n = Math.floor(Math.log(money * (growth - 1) / (base * Math.pow(growth, have)) + 1) / Math.log(growth));
  if (!Number.isFinite(n) || n < 0) n = 0;
  n = Math.min(n, 10000);
  while (n > 0 && bulkCost(base, growth, have, n) > money) n--;
  while (n < 10000 && bulkCost(base, growth, have, n + 1) <= money) n++;
  return n;
}

export function cost(S, kind, id, n = 1) {
  const item = findItem(kind, id);
  return item ? bulkCost(item.base, KINDS[kind].growth, owned(S, kind, id), n) : Infinity;
}

export function maxBuy(S, kind, id) {
  const item = findItem(kind, id);
  return item ? maxAffordable(item.base, KINDS[kind].growth, owned(S, kind, id), S.money) : 0;
}

// Stückzahl für einen Kaufmodus: 1, 10 oder "max" (mindestens 1, damit ein Preis angezeigt wird).
export function buyCount(S, kind, id, mode) {
  return mode === 'max' ? Math.max(1, maxBuy(S, kind, id)) : Math.max(1, Math.floor(mode) || 1);
}

// ---------- Awards ----------
export const nextAward = S => AWARDS.find(a => !S.awards.includes(a.id)) || null;
