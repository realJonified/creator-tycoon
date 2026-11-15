// Ein Video in drei Schritten: Aufnahme (Buchstaben antippen), Schnitt (viel tippen), Upload.
// Reine Logik ohne DOM. Die Szene js/scenes/video.js zeichnet nur.
import { BALANCE as B } from '../data/balance.js';
import { TOPICS } from '../data/topics.js';
import { recordPower, cutPower, findTopic } from './formulas.js';

const CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ';

// ---------- Aufnahme ----------
export function startRecording(topicId) {
  const topic = findTopic(topicId) || TOPICS[0];
  return { topic, left: B.recordSeconds, spawnIn: 0.3, letters: [], nextId: 1, points: 0, hits: 0, misses: 0, combo: 0, bestCombo: 0 };
}

// Lässt die Zeit laufen: neue Buchstaben, verpasste Buchstaben. Gibt Vorkommnisse zurück.
export function stepRecording(rec, dt, rng = Math.random) {
  const events = [];
  if (rec.left <= 0) return events;
  rec.left -= dt;
  for (const l of rec.letters) l.age += dt;
  for (const l of rec.letters.filter(l => l.age >= B.letterLife)) {
    rec.misses++; rec.combo = 0;
    events.push({ type: 'miss', letter: l });
  }
  rec.letters = rec.letters.filter(l => l.age < B.letterLife);
  rec.spawnIn -= dt;
  while (rec.spawnIn <= 0 && rec.left > 0) {
    const letter = { id: rec.nextId++, char: CHARS[Math.floor(rng() * CHARS.length)], x: 6 + rng() * 80, y: 8 + rng() * 72, age: 0 };
    rec.letters.push(letter);
    rec.spawnIn += B.letterEvery * (rec.topic.pace || 1);
    events.push({ type: 'spawn', letter });
  }
  if (rec.left <= 0) {
    rec.left = 0;
    rec.letters = [];
    events.push({ type: 'end' });
  }
  return events;
}

export const letterValue = (S, rec) =>
  B.letterPoints * recordPower(S) * (rec.topic.points || 1) * (1 + Math.min(rec.combo, B.comboMax) * B.comboStep);

// Trifft einen Buchstaben (nach id). Gibt die Punkte zurück oder 0.
export function hitLetter(S, rec, id) {
  const i = rec.letters.findIndex(l => l.id === id);
  if (i < 0 || rec.left <= 0) return 0;
  rec.letters.splice(i, 1);
  const pts = letterValue(S, rec);
  rec.combo++;
  rec.bestCombo = Math.max(rec.bestCombo, rec.combo);
  rec.hits++;
  rec.points += pts;
  return pts;
}

// Tastatur: trifft den ältesten Buchstaben mit diesem Zeichen.
export function hitChar(S, rec, char) {
  const c = String(char || '').toUpperCase();
  const l = rec.letters.filter(x => x.char === c).sort((a, b) => b.age - a.age)[0];
  return l ? { id: l.id, points: hitLetter(S, rec, l.id) } : null;
}

// ---------- Schnitt ----------
// Stufen, die beim Tippen freigeschaltet werden (nur Anzeige). Neue Stufe = eine neue Zeile.
export const CUT_STEPS = [
  { at: 0.25, icon: '✂️', label: 'Schnitte' },
  { at: 0.5,  icon: '✨', label: 'Effekte' },
  { at: 0.75, icon: '🎵', label: 'Musik' },
  { at: 1,    icon: '🎬', label: 'Intro' },
  { at: 1.5,  icon: '🌈', label: 'Farben' },
  { at: 2,    icon: '💎', label: 'Meisterwerk' },
];

export const startCut = () => ({ left: B.cutSeconds, taps: 0, quality: 0 });

export function tapCut(S, cut) {
  if (cut.left <= 0) return null;
  const before = cut.quality;
  cut.taps++;
  cut.quality = Math.min(B.qualityCap, cut.quality + cutPower(S) / B.cutNeed);
  return CUT_STEPS.find(s => before < s.at && cut.quality >= s.at) || null;
}

export function stepCut(cut, dt) {
  cut.left = Math.max(0, cut.left - dt);
  return cut.left === 0;
}
