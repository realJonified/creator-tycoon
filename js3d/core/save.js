// Speichern der 3D-Welt: eigener Schlüssel mit Versionsnummer und Migration.
// Beim ersten Start werden Geld und Abonnenten aus den 2D-Spielständen übernommen.
import { W } from '../data/balance.js';
import { PARTS, HOUSES, BUTTONS, GAMES, CHARMS, REMOVED_V1_HOUSES } from '../data/content.js';
import { MAPS } from '../data/maps.js';
import { newState, VERSION } from './economy.js';

// Der Schlüssel bleibt gleich, die Version steht im Spielstand selbst (Feld v).
export const SAVE_KEY = 'kanalbuchtSave_v1';
// Ältere 2D-Spielstände, neueste zuerst. Daraus werden Geld und Abos übernommen.
export const LEGACY_KEYS = ['vlogvillaSave_v3', 'creatorTycoonSave_v2', 'creatorTycoonSave_v1'];

const num = (x, fb = 0) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.min(x, W.maxValue) : fb);

const MIGRATIONS = {
  // Version 1 → 2 (Update 2, Maps): Häuser waren eine Liste und lagen alle auf der Insel.
  // Jetzt: Häuser pro Map. Häuser ab Nummer 6 gibt es auf Map 1 nicht mehr → Kaufpreis zurück.
  1: d => {
    const old = Array.isArray(d.houses) ? d.houses : [];
    const map1 = new Set(MAPS[0].houses.map(h => h.id));
    const refund = [...new Set(old)].reduce((s, id) => s + (REMOVED_V1_HOUSES[id] || 0), 0);
    const kept = old.filter(id => map1.has(id));
    return {
      ...d,
      money: num(d.money) + refund,
      maps: ['bucht'], map: 'bucht',
      houses: { bucht: kept },
      home: kept.includes(d.home) ? d.home : undefined,
      migratedRefund: refund,
    };
  },
};

export function sanitize(d, now = Date.now()) {
  const S = newState(now);
  S.money = num(d.money); S.subs = num(d.subs); S.views = num(d.views); S.videos = Math.floor(num(d.videos));
  for (const p of PARTS) S.parts[p.id] = Math.floor(num(d.parts?.[p.id]));
  // Maps: Map 1 ist immer frei. Nur bekannte Maps, in ihrer Reihenfolge.
  const wanted = new Set(['bucht', ...(Array.isArray(d.maps) ? d.maps : [])]);
  S.maps = MAPS.filter(m => wanted.has(m.id)).map(m => m.id);
  S.map = S.maps.includes(d.map) ? d.map : 'bucht';
  // Häuser pro Map: nur Häuser, die wirklich auf dieser Map stehen. Die Wohnung gehört immer dazu.
  S.houses = {};
  for (const m of MAPS) {
    if (!S.maps.includes(m.id)) continue;
    const ids = new Set(m.houses.map(h => h.id));
    const list = Array.isArray(d.houses?.[m.id]) ? d.houses[m.id] : [];
    S.houses[m.id] = [...new Set(m.id === 'bucht' ? ['wohnung', ...list] : list)].filter(id => ids.has(id));
  }
  const owned = Object.values(S.houses).flat();
  S.home = owned.includes(d.home) ? d.home : owned.reduce((best, id) => (HOUSES.findIndex(h => h.id === id) > HOUSES.findIndex(h => h.id === best) ? id : best), 'wohnung');
  if (num(d.migratedRefund) > 0) S.migratedRefund = num(d.migratedRefund); // nur zur Anzeige nach dem Update
  const btn = new Set(BUTTONS.map(b => b.id));
  S.buttons = [...new Set(Array.isArray(d.buttons) ? d.buttons : [])].filter(id => btn.has(id));
  for (const c of CHARMS) { const n = Math.floor(num(d.charms?.[c.id])); if (n > 0) S.charms[c.id] = n; }
  S.portal.in = Math.min(W.portalEvery, num(d.portal?.in, W.portalEvery));
  S.portal.open = Math.min(W.portalOpen, num(d.portal?.open));
  S.lastGame = GAMES.some(g => g.id === d.lastGame) ? d.lastGame : S.lastGame;
  for (const k of Object.keys(S.stats)) S.stats[k] = num(d.stats?.[k]);
  S.settings.sound = d.settings?.sound === true;
  S.settings.graphics = ['auto', 'niedrig', 'mittel', 'hoch'].includes(d.settings?.graphics) ? d.settings.graphics : 'auto';
  S.settings.fps = d.settings?.fps === true;
  S.settings.sensitivity = Math.min(3, Math.max(0.3, num(d.settings?.sensitivity, 1)));
  if (d.player && Number.isFinite(d.player.x) && Number.isFinite(d.player.z)) {
    S.player = { x: d.player.x, z: d.player.z, yaw: Number.isFinite(d.player.yaw) ? d.player.yaw : 0 };
  }
  S.tutorialDone = !!d.tutorialDone;
  S.last = num(d.last, now) || now;
  return S;
}

export function migrate(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Das ist kein gültiger Spielstand.');
  let d = JSON.parse(JSON.stringify(raw));
  let v = Number.isInteger(d.v) ? d.v : 1; // ohne Versionsnummer = Version 1
  if (v > VERSION) throw new Error('Der Spielstand stammt aus einer neueren Version.');
  while (v < VERSION) { d = MIGRATIONS[v](d); d.v = ++v; }
  return sanitize(d, now);
}

// Aus einem 2D-Spielstand (egal welche Version) werden Geld und Abonnenten übernommen.
export function fromLegacy(raw, now = Date.now()) {
  const S = newState(now);
  S.money = num(raw?.money);
  S.subs = num(raw?.subs);
  S.videos = Math.floor(num(raw?.videos));
  S.stats.videos = S.videos;
  S.tutorialDone = false;
  return S;
}

const read = (st, k) => { try { return st.getItem(k); } catch { return null; } };

// source: 'welt' (eigener Stand), ein Legacy-Schlüssel (übernommen) oder 'new'.
export function loadWorld(storage, now = Date.now()) {
  const own = read(storage, SAVE_KEY);
  if (own) {
    try { return { state: migrate(JSON.parse(own), now), source: 'welt' }; }
    catch { try { storage.setItem(SAVE_KEY + '_defekt', own); } catch { /* egal */ } }
  }
  for (const key of LEGACY_KEYS) {
    const text = read(storage, key);
    if (!text) continue;
    try { return { state: fromLegacy(JSON.parse(text), now), source: key }; } catch { /* nächster */ }
  }
  return { state: newState(now), source: 'new' };
}

export function saveWorld(storage, S, now = Date.now()) {
  S.last = now;
  try { storage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch { return false; }
}
