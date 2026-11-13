// Tutorial: drei kurze Schritte für neue Spieler. Neuer Schritt = eine neue Zeile in STEPS.
import { h } from '../ui/dom.js';

const STEPS = [
  { icon: '⏺️', title: 'Videos aufnehmen', text: 'Tippe im Studio auf den roten Knopf. Jedes Video bringt Geld und Abonnenten.' },
  { icon: '🛒', title: 'Im Shop einkaufen', text: 'Ausrüstung macht jedes Video wertvoller. Dein Team verdient von allein, sogar wenn du weg bist.' },
  { icon: '🏆', title: 'Wachsen', text: 'Abonnenten erhöhen alle Einnahmen, Awards geben Boni. Später gründest du einen neuen Kanal und sammelst Ruhm.' },
];

export default {
  id: 'tutorial', title: 'Tutorial', icon: '🎓',

  create(ctx) {
    let step = 0, card;

    function finish() {
      ctx.S.tutorialDone = true;
      ctx.persist();
      ctx.scenes.go('studio');
    }

    function show() {
      const s = STEPS[step], last = step === STEPS.length - 1;
      card.replaceChildren(
        h('div', { class: 'tut-icon', 'aria-hidden': 'true' }, s.icon),
        h('h1', null, s.title),
        h('p', { class: 'muted' }, s.text),
        h('div', { class: 'tut-dots', 'aria-label': `Schritt ${step + 1} von ${STEPS.length}`, role: 'img' },
          STEPS.map((_, i) => h('span', { class: i === step ? 'on' : '' }))),
        h('div', { class: 'title-actions', style: 'margin: 0 auto' },
          h('button', { class: 'btn primary big', type: 'button', onclick: () => { if (last) finish(); else { step++; show(); } } }, last ? "Los geht's!" : 'Weiter'),
          !last && h('button', { class: 'btn', type: 'button', onclick: finish }, 'Überspringen'),
        ),
      );
      card.querySelector('button').focus({ preventScroll: true });
    }

    return {
      mount(el) {
        card = h('div', { class: 'card tut-card' });
        el.append(card);
        show();
      },
    };
  },
};
