// Overlay für Zufalls-Ereignisse (Sponsor-Deal, Trend, Shitstorm …).
// Zeigt das wartende Ereignis aus S.event, die Wahlmöglichkeiten und danach das Ergebnis.
import { h } from '../ui/dom.js';
import { findEvent } from '../core/events.js';

export default {
  id: 'ereignis', title: 'Ereignis',

  create(ctx) {
    let box, close, decided = false;

    function choose(index) {
      const r = ctx.game.chooseEvent(index);
      decided = true;
      if (!r || !r.lines.length) { close(); return; }
      ctx.audio.play(r.won === false || r.lines.every(l => l.startsWith('−')) ? 'bad' : 'good');
      box.replaceChildren(
        h('div', { class: 'event-icon', 'aria-hidden': 'true' }, r.won === false ? '😬' : r.event.icon),
        h('h2', null, r.text || r.event.title),
        h('ul', { class: 'result-lines' }, r.lines.map(line => h('li', null, line))),
        h('div', { class: 'overlay-actions' },
          h('button', { class: 'btn primary', type: 'button', onclick: close, 'data-autofocus': true }, 'Weiter')),
      );
      box.querySelector('button').focus();
    }

    return {
      mount(el, p) {
        box = el; close = p.close;
        const event = ctx.S.event && findEvent(ctx.S.event.id);
        if (!event) { decided = true; queueMicrotask(close); return; }
        ctx.game.openEvent();
        el.append(
          h('div', { class: 'event-icon', 'aria-hidden': 'true' }, event.icon),
          h('h2', null, event.title),
          h('p', { class: 'muted center' }, event.text),
          h('div', { class: 'overlay-actions' }, event.choices.map((c, i) =>
            h('button', { class: 'btn choice' + (i === 0 ? ' gold' : ''), type: 'button', 'data-autofocus': i === 0, onclick: () => choose(i) },
              c.label, c.hint && h('small', null, c.hint)))),
        );
      },
      // Escape: nichts entscheiden, das Ereignis bleibt noch kurz anklickbar.
      dismiss() { if (!decided) ctx.game.closeEvent(); },
    };
  },
};
