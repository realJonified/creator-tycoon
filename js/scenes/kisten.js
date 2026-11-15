// Kisten: mit Juwelen öffnen, Hoverboards ausrüsten, PC-Teile ansehen.
import { h, svg, setText, setDisabled } from '../ui/dom.js';
import { fmtPercent } from '../core/format.js';
import { findRarity } from '../core/crates.js';
import { bestPart } from '../core/formulas.js';
import { boardSVG } from '../ui/art.js';
import { CRATES, RARITIES, BOARDS, SLOTS, PARTS } from '../data/crates.js';

const BONUS_TEXT = { money: 'Geld', subs: 'Abos', views: 'Aufrufe', upload: 'Upload-Tempo' };
const EFFECT_TEXT = { record: 'Aufnahme', cut: 'Schnitt', upload: 'Upload' };

export default {
  id: 'kisten', title: 'Kisten', icon: '🎁', nav: true, order: 4,

  create(ctx) {
    let gems, crateBtns = new Map(), reveal, boardsEl, partsEl, busy = false;

    function open(id) {
      if (busy) return;
      const r = ctx.game.openCrate(id);
      if (!r) { ctx.audio.play('denied'); return; }
      ctx.persist();
      const rar = findRarity(r.rarity);
      const show = () => {
        busy = false;
        ctx.audio.play(r.rarity === 'legendaer' || r.rarity === 'episch' ? 'award' : 'good');
        reveal.className = 'card reveal rarity-' + r.rarity;
        reveal.replaceChildren(
          r.kind === 'board' ? svg(boardSVG(r.item, rar.color), 'reveal-art') : h('div', { class: 'reveal-art part-icon' }, SLOTS.find(s => s.id === r.item.slot).icon),
          h('div', null,
            h('strong', { class: 'rarity-name', style: `color:${rar.color}` }, rar.name),
            h('h2', { class: 'tight' }, r.item.name),
            h('p', { class: 'small tight' }, r.kind === 'board'
              ? `Hoverboard · +${fmtPercent(r.item.bonus.value)} ${BONUS_TEXT[r.item.bonus.type]}`
              : `PC-Teil (${SLOTS.find(s => s.id === r.item.slot).name}) · +${fmtPercent(r.item.bonus)} ${EFFECT_TEXT[SLOTS.find(s => s.id === r.item.slot).effect]}`),
            h('p', { class: 'muted small tight' }, r.isNew
              ? (r.kind === 'part' ? (r.upgrade ? '🆕 Neu und ab sofort eingebaut!' : '🆕 Neu, aber dein eingebautes Teil ist stärker.') : '🆕 Neu in deiner Sammlung!')
              : `Hast du schon: +${r.refund} 💎 zurück.`)),
        );
        build();
      };
      if (ctx.animations()) {
        busy = true;
        reveal.className = 'card reveal opening';
        reveal.replaceChildren(h('div', { class: 'crate-shake', 'aria-hidden': 'true' }, r.crate.icon), h('p', { class: 'muted' }, 'Kiste wird geöffnet …'));
        ctx.audio.play('event');
        setTimeout(show, 700);
      } else show();
    }

    function build() {
      const S = ctx.S;
      boardsEl.replaceChildren(...BOARDS.map(b => {
        const have = S.boards[b.id] > 0, rar = findRarity(b.rarity), on = S.board === b.id;
        return h('div', { class: 'board-tile' + (have ? '' : ' unknown') + (on ? ' on' : ''), style: `--rar:${rar.color}` },
          have ? svg(boardSVG(b, rar.color), 'board-art') : h('div', { class: 'board-art q' }, '❔'),
          h('strong', { class: 'small' }, have ? b.name : '???'),
          h('small', { style: `color:${rar.color}` }, rar.name),
          have && h('small', { class: 'muted' }, `+${fmtPercent(b.bonus.value)} ${BONUS_TEXT[b.bonus.type]}`),
          have && h('button', { class: 'btn small-btn' + (on ? ' gold' : ''), type: 'button', disabled: on,
            onclick: () => { ctx.game.equipBoard(b.id); ctx.audio.play('buy'); ctx.persist(); build(); } }, on ? 'Ausgerüstet' : 'Ausrüsten'));
      }));
      partsEl.replaceChildren(...SLOTS.map(s => {
        const best = bestPart(S, s.id);
        const owned = PARTS.filter(p => p.slot === s.id && S.parts[p.id] > 0).length;
        return h('div', { class: 'item' },
          h('div', { class: 'item-icon', 'aria-hidden': 'true' }, s.icon),
          h('div', { class: 'item-info' },
            h('div', { class: 'item-name' }, s.name, ' ', h('span', { class: 'sub' }, `${owned}/4 gefunden`)),
            h('div', { class: 'small', style: best ? `color:${findRarity(best.rarity).color}` : '' }, best ? `${best.name} · +${fmtPercent(best.bonus)} ${EFFECT_TEXT[s.effect]}` : 'Noch leer')));
      }));
      render();
    }

    function render() {
      setText(gems, `💎 ${ctx.S.gems} Juwelen`);
      for (const [id, b] of crateBtns) setDisabled(b, busy || ctx.S.gems < CRATES.find(c => c.id === id).cost);
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'row between scene-head' }, h('h1', null, 'Kisten'), gems = h('strong', { class: 'gems' })),
          h('div', { class: 'crates' }, CRATES.map(c => h('div', { class: 'card crate' },
            h('div', { class: 'crate-icon', 'aria-hidden': 'true' }, c.icon),
            h('strong', null, c.name),
            h('ul', { class: 'odds' }, RARITIES.filter(r => c.odds[r.id]).map(r =>
              h('li', null, h('span', { style: `color:${r.color}` }, r.name), ' ', fmtPercent(c.odds[r.id])))),
            (() => { const b = h('button', { class: 'btn gold', type: 'button', onclick: () => open(c.id) }, `Öffnen · ${c.cost} 💎`); crateBtns.set(c.id, b); return b; })(),
          ))),
          reveal = h('div', { class: 'card reveal', role: 'status', 'aria-live': 'polite' }, h('p', { class: 'muted tight' }, 'Juwelen bekommst du für jedes Video, für perfekte Schnitte, beim Umzug und für Awards.')),
          h('div', { class: 'cols' },
            h('div', { class: 'card' }, h('h2', null, '🛹 Hoverboards ', h('span', { class: 'sub' }, 'eines ausrüsten')), boardsEl = h('div', { class: 'boards' })),
            h('div', { class: 'card' }, h('h2', null, '🔩 PC-Teile ', h('span', { class: 'sub' }, 'das beste Teil zählt')), partsEl = h('div'))),
        );
        build();
      },
      render,
    };
  },
};
