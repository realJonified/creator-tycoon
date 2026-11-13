// Karriere: neuer Kanal (Prestige), Ruhm-Boni und Statistik.
import { h, setText, setDisabled, progressBar } from '../ui/dom.js';
import { fmt, eur, fmtTime, fmtPercent } from '../core/format.js';
import { fameGain, subsForFame, perkCost } from '../core/prestige.js';
import { perkLevel, fameMult } from '../core/formulas.js';
import { PERKS } from '../data/prestige.js';
import { BALANCE as B } from '../data/balance.js';

const STATS = [
  ['Kanäle gegründet', S => fmt(S.prestiges + 1)],
  ['Videos insgesamt', S => fmt(S.stats.videos)],
  ['Insgesamt verdient', S => eur(S.stats.earned)],
  ['Meiste Abos', S => fmt(S.stats.bestSubs)],
  ['Virale Hits', S => fmt(S.stats.virals)],
  ['Ereignisse', S => fmt(S.stats.events)],
  ['Spielzeit', S => fmtTime(S.stats.seconds)],
];

export default {
  id: 'karriere', title: 'Karriere', icon: '🚀', nav: true, order: 4,

  create(ctx) {
    const bar = progressBar('Fortschritt zum nächsten Ruhm-Punkt');
    const perkRows = [], statCells = [];
    let fame, fameInfo, gainText, prestigeBtn;

    function askPrestige() {
      const gain = fameGain(ctx.S);
      ctx.scenes.openOverlay('bestaetigen', {
        icon: '🚀', title: 'Neuen Kanal gründen?',
        text: `Du bekommst ${gain} Ruhm. Geld, Abos, Ausrüstung, Team und Awards beginnen von vorn. Ruhm und Ruhm-Boni bleiben für immer.`,
        yes: `Ja, neuer Kanal (+${gain} Ruhm)`,
        onYes: () => {
          const got = ctx.game.prestige();
          if (!got) return;
          ctx.audio.play('prestige');
          ctx.persist();
          ctx.toast(`🚀 Neuer Kanal! +${got} Ruhm`);
          ctx.scenes.go('karriere');
        },
      });
    }

    function onPerk(id) {
      const ok = ctx.game.buyPerk(id);
      ctx.audio.play(ok ? 'buy' : 'denied');
      if (ok) ctx.persist();
      render();
    }

    function render() {
      const S = ctx.S, gain = fameGain(S);
      setText(fame, `⭐ ${fmt(S.fame)} Ruhm`);
      setText(fameInfo, `${fmt(S.fameTotal)} insgesamt verdient · +${fmtPercent(fameMult(S) - 1)} Einnahmen (${fmtPercent(B.famePassive)} pro Punkt)`);
      const need = subsForFame(gain + 1);
      setText(gainText, gain > 0
        ? `Ein neuer Kanal bringt jetzt ${gain} Ruhm. Nächster Punkt bei ${fmt(need)} Abos.`
        : `Ab ${fmt(B.prestigeMinSubs)} Abos bringt ein neuer Kanal Ruhm. Dir fehlen noch ${fmt(Math.max(0, B.prestigeMinSubs - S.subs))}.`);
      bar.set(S.subs / need);
      setText(prestigeBtn, gain > 0 ? `🚀 Neuen Kanal gründen (+${gain} Ruhm)` : '🚀 Neuen Kanal gründen');
      setDisabled(prestigeBtn, gain <= 0);
      for (const r of perkRows) {
        const level = perkLevel(S, r.perk.id), price = perkCost(S, r.perk.id);
        setText(r.level, `Stufe ${level}/${r.perk.max}`);
        setText(r.btn, Number.isFinite(price) ? `${price} ⭐` : 'Maximum');
        setDisabled(r.btn, !Number.isFinite(price) || S.fame < price);
        r.btn.setAttribute('aria-label', Number.isFinite(price) ? `${r.perk.name} verbessern für ${price} Ruhm` : `${r.perk.name} ist auf der höchsten Stufe`);
      }
      STATS.forEach(([, value], i) => setText(statCells[i], value(S)));
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'row between scene-head' }, h('h1', null, 'Karriere')),
          h('div', { class: 'cols' },
            h('div', { class: 'stack' },
              h('div', { class: 'card' },
                h('h2', null, 'Neuer Kanal'),
                h('p', { class: 'muted small' }, 'Wenn es langsam wird: Gründe einen neuen Kanal. Du fängst von vorn an, bekommst aber Ruhm. Ruhm macht jeden weiteren Kanal schneller.'),
                gainText = h('p', { class: 'tight' }),
                bar.el,
                h('div', { style: 'margin-top: 12px' },
                  prestigeBtn = h('button', { class: 'btn gold', type: 'button', onclick: askPrestige })),
              ),
              h('div', { class: 'card' },
                h('h2', null, 'Statistik'),
                h('dl', { class: 'statgrid' }, STATS.map(([label]) => {
                  const dd = h('dd');
                  statCells.push(dd);
                  return h('div', null, h('dt', null, label), dd);
                })),
              ),
            ),
            h('div', { class: 'card' },
              h('h2', null, 'Ruhm-Boni ', h('span', { class: 'sub' }, 'bleiben für immer')),
              fame = h('div', { class: 'fame' }),
              fameInfo = h('p', { class: 'muted small' }),
              PERKS.map(perk => {
                const r = { perk };
                const row = h('div', { class: 'item' },
                  h('div', { class: 'item-icon', 'aria-hidden': 'true' }, perk.icon),
                  h('div', { class: 'item-info' },
                    h('div', { class: 'item-name' }, perk.name, ' ', r.level = h('span', { class: 'sub' })),
                    h('div', { class: 'muted small' }, perk.desc)),
                  r.btn = h('button', { class: 'btn gold perk', type: 'button', onclick: () => onPerk(perk.id) }),
                );
                perkRows.push(r);
                return row;
              }),
            ),
          ),
        );
      },
      render,
    };
  },
};
