// Spiel-Loop mit festen Zeitschritten.
// - update(step) läuft immer mit derselben Schrittweite, egal wie schnell der Bildschirm ist.
// - Eine Lücke über awayAfter Sekunden (Tab im Hintergrund, Ruhezustand) wird nicht
//   nachgerechnet, sondern als Abwesenheit an onAway(sekunden) gemeldet.
export function createLoop({
  step = 0.1,
  awayAfter = 2,
  update,
  render,
  onAway,
  now = () => Date.now(),
  raf = fn => globalThis.requestAnimationFrame(fn),
  cancel = id => globalThis.cancelAnimationFrame(id),
}) {
  let last = null, acc = 0, running = false, handle = null;

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

  return {
    frame,
    start() { if (running) return; running = true; last = null; acc = 0; handle = raf(tick); },
    stop() { running = false; if (handle !== null) cancel(handle); handle = null; },
    get running() { return running; },
  };
}
