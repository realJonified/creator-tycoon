// Overlay beim Freischalten eines Awards: Abzeichen mit kleiner Animation.
import { h, svg } from '../ui/dom.js';
import { fmt, fmtPercent } from '../core/format.js';
import { badgeSVG } from '../ui/art.js';

export default {
  id: 'award', title: 'Neuer Award',

  create(ctx) {
    return {
      mount(el, p) {
        const a = p.award;
        el.append(
          h('div', { class: 'confetti', 'aria-hidden': 'true' }, ...Array.from({ length: 14 }, (_, i) => h('i', { style: `--i:${i}` }))),
          svg(badgeSVG(a), 'badge big pop-in'),
          h('h2', null, `${a.name}!`),
          h('p', { class: 'muted center' }, `Du hast ${fmt(a.subs)} Abonnenten erreicht.`),
          h('p', { class: 'center tight' }, `🎁 +${fmtPercent(a.bonus)} Aufrufe für immer · +${a.gems} 💎`),
          h('div', { class: 'overlay-actions' },
            h('button', { class: 'btn play', type: 'button', 'data-autofocus': true, onclick: p.close }, 'Super!')),
        );
        ctx.audio.play('award');
      },
    };
  },
};
