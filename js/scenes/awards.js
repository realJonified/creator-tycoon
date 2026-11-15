// Meilensteine: goldene Abzeichen für Abo-Zahlen.
import { h, svg, setText, progressBar } from '../ui/dom.js';
import { fmt, fmtPercent } from '../core/format.js';
import { awardMult, nextAward } from '../core/formulas.js';
import { badgeSVG } from '../ui/art.js';
import { AWARDS } from '../data/awards.js';

export default {
  id: 'awards', title: 'Awards', icon: '🏆', nav: true, order: 5,

  create(ctx) {
    const bar = progressBar('Fortschritt zum nächsten Award');
    let bonus, nextText, shelf, key = '';

    function render() {
      const S = ctx.S;
      const k = S.awards.join();
      if (k !== key) {
        key = k;
        shelf.replaceChildren(...AWARDS.map(a => {
          const got = S.awards.includes(a.id);
          return h('div', { class: 'award' + (got ? ' got' : '') },
            svg(badgeSVG(a, { got }), 'badge'),
            h('div', { class: 'award-name' }, a.name),
            h('div', { class: 'muted small' }, `${fmt(a.subs)} Abos`),
            h('div', { class: 'award-state small' }, got ? `+${fmtPercent(a.bonus)} Aufrufe ✓` : `+${fmtPercent(a.bonus)} · ${a.gems} 💎`));
        }));
      }
      setText(bonus, `${S.awards.length} von ${AWARDS.length} · Aufrufe +${fmtPercent(awardMult(S) - 1)}`);
      const next = nextAward(S);
      setText(nextText, next ? `Nächster Award: ${next.icon} ${next.name} bei ${fmt(next.subs)} Abos (du hast ${fmt(S.subs)})` : 'Du hast alle Awards! ♾️');
      bar.set(next ? S.subs / next.subs : 1);
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'row between scene-head' }, h('h1', null, 'Awards'), bonus = h('span', { class: 'sub' })),
          h('div', { class: 'card' }, nextText = h('p', { class: 'tight' }), bar.el),
          shelf = h('div', { class: 'shelf' }),
        );
      },
      render,
    };
  },
};
