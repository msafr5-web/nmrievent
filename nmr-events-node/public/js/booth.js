// Interactive 3D booth / stage viewer. The models are built procedurally from the parameters served by
// GET /api/projects, so no model files are needed. Three.js is served from our own origin (/vendor).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('stage');
const fallback = document.getElementById('nowebgl');
const state = { model: null, light: 'studio', material: 'matte', color: '#f59e0b', wire: false, screen: true, rotate: false };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  fallback.classList.remove('hidden');
  fallback.classList.add('grid');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
host.appendChild(renderer.domElement);
renderer.domElement.style.display = 'block';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.03; // never look from under the floor
controls.minDistance = 3;
controls.maxDistance = 40;

const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envMap;

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(40, 64),
  new THREE.MeshStandardMaterial({ color: '#14092b', roughness: 0.85 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(40, 40, 0x6d28d9, 0x2b1a59);
grid.position.y = 0.002;
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);

let current = null; // THREE.Group holding the model
let lights = []; // lights owned by the current lighting mode
const ledScreens = [];
const mainMats = []; // wall/body materials affected by the Material control
const accentMats = []; // trim materials affected by the Brand colour control
let ledPhase = 0;

// ---------- procedural textures ----------
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#9a6b3f'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i += 1) {
    g.strokeStyle = `rgba(${60 + (i * 7) % 50},${35 + (i * 5) % 30},15,${0.12 + (i % 5) * 0.04})`;
    g.lineWidth = 1 + (i % 4);
    g.beginPath();
    const y = (i * 37) % 512;
    g.moveTo(0, y);
    g.bezierCurveTo(170, y + ((i * 13) % 20) - 10, 340, y - ((i * 11) % 20) + 10, 512, y);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

function logoTexture(color) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 256);
  g.font = '900 150px "Segoe UI", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 40;
  g.fillStyle = '#ffffff';
  g.fillText('NMR EVENTS', 512, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const ledCanvas = document.createElement('canvas');
ledCanvas.width = 512; ledCanvas.height = 288;
const ledCtx = ledCanvas.getContext('2d');
const ledTexture = new THREE.CanvasTexture(ledCanvas);
ledTexture.colorSpace = THREE.SRGBColorSpace;

function drawLed(phase) {
  const w = ledCanvas.width; const h = ledCanvas.height;
  const grd = ledCtx.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, '#2e1065');
  grd.addColorStop((Math.sin(phase) + 1) / 2 * 0.6 + 0.2, state.color);
  grd.addColorStop(1, '#7c3aed');
  ledCtx.fillStyle = grd; ledCtx.fillRect(0, 0, w, h);
  ledCtx.fillStyle = 'rgba(255,255,255,.92)';
  ledCtx.font = '800 54px "Segoe UI", Arial, sans-serif';
  ledCtx.textAlign = 'center'; ledCtx.textBaseline = 'middle';
  ledCtx.fillText('NMR EVENTS', w / 2, h / 2 - 14);
  ledCtx.font = '500 24px "Segoe UI", Arial, sans-serif';
  ledCtx.fillText('Creating Extraordinary Experiences', w / 2, h / 2 + 34);
  ledTexture.needsUpdate = true;
}

// ---------- materials ----------
let woodTex = null;
function applyMaterialMode() {
  const m = state.material;
  mainMats.forEach((mat) => {
    mat.map = null; mat.clearcoat = 0; mat.clearcoatRoughness = 0;
    mat.color.set('#e9e4f7'); mat.metalness = 0; mat.roughness = 0.9;
    if (m === 'gloss') { mat.roughness = 0.12; mat.clearcoat = 1; mat.clearcoatRoughness = 0.05; mat.color.set('#f6f3ff'); }
    if (m === 'metal') { mat.metalness = 1; mat.roughness = 0.28; mat.color.set('#c9c9d6'); }
    if (m === 'wood') { woodTex = woodTex || woodTexture(); mat.map = woodTex; mat.color.set('#ffffff'); mat.roughness = 0.6; }
    mat.envMapIntensity = state.light === 'studio' ? 1 : 0.4;
    mat.needsUpdate = true;
  });
}

function applyColor() {
  accentMats.forEach((mat) => {
    mat.color.set(state.color);
    mat.emissive.set(state.color);
    mat.emissiveIntensity = state.light === 'neon' ? 2.2 : 0.55;
  });
}

function applyWire() {
  current?.traverse((o) => { if (o.isMesh && o.material && !o.userData.noWire) o.material.wireframe = state.wire; });
}

// ---------- lighting ----------
function clearLights() {
  lights.forEach((l) => { scene.remove(l); l.dispose?.(); if (l.target) scene.remove(l.target); });
  lights = [];
}

