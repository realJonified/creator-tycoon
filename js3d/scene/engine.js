// Renderer, Licht, Himmel, Nebel und Grafikstufen. Misst die FPS und schaltet bei "Automatisch" herunter.
import * as THREE from '../../vendor/three.module.min.js';
import { applyHigh, tickHigh, makeEnvironment, createPost } from './hiquality.js';
import { suggestLevel, autoLevel, AUTO_LIMIT } from '../core/quality.js';
export { AUTO_LIMIT };

export const QUALITY = {
  niedrig: { ratio: 1,    shadows: 0,    far: 120, fogNear: 45, fogFar: 115, details: false },
  mittel:  { ratio: 1.25, shadows: 1024, far: 180, fogNear: 70, fogFar: 170, details: true },
  // Hoch: realistischer Look (Standard-Materialien, Umgebungslicht, Tonemapping, Bloom, AO, weiche Schatten)
  hoch:    { ratio: 1.5,  shadows: 2048, far: 260, fogNear: 95, fogFar: 240, details: true, high: true },
};
export const isTouch = () => matchMedia('(pointer: coarse)').matches;

const SKY_TOP = new THREE.Color('#5fa8ff'), HORIZON = new THREE.Color('#ffd9b0'); // werden per setSky umgefärbt

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch(), powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(HORIZON);
  renderer.info.autoReset = false; // Draw-Calls über alle Durchgänge eines Bildes zählen (Debug-Anzeige)

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HORIZON, 70, 170);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 180);

  // Himmel: Kugel mit Farbverlauf (blau oben, warmer Horizont = Nachmittag).
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, bottom: { value: HORIZON } },
    vertexShader: 'varying float vy; void main(){ vy = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float vy;\nvoid main(){ float t = clamp(vy*1.6+0.08,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, t),1.0);\n#include <colorspace_fragment>\n}',
  }));
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  // Sonne: warmes Nachmittagslicht von Südwesten, dazu weiches Himmelslicht.
  const hemi = new THREE.HemisphereLight('#cfe6ff', '#6f8f4a', 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe0b5', 2.6);
  const sunDir = new THREE.Vector3(-0.55, 0.62, 0.55).normalize();
  sun.shadow.camera.left = sun.shadow.camera.bottom = -34;
  sun.shadow.camera.right = sun.shadow.camera.top = 34;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 8), new THREE.MeshBasicMaterial({ color: '#fff4d6', fog: false }));
  sunDisc.position.copy(sunDir).multiplyScalar(420);
  scene.add(sunDisc);

  const details = [];    // Objekte, die nur ab "mittel" sichtbar sind
  const hiDetails = [];  // Objekte, die nur bei "hoch" sichtbar sind (Grasbüschel, Hausdetails)
  let level = 'mittel', setting = 'auto', onLevel = null;
  let post = null, env = null, envKey = '', high = false;
  const LIGHT = { low: { hemi: 1.9, sun: 2.6 }, high: { hemi: 0.9, sun: 3.4 } };

  function setShadowType(type) {
    if (renderer.shadowMap.type === type) return;
    renderer.shadowMap.type = type;
    sun.shadow.map?.dispose(); sun.shadow.map = null;
    scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
  }
  function refreshEnv() {
    const top = '#' + sky.material.uniforms.top.value.getHexString(), bottom = '#' + sky.material.uniforms.bottom.value.getHexString();
    if (!high || envKey === top + bottom) return;
    env?.dispose(); env = makeEnvironment(renderer, top, bottom); envKey = top + bottom;
    scene.environment = env.texture;
  }
  function setHigh(on) {
    high = on;
    applyHigh(scene, on);
    // Neutral-Tonemapping (Khronos PBR Neutral): weiche Lichter wie ACES, aber die Farben bleiben kräftig
    renderer.toneMapping = on ? THREE.NeutralToneMapping : THREE.NoToneMapping;
    renderer.toneMappingExposure = 0.95;
    hemi.intensity = on ? LIGHT.high.hemi : LIGHT.low.hemi; sun.intensity = on ? LIGHT.high.sun : LIGHT.low.sun;
    scene.environmentIntensity = 0.55;
    setShadowType(on ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap);
    sun.shadow.radius = on ? 6 : 1; sun.shadow.blurSamples = 12;
    if (on) { post ??= createPost(renderer); post.setSize(); envKey = ''; refreshEnv(); }
    else { scene.environment = null; env?.dispose(); env = null; envKey = ''; post?.dispose(); post = null; }
  }

  function apply(name) {
    level = name;
    const q = QUALITY[name];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.ratio));
    sun.castShadow = q.shadows > 0;
    if (q.shadows && sun.shadow.mapSize.x !== q.shadows) {
      sun.shadow.mapSize.set(q.shadows, q.shadows);
      sun.shadow.map?.dispose(); sun.shadow.map = null;
    }
    camera.far = q.far; camera.updateProjectionMatrix();
    scene.fog.near = q.fogNear; scene.fog.far = q.fogFar;
    for (const d of details) d.visible = q.details;
    for (const d of hiDetails) d.visible = !!q.high;
    if (!!q.high !== high) setHigh(!!q.high);
    resize();
    onLevel?.(name);
  }

  function setSetting(s) {
    setting = s;
    apply(s === 'auto' ? suggested() : s);
    samples.length = 0; warmup = 3;
  }

  // Vorschlag beim ersten Start: Handy "Niedrig", PC mit guter Leistung "Hoch", sonst "Mittel".
  function suggested() {
    return suggestLevel({ touch: isTouch(), cores: navigator.hardwareConcurrency || 4, maxSamples: renderer.capabilities.maxSamples });
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 70 : 60;
    camera.updateProjectionMatrix();
    post?.setSize();
  }
  addEventListener('resize', resize);

  // Schatten folgen dem Spieler (in Texel-Schritten, damit nichts flimmert).
  function followShadow(target) {
    const step = 68 / (sun.shadow.mapSize.x || 1024);
    const x = Math.round(target.x / step) * step, z = Math.round(target.z / step) * step;
    sun.target.position.set(x, 0, z);
    sun.position.set(x + sunDir.x * 60, sunDir.y * 60, z + sunDir.z * 60);
    sky.position.set(target.x, 0, target.z);
    sunDisc.position.set(target.x + sunDir.x * 420, sunDir.y * 420, target.z + sunDir.z * 420);
  }

  // FPS-Messung und automatische Stufe (schaltet nur herunter).
  let frames = 0, acc = 0, fps = 60, warmup = 3;
  const samples = [];
  function measure(dt) {
    frames++; acc += dt;
    if (acc < 1) return;
    fps = frames / acc; frames = 0; acc = 0;
    if (warmup > 0) { warmup--; return; }
    if (setting !== 'auto' || document.hidden) return;
    samples.push(fps);
    if (samples.length < 3) return;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    samples.length = 0;
    const next = autoLevel(level, avg, isTouch());
    if (next !== level) { apply(next); warmup = 2; }
  }

  return {
    THREE, renderer, scene, camera, sun, details, hiDetails, suggested,
    get level() { return level; }, get setting() { return setting; }, get fps() { return fps; },
    set onLevel(fn) { onLevel = fn; },
    setSetting, resize, followShadow, measure,
    // Himmel und Nebel umfärben (Insel: Nachmittag, Arena: violette Dämmerung)
    // sky = { top, bottom, hemiSky?, hemiGround?, sun? } aus js3d/data/maps.js; showSun = Sonnenscheibe zeigen
    setSky(top, bottom, { hemiSky = '#cfe6ff', hemiGround = '#6f8f4a', sun: sunColor = '#ffe0b5', showSun = true } = {}) {
      sky.material.uniforms.top.value.set(top); sky.material.uniforms.bottom.value.set(bottom);
      scene.fog.color.set(bottom); renderer.setClearColor(bottom);
      hemi.color.set(hemiSky); hemi.groundColor.set(hemiGround); sun.color.set(sunColor);
      sunDisc.visible = showSun;
      refreshEnv();
    },
    // Unterwasser: blauer, dichter Nebel. Aus: Nebelweite der Grafikstufe zurück.
    setUnderwater(on) {
      const q = QUALITY[level];
      if (on) { scene.fog.color.set('#1c6e96'); scene.fog.near = 1; scene.fog.far = 32; renderer.setClearColor('#1c6e96'); sky.visible = false; sunDisc.visible = false; }
      else { scene.fog.near = q.fogNear; scene.fog.far = q.fogFar; sky.visible = true; }
    },
    // Neue Objekte (Map, Haus) auf die aktuelle Stufe bringen.
    refreshQuality() {
      for (const d of details) d.visible = QUALITY[level].details;
      for (const d of hiDetails) d.visible = high;
      if (high) applyHigh(scene, true);
    },
    // Detail-Listen von einer entsorgten Gruppe befreien.
    forget(group) {
      const inside = o => { for (let p = o; p; p = p.parent) if (p === group) return true; return false; };
      for (const list of [details, hiDetails]) for (let i = list.length - 1; i >= 0; i--) if (inside(list[i])) list.splice(i, 1);
    },
    get high() { return high; },
    get post() { return post; },
    // Messung: rendert n Bilder und wartet jeweils auf die GPU (1-Pixel-Auslesen). Liefert ms pro Bild.
    benchmark(n = 60) {
      const gl = renderer.getContext(), px = new Uint8Array(4);
      const t0 = performance.now();
      for (let i = 0; i < n; i++) { this.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
      const ms = (performance.now() - t0) / n;
      return { level, ms: +ms.toFixed(2), fps: Math.round(1000 / ms), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, size: renderer.getDrawingBufferSize(new THREE.Vector2()).toArray() };
    },
    render() {
      renderer.info.reset();
      if (high && post) { tickHigh(performance.now() / 1000); post.render(scene, camera); }
      else renderer.render(scene, camera);
    },
  };
}
