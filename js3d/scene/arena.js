// Boss-Arena hinter dem Portal: schwebende Plattform, Kristalle, der Boss "Glitchgolem",
// Schüsse, Zielkreise und Einschläge. Die Regeln stehen in js3d/core/boss.js.
import * as THREE from '../../vendor/three.module.min.js';
import { Builder, matrix, LAMBERT } from './build.js';
import { W } from '../data/balance.js';

export function buildArena(engine) {
  const group = new THREE.Group();
  const R = W.arenaRadius;
  const b = new Builder();
  b.add(new THREE.CylinderGeometry(R + 1, R - 3, 3, 28), '#3b3355', matrix(0, -1.5, 0));
  b.disc(0, R, 0, 0.02, 0, '#4c4370', 28);
  b.disc(R - 0.8, R, 0, 0.04, 0, '#f472b6', 28);
  for (let i = 0; i < 6; i++) b.disc(4 + i * 2.2, 4.15 + i * 2.2, 0, 0.03, 0, '#5b5185', 28);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, x = Math.cos(a) * (R + 2.5), z = Math.sin(a) * (R + 2.5);
    b.add(new THREE.OctahedronGeometry(1, 0), i % 2 ? '#a78bfa' : '#22d3ee', matrix(x, 2 + (i % 3), z, a, 0, 0, 0.8, 2.6, 0.8));
  }
  // Schwebende Felsen unter der Plattform
  for (let i = 0; i < 8; i++) { const a = i * 0.8; b.add(new THREE.DodecahedronGeometry(2, 0), '#2e2745', matrix(Math.cos(a) * (R + 9), -6 - i % 3 * 3, Math.sin(a) * (R + 9))); }
  group.add(b.mesh());

  // ---------- Boss "Glitchgolem" ----------
  const boss = new THREE.Group();
  const bb = new Builder();
  bb.box(3.2, 3, 2.4, 0, 1.6, 0, '#4c1d95');           // Rumpf
  bb.box(3.6, 0.6, 2.8, 0, 3.0, 0, '#6d28d9');          // Schultern
  bb.box(2.2, 1.8, 2, 0, 3.6, 0, '#5b21b6');            // Kopf
  for (const sx of [-1, 1]) {
    bb.box(0.9, 2.6, 0.9, sx * 2.3, 1.0, 0, '#3b0764');  // Arme
    bb.box(1.2, 0.9, 1.2, sx * 2.3, 0.4, 0, '#22d3ee');  // Fäuste
    bb.box(1, 1.6, 1, sx * 0.8, 0, 0, '#3b0764');        // Beine
  }
  for (let i = 0; i < 5; i++) bb.cone(0.3, 0.9, -0.9 + i * 0.45, 5.4, 0, '#facc15', 4);   // Zackenkrone
  bb.box(2.4, 0.18, 0.1, 0, 3.0, 1.25, '#f472b6');
  const bossMesh = bb.mesh();
  boss.add(bossMesh);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#22d3ee' });
  for (const sx of [-0.5, 0.5]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.1), eyeMat); e.position.set(sx, 4.6, 1.02); boss.add(e); }
  group.add(boss);

  // ---------- Effekte (vorab angelegte Pools, keine neuen Objekte im Kampf) ----------
  const shotGeo = new THREE.IcosahedronGeometry(0.22, 0), shotMat = new THREE.MeshBasicMaterial({ color: '#fde047' });
  const shots = Array.from({ length: 12 }, () => { const m = new THREE.Mesh(shotGeo, shotMat); m.visible = false; group.add(m); return { m, t: 1, from: new THREE.Vector3(), to: new THREE.Vector3() }; });
  const ringGeo = new THREE.RingGeometry(0.85, 1, 40), discGeo = new THREE.CircleGeometry(1, 40);
  const markers = Array.from({ length: 6 }, () => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.9, depthWrite: false }));
    const fill = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.25, depthWrite: false }));
    ring.rotation.x = fill.rotation.x = -Math.PI / 2; ring.position.y = 0.06; fill.position.y = 0.05;
    g.add(ring, fill); g.visible = false; group.add(g);
    return { g, fill, id: 0 };
  });
  const blasts = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; group.add(m); return { m, t: 1 };
  });

  group.visible = false;
  engine.scene.add(group);

  let shotIdx = 0, blastIdx = 0, hurt = 0;
  return {
    group,
    spawn: { x: 0, z: R - 3, yaw: 0 },
    bounds: { x: 0, z: 0, r: R - 0.6, inner: 3.3 },
    colliders: { circles: [], boxes: [] },
    reset() { for (const s of shots) { s.t = 1; s.m.visible = false; } for (const m of markers) m.g.visible = false; for (const x of blasts) { x.t = 1; x.m.visible = false; } boss.visible = true; boss.scale.setScalar(1); hurt = 0; },
    shoot(fromPos) {
      const s = shots[shotIdx++ % shots.length];
      s.from.set(fromPos.x, 1.4, fromPos.z); s.to.set((Math.random() - 0.5) * 1.5, 2.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5); s.t = 0; s.m.visible = true;
      hurt = 0.12;
    },
    warn(atk) { const m = markers.find(x => !x.g.visible) || markers[0]; m.id = atk.id; m.atk = atk; m.g.position.set(atk.x, 0, atk.z); m.g.scale.setScalar(atk.radius); m.g.visible = true; },
    blast(atk) {
      const m = markers.find(x => x.id === atk.id); if (m) m.g.visible = false;
      const x = blasts[blastIdx++ % blasts.length]; x.m.position.set(atk.x, 1.5, atk.z); x.m.scale.set(atk.radius, 1, atk.radius); x.t = 0; x.m.visible = true;
    },
    update(dt, t, playerPos, hpFrac) {
      boss.position.y = Math.sin(t * 2) * 0.25;
      boss.rotation.y = Math.atan2(playerPos.x, playerPos.z);
      boss.rotation.z = Math.sin(t * 9) * (hurt > 0 ? 0.04 : 0);
      eyeMat.color.set(hpFrac < 0.3 ? '#f43f5e' : '#22d3ee');
      hurt = Math.max(0, hurt - dt);
      for (const s of shots) {
        if (s.t >= 1) continue;
        s.t = Math.min(1, s.t + dt * 4.5);
        s.m.position.lerpVectors(s.from, s.to, s.t);
        if (s.t >= 1) s.m.visible = false;
      }
      for (const m of markers) if (m.g.visible && m.atk) m.fill.material.opacity = 0.15 + (1 - Math.max(0, m.atk.left) / W.attackWarn) * 0.45;
      for (const x of blasts) {
        if (x.t >= 1) continue;
        x.t = Math.min(1, x.t + dt * 2.5);
        x.m.material.opacity = 0.8 * (1 - x.t);
        x.m.scale.y = 1 + x.t;
        if (x.t >= 1) x.m.visible = false;
      }
    },
    defeat() { boss.visible = false; },
  };
}
