// Einfache Kollision auf dem Boden (2D, x/z): Kreise (Bäume, Laternen) und gedrehte Rechtecke (Häuser).
// Der Spieler ist ein Kreis mit Radius r. Er wird aus allen Hindernissen herausgeschoben.

export function resolve(pos, r, colliders, bounds = null) {
  for (const c of colliders.circles) {
    const dx = pos.x - c.x, dz = pos.z - c.z, min = c.r + r;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 1e-6;
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
  }
  for (const b of colliders.boxes) {
    // In die lokalen Koordinaten des Rechtecks drehen (Umkehrung der three.js-Drehung um Y)
    const cos = Math.cos(b.rot), sin = Math.sin(b.rot);
    const dx = pos.x - b.x, dz = pos.z - b.z;
    const lx = dx * cos - dz * sin, lz = dx * sin + dz * cos;
    const cx = Math.max(-b.hw, Math.min(b.hw, lx)), cz = Math.max(-b.hd, Math.min(b.hd, lz));
    let ox = lx - cx, oz = lz - cz;
    const d2 = ox * ox + oz * oz;
    if (d2 >= r * r) continue;
    let nlx, nlz;
    if (d2 > 1e-12) {
      const d = Math.sqrt(d2);
      nlx = cx + (ox / d) * r; nlz = cz + (oz / d) * r;
    } else {
      // Mittelpunkt liegt im Rechteck: zur nächsten Kante hinaus
      const px = b.hw - Math.abs(lx), pz = b.hd - Math.abs(lz);
      if (px < pz) { nlx = Math.sign(lx || 1) * (b.hw + r); nlz = lz; } else { nlx = lx; nlz = Math.sign(lz || 1) * (b.hd + r); }
    }
    pos.x = b.x + nlx * cos + nlz * sin;
    pos.z = b.z - nlx * sin + nlz * cos;
  }
  if (bounds) {
    const d = Math.hypot(pos.x - bounds.x, pos.z - bounds.z);
    if (d > bounds.r) { pos.x = bounds.x + ((pos.x - bounds.x) / d) * bounds.r; pos.z = bounds.z + ((pos.z - bounds.z) / d) * bounds.r; }
    if (bounds.inner && d < bounds.inner) {
      const k = d || 1e-6;
      pos.x = bounds.x + ((pos.x - bounds.x) / k) * bounds.inner; pos.z = bounds.z + ((pos.z - bounds.z) / k) * bounds.inner;
    }
  }
  return pos;
}

// Wie weit darf die Kamera von der Figur weg sein, ohne dass ein Hindernis dazwischen steht?
// Geht die Strecke Figur → Kamera in kleinen Schritten ab (2D, reicht für Bäume und Häuser).
export function clearDistance(from, dirX, dirZ, maxDist, colliders, margin = 0.6) {
  const step = 0.35;
  for (let d = 1.2; d <= maxDist; d += step) {
    const x = from.x + dirX * d, z = from.z + dirZ * d;
    for (const c of colliders.circles) if (c.r > 0.25 && (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + 0.25) ** 2) return Math.max(1.5, d - margin);
    for (const b of colliders.boxes) {
      const cos = Math.cos(b.rot), sin = Math.sin(b.rot), dx = x - b.x, dz = z - b.z;
      if (Math.abs(dx * cos - dz * sin) < b.hw && Math.abs(dx * sin + dz * cos) < b.hd) return Math.max(1.5, d - margin);
    }
  }
  return maxDist;
}

// Nächster Auslöser in Reichweite (Tür, Shop, Portal, PC …).
export function nearestTrigger(pos, triggers) {
  let best = null, bd = Infinity;
  for (const t of triggers) {
    const d = Math.hypot(pos.x - t.x, pos.z - t.z);
    if (d <= t.r && d < bd) { best = t; bd = d; }
  }
  return best;
}
