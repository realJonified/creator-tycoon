// Kamera in der dritten Person: kreist um die Figur, folgt weich. Drehen mit Maus/Wischen, Zoom mit Mausrad.
// clear(dirX, dirZ, dist) liefert, wie weit die Kamera gehen darf, ohne dass ein Hindernis dazwischen steht.
export function createCameraRig(camera) {
  let yaw = 0, pitch = 0.42, dist = 8, minDist = 4, maxDist = 13, actual = 8;
  const cur = { x: 0, y: 4, z: 8 }, look = { x: 0, y: 1.5, z: 0 };
  let snap = true;

  return {
    get yaw() { return yaw; },
    setYaw(v) { yaw = v; snap = true; },
    setLimits(min, max, d) { minDist = min; maxDist = max; dist = d ?? dist; actual = dist; snap = true; },
    rotate(dx, dy) { yaw -= dx; pitch = Math.max(0.08, Math.min(1.25, pitch + dy)); },
    zoom(d) { dist = Math.max(minDist, Math.min(maxDist, dist + d)); },

    update(dt, target, clear = null) {
      const sx = Math.sin(yaw), sz = Math.cos(yaw);
      // Hindernis im Weg? Dann sofort näher heran, danach langsam wieder zurück.
      const allowed = clear ? clear(sx, sz, dist * Math.cos(pitch)) / Math.cos(pitch) : dist;
      actual = allowed < actual ? allowed : actual + (Math.min(dist, allowed) - actual) * Math.min(1, dt * 3);
      const d = actual;
      const tx = target.x + sx * Math.cos(pitch) * d, tz = target.z + sz * Math.cos(pitch) * d;
      const ty = 1.6 + Math.sin(pitch) * d;
      const k = snap ? 1 : Math.min(1, dt * 10);
      cur.x += (tx - cur.x) * k; cur.y += (ty - cur.y) * k; cur.z += (tz - cur.z) * k;
      const kl = snap ? 1 : Math.min(1, dt * 14);
      look.x += (target.x - look.x) * kl; look.z += (target.z - look.z) * kl;
      snap = false;
      camera.position.set(cur.x, Math.max(0.6, cur.y), cur.z);
      camera.lookAt(look.x, look.y, look.z);
    },
  };
}
