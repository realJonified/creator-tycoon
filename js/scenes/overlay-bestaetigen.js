// Overlay: Rückfrage vor wichtigen Aktionen.
// Aufruf: ctx.scenes.openOverlay('bestaetigen', { icon, title, text, yes, no, danger, onYes })
import { h } from '../ui/dom.js';

export default {
  id: 'bestaetigen', title: 'Rückfrage',

  create() {
    return {
      mount(el, p) {
        el.append(
          h('div', { class: 'event-icon', 'aria-hidden': 'true' }, p.icon || '❓'),
          h('h2', null, p.title),
          h('p', { class: 'muted center' }, p.text),
          h('div', { class: 'overlay-actions' },
            h('button', { class: 'btn' + (p.danger ? ' danger' : ' primary'), type: 'button', onclick: () => { p.close(); p.onYes?.(); } }, p.yes || 'Ja'),
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: p.close }, p.no || 'Abbrechen'),
          ),
        );
      },
    };
  },
};
