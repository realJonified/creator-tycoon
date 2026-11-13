// Kleine DOM-Helfer.

// h('button', { class: 'btn', onclick: fn }, 'Text', kind) baut ein Element.
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// Schreibt Text nur, wenn er sich geändert hat (schont Layout und Screenreader).
export function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

export function setDisabled(el, disabled) {
  if (el.disabled !== disabled) el.disabled = disabled;
}

// Fortschrittsbalken: gibt { el, set(anteil 0..1) } zurück.
export function progressBar(label) {
  const fill = h('div', { class: 'bar-fill' });
  const el = h('div', { class: 'bar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100' }, fill);
  return {
    el,
    set(fraction) {
      const p = Math.max(0, Math.min(1, fraction || 0));
      fill.style.width = (p * 100).toFixed(1) + '%';
      el.setAttribute('aria-valuenow', String(Math.floor(p * 100)));
    },
  };
}
