import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as D from './data.js';
import { FORMS, INIT, TILT, rng } from './forms.js';

const TAU = Math.PI * 2;
const DEVA = "'Tiro Devanagari Sanskrit','Noto Sans Devanagari','Noto Serif Devanagari',serif";
const GOLD = '#ffd36b';
const $ = (s) => document.querySelector(s);

// ------------------------------------------------------------------ state
const state = {
  stage: 0, binduIntensity: D.BINDU_INTENSITY[0], binduLevel: D.BINDU_INTENSITY[0],
  morph: 1, selectedShakti: null, hoveredShakti: null, field: null, labels: true,
};
window.__state = state;

// ------------------------------------------------------------------ renderer
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
const BG = new THREE.Color('#020309');
scene.background = BG.clone();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 1, 12000);
const HOME = { pos: new THREE.Vector3(0, 470, 900), target: new THREE.Vector3(0, 120, 0) };
camera.position.copy(HOME.pos);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME.target);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.autoRotate = false; // never automatic
controls.minDistance = 20; controls.maxDistance = 3000;
controls.update();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.45, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ shared particle material
const pix = { value: 1 };
function updatePix() { pix.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); }
updatePix();
const PVS = `
uniform float uSize, uOpacity, uTime, uPix, uCollapse, uTwinkle; uniform vec3 uTarget;
attribute float aSize; attribute float aRand; attribute vec3 aColor;
varying vec3 vColor; varying float vAlpha;
void main(){
  vec3 p = position; vAlpha = 1.0;
  if (uCollapse > 0.0) {
    float c = smoothstep(0.0, 1.0, clamp(uCollapse * 1.25 - aRand * 0.25, 0.0, 1.0));
    float ang = c * 6.2831 * (0.4 + aRand * 0.6);
    float cs = cos(ang), sn = sin(ang);
    vec2 r = vec2(p.x * cs - p.z * sn, p.x * sn + p.z * cs) * (1.0 - c);
    p = vec3(r.x + uTarget.x * c, mix(p.y, uTarget.y, c), r.y + uTarget.z * c);
    vAlpha = 1.0 - smoothstep(0.8, 1.0, c);
  }
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float tw = 1.0 + uTwinkle * 0.6 * sin(uTime * 2.3 + aRand * 60.0);
  gl_PointSize = clamp(uSize * aSize * tw * uPix / -mv.z, 0.0, 90.0);
  gl_Position = projectionMatrix * mv;
}`;
const PFS = `
uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  float core = smoothstep(0.18, 0.0, d);
  gl_FragColor = vec4(vColor * (a + core * 0.6), a * uOpacity * vAlpha);
}`;
const allPointMats = [];
function pointMat(size = 1, opacity = 1, twinkle = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: size }, uOpacity: { value: opacity }, uTime: { value: 0 }, uPix: pix, uCollapse: { value: 0 }, uTwinkle: { value: twinkle }, uTarget: { value: new THREE.Vector3() } },
    vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  m.userData.base = opacity; allPointMats.push(m); return m;
}
function makePoints(n, size, opacity, twinkle = 0) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  const r = new Float32Array(n); for (let i = 0; i < n; i++) r[i] = Math.random();
  g.setAttribute('aRand', new THREE.BufferAttribute(r, 1));
  const p = new THREE.Points(g, pointMat(size, opacity, twinkle)); p.frustumCulled = false; return p;
}
function lineMat(color, opacity = 0.9) {
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  m.userData.base = opacity; return m;
}
function faceMat(color, opacity = 0.05) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  m.userData.base = opacity; return m;
}
function setFade(obj, f) {
  obj.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) {
      if (m.userData.base === undefined) m.userData.base = m.opacity ?? 1;
      if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = m.userData.base * f;
      else m.opacity = m.userData.base * f;
    }
    if (o.isSprite || o.isPoints || o.isLine || o.isMesh) o.visible = f > 0.003 && (o.userData.isLabel ? state.labels : true);
  });
}

// ------------------------------------------------------------------ textures
const texCache = new Map();
function glowTex(color = '#ffffff', hard = 0.15) {
  const k = 'g' + color + hard; if (texCache.has(k)) return texCache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, '#ffffff'); g.addColorStop(hard, color); g.addColorStop(0.45, color + '55'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache.set(k, t); return t;
}
function bijaTex(bija, color) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, color + 'aa'); g.addColorStop(0.45, color + '33'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = color; x.lineWidth = 6; x.shadowColor = color; x.shadowBlur = 18; x.beginPath(); x.arc(128, 128, 84, 0, TAU); x.stroke();
  x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 96, 0, TAU); x.stroke();
  x.shadowColor = '#ffb020'; x.shadowBlur = 16; x.fillStyle = GOLD; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `bold 92px ${DEVA}`; x.fillText(bija, 128, 136);
  x.shadowBlur = 0; x.fillStyle = '#fff6d8'; x.fillText(bija, 128, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function starTex() {
  if (texCache.has('star')) return texCache.get('star');
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.translate(64, 64); const g = x.createRadialGradient(0, 0, 0, 0, 0, 60); g.addColorStop(0, '#fff'); g.addColorStop(0.2, '#fff8'); g.addColorStop(1, '#fff0');
  x.fillStyle = g; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 9 : 62, a = i / 8 * TAU; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill();
  const t = new THREE.CanvasTexture(c); texCache.set('star', t); return t;
}
const labels = [];
function makeLabel(top, bottom, color = GOLD, h = 14) {
  const c = document.createElement('canvas'); const x = c.getContext('2d');
  const f1 = `600 64px ${DEVA}`, f2 = `500 34px Inter, sans-serif`;
  x.font = f1; const w1 = top ? x.measureText(top).width : 0; x.font = f2; const w2 = bottom ? x.measureText(bottom).width : 0;
  c.width = Math.ceil(Math.max(w1, w2) + 40); c.height = bottom && top ? 130 : 84;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = color; x.shadowBlur = 14;
  if (top) { x.font = f1; x.fillStyle = color; x.fillText(top, c.width / 2, 46); }
  if (bottom) { x.font = f2; x.fillStyle = '#e8ecff'; x.shadowBlur = 6; x.fillText(bottom, c.width / 2, top ? 108 : 44); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.95 }));
  s.material.userData.base = 0.95; s.scale.set(h * c.width / c.height, h, 1); s.userData.isLabel = true; s.renderOrder = 5; labels.push(s); return s;
}
function glowSprite(color, size, opacity = 1, hard) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(color, hard), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity }));
  s.material.userData.base = opacity; s.scale.setScalar(size); return s;
}
const col = (h) => new THREE.Color(h);

// ------------------------------------------------------------------ morph (2D plan ↔ 3D)
const lifted = []; // objects whose world Y scales with the morph
function lift(obj, y) { obj.userData.baseY = y; obj.position.y = y; lifted.push(obj); return obj; }

// ------------------------------------------------------------------ background stars
{
  const n = 4000, p = makePoints(n, 7, 0.8, 1); const pos = p.geometry.attributes.position.array, c = p.geometry.attributes.aColor.array, s = p.geometry.attributes.aSize.array;
  for (let i = 0; i < n; i++) { const u = Math.random(), v = Math.random(); const th = u * TAU, ph = Math.acos(2 * v - 1), r = 3500 + Math.random() * 2000;
    pos.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r, Math.sin(ph) * Math.sin(th) * r], i * 3);
    const cc = col(['#9fb4ff', '#ffffff', '#ffe1b0', '#c6a6ff'][i % 4]).multiplyScalar(0.5 + Math.random() * 0.5); c.set([cc.r, cc.g, cc.b], i * 3); s[i] = 0.5 + Math.random() * 2.5; }
  scene.add(p);
}

