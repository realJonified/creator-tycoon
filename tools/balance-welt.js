// Balancing der 3D-Welt (Kanalbucht): simuliert einen aktiven Spieler und einen, der oft offline ist.
// Benutzt dieselbe Logik wie das Spiel (js3d/core/*) und alle Zahlen aus js3d/data/balance.js.
//
//   node tools/balance-welt.js                nur Ergebnis-Tabelle
//   node tools/balance-welt.js --verlauf      zusätzlich Verlauf alle 30 Minuten
//   node tools/balance-welt.js --seed=3 --treffer=0.75 --tipps=5
//
// ======================= ZIELE (hier ändern) =======================
export const TARGETS = {
  map1MinHours: 3,      // Map 1 komplett (alle Häuser) frühestens nach … Stunden aktiver Spielzeit
  map1MaxHours: 6,      // … und spätestens nach … Stunden
  map2GapMinHours: 2,   // 1 Billion für Map 2 frühestens … Stunden nach Abschluss von Map 1
  map2GapMaxHours: 12,  // … und spätestens nach … Stunden ("nicht praktisch unmöglich")
};
// Spielermodell
export const PLAYER = {
  hitRate: 0.85,        // getroffene Buchstaben
  tapsPerSec: 6,        // Tipper pro Sekunde im Schnitt
  overheadSec: 8,       // Spiel wählen, Ergebnis ansehen, kurze Wege
  bossWinRate: 0.85,    // Anteil gewonnener Bosskämpfe
  bossSeconds: 45,      // Hinlaufen + Kampf + Kiste
  bossWalkSec: 15,      // davon Wege (Haus → Portal → zurück) zu Fuss, rennend mit Tempo runSpeed
  runSpeed: 10,
  partBudget: 0.04,     // PC-Teile nur kaufen, wenn sie unter diesem Anteil des nächsten Ziels kosten (alle 6 zusammen ≈ halber Zielpreis)
  // Gelegenheitsspieler: spielt sessionMin aktiv, ist dann offlineHours weg
  sessionMin: 20,
  offlineHours: 3,
};
// ===================================================================

import { W } from '../js3d/data/balance.js';
import { MAPS, findMap } from '../js3d/data/maps.js';
import { GAMES, BUTTONS } from '../js3d/data/content.js';
import {
  newState, finishVideo, tickEconomy, tickPortal, portalIsOpen, uploadSeconds, gameUnlocked,
  buyHouse, nextHouse, unlockMap, nextLockedMap, buyPart, partPrice, applyOffline, moneyPerSec,
} from '../js3d/core/economy.js';
import { startRecording, stepRecording, hitLetter, startCut, tapCut } from '../js3d/core/video.js';
import { openChest } from '../js3d/core/rewards.js';
import { PARTS } from '../js3d/data/content.js';
import { findBoard } from '../js3d/core/board.js';
import { fmt, eur, fmtTime } from '../js/core/format.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const bestGame = S => GAMES.filter(g => gameUnlocked(S, g)).sort((a, b) => (b.points / b.pace) * b.money - (a.points / a.pace) * a.money)[0];

// Einkaufen: Haus > Map > Teile (Teile nur, wenn sie im Verhältnis zum nächsten Ziel günstig sind).
function shop(S, log, t) {
  for (let n = 0; n < 200; n++) {
    const house = nextHouse(S, S.map);
    if (house && buyHouse(S, house.id)) { log.houses[house.id] = t; continue; }
    const map1Done = !nextHouse(S, 'bucht');
    const lock = nextLockedMap(S);
    if (map1Done && log.map1Done == null) log.map1Done = t;
    if (map1Done && lock?.ready && unlockMap(S, lock.id)) { log.maps[lock.id] = t; S.map = lock.id; continue; }
    const goal = house ? house.price : lock?.ready ? lock.unlock : Infinity;
    const cheapest = PARTS.map(p => ({ id: p.id, price: partPrice(S, p.id) })).sort((a, b) => a.price - b.price)[0];
    if (cheapest.price <= goal * PLAYER.partBudget && buyPart(S, cheapest.id)) continue;
    return;
  }
}

// Zeit vergehen lassen (in 1-s-Schritten): Einnahmen, Play-Buttons, Portal
function advance(S, log, clock, seconds) {
  for (let s = 0; s < seconds; s++) {
    for (const b of tickEconomy(S, 1)) log.buttons[b.id] = clock.active + s;
    if (tickPortal(S, 1) === 'open') clock.portal = true;
  }
  clock.active += seconds; clock.wall += seconds;
}

