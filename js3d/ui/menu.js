// Startbildschirm, Pausenmenü, Einstellungen und Hilfe.
import { h } from '../../js/ui/dom.js';
import { fmt, eur } from '../../js/core/format.js';
import { settingsSections } from '../core/admin.js';
import { devSection } from './admin-ui.js';

// Titel, die Tipps zählen (für den versteckten Modus, siehe core/admin.js). Bewusst ohne jede Rückmeldung.
const tapTitle = (el, onTap) => { if (onTap) el.addEventListener('pointerdown', () => onTap()); return el; };

export function showStart(el, { S, source, offline, onPlay, onTitleTap }) {
  const migrated = source && source !== 'welt' && source !== 'new';
  el.replaceChildren(h('div', { class: 'start-box' },
    tapTitle(h('div', { class: 'logo' }, 'Kanal', h('span', null, 'bucht')), onTitleTap),
    h('p', { class: 'claim' }, 'Lauf über die Insel, mach Videos, kauf dir Häuser und besiege den Glitchgolem.'),
    migrated && h('p', { class: 'note' }, `✅ Dein Spielstand aus der 2D-Version wurde übernommen: ${eur(S.money)} und ${fmt(S.subs)} Abos.`),
    offline && h('p', { class: 'note' }, `😴 Während du weg warst, haben deine alten Videos ${eur(offline.money)} verdient.`),
    h('button', { class: 'big-btn', type: 'button', 'data-autofocus': true, onclick: onPlay }, source === 'welt' ? '▶ WEITER' : '▶ SPIELEN'),
    h('a', { class: 'link-btn', href: 'klassik.html' }, '🕹️ Klassik (2D-Spiel)'),
    h('p', { class: 'small' }, 'PC: WASD laufen · Maus ziehen umsehen · E benutzen · Esc Menü. Handy: links Joystick, rechts wischen.'),
  ));
  el.hidden = false;
  el.querySelector('[data-autofocus]').focus();
}

export function openMenu(panels, ctx) {
  panels.open((box, close) => {
    box.append(
      tapTitle(h('h2', { class: 'menu-title' }, '⏸ Menü'), ctx.adminTap),
      h('div', { class: 'menu-list' },
        h('button', { class: 'btn primary', type: 'button', onclick: close, 'data-autofocus': true }, '▶ Weiterspielen'),
        h('button', { class: 'btn', type: 'button', onclick: () => openSettings(panels, ctx) }, '⚙️ Einstellungen'),
        h('button', { class: 'btn', type: 'button', onclick: () => openHelp(panels, ctx) }, '❓ So spielst du'),
        h('button', { class: 'btn', type: 'button', onclick: () => { close(); ctx.goHome(); } }, '🏠 Nach Hause teleportieren'),
        h('a', { class: 'btn', href: 'klassik.html' }, '🕹️ Klassik (2D-Spiel)')),
      h('p', { class: 'small muted' }, `${S_line(ctx.S)}`),
    );
  });
}

const S_line = S => `${fmt(S.videos)} Videos · ${Object.values(S.houses).flat().length} Häuser · ${S.maps.length} Maps · ${S.buttons.length} Kanalknöpfe · ${S.stats.bossWins} Boss-Siege`;

export function openSettings(panels, ctx) {
  const S = ctx.S;
  ctx.reopenSettings = () => openSettings(panels, ctx);
  panels.open(box => {
    const row = (label, control) => h('label', { class: 'set-row' }, h('span', null, label), control);
    const select = h('select', { onchange: e => { S.settings.graphics = e.target.value; ctx.applyGraphics(); ctx.persist(); info.textContent = graphicsInfo(); } },
      ...[['auto', 'Automatisch'], ['niedrig', 'Niedrig'], ['mittel', 'Mittel'], ['hoch', 'Hoch']].map(([v, t]) => h('option', { value: v, selected: S.settings.graphics === v }, t)));
    const check = (key, after) => h('input', { type: 'checkbox', checked: S.settings[key], onchange: e => { S.settings[key] = e.target.checked; after?.(); ctx.persist(); } });
    const sens = h('input', { type: 'range', min: '0.3', max: '3', step: '0.1', value: String(S.settings.sensitivity), oninput: e => { S.settings.sensitivity = Number(e.target.value); ctx.persist(); } });
    const graphicsInfo = () => `Aktuell: ${ctx.engine.level}${S.settings.graphics === 'auto' ? ' (schaltet bei zu wenig FPS herunter)' : ''}`;
    const info = h('p', { class: 'small muted' }, graphicsInfo());
    box.append(
      h('h2', null, '⚙️ Einstellungen'),
      row('Grafik', select), info,
      row('FPS-Anzeige', check('fps')),
      row('Ton', check('sound', () => { if (S.settings.sound) ctx.audio.play('good'); })),
      row('Umsehen-Tempo', sens),
      h('div', { class: 'menu-list' },
        h('button', { class: 'btn danger', type: 'button', onclick: () => confirmReset(panels, ctx) }, '🗑️ Welt-Spielstand löschen'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => openMenu(panels, ctx) }, '← Zurück')),
      // Nur vorhanden, wenn der versteckte Modus an ist
      settingsSections(ctx.admin).includes('entwickler') && devSection(ctx),
    );
  });
}

function confirmReset(panels, ctx) {
  panels.open(box => box.append(
    h('h2', null, 'Wirklich alles löschen?'),
    h('p', null, 'Geld, Abos, Häuser, PC-Teile und Kanalknöpfe der 3D-Welt gehen verloren. Das 2D-Spiel bleibt unberührt.'),
    h('div', { class: 'menu-list' },
      h('button', { class: 'btn danger', type: 'button', onclick: () => ctx.reset() }, 'Ja, löschen'),
      h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: () => openSettings(panels, ctx) }, 'Abbrechen')),
  ));
}

export function openHelp(panels, ctx) {
  panels.open(box => box.append(
    h('h2', null, '❓ So spielst du'),
    h('ul', { class: 'help' },
      h('li', null, '🏠 Geh in deine Wohnung (Norden) und benutze den PC, um ein Video zu machen.'),
      h('li', null, '🔤 Drück die Buchstaben, bevor sie verschwinden. ✂️ Dann tippen, tippen, tippen. ⬆️ Dann hochladen.'),
      h('li', null, '🛒 Im Bitbazar (rechts vom Kreisel) kaufst du PC-Teile und einen besseren Router.'),
      h('li', null, '🏖️ Häuser am Strand und auf der Insel kannst du an der Tür kaufen.'),
      h('li', null, '🌀 Alle 5 Minuten öffnet sich das Portal im Kreisel. Weiche den roten Kreisen aus, deine Waffe schiesst von allein.'),
      h('li', null, '⭐ Ab 100.000 Abos gibt es Kanalknöpfe für deine Wand.')),
    h('button', { class: 'btn primary', type: 'button', onclick: () => openMenu(panels, ctx) }, '← Zurück'),
  ));
}
