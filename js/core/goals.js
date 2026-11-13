// Tagesziele: jeden Tag drei Ziele, jedes bringt Geld, alle drei zusammen einen Bonus.
import { BALANCE as B } from '../data/balance.js';
import { GOALS, GOALS_PER_DAY } from '../data/goals.js';
import { earn, addBuff } from './game.js';
import { moneyPerSec, clickMoney } from './formulas.js';

export const findGoal = id => GOALS.find(g => g.id === id) || null;

// Tag als Text in Ortszeit, z. B. "2026-11-13".
export function dayKey(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// Einfacher Zufall aus einem Text, damit die Ziele eines Tages feststehen.
function seeded(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function targetFor(S, def) {
  if (def.target != null) return def.target;
  const amount = Math.max(moneyPerSec(S) * (def.incomeSeconds || 0), clickMoney(S) * (def.incomeClicks || 0), def.min || 1);
  // Auf zwei Stellen runden, damit das Ziel lesbar bleibt (z. B. 1,2 Mio. statt 1,2345 Mio.)
  const scale = Math.pow(10, Math.max(0, Math.floor(Math.log10(amount)) - 1));
  return Math.ceil(amount / scale) * scale;
}

// Legt die Ziele für den Tag an, wenn es noch keine gibt. Gibt true zurück, wenn neue entstanden sind.
export function ensureGoals(S, day = dayKey()) {
  if (S.goals && S.goals.day === day) return false;
  const rng = seeded(day);
  const pool = [...GOALS];
  const list = [];
  while (list.length < GOALS_PER_DAY && pool.length) {
    const def = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    list.push({ id: def.id, start: S.stats[def.stat] || 0, target: targetFor(S, def), done: false, claimed: false });
  }
  S.goals = { day, list, bonus: false };
  return true;
}

export function goalProgress(S, goal) {
  const def = findGoal(goal.id);
  if (!def) return 0;
  return Math.max(0, Math.min(goal.target, (S.stats[def.stat] || 0) - goal.start));
}

export function goalText(goal, format = String) {
  const def = findGoal(goal.id);
  return def ? def.text.replace('{n}', format(goal.target)) : '';
}

// Markiert erreichte Ziele und gibt die neu erreichten zurück.
export function tickGoals(S) {
  const done = [];
  for (const goal of S.goals?.list || []) {
    if (!goal.done && goalProgress(S, goal) >= goal.target) { goal.done = true; done.push(goal); }
  }
  return done;
}

export const goalReward = S =>
  Math.max(moneyPerSec(S) * B.goalRewardSeconds, clickMoney(S) * B.goalRewardClicks, B.goalRewardMin);

// Holt die Belohnung ab. Sind alle Ziele abgeholt, gibt es einmal den Tagesbonus.
export function claimGoal(S, index) {
  const goal = S.goals?.list[index];
  if (!goal || !goal.done || goal.claimed) return null;
  const money = goalReward(S);
  goal.claimed = true;
  earn(S, money, 0);
  let bonus = false;
  if (!S.goals.bonus && S.goals.list.every(g => g.claimed)) {
    S.goals.bonus = bonus = true;
    addBuff(S, { id: 'tagesbonus', icon: '🎯', label: 'Tagesbonus', target: 'all', mult: B.goalBonusMult, left: B.goalBonusSeconds });
  }
  return { money, bonus };
}
