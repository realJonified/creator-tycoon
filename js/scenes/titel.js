// Titelbild: Weiter, Neues Spiel und die Anzeige des Offline-Gewinns.
import { h } from '../ui/dom.js';
import { fmt, eur, fmtTime, fmtPercent } from '../core/format.js';
import { BALANCE as B } from '../data/balance.js';

export default {
  id: 'titel', title: 'Start', icon: '🏠',

  create(ctx) {
    function start() {
      ctx.offline = null;
      ctx.audio.play('good');
      ctx.scenes.go(ctx.S.tutorialDone ? 'studio' : 'tutorial');
    }

    function askNewGame() {
      ctx.scenes.openOverlay('bestaetigen', {
        icon: '🗑️', title: 'Neues Spiel beginnen?',
        text: 'Dein Kanal, dein Geld und dein Ruhm gehen verloren. Das lässt sich nicht rückgängig machen.',
        yes: 'Ja, neu beginnen', danger: true,
        onYes: () => { ctx.newGame(); ctx.scenes.go('tutorial'); },
      });
    }

    function summary() {
      const S = ctx.S, off = ctx.offline;
      if (!ctx.hasSave) return null;
      const lines = off
        ? [
          h('h2', null, '😴 Willkommen zurück!'),
          h('p', { class: 'tight' }, `Du warst ${fmtTime(off.seconds)} weg${off.seconds >= B.offlineMaxSeconds ? ' (mehr zählt nicht)' : ''}. Dein Team hat mit ${fmtPercent(off.rate)} Leistung weitergearbeitet:`),
          h('p', { class: 'gain tight' }, `+${eur(off.money)} · +${fmt(off.subs)} Abos`),
        ]
        : [h('h2', null, 'Dein Kanal')];
      lines.push(h('p', { class: 'muted small tight' }, `${eur(S.money)} · ${fmt(S.subs)} Abos · ${S.awards.length} ${S.awards.length === 1 ? 'Award' : 'Awards'} · ${fmt(S.fameTotal)} Ruhm`));
      if (ctx.migrated) lines.push(h('p', { class: 'muted small tight' }, '✅ Dein Spielstand aus der alten Version wurde übernommen.'));
      return h('div', { class: 'card title-card' }, lines);
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'title-logo', 'aria-hidden': 'true' }, '🎬'),
          h('h1', { class: 'title-name' }, 'Creator ', h('span', null, 'Tycoon')),
          h('p', { class: 'muted' }, 'Nimm Videos auf, verdiene Geld und sammle Abonnenten.'),
          summary(),
          h('div', { class: 'title-actions' },
            h('button', { class: 'btn primary big', type: 'button', onclick: start, 'data-autofocus': true }, ctx.hasSave ? 'Weiter' : 'Spiel starten'),
            ctx.hasSave && h('button', { class: 'btn', type: 'button', onclick: askNewGame }, 'Neues Spiel'),
          ),
        );
        el.querySelector('[data-autofocus]').focus({ preventScroll: true });
      },
    };
  },
};
