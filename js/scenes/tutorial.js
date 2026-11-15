// Tutorial: vier kurze Schritte für neue Spieler. Neuer Schritt = eine neue Zeile in STEPS.
import { h } from '../ui/dom.js';

const STEPS = [
  { icon: '🛖', title: 'Dein erstes Zuhause', text: 'Du startest im Gartenhäuschen mit einem alten Rechner. Klein, aber deins.' },
  { icon: '🎬', title: 'Videos machen', text: 'Wähle ein Spiel, tippe die Buchstaben beim Aufnehmen, tippe schnell beim Schnitt und lade hoch. Gutes Video, viele Aufrufe!' },
  { icon: '🛒', title: 'Besser werden', text: 'Mit dem Geld kaufst du PCs, Mäuse, Router und Handys. Ein besseres WLAN macht den Upload schneller.' },
  { icon: '🏡', title: 'Umziehen und sammeln', text: 'Größere Häuser bringen mehr Aufrufe. Juwelen öffnen Kisten mit Hoverboards und PC-Teilen. Ab 100.000 Abos gibt es goldene Awards.' },
];

export default {
  id: 'tutorial', title: 'Tutorial', icon: '🎓',

  create(ctx) {
    let step = 0, card;

    function finish() {
      ctx.S.tutorialDone = true;
      ctx.persist();
      ctx.scenes.go('haus');
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
