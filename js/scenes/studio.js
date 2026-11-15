// Studio: die Hauptszene. Hier nimmt man Videos auf, sieht aktive Boni und die Tagesziele.
import { h, setText, setDisabled, progressBar } from '../ui/dom.js';
import { fmt, eur, fmtMult } from '../core/format.js';
import { clickMoney, clickSubs, subMult, nextAward } from '../core/formulas.js';
import { goalProgress, goalText, goalReward, findGoal } from '../core/goals.js';
import { BALANCE as B } from '../data/balance.js';

export default {
  id: 'studio', title: 'Studio', icon: '🎬', nav: true, order: 1,

  create(ctx) {
    let area, videos, info, buffs, awardName, awardText, goalList, goalHint;
    let goalRows = [], goalsDay = null, buffKey = '';
    const bar = progressBar('Fortschritt zum nächsten Award');

    function floatText(text, cls, x, y) {
      const el = h('div', { class: 'float ' + cls, 'aria-hidden': 'true' }, text);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      area.append(el);
      setTimeout(() => el.remove(), 900);
    }

    function onRecord(e) {
      const r = ctx.game.record();
      ctx.audio.play(r.viral ? 'viral' : 'click');
      if (ctx.animations()) {
        const box = area.getBoundingClientRect();
        // Bei Tastatur-Klicks (keine Mausposition) erscheint der Text in der Mitte.
        const byMouse = e.detail > 0 && e.clientX > 0;
        const x = (byMouse ? e.clientX - box.left : box.width / 2) - 30 + Math.random() * 30;
        const y = (byMouse ? e.clientY - box.top : box.height / 3) - 24;
        floatText('+' + eur(r.money), 'money', x, y);
        floatText('+' + fmt(r.subs) + ' 👥', 'subs', x + 8, y + 20);
      }
      render();
    }

    function onClaim(index) {
      const r = ctx.game.claimGoal(index);
      if (!r) return;
      ctx.audio.play('good');
      ctx.toast(r.bonus
        ? `🎯 Alle Tagesziele geschafft! +${eur(r.money)} und ${B.goalBonusSeconds / 60} min lang ${fmtMult(B.goalBonusMult)}`
        : `🎯 Tagesziel geschafft! +${eur(r.money)}`);
      ctx.persist();
      render();
    }

    // Baut die Zeilen der Tagesziele neu auf (beim Start und wenn ein neuer Tag beginnt).
    function buildGoals() {
      const goals = ctx.S.goals;
      goalsDay = goals?.day ?? null;
      goalRows = (goals?.list || []).map((goal, index) => {
        const r = { goal, bar: progressBar('Fortschritt') };
        r.el = h('div', { class: 'goal' },
          h('div', { class: 'goal-icon', 'aria-hidden': 'true' }, findGoal(goal.id)?.icon || '🎯'),
          h('div', null, goalText(goal, fmt), ' ', r.count = h('span', { class: 'sub' })),
          r.bar.el,
          r.btn = h('button', { class: 'btn gold', type: 'button', onclick: () => onClaim(index) }),
        );
        return r;
      });
      goalList.replaceChildren(...goalRows.map(r => r.el));
    }

    function renderBuffs(S) {
      const key = S.buffs.map(b => `${b.id}:${Math.ceil(b.left)}`).join('|');
      if (key === buffKey) return;
      buffKey = key;
      buffs.replaceChildren(...S.buffs.map(b =>
        h('span', { class: 'buff' }, `${b.icon} ${b.label} ${fmtMult(b.mult)} · ${Math.ceil(b.left)} s`)));
    }

    function render() {
      const S = ctx.S;
      setText(videos, fmt(S.videos) + ' Videos');
      setText(info, `Pro Video: +${eur(clickMoney(S))} · +${fmt(clickSubs(S))} Abos · Abo-Bonus ${fmtMult(subMult(S))}`);
      renderBuffs(S);
      const next = nextAward(S);
      if (next) {
        setText(awardName, `${next.icon} ${next.name}`);
        setText(awardText, `${fmt(S.subs)} / ${fmt(next.subs)} Abos`);
        bar.set(S.subs / next.subs);
      } else {
        setText(awardName, '👑 Alle Awards geholt');
        setText(awardText, 'Zeit für einen neuen Kanal?');
        bar.set(1);
      }
      if ((S.goals?.day ?? null) !== goalsDay || goalRows.some((r, i) => r.goal !== S.goals.list[i])) buildGoals();
      const reward = eur(goalReward(S));
      for (const r of goalRows) {
        const g = r.goal, progress = goalProgress(S, g);
        setText(r.count, g.claimed ? 'erledigt ✓' : `${fmt(progress)} / ${fmt(g.target)}`);
        r.bar.set(progress / g.target);
        setText(r.btn, g.claimed ? 'Abgeholt' : `+${reward}`);
        setDisabled(r.btn, !g.done || g.claimed);
        r.btn.setAttribute('aria-label', g.claimed ? 'Belohnung abgeholt' : `Belohnung abholen: ${reward}`);
        r.el.classList.toggle('claimed', g.claimed);
      }
      setText(goalHint, S.goals?.bonus
        ? 'Alle drei geschafft. Morgen gibt es neue Ziele.'
        : `Alle drei abholen: ${B.goalBonusSeconds / 60} min lang ${fmtMult(B.goalBonusMult)} Einnahmen und Abos.`);
    }

    return {
      mount(el) {
        el.append(
          h('div', { class: 'card record-card' },
            h('h2', null, 'Studio ', videos = h('span', { class: 'sub' })),
            area = h('div', { class: 'record-area' },
              h('button', { class: 'rec-btn', type: 'button', onclick: onRecord },
                h('span', { class: 'rec-icon', 'aria-hidden': 'true' }, '⏺️'), 'Video aufnehmen'),
              buffs = h('div', { class: 'buffs', 'aria-label': 'Aktive Boni' }),
              info = h('p', { class: 'muted center tight' }),
            ),
          ),
          h('div', { class: 'stack' },
            h('div', { class: 'card' },
              h('h2', null, 'Nächster Award'),
              h('div', { class: 'row between' }, awardName = h('strong'), awardText = h('span', { class: 'muted small' })),
              bar.el,
            ),
            h('div', { class: 'card' },
              h('h2', null, '🎯 Tagesziele'),
              goalList = h('div'),
              goalHint = h('p', { class: 'muted small', style: 'margin: 8px 0 0' }),
            ),
          ),
        );
      },
      render,
    };
  },
};
