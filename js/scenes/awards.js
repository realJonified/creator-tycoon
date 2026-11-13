// Awards-Regal: alle Meilensteine und der Fortschritt zum nächsten.
import { h, setText, progressBar } from '../ui/dom.js';
import { fmt, fmtPercent } from '../core/format.js';
import { awardMult, nextAward } from '../core/formulas.js';
import { AWARDS } from '../data/awards.js';
import { BALANCE as B } from '../data/balance.js';

export default {
  id: 'awards', title: 'Awards', icon: '🏆', nav: true, order: 3,

  create(ctx) {
    const tiles = new Map();
    const bar = progressBar('Fortschritt zum nächsten Award');
    let bonus, nextText;

    function render() {
      const S = ctx.S;
      for (const [id, tile] of tiles) {
        const got = S.awards.includes(id);
        tile.el.classList.toggle('got', got);
        setText(tile.state, got ? 'Geholt ✓' : 'Noch offen');
      }
      setText(bonus, `${S.awards.length} von ${AWARDS.length} · +${fmtPercent(awardMult(S) - 1)} Einnahmen`);
      const next = nextAward(S);
      setText(nextText, next
        ? `Nächster Award: ${next.icon} ${next.name} bei ${fmt(next.subs)} Abos (du hast ${fmt(S.subs)})`
        : 'Du hast alle Awards dieses Kanals geholt. 👑');
      bar.set(next ? S.subs / next.subs : 1);
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'row between scene-head' }, h('h1', null, 'Awards'), bonus = h('span', { class: 'sub' })),
          h('div', { class: 'card' }, nextText = h('p', { class: 'tight' }), bar.el),
          h('div', { class: 'shelf' }, AWARDS.map(a => {
            const tile = {};
            tile.el = h('div', { class: 'award' },
              h('div', { class: 'award-icon', 'aria-hidden': 'true' }, a.icon),
              h('div', { class: 'award-name' }, a.name),
              h('div', { class: 'muted small' }, `${fmt(a.subs)} Abos · +${fmtPercent(a.bonus ?? B.awardBonus)}`),
              tile.state = h('div', { class: 'award-state small' }),
            );
            tiles.set(a.id, tile);
            return tile.el;
          })),
        );
      },
      render,
    };
  },
};