function playVideo(S, rng) {
  const game = bestGame(S);
  const rec = startRecording(game.id), plan = new Map();
  while (rec.left > 0) {
    for (const e of stepRecording(rec, 0.1, rng)) if (e.type === 'spawn') plan.set(e.letter.id, rng() < PLAYER.hitRate);
    for (const l of [...rec.letters]) if (l.age >= 0.6 && plan.get(l.id)) hitLetter(rec, l.id);
  }
  const cut = startCut();
  for (let i = 0; i < Math.round(PLAYER.tapsPerSec * W.cutSeconds); i++) tapCut(S, cut);
  const seconds = Math.round(PLAYER.overheadSec + W.recordSeconds + W.cutSeconds + uploadSeconds(S));
  return { seconds, video: { points: rec.points, quality: cut.quality, game } };
}

// board = id eines Hoverboards: Wege werden kürzer (Tempo Board statt Rennen). Geld pro Video bleibt gleich.
export function simulate({ hours = 40, seed = 1, casual = false, board = null } = {}) {
  const S = newState(0), rng = mulberry32(seed);
  const b = board ? findBoard(board) : null;
  const bossSeconds = Math.round(PLAYER.bossSeconds - PLAYER.bossWalkSec * (b ? 1 - PLAYER.runSpeed / b.speed : 0));
  const log = { houses: {}, maps: {}, buttons: {}, map1Done: null, wallAt: {}, videos: 0, bosses: 0, marks: [] };
  const clock = { active: 0, wall: 0, portal: false };
  let sessionLeft = PLAYER.sessionMin * 60;
  while (clock.active < hours * 3600) {
    const { seconds, video } = playVideo(S, rng);
    advance(S, log, clock, seconds);
    for (const b of finishVideo(S, video).buttons) log.buttons[b.id] = clock.active;
    log.videos++;
    if (clock.portal) {      // Portal offen: Bosskampf
      clock.portal = false;
      advance(S, log, clock, bossSeconds);
      if (rng() < PLAYER.bossWinRate) openChest(S, rng);
      log.bosses++;
    }
    const before = { ...log.houses, ...log.maps };
    shop(S, log, clock.active);
    for (const k of Object.keys({ ...log.houses, ...log.maps })) if (!(k in before)) log.wallAt[k] = clock.wall;
    if (log.map1Done != null && log.wallAt.map1 == null) log.wallAt.map1 = clock.wall;
    if (casual && (sessionLeft -= seconds) <= 0) {   // Gelegenheitsspieler geht offline
      const off = PLAYER.offlineHours * 3600;
      applyOffline(S, off);
      clock.wall += off;
      sessionLeft = PLAYER.sessionMin * 60;
    }
    if (log.marks.length < clock.active / 1800 - 1) log.marks.push({ t: clock.active, money: S.money, subs: S.subs, rate: moneyPerSec(S) });
  }
  log.state = S;
  return log;
}

// Mittelwert über mehrere Startwerte (für den Hoverboard-Vergleich, auch im Test benutzt)
export const BOARD_SEEDS = 20;
export function averageRun(board, seeds = BOARD_SEEDS) {
  const runs = Array.from({ length: seeds }, (_, i) => checkTargets(simulate({ seed: i + 1, board, hours: TARGETS.map1MaxHours + TARGETS.map2GapMaxHours })));
  const mean = k => runs.reduce((a, c) => a + c[k], 0) / runs.length;
  const map1 = mean('map1'), map2 = mean('map2'), gap = map2 - map1;
  return {
    map1, map2,
    // Ziele für den Durchschnitt; dazu der Anteil der Läufe im Ziel (Ausreisser = viel Kistenglück)
    ok: map1 >= TARGETS.map1MinHours * 3600 && map1 <= TARGETS.map1MaxHours * 3600 && gap >= TARGETS.map2GapMinHours * 3600 && gap <= TARGETS.map2GapMaxHours * 3600,
    share: runs.filter(c => c.map1Ok && c.gapOk).length / runs.length,
  };
}

// Prüft die Ziele (wird auch vom Test benutzt). Zeiten in Sekunden aktiver Spielzeit.
export function checkTargets(log) {
  const m1 = log.map1Done, m2 = log.maps.lagune;
  return {
    map1: m1, map2: m2, gap: m1 != null && m2 != null ? m2 - m1 : null,
    map1Ok: m1 != null && m1 >= TARGETS.map1MinHours * 3600 && m1 <= TARGETS.map1MaxHours * 3600,
    gapOk: m1 != null && m2 != null && m2 - m1 >= TARGETS.map2GapMinHours * 3600 && m2 - m1 <= TARGETS.map2GapMaxHours * 3600,
  };
}

