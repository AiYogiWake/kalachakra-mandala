// Thögal visions in depth: nested five-light thigle, helical vajra chains, the crystal kati tube with light streaming outward,
// galactic vortexes, five-coloured mandala palaces of light, the 360° breakthrough, the fold-back into the heart and the rainbow body.
// All of this is a visual metaphor — "code" is drawn as geometry and light, never as digits.
import * as THREE from 'three';
const TAU = Math.PI * 2;
// five lights, outer shell → inner core
export const FIVE_HEX = ['#3d6bff', '#3dff7a', '#ff3a3a', '#ffd23a', '#f4f6ff'];
const FIVE = FIVE_HEX.map((c) => new THREE.Color(c));
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (i, k = 1) => { const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453; return s - Math.floor(s); };

export function fresnelMat({ color = '#ffffff', pow = 2.2, base = 0.06, opacity = 1 } = {}) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uPow: { value: pow }, uBase: { value: base }, uNear: { value: 200 }, uFar: { value: 900 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vC; varying float vD;
      void main() { vec4 p = vec4(position, 1.0); vec3 n = normal; vC = vec3(1.0);
      #ifdef USE_INSTANCING
        p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
      #endif
      #ifdef USE_INSTANCING_COLOR
        vC = instanceColor;
      #endif
        vec4 mv = modelViewMatrix * p; vN = normalize(normalMatrix * n); vV = normalize(-mv.xyz); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity, uPow, uBase, uNear, uFar; varying vec3 vN; varying vec3 vV; varying vec3 vC; varying float vD;
      void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow); float fog = 1.0 - 0.85 * smoothstep(uNear, uFar, vD);
        gl_FragColor = vec4(uColor * vC * (f + uBase) * uOpacity * fog, 1.0); }`,
  });
  return m;
}
// stellate any polyhedron: raise a spike over every face
export function stellate(geo, h) {
  const g = geo.index ? geo.toNonIndexed() : geo; const P = g.attributes.position.array; const out = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 9) { a.fromArray(P, i); b.fromArray(P, i + 3); c.fromArray(P, i + 6); m.copy(a).add(b).add(c).divideScalar(3);
    n.copy(b).sub(a).cross(c.clone().sub(a)).normalize(); const apex = m.clone().addScaledVector(n, h);
    for (const [p, q] of [[a, b], [b, c], [c, a]]) out.push(p.x, p.y, p.z, q.x, q.y, q.z, apex.x, apex.y, apex.z); }
  const s = new THREE.BufferGeometry(); s.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); s.computeVertexNormals(); return s;
}

export function createThogal3D(ctx) {
  const { makePoints, glowSprite, lineMat, H, katiPath, G, parent, root, scene } = ctx;
  const HEART = new THREE.Vector3(0, H.heart, 0.6);
  const EYES = [katiPath(-1, 1), katiPath(1, 1)].map((p) => new THREE.Vector3(...p));
  const grp = new THREE.Group(); parent.add(grp);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), V = new THREE.Vector3(), C = new THREE.Color();
  const bez = (a, c, b, u, out) => { const iu = 1 - u; return out.set(iu * iu * a.x + 2 * iu * u * c.x + u * u * b.x, iu * iu * a.y + 2 * iu * u * c.y + u * u * b.y, iu * iu * a.z + 2 * iu * u * c.z + u * u * b.z); };

  // ---------- thigle: nested spheres of five-coloured light in a deep field
  const TH_N = 72, RADII = [1, 0.8, 0.61, 0.43, 0.25];
  const sph = new THREE.SphereGeometry(1, 30, 20);
  const shells = new THREE.InstancedMesh(sph, fresnelMat({ pow: 2.1, base: 0.035 }), TH_N * 5); shells.frustumCulled = false;
  const cores = new THREE.InstancedMesh(sph, fresnelMat({ color: '#ffffff', pow: 0.9, base: 0.55 }), TH_N); cores.frustumCulled = false;
  for (let i = 0; i < TH_N * 5; i++) shells.setColorAt(i, C.setRGB(0, 0, 0)); for (let i = 0; i < TH_N; i++) cores.setColorAt(i, C.setRGB(0, 0, 0));
  grp.add(shells, cores);
  const TH = [];
  for (let i = 0; i < TH_N; i++) { const near = i < 12; // the first dozen float right in front of the face
    const p = near ? new THREE.Vector3((hash(i, 2) < 0.5 ? -1 : 1) * (14 + hash(i, 7) * 30), 70 + hash(i, 3) * 44, 16 + hash(i, 4) * 34)
      : new THREE.Vector3((hash(i, 2) - 0.5) * 230, 46 + hash(i, 3) * 120, -170 + hash(i, 4) * 260);
    TH.push({ p, s: near ? 1.6 + hash(i, 5) * 1.8 : 2.6 + hash(i, 5) * 5, ph: hash(i, 6) * TAU, d: p.distanceTo(EYES[0]) }); }
  TH.sort((a, b) => a.d - b.d);
  const glowCore = TH.map(() => 0);

  // ---------- vajra chains: double-helix strands of beads strung on catenaries that sway through the field
  const CH_N = 10, BEADS = 44, CH_SEG = 72;
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), fresnelMat({ color: '#dfe9ff', pow: 1.5, base: 0.16 }), CH_N * 2 * BEADS); beads.frustumCulled = false;
  for (let i = 0; i < CH_N * 2 * BEADS; i++) beads.setColorAt(i, C.setRGB(0, 0, 0)); grp.add(beads);
  const chainLineGeo = new THREE.BufferGeometry(); chainLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CH_N * 2 * CH_SEG * 6), 3));
  const chainLines = new THREE.LineSegments(chainLineGeo, lineMat('#b9d0ff', 0.4)); chainLines.frustumCulled = false; grp.add(chainLines);
  const CH = [];
  for (let k = 0; k < CH_N; k++) { const near = k < 3; const cz = near ? 26 + k * 14 : -140 + hash(k, 9) * 200; const cy = near ? 84 + k * 8 : 60 + hash(k, 8) * 90; const len = near ? 52 : 90 + hash(k, 7) * 90;
    const ang = (hash(k, 6) - 0.5) * 1.2; const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang) * 0.5, (hash(k, 5) - 0.5) * 0.8).normalize();
    const mid = new THREE.Vector3((hash(k, 4) - 0.5) * (near ? 20 : 160), cy, cz);
    const A = mid.clone().addScaledVector(dir, -len / 2), B = mid.clone().addScaledVector(dir, len / 2);
    const nrm = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(); if (nrm.lengthSq() < 0.1) nrm.set(0, 0, 1); const bin = new THREE.Vector3().crossVectors(dir, nrm).normalize();
    CH.push({ A, B, dir, nrm, bin, len, sag: len * 0.16, turns: near ? 5 : 7, rad: near ? 1.3 : 2.4, ph: hash(k, 3) * TAU, near }); }
  const chainPoint = (c, u, t, out) => { out.copy(c.A).lerp(c.B, u); out.y -= c.sag * 4 * u * (1 - u); const w = Math.sin(u * 7 - t * 0.9 + c.ph) * c.len * 0.07; out.addScaledVector(c.bin, w); out.addScaledVector(c.nrm, Math.cos(u * 5 - t * 0.6 + c.ph) * c.len * 0.05); return out; };

  // ---------- kati channel: crystal tube heart → eyes, with light flowing outward
  const katiTubes = [-1, 1].map((s) => { const pts = []; for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(...katiPath(s, i / 16)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.62, 12, false), fresnelMat({ color: '#d8ecff', pow: 1.4, base: 0.1, opacity: 0 })); grp.add(m); return m; });
  root.add(...katiTubes); // the crystal tube belongs to the body, visible in tummo too
  const eyeGlow = EYES.map((p) => { const g = glowSprite('#e6f0ff', 7, 0, 0.1); g.position.copy(p); root.add(g); return g; });
  const STREAM_N = 1800; const stream = makePoints(STREAM_N, 0.9, 0, 0.2); grp.add(stream);

  // ---------- galactic vortexes (thick 3D spirals whose plane is set by each form's own axis)
  const VORT_N = 9000; const vort = makePoints(VORT_N, 0.8, 0, 0.3); grp.add(vort);
  const vRand = new Float32Array(VORT_N * 4); for (let i = 0; i < VORT_N * 4; i++) vRand[i] = hash(i + 1, 1.7);

  // ---------- mandala palaces of light (five-coloured tiers); 5 near in vision II, 40 filling the sky sphere in III
  function palaceGeos() { const L = [[], [], [], [], []]; const seg = (j, a, b) => L[j].push(...a, ...b);
    // tier 0: double circle of light (outer protection ring)
    for (const rr of [1.22, 1.12]) for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, b = (i + 1) / 64 * TAU; seg(0, [Math.cos(a) * rr, 0, Math.sin(a) * rr], [Math.cos(b) * rr, 0, Math.sin(b) * rr]); }
    // petals of tier 0
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, b = (i + 0.5) / 16 * TAU, c = (i + 1) / 16 * TAU; seg(0, [Math.cos(a) * 1.0, 0.02, Math.sin(a) * 1.0], [Math.cos(b) * 1.12, 0.02, Math.sin(b) * 1.12]); seg(0, [Math.cos(b) * 1.12, 0.02, Math.sin(b) * 1.12], [Math.cos(c) * 1.0, 0.02, Math.sin(c) * 1.0]); }
    // tiers 1–4: stepped square walls, rising toward the centre; gates on tier 1
    for (let j = 1; j <= 4; j++) { const w = 0.86 - (j - 1) * 0.19, y0 = (j - 1) * 0.14, y1 = y0 + 0.11; const c = [[-w, -w], [w, -w], [w, w], [-w, w]];
      for (let k = 0; k < 4; k++) { const p = c[k], q = c[(k + 1) % 4]; seg(j, [p[0], y0, p[1]], [q[0], y0, q[1]]); seg(j, [p[0], y1, p[1]], [q[0], y1, q[1]]); seg(j, [p[0], y0, p[1]], [p[0], y1, p[1]]); }
      if (j === 1) for (let k = 0; k < 4; k++) { const ax = [[0, -1], [1, 0], [0, 1], [-1, 0]][k]; const t = [-ax[1], ax[0]]; const g = 0.16, o = 0.2;
        const P = (s, d, y) => [ax[0] * (w + d) + t[0] * s, y, ax[1] * (w + d) + t[1] * s];
        seg(j, P(-g, 0, y1), P(-g, o, y1)); seg(j, P(g, 0, y1), P(g, o, y1)); seg(j, P(-g, o, y1), P(g, o, y1)); seg(j, P(-g, o, y0), P(-g, o, y1 + 0.08)); seg(j, P(g, o, y0), P(g, o, y1 + 0.08)); seg(j, P(-g * 1.4, o, y1 + 0.08), P(g * 1.4, o, y1 + 0.08)); } }
    // centre: a small dome / jewel of white light
    const top = [0, 0.82, 0]; const r0 = 0.16, yb = 0.53; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, b = (i + 1) / 8 * TAU; seg(4, [Math.cos(a) * r0, yb, Math.sin(a) * r0], [Math.cos(b) * r0, yb, Math.sin(b) * r0]); seg(4, [Math.cos(a) * r0, yb, Math.sin(a) * r0], top); }
    return L.map((a) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return g; }); }
  const PGEO = palaceGeos(); const PMAT = FIVE_HEX.map((c) => lineMat(c, 0.7));
  const PAL = [];
  const addPal = (pos, sc, up, near, k) => { const g = new THREE.Group(); PGEO.forEach((geo, j) => g.add(new THREE.LineSegments(geo, PMAT[j])));
    g.position.copy(pos); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up.clone().normalize()); g.userData = { pos: pos.clone(), sc, near, k, q0: g.quaternion.clone(), spin: (hash(k, 3) - 0.5) * 0.25 }; g.visible = false; grp.add(g); PAL.push(g); };
  { const camDir = new THREE.Vector3(0, 0.3, 1); addPal(new THREE.Vector3(0, 98, 40), 10, camDir, true, 0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + TAU / 8; addPal(new THREE.Vector3(Math.cos(a) * 34, 96 + Math.sin(a) * 26, 30 + (k % 2) * 16), 6.5, camDir, true, k + 1); }
    const CEN = new THREE.Vector3(0, 80, 0); let n = 0;
    for (let i = 0; n < 40 && i < 200; i++) { const y = 1 - (i + 0.5) / 60 * 2; if (y < -0.55) continue; const rr = Math.sqrt(1 - y * y), th = i * 2.39996; const d = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
      if (d.z > 0.45) continue; const R = 210 + hash(i, 2) * 120; addPal(CEN.clone().addScaledVector(d, R), 16 + hash(i, 4) * 12, d.clone().negate(), false, 5 + n); n++; } }
  const PPTS_N = 7000; const ppts = makePoints(PPTS_N, 0.9, 0, 0.5); grp.add(ppts);
  const pLocal = new Float32Array(PPTS_N * 4); // x,y,z,tier
  for (let i = 0; i < PPTS_N; i++) { const j = Math.floor(hash(i, 1.1) * 5), u = hash(i, 2.2), v = hash(i, 3.3); let x, y, z;
    if (j === 0) { const a = u * TAU, rr = 1.0 + v * 0.22; x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = 0; }
    else if (j < 4) { const w = 0.86 - (j - 1) * 0.19; const side = Math.floor(v * 4), s = u * 2 - 1; const c = [[s * w, -w], [w, s * w], [s * w, w], [-w, s * w]][side]; x = c[0]; z = c[1]; y = (j - 1) * 0.14 + hash(i, 4.4) * 0.11; }
    else { const a = u * TAU, rr = v * 0.3; x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = 0.45 + hash(i, 5.5) * 0.4 * (1 - rr * 2); }
    pLocal.set([x, y, z, j], i * 4); }

  // ---------- breakthrough burst (vision III → IV): 360° full-spectrum shell of light from the heart
  const heartGlow = glowSprite('#fff6e0', 12, 0, 0.1); heartGlow.position.copy(HEART); grp.add(heartGlow);
  const BURST_N = 8000; const burst = makePoints(BURST_N, 1.2, 0, 0.6); grp.add(burst); const burstGlow = glowSprite('#ffffff', 60, 0, 0.05); burstGlow.position.copy(HEART); grp.add(burstGlow);
  // ---------- fold-back: everything streams home into the heart along curved 3D paths
  const FOLD_N = 6000; const fold = makePoints(FOLD_N, 1.1, 0, 0.3); grp.add(fold);
  // ---------- rainbow body: volumetric five-light cloud with sparkle
  const RB_N = 6000; const rbAura = makePoints(RB_N, 1.05, 0, 0.9); grp.add(rbAura);
  // ---------- moonlit depth haze
  const haze = [[-160, 150, -380, 520, '#6f8fd8'], [190, 70, -300, 420, '#5a6fb8'], [0, 210, -520, 700, '#8aa6e8']].map(([x, y, z, s, c]) => { const g = glowSprite(c, s, 0, 0.02); g.position.set(x, y, z); grp.add(g); return g; });

  const fog = new THREE.FogExp2('#02030a', 0); scene.fog = fog;
  const VS = { th: 0, ch: 0, pal: 0, stream: 0, kati: 0 };

  // ---------------------------------------------------------------- per-frame
  // o: { on, step, st, t, dt, vis (tummo visions level), kati, flash, rb, centres (forms), tv }
  function update(o) { const { on, step, st, t, dt, tv } = o; const k = 1 - Math.exp(-dt * 2.2);
    const fe = step === 3 ? smooth(2.4, 6.2, st) : step === 4 ? 1 : 0; // fold progress
    // thigle count / opacity
    const nTh = on ? [12, 40, TH_N, TH_N, 0][step] : 12; const aTh = on ? (step === 4 ? 0 : 1) * tv : o.vis;
    VS.th += (aTh - VS.th) * k; shells.visible = cores.visible = VS.th > 0.01;
    if (shells.visible) { const grow = on && step <= 2 ? Math.min(1, st / 3) : 1;
      for (let i = 0; i < TH_N; i++) { const T = TH[i]; let a = i < nTh ? 1 : 0; if (on && step >= 1 && step <= 2) { const prevN = [12, 40, TH_N][step - 1]; if (i >= prevN && i < nTh) a = smooth(0, 1, grow * 1.6 - (i - prevN) / (nTh - prevN) * 0.6); }
        glowCore[i] += (a - glowCore[i]) * k; const g = glowCore[i] * VS.th;
        V.copy(T.p); V.x += Math.sin(t * 0.21 + T.ph) * 2.2; V.y += Math.sin(t * 0.17 + T.ph * 1.3) * 1.8; V.z += Math.cos(t * 0.13 + T.ph) * 2.2;
        let sc = T.s * (0.4 + 0.6 * g); if (fe > 0) { const u = smooth(0, 1, fe * 1.4 - (i / TH_N) * 0.4); const c2 = T.p.clone().lerp(HEART, 0.5); c2.y += 40; bez(T.p, c2, HEART, u, V); sc *= 1 - u * 0.95; if (u > 0.97) sc = 0.0001; }
        for (let j = 0; j < 5; j++) { const br = 1 + 0.05 * Math.sin(t * 1.3 + T.ph + j * 1.1); M4.compose(V, Q.identity(), S3.setScalar(sc * RADII[j] * br)); shells.setMatrixAt(i * 5 + j, M4);
          const flash = o.flash; C.copy(FIVE[j]); if (flash > 0) C.lerp(new THREE.Color().setHSL((j / 5 + t * 0.3) % 1, 1, 0.6), flash); C.multiplyScalar(g * 0.5); shells.setColorAt(i * 5 + j, C); }
        M4.compose(V, Q, S3.setScalar(sc * 0.12)); cores.setMatrixAt(i, M4); cores.setColorAt(i, C.setRGB(0.55 * g, 0.55 * g, 0.6 * g)); }
      shells.instanceMatrix.needsUpdate = shells.instanceColor.needsUpdate = cores.instanceMatrix.needsUpdate = cores.instanceColor.needsUpdate = true; }
    // vajra chains
    const nCh = on ? [3, 7, CH_N, CH_N, 0][step] : 3; const aCh = on ? (step === 4 ? 0 : 1) * tv * (1 - fe) : o.vis;
    VS.ch += (aCh - VS.ch) * k; beads.visible = chainLines.visible = VS.ch > 0.01;
    if (beads.visible) { const LP = chainLineGeo.attributes.position.array; const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), F = new THREE.Vector3();
      chainLines.material.opacity = 0.4 * VS.ch;
      for (let c = 0; c < CH_N; c++) { const ch = CH[c]; const a = c < nCh ? VS.ch : 0;
        for (let s = 0; s < 2; s++) { for (let q = 0; q < CH_SEG; q++) { for (const [u, out] of [[q / CH_SEG, P0], [(q + 1) / CH_SEG, P1]]) { chainPoint(ch, u, t, out); const phi = u * ch.turns * TAU + t * 0.8 + s * Math.PI; out.addScaledVector(ch.nrm, Math.cos(phi) * ch.rad).addScaledVector(ch.bin, Math.sin(phi) * ch.rad); if (a === 0) out.set(0, -999, 0); }
            LP.set([P0.x, P0.y, P0.z, P1.x, P1.y, P1.z], ((c * 2 + s) * CH_SEG + q) * 6); }
          for (let b = 0; b < BEADS; b++) { const u = (b + 0.5) / BEADS; chainPoint(ch, u, t, F); const phi = u * ch.turns * TAU + t * 0.8 + s * Math.PI; F.addScaledVector(ch.nrm, Math.cos(phi) * ch.rad).addScaledVector(ch.bin, Math.sin(phi) * ch.rad);
            const front = 0.55 + 0.45 * Math.cos(phi); const bs = (ch.near ? 0.55 : 0.9) * (0.75 + 0.35 * front);
            M4.compose(F, Q.identity(), S3.setScalar(a > 0 ? bs : 0.0001)); beads.setMatrixAt((c * 2 + s) * BEADS + b, M4);
            if ((b + c) % 9 === 0) C.copy(FIVE[(b + c) % 5]).multiplyScalar(a); else C.setRGB(0.75 * a, 0.85 * a, a); beads.setColorAt((c * 2 + s) * BEADS + b, C); } } }
      chainLineGeo.attributes.position.needsUpdate = true; beads.instanceMatrix.needsUpdate = beads.instanceColor.needsUpdate = true; }
    // kati crystal tube + outward stream from the eyes into the visions
    VS.kati += (o.kati - VS.kati) * k; katiTubes.forEach((m) => { m.material.uniforms.uOpacity.value = 0.25 + 0.75 * VS.kati; m.visible = true; });
    eyeGlow.forEach((g) => { g.material.opacity = 0.55 * VS.kati * (0.8 + 0.2 * Math.sin(t * 2)); });
    const aSt = Math.max(on && step <= 2 ? tv : 0, o.vis) * Math.min(1, VS.kati * 1.5); VS.stream += (aSt - VS.stream) * k; stream.visible = VS.stream > 0.01;
    if (stream.visible) { const P = stream.geometry.attributes.position.array, Cc = stream.geometry.attributes.aColor.array, S = stream.geometry.attributes.aSize.array; stream.material.uniforms.uOpacity.value = VS.stream; const tgtN = Math.max(1, nTh);
      for (let i = 0; i < STREAM_N; i++) { const q = hash(i, 0.37); const u = (q + t * 0.22) % 1; const E = EYES[i & 1]; const T = TH[i % tgtN];
        const ctrl = new THREE.Vector3(E.x * 3, E.y + 4, E.z + 30); bez(E, ctrl, T.p, u, V); const j = hash(i, 0.71) - 0.5; V.x += j * 2 * u; V.y += (hash(i, 0.9) - 0.5) * 2 * u;
        P[i * 3] = V.x; P[i * 3 + 1] = V.y; P[i * 3 + 2] = V.z; C.setRGB(0.8, 0.9, 1).lerp(FIVE[i % 5], u * 0.8); const b = Math.sin(u * Math.PI) * 0.45; Cc[i * 3] = C.r * b; Cc[i * 3 + 1] = C.g * b; Cc[i * 3 + 2] = C.b * b; S[i] = 0.5 + 0.4 * (1 - u); }
      stream.geometry.attributes.position.needsUpdate = stream.geometry.attributes.aColor.needsUpdate = stream.geometry.attributes.aSize.needsUpdate = true; }
    // galactic vortexes around each still-turning form
    { const amp = on ? [0.45, 1, 0.95, 0.35, 0][step] * tv : 0; vort.material.uniforms.uOpacity.value = amp; vort.visible = amp > 0.01;
      if (vort.visible) { const P = vort.geometry.attributes.position.array, Cc = vort.geometry.attributes.aColor.array, S = vort.geometry.attributes.aSize.array; const cs = o.centres; const NF = cs.length;
        for (let i = 0; i < VORT_N; i++) { const [p, u, d, sp] = cs[i % NF]; const r1 = vRand[i * 4], r2 = vRand[i * 4 + 1], r3 = vRand[i * 4 + 2], r4 = vRand[i * 4 + 3]; const e1 = u.e1, e2 = u.e2, n = u.axis;
          let x, y, z, b; const bulge = r4 < 0.16;
          if (bulge) { const rr = u.sc * 0.9 * Math.cbrt(r1); const th = r2 * TAU, ph = Math.acos(2 * r3 - 1); x = Math.sin(ph) * Math.cos(th) * rr; y = Math.cos(ph) * rr * 0.6; z = Math.sin(ph) * Math.sin(th) * rr; b = 0.9;
            V.set(0, 0, 0).addScaledVector(e1, x).addScaledVector(n, y).addScaledVector(e2, z); }
          else { const rr = u.sc * (1.1 + r1 * 3.6); const arm = Math.floor(r2 * u.arms); const a = arm * TAU / u.arms + Math.log(rr / u.sc) * 2.4 + u.rot * (1.4 + 1.6 / (1 + r1 * 3)) + (r3 - 0.5) * 0.55 * (1 - r1 * 0.5);
            const h = (r4 - 0.58) / 0.42 - 0.5; const thick = u.sc * 0.55 * (1 - r1 * 0.65); V.set(0, 0, 0).addScaledVector(e1, Math.cos(a) * rr).addScaledVector(e2, Math.sin(a) * rr).addScaledVector(n, h * thick); b = 0.35 + 0.65 * (1 - r1); }
          P[i * 3] = p.x + V.x; P[i * 3 + 1] = p.y + V.y; P[i * 3 + 2] = p.z + V.z;
          const live = (1 - d) * (0.35 + 0.65 * Math.min(1, sp + 0.25)); let cr = 0.72, cg = 0.82, cb = 1; if (bulge) { cr = 1; cg = 0.96; cb = 0.88; }
          if (o.flash > 0) { C.setHSL((r2 + t * 0.2) % 1, 1, 0.6); cr += (C.r - cr) * o.flash; cg += (C.g - cg) * o.flash; cb += (C.b - cb) * o.flash; }
          const lv = live * 0.55; Cc[i * 3] = cr * b * lv; Cc[i * 3 + 1] = cg * b * lv; Cc[i * 3 + 2] = cb * b * lv; S[i] = bulge ? 0.8 : 0.4 + (1 - r1) * 0.7; }
        vort.geometry.attributes.position.needsUpdate = vort.geometry.attributes.aColor.needsUpdate = vort.geometry.attributes.aSize.needsUpdate = true; } }
    // palaces
    const palOn = on && step >= 1 && step <= 3; VS.pal += ((palOn ? tv : 0) - VS.pal) * (1 - Math.exp(-dt * 1.5));
    const palAlive = []; PMAT.forEach((m) => { m.opacity = 0.85 * VS.pal * (1 - fe * 0.85); });
    for (const g of PAL) { const u = g.userData; let a = 0;
      if (palOn || VS.pal > 0.01) { if (u.near) a = step >= 1 ? smooth(0, 1, (step === 1 ? st / 3 : 1) * 1.5 - u.k * 0.12) : 0; else a = step >= 2 ? smooth(0, 1, (step === 2 ? st / 5 : 1) * 1.6 - (u.k - 5) / 40 * 0.6) : 0; }
      let sc = u.sc * (0.2 + 0.8 * a), gone = false; V.copy(u.pos); if (fe > 0) { const w = smooth(0, 1, fe * 1.3 - (u.k / PAL.length) * 0.3); const c2 = u.pos.clone().lerp(HEART, 0.5); c2.y += 60; c2.x *= 1.3; bez(u.pos, c2, HEART, w, V); sc *= 1 - w * 0.97; gone = w > 0.97; }
      if (o.flash > 0 && step === 3) sc *= 1 + 0.25 * o.flash;
      g.position.copy(V); g.quaternion.copy(u.q0).multiply(Q.setFromAxisAngle(S3.set(0, 1, 0), t * u.spin)); g.scale.setScalar(Math.max(sc, 0.001)); g.visible = a > 0.01 && VS.pal > 0.01 && sc > 0.05 && !gone; g.updateMatrix(); if (g.visible) palAlive.push(g); }
    ppts.visible = palAlive.length > 0; if (ppts.visible) { const P = ppts.geometry.attributes.position.array, Cc = ppts.geometry.attributes.aColor.array, S = ppts.geometry.attributes.aSize.array; ppts.material.uniforms.uOpacity.value = VS.pal; const NA = palAlive.length;
      for (let i = 0; i < PPTS_N; i++) { const g = palAlive[i % NA]; V.set(pLocal[i * 4], pLocal[i * 4 + 1], pLocal[i * 4 + 2]).applyMatrix4(g.matrix); P[i * 3] = V.x; P[i * 3 + 1] = V.y; P[i * 3 + 2] = V.z; const j = pLocal[i * 4 + 3];
        C.copy(FIVE[j]); if (o.flash > 0) C.lerp(new THREE.Color().setHSL((j / 5 + t * 0.3) % 1, 1, 0.6), o.flash); const b = 0.45 + 0.15 * Math.sin(t * 3 + i); Cc[i * 3] = C.r * b; Cc[i * 3 + 1] = C.g * b; Cc[i * 3 + 2] = C.b * b; S[i] = (g.userData.near ? 0.55 : 1.0) * (j === 4 ? 1.3 : 1); }
      ppts.geometry.attributes.position.needsUpdate = ppts.geometry.attributes.aColor.needsUpdate = ppts.geometry.attributes.aSize.needsUpdate = true; }
    // breakthrough burst
    { const bt = step === 3 ? st : 99; const a = bt < 4.2 ? Math.pow(1 - bt / 4.2, 1.3) : 0; burst.visible = a > 0.005 && on; burstGlow.material.opacity = on && bt < 2.0 ? 0.35 * Math.pow(1 - bt / 2.0, 2) : 0; burstGlow.scale.setScalar(30 + bt * 90);
      if (burst.visible) { const P = burst.geometry.attributes.position.array, Cc = burst.geometry.attributes.aColor.array, S = burst.geometry.attributes.aSize.array; burst.material.uniforms.uOpacity.value = a * tv;
        for (let i = 0; i < BURST_N; i++) { const y = 1 - (i + 0.5) / BURST_N * 2, rr = Math.sqrt(1 - y * y), th = i * 2.39996; const shell = hash(i, 4.1); const R = bt * (60 + 70 * shell) + 4;
          P[i * 3] = HEART.x + Math.cos(th) * rr * R; P[i * 3 + 1] = HEART.y + y * R; P[i * 3 + 2] = HEART.z + Math.sin(th) * rr * R; C.setHSL(((th / TAU) % 1 + y * 0.25 + 1) % 1, 1, 0.55 + 0.15 * shell); const bb = 0.5 + 0.8 * smooth(0, 1.0, bt); Cc[i * 3] = C.r * bb; Cc[i * 3 + 1] = C.g * bb; Cc[i * 3 + 2] = C.b * bb; S[i] = 0.9 + shell * 1.7; }
        burst.geometry.attributes.position.needsUpdate = burst.geometry.attributes.aColor.needsUpdate = burst.geometry.attributes.aSize.needsUpdate = true; } }
    heartGlow.material.opacity = on && step === 3 ? 0.55 * fe * (0.85 + 0.15 * Math.sin(t * 2)) : 0;
    // fold-back streams
    { const a = step === 3 && on ? Math.sin(Math.min(1, fe * 1.05) * Math.PI) : 0; fold.visible = a > 0.01; const resid = step === 3 && fe >= 0.999;
      if (fold.visible) { const P = fold.geometry.attributes.position.array, Cc = fold.geometry.attributes.aColor.array, S = fold.geometry.attributes.aSize.array; fold.material.uniforms.uOpacity.value = a * tv;
        for (let i = 0; i < FOLD_N; i++) { const src = i % 3 === 0 ? PAL[i % PAL.length].userData.pos : TH[i % TH_N].p; const q = hash(i, 2.7); const u = (q + st * 0.3) % 1; const c2 = src.clone().lerp(HEART, 0.45); c2.y += 50 + 30 * hash(i, 1.9); c2.x += (hash(i, 3.9) - 0.5) * 60;
          bez(src, c2, HEART, u, V); P[i * 3] = V.x; P[i * 3 + 1] = V.y; P[i * 3 + 2] = V.z; C.copy(FIVE[i % 5]).lerp(new THREE.Color('#ffffff'), u * u); const b = 0.6 + 0.6 * u; Cc[i * 3] = C.r * b; Cc[i * 3 + 1] = C.g * b; Cc[i * 3 + 2] = C.b * b; S[i] = 1.0 + 1.0 * (1 - u); }
        fold.geometry.attributes.position.needsUpdate = fold.geometry.attributes.aColor.needsUpdate = fold.geometry.attributes.aSize.needsUpdate = true; } }
    // rainbow body
    { const rb = o.rb; rbAura.visible = rb > 0 && on; if (rbAura.visible) { const P = rbAura.geometry.attributes.position.array, Cc = rbAura.geometry.attributes.aColor.array, S = rbAura.geometry.attributes.aSize.array; rbAura.material.uniforms.uOpacity.value = Math.min(1, rb * 2.5);
      for (let i = 0; i < RB_N; i++) { const r1 = hash(i, 1.3), r2 = hash(i, 2.3), r3 = hash(i, 3.3); const yy = 24 + ((r1 + t * 0.03) % 1) * 92; const prof = yy < 46 ? 36 : yy < 82 ? 22 - (yy - 46) * 0.12 : 13; const rr = prof * Math.cbrt(r2) * (1.15 - rb * 0.55) + 2;
        const th = r3 * TAU + t * (0.15 + 0.2 * r2); let x = Math.cos(th) * rr, y = yy, z = Math.sin(th) * rr * 0.75; const lift = rb * rb; x *= 1 - lift * 0.5; z *= 1 - lift * 0.5; y = y + lift * (G.y - 70) * ((yy - 24) / 92 * 0.7 + 0.3);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; const band = Math.floor(((yy - 24) / 92) * 5 + r2 * 1.2) % 5; C.copy(FIVE[(band + 5) % 5]);
        const sp = Math.pow(Math.max(0, Math.sin(t * (2 + r1 * 5) + i)), 24); const b = 0.55 + 0.45 * sp; Cc[i * 3] = C.r * b; Cc[i * 3 + 1] = C.g * b; Cc[i * 3 + 2] = C.b * b; S[i] = 0.6 + sp * 2.6; }
      rbAura.geometry.attributes.position.needsUpdate = rbAura.geometry.attributes.aColor.needsUpdate = rbAura.geometry.attributes.aSize.needsUpdate = true; } }
    // depth layering
    const sky = on ? (step >= 3 ? 1 : 0.5) : 0; haze.forEach((g, j) => { g.material.opacity = tv * (0.012 + 0.018 * sky) * (j === 2 ? 0.8 : 1); }); fog.density = 0.0016 * tv;
  }
  if (typeof window !== 'undefined') window.__t3d = { scene, shells, cores, beads, chainLines, stream, vort, ppts, burst, fold, rbAura, haze, PAL, katiTubes, eyeGlow };
  return { update, group: grp };
}
