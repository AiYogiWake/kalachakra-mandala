import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as D from './data.js';
import { FORMS, INIT, TILT, rng } from './forms.js';
import { EXPLAIN, STAGE_EXPLAIN, LEVEL_EXPLAIN, DISK_EXPLAIN, FIELD_EXPLAIN, HUMAN_INFO, TUMMO_STEPS, DIALOGUE, REFS, VOICE_NOTE, DIALOGUE_NOTE, PRACTICE_NOTE, shaktiNote, THOGAL_STEPS, THOGAL_INTRO } from './teachings.js';
import { shaktiChain, threadChain } from './chains.js';
import { createHuman } from './human.js';

const TAU = Math.PI * 2;
const DEVA = "'Tiro Devanagari Sanskrit','Noto Sans Devanagari','Noto Serif Devanagari',serif";
const GOLD = '#ffd36b';
const $ = (s) => document.querySelector(s);

// ------------------------------------------------------------------ state
const state = {
  stage: 0, binduIntensity: D.BINDU_INTENSITY[0], binduLevel: D.BINDU_INTENSITY[0],
  morph: 1, selectedShakti: null, hoveredShakti: null, field: null, labels: true,
  mode: 'palace', tummoStep: -1, phowa: 0, chain: null, phowaT0: null, phowaPalace: 0, phowaHuman: 0, thogalStep: -1,
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
const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.45, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ shared particle material
const pix = { value: 1 };
function updatePix() { pix.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); }
updatePix();
const PVS = `
uniform float uSize, uOpacity, uTime, uPix, uCollapse, uTwinkle, uShape; uniform vec3 uTarget;
attribute float aSize; attribute float aRand; attribute vec3 aColor;
varying vec3 vColor; varying float vAlpha; varying float vR; varying vec2 vDir;
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
  vR = aRand; vDir = vec2(1.0, 0.0);
  if (uShape > 3.5 && uShape < 4.5) { float ph = fract(uTime * 1.1); tw *= 1.0 + 0.45 * exp(-pow((ph - 0.08) * 22.0, 2.0)) + 0.3 * exp(-pow((ph - 0.3) * 22.0, 2.0)); } // lub-dub heartbeat
  if (uShape > 7.5 && uShape < 8.5) tw *= 0.55 + 0.9 * pow(0.5 + 0.5 * sin(uTime * (1.5 + aRand * 3.0) + aRand * 40.0), 6.0); // star twinkle
  if (uShape > 6.5 && uShape < 7.5) { vec3 tg = normalize(vec3(-p.z, 0.0, p.x) + 1e-4); vec4 c0 = projectionMatrix * mv; vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(p + tg * 2.0, 1.0)); vec2 d = c1.xy / c1.w - c0.xy / c0.w; vDir = length(d) > 1e-6 ? normalize(d) : vec2(1.0, 0.0); }
  gl_PointSize = clamp(uSize * aSize * tw * uPix / -mv.z, 0.0, 90.0);
  if (uShape > 8.5) gl_PointSize = max(gl_PointSize, 1.6);
  gl_Position = projectionMatrix * mv;
}`;
const PFS = `
uniform float uOpacity, uShape; varying vec3 vColor; varying float vAlpha; varying float vR; varying vec2 vDir;
vec3 spectrum(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
void main(){
  vec2 q = gl_PointCoord - 0.5; q.y = -q.y; float d = length(q);
  float a, core; vec3 col = vColor;
  if (uShape < 0.5) { a = smoothstep(0.5, 0.0, d); a *= a; core = smoothstep(0.18, 0.0, d); }
  else if (uShape < 1.5) { vec2 r = rot(vR * 6.283) * q; float m = max(abs(r.x) * 0.87 + abs(r.y) * 0.5, abs(r.y)); a = smoothstep(0.36, 0.3, m); // hexagonal crystal grain
    core = a * (0.25 + 0.6 * step(0.0, r.x + r.y * 0.6)); }  // lit facet
  else if (uShape < 2.5) { a = smoothstep(0.42, 0.3, d) * 0.55; float rim = smoothstep(0.08, 0.0, abs(d - 0.34)); float hl = smoothstep(0.1, 0.0, length(q - vec2(-0.11, 0.12))); a = max(a, rim); core = rim * 0.6 + hl * 1.2; col = mix(vColor, vec3(0.85, 0.95, 1.0), rim * 0.5); } // droplet with refraction rim
  else if (uShape < 3.5) { float y = q.y; float w = y < -0.1 ? sqrt(max(0.0, 0.05 - (y + 0.1) * (y + 0.1))) : 0.224 * (1.0 - (y + 0.1) / 0.52); a = smoothstep(w, w - 0.07, abs(q.x)) * step(-0.33, y); // teardrop ember
    core = smoothstep(0.16, 0.0, length(q - vec2(0.0, -0.12))); col = mix(vColor, vec3(1.0, 0.95, 0.6), core); }
  else if (uShape < 4.5) { a = smoothstep(0.5, 0.18, d); a = a * a; core = smoothstep(0.2, 0.0, d) * 0.9; } // warm pulsing glow
  else if (uShape < 5.5) { a = smoothstep(0.06, 0.0, abs(d - 0.36)) * 0.8; core = 0.0; } // hollow ring
  else if (uShape < 6.5) { vec2 r = rot(vR * 6.283) * q; a = exp(-abs(r.y) * 38.0) * smoothstep(0.5, 0.1, abs(r.x)) + exp(-abs(r.x) * 38.0) * smoothstep(0.5, 0.3, abs(r.y)) * 0.5; core = smoothstep(0.08, 0.0, d) * 1.5; } // filament spark
  else if (uShape < 7.5) { vec2 r = vec2(dot(q, vDir), dot(q, vec2(-vDir.y, vDir.x))); a = exp(-r.y * r.y * 260.0) * smoothstep(0.5, 0.0, abs(r.x)) * (0.6 + 0.4 * smoothstep(-0.5, 0.5, r.x)); core = exp(-r.y * r.y * 900.0) * smoothstep(0.2, 0.0, abs(r.x - 0.15)) * 0.6; } // streaked wisp
  else if (uShape < 8.5) { vec2 r = rot(vR * 0.8) * q; float st = exp(-abs(r.x) * 40.0) + exp(-abs(r.y) * 40.0) + 0.5 * (exp(-abs(r.x + r.y) * 30.0) + exp(-abs(r.x - r.y) * 30.0)); a = clamp(st * smoothstep(0.5, 0.0, d), 0.0, 1.0); core = smoothstep(0.1, 0.0, d) * 1.4; col = mix(vColor, spectrum(fract(vR + d * 2.4)), 0.55 * smoothstep(0.05, 0.3, d)); } // prismatic star
  else { a = smoothstep(0.5, 0.32, d); core = smoothstep(0.22, 0.0, d) * 0.5; } // crisp point
  gl_FragColor = vec4(col * (a + core * 0.6), a * uOpacity * vAlpha);
}`;
const allPointMats = [];
function pointMat(size = 1, opacity = 1, twinkle = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: size }, uOpacity: { value: opacity }, uTime: { value: 0 }, uPix: pix, uCollapse: { value: 0 }, uTwinkle: { value: twinkle }, uShape: { value: 0 }, uTarget: { value: new THREE.Vector3() } },
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
function bijaTex(bija, color, shape = null) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, color + 'aa'); g.addColorStop(0.45, color + '33'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = color; x.lineWidth = 6; x.shadowColor = color; x.shadowBlur = 18; x.lineJoin = 'round';
  const poly = (n, r, rot = -Math.PI / 2) => { x.beginPath(); for (let i = 0; i <= n; i++) { const a = rot + i / n * TAU; x[i ? 'lineTo' : 'moveTo'](128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.stroke(); };
  const star = (n, r1, r2) => { x.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = -Math.PI / 2 + i / (n * 2) * TAU, r = i % 2 ? r2 : r1; x[i ? 'lineTo' : 'moveTo'](128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.stroke(); };
  // node geometry per element (interpretive, after the elemental yantra shapes: earth square, water circle/crescent, fire triangle, air hexagram)
  if (shape === 'earth') { x.strokeRect(128 - 70, 128 - 70, 140, 140); x.lineWidth = 2; x.strokeRect(128 - 84, 128 - 84, 168, 168); }
  else if (shape === 'water') { x.beginPath(); x.arc(128, 128, 84, 0, TAU); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(128, 150, 56, Math.PI * 0.12, Math.PI * 0.88); x.stroke(); }
  else if (shape === 'fire') { poly(3, 92); x.lineWidth = 2; poly(3, 104); }
  else if (shape === 'desire') { x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.moveTo(128 + Math.cos(a) * 56, 128 + Math.sin(a) * 56); x.quadraticCurveTo(128 + Math.cos(a + 0.39) * 108, 128 + Math.sin(a + 0.39) * 108, 128 + Math.cos(a + 0.785) * 56, 128 + Math.sin(a + 0.785) * 56); } x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 56, 0, TAU); x.stroke(); } // eight-petal lotus
  else if (shape === 'ether') { x.lineWidth = 3; x.setLineDash([6, 10]); x.beginPath(); x.arc(128, 128, 88, 0, TAU); x.stroke(); x.setLineDash([]); x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 72, 0, TAU); x.stroke(); } // open, dotted circle
  else if (shape === 'mind') { poly(6, 86, 0); x.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; x.beginPath(); x.moveTo(128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86); x.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); x.stroke(); x.beginPath(); x.arc(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108, 4, 0, TAU); x.stroke(); } } // hexagon with synapse terminals
  else if (shape === 'air') { poly(3, 90); poly(3, 90, Math.PI / 2); } // hexagram
  else if (shape === 'light') { star(8, 104, 70); x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 60, 0, TAU); x.stroke(); }
  else { x.beginPath(); x.arc(128, 128, 84, 0, TAU); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 96, 0, TAU); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function starTex() {
  if (texCache.has('star')) return texCache.get('star');
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.translate(64, 64); const g = x.createRadialGradient(0, 0, 0, 0, 0, 60); g.addColorStop(0, '#fff'); g.addColorStop(0.2, '#fff8'); g.addColorStop(1, '#fff0');
  x.fillStyle = g; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 9 : 62, a = i / 8 * TAU; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill();
  const t = new THREE.CanvasTexture(c); texCache.set('star', t); return t;
}
// ---- HTML overlay labels: crisp at any zoom, never bloomed, de-overlapped in screen space
const labelLayer = document.getElementById('labels3d');
const labels = [];
class HLabel extends THREE.Object3D {
  constructor(top, bottom, color, h, opts = {}) {
    super(); this.isHLabel = true; this.h = h; this.opts = opts; this.orphan = 0;
    const el = document.createElement('div'); el.className = 'l3' + (opts.bija ? ' bija' : '') + (opts.title ? ' title' : '');
    const px = opts.px || Math.round(Math.min(18, Math.max(12, 10 + h * 0.4)));
    el.style.setProperty('--c', color); el.style.fontSize = px + 'px';
    const dev = /[\u0900-\u097F]/.test(top || '');
    el.innerHTML = `<i class="lead"></i><div class="box">${top ? `<div class="t${dev ? ' dev' : ''}">${top}</div>` : ''}${bottom ? `<div class="b">${bottom}</div>` : ''}</div>`;
    this.el = el; this.lead = el.firstChild; this.box = el.lastChild; labelLayer.appendChild(el);
    this.material = { opacity: 0.95, userData: { base: 0.95 }, rotation: 0, depthTest: true };
    this.userData.isLabel = true; this.w = 0; this.hh = 0; this.shown = false; this.css = '';
    this.maxDist = opts.maxDist || h * 130;
  }
}
function makeLabel(top, bottom, color = GOLD, h = 14, opts) { const l = new HLabel(top, bottom, color, h, opts); labels.push(l); return l; }
function makeBija(bija) { const l = new HLabel(bija, '', GOLD, 15, { bija: true }); labels.push(l); return l; }
const _lv = new THREE.Vector3(), _lc = new THREE.Vector3(); const _placed = [];
function sceneOf(o) { while (o.parent) o = o.parent; return o; }
function effVisible(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
function updateLabels(sc) {
  const W = innerWidth, H = innerHeight, f = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); _placed.length = 0; const cand = [];
  for (let i = labels.length - 1; i >= 0; i--) { const l = labels[i];
    if (!l.parent) { if (++l.orphan > 2) { l.el.remove(); labels.splice(i, 1); } else if (l.shown) { l.el.style.display = 'none'; l.shown = false; } continue; }
    l.orphan = 0;
    let show = sceneOf(l) === sc && effVisible(l) && l.material.opacity > 0.03 && (l.opts.bija || state.labels);
    if (show) { l.getWorldPosition(_lv); const dist = _lv.distanceTo(camera.position); _lc.copy(_lv).project(camera);
      if (_lc.z > 1 || _lc.z < -1 || (!l.opts.bija && dist > l.maxDist)) show = false;
      else { l.sx = (_lc.x + 1) / 2 * W; l.sy = (1 - _lc.y) / 2 * H; l.dist = dist;
        if (l.opts.bija) { const ps = (l.parent.scale.x || 15) * f / dist * 0.4; if (ps < 7) show = false; else l.px = Math.min(64, ps); }
        if (show) cand.push(l); } }
    if (!show && l.shown) { l.el.style.display = 'none'; l.shown = false; } }
  cand.sort((a, b) => (b.opts.bija ? 1 : 0) - (a.opts.bija ? 1 : 0) || (b.opts.prio || 0) - (a.opts.prio || 0) || b.h - a.h || a.dist - b.dist);
  for (const l of cand) {
    if (!l.shown) { l.el.style.display = 'block'; l.shown = true; }
    if (l.opts.bija) { const fs = Math.round(l.px); if (fs !== l.fs) { l.el.style.fontSize = fs + 'px'; l.fs = fs; l.w = 0; } }
    if (!l.w) { l.w = l.box.offsetWidth; l.hh = l.box.offsetHeight; }
    let dy = 0, ok = true;
    if (!l.opts.bija) { ok = false; const x0 = l.sx - l.w / 2;
      for (const k of [0, -1, 1, -2, 2, -3, 3]) { const y0 = l.sy - l.hh / 2 + k * (l.hh + 3); let hit = false;
        for (const r of _placed) if (x0 < r[2] && x0 + l.w > r[0] && y0 < r[3] && y0 + l.hh > r[1]) { hit = true; break; }
        if (!hit) { dy = k * (l.hh + 3); _placed.push([x0 - 2, y0 - 1, x0 + l.w + 2, y0 + l.hh + 1]); ok = true; break; } } }
    if (!ok) { l.el.style.display = 'none'; l.shown = false; l.css = ''; continue; } // collided after nudging: hide rather than overlap
    const fade = l.opts.bija ? 1 : 1 - THREE.MathUtils.smoothstep(l.dist, l.maxDist * 0.8, l.maxDist);
    const op = ok ? Math.min(1, l.material.opacity / 0.95) * fade : 0;
    const css = `translate(${l.sx.toFixed(1)}px,${l.sy.toFixed(1)}px)|${op.toFixed(2)}|${dy}|${l.material.rotation ? 1 : 0}`;
    if (css !== l.css) { l.css = css; l.el.style.transform = `translate(${l.sx.toFixed(1)}px,${l.sy.toFixed(1)}px)`; l.el.style.opacity = op.toFixed(2);
      l.box.style.transform = `translate(-50%, calc(-50% + ${dy}px))${l.material.rotation ? ' rotate(180deg)' : ''}`;
      if (dy) { l.lead.style.display = 'block'; l.lead.style.top = (dy < 0 ? dy + l.hh / 2 : 0) + 'px'; l.lead.style.height = Math.max(0, Math.abs(dy) - l.hh / 2) + 'px'; } else l.lead.style.display = 'none'; }
    if (l.userData.type && !l.bound) { l.bound = true; l.el.classList.add('click'); l.box.onclick = () => activate(l);
      l.box.onmouseenter = (ev) => { const d = describe(l); if (d) { tip.style.display = 'block'; tip.innerHTML = d; tip.style.left = ev.clientX + 14 + 'px'; tip.style.top = ev.clientY + 12 + 'px'; } };
      l.box.onmouseleave = () => { tip.style.display = 'none'; }; }
    l.el.style.pointerEvents = 'none'; }
}
function glowSprite(color, size, opacity = 1, hard) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(color, hard), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity }));
  s.material.userData.base = opacity; s.scale.setScalar(size); return s;
}
const col = (h) => new THREE.Color(h);

