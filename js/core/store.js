// Zustands-Speicher mit Ereignissen. Szenen abonnieren Ereignisse statt globale Variablen zu lesen.
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Map();

  function on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => listeners.get(type)?.delete(fn);
  }

  function emit(type, payload) {
    for (const fn of [...(listeners.get(type) || [])]) fn(payload);
    for (const fn of [...(listeners.get('*') || [])]) fn({ type, payload });
  }

  return {
    get state() { return state; },
    // Ersetzt den ganzen Zustand (Laden, Import, Neustart).
    replace(next) { state = next; emit('replace', state); },
    on,
    emit,
  };
}
