// Grafikstufe "Hoch": realistischerer Look, nur wenn eingeschaltet (Niedrig/Mittel bleiben unverändert leicht).
// 1. Materialien: MeshLambert → MeshStandard (Rauigkeit, Umgebungslicht aus dem Himmel), beim Zurückschalten
//    kommen die ursprünglichen Materialien wieder. Geteilte Materialien bleiben geteilt (Cache).
// 2. Oberflächen: eine per Code erzeugte Rauschtextur gibt Böden (Gras, Sand), Wänden (Putz) und
//    Holz (braune Flächen, Maserung) Struktur. Sie wird über die Weltposition aufgetragen, darum brauchen
//    die zusammengefügten Low-Poly-Meshes keine Texturkoordinaten.
// 3. Wasser: glatt und spiegelnd, mit wandernden Wellen in der Normalen.
// 4. Nachbearbeitung: HDR-Bild → Umgebungsverdeckung (aus der Tiefe), leichtes Bloom, ACES-Tonemapping.
import * as THREE from '../../vendor/three.module.min.js';

// ---------- Rauschtextur (kachelbar, per Code) ----------
export function makeNoiseTexture(size = 128, seed = 7) {
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // Wertrauschen in drei Oktaven, kachelbar durch Modulo
  const grid = n => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd(); return g; };
  const octave = (n) => { const g = grid(n); return (x, y) => {
    const fx = x / size * n, fy = y / size * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const s = t => t * t * (3 - 2 * t), at = (i, j) => g[((j % n + n) % n) * n + ((i % n + n) % n)];
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * s(tx), bot = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * s(tx);
    return top + (bot - top) * s(ty);
  }; };
  const o1 = octave(8), o2 = octave(16), o3 = octave(64);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    data[i] = Math.round((o1(x, y) * 0.5 + o2(x, y) * 0.3 + o3(x, y) * 0.2) * 255); // R: weiches Rauschen
    data[i + 1] = Math.round(o3(x, y) * 255);                                       // G: feines Korn
    data[i + 2] = Math.round(rnd() * 255);                                           // B: Pixelrauschen
    data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

const shared = { noise: null, time: { value: 0 } };
const cache = new WeakMap();   // Lambert-Material → Standard-Material

// Struktur je nach Fläche: Boden (Normale nach oben) fleckig, Wände feines Putzkorn, braune Flächen Holzmaserung.
const DETAIL_GLSL = `
  vec3 dn = normalize(vWorldNormal);
  float up = smoothstep(0.55, 0.9, dn.y);
  vec2 pFloor = vWorldPos.xz;
  vec2 pWall = abs(dn.x) > abs(dn.z) ? vWorldPos.zy : vWorldPos.xy;
  float big = texture2D(detailNoise, pFloor * 0.035).r;
  float fineFloor = texture2D(detailNoise, pFloor * 0.6).g;
  float fineWall = texture2D(detailNoise, pWall * 1.3).g;
  vec3 base = diffuseColor.rgb;
  float brown = step(base.b * 1.25, base.g) * step(base.g * 1.05, base.r) * step(0.08, base.r - base.b);
  float grain = sin((pWall.x + pWall.y * 0.15 + texture2D(detailNoise, pWall * 0.2).r * 3.0) * 9.0) * 0.5 + 0.5;
  float detail = mix(mix(0.88 + fineWall * 0.2, 0.86 + grain * 0.22, brown), 0.66 + big * 0.48 + fineFloor * 0.16, up);
  diffuseColor.rgb *= detail;
`;

