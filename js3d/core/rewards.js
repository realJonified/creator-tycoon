// Boss-Kiste: Seltenheit würfeln, Belohnung ausrechnen und gutschreiben.
import { RARITIES, CHARMS } from '../data/content.js';
import { W } from '../data/balance.js';
import { earn, typicalVideo } from './economy.js';
import { chestBoards, grantBoard } from './board.js';

export function rollRarity(rng = Math.random) {
  let roll = rng(), acc = 0;
  for (const r of RARITIES) {
    acc += r.odds;
    if (roll < acc) return r;
  }
  return RARITIES[RARITIES.length - 1];
}

export function openChest(S, rng = Math.random) {
  const rarity = rollRarity(rng);
  const v = typicalVideo(S);
  const money = Math.max(W.chestMinMoney, v.money * rarity.videos);
  const subs = Math.floor(S.subs * rarity.subs);
  earn(S, money, subs);
  let charm = null;
  if (rarity.charm && rng() < rarity.charm) {
    const pool = CHARMS.filter(c => c.rarity === rarity.id);
    if (pool.length) {
      charm = pool[Math.floor(rng() * pool.length)];
      S.charms[charm.id] = (S.charms[charm.id] || 0) + 1;
    }
  }
  // Hoverboard: nur bei seltenen Kisten, nur eines, das man noch nicht hat. Bringt kein Geld, nur schnellere Wege.
  let board = null;
  if (rarity.board && rng() < rarity.board) {
    const pool = chestBoards(S, rarity.id);
    if (pool.length) { board = pool[Math.floor(rng() * pool.length)]; grantBoard(S, board.id); }
  }
  S.stats.chests++;
  return { rarity, money, subs, charm, board };
}
