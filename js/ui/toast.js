// Kurze Meldungen am unteren Rand. Mehrere Meldungen werden nacheinander gezeigt.
export function createToast(el, { duration = 2600 } = {}) {
  const queue = [];
  let showing = false;

  function next() {
    const msg = queue.shift();
    if (msg === undefined) { showing = false; el.classList.remove('show'); return; }
    showing = true;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(next, queue.length ? duration * 0.6 : duration);
  }

  return function toast(message) {
    if (queue.length > 4) queue.shift(); // nicht endlos stauen
    queue.push(message);
    if (!showing) next();
  };
}
