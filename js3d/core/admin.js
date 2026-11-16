// Versteckter Admin-Modus: ein Test- und Entwicklerwerkzeug für dieses Einzelspieler-Spiel.
// Ehrlicher Hinweis: Das Spiel hat keine Online-Funktionen, keine Konten und keine Bestenlisten. Alles, was hier
// geändert wird, betrifft nur den Spielstand in diesem Browser und hat keine Auswirkung auf andere Spieler.
//
// - Ein- und Ausschalten: 20-mal schnell auf den Titel im Menü tippen (höchstens ~1 s zwischen zwei Tipps).
//   Es gibt absichtlich keine Rückmeldung.
// - Ob der Modus an ist, steht nur im Arbeitsspeicher (nicht im Spielstand, nicht im Browser-Speicher).
//   Nach dem Neuladen ist er wieder aus. Geänderte Werte (Geld, Abos …) bleiben wie normaler Fortschritt.
// - Beim ersten Einschalten wird der Spielstand gemerkt. "Entwicklerdaten zurücksetzen" stellt ihn wieder her.
//   Dieser Merker lebt ebenfalls nur bis zum Neuladen.
// Reine Logik ohne DOM und three.js, in Node getestet. Im Spiel heisst der Bereich nur "Entwickler".
import { W } from '../data/balance.js';
import { MAPS } from '../data/maps.js';
import { BOARDS, STARTER_BOARD } from '../data/content.js';
import { checkButtons } from './economy.js';

export const ADMIN_TAPS = 20;
export const ADMIN_MAX_GAP_MS = 1000;

// Tipp-Geste: tap(zeit in ms) gibt true zurück, wenn der 20. schnelle Tipp in Folge kam.
// Eine Pause über maxGap setzt den Zähler zurück. Nach einem Treffer beginnt die Zählung neu.
export function createTapGesture({ taps = ADMIN_TAPS, maxGap = ADMIN_MAX_GAP_MS } = {}) {
  let count = 0, last = -Infinity;
  return {
    get count() { return count; },
    tap(now) {
      if (now - last > maxGap) count = 0;
      last = now;
      count++;
      if (count >= taps) { count = 0; last = -Infinity; return true; }
      return false;
    },
  };
}

// Zustand des Modus (nur im Speicher). skipBoss = Bosskampf überspringen, fast = Zeit × 10.
export function createAdmin() {
  return { on: false, snapshot: null, skipBoss: false, fast: false };
}

export const timeScale = A => (A.on && A.fast ? 10 : 1);

// Umschalten. Beim ersten Einschalten den echten Spielstand merken. Aus = alle Schalter aus.
export function toggleAdmin(A, S) {
  A.on = !A.on;
  if (A.on && !A.snapshot) A.snapshot = takeSnapshot(S);
  if (!A.on) { A.skipBoss = false; A.fast = false; }
  return A.on;
}

const copy = v => JSON.parse(JSON.stringify(v));
// Alles, was der Entwickler-Bereich ändern kann
export function takeSnapshot(S) {
  return copy({ money: S.money, subs: S.subs, buttons: S.buttons, maps: S.maps, map: S.map, houses: S.houses, home: S.home, boards: S.boards, board: S.board });
}

const clamp = v => (Number.isFinite(v) && v > 0 ? Math.min(v, W.maxValue) : 0);

export function setMoney(S, value) {
  S.money = clamp(value);
  return S.money;
}

// Abos setzen. Kanalknöpfe (Meilensteine) für alle erreichten Schwellen werden sofort vergeben und zurückgegeben.
// Senkt man die Abos, bleiben schon verdiente Knöpfe (wie im normalen Spiel). Zurück geht es mit resetAll.
export function setSubs(S, value) {
  S.subs = clamp(value);
  return checkButtons(S);
}

// Alle fertigen Maps, alle Häuser darauf und alle Hoverboards freischalten.
export function unlockAll(S) {
  S.maps = MAPS.filter(m => m.ready).map(m => m.id);
  for (const m of MAPS) if (m.ready) S.houses[m.id] = m.houses.map(h => h.id);
  S.boards = BOARDS.map(b => b.id);
}

// Nur die Freischaltungen (Maps, Häuser, Boards) auf den gemerkten Stand zurück. Geld und Abos bleiben.
// Gibt true zurück, wenn die aktuelle Map dabei wieder gesperrt wurde (dann muss das Spiel zurückreisen).
export function resetUnlocks(S, A) {
  const snap = A.snapshot || takeSnapshot(freshUnlocks());
  S.maps = copy(snap.maps); S.houses = copy(snap.houses); S.home = snap.home;
  S.boards = copy(snap.boards); S.board = snap.board;
  const lost = !S.maps.includes(S.map);
  if (lost) S.map = 'bucht';
  return lost;
}

// Alle Testwerte zurück auf den gemerkten Stand (Geld, Abos, Knöpfe, Freischaltungen) und alle Schalter aus.
export function resetAll(S, A) {
  const lost = resetUnlocks(S, A);
  if (A.snapshot) { S.money = A.snapshot.money; S.subs = A.snapshot.subs; S.buttons = copy(A.snapshot.buttons); }
  A.skipBoss = false; A.fast = false;
  return lost;
}

function freshUnlocks() {
  return { money: 0, subs: 0, buttons: [], maps: ['bucht'], map: 'bucht', houses: { bucht: ['wohnung'] }, home: 'wohnung', boards: [STARTER_BOARD], board: STARTER_BOARD };
}

// Welche Bereiche die Einstellungen zeigen. Der Entwickler-Bereich existiert nur, wenn der Modus an ist.
export function settingsSections(A) {
  const list = ['grafik', 'fps', 'ton', 'umsehen', 'spielstand'];
  if (A?.on) list.push('entwickler');
  return list;
}