// ------------------------------------------------------------------ morph (2D plan ↔ 3D)
const lifted = []; // objects whose world Y scales with the morph
const extraPicks = []; // labels and other clickable explainers
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
// richer architecture: five-coloured wall bands, parapets, offering-goddess friezes, toranas, deity seats
function decorate(L, g, li) {
  const BAND = ['#3b4dff', '#ff2a44', '#f0f4ff', '#ffc22a', '#3dff7a'];
  const w = L.w, H = L.top - L.y, h = w / 2, sc = w / 200;
  // five coloured wall bands on the outer face (lower part of each floor)
  BAND.forEach((c, k) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(squareLoop(w + 0.6, L.y + H * (0.05 + k * 0.035))), lineMat(c, 0.6))));
  // offering ledge
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(squareLoop(w + 3 * Math.max(sc, 0.3), L.y + H * 0.24)), lineMat('#ff8fd0', 0.5)));
  // parapet: crenellated merlons along the top edge + hanging garlands below
  const mer = []; const mh = Math.max(0.8, H * 0.05), n = Math.max(6, Math.round(w / (w > 60 ? 5 : 2.5)));
  for (let side = 0; side < 4; side++) { const pts = []; for (let k = 0; k <= n * 2; k++) { const u = k / (n * 2), along = -h + u * w; const top = L.top - (k % 2 ? 0 : mh);
      const p = [[along, -h], [h, along], [-along, h], [-h, -along]][side]; pts.push(new THREE.Vector3(p[0], top, p[1]), new THREE.Vector3(p[0], k % 2 ? top : L.top, p[1])); }
    mer.push(...pts); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(mer), lineMat(L.color, 0.55)));
  // particle details: garlands, frieze of offering goddesses, toranas, seats
  const pts = [], cols = [];
  const push = (x, y, z, c, b = 1) => { pts.push(x, y, z); const C = col(c); cols.push(C.r * b, C.g * b, C.b * b); };
  const onWall = (side, along, y, out, f) => { const p = [[along, -h - out], [h + out, along], [-along, h + out], [-h - out, -along]][side]; f(p[0], y, p[1]); };
  const gl = Math.max(6, Math.round(w / 6));
  for (let side = 0; side < 4; side++) for (let k = 0; k < gl; k++) for (let q = 0; q <= 8; q++) { const u = (k + q / 8) / gl; const along = -h + u * w; const sag = Math.sin(q / 8 * Math.PI) * H * 0.06;
    onWall(side, along, L.top - mh - H * 0.04 - sag, 0.4, (x, y, z) => push(x, y, z, q % 4 === 0 ? GOLD : '#ffffff', 0.7)); }
  // offering goddesses on the ledge: tiny figures holding up offerings
  const ng = Math.max(3, Math.round(w / 7)); const fh = Math.max(1.6, Math.min(7, H * 0.12));
  for (let side = 0; side < 4; side++) for (let k = 0; k < ng; k++) { const along = -h + (k + 0.5) / ng * w; if (L.gates && Math.abs(along) < w * 0.12) continue; const c = BAND[(k + side) % 5]; const y0 = L.y + H * 0.24;
    onWall(side, along, y0, 1.2 * Math.max(sc, 0.3), (x, y, z) => { const tx = side % 2 ? 0 : 1, tz = side % 2 ? 1 : 0;
      for (let q = 0; q < 6; q++) push(x, y + fh * (0.1 + q * 0.12), z, c, 0.9); // body
      push(x, y + fh * 0.95, z, '#fff2d0', 1.2); // head
      for (let q = 1; q <= 3; q++) { push(x + tx * fh * 0.12 * q, y + fh * (0.62 + q * 0.1), z + tz * fh * 0.12 * q, c, 0.8); push(x - tx * fh * 0.12 * q, y + fh * (0.62 + q * 0.1), z - tz * fh * 0.12 * q, c, 0.8); }
      push(x, y + fh * 1.25, z, GOLD, 1.5); // the offering held aloft
      for (let q = -2; q <= 2; q++) push(x + tx * q * fh * 0.1, y, z + tz * q * fh * 0.1, c, 0.6); }); }
  // toranas over each gate: dharma wheel flanked by two deer
  if (L.gates) for (let side = 0; side < 4; side++) { const gw = Math.max(4, w * 0.18), y0 = L.y + H * 0.78, rr = gw * 0.22, out = w * 0.09 + 0.6;
    onWall(side, 0, y0, out, (x, y, z) => { const tx = side % 2 ? 0 : 1, tz = side % 2 ? 1 : 0;
      for (let q = 0; q < 40; q++) { const a = q / 40 * TAU; push(x + tx * Math.cos(a) * rr, y + Math.sin(a) * rr, z + tz * Math.cos(a) * rr, GOLD, 1.1); }
      for (let sp = 0; sp < 8; sp++) for (let q = 1; q < 6; q++) { const a = sp / 8 * TAU, r2 = rr * q / 6; push(x + tx * Math.cos(a) * r2, y + Math.sin(a) * r2, z + tz * Math.cos(a) * r2, GOLD, 0.9); }
      for (const s2 of [-1, 1]) { const dx = s2 * rr * 2.0; for (let q = 0; q < 14; q++) { const a = q / 14 * TAU; push(x + tx * (dx + Math.cos(a) * rr * 0.55), y - rr * 0.6 + Math.sin(a) * rr * 0.3, z + tz * (dx + Math.cos(a) * rr * 0.55), '#ffe9b0', 0.8); }
        push(x + tx * (dx - s2 * rr * 0.55), y - rr * 0.1, z + tz * (dx - s2 * rr * 0.55), '#ffe9b0', 1); }
      for (let q = 0; q <= 24; q++) { const u = q / 24; push(x + tx * (u - .5) * gw * 1.2, y + rr * 1.5, z + tz * (u - .5) * gw * 1.2, L.color, 0.9); } }); }
  // deity seats (lotus · moon disk · seed) in rows inside the floor
  const ns = { body: 12, speech: 8, mind: 5, wisdom: 2 }[L.key] || 0; const sr = Math.max(0.8, 2.6 * Math.sqrt(sc));
  for (let side = 0; side < 4; side++) for (let k = 0; k < ns; k++) { const along = -h * 0.72 + (k + 0.5) / ns * w * 0.72; onWall(side, along, L.y + 0.6, -h * 0.12 - sr, (x, y, z) => {
      for (let q = 0; q < 16; q++) { const a = q / 16 * TAU, r3 = sr * (0.75 + 0.25 * Math.abs(Math.cos(a * 4))); push(x + Math.cos(a) * r3, y, z + Math.sin(a) * r3, ['#ff6aa8', '#ffffff'][q % 2], 0.8); }
      push(x, y + 0.3, z, GOLD, 1.6); }); }
  const P = makePoints(pts.length / 3, li === 0 ? 1.7 : li === 1 ? 1.25 : 0.9, 0.85, 0.3);
  P.geometry.attributes.position.array.set(pts); P.geometry.attributes.aColor.array.set(cols); g.add(P);
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
    lab.position.set(L.w / 2 + (li === 0 ? 50 : 26), L.y + (L.top - L.y) * 0.5, L.w / 2 + 8); g.add(lab); lab.userData.type = 'level'; lab.userData.key = L.key; extraPicks.push(lab);
    decorate(L, g, li);
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
{ const lab = makeLabel('कालचक्र · विश्वमाता', 'Kālacakra embracing Viśvamātā', '#8fb4ff', 4.2); lab.position.set(0, 191, 0); bliss.add(lab); lab.userData.type = 'deities'; extraPicks.push(lab); }
{ const lab = makeLabel('महासुख', 'Great Bliss · green lotus', '#ffd84a', 3.4); lab.position.set(0, 172.2, 9); bliss.add(lab); lab.userData.type = 'level'; lab.userData.key = 'bliss'; extraPicks.push(lab); }

