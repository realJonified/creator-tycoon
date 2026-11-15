// Haus: die Hauptszene. Zeigt dein Haus, deine Figur, dein Setup und den Weg zum nächsten Umzug.
import { h, svg, setText, progressBar } from '../ui/dom.js';
import { fmt, eur, fmtMult, fmtTime } from '../core/format.js';
import { currentHouse, nextHouse, houseIndex, gearItem, findBoard, moneyPerSec, viewMult, audience, uploadSeconds, nextAward, bestPart } from '../core/formulas.js';
import { houseSVG, avatarSVG } from '../ui/art.js';
import { GEAR_CATS } from '../data/gear.js';
import { SLOTS } from '../data/crates.js';
import { HOUSES } from '../data/houses.js';

export default {
  id: 'haus', title: 'Haus', icon: '🏠', nav: true, order: 1,

  create(ctx) {
    const bar = progressBar('Geld für das nächste Haus');
    const awardBar = progressBar('Abos bis zum nächsten Award');
    let houseBox, avatarBox, title, setup, parts, nextText, nextBtn, stats, awardText, key = '';

    function renderArt() {
      const S = ctx.S, house = currentHouse(S), board = S.board ? findBoard(S.board) : null;
      const k = `${house.id}|${board?.id}|${JSON.stringify(S.gear)}|${Object.keys(S.parts).join()}`;
      if (k === key) return;
      key = k;
      houseBox.innerHTML = houseSVG(house);
      avatarBox.innerHTML = avatarSVG({ board });
      setText(title, `${house.icon} ${house.name}`);
      setup.replaceChildren(...GEAR_CATS.map(c => {
        const item = gearItem(S, c.id);
        return h('div', { class: 'setup-item', title: c.desc },
          h('span', { class: 'setup-icon', 'aria-hidden': 'true' }, item.icon),
          h('span', null, h('small', { class: 'muted' }, c.name), h('span', { class: 'setup-name' }, item.name)));
      }));
      parts.replaceChildren(...SLOTS.map(s => {
        const p = bestPart(S, s.id);
        return h('span', { class: 'chip' + (p ? '' : ' empty') }, `${s.icon} ${p ? p.name : s.name + ': leer'}`);
      }));
    }

    function render() {
      const S = ctx.S;
      renderArt();
      const next = nextHouse(S);
      if (next) {
        setText(nextText, `Nächstes Haus: ${next.icon} ${next.name} für ${eur(next.price)}`);
        bar.set(S.money / next.price);
        setText(nextBtn, S.money >= next.price ? '🏡 Jetzt umziehen' : '🛒 Zum Shop');
      } else {
        setText(nextText, 'Du wohnst im größten Haus des Spiels! ✨');
        bar.set(1);
        nextBtn.hidden = true;
      }
      const award = nextAward(S);
      setText(awardText, award ? `Nächster Award: ${award.icon} ${award.name} bei ${fmt(award.subs)} Abos` : 'Alle Awards geholt! ♾️');
      awardBar.set(award ? S.subs / award.subs : 1);
      setText(stats, `Haus ${houseIndex(S) + 1}/${HOUSES.length} · Aufrufe-Bonus ${fmtMult(viewMult(S))} · Reichweite ${fmtMult(audience(S))} · Upload ${fmtTime(uploadSeconds(S))} · alte Videos +${eur(moneyPerSec(S))}/s`);
    }

    function onNext() {
      const next = nextHouse(ctx.S);
      ctx.scenes.go('shop', { tab: next && ctx.S.money >= next.price ? 'haeuser' : 'geraete' });
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'card house-card' },
            h('div', { class: 'row between' }, title = h('h2', { class: 'tight' }), h('span', { class: 'sub' }, 'Dein Zuhause')),
            h('div', { class: 'house-stage' },
              houseBox = h('div', { class: 'house-box' }),
              avatarBox = h('div', { class: 'avatar-box bob' })),
            h('button', { class: 'btn play big wide', type: 'button', 'data-autofocus': true, onclick: () => ctx.scenes.go('video') }, '🎬 Video machen'),
            stats = h('p', { class: 'muted small center', style: 'margin: 10px 0 0' }),
          ),
          h('div', { class: 'stack' },
            h('div', { class: 'card' },
              nextText = h('p', { class: 'tight' }), bar.el,
              h('div', { style: 'margin-top: 10px' }, nextBtn = h('button', { class: 'btn gold', type: 'button', onclick: onNext })),
            ),
            h('div', { class: 'card' }, awardText = h('p', { class: 'tight' }), awardBar.el),
            h('div', { class: 'card' },
              h('h2', null, '🧰 Dein Setup'),
              setup = h('div', { class: 'setup' }),
              h('h2', { style: 'margin-top: 14px' }, '🔩 PC-Teile ', h('span', { class: 'sub' }, 'aus Kisten')),
              parts = h('div', { class: 'chips' }),
            ),
          ),
        );
      },
      render,
    };
  },
};
