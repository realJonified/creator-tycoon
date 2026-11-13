// Tests für Ereignisse, Prestige, Tagesziele, die Inhaltsdaten und das Balancing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newState } from '../js/core/game.js';
import { tickEvents, resolveEvent, pickEvent, applyEffect, scheduleNext } from '../js/core/events.js';
import { fameGain, canPrestige, doPrestige, perkCost, buyPerk, subsForFame } from '../js/core/prestige.js';
import { ensureGoals, tickGoals, claimGoal, goalProgress, goalReward, dayKey, goalText } from '../js/core/goals.js';
import { moneyMult, startMoney, buffMult } from '../js/core/formulas.js';
import { simulate } from '../tools/balance.js';
import { BALANCE as B } from '../js/data/balance.js';
import { EVENTS } from '../js/data/events.js';
import { GOALS, GOALS_PER_DAY } from '../js/data/goals.js';
import { PERKS } from '../js/data/prestige.js';
import { AWARDS } from '../js/data/awards.js';
import { EQUIPMENT } from '../js/data/equipment.js';
import { TEAM } from '../js/data/team.js';

test('Inhaltsdaten sind vollständig und eindeutig', () => {
  for (const list of [EQUIPMENT, TEAM, AWARDS, EVENTS, GOALS, PERKS]) {
    const ids = list.map(x => x.id);
    assert.equal(new Set(ids).size, ids.length, 'doppelte id');
    for (const x of list) assert.ok(x.id && x.icon, `id und icon fehlen: ${JSON.stringify(x)}`);
  }
  for (const u of EQUIPMENT) assert.ok(u.add > 0 && u.base > 0 && u.name);
  for (const w of TEAM) assert.ok(w.rate > 0 && w.base > 0 && w.name);
  for (let i = 1; i < AWARDS.length; i++) assert.ok(AWARDS[i].subs > AWARDS[i - 1].subs, 'Awards aufsteigend');
  for (const e of EVENTS) {
    assert.ok(e.title && e.text && e.choices.length >= 1);
    for (const c of e.choices) assert.ok(c.label && (Array.isArray(c.effects) || (c.chance > 0 && c.chance < 1 && c.win && c.lose)));
  }
  for (const g of GOALS) assert.ok(g.text.includes('{n}') && g.stat in newState(0).stats);
  // Die ids aus Version 1 müssen bleiben, sonst gehen alte Spielstände kaputt.
  assert.deepEqual(EQUIPMENT.map(u => u.id), ['cam', 'mic', 'light', 'pc', 'green', 'studio']);
  assert.deepEqual(TEAM.map(w => w.id), ['cut', 'thumb', 'social', 'camop', 'agency', 'empire', 'ai']);
});

test('Ereignisse erscheinen, laufen ab und halten an, solange sie offen sind', () => {
  const S = newState(0);
  S.eventIn = 1;
  assert.equal(tickEvents(S, 0.5, () => 0), null);
  const e = tickEvents(S, 0.6, () => 0);
  assert.equal(e.type, 'event');
  assert.equal(S.event.id, 'sponsor');
  S.event.open = true;
  assert.equal(tickEvents(S, 999, () => 0), null);
  assert.ok(S.event, 'offenes Ereignis läuft nicht ab');
  S.event.open = false;
  assert.equal(tickEvents(S, B.eventTtlSeconds + 1, () => 0.5).type, 'eventExpired');
  assert.equal(S.event, null);
  assert.ok(S.eventIn >= B.eventMinSeconds && S.eventIn <= B.eventMaxSeconds);
});

test('Ereignis-Auswahl beachtet Mindest-Abos', () => {
  const S = newState(0);
  for (let i = 0; i < 50; i++) assert.ok((pickEvent(S, () => i / 50).minSubs || 0) === 0);
  S.subs = 1e6;
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(pickEvent(S, () => i / 200).id);
  assert.equal(seen.size, EVENTS.length);
});

