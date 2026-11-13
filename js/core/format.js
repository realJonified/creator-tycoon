// Zahlenformat auf Deutsch, ohne Intl (läuft überall gleich).
const UNITS = ['', 'Tsd.', 'Mio.', 'Mrd.', 'Bio.', 'Brd.', 'Trill.', 'Trd.', 'Quadr.', 'Quadrd.', 'Quint.', 'Quintd.'];

// Schneidet auf "digits" Nachkommastellen ab (rundet nie auf) und nutzt ein Komma.
function cut(value, digits) {
  const f = 10 ** digits;
  const v = Math.floor(value * f + 1e-9) / f;
  return String(v).replace('.', ',');
}

export function fmt(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  if (n < 0) return '−' + fmt(-n);
  if (n === Infinity) return '∞';
  if (n < 1000) return n < 10 && n % 1 ? cut(n, 1) : String(Math.floor(n + 1e-9));
  let idx = Math.floor(Math.log10(n) / 3);
  if (n / 10 ** (idx * 3) >= 1000) idx++;
  if (n / 10 ** (idx * 3) < 1) idx--;
  if (idx < UNITS.length) return cut(n / 10 ** (idx * 3), 2) + ' ' + UNITS[idx];
  // Jenseits der benannten Einheiten: wissenschaftliche Schreibweise
  let exp = Math.floor(Math.log10(n));
  if (n / 10 ** exp >= 10) exp++;
  return cut(n / 10 ** exp, 2) + 'e' + exp;
}

export const eur = n => fmt(n) + ' €';

export function fmtPercent(fraction) {
  return cut(fraction * 100, 0) + ' %';
}

export function fmtMult(x) {
  return '×' + cut(x, 2);
}

export function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return s + ' s';
  if (s < 3600) return Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h + ' h' + (m ? ' ' + m + ' min' : '');
}
