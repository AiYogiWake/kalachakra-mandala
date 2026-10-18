// The Human Maṇḍala — holographic seated figure with channels, wheels, drops, kati channel and a click-only tummo sequence.
import * as THREE from 'three';
import { TUMMO_STEPS } from './teachings.js';
import { createThogal3D, stellate, fresnelMat } from './thogal3d.js';

const TAU = Math.PI * 2;
// Heights (figure units; seated figure ≈ 100 tall)
export const H = { secret: 36, navel: 47, heart: 64, throat: 78, forehead: 89, crown: 98 };
const WHEELS = [
  { key: 'crown', y: H.crown, n: 32, c: '#f4f6ff', r: 6.5, name: 'Crown wheel' },
  { key: 'forehead', y: H.forehead, n: 16, c: '#9dffcf', r: 4.5, name: 'Forehead wheel (Kālacakra’s six)' },
  { key: 'throat', y: H.throat, n: 16, c: '#ff4a5a', r: 5.5, name: 'Throat wheel' },
  { key: 'heart', y: H.heart, n: 8, c: '#4f7bff', r: 6, name: 'Heart wheel' },
  { key: 'navel', y: H.navel, n: 64, c: '#ffd23a', r: 7, name: 'Navel wheel' },
  { key: 'secret', y: H.secret, n: 32, c: '#45ff8f', r: 5.5, name: 'Secret-place wheel' },
];