// ------------------------------------------------------------------ six elemental disks
const diskObjs = [];
// finer disk textures: each element gets its own inscribed pattern
function diskPattern(Dk, R, tri, u, v, i) {
  const k = Dk.key;
  if (k === 'earth') { const a = (u - .5) * 2 * R * 0.72, b = (Math.round(v * 8) / 8 - .5) * 2 * R * 0.72; return i % 2 ? [a, b] : [b, a]; } // vajra grid
  if (k === 'water') { const ring = Math.floor(v * 7) + 1, th = u * TAU; const rr = R * ring / 7.5 + Math.sin(th * 14 + ring) * 1.6; return [Math.cos(th) * rr, Math.sin(th) * rr]; } // ripples
  if (k === 'fire') { const e = Math.floor(v * 3), a = tri[e], b = tri[(e + 1) % 3]; const w = u; const mx = a[0] + (b[0] - a[0]) * w, mz = a[1] + (b[1] - a[1]) * w; const tongue = Math.pow(Math.abs(Math.sin(w * Math.PI * 9)), 2) * R * 0.18 * ((i * 0.37) % 1); const l = Math.hypot(mx, mz) || 1; return [mx - mx / l * tongue, mz - mz / l * tongue]; } // flame tongues
  if (k === 'wind') { const arm = Math.floor(v * 4), th = Math.PI * u; const rr = R * (0.25 + 0.18 * arm) + Math.sin(th * 6 + arm) * 2; return [Math.cos(th) * rr, -Math.sin(th) * rr + R * 0.35]; } // gust arcs
  if (k === 'space') { if (i % 2) { const sp = Math.floor(v * 8) / 8 * TAU, rr = u * R; return [Math.cos(sp) * rr, Math.sin(sp) * rr]; } const th = u * TAU; return [Math.cos(th) * R * 0.5, Math.sin(th) * R * 0.5]; } // wheel of space
  { const arm = i % 2, th = u * TAU * 1.6 + arm * Math.PI, rr = R * u; return [Math.cos(th) * rr, Math.sin(th) * rr]; } // consciousness spiral
}
const disksRoot = new THREE.Group(); palaceRoot.add(disksRoot);
D.DISKS.forEach((Dk, k) => {
  const n = 2400, p = makePoints(n, 1.9, 0.38, 0.6); const pos = p.geometry.attributes.position.array, c = p.geometry.attributes.aColor.array, s = p.geometry.attributes.aSize.array;
  const C = col(Dk.color); const R = Dk.r; const tri = [0, 1, 2].map((i) => [Math.sin(i / 3 * TAU) * R, Math.cos(i / 3 * TAU) * R]);
  for (let i = 0; i < n; i++) { let x, z; const u = Math.random(), v = Math.random();
    if (Dk.shape === 'square') { x = (u - .5) * 2 * R * 0.72; z = (v - .5) * 2 * R * 0.72; }
    else if (Dk.shape === 'triangle') { let a = u, b = v; if (a + b > 1) { a = 1 - a; b = 1 - b; } x = tri[0][0] + (tri[1][0] - tri[0][0]) * a + (tri[2][0] - tri[0][0]) * b; z = tri[0][1] + (tri[1][1] - tri[0][1]) * a + (tri[2][1] - tri[0][1]) * b; }
    else if (Dk.shape === 'bow') { const th = Math.PI * u, rr = R * Math.sqrt(v); x = Math.cos(th) * rr; z = -Math.sin(th) * rr + R * 0.35; }
    else { const th = u * TAU, rr = R * Math.sqrt(v); x = Math.cos(th) * rr; z = Math.sin(th) * rr; }
    let pat = false; if (i % 3 === 0) { const pp = diskPattern(Dk, R, tri, Math.random(), Math.random(), i); if (pp) { x = pp[0]; z = pp[1]; pat = true; } }
    pos.set([x, Dk.y + (Math.random() - .5) * (pat ? 0.6 : 2.5), z], i * 3); const b = pat ? 0.9 + Math.random() * 0.4 : 0.45 + Math.random() * 0.6; c.set([C.r * b, C.g * b, C.b * b], i * 3); s[i] = 0.5 + Math.random() * 1.3; }
  // outline
  let pts = [];
  if (Dk.shape === 'square') pts = squareLoop(R * 1.44, Dk.y);
  else if (Dk.shape === 'triangle') pts = [...tri, tri[0]].map(([x, z]) => new THREE.Vector3(x, Dk.y, z));
  else if (Dk.shape === 'bow') { for (let i = 0; i <= 48; i++) { const th = Math.PI * i / 48; pts.push(new THREE.Vector3(Math.cos(th) * R, Dk.y, -Math.sin(th) * R + R * 0.35)); } pts.push(pts[0].clone()); }
  else for (let i = 0; i <= 96; i++) { const th = i / 96 * TAU; pts.push(new THREE.Vector3(Math.cos(th) * R, Dk.y, Math.sin(th) * R)); }
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(Dk.color, 0.9));
  const g = new THREE.Group(); g.add(p, outline);
  const lab = makeLabel(Dk.skt, Dk.name, Dk.color, 8); lab.position.set(-(R + 30), Dk.y, 0); g.add(lab); lab.userData.type = 'disk'; lab.userData.key = Dk.key; extraPicks.push(lab);
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
// particle signatures (interpretive visual language, not doctrine): shape id matches the point shader's uShape
const FIELD_SIG = {
  earth: { n: 1300, size: 0.75, op: 0.6, tw: 0, shape: 1, k0: 0.55, mShape: 1, mSize: 0.36 },  // dense angular crystalline grains, still
  water: { n: 520, size: 1.8, op: 0.55, tw: 0.2, shape: 2, k0: 0.5, mShape: 2, mSize: 0.44 },  // round droplets with a refraction rim, dripping and rippling
  fire: { n: 480, size: 2.0, op: 0.7, tw: 0.4, shape: 3, k0: 0.6, mShape: 3, mSize: 0.46 },    // teardrop embers rising and flickering
  desire: { n: 420, size: 2.3, op: 0.42, tw: 0, shape: 4, k0: 0.55, mShape: 4, mSize: 0.42 },  // warm glow pulsing in a heartbeat rhythm
  ether: { n: 110, size: 3.4, op: 0.3, tw: 0, shape: 5, k0: 0.6, mShape: 5, mSize: 0.85, mGain: 1.9 },     // sparse hollow rings, near-invisible, slowly turning
  mind: { n: 300, size: 1.8, op: 0.65, tw: 0.3, shape: 6, k0: 0.6, mShape: 6, mSize: 0.6, mGain: 1.6 },   // fine filament sparks with flickering synaptic links
  air: { n: 460, size: 2.8, op: 0.45, tw: 0, shape: 7, k0: 0.5, mShape: 7, mSize: 0.72, mGain: 1.7 },      // streaked wisps swirling around the field
  light: { n: 260, size: 2.5, op: 0.75, tw: 0, shape: 8, k0: 0.7, mShape: 8, mSize: 0.62, mGain: 1.5 },    // prismatic star-points that twinkle
};
function updateAuras(t) {
  for (const fo of fieldObjs) { const au = fo.aura; if (!au.visible) continue; const B = au.userData.base, key = au.userData.key; const P = au.geometry.attributes.position.array; const n = B.length / 4; let moved = true;
    if (key === 'earth') moved = false;
    else if (key === 'water') for (let i = 0; i < n; i++) { const x = B[i * 4], z = B[i * 4 + 2], r = Math.hypot(x, z), q = B[i * 4 + 3]; const drop = ((q * 20 + t * 3.2) % 20); P[i * 3] = x * (1 + 0.03 * Math.sin(r * 0.35 - t * 2.2)); P[i * 3 + 2] = z * (1 + 0.03 * Math.sin(r * 0.35 - t * 2.2)); P[i * 3 + 1] = 9 - drop + Math.sin(r * 0.4 - t * 2.2) * 0.8; }
    else if (key === 'fire') for (let i = 0; i < n; i++) { const q = B[i * 4 + 3]; const u = (q + t * 0.22) % 1; P[i * 3] = B[i * 4] * (1 - u * 0.35) + Math.sin(t * 7 + q * 50) * 0.6; P[i * 3 + 2] = B[i * 4 + 2] * (1 - u * 0.35) + Math.cos(t * 6 + q * 40) * 0.6; P[i * 3 + 1] = -8 + u * 30; }
    else if (key === 'desire') { const ph = (t * 1.1) % 1; const beat = 1 + 0.12 * Math.exp(-Math.pow((ph - 0.08) * 22, 2)) + 0.07 * Math.exp(-Math.pow((ph - 0.3) * 22, 2)); for (let i = 0; i < n; i++) { P[i * 3] = B[i * 4] * beat; P[i * 3 + 1] = B[i * 4 + 1] * beat; P[i * 3 + 2] = B[i * 4 + 2] * beat; } }
    else if (key === 'ether') { const a = t * 0.05, c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < n; i++) { const x = B[i * 4], z = B[i * 4 + 2]; P[i * 3] = x * c - z * s; P[i * 3 + 2] = x * s + z * c; P[i * 3 + 1] = B[i * 4 + 1] + Math.sin(t * 0.3 + B[i * 4 + 3] * 6) * 1.5; } }
    else if (key === 'mind') { for (let i = 0; i < n; i++) { const q = B[i * 4 + 3]; const k = Math.floor(t * 2.5 + q * 7); const j1 = Math.sin(k * 12.9898 + i * 78.233) * 43758.5453, j = j1 - Math.floor(j1); P[i * 3] = B[i * 4] + (j - 0.5) * 1.6; P[i * 3 + 1] = B[i * 4 + 1] + (((j * 7.13) % 1) - 0.5) * 1.6; P[i * 3 + 2] = B[i * 4 + 2] + (((j * 3.71) % 1) - 0.5) * 1.6; }
      if (fo.links) { const L = fo.links, pr = L.userData.pairs, LP = L.geometry.attributes.position.array, LC = L.geometry.attributes.color.array, cc = au.userData.col;
        for (let k = 0; k < pr.length; k++) { const i = pr[k]; LP[k * 3] = P[i * 3]; LP[k * 3 + 1] = P[i * 3 + 1]; LP[k * 3 + 2] = P[i * 3 + 2]; const f = Math.pow(Math.max(0, Math.sin(t * 3 + (k >> 1) * 1.7)), 8); LC[k * 3] = cc.r * f; LC[k * 3 + 1] = cc.g * f; LC[k * 3 + 2] = cc.b * f; }
        L.geometry.attributes.position.needsUpdate = L.geometry.attributes.color.needsUpdate = true; } }
    else if (key === 'air') for (let i = 0; i < n; i++) { const x = B[i * 4], z = B[i * 4 + 2], r = Math.hypot(x, z), q = B[i * 4 + 3]; const a = Math.atan2(z, x) + t * (14 / (r + 6)); P[i * 3] = Math.cos(a) * r; P[i * 3 + 2] = Math.sin(a) * r; P[i * 3 + 1] = B[i * 4 + 1] + Math.sin(a * 2 + q * 6) * 2.5; }
    else moved = false;
    if (moved) au.geometry.attributes.position.needsUpdate = true; }
}
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
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bijaTex(s.bija, F.color, F.key), transparent: true, depthWrite: false, opacity: 1 }));
    sp.material.userData.base = 1; sp.scale.setScalar(15); sp.position.set(Math.cos(b) * NODE_R, 0, Math.sin(b) * NODE_R); sp.userData = { type: 'shakti', idx: s.idx };
    g.add(sp); shaktiSprites.push(sp); pickables.push(sp); sp.add(makeBija(s.bija));
    spokes.push(new THREE.Vector3(0, 0, 0), sp.position.clone());
  }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokes), lineMat(F.color, 0.25)));
  // ambient particle aura of the field — each field has its own particle signature (shape, density, motion)
  const SG = FIELD_SIG[F.key]; const aura = makePoints(SG.n, SG.size, SG.op, SG.tw); aura.material.uniforms.uShape.value = SG.shape;
  const pa = aura.geometry.attributes.position.array, ca = aura.geometry.attributes.aColor.array, sa = aura.geometry.attributes.aSize.array; const C = col(F.color);
  const ab = new Float32Array(SG.n * 4);
  for (let i = 0; i < SG.n; i++) { let x, y, z; const r1 = Math.random(), r2 = Math.random(), r3 = Math.random();
    if (F.key === 'earth') { const r = NODE_R * (0.25 + Math.sqrt(r1) * 1.05), t = r2 * TAU; x = Math.round(Math.cos(t) * r / 2.2) * 2.2; z = Math.round(Math.sin(t) * r / 2.2) * 2.2; y = Math.round((r3 - 0.5) * 6 / 2.2) * 2.2; } // dense crystalline lattice
    else if (F.key === 'ether') { const r = NODE_R * (0.4 + r1 * 1.4), t = r2 * TAU; x = Math.cos(t) * r; z = Math.sin(t) * r; y = (r3 - 0.5) * 34; }
    else if (F.key === 'light') { const th = r2 * TAU, ph = Math.acos(2 * r3 - 1), r = NODE_R * (0.5 + r1 * 0.9); x = Math.sin(ph) * Math.cos(th) * r; y = Math.cos(ph) * r * 0.6; z = Math.sin(ph) * Math.sin(th) * r; }
    else { const r = NODE_R * (0.3 + r1 * 1.2), t = r2 * TAU; x = Math.cos(t) * r; z = Math.sin(t) * r; y = (r3 - 0.5) * 18; }
    ab.set([x, y, z, Math.random()], i * 4); pa.set([x, y, z], i * 3); const k = SG.k0 + Math.random() * (1 - SG.k0); ca.set([C.r * k, C.g * k, C.b * k], i * 3); sa[i] = 0.6 + Math.random() * 0.8; }
  aura.userData = { base: ab, key: F.key, col: C };
  g.add(aura);
  // mind: synaptic links between neighbouring sparks
  let links = null; if (F.key === 'mind') { const pairs = []; for (let i = 0; i < SG.n && pairs.length < 140; i++) for (let j = i + 1; j < SG.n; j++) { const dx = ab[i * 4] - ab[j * 4], dy = ab[i * 4 + 1] - ab[j * 4 + 1], dz = ab[i * 4 + 2] - ab[j * 4 + 2]; if (dx * dx + dy * dy + dz * dz < 36) { pairs.push(i, j); break; } }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pairs.length * 3), 3)); lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pairs.length * 3), 3));
    const lm = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }); lm.userData.base = 0.8; links = new THREE.LineSegments(lg, lm); links.userData.pairs = pairs; links.frustumCulled = false; g.add(links); }
  fieldObjs.push({ g, F, core, lab, fade: 1, aura, links });
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
const dakiniSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 })); dakiniSprite.scale.setScalar(16); scene.add(dakiniSprite); let dakiniBija = null;
let dakiniLabel = null; let cascadeT0 = -1; let cascadeIdx = null;

