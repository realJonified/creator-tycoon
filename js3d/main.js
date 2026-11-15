// Kanalbucht: Start und Spielablauf. Orte (Modi): Map (immer nur eine geladen), Haus innen, Boss-Arena.
// Spiellogik läuft mit festem Zeitschritt (1/60 s), gezeichnet wird so oft der Browser kann.
import { createEngine, isTouch } from './scene/engine.js';
import { buildMap } from './scene/maps/index.js';
import { buildInterior } from './scene/interior.js';
import { buildArena } from './scene/arena.js';
import { createPlayer } from './scene/player.js';
import { createCameraRig } from './scene/camera.js';
import { createInput } from './scene/input.js';
import { nearestTrigger, clearDistance } from './core/physics.js';
import { createMapManager } from './core/maps.js';
import {
  tickEconomy, tickPortal, portalIsOpen, finishVideo, buyHouse, ownsHouse, nextHouse, houseIndex, findHouse,
  applyOffline, newState, unlockMap, mapUnlocked,
} from './core/economy.js';
import { startFight, stepFight } from './core/boss.js';
import { openChest as rollChest } from './core/rewards.js';
import { loadWorld, saveWorld } from './core/save.js';
import { createAudio } from '../js/core/audio.js';
import { eur } from '../js/core/format.js';
import { createHud, createPanels, mmss } from './ui/hud.js';
import { showStart, openMenu } from './ui/menu.js';
import { openShop } from './ui/shop-ui.js';
import { openVideo } from './ui/video-ui.js';
import { openWorldMap } from './ui/worldmap-ui.js';
import { createBossHud, openChest, openDefeat, openBuyHouse, openButtonWon } from './ui/boss-ui.js';
import { findMap } from './data/maps.js';

const STEP = 1 / 60;
const $ = id => document.getElementById(id);
const storage = (() => { try { localStorage.getItem('x'); return localStorage; } catch { return { getItem: () => null, setItem() {} }; } })();
// Auf den nächsten Bild-Takt warten, aber höchstens 60 ms (im Hintergrund kommen keine Bild-Takte).
const nextFrame = () => new Promise(r => { const t = setTimeout(r, 60); requestAnimationFrame(() => { clearTimeout(t); r(); }); });

const loaded = loadWorld(storage);
let S = loaded.state;
const offline = loaded.source === 'welt' ? applyOffline(S, (Date.now() - S.last) / 1000) : null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Grafik und Szene ----------
const engine = createEngine($('c'));
const arena = buildArena(engine);
const player = createPlayer(engine.scene);
const rig = createCameraRig(engine.camera);
const audio = createAudio(() => S.settings.sound);
const hud = createHud({ onUse: () => use(), onMenu: () => openMenu(panels, ctx) });
const panels = createPanels($('panels'));
const bossHud = createBossHud();

let mode = 'start';          // start | loading | world | interior | arena
let world = null, mapData = null, interior = null, fight = null, trigger = null, time = 0;
const buttonQueue = [];

// Immer nur eine Map: alte entsorgen, neue bauen, dazwischen Ladebildschirm.
const maps = createMapManager({
  build: id => buildMap(engine, S, findMap(id)),
  dispose: inst => inst.dispose(),
  async onLoading(on, id) {
    const el = $('loading');
    if (on) {
      el.querySelector('b').textContent = findMap(id)?.name || '';
      el.hidden = false;
      await nextFrame(); await nextFrame(); // Ladebildschirm wirklich zeichnen lassen
    } else el.hidden = true;
  },
});

async function travel(id, at = null) {
  const m = findMap(id);
  if (!m || !mapUnlocked(S, id)) return;
  const prev = mode === 'start' ? 'start' : 'world';
  mode = 'loading';
  panels.close();
  interior?.dispose(); interior = null;
  world = await maps.load(id);
  mapData = m;
  S.map = id;
  updateSigns();
  enterWorld(at || m.spawn);
  if (prev === 'start') mode = 'start';
  ctx.persist();
}