function applyLighting(size) {
  clearLights();
  const add = (l) => { scene.add(l); lights.push(l); return l; };
  const span = Math.max(size.w, size.d);
  if (state.light === 'studio') {
    scene.background = new THREE.Color('#1a0f33');
    scene.environmentIntensity = 0.9;
    add(new THREE.HemisphereLight('#ffffff', '#3b1d7a', 0.7));
    const sun = add(new THREE.DirectionalLight('#fff4e5', 2.4));
    sun.position.set(span, span * 1.3, span * 0.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const r = span * 1.2;
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.5, far: span * 6 });
    sun.shadow.bias = -0.0004;
  } else if (state.light === 'spot') {
    scene.background = new THREE.Color('#07030f');
    scene.environmentIntensity = 0.12;
    add(new THREE.AmbientLight('#4c2f9a', 0.35));
    [-1, 0, 1].forEach((i) => {
      const s = add(new THREE.SpotLight('#fff0d6', 900, span * 3, Math.PI / 6, 0.5, 1.6));
      s.position.set(i * size.w * 0.35, size.h + 2.2, size.d * 0.9);
      s.target.position.set(i * size.w * 0.3, 1, 0);
      scene.add(s.target);
      s.castShadow = true;
      s.shadow.mapSize.set(1024, 1024);
    });
  } else {
    scene.background = new THREE.Color('#05010d');
    scene.environmentIntensity = 0.05;
    add(new THREE.AmbientLight('#2b1a59', 0.4));
    [['#f97316', -1], ['#a855f7', 1]].forEach(([col, side]) => {
      const p = add(new THREE.PointLight(col, 260, span * 3, 1.6));
      p.position.set(side * size.w * 0.6, size.h * 0.8, size.d * 0.7);
    });
  }
  applyColor();
  applyMaterialMode();
}

// ---------- model builders ----------
const box = (w, h, d, mat, x, y, z, shadows = true) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadows; m.receiveShadow = true;
  return m;
};

function build(def) {
  const { width: W, depth: D, height: H, screen, counter } = def.params;
  const g = new THREE.Group();
  const main = new THREE.MeshPhysicalMaterial({ color: '#e9e4f7' });
  const accent = new THREE.MeshStandardMaterial({ color: state.color, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1b1033', roughness: 0.5, metalness: 0.4 });
  mainMats.push(main); accentMats.push(accent);

  if (def.kind === 'stage') {
    const lift = 1;
    g.add(box(W, lift, D, dark, 0, lift / 2, 0));
    g.add(box(W + 0.2, 0.08, D + 0.2, accent, 0, lift + 0.04, 0, false)); // edge light
    g.add(box(W * 0.96, 0.05, D * 0.96, main, 0, lift + 0.07, 0, false));
    for (let i = 0; i < 3; i += 1) g.add(box(2.4, 0.3, 0.5, main, 0, 0.15 + i * 0.3 - 0.0, D / 2 + 0.25 + (2 - i) * 0.5)); // steps
    [-1, 1].forEach((s) => {
      g.add(box(0.35, H, 0.35, dark, s * (W / 2 - 0.2), H / 2 + lift - 0.5, -D / 2 + 0.3)); // truss towers
      g.add(box(0.35, H, 0.35, dark, s * (W / 2 - 0.2), H / 2 + lift - 0.5, D / 2 - 0.3));
    });
    g.add(box(W, 0.35, 0.35, dark, 0, H + lift - 0.4, -D / 2 + 0.3)); // top beams
    g.add(box(W, 0.35, 0.35, dark, 0, H + lift - 0.4, D / 2 - 0.3));
    g.add(box(0.35, 0.35, D, dark, -(W / 2 - 0.2), H + lift - 0.4, 0));
    g.add(box(0.35, 0.35, D, dark, W / 2 - 0.2, H + lift - 0.4, 0));
    if (screen) {
      const led = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, (H - 1) * 0.85), new THREE.MeshBasicMaterial({ map: ledTexture, toneMapped: false }));
      led.position.set(0, lift + (H - 1) / 2 + 0.2, -D / 2 + 0.55);
      led.userData.noWire = true; led.userData.led = true;
      g.add(led); ledScreens.push(led);
    }
    g.add(box(0.8, 1.1, 0.55, main, W * 0.28, lift + 0.55, D * 0.1)); // podium
    g.userData.size = { w: W, d: D + 2, h: H + lift };
    return g;
  }

  // booth
  g.add(box(W + 0.6, 0.16, D + 0.6, dark, 0, 0.08, 0)); // platform
  g.add(box(W + 0.62, 0.05, D + 0.62, accent, 0, 0.185, 0, false)); // glowing edge
  g.add(box(W, H, 0.16, main, 0, H / 2 + 0.16, -D / 2)); // back wall
  g.add(box(0.16, H * 0.82, D * 0.45, main, -W / 2, (H * 0.82) / 2 + 0.16, -D / 2 + D * 0.225)); // side fins
  g.add(box(0.16, H * 0.82, D * 0.45, main, W / 2, (H * 0.82) / 2 + 0.16, -D / 2 + D * 0.225));
  // top truss frame + fascia
  const top = H + 0.27;
  [-1, 1].forEach((s) => {
    g.add(box(W + 0.2, 0.22, 0.22, dark, 0, top, s * (D / 2 + 0.05), false)); // front and back beams
    g.add(box(0.22, 0.22, D + 0.2, dark, s * (W / 2 + 0.05), top, 0, false)); // left and right beams
  });
  g.add(box(W, 0.14, 0.14, dark, 0, top, 0, false)); // centre cross beam
  g.add(box(W, 0.55, 0.12, accent, 0, H - 0.1, D / 2 - 0.1)); // front fascia
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, H, 24), dark);
    p.position.set(sx * (W / 2 + 0.05), H / 2 + 0.16, sz * (D / 2 + 0.05));
    p.castShadow = true;
    g.add(p);
  });
  // logo
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.62, W * 0.62 * 0.25),
    new THREE.MeshBasicMaterial({ map: logoTexture(state.color), transparent: true, toneMapped: false, depthWrite: false }),
  );
  logo.position.set(0, H - 0.45, -D / 2 + 0.1);
  logo.userData.noWire = true;
  g.add(logo);
  if (screen) {
    const led = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.55, W * 0.55 * 0.5625), new THREE.MeshBasicMaterial({ map: ledTexture, toneMapped: false }));
    led.position.set(0, H * 0.36, -D / 2 + 0.1);
    led.userData.noWire = true; led.userData.led = true;
    g.add(led); ledScreens.push(led);
  }
  if (counter) {
    g.add(box(W * 0.36, 1.05, 0.65, accent, -W * 0.18, 0.7, D * 0.12));
    g.add(box(W * 0.38, 0.06, 0.75, main, -W * 0.18, 1.25, D * 0.12));
  }
  g.add(box(W * 0.9, 0.02, D * 0.9, new THREE.MeshStandardMaterial({ color: '#3b1d7a', roughness: 0.95 }), 0, 0.17, 0, false)); // carpet
  g.userData.size = { w: W, d: D, h: H + 0.5 };
  return g;
}

