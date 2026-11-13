// Overlay: kurzer Hinweis bei einem viralen Hit. Blockiert nichts und verschwindet von allein.
import { h } from '../ui/dom.js';
import { fmt, eur } from '../core/format.js';
import { BALANCE as B } from '../data/balance.js';

export default {
  id: 'viral', title: 'Viraler Hit', modal: false,

  create() {
    let left = 1.8, close;
    return {
      mount(el, p) {
        close = p.close;
        el.setAttribute('role', 'status');
        el.append('🔥 Viraler Hit! ×' + B.viralMult,
          h('small', null, `+${eur(p.result.money)} · +${fmt(p.result.subs)} Abos`));
      },
      update(dt) {
        left -= dt;
        if (left <= 0) close();
      },
    };
  },
};