function upgrade(mat) {
  if (cache.has(mat)) return cache.get(mat);
  const water = !!mat.userData?.water;
  const plain = !!mat.userData?.noDetail; // Figuren: glatt, ohne Holz-/Putzstruktur
  const std = new THREE.MeshStandardMaterial({
    color: mat.color, vertexColors: mat.vertexColors, map: mat.map || null,
    emissive: mat.emissive || new THREE.Color(0), emissiveIntensity: mat.emissiveIntensity ?? 1,
    transparent: mat.transparent, opacity: mat.opacity, side: mat.side, depthWrite: mat.depthWrite,
    flatShading: true,
    roughness: water ? 0.08 : 0.86, metalness: 0,
  });
  std.userData.fromLambert = true;
  std.onBeforeCompile = shader => {
    shader.uniforms.detailNoise = { value: shared.noise };
    shader.uniforms.uTime = shared.time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos; varying vec3 vWorldNormal;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 wp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
        #endif
        wp = modelMatrix * wp;
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D detailNoise; uniform float uTime; varying vec3 vWorldPos; varying vec3 vWorldNormal;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (water || plain ? '' : DETAIL_GLSL));
    if (water) {
      // Wandernde Wellen: Normale in Blickrichtung leicht kippen
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 wq = vWorldPos.xz;
        float w1 = texture2D(detailNoise, wq * 0.05 + vec2(uTime * 0.02, uTime * 0.013)).r;
        float w2 = texture2D(detailNoise, wq * 0.11 - vec2(uTime * 0.017, -uTime * 0.021)).r;
        vec3 wn = normalize(vec3((w1 - 0.5) * 0.9 + (w2 - 0.5) * 0.6, 1.0, (w2 - 0.5) * 0.9 - (w1 - 0.5) * 0.6));
        normal = normalize(mix(normal, normalize((viewMatrix * vec4(wn, 0.0)).xyz), 0.85));`);
    }
  };
  std.customProgramCacheKey = () => (water ? 'kb-water' : plain ? 'kb-plain' : 'kb-detail');
  if (mat.userData?.shared) std.userData.shared = true;
  cache.set(mat, std);
  return std;
}

// Schaltet einen Objektbaum auf "Hoch" (on = true) oder zurück. Nur Lambert-Materialien werden getauscht.
export function applyHigh(root, on) {
  shared.noise ??= makeNoiseTexture();
  root.traverse(o => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    if (on) {
      if (o.material.isMeshLambertMaterial) { o.userData.lowMat = o.material; o.material = upgrade(o.material); }
    } else if (o.userData.lowMat) { o.material = o.userData.lowMat; delete o.userData.lowMat; }
  });
}
export const tickHigh = t => { shared.time.value = t; };

// ---------- Umgebungslicht aus dem Himmel (für spiegelndes Wasser und weiches Licht) ----------
export function makeEnvironment(renderer, top, bottom) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying float vy; void main(){ vy = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float vy; void main(){ float t = clamp(vy*1.6+0.08,0.0,1.0); vec3 c = mix(bottom, top, t); if (vy < 0.0) c = mix(bottom, vec3(0.32,0.4,0.3), clamp(-vy*3.0,0.0,1.0)); gl_FragColor = vec4(c,1.0); }',
  });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), mat));
  const rt = pm.fromScene(s, 0.02);
  pm.dispose(); mat.dispose(); s.children[0].geometry.dispose();
  return rt;
}

// ---------- Nachbearbeitung ----------
const FS_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

export function createPost(renderer) {
  const opts = { type: THREE.HalfFloatType, depthBuffer: false };
  const hdr = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  hdr.depthTexture = new THREE.DepthTexture(1, 1);
  hdr.depthTexture.type = THREE.UnsignedIntType;
  const half = [new THREE.WebGLRenderTarget(1, 1, opts), new THREE.WebGLRenderTarget(1, 1, opts)];
  const aoRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false; quadScene.add(quad);
  const pass = (fragmentShader, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...extra });

  const bright = pass(`uniform sampler2D tColor; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tColor, vUv).rgb; float l = dot(c, vec3(0.2126,0.7152,0.0722));
      gl_FragColor = vec4(c * smoothstep(0.9, 1.8, l), 1.0); }`, { tColor: { value: null } });
  const blur = pass(`uniform sampler2D tInput; uniform vec2 dir; varying vec2 vUv;
    void main(){ vec3 s = texture2D(tInput, vUv).rgb * 0.227;
      s += (texture2D(tInput, vUv + dir * 1.385).rgb + texture2D(tInput, vUv - dir * 1.385).rgb) * 0.316;
      s += (texture2D(tInput, vUv + dir * 3.231).rgb + texture2D(tInput, vUv - dir * 3.231).rgb) * 0.070;
      gl_FragColor = vec4(s, 1.0); }`, { tInput: { value: null }, dir: { value: new THREE.Vector2() } });
  const ao = pass(`#include <packing>
    uniform sampler2D tDepth; uniform float near; uniform float far; uniform vec2 projScale; uniform vec2 texel; varying vec2 vUv;
    float viewZ(vec2 uv){ return perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
    void main(){
      float d = texture2D(tDepth, vUv).x;
      if (d >= 0.9999) { gl_FragColor = vec4(1.0); return; }
      float z = viewZ(vUv);
      float R = 1.1;                                   // Radius in Metern
      vec2 r = projScale * R / -z;                      // Radius auf dem Bildschirm
      float occ = 0.0, ang = fract(sin(dot(vUv, vec2(12.9898,78.233))) * 43758.5453) * 6.283;
      for (int i = 0; i < 10; i++) {
        float f = (float(i) + 1.0) / 10.0; ang += 2.399;
        vec2 uv = vUv + vec2(cos(ang), sin(ang)) * r * f;
        float diff = viewZ(uv) - z;                     // > 0: Probe liegt näher an der Kamera
        occ += step(0.04, diff) * (1.0 - smoothstep(0.0, R * 1.6, diff));
      }
      gl_FragColor = vec4(vec3(1.0 - occ / 10.0 * 0.9), 1.0);
    }`, { tDepth: { value: null }, near: { value: 0.1 }, far: { value: 100 }, projScale: { value: new THREE.Vector2() }, texel: { value: new THREE.Vector2() } });
  const composite = pass(`uniform sampler2D tColor; uniform sampler2D tBloom; uniform sampler2D tAO; uniform float bloomStrength; uniform float aoStrength; uniform float showAO; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tColor, vUv).rgb;
      float a = texture2D(tAO, vUv).r;
      c *= mix(1.0, a, aoStrength);
      c += texture2D(tBloom, vUv).rgb * bloomStrength;
      c = mix(c, vec3(a), showAO); // Debug: nur die Umgebungsverdeckung zeigen
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`, { tColor: { value: null }, tBloom: { value: null }, tAO: { value: null }, bloomStrength: { value: 0.35 }, aoStrength: { value: 0.9 }, showAO: { value: 0 } }, { toneMapped: true });

  const size = new THREE.Vector2();
  function run(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); }

  return {
    uniforms: composite.uniforms, // zum Feineinstellen in der Konsole: kanalbucht.engine.post.uniforms
    setSize() {
      renderer.getDrawingBufferSize(size);
      hdr.setSize(size.x, size.y);
      const hx = Math.max(1, size.x >> 1), hy = Math.max(1, size.y >> 1);
      for (const t of half) t.setSize(hx, hy);
      aoRT.setSize(hx, hy);
      ao.uniforms.texel.value.set(1 / hx, 1 / hy);
    },
    render(scene, camera) {
      if (hdr.width <= 1) this.setSize();
      renderer.setRenderTarget(hdr);
      renderer.render(scene, camera);
      // Bloom: helle Stellen herausziehen und weich zeichnen (halbe Auflösung)
      bright.uniforms.tColor.value = hdr.texture; run(bright, half[0]);
      blur.uniforms.tInput.value = half[0].texture; blur.uniforms.dir.value.set(1 / half[0].width, 0); run(blur, half[1]);
      blur.uniforms.tInput.value = half[1].texture; blur.uniforms.dir.value.set(0, 1 / half[0].height); run(blur, half[0]);
      // Umgebungsverdeckung aus der Tiefe (halbe Auflösung)
      ao.uniforms.tDepth.value = hdr.depthTexture; ao.uniforms.near.value = camera.near; ao.uniforms.far.value = camera.far;
      ao.uniforms.projScale.value.set(camera.projectionMatrix.elements[0] * 0.5, camera.projectionMatrix.elements[5] * 0.5);
      run(ao, aoRT);
      // AO weichzeichnen (entfernt das Korn der zufällig gedrehten Proben)
      blur.uniforms.tInput.value = aoRT.texture; blur.uniforms.dir.value.set(1 / aoRT.width, 0); run(blur, half[1]);
      blur.uniforms.tInput.value = half[1].texture; blur.uniforms.dir.value.set(0, 1 / aoRT.height); run(blur, aoRT);
      // Zusammensetzen, Tonemapping, sRGB
      composite.uniforms.tColor.value = hdr.texture; composite.uniforms.tBloom.value = half[0].texture; composite.uniforms.tAO.value = aoRT.texture;
      run(composite, null);
    },
    dispose() {
      hdr.depthTexture.dispose(); hdr.dispose(); half.forEach(t => t.dispose()); aoRT.dispose();
      [bright, blur, ao, composite].forEach(m => m.dispose()); quad.geometry.dispose();
    },
  };
}