function table(title, log, showWall) {
  const T = s => (s == null ? '—' : fmtTime(s));
  console.log(`\n${title}  (${fmt(log.videos)} Videos, ${log.bosses} Bosskämpfe)`);
  console.log('  Meilenstein                        Preis/Abos     aktiv' + (showWall ? '        echte Zeit' : ''));
  const row = (name, val, t, wall) => console.log(`  ${name.padEnd(34)} ${val.padStart(12)}  ${T(t).padStart(10)}${showWall ? '  ' + T(wall).padStart(14) : ''}`);
  for (const m of MAPS.filter(m => m.ready)) {
    if (m.unlock) row(`🗺️  ${m.name} freigeschaltet`, eur(m.unlock), log.maps[m.id], log.wallAt[m.id]);
    for (const h of m.houses) if (h.price) row(`🏠 ${h.name}`, eur(h.price), log.houses[h.id], log.wallAt[h.id]);
    if (m.id === 'bucht') row('✅ Map 1 komplett', '', log.map1Done, log.wallAt.map1);
  }
  for (const b of BUTTONS) row(`⭐ ${b.name}`, fmt(b.subs) + ' Abos', log.buttons[b.id]);
  const c = checkTargets(log);
  console.log(`  Ziel Map 1 in ${TARGETS.map1MinHours}–${TARGETS.map1MaxHours} h: ${c.map1Ok ? '✔' : '✘'} (${T(c.map1)})   Ziel 1 Bio. ${TARGETS.map2GapMinHours}–${TARGETS.map2GapMaxHours} h danach: ${c.gapOk ? '✔' : '✘'} (${T(c.gap)})`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
  if (args.treffer) PLAYER.hitRate = Number(args.treffer);
  if (args.tipps) PLAYER.tapsPerSec = Number(args.tipps);
  const seed = Number(args.seed ?? 1);
  console.log(`Kanalbucht · Balancing (Seed ${seed}, Treffer ${PLAYER.hitRate * 100} %, ${PLAYER.tapsPerSec} Tipper/s)`);
  const active = simulate({ seed });
  table('AKTIVER SPIELER', active, false);
  if (args.verlauf) for (const m of active.marks) console.log(`    ${fmtTime(m.t).padEnd(12)} ${eur(m.money).padStart(14)} ${fmt(m.subs).padStart(12)} Abos ${eur(m.rate).padStart(12)}/s`);
  table(`OFT OFFLINE (${PLAYER.sessionMin} min spielen, ${PLAYER.offlineHours} h weg)`, simulate({ seed, casual: true }), true);
  // Hoverboard: bringt kein Geld, verkürzt nur Wege. Wie viel schneller wird man dadurch insgesamt?
  // Mittel über 20 Startwerte: Schon ein anderer Bosskampf-Zeitpunkt verschiebt die Zufallsfolge (Kisten),
  // und dieses Glück wiegt mehr als die paar Sekunden, die das Board spart.
  console.log(`\nMIT HOVERBOARD (Wege zum Portal kürzer, Geld pro Video gleich; Mittel aus ${BOARD_SEEDS} Startwerten)`);
  const avg = averageRun;
  const base = avg(null);
  const faster = ratio => { const p = (1 - ratio) * 100; return `${Math.abs(p).toFixed(1).replace('.', ',')} % ${p >= 0 ? 'schneller' : 'langsamer'}`; };
  console.log(`  ${'zu Fuss'.padEnd(14)} Map 1 ${fmtTime(base.map1).padStart(10)}                       1 Bio. ${fmtTime(base.map2).padStart(10)}                    Ziele im Mittel ${base.ok ? '✔' : '✘'} (${Math.round(base.share * 100)} % der Läufe)`);
  for (const id of ['kiesel', 'sternenstaub']) {
    const c = avg(id);
    console.log(`  ${findBoard(id).name.padEnd(14)} Map 1 ${fmtTime(c.map1).padStart(10)} (${faster(c.map1 / base.map1)})   1 Bio. ${fmtTime(c.map2).padStart(10)} (${faster(c.map2 / base.map2)})   Ziele im Mittel ${c.ok ? '✔' : '✘'} (${Math.round(c.share * 100)} % der Läufe)`);
  }
}
