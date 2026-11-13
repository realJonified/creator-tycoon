// Studio: die Hauptszene. Hier nimmt man Videos auf.
import { h, setText, progressBar } from '../ui/dom.js';
import { fmt, eur, fmtMult } from '../core/format.js';
import { clickMoney, clickSubs, subMult, nextAward } from '../core/formulas.js';

export default {
  id: 'studio', title: 'Studio', icon: '🎬', nav: true, order: 1,

  create(ctx) {
    let area, videos, info, awardName, awardText;
    const bar = progressBar('Fortschritt zum nächsten Award');

    function floatText(text, cls, x, y) {
      const el = h('div', { class: 'float ' + cls, 'aria-hidden': 'true' }, text);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      area.append(el);
      setTimeout(() => el.remove(), 900);
    }

    function onRecord(e) {
      const r = ctx.game.record();
      ctx.audio.play(r.viral ? 'viral' : 'click');
      if (ctx.animations()) {
        const box = area.getBoundingClientRect();
        // Bei Tastatur-Klicks (keine Mausposition) erscheint der Text in der Mitte.
        const byMouse = e.detail > 0 && e.clientX > 0;
        const x = (byMouse ? e.clientX - box.left : box.width / 2) - 30 + Math.random() * 30;
        const y = (byMouse ? e.clientY - box.top : box.height / 3) - 24;
        floatText('+' + eur(r.money), 'money', x, y);
        floatText('+' + fmt(r.subs) + ' 👥', 'subs', x + 8, y + 20);
      }
      render();
    }

    function render() {
      const S = ctx.S;
      setText(videos, fmt(S.videos) + ' Videos');
      setText(info, `Pro Video: +${eur(clickMoney(S))} · +${fmt(clickSubs(S))} Abos · Abo-Bonus ${fmtMult(subMult(S))}`);
      const next = nextAward(S);
      if (next) {
        setText(awardName, `${next.icon} ${next.name}`);
        setText(awardText, `${fmt(S.subs)} / ${fmt(next.subs)} Abos`);
        bar.set(S.subs / next.subs);
      } else {
        setText(awardName, '👑 Alle Awards geholt');
        setText(awardText, 'Zeit für einen neuen Kanal?');
        bar.set(1);
      }
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'card record-card' },
            h('h2', null, 'Studio ', videos = h('span', { class: 'sub' })),
            area = h('div', { class: 'record-area' },
              h('button', { class: 'rec-btn', type: 'button', onclick: onRecord, 'data-autofocus': true },
                h('span', { class: 'rec-icon', 'aria-hidden': 'true' }, '⏺️'), 'Video aufnehmen'),
              info = h('p', { class: 'muted center' }),
            ),
          ),
          h('div', { class: 'card' },
            h('h2', null, 'Nächster Award'),
            h('div', { class: 'row between' }, awardName = h('strong'), awardText = h('span', { class: 'muted small' })),
            bar.el,
          ),
        );
      },
      render,
    };
  },
};