// ------------------------------------------------------------------ PALACE
const palaceRoot = new THREE.Group(); scene.add(palaceRoot);
const levelGroups = [];
const QUAD = { east: '#3b4dff', south: '#ff2a44', west: '#ffc22a', north: '#e6ecff' }; // Kalachakra: E black(indigo), S red, W yellow, N white
function squareLoop(w, y) { const h = w / 2; return [new THREE.Vector3(-h, y, -h), new THREE.Vector3(h, y, -h), new THREE.Vector3(h, y, h), new THREE.Vector3(-h, y, h), new THREE.Vector3(-h, y, -h)]; }
function boxEdges(w, d, h, cx, cy, cz, color, op = 0.9, faceOp = 0.035) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, d); geo.translate(cx, cy + h / 2, cz);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(color, op)));
  if (faceOp > 0) g.add(new THREE.Mesh(geo, faceMat(color, faceOp)));
  return g;
}
function gate(level, side, g) {
  const w = level.w, H = (level.top - level.y), gw = Math.max(4, w * 0.18), gd = w * 0.09, color = level.color;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]]; const [dx, dz] = dirs[side];
  const tiers = 3; for (let k = 0; k < tiers; k++) {
    const tw = gw * (1 - k * 0.22), th = H * 0.22, ty = level.y + k * th * 0.95;
    const cx = dx * (w / 2 + gd / 2), cz = dz * (w / 2 + gd / 2);
    const bw = dx ? gd : tw, bd = dx ? tw : gd;
    g.add(boxEdges(bw, bd, th, cx, ty, cz, color, 0.75, 0.015));
  }
  // arch
  const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; const r = gw * 0.32; const u = Math.cos(a) * r, v = Math.sin(a) * r + H * 0.28;
    pts.push(dx ? new THREE.Vector3(dx * (w / 2 + gd + 0.2), level.y + v, u) : new THREE.Vector3(u, level.y + v, dz * (w / 2 + gd + 0.2))); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(GOLD, 0.9)));
}
D.LEVELS.forEach((L, li) => {
  const g = new THREE.Group(); g.userData.level = L;
  if (L.key !== 'bliss') {
    g.add(boxEdges(L.w, L.w, L.top - L.y, 0, L.y, 0, L.color, 0.8, 0.01));
    // inner parapet / decorated band
    for (const f of [0.92, 0.84]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(squareLoop(L.w * f, L.y + 0.4)), lineMat(L.color, 0.45)));
    // quadrant floor colours
    const h = L.w / 2 * 0.84, y = L.y + 0.25;
    const quads = [['east', [-h, h], [h, h]], ['north', [h, h], [h, -h]], ['west', [h, -h], [-h, -h]], ['south', [-h, -h], [-h, h]]];
    for (const [k, a, b] of quads) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, y, 0, a[0], y, a[1], b[0], y, b[1]], 3)); g.add(new THREE.Mesh(geo, faceMat(QUAD[k], 0.05))); }
    if (L.gates) for (let s = 0; s < 4; s++) gate(L, s, g);
    const lab = makeLabel(L.skt, `${L.name} · ${L.w}×${L.w} hasta`, L.color, li === 0 ? 13 : 8.5);
    lab.position.set(L.w / 2 + (li === 0 ? 50 : 26), L.y + (L.top - L.y) * 0.5, L.w / 2 + 8); g.add(lab);
  }
  palaceRoot.add(g); levelGroups.push(g);
});
// roof pinnacle — tip at exactly 200 hasta
{
  const g = levelGroups[3];
  const cone = new THREE.ConeGeometry(25 / Math.SQRT2, D.ROOF_TIP - 187.5 - 3, 4, 1, true); cone.rotateY(Math.PI / 4); cone.translate(0, 187.5 + (D.ROOF_TIP - 187.5 - 3) / 2, 0);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(cone), lineMat(GOLD, 0.95)));
  g.add(new THREE.Mesh(cone, faceMat(GOLD, 0.05)));
  const fin = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 197, 0), new THREE.Vector3(0, D.ROOF_TIP, 0)]); g.add(new THREE.Line(fin, lineMat(GOLD, 1)));
  const tip = glowSprite('#ffd36b', 6, 0.9); tip.position.set(0, D.ROOF_TIP, 0); g.add(tip);
  const lab = makeLabel('', 'Roof tip · 200 hasta (≈1200 ft)', GOLD, 6); lab.position.set(0, D.ROOF_TIP + 8, 0); g.add(lab);
}
// cube of time (height = width = 200 hasta)
const cubeOfTime = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(200, 200, 200).translate(0, 100, 0)), new THREE.LineDashedMaterial({ color: '#ffd36b', dashSize: 4, gapSize: 4, transparent: true, opacity: 0.22, depthWrite: false }));
cubeOfTime.computeLineDistances(); cubeOfTime.material.userData.base = 0.22; palaceRoot.add(cubeOfTime);

// Great Bliss: green lotus, Kalachakra & Vishvamata, eight shaktis
const bliss = levelGroups[4];
{
  const y = 175.3;
  for (let k = 0; k < 16; k++) {
    const outer = k < 8, a = (k % 8) / 8 * TAU + (outer ? 0 : TAU / 16), len = outer ? 9.5 : 6.5;
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(len * 0.45, len * 0.32, len, 0); sh.quadraticCurveTo(len * 0.45, -len * 0.32, 0, 0);
    const geo = new THREE.ShapeGeometry(sh, 8); geo.rotateX(-Math.PI / 2); geo.rotateZ(outer ? 0.12 : 0.28); geo.rotateY(-a); geo.translate(0, y + (outer ? 0 : 0.4), 0);
    bliss.add(new THREE.Mesh(geo, faceMat(outer ? '#21ff6a' : '#7dff9c', outer ? 0.28 : 0.35)));
    bliss.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat('#5dff8f', 0.7)));
  }
  const disk = glowSprite('#9dffb8', 10, 0.25); disk.position.set(0, y + 0.5, 0); bliss.add(disk);
}
const blissShaktiSprites = [];
D.BLISS_SHAKTIS.forEach((nm, k) => {
  const a = k / 8 * TAU, c = ['#4a5cff', '#ff3344', '#f0f4ff', '#ffd23a', '#9aa2b8', '#7fdcff', '#d8ff5a', '#ffb347'][k];
  const s = glowSprite(c, 3.4, 1, 0.3); s.position.set(Math.sin(a) * 7.5, 176.6, Math.cos(a) * 7.5);
  s.userData = { type: 'bliss', name: nm, color: c, k }; bliss.add(s); blissShaktiSprites.push(s);
});
// particle deity figures
function genFigure(n, h, armsPerSide, color, opts = {}) {
  const out = []; const r = rng(opts.seed || 1); const C = col(color);
  const ellip = (cx, cy, cz, rx, ry, rz) => { const u = r(), v = r(), th = u * TAU, ph = Math.acos(2 * v - 1), k = Math.cbrt(r()) * 0.4 + 0.6; return [cx + Math.sin(ph) * Math.cos(th) * rx * k, cy + Math.cos(ph) * ry * k, cz + Math.sin(ph) * Math.sin(th) * rz * k]; };
  const seg = (a, b, th) => { const u = r(); return [a[0] + (b[0] - a[0]) * u + (r() - .5) * th, a[1] + (b[1] - a[1]) * u + (r() - .5) * th, a[2] + (b[2] - a[2]) * u + (r() - .5) * th]; };
  for (let i = 0; i < n; i++) {
    const q = r(); let p, bright = 1, cc = C;
    if (q < 0.1) p = ellip(0, 0.88 * h, 0, 0.07 * h, 0.085 * h, 0.07 * h);
    else if (q < 0.15) { const f = Math.floor(r() * 3); const off = [[0.08, 0], [-0.08, 0], [0, -0.08]][f]; p = ellip(off[0] * h, 0.87 * h, off[1] * h, 0.05 * h, 0.065 * h, 0.05 * h); cc = col(['#ff3a3a', '#ffe04a', '#f2f4ff'][f]); }
    else if (q < 0.36) p = ellip(0, 0.63 * h, 0, 0.13 * h, 0.17 * h, 0.08 * h);
    else if (q < 0.43) p = ellip(0, 0.44 * h, 0, 0.12 * h, 0.06 * h, 0.08 * h);
    else if (q < 0.58) { const side = r() < 0.5 ? -1 : 1; const hip = [side * 0.07 * h, 0.42 * h, 0]; const knee = [side * (opts.stance ? 0.2 : 0.1) * h, 0.22 * h, 0.03 * h]; const foot = [side * (opts.stance ? (side > 0 ? 0.32 : 0.16) : 0.12) * h, 0, 0.02 * h];
      p = r() < 0.5 ? seg(hip, knee, 0.06 * h) : seg(knee, foot, 0.05 * h); }
    else if (q < 0.9) { const side = r() < 0.5 ? -1 : 1, j = Math.floor(r() * armsPerSide); const ang = THREE.MathUtils.lerp(-0.9, 1.35, armsPerSide > 1 ? j / (armsPerSide - 1) : 0.4);
      const sh = [side * 0.13 * h, 0.75 * h, -0.02 * h]; const L = 0.4 * h; const el = [sh[0] + side * Math.cos(ang) * L * 0.5, sh[1] + Math.sin(ang) * L * 0.5, sh[2] - 0.03 * h * j / armsPerSide];
      const hand = [sh[0] + side * Math.cos(ang + 0.25) * L, sh[1] + Math.sin(ang + 0.25) * L, sh[2] - 0.08 * h * (j / armsPerSide)];
      if (r() < 0.12) { p = ellip(hand[0], hand[1], hand[2], 0.025 * h, 0.025 * h, 0.025 * h); bright = 1.8; cc = col(GOLD); } else p = r() < 0.5 ? seg(sh, el, 0.03 * h) : seg(el, hand, 0.025 * h); }
    else { const a = r() * TAU, rr = 0.55 * h * (0.95 + r() * 0.08); p = [Math.cos(a) * rr, 0.62 * h + Math.sin(a) * rr, -0.22 * h]; cc = col('#ff8a2a'); bright = 0.8; }
    out.push(p, cc, bright);
  }
  return out;
}
function figurePoints(specs, size = 1.2) {
  const total = specs.reduce((s, x) => s + x.n, 0); const pts = makePoints(total, size, 1, 0.3);
  const pos = pts.geometry.attributes.position.array, c = pts.geometry.attributes.aColor.array; let i = 0;
  for (const sp of specs) { const arr = genFigure(sp.n, sp.h, sp.arms, sp.color, sp); const rot = sp.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
    for (let k = 0; k < arr.length; k += 3) { const [x, y, z] = arr[k]; const cc = arr[k + 1], b = arr[k + 2];
      pos.set([x * cr + z * sr + sp.x, y + sp.y, -x * sr + z * cr + sp.z], i * 3); c.set([cc.r * b, cc.g * b, cc.b * b], i * 3); i++; } }
  pts.geometry.attributes.position.needsUpdate = true; return pts;
}
const deities = figurePoints([
  { n: 2600, h: 10.5, arms: 12, color: '#2f6bff', x: 0, y: 175.6, z: -0.6, stance: true, seed: 3 },
  { n: 1300, h: 8.6, arms: 4, color: '#ffb020', x: 0, y: 175.6, z: 0.9, rot: Math.PI, seed: 9 },
], 0.75);
bliss.add(deities);
{ const lab = makeLabel('कालचक्र · विश्वमाता', 'Kālacakra embracing Viśvamātā', '#8fb4ff', 4.2); lab.position.set(0, 191, 0); bliss.add(lab); }

