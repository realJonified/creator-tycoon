// Kisten öffnen: erst die Seltenheit würfeln, dann ein Gegenstand dieser Seltenheit aus dem Inhalt.
import { CRATES, RARITIES, BOARDS, PARTS } from '../data/crates.js';
import { bestPart, findPart } from './formulas.js';

export const findCrate = id => CRATES.find(c => c.id === id) || null;
export const findRarity = id => RARITIES.find(r => r.id === id) || RARITIES[0];

export function rollRarity(crate, rng = Math.random) {
  let roll = rng();
  for (const r of RARITIES) {
    roll -= crate.odds[r.id] || 0;
    if (roll < 0) return r.id;
  }
  return [...RARITIES].reverse().find(r => (crate.odds[r.id] || 0) > 0)?.id || RARITIES[0].id;
}

export function itemsFor(crate, rarity) {
  const out = [];
  if (crate.pool.includes('board')) for (const b of BOARDS) if (b.rarity === rarity) out.push({ kind: 'board', item: b });
  if (crate.pool.includes('part')) for (const p of PARTS) if (p.rarity === rarity) out.push({ kind: 'part', item: p });
  return out;
}

// Öffnet eine Kiste. Doppelte (oder schwächere Teile) bringen Juwelen zurück.
export function openCrate(S, crateId, rng = Math.random) {
  const crate = findCrate(crateId);
  if (!crate || S.gems < crate.cost) return null;
  S.gems -= crate.cost;
  const rarity = rollRarity(crate, rng);
  const choices = itemsFor(crate, rarity);
  const { kind, item } = choices[Math.floor(rng() * choices.length)] || choices[0];
  const store = kind === 'board' ? S.boards : S.parts;
  const isNew = !(store[item.id] > 0);
  let upgrade = false;
  if (kind === 'part') {
    const best = bestPart(S, item.slot);
    upgrade = !best || item.bonus > best.bonus;
  }
  store[item.id] = (store[item.id] || 0) + 1;
  const refund = isNew ? 0 : findRarity(rarity).refund;
  S.gems += refund;
  if (kind === 'board' && !S.board) S.board = item.id; // erstes Hoverboard gleich ausrüsten
  S.stats.crates++;
  return { crate, kind, item, rarity, isNew, upgrade, refund };
}

export function equipBoard(S, id) {
  if (!(S.boards[id] > 0)) return false;
  S.board = id;
  return true;
}

export { findPart };
