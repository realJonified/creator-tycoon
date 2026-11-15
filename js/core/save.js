// Speichern und Laden mit Versionsnummer und Migration.
// Neue Version? VERSION in game.js erhöhen und hier eine Migration "alt -> neu" ergänzen.
import { BALANCE as B } from '../data/balance.js';
import { AWARDS } from '../data/awards.js';
import { GEAR } from '../data/gear.js';
import { HOUSES } from '../data/houses.js';
import { BOARDS, PARTS } from '../data/crates.js';
import { TOPICS } from '../data/topics.js';
import { newState, VERSION } from './game.js';

export const SAVE_KEY = 'vlogvillaSave_v3';
export const LEGACY_KEYS = [['creatorTycoonSave_v2', 'v2'], ['creatorTycoonSave_v1', 'v1']];
const EXPORT_PREFIX = 'VV:';

const num = (x, fallback = 0) =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.min(x, B.maxValue) : fallback;

function countMap(obj, known) {
  const out = {};
  if (obj && typeof obj === 'object') {
    for (const [id, n] of Object.entries(obj)) {
      const v = Math.floor(num(n));
      if (v > 0 && (!known || known.has(id))) out[id] = v;
    }
  }
  return out;
}
const sumCounts = obj => Object.values(countMap(obj)).reduce((a, b) => a + b, 0);

const MIGRATIONS = {
  // v1 (erste Version): { money, subs, videos, up, w, awards: [Index], last }
  1: d => ({
    money: d.money, subs: d.subs, videos: d.videos, up: d.up, w: d.w,
    stats: { videos: d.videos, bestSubs: d.subs }, tutorialDone: true, last: d.last,
  }),
  // v2 (Szenen-Umbau): Geld, Abos, Videos bleiben. Ausrüstung, Team und Ruhm gibt es nicht
  // mehr. Als Ausgleich gibt es Juwelen: 5 pro gekaufter Stufe/Person und 20 pro Ruhm-Punkt.
  2: d => ({
    money: d.money, subs: d.subs, videos: d.videos,
    gems: B.startGems + Math.min(1000, 5 * (sumCounts(d.up) + sumCounts(d.w)) + 20 * num(d.fameTotal)),
    stats: { videos: num(d.stats?.videos, num(d.videos)), earned: num(d.stats?.earned), bestSubs: num(d.stats?.bestSubs, num(d.subs)), seconds: num(d.stats?.seconds) },
    settings: d.settings, tutorialDone: d.tutorialDone ?? true, last: d.last,
  }),
};

// Baut aus beliebigen Daten einen vollständigen, gültigen Zustand der aktuellen Version.
export function sanitize(d, now = Date.now()) {
  const S = newState(now);
  S.money = num(d.money); S.subs = num(d.subs); S.views = num(d.views);
  S.videos = Math.floor(num(d.videos));
  S.gems = Math.floor(num(d.gems, S.gems));
  S.house = Math.min(HOUSES.length - 1, Math.floor(num(d.house)));
  for (const cat of Object.keys(GEAR)) S.gear[cat] = Math.min(GEAR[cat].length - 1, Math.floor(num(d.gear?.[cat])));
  S.boards = countMap(d.boards, new Set(BOARDS.map(b => b.id)));
  S.parts = countMap(d.parts, new Set(PARTS.map(p => p.id)));
  S.board = typeof d.board === 'string' && S.boards[d.board] > 0 ? d.board : null;
  const known = new Set(AWARDS.map(a => a.id));
  // Awards zählen nach Abos: wer genug Abos hat, behält den Award (auch aus alten Versionen).
  S.awards = [...new Set(Array.isArray(d.awards) ? d.awards : [])].filter(id => known.has(id));
  S.lastTopic = TOPICS.some(t => t.id === d.lastTopic) ? d.lastTopic : S.lastTopic;
  for (const key of Object.keys(S.stats)) S.stats[key] = num(d.stats?.[key]);
  S.stats.bestSubs = Math.max(S.stats.bestSubs, S.subs);
  S.stats.videos = Math.max(S.stats.videos, S.videos);
  S.settings.sound = d.settings?.sound === true;
  S.settings.anim = d.settings?.anim !== false;
  S.tutorialDone = !!d.tutorialDone;
  S.last = num(d.last, now) || now;
  return S;
}

// Hebt einen Spielstand beliebiger alter Version auf die aktuelle. Wirft bei unbrauchbaren Daten.
export function migrate(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Das ist kein gültiger Spielstand.');
  let d = JSON.parse(JSON.stringify(raw));
  let v = Number.isInteger(d.v) ? d.v : 1;
  if (v > VERSION) throw new Error('Der Spielstand stammt aus einer neueren Version des Spiels.');
  while (v < VERSION) {
    if (!MIGRATIONS[v]) throw new Error(`Für Version ${v} gibt es keine Migration.`);
    d = MIGRATIONS[v](d);
    d.v = ++v;
  }
  return sanitize(d, now);
}

function read(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

// Lädt den neuesten vorhandenen Spielstand. source: "v3", "v2", "v1" (migriert) oder "new".
export function loadGame(storage, now = Date.now()) {
  for (const [key, source] of [[SAVE_KEY, 'v3'], ...LEGACY_KEYS]) {
    const text = read(storage, key);
    if (!text) continue;
    try {
      return { state: migrate(JSON.parse(text), now), source };
    } catch {
      try { storage.setItem(key + '_defekt', text); } catch { /* voll oder gesperrt */ }
    }
  }
  return { state: newState(now), source: 'new' };
}

export function saveGame(storage, S, now = Date.now()) {
  S.last = now;
  try { storage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch { return false; }
}

export function exportSave(S) {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return EXPORT_PREFIX + btoa(bin);
}

export function importSave(text, now = Date.now()) {
  const t = String(text || '').trim();
  if (!t) throw new Error('Bitte füge zuerst einen Spielstand ein.');
  let json = t;
  const prefix = ['VV:', 'CT:'].find(p => t.startsWith(p));
  if (prefix) {
    let bin;
    try { bin = atob(t.slice(prefix.length).replace(/\s+/g, '')); } catch { throw new Error('Der Text ist unvollständig oder beschädigt.'); }
    json = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  let data;
  try { data = JSON.parse(json); } catch { throw new Error('Der Text ist kein Spielstand.'); }
  return migrate(data, now);
}
