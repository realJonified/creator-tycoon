// Tests für Update 2, Etappe 4: Grafikstufen (Vorschlag, automatische Herabstufung) und Rauschtextur.
import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestLevel, autoLevel, AUTO_LIMIT, LEVELS } from '../js3d/core/quality.js';
import { makeNoiseTexture } from '../js3d/scene/hiquality.js';

test('Vorschlag beim ersten Start: Handy Niedrig, guter PC Hoch, schwacher PC Mittel', () => {
  assert.equal(suggestLevel({ touch: true, cores: 8, maxSamples: 4 }), 'niedrig');
  assert.equal(suggestLevel({ touch: false, cores: 8, maxSamples: 4 }), 'hoch');
  assert.equal(suggestLevel({ touch: false, cores: 2, maxSamples: 4 }), 'mittel');
  assert.equal(suggestLevel({ touch: false, cores: 8, maxSamples: 0 }), 'mittel');
});

test('Automatische Herabstufung, auch von Hoch, aber nie unter Niedrig und nie hinauf', () => {
  assert.equal(autoLevel('hoch', AUTO_LIMIT.desktopHigh - 1, false), 'mittel');
  assert.equal(autoLevel('hoch', AUTO_LIMIT.desktopHigh + 1, false), 'hoch');
  assert.equal(autoLevel('mittel', AUTO_LIMIT.desktop - 1, false), 'niedrig');
  assert.equal(autoLevel('mittel', 59, false), 'mittel');
  assert.equal(autoLevel('niedrig', 5, false), 'niedrig');
  assert.equal(autoLevel('mittel', AUTO_LIMIT.touch - 1, true), 'niedrig');
  assert.equal(autoLevel('mittel', AUTO_LIMIT.touch + 1, true), 'mittel', 'Handy: 30 FPS reichen');
  // Von Hoch bei 20 FPS: zwei Messungen bis Niedrig
  assert.equal(autoLevel(autoLevel('hoch', 20, false), 20, false), 'niedrig');
  assert.deepEqual(LEVELS, ['niedrig', 'mittel', 'hoch']);
});

test('Rauschtextur für "Hoch" ist kachelbar, deterministisch und nicht flach', () => {
  const a = makeNoiseTexture(32, 3), b = makeNoiseTexture(32, 3);
  assert.deepEqual(a.image.data, b.image.data, 'gleicher Startwert, gleiche Textur');
  const r = [...a.image.data].filter((_, i) => i % 4 === 0);
  assert.ok(Math.max(...r) - Math.min(...r) > 60, 'genug Kontrast');
  assert.equal(a.wrapS, 1000); // RepeatWrapping
});
