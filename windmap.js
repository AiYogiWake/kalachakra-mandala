// 24-Hour Pranic Wind Map — click-only. Sourced structure vs interpretive limb clock are separated in UI copy.
import * as THREE from 'three';
import { H } from './human.js';

const TAU = Math.PI * 2;

/** Twelve two-hour shifts · 1,800 breaths each · 12 navel zodiac channels.
 * Breaths / shifts / navel-channel structure: sourced (Berzin / Study Buddhism).
 * Clock-hour alignment and limb region path: INTERPRETIVE schematic for navigation. */
export const WIND_SHIFTS = [
  { i: 0,  startH: 4.5,  endH: 6.5,  sign: 'Meṣa · Aries',       skt: 'मेष',   nostril: 'left',  elem: 'earth',  region: 'secret / perineum · ground entry', limbs: ['secret', 'hip'],       color: '#ffc928', yoga: 1, field: 'earth', floor: 'body' },
  { i: 1,  startH: 6.5,  endH: 8.5,  sign: 'Vṛṣabha · Taurus',   skt: 'वृषभ',  nostril: 'right', elem: 'water',  region: 'hips → lower belly',               limbs: ['hip', 'navel'],        color: '#7fd8ff', yoga: 1, field: 'water', floor: 'body' },
  { i: 2,  startH: 8.5,  endH: 10.5, sign: 'Mithuna · Gemini',   skt: 'मिथुन', nostril: 'left',  elem: 'fire',   region: 'navel → solar plexus',             limbs: ['navel', 'chest'],      color: '#ff4a26', yoga: 2, field: 'fire',  floor: 'speech' },
  { i: 3,  startH: 10.5, endH: 12.5, sign: 'Karka · Cancer',     skt: 'कर्क',  nostril: 'right', elem: 'air',    region: 'chest · heart portal',              limbs: ['chest', 'heart'],      color: '#5fffb0', yoga: 3, field: 'air',   floor: 'speech' },
  { i: 4,  startH: 12.5, endH: 14.5, sign: 'Siṃha · Leo',        skt: 'सिंह',  nostril: 'left',  elem: 'space',  region: 'shoulders',                        limbs: ['shoulder'],            color: '#3a46ff', yoga: 4, field: 'ether', floor: 'mind' },
  { i: 5,  startH: 14.5, endH: 16.5, sign: 'Kanyā · Virgo',      skt: 'कन्या', nostril: 'right', elem: 'earth',  region: 'shoulders → elbows',               limbs: ['shoulder', 'elbow'],   color: '#ffc928', yoga: 4, field: 'earth', floor: 'mind' },
  { i: 6,  startH: 16.5, endH: 18.5, sign: 'Tulā · Libra',       skt: 'तुला',  nostril: 'left',  elem: 'water',  region: 'elbows → wrists',                  limbs: ['elbow', 'wrist'],      color: '#7fd8ff', yoga: 5, field: 'water', floor: 'wisdom' },
  { i: 7,  startH: 18.5, endH: 20.5, sign: 'Vṛścika · Scorpio',  skt: 'वृश्चिक', nostril: 'right', elem: 'fire', region: 'wrists · palms',                   limbs: ['wrist'],               color: '#ff4a26', yoga: 5, field: 'fire',  floor: 'wisdom' },
  { i: 8,  startH: 20.5, endH: 22.5, sign: 'Dhanu · Sagittarius',skt: 'धनु',   nostril: 'left',  elem: 'air',    region: 'throat · speech',                  limbs: ['throat'],              color: '#5fffb0', yoga: 5, field: 'air',   floor: 'bliss' },
  { i: 9,  startH: 22.5, endH: 0.5,  sign: 'Makara · Capricorn', skt: 'मकर',   nostril: 'right', elem: 'space',  region: 'forehead · mind',                  limbs: ['forehead'],            color: '#3a46ff', yoga: 6, field: 'mind',  floor: 'bliss' },
  { i: 10, startH: 0.5,  endH: 2.5,  sign: 'Kumbha · Aquarius',  skt: 'कुम्भ', nostril: 'left',  elem: 'earth',  region: 'crown · bindu',                    limbs: ['crown'],               color: '#ffc928', yoga: 6, field: 'light', floor: 'bliss' },
  { i: 11, startH: 2.5,  endH: 4.5,  sign: 'Mīna · Pisces',      skt: 'मीन',   nostril: 'right', elem: 'water',  region: 'return · whole-body wash',         limbs: ['crown', 'secret'],     color: '#7fd8ff', yoga: 1, field: 'water', floor: 'body' },
];

export const BREATHS_PER_SHIFT = 1800;
export const BREATHS_PER_DAY = 21600;
export const DAWN_WINDOW = { startH: 4.5, endH: 8.5, label: '4:30–8:30 AM practice window' };

