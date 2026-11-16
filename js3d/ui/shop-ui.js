// Shop "Bitbazar": PC-Teile kaufen (jeder Kauf wird teurer) und Hoverboards (Update 3).
import { h, setText, setDisabled } from '../../js/ui/dom.js';
import { eur, fmtMult, fmtTime } from '../../js/core/format.js';
import { partPrice, partLevel, buyPart, pcQuality, uploadSeconds, nextHouse } from '../core/economy.js';
import { ownsBoard, canBuyBoard } from '../core/board.js';
import { PARTS, BOARDS, RARITIES } from '../data/content.js';
import { canAfford } from '../core/num.js';

const RARITY = Object.fromEntries(RARITIES.map(r => [r.id, r]));
const TRAIL = { none: 'keine Spur', glow: 'Leuchtspur', sparks: 'Funkenspur', stars: 'Sternenspur' };
const MAX = { speed: Math.max(...BOARDS.map(b => b.speed)), accel: Math.max(...BOARDS.map(b => b.accel)), turn: Math.max(...BOARDS.map(b => b.turn)) };

function statBar(label, value, max) {
  return h('div', { class: 'stat' }, h('span', null, label),
    h('div', { class: 'stat-bar', role: 'meter', 'aria-label': label, 'aria-valuenow': String(value), 'aria-valuemin': '0', 'aria-valuemax': String(max) },
      h('i', { style: `width:${Math.round((value / max) * 100)}%` })));
}

export function openShop(panels, ctx, tab = 'teile') {
  const rows = [], boardRows = [];
  let summary;
  function render() {
    const S = ctx.S;
    for (const r of rows) {
      const price = partPrice(S, r.p.id);
      setText(r.level, `Stufe ${partLevel(S, r.p.id)}`);
      setText(r.btn, eur(price));
      setDisabled(r.btn, !canAfford(S.money, price));
    }
    for (const r of boardRows) {
      const b = r.b, own = ownsBoard(S, b.id), on = S.board === b.id;
      r.el.classList.toggle('equipped', on);
      if (own) { setText(r.btn, on ? '✓ Ausgerüstet' : 'Ausrüsten'); setDisabled(r.btn, on); r.btn.className = 'btn' + (on ? '' : ' primary'); }
      else if (b.price != null) { setText(r.btn, eur(b.price)); setDisabled(r.btn, !canBuyBoard(S, b.id)); r.btn.className = 'btn buy'; }
      else { setText(r.btn, '🎁 Nur aus Boss-Kisten'); setDisabled(r.btn, true); r.btn.className = 'btn'; }
    }
    const nh = nextHouse(S);
    setText(summary, tab === 'teile'
      ? `PC-Qualität ${fmtMult(pcQuality(S))} · Upload ${fmtTime(Math.ceil(uploadSeconds(S)))} · Geld ${eur(S.money)}${nh ? ` · Nächstes Haus: ${nh.name} (${eur(nh.price)}) an der Haustür kaufen` : ''}`
      : `Hoverboards machen dich schneller, aber nicht reicher. Auf- und absteigen: ${matchMedia('(pointer: coarse)').matches ? 'Knopf unten rechts' : 'Taste H'}. Geld ${eur(S.money)}`);
  }

  const partsGrid = () => h('div', { class: 'shop-grid' }, PARTS.map(p => {
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
  }));

  const boardGrid = () => h('div', { class: 'shop-grid boards' }, BOARDS.map(b => {
    const r = { b }, rar = RARITY[b.rarity];
    r.el = h('div', { class: `shop-item board-item r-${b.rarity}`, style: `--rar:${rar.color}` },
      // Vorschau aus CSS: Deck mit Leuchtrand in den Farben des Boards
      h('div', { class: 'board-swatch', 'aria-hidden': 'true', style: `--deck:${b.deck};--glow:${b.glow};--glow2:${b.glow2 || b.glow}` }, h('i')),
      h('div', { class: 'shop-info' },
        h('strong', null, b.name, ' ', h('span', { class: 'rar small' }, rar.name)),
        h('small', { class: 'muted' }, TRAIL[b.trail]),
        statBar('Tempo', b.speed, MAX.speed), statBar('Antrieb', b.accel, MAX.accel), statBar('Wendigkeit', b.turn, MAX.turn)),
      r.btn = h('button', { class: 'btn', type: 'button', onclick: () => {
        const S = ctx.S;
        if (ownsBoard(S, b.id)) ctx.equipBoard(b.id); else ctx.buyBoard(b.id);
        render();
      } }));
    boardRows.push(r);
    return r.el;
  }));

  panels.open((box, close) => {
    const body = h('div');
    const tabs = [['teile', '🖥️ PC-Teile'], ['boards', '🛹 Hoverboards']].map(([id, label]) =>
      h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(tab === id), onclick: () => show(id) }, label));
    function show(id) {
      tab = id; rows.length = 0; boardRows.length = 0;
      tabs.forEach((t, i) => t.setAttribute('aria-selected', String(['teile', 'boards'][i] === id)));
      body.replaceChildren(id === 'teile' ? partsGrid() : boardGrid());
      render();
    }
    box.append(
      h('div', { class: 'panel-head' }, h('h2', null, '🛒 Bitbazar'), h('button', { class: 'x', type: 'button', 'aria-label': 'Schliessen', onclick: close }, '✕')),
      h('div', { class: 'tabs', role: 'tablist' }, tabs),
      summary = h('p', { class: 'small muted' }),
      body,
    );
    show(tab);
  }, { cls: 'wide', update: render });
}