// ------------------------------------------------------------------ six elemental disks
const diskObjs = [];
const disksRoot = new THREE.Group(); palaceRoot.add(disksRoot);
D.DISKS.forEach((Dk, k) => {
  const n = 2400, p = makePoints(n, 1.9, 0.38, 0.6); const pos = p.geometry.attributes.position.array, c = p.geometry.attributes.aColor.array, s = p.geometry.attributes.aSize.array;
  const C = col(Dk.color); const R = Dk.r; const tri = [0, 1, 2].map((i) => [Math.sin(i / 3 * TAU) * R, Math.cos(i / 3 * TAU) * R]);
  for (let i = 0; i < n; i++) { let x, z; const u = Math.random(), v = Math.random();
    if (Dk.shape === 'square') { x = (u - .5) * 2 * R * 0.72; z = (v - .5) * 2 * R * 0.72; }
    else if (Dk.shape === 'triangle') { let a = u, b = v; if (a + b > 1) { a = 1 - a; b = 1 - b; } x = tri[0][0] + (tri[1][0] - tri[0][0]) * a + (tri[2][0] - tri[0][0]) * b; z = tri[0][1] + (tri[1][1] - tri[0][1]) * a + (tri[2][1] - tri[0][1]) * b; }
    else if (Dk.shape === 'bow') { const th = Math.PI * u, rr = R * Math.sqrt(v); x = Math.cos(th) * rr; z = -Math.sin(th) * rr + R * 0.35; }
    else { const th = u * TAU, rr = R * Math.sqrt(v); x = Math.cos(th) * rr; z = Math.sin(th) * rr; }
    pos.set([x, Dk.y + (Math.random() - .5) * 2.5, z], i * 3); const b = 0.45 + Math.random() * 0.6; c.set([C.r * b, C.g * b, C.b * b], i * 3); s[i] = 0.5 + Math.random() * 1.3; }
  // outline
  let pts = [];
  if (Dk.shape === 'square') pts = squareLoop(R * 1.44, Dk.y);
  else if (Dk.shape === 'triangle') pts = [...tri, tri[0]].map(([x, z]) => new THREE.Vector3(x, Dk.y, z));
  else if (Dk.shape === 'bow') { for (let i = 0; i <= 48; i++) { const th = Math.PI * i / 48; pts.push(new THREE.Vector3(Math.cos(th) * R, Dk.y, -Math.sin(th) * R + R * 0.35)); } pts.push(pts[0].clone()); }
  else for (let i = 0; i <= 96; i++) { const th = i / 96 * TAU; pts.push(new THREE.Vector3(Math.cos(th) * R, Dk.y, Math.sin(th) * R)); }
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(Dk.color, 0.9));
  const g = new THREE.Group(); g.add(p, outline);
  const lab = makeLabel(Dk.skt, Dk.name, Dk.color, 8); lab.position.set(-(R + 30), Dk.y, 0); g.add(lab);
  disksRoot.add(g);
  const tgt = k < 5 ? new THREE.Vector3(0, D.DISKS[k + 1].y, 0) : new THREE.Vector3(0, D.BINDU_Y, 0);
  p.material.uniforms.uTarget.value.copy(tgt);
  diskObjs.push({ g, p, outline, lab, collapse: 0, target: 0 });
});

// ------------------------------------------------------------------ bindu
const binduGroup = new THREE.Group(); scene.add(binduGroup); lift(binduGroup, D.BINDU_Y); binduGroup.position.z = 0.3;
const binduCore = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.85, 0.1) }));
const binduGlow = glowSprite('#ffd21a', 16, 1, 0.12);
const binduHalo = glowSprite('#ffae00', 40, 0.35, 0.05);
binduGroup.add(binduHalo, binduGlow, binduCore);
const eclipseDisk = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false }));
eclipseDisk.renderOrder = 20; binduGroup.add(eclipseDisk);
const clearLight = glowSprite('#cfe2ff', 520, 0, 0.02); binduGroup.add(clearLight);

// inner-sign particles (mirage, smoke, fireflies, lamp)
const signs = makePoints(900, 2.2, 0, 0); binduGroup.add(signs);
// emanation bodies bloom
const emanation = new THREE.Group(); binduGroup.add(emanation);
const emanFigs = []; const famDirs = { Center: [0, 1, 0], East: [0, 0, 1], South: [-1, 0, 0], West: [0, 0, -1], North: [1, 0, 0] };
D.FAMILIES.forEach((f, k) => {
  const fig = figurePoints([{ n: 1400, h: 58, arms: k === 0 ? 4 : 2, color: f.color, x: 0, y: -29, z: 0, seed: 20 + k }], 2.4);
  const g = new THREE.Group(); g.add(fig); const d = famDirs[f.dir]; g.userData.dir = new THREE.Vector3(d[0], d[1] * 0.55, d[2]).multiplyScalar(k === 0 ? 110 : 175);
  g.rotation.y = Math.atan2(d[0], d[2]); emanation.add(g); emanFigs.push(g);
});
const bloomRays = makePoints(2200, 2.2, 0, 0); emanation.add(bloomRays);
{ const a = bloomRays.geometry.attributes.aColor.array; for (let i = 0; i < 2200; i++) { const c = col(D.FAMILIES[i % 5].color); a.set([c.r, c.g, c.b], i * 3); } }

