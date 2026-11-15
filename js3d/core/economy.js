// Wirtschaft der 3D-Welt: Zustand, Preise, Video-Ergebnis, Häuser, Play-Buttons.
// Reine Funktionen ohne three.js und ohne DOM, damit sie in Node getestet werden können.
import { W } from '../data/balance.js';
import { PARTS, HOUSES, BUTTONS, GAMES, CHARMS } from '../data/content.js';
import { MAPS, findMap } from '../data/maps.js';
export { findMap };

export const VERSION = 2; // 2 = Update 2 (Maps)

export function newState(now = Date.now()) {
  return {
    v: VERSION,
    money: 0, subs: 0, views: 0, videos: 0,
    parts: Object.fromEntries(PARTS.map(p => [p.id, 0])),
    maps: ['bucht'], map: 'bucht',
    houses: { bucht: ['wohnung'] }, home: 'wohnung',
    buttons: [], charms: {},
    portal: { in: W.portalEvery, open: 0 },
    lastGame: 'kugel',
    stats: { videos: 0, earned: 0, bossWins: 0, bossLosses: 0, chests: 0, bestVideo: 0, seconds: 0 },
    settings: { sound: false, graphics: 'auto', fps: false, sensitivity: 1 },
    player: { x: 0, z: 19, yaw: 0 },
    tutorialDone: false,
    last: now,
  };
}

const clamp = x => (x > W.maxValue ? W.maxValue : x > 0 ? x : 0);

export function earn(S, money, subs = 0) {
  S.money = clamp(S.money + money);
  S.subs = clamp(S.subs + subs);
  if (money > 0) S.stats.earned = clamp(S.stats.earned + money);
}

// ---------- PC-Teile ----------
export const findPart = id => PARTS.find(p => p.id === id) || null;
export const partLevel = (S, id) => Math.max(0, Math.floor(S.parts?.[id] || 0));
export function partPrice(S, id) {
  const p = findPart(id);
  return p ? Math.ceil(p.base * Math.pow(p.growth, partLevel(S, id))) : Infinity;
}
export function buyPart(S, id) {
  const price = partPrice(S, id);
  if (!Number.isFinite(price) || S.money < price) return false;
  S.money -= price;
  S.parts[id] = partLevel(S, id) + 1;
  return true;
}

// PC-Qualität: 1 + Summe der Stufen × Qualitäts-Plus. Wirkt auf jedes Video.
export const pcQuality = S => 1 + PARTS.reduce((s, p) => s + partLevel(S, p.id) * (p.quality || 0), 0);
// Maus und Tastatur machen jeden Tipper im Schnitt wertvoller.
export const cutPower = S => 1 + PARTS.reduce((s, p) => s + partLevel(S, p.id) * (p.cut || 0), 0);
export const uploadSpeed = S => W.baseMBs * PARTS.reduce((m, p) => m * Math.pow(p.speed || 1, partLevel(S, p.id)), 1);
export const uploadSeconds = S => Math.max(W.minUploadSeconds, W.uploadMB / uploadSpeed(S));

// ---------- Maps ----------
// S.maps = freigeschaltete Maps, S.map = aktuelle Map, S.houses = { mapId: [Haus-ids] }
export const mapUnlocked = (S, id) => S.maps.includes(id);
// Die nächste Map, die man freischalten kann (Maps werden der Reihe nach freigeschaltet).
export const nextLockedMap = S => MAPS.find(m => !S.maps.includes(m.id)) || null;
export function canUnlockMap(S, id) {
  const m = findMap(id), next = nextLockedMap(S);
  return !!(m && next && next.id === id && m.ready && S.money >= m.unlock);
}
export function unlockMap(S, id) {
  if (!canUnlockMap(S, id)) return false;
  const m = findMap(id);
  S.money -= m.unlock;
  S.maps.push(id);
  if (!S.houses[id]) S.houses[id] = [];
  return true;
}