// ------------------------------------------------------------------ manifestation particles
let manGain = 1; const MAN_N = 6400; const manifest = makePoints(MAN_N, 0.4, 1, 0); scene.add(manifest); // more, smaller, crisper points (sizes are in device pixels, so DPR-aware)
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
let manActive = null, manT0 = 0, manAlpha = 0; // manActive: { key, form, field, ph, node }
const FORM_SIZE = 28;
const manFromC = new Float32Array(MAN_N * 3); let manKey = null; const cenCur = new THREE.Vector3(), cenFrom = new THREE.Vector3(); let manFirst = true;
// chain playback (multi-phase emanation thread) — starts ONLY on a click
const PH_DUR = 3.6, MORPH_DUR = 1.6;
let chain = null, chainId = 0;
const CH_N = 1800; const chainStream = makePoints(CH_N, 1.6, 0, 0); chainStream.renderOrder = 28; scene.add(chainStream);

// ------------------------------------------------------------------ PHOWA: palace dissolves to light, bindu rises out through the roof tip
const PHOWA_RISE = 235, PHOWA_DUR = 9;
const PH_N = 4200; const phowaDust = makePoints(PH_N, 1.5, 0, 0.5); palaceRoot.add(phowaDust);
const phowaBase = new Float32Array(PH_N * 3), phowaCol = new Float32Array(PH_N * 3), phowaDelay = new Float32Array(PH_N);
{ const r = rng(77); for (let i = 0; i < PH_N; i++) { const L = D.LEVELS[Math.min(3, Math.floor(Math.pow(r(), 1.6) * 4))]; const h = L.w / 2; const side = Math.floor(r() * 4), along = (r() - .5) * L.w; const y = L.y + r() * (L.top - L.y);
    const p = [[along, -h], [h, along], [-along, h], [-h, -along]][side]; phowaBase.set([p[0], y, p[1]], i * 3); const c = col(r() < 0.5 ? L.color : ['#3b4dff', '#ff2a44', '#f0f4ff', '#ffc22a', '#3dff7a'][i % 5]); phowaCol.set([c.r, c.g, c.b], i * 3); phowaDelay[i] = r() * 0.35 + (1 - y / 200) * 0.2; } }
const BEAM_N = 1400; const phowaBeam = makePoints(BEAM_N, 2.0, 0, 0); scene.add(phowaBeam);

// ------------------------------------------------------------------ UI
binduCore.userData.type = 'bindu'; extraPicks.push(binduCore);
const stageBox = $('#stageButtons');
const stageCols = ['#ffd36b', '#ffc928', '#4fc3ff', '#ff5a2a', '#5fffb0', '#2a2f55', '#e6f0ff', '#ff5ad8', '#fff6d0'];
D.STAGES.forEach((s) => {
  if (s.n === 0) return;
  const b = document.createElement('button'); b.className = 'stage'; b.dataset.stage = s.n; b.style.setProperty('--c', stageCols[s.n]);
  b.innerHTML = `<span class="dot">${s.n === 7 ? '✺' : s.n === 8 ? '⇡' : s.n}</span><span class="t">${s.short}<small>${s.sign}</small></span>`;
  b.addEventListener('click', () => setStage(s.n)); stageBox.appendChild(b);
});
{ const b = document.createElement('button'); b.className = 'stage reset'; b.dataset.stage = 0; b.textContent = '↺ Re-manifest full mandala'; b.addEventListener('click', () => setStage(0)); stageBox.appendChild(b); }
const fieldbar = $('#fieldbar');
D.FIELDS.forEach((F, fi) => { const c = document.createElement('button'); c.className = 'chip'; c.style.setProperty('--c', F.color); c.dataset.fi = fi; c.innerHTML = `<span class="s">${F.skt}</span>${F.name}`; c.onclick = () => selectField(state.field === fi ? null : fi); fieldbar.appendChild(c); });
$('#morph').addEventListener('input', (e) => setMorph(parseFloat(e.target.value)));
$('#labels').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('#cube').addEventListener('change', (e) => { cubeOfTime.visible = e.target.checked; });
$('#topView').onclick = () => flyTo(new THREE.Vector3(0, 1250, 0.01), new THREE.Vector3(0, 0, 0));
$('#resetView').onclick = () => flyTo(state.mode === 'human' ? human.home.pos.clone() : HOME.pos.clone(), state.mode === 'human' ? human.home.target.clone() : HOME.target.clone());
$('#about').onclick = () => (state.mode === 'human' ? showHumanInfo('intro') : showOverview());

// ---- expandable explanation helpers
function refsHTML(keys) { return (keys || []).map((k) => REFS[k]).filter(Boolean).map((r) => r.url ? `<li><a href="${r.url}" target="_blank" rel="noopener">${r.cite}</a></li>` : `<li>${r.cite}</li>`).join(''); }
function ex(e, title, open = false) { if (!e) return '';
  return `<details class="ex"${open ? ' open' : ''}><summary>${title || e.t || 'Explain'}</summary>${e.p ? `<p>${e.p}</p>` : ''}${e.m ? `<div class="voice"><span class="vl">Imagined voice · “Longchenpa landed in modern times”</span>${e.m}</div>` : ''}${e.r && e.r.length ? `<div class="rh">References</div><ul class="refs">${refsHTML(e.r)}</ul>` : ''}</details>`; }

function stageText() {
  const s = D.STAGES[state.stage];
  $('#stageText').innerHTML = `<b>${s.title}</b><br>${s.text}<br><span style="color:#8590c0">Bindu intensity ×${D.BINDU_INTENSITY[state.stage].toFixed(2)}</span>${ex(STAGE_EXPLAIN[state.stage], 'Explain this stage ▸')}${state.stage === 8 ? `<div class="note small">${'Phowa is traditionally practised only after transmission and instruction from a qualified teacher. This is a symbolic visualisation, not instruction.'}</div>` : ''}`;
  document.querySelectorAll('.stage').forEach((b) => b.classList.toggle('active', +b.dataset.stage === state.stage && state.stage !== 0));
}
const PHOWA_STEP = TUMMO_STEPS.findIndex((x) => x.key === 'phowa');
// palace phowa (stage 8) and the figure's phowa step are linked: one click starts both from the same t0
function applyStage(n, t0) { state.stage = n; state.binduIntensity = D.BINDU_INTENSITY[n]; stageT0 = t0; stageText(); }
function applyTummo(i, t0) { state.tummoStep = i; state.thogalStep = -1; human.setStep(i, t0); tummoText(); }
function setStage(n) {
  const t0 = clock.elapsedTime; applyStage(n, t0);
  if (n === 8) { state.phowaT0 = t0; applyTummo(PHOWA_STEP, t0); }
  else if (n === 0) { state.phowaT0 = null; applyTummo(-1, t0); }
  else if (state.tummoStep !== PHOWA_STEP) state.phowaT0 = null;
}
let stageT0 = 0;

