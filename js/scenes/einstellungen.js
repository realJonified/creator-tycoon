// Einstellungen: Ton, Animationen, Spielstand exportieren/importieren, Neustart.
import { h } from '../ui/dom.js';
import { exportSave, importSave } from '../core/save.js';
import { VERSION } from '../core/game.js';

export default {
  id: 'einstellungen', title: 'Optionen', icon: '⚙️', nav: true, order: 5,

  create(ctx) {
    let box, message;

    function toggle(label, hint, key, onChange) {
      const btn = h('button', {
        class: 'switch-btn', type: 'button', role: 'switch', 'aria-label': label,
        'aria-checked': String(!!ctx.S.settings[key]),
        onclick: () => {
          ctx.S.settings[key] = !ctx.S.settings[key];
          btn.setAttribute('aria-checked', String(ctx.S.settings[key]));
          ctx.applySettings();
          ctx.persist();
          onChange?.(ctx.S.settings[key]);
        },
      });
      return h('div', { class: 'switch' }, h('div', null, h('strong', null, label), h('div', { class: 'muted small' }, hint)), btn);
    }

    function say(text, isError = false) {
      message.textContent = text;
      message.style.color = isError ? 'var(--danger)' : 'var(--money)';
    }

    async function onExport() {
      box.value = exportSave(ctx.S);
      box.select();
      let copied = false;
      try { await navigator.clipboard.writeText(box.value); copied = true; } catch { /* Zwischenablage gesperrt */ }
      say(copied ? 'Spielstand kopiert. Bewahre den Text gut auf.' : 'Spielstand steht im Feld. Markiere und kopiere ihn.');
    }

    function onImport() {
      let next;
      try { next = importSave(box.value); } catch (err) { say(err.message, true); return; }
      ctx.scenes.openOverlay('bestaetigen', {
        icon: '📥', title: 'Spielstand ersetzen?',
        text: 'Dein jetziger Spielstand wird durch den eingefügten ersetzt.',
        yes: 'Ja, importieren',
        onYes: () => { ctx.replaceState(next); box.value = ''; say('Spielstand importiert.'); ctx.scenes.go('einstellungen'); },
      });
    }

    function onReset() {
      ctx.scenes.openOverlay('bestaetigen', {
        icon: '🗑️', title: 'Wirklich neu beginnen?',
        text: 'Dein Kanal, dein Geld und dein Ruhm gehen verloren. Das lässt sich nicht rückgängig machen.',
        yes: 'Ja, alles löschen', danger: true,
        onYes: () => { ctx.newGame(); ctx.scenes.go('tutorial'); },
      });
    }

    return {
      mount(el) {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.append(
          h('div', { class: 'row between scene-head' }, h('h1', null, 'Optionen')),
          h('div', { class: 'cols' },
            h('div', { class: 'card' },
              h('h2', null, 'Spiel'),
              toggle('Ton', 'Kurze Töne bei Klicks, Käufen und Awards', 'sound', on => { if (on) ctx.audio.play('good'); }),
              toggle('Animationen', reduced
                ? 'Dein Gerät verlangt weniger Bewegung, deshalb bleiben Animationen aus.'
                : 'Überblendungen und fliegende Zahlen', 'anim'),
            ),
            h('div', { class: 'card' },
              h('h2', null, 'Spielstand'),
              h('p', { class: 'muted small' }, 'Das Spiel speichert automatisch in diesem Browser. Mit dem Export sicherst du den Stand als Text oder nimmst ihn auf ein anderes Gerät mit.'),
              box = h('textarea', { class: 'code', 'aria-label': 'Spielstand als Text', placeholder: 'Hier erscheint der Export. Zum Importieren Text einfügen.', spellcheck: 'false' }),
              message = h('p', { class: 'small tight', role: 'status' }),
              h('div', { class: 'row' },
                h('button', { class: 'btn', type: 'button', onclick: onExport }, '📤 Exportieren'),
                h('button', { class: 'btn', type: 'button', onclick: onImport }, '📥 Importieren'),
                h('button', { class: 'btn', type: 'button', onclick: () => say(ctx.persist() ? 'Gespeichert.' : 'Speichern ist in diesem Browser nicht möglich.', false) }, '💾 Speichern'),
              ),
            ),
          ),
          h('div', { class: 'card' },
            h('h2', null, 'Neustart'),
            h('p', { class: 'muted small' }, 'Löscht den gesamten Fortschritt, auch Ruhm und Boni.'),
            h('button', { class: 'btn danger', type: 'button', onclick: onReset }, '🗑️ Spiel zurücksetzen'),
          ),
          h('p', { class: 'muted small center' }, `Creator Tycoon · Spielstand-Version ${VERSION}`),
        );
      },
    };
  },
};
