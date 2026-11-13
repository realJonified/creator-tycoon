// Töne über Web Audio, ohne Dateien. Standardmässig aus.
// Der AudioContext entsteht erst beim ersten Ton nach einer Eingabe (kein Autoplay).
export function createAudio(isEnabled) {
  let ac = null, unlocked = false;

  function context() {
    if (!ac) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  // Ein kurzer Ton: Frequenz in Hz, Dauer in s. slide > 1 gleitet nach oben, < 1 nach unten.
  function tone(freq, dur, { type = 'sine', gain = 0.05, delay = 0, slide = 1 } = {}) {
    const a = context();
    if (!a) return;
    const t = a.currentTime + delay;
    const osc = a.createOscillator(), amp = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Neuer Ton = eine neue Zeile.
  const SOUNDS = {
    click: () => tone(520, 0.05, { type: 'triangle' }),
    buy: () => { tone(440, 0.07); tone(660, 0.1, { delay: 0.06 }); },
    denied: () => tone(160, 0.12, { type: 'square', gain: 0.03 }),
    nav: () => tone(380, 0.04, { type: 'triangle', gain: 0.03 }),
    award: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { delay: i * 0.09 })),
    viral: () => tone(300, 0.35, { type: 'sawtooth', gain: 0.03, slide: 4 }),
    event: () => { tone(740, 0.09); tone(988, 0.14, { delay: 0.1 }); },
    good: () => { tone(587, 0.08); tone(880, 0.16, { delay: 0.08 }); },
    bad: () => tone(220, 0.3, { type: 'sawtooth', gain: 0.03, slide: 0.5 }),
    prestige: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { delay: i * 0.08 })),
  };

  return {
    // Nach der ersten Eingabe des Spielers aufrufen.
    unlock() { unlocked = true; },
    play(name) {
      if (!unlocked || !isEnabled()) return;
      try { SOUNDS[name]?.(); } catch { /* Ton ist nie wichtig genug für einen Fehler */ }
    },
  };
}
