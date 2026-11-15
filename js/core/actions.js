// Verbindet die Spielzüge mit dem Store: führt sie aus und meldet, was passiert ist.
import { tick, applyOffline, finishVideo, buyGear, buyHouse, checkAwards } from './game.js';
import { openCrate, equipBoard } from './crates.js';

export function createActions(store, { rng = Math.random } = {}) {
  const S = () => store.state;
  const awards = list => { for (const award of list) store.emit('award', { award }); };

  return {
    tick(dt) { awards(tick(S(), dt)); },

    away(seconds) {
      const r = applyOffline(S(), seconds);
      if (r) store.emit('offline', r);
      return r;
    },

    finishVideo(video) {
      const r = finishVideo(S(), video);
      store.emit('video', r);
      awards(r.awards);
      return r;
    },

    buyGear(cat) {
      const item = buyGear(S(), cat);
      store.emit(item ? 'purchase' : 'denied', { cat, item });
      return item;
    },

    buyHouse() {
      const house = buyHouse(S());
      store.emit(house ? 'house' : 'denied', { house });
      if (house) awards(checkAwards(S()));
      return house;
    },

    openCrate(id) {
      const r = openCrate(S(), id, rng);
      store.emit(r ? 'crate' : 'denied', r);
      return r;
    },

    equipBoard(id) {
      const ok = equipBoard(S(), id);
      if (ok) store.emit('equip', { id });
      return ok;
    },
  };
}
