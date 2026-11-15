// Startbildschirm: Stadtbild, grosser Spielen-Knopf, Neues Spiel und Offline-Gewinn.
import { h, svg } from '../ui/dom.js';
import { fmt, eur, fmtTime, fmtPercent } from '../core/format.js';
import { currentHouse } from '../core/formulas.js';
import { titleSceneSVG } from '../ui/art.js';
import { BALANCE as B } from '../data/balance.js';

export default {
  id: 'titel', title: 'Start', icon: '🏠',

  create(ctx) {
    function start() {
      ctx.offline = null;
      ctx.audio.play('good');
      ctx.scenes.go(ctx.S.tutorialDone ? 'haus' : 'tutorial');
    }

    function askNewGame() {
      ctx.scenes.openOverlay('bestaetigen', {
        icon: '🗑️', title: 'Neues Spiel beginnen?',
        text: 'Dein Kanal, dein Geld, deine Häuser und Juwelen gehen verloren. Das lässt sich nicht rückgängig machen.',
        yes: 'Ja, neu beginnen', danger: true,
        onYes: () => { ctx.newGame(); ctx.scenes.go('tutorial'); },
      });
    }

    function summary() {
      if (!ctx.hasSave) return null;
      const S = ctx.S, off = ctx.offline;
      const lines = off
        ? [
          h('h2', null, '😴 Willkommen zurück!'),
          h('p', { class: 'tight' }, `Du warst ${fmtTime(off.seconds)} weg${off.seconds >= B.offlineMaxSeconds ? ' (mehr zählt nicht)' : ''}. Deine alten Videos liefen mit ${fmtPercent(off.rate)} weiter:`),
          h('p', { class: 'gain tight' }, `+${eur(off.money)}`),
        ]
        : [h('h2', null, 'Dein Kanal')];
      lines.push(h('p', { class: 'muted small tight' }, `${currentHouse(S).icon} ${currentHouse(S).name} · ${eur(S.money)} · ${fmt(S.subs)} Abos · ${S.gems} 💎`));
      if (ctx.migrated) lines.push(h('p', { class: 'muted small tight' }, '✅ Dein alter Spielstand wurde übernommen. Für alte Ausrüstung gab es Juwelen.'));
      return h('div', { class: 'card title-card' }, lines);
    }

    return {
      mount(el) {
        el.append(
          svg(titleSceneSVG(), 'title-bg'),
          h('div', { class: 'title-content' },
            h('h1', { class: 'title-name' }, 'Vlog', h('span', null, 'villa')),
            h('p', { class: 'title-claim' }, 'Vom Gartenhäuschen zum Sternenschloss: Mach Videos, sammle Abos, zieh um.'),
            summary(),
            h('div', { class: 'title-actions' },
              h('button', { class: 'btn play big', type: 'button', onclick: start, 'data-autofocus': true }, ctx.hasSave ? '▶ WEITER' : '▶ SPIELEN'),
              ctx.hasSave && h('button', { class: 'btn', type: 'button', onclick: askNewGame }, 'Neues Spiel'),
              h('a', { class: 'btn', href: 'index.html', style: 'text-decoration:none;text-align:center' }, '🏝️ Zur 3D-Welt Kanalbucht'),
            ),
          ),
        );
        el.querySelector('[data-autofocus]').focus({ preventScroll: true });
      },
    };
  },
};