// ---------- Häuser ----------
export const findHouse = id => HOUSES.find(h => h.id === id) || null;
export const houseIndex = id => HOUSES.findIndex(h => h.id === id);
export const ownedHouses = S => Object.values(S.houses).flat();
export const ownsHouse = (S, id) => { const h = findHouse(id); return !!h && (S.houses[h.map] || []).includes(id); };
// Das nächste kaufbare Haus auf einer Map (man kauft pro Map der Reihe nach).
export const nextHouse = (S, mapId = S.map) => (findMap(mapId)?.houses || []).find(h => !ownsHouse(S, h.id)) || null;
export const bestHouseIndex = S => Math.max(0, ...ownedHouses(S).map(houseIndex));
// Jedes Haus über der Wohnung: Aufrufe × 2,5 (mehr Platz, bessere Einrichtung). Gilt über alle Maps.
export const houseMult = S => Math.pow(2.5, bestHouseIndex(S));

export function buyHouse(S, id) {
  const h = findHouse(id);
  if (!h || !mapUnlocked(S, h.map)) return false;
  const next = nextHouse(S, h.map);
  if (!next || next.id !== id || S.money < h.price) return false;
  S.money -= h.price;
  (S.houses[h.map] ||= []).push(id);
  S.home = id;
  return true;
}

// ---------- Play-Buttons und Glücksbringer ----------
export function checkButtons(S) {
  const got = [];
  for (const b of BUTTONS) if (S.subs >= b.subs && !S.buttons.includes(b.id)) { S.buttons.push(b.id); got.push(b); }
  return got;
}
export const charmBonus = S => CHARMS.reduce((s, c) => s + (S.charms[c.id] || 0) * c.bonus, 0);

// ---------- Video ----------
export const findGame = id => GAMES.find(g => g.id === id) || null;
export const gameUnlocked = (S, g) => S.subs >= (g.minSubs || 0);
export const audience = S => 1 + Math.log10(1 + Math.max(0, S.subs)) * W.audienceLog;
export const viewMult = S => houseMult(S) * (1 + S.buttons.length * W.buttonBonus) * (1 + charmBonus(S));

export function videoOutcome(S, { points, quality, game }) {
  const q = Math.max(0, Math.min(W.qualityCap, quality || 0));
  const views = Math.max(0, points || 0) * (W.qualityBase + q) * pcQuality(S) * audience(S) * viewMult(S);
  return {
    views,
    money: views * W.moneyPerView * (game?.money ?? 1),
    subs: W.subsPerView * Math.pow(views, W.subsExp) * (game?.subs ?? 1),
  };
}

// Ungefährer Wert eines normalen Videos (für Belohnungen aus der Boss-Kiste).
export function typicalVideo(S) {
  const game = [...GAMES].reverse().find(g => gameUnlocked(S, g)) || GAMES[0];
  const points = 18 * W.letterPoints * game.points * 1.5; // ~18 Treffer mit Serie
  return videoOutcome(S, { points, quality: 1, game });
}

export function finishVideo(S, { points, quality, game }) {
  const out = videoOutcome(S, { points, quality, game });
  earn(S, out.money, out.subs);
  S.views = clamp(S.views + out.views);
  S.videos++;
  S.stats.videos++;
  S.stats.bestVideo = Math.max(S.stats.bestVideo, out.views);
  S.lastGame = game.id;
  return { ...out, buttons: checkButtons(S) };
}

// ---------- Zeit ----------
export const moneyPerSec = S => Math.max(0, S.subs) * W.passiveViewsPerSub * W.moneyPerView;

export function tickEconomy(S, dt) {
  earn(S, moneyPerSec(S) * dt);
  S.stats.seconds += dt;
  return checkButtons(S);
}

export function applyOffline(S, seconds) {
  const t = Math.min(Math.max(0, seconds || 0), W.offlineMaxSeconds);
  const money = moneyPerSec(S) * t * W.offlineRate;
  if (!(money > 0)) return null;
  earn(S, money);
  return { seconds: t, money };
}

// Portal im Kreisel: Countdown, dann eine Minute offen. Gibt 'open' / 'close' zurück, wenn es wechselt.
export function tickPortal(S, dt) {
  const p = S.portal;
  if (p.open > 0) {
    p.open -= dt;
    if (p.open <= 0) { p.open = 0; p.in = W.portalEvery; return 'close'; }
    return null;
  }
  p.in -= dt;
  if (p.in <= 0) { p.in = 0; p.open = W.portalOpen; return 'open'; }
  return null;
}
export const portalIsOpen = S => S.portal.open > 0;