const ctx = {
  get S() { return S; }, engine, audio,
  toast: m => hud.toast(m),
  persist: () => saveWorld(storage, S),
  reduced: () => reduced.matches,
  applyGraphics() { engine.setSetting(S.settings.graphics); },
  onPartsChanged() { if (mode === 'interior') enterHouse(S.home, true); },
  finishVideo(v) {
    const r = finishVideo(S, v);
    audio.play('award');
    for (const b of r.buttons) buttonWon(b);
    ctx.persist();
    return r;
  },
  buyHouse(house) {
    if (!buyHouse(S, house.id)) { audio.play('denied'); return; }
    audio.play('prestige');
    hud.toast(`🏡 ${house.name} gehört jetzt dir!`);
    updateSigns();
    ctx.persist();
  },
  unlockMap(id) {
    if (!unlockMap(S, id)) { audio.play('denied'); return false; }
    audio.play('prestige');
    hud.toast(`🗺️ ${findMap(id).name} freigeschaltet!`);
    ctx.persist();
    return true;
  },
  travel: id => travel(id),
  enterArena: () => enterArena(),
  openChest() { const r = rollChest(S); ctx.persist(); return r; },
  async goHome() {
    const h = findHouse(S.home);
    if (h.map !== S.map) await travel(h.map);
    enterHouse(S.home);
  },
  reset() { S = newState(); S.tutorialDone = true; ctx.persist(); location.reload(); },
};
engine.onLevel = lvl => player.setBlob(lvl === 'niedrig');
engine.setSetting(S.settings.graphics);

const input = createInput({
  canvas: $('c'), joystickEl: $('joy'), knobEl: $('knob'),
  onUse: () => use(),
  onLook: (dx, dy) => rig.rotate(dx * 0.005 * S.settings.sensitivity, dy * 0.004 * S.settings.sensitivity),
  onZoom: d => rig.zoom(d * 0.8),
  isBlocked: () => panels.isOpen || mode === 'start' || mode === 'loading',
});
addEventListener('keydown', e => {
  if (e.code === 'Escape' && !panels.isOpen && mode !== 'start' && mode !== 'loading') { e.preventDefault(); openMenu(panels, ctx); }
  if (e.code === 'F3') { e.preventDefault(); S.settings.fps = !S.settings.fps; }
});

// ---------- Orte wechseln ----------
function showWorld(on) { if (world) world.group.visible = on; }

function enterWorld(at = null) {
  interior?.dispose(); interior = null;
  arena.group.visible = false;
  showWorld(true);
  engine.setSky(mapData.sky.top, mapData.sky.bottom, mapData.sky);
  mode = 'world';
  const p = at || S.player;
  player.place(p.x, p.z, (p.yaw ?? 0) + Math.PI); // Figur schaut von der Kamera weg
  rig.setLimits(4, 13, 8);
  rig.setYaw(p.yaw ?? 0);
  bossHud.show(false);
  hud.show(true);
}

function enterHouse(id, keepPos = false) {
  const keep = keepPos ? { ...player.pos } : null;
  interior?.dispose();
  showWorld(false); arena.group.visible = false;
  interior = buildInterior(engine, S, houseIndex(id));
  S.home = id;
  mode = 'interior';
  const sp = keep || interior.spawn;
  player.place(sp.x, sp.z, Math.PI);
  rig.setLimits(3, Math.max(6, interior.size * 0.7), Math.min(7, interior.size * 0.6));
  if (!keep) rig.setYaw(0);
}

function enterArena() {
  showWorld(false); interior?.dispose(); interior = null;
  arena.reset(); arena.group.visible = true;
  engine.setSky('#1e1640', '#3b2f5c', { hemiSky: '#cfc6ff', hemiGround: '#3b2f5c', sun: '#ffe0b5', showSun: false });
  mode = 'arena';
  fight = startFight();
  player.place(arena.spawn.x, arena.spawn.z, Math.PI);
  rig.setLimits(6, 14, 11); rig.setYaw(0);
  bossHud.show(true); bossHud.render(fight);
  audio.play('event');
  hud.toast('⚔️ Weich den roten Kreisen aus! Deine Waffe schiesst von allein.');
}

function leaveArena() {
  fight = null;
  enterWorld({ x: mapData.portal.x, z: mapData.portal.z + 4, yaw: 0 });
}