// ------------------------------------------------------------------ eight elemental fields + 64 shaktis
const FIELD_R = 330, FIELD_Y = 100, NODE_R = 30;
const fieldObjs = []; const shaktiSprites = []; const pickables = [];
D.FIELDS.forEach((F, fi) => {
  const a = fi / 8 * TAU; const cx = Math.sin(a) * FIELD_R, cz = Math.cos(a) * FIELD_R;
  const g = new THREE.Group(); g.position.set(cx, 0, cz); lift(g, FIELD_Y); scene.add(g);
  const core = glowSprite(F.color, 26, 0.85, 0.1); core.userData = { type: 'field', fi }; g.add(core); pickables.push(core);
  const lab = makeLabel(F.skt, `${F.name} field`, F.color, 20); lab.position.set(0, 30, 0); g.add(lab);
  const ring = []; for (let i = 0; i <= 64; i++) { const b = i / 64 * TAU; ring.push(new THREE.Vector3(Math.cos(b) * NODE_R, 0, Math.sin(b) * NODE_R)); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), lineMat(F.color, 0.55)));
  const spokes = [];
  for (let j = 0; j < 8; j++) {
    const s = D.SHAKTIS[fi * 8 + j]; const b = j / 8 * TAU + a;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bijaTex(s.bija, F.color), transparent: true, depthWrite: false, opacity: 1 }));
    sp.material.userData.base = 1; sp.scale.setScalar(15); sp.position.set(Math.cos(b) * NODE_R, 0, Math.sin(b) * NODE_R); sp.userData = { type: 'shakti', idx: s.idx };
    g.add(sp); shaktiSprites.push(sp); pickables.push(sp);
    spokes.push(new THREE.Vector3(0, 0, 0), sp.position.clone());
  }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokes), lineMat(F.color, 0.25)));
  // ambient particle aura of the field
  const aura = makePoints(500, 1.5, 0.45, 1); const pa = aura.geometry.attributes.position.array, ca = aura.geometry.attributes.aColor.array; const C = col(F.color);
  for (let i = 0; i < 500; i++) { const r = NODE_R * (0.3 + Math.random() * 1.2), t = Math.random() * TAU; pa.set([Math.cos(t) * r, (Math.random() - .5) * 18, Math.sin(t) * r], i * 3); const k = 0.4 + Math.random() * 0.6; ca.set([C.r * k, C.g * k, C.b * k], i * 3); }
  g.add(aura);
  fieldObjs.push({ g, F, core, lab, fade: 1, aura });
});
// non-hierarchical orbit loop: earth → water → fire → desire → ether → mind → air → light → earth
const loopN = 2400; const loop = makePoints(loopN, 2.6, 0.9, 0.4); scene.add(loop);
const fieldCols = D.FIELDS.map((f) => col(f.color));
// Ashtamatrika ring — the eight mothers, a double-helix "Shaiva-Shakta DNA" strand inside the Buddhist frame
const MAT_R = 168, MAT_Y = 6;
const matrikaGroup = new THREE.Group(); scene.add(matrikaGroup); lift(matrikaGroup, MAT_Y);
const helix = makePoints(2000, 1.8, 0.8, 0.5); matrikaGroup.add(helix);
{ const p = helix.geometry.attributes.position.array, c = helix.geometry.attributes.aColor.array;
  for (let i = 0; i < 2000; i++) { const strand = i % 2, u = (i >> 1) / 1000 * TAU, w = u * 24 + strand * Math.PI; const rr = MAT_R + Math.cos(w) * 5;
    p.set([Math.sin(u) * rr, Math.sin(w) * 5, Math.cos(u) * rr], i * 3); const cc = col(strand ? '#ff4fa8' : '#5f9bff'); c.set([cc.r, cc.g, cc.b], i * 3); } }
const matrikaSprites = [];
D.MATRIKAS.forEach((m, k) => {
  const a = k / 8 * TAU + TAU / 16; const s = glowSprite(m.color, 13, 1, 0.25); s.position.set(Math.sin(a) * MAT_R, 0, Math.cos(a) * MAT_R);
  s.userData = { type: 'matrika', k }; matrikaGroup.add(s); pickables.push(s); matrikaSprites.push(s);
  const lab = makeLabel(m.skt, m.name, m.color, 8); lab.position.set(Math.sin(a) * (MAT_R + 4), 10, Math.cos(a) * (MAT_R + 4)); matrikaGroup.add(lab);
});
{ const lab = makeLabel('अष्टमातृका', 'Aṣṭamātṛkā ring — the eight mothers', '#ff8fd0', 9); lab.position.set(0, -14, MAT_R + 22); matrikaGroup.add(lab); }

// ------------------------------------------------------------------ five families, planets, stars
const FAM_Y = 275, PLAN_R = 440, PLAN_Y = 300, STAR_R = 540, STAR_Y = 340;
const famNodes = D.FAMILIES.map((f, k) => {
  const d = famDirs[f.dir]; const g = new THREE.Group(); g.position.set(d[0] * 75, 0, d[2] * 75); lift(g, FAM_Y); scene.add(g);
  const s = glowSprite(f.color, 22, 0.95, 0.2); s.userData = { type: 'family', k }; g.add(s); pickables.push(s);
  const lab = makeLabel('', `${f.buddha} · ${f.name}`, f.color, 10); lab.position.y = 17; g.add(lab); return { g, s, f };
});
const planetNodes = D.PLANETS.map((p, k) => {
  const a = k / 9 * TAU + 0.3; const g = new THREE.Group(); g.position.set(Math.sin(a) * PLAN_R, 0, Math.cos(a) * PLAN_R); lift(g, PLAN_Y); scene.add(g);
  const s = glowSprite(p.color, 20, 1, 0.3); s.userData = { type: 'planet', k }; g.add(s); pickables.push(s);
  const lab = makeLabel(p.skt, p.name, p.color, 15); lab.position.y = 19; g.add(lab); return { g, s, p };
});
{ const ring = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * TAU; ring.push(new THREE.Vector3(Math.sin(a) * PLAN_R, 0, Math.cos(a) * PLAN_R)); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), lineMat('#6a7bff', 0.25)); lift(l, PLAN_Y); scene.add(l); }
const starNodes = D.NAKSHATRAS.map((nm, k) => {
  const a = k / 28 * TAU; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex(), color: '#cfe0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
  s.material.userData.base = 0.8; s.scale.setScalar(12); s.position.set(Math.sin(a) * STAR_R, 0, Math.cos(a) * STAR_R); lift(s, STAR_Y + Math.sin(k * 1.7) * 18); s.userData.type = 'star'; s.userData.k = k; scene.add(s); pickables.push(s);
  const lab = makeLabel('', nm, '#cfe0ff', 7); lab.position.copy(s.position); lab.position.y += 11; lift(lab, s.userData.baseY + 11); lab.visible = false; lab.userData.starLabel = true; scene.add(lab); s.userData.lab = lab;
  return s;
});

// ------------------------------------------------------------------ emanation cascade streams
const CAS_N = 2600; const cascade = makePoints(CAS_N, 1.8, 0, 0); scene.add(cascade);
const dakiniSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 })); dakiniSprite.scale.setScalar(16); scene.add(dakiniSprite);
let dakiniLabel = null; let cascadeT0 = -1; let cascadeIdx = null;

// ------------------------------------------------------------------ manifestation particles
const MAN_N = 3200; const manifest = makePoints(MAN_N, 0.5, 1, 0); scene.add(manifest);
manifest.renderOrder = 31; manifest.material.depthTest = false;
function bubbleTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(2,3,10,1)'); g.addColorStop(0.76, 'rgba(3,4,14,1)'); g.addColorStop(0.86, 'rgba(3,4,14,0.75)'); g.addColorStop(1, 'rgba(3,4,14,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); return t; }
function rimTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.strokeStyle = '#ffffff'; x.shadowColor = '#ffffff'; x.shadowBlur = 10; x.lineWidth = 2.5; x.beginPath(); x.arc(128, 128, 104, 0, TAU); x.stroke(); x.globalAlpha = 0.4; x.lineWidth = 1; x.beginPath(); x.arc(128, 128, 112, 0, TAU); x.stroke();
  return new THREE.CanvasTexture(c); }