/** Sub-slots inside the dawn window — INTERPRETIVE practice map (not a fixed-text clock). */
export const DAWN_SLOTS = [
  { id: 'pre',   startH: 4.5, endH: 5.5, title: '4:30–5:30 · Pre-dawn',
    plain: 'Interpretive schematic for practice orientation. Left (lunar / cooling) channel is shown as primary before sunrise; breath visualized entering low at the secret place and lifting the central channel (avadhūti). Some practice notes image wind rising as if from the ground beneath — earth element — because dawn is when earth is said to dissolve toward water in the completion-stage order.',
    channels: 'Left (kyangma) highlighted · central avadhūti lifting',
    entry: 'Secret place / ground (interpretive)', element: 'earth → water (dawn hand-off)', limbs: ['secret', 'hip', 'navel'] },
  { id: 'dawn',  startH: 5.5, endH: 6.5, title: '5:30–6:30 · Dawn',
    plain: 'Interpretive. As light rises, the map shows the Meṣa (Aries) navel-channel shift completing: 1,800 breaths of this two-hour block. Nostril dominance flips toward the right as the next shift begins. Earth-tone particles thin into water-tone along the hips and lower belly.',
    channels: 'Shift completing · nostril flip toward right',
    entry: 'Hips / lower belly', element: 'water arising', limbs: ['hip', 'navel'] },
  { id: 'early', startH: 6.5, endH: 7.5, title: '6:30–7:30 · Early morning',
    plain: 'Interpretive. Right (solar / heating) channel shown waking for the Vṛṣabha shift. Breath still counted toward the 1,800 of the current two-hour block. Chest begins to light as the map climbs the torso.',
    channels: 'Right (roma) primary',
    entry: 'Navel → solar plexus', element: 'water abiding', limbs: ['navel', 'chest'] },
  { id: 'morn',  startH: 7.5, endH: 8.5, title: '7:30–8:30 · Morning open',
    plain: 'Interpretive close of the four-hour practice window. Hold the day’s highest pranic awareness by finishing inside the same two-hour shift rather than chasing a new limb. Cross-link: Earth→Water yoga stage, Body floor, Water field.',
    channels: 'Right abiding · both nostrils soft',
    entry: 'Chest soft · heart approach', element: 'water → fire approaching', limbs: ['chest', 'heart'] },
];

const LIMB_POS = {
  secret:   [0, H.secret, 2],
  hip:      [10, 38, 4],
  navel:    [0, H.navel, 2],
  chest:    [0, 58, 3],
  heart:    [0, H.heart, 2],
  shoulder: [16, 72, 2],
  elbow:    [20, 54, 5],
  wrist:    [8, 42, 12],
  throat:   [0, H.throat, 3],
  forehead: [0, H.forehead, 6],
  crown:    [0, H.crown, 2],
};

