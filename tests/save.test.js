// Tests für Speichern, Laden, Migration (v1, v2) und Export/Import.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, VERSION, checkAwards } from '../js/core/game.js';
import { migrate, sanitize, loadGame, saveGame, exportSave, importSave, SAVE_KEY } from '../js/core/save.js';
import { BALANCE as B } from '../js/data/balance.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: k => { data.delete(k); },
    data,
  };
}

// Spielstand der ersten Version (Key creatorTycoonSave_v1)
const V1 = {
  money: 123456.78, subs: 154321.5, videos: 987,
  up: { cam: 12, mic: 7, light: 3 }, w: { cut: 25, thumb: 14, social: 6, camop: 1 },
  awards: [0, 1, 2], last: 1700000000000,
};
// Spielstand vom Szenen-Umbau (Key creatorTycoonSave_v2)
const V2 = {
  v: 2, money: 5e9, subs: 3e6, videos: 400, up: { cam: 3 }, w: { ai: 2 }, awards: ['fans', 'gold'],
  fame: 2, fameTotal: 7, perks: { einnahmen: 2 }, stats: { videos: 450, earned: 9e9, bestSubs: 4e6, seconds: 1234 },
  settings: { sound: true, anim: false }, tutorialDone: true, last: 1700000000000,
};

test('v1 wird migriert: Geld, Abos und Videos bleiben, alte Käufe werden zu Juwelen', () => {
  const S = migrate(V1, 1700000100000);
  assert.equal(S.v, VERSION);
  assert.equal(S.money, V1.money);
  assert.equal(S.subs, V1.subs);
  assert.equal(S.videos, V1.videos);
  assert.equal(S.gems, B.startGems + 5 * (12 + 7 + 3 + 25 + 14 + 6 + 1));
  assert.equal(S.house, 0);
  assert.equal(S.tutorialDone, true);
  assert.equal(S.last, V1.last);
  assert.equal(S.stats.videos, 987);
  assert.deepEqual(S.awards, []); // alte Award-Positionen gelten nicht mehr …
  checkAwards(S);
  assert.deepEqual(S.awards, ['funke']); // … aber die Abos zählen sofort für die neuen Awards
});

test('v2 wird migriert: Ruhm und Käufe werden zu Juwelen, Einstellungen bleiben', () => {
  const S = migrate(V2, 1700000100000);
  assert.equal(S.money, 5e9);
  assert.equal(S.subs, 3e6);
  assert.equal(S.gems, B.startGems + 5 * (3 + 2) + 20 * 7);
  assert.equal(S.stats.videos, 450);
  assert.equal(S.stats.earned, 9e9);
  assert.deepEqual(S.settings, { sound: true, anim: false });
});

test('Laden: v3 hat Vorrang, sonst v2, sonst v1; alte Stände bleiben als Sicherung liegen', () => {
  const st = memoryStorage({ creatorTycoonSave_v1: JSON.stringify(V1) });
  const a = loadGame(st, 1);
  assert.equal(a.source, 'v1');
  st.setItem('creatorTycoonSave_v2', JSON.stringify(V2));
  assert.equal(loadGame(st, 1).source, 'v2');
  saveGame(st, a.state, 5);
  const b = loadGame(st, 6);
  assert.equal(b.source, 'v3');
  assert.equal(b.state.money, V1.money);
  assert.ok(st.data.has('creatorTycoonSave_v1') && st.data.has('creatorTycoonSave_v2'));
});

test('Kaputter oder fehlender Spielstand', () => {
  assert.equal(loadGame(memoryStorage(), 5).source, 'new');
  const broken = memoryStorage({ [SAVE_KEY]: '{kaputt', creatorTycoonSave_v1: JSON.stringify(V1) });
  assert.equal(loadGame(broken, 5).source, 'v1');
  assert.equal(broken.data.get(SAVE_KEY + '_defekt'), '{kaputt');
  const locked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(loadGame(locked, 5).source, 'new');
  assert.equal(saveGame(locked, newState(0), 5), false);
});

test('Speichern und Laden ergibt denselben Zustand, auch mit Billionen', () => {
  const S = newState(1000);
  Object.assign(S, { money: 4.2e22, subs: 1.3e12, views: 9e18, videos: 6000, gems: 777, house: 19, board: 'phoenix', tutorialDone: true, lastTopic: 'robo' });
  S.gear.pc = 7; S.gear.handy = 6;
  S.boards = { phoenix: 2, brett: 1 }; S.parts = { cpu4: 1, ram2: 3 };
  S.awards = ['funke', 'stern', 'unendlich'];
  S.settings = { sound: true, anim: false };
  Object.assign(S.stats, { videos: 6000, earned: 8e22, bestSubs: 1.3e12, seconds: 99999, crates: 400, perfect: 3000, bestVideo: 5e15 });
  const st = memoryStorage();
  assert.equal(saveGame(st, S, 2000), true);
  assert.deepEqual(loadGame(st, 3000).state, S);
});

test('sanitize repariert unsinnige Werte', () => {
  const S = sanitize({
    money: -5, subs: NaN, gems: 'viele', house: 99, gear: { pc: 99, maus: -1, x: 3 },
    boards: { phoenix: 1, erfunden: 2 }, board: 'erfunden', parts: { cpu1: 1.7, nix: 1 },
    awards: ['funke', 'funke', 'quatsch'], lastTopic: 'gibtsnicht', settings: { sound: 'ja' }, last: 'gestern',
  }, 777);
  assert.equal(S.money, 0);
  assert.equal(S.subs, 0);
  assert.equal(S.gems, B.startGems);
  assert.equal(S.house, 19);
  assert.equal(S.gear.pc, 7);
  assert.equal(S.gear.maus, 0);
  assert.equal('x' in S.gear, false);
  assert.deepEqual(S.boards, { phoenix: 1 });
  assert.equal(S.board, null);
  assert.deepEqual(S.parts, { cpu1: 1 });
  assert.deepEqual(S.awards, ['funke']);
  assert.equal(S.lastTopic, 'schleim');
  assert.equal(S.settings.sound, false);
  assert.equal(S.last, 777);
});

test('migrate lehnt Unbrauchbares und neuere Versionen ab', () => {
  assert.throws(() => migrate(null));
  assert.throws(() => migrate([1]));
  assert.throws(() => migrate({ v: VERSION + 1 }), /neueren Version/);
});

test('Export und Import, auch alte Texte', () => {
  const S = newState(1000);
  S.money = 42; S.gems = 99; S.tutorialDone = true;
  const text = exportSave(S);
  assert.match(text, /^VV:[A-Za-z0-9+/=]+$/);
  assert.deepEqual(importSave(' ' + text + '\n', 1000), S);
  assert.equal(importSave(JSON.stringify(V1)).money, V1.money);
  const oldText = 'CT:' + Buffer.from(JSON.stringify(V2)).toString('base64');
  assert.equal(importSave(oldText).subs, 3e6);
  assert.throws(() => importSave(''), /füge zuerst/);
  assert.throws(() => importSave('VV:###'), /beschädigt/);
  assert.throws(() => importSave('hallo'), /kein Spielstand/);
});
