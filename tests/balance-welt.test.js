// Schutz für das Balancing der 3D-Welt: Wer Zahlen in js3d/data/balance.js ändert, sieht hier sofort,
// ob die Ziele (oben in tools/balance-welt.js) noch stimmen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, checkTargets, TARGETS } from '../tools/balance-welt.js';
import { fmtTime } from '../js/core/format.js';

test('Balancing-Ziele: Map 1 in 3–6 h, 1 Billion 2–12 h danach (aktiver Spieler, drei Startwerte)', () => {
  for (const seed of [1, 2, 3]) {
    const log = simulate({ hours: TARGETS.map1MaxHours + TARGETS.map2GapMaxHours, seed });
    const c = checkTargets(log);
    assert.ok(c.map1Ok, `Seed ${seed}: Map 1 nach ${c.map1 != null ? fmtTime(c.map1) : 'nie'}`);
    assert.ok(c.gapOk, `Seed ${seed}: 1 Billion ${c.gap != null ? fmtTime(c.gap) : 'nie'} nach Map 1`);
    // Reihenfolge stimmt: Häuser auf Map 1 nacheinander, dann Map 2
    assert.ok(log.houses.strand1 < log.houses.strand2 && log.houses.strand4 <= log.maps.lagune);
  }
});

test('Auch wer oft offline ist, kommt voran (Map 1 und Map 2 erreichbar)', () => {
  const log = simulate({ hours: 12, seed: 1, casual: true });
  assert.ok(log.map1Done != null, 'Map 1 geschafft');
  assert.ok(log.maps.lagune != null, 'Map 2 freigeschaltet');
  assert.ok(log.wallAt.map1 > log.map1Done, 'echte Zeit ist länger als aktive Spielzeit');
});
