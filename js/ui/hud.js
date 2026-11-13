// Kopfzeile (Geld, Abos) und Navigation. Beides ist nur in Szenen mit nav: true sichtbar.
import { h, setText } from './dom.js';
import { fmt, eur } from '../core/format.js';
import { moneyPerSec, subsPerSec } from '../core/formulas.js';

export function createHud({ hudEl, navEl, ctx }) {
  const $ = id => hudEl.querySelector('#' + id);
  const navScenes = ctx.scenes.list().filter(s => s.nav).sort((a, b) => (a.order || 0) - (b.order || 0));
  const buttons = new Map();

  navScenes.forEach((scene, i) => {
    const btn = h('button', {
      class: 'nav-btn', type: 'button', title: `${scene.title} (Taste ${i + 1})`,
      onclick: () => { ctx.audio.play('nav'); ctx.scenes.go(scene.id); },
    }, h('span', { class: 'nav-icon', 'aria-hidden': 'true' }, scene.icon), h('span', { class: 'nav-label' }, scene.title));
    buttons.set(scene.id, btn);
    navEl.append(btn);
  });

  // Tastatur: 1–9 wechselt die Szene, Escape schliesst ein Overlay.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (ctx.scenes.dismissTop()) e.preventDefault(); return; }
    if (e.ctrlKey || e.altKey || e.metaKey || e.target.closest?.('input, textarea')) return;
    if (ctx.scenes.modalOpen() || navEl.hidden) return;
    const scene = navScenes[Number(e.key) - 1];
    if (scene) { e.preventDefault(); ctx.scenes.go(scene.id); }
  });

  return {
    setActive(id, def) {
      hudEl.hidden = navEl.hidden = !def.nav;
      document.body.classList.toggle('no-nav', !def.nav);
      for (const [sceneId, btn] of buttons) {
        if (sceneId === id) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
      }
      document.title = def.nav ? `${def.title} · Creator Tycoon` : 'Creator Tycoon';
    },
    render() {
      if (hudEl.hidden) return;
      const S = ctx.S;
      setText($('hudMoney'), eur(S.money));
      setText($('hudSubs'), fmt(S.subs));
      setText($('hudMoneyRate'), '+' + eur(moneyPerSec(S)) + '/s');
      setText($('hudSubsRate'), '+' + fmt(subsPerSec(S)) + ' Abos/s');
    },
  };
}
