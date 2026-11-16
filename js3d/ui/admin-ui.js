// Entwickler-Bereich in den Einstellungen (intern "Admin"). Test- und Entwicklerwerkzeug für dieses
// Einzelspieler-Spiel ohne Online-Funktionen: Änderungen betreffen nur den Spielstand in diesem Browser.
// Der Bereich wird nur gebaut, wenn der Modus an ist (siehe js3d/core/admin.js). Im Spiel heisst er "Entwickler".
import { h, setText } from '../../js/ui/dom.js';
import { fmt, eur } from '../../js/core/format.js';
import { AMOUNT_UNITS, parseAmount, groupDigits } from '../core/num.js';

const UNIT_LABEL = { '': '–', tsd: 'Tsd.', mio: 'Mio.', mrd: 'Mrd.', bio: 'Bio.' };

// Eine Zeile "Zahl + Einheit + Setzen" mit Vorschau des eingelesenen Werts
function amountRow(label, current, onSet, money) {
  const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', placeholder: 'z. B. 100\'000', 'aria-label': `${label}: Zahl` });
  const unit = h('select', { 'aria-label': `${label}: Einheit` },
    AMOUNT_UNITS.map(u => h('option', { value: u.id, selected: u.id === 'mio' }, UNIT_LABEL[u.id] ?? u.name)));
  const preview = h('small', { class: 'dev-preview muted' });
  const show = n => (money ? eur(n) : fmt(n));
  function update() {
    const r = parseAmount(input.value, unit.value);
    setText(preview, input.value.trim() === '' ? `Jetzt: ${show(current())}` : r ? `= ${show(r.value)} (${groupDigits(r.big)})` : 'Ungültige Zahl');
    btn.disabled = !r;
  }
  const btn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    const r = parseAmount(input.value, unit.value);
    if (!r) return;
    onSet(r.value);
    input.value = '';
    update();
  } }, 'Setzen');
  input.addEventListener('input', update);
  unit.addEventListener('change', update);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } });
  update();
  return h('div', { class: 'dev-amount' }, h('span', { class: 'dev-label' }, label), h('div', { class: 'dev-inputs' }, input, unit, btn), preview);
}

export function devSection(ctx) {
  const A = ctx.admin, dev = ctx.dev;
  const toggle = (label, key) => h('label', { class: 'set-row' }, h('span', null, label),
    h('input', { type: 'checkbox', checked: A[key], onchange: e => { A[key] = e.target.checked; } }));
  const note = h('p', { class: 'small muted' });
  const say = t => setText(note, t);
  return h('section', { class: 'dev' },
    h('h3', null, '🛠️ Entwickler'),
    h('p', { class: 'small muted' }, 'Nur zum Testen. Ausschalten mit derselben Geste. Nach dem Neuladen ist der Bereich wieder weg.'),
    amountRow('Geld', () => ctx.S.money, v => { dev.setMoney(v); say(`Geld: ${eur(ctx.S.money)}`); }, true),
    amountRow('Abos', () => ctx.S.subs, v => { const n = dev.setSubs(v); say(`Abos: ${fmt(ctx.S.subs)}${n ? ` · ${n} Kanalknöpfe neu` : ''}`); }, false),
    h('div', { class: 'dev-buttons' },
      h('button', { class: 'btn', type: 'button', onclick: () => { dev.unlockAll(); say('Alle Maps, Häuser und Hoverboards freigeschaltet.'); } }, '🔓 Alles freischalten'),
      h('button', { class: 'btn', type: 'button', onclick: () => { dev.resetUnlocks(); say('Freischaltungen wie vorher.'); } }, '↩️ Freischaltungen zurücksetzen')),
    toggle('Bosskampf überspringen', 'skipBoss'),
    toggle('Zeit × 10', 'fast'),
    h('button', { class: 'btn danger', type: 'button', onclick: () => { dev.resetAll(); say('Alle Testwerte zurückgesetzt.'); ctx.reopenSettings(); } }, 'Entwicklerdaten zurücksetzen'),
    note,
  );
}
