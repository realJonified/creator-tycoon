// Balancing-Simulation: spielt das Spiel mit einem vernünftig kaufenden Spieler durch
// und zeigt, wann Awards und Prestige erreicht werden. Benutzt denselben Code wie das Spiel.
//
//   node tools/balance.js                 drei Spielertypen (2, 4 und 1 Video pro Sekunde), 120 Minuten
//   node tools/balance.js --klicks=3      nur ein Spielertyp
//   node tools/balance.js --minuten=180 --seed=7 --ohne-ereignisse --verlauf
import { newState, recordVideo, buy, tick } from '../js/core/game.js';
import { tickEvents, resolveEvent } from '../js/core/events.js';
import { fameGain, doPrestige, buyPerk, perkCost } from '../js/core/prestige.js';
import { KINDS, cost, moneyMult, moneyPerSec, clickMoney } from '../js/core/formulas.js';
import { AWARDS } from '../js/data/awards.js';
import { BALANCE as B } from '../js/data/balance.js';
import { fmt, eur, fmtTime } from '../js/core/format.js';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const CLICKS = Number(args.klicks ?? 2);
const MINUTES = Number(args.minuten ?? 120);
const SEED = Number(args.seed ?? 1);
const EVENTS_ON = !args['ohne-ereignisse'];

// Zufall mit festem Startwert, damit jeder Lauf dasselbe Ergebnis liefert.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Der Spieler kauft immer das, was sich am schnellsten bezahlt macht
// (Preis / Mehreinnahmen), und rechnet die Wartezeit bis zum Kauf mit ein.
function bestPurchase(S, clicks) {
  const income = moneyPerSec(S) + clickMoney(S) * clicks;
  const mult = moneyMult(S);
  let best = null;
  for (const [kind, { list }] of Object.entries(KINDS)) {
    for (const item of list) {
      const price = cost(S, kind, item.id, 1);
      const gain = (kind === 'up' ? item.add * clicks : item.rate) * mult;
      if (!(gain > 0)) continue;
      const wait = Math.max(0, price - S.money) / Math.max(income, 1e-9);
      const score = price / gain + wait;
      if (!best || score < best.score) best = { kind, id: item.id, price, score };
    }
  }
  return best;
}

export function simulate({ state = newState(0), clicks = CLICKS, seconds = MINUTES * 60, seed = SEED, events = EVENTS_ON, stopAtPrestige = false } = {}) {
  const S = state, rng = mulberry32(seed);
  const log = { awards: {}, prestigeAt: null, marks: [] };
  let clickDebt = 0;
  for (let t = 1; t <= seconds; t++) {
    clickDebt += clicks;
    while (clickDebt >= 1) { recordVideo(S, rng); clickDebt--; }
    for (const e of [...tick(S, 0.5), ...tick(S, 0.5)]) {
      if (e.type === 'award') log.awards[e.award.id] = t;
    }
    if (events && tickEvents(S, 1, rng)?.type === 'event') resolveEvent(S, 0, rng);
    for (let n = 0; n < 100; n++) {
      const b = bestPurchase(S, clicks);
      if (!b || b.price > S.money || !buy(S, b.kind, b.id, 1)) break;
    }
    if (log.prestigeAt === null && fameGain(S) > 0) {
      log.prestigeAt = t;
      if (stopAtPrestige) break;
    }
    if (t % 300 === 0) log.marks.push({ t, money: S.money, subs: S.subs, perSec: moneyPerSec(S), fame: fameGain(S) });
  }
  log.seconds = seconds;
  return log;
}

function report(title, log) {
  console.log(`\n${title}`);
  console.log('  Awards:');
  for (const a of AWARDS) {
    const t = log.awards[a.id];
    console.log(`    ${a.name.padEnd(16)} ${fmt(a.subs).padStart(10)} Abos   ${t ? fmtTime(t) : '— (nicht erreicht)'}`);
  }
  console.log(`  Neuer Kanal möglich (${fmt(B.prestigeMinSubs)} Abos): ${log.prestigeAt ? fmtTime(log.prestigeAt) : '— (nicht erreicht)'}`);
  if (args.verlauf) {
    console.log('  Verlauf alle 5 Minuten:');
    for (const m of log.marks) {
      console.log(`    ${fmtTime(m.t).padEnd(12)} ${eur(m.money).padStart(14)}  ${fmt(m.subs).padStart(12)} Abos  ${eur(m.perSec).padStart(14)}/s  Ruhm bei Neustart: ${m.fame}`);
    }
  }
}

// Kauft Ruhm-Boni wie ein Spieler, der Einnahmen und Abos abwechselnd steigert.
function spendFame(S) {
  const order = ['einnahmen', 'fans', 'start'];
  for (let i = 0; i < 50; i++) {
    const id = order.map(p => ({ p, c: perkCost(S, p) })).sort((a, b) => a.c - b.c)[0].p;
    if (!buyPerk(S, id)) break;
  }
}

// Nur ausführen, wenn die Datei direkt gestartet wird (nicht beim Import in Tests).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  console.log(`Creator Tycoon · Balancing (Seed ${SEED}, Ereignisse ${EVENTS_ON ? 'an' : 'aus'})`);
  report(`${args.klicks ? 'Spieler' : 'Normaler Spieler'}: ${CLICKS} Videos/s, ${MINUTES} Minuten`, simulate());
  if (!args.klicks) {
    report(`Eifriger Spieler: 4 Videos/s, ${MINUTES} Minuten`, simulate({ clicks: 4 }));
    report(`Gemütlicher Spieler: 1 Video/s, ${MINUTES} Minuten`, simulate({ clicks: 1 }));
  }

  // Zweiter Kanal: bei der ersten Gelegenheit neu starten, Ruhm ausgeben, wieder spielen.
  const S = newState(0);
  const first = simulate({ state: S, stopAtPrestige: true, seconds: 6 * 3600 });
  if (first.prestigeAt) {
    const gain = doPrestige(S);
    spendFame(S);
    const second = simulate({ state: S, stopAtPrestige: true, seconds: 6 * 3600, seed: SEED + 1 });
    console.log(`\nZweiter Kanal (nach Neustart bei ${fmtTime(first.prestigeAt)} mit +${gain} Ruhm):`);
    console.log(`  Wieder bereit für einen neuen Kanal nach ${second.prestigeAt ? fmtTime(second.prestigeAt) : 'mehr als 6 h'}`);
  }
}
