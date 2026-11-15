// Shop: Geräte, WLAN, Handy und Häuser. Man kauft immer die nächste Stufe einer Kategorie.
import { h, svg, setText, setDisabled } from '../ui/dom.js';
import { eur, fmtMult } from '../core/format.js';
import { gearItem, nextGear, houseIndex, nextHouse, houseStep } from '../core/formulas.js';
import { houseSVG } from '../ui/art.js';
import { GEAR_CATS } from '../data/gear.js';
import { HOUSES } from '../data/houses.js';

const TABS = [
  { id: 'geraete', label: '🖥️ Geräte' },
  { id: 'netz', label: '📶 WLAN' },
  { id: 'handy', label: '📱 Handy' },
  { id: 'haeuser', label: '🏡 Häuser' },
];

export default {
  id: 'shop', title: 'Shop', icon: '🛒', nav: true, order: 3,

  create(ctx) {
    let tab = 'geraete', tabBtns = new Map(), list, rows = [];

    function buyGear(cat) {
      const item = ctx.game.buyGear(cat);
      ctx.audio.play(item ? 'buy' : 'denied');
      if (item) { ctx.toast(`${item.icon} ${item.name} gekauft!`); ctx.persist(); build(); }
    }

    function buyHouse() {
      const house = ctx.game.buyHouse();
      ctx.audio.play(house ? 'prestige' : 'denied');
      if (house) { ctx.toast(`🏡 Umgezogen: ${house.name}!`); ctx.persist(); ctx.scenes.go('haus'); }
    }

    function gearRow(c) {
      const S = ctx.S, cur = gearItem(S, c.id), next = nextGear(S, c.id);
      const r = { cat: c.id, next };
      r.el = h('div', { class: 'item shop-item' },
        h('div', { class: 'item-icon', 'aria-hidden': 'true' }, cur.icon),
        h('div', { class: 'item-info' },
          h('div', { class: 'item-name' }, c.name, ' ', h('span', { class: 'sub' }, `Stufe ${S.gear[c.id]}`)),
          h('div', { class: 'small' }, `Jetzt: ${cur.name} (${fmtMult(cur.mult)})`),
          next && h('div', { class: 'muted small' }, `Nächstes: ${next.icon} ${next.name} (${fmtMult(next.mult)}) · ${c.desc}`),
          r.lock = h('div', { class: 'lock small' })),
        next ? (r.btn = h('button', { class: 'btn buy', type: 'button', onclick: () => buyGear(c.id) }, eur(next.price)))
          : h('span', { class: 'sub' }, 'Höchste Stufe ✓'));
      return r;
    }

    function houseRow(house, i) {
      const S = ctx.S, cur = houseIndex(S);
      const r = { house, i };
      const state = i <= cur ? (i === cur ? 'Hier wohnst du' : 'Bewohnt ✓') : null;
      r.el = h('div', { class: 'item shop-house' + (i < cur ? ' past' : '') + (i === cur ? ' current' : '') },
        svg(houseSVG(house, { size: 'mini' }), 'mini-house'),
        h('div', { class: 'item-info' },
          h('div', { class: 'item-name' }, `${i + 1}. ${house.name}`),
          h('div', { class: 'muted small' }, i === 0 ? 'Startzuhause' : `Aufrufe ${fmtMult(houseStep(i))} · mehr Platz für Geräte`)),
        state ? h('span', { class: 'sub' }, state)
          : i === cur + 1 ? (r.btn = h('button', { class: 'btn buy', type: 'button', onclick: buyHouse }, eur(house.price)))
            : h('span', { class: 'sub' }, '🔒 ' + eur(house.price)));
      return r;
    }

    function build() {
      for (const [id, b] of tabBtns) b.setAttribute('aria-selected', String(id === tab));
      if (tab === 'haeuser') {
        const cur = houseIndex(ctx.S);
        rows = HOUSES.map(houseRow).filter(r => r.i >= cur - 1 && r.i <= cur + 4);
      } else {
        rows = GEAR_CATS.filter(c => c.tab === tab).map(gearRow);
      }
      list.replaceChildren(...rows.map(r => r.el));
      render();
    }

    function render() {
      const S = ctx.S;
      for (const r of rows) {
        if (!r.btn) continue;
        if (r.cat) {
          const needHouse = r.next.house > houseIndex(S);
          setText(r.lock, needHouse ? `🔒 Braucht Haus ${r.next.house + 1}: ${HOUSES[r.next.house].name}` : '');
          setDisabled(r.btn, needHouse || S.money < r.next.price);
        } else {
          setDisabled(r.btn, S.money < r.house.price);
        }
      }
    }

    return {
      mount(el, params) {
        if (TABS.some(t => t.id === params?.tab)) tab = params.tab;
        el.append(
          h('div', { class: 'row between scene-head' }, h('h1', null, 'Shop'),
            h('div', { class: 'seg tabs', role: 'tablist', 'aria-label': 'Shop-Bereiche' }, TABS.map(t => {
              const b = h('button', { class: 'seg-btn', type: 'button', role: 'tab', onclick: () => { tab = t.id; build(); } }, t.label);
              tabBtns.set(t.id, b);
              return b;
            }))),
          list = h('div', { class: 'card shop-list' }),
          h('p', { class: 'muted small center' }, 'Hoverboards und PC-Teile gibt es nicht im Shop, sondern in Kisten 🎁.'),
        );
        build();
      },
      render,
    };
  },
};
