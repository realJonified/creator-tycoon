// Hoverboards: Besitz, Ausrüsten und die Fahrphysik. Reine Logik ohne three.js, in Node testbar.
// Ein Board macht nur schneller unterwegs, es ändert nichts an Geld oder Abos.
import { W } from '../data/balance.js';
import { BOARDS, STARTER_BOARD } from '../data/content.js';
import { resolve } from './physics.js';
import { canAfford, spend } from './num.js';

export const findBoard = id => BOARDS.find(b => b.id === id) || null;
export const ownsBoard = (S, id) => (S.boards || []).includes(id);
export const equippedBoard = S => (S.board && ownsBoard(S, S.board) ? findBoard(S.board) : null);

// Ausrüsten: nur eigene Boards. null = keins ausgerüstet.
export function equipBoard(S, id) {
  if (id !== null && !ownsBoard(S, id)) return false;
  S.board = id;
  return true;
}

// Fahrwerte eines Boards. Unter Wasser langsamer und träger.
export function boardStats(board, underwater = false) {
  const k = underwater ? W.board.underwater : 1;
  return { speed: board.speed * k, accel: board.accel * k, turn: board.turn };
}

export const STARTER = STARTER_BOARD;

// ---------- Kaufen und Kisten ----------
export const buyable = b => b.price != null;
export function canBuyBoard(S, id) {
  const b = findBoard(id);
  return !!(b && buyable(b) && !ownsBoard(S, id) && canAfford(S.money, b.price));
}
// Kaufen rüstet das neue Board gleich aus.
export function buyBoard(S, id) {
  if (!canBuyBoard(S, id)) return false;
  S.money = spend(S.money, findBoard(id).price);
  S.boards.push(id);
  S.board = id;
  return true;
}
// Boards, die es nur aus Boss-Kisten gibt und die man noch nicht hat (pro Seltenheit)
export const chestBoards = (S, rarity) => BOARDS.filter(b => !buyable(b) && b.id !== STARTER_BOARD && b.rarity === rarity && !ownsBoard(S, b.id));
// Ein Board aus der Kiste gutschreiben (ausgerüstet wird es nicht automatisch)
export function grantBoard(S, id) {
  if (!findBoard(id) || ownsBoard(S, id)) return false;
  S.boards.push(id);
  return true;
}

// ---------- Fahrphysik ----------
// Die Fahrt hat eine Richtung (heading, wie facing der Figur: Bewegung = sin/cos) und eine Geschwindigkeit (vx, vz).
// Das Board dreht sich höchstens mit "turn" rad/s zur gewünschten Richtung, beschleunigt in seine Richtung und
// rutscht seitlich nur kurz nach (grip). Ohne Eingabe bremst die Reibung. Wände: kein Durchfahren, leichtes Abprallen.
export function createRide(heading = 0) {
  return { vx: 0, vz: 0, heading, lean: 0, speed: 0 };
}

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// move = { x, y } (-1..1) relativ zur Kamera, camYaw = Blickrichtung der Kamera.
// Verändert pos (x, z) und ride. Gibt zurück, ob das Board an eine Wand gestossen ist.
export function stepRide(ride, pos, dt, move, camYaw, stats, colliders, bounds = null) {
  const len = Math.min(1, Math.hypot(move.x, move.y));
  const before = ride.heading;
  if (len > 0.05) {
    // gewünschte Richtung (vorwärts = von der Kamera weg), wie beim Gehen
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    const want = Math.atan2(fx * move.y + rx * move.x, fz * move.y + rz * move.x);
    const diff = wrap(want - ride.heading), maxTurn = stats.turn * dt;
    ride.heading = wrap(ride.heading + Math.max(-maxTurn, Math.min(maxTurn, diff)));
    // Schub in Board-Richtung, schwächer solange das Board noch quer zur gewünschten Richtung steht
    const thrust = stats.accel * len * Math.max(0.25, Math.cos(diff));
    ride.vx += Math.sin(ride.heading) * thrust * dt;
    ride.vz += Math.cos(ride.heading) * thrust * dt;
  } else {
    const f = Math.exp(-W.board.friction * dt);
    ride.vx *= f; ride.vz *= f;
  }
  // Seitliches Rutschen abbauen
  const hx = Math.sin(ride.heading), hz = Math.cos(ride.heading);
  const fwd = ride.vx * hx + ride.vz * hz, side = ride.vx * hz - ride.vz * hx;
  const keep = side * Math.exp(-W.board.grip * dt);
  ride.vx = hx * fwd + hz * keep; ride.vz = hz * fwd - hx * keep;
  // Höchsttempo (bei halb gedrücktem Joystick entsprechend weniger)
  const cap = stats.speed * Math.max(len, 0.0001);
  let sp = Math.hypot(ride.vx, ride.vz);
  if (sp > cap && len > 0.05) {
    const target = Math.max(cap, sp * Math.exp(-W.board.friction * 2 * dt)); // weich herunter, nicht schlagartig
    ride.vx *= target / sp; ride.vz *= target / sp; sp = target;
  }
  if (sp > stats.speed) { ride.vx *= stats.speed / sp; ride.vz *= stats.speed / sp; }
  if (sp < 0.02 && len <= 0.05) { ride.vx = ride.vz = 0; }

  // Bewegen in kleinen Schritten, damit man auch schnell nicht durch dünne Hindernisse rutscht
  let hit = false;
  const dist = Math.hypot(ride.vx, ride.vz) * dt;
  const steps = Math.max(1, Math.ceil(dist / 0.2));
  for (let i = 0; i < steps; i++) {
    const tx = pos.x + (ride.vx * dt) / steps, tz = pos.z + (ride.vz * dt) / steps;
    pos.x = tx; pos.z = tz;
    resolve(pos, BOARD_RADIUS, colliders, bounds);
    const cx = pos.x - tx, cz = pos.z - tz, c = Math.hypot(cx, cz);
    if (c > 1e-6) {
      // Wand: Anteil der Geschwindigkeit in die Wand hinein entfernen (plus etwas Abprallen)
      const nx = cx / c, nz = cz / c, vn = ride.vx * nx + ride.vz * nz;
      if (vn < 0) {
        ride.vx -= nx * vn * (1 + W.board.bounce); ride.vz -= nz * vn * (1 + W.board.bounce);
        ride.vx *= 0.85; ride.vz *= 0.85; // Reibung an der Wand
        hit = true;
      }
    }
  }
  ride.speed = Math.hypot(ride.vx, ride.vz);
  // Neigung in Kurven: nach innen, stärker bei mehr Tempo
  const yawRate = dt > 0 ? wrap(ride.heading - before) / dt : 0;
  const wantLean = Math.max(-1, Math.min(1, yawRate / stats.turn)) * W.board.maxLean * Math.min(1, ride.speed / (stats.speed * 0.5));
  ride.lean += (wantLean - ride.lean) * Math.min(1, dt * 8);
  return hit;
}

// Kollisionsradius der Figur auf dem Board (etwas grösser als zu Fuss, das Deck ist länger)
export const BOARD_RADIUS = 0.6;
