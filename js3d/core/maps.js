// Karten-Verwalter: Es ist immer nur EINE Map geladen. Beim Wechsel wird zuerst die alte Map
// vollständig entsorgt, dann die neue gebaut. Ohne three.js, damit es in Node testbar ist:
// build(id) und dispose(instanz) werden von aussen hineingegeben.
// Mehrere Wechsel kurz hintereinander laufen in einer Warteschlange nacheinander ab.
export function createMapManager({ build, dispose, onLoading = null }) {
  let current = null;
  let queue = Promise.resolve();

  async function doLoad(id, force = false) {
    if (current?.id === id && !force) return current.instance;
    await onLoading?.(true, id);
    try {
      if (current) { const old = current; current = null; dispose(old.instance, old.id); }
      const instance = await build(id);
      current = { id, instance };
      return instance;
    } finally {
      await onLoading?.(false, id);
    }
  }

  function enqueue(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  }

  return {
    load: id => enqueue(() => doLoad(id)),
    // Lädt dieselbe Map neu (z. B. für den Speichertest).
    reload: () => enqueue(() => (current ? doLoad(current.id, true) : null)),
    get id() { return current?.id ?? null; },
    get instance() { return current?.instance ?? null; },
  };
}
