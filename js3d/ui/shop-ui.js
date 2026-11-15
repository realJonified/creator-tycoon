// Shop "Bitbazar": PC-Teile kaufen (jeder Kauf wird teurer) und Häuser-Übersicht.
import { h, setText, setDisabled } from '../../js/ui/dom.js';
import { eur, fmtMult, fmtTime } from '../../js/core/format.js';
import { partPrice, partLevel, buyPart, pcQuality, uploadSeconds, nextHouse } from '../core/economy.js';
import { PARTS } from '../data/content.js';

export function openShop(panels, ctx) {
  const rows = [];
  let summary;
  function render() {
    const S = ctx.S;
    for (const r of rows) {
      const price = partPrice(S, r.p.id);
      setText(r.level, `Stufe ${partLevel(S, r.p.id)}`);
      setText(r.btn, eur(price));
      setDisabled(r.btn, S.money < price);
    }
    const nh = nextHouse(S);
    setText(summary, `PC-Qualität ${fmtMult(pcQuality(S))} · Upload ${fmtTime(Math.ceil(uploadSeconds(S)))} · Geld ${eur(S.money)}${nh ? ` · Nächstes Haus: ${nh.name} (${eur(nh.price)}) an der Haustür kaufen` : ''}`);
  }
  panels.open((box, close) => {
    box.append(
      h('div', { class: 'panel-head' }, h('h2', null, '🛒 Bitbazar'), h('button', { class: 'x', type: 'button', 'aria-label': 'Schliessen', onclick: close }, '✕')),
      summary = h('p', { class: 'small muted' }),
      h('div', { class: 'shop-grid' }, PARTS.map(p => {
        const r = { p };
        r.el = h('div', { class: 'shop-item' },
          h('div', { class: 'shop-icon', 'aria-hidden': 'true' }, p.icon),
          h('div', { class: 'shop-info' },
            h('strong', null, p.name, ' ', r.level = h('span', { class: 'muted small' })),
            h('small', { class: 'muted' }, p.speed ? `Upload × ${String(p.speed).replace('.', ',')} pro Stufe` : `+${Math.round(p.quality * 100)} % Video-Qualität pro Stufe${p.cut ? ', schnellerer Schnitt' : ''}`)),
          r.btn = h('button', { class: 'btn buy', type: 'button', onclick: () => {
            const ok = buyPart(ctx.S, p.id);
            ctx.audio.play(ok ? 'buy' : 'denied');
            if (ok) { ctx.toast(`${p.icon} ${p.name} auf Stufe ${partLevel(ctx.S, p.id)}!`); ctx.persist(); ctx.onPartsChanged(); }
            render();
          } }));
        rows.push(r);
        return r.el;
      })),
    );
    render();
  }, { cls: 'wide', update: render });
}
