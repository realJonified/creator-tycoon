// Spielzüge: Funktionen, die den Zustand S verändern. Kein DOM, kein Zufall ohne rng-Parameter.
import { BALANCE as B } from '../data/balance.js';
import { AWARDS } from '../data/awards.js';
import {
  clickMoney, clickSubs, moneyPerSec, subsPerSec, viralChance, offlineRate, cost,
} from './formulas.js';

export const VERSION = 2;

export function newState(now = Date.now()) {
  return {
    v: VERSION,
    money: 0, subs: 0, videos: 0,
    up: {}, w: {}, awards: [],
    buffs: [],                 // [{ id, icon, label, target, mult, left }]
    event: null, eventIn: 60,  // wartendes Ereignis und Sekunden bis zum nächsten
    fame: 0, fameTotal: 0, perks: {}, prestiges: 0,
    goals: null,               // { day, list: [{ id, start, target, done, claimed }], bonus }
    stats: { videos: 0, purchases: 0, events: 0, earned: 0, virals: 0, seconds: 0, bestSubs: 0 },
    settings: { sound: false, anim: true },
    tutorialDone: false,
    last: now,
  };
}

const clamp = x => (x > B.maxValue ? B.maxValue : x > 0 ? x : 0);

// Schreibt Geld und Abos gut (oder zieht sie ab) und führt die Statistik.
export function earn(S, money, subs) {
  S.money = clamp(S.money + money);
  S.subs = clamp(S.subs + subs);
  if (money > 0) S.stats.earned = clamp(S.stats.earned + money);
  if (S.subs > S.stats.bestSubs) S.stats.bestSubs = S.subs;
}

export function recordVideo(S, rng = Math.random) {
  let money = clickMoney(S), subs = clickSubs(S);
  const viral = rng() < viralChance(S);
  if (viral) { money *= B.viralMult; subs *= B.viralMult; S.stats.virals++; }
  earn(S, money, subs);
  S.videos++;
  S.stats.videos++;
  return { money, subs, viral };
}

export function buy(S, kind, id, n = 1) {
  n = Math.floor(n);
  if (!(n >= 1)) return false;
  const price = cost(S, kind, id, n);
  if (!Number.isFinite(price) || S.money < price) return false;
  S.money -= price;
  S[kind][id] = (S[kind][id] || 0) + n;
  S.stats.purchases += n;
  return true;
}

export function checkAwards(S) {
  const got = [];
  for (const a of AWARDS) {
    if (S.subs >= a.subs && !S.awards.includes(a.id)) { S.awards.push(a.id); got.push(a); }
  }
  return got;
}

export function tickBuffs(S, dt) {
  if (!S.buffs.length) return;
  for (const b of S.buffs) b.left -= dt;
  S.buffs = S.buffs.filter(b => b.left > 0);
}

export function addBuff(S, buff) {
  S.buffs = S.buffs.filter(b => b.id !== buff.id);
  S.buffs.push({ ...buff });
}

// Ein Zeitschritt: Einnahmen, Boni, Awards. Gibt eine Liste von Vorkommnissen zurück.
export function tick(S, dt) {
  earn(S, moneyPerSec(S) * dt, subsPerSec(S) * dt);
  S.stats.seconds += dt;
  tickBuffs(S, dt);
  return checkAwards(S).map(award => ({ type: 'award', award }));
}

// Gewinn für Zeit, in der das Spiel nicht lief. Zeitlich begrenzte Boni zählen dabei nicht.
export function applyOffline(S, seconds) {
  const t = Math.min(Math.max(0, seconds || 0), B.offlineMaxSeconds);
  if (!(t > 0)) return null;
  const buffs = S.buffs;
  S.buffs = [];
  const rate = offlineRate(S);
  const money = moneyPerSec(S) * t * rate, subs = subsPerSec(S) * t * rate;
  S.buffs = buffs;
  if (!(money > 0) && !(subs > 0)) return null;
  earn(S, money, subs);
  return { seconds: t, money, subs, rate, notice: t >= B.offlineNoticeSeconds };
}
