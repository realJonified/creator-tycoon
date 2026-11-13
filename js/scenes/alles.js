// Übergangs-Szene für Etappe 1: zeigt das ganze bisherige Spiel auf einer Seite,
// indem sie Studio, Shop und Awards untereinander einhängt.
import studio from './studio.js';
import shop from './shop.js';
import awards from './awards.js';

export default {
  id: 'alles', title: 'Spiel', icon: '🎬', nav: true, order: 1,

  create(ctx) {
    const parts = [studio, shop, awards].map(def => def.create(ctx));
    return {
      mount(el) {
        for (const part of parts) {
          const box = document.createElement('div');
          box.className = 'scene';
          el.append(box);
          part.mount(box, {});
        }
      },
      unmount() { for (const part of parts) part.unmount?.(); },
      update(dt) { for (const part of parts) part.update?.(dt); },
      render() { for (const part of parts) part.render?.(); },
    };
  },
};