function fmtFamily(f) { return `<i style="color:${f.color};background:${f.color}"></i>${f.name} — ${f.buddha} <span class="muted">(${f.dir})</span>`; }
function guideHTML() {
  return `<h3 class="gh">Guide to every element</h3>
   ${['overview', 'cube', 'bindu', 'deities', 'blissShaktis', 'matrikas', 'cascade', 'fieldsLoop'].map((k) => ex(EXPLAIN[k])).join('')}
   <div class="rh">Five floors</div>${D.LEVELS.map((L) => ex(LEVEL_EXPLAIN[L.key], `${L.name} · ${L.w}×${L.w} hasta`)).join('')}
   <div class="rh">Six elemental disks</div>${D.DISKS.map((Dk) => ex(DISK_EXPLAIN[Dk.key], Dk.name)).join('')}
   <div class="rh">Eight fields</div>${D.FIELDS.map((F) => ex(FIELD_EXPLAIN[F.key], `${F.name} field`)).join('')}
   <div class="note small">${VOICE_NOTE}</div>`;
}
function showOverview() {
  state.selectedShakti = null; cascadeIdx = null;
  $('#info').innerHTML = `<h2>Kālacakra Maṇḍala Palace</h2>
  <div class="muted">Wheel of Time · a cube of time — 200 × 200 × 200 hasta (1 hasta ≈ 6 ft ≈ 1200 ft)</div>
  <p>Five nested floors: <b style="color:#38e8ff">Body</b> 200×200 (ground, four gates) · <b style="color:#ff4fd8">Speech</b> 100×100 raised 100 · <b style="color:#7c8bff">Mind</b> 50×50 raised 50 · <b style="color:#9dff6a">Exalted Wisdom</b> 25×25 raised 25 · <b style="color:#ffd84a">Great Bliss</b> on a green lotus — Kālacakra embracing Viśvamātā amid eight shaktis. Roof tip at 200 hasta.</p>
  <p>Beneath: six elemental disks, gross → subtle: earth, water, fire, wind, space, consciousness.</p>
  <p>Around: eight elemental fields in a closed, non-hierarchical orbit (earth → water → fire → desire → ether → mind → air → light → earth), eight shaktis each — <b>64 luminous bija nodes</b>. Hover a node to preview its form; <b>click</b> it to play its emanation thread — intention → its phase → the field’s story → hand-off into the next field. Each field panel has <b>▶ Play the whole thread</b>.</p>
  <p class="muted">Drag to orbit · scroll to zoom · right-drag to pan · click floor/disk labels, the bindu or the deities for explanations.</p>
  ${guideHTML()}
  <div class="note"><b>About the associations.</b> The palace proportions, the floors, the six elemental disks, the Six Yogas dissolution signs, the five Buddha families, the eight Great-Bliss shaktis and the Aṣṭamātṛkā names follow commonly published descriptions of the Kālacakra system and Śākta tradition. The specific per-shakti bija syllables, Sanskrit descriptive names, ḍākinī / family / planet / nakshatra assignments, the matrika-to-field pairing and the emanation threads are an <b>artistic, interpretive mapping</b> made for this visualization — not quotations from any tantra or commentary.</div>`;
}
function showShakti(s) {
  const F = D.FIELDS[s.field], fam = D.FAMILIES[s.fam], pl = D.PLANETS[s.planet];
  const ch = shaktiChain(s.idx);
  $('#info').innerHTML = `<div class="muted">${F.name} field · shakti ${s.j + 1} of 8 · #${s.idx + 1}/64</div>
   <div style="display:flex;align-items:center;gap:12px"><div class="bija-big" id="bijaBtn" title="Click to emanate">${s.bija}</div>
   <div><h2>${s.name}</h2><div class="muted">bija <b style="color:${GOLD}">${s.iast}</b></div><div>Manifests as <b style="color:${F.color}">${s.formName}</b></div></div></div>
   <div class="rh">Emanation thread (${ch.length} phases)</div>
   <ol class="phases">${ch.map((p, k) => `<li data-k="${k}"><b>${p.name}</b></li>`).join('')}</ol>
   <button class="btn" id="playBtn">▶ Replay this thread</button><button class="btn" id="thrBtn">▶ Play the whole ${F.name} thread</button>
   ${ex(shaktiNote(s, F.name), 'About this shakti ▸')}
   <div class="rh">Cascade</div>
   <div class="chain">
     <div class="lnk"><i style="color:${GOLD};background:${GOLD}"></i>Syllable <b style="color:${GOLD};font-family:${DEVA}">${s.bija}</b> (${s.iast})</div><div class="arrow">▼ generates</div>
     <div class="lnk"><i style="color:${fam.color};background:${fam.color}"></i>${s.dakini} <span class="muted">— dakini of ${s.name}</span></div><div class="arrow">▼ belongs to</div>
     <div class="lnk">${fmtFamily(fam)}</div><div class="arrow">▼ corresponds to</div>
     <div class="lnk"><i style="color:${pl.color};background:${pl.color}"></i>Planet ${pl.name} <span style="font-family:${DEVA};color:${GOLD}">${pl.skt}</span></div><div class="arrow">▼ shines in</div>
     <div class="lnk"><i style="color:#cfe0ff;background:#cfe0ff"></i>Nakshatra ${D.NAKSHATRAS[s.star]}</div>
   </div>
   ${ex(EXPLAIN.cascade)}
   <button class="btn" id="emanBtn">✺ Emanate again</button><button class="btn" id="focusBtn">⌖ Focus on form</button><button class="btn" id="clrBtn">✕ Clear</button>
   <div class="note">Bija, descriptive name, thread and cascade are an interpretive mapping (see About).</div>`;
  $('#bijaBtn').onclick = $('#emanBtn').onclick = () => startCascade(s.idx);
  $('#playBtn').onclick = () => startChain(shaktiChain(s.idx), 'shakti', s.field);
  $('#thrBtn').onclick = () => playThread(s.field);
  document.querySelectorAll('.phases li').forEach((el) => el.onclick = () => { if (chain && chain.mode === 'shakti' && chain.src === s.idx) goPhase(+el.dataset.k, true); else { startChain(shaktiChain(s.idx), 'shakti', s.field, s.idx); goPhase(+el.dataset.k, true); } });
  $('#focusBtn').onclick = () => focusCurrent(); $('#clrBtn').onclick = () => { stopChain(); showOverview(); };
}
function showMisc(html) { state.selectedShakti = null; $('#info').innerHTML = html + `<button class="btn" id="backBtn">← Overview</button>`; $('#backBtn').onclick = showOverview; }
function selectField(fi) {
  state.field = fi; document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', +c.dataset.fi === fi));
  if (fi === null) { showOverview(); return; }
  const F = D.FIELDS[fi], M = D.MATRIKAS[F.matrika]; const list = D.SHAKTIS.filter((s) => s.field === fi);
  showMisc(`<h2 style="color:${F.color}">${F.name} field <span style="font-family:${DEVA}">${F.skt}</span></h2>
   <div class="muted">One of eight equal fields on a closed loop — no field is above another. Paired (interpretively) with the mother <b style="color:${M.color}">${M.name}</b>.</div>
   <button class="btn big" id="threadBtn" style="--c:${F.color}">▶ Play the whole thread</button>
   <div class="list">${list.map((s) => `<div class="item" data-i="${s.idx}"><span>${s.bija}</span>${s.name}<br><small class="muted">${s.formName}</small></div>`).join('')}</div>
   ${ex(FIELD_EXPLAIN[F.key], `About the ${F.name} field ▸`, true)}${ex(EXPLAIN.fieldsLoop)}`);
  $('#threadBtn').onclick = () => playThread(fi);
  document.querySelectorAll('.list .item').forEach((el) => el.onclick = () => selectShakti(+el.dataset.i));
}
function selectShakti(i) {
  const s = D.SHAKTIS[i]; state.selectedShakti = i; if (state.field !== null && state.field !== s.field) { state.field = s.field; document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', +c.dataset.fi === s.field)); }
  showShakti(s); startCascade(i); startChain(shaktiChain(i), 'shakti', s.field, i);
}
function playThread(fi) { startChain(threadChain(fi), 'thread', fi, null); }
function startCascade(i) {
  cascadeIdx = i; cascadeT0 = clock.elapsedTime; const s = D.SHAKTIS[i], fam = D.FAMILIES[s.fam];
  dakiniSprite.material.map = bijaTex(s.bija, fam.color); dakiniSprite.material.needsUpdate = true; if (dakiniBija) dakiniSprite.remove(dakiniBija); dakiniBija = makeBija(s.bija); dakiniSprite.add(dakiniBija);
  if (dakiniLabel) scene.remove(dakiniLabel); dakiniLabel = makeLabel('डाकिनी', s.dakini, fam.color, 7); scene.add(dakiniLabel);
}
// ---- chain playback controls (click-triggered only)
function startChain(phases, mode, fi, src = null) { chain = { phases, i: 0, t0: clock.elapsedTime, playing: true, mode, fi, src, id: ++chainId }; renderChainBar(); }
function stopChain() { chain = null; renderChainBar(); }
function goPhase(k, user = false) { if (!chain) return; chain.i = Math.max(0, Math.min(chain.phases.length - 1, k)); chain.t0 = clock.elapsedTime; if (user) chain.playing = false; renderChainBar(); }
function renderChainBar() { const bar = $('#chainBar');
  if (!chain) { bar.style.display = 'none'; state.chain = null; return; } bar.style.display = 'block'; const ph = chain.phases[chain.i]; const F = D.FIELDS[ph.field];
  state.chain = { i: chain.i, n: chain.phases.length, playing: chain.playing, mode: chain.mode, form: ph.form, kind: ph.kind, name: ph.name, id: chain.id };
  bar.style.setProperty('--c', F.color);
  $('#chPhase').textContent = `${chain.mode === 'thread' ? D.FIELDS[chain.fi].name + ' thread' : 'Emanation thread'} · phase ${chain.i + 1}/${chain.phases.length}`;
  $('#chName').textContent = ph.name; $('#chVoice').innerHTML = `<span class="vl">Imagined voice · Longchenpa:</span> ${ph.voice}`;
  $('#chDots').innerHTML = chain.phases.map((p, k) => `<i class="${k === chain.i ? 'on' : k < chain.i ? 'past' : ''}" style="--c:${D.FIELDS[p.field].color}" data-k="${k}" title="${p.name.replace(/"/g, '')}"></i>`).join('');
  document.querySelectorAll('#chDots i').forEach((el) => el.onclick = () => goPhase(+el.dataset.k, true));
  $('#chPlay').textContent = chain.playing ? '⏸ Pause' : (chain.i >= chain.phases.length - 1 ? '↺ Replay' : '▶ Play');
}
$('#chPrev').onclick = () => goPhase(chain ? chain.i - 1 : 0, true);
$('#chNext').onclick = () => goPhase(chain ? chain.i + 1 : 0, true);
$('#chPlay').onclick = () => { if (!chain) return; if (chain.playing) chain.playing = false; else { if (chain.i >= chain.phases.length - 1) chain.i = 0; chain.playing = true; chain.t0 = clock.elapsedTime; } renderChainBar(); };
$('#chClose').onclick = () => stopChain();
$('#chFocus').onclick = () => focusCurrent();

function shaktiWorld(i, v = new THREE.Vector3()) { return shaktiSprites[i].getWorldPosition(v); }
function formCenter(i, v = new THREE.Vector3()) { shaktiWorld(i, v); const o = new THREE.Vector3(v.x, 0, v.z).normalize().multiplyScalar(18); v.add(o); v.y += 64; return v; }
function fieldCenter(fi, v = new THREE.Vector3()) { fieldObjs[fi].g.getWorldPosition(v); const o = new THREE.Vector3(v.x, 0, v.z).normalize().multiplyScalar(18); v.add(o); v.y += 64; return v; }
function phaseCenter(ph, v) { return ph.kind === 'climax' ? fieldCenter(ph.field, v) : formCenter(ph.idx, v); }
function phaseNode(ph, v) { return ph.kind === 'climax' ? fieldObjs[ph.field].g.getWorldPosition(v) : shaktiWorld(ph.idx, v); }
function focusAt(c) { const out = new THREE.Vector3(c.x, 0, c.z).normalize(); flyTo(c.clone().add(out.multiplyScalar(128)).add(new THREE.Vector3(0, 6, 0)), c.clone().add(new THREE.Vector3(0, -10, 0))); }
function focusShakti(i) { focusAt(formCenter(i)); }
function focusCurrent() { if (chain) focusAt(phaseCenter(chain.phases[chain.i], new THREE.Vector3())); else if (state.selectedShakti !== null) focusShakti(state.selectedShakti); }
let fly = null;
function flyTo(pos, target) { fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, s: clock.elapsedTime }; }
function setMorph(e) { state.morph = e; $('#morph').value = e; palaceRoot.scale.y = Math.max(e, 0.004); for (const o of lifted) o.position.y = o.userData.baseY * e; }

