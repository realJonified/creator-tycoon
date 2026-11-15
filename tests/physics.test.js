// Tests für die Kollision der 3D-Welt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, nearestTrigger, clearDistance } from '../js3d/core/physics.js';

test('Kreis-Hindernis schiebt die Figur hinaus', () => {
  const p = resolve({ x: 0.3, z: 0 }, 0.5, { circles: [{ x: 0, z: 0, r: 1 }], boxes: [] });
  assert.ok(Math.abs(Math.hypot(p.x, p.z) - 1.5) < 1e-9);
});

test('Gedrehtes Haus schiebt die Figur zur nächsten Kante', () => {
  const box = { x: 10, z: 0, hw: 2, hd: 1, rot: Math.PI / 2 }; // gedreht: 2 m in z-Richtung, 1 m in x
  const p = resolve({ x: 10.2, z: 1.5 }, 0.5, { circles: [], boxes: [box] });
  assert.ok(Math.abs(p.x - 10) > 1.4 || Math.abs(p.z) > 2.4, `${p.x}, ${p.z}`);
  const free = resolve({ x: 20, z: 0 }, 0.5, { circles: [], boxes: [box] });
  assert.deepEqual(free, { x: 20, z: 0 });
});

test('Inselrand und Arena-Mitte begrenzen', () => {
  const out = resolve({ x: 100, z: 0 }, 0.5, { circles: [], boxes: [] }, { x: 0, z: 0, r: 78 });
  assert.ok(Math.abs(out.x - 78) < 1e-9);
  const mid = resolve({ x: 1, z: 0 }, 0.5, { circles: [], boxes: [] }, { x: 0, z: 0, r: 16, inner: 3 });
  assert.ok(Math.abs(mid.x - 3) < 1e-9);
});

test('Nächster Auslöser in Reichweite', () => {
  const t = [{ id: 'a', x: 0, z: 0, r: 2 }, { id: 'b', x: 1, z: 0, r: 2 }];
  assert.equal(nearestTrigger({ x: 0.9, z: 0 }, t).id, 'b');
  assert.equal(nearestTrigger({ x: 9, z: 0 }, t), null);
});

test('Kamera rückt vor Hindernissen näher heran', () => {
  const cols = { circles: [{ x: 0, z: 5, r: 0.8 }], boxes: [] };
  const d = clearDistance({ x: 0, z: 0 }, 0, 1, 10, cols);
  assert.ok(d < 5 && d >= 1.5, `${d}`);
  assert.equal(clearDistance({ x: 0, z: 0 }, 1, 0, 10, cols), 10);
});