const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(), transparent: true, depthWrite: false, depthTest: false, opacity: 0 })); bubble.renderOrder = 29; scene.add(bubble);
const bubbleRim = new THREE.Sprite(new THREE.SpriteMaterial({ map: rimTex(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 })); bubbleRim.renderOrder = 30; scene.add(bubbleRim);
let bubbleLabel = null, bubbleLabelFor = -1;
const MR = { a: new Float32Array(MAN_N), b: new Float32Array(MAN_N), c: new Float32Array(MAN_N), d: new Float32Array(MAN_N) };
for (let i = 0; i < MAN_N; i++) { MR.a[i] = Math.random(); MR.b[i] = Math.random(); MR.c[i] = Math.random(); MR.d[i] = Math.random(); }
const manFrom = new Float32Array(MAN_N * 3); const manCtx = new Map();
let manActive = null, manT0 = 0, manAlpha = 0;
const FORM_SIZE = 28;

// ------------------------------------------------------------------ UI
const stageBox = $('#stageButtons');
const stageCols = ['#ffd36b', '#ffc928', '#4fc3ff', '#ff5a2a', '#5fffb0', '#2a2f55', '#e6f0ff', '#ff5ad8'];
D.STAGES.forEach((s) => {
  if (s.n === 0) return;
  const b = document.createElement('button'); b.className = 'stage'; b.dataset.stage = s.n; b.style.setProperty('--c', stageCols[s.n]);
  b.innerHTML = `<span class="dot">${s.n === 7 ? '✺' : s.n}</span><span class="t">${s.short}<small>${s.sign}</small></span>`;
  b.addEventListener('click', () => setStage(s.n)); stageBox.appendChild(b);
});
{ const b = document.createElement('button'); b.className = 'stage reset'; b.dataset.stage = 0; b.textContent = '↺ Re-manifest full mandala'; b.addEventListener('click', () => setStage(0)); stageBox.appendChild(b); }
const fieldbar = $('#fieldbar');
D.FIELDS.forEach((F, fi) => { const c = document.createElement('button'); c.className = 'chip'; c.style.setProperty('--c', F.color); c.dataset.fi = fi; c.innerHTML = `<span class="s">${F.skt}</span>${F.name}`; c.onclick = () => selectField(state.field === fi ? null : fi); fieldbar.appendChild(c); });
$('#morph').addEventListener('input', (e) => setMorph(parseFloat(e.target.value)));
$('#labels').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('#cube').addEventListener('change', (e) => { cubeOfTime.visible = e.target.checked; });
$('#topView').onclick = () => flyTo(new THREE.Vector3(0, 1250, 0.01), new THREE.Vector3(0, 0, 0));
$('#resetView').onclick = () => flyTo(HOME.pos.clone(), HOME.target.clone());
$('#about').onclick = () => showOverview();

function stageText() {
  const s = D.STAGES[state.stage];
  $('#stageText').innerHTML = `<b>${s.title}</b><br>${s.text}<br><span style="color:#8590c0">Bindu intensity ×${D.BINDU_INTENSITY[state.stage].toFixed(2)}</span>`;
  document.querySelectorAll('.stage').forEach((b) => b.classList.toggle('active', +b.dataset.stage === state.stage && state.stage !== 0));
}
function setStage(n) {
  state.stage = n; state.binduIntensity = D.BINDU_INTENSITY[n]; stageT0 = clock.elapsedTime; stageText();
}
let stageT0 = 0;

function fmtFamily(f) { return `<i style="color:${f.color};background:${f.color}"></i>${f.name} — ${f.buddha} <span class="muted">(${f.dir})</span>`; }
function showOverview() {
  state.selectedShakti = null; cascadeIdx = null;
  $('#info').innerHTML = `<h2>Kālacakra Maṇḍala Palace</h2>
  <div class="muted">Wheel of Time · a cube of time — 200 × 200 × 200 hasta (1 hasta ≈ 6 ft ≈ 1200 ft)</div>
  <p>Five nested floors: <b style="color:#38e8ff">Body</b> 200×200 (ground, four gates) · <b style="color:#ff4fd8">Speech</b> 100×100 raised 100 · <b style="color:#7c8bff">Mind</b> 50×50 raised 50 · <b style="color:#9dff6a">Exalted Wisdom</b> 25×25 raised 25 · <b style="color:#ffd84a">Great Bliss</b> on a green lotus — Kālacakra embracing Viśvamātā amid eight shaktis. Roof tip at 200 hasta.</p>
  <p>Beneath: six elemental disks, gross → subtle: earth, water, fire, wind, space, consciousness.</p>
  <p>Around: eight elemental fields in a closed, non-hierarchical orbit (earth → water → fire → desire → ether → mind → air → light → earth), eight shaktis each — <b>64 luminous bija nodes</b>. Hover a node to see its manifestation form; click to select it and trace its emanation (bija → ḍākinī → Buddha family → planet → nakshatra).</p>
  <p class="muted">Drag to orbit · scroll to zoom · right-drag to pan · click a field core or chip to isolate a field.</p>
  <div class="note"><b>About the associations.</b> The palace proportions, the floors, the six elemental disks, the Six Yogas dissolution signs, the five Buddha families, the eight Great-Bliss shaktis and the Aṣṭamātṛkā names follow commonly published descriptions of the Kālacakra system and Śākta tradition. The specific per-shakti bija syllables, Sanskrit descriptive names, ḍākinī / family / planet / nakshatra assignments, and the matrika-to-field pairing are an <b>artistic, interpretive mapping</b> made for this visualization — not quotations from any tantra or commentary.</div>`;
}
function showShakti(s) {
  const F = D.FIELDS[s.field], fam = D.FAMILIES[s.fam], pl = D.PLANETS[s.planet];
  $('#info').innerHTML = `<div class="muted">${F.name} field · shakti ${s.j + 1} of 8 · #${s.idx + 1}/64</div>
   <div style="display:flex;align-items:center;gap:12px"><div class="bija-big" id="bijaBtn" title="Click to emanate">${s.bija}</div>
   <div><h2>${s.name}</h2><div class="muted">bija <b style="color:${GOLD}">${s.iast}</b></div><div>Manifests as <b style="color:${F.color}">${s.formName}</b></div></div></div>
   <div class="chain">
     <div class="lnk"><i style="color:${GOLD};background:${GOLD}"></i>Syllable <b style="color:${GOLD};font-family:${DEVA}">${s.bija}</b> (${s.iast})</div><div class="arrow">▼ generates</div>
     <div class="lnk"><i style="color:${fam.color};background:${fam.color}"></i>${s.dakini} <span class="muted">— dakini of ${s.name}</span></div><div class="arrow">▼ belongs to</div>
     <div class="lnk">${fmtFamily(fam)}</div><div class="arrow">▼ corresponds to</div>
     <div class="lnk"><i style="color:${pl.color};background:${pl.color}"></i>Planet ${pl.name} <span style="font-family:${DEVA};color:${GOLD}">${pl.skt}</span></div><div class="arrow">▼ shines in</div>
     <div class="lnk"><i style="color:#cfe0ff;background:#cfe0ff"></i>Nakshatra ${D.NAKSHATRAS[s.star]}</div>
   </div>
   <button class="btn" id="emanBtn">✺ Emanate again</button><button class="btn" id="focusBtn">⌖ Focus on form</button><button class="btn" id="clrBtn">✕ Clear</button>
   <div class="note">Bija, descriptive name and cascade are an interpretive mapping (see About).</div>`;
  $('#bijaBtn').onclick = $('#emanBtn').onclick = () => startCascade(s.idx);
  $('#focusBtn').onclick = () => focusShakti(s.idx); $('#clrBtn').onclick = () => { showOverview(); };
}
function showMisc(html) { state.selectedShakti = null; $('#info').innerHTML = html + `<button class="btn" id="backBtn">← Overview</button>`; $('#backBtn').onclick = showOverview; }
function selectField(fi) {
  state.field = fi; document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', +c.dataset.fi === fi));
  if (fi === null) { showOverview(); return; }
  const F = D.FIELDS[fi], M = D.MATRIKAS[F.matrika]; const list = D.SHAKTIS.filter((s) => s.field === fi);
  showMisc(`<h2 style="color:${F.color}">${F.name} field <span style="font-family:${DEVA}">${F.skt}</span></h2>
   <div class="muted">One of eight equal fields on a closed loop — no field is above another. Paired (interpretively) with the mother <b style="color:${M.color}">${M.name}</b>.</div>
   <div class="list">${list.map((s) => `<div class="item" data-i="${s.idx}"><span>${s.bija}</span>${s.name}<br><small class="muted">${s.formName}</small></div>`).join('')}</div>`);
  document.querySelectorAll('.list .item').forEach((el) => el.onclick = () => selectShakti(+el.dataset.i));
}
function selectShakti(i) {
  const s = D.SHAKTIS[i]; state.selectedShakti = i; if (state.field !== null && state.field !== s.field) { state.field = s.field; document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', +c.dataset.fi === s.field)); }
  showShakti(s); startCascade(i);
}
function startCascade(i) {
  cascadeIdx = i; cascadeT0 = clock.elapsedTime; const s = D.SHAKTIS[i], fam = D.FAMILIES[s.fam];
  dakiniSprite.material.map = bijaTex(s.bija, fam.color); dakiniSprite.material.needsUpdate = true;
  if (dakiniLabel) scene.remove(dakiniLabel); dakiniLabel = makeLabel('डाकिनी', s.dakini, fam.color, 7); scene.add(dakiniLabel);
}
function shaktiWorld(i, v = new THREE.Vector3()) { return shaktiSprites[i].getWorldPosition(v); }
function formCenter(i, v = new THREE.Vector3()) { shaktiWorld(i, v); const o = new THREE.Vector3(v.x, 0, v.z).normalize().multiplyScalar(18); v.add(o); v.y += 64; return v; }
function focusShakti(i) {
  const c = formCenter(i); const out = new THREE.Vector3(c.x, 0, c.z).normalize();
  flyTo(c.clone().add(out.multiplyScalar(88)).add(new THREE.Vector3(0, 10, 0)), c.clone());
}
let fly = null;
function flyTo(pos, target) { fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, s: clock.elapsedTime }; }
function setMorph(e) { state.morph = e; $('#morph').value = e; palaceRoot.scale.y = Math.max(e, 0.004); for (const o of lifted) o.position.y = o.userData.baseY * e; }

// picking
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let down = null; const tip = $('#tip');
function pick(ev) { mouse.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const vis = pickables.concat(blissShaktiSprites).filter((o) => o.visible && o.material.opacity > 0.05); const h = ray.intersectObjects(vis, false); return h.length ? h[0].object : null; }
function describe(o) { const u = o.userData;
  if (u.type === 'shakti') { const s = D.SHAKTIS[u.idx]; return `<span class="b">${s.bija}</span><b>${s.name}</b> — ${D.FIELDS[s.field].name}: ${s.formName}`; }
  if (u.type === 'field') { const F = D.FIELDS[u.fi]; return `<b style="color:${F.color}">${F.name} field</b> ${F.skt} — click to isolate`; }
  if (u.type === 'matrika') { const m = D.MATRIKAS[u.k]; return `<span class="b">${m.skt}</span><b>${m.name}</b> — Aṣṭamātṛkā`; }
  if (u.type === 'family') { const f = D.FAMILIES[u.k]; return `<b style="color:${f.color}">${f.buddha}</b> — ${f.name} (${f.dir})`; }
  if (u.type === 'planet') { const p = D.PLANETS[u.k]; return `<span class="b">${p.skt}</span><b>${p.name}</b> — ${D.FAMILIES[p.fam].name}`; }
  if (u.type === 'star') return `★ Nakshatra <b>${D.NAKSHATRAS[u.k]}</b>`;
  if (u.type === 'bliss') return `<b style="color:${u.color}">${u.name}</b> — one of the eight shaktis of the Great Bliss lotus`;
  return ''; }
canvas.addEventListener('pointermove', (ev) => {
  const o = pick(ev); state.hoveredShakti = o && o.userData.type === 'shakti' ? o.userData.idx : null;
  canvas.style.cursor = o ? 'pointer' : 'grab';
  if (o) { tip.style.display = 'block'; tip.innerHTML = describe(o); tip.style.left = ev.clientX + 14 + 'px'; tip.style.top = ev.clientY + 12 + 'px'; } else tip.style.display = 'none';
});
canvas.addEventListener('pointerleave', () => { state.hoveredShakti = null; tip.style.display = 'none'; });
canvas.addEventListener('pointerdown', (ev) => { down = [ev.clientX, ev.clientY]; });
canvas.addEventListener('pointerup', (ev) => {
  if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return; const o = pick(ev); if (!o) return; const u = o.userData;
  if (u.type === 'shakti') selectShakti(u.idx);
  else if (u.type === 'field') selectField(state.field === u.fi ? null : u.fi);
  else if (u.type === 'matrika') { const m = D.MATRIKAS[u.k]; const F = D.FIELDS.find((f) => f.matrika === u.k);
    showMisc(`<h2 style="color:${m.color}">${m.name} <span style="font-family:${DEVA}">${m.skt}</span></h2><p>One of the Aṣṭamātṛkā, the eight mothers — Śaiva-Śākta lineage held inside the Buddhist mandala frame.</p><p class="muted">Paired here (interpretively) with the <b style="color:${F.color}">${F.name}</b> field.</p>`); }
  else if (u.type === 'family') { const f = D.FAMILIES[u.k]; const ps = D.PLANETS.filter((p) => p.fam === u.k).map((p) => p.name).join(', ');
    showMisc(`<h2 style="color:${f.color}">${f.buddha}</h2><p>${f.name} · ${f.dir} · ${f.dakini}</p><p class="muted">Planets in this visualization: ${ps} (interpretive grouping).</p>`); }
  else if (u.type === 'planet') { const p = D.PLANETS[u.k]; showMisc(`<h2 style="color:${p.color}">${p.name} <span style="font-family:${DEVA}">${p.skt}</span></h2><p>Grouped with the ${D.FAMILIES[p.fam].name} (interpretive).</p><p class="muted">Kālacakra astronomy counts Rāhu and Kālāgni among the planets.</p>`); }
  else if (u.type === 'bliss') showMisc(`<h2 style="color:${u.color}">${u.name}</h2><p>One of the eight shaktis on the petals of the Great Bliss lotus, surrounding Kālacakra and Viśvamātā.</p>`);
  else if (u.type === 'star') showMisc(`<h2>★ ${D.NAKSHATRAS[u.k]}</h2><p>One of the 28 lunar mansions (incl. Abhijit).</p>`);
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); updatePix(); });

