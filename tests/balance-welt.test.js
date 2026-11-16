// Schutz für das Balancing der 3D-Welt: Wer Zahlen in js3d/data/balance.js ändert, sieht hier sofort,
// ob die Ziele (oben in tools/balance-welt.js) noch stimmen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, checkTargets, TARGETS, averageRun } from '../tools/balance-welt.js';
import { fmtTime } from '../js/core/format.js';
import { newState, finishVideo } from '../js3d/core/economy.js';
import { GAMES, BOARDS } from '../js3d/data/content.js';

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

test('Hoverboard bringt kein Extrageld: gleiches Video, gleiches Geld, mit jedem Board', () => {
  const video = { points: 500, quality: 1, game: GAMES[0] };
  const ref = newState(0); ref.subs = 1e6; ref.board = null;
  const want = finishVideo(ref, { ...video });
  for (const b of BOARDS) {
    const S = newState(0); S.subs = 1e6; S.boards = BOARDS.map(x => x.id); S.board = b.id;
    const r = finishVideo(S, { ...video });
    assert.equal(r.money, want.money, b.id);
    assert.equal(S.money, ref.money, b.id);
    assert.equal(S.subs, ref.subs, b.id);
  }
});

test('Hoverboard verkürzt nur Wege: im Mittel kaum schneller, Ziele bleiben erfüllt', () => {
  const foot = averageRun(null), best = averageRun('sternenstaub');
  assert.ok(foot.ok && best.ok, 'Ziele im Mittel erfüllt');
  assert.ok(foot.share >= 0.8 && best.share >= 0.8, `Läufe im Ziel: ${foot.share} / ${best.share}`);
  // Das schnellste Board spart pro Bosskampf ~9 s Weg, also höchstens ein paar Prozent Zeit.
  // Geprüft wird nur "nicht spürbar schneller": Langsamer kann es durch Zufall (Kistenglück) auch sein.
  assert.ok(best.map1 >= foot.map1 * 0.95, `Map 1: ${(best.map1 / foot.map1).toFixed(3)}`);
  assert.ok(best.map2 >= foot.map2 * 0.95, `1 Bio.: ${(best.map2 / foot.map2).toFixed(3)}`);
});