export function hourToLabel(h) {
  const hh = Math.floor(h) % 24, m = Math.round((h - Math.floor(h)) * 60);
  const ap = hh >= 12 ? 'PM' : 'AM'; const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

export function shiftAtHour(h) {
  const x = ((h % 24) + 24) % 24;
  for (const s of WIND_SHIFTS) {
    if (s.startH < s.endH) { if (x >= s.startH && x < s.endH) return s; }
    else if (x >= s.startH || x < s.endH) return s;
  }
  return WIND_SHIFTS[0];
}

export function createWindMap(K) {
  const { makePoints, glowSprite, makeLabel, lineMat, setFade } = K;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#02030a');
  const root = new THREE.Group(); scene.add(root);
  const pickables = [];
  const r = mulberry(9);

  // stars
  { const n = 1800, p = makePoints(n, 5, 0.55, 1); const P = p.geometry.attributes.position.array, C = p.geometry.attributes.aColor.array, S = p.geometry.attributes.aSize.array;
    for (let i = 0; i < n; i++) { const th = r() * TAU, ph = Math.acos(2 * r() - 1), rr = 900 + r() * 700; P.set([Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr, Math.sin(ph) * Math.sin(th) * rr], i * 3); const k = 0.35 + r() * 0.5; C.set([0.55 * k, 0.65 * k, k], i * 3); S[i] = 0.4 + r() * 1.8; } scene.add(p); }

  // seated figure (lighter particle body)
  const BODY_N = 5200; const body = makePoints(BODY_N, 1.2, 0.9, 0.15); root.add(body);
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

  // three channels
  const CH_N = 1800; const channels = makePoints(CH_N, 0.85, 1, 0); root.add(channels);
  const cL = new THREE.Color('#e8f0ff'), cR = new THREE.Color('#ff5a4a'), cC = new THREE.Color('#7aa8ff');

  // limb markers
  const limbSprites = {};
  for (const [k, pos] of Object.entries(LIMB_POS)) {
    const s = glowSprite('#ffd36b', 5, 0.15, 0.25); s.position.set(...pos); s.userData = { type: 'w_limb', key: k }; root.add(s); pickables.push(s); limbSprites[k] = s;
    const lab = makeLabel('', k, '#ffd36b', 2.6); lab.position.set(pos[0] + (pos[0] >= 0 ? 6 : -6), pos[1], pos[2] + 4); lab.userData.isLabel = true; root.add(lab); s.userData.lab = lab;
  }

  // circular 24h ring (12 wedges) in front of figure
  const RING_R = 78; const ringY = 55;
  const ringGroup = new THREE.Group(); ringGroup.position.set(0, ringY, 0); root.add(ringGroup);
  const wedgeHits = [];
  WIND_SHIFTS.forEach((sh) => {
    const a0 = ((sh.startH - 4.5) / 24) * TAU - Math.PI / 2;
    const a1 = ((sh.endH - 4.5 + (sh.endH < sh.startH ? 24 : 0)) / 24) * TAU - Math.PI / 2;
    const mid = (a0 + a1) / 2;
    const g = new THREE.Group();
    const n = 40; const pts = makePoints(n, 1.1, 0.85, 0.2); const P = pts.geometry.attributes.position.array, C = pts.geometry.attributes.aColor.array;
    const col = new THREE.Color(sh.color);
    for (let i = 0; i < n; i++) { const u = i / (n - 1); const a = a0 + (a1 - a0) * u; const rr = RING_R + (i % 3 - 1) * 1.2; P.set([Math.cos(a) * rr, Math.sin((a1 - a0) * 0.5) * 2 * Math.sin(u * Math.PI), Math.sin(a) * rr], i * 3); C.set([col.r, col.g, col.b], i * 3); }
    g.add(pts);
    const hit = glowSprite(sh.color, 8, 0.55, 0.2); hit.position.set(Math.cos(mid) * RING_R, 0, Math.sin(mid) * RING_R); hit.userData = { type: 'w_shift', i: sh.i }; g.add(hit); pickables.push(hit);
    const lab = makeLabel(sh.skt, hourToLabel(sh.startH), sh.color, 3.2, { px: 13, prio: 4 }); lab.position.set(Math.cos(mid) * (RING_R + 12), 2, Math.sin(mid) * (RING_R + 12)); lab.userData.isLabel = true; g.add(lab);
    ringGroup.add(g); wedgeHits.push({ g, hit, sh });
  });

  // flowing wind particles along active path
  const W_N = 900; const wind = makePoints(W_N, 1.0, 1, 0.3); root.add(wind);
  const title = makeLabel('प्राणवायुचक्र', '24-Hour Pranic Wind Map', '#ffd36b', 7, { px: 16, maxDist: 2000, prio: 5 }); title.position.set(0, 12, 40); root.add(title);
  const badge = makeLabel('', '1,800 breaths × 12 shifts = 21,600 / day', '#9fd0ff', 3.4); badge.position.set(0, 6, 42); root.add(badge);

  const S = { shift: 0, hour: 4.5, dawnSlot: null, limbs: new Set(['secret', 'hip']), prog: 0 };
  let stepT0 = 0;

  function setHour(h, t0) {
    S.hour = ((h % 24) + 24) % 24; const sh = shiftAtHour(S.hour); S.shift = sh.i; S.limbs = new Set(sh.limbs);
    S.dawnSlot = null;
    for (const d of DAWN_SLOTS) if (S.hour >= d.startH && S.hour < d.endH) { S.dawnSlot = d.id; S.limbs = new Set(d.limbs); }
    stepT0 = t0; S.prog = 0;
  }
  function setShift(i, t0) { const sh = WIND_SHIFTS[((i % 12) + 12) % 12]; setHour(sh.startH + 0.05, t0); }
  function setDawn(id, t0) { const d = DAWN_SLOTS.find((x) => x.id === id); if (!d) return; setHour(d.startH + 0.05, t0); S.dawnSlot = d.id; S.limbs = new Set(d.limbs); }
  function reset(t0) { setHour(4.5, t0); S.dawnSlot = 'pre'; S.limbs = new Set(DAWN_SLOTS[0].limbs); }

  function update(t, dt) {
    S.prog = Math.min(1, (t - stepT0) / 1.2);
    const sh = WIND_SHIFTS[S.shift];
    const col = new THREE.Color(sh.color);
    // body tint
    { const P = body.geometry.attributes.position.array, C = body.geometry.attributes.aColor.array, Sz = body.geometry.attributes.aSize.array;
      for (let i = 0; i < BODY_N; i++) {
        const y = P[i * 3 + 1], x = P[i * 3];
        let hit = 0.22;
        for (const k of S.limbs) { const lp = LIMB_POS[k]; if (!lp) continue; const d = Math.hypot(x - lp[0], y - lp[1]); hit = Math.max(hit, Math.exp(-d * d / 80)); }
        const pulse = 0.85 + 0.15 * Math.sin(t * 2.2 + i * 0.01);
        C[i * 3] = (0.25 + col.r * hit) * pulse; C[i * 3 + 1] = (0.45 + col.g * hit * 0.6) * pulse; C[i * 3 + 2] = (0.7 + col.b * hit * 0.4) * pulse;
        Sz[i] = 0.7 + hit * 1.1;
      }
      body.geometry.attributes.aColor.needsUpdate = body.geometry.attributes.aSize.needsUpdate = true;
    }
    // channels: left / right / central emphasis by nostril
    { const P = channels.geometry.attributes.position.array, C = channels.geometry.attributes.aColor.array, Sz = channels.geometry.attributes.aSize.array;
      const leftOn = sh.nostril === 'left' ? 1 : 0.25, rightOn = sh.nostril === 'right' ? 1 : 0.25;
      for (let i = 0; i < CH_N; i++) {
        const q = i / CH_N; let x, y, z, c, s;
        if (q < 0.34) { // central
          const u = q / 0.34; y = lerp(H.secret, H.crown, u); x = 0; z = 0.6; c = cC; s = 1.1;
        } else if (q < 0.67) { // left
          const u = (q - 0.34) / 0.33; y = lerp(H.navel - 2, 96, 1 - u); x = -2.6; z = 0.6; c = cL; s = 0.7 + leftOn;
        } else {
          const u = (q - 0.67) / 0.33; y = lerp(H.navel - 2, 96, 1 - u); x = 2.6; z = 0.6; c = cR; s = 0.7 + rightOn;
        }
        P.set([x, y, z], i * 3); const on = q < 0.34 ? 0.9 : (q < 0.67 ? leftOn : rightOn);
        C.set([c.r * on, c.g * on, c.b * on], i * 3); Sz[i] = s * on;
      }
      channels.geometry.attributes.position.needsUpdate = channels.geometry.attributes.aColor.needsUpdate = channels.geometry.attributes.aSize.needsUpdate = true;
    }
    // limb sprites
    for (const [k, s] of Object.entries(limbSprites)) {
      const on = S.limbs.has(k); s.material.opacity = on ? 0.85 : 0.08; s.scale.setScalar(on ? 7 + 1.5 * Math.sin(t * 3) : 3.5); if (s.userData.lab) s.userData.lab.visible = on && K.state.labels;
    }
    // ring highlight
    wedgeHits.forEach(({ hit, sh: w }) => { const on = w.i === S.shift; hit.material.opacity = on ? 0.95 : 0.28; hit.scale.setScalar(on ? 12 : 7); });
    ringGroup.rotation.y = 0; // never auto-spin

    // wind particles along limb path
    { const limbs = [...S.limbs]; const path = limbs.map((k) => LIMB_POS[k] || [0, 50, 0]);
      if (path.length === 1) path.push([path[0][0], path[0][1] + 8, path[0][2]]);
      const a = wind.geometry.attributes, P = a.position.array, C = a.aColor.array, Sz = a.aSize.array, R = a.aRand.array;
      wind.material.uniforms.uOpacity.value = 0.9;
      for (let i = 0; i < W_N; i++) {
        const u = (R[i] + t * 0.15 * (0.5 + S.prog)) % 1; const seg = Math.min(path.length - 2, Math.floor(u * (path.length - 1)));
        const local = (u * (path.length - 1)) - seg; const a0 = path[seg], a1 = path[seg + 1];
        const x = lerp(a0[0], a1[0], local) + Math.sin(t * 4 + i) * 1.2;
        const y = lerp(a0[1], a1[1], local) + Math.cos(t * 3 + i) * 0.8;
        const z = lerp(a0[2], a1[2], local) + Math.sin(t * 5 + i * 0.2) * 1.1;
        P.set([x, y, z], i * 3); C.set([col.r, col.g, col.b], i * 3); Sz[i] = 0.6 + 1.2 * Math.sin(u * Math.PI);
      }
      a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
    }
  }

  function focus() {
    const sh = WIND_SHIFTS[S.shift];
    return [new THREE.Vector3(0, 70, 160), new THREE.Vector3(0, 58, 0)];
  }

  reset(0);
  return {
    scene, root, update, setHour, setShift, setDawn, reset, focus, pickables,
    get S() { return S; },
    home: { pos: new THREE.Vector3(0, 72, 170), target: new THREE.Vector3(0, 58, 0) },
  };
}

function mulberry(seed) { let s = seed | 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
