// Boss-Kiste: Seltenheit würfeln, Belohnung ausrechnen und gutschreiben.
import { RARITIES, CHARMS } from '../data/content.js';
import { earn, typicalVideo } from './economy.js';

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
  const money = Math.max(1000, v.money * rarity.videos);
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
  S.stats.chests++;
  return { rarity, money, subs, charm };
}
