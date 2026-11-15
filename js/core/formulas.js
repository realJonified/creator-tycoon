// Alle Formeln des Spiels. Reine Funktionen: lesen den Zustand S, ändern nichts.
import { BALANCE as B } from '../data/balance.js';
import { GEAR, GEAR_CATS } from '../data/gear.js';
import { HOUSES } from '../data/houses.js';
import { AWARDS } from '../data/awards.js';
import { TOPICS } from '../data/topics.js';
import { BOARDS, PARTS, SLOTS } from '../data/crates.js';

// ---------- Geräte ----------
export function gearTier(S, cat) {
  const list = GEAR[cat] || [];
  const t = Math.floor(S.gear?.[cat] || 0);
  return Math.max(0, Math.min(list.length - 1, t));
}
export const gearItem = (S, cat) => GEAR[cat]?.[gearTier(S, cat)] || null;
export const nextGear = (S, cat) => GEAR[cat]?.[gearTier(S, cat) + 1] || null;

export function gearMult(S, effect) {
  let m = 1;
  for (const c of GEAR_CATS) if (c.effect === effect) m *= gearItem(S, c.id)?.mult || 1;
  return m;
}

// ---------- PC-Teile und Hoverboards ----------
export const findPart = id => PARTS.find(p => p.id === id) || null;
export const findBoard = id => BOARDS.find(b => b.id === id) || null;

// Bestes Teil je Steckplatz.
export function bestPart(S, slot) {
  let best = null;
  for (const id of Object.keys(S.parts || {})) {
    const p = findPart(id);
    if (p && p.slot === slot && (S.parts[id] || 0) > 0 && (!best || p.bonus > best.bonus)) best = p;
  }
  return best;
}

export function partBonus(S, effect) {
  let sum = 0;
  for (const s of SLOTS) if (s.effect === effect) sum += bestPart(S, s.id)?.bonus || 0;
  return sum;
}

export function boardBonus(S, type) {
  const b = S.board && (S.boards?.[S.board] || 0) > 0 ? findBoard(S.board) : null;
  return b && b.bonus.type === type ? b.bonus.value : 0;
}

// ---------- Stärken ----------
export const recordPower = S => gearMult(S, 'record') * (1 + partBonus(S, 'record'));
export const cutPower = S => gearMult(S, 'cut') * (1 + partBonus(S, 'cut'));
export const uploadSpeed = S => B.baseUploadMBs * gearMult(S, 'upload') * (1 + partBonus(S, 'upload')) * (1 + boardBonus(S, 'upload'));
export const uploadSeconds = S => Math.max(B.minUploadSeconds, B.uploadSizeMB / uploadSpeed(S));

// ---------- Häuser ----------
export const houseIndex = S => Math.max(0, Math.min(HOUSES.length - 1, Math.floor(S.house || 0)));
export const currentHouse = S => HOUSES[houseIndex(S)];
export const nextHouse = S => HOUSES[houseIndex(S) + 1] || null;
// Haus i bringt × (houseMult + i × houseMultStep). Spätere Häuser bringen also mehr, damit der
// Preis (× 10 pro Haus) nicht irgendwann unerreichbar wird.
export const houseStep = i => B.houseMult + (i - 1) * B.houseMultStep;
export function houseMult(S) {
  let m = 1;
  for (let i = 1; i <= houseIndex(S); i++) m *= houseStep(i);
  return m;
}

// ---------- Awards ----------
export function awardMult(S) {
  let bonus = 0;
  for (const a of AWARDS) if (S.awards.includes(a.id)) bonus += a.bonus ?? B.awardBonus;
  return 1 + bonus;
}
export const nextAward = S => AWARDS.find(a => !S.awards.includes(a.id)) || null;

// ---------- Aufrufe, Geld, Abos ----------
// Reichweite wächst mit dem Logarithmus der Abos. Eine Wurzel würde sich mit dem Hausbonus
// gegenseitig hochschaukeln (siehe docs/ENTSCHEIDUNGEN.md).
export const audience = S => 1 + Math.log10(1 + Math.max(0, S.subs)) * B.audienceLog;
export const viewMult = S => houseMult(S) * gearMult(S, 'views') * awardMult(S) * (1 + boardBonus(S, 'views'));
export const moneyMult = S => 1 + boardBonus(S, 'money');
export const subsMult = S => 1 + boardBonus(S, 'subs');

export const findTopic = id => TOPICS.find(t => t.id === id) || null;
export const topicUnlocked = (S, t) => S.subs >= (t.minSubs || 0);

// Ergebnis eines fertigen Videos (ohne Zufall und ohne den Zustand zu ändern).
export function videoOutcome(S, { points, quality, topic }) {
  const q = Math.max(0, Math.min(B.qualityCap, quality || 0));
  const views = Math.max(0, points || 0) * (B.qualityBase + q) * audience(S) * viewMult(S);
  return {
    views,
    money: views * B.moneyPerView * (topic?.money ?? 1) * moneyMult(S),
    // Neue Abos wachsen langsamer als die Aufrufe: je grösser der Kanal, desto schwerer.
    subs: B.subsPerView * Math.pow(views, B.subsExp) * (topic?.subs ?? 1) * subsMult(S),
  };
}

// Alte Videos laufen weiter: Geld pro Sekunde (Abos kommen nur durch neue Videos).
// Kein viewMult hier: die Abos sind schon mit allen Boni entstanden, sonst zählten sie doppelt.
export const passiveViews = S => Math.max(0, S.subs) * B.passiveViewsPerSub;
export const moneyPerSec = S => passiveViews(S) * B.moneyPerView * moneyMult(S);
