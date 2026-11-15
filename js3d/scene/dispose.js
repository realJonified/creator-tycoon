// Gibt alle GPU-Ressourcen eines Objektbaums frei: Geometrien, Materialien und deren Texturen.
// Geteilte Materialien (userData.shared = true) bleiben bestehen, weil andere Orte sie weiter nutzen.
const TEXTURE_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'alphaMap', 'envMap', 'lightMap'];

export function disposeObject(root) {
  const geos = new Set(), mats = new Set(), texs = new Set();
  root.traverse(o => {
    if (o.geometry) geos.add(o.geometry);
    const list = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of list) {
      if (m.userData?.shared) continue;
      mats.add(m);
      for (const k of TEXTURE_KEYS) if (m[k]) texs.add(m[k]);
      for (const u of Object.values(m.uniforms || {})) if (u?.value?.isTexture) texs.add(u.value);
    }
    if (o.isInstancedMesh) o.dispose?.();
  });
  for (const g of geos) g.dispose();
  for (const t of texs) t.dispose();
  for (const m of mats) m.dispose();
  root.removeFromParent?.();
  return { geometries: geos.size, materials: mats.size, textures: texs.size };
}
