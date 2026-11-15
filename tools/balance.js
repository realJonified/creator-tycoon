// Balancing-Simulation: Ein Spieler macht Video um Video, kauft sinnvoll ein und öffnet Kisten.
// Ausgegeben wird, wann Häuser und Awards erreicht werden. Benutzt denselben Code wie das Spiel.
//
//   node tools/balance.js                  Standard: 10 Stunden Spielzeit
//   node tools/balance.js --stunden=40     länger simulieren
//   node tools/balance.js --treffer=0.7 --tipps=4 --seed=3
import { newState, finishVideo, buyGear, buyHouse, tick } from '../js/core/game.js';
import { startRecording, stepRecording, hitLetter, startCut, tapCut } from '../js/core/video.js';
import { openCrate } from '../js/core/crates.js';
import { nextGear, nextHouse, houseIndex, uploadSeconds, topicUnlocked } from '../js/core/formulas.js';
import { GEAR_CATS } from '../js/data/gear.js';
import { HOUSES } from '../js/data/houses.js';
import { AWARDS } from '../js/data/awards.js';
import { TOPICS } from '../js/data/topics.js';
import { BALANCE as B } from '../js/data/balance.js';
import { fmt, eur, fmtTime } from '../js/core/format.js';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Wählt das Thema mit den meisten Punkten pro Sekunde (Geld und Abos zählen mit).
function bestTopic(S) {
  return TOPICS.filter(t => topicUnlocked(S, t))
    .sort((a, b) => (b.points / b.pace) * (b.money + b.subs) - (a.points / a.pace) * (a.money + a.subs))[0];
}

// Kauft das Haus, sobald es geht, sonst das günstigste nächste Gerät.
// Spart aber, wenn das nächste Haus schon fast bezahlbar ist.
function shop(S) {
  for (let n = 0; n < 50; n++) {
    if (buyHouse(S)) continue;
    const house = nextHouse(S);
    const options = GEAR_CATS.map(c => nextGear(S, c.id) && { cat: c.id, item: nextGear(S, c.id) })
      .filter(o => o && o.item.house <= houseIndex(S) && o.item.price <= S.money)
      .sort((a, b) => a.item.price - b.item.price);
    const pick = options[0];
    if (!pick) return;
    if (house && S.money - pick.item.price < house.price * 0.6 && S.money >= house.price * 0.6) return;
    buyGear(S, pick.cat);
  }
}

function crates(S, rng) {
  const order = ['teile', 'board', 'teile', 'gold'];
  for (let i = 0; i < 20; i++) {
    if (!openCrate(S, order[(S.stats.crates) % order.length], rng)) return;
  }
}

export function simulate({ hours = 10, hitRate = 0.85, tapsPerSec = 6, think = 4, seed = 1 } = {}) {
  const S = newState(0), rng = mulberry32(seed);
  const log = { houses: { 0: 0 }, awards: {}, subsAt: {}, videos: 0 };
  let t = 0;
  const end = hours * 3600;
  const advance = sec => {
    for (let s = 0; s < sec; s += 1) {
      for (const a of tick(S, Math.min(1, sec - s))) log.awards[a.id] = t + s;
    }
    t += sec;
  };
  while (t < end) {
    const topic = bestTopic(S);
    // Aufnahme
    const rec = startRecording(topic.id);
    const plan = new Map();
    while (rec.left > 0) {
      for (const e of stepRecording(rec, 0.1, rng)) if (e.type === 'spawn') plan.set(e.letter.id, rng() < hitRate);
      for (const l of [...rec.letters]) if (l.age >= 0.6 && plan.get(l.id)) hitLetter(S, rec, l.id);
    }
    // Schnitt
    const cut = startCut();
    for (let i = 0; i < Math.round(tapsPerSec * B.cutSeconds); i++) tapCut(S, cut);
    // Upload
    const time = think + B.recordSeconds + B.cutSeconds + uploadSeconds(S);
    advance(time);
    const r = finishVideo(S, { topic, points: rec.points, quality: cut.quality });
    for (const a of r.awards) log.awards[a.id] = t;
    log.videos++;
    const before = houseIndex(S);
    shop(S);
    if (houseIndex(S) > before) for (let i = before + 1; i <= houseIndex(S); i++) log.houses[i] = t;
    crates(S, rng);
  }
  log.state = S;
  return log;
}

function report(log, hours) {
  console.log('\n  Häuser:');
  HOUSES.forEach((h, i) => {
    if (i === 0) return;
    const at = log.houses[i];
    console.log(`    ${String(i + 1).padStart(2)}. ${h.name.padEnd(20)} ${eur(h.price).padStart(14)}   ${at != null ? fmtTime(at) : '—'}`);
  });
  console.log('\n  Awards:');
  for (const a of AWARDS) {
    const at = log.awards[a.id];
    console.log(`    ${a.name.padEnd(24)} ${fmt(a.subs).padStart(10)} Abos   ${at != null ? fmtTime(at) : '—'}`);
  }
  const S = log.state;
  console.log(`\n  Nach ${hours} h: ${fmt(log.videos)} Videos, ${eur(S.money)}, ${fmt(S.subs)} Abos, ${S.gems} 💎, ${S.stats.crates} Kisten geöffnet`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const hours = Number(args.stunden ?? 10);
  const opts = { hours, hitRate: Number(args.treffer ?? 0.85), tapsPerSec: Number(args.tipps ?? 6), seed: Number(args.seed ?? 1) };
  console.log(`Vlogvilla · Balancing (Treffer ${opts.hitRate * 100} %, ${opts.tapsPerSec} Tipper/s, Seed ${opts.seed})`);
  report(simulate(opts), hours);
}
