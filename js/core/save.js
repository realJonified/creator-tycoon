// Speichern und Laden mit Versionsnummer und Migration.
// Neue Version? VERSION in game.js erhöhen und hier eine Migration "alt -> neu" ergänzen.
import { BALANCE as B } from '../data/balance.js';
import { AWARDS } from '../data/awards.js';
import { newState, VERSION } from './game.js';

export const SAVE_KEY = 'creatorTycoonSave_v2';
export const LEGACY_KEY = 'creatorTycoonSave_v1';
const EXPORT_PREFIX = 'CT:';

// Version 1 speicherte Awards als Positionen in dieser (damaligen) Reihenfolge.
const V1_AWARD_IDS = ['fans', 'tausend', 'aufsteiger', 'silber', 'gold', 'diamant', 'rubin', 'legende'];

const MIGRATIONS = {
  // v1: { money, subs, videos, up, w, awards: [Index], last }
  1: d => ({
    money: d.money, subs: d.subs, videos: d.videos, up: d.up, w: d.w,
    awards: (Array.isArray(d.awards) ? d.awards : []).map(i => V1_AWARD_IDS[i]).filter(Boolean),
    stats: { videos: d.videos, bestSubs: d.subs },
    tutorialDone: true, // wer schon gespielt hat, braucht kein Tutorial
    last: d.last,
  }),
};

const num = (x, fallback = 0) =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.min(x, B.maxValue) : fallback;

function countMap(obj) {
  const out = {};
  if (obj && typeof obj === 'object') {
    for (const [id, n] of Object.entries(obj)) {
      const v = Math.floor(num(n));
      if (v > 0) out[id] = v;
    }
  }
  return out;
}

// Baut aus beliebigen Daten einen vollständigen, gültigen Zustand der aktuellen Version.
export function sanitize(d, now = Date.now()) {
  const S = newState(now);
  S.money = num(d.money); S.subs = num(d.subs); S.videos = Math.floor(num(d.videos));
  S.up = countMap(d.up); S.w = countMap(d.w);
  const known = new Set(AWARDS.map(a => a.id));
  S.awards = [...new Set(Array.isArray(d.awards) ? d.awards : [])].filter(id => known.has(id));
  S.buffs = (Array.isArray(d.buffs) ? d.buffs : [])
    .filter(b => b && typeof b.id === 'string' && num(b.mult) > 0 && num(b.left) > 0)
    .map(b => ({ id: b.id, icon: String(b.icon || '✨'), label: String(b.label || ''), target: String(b.target || 'money'), mult: b.mult, left: b.left }));
  S.eventIn = num(d.eventIn, S.eventIn);
  S.fame = Math.floor(num(d.fame)); S.fameTotal = Math.max(S.fame, Math.floor(num(d.fameTotal)));
  S.perks = countMap(d.perks); S.prestiges = Math.floor(num(d.prestiges));
  if (d.goals && typeof d.goals.day === 'string' && Array.isArray(d.goals.list)) {
    S.goals = {
      day: d.goals.day, bonus: !!d.goals.bonus,
      list: d.goals.list.filter(g => g && typeof g.id === 'string').map(g => ({
        id: g.id, start: num(g.start), target: num(g.target, 1), done: !!g.done, claimed: !!g.claimed,
      })),
    };
  }
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

// Lädt den neuesten vorhandenen Spielstand. source: "v2", "v1" (migriert) oder "new".
export function loadGame(storage, now = Date.now()) {
  for (const [key, source] of [[SAVE_KEY, 'v2'], [LEGACY_KEY, 'v1']]) {
    const text = read(storage, key);
    if (!text) continue;
    try {
      return { state: migrate(JSON.parse(text), now), source };
    } catch {
      // Defekten Stand nicht stillschweigend überschreiben, sondern beiseitelegen.
      try { storage.setItem(key + '_defekt', text); } catch { /* voll oder gesperrt */ }
    }
  }
  return { state: newState(now), source: 'new' };
}

export function saveGame(storage, S, now = Date.now()) {
  S.last = now;
  try { storage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch { return false; }
}

// Spielstand als Text zum Kopieren (Base64 von JSON).
export function exportSave(S) {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return EXPORT_PREFIX + btoa(bin);
}

// Liest einen exportierten Text (oder rohes JSON) und gibt einen gültigen Zustand zurück.
export function importSave(text, now = Date.now()) {
  const t = String(text || '').trim();
  if (!t) throw new Error('Bitte füge zuerst einen Spielstand ein.');
  let json = t;
  if (t.startsWith(EXPORT_PREFIX)) {
    let bin;
    try { bin = atob(t.slice(EXPORT_PREFIX.length).replace(/\s+/g, '')); } catch { throw new Error('Der Text ist unvollständig oder beschädigt.'); }
    json = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  let data;
  try { data = JSON.parse(json); } catch { throw new Error('Der Text ist kein Spielstand.'); }
  return migrate(data, now);
}