// ------------------------------------------------------------------ Human Maṇḍala mode
const human = createHuman({ makePoints, glowSprite, makeLabel, lineMat, setFade, state, phowaDur: PHOWA_DUR });
let camStore = { palace: null, human: { pos: human.home.pos.clone(), target: human.home.target.clone() } };
function setMode(m) {
  if (m === state.mode) return; camStore[state.mode] = { pos: camera.position.clone(), target: controls.target.clone() };
  state.mode = m; fly = null; const c = camStore[m] || { pos: HOME.pos.clone(), target: HOME.target.clone() }; camera.position.copy(c.pos); controls.target.copy(c.target); controls.update();
  renderPass.scene = m === 'human' ? human.scene : scene; controls.minDistance = m === 'human' ? 8 : 20;
  document.body.classList.toggle('human', m === 'human');
  document.querySelectorAll('#tabs [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  if (m === 'human') { showHumanInfo('intro'); tummoText(); } else showOverview();
}
function showHumanInfo(key, extra = '') { const H = HUMAN_INFO[key]; const h = HUMAN_INFO;
  $('#info').innerHTML = `<h2>${key === 'intro' ? 'The Human Maṇḍala — Three Kāyas' : H.t}</h2>${extra}
   ${key === 'intro' ? `<p>${h.intro.p}</p>${ex(h.intro, 'Imagined voice & references ▸')}` : ex(H, 'Explain ▸', true)}
   <label class="kt"><input type="checkbox" id="kayaT" ${humanKayas ? 'checked' : ''}/> Show the three-kāya map (OṂ · ĀḤ · HŪṂ)</label>
   <div class="rh">Parts of the figure</div>${['uma', 'roma', 'kyangma', 'wheels', 'drops', 'kati', 'kayas'].map((k) => ex(h[k])).join('')}
   <div class="note small">${PRACTICE_NOTE}</div>${key !== 'intro' ? '<button class="btn" id="hBack">← Overview</button>' : ''}`;
  $('#kayaT').onchange = (e) => { humanKayas = e.target.checked; human.setKayas(humanKayas); };
  if ($('#hBack')) $('#hBack').onclick = () => showHumanInfo('intro');
}
let humanKayas = true;
const tummoBox = $('#tummoButtons');
TUMMO_STEPS.forEach((s, i) => { const b = document.createElement('button'); b.className = 'stage tstep'; b.dataset.step = i; b.style.setProperty('--c', s.key === 'phowa' ? '#fff6d0' : `hsl(${20 + i * 22},90%,60%)`);
  b.innerHTML = `<span class="dot">${s.key === 'phowa' ? '⇡' : i + 1}</span><span class="t">${s.t.replace(/^\d+ · /, '')}</span>`; b.onclick = () => setTummo(i); tummoBox.appendChild(b); });
{ const b = document.createElement('button'); b.className = 'stage reset'; b.textContent = '↺ Reset figure'; b.onclick = () => setTummo(-1); tummoBox.appendChild(b); }
function setTummo(i) { const t0 = clock.elapsedTime; applyTummo(i, t0);
  if (i === PHOWA_STEP) { state.phowaT0 = t0; applyStage(8, t0); }
  else if (i === -1) { state.phowaT0 = null; applyStage(0, t0); }
  else if (state.stage !== 8) state.phowaT0 = null; }
const thogBox = $('#thogalButtons');
THOGAL_STEPS.forEach((s, i) => { const b = document.createElement('button'); b.className = 'stage thstep'; b.dataset.thstep = i; b.style.setProperty('--c', ['#b9d0ff', '#9fc0ff', '#d6c8ff', '#ffffff', '#ff9ad5'][i]);
  b.innerHTML = `<span class="dot">${['I', 'II', 'III', 'IV', '◌'][i]}</span><span class="t">${s.t.replace(/^[IV]+ · /, '')}<small>${s.tib}</small></span>`; b.onclick = () => setThogal(i); thogBox.appendChild(b); });
function setThogal(i) { const t0 = clock.elapsedTime; if (state.tummoStep === PHOWA_STEP) state.phowaT0 = null; state.tummoStep = -1; human.setThogal(i, t0); state.thogalStep = i; tummoText(); }
$('#hFocus').onclick = () => { const th = state.thogalStep, V3 = THREE.Vector3;
  if (th === 4 || state.tummoStep === PHOWA_STEP) flyTo(new V3(0, 135, 340), new V3(0, 112, 0));
  else if (th >= 1 && th <= 3) flyTo(new V3(0, 92, 205), new V3(0, 80, 20));
  else if (th === 0 || state.tummoStep === 10) flyTo(new V3(0, 90, 150), new V3(0, 84, 20));
  else flyTo(human.home.pos.clone(), human.home.target.clone()); };
function tummoText() { const i = state.tummoStep; document.querySelectorAll('.tstep').forEach((b) => b.classList.toggle('active', +b.dataset.step === i));
  document.querySelectorAll('.thstep').forEach((b) => b.classList.toggle('active', +b.dataset.thstep === state.thogalStep));
  if (state.thogalStep >= 0) { const s = THOGAL_STEPS[state.thogalStep]; $('#tummoText').innerHTML = `<b>${s.t}</b> <span class="muted">(${s.tib})</span><ul class="inst">${s.inst.map((x) => `<li>${x}</li>`).join('')}</ul>${ex(s, 'Explain · metaphor · references ▸')}${ex(THOGAL_INTRO, 'About thögal ▸')}`; $('#humanPanel').scrollTop = thogBox.offsetTop - 70; return; }
  if (i < 0) { $('#tummoText').innerHTML = `<b>Choose a step.</b> Each click shows one stage of the inner-fire (tummo) sequence on the holographic body.<div class="note small">${PRACTICE_NOTE}</div>`; return; }
  const s = TUMMO_STEPS[i]; $('#tummoText').innerHTML = `<b>${s.t}</b><ul class="inst">${s.inst.map((x) => `<li>${x}</li>`).join('')}</ul>${ex(s, 'Explain · metaphor · references ▸')}<div class="note small">Educational overview only — practised traditionally only with empowerment and a qualified teacher.</div>`; }

// ------------------------------------------------------------------ Purpose & References overlays
function openOverlay(kind) { const o = $('#overlay'); o.style.display = 'grid'; state.overlay = kind;
  if (kind === 'purpose') $('#ovBody').innerHTML = `<h2>The Purpose of Kālacakra</h2><div class="sub2">An imagined dialogue between His Holiness the Dalai Lama and Longchen Rabjam, offered to future liberated beings</div>
    <div class="note">${DIALOGUE_NOTE}</div>
    ${DIALOGUE.map((d, k) => `<details class="ex dlg"${k === 0 ? ' open' : ''}><summary>${d.t}</summary>${d.turns.map(([w, x]) => `<p class="turn ${w}"><b>${w === 'DL' ? 'Dalai Lama (imagined)' : 'Longchenpa (imagined)'}:</b> ${x}</p>`).join('')}${d.r && d.r.length ? `<div class="rh">Further reading</div><ul class="refs">${refsHTML(d.r)}</ul>` : ''}</details>`).join('')}`;
  else $('#ovBody').innerHTML = `<h2>References</h2><div class="sub2">Real published works and pages only. Links were checked when this page was built; entries without a link are cited without one rather than guessed.</div>
    <ul class="refs big">${Object.values(REFS).map((r) => r.url ? `<li><a href="${r.url}" target="_blank" rel="noopener">${r.cite}</a></li>` : `<li>${r.cite}</li>`).join('')}</ul>
    <div class="note small">${VOICE_NOTE}<br>${DIALOGUE_NOTE}<br>${PRACTICE_NOTE}</div>`;
}
$('#ovClose').onclick = () => { $('#overlay').style.display = 'none'; state.overlay = null; };
$('#overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') $('#ovClose').click(); });
document.querySelectorAll('#tabs [data-mode]').forEach((b) => b.onclick = () => setMode(b.dataset.mode));
document.querySelectorAll('#tabs [data-ov]').forEach((b) => b.onclick = () => openOverlay(b.dataset.ov));

// picking
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let down = null; const tip = $('#tip');
function pick(ev) { mouse.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const src = state.mode === 'human' ? human.pickables : pickables.concat(blissShaktiSprites, extraPicks);
  const vis = src.filter((o) => { let v = o.visible; o.traverseAncestors((a) => { if (!a.visible) v = false; }); return v && (o.material.opacity === undefined || o.material.opacity > 0.05); }); const h = ray.intersectObjects(vis, false); return h.length ? h[0].object : null; }
function describe(o) { const u = o.userData;
  if (u.type === 'shakti') { const s = D.SHAKTIS[u.idx]; return `<span class="b">${s.bija}</span><b>${s.name}</b> — ${D.FIELDS[s.field].name}: ${s.formName} · click to play its thread`; }
  if (u.type === 'field') { const F = D.FIELDS[u.fi]; return `<b style="color:${F.color}">${F.name} field</b> ${F.skt} — click to isolate`; }
  if (u.type === 'matrika') { const m = D.MATRIKAS[u.k]; return `<span class="b">${m.skt}</span><b>${m.name}</b> — Aṣṭamātṛkā`; }
  if (u.type === 'family') { const f = D.FAMILIES[u.k]; return `<b style="color:${f.color}">${f.buddha}</b> — ${f.name} (${f.dir})`; }
  if (u.type === 'planet') { const p = D.PLANETS[u.k]; return `<span class="b">${p.skt}</span><b>${p.name}</b> — ${D.FAMILIES[p.fam].name}`; }
  if (u.type === 'star') return `★ Nakshatra <b>${D.NAKSHATRAS[u.k]}</b>`;
  if (u.type === 'bliss') return `<b style="color:${u.color}">${u.name}</b> — one of the eight shaktis of the Great Bliss lotus`;
  if (u.type === 'level') { const L = D.LEVELS.find((x) => x.key === u.key); return `<b>${L.name}</b> — click for explanation`; }
  if (u.type === 'disk') { const Dk = D.DISKS.find((x) => x.key === u.key); return `<b>${Dk.name}</b> — click for explanation`; }
  if (u.type === 'deities') return '<b>Kālacakra & Viśvamātā</b> — click for explanation';
  if (u.type === 'bindu') return '<b>Bindu</b> — the indestructible drop · click for explanation';
  if (u.type === 'h_wheel') return `<b>${u.name}</b>`;
  if (u.type && u.type.startsWith('h_')) { const H = HUMAN_INFO[u.type.slice(2)]; return H ? `<b>${H.t}</b>` : ''; }
  return ''; }
canvas.addEventListener('pointermove', (ev) => {
  const o = pick(ev); state.hoveredShakti = o && o.userData.type === 'shakti' ? o.userData.idx : null;
  canvas.style.cursor = o ? 'pointer' : 'grab';
  if (o) { tip.style.display = 'block'; tip.innerHTML = describe(o); tip.style.left = ev.clientX + 14 + 'px'; tip.style.top = ev.clientY + 12 + 'px'; } else tip.style.display = 'none';
});
canvas.addEventListener('pointerleave', () => { state.hoveredShakti = null; tip.style.display = 'none'; });
canvas.addEventListener('pointerdown', (ev) => { down = [ev.clientX, ev.clientY]; });
canvas.addEventListener('pointerup', (ev) => {
  if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return; const o = pick(ev); if (!o) return; activate(o); });
function activate(o) { const u = o.userData;
  if (state.mode === 'human') { if (u.type === 'h_wheel') showHumanInfo('wheels', `<div class="muted">${u.name}</div>`); else if (u.type) showHumanInfo(u.type.slice(2)); return; }
  if (u.type === 'shakti') selectShakti(u.idx);
  else if (u.type === 'field') selectField(state.field === u.fi ? null : u.fi);
  else if (u.type === 'matrika') { const m = D.MATRIKAS[u.k]; const F = D.FIELDS.find((f) => f.matrika === u.k);
    showMisc(`<h2 style="color:${m.color}">${m.name} <span style="font-family:${DEVA}">${m.skt}</span></h2><p>One of the Aṣṭamātṛkā, the eight mothers — Śaiva-Śākta lineage held inside the Buddhist mandala frame.</p><p class="muted">Paired here (interpretively) with the <b style="color:${F.color}">${F.name}</b> field.</p>${ex(EXPLAIN.matrikas, null, true)}`); }
  else if (u.type === 'family') { const f = D.FAMILIES[u.k]; const ps = D.PLANETS.filter((p) => p.fam === u.k).map((p) => p.name).join(', ');
    showMisc(`<h2 style="color:${f.color}">${f.buddha}</h2><p>${f.name} · ${f.dir} · ${f.dakini}</p><p class="muted">Planets in this visualization: ${ps} (interpretive grouping).</p>${ex(EXPLAIN.cascade)}`); }
  else if (u.type === 'planet') { const p = D.PLANETS[u.k]; showMisc(`<h2 style="color:${p.color}">${p.name} <span style="font-family:${DEVA}">${p.skt}</span></h2><p>Grouped with the ${D.FAMILIES[p.fam].name} (interpretive).</p><p class="muted">Kālacakra astronomy counts Rāhu and Kālāgni among the planets.</p>${ex(EXPLAIN.cascade)}`); }
  else if (u.type === 'bliss') showMisc(`<h2 style="color:${u.color}">${u.name}</h2><p>One of the eight shaktis on the petals of the Great Bliss lotus, surrounding Kālacakra and Viśvamātā.</p>${ex(EXPLAIN.blissShaktis, null, true)}`);
  else if (u.type === 'star') showMisc(`<h2>★ ${D.NAKSHATRAS[u.k]}</h2><p>One of the 28 lunar mansions (incl. Abhijit).</p>`);
  else if (u.type === 'level') { const L = D.LEVELS.find((x) => x.key === u.key); showMisc(`<h2 style="color:${L.color}">${L.name} <span style="font-family:${DEVA}">${L.skt}</span></h2><div class="muted">${L.w}×${L.w} hasta</div>${ex(LEVEL_EXPLAIN[L.key], 'Explain ▸', true)}`); }
  else if (u.type === 'disk') { const Dk = D.DISKS.find((x) => x.key === u.key); showMisc(`<h2 style="color:${Dk.color}">${Dk.name} <span style="font-family:${DEVA}">${Dk.skt}</span></h2>${ex(DISK_EXPLAIN[Dk.key], 'Explain ▸', true)}`); }
  else if (u.type === 'deities') showMisc(`<h2>Kālacakra & Viśvamātā</h2>${ex(EXPLAIN.deities, 'Explain ▸', true)}${ex(EXPLAIN.blissShaktis)}`);
  else if (u.type === 'bindu') showMisc(`<h2>The bindu</h2>${ex(EXPLAIN.bindu, 'Explain ▸', true)}`);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); updatePix(); });

