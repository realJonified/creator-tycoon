import { fmt } from '../../js/core/format.js';

// NPC-YouTuber ohne Grafik: laufen ihre Wegpunkte als Schleife ab, bleiben an Ecken kurz stehen,
// ihre Abozahl wächst langsam mit der Spielzeit. Kein Pathfinding, nur gerade Strecken.

export const NPC_PAUSE = 1.2;      // Sekunden Pause an jedem Wegpunkt
export const TALK_SECONDS = 3.5;   // so lange steht ein NPC beim Reden still

// Sätze für die Sprechblase. {name} = Name des Spielers wird nicht gebraucht, {sub} = eigene Abos.
export const LINES = [
  'Hey! Hast du mein neues Video schon gesehen?',
  'Heute nehme ich zehn Videos auf. Oder elf.',
  'Mein WLAN ist so langsam, ich lade per Brieftaube hoch.',
  'Tipp: Mehr Tipper im Schnitt, mehr Qualität!',
  'Der Glitchgolem hat mich gestern umgehauen.',
  'Ich hab schon {sub} Abos. Wahnsinn, oder?',
  'Kennst du schon den Bitbazar? Neue Grafikkarten!',
  'Winke, winke! Abonnieren nicht vergessen!',
  'Ich suche noch ein Thema für morgen. Ideen?',
  'Pssst, hinter dem Portal gibt es Kisten.',
];

// Abozahl nach `hours` Spielstunden: wächst um growth (Anteil) pro Stunde, gleichmässig und dauerhaft,
// weil sie aus der gespeicherten Spielzeit berechnet wird (kein eigener Spielstand nötig).
export const npcSubs = (def, hours) => Math.floor(def.subs * Math.pow(1 + def.growth, Math.max(0, hours)));

export function createNpc(def, startOffset = 0) {
  const n = { def, seg: 0, t: 0, pause: 0, talk: 0, x: def.path[0][0], z: def.path[0][1], heading: 0, walking: true, phase: startOffset };
  // Versetzter Start, damit nicht alle gleichzeitig an der Ecke stehen
  if (startOffset) stepNpc(n, startOffset);
  return n;
}

const segLen = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Ein Zeitschritt. Rückgabe: ob der NPC gerade läuft (für die Bein-Animation).
export function stepNpc(n, dt) {
  const P = n.def.path;
  if (n.talk > 0) { n.talk = Math.max(0, n.talk - dt); n.walking = false; return false; }
  let left = dt;
  let guard = 0;
  while (left > 0 && guard++ < 64) {
    if (n.pause > 0) { const p = Math.min(n.pause, left); n.pause -= p; left -= p; n.walking = false; continue; }
    const a = P[n.seg], b = P[(n.seg + 1) % P.length];
    const len = segLen(a, b) || 1e-6;
    const remain = (1 - n.t) * len;
    const step = n.def.speed * left;
    n.heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
    if (step < remain) {
      n.t += step / len; left = 0;
    } else {
      left -= remain / n.def.speed;
      n.seg = (n.seg + 1) % P.length; n.t = 0; n.pause = NPC_PAUSE;
    }
    const c = P[n.seg], d = P[(n.seg + 1) % P.length];
    n.x = c[0] + (d[0] - c[0]) * n.t; n.z = c[1] + (d[1] - c[1]) * n.t;
    n.walking = n.pause <= 0;
  }
  n.phase += dt;
  return n.walking;
}

// Reden: NPC bleibt stehen, dreht sich zum Spieler und sagt einen Satz.
export function talkTo(n, player, hours, rng = Math.random) {
  n.talk = TALK_SECONDS;
  n.heading = Math.atan2(player.x - n.x, player.z - n.z);
  const line = LINES[Math.floor(rng() * LINES.length)];
  return line.replace('{sub}', fmt(npcSubs(n.def, hours)));
}
