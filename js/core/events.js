// Zufalls-Ereignisse: Zeitplan, Auswahl und Wirkung. Die Inhalte stehen in js/data/events.js.
import { BALANCE as B } from '../data/balance.js';
import { EVENTS } from '../data/events.js';
import { earn, addBuff } from './game.js';
import { moneyPerSec, subsPerSec, clickMoney, clickSubs } from './formulas.js';
import { fmt, eur, fmtPercent, fmtMult } from './format.js';

export const findEvent = id => EVENTS.find(e => e.id === id) || null;

export function scheduleNext(S, rng = Math.random) {
  S.eventIn = B.eventMinSeconds + rng() * (B.eventMaxSeconds - B.eventMinSeconds);
}

// Wählt nach Gewicht eines der Ereignisse, die zum aktuellen Stand passen.
export function pickEvent(S, rng = Math.random) {
  const pool = EVENTS.filter(e => S.subs >= (e.minSubs || 0));
  const total = pool.reduce((sum, e) => sum + (e.weight || 1), 0);
  let roll = rng() * total;
  for (const e of pool) {
    roll -= e.weight || 1;
    if (roll < 0) return e;
  }
  return pool[pool.length - 1] || null;
}

// Zählt die Zeit herunter. Meldet { type: 'event' } wenn eines erscheint und
// { type: 'eventExpired' } wenn es ungenutzt verschwindet. Solange der Spieler
// das Ereignis geöffnet hat (S.event.open), läuft keine Zeit ab.
export function tickEvents(S, dt, rng = Math.random) {
  if (S.event) {
    if (S.event.open) return null;
    S.event.ttl -= dt;
    if (S.event.ttl > 0) return null;
    S.event = null;
    scheduleNext(S, rng);
    return { type: 'eventExpired' };
  }
  S.eventIn -= dt;
  if (S.eventIn > 0) return null;
  const e = pickEvent(S, rng);
  if (!e) { scheduleNext(S, rng); return null; }
  S.event = { id: e.id, ttl: B.eventTtlSeconds, open: false };
  return { type: 'event', id: e.id };
}

// Führt eine Wirkung aus und beschreibt sie in einem kurzen Satz.
export function applyEffect(S, f) {
  switch (f.type) {
    case 'money': {
      const amount = Math.max(moneyPerSec(S) * (f.seconds || 0), clickMoney(S) * (f.clicks || 0), f.min || 0);
      earn(S, amount, 0);
      return `+${eur(amount)}`;
    }
    case 'subs': {
      const amount = Math.max(subsPerSec(S) * (f.seconds || 0), clickSubs(S) * (f.clicks || 0), f.min || 0);
      earn(S, 0, amount);
      return `+${fmt(amount)} Abos`;
    }
    case 'moneyPct': {
      const amount = S.money * f.pct;
      earn(S, amount, 0);
      return `${amount < 0 ? '−' : '+'}${eur(Math.abs(amount))}`;
    }
    case 'subsPct': {
      const amount = S.subs * f.pct;
      earn(S, 0, amount);
      return `${amount < 0 ? '−' : '+'}${fmt(Math.abs(amount))} Abos (${fmtPercent(Math.abs(f.pct))})`;
    }
    case 'buff': {
      addBuff(S, { id: f.id, icon: f.icon, label: f.label, target: f.target, mult: f.mult, left: f.duration });
      const what = f.target === 'subs' ? 'neue Abos' : f.target === 'money' ? 'Einnahmen' : 'Einnahmen und Abos';
      return `${fmtMult(f.mult)} ${what} für ${f.duration} s`;
    }
    default:
      return '';
  }
}

// Der Spieler hat sich entschieden. Gibt zurück, was passiert ist.
export function resolveEvent(S, choiceIndex, rng = Math.random) {
  const event = S.event && findEvent(S.event.id);
  if (!event) { S.event = null; return null; }
  const choice = event.choices[choiceIndex] || event.choices[event.choices.length - 1];
  let effects = choice.effects || [], won = null;
  if (choice.chance != null) {
    won = rng() < choice.chance;
    effects = (won ? choice.win : choice.lose) || [];
  }
  const lines = effects.map(f => applyEffect(S, f)).filter(Boolean);
  if (effects.length) S.stats.events++;
  S.event = null;
  scheduleNext(S, rng);
  return { event, choice, won, lines, text: won === null ? '' : won ? choice.winText : choice.loseText };
}