// ------------------------------------------------------------------ animation
const clock = new THREE.Clock();
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3();
const O = { x: 0, y: 0, z: 0, s: 1, w: 0, hue: -1 }; const hc = new THREE.Color(), wc = new THREE.Color(1, 1, 1), fc = new THREE.Color();
const levelVis = [1, 1, 1, 1, 1]; let darkness = 0, clearAmt = 0, bloomAmt = 0, eclipseAmt = 0;
const lerpK = (dt, k = 2.2) => 1 - Math.exp(-dt * k);
function absorbedFieldFade(fi) { const st = state.stage; if (st === 0 || st === 7 || st === 8) return 1;
  const at = { earth: 1, water: 2, fire: 3, air: 4, ether: 5, desire: 5, mind: 6, light: 99 }[D.FIELDS[fi].key]; return st >= at ? 0.1 : 1; }
function bez(a, b, lift, u, out) { const m = tmp3.copy(a).add(b).multiplyScalar(0.5); m.y += lift; const iu = 1 - u;
  out.set(iu * iu * a.x + 2 * iu * u * m.x + u * u * b.x, iu * iu * a.y + 2 * iu * u * m.y + u * u * b.y, iu * iu * a.z + 2 * iu * u * m.z + u * u * b.z); return out; }

// ?fixedstep: deterministic 30 fps virtual clock (used only for screenshot capture in slow software-GL browsers)
const FIXED_STEP = new URLSearchParams(location.search).has('fixedstep'); let vClock = 0;
function animate() {
  requestAnimationFrame(animate);
  let dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime; if (FIXED_STEP) { dt = 1 / 30; vClock += dt; t = vClock; clock.elapsedTime = t; } const k = lerpK(dt), st = state.stage;
  for (const m of allPointMats) m.uniforms.uTime.value = t;
  if (fly) { const u = Math.min(1, (t - fly.s) / 1.6), e = u * u * (3 - 2 * u); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); if (u >= 1) fly = null; }
  controls.update();
  state.phowaPalace = st === 8 ? Math.min(1, (t - stageT0) / PHOWA_DUR) : 0;
  state.phowaHuman = state.tummoStep === PHOWA_STEP ? Math.min(1, (t - human.stepT0) / PHOWA_DUR) : 0;
  if (state.mode === 'human') { human.update(t, dt); bloom.strength = 0.75; bloom.radius = 0.5; composer.render(); updateLabels(human.scene); return; }
  // phowa progress: only after the phowa button was clicked (stage 8), eased over PHOWA_DUR seconds
  const phT = st === 8 ? Math.min(1, (t - stageT0) / PHOWA_DUR) : 0, phE = phT * phT * (3 - 2 * phT); state.phowa = phT;

  // --- stage targets (only change when a stage button is clicked)
  const lvT = [st < 1, st < 2, st < 3, st < 4, st < 5].map((v) => (st === 8 ? 0.55 * (1 - phE) : st === 7 ? 0.55 : v ? 1 : 0));
  for (let i = 0; i < 5; i++) { levelVis[i] += (lvT[i] - levelVis[i]) * k; setFade(levelGroups[i], levelVis[i]); }
  setFade(cubeOfTime, st === 0 ? 1 : st === 7 ? 0.6 : st === 8 ? 0.6 * (1 - phE) : 0.25); if (!$('#cube').checked) cubeOfTime.visible = false;
  diskObjs.forEach((d, i) => { d.target = st === 7 ? 0 : st === 8 ? 1 : (i < 5 ? st >= i + 1 : st >= 6) ? 1 : 0; d.collapse += (d.target - d.collapse) * lerpK(dt, 1.4);
    d.p.material.uniforms.uCollapse.value = d.collapse; d.outline.material.opacity = 0.9 * (1 - d.collapse); d.outline.scale.setScalar(Math.max(0.001, 1 - d.collapse));
    d.lab.material.opacity = 0.95 * (1 - d.collapse); d.lab.visible = state.labels && d.collapse < 0.95; });
  darkness += ((st === 5 ? 1 : st === 6 ? 0.6 : 0) - darkness) * k;
  clearAmt += ((st === 6 ? 1 : st === 7 ? 0.25 : st === 8 ? 0.25 + 0.45 * phE : 0) - clearAmt) * k;
  bloomAmt += ((st === 7 ? 1 : st === 8 ? 1 - phE : 0) - bloomAmt) * lerpK(dt, 1.2);
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
  binduGroup.position.y = D.BINDU_Y * state.morph + phE * PHOWA_RISE; // phowa: the bindu leaves through the roof tip and beyond

  // --- phowa: palace & body dissolve into rising light; a column of light along the central axis
  phowaDust.visible = phT > 0.001; phowaBeam.visible = phT > 0.001;
  if (phowaDust.visible) { const a = phowaDust.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array;
    phowaDust.material.uniforms.uOpacity.value = Math.min(1, phT * 6) * (1 - THREE.MathUtils.smoothstep(phT, 0.82, 1)) * 0.95;
    for (let i = 0; i < PH_N; i++) { const d = Math.max(0, Math.min(1, phE * 1.5 - phowaDelay[i])); const x0 = phowaBase[i * 3], y0 = phowaBase[i * 3 + 1], z0 = phowaBase[i * 3 + 2];
      const sw = d * d * 3 + i * 0.01; const conv = 1 - d * 0.85; const cs = Math.cos(sw * 0.6), sn = Math.sin(sw * 0.6);
      P[i * 3] = (x0 * cs - z0 * sn) * conv; P[i * 3 + 1] = y0 + d * d * (220 + (i % 7) * 30); P[i * 3 + 2] = (x0 * sn + z0 * cs) * conv;
      const w = d; C[i * 3] = phowaCol[i * 3] * (1 - w) + w; C[i * 3 + 1] = phowaCol[i * 3 + 1] * (1 - w) + w * 0.95; C[i * 3 + 2] = phowaCol[i * 3 + 2] * (1 - w) + w * 0.8; S[i] = 0.7 + d * 1.4; }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
    const b = phowaBeam.geometry.attributes, BP = b.position.array, BC = b.aColor.array, BS = b.aSize.array, BR = b.aRand.array; const by = binduGroup.position.y;
    phowaBeam.material.uniforms.uOpacity.value = Math.min(1, phT * 5) * (1 - phT * 0.6);
    for (let i = 0; i < BEAM_N; i++) { const u = (BR[i] + t * 0.22) % 1; const top = by + 60; const y = -80 * state.morph + u * (top + 80 * state.morph); const rr = 1.2 + 5 * Math.pow(Math.abs(Math.sin(u * 13 + BR[i] * 40)), 3) * (1 - u);
      const th = BR[i] * 300 + t * 2; BP[i * 3] = Math.cos(th) * rr; BP[i * 3 + 1] = y; BP[i * 3 + 2] = Math.sin(th) * rr; const wv = u; BC[i * 3] = 1; BC[i * 3 + 1] = 0.85 + 0.15 * wv; BC[i * 3 + 2] = 0.45 + 0.5 * wv; BS[i] = 0.6 + 1.2 * (1 - Math.abs(u - 0.6)); }
    b.position.needsUpdate = b.aColor.needsUpdate = b.aSize.needsUpdate = true; }

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
  fieldObjs.forEach((fo, fi) => { const sel = state.field === null || state.field === fi ? 1 : 0.28; const target = (absorbedFieldFade(fi) * sel * (1 - darkness * 0.8) + (st === 6 && fo.F.key === 'light' ? 0.6 : 0)) * (1 - phE * 0.9);
    fo.fade += (Math.min(1, target) - fo.fade) * k; setFade(fo.g, fo.fade); fo.core.scale.setScalar(26 + 3 * Math.sin(t * 1.3 + fi)); });
  // orbit loop particles (flowing, closed, equal)
  { const a = loop.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array, R = a.aRand.array; const y0 = FIELD_Y * state.morph;
    for (let i = 0; i < loopN; i++) { const u = (i / loopN + t * 0.012 + R[i] * 0.002) % 1; const ang = u * TAU; const w = Math.sin(ang * 8 * 3 + (i % 3) * 2.1 + t) * 10;
      const r = FIELD_R + w + (R[i] - .5) * 6; P[i * 3] = Math.sin(ang) * r; P[i * 3 + 1] = y0 + Math.cos(ang * 24 + (i % 3) * 2.1 + t * 1.3) * 5; P[i * 3 + 2] = Math.cos(ang) * r;
      const fpos = u * 8, f0 = Math.floor(fpos) % 8, f1 = (f0 + 1) % 8, m = fpos - Math.floor(fpos); fc.copy(fieldCols[f0]).lerp(fieldCols[f1], m);
      let fade = Math.min(fieldObjs[f0].fade, 1) * (1 - m) + Math.min(fieldObjs[f1].fade, 1) * m;
      if (phT > 0) { const water = f0 === 1; const d = Math.max(0, Math.min(1, phE * 1.35 - (water ? 0 : 0.25) - R[i] * 0.1)); const conv = 1 - d * 0.75;
        P[i * 3] *= conv; P[i * 3 + 2] *= conv; P[i * 3 + 1] += d * d * (260 + R[i] * 300); fade = Math.max(fade, d * (water ? 1.5 : 0.9)) * (1 - THREE.MathUtils.smoothstep(phT, 0.85, 1) * 0.8); fc.lerp(wc, d * (water ? 0.35 : 0.6)); }
      C[i * 3] = fc.r * fade; C[i * 3 + 1] = fc.g * fade; C[i * 3 + 2] = fc.b * fade; S[i] = 0.6 + R[i]; }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true; }
  matrikaGroup.rotation.y = 0; helix.rotation.y = t * 0.02;
  setFade(matrikaGroup, Math.max(0.12, 1 - darkness * 0.85) * (st >= 1 && st <= 6 ? 0.55 : 1) * (1 - phE * 0.9));
  famNodes.forEach((n, i) => setFade(n.g, (1 - darkness * 0.7) * (1 - phE * 0.8) * (cascadeIdx !== null && D.SHAKTIS[cascadeIdx].fam === i ? 1 : 0.7)));
  planetNodes.forEach((n) => { setFade(n.g, (1 - darkness * 0.7) * (1 - phE * 0.8)); n.s.scale.setScalar(20); });
  starNodes.forEach((s, i) => { s.material.opacity = 0.8 * (1 - darkness * 0.6) * (0.7 + 0.3 * Math.sin(t * 1.7 + i)); s.scale.setScalar(12); s.userData.lab.visible = false; });

  // --- emanation cascade
  if (cascadeIdx !== null) { const s = D.SHAKTIS[cascadeIdx]; const e = t - cascadeT0;
    const p0 = shaktiWorld(cascadeIdx, new THREE.Vector3()); const p2 = famNodes[s.fam].g.getWorldPosition(new THREE.Vector3());
    const p1 = new THREE.Vector3().lerpVectors(p0, p2, 0.42); p1.y += 55 * Math.max(state.morph, 0.2);
    const p3 = planetNodes[s.planet].g.getWorldPosition(new THREE.Vector3()); const p4 = starNodes[s.star].getWorldPosition(new THREE.Vector3());
    const pts = [p0, p1, p2, p3, p4]; const cols = [col(GOLD), col(D.FAMILIES[s.fam].color), col(D.FAMILIES[s.fam].color), col(D.PLANETS[s.planet].color), col('#cfe0ff')];
    dakiniSprite.position.copy(p1); dakiniSprite.material.opacity = Math.min(1, Math.max(0, (e - 0.6) * 2)); if (dakiniBija) dakiniBija.material.opacity = dakiniSprite.material.opacity; dakiniSprite.scale.setScalar(16 * (1 + 0.08 * Math.sin(t * 4)));
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
  } else { cascade.visible = false; dakiniSprite.material.opacity = 0; if (dakiniBija) dakiniBija.material.opacity = 0; if (dakiniLabel) dakiniLabel.visible = false; }

  // --- chain auto-progress: only while a click-started chain is playing
  if (chain && chain.playing && t - chain.t0 > PH_DUR) { if (chain.i < chain.phases.length - 1) goPhase(chain.i + 1); else { chain.playing = false; renderChainBar(); } }
  // --- manifestation form: chain phase > hover preview (when idle)
  let cur = null;
  if (chain) { const ph = chain.phases[chain.i]; cur = { key: `c${chain.id}_${chain.i}`, form: ph.form, field: ph.field, ph, node: ph.kind === 'climax' ? null : ph.idx }; }
  else if (state.hoveredShakti !== null) { const s = D.SHAKTIS[state.hoveredShakti]; cur = { key: 'h' + s.idx, form: s.form, field: s.field, ph: { kind: 'shakti', idx: s.idx, field: s.field, name: s.name, form: s.form }, node: s.idx }; }
  const want = cur && cur.node !== null ? cur.node : null;
  const a = manifest.geometry.attributes, P = a.position.array, C = a.aColor.array, S = a.aSize.array;
  if ((cur ? cur.key : null) !== manKey) { manFrom.set(P); manFromC.set(C); manT0 = t; manFirst = manAlpha < 0.3; manKey = cur ? cur.key : null; cenFrom.copy(cenCur);
    if (cur) { manActive = cur; if (manFirst) { phaseCenter(cur.ph, cenFrom); } } }
  if (!cur) manActive = null;
  const m = Math.min(1, (t - manT0) / MORPH_DUR), em = m * m * (3 - 2 * m);
  manAlpha += ((manActive !== null ? 1 : 0) - manAlpha) * lerpK(dt, 3); manifest.visible = manAlpha > 0.01; manifest.material.uniforms.uOpacity.value = manAlpha;
  if (manifest.visible && manActive !== null) {
    const ph = manActive.ph, form = manActive.form; const f = FORMS[form]; { const sg = FIELD_SIG[D.FIELDS[manActive.field].key]; manifest.material.uniforms.uShape.value = sg.mShape; manifest.material.uniforms.uSize.value = sg.mSize; manGain = sg.mGain || 1; } let ctx = manCtx.get(form); if (ctx === undefined && INIT[form]) { ctx = INIT[form](MAN_N); manCtx.set(form, ctx); }
    const tgt = phaseCenter(ph, tmp2); cenCur.lerpVectors(cenFrom, tgt, em);
    const node = phaseNode(ph, new THREE.Vector3()); const base = col(D.FIELDS[manActive.field].color); const gold = col(GOLD);
    const fade = Math.max(fieldObjs[manActive.field].fade, chain ? 0.8 : 0); const sc = FORM_SIZE; const tl = TILT[form] || 0, ct = Math.cos(tl), stt = Math.sin(tl); const fa = manActive.field / 8 * TAU, ca = Math.cos(fa), sa = Math.sin(fa);
    for (let i = 0; i < MAN_N; i++) { O.s = 1; O.w = 0; O.hue = -1; f(i, MAN_N, MR, t, O, ctx);
      const ly = O.y * ct - O.z * stt, lz = O.y * stt + O.z * ct; const tx = cenCur.x + (O.x * ca + lz * sa) * sc, ty = cenCur.y + ly * sc, tz = cenCur.z + (-O.x * sa + lz * ca) * sc;
      const fx = manFrom[i * 3], fy = manFrom[i * 3 + 1], fz = manFrom[i * 3 + 2]; let x, y, z, u2;
      if (manFirst) { // dissolve from the bija node: seed (first half) → form (second half)
        const sx = node.x + (MR.a[i] - .5) * 7, sy = node.y + (MR.b[i] - .5) * 7, sz = node.z + (MR.c[i] - .5) * 7; const u1 = Math.min(1, em * 2); u2 = Math.max(0, em * 2 - 1);
        x = fx + (sx - fx) * u1; y = fy + (sy - fy) * u1; z = fz + (sz - fz) * u1; x += (tx - x) * u2; y += (ty - y) * u2; z += (tz - z) * u2;
      } else { // phase → phase: particles flow along a swirling arc into the next form
        const arc = Math.sin(em * Math.PI); x = fx + (tx - fx) * em + (MR.d[i] - .5) * 26 * arc; y = fy + (ty - fy) * em + (MR.a[i] - .3) * 18 * arc; z = fz + (tz - fz) * em + (MR.c[i] - .5) * 26 * arc; u2 = 1; }
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      if (O.hue >= 0) hc.setHSL(O.hue % 1, 0.9, 0.55); else hc.copy(base); hc.lerp(wc, Math.min(1, Math.max(0, O.w)) * 0.7); hc.lerp(gold, 1 - u2);
      const br = 0.95 * Math.max(0.25, fade) * manGain; let r0 = hc.r * br, g0 = hc.g * br, b0 = hc.b * br;
      if (!manFirst) { r0 = manFromC[i * 3] + (r0 - manFromC[i * 3]) * em; g0 = manFromC[i * 3 + 1] + (g0 - manFromC[i * 3 + 1]) * em; b0 = manFromC[i * 3 + 2] + (b0 - manFromC[i * 3 + 2]) * em; }
      C[i * 3] = r0; C[i * 3 + 1] = g0; C[i * 3 + 2] = b0; S[i] = Math.max(0, O.s) * (1.0 + 1.2 * (1 - u2)); }
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
  }
  { const show = manifest.visible && manActive !== null; bubble.visible = bubbleRim.visible = show;
    if (show) { const c = cenCur; const sz = FORM_SIZE * 2.9; bubble.position.copy(c); bubble.scale.setScalar(sz); bubbleRim.position.copy(c); bubbleRim.scale.setScalar(sz);
      bubble.material.opacity = manAlpha; bubbleRim.material.color.set(D.FIELDS[manActive.field].color); bubbleRim.material.opacity = manAlpha * 0.55;
      if (bubbleLabelFor !== manKey) { if (bubbleLabel) scene.remove(bubbleLabel); const ph = manActive.ph; const sk = ph.kind === 'climax' ? null : D.SHAKTIS[ph.idx];
        const top = chain ? (sk && ph.kind !== 'intent' ? sk.bija + '  ' : '') + ph.name : sk.bija + '  ' + sk.name; const bottom = chain ? `${D.FIELDS[ph.field].name} · phase ${chain.i + 1}/${chain.phases.length}` : sk.formName;
        bubbleLabel = makeLabel(top, bottom, D.FIELDS[ph.field].color, 12, { prio: 10, maxDist: 2000, px: 14 }); scene.add(bubbleLabel); bubbleLabelFor = manKey; }
      bubbleLabel.position.copy(c); bubbleLabel.position.y -= FORM_SIZE * 1.12; bubbleLabel.material.opacity = manAlpha * 0.95; bubbleLabel.visible = true; }
    else if (bubbleLabel) bubbleLabel.visible = false; }
  // --- chain stream: particles physically travel from the previous node into this phase (and into the next field on hand-off)
  chainStream.visible = !!(chain && chain.i > 0);
  if (chainStream.visible) { const ph = chain.phases[chain.i], prev = chain.phases[chain.i - 1]; const pa = phaseNode(prev, new THREE.Vector3()), pb = phaseNode(ph, new THREE.Vector3());
    const ca2 = col(D.FIELDS[prev.field].color), cb2 = col(D.FIELDS[ph.field].color); const e = Math.min(1, (t - chain.t0) / 1.4); const handoff = ph.kind === 'handoff';
    const sa2 = chainStream.geometry.attributes, SP = sa2.position.array, SC = sa2.aColor.array, SS = sa2.aSize.array, SR = sa2.aRand.array; chainStream.material.uniforms.uOpacity.value = handoff ? 1 : 0.75;
    const lift2 = handoff ? 70 : 25; const n2 = handoff ? CH_N : CH_N >> 1;
    for (let i = 0; i < CH_N; i++) { if (i >= n2) { SS[i] = 0; continue; } let u = (SR[i] + t * (handoff ? 0.3 : 0.45)) % 1; if (u > e) u = e * SR[i]; bez(pa, pb, lift2, u, tmp); const jit = (handoff ? 4 : 2) * Math.sin(u * Math.PI);
      SP[i * 3] = tmp.x + Math.sin(i * 12.9 + t * 3) * jit; SP[i * 3 + 1] = tmp.y + Math.cos(i * 7.1 + t * 2.5) * jit; SP[i * 3 + 2] = tmp.z + Math.sin(i * 3.3 + t * 2) * jit;
      fc.copy(ca2).lerp(cb2, u); SC[i * 3] = fc.r; SC[i * 3 + 1] = fc.g; SC[i * 3 + 2] = fc.b; SS[i] = 0.6 + 1.3 * Math.sin(u * Math.PI); }
    sa2.position.needsUpdate = sa2.aColor.needsUpdate = sa2.aSize.needsUpdate = true; }
  // node pulse + highlight
  shaktiSprites.forEach((sp, i) => { const hl = i === want ? 1.45 : 1; sp.scale.setScalar(15 * hl * (1 + 0.05 * Math.sin(t * 2 + i))); });

  updateAuras(t); composer.render(); updateLabels(scene);
}