test('Sponsor-Deal: Geld und zeitlicher Bonus', () => {
  const S = newState(0);
  S.event = { id: 'sponsor', ttl: 10, open: true };
  const r = resolveEvent(S, 0, () => 0.5);
  assert.equal(S.money, 50);
  assert.equal(buffMult(S, 'money'), 3);
  assert.equal(r.lines.length, 2);
  assert.equal(S.stats.events, 1);
  assert.equal(S.event, null);
  // Ablehnen zählt nicht als Teilnahme
  S.event = { id: 'sponsor', ttl: 10, open: true };
  assert.deepEqual(resolveEvent(S, 1, () => 0.5).lines, []);
  assert.equal(S.stats.events, 1);
  assert.equal(resolveEvent(S, 0), null); // kein Ereignis mehr da
});

test('Shitstorm: sichere Wahl und Risiko', () => {
  const S = newState(0);
  S.subs = 10000;
  S.event = { id: 'shitstorm', ttl: 10, open: true };
  resolveEvent(S, 0, () => 0.5);
  assert.equal(S.subs, 9700);
  S.subs = 10000; S.event = { id: 'shitstorm', ttl: 10, open: true };
  assert.equal(resolveEvent(S, 1, () => 0.1).won, true);
  assert.equal(S.subs, 11200);
  S.subs = 10000; S.event = { id: 'shitstorm', ttl: 10, open: true };
  const lost = resolveEvent(S, 1, () => 0.9);
  assert.equal(lost.won, false);
  assert.equal(S.subs, 8800);
  assert.ok(lost.lines[0].startsWith('−'));
});

test('Wirkungen ändern Geld prozentual und nie unter null', () => {
  const S = newState(0);
  S.money = 1000;
  applyEffect(S, { type: 'moneyPct', pct: -0.25 });
  assert.equal(S.money, 750);
  applyEffect(S, { type: 'moneyPct', pct: -5 });
  assert.equal(S.money, 0);
  assert.equal(applyEffect(S, { type: 'unbekannt' }), '');
});

test('Ruhm: erst ab der Schwelle, dann langsam steigend', () => {
  const S = newState(0);
  S.subs = B.prestigeMinSubs - 1;
  assert.equal(fameGain(S), 0);
  assert.equal(canPrestige(S), false);
  S.subs = B.prestigeMinSubs;
  assert.equal(fameGain(S), B.fameBase);
  S.subs = B.prestigeMinSubs * 100;
  assert.ok(fameGain(S) > B.fameBase * 3 && fameGain(S) < B.fameBase * 10);
  // subsForFame ist die Umkehrung
  S.subs = subsForFame(7) * 1.0001;
  assert.equal(fameGain(S), 7);
});

test('Neuer Kanal: Fortschritt weg, Ruhm, Boni, Statistik und Einstellungen bleiben', () => {
  const S = newState(0);
  Object.assign(S, { money: 5e9, subs: B.prestigeMinSubs * 2, videos: 500 });
  S.up = { cam: 5 }; S.w = { cut: 9 }; S.awards = ['fans']; S.perks = { start: 2 };
  S.buffs = [{ id: 'x', target: 'money', mult: 2, left: 5 }];
  S.settings.sound = true; S.stats.videos = 500; S.stats.earned = 7e9;
  const gain = doPrestige(S, () => 0.5);
  assert.ok(gain >= B.fameBase);
  assert.equal(S.fame, gain);
  assert.equal(S.fameTotal, gain);
  assert.equal(S.prestiges, 1);
  assert.deepEqual([S.subs, S.videos, S.up, S.w, S.awards, S.buffs], [0, 0, {}, {}, [], []]);
  assert.equal(S.money, startMoney(S));
  assert.equal(S.money, B.startMoneyBase * B.startMoneyFactor);
  assert.equal(S.settings.sound, true);
  assert.equal(S.stats.videos, 500);
  assert.equal(S.stats.earned, 7e9);
  assert.ok(moneyMult(S) > 1, 'Ruhm erhöht die Einnahmen');
  assert.equal(doPrestige(S), 0); // ohne Abos kein zweites Mal
});

