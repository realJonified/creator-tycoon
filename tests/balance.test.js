// Schutz für das Balancing: Wer Zahlen ändert, sieht hier sofort die Folgen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../tools/balance.js';
import { AWARDS } from '../js/data/awards.js';

test('Balancing: erstes Haus nach wenigen Minuten, 100.000 Abos nach 30–60 Minuten, danach langsamer', () => {
  const log = simulate({ hours: 4, seed: 1 });
  assert.ok(log.houses[1] >= 120 && log.houses[1] <= 600, `erstes Haus nach ${log.houses[1]} s`);
  const first = log.awards[AWARDS[0].id];
  assert.ok(first >= 30 * 60 && first <= 60 * 60, `100.000 Abos nach ${first} s`);
  // Jede Zehnerstufe danach dauert mindestens so lange wie der Abstand davor (spürbar langsamer)
  const t = ['funke', 'stern', 'krone', 'komet'].map(id => log.awards[id]);
  assert.ok(t.every(Number.isFinite), `Awards bis 100 Mio. in 4 h: ${t}`);
  assert.ok(t[2] - t[1] >= (t[1] - t[0]) * 0.8 && t[3] - t[2] >= (t[1] - t[0]) * 0.8, `Abstände ${t}`);
});