// ------------------------------------------------------------------ boot
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load(`64px 'Tiro Devanagari Sanskrit'`, 'लं'), document.fonts.load(`600 20px 'Cormorant Garamond'`)]), new Promise((r) => setTimeout(r, 3500))]); } catch (e) {}
  // regenerate canvas-text textures after fonts are available
  for (const sp of shaktiSprites) { const s = D.SHAKTIS[sp.userData.idx]; sp.material.map = bijaTex(s.bija, D.FIELDS[s.field].color, D.FIELDS[s.field].key); sp.material.needsUpdate = true; }
  stageText(); showOverview(); setMorph(1); animate();
  window.__app = { now: () => clock.elapsedTime, setThogal, setStage, selectShakti, selectField, setMorph, focusShakti, focusCurrent, flyTo, setMode, setTummo, playThread, goPhase, stopChain, openOverlay, projectShakti: (i) => { const v = shaktiWorld(i, new THREE.Vector3()).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, getChain: () => chain && { i: chain.i, n: chain.phases.length, playing: chain.playing, form: chain.phases[chain.i].form }, topView: () => $('#topView').click(), resetView: () => $('#resetView').click(), camera, controls, state };
  setTimeout(() => { $('#loading').style.opacity = 0; setTimeout(() => $('#loading').remove(), 1000); }, 300);
  window.__ready = true;
}
boot();
