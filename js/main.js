// Start des Spiels: lädt den Spielstand und verbindet Store, Loop, Szenen und Oberfläche.
import { createStore } from './core/store.js';
import { createLoop } from './core/loop.js';
import { createSceneManager } from './core/scenes.js';
import { createActions } from './core/actions.js';
import { createAudio } from './core/audio.js';
import { loadGame, saveGame } from './core/save.js';
import { newState, applyOffline } from './core/game.js';
import { eur, fmt, fmtPercent } from './core/format.js';
import { BALANCE as B } from './data/balance.js';
import { createHud } from './ui/hud.js';
import { createToast } from './ui/toast.js';
import { SCENES, START_SCENE } from './scenes/index.js';

const $ = id => document.getElementById(id);

// localStorage kann gesperrt sein (privater Modus). Dann läuft das Spiel ohne Speichern weiter.
const storage = (() => {
  try { localStorage.getItem('test'); return localStorage; }
  catch { return { getItem: () => null, setItem() {}, removeItem() {} }; }
})();

const loaded = loadGame(storage);
const store = createStore(loaded.state);
const offline = applyOffline(store.state, (Date.now() - store.state.last) / 1000);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ctx ist das, was jede Szene bekommt.
const ctx = {
  store,
  get S() { return store.state; },
  hasSave: loaded.source !== 'new',
  migrated: loaded.source === 'v1',
  offline: offline?.notice ? offline : null,   // für die Anzeige auf dem Titelbild
  ui: { buyMode: 1 },
  animations: () => store.state.settings.anim && !reducedMotion.matches,
  persist: () => saveGame(storage, store.state),
  applySettings() { document.documentElement.dataset.anim = store.state.settings.anim ? 'on' : 'off'; },
  // Ersetzt den Spielstand (Import) oder beginnt neu. Einstellungen bleiben bei einem Neustart.
  replaceState(next) { store.replace(next); ctx.hasSave = true; ctx.offline = null; ctx.applySettings(); ctx.persist(); },
  newGame() {
    const fresh = newState();
    fresh.settings = { ...store.state.settings };
    ctx.replaceState(fresh);
  },
};
ctx.audio = createAudio(() => store.state.settings.sound);
ctx.toast = createToast($('toast'));
ctx.game = createActions(store);
ctx.scenes = createSceneManager({
  root: $('scene'), overlayRoot: $('overlays'), appRoot: $('app'), ctx,
  animate: ctx.animations,
  onChange: (id, def) => hud.setActive(id, def),
});
for (const scene of SCENES) ctx.scenes.register(scene);
const hud = createHud({ hudEl: $('hud'), navEl: $('nav'), ctx });
ctx.applySettings();

// ---------- Meldungen ----------
store.on('award', ({ award }) => {
  ctx.audio.play('award');
  ctx.toast(`${award.icon} ${award.name} geholt! +${fmtPercent(award.bonus ?? B.awardBonus)} Einnahmen`);
});
store.on('viral', result => {
  if (!ctx.scenes.isOpen('viral')) ctx.scenes.openOverlay('viral', { result });
});
store.on('offline', r => {
  if (r.notice) ctx.toast(`😴 Während du weg warst: +${eur(r.money)} und +${fmt(r.subs)} Abos`);
});

// ---------- Loop ----------
const loop = createLoop({
  update(dt) { ctx.game.tick(dt); ctx.scenes.update(dt); },
  render() { hud.render(); ctx.scenes.render(); },
  onAway(seconds) { ctx.game.away(seconds); },
});

// ---------- Speichern ----------
setInterval(ctx.persist, 10000);
document.addEventListener('visibilitychange', () => { if (document.hidden) ctx.persist(); });
addEventListener('pagehide', ctx.persist);

// Ton erst nach der ersten Eingabe erlauben.
for (const type of ['pointerdown', 'keydown']) {
  addEventListener(type, () => ctx.audio.unlock(), { once: true, capture: true });
}

ctx.scenes.go(START_SCENE).then(() => loop.start());

// Zum Ausprobieren in der Browser-Konsole.
globalThis.creatorTycoon = ctx;
