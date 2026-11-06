// Collapsing the Wheel of Time — click-only.
// Sourced: Changkya (tr. Kilty) 1743¾ petal + 56¼ central per great shift; Berzin deep-awareness breaths.
// User synthesis (4 min/hour · close the gap = collapse of time) is flagged separately in UI copy.
import * as THREE from 'three';
import { H } from './human.js';

const TAU = Math.PI * 2;

/** Sourced arithmetic from Changkya Rölpa Dorjé (tr. Gavin Kilty). */
export const COLLAPSE_MATH = {
  petalPerShift: 1743.75,
  centralPerShift: 56.25,
  breathsPerShift: 1800,
  shiftsPerDay: 12,
  breathsPerDay: 21600,
  // 56.25 × 12 = 675 (NOT 720)
  centralPerDay: 675,
  centralFraction: 56.25 / 1800, // 0.03125 = 3.125%
  // Assume a great shift ≈ 7200 s (≈ 2 h). Central duration per shift = 3.125% × 7200 = 225 s.
  shiftSeconds: 7200,
  centralSecondsPerShift: 225, // 3 m 45 s
  // Per clock-hour: 225 / 2 = 112.5 s ≈ 1 m 52.5 s
  centralSecondsPerHourSourced: 112.5,
  // User's interpretive datum
  centralSecondsPerHourUser: 240, // 4 minutes
};