// ---------- Benutzen (E / Knopf) ----------
function promptFor(t) {
  if (!t) return [null];
  switch (t.kind) {
    case 'shop': return ['🛒 Bitbazar betreten'];
    case 'portal': return [portalIsOpen(S) ? '🌀 Weltkarte · Boss-Portal offen!' : '🌀 Weltkarte öffnen'];
    case 'pc': return ['🎬 Video machen'];
    case 'exit': return ['🚪 Hinausgehen'];
    case 'house': {
      if (ownsHouse(S, t.house.id)) return [`🏠 ${t.house.name} betreten`];
      const nh = nextHouse(S);
      return nh && nh.id === t.house.id ? [`🏡 Kaufen: ${eur(t.house.price)}`] : [`🔒 ${t.house.name}: erst das vorige Haus kaufen`, false];
    }
  }
  return [null];
}
function use() {
  if (panels.isOpen || mode === 'start' || mode === 'loading' || !trigger) return;
  audio.unlock();
  switch (trigger.kind) {
    case 'shop': audio.play('nav'); openShop(panels, ctx); break;
    case 'portal': audio.play('nav'); openWorldMap(panels, ctx); break;
    case 'pc': audio.play('nav'); openVideo(panels, ctx); break;
    case 'exit': {
      const h = findHouse(S.home);
      const d = world.triggers.find(t => t.id === 'haus:' + h.id);
      enterWorld(d ? { x: d.x, z: d.z, yaw: h.rot } : null);
      break;
    }
    case 'house':
      if (ownsHouse(S, trigger.house.id)) { audio.play('nav'); enterHouse(trigger.house.id); }
      else if (nextHouse(S)?.id === trigger.house.id) openBuyHouse(panels, ctx, trigger.house);
      else audio.play('denied');
      break;
  }
}

function updateSigns() {
  const nh = nextHouse(S);
  for (const s of world?.houseSigns || []) {
    const h = s.house;
    if (ownsHouse(S, h.id)) s.sign.update([h.name, S.home === h.id ? 'Dein Zuhause' : 'Gehört dir'], { bg: '#065f46', accent: '#a7f3d0' });
    else if (nh && nh.id === h.id) s.sign.update(['Zu verkaufen', eur(h.price)], { bg: '#b91c1c', accent: '#fde68a' });
    else s.sign.update([h.name, eur(h.price)], { bg: '#374151', accent: '#d1d5db' });
  }
}

function buttonWon(b) {
  hud.toast(`⭐ ${b.name} freigeschaltet!`);
  audio.play('award');
  buttonQueue.push(b);
}

// ---------- Spiel-Logik (fester Zeitschritt) ----------
function logic(dt) {
  if (mode === 'start' || mode === 'loading') return;
  for (const b of tickEconomy(S, dt)) buttonWon(b);
  const p = tickPortal(S, dt);
  if (p === 'open') { audio.play('event'); hud.toast('🌀 Das Boss-Portal ist offen! Eine Minute Zeit.'); }
  if (p === 'close' && mode !== 'arena') hud.toast('🌀 Das Boss-Portal hat sich geschlossen.');

  const mv = input.read();
  if (mode === 'world') player.update(dt, mv, mv.run, rig.yaw, world.colliders, { x: 0, z: 0, r: mapData.walkRadius });
  else if (mode === 'interior') { player.update(dt, mv, mv.run, rig.yaw, interior.colliders, null); interior.clamp(player.pos); }
  else if (mode === 'arena') {
    player.update(dt, mv, mv.run, rig.yaw, arena.colliders, arena.bounds);
    for (const e of stepFight(fight, dt, player.pos)) {
      if (e.type === 'shot') arena.shoot(player.pos);
      else if (e.type === 'warn') arena.warn(e.attack);
      else if (e.type === 'blast') { arena.blast(e.attack); audio.play('bad'); }
      else if (e.type === 'hit') bossHud.hurt();
      else if (e.type === 'win') { S.stats.bossWins++; arena.defeat(); audio.play('prestige'); ctx.persist(); openChest(panels, ctx, leaveArena); }
      else if (e.type === 'lose') { S.stats.bossLosses++; ctx.persist(); openDefeat(panels, leaveArena); }
    }
    bossHud.render(fight);
  }
  panels.update(dt);
  const triggers = mode === 'world' ? world.triggers : mode === 'interior' ? interior.triggers : [];
  trigger = panels.isOpen ? null : nearestTrigger(player.pos, triggers);
  if (!panels.isOpen && buttonQueue.length && mode !== 'arena') openButtonWon(panels, buttonQueue.shift());
}

