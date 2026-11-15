// Bosskampf ohne Grafik: Lebenspunkte, automatische Schüsse, Angriffe mit Vorwarnung.
// Die Arena (js3d/scene/arena.js) zeichnet nur, was hier passiert.
import { W } from '../data/balance.js';

export function startFight() {
  return {
    bossHp: W.bossHp, playerHp: W.playerHp,
    shotIn: 0.6, attackIn: 2, attacks: [], nextId: 1, round: 0,
    time: 0, over: null, // 'win' | 'lose'
  };
}

// Ein Zeitschritt. player = { x, z } in Arena-Koordinaten (Boss steht in der Mitte).
// Gibt Ereignisse zurück: shot, warn, blast, hit, win, lose.
export function stepFight(f, dt, player, rng = Math.random) {
  const ev = [];
  if (f.over) return ev;
  f.time += dt;

  // Die Waffe schiesst automatisch.
  f.shotIn -= dt;
  while (f.shotIn <= 0 && !f.over) {
    f.shotIn += W.shotEvery;
    f.bossHp = Math.max(0, f.bossHp - W.shotDamage);
    ev.push({ type: 'shot', damage: W.shotDamage });
    if (f.bossHp <= 0) { f.over = 'win'; ev.push({ type: 'win' }); }
  }
  if (f.over) return ev;

  // Angriffe: Zielkreise erscheinen, nach der Vorwarnung schlagen sie ein.
  f.attackIn -= dt;
  if (f.attackIn <= 0) {
    f.attackIn += W.attackEvery;
    f.round++;
    const spots = [{ x: player.x, z: player.z }];
    // Jeder dritte Angriff: zwei zusätzliche Kreise neben dem Spieler.
    if (f.round % 3 === 0) {
      const a = rng() * Math.PI * 2;
      for (const off of [0, Math.PI]) spots.push({ x: player.x + Math.cos(a + off) * 4.5, z: player.z + Math.sin(a + off) * 4.5 });
    }
    for (const s of spots) {
      const atk = { id: f.nextId++, x: s.x, z: s.z, left: W.attackWarn, radius: W.attackRadius };
      f.attacks.push(atk);
      ev.push({ type: 'warn', attack: atk });
    }
  }
  for (const a of f.attacks) a.left -= dt;
  for (const a of f.attacks.filter(a => a.left <= 0)) {
    ev.push({ type: 'blast', attack: a });
    if (Math.hypot(player.x - a.x, player.z - a.z) <= a.radius) {
      f.playerHp = Math.max(0, f.playerHp - W.attackDamage);
      ev.push({ type: 'hit', damage: W.attackDamage });
      if (f.playerHp <= 0) { f.over = 'lose'; ev.push({ type: 'lose' }); break; }
    }
  }
  f.attacks = f.attacks.filter(a => a.left > 0);
  return ev;
}