export function createCollapse(K) {
  const { makePoints, glowSprite, makeLabel, lineMat, setFade, state } = K;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#02030a');
  const root = new THREE.Group(); scene.add(root);
  const pickables = [];
  const r = mulberry(21);
  const M = COLLAPSE_MATH;

  // stars
  { const n = 1600, p = makePoints(n, 5, 0.5, 1); const P = p.geometry.attributes.position.array, C = p.geometry.attributes.aColor.array, S = p.geometry.attributes.aSize.array;
    for (let i = 0; i < n; i++) { const th = r() * TAU, ph = Math.acos(2 * r() - 1), rr = 850 + r() * 700; P.set([Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr, Math.sin(ph) * Math.sin(th) * rr], i * 3); const k = 0.3 + r() * 0.45; C.set([0.45 * k, 0.55 * k, k], i * 3); S[i] = 0.35 + r() * 1.6; } scene.add(p); }

  // seated figure
  const BODY_N = 4800; const body = makePoints(BODY_N, 1.15, 0.9, 0.12); root.add(body);
  const base = new Float32Array(BODY_N * 3);
  const cap = (a, b, rad) => { const u = r(); const th = r() * TAU; const p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(...d) || 1; const n = [d[0] / l, d[1] / l, d[2] / l]; let s1 = Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]; const l1 = Math.hypot(...s1); s1 = s1.map((v) => v / l1);
    const s2 = [n[1] * s1[2] - n[2] * s1[1], n[2] * s1[0] - n[0] * s1[2], n[0] * s1[1] - n[1] * s1[0]]; return [p[0] + (s1[0] * Math.cos(th) + s2[0] * Math.sin(th)) * rad, p[1] + (s1[1] * Math.cos(th) + s2[1] * Math.sin(th)) * rad, p[2] + (s1[2] * Math.cos(th) + s2[2] * Math.sin(th)) * rad]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  function torsoW(y) { const k = [[38, 15, 11], [46, 13, 9], [55, 13.5, 8.5], [66, 16, 9], [73, 17.5, 8], [77, 9, 6]]; for (let i = 0; i < k.length - 1; i++) if (y <= k[i + 1][0]) { const t = (y - k[i][0]) / (k[i + 1][0] - k[i][0]); return [lerp(k[i][1], k[i + 1][1], t), lerp(k[i][2], k[i + 1][2], t)]; } return [9, 6]; }
  for (let i = 0; i < BODY_N; i++) {
    const q = r(); let p;
    if (q < 0.11) { const th = r() * TAU, ph = Math.acos(2 * r() - 1); p = [Math.sin(ph) * Math.cos(th) * 7.6, 88 + Math.cos(ph) * 9.6, Math.sin(ph) * Math.sin(th) * 8.6]; }
    else if (q < 0.19) p = cap([0, 76, -0.5], [0, 81, 0], 3.6);
    else if (q < 0.52) { let y = 38 + r() * 39; const [w, d] = torsoW(y); const th = r() * TAU; const c = Math.cos(th), s = Math.sin(th); const k = Math.pow(Math.abs(c), 0.7) * Math.sign(c), k2 = Math.pow(Math.abs(s), 0.7) * Math.sign(s); p = [k * w, y, k2 * d + 0.5]; }
    else if (q < 0.6) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 16.5, 73, 0], [s * 20, 52, 4], 3.6); }
    else if (q < 0.68) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 20, 52, 4], [s * 6, 40, 13], 3.0); }
    else if (q < 0.71) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 6, 40, 13], [s * 1, 41, 15], 3.2); }
    else if (q < 0.84) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 8, 38, 1], [s * 30, 31, 12], 6); }
    else if (q < 0.95) { const s = r() < 0.5 ? -1 : 1; p = cap([s * 30, 31, 12], [-s * 9, 33, 21], 4.5); }
    else { const th = r() * TAU, rr = 40 + r() * 2; p = [Math.cos(th) * rr, 27, Math.sin(th) * rr]; }
    base.set(p, i * 3);
  }
  body.geometry.attributes.position.array.set(base);

  // central channel tube (always primary)
  const CH_N = 2200; const channel = makePoints(CH_N, 0.95, 1, 0); root.add(channel);
  const cC = new THREE.Color('#9ec8ff');

  // 60-minute ring in front of figure
  const RING_R = 72; const ringY = 58;
  const ringGroup = new THREE.Group(); ringGroup.position.set(0, ringY, 0); root.add(ringGroup);

  // dark gap arc (full hour minus window) — particle belt
  const GAP_N = 720; const gapPts = makePoints(GAP_N, 0.9, 0.55, 0.15); ringGroup.add(gapPts);
  // luminous window arc
  const WIN_N = 180; const winPts = makePoints(WIN_N, 1.3, 1, 0.35); ringGroup.add(winPts);
  // hand / marker (moves only when scrubbed — never auto)
  const hand = glowSprite('#ffd36b', 10, 0.85, 0.25); ringGroup.add(hand); hand.userData = { type: 'c_hand' };

  // day ring of 12 small windows (one per great shift)
  const DAY_R = 92; const dayGroup = new THREE.Group(); dayGroup.position.set(0, ringY, 0); root.add(dayGroup);
  const dayWins = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    const s = glowSprite('#7aa8ff', 5, 0.45, 0.2);
    s.position.set(Math.cos(a) * DAY_R, 0, Math.sin(a) * DAY_R);
    s.userData = { type: 'c_shift', i }; dayGroup.add(s); pickables.push(s); dayWins.push(s);
  }

  // continuous stream particles (activate on close-gap)
  const ST_N = 1400; const stream = makePoints(ST_N, 1.15, 1, 0); root.add(stream);

  // local bindu (visual link; palace bindu glare untouched)
  const bindu = new THREE.Group(); bindu.position.set(0, H.heart, 0.8); root.add(bindu);
  const bCore = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.85, 0.12) }));
  const bGlow = glowSprite('#ffd21a', 14, 0.7, 0.12);
  const bHalo = glowSprite('#ffae00', 32, 0.28, 0.05);
  bindu.add(bHalo, bGlow, bCore);
  bCore.userData = { type: 'c_bindu' }; pickables.push(bCore);

  const title = makeLabel('कालचक्रनिरोध', 'Collapsing the Wheel of Time', '#ffd36b', 7, { px: 16, maxDist: 2000, prio: 5 }); title.position.set(0, 14, 38); root.add(title);
  const badge = makeLabel('', '56¼ central winds / shift · 675 / day (sourced)', '#9fd0ff', 3.2); badge.position.set(0, 8, 40); root.add(badge);

  const S = {
    minute: 0,           // 0..60 scrub within the hour
    windowMode: 'sourced', // 'sourced' | 'user'
    closed: false,
    closeProg: 0,        // 0..1 after click
    closeT0: 0,
    wheelFrozen: false,
  };
  let stepT0 = 0;

  function windowSeconds() { return S.windowMode === 'user' ? M.centralSecondsPerHourUser : M.centralSecondsPerHourSourced; }
  function windowFrac() { return windowSeconds() / 3600; } // of the hour ring

  function setMinute(m, t0) { S.minute = Math.max(0, Math.min(60, m)); stepT0 = t0; }
  function setWindowMode(mode, t0) { S.windowMode = mode === 'user' ? 'user' : 'sourced'; stepT0 = t0; }
  function closeGap(t0) { if (S.closed) return; S.closed = true; S.closeT0 = t0; S.closeProg = 0; S.wheelFrozen = true; }
  function reset(t0) { S.minute = 0; S.windowMode = 'sourced'; S.closed = false; S.closeProg = 0; S.closeT0 = 0; S.wheelFrozen = false; stepT0 = t0; }

  function paintRing() {
    const wf = windowFrac();
    // Place the luminous window ending at "now" (minute hand) so the gap is the dark remainder.
    // Window occupies the last wf of the hour behind the hand — or centered on hand.
    const handA = (S.minute / 60) * TAU - Math.PI / 2;
    const winSpan = wf * TAU;
    const a0 = handA - winSpan;
    const a1 = handA;
    // gap: full ring, dim
    { const P = gapPts.geometry.attributes.position.array, C = gapPts.geometry.attributes.aColor.array, Sz = gapPts.geometry.attributes.aSize.array;
      for (let i = 0; i < GAP_N; i++) {
        const u = i / GAP_N; const a = u * TAU - Math.PI / 2;
        // is this angle inside the window?
        let da = ((a - a0) % TAU + TAU) % TAU;
        const inWin = da <= winSpan;
        const fill = S.closeProg; // as closeProg rises, gap brightens (gap closes)
        const bright = inWin ? 0 : lerp(0.08, 0.85, fill);
        const rr = RING_R + (i % 5 - 2) * 0.6;
        P.set([Math.cos(a) * rr, Math.sin(u * TAU * 2) * 0.4, Math.sin(a) * rr], i * 3);
        if (inWin) { C.set([0.05, 0.06, 0.1], i * 3); Sz[i] = 0.2; }
        else {
          const g = 0.12 + bright * 0.7;
          C.set([0.15 + bright * 0.7, 0.35 + bright * 0.5, 0.75 + bright * 0.25], i * 3);
          Sz[i] = 0.45 + bright * 1.4;
        }
      }
      gapPts.geometry.attributes.position.needsUpdate = gapPts.geometry.attributes.aColor.needsUpdate = gapPts.geometry.attributes.aSize.needsUpdate = true;
      gapPts.material.uniforms.uOpacity.value = 0.85;
    }
    // window arc — bright; expands to full ring as closeProg → 1
    { const P = winPts.geometry.attributes.position.array, C = winPts.geometry.attributes.aColor.array, Sz = winPts.geometry.attributes.aSize.array;
      const span = lerp(winSpan, TAU, S.closeProg);
      const start = handA - span;
      for (let i = 0; i < WIN_N; i++) {
        const u = i / (WIN_N - 1); const a = start + span * u;
        const rr = RING_R + Math.sin(u * Math.PI) * 1.8;
        P.set([Math.cos(a) * rr, 1.2, Math.sin(a) * rr], i * 3);
        const pulse = 0.75 + 0.25 * Math.sin(u * Math.PI);
        C.set([1.0 * pulse, 0.85 * pulse, 0.35 + 0.4 * S.closeProg], i * 3);
        Sz[i] = 1.2 + 1.5 * pulse + S.closeProg * 1.2;
      }
      winPts.geometry.attributes.position.needsUpdate = winPts.geometry.attributes.aColor.needsUpdate = winPts.geometry.attributes.aSize.needsUpdate = true;
      winPts.material.uniforms.uOpacity.value = 0.95;
    }
    hand.position.set(Math.cos(handA) * (RING_R + 4), 2, Math.sin(handA) * (RING_R + 4));
    hand.material.opacity = S.wheelFrozen ? 0.15 : 0.9;
    hand.scale.setScalar(S.wheelFrozen ? 4 : 10);
  }

  function update(t, dt) {
    if (S.closed) S.closeProg = Math.min(1, (t - S.closeT0) / 2.4);
    else S.closeProg = 0;

    paintRing();

    // day windows: discrete when open; merge visually when closed
    dayWins.forEach((s, i) => {
      const on = !S.closed;
      s.material.opacity = lerp(0.95, 0.2, S.closeProg) * (on || S.closeProg > 0.01 ? 1 : 0.3);
      s.scale.setScalar(lerp(6 + (i === Math.floor(S.minute / 5) % 12 ? 2 : 0), 3, S.closeProg));
    });
    // never auto-rotate the rings
    ringGroup.rotation.y = 0; dayGroup.rotation.y = 0;

    // body tint toward central blue as closed
    { const P = body.geometry.attributes.position.array, C = body.geometry.attributes.aColor.array, Sz = body.geometry.attributes.aSize.array;
      for (let i = 0; i < BODY_N; i++) {
        const y = P[i * 3 + 1], x = P[i * 3];
        const dist = Math.hypot(x, y - H.heart);
        const near = Math.exp(-dist * dist / 140);
        const pulse = 0.85 + 0.15 * Math.sin(t * 2 + i * 0.01);
        const k = lerp(0.25, 0.85, S.closeProg);
        C[i * 3] = (0.2 + 0.5 * near * k) * pulse;
        C[i * 3 + 1] = (0.4 + 0.35 * near) * pulse;
        C[i * 3 + 2] = (0.65 + 0.35 * near + 0.25 * S.closeProg) * pulse;
        Sz[i] = 0.65 + near * (0.9 + S.closeProg);
      }
      body.geometry.attributes.aColor.needsUpdate = body.geometry.attributes.aSize.needsUpdate = true;
    }

    // central channel
    { const P = channel.geometry.attributes.position.array, C = channel.geometry.attributes.aColor.array, Sz = channel.geometry.attributes.aSize.array;
      const on = 0.55 + 0.45 * S.closeProg;
      for (let i = 0; i < CH_N; i++) {
        const u = i / CH_N; const y = lerp(H.secret, H.crown, u);
        const wob = (1 - S.closeProg) * Math.sin(t * 3 + u * 20) * 0.15;
        P.set([wob, y, 0.6], i * 3);
        const bright = on * (0.7 + 0.3 * Math.sin(u * Math.PI));
        C.set([cC.r * bright, cC.g * bright, cC.b * bright], i * 3);
        Sz[i] = (0.9 + 1.6 * S.closeProg) * bright;
      }
      channel.geometry.attributes.position.needsUpdate = channel.geometry.attributes.aColor.needsUpdate = channel.geometry.attributes.aSize.needsUpdate = true;
      channel.material.uniforms.uOpacity.value = 0.95;
    }

    // continuous stream up the central channel after close
    { const a = stream.geometry.attributes, P = a.position.array, C = a.aColor.array, Sz = a.aSize.array, R = a.aRand.array;
      const op = S.closeProg;
      stream.material.uniforms.uOpacity.value = op * 0.95;
      for (let i = 0; i < ST_N; i++) {
        if (op < 0.01) { P.set([0, -999, 0], i * 3); Sz[i] = 0; continue; }
        const u = (R[i] + t * 0.22 * op) % 1;
        const y = lerp(H.secret - 4, H.crown + 6, u);
        const rad = (1 - op) * 8 + (1 - u) * 1.2;
        const th = R[i] * TAU + t * 1.5;
        P.set([Math.cos(th) * rad * (1 - op * 0.85), y, 0.6 + Math.sin(th) * rad * (1 - op * 0.85)], i * 3);
        C.set([1, 0.9, 0.45 + 0.4 * u], i * 3); Sz[i] = (0.7 + 1.4 * Math.sin(u * Math.PI)) * op;
      }
      a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
    }

    // bindu brightens with close (local only — palace glare untouched)
    const I = 0.55 + 0.9 * S.closeProg;
    const pulse = 1 + 0.1 * Math.sin(t * 3.1);
    bCore.material.color.setRGB(1.0 * I, 0.82 * I, 0.12 * I);
    bCore.scale.setScalar((0.9 + 0.5 * S.closeProg) * pulse);
    bGlow.scale.setScalar(10 * (0.8 + S.closeProg) * pulse); bGlow.material.opacity = Math.min(1, 0.5 + 0.4 * S.closeProg);
    bHalo.scale.setScalar(22 * (0.7 + S.closeProg)); bHalo.material.opacity = Math.min(0.7, 0.15 + 0.35 * S.closeProg);
  }

  function focus() { return [new THREE.Vector3(0, 70, 165), new THREE.Vector3(0, 58, 0)]; }

  reset(0);
  return {
    scene, root, update, setMinute, setWindowMode, closeGap, reset, focus, pickables,
    get S() { return { ...S, windowSeconds: windowSeconds(), windowFrac: windowFrac() }; },
    home: { pos: new THREE.Vector3(0, 72, 170), target: new THREE.Vector3(0, 58, 0) },
    MATH: M,
  };
}

function mulberry(seed) { let s = seed | 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
