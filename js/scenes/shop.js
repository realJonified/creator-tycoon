// Shop: Ausrüstung und Team kaufen.
import { h, setText, setDisabled } from '../ui/dom.js';
import { fmt, eur } from '../core/format.js';
import { KINDS, owned, cost, buyCount } from '../core/formulas.js';

const SECTIONS = [
  { kind: 'up', title: '🛠️ Ausrüstung', hint: 'mehr pro Video', desc: i => `+${fmt(i.add)} Basiswert pro Video`, have: n => `Stufe ${n}` },
  { kind: 'w', title: '🧑‍💼 Team', hint: 'verdient automatisch', desc: i => `${fmt(i.rate)} Aufrufe/s je Person`, have: n => `× ${n}` },
];
const MODES = [[1, '×1'], [10, '×10'], ['max', 'Max']];

export default {
  id: 'shop', title: 'Shop', icon: '🛒', nav: true, order: 2,

  create(ctx) {
    const rows = [];        // { kind, item, row, have, btn }
    const modeBtns = new Map();

    function setMode(mode) {
      ctx.ui.buyMode = mode;
      for (const [m, btn] of modeBtns) btn.setAttribute('aria-pressed', String(m === mode));
      render();
    }

    function onBuy(kind, id) {
      const ok = ctx.game.buy(kind, id, ctx.ui.buyMode);
      ctx.audio.play(ok ? 'buy' : 'denied');
      render();
    }

    function render() {
      const S = ctx.S, mode = ctx.ui.buyMode;
      let prevOwned = true;
      for (const r of rows) {
        if (r.first) prevOwned = true;
        const n = buyCount(S, r.kind, r.item.id, mode);
        const price = cost(S, r.kind, r.item.id, n);
        const have = owned(S, r.kind, r.item.id);
        setText(r.have, r.section.have(have));
        setText(r.btn, (n > 1 ? `${n}× · ` : '') + eur(price));
        setDisabled(r.btn, S.money < price);
        r.btn.setAttribute('aria-label', `${r.item.name} kaufen, ${n} Stück für ${eur(price)}`);
        // Noch weit entfernte Dinge werden blasser gezeigt.
        r.row.classList.toggle('locked', !prevOwned && have === 0 && S.money < price);
        prevOwned = have > 0;
      }
    }

    return {
      mount(el) {
        const modes = h('div', { class: 'seg', role: 'group', 'aria-label': 'Kaufmenge' },
          MODES.map(([mode, label]) => {
            const btn = h('button', { type: 'button', class: 'seg-btn', onclick: () => setMode(mode) }, label);
            modeBtns.set(mode, btn);
            return btn;
          }));
        el.append(h('div', { class: 'row between scene-head' }, h('h1', null, 'Shop'), modes));
        const cols = h('div', { class: 'cols' });
        for (const section of SECTIONS) {
          const list = h('div', { class: 'card' },
            h('h2', null, section.title, ' ', h('span', { class: 'sub' }, section.hint)));
          KINDS[section.kind].list.forEach((item, i) => {
            const r = { kind: section.kind, section, item, first: i === 0 };
            r.row = h('div', { class: 'item' },
              h('div', { class: 'item-icon', 'aria-hidden': 'true' }, item.icon),
              h('div', { class: 'item-info' },
                h('div', { class: 'item-name' }, item.name, ' ', r.have = h('span', { class: 'sub' })),
                h('div', { class: 'muted small' }, section.desc(item))),
              r.btn = h('button', { type: 'button', class: 'btn buy', onclick: () => onBuy(section.kind, item.id) }),
            );
            rows.push(r);
            list.append(r.row);
          });
          cols.append(list);
        }
        el.append(cols);
        setMode(ctx.ui.buyMode);
      },
      render,
    };
  },
};