function disposeCurrent() {
  if (!current) return;
  scene.remove(current);
  current.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !mainMats.includes(o.material) && !accentMats.includes(o.material)) {
      if (o.material.map && o.material.map !== ledTexture && o.material.map !== woodTex) o.material.map.dispose();
      o.material.dispose();
    }
  });
  mainMats.splice(0).forEach((m) => m.dispose());
  accentMats.splice(0).forEach((m) => m.dispose());
  ledScreens.length = 0;
}

function frame(size) {
  const r = Math.max(size.w, size.d, size.h) * 1.3;
  camera.position.set(r * 0.8, size.h * 1.05 + 2, r * 1.15);
  controls.target.set(0, size.h * 0.4, 0);
  controls.minDistance = r * 0.3;
  controls.maxDistance = r * 3;
  controls.update();
}

function loadModel(def) {
  disposeCurrent();
  state.model = def;
  current = build(def);
  scene.add(current);
  const size = current.userData.size;
  applyLighting(size);
  applyWire();
  current.traverse((o) => { if (o.userData.led) o.visible = state.screen; });
  frame(size);
}

// ---------- UI ----------
function group(name, onChange) {
  const box = document.querySelector(`[data-group="${name}"]`);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onChange(b.dataset.v);
  });
}
function toggle(id, onChange) {
  const b = document.getElementById(id);
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    onChange(on);
  });
}

group('light', (v) => { state.light = v; applyLighting(current.userData.size); });
group('material', (v) => { state.material = v; applyMaterialMode(); });
group('color', (v) => { state.color = v; applyColor(); });
toggle('t-rotate', (on) => { state.rotate = on; controls.autoRotate = on; controls.autoRotateSpeed = 1.6; });
toggle('t-wire', (on) => { state.wire = on; applyWire(); });
toggle('t-screen', (on) => { state.screen = on; current.traverse((o) => { if (o.userData.led) o.visible = on; }); });
document.getElementById('t-reset').addEventListener('click', () => frame(current.userData.size));

// ---------- loop ----------
function resize() {
  const w = host.clientWidth; const h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

let visible = true;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.01 }).observe(host);
let lastTick = performance.now();
let ledAcc = 0;
renderer.setAnimationLoop(() => {
  if (!visible || document.hidden) return; // save battery when the canvas is off screen
  const now = performance.now();
  const dt = Math.min((now - lastTick) / 1000, 0.25);
  lastTick = now;
  ledAcc += dt;
  if (state.screen && ledScreens.length && ledAcc > 1 / 20) { ledPhase += ledAcc * 1.4; ledAcc = 0; drawLed(ledPhase); }
  controls.update();
  renderer.render(scene, camera);
});

fetch('/api/projects')
  .then((r) => r.json())
  .then(({ booths }) => {
    const sel = document.getElementById('model');
    booths.forEach((b) => sel.add(new Option(b.name, b.id)));
    const show = () => {
      const def = booths.find((b) => b.id === sel.value);
      document.getElementById('deliverables').textContent = def.deliverables.join(' · ');
      loadModel(def);
    };
    sel.addEventListener('change', show);
    drawLed(0);
    show();
  })
  .catch(() => {
    fallback.textContent = window.NMR.t('booth.loadfail');
    fallback.classList.remove('hidden'); fallback.classList.add('grid');
  });