test('Ruhm-Boni kaufen: Preis steigt, Maximum gilt', () => {
  const S = newState(0);
  S.fame = 3;
  assert.equal(perkCost(S, 'einnahmen'), 1);
  assert.equal(buyPerk(S, 'einnahmen'), true);
  assert.equal(perkCost(S, 'einnahmen'), 2);
  assert.equal(buyPerk(S, 'einnahmen'), true);
  assert.equal(buyPerk(S, 'einnahmen'), false); // 0 Ruhm übrig
  assert.equal(S.fame, 0);
  assert.equal(S.perks.einnahmen, 2);
  const max = PERKS.find(p => p.id === 'viral').max;
  S.perks.viral = max; S.fame = 999;
  assert.equal(perkCost(S, 'viral'), Infinity);
  assert.equal(buyPerk(S, 'viral'), false);
  assert.equal(buyPerk(S, 'gibtsnicht'), false);
});

test('Tagesziele: drei pro Tag, gleich für denselben Tag, neu am nächsten', () => {
  const a = newState(0), b = newState(0);
  assert.equal(ensureGoals(a, '2026-11-13'), true);
  assert.equal(ensureGoals(a, '2026-11-13'), false);
  ensureGoals(b, '2026-11-13');
  assert.equal(a.goals.list.length, GOALS_PER_DAY);
  assert.deepEqual(a.goals.list.map(g => g.id), b.goals.list.map(g => g.id));
  assert.equal(new Set(a.goals.list.map(g => g.id)).size, GOALS_PER_DAY);
  assert.equal(ensureGoals(a, '2026-11-14'), true);
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.match(goalText(a.goals.list[0]), /\d/);
});

test('Tagesziele: Fortschritt zählt ab dem Start, Belohnung und Tagesbonus', () => {
  const S = newState(0);
  S.stats.videos = 1000; // frühere Videos zählen nicht
  S.goals = { day: 'x', bonus: false, list: [
    { id: 'videos', start: 1000, target: 5, done: false, claimed: false },
    { id: 'kaeufe', start: 0, target: 1, done: false, claimed: false },
  ] };
  assert.equal(goalProgress(S, S.goals.list[0]), 0);
  assert.equal(claimGoal(S, 0), null); // noch nicht erreicht
  S.stats.videos = 1007;
  assert.equal(goalProgress(S, S.goals.list[0]), 5);
  assert.deepEqual(tickGoals(S).map(g => g.id), ['videos']);
  assert.deepEqual(tickGoals(S), []);
  const reward = goalReward(S);
  assert.deepEqual(claimGoal(S, 0), { money: reward, bonus: false });
  assert.equal(S.money, reward);
  assert.equal(claimGoal(S, 0), null); // nicht doppelt
  S.stats.purchases = 1;
  tickGoals(S);
  assert.equal(claimGoal(S, 1).bonus, true);
  assert.equal(buffMult(S, 'money'), B.goalBonusMult);
  assert.equal(buffMult(S, 'subs'), B.goalBonusMult);
});

test('scheduleNext bleibt im erlaubten Bereich', () => {
  const S = newState(0);
  scheduleNext(S, () => 0);
  assert.equal(S.eventIn, B.eventMinSeconds);
  scheduleNext(S, () => 0.999999);
  assert.ok(S.eventIn < B.eventMaxSeconds);
});

// Schutz vor versehentlich kaputtem Balancing: Wer Zahlen ändert, sieht hier sofort die Folgen.
test('Balancing: erster Award nach 1–2 Minuten, neuer Kanal nach 30–60 Minuten', () => {
  const log = simulate({ clicks: 2, seconds: 2 * 3600, seed: 1, events: true });
  const times = AWARDS.map(a => log.awards[a.id]).filter(Boolean);
  assert.ok(times[0] >= 60 && times[0] <= 120, `erster Award nach ${times[0]} s`);
  for (let i = 2; i < times.length; i++) {
    assert.ok(times[i] - times[i - 1] > times[i - 1] - times[i - 2], `Award ${i + 1} kommt nicht langsamer als Award ${i}`);
  }
  assert.ok(log.prestigeAt >= 30 * 60 && log.prestigeAt <= 60 * 60, `neuer Kanal nach ${log.prestigeAt} s`);
});
