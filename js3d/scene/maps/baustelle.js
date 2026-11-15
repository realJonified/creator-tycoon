// Platzhalter für Maps, die angelegt, aber noch nicht gebaut sind ("Kommt bald").
// Eine kleine Plattform in den Farben der Map mit Portal zurück zur Weltkarte.
import * as THREE from '../../../vendor/three.module.min.js';
import { Builder, matrix, LAMBERT, textSprite } from '../build.js';
import { disposeObject } from '../dispose.js';

export function buildBaustelle(engine, S, map) {
  const group = new THREE.Group();
  const R = map.walkRadius + 2;
  const b = new Builder();
  const ground = new THREE.Color(map.sky.hemiGround).lerp(new THREE.Color('#ffffff'), 0.25).getStyle();
  b.add(new THREE.CylinderGeometry(R, R + 3, 3, 40), ground, matrix(0, -1.5, 0));
  b.disc(0, 6, 0, 0.03, 0, '#d9d3c7', 32);
  // Portal (wie auf Map 1, kleiner)
  for (const sx of [-1, 1]) b.box(0.8, 4.2, 0.8, sx * 2.6, 0, 0, '#4c4f6b');
  b.add(new THREE.TorusGeometry(2.6, 0.35, 8, 20, Math.PI), '#4c4f6b', matrix(0, 4.2, 0));
  // Absperrungen und Kisten
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * (R - 6), z = Math.sin(a) * (R - 6);
    b.box(2.4, 0.9, 0.3, x, 0, z, i % 2 ? '#f59e0b' : '#111827', -a);
    b.box(1.2, 1.2, 1.2, x * 0.7, 0, z * 0.7 + 1, '#a0673f', a);
  }
  group.add(b.mesh());
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.25, 28), new THREE.MeshBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
  disc.position.set(0, 2.3, 0);
  group.add(disc);
  const sign = textSprite([map.name, 'Hier wird noch gebaut'], { scale: 5, bg: '#1f2937', accent: '#fbbf24' });
  sign.position.set(0, 6.6, 0);
  group.add(sign);
  engine.scene.add(group);
  return {
    group,
    colliders: { circles: [{ x: -2.6, z: 0, r: 0.6 }, { x: 2.6, z: 0, r: 0.6 }], boxes: [{ x: 0, z: 0, hw: 1.9, hd: 0.2, rot: 0 }] },
    triggers: [{ id: 'portal', kind: 'portal', x: map.portal.x, z: map.portal.z + 2, r: 3 }],
    houseSigns: [],
    update(t) { disc.rotation.z = t; },
    dispose() { return disposeObject(group); },
  };
}
