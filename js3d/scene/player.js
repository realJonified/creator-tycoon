// Spielfigur "Pixel": aus Quadern gebaut, mit Lauf-Animation. Bewegung relativ zur Kamera.
import * as THREE from '../../vendor/three.module.min.js';
import { resolve } from '../core/physics.js';

const WALK = 6, RUN = 10, RADIUS = 0.45;

function part(w, h, d, color, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z); m.castShadow = true;
  parent.add(m);
  return m;
}

export function createPlayer(scene) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  // Beine und Arme hängen an Gelenken, damit sie schwingen können.
  const joint = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); body.add(g); return g; };
  const legL = joint(-0.18, 0.85, 0), legR = joint(0.18, 0.85, 0);
  part(0.28, 0.85, 0.3, '#334155', 0, -0.42, 0, legL); part(0.28, 0.85, 0.3, '#334155', 0, -0.42, 0, legR);
  part(0.3, 0.16, 0.42, '#f8fafc', 0, -0.82, 0.05, legL); part(0.3, 0.16, 0.42, '#f8fafc', 0, -0.82, 0.05, legR);
  part(0.72, 0.8, 0.42, '#14b8a6', 0, 1.25, 0, body);              // Kapuzenpulli
  part(0.5, 0.22, 0.05, '#0f766e', 0, 1.05, 0.22, body);            // Bauchtasche
  const armL = joint(-0.48, 1.58, 0), armR = joint(0.48, 1.58, 0);
  part(0.22, 0.72, 0.26, '#14b8a6', 0, -0.33, 0, armL); part(0.22, 0.72, 0.26, '#14b8a6', 0, -0.33, 0, armR);
  part(0.2, 0.2, 0.22, '#f1c27d', 0, -0.76, 0, armL); part(0.2, 0.2, 0.22, '#f1c27d', 0, -0.76, 0, armR);
  const head = new THREE.Group(); head.position.set(0, 1.95, 0); body.add(head);
  part(0.62, 0.6, 0.58, '#f1c27d', 0, 0, 0, head);
  part(0.66, 0.2, 0.62, '#4a2c1a', 0, 0.32, -0.02, head);            // Haare
  part(0.7, 0.12, 0.3, '#f97316', 0, 0.38, 0.3, head);               // Kappenschirm
  part(0.68, 0.16, 0.64, '#f97316', 0, 0.42, 0, head);
  part(0.1, 0.1, 0.04, '#111827', -0.14, 0.04, 0.3, head); part(0.1, 0.1, 0.04, '#111827', 0.14, 0.04, 0.3, head);
  part(0.2, 0.05, 0.04, '#9a3412', 0, -0.14, 0.3, head);
  // Kopfhörer
  part(0.1, 0.26, 0.26, '#111827', -0.36, 0.02, 0, head); part(0.1, 0.26, 0.26, '#111827', 0.36, 0.02, 0, head);
  // Blob-Schatten für die Stufe ohne Echtzeit-Schatten
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.04;
  root.add(blob);
  scene.add(root);

  const pos = { x: 0, z: 0 };
  let y = 0; // Höhe der Ebene, auf der die Figur steht
  let facing = 0, phase = 0, speedNow = 0;

  return {
    root, pos, radius: RADIUS,
    get facing() { return facing; },
    get y() { return y; },
    set y(v) { y = v; root.position.y = v; },
    place(x, z, yaw, height = y) { pos.x = x; pos.z = z; facing = yaw; y = height; root.position.set(x, y, z); root.rotation.y = yaw; },
    setBlob(on) { blob.visible = on; },

    // move = { x, y } aus Tastatur/Joystick (-1..1), camYaw = Blickrichtung der Kamera
    update(dt, move, run, camYaw, colliders, bounds) {
      const len = Math.min(1, Math.hypot(move.x, move.y));
      let target = 0;
      if (len > 0.05) {
        // Vorwärts = von der Kamera weg
        const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
        const dx = fx * move.y + rx * move.x, dz = fz * move.y + rz * move.x;
        const n = Math.hypot(dx, dz) || 1;
        target = (run ? RUN : WALK) * len;
        pos.x += (dx / n) * target * dt; pos.z += (dz / n) * target * dt;
        const want = Math.atan2(dx, dz);
        let diff = want - facing;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        facing += diff * Math.min(1, dt * 12);
      }
      resolve(pos, RADIUS, colliders, bounds);
      speedNow += (target - speedNow) * Math.min(1, dt * 10);
      phase += dt * (4 + speedNow * 1.2);
      const swing = Math.min(1, speedNow / WALK) * 0.75;
      legL.rotation.x = Math.sin(phase) * swing; legR.rotation.x = -Math.sin(phase) * swing;
      armL.rotation.x = -Math.sin(phase) * swing * 0.9; armR.rotation.x = Math.sin(phase) * swing * 0.9;
      body.position.y = Math.abs(Math.sin(phase)) * swing * 0.09 + (speedNow < 0.2 ? Math.sin(phase * 0.5) * 0.015 : 0);
      root.position.set(pos.x, y, pos.z);
      root.rotation.y = facing;
    },
  };
}