export function createHuman(K) {
  const { makePoints, glowSprite, makeLabel, lineMat, setFade } = K;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#02030a');
  const root = new THREE.Group(); scene.add(root);
  const pickables = [];
  const r = mulberry(5);

  // background stars
  { const n = 2500, p = makePoints(n, 6, 0.7, 1); const P = p.geometry.attributes.position.array, C = p.geometry.attributes.aColor.array, S = p.geometry.attributes.aSize.array;
    for (let i = 0; i < n; i++) { const th = r() * TAU, ph = Math.acos(2 * r() - 1), rr = 1500 + r() * 800; P.set([Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr, Math.sin(ph) * Math.sin(th) * rr], i * 3); const k = 0.4 + r() * 0.5; C.set([0.6 * k, 0.7 * k, k], i * 3); S[i] = 0.5 + r() * 2; } scene.add(p); }

  // ---------------- holographic body (seated meditation posture)
  const BODY_N = 9000; const body = makePoints(BODY_N, 1.35, 0.95, 0.2); root.add(body);
  const base = new Float32Array(BODY_N * 3); const part = new Uint8Array(BODY_N);
  const cap = (a, b, rad) => { const u = r(); const th = r() * TAU; const p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(...d); const n = [d[0] / l, d[1] / l, d[2] / l]; let s1 = Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]; const l1 = Math.hypot(...s1); s1 = s1.map((v) => v / l1);
    const s2 = [n[1] * s1[2] - n[2] * s1[1], n[2] * s1[0] - n[0] * s1[2], n[0] * s1[1] - n[1] * s1[0]]; return [p[0] + (s1[0] * Math.cos(th) + s2[0] * Math.sin(th)) * rad, p[1] + (s1[1] * Math.cos(th) + s2[1] * Math.sin(th)) * rad, p[2] + (s1[2] * Math.cos(th) + s2[2] * Math.sin(th)) * rad]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  function torsoW(y) { const k = [[38, 15, 11], [46, 13, 9], [55, 13.5, 8.5], [66, 16, 9], [73, 17.5, 8], [77, 9, 6]]; for (let i = 0; i < k.length - 1; i++) if (y <= k[i + 1][0]) { const t = (y - k[i][0]) / (k[i + 1][0] - k[i][0]); return [lerp(k[i][1], k[i + 1][1], t), lerp(k[i][2], k[i + 1][2], t)]; } return [9, 6]; }
  for (let i = 0; i < BODY_N; i++) {
    const q = r(); let p, pt = 0;
    if (q < 0.11) { const th = r() * TAU, ph = Math.acos(2 * r() - 1); p = [Math.sin(ph) * Math.cos(th) * 7.6, 88 + Math.cos(ph) * 9.6, Math.sin(ph) * Math.sin(th) * 8.6]; if (r() < 0.6) p[1] = Math.round(p[1] / 1.6) * 1.6; pt = 1; }
    else if (q < 0.19) p = cap([0, 76, -0.5], [0, 81, 0], 3.6);
    else if (q < 0.52) { let y = 38 + r() * 39; if (r() < 0.65) y = Math.round(y / 1.8) * 1.8; const [w, d] = torsoW(y); const th = r() * TAU; const c = Math.cos(th), s = Math.sin(th); const k = Math.pow(Math.abs(c), 0.7) * Math.sign(c), k2 = Math.pow(Math.abs(s), 0.7) * Math.sign(s); p = [k * w, y, k2 * d + 0.5]; pt = 2; }
    else if (q < 0.6) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 16.5, 73, 0], [s * 20, 52, 4], 3.6); }
    else if (q < 0.68) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 20, 52, 4], [s * 6, 40, 13], 3.0); }
    else if (q < 0.71) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 6, 40, 13], [s * 1, 41, 15], 3.2); }
    else if (q < 0.84) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 8, 38, 1], [s * 30, 31, 12], 6); }
    else if (q < 0.95) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 30, 31, 12], [-s * 9, 33, 21], 4.5); }
    else { const th = r() * TAU, rr = 40 + r() * 2; p = [Math.cos(th) * rr, 27, Math.sin(th) * rr]; pt = 3; }
    base.set(p, i * 3); part[i] = pt;
  }
  body.geometry.attributes.position.array.set(base);
  const bodyCol = new THREE.Color('#58d8ff');

  // ---------------- channels
  function centralPath(u) { // u 0..1 bottom→brow
    const yTop = H.crown; if (u < 0.88) { const y = lerp(H.secret, yTop, u / 0.88); return [0, y, 0.6]; }
    const v = (u - 0.88) / 0.12; const a = v * Math.PI * 0.6; return [0, yTop - (1 - Math.cos(a)) * 6 + 0, 0.6 + Math.sin(a) * 7.6]; }
  const knots = [H.crown - 3, H.throat, H.heart, H.navel];
  function sidePath(s, u, knot) { // u 0..1 from nostril → over crown → down → join below navel
    if (u < 0.12) { const v = u / 0.12; return [s * lerp(1.4, 2.6, v), lerp(85, 96, v), lerp(8, 1.5, v)]; }
    if (u < 0.9) { const v = (u - 0.12) / 0.78; const y = lerp(96, H.navel - 3, v); let x = s * 2.6, z = 0.6; for (const k of knots) { const d = y - k; if (Math.abs(d) < 2.6) { const a = (d / 2.6) * Math.PI; const amp = knot * (k === H.heart ? 1 : 0.7); x = s * 2.6 * Math.cos(a * amp) ; z = 0.6 + 2.6 * Math.sin(a * amp) * s; } } return [x, y, z]; }
    const v = (u - 0.9) / 0.1; return [s * 2.6 * (1 - v), H.navel - 3 - v * 3, 0.6]; }
  const CH_N = 2400; const channels = makePoints(CH_N, 0.9, 1, 0); root.add(channels);
  const cBlue = new THREE.Color('#3d7bff'), cRed = new THREE.Color('#ff3344'), cWhite = new THREE.Color('#f2f6ff');
  // wheels
  const wheelObjs = WHEELS.map((w) => { const n = 260, p = makePoints(n, 0.9, 1, 0.3); const P = p.geometry.attributes.position.array, C = p.geometry.attributes.aColor.array; const c = new THREE.Color(w.c);
    for (let i = 0; i < n; i++) { const th = i / n * TAU; const petal = Math.pow(Math.abs(Math.cos(th * w.n / 2)), 0.6); const rr = w.r * (0.35 + 0.65 * (i % 3 === 0 ? 1 : petal * (0.5 + 0.5 * ((i * 7) % 5) / 5))); P.set([Math.cos(th) * rr, 0, Math.sin(th) * rr], i * 3); C.set([c.r, c.g, c.b], i * 3); }
    const g = new THREE.Group(); g.position.set(0, w.y, 0.6); g.add(p); const hit = glowSprite(w.c, 5, 0.6, 0.3); hit.userData = { type: 'h_wheel', key: w.key, name: w.name }; g.add(hit); pickables.push(hit);
    if (w.key === 'forehead') { g.rotation.x = Math.PI / 2; g.position.z = 6.5; } root.add(g); return { g, p, w }; });
  // drops & syllables
  const ham = makeLabel('हं', '', '#ffffff', 6, { px: 18, prio: 3 }); ham.material.rotation = Math.PI; ham.position.set(0, H.crown - 1.5, 0.6); root.add(ham);
  const shortA = makeLabel('अ', '', '#ff5030', 4.5, { px: 17, prio: 3 }); shortA.position.set(0, H.navel, 1.2); root.add(shortA);
  const heartDrop = new THREE.Group(); heartDrop.position.set(0, H.heart, 0.6); root.add(heartDrop);
  const dW = glowSprite('#ffffff', 3.2, 1, 0.4); dW.position.y = 0.6; const dR = glowSprite('#ff3040', 3.2, 1, 0.4); dR.position.y = -0.6; const dGlow = glowSprite('#ffd27a', 9, 0.6, 0.1); heartDrop.add(dGlow, dW, dR);
  dGlow.userData = { type: 'h_drops' }; pickables.push(dGlow);
  // labels for channels (pickable)
  const labUma = makeLabel('', 'central channel · uma', '#7aa8ff', 3.2); labUma.position.set(-20, 68, 2); root.add(labUma); labUma.userData.type = 'h_uma'; pickables.push(labUma);
  const labRoma = makeLabel('', 'roma (right)', '#ff6070', 3); labRoma.position.set(11, 101, 2); root.add(labRoma); labRoma.userData.type = 'h_roma'; pickables.push(labRoma);
  const labKy = makeLabel('', 'kyangma (left)', '#f2f6ff', 3); labKy.position.set(-17, 92, 2); root.add(labKy); labKy.userData.type = 'h_kyangma'; pickables.push(labKy);
  const labKati = makeLabel('', 'kati crystal channel', '#bff4ff', 3); labKati.position.set(-19, 78, 10); root.add(labKati); labKati.userData.type = 'h_kati'; pickables.push(labKati);
  [labUma, labRoma, labKy, labKati].forEach((l) => l.userData.isLabel = true);
  // kaya halos
  const kayas = new THREE.Group(); root.add(kayas);
  [['OṂ · nirmāṇakāya', '#f4f6ff', H.forehead, 'body'], ['ĀḤ · sambhogakāya', '#ff4a5a', H.throat, 'speech'], ['HŪṂ · dharmakāya', '#4f7bff', H.heart, 'mind']].forEach(([t, c, y]) => {
    const s = glowSprite(c, 16, 0.35, 0.2); s.position.set(0, y, 1); s.userData = { type: 'h_kayas' }; kayas.add(s); pickables.push(s); const l = makeLabel('', t, c, 3.4); l.position.set(33, y, 4); kayas.add(l); });
  // kati channel (two crystal tubes heart → eyes)
  const katiPath = (s, u) => { const a = [0, H.heart, 0.8], m = [s * 1.6, 76, 4.5], b = [s * 3.1, 88.5, 7.6]; const iu = 1 - u; return [iu * iu * a[0] + 2 * iu * u * m[0] + u * u * b[0], iu * iu * a[1] + 2 * iu * u * m[1] + u * u * b[1], iu * iu * a[2] + 2 * iu * u * m[2] + u * u * b[2]]; };
  const KATI_N = 900; const kati = makePoints(KATI_N, 0.8, 0, 0); root.add(kati);
  // effects particles: winds, flame, white drops, joys, dissolve, visions, rainbow
  const FX_N = 3000; const fx = makePoints(FX_N, 1.0, 1, 0); root.add(fx);
  const clear = glowSprite('#d6e6ff', 260, 0, 0.02); clear.position.set(0, 60, 0); root.add(clear);
  const joyLabels = ['Joy', 'Supreme joy', 'Special joy', 'Innate joy'].map((t, k) => { const l = makeLabel('', t, '#fff2c0', 3.2); l.position.set(22, [H.throat, H.heart, H.navel, H.secret][k], 6); root.add(l); return l; });
  // matrix cage
  const cage = new THREE.Group(); root.add(cage); const cageSegs = [];
  { const pts = []; const R0 = 70; for (let y = 0; y <= 140; y += 14) for (let k = 0; k < 4; k++) { const a = [[-R0, -R0], [R0, -R0], [R0, R0], [-R0, R0]]; const p0 = a[k], p1 = a[(k + 1) % 4]; for (let s = 0; s < 5; s++) { pts.push([p0[0] + (p1[0] - p0[0]) * s / 5, y, p0[1] + (p1[1] - p0[1]) * s / 5], [p0[0] + (p1[0] - p0[0]) * (s + 1) / 5, y, p0[1] + (p1[1] - p0[1]) * (s + 1) / 5]); } }
    for (let k = -R0; k <= R0; k += 28) for (const side of [-1, 1]) { pts.push([k, 0, side * R0], [k, 140, side * R0]); pts.push([side * R0, 0, k], [side * R0, 140, k]); }
    for (let i = 0; i < pts.length; i += 2) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1])]); const l = new THREE.Line(g, lineMat('#2bff9a', 0.1)); const mid = new THREE.Vector3((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, (pts[i][2] + pts[i + 1][2]) / 2); l.userData.dir = mid.clone().sub(new THREE.Vector3(0, 60, 0)).normalize(); l.userData.spin = (Math.random() - .5) * 2; cage.add(l); cageSegs.push(l); } }
  const title = makeLabel('मानुषमण्डल', 'The Human Maṇḍala — three kāyas', '#ffd36b', 7, { px: 16, maxDist: 2000, prio: 5 }); title.position.set(0, 10, 30); root.add(title);

  // ---------------- THÖGAL: karmic “code” as sentient geometry (metaphor), five-light mandalas, night sky, rainbow body
  const SILVER = new THREE.Color('#b9d0ff'), WHITE = new THREE.Color('#ffffff'), FC = new THREE.Color();
  const G = new THREE.Vector3(0, H.heart + 120, 0.6); // the same ground the phowa drop reaches
  const thog = new THREE.Group(); root.add(thog);
  const FORM_N = 24, DISSOLVED = [3, 9, 15, 21, 24], STOPPED = [6, 13, 20, 24, 24];
  const forms = [];
  const lineSegs = (geo, c, o) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(c, o));
  function ringGeo(r0, n = 48) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU; pts.push(new THREE.Vector3(Math.cos(a) * r0, Math.sin(a) * r0, 0), new THREE.Vector3(Math.cos(b) * r0, Math.sin(b) * r0, 0)); } return new THREE.BufferGeometry().setFromPoints(pts); }
  // each form: silver edges + translucent fresnel faces + an inner luminous core (true 3D polyhedra, stellated and nested)
  const coreGeo = new THREE.SphereGeometry(1, 16, 12);
  function makeForm(k) { const g = new THREE.Group(); const kind = k % 8;
    const solid = (geo, s = 1, nest = 0) => { const e = lineSegs(geo, '#b9d0ff', 0.55); const f = new THREE.Mesh(geo, fresnelMat({ color: '#b9d0ff', pow: 2.4, base: 0.04, opacity: 0.6 })); f.userData.fres = 1; const h = new THREE.Group(); h.add(e, f); h.scale.setScalar(s); h.userData.nest = nest; g.add(h); return h; };
    if (kind === 0) solid(new THREE.IcosahedronGeometry(1));
    else if (kind === 1) { solid(new THREE.DodecahedronGeometry(1)); solid(new THREE.IcosahedronGeometry(0.55), 1, 1); } // dodecahedron holding an icosahedron
    else if (kind === 2) { solid(new THREE.TetrahedronGeometry(1.1)); const b = solid(new THREE.TetrahedronGeometry(1.1)); b.rotation.set(Math.PI, 0, Math.PI / 2); } // star tetrahedron
    else if (kind === 3) { [1, 0.64, 0.4].forEach((s, j) => solid(j % 2 ? new THREE.OctahedronGeometry(1) : new THREE.IcosahedronGeometry(1), s, j)); } // nested, counter-rotating
    else if (kind === 4) solid(stellate(new THREE.IcosahedronGeometry(0.7), 0.75)); // stellated icosahedron
    else if (kind === 5) solid(stellate(new THREE.OctahedronGeometry(0.75), 0.6)); // stellated octahedron
    else if (kind === 6) { solid(stellate(new THREE.DodecahedronGeometry(0.72), 0.45)); solid(new THREE.TetrahedronGeometry(0.4), 1, 2); } // stellated dodecahedron, tetra heart
    else { solid(new THREE.BoxGeometry(1.2, 1.2, 1.2)); const i2 = solid(new THREE.BoxGeometry(0.7, 0.7, 0.7), 1, 1); i2.rotation.set(0.6, 0.6, 0); } // tesseract-like
    const core = new THREE.Mesh(coreGeo, fresnelMat({ color: '#eef4ff', pow: 1.1, base: 0.3, opacity: 1 })); core.scale.setScalar(0.15); core.userData.core = 1; g.add(core);
    return g; }
  { const order = [...Array(FORM_N).keys()].sort((a, b) => ((a * 7919) % 31) - ((b * 7919) % 31));
    for (let k = 0; k < FORM_N; k++) { const g = makeForm(k); const y = 1 - (k + 0.5) / FORM_N * 2, rr = Math.sqrt(1 - y * y), th = k * 2.39996; const R0 = 42 + (k % 3) * 9;
      const home = new THREE.Vector3(Math.cos(th) * rr * R0, 62 + y * 44, Math.sin(th) * rr * R0 * 0.8); g.position.copy(home); const sc = 4 + (k % 4) * 1.4; g.scale.setScalar(sc);
      g.userData = { home, sc, order: order.indexOf(k), axis: new THREE.Vector3(Math.sin(k), 1, Math.cos(k * 1.3)).normalize(), arms: 2 + (k % 3), speed: 0.5 + (k % 5) * 0.18, rot: 0, d: 0, sp: 1 }; thog.add(g); forms.push(g); const ax = g.userData.axis; g.userData.e1 = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 0, 1)).normalize(); g.userData.e2 = new THREE.Vector3().crossVectors(ax, g.userData.e1).normalize(); } }
  const DUST_N = 2400; const dust = makePoints(DUST_N, 1.1, 0, 0.4); thog.add(dust);
  const FIVE = ['#3d6bff', '#f4f6ff', '#ffd23a', '#ff3a3a', '#3dff7a'].map((c) => new THREE.Color(c));
  const SKY_N = 2600; const sky = makePoints(SKY_N, 1.6, 0, 1); thog.add(sky);
  { const P = sky.geometry.attributes.position.array, C = sky.geometry.attributes.aColor.array, S = sky.geometry.attributes.aSize.array;
    for (let i = 0; i < SKY_N; i++) { const th = r() * TAU, ph = Math.acos(r() * 0.95), rr = 420 + r() * 200; P.set([Math.sin(ph) * Math.cos(th) * rr, 40 + Math.cos(ph) * rr * 0.8, -Math.abs(Math.sin(ph) * Math.sin(th) * rr) - 60], i * 3); const k2 = 0.5 + r() * 0.5; C.set([0.75 * k2, 0.85 * k2, k2], i * 3); S[i] = 0.4 + Math.pow(r(), 3) * 3; } }
  const moon = glowSprite('#cfe0ff', 140, 0, 0.06); moon.position.set(-170, 175, -260); thog.add(moon);
  const groundGlow = glowSprite('#ffffff', 26, 0, 0.15); groundGlow.position.copy(G); thog.add(groundGlow);
  const t3d = createThogal3D({ makePoints, glowSprite, lineMat, H, katiPath, G, parent: root, root, scene });
  const TS = { step: -1, t0: 0, rb: 0 }; const TV = { thog: 0, mand: 0, sky: 0 };
  K.state.thogal = { step: -1, stopped: 0, dissolved: 0, active: 0 };
  function setThogal(n, t) { setStep(-1, t); TS.step = n; TS.t0 = t; if (n < 0) return;
    T.channels = 0.35; T.kati = n <= 2 ? 1 : 0.3; T.visions = [1, 0.6, 0.3, 0, 0][n]; T.matrix = 1; T.hollow = 0.3; }
  function updateThogal(t, dt) {
    const on = TS.step >= 0; TV.thog = TV.thog + ((on ? 1 : 0) - TV.thog) * (1 - Math.exp(-dt * 2));
    thog.visible = TV.thog > 0.01; if (!thog.visible) { t3d.update({ on: false, step: 0, st: 0, t, dt, tv: 0, vis: V.visions, kati: V.kati, flash: 0, rb: 0, centres: [] }); TS.rb = 0; scene.background.set('#02030a'); K.state.thogal = { step: -1, stopped: 0, dissolved: 0, active: 0 }; return; }
    const n = Math.max(TS.step, 0), st = t - TS.t0; const prevD = n > 0 ? DISSOLVED[n - 1] : 0, prevS = n > 0 ? STOPPED[n - 1] : 0;
    const flash = TS.step === 3 ? Math.max(0, 1 - Math.abs(st - 1.2) / 1.2) : 0; // full spectrum at the breakthrough
    let stopped = 0, dissolved = 0, active = 0; const centres = [];
    for (const g of forms) { const u = g.userData, o = u.order; let d, sp;
      if (!on) { d = 1; sp = 0; }
      else { d = o < prevD ? 1 : o < DISSOLVED[n] ? Math.max(0, Math.min(1, (st - (n === 3 ? 2.2 : 0.6) - (o - prevD) * 0.45) / 1.2)) : 0;
        sp = o < prevS ? 0 : o < STOPPED[n] ? Math.max(0, 1 - (st - (o - prevS) * 0.3) / 1.5) : 1 - 0.2 * (n + 1); }
      u.d = d; u.sp = sp; u.rot += u.speed * Math.max(0, sp) * dt; g.quaternion.setFromAxisAngle(u.axis, u.rot);
      g.children.forEach((c) => { if (c.userData.nest) c.rotation.y = -u.rot * (1 + c.userData.nest); });
      g.scale.setScalar(u.sc * (1 + d * 0.9)); g.visible = d < 0.999;
      const op = (1 - d) * 0.6 * TV.thog; if (flash > 0) FC.setHSL((o / FORM_N + t * 0.2) % 1, 1, 0.6).lerp(SILVER, 1 - flash); else FC.copy(SILVER);
      g.traverse((c) => { if (!c.material) return; if (c.userData.core) { c.material.uniforms.uOpacity.value = (1 - d) * TV.thog * (0.25 + 0.3 * Math.max(0, sp)); c.material.uniforms.uColor.value.copy(FC).lerp(WHITE, 0.6); }
        else if (c.userData.fres) { c.material.uniforms.uOpacity.value = op * 0.4; c.material.uniforms.uColor.value.copy(FC); } else { c.material.opacity = op; c.material.color.copy(FC); } });
      if (on && sp <= 0.001) stopped++; if (on && d >= 0.999) dissolved++; if (on && d < 0.999) active++; centres.push([g.position, u, d, sp]); }
    K.state.thogal = { step: TS.step, stopped, dissolved, active };
    // dissolving dust: each form breaks into silver motes as it dissolves
    { const P = dust.geometry.attributes.position.array, C = dust.geometry.attributes.aColor.array, S = dust.geometry.attributes.aSize.array; dust.material.uniforms.uOpacity.value = TV.thog;
      for (let i = 0; i < DUST_N; i++) { const [p, u, d] = centres[i % FORM_N]; const q = (i * 0.618034) % 1, q2 = (i * 0.754877) % 1; const live = d > 0.001 && d < 0.999 ? Math.sin(d * Math.PI) : 0; const rr = u.sc * (1 + d * 4) * (0.4 + q);
        const th = q2 * TAU, ph = q * Math.PI; P[i * 3] = p.x + Math.sin(ph) * Math.cos(th) * rr; P[i * 3 + 1] = p.y + Math.cos(ph) * rr + d * 6; P[i * 3 + 2] = p.z + Math.sin(ph) * Math.sin(th) * rr;
        C[i * 3] = 0.8 * live; C[i * 3 + 1] = 0.88 * live; C[i * 3 + 2] = live; S[i] = 1.2 * live; }
      dust.geometry.attributes.position.needsUpdate = dust.geometry.attributes.aColor.needsUpdate = dust.geometry.attributes.aSize.needsUpdate = true; }
    // spacious moonlit night sky (IV–V), moon glow throughout
    TV.sky = TV.sky + ((TS.step >= 3 ? 1 : TS.step >= 0 ? 0.25 : 0) - TV.sky) * (1 - Math.exp(-dt * 1.2)); sky.material.uniforms.uOpacity.value = TV.sky; moon.material.opacity = TV.thog * (0.12 + 0.18 * TV.sky);
    scene.background.setRGB(0.008 + 0.01 * TV.sky, 0.012 + 0.018 * TV.sky, 0.04 + 0.05 * TV.sky);
    // rainbow body: the figure thins into rainbow light and gathers on the phowa ground
    const rb = TS.step === 4 ? Math.min(1, st / 9) : 0; TS.rb = rb; K.state.thogal.rainbow = rb;
    groundGlow.material.opacity = rb > 0 ? Math.min(0.9, rb * 1.4) : 0; groundGlow.scale.setScalar(14 + rb * 30);
    t3d.update({ on, step: n, st, t, dt, tv: TV.thog, vis: V.visions, kati: V.kati, flash, rb, centres });
  }
  // ---------------- state
  const V = { scan: 0, hollow: 0, channels: 0.6, purify: 0, winds: 0, vase: 0, flame: 0, ham: 0, joys: 0, heart: 0, dissolve: 0, clear: 0, kati: 0, visions: 0, matrix: 0, rainbow: 0, phowa: 0 };
  const T = { ...V }; let step = -1, stepT0 = 0, showKayas = true;
  function setStep(n, t) { step = n; stepT0 = t; TS.step = -1; for (const k in T) T[k] = 0; T.channels = 0.6; const vis = n >= 0 ? TUMMO_STEPS[n].vis : {}; for (const k in vis) T[k] = vis[k]; if (n < 0) { T.channels = 0.6; } }
  setStep(-1, 0);
  const tmp = [0, 0, 0];
  function update(t, dt) {
    const k = 1 - Math.exp(-dt * 2.2); for (const key in V) V[key] += (T[key] - V[key]) * k;
    const st = t - stepT0;
    // phowa progress (only after its step is clicked)
    const ph = step >= 0 && TUMMO_STEPS[step].key === 'phowa' ? Math.min(1, st / (K.phowaDur || 7)) : 0;
    // body hologram
    { const P = body.geometry.attributes.position.array, C = body.geometry.attributes.aColor.array; const scanY = ((t * 18) % 160) - 20; const fadeB = (1 - V.clear * 0.6 - V.dissolve * 0.3) * (1 - 0.4 * TV.thog * (TS.rb > 0 ? 0 : 1));
      for (let i = 0; i < BODY_N; i++) { let x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        if (V.dissolve > 0.01) { const f = V.dissolve * 0.35 * (0.5 + 0.5 * Math.sin(i)); x += (0 - x) * f; y += (H.heart - y) * f; z += (0.6 - z) * f; }
        if (TS.rb > 0) { const f = Math.max(0, Math.min(1, TS.rb * 1.5 - (i % 97) / 97 * 0.5)); const e = f * f; const a = i * 2.39996; x += (G.x + Math.cos(a) * 6 * (1 - e * 0.5) - x) * e; y += (G.y + Math.sin(i) * 5 - y) * e; z += (G.z + Math.sin(a) * 6 - z) * e; }
        if (ph > 0) { const f = Math.max(0, ph * 1.4 - (i % 97) / 97 * 0.4); y += f * f * (40 + (i % 53)); x *= 1 + f * 0.6; z *= 1 + f * 0.6; }
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        let c0 = bodyCol.r, c1 = bodyCol.g, c2 = bodyCol.b; if (TV.thog > 0.01 && !(TS.rb > 0)) { c0 += (SILVER.r - c0) * TV.thog; c1 += (SILVER.g - c1) * TV.thog; c2 += (SILVER.b - c2) * TV.thog; }
        if (V.rainbow > 0.01 || ph > 0 || TS.rb > 0) { const hue = (y / 120 + t * 0.08) % 1; const q = new THREE.Color().setHSL(hue, 0.9, 0.6); const m = Math.max(V.rainbow, ph, TS.rb > 0 ? Math.min(1, TS.rb * 3) : 0); c0 += (q.r - c0) * m; c1 += (q.g - c1) * m; c2 += (q.b - c2) * m; }
        const sc = Math.exp(-Math.pow((y - scanY) / 3, 2)) * (0.6 + V.scan * 0.8); const b = (0.62 + (part[i] === 3 ? 0.1 : 0) + sc) * fadeB * (1 - ph * 0.85) * (1 - V.hollow * 0.35) * (1 - (TS.rb || 0) * 0.6);
        C[i * 3] = c0 * b + sc * 0.3; C[i * 3 + 1] = c1 * b + sc * 0.3; C[i * 3 + 2] = c2 * b + sc * 0.3; }
      body.geometry.attributes.position.needsUpdate = body.geometry.attributes.aColor.needsUpdate = true; }
    // channels
    { const P = channels.geometry.attributes.position.array, C = channels.geometry.attributes.aColor.array, S = channels.geometry.attributes.aSize.array; const knot = 1 - V.heart; const glow = Math.max(V.channels, V.hollow);
      for (let i = 0; i < CH_N; i++) { const which = i % 3, u0 = (i / CH_N); const flow = (u0 * 3 + t * 0.12 * (which ? -1 : 1)) % 1; const u = which === 0 ? (u0 * 3) % 1 : (u0 * 3) % 1;
        const p = which === 0 ? centralPath(u) : sidePath(which === 1 ? 1 : -1, u, knot); P.set(p, i * 3);
        const col = which === 0 ? cBlue : which === 1 ? cRed : cWhite; const pulse = 0.6 + 0.4 * Math.pow(Math.max(0, Math.sin((u - t * 0.3 * (which ? 1 : -1)) * 30)), 6);
        const sideFade = which ? (1 - V.dissolve * 0.8) * (1 - ph) : 1; const b = glow * pulse * sideFade * (which === 0 ? 0.8 + V.flame * 0.3 : 0.75); C.set([col.r * b, col.g * b, col.b * b], i * 3); S[i] = which === 0 ? 0.8 : 0.65; }
      channels.geometry.attributes.position.needsUpdate = channels.geometry.attributes.aColor.needsUpdate = channels.geometry.attributes.aSize.needsUpdate = true; }
    wheelObjs.forEach((o, i) => { const open = o.w.key === 'heart' ? 1 + V.heart * 1.2 : 1; o.g.rotation.y = o.w.key === 'forehead' ? 0 : t * 0.3 * (i % 2 ? 1 : -1); o.g.scale.setScalar(open); setFade(o.g, Math.max(0.15, V.channels) * (1 - ph * 0.8)); });
    ham.material.opacity = 0.3 + 0.7 * Math.max(V.ham, V.channels * 0.5); shortA.material.opacity = 0.3 + 0.7 * Math.max(V.flame, V.channels * 0.5);
    heartDrop.scale.setScalar(1 + V.dissolve * 1.2 + V.clear * 0.8); dGlow.material.opacity = 0.4 + V.heart * 0.4 + V.dissolve * 0.4;
    if (ph > 0) { const y = H.heart + Math.pow(ph, 1.6) * 120; heartDrop.position.y = y; heartDrop.scale.setScalar(1.6 + ph * 2); } else heartDrop.position.y = H.heart;
    kayas.visible = showKayas && step < 9 && TS.step < 0; setFade(kayas, 0.9 * (1 - V.clear));
    joyLabels.forEach((l, i) => { const on = V.joys > 0.6 && st > 1 + i * 1.6; l.visible = on && l.userData.isLabel !== false; l.material.opacity = on ? 0.95 : 0; });
    clear.material.opacity = V.clear * 0.35 + ph * 0.3; clear.visible = clear.material.opacity > 0.01; clear.position.y = 60 + ph * 60;
    // kati channel
    { const P = kati.geometry.attributes.position.array, C = kati.geometry.attributes.aColor.array; kati.material.uniforms.uOpacity.value = Math.max(V.kati, 0.18);
      for (let i = 0; i < KATI_N; i++) { const s = i % 2 ? 1 : -1; const u = ((i / KATI_N) * 2 + (i % 4 < 2 ? t * 0.35 * V.kati : 0)) % 1; const p = katiPath(s, u); P.set(p, i * 3); const b = 0.6 + 0.6 * Math.pow(Math.max(0, Math.sin((u - t * 0.6) * 18)), 4) * V.kati; C.set([0.7 * b, 0.95 * b, 1.0 * b], i * 3); }
      kati.geometry.attributes.position.needsUpdate = kati.geometry.attributes.aColor.needsUpdate = true; }
    // fx particles
    { const P = fx.geometry.attributes.position.array, C = fx.geometry.attributes.aColor.array, S = fx.geometry.attributes.aSize.array;
      for (let i = 0; i < FX_N; i++) { const g = i % 6; const q = (i * 0.6180339) % 1; let x = 0, y = -999, z = 0, c = [0, 0, 0], s = 0;
        if (g === 0 && (V.purify + V.winds) > 0.05) { const u = (q + t * 0.25) % 1; const side = i % 12 < 6 ? 1 : -1; if (u < 0.3) { const v = u / 0.3; x = side * (1.4 + (1 - v) * 10 * Math.sin(q * 30)); y = 85 + (1 - v) * 6 * Math.cos(q * 20); z = 8 + (1 - v) * 30; } else { const p = sidePath(side, (u - 0.3) / 0.7 * 0.9 + 0.1, 1 - V.heart); x = p[0]; y = p[1]; z = p[2]; } c = side > 0 ? [1, 0.4, 0.45] : [0.85, 0.95, 1]; s = (V.purify + V.winds) * 0.9; }
        else if (g === 1 && V.vase > 0.05) { const u = (q + t * 0.2) % 1; y = H.secret - 6 + u * 13; x = Math.sin(q * 40 + t) * 3 * (1 - u); z = 0.6 + Math.cos(q * 40 + t) * 3 * (1 - u); c = [0.6, 1, 0.8]; s = V.vase; }
        else if (g === 2 && V.flame > 0.05) { const reach = V.flame * Math.min(1, st / 3 + (TUMMO_STEPS[step]?.key === 'flame' ? 0 : 1)); const u = (q + t * 0.9) % 1 * reach; y = H.navel + u * (H.crown - H.navel); const fl = 0.7 * (1 - u / Math.max(reach, 0.01)); x = Math.sin(t * 9 + q * 60) * fl; z = 0.6 + Math.cos(t * 7 + q * 50) * fl; const w = 1 - u; c = [1, 0.35 + 0.5 * w, 0.1 * w]; s = 1.3 * V.flame; }
        else if (g === 3 && V.ham > 0.05) { const u = (q + t * 0.35) % 1; y = H.crown - 2 - u * (H.crown - H.secret - 2) * Math.max(V.joys, 0.35); x = Math.sin(q * 70) * 0.4; z = 0.6; c = [1, 1, 1]; s = V.ham * 1.3 * (q < 0.5 ? 1 : 0.5); }
        else if (g === 4 && (V.dissolve > 0.05 || V.heart > 0.05)) { const u = (q + t * 0.3) % 1; const R0 = (1 - u) * (V.dissolve > 0.05 ? 50 : 14); const th = q * 400 + u * 6; x = Math.cos(th) * R0; y = H.heart + Math.sin(q * 90) * R0 * 0.6; z = 0.6 + Math.sin(th) * R0; const cyc = Math.floor((st / 1.8) % 3); c = V.dissolve > 0.05 ? [[1, 1, 1], [1, 0.25, 0.2], [0.25, 0.25, 0.4]][cyc] : [0.4, 0.6, 1]; s = Math.max(V.dissolve, V.heart * 0.6); }
        else if (g === 5 && ph > 0) { const u = (q + t * 0.4) % 1; y = H.heart + u * 180 * ph; x = Math.sin(q * 80 + u * 6) * 4 * u; z = 0.6 + Math.cos(q * 80 + u * 6) * 4 * u; c = [1, 0.95, 0.7]; s = 1.4 * ph; }
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; C.set(c, i * 3); S[i] = s; }
      fx.geometry.attributes.position.needsUpdate = fx.geometry.attributes.aColor.needsUpdate = fx.geometry.attributes.aSize.needsUpdate = true; }
    // matrix cage
    cageSegs.forEach((l) => { const m = V.matrix; l.position.copy(l.userData.dir).multiplyScalar(m * m * 120); l.rotation.y = m * l.userData.spin; l.material.opacity = 0.1 * (1 - m) + (m > 0.01 && m < 0.95 ? 0.15 * Math.sin(m * Math.PI) : 0); l.visible = l.material.opacity > 0.01; });
    updateThogal(t, dt);
    labels(t);
  }
  function labels() { [labUma, labRoma, labKy, labKati].forEach((l) => { l.visible = K.state.labels && TS.step < 3; }); }
  return { scene, root, update, setStep, setThogal, get thogalStep() { return TS.step; }, groundPoint: G, pickables, get step() { return step; }, get stepT0() { return stepT0; }, setKayas(v) { showKayas = v; }, home: { pos: new THREE.Vector3(0, 78, 175), target: new THREE.Vector3(0, 62, 0) } };
}
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
