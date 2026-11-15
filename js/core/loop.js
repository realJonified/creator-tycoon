// Spiel-Loop mit festen Zeitschritten.
// - update(step) läuft immer mit derselben Schrittweite, egal wie schnell der Bildschirm ist.
// - Eine Lücke über awayAfter Sekunden (Tab im Hintergrund, Ruhezustand) wird nicht
//   nachgerechnet, sondern als Abwesenheit an onAway(sekunden) gemeldet.
// - Liefert der Browser keine Bild-Takte, obwohl die Seite als sichtbar gilt (verdecktes
//   Fenster, eingebettete Ansicht), springt ein Ersatz-Takt ein, damit das Spiel nicht einfriert.
export function createLoop({
  step = 0.1,
  awayAfter = 2,
  fallbackMs = 250,
  update,
  render,
  onAway,
  now = () => Date.now(),
  raf = fn => globalThis.requestAnimationFrame(fn),
  cancel = id => globalThis.cancelAnimationFrame(id),
  isHidden = () => globalThis.document?.hidden ?? false,
  every = (fn, ms) => globalThis.setInterval(fn, ms),
  clearEvery = id => globalThis.clearInterval(id),
}) {
  let last = null, acc = 0, running = false, handle = null, timer = null;

  // Verarbeitet einen Zeitpunkt (ms) und gibt die Zahl der gerechneten Schritte zurück.
  function frame(nowMs) {
    if (last === null) { last = nowMs; render?.(); return 0; }
    const delta = Math.max(0, (nowMs - last) / 1000);
    last = nowMs;
    if (delta > awayAfter) { onAway?.(delta); render?.(); return 0; }
    acc += delta;
    let steps = 0;
    // Kleine Toleranz, damit Gleitkomma-Reste (0,0999…) keinen Schritt verschlucken.
    while (acc >= step - 1e-9) { update(step); acc = Math.max(0, acc - step); steps++; }
    if (steps > 0) render?.();
    return steps;
  }

  function tick() {
    if (!running) return;
    frame(now());
    handle = raf(tick);
  }

  // Ersatz-Takt: nur wenn die Seite sichtbar ist und trotzdem länger kein Bild-Takt kam.
  // Ein wirklich versteckter Tab bleibt stehen und wird bei der Rückkehr als Abwesenheit gezählt.
  function fallback() {
    if (!running || isHidden() || last === null) return;
    if (now() - last >= fallbackMs) frame(now());
  }

  return {
    frame,
    fallback,
    start() {
      if (running) return;
      running = true; last = null; acc = 0;
      frame(now());
      handle = raf(tick);
      timer = every(fallback, fallbackMs);
    },
    stop() {
      running = false;
      if (handle !== null) cancel(handle);
      if (timer !== null) clearEvery(timer);
      handle = timer = null;
    },
    get running() { return running; },
  };
}