// ------------------------------------------------------------------ animation
const clock = new THREE.Clock();
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3();
const O = { x: 0, y: 0, z: 0, s: 1, w: 0, hue: -1 }; const hc = new THREE.Color(), wc = new THREE.Color(1, 1, 1), fc = new THREE.Color();
const levelVis = [1, 1, 1, 1, 1]; let darkness = 0, clearAmt = 0, bloomAmt = 0, eclipseAmt = 0;
const lerpK = (dt, k = 2.2) => 1 - Math.exp(-dt * k);
function absorbedFieldFade(fi) { const st = state.stage; if (st === 0 || st === 7) return 1;
  const at = { earth: 1, water: 2, fire: 3, air: 4, ether: 5, desire: 5, mind: 6, light: 99 }[D.FIELDS[fi].key]; return st >= at ? 0.1 : 1; }
function bez(a, b, lift, u, out) { const m = tmp3.copy(a).add(b).multiplyScalar(0.5); m.y += lift; const iu = 1 - u;
  out.set(iu * iu * a.x + 2 * iu * u * m.x + u * u * b.x, iu * iu * a.y + 2 * iu * u * m.y + u * u * b.y, iu * iu * a.z + 2 * iu * u * m.z + u * u * b.z); return out; }

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime, k = lerpK(dt), st = state.stage;
  for (const m of allPointMats) m.uniforms.uTime.value = t;
  if (fly) { const u = Math.min(1, (t - fly.s) / 1.6), e = u * u * (3 - 2 * u); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); if (u >= 1) fly = null; }
  controls.update();

  // --- stage targets (only change when a stage button is clicked)
  const lvT = [st < 1, st < 2, st < 3, st < 4, st < 5].map((v) => (st === 7 ? 0.55 : v ? 1 : 0));
  for (let i = 0; i < 5; i++) { levelVis[i] += (lvT[i] - levelVis[i]) * k; setFade(levelGroups[i], levelVis[i]); }
  setFade(cubeOfTime, st === 0 ? 1 : st === 7 ? 0.6 : 0.25); if (!$('#cube').checked) cubeOfTime.visible = false;
  diskObjs.forEach((d, i) => { d.target = st === 7 ? 0 : (i < 5 ? st >= i + 1 : st >= 6) ? 1 : 0; d.collapse += (d.target - d.collapse) * lerpK(dt, 1.4);
    d.p.material.uniforms.uCollapse.value = d.collapse; d.outline.material.opacity = 0.9 * (1 - d.collapse); d.outline.scale.setScalar(Math.max(0.001, 1 - d.collapse));
    d.lab.material.opacity = 0.95 * (1 - d.collapse); d.lab.visible = state.labels && d.collapse < 0.95; });
  darkness += ((st === 5 ? 1 : st === 6 ? 0.6 : 0) - darkness) * k;
  clearAmt += ((st === 6 ? 1 : st === 7 ? 0.25 : 0) - clearAmt) * k;
  bloomAmt += ((st === 7 ? 1 : 0) - bloomAmt) * lerpK(dt, 1.2);
  eclipseAmt += ((st === 5 ? 1 : 0) - eclipseAmt) * k;
  scene.background.copy(BG).lerp(new THREE.Color('#0b1430'), clearAmt * 0.7).multiplyScalar(1 - darkness * 0.6 * (1 - clearAmt));

  // --- bindu: brighter, larger, more bloom with each deeper stage
  state.binduLevel += (state.binduIntensity - state.binduLevel) * lerpK(dt, 3);
  const I = state.binduLevel, pulse = 1 + 0.12 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 7.3);
  binduCore.material.color.setRGB(1.0 * I, 0.82 * I, 0.12 * I); binduCore.scale.setScalar((0.8 + 0.3 * I) * pulse);
  binduGlow.scale.setScalar(9 * Math.pow(I, 0.95) * pulse); binduGlow.material.opacity = Math.min(1, 0.6 + 0.12 * I);
  binduHalo.scale.setScalar(24 * Math.pow(I, 0.9) * (0.95 + 0.05 * pulse)); binduHalo.material.opacity = Math.min(0.75, 0.18 + 0.09 * I);
  bloom.strength = 0.5 + 0.07 * I + clearAmt * 0.15; bloom.radius = 0.4 + 0.04 * I;
  eclipseDisk.material.opacity = eclipseAmt; eclipseDisk.visible = eclipseAmt > 0.01; eclipseDisk.scale.setScalar(binduGlow.scale.x * 0.34);
  eclipseDisk.lookAt(camera.position); eclipseDisk.position.copy(tmp.copy(camera.position).sub(binduGroup.getWorldPosition(tmp2)).normalize().multiplyScalar(6));
  clearLight.material.opacity = clearAmt * 0.32; clearLight.visible = clearAmt > 0.01; clearLight.scale.setScalar(380 + 140 * clearAmt + 10 * Math.sin(t * 0.5));
  binduGroup.scale.set(1, 1, 1);

  // --- inner signs (mirage, smoke, fireflies, lamp) for stages 1–4
  { const a = signs.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array; const on = st >= 1 && st <= 4 ? 1 : 0;
    signs.material.uniforms.uOpacity.value += (on * 0.9 - signs.material.uniforms.uOpacity.value) * k; signs.visible = signs.material.uniforms.uOpacity.value > 0.01;
    if (signs.visible) for (let i = 0; i < 900; i++) { const r = signs.geometry.attributes.aRand.array[i], q = (i * 0.618) % 1; let x, y, z, c = [1, 1, 1], s = 1;
      if (st === 1) { x = (q - .5) * 90; z = (r - .5) * 40; y = -10 + Math.floor(r * 6) * 3 + Math.sin(x * 0.2 + t * 3 + r * 9) * 1.2; c = [0.5, 0.75, 1.0]; s = 0.8; }
      else if (st === 2) { const u = (r + t * 0.06) % 1; x = Math.sin(u * 9 + q * 6 + t * 0.4) * (6 + u * 26); z = Math.cos(u * 7 + q * 5) * (6 + u * 20); y = -12 + u * 55; c = [0.55, 0.6, 0.75]; s = 3.2 * (1 - u * 0.6); }
      else if (st === 3) { x = Math.sin(q * 40 + t * 0.3) * 45 * r; z = Math.cos(q * 31 + t * 0.25) * 45 * r; y = -10 + (q * 50 + Math.sin(t + r * 20) * 4); const bl = Math.pow(Math.max(0, Math.sin(t * 4 + r * 80)), 12); c = [1, 0.3 + 0.4 * bl, 0.1]; s = 0.4 + 2.4 * bl; }
      else { const u = q; const rr = 3.2 * Math.sin(u * Math.PI) * Math.pow(1 - u, 0.4) * Math.sqrt(r); const th = r * 60; x = Math.cos(th) * rr + Math.sin(t * 6) * 0.3 * u; z = Math.sin(th) * rr; y = 6 + u * 14; c = [1, 0.75 + 0.25 * (1 - u), 0.3 * (1 - u)]; s = 1.6; }
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; C.set(c, i * 3); S[i] = s; }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true; }

  // --- emanation bloom (stage 7)
  emanation.visible = bloomAmt > 0.01;
  if (emanation.visible) { emanFigs.forEach((g, i) => { const b = Math.min(1, Math.max(0, bloomAmt * 1.3 - i * 0.06)); g.position.copy(g.userData.dir).multiplyScalar(b); g.scale.setScalar(Math.max(0.01, b)); setFade(g, b); });
    const P = bloomRays.geometry.attributes.position.array, R = bloomRays.geometry.attributes.aRand.array;
    for (let i = 0; i < 2200; i++) { const f = i % 5, d = emanFigs[f].userData.dir; const u = (R[i] + t * 0.25) % 1; const spread = 18 * u;
      const ang = R[i] * 400, reach = i % 3 === 0 ? 2.6 : 1.0; P[i * 3] = d.x * u * reach + Math.cos(ang) * spread; P[i * 3 + 1] = d.y * u * reach + Math.sin(ang * 1.3) * spread; P[i * 3 + 2] = d.z * u * reach + Math.sin(ang) * spread; }
    bloomRays.geometry.attributes.position.needsUpdate = true; bloomRays.material.uniforms.uOpacity.value = bloomAmt * 0.7; }

  // --- fields: stage absorption × selection
  fieldObjs.forEach((fo, fi) => { const sel = state.field === null || state.field === fi ? 1 : 0.28; const target = absorbedFieldFade(fi) * sel * (1 - darkness * 0.8) + (st === 6 && fo.F.key === 'light' ? 0.6 : 0);
    fo.fade += (Math.min(1, target) - fo.fade) * k; setFade(fo.g, fo.fade); fo.core.scale.setScalar(26 + 3 * Math.sin(t * 1.3 + fi)); });
  // orbit loop particles (flowing, closed, equal)
  { const a = loop.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array, R = a.aRand.array; const y0 = FIELD_Y * state.morph;
    for (let i = 0; i < loopN; i++) { const u = (i / loopN + t * 0.012 + R[i] * 0.002) % 1; const ang = u * TAU; const w = Math.sin(ang * 8 * 3 + (i % 3) * 2.1 + t) * 10;
      const r = FIELD_R + w + (R[i] - .5) * 6; P[i * 3] = Math.sin(ang) * r; P[i * 3 + 1] = y0 + Math.cos(ang * 24 + (i % 3) * 2.1 + t * 1.3) * 5; P[i * 3 + 2] = Math.cos(ang) * r;
      const fpos = u * 8, f0 = Math.floor(fpos) % 8, f1 = (f0 + 1) % 8, m = fpos - Math.floor(fpos); fc.copy(fieldCols[f0]).lerp(fieldCols[f1], m);
      const fade = Math.min(fieldObjs[f0].fade, 1) * (1 - m) + Math.min(fieldObjs[f1].fade, 1) * m; C[i * 3] = fc.r * fade; C[i * 3 + 1] = fc.g * fade; C[i * 3 + 2] = fc.b * fade; S[i] = 0.6 + R[i]; }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true; }
  matrikaGroup.rotation.y = 0; helix.rotation.y = t * 0.02;
  setFade(matrikaGroup, Math.max(0.12, 1 - darkness * 0.85) * (st >= 1 && st <= 6 ? 0.55 : 1));
  famNodes.forEach((n, i) => setFade(n.g, (1 - darkness * 0.7) * (cascadeIdx !== null && D.SHAKTIS[cascadeIdx].fam === i ? 1 : 0.7)));
  planetNodes.forEach((n) => { setFade(n.g, 1 - darkness * 0.7); n.s.scale.setScalar(20); });
  starNodes.forEach((s, i) => { s.material.opacity = 0.8 * (1 - darkness * 0.6) * (0.7 + 0.3 * Math.sin(t * 1.7 + i)); s.scale.setScalar(12); s.userData.lab.visible = false; });
  labels.forEach((l) => { if (!state.labels) l.visible = false; });

  // --- emanation cascade
  if (cascadeIdx !== null) { const s = D.SHAKTIS[cascadeIdx]; const e = t - cascadeT0;
    const p0 = shaktiWorld(cascadeIdx, new THREE.Vector3()); const p2 = famNodes[s.fam].g.getWorldPosition(new THREE.Vector3());
    const p1 = new THREE.Vector3().lerpVectors(p0, p2, 0.42); p1.y += 55 * Math.max(state.morph, 0.2);
    const p3 = planetNodes[s.planet].g.getWorldPosition(new THREE.Vector3()); const p4 = starNodes[s.star].getWorldPosition(new THREE.Vector3());
    const pts = [p0, p1, p2, p3, p4]; const cols = [col(GOLD), col(D.FAMILIES[s.fam].color), col(D.FAMILIES[s.fam].color), col(D.PLANETS[s.planet].color), col('#cfe0ff')];
    dakiniSprite.position.copy(p1); dakiniSprite.material.opacity = Math.min(1, Math.max(0, (e - 0.6) * 2)); dakiniSprite.scale.setScalar(16 * (1 + 0.08 * Math.sin(t * 4)));
    if (dakiniLabel) { dakiniLabel.position.copy(p1).add(new THREE.Vector3(0, 13, 0)); dakiniLabel.material.opacity = dakiniSprite.material.opacity; dakiniLabel.visible = state.labels; }
    famNodes[s.fam].s.scale.setScalar(22 * (1 + 0.5 * Math.min(1, Math.max(0, e - 1.5)))); planetNodes[s.planet].s.scale.setScalar(20 * (1 + 0.6 * Math.min(1, Math.max(0, e - 2.4))));
    starNodes[s.star].scale.setScalar(12 * (1 + 1.5 * Math.min(1, Math.max(0, e - 3.3)))); starNodes[s.star].userData.lab.visible = state.labels && e > 3.3;
    const a = cascade.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array, R = a.aRand.array; cascade.material.uniforms.uOpacity.value = 1; cascade.visible = true;
    const lifts = [12, 40, 60, 40];
    for (let i = 0; i < CAS_N; i++) { const sg = i % 4; const reveal = Math.min(1, Math.max(0, (e - sg * 0.9) / 0.9)); let u = (R[i] + t * 0.35) % 1; if (u > reveal) u = reveal * (R[i] * 0.999);
      bez(pts[sg], pts[sg + 1], lifts[sg], u, tmp); const jit = 2.2 * Math.sin(u * Math.PI);
      P[i * 3] = tmp.x + Math.sin(i * 12.9 + t * 3) * jit; P[i * 3 + 1] = tmp.y + Math.cos(i * 7.1 + t * 2.5) * jit; P[i * 3 + 2] = tmp.z + Math.sin(i * 3.3 + t * 2) * jit;
      fc.copy(cols[sg]).lerp(cols[sg + 1], u); const on = reveal > 0 ? 1 : 0; C[i * 3] = fc.r * on; C[i * 3 + 1] = fc.g * on; C[i * 3 + 2] = fc.b * on; S[i] = (0.6 + 1.2 * Math.sin(u * Math.PI)) * on; }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
  } else { cascade.visible = false; dakiniSprite.material.opacity = 0; if (dakiniLabel) dakiniLabel.visible = false; }

  // --- manifestation form (hover > selected)
  const want = state.hoveredShakti ?? state.selectedShakti;
  const a = manifest.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array;
  if (want !== manActive) { manFrom.set(P); manT0 = t; manActive = want; }
  const m = Math.min(1, (t - manT0) / 1.3), em = m * m * (3 - 2 * m);
  manAlpha += ((manActive !== null ? 1 : 0) - manAlpha) * lerpK(dt, 3); manifest.visible = manAlpha > 0.01; manifest.material.uniforms.uOpacity.value = manAlpha;
  if (manifest.visible && manActive !== null) {
    const s = D.SHAKTIS[manActive]; const f = FORMS[s.form]; let ctx = manCtx.get(s.form); if (ctx === undefined && INIT[s.form]) { ctx = INIT[s.form](MAN_N); manCtx.set(s.form, ctx); }
    const cen = formCenter(manActive, tmp2); const node = shaktiWorld(manActive, new THREE.Vector3()); const base = col(D.FIELDS[s.field].color); const gold = col(GOLD);
    const fade = fieldObjs[s.field].fade; const sc = FORM_SIZE; const tl = TILT[s.form] || 0, ct = Math.cos(tl), stt = Math.sin(tl); const fa = s.field / 8 * TAU, ca = Math.cos(fa), sa = Math.sin(fa);
    for (let i = 0; i < MAN_N; i++) { O.s = 1; O.w = 0; O.hue = -1; f(i, MAN_N, MR, t, O, ctx);
      // bija-coloured particle seed state around the node
      const sx = node.x + (MR.a[i] - .5) * 7, sy = node.y + (MR.b[i] - .5) * 7, sz = node.z + (MR.c[i] - .5) * 7;
      const ly = O.y * ct - O.z * stt, lz = O.y * stt + O.z * ct; const tx = cen.x + (O.x * ca + lz * sa) * sc, ty = cen.y + ly * sc, tz = cen.z + (-O.x * sa + lz * ca) * sc;
      const fx = manFrom[i * 3], fy = manFrom[i * 3 + 1], fz = manFrom[i * 3 + 2];
      // dissolve: from previous positions → seed (first half) → form (second half)
      const u1 = Math.min(1, em * 2), u2 = Math.max(0, em * 2 - 1);
      let x = fx + (sx - fx) * u1, y = fy + (sy - fy) * u1, z = fz + (sz - fz) * u1; x += (tx - x) * u2; y += (ty - y) * u2; z += (tz - z) * u2;
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      if (O.hue >= 0) hc.setHSL(O.hue % 1, 0.9, 0.55); else hc.copy(base); hc.lerp(wc, Math.min(1, Math.max(0, O.w)) * 0.7); hc.lerp(gold, 1 - u2);
      const br = 0.95 * Math.max(0.25, fade); C[i * 3] = hc.r * br; C[i * 3 + 1] = hc.g * br; C[i * 3 + 2] = hc.b * br; S[i] = Math.max(0, O.s) * (1.0 + 1.2 * (1 - u2)); }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
  }
  { const show = manifest.visible && manActive !== null; bubble.visible = bubbleRim.visible = show;
    if (show) { const c = formCenter(manActive, tmp); const sz = FORM_SIZE * 2.9; bubble.position.copy(c); bubble.scale.setScalar(sz); bubbleRim.position.copy(c); bubbleRim.scale.setScalar(sz);
      bubble.material.opacity = manAlpha; bubbleRim.material.color.set(D.FIELDS[D.SHAKTIS[manActive].field].color); bubbleRim.material.opacity = manAlpha * 0.55;
      if (bubbleLabelFor !== manActive) { if (bubbleLabel) scene.remove(bubbleLabel); const sk = D.SHAKTIS[manActive]; bubbleLabel = makeLabel(sk.bija + '  ' + sk.name, sk.formName, GOLD, 7.5); bubbleLabel.material.depthTest = false; bubbleLabel.renderOrder = 32; scene.add(bubbleLabel); bubbleLabelFor = manActive; }
      bubbleLabel.position.copy(c); bubbleLabel.position.y -= FORM_SIZE * 1.18; bubbleLabel.material.opacity = manAlpha; bubbleLabel.visible = state.labels; }
    else if (bubbleLabel) bubbleLabel.visible = false; }
  // node pulse + highlight
  shaktiSprites.forEach((sp, i) => { const hl = i === want ? 1.45 : 1; sp.scale.setScalar(15 * hl * (1 + 0.05 * Math.sin(t * 2 + i))); });

  composer.render();
}

// ------------------------------------------------------------------ boot
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load(`64px 'Tiro Devanagari Sanskrit'`, 'लं'), document.fonts.load(`600 20px 'Cormorant Garamond'`)]), new Promise((r) => setTimeout(r, 3500))]); } catch (e) {}
  // regenerate canvas-text textures after fonts are available
  for (const sp of shaktiSprites) { const s = D.SHAKTIS[sp.userData.idx]; sp.material.map = bijaTex(s.bija, D.FIELDS[s.field].color); sp.material.needsUpdate = true; }
  stageText(); showOverview(); setMorph(1); animate();
  window.__app = { setStage, selectShakti, selectField, setMorph, focusShakti, flyTo, topView: () => $('#topView').click(), resetView: () => $('#resetView').click(), camera, controls, state };
  setTimeout(() => { $('#loading').style.opacity = 0; setTimeout(() => $('#loading').remove(), 1000); }, 300);
  window.__ready = true;
}
boot();
