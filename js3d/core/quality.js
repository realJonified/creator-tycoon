// Regeln für die Grafikstufen (ohne WebGL, damit testbar): Vorschlag beim ersten Start und automatische
// Herabstufung bei zu wenig FPS. Die Engine (js3d/scene/engine.js) wendet sie an.
export const LEVELS = ['niedrig', 'mittel', 'hoch'];

// Unter diesen FPS (Mittel über 3 Sekunden) schaltet "Automatisch" eine Stufe herunter.
export const AUTO_LIMIT = { touch: 28, desktop: 45, desktopHigh: 50 };

// Vorschlag: Handy "Niedrig", PC mit genug Kernen und MSAA-fähiger Grafik "Hoch", sonst "Mittel".
export function suggestLevel({ touch, cores = 4, maxSamples = 0 }) {
  if (touch) return 'niedrig';
  return cores >= 4 && maxSamples >= 4 ? 'hoch' : 'mittel';
}

// Liefert die neue Stufe nach einer Messung (oder dieselbe). Hochgeschaltet wird nie automatisch.
export function autoLevel(level, avgFps, touch) {
  const i = LEVELS.indexOf(level);
  if (i <= 0) return level;
  const limit = touch ? AUTO_LIMIT.touch : level === 'hoch' ? AUTO_LIMIT.desktopHigh : AUTO_LIMIT.desktop;
  return avgFps < limit ? LEVELS[i - 1] : level;
}
