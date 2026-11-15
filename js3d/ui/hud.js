// Anzeige über der 3D-Welt: Geld, Abos, Portal-Countdown, Benutzen-Hinweis, Meldungen, FPS.
import { h, setText } from '../../js/ui/dom.js';
import { fmt, eur } from '../../js/core/format.js';
import { moneyPerSec } from '../core/economy.js';

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export { mmss };

export function createHud({ onUse, onMenu }) {
  const $ = id => document.getElementById(id);
  const money = $('hMoney'), subs = $('hSubs'), rate = $('hRate'), portal = $('hPortal'), prompt = $('prompt'), fps = $('fps'), toastEl = $('toast');
  prompt.addEventListener('click', () => onUse());
  $('menuBtn').addEventListener('click', () => onMenu());

  const queue = [];
  let showing = false;
  function next() {
    const m = queue.shift();
    if (!m) { showing = false; toastEl.classList.remove('show'); return; }
    showing = true; toastEl.textContent = m; toastEl.classList.add('show');
    setTimeout(next, queue.length ? 1700 : 2800);
  }

  return {
    toast(m) { if (queue.length > 4) queue.shift(); queue.push(m); if (!showing) next(); },
    render(S) {
      setText(money, eur(S.money));
      setText(subs, fmt(S.subs));
      setText(rate, `+${eur(moneyPerSec(S))}/s`);
      const open = S.portal.open > 0;
      setText(portal, open ? `🌀 Portal OFFEN · ${mmss(S.portal.open)}` : `🌀 Portal in ${mmss(S.portal.in)}`);
      portal.classList.toggle('open', open);
    },
    // label = Text oder null (dann versteckt). enabled = ob man es benutzen kann.
    prompt(label, enabled = true) {
      if (!label) { prompt.hidden = true; return; }
      prompt.hidden = false;
      prompt.disabled = !enabled;
      setText(prompt, label);
    },
    fps(on, text) { fps.hidden = !on; if (on) setText(fps, text); },
    show(on) { $('hud').hidden = !on; if (!on) prompt.hidden = true; },
  };
}

// Fenster (Shop, Video, Menü …). Solange eines offen ist, bewegt sich die Figur nicht.
export function createPanels(root) {
  let cur = null;
  function close() {
    if (!cur) return;
    const c = cur; cur = null;
    c.onClose?.();
    c.wrap.remove();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && cur?.dismissable) { e.preventDefault(); close(); } });
  return {
    get isOpen() { return !!cur; },
    get current() { return cur; },
    close,
    open(build, { dismissable = true, cls = '', onClose, update } = {}) {
      close();
      const box = h('div', { class: 'panel ' + cls, role: 'dialog', 'aria-modal': 'true' });
      const wrap = h('div', { class: 'panel-wrap' }, box);
      if (dismissable) wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
      root.append(wrap);
      cur = { wrap, box, dismissable, onClose, update };
      build(box, close);
      (box.querySelector('[data-autofocus]') || box.querySelector('button'))?.focus({ preventScroll: true });
      return cur;
    },
    update(dt) { cur?.update?.(dt); },
  };
}
