// Weltkarte (öffnet sich am Portal): alle Maps, gesperrte mit Preis, freigeschaltete zum Reisen.
// Ist das Boss-Portal offen, steht der Bosskampf ganz oben (Verhalten aus Version 1).
import { h } from '../../js/ui/dom.js';
import { eur } from '../../js/core/format.js';
import { MAPS } from '../data/maps.js';
import { mapUnlocked, nextLockedMap, canUnlockMap, portalIsOpen } from '../core/economy.js';
import { mmss } from './hud.js';

export function openWorldMap(panels, ctx) {
  const S = ctx.S;
  panels.open((box, close) => {
    const next = nextLockedMap(S);
    const boss = portalIsOpen(S)
      ? h('button', { class: 'boss-go', type: 'button', 'data-autofocus': true, onclick: () => { close(); ctx.enterArena(); } },
        h('strong', null, '⚔️ Boss-Portal betreten'), h('small', null, `Der Glitchgolem wartet · noch ${mmss(S.portal.open)} offen`))
      : h('p', { class: 'boss-wait' }, `⚔️ Das Boss-Portal öffnet in ${mmss(S.portal.in)}.`);
    box.append(
      h('div', { class: 'panel-head' }, h('h2', null, '🌀 Weltkarte'), h('button', { class: 'x', type: 'button', 'aria-label': 'Schliessen', onclick: close }, '✕')),
      boss,
      h('div', { class: 'maps' }, MAPS.map((m, i) => {
        const here = S.map === m.id, open = mapUnlocked(S, m.id);
        let action;
        if (here) action = h('span', { class: 'map-tag here' }, 'Du bist hier');
        else if (open) action = h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); ctx.travel(m.id); } }, 'Reisen');
        else if (!m.ready) action = h('span', { class: 'map-tag' }, '🚧 Kommt bald');
        else if (next?.id !== m.id) action = h('span', { class: 'map-tag' }, `🔒 Erst ${MAPS[i - 1].name}`);
        else action = h('button', { class: 'btn buy', type: 'button', disabled: !canUnlockMap(S, m.id), onclick: () => { if (ctx.unlockMap(m.id)) { close(); ctx.travel(m.id); } } }, `Freischalten · ${eur(m.unlock)}`);
        return h('div', { class: 'map-card' + (here ? ' here' : '') + (open ? '' : ' locked'), style: `--top:${m.sky.top};--bottom:${m.sky.bottom}` },
          h('div', { class: 'map-icon', 'aria-hidden': 'true' }, m.icon),
          h('div', { class: 'map-info' },
            h('strong', null, `${i + 1}. ${m.name}`),
            h('small', null, m.theme),
            h('small', { class: 'muted' }, `${m.houses.length} Häuser${open ? ` · ${(S.houses[m.id] || []).length} gekauft` : m.unlock ? ` · Preis ${eur(m.unlock)}` : ''}`)),
          action);
      })),
      h('p', { class: 'small muted' }, 'Geld, Abos und PC-Teile nimmst du auf jede Map mit. Häuser gehören zu ihrer Map.'),
    );
  }, { cls: 'wide' });
}
