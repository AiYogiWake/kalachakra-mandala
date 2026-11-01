// Ascension — click-only sequence: the luminous figure rises from the Great Bliss seat,
// crosses a SYMBOLIC Mount Kailash trailing stardust, lifts small sadhu silhouettes, and
// enters a galaxy vortex above the bindu. Nothing here touches the bindu or its glare.
import * as THREE from 'three';

export const ASC_STEPS = [
  { t: 'Rising from the table', c: '#ff9ad5',
    plain: 'The luminous figure leaves the Great Bliss seat and rises straight up the central axis of the palace, past the bindu, into the open sky.',
    voice: 'The seat was never a floor. Like mist rising off a lake at dawn, what sat there simply lifts, and the axis it rises along was always open.' },
  { t: 'Crossing Kailash — stardust', c: '#ffd36b',
    plain: 'She crosses the horizon over a stylised, symbolic Mount Kailash. A trail of glittering stardust falls from her, settles on the peak and glows along its four faces.',
    voice: 'Light passes over the mountain and the mountain does not refuse it; the snow keeps the glitter the way a still mind keeps its own clarity.' },
  { t: 'Lifting the sadhus', c: '#ffb35a',
    plain: 'Streams of stardust gather small sadhu silhouettes — seated and standing, matted hair, staffs — from the foot of the mountain and carry them up on spiralling paths.',
    voice: 'No one is pulled; each is carried by what already shines in them, the way a current carries leaves that have stopped clutching the bank.' },
  { t: 'The galaxy vortex', c: '#b9a0ff',
    plain: 'Above the bindu, a thick, deep galaxy vortex turns — an image borrowed from the thögal visions. The figure and the sadhus circle within it. The bindu core below stays exactly as it was.',
    voice: 'Spirals within spirals, and at the centre nothing that turns. Rest there: the vortex is display, the centre is the ground.' },
];
export const ASC_INTRO = `<p><b>Interpretive sequence.</b> This is an artistic visualisation, not a depiction of a specific text or practice. Kailash here is a <i>symbolic</i> model, not a survey of the real mountain.</p>
<p><b>Facts.</b> Mount Kailash (Tibetan Gang Rinpoche) is a peak of about 6,638 m in the Ngari region of western Tibet. It is held sacred in four traditions: in Hinduism as the abode of Śiva; in Buddhism as the abode of Cakrasaṃvara (Demchok); in Jainism as Aṣṭāpada, where Ṛṣabhanātha attained liberation; and in Bön as Yungdrung Gutseg, the nine-storey swastika mountain. It is widely identified with Mount Meru, the axis mundi of Indian cosmology (also the central axis of the Kālacakra cosmos). Lake Manasarovar lies at its foot, and pilgrims circumambulate the mountain on a kora of roughly 52 km.</p>
<p class="note">The italic lines in each step are an <b>imagined voice in the spirit of Longchenpa</b> — a metaphor written for this app, not a quotation.</p>`;
export const ASC_REFS = [
  ['Mount Kailash', 'https://en.wikipedia.org/wiki/Mount_Kailash'],
  ['Mount Meru (axis mundi)', 'https://en.wikipedia.org/wiki/Mount_Meru'],
  ['Lake Manasarovar', 'https://en.wikipedia.org/wiki/Lake_Manasarovar'],
];

const DUR = [5, 7, 8, 6];
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const TAU = Math.PI * 2;

