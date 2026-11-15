// Map 3 "Frostgipfel": Gerüst. Solange die Map nicht gebaut ist (ready: false in maps.js),
// zeigt sie die Baustelle in ihren eigenen Farben. Zum Ausbauen: hier wie in lagune.js Boden,
// Deko, Häuser (map.houses) und Zonen bauen und dasselbe Objekt zurückgeben.
import { buildBaustelle } from './baustelle.js';

export function buildFrost(engine, S, map) {
  return buildBaustelle(engine, S, map);
}
