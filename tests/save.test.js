import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, VERSION } from '../js/core/game.js';
import { migrate, sanitize, loadGame, saveGame, exportSave, importSave, SAVE_KEY, LEGACY_KEY } from '../js/core/save.js';
import { clickBase, viewsPerSec, awardMult } from '../js/core/formulas.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: k => { data.delete(k); },
    data,
  };
}

// So sah ein Spielstand der ersten Version aus (Awards als Positionen).
const V1 = {
  money: 123456.78, subs: 54321.5, videos: 987,
  up: { cam: 12, mic: 7, light: 3 }, w: { cut: 25, thumb: 14, social: 6, camop: 1 },
  awards: [0, 1, 2], last: 1700000000000,
};

test('v1 wird ohne Verlust migriert', () => {
  const S = migrate(V1, 1700000100000);
  assert.equal(S.v, VERSION);
  assert.equal(S.money, V1.money);
  assert.equal(S.subs, V1.subs);
  assert.equal(S.videos, V1.videos);
  assert.deepEqual(S.up, V1.up);
  assert.deepEqual(S.w, V1.w);
  assert.deepEqual(S.awards, ['fans', 'tausend', 'aufsteiger']);
  assert.equal(S.last, V1.last);
  assert.equal(S.tutorialDone, true);
  assert.equal(S.stats.videos, 987);
  assert.equal(S.stats.bestSubs, V1.subs);
  // Die migrierten Werte wirken im Spiel
  assert.equal(clickBase(S), 1 + 12 + 7 * 6 + 3 * 35);
  assert.equal(viewsPerSec(S), 25 * 0.5 + 14 * 4 + 6 * 25 + 150);
  assert.equal(awardMult(S), 1.75);
  // Neue Felder haben sinnvolle Startwerte
  assert.equal(S.fame, 0);
  assert.deepEqual(S.settings, { sound: false, anim: true });
});

test('Laden: v2 hat Vorrang, sonst wird v1 genommen und bleibt als Sicherung liegen', () => {
  const legacy = memoryStorage({ [LEGACY_KEY]: JSON.stringify(V1) });
  const a = loadGame(legacy, 1700000100000);
  assert.equal(a.source, 'v1');
  assert.equal(a.state.money, V1.money);
  saveGame(legacy, a.state, 1700000200000);
  assert.ok(legacy.data.has(LEGACY_KEY));
  const b = loadGame(legacy, 1700000300000);
  assert.equal(b.source, 'v2');
  assert.equal(b.state.last, 1700000200000);
  assert.deepEqual(b.state.awards, a.state.awards);
});

test('Laden ohne Spielstand oder mit kaputtem Spielstand', () => {
  assert.equal(loadGame(memoryStorage(), 5).source, 'new');
  const broken = memoryStorage({ [SAVE_KEY]: '{kaputt', [LEGACY_KEY]: JSON.stringify(V1) });
  const r = loadGame(broken, 5);
  assert.equal(r.source, 'v1'); // fällt auf den alten Stand zurück
  assert.equal(broken.data.get(SAVE_KEY + '_defekt'), '{kaputt');
  const locked = { getItem() { throw new Error('gesperrt'); }, setItem() { throw new Error('gesperrt'); } };
  assert.equal(loadGame(locked, 5).source, 'new');
  assert.equal(saveGame(locked, newState(0), 5), false);
});

test('Speichern und Laden ergibt denselben Zustand', () => {
  const S = newState(1000);
  Object.assign(S, { money: 5e12, subs: 3e6, videos: 400, fame: 2, fameTotal: 7, prestiges: 2, tutorialDone: true });
  S.up = { cam: 3 }; S.w = { ai: 2 }; S.awards = ['fans', 'gold']; S.perks = { einnahmen: 2 };
  S.buffs = [{ id: 'sponsor', icon: '🤝', label: 'Sponsor', target: 'money', mult: 3, left: 12.5 }];
  S.goals = { day: '2026-01-02', bonus: false, list: [{ id: 'videos', start: 10, target: 150, done: true, claimed: false }] };
  S.settings = { sound: true, anim: false };
  Object.assign(S.stats, { earned: 9e12, videos: 450, bestSubs: 4e6, seconds: 1234.5 });
  const storage = memoryStorage();
  assert.equal(saveGame(storage, S, 2000), true);
  const back = loadGame(storage, 3000).state;
  assert.deepEqual(back, S);
});

test('sanitize repariert unsinnige Werte', () => {
  const S = sanitize({
    money: -5, subs: NaN, videos: 'viele', up: { cam: 2.9, mic: -1, x: Infinity }, w: null,
    awards: ['fans', 'fans', 'erfunden', 3], buffs: [{ id: 'a', mult: 0, left: 5 }, null],
    fame: 5, fameTotal: 2, settings: { sound: 'ja' }, last: 'gestern',
  }, 777);
  assert.equal(S.money, 0);
  assert.equal(S.subs, 0);
  assert.equal(S.videos, 0);
  assert.deepEqual(S.up, { cam: 2 });
  assert.deepEqual(S.w, {});
  assert.deepEqual(S.awards, ['fans']);
  assert.deepEqual(S.buffs, []);
  assert.equal(S.fameTotal, 5); // nie weniger als der aktuelle Ruhm
  assert.equal(S.settings.sound, false);
  assert.equal(S.last, 777);
});

test('migrate lehnt Unbrauchbares und neuere Versionen ab', () => {
  assert.throws(() => migrate(null));
  assert.throws(() => migrate([1, 2]));
  assert.throws(() => migrate('text'));
  assert.throws(() => migrate({ v: VERSION + 1 }), /neueren Version/);
});

test('Export und Import', () => {
  const S = newState(1000);
  S.money = 42; S.awards = ['fans']; S.tutorialDone = true;
  const text = exportSave(S);
  assert.match(text, /^CT:[A-Za-z0-9+/=]+$/);
  assert.deepEqual(importSave('  ' + text + '\n', 1000), S);
  // Auch ein alter v1-Stand als rohes JSON lässt sich importieren
  assert.equal(importSave(JSON.stringify(V1)).money, V1.money);
  assert.throws(() => importSave(''), /füge zuerst/);
  assert.throws(() => importSave('CT:###'), /beschädigt/);
  assert.throws(() => importSave('hallo'), /kein Spielstand/);
});
