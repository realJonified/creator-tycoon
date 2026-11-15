// Bau-Funktionen der Maps. Neue Map: Datensatz in js3d/data/maps.js, Bau-Funktion hier eintragen.
// Jede Bau-Funktion bekommt (engine, S, map) und liefert:
//   { group, colliders, triggers, houseSigns, update(t)?, updatePortal(t, open, text)?, dispose() }
// Pflicht: ein Auslöser { kind: 'portal' } – darüber kommt man immer zurück zur Weltkarte.
import { buildBucht } from '../world.js';
import { buildBaustelle } from './baustelle.js';

export const BUILDERS = {
  bucht: buildBucht,
  baustelle: buildBaustelle,
};

export function buildMap(engine, S, map) {
  const fn = BUILDERS[map.build] || BUILDERS.baustelle;
  return fn(engine, S, map);
}
