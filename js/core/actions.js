// Verbindet die Spielzüge mit dem Store: führt sie aus und meldet, was passiert ist.
// Szenen rufen nur diese Funktionen auf und hören auf Store-Ereignisse.
import { recordVideo, buy, tick, applyOffline } from './game.js';
import { buyCount } from './formulas.js';

export function createActions(store, { rng = Math.random } = {}) {
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
    },

    // Zeit, in der das Spiel nicht lief (Tab im Hintergrund oder geschlossen).
    away(seconds) {
      const result = applyOffline(S(), seconds);
      if (result) store.emit('offline', result);
      return result;
    },
  };
}