// ---------- Zeichnen ----------
let last = performance.now(), acc = 0, slow = 0, lastFrame = performance.now();
// Ersatz-Takt: Liefert der Browser keine Bild-Takte, obwohl die Seite sichtbar ist (z. B. verdecktes
// Fenster), läuft das Spiel trotzdem weiter. Ein wirklich versteckter Tab bleibt stehen.
setInterval(() => { if (!document.hidden && performance.now() - lastFrame > 250) frame(performance.now(), true); }, 100);
function frame(now, fallback = false) {
  if (!fallback) requestAnimationFrame(frame);
  lastFrame = fallback ? lastFrame : now;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 2) { if (mode !== 'start' && mode !== 'loading') { const r = applyOffline(S, dt); if (r) hud.toast(`😴 Alte Videos: +${eur(r.money)}`); } dt = 0; }
  dt = Math.min(dt, 0.25);
  if (mode === 'loading' || !world) return;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 8) { logic(STEP); acc -= STEP; n++; }
  if (n === 8) acc = 0;
  time += dt;

  rig.update(dt, player.pos, mode === 'world' ? (dx, dz, d) => clearDistance(player.pos, dx, dz, d, world.colliders) : null);
  engine.followShadow(player.pos);
  if (mode === 'world' || mode === 'start') {
    world.updatePortal?.(time, portalIsOpen(S), portalIsOpen(S) ? `OFFEN ${mmss(S.portal.open)}` : mmss(S.portal.in));
    world.update?.(time);
  }
  if (mode === 'arena' && fight) arena.update(dt, time, player.pos, fight.bossHp / 150);
  engine.render();
  engine.measure(dt);

  if (mode !== 'start') {
    hud.render(S);
    const [label, enabled] = promptFor(trigger);
    hud.prompt(label ? (isTouch() ? label : `[E] ${label}`) : null, enabled !== false);
    if (mode === 'world') S.player = { x: player.pos.x, z: player.pos.z, yaw: rig.yaw };
  }
  slow += dt;
  if (slow > 0.5) {
    slow = 0;
    const info = engine.renderer.info;
    hud.fps(S.settings.fps, `${Math.round(engine.fps)} FPS · ${engine.level} · ${info.render.calls} Draw-Calls · ${Math.round(info.render.triangles / 1000)}k Dreiecke · ${info.memory.geometries} Geo · ${info.memory.textures} Tex`);
  }
}

// ---------- Start ----------
(async () => {
  await travel(S.map, S.player);
  hud.show(false);
  mode = 'start';
  showStart($('start'), {
    S, source: loaded.source, offline,
    onPlay() {
      audio.unlock();
      $('start').hidden = true;
      mode = 'world';
      hud.show(true);
      if (S.migratedRefund) {
        hud.toast(`🏡 Update 2: Häuser ab Nr. 6 stehen nicht mehr auf der Insel. Du hast ${eur(S.migratedRefund)} zurückbekommen.`);
        delete S.migratedRefund;
      }
      if (!S.tutorialDone) {
        S.tutorialDone = true;
        hud.toast('👋 Willkommen in der Kanalbucht! Deine Wohnung liegt im Norden, hinter dem Kreisel.');
        hud.toast('🎬 Geh hinein und benutze den PC für dein erstes Video.');
      }
      ctx.persist();
    },
  });
  requestAnimationFrame(frame);
})();
setInterval(() => { if (mode !== 'start' && mode !== 'loading') ctx.persist(); }, 10000);
document.addEventListener('visibilitychange', () => { if (document.hidden && mode !== 'start') ctx.persist(); });
addEventListener('pagehide', () => { if (mode !== 'start') ctx.persist(); });

// Zum Testen in der Konsole
globalThis.kanalbucht = {
  get S() { return S; }, ctx, engine, player, rig, input, panels, maps,
  get world() { return world; }, get mode() { return mode; }, get fight() { return fight; }, get trigger() { return trigger; },
  use, enterHouse, enterArena, enterWorld, travel,
  // Nur zum Testen: Map laden, auch wenn sie noch gesperrt ist
  async forceMap(id) { if (!S.maps.includes(id)) S.maps.push(id); await travel(id); },
  openPortal() { S.portal.in = 0.1; S.portal.open = 0; },
  teleport(x, z, yaw = 0) { player.place(x, z, Math.PI); rig.setYaw(yaw); },
};