export function createAscension(K) {
  const { scene, makePoints, glowSprite, lineMat, makeLabel, figurePoints, BINDU_Y, rng } = K;
  const root = new THREE.Group(); root.visible = false; scene.add(root);
  const r = rng(777);
  // ---- symbolic Kailash ----
  const KX = -560, KZ = -840, KH = 330, KW = 200;
  const kail = new THREE.Group(); kail.position.set(KX, 0, KZ); kail.rotation.y = Math.PI / 4 + 0.35; root.add(kail);
  const apex = new THREE.Vector3(0, KH, 0), corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => new THREE.Vector3(a * KW, 0, b * KW));
  const facePt = (f, u, v) => { if (u + v > 1) { u = 1 - u; v = 1 - v; } const A = corners[f], B = corners[(f + 1) % 4];
    const p = apex.clone().multiplyScalar(1 - u - v).addScaledVector(A, u).addScaledVector(B, v); // slight convex bulge
    const bul = (1 - Math.abs(u - v)) * Math.min(u + v, 1 - (u + v) * 0.5) * 18; const n = A.clone().add(B).setY(0).normalize(); return p.addScaledVector(n, bul); };
  { const N = 7000, pts = makePoints(N, 1.5, 0.75, 0.25), P = pts.geometry.attributes.position.array, C = pts.geometry.attributes.aColor.array;
    for (let i = 0; i < N; i++) { const f = i % 4; let u = r(), v = r(); const p = facePt(f, u, v); const h = p.y / KH;
      const ridge = Math.abs(Math.sin(h * 38 + f)) > 0.82 ? 1 : 0; // horizontal snow strata
      const snow = h > 0.55 ? 1 : ridge * 0.7; P.set([p.x, p.y, p.z], i * 3);
      const b = 0.25 + snow * 0.55; C.set([0.45 * b + snow * 0.4, 0.6 * b + snow * 0.35, 0.95 * b + snow * 0.2], i * 3); }
    pts.geometry.attributes.position.needsUpdate = true; pts.material.uniforms.uOpacity.value = 0.7; kail.add(pts); }
  { const L = []; for (let f = 0; f < 4; f++) { L.push(apex, corners[f], corners[f], corners[(f + 1) % 4]); }
    for (const h of [0.35, 0.6, 0.8]) for (let f = 0; f < 4; f++) { L.push(apex.clone().lerp(corners[f], 1 - h), apex.clone().lerp(corners[(f + 1) % 4], 1 - h)); }
    const g = new THREE.BufferGeometry().setFromPoints(L); const ln = new THREE.LineSegments(g, lineMat('#7fd0ff', 0.55)); kail.add(ln); }
  // Lake Manasarovar
  const lake = new THREE.Group(); lake.position.set(KX + 330, 1, KZ + 240); root.add(lake);
  { const N = 2200, pts = makePoints(N, 1.3, 0.6, 0.4), P = pts.geometry.attributes.position.array, C = pts.geometry.attributes.aColor.array;
    for (let i = 0; i < N; i++) { const a = r() * TAU, rr = Math.sqrt(r()); P.set([Math.cos(a) * rr * 140, 0, Math.sin(a) * rr * 80], i * 3); C.set([0.1, 0.35 + 0.2 * r(), 0.8], i * 3); }
    pts.geometry.attributes.position.needsUpdate = true; lake.add(pts);
    const ring = []; for (let k = 0; k <= 96; k++) { const a = k / 96 * TAU; ring.push(new THREE.Vector3(Math.cos(a) * 142, 0, Math.sin(a) * 82)); }
    lake.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), lineMat('#4fb8ff', 0.5))); }
  const kLab = makeLabel('कैलास · Gang Rinpoche', 'Mount Kailash · symbolic', '#9fdcff', 16, { maxDist: 4000, prio: 2 }); kLab.position.set(KX, KH + 40, KZ); root.add(kLab);
  const lLab = makeLabel('मानसरोवर', 'Lake Manasarovar · symbolic', '#6fc4ff', 11, { maxDist: 4000 }); lLab.position.set(KX + 330, 20, KZ + 240); root.add(lLab);
  // ---- the luminous figure ----
  const fig = new THREE.Group(); root.add(fig);
  const body = figurePoints([{ n: 2400, h: 14, arms: 2, color: '#ff9ad5', x: 0, y: -7, z: 0, seed: 41 }], 0.8); fig.add(body);
  const halo = glowSprite('#ffc8ec', 26, 0.35); fig.add(halo);
  const figLab = makeLabel('डाकिनी', 'Luminous figure · imaginative', '#ffb8e8', 6, { maxDist: 2500 }); figLab.position.set(0, 14, 0); fig.add(figLab);
  const SEAT = new THREE.Vector3(0, 184, 6), P1 = new THREE.Vector3(0, 310, 0), PEAK = new THREE.Vector3(KX, KH + 70, KZ);
  const V = new THREE.Vector3(0, BINDU_Y + 200, 0), P3 = V.clone().add(new THREE.Vector3(0, 0, 0));
  const C2 = new THREE.Vector3(-260, 470, -330), C3 = new THREE.Vector3(-300, 520, -420);
  const bez = (a, c, b, u) => a.clone().multiplyScalar((1 - u) * (1 - u)).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(b, u * u);
  function figPos(step, st) { // position at time st into step
    if (step < 0) return SEAT.clone();
    const e = ease(st / DUR[step]);
    if (step === 0) return SEAT.clone().lerp(P1, e);
    if (step === 1) return bez(P1, C2, PEAK, e);
    if (step === 2) return bez(PEAK, C3, P3, e);
    const a = st * 0.35; return V.clone().add(new THREE.Vector3(Math.cos(a) * 22 * e, Math.sin(st * 0.8) * 4, Math.sin(a) * 22 * e)); }
  // trailing sparkle (always behind her while she moves)
  const TN = 1400, trail = makePoints(TN, 1.4, 0.9, 0.9); trail.material.uniforms.uShape.value = 8; trail.frustumCulled = false; root.add(trail);
  { const C = trail.geometry.attributes.aColor.array; for (let i = 0; i < TN; i++) { const g = r(); C.set(g < 0.5 ? [1, 0.82, 0.45] : g < 0.8 ? [1, 0.6, 0.9] : [0.8, 0.9, 1], i * 3); } }
  const tRand = Float32Array.from({ length: TN * 3 }, () => r() * 2 - 1);
  // stardust that settles on Kailash (step 1)
  const DN = 4200, dust = makePoints(DN, 1.6, 0.9, 1); dust.material.uniforms.uShape.value = 8; dust.frustumCulled = false; root.add(dust);
  const dBirth = new Float32Array(DN), dTarget = [], kailM = new THREE.Matrix4();
  kail.updateMatrixWorld(true); kailM.copy(kail.matrixWorld);
  { const C = dust.geometry.attributes.aColor.array;
    for (let i = 0; i < DN; i++) { dBirth[i] = r(); const u = r() * 0.75, v = r() * (1 - u); dTarget.push(facePt(i % 4, u, v).applyMatrix4(kailM)); const g = r(); C.set(g < 0.6 ? [1, 0.85, 0.5] : [0.85, 0.9, 1], i * 3); } }
  // ---- sadhus ----
  const SN = 9, sadhus = [];
  for (let k = 0; k < SN; k++) {
    const g = new THREE.Group(), seated = k % 2 === 0, h = 11, rr = rng(900 + k), n = 520;
    const pts = makePoints(n, 0.9, 0.85, 0.3), P = pts.geometry.attributes.position.array, C = pts.geometry.attributes.aColor.array;
    for (let i = 0; i < n; i++) { const q = rr(); let p;
      const E = (cx, cy, cz, a, b, c) => { const t = rr() * TAU, ph = Math.acos(2 * rr() - 1), s = Math.cbrt(rr()); return [cx + Math.sin(ph) * Math.cos(t) * a * s, cy + Math.cos(ph) * b * s, cz + Math.sin(ph) * Math.sin(t) * c * s]; };
      if (q < 0.12) p = E(0, (seated ? 0.62 : 0.9) * h, 0, 0.08 * h, 0.09 * h, 0.08 * h);           // head
      else if (q < 0.24) p = E(0, (seated ? 0.76 : 1.04) * h, -0.02 * h, 0.07 * h, 0.08 * h, 0.07 * h); // matted topknot (jaṭā)
      else if (q < 0.3) p = E(0, (seated ? 0.5 : 0.78) * h, -0.07 * h, 0.1 * h, 0.14 * h, 0.03 * h);  // hanging locks
      else if (q < 0.62) p = seated ? E(0, 0.32 * h, 0, 0.13 * h, 0.2 * h, 0.09 * h) : E(0, 0.62 * h, 0, 0.12 * h, 0.2 * h, 0.08 * h); // torso
      else if (q < 0.84) p = seated ? E(0, 0.07 * h, 0.04 * h, 0.3 * h, 0.06 * h, 0.13 * h) : E((rr() < .5 ? -1 : 1) * 0.06 * h, 0.22 * h, 0, 0.04 * h, 0.22 * h, 0.04 * h); // crossed legs / legs
      else { const y = rr() * (seated ? 0.95 : 1.25) * h; p = [0.26 * h, y, 0.05 * h]; } // staff
      P.set(p, i * 3); const st = q >= 0.84; C.set(st ? [0.85, 0.6, 0.35] : [1, 0.62, 0.28], i * 3); }
    pts.geometry.attributes.position.needsUpdate = true; pts.material.uniforms.uOpacity.value = 0.8; g.add(pts);
    const a = -0.9 + k / (SN - 1) * 1.8; const foot = new THREE.Vector3(KX + Math.sin(a) * 270 + 120, 0, KZ + Math.cos(a) * 270);
    g.position.copy(foot); g.lookAt(0, 0, 0); g.userData = { foot, k, a0: k / SN * TAU }; root.add(g); sadhus.push(g); }
  const sLab = makeLabel('साधु', 'Sadhus · symbolic silhouettes', '#ffc890', 7, { maxDist: 3000 }); sLab.position.set(KX + 140, 30, KZ + 270); root.add(sLab);
  const sadhuPos = (g, step, st, t) => { const { foot, k, a0 } = g.userData;
    const orbit = (tt) => { const rr = 50 + k * 13, a = a0 + tt * (0.5 / Math.sqrt(rr / 50)); return V.clone().add(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a * 2 + k) * 6, Math.sin(a) * rr)); };
    if (step < 2) return foot.clone();
    if (step === 2) { const u = ease((st - k * 0.35) / (DUR[2] - 2.8)); const tgt = orbit(t); const c = foot.clone().lerp(tgt, u);
      const R = 45 * Math.sin(Math.PI * u), ang = u * 3 * TAU + k; c.x += Math.cos(ang) * R; c.z += Math.sin(ang) * R; c.y += Math.sin(Math.PI * u) * 60; return c; }
    return orbit(t); };
  // dust streams carrying the sadhus (step 2)
  const SSN = 2700, streams = makePoints(SSN, 1.2, 0.8, 1); streams.material.uniforms.uShape.value = 7; streams.frustumCulled = false; root.add(streams);
  { const C = streams.geometry.attributes.aColor.array; for (let i = 0; i < SSN; i++) C.set(r() < .5 ? [1, 0.8, 0.45] : [0.75, 0.7, 1], i * 3); }
  const ssOff = Float32Array.from({ length: SSN }, () => r());
  // ---- galaxy vortex above the bindu (thögal-style) ----
  const GN = 11000, gal = makePoints(GN, 1.5, 0.9, 0.7); gal.position.copy(V); gal.frustumCulled = false; root.add(gal);
  const gR = new Float32Array(GN), gA = new Float32Array(GN), gY = new Float32Array(GN);
  { const C = gal.geometry.attributes.aColor.array;
    for (let i = 0; i < GN; i++) { const bulge = r() < 0.16; const rr = bulge ? Math.pow(r(), 1.6) * 30 : 20 + Math.pow(r(), 0.8) * 190; const arm = Math.floor(r() * 3);
      gR[i] = rr; gA[i] = arm / 3 * TAU + Math.log(rr + 1) * 2.1 + (r() - .5) * (bulge ? TAU : 0.55);
      gY[i] = (r() - .5) * (bulge ? 26 : 30 * Math.exp(-rr / 120)) ; const h = rr / 210;
      const c = bulge ? [1, 0.85, 0.55] : h < 0.4 ? [0.75, 0.55, 1] : h < 0.7 ? [0.4, 0.6, 1] : [0.35, 0.85, 0.95]; const b = 0.55 + r() * 0.45; C.set([c[0] * b, c[1] * b, c[2] * b], i * 3); } }
  const gLab = makeLabel('आवर्त', 'Galaxy vortex · imaginative (thögal-style)', '#c8b4ff', 9, { maxDist: 3000 }); gLab.position.set(0, V.y + 70, 0); root.add(gLab);

  const S = { step: -1, t0: 0, lifted: 0, landed: 0, prog: 0 };
  function setStep(i, t) { S.step = i; S.t0 = t; root.visible = i >= 0; S.prog = 0; if (i < 0) { S.lifted = 0; S.landed = 0; } }
  function update(t) {
    if (S.step < 0) return; const step = S.step, st = t - S.t0; S.prog = Math.min(1, st / DUR[step]);
    const fp = figPos(step, st); fig.position.copy(fp); halo.material.opacity = 0.3 + 0.08 * Math.sin(t * 2);
    // trail
    { const P = trail.geometry.attributes.position.array; for (let i = 0; i < TN; i++) { const age = (i / TN) * 1.6; const q = figPos(step, Math.max(0, st - age));
        const moving = st - age > 0 && st - age < DUR[step] ? 1 : 0.15; const s = age * 6;
        P[i * 3] = q.x + tRand[i * 3] * s * moving; P[i * 3 + 1] = q.y - age * age * 18 * moving + tRand[i * 3 + 1] * s * 0.5; P[i * 3 + 2] = q.z + tRand[i * 3 + 2] * s * moving; }
      trail.geometry.attributes.position.needsUpdate = true; }
    // dust
    { const P = dust.geometry.attributes.position.array; let landed = 0;
      for (let i = 0; i < DN; i++) { let u; if (step < 1) u = -1; else if (step > 1) u = 2; else u = (st / DUR[1] - dBirth[i] * 0.75) / 0.35;
        const T = dTarget[i]; let x, y, z;
        if (u < 0) { x = 0; y = -9999; z = 0; }
        else if (u >= 1) { x = T.x; y = T.y + 0.6; z = T.z; landed++; }
        else { const b = bez(P1, C2, PEAK, ease(dBirth[i] * 0.75)); const e = u * u; x = b.x + (T.x - b.x) * e; y = b.y + (T.y - b.y) * e; z = b.z + (T.z - b.z) * e; }
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; }
      S.landed = landed; dust.geometry.attributes.position.needsUpdate = true; dust.material.uniforms.uOpacity.value = 0.75 + 0.15 * Math.sin(t * 1.7); }
    // sadhus
    let lifted = 0; for (const g of sadhus) { const p = sadhuPos(g, step, st, t); if (p.distanceTo(g.userData.foot) > 25) lifted++; g.position.copy(p); }
    S.lifted = lifted; sLab.visible = step < 2;
    // streams
    { const P = streams.geometry.attributes.position.array; const on = step >= 2;
      for (let i = 0; i < SSN; i++) { if (!on) { P[i * 3 + 1] = -9999; continue; } const g = sadhus[i % SN]; const ph = (ssOff[i] + t * 0.12) % 1;
        const q = step === 2 ? g.userData.foot.clone().lerp(g.position, ph) : g.position.clone().add(new THREE.Vector3(0, -ph * 30, 0));
        const a = ph * 4 * TAU + i; const rr = 5 + 4 * Math.sin(ph * Math.PI); P[i * 3] = q.x + Math.cos(a) * rr; P[i * 3 + 1] = q.y + ph * 6; P[i * 3 + 2] = q.z + Math.sin(a) * rr; }
      streams.geometry.attributes.position.needsUpdate = true; streams.material.uniforms.uOpacity.value = step === 2 ? 0.8 : 0.35; }
    // galaxy
    { const amp = step < 2 ? 0 : step === 2 ? 0.45 * ease(st / DUR[2]) : 0.45 + 0.55 * ease(st / DUR[3]); gal.visible = amp > 0.001; gLab.visible = amp > 0.2;
      if (gal.visible) { const P = gal.geometry.attributes.position.array; for (let i = 0; i < GN; i++) { const rr = gR[i] * (0.4 + 0.6 * amp), a = gA[i] + t * 0.9 / Math.sqrt(gR[i] + 8);
          P[i * 3] = Math.cos(a) * rr; P[i * 3 + 1] = gY[i] * amp; P[i * 3 + 2] = Math.sin(a) * rr; }
        gal.geometry.attributes.position.needsUpdate = true; gal.material.uniforms.uOpacity.value = 0.75 * amp; } }
  }
  function focus() { const s = S.step, V3 = THREE.Vector3;
    if (s <= 0) return [new V3(140, 290, 360), new V3(0, 250, 0)];
    if (s === 1) return [new V3(-120, 520, 380), new V3(-380, 300, -600)];
    if (s === 2) return [new V3(80, 560, 520), new V3(-200, 300, -320)];
    return [new V3(0, 560, 420), V.clone()]; }
  return { root, setStep, update, focus, S, V, figure: fig };
}
