// Video-Minispiel ohne DOM: Aufnahme (Buchstaben rechtzeitig drücken) und Schnitt (viel tippen).
import { W } from '../data/balance.js';
import { GAMES } from '../data/content.js';
import { cutPower, findGame } from './economy.js';

const CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export function startRecording(gameId) {
  const game = findGame(gameId) || GAMES[0];
  return { game, left: W.recordSeconds, spawnIn: 0.4, letters: [], nextId: 1, points: 0, hits: 0, misses: 0, combo: 0 };
}

export function stepRecording(rec, dt, rng = Math.random) {
  const events = [];
  if (rec.left <= 0) return events;
  rec.left -= dt;
  for (const l of rec.letters) l.age += dt;
  for (const l of rec.letters.filter(l => l.age >= W.letterLife)) { rec.misses++; rec.combo = 0; events.push({ type: 'miss', letter: l }); }
  rec.letters = rec.letters.filter(l => l.age < W.letterLife);
  rec.spawnIn -= dt;
  while (rec.spawnIn <= 0 && rec.left > 0) {
    const letter = { id: rec.nextId++, char: CHARS[Math.floor(rng() * CHARS.length)], x: 8 + rng() * 78, y: 12 + rng() * 66, age: 0 };
    rec.letters.push(letter);
    rec.spawnIn += W.letterEvery * (rec.game.pace || 1);
    events.push({ type: 'spawn', letter });
  }
  if (rec.left <= 0) { rec.left = 0; rec.letters = []; events.push({ type: 'end' }); }
  return events;
}

export const letterValue = rec => W.letterPoints * (rec.game.points || 1) * (1 + Math.min(rec.combo, W.comboMax) * W.comboStep);

export function hitLetter(rec, id) {
  const i = rec.letters.findIndex(l => l.id === id);
  if (i < 0 || rec.left <= 0) return 0;
  rec.letters.splice(i, 1);
  const pts = letterValue(rec);
  rec.combo++; rec.hits++; rec.points += pts;
  return pts;
}

// Tastatur: trifft den ältesten Buchstaben mit diesem Zeichen.
export function hitChar(rec, char) {
  const c = String(char || '').toUpperCase();
  const l = rec.letters.filter(x => x.char === c).sort((a, b) => b.age - a.age)[0];
  return l ? { id: l.id, letter: l, points: hitLetter(rec, l.id) } : null;
}

// Diese Bausteine werden beim Schneiden automatisch eingefügt (nur Anzeige).
export const CUT_PIECES = [
  { at: 0.25, icon: '✂️', label: 'Schnitte' },
  { at: 0.5,  icon: '✨', label: 'Effekte' },
  { at: 0.75, icon: '🎵', label: 'Musik' },
  { at: 1,    icon: '🔤', label: 'Titel' },
  { at: 1.5,  icon: '🌈', label: 'Farben' },
  { at: 2,    icon: '💎', label: 'Meisterwerk' },
];

export const startCut = () => ({ left: W.cutSeconds, taps: 0, quality: 0 });

export function tapCut(S, cut) {
  if (cut.left <= 0) return null;
  const before = cut.quality;
  cut.taps++;
  cut.quality = Math.min(W.qualityCap, cut.quality + cutPower(S) / W.cutNeed);
  return CUT_PIECES.find(p => before < p.at && cut.quality >= p.at) || null;
}

export function stepCut(cut, dt) {
  cut.left = Math.max(0, cut.left - dt);
  return cut.left === 0;
}
