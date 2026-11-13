// Szenen-Manager.
// Eine Szene ist ein Objekt { id, title, icon, nav?, order?, modal?, create(ctx) }.
// create(ctx) liefert { mount(el, params), unmount?(), update?(dt), render?() }.
// - go(id)          wechselt die Hauptszene (mit kurzer Überblendung)
// - openOverlay(id) legt eine Szene über die aktuelle (modal oder als Hinweis)
export function createSceneManager({ root, overlayRoot, appRoot, ctx, fadeMs = 140, animate = () => true, onChange }) {
  const defs = new Map();
  const overlays = [];
  let current = null, switchToken = 0;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const safe = fn => { try { fn(); } catch (err) { console.error(err); } };

  function register(def) {
    if (!def?.id || typeof def.create !== 'function') throw new Error('Eine Szene braucht id und create().');
    defs.set(def.id, def);
  }

  function need(id) {
    const def = defs.get(id);
    if (!def) throw new Error(`Unbekannte Szene: ${id}`);
    return def;
  }

  async function go(id, params = {}) {
    const def = need(id);
    const token = ++switchToken;
    if (current && animate()) {
      root.classList.add('fade-out');
      await wait(fadeMs);
      if (token !== switchToken) return; // ein neuerer Wechsel hat übernommen
    }
    if (current) safe(() => current.inst.unmount?.());
    root.classList.remove('fade-out');
    const el = document.createElement('section');
    el.className = `scene scene-${id}` + (animate() ? ' fade-in' : '');
    el.setAttribute('aria-label', def.title || id);
    root.replaceChildren(el);
    const inst = def.create(ctx);
    current = { id, def, inst, el };
    inst.mount(el, params);
    safe(() => inst.render?.());
    globalThis.scrollTo?.(0, 0);
    onChange?.(id, def);
  }

  const modalOpen = () => overlays.some(o => o.def.modal !== false);

  function syncInert() {
    if (!appRoot) return;
    if (modalOpen()) appRoot.setAttribute('inert', ''); else appRoot.removeAttribute('inert');
  }

  function openOverlay(id, params = {}) {
    const def = need(id);
    const modal = def.modal !== false;
    const wrap = document.createElement('div');
    wrap.className = 'overlay ' + (modal ? 'modal' : 'hint') + (animate() ? ' fade-in' : '');
    const box = document.createElement('div');
    box.className = `overlay-box overlay-${id}`;
    if (modal) {
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', def.title || id);
      box.tabIndex = -1;
    }
    wrap.append(box);
    overlayRoot.append(wrap);
    const entry = { id, def, wrap, box, prevFocus: modal ? document.activeElement : null };
    entry.close = () => closeOverlay(entry);
    entry.inst = def.create(ctx);
    overlays.push(entry);
    entry.inst.mount(box, { ...params, close: entry.close });
    safe(() => entry.inst.render?.());
    if (modal) {
      wrap.addEventListener('keydown', e => trapFocus(e, box));
      (box.querySelector('[data-autofocus]') || box.querySelector('button, textarea, input') || box).focus();
    }
    syncInert();
    return entry;
  }

  function closeOverlay(entry) {
    const i = overlays.indexOf(entry);
    if (i < 0) return;
    overlays.splice(i, 1);
    safe(() => entry.inst.unmount?.());
    entry.wrap.remove();
    syncInert();
    if (entry.prevFocus?.isConnected) entry.prevFocus.focus();
  }

  // Schliesst das oberste Overlay, das sich wegklicken lässt (Escape-Taste).
  function dismissTop() {
    for (let i = overlays.length - 1; i >= 0; i--) {
      const o = overlays[i];
      if (o.def.modal === false) continue;
      if (o.def.dismissable === false) return false;
      safe(() => o.inst.dismiss?.());
      closeOverlay(o);
      return true;
    }
    return false;
  }

  function trapFocus(e, box) {
    if (e.key !== 'Tab') return;
    const items = [...box.querySelectorAll('button, textarea, input, [href]')].filter(n => !n.disabled);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function each(method, arg) {
    if (current?.inst[method]) safe(() => current.inst[method](arg));
    for (const o of [...overlays]) if (o.inst[method]) safe(() => o.inst[method](arg));
  }

  return {
    register, go, openOverlay, closeOverlay, dismissTop, modalOpen,
    update: dt => each('update', dt),
    render: () => each('render'),
    has: id => defs.has(id),
    list: () => [...defs.values()],
    get current() { return current?.id || null; },
    isOpen: id => overlays.some(o => o.id === id),
  };
}
