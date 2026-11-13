// Verbindet die Spielzüge mit dem Store: führt sie aus und meldet, was passiert ist.
// Szenen rufen nur diese Funktionen auf und hören auf Store-Ereignisse.
import { recordVideo, buy, tick, applyOffline } from './game.js';
import { buyCount } from './formulas.js';
import { tickEvents, resolveEvent } from './events.js';
import { doPrestige, buyPerk } from './prestige.js';
import { ensureGoals, tickGoals, claimGoal, dayKey } from './goals.js';

export function createActions(store, { rng = Math.random, today = () => dayKey() } = {}) {
  const S = () => store.state;

  return {
    record() {
      const result = recordVideo(S(), rng);
      store.emit('video', result);
      if (result.viral) store.emit('viral', result);
      return result;
    },

    // mode: 1, 10 oder "max"
    buy(kind, id, mode = 1) {
      const n = buyCount(S(), kind, id, mode);
      const ok = buy(S(), kind, id, n);
      store.emit(ok ? 'purchase' : 'denied', { kind, id, n });
      return ok;
    },

    tick(dt) {
      for (const e of tick(S(), dt)) store.emit(e.type, e);
      const e = tickEvents(S(), dt, rng);
      if (e) store.emit(e.type, e);
      if (ensureGoals(S(), today())) store.emit('goals', S().goals);
      for (const goal of tickGoals(S())) store.emit('goalDone', goal);
    },

    // Zeit, in der das Spiel nicht lief (Tab im Hintergrund oder geschlossen).
    away(seconds) {
      const result = applyOffline(S(), seconds);
      if (result) store.emit('offline', result);
      return result;
    },

    // Ereignisse: öffnen hält die Uhr an, schliessen ohne Wahl lässt sie weiterlaufen.
    openEvent() { if (S().event) S().event.open = true; },
    closeEvent() { if (S().event) S().event.open = false; },
    chooseEvent(index) {
      const result = resolveEvent(S(), index, rng);
      if (result) store.emit('eventResolved', result);
      return result;
    },

    prestige() {
      const gain = doPrestige(S(), rng);
      if (gain > 0) store.emit('prestige', { gain });
      return gain;
    },

    buyPerk(id) {
      const ok = buyPerk(S(), id);
      store.emit(ok ? 'perk' : 'denied', { id });
      return ok;
    },

    claimGoal(index) {
      const result = claimGoal(S(), index);
      if (result) store.emit('goalClaimed', result);
      return result;
    },
  };
}
