// Elemental manifestation forms — 64 small animated particle ecosystems.
// Each generator writes a point (unit scale ≈ [-1,1]) into o: {x,y,z,s(size),w(whiteness),hue(-1 = field colour)}
const TAU = Math.PI * 2, { sin, cos, sqrt, abs, floor, PI, exp, pow, min, max, acos, atan2 } = Math;
const fr = (x) => x - floor(x);
const sm = (a, b, x) => { const t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function sph(u, v) { const th = u * TAU, ph = acos(2 * v - 1); return [sin(ph) * cos(th), cos(ph), sin(ph) * sin(th)]; }
function set(o, x, y, z) { o.x = x; o.y = y; o.z = z; }
function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

// ---- branching tree helper (roots, neurons, lightning, bronchi, blossom, fractal)
function buildTree(seed, roots, opt) {
  const r = rng(seed), segs = [];
  const { depth = 5, branches = 2, len = 0.4, spread = 0.7, decay = 0.72, grav = [0, 0, 0], jitter = 0.25 } = opt;
  function grow(p, d, L, lvl) {
    const dd = norm([d[0] + (r() - .5) * jitter + grav[0], d[1] + (r() - .5) * jitter + grav[1], d[2] + (r() - .5) * jitter + grav[2]]);
    const q = [p[0] + dd[0] * L, p[1] + dd[1] * L, p[2] + dd[2] * L];
    segs.push({ a: p, b: q, d: lvl });
    if (lvl >= depth) return;
    const nb = branches + (r() < 0.3 ? 1 : 0);
    for (let k = 0; k < nb; k++) {
      const nd = norm([dd[0] + (r() - .5) * spread * 2, dd[1] + (r() - .5) * spread * 2, dd[2] + (r() - .5) * spread * 2]);
      grow(q, nd, L * decay, lvl + 1);
    }
  }
  roots.forEach(([p, d]) => grow(p, d, len, 0));
  return { segs, maxD: depth };
}
function treePt(T, i, R, t, o, speed = 0.22, loop = true) {
  const s = T.segs[i % T.segs.length];
  const G = loop ? (fr(t * speed) * 1.35) * (T.maxD + 1) : (T.maxD + 1);
  const local = min(1, max(0, G - s.d));
  const flow = fr(R.b[i] + t * 0.6);
  const u = (R.d[i] < 0.25 ? flow : R.b[i]) * local;
  set(o, s.a[0] + (s.b[0] - s.a[0]) * u + (R.c[i] - .5) * 0.015, s.a[1] + (s.b[1] - s.a[1]) * u, s.a[2] + (s.b[2] - s.a[2]) * u + (R.a[i] - .5) * 0.015);
  o.s = R.d[i] < 0.25 ? 1.6 : 0.8; o.w = R.d[i] < 0.25 ? 0.7 : 0.1;
  return s;
}

export const INIT = {
  roots: () => buildTree(11, [[[0, 0.6, 0], [0, -1, 0]]], { depth: 6, branches: 2, len: 0.35, spread: 0.55, grav: [0, -0.35, 0] }),
  lightning: () => buildTree(7, [[[0, 0.85, 0], [0, -1, 0]]], { depth: 6, branches: 2, grav: [0, -0.5, 0], len: 0.5, spread: 0.5, decay: 0.7, jitter: 0.6 }),
  lungs: () => buildTree(5, [[[0, 0.55, 0], [-0.6, -1, 0]], [[0, 0.55, 0], [0.6, -1, 0]]], { depth: 4, branches: 2, len: 0.32, spread: 0.6, decay: 0.75 }),
  neurons: () => { const roots = []; const r = rng(3); for (let n = 0; n < 3; n++) { const c = [(n - 1) * 0.6, (r() - .5) * 0.6, (r() - .5) * 0.4]; for (let k = 0; k < 3; k++) roots.push([c, sph(r(), r())]); } const T = buildTree(9, roots, { depth: 3, branches: 2, len: 0.32, spread: 0.6, decay: 0.8 }); T.somas = [0, 1, 2].map((n) => roots[n * 3][0]); return T; },
  fractal: () => buildTree(21, [[[0, -0.9, 0], [0, 1, 0]]], { depth: 6, branches: 2, len: 0.45, spread: 0.45, decay: 0.7, jitter: 0.05 }),
  blossom: () => buildTree(31, [[[-0.2, -0.9, 0], [0.2, 1, 0.1]]], { depth: 5, branches: 2, len: 0.5, spread: 0.6, decay: 0.7 }),
  seed: () => buildTree(41, [[[0, -0.35, 0], [0, -1, 0]]], { depth: 4, branches: 2, len: 0.2, spread: 0.5, grav: [0, -0.3, 0] }),
  nada: () => { // Chladni nodal patterns sampled once
    const pats = [[1, 3], [2, 5], [3, 4]], r = rng(5), out = [];
    for (const [n, m] of pats) { const pts = []; let tries = 0; while (pts.length < 1400 && tries < 200000) { tries++; const x = r() * 2 - 1, z = r() * 2 - 1; const f = cos(n * PI * x / 2) * cos(m * PI * z / 2) - cos(m * PI * x / 2) * cos(n * PI * z / 2); if (abs(f) < 0.04) pts.push([x, z]); } out.push(pts); }
    return out;
  },
  crystal: () => { const r = rng(8), c = []; for (let k = 0; k < 7; k++) { const d = norm([(r() - .5) * 2.4, 1, (r() - .5) * 1.6]); c.push({ d, L: 0.5 + r() * 0.9, rad: 0.07 + r() * 0.1 }); } return c; },
  stone: () => { const r = rng(4), c = []; for (let k = 0; k < 5; k++) c.push([(r() - .5) * 1.1, -0.5 + r() * 0.4 + (k === 0 ? 0.3 : 0), (r() - .5) * 0.9, 0.25 + r() * 0.3]); return c; },
  dew: () => { const r = rng(2), c = []; for (let k = 0; k < 14; k++) { const x = (r() - .5) * 1.6, z = (r() - .5) * 1.2; c.push([x, z, 0.05 + r() * 0.07, r()]); } return c; },
};

const heart = (u) => { const t = u * TAU; return [16 * pow(sin(t), 3) / 17, (13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t)) / 17]; };

export const FORMS = {
  // ---------------- EARTH
  stone(i, N, R, t, o, C) { const k = floor(R.a[i] * C.length), [cx, cy, cz, rr] = C[k]; const [x, y, z] = sph(R.b[i], R.c[i]);
    const facet = 1 + 0.18 * Math.sign(sin(x * 7 + k)) * Math.sign(sin(y * 5 + z * 3));
    if (R.d[i] < 0.08) { const f = fr(R.d[i] * 12 + t * 0.15); set(o, cx + x * rr, cy - f * 0.6, cz + z * rr); o.s = 0.6 * (1 - f); return; }
    set(o, cx + x * rr * facet * 1.2, cy + y * rr * facet * 0.8, cz + z * rr * facet); o.w = 0.15 * sm(0.6, 1, sin(t + k + x * 3)); },
  bone(i, N, R, t, o) { const a = R.a[i];
    if (a < 0.55) { const x = (R.b[i] - .5) * 1.3, th = R.c[i] * TAU, rr = 0.11 + 0.03 * x * x; set(o, x, cos(th) * rr, sin(th) * rr); o.w = 0.6; }
    else if (a < 0.85) { const side = R.d[i] < .5 ? -1 : 1; const [x, y, z] = sph(R.b[i], R.c[i]); const lobe = R.a[i] < 0.7 ? 0.1 : -0.1; set(o, side * 0.72 + x * 0.17, lobe + y * 0.17, z * 0.15); o.w = 0.7; }
    else { const x = fr(R.b[i] + t * 0.08 * (R.d[i] < .5 ? 1 : -1)) * 1.3 - .65, th = R.c[i] * TAU; set(o, x, cos(th) * 0.05, sin(th) * 0.05); o.w = 0; o.hue = 0.97; o.s = 1.3; } },
  flesh(i, N, R, t, o) { const fib = floor(R.a[i] * 46), r0 = rng(fib + 1); const ang = r0() * TAU, rad = sqrt(r0());
    const con = 1 - 0.14 * (0.5 + 0.5 * sin(t * 2)); const x = (R.b[i] * 2 - 1) * 0.9 * con; const env = 0.38 * (1 - x * x / 0.81) / sqrt(con);
    const tw = x * 1.2; set(o, x, cos(ang + tw) * rad * env, sin(ang + tw) * rad * env); o.w = 0.1 + 0.3 * rad; o.hue = 0.98 + 0.04 * rad; },
  body(i, N, R, t, o) { const br = 1 + 0.04 * sin(t * 1.4); const a = R.a[i]; let p; const [x, y, z] = sph(R.b[i], R.c[i]);
    if (a < 0.12) p = [x * 0.13, 0.78 + y * 0.15, z * 0.13];
    else if (a < 0.5) p = [x * 0.27 * br, 0.2 + y * 0.38, z * 0.17 * br];
    else if (a < 0.75) { const side = R.d[i] < .5 ? -1 : 1, u = R.b[i]; p = [side * (0.1 + 0.04 * u) + x * 0.07, -0.18 - u * 0.8, z * 0.07]; }
    else { const side = R.d[i] < .5 ? -1 : 1, u = R.b[i], sw = 0.12 * sin(t * 0.8); p = [side * (0.32 + u * 0.18), 0.5 - u * 0.65, sw * u * side + z * 0.05]; }
    set(o, p[0], p[1], p[2]); o.w = 0.15; },
  mountain(i, N, R, t, o) { const th = R.a[i] * TAU, rr = sqrt(R.b[i]) * 1.0; const ridge = 0.12 * sin(th * 5) * rr + 0.06 * sin(th * 13 + rr * 9);
    const h = (1 - rr) * 1.25 + ridge - 0.6; set(o, cos(th) * rr, h, sin(th) * rr);
    o.w = h > 0.35 ? 0.9 : 0.05; if (R.d[i] < 0.06) { const f = fr(R.c[i] + t * 0.12); set(o, cos(th) * rr + (f - .5) * 0.3, 0.8 - f * 1.3, sin(th) * rr); o.w = 1; o.s = 0.7; } },
  roots(i, N, R, t, o, T) { if (R.a[i] < 0.12) { set(o, (R.b[i] - .5) * 2, 0.6 + (R.c[i] - .5) * 0.03, (R.d[i] - .5) * 1.5); o.w = 0.05; o.s = 0.7; return; } treePt(T, i, R, t, o, 0.12); },
  seed(i, N, R, t, o, T) { const g = fr(t * 0.1) * 1.3; const a = R.a[i];
    if (a < 0.25) { const [x, y, z] = sph(R.b[i], R.c[i]); const split = sm(0.0, 0.2, g) * 0.06 * Math.sign(x); set(o, x * 0.16 + split, -0.35 + y * 0.1, z * 0.1); o.w = 0.2; }
    else if (a < 0.55) { const u = R.b[i] * min(1, g / 0.7); set(o, 0.06 * sin(u * 4), -0.35 + u * 1.1, 0); o.hue = 0.3; }
    else if (a < 0.8) { const lg = sm(0.5, 1.0, g), side = R.d[i] < .5 ? -1 : 1, u = R.b[i], v = (R.c[i] - .5); const L = 0.45 * lg; set(o, side * u * L, 0.4 * min(1, g / 0.7) + 0.35 + u * L * 0.4, v * 0.18 * sin(u * PI) * lg); o.hue = 0.32; }
    else treePt(T, i, R, t, o, 0.1); },
  crystal(i, N, R, t, o, C) { const k = floor(R.a[i] * C.length), c = C[k]; const u = R.b[i]; const th = floor(R.c[i] * 6) / 6 * TAU + (R.d[i] < 0.5 ? 0 : fr(R.d[i] * 7) / 6 * TAU);
    const tip = u > 0.85 ? (1 - (u - 0.85) / 0.15) : 1; const rad = c.rad * tip; const ax = c.d; const up = [0, 1, 0];
    const s1 = norm([ax[1] * up[2] - ax[2] * up[1] + 0.001, ax[2] * up[0] - ax[0] * up[2], ax[0] * up[1] - ax[1] * up[0] + 0.001]);
    const s2 = [ax[1] * s1[2] - ax[2] * s1[1], ax[2] * s1[0] - ax[0] * s1[2], ax[0] * s1[1] - ax[1] * s1[0]];
    const L = c.L * u; set(o, ax[0] * L + (s1[0] * cos(th) + s2[0] * sin(th)) * rad, -0.8 + ax[1] * L + (s1[1] * cos(th) + s2[1] * sin(th)) * rad, ax[2] * L + (s1[2] * cos(th) + s2[2] * sin(th)) * rad);
    o.w = 0.3 + 0.7 * pow(max(0, sin(t * 1.5 + k * 1.7 - u * 3)), 8); },
  // ---------------- WATER
  mist(i, N, R, t, o) { const x = (R.a[i] - .5) * 2.2, z = (R.c[i] - .5) * 2.2; const y = (R.b[i] - .5) * 0.7 * (1 - x * x * 0.2);
    set(o, x + 0.25 * sin(t * 0.3 + R.b[i] * 6 + z), y + 0.15 * sin(t * 0.5 + R.a[i] * 9) + 0.1 * sin(x * 2 + t * 0.4), z + 0.25 * cos(t * 0.25 + R.c[i] * 7));
    o.s = 2.2; o.w = 0.5; },
  rain(i, N, R, t, o) { const a = R.a[i];
    if (a < 0.2) { set(o, (R.b[i] - .5) * 2 + 0.1 * sin(t * 0.3 + R.c[i] * 5), 0.95 + (R.c[i] - .5) * 0.15, (R.d[i] - .5) * 1.6); o.s = 2; o.w = 0.3; return; }
    if (a < 0.35) { const ph = fr(t * 0.9 + R.d[i]), rr = ph * 0.18, th = R.b[i] * TAU, cx = (fr(R.c[i] * 13) - .5) * 1.6, cz = (fr(R.c[i] * 29) - .5) * 1.3; set(o, cx + cos(th) * rr, -0.95, cz + sin(th) * rr); o.s = 1 - ph; o.w = 0.8; return; }
    const drop = floor(i / 7), k = i % 7, r0 = rng(drop + 99); const dx = (r0() - .5) * 1.8, dz = (r0() - .5) * 1.5, ph = r0(), sp = 0.8 + 0.5 * r0(); const y = 0.9 - fr(ph + t * 0.9 * sp) * 1.85 + k * 0.022; set(o, dx, y, dz); o.s = 0.9 - k * 0.1; o.w = 0.7 - k * 0.08; },
  amnion(i, N, R, t, o) { const a = R.a[i], hb = 1 + 0.06 * pow(max(0, sin(t * 6)), 6);
    if (a < 0.4) { const [x, y, z] = sph(R.b[i], R.c[i]); const r = 0.9 + 0.02 * sin(t + x * 5); set(o, x * r, y * r * 1.08, z * r); o.s = 0.6; o.w = 0.4; }
    else if (a < 0.7) { const [x, y, z] = sph(R.b[i], fr(R.c[i] + t * 0.02)); const r = 0.8 * pow(R.d[i], 0.4); set(o, x * r + 0.05 * sin(t * 0.4 + R.b[i] * 10), y * r, z * r); o.s = 0.5; o.w = 0.2; }
    else { const u = R.b[i]; const th = 0.3 + u * PI * 1.55; const rr = 0.38 * (1 - 0.25 * u) * hb; const thick = (1 - u) * 0.12 + 0.04; const [x, y, z] = sph(R.c[i], R.d[i]);
      let px = cos(th) * rr, py = sin(th) * rr; if (u < 0.12) { px *= 1.1; py *= 1.1; } set(o, px + x * thick * (u < 0.15 ? 1.8 : 1), py + y * thick * (u < 0.15 ? 1.8 : 1), z * thick); o.w = 0.5; o.hue = 0.97; } },
  kidneys(i, N, R, t, o) { const a = R.a[i], side = R.d[i] < .5 ? -1 : 1;
    if (a < 0.7) { const [x, y, z] = sph(R.b[i], R.c[i]); let px = x * 0.24, py = y * 0.42, pz = z * 0.16; if (px * side < 0) px *= (1 - 0.6 * exp(-py * py * 14)); set(o, side * 0.5 + px * side, 0.2 + py, pz); o.hue = 0.98; o.w = 0.15; }
    else { const u = fr(R.b[i] + t * 0.25); set(o, side * (0.38 - u * 0.3), 0.2 - u * 1.0, 0.05 * sin(u * 9)); if (u > 0.9) { const [x, y, z] = sph(R.c[i], R.b[i]); set(o, x * 0.15, -0.85 + y * 0.12, z * 0.15); } o.w = 0.7; o.s = 1.2; } },
  union(i, N, R, t, o) { const strand = R.a[i] < .5 ? 0 : 1, y = R.b[i] * 2 - 1; const rr = 0.35 * (0.6 + 0.4 * cos(t * 0.6)) * (1 - y * y * 0.5);
    const th = y * 5 + t * 1.2 + strand * PI; const flow = R.c[i] < 0.3 ? 0.04 * sin(t * 5 + y * 20) : 0; set(o, cos(th) * (rr + flow), y, sin(th) * (rr + flow));
    o.hue = strand ? 0.95 : 0.6; o.w = 0.2 + 0.5 * pow(max(0, cos(th - t)), 6); },
  mitosis(i, N, R, t, o) { const ph = fr(t * 0.12) * 4, k = min(3, floor(ph)), f = sm(0.15, 0.85, ph - k); const lv = [[[0, 0, 0]], [[-.3, 0, 0], [.3, 0, 0]], [[-.3, .28, 0], [-.3, -.28, 0], [.3, 0, .28], [.3, 0, -.28]], [[-.3, .28, .2], [-.3, .28, -.2], [-.3, -.28, .2], [-.3, -.28, -.2], [.3, .2, .28], [.3, -.2, .28], [.3, .2, -.28], [.3, -.2, -.28]]];
    const idx = floor(R.a[i] * 8), cur = lv[k][idx % lv[k].length]; const nxt = k < 3 ? lv[k + 1][idx % lv[k + 1].length] : cur; const ff = k < 3 ? f : 0;
    const c = [cur[0] + (nxt[0] - cur[0]) * ff, cur[1] + (nxt[1] - cur[1]) * ff, cur[2] + (nxt[2] - cur[2]) * ff]; const rr = 0.42 / pow(lv[k].length, 0.33) * (1 - 0.15 * ff);
    const [x, y, z] = sph(R.b[i], R.c[i]); const inner = R.d[i] < 0.2 ? 0.3 : 1; set(o, c[0] + x * rr * inner, c[1] + y * rr * inner, c[2] + z * rr * inner); o.w = inner < 1 ? 0.8 : 0.2; },
  waves(i, N, R, t, o) { const x = R.a[i] * 2 - 1, z = R.c[i] * 2 - 1; let y = 0.16 * sin(3 * x + t * 1.6) + 0.09 * sin(4.3 * z - t * 1.1) + 0.05 * sin(7 * (x + z) + t * 2.5);
    const crest = y > 0.18; if (crest && R.d[i] < 0.3) y += R.b[i] * 0.12; set(o, x, y - 0.2, z); o.w = crest ? 0.9 : 0.05; o.s = crest ? 1.2 : 0.8; },
  dew(i, N, R, t, o, C) { const a = R.a[i];
    if (a < 0.4) { const x = R.b[i] * 2 - 1, z = (R.c[i] - .5) * 1.4; set(o, x * 0.9, -0.25 * x * x + 0.1 * sin(z * 3) - 0.1, z); o.hue = 0.33; o.s = 0.6; return; }
    const k = floor(R.b[i] * C.length), [dx, dz, rr, ph] = C[k]; const slide = fr(t * 0.05 + ph); const x = dx + slide * 0.3 * Math.sign(dx);
    const [px, py, pz] = sph(R.c[i], R.d[i]); set(o, x + px * rr, -0.25 * x * x + 0.1 * sin(dz * 3) - 0.1 + rr + py * rr, dz + pz * rr); o.w = 0.6 + 0.4 * (py > 0.6 ? 1 : 0); },
  // ---------------- FIRE
  flame(i, N, R, t, o) { const y = fr(R.b[i] + t * 0.7 * (0.7 + 0.6 * R.c[i])); const rr = 0.38 * pow(1 - y, 0.7) * sqrt(R.a[i]) * (1 + 0.3 * sin(t * 3 + R.d[i] * 6));
    const th = R.c[i] * TAU + t; set(o, cos(th) * rr + 0.1 * sin(y * 8 - t * 5 + R.d[i]) * y, -0.8 + y * 1.8, sin(th) * rr + 0.08 * cos(y * 7 - t * 4) * y);
    o.w = (1 - y) * (1 - sqrt(R.a[i])) * 1.4; o.hue = 0.02 + 0.09 * (1 - y); o.s = 1.4 - y * 0.7; },
  digestion(i, N, R, t, o) { if (R.a[i] < 0.2) { const y = fr(R.b[i] + t * 0.3); set(o, (R.c[i] - .5) * 1.2 + 0.05 * sin(t * 4 + y * 10), -0.4 + y * 1.2, (R.d[i] - .5) * 0.8); o.s = 1.3 * (1 - y); o.w = 0.5; return; }
    const r = sqrt(R.b[i]) * 0.85, th = R.c[i] * TAU + t * (1.8 - r * 1.2); set(o, cos(th) * r, -0.5 + r * r * 0.7 + 0.05 * sin(th * 3 + t * 3), sin(th) * r); o.w = 0.3 * (1 - r); o.hue = 0.05 + 0.06 * r; },
  sun(i, N, R, t, o) { const a = R.a[i], [x, y, z] = sph(R.b[i], R.c[i]);
    if (a < 0.6) { const gr = 0.45 * (1 + 0.03 * sin(x * 20 + t * 2) * sin(y * 20 - t)); set(o, x * gr, y * gr, z * gr); o.w = 0.5 + 0.3 * sin(x * 30 + y * 30 + t * 3); o.hue = 0.1; }
    else if (a < 0.9) { const d = sph(floor(R.b[i] * 40) / 40, fr(floor(R.b[i] * 40) * 0.618)); const rr = 0.45 + fr(R.d[i] + t * 0.3) * 0.65; set(o, d[0] * rr, d[1] * rr, d[2] * rr); o.s = 1 - (rr - 0.45); o.hue = 0.08; }
    else { const u = R.d[i] * PI; set(o, 0.45 + sin(u) * 0.25 * (1 + 0.2 * sin(t)), cos(u) * 0.18, 0); o.hue = 0.02; } },
  heat(i, N, R, t, o) { const k = floor(R.a[i] * 4), dir = k % 2 ? 1 : -1, ph = R.b[i] * TAU + t * 1.1 * dir; set(o, (k - 1.5) * 0.5 + cos(ph) * 0.22, sin(ph) * 0.6, (R.c[i] - .5) * 1.2);
    o.hue = 0.0 + 0.1 * (0.5 + 0.5 * sin(ph)); o.w = 0.3 * max(0, -sin(ph)); },
  lightning(i, N, R, t, o, T) { const fl = pow(max(0, sin(t * 2.2)), 30) + 0.25 * pow(max(0, sin(t * 2.2 + 0.4)), 30);
    if (R.a[i] < 0.25) { set(o, (R.b[i] - .5) * 2, 0.95 + (R.c[i] - .5) * 0.2, (R.d[i] - .5) * 1.4); o.s = 2; o.w = fl; o.hue = 0.66; return; }
    treePt(T, i, R, 0, o, 0, false); o.s = 0.8 + 1.3 * fl; o.w = 0.25 + 0.75 * fl; o.hue = 0.62; },
  sparks(i, N, R, t, o) { const y = fr(R.b[i] + t * 0.35 * (0.6 + R.d[i])); const sw = 0.35 * y; set(o, (R.a[i] - .5) * 0.6 + sw * sin(t * 2 + y * 5 + R.c[i] * 10), -0.8 + y * 1.8, (R.c[i] - .5) * 0.5 + sw * cos(t * 1.7 + y * 4 + R.a[i] * 9));
    o.s = (1 - y) * 1.4 * (0.6 + 0.4 * sin(t * 9 + R.a[i] * 50)); o.w = 0.4 * (1 - y); o.hue = 0.04 + 0.06 * (1 - y); },
  kunda(i, N, R, t, o) { if (R.a[i] < 0.45) { const lvl = floor(R.b[i] * 3), s = 0.8 - lvl * 0.15, e = R.c[i] * 4, side = floor(e), u = fr(e) * 2 - 1; const p = [[u, -1], [1, u], [-u, 1], [-1, -u]][side];
      set(o, p[0] * s, -0.7 + lvl * 0.1, p[1] * s); o.hue = 0.12; o.w = 0.3; o.s = 0.7; return; }
    const y = fr(R.b[i] + t * 0.8); const rr = 0.55 * pow(1 - y, 1.2) * sqrt(R.c[i]); const th = R.d[i] * TAU; set(o, cos(th) * rr + 0.08 * sin(t * 4 + y * 9), -0.55 + y * 1.3, sin(th) * rr); o.hue = 0.03 + 0.08 * (1 - y); o.w = 0.6 * (1 - y); },
  lamp(i, N, R, t, o) { const a = R.a[i];
    if (a < 0.35) { const th = R.b[i] * TAU, u = R.c[i]; const rr = 0.45 * sqrt(u); set(o, cos(th) * rr, -0.55 + u * 0.3, sin(th) * rr); o.hue = 0.12; o.w = 0.4; o.s = 0.7; return; }
    if (a < 0.8) { const u = R.b[i]; const rr = 0.14 * sin(u * PI) * pow(1 - u, 0.3) * sqrt(R.c[i]); const th = R.d[i] * TAU; set(o, cos(th) * rr + 0.015 * sin(t * 7) * u, -0.2 + u * 0.55, sin(th) * rr); o.w = 1 - u * 0.6; o.hue = 0.1; o.s = 1.2; return; }
    const th = R.b[i] * TAU, rr = 0.45 + 0.03 * sin(t * 2); set(o, cos(th) * rr, 0.05 + sin(th) * rr, (R.c[i] - .5) * 0.05); o.s = 0.6; o.w = 0.6; o.hue = 0.11; },
  // ---------------- DESIRE
  attraction(i, N, R, t, o) { const d = 0.65 * (0.5 + 0.5 * cos(t * 0.5)), ang = t * (1.6 - d); const side = R.a[i] < .5 ? 1 : -1;
    if (R.d[i] < 0.2) { const u = R.b[i]; const x = cos(ang) * d * (2 * u - 1), z = sin(ang) * d * (2 * u - 1); set(o, x, 0.12 * sin(u * PI) * sin(t * 3 + u * 10), z); o.s = 0.6; o.w = 0.5; return; }
    const [x, y, z] = sph(R.b[i], R.c[i]); const rr = 0.22; set(o, side * cos(ang) * d + x * rr, y * rr, side * sin(ang) * d + z * rr); o.hue = side > 0 ? 0.92 : 0.02; o.w = 0.2 + 0.5 * (1 - d); },
  heart(i, N, R, t, o) { const beat = pow(max(0, sin(t * 3.2)), 8) * 0.1 + pow(max(0, sin(t * 3.2 - 0.6)), 8) * 0.06;
    if (R.a[i] < 0.25) { const [x, y, z] = sph(R.b[i], R.c[i]); const rr = 1.25 * (1 - fr(R.d[i] + t * 0.25)); set(o, x * rr, y * rr, z * rr); o.s = 0.6 + 0.4 * (1 - rr); o.w = 0.2; return; }
    const [hx, hy] = heart(R.b[i]); const fill = sqrt(R.c[i]); const th = (R.d[i] - .5) * 0.5 * (1 - fill * 0.3); const s = 0.6 * (1 + beat);
    set(o, hx * fill * s, hy * fill * s, th * s); o.w = 0.15 + 0.5 * fill * beat * 10; o.hue = 0.96; },
  longing(i, N, R, t, o) { if (R.a[i] < 0.15) { const [x, y, z] = sph(R.b[i], R.c[i]); const rr = 0.08 * (1 + 0.5 * sin(t * 2)); set(o, 0.85 + x * rr, 0.45 + y * rr, z * rr); o.w = 0.9; o.s = 1.4; return; }
    const u = fr(R.b[i] + t * 0.12) * 0.94; const reach = 0.9 + 0.06 * sin(t * 0.7); const x = -0.9 + u * 1.75 * reach, y = -0.5 + u * 0.9 + 0.18 * sin(u * 5 - t * 1.5), z = 0.2 * sin(u * 4 + t);
    const sp = (1 - u) * 0.12; set(o, x + (R.c[i] - .5) * sp, y + (R.d[i] - .5) * sp, z); o.s = 0.6 + u; o.w = u * 0.5; o.hue = 0.92 + 0.08 * u; },
  lotus(i, N, R, t, o) { const open = 0.5 + 0.5 * sin(t * 0.35); const layer = R.a[i] < 0.5 ? 0 : 1, np = 8, p = floor(R.b[i] * np), az = (p + layer * 0.5) / np * TAU;
    const u = R.c[i], v = (R.d[i] - .5) * 2; const L = layer ? 0.6 : 0.85, W = 0.28 * sin(u * PI); const tilt = (layer ? 0.35 : 0.6) + open * (layer ? 0.4 : 0.8);
    const r = u * L * sin(tilt), h = u * L * cos(tilt) + 0.15 * u * u; const lat = v * W; set(o, cos(az) * r - sin(az) * lat, -0.3 + h, sin(az) * r + cos(az) * lat);
    o.w = 0.1 + 0.5 * (1 - u); o.hue = 0.93 + 0.05 * u; if (R.a[i] > 0.95) { const [x, y, z] = sph(R.b[i], R.c[i]); set(o, x * 0.1, -0.25 + y * 0.08, z * 0.1); o.hue = 0.13; o.w = 0.5; } },
  embrace(i, N, R, t, o) { const ring = R.a[i] < .5 ? 0 : 1, th = R.b[i] * TAU + t * 0.6 * (ring ? 1 : -1); const rr = 0.55; let x = cos(th) * rr, y = sin(th) * rr, z = 0;
    if (ring) { const tx = x + 0.28; x = tx; [y, z] = [0, y]; } else x -= 0.28; const tw = t * 0.3; set(o, x * cos(tw) - z * sin(tw), y, x * sin(tw) + z * cos(tw));
    const tube = 0.05 * sqrt(R.c[i]); o.x += (R.d[i] - .5) * tube; o.y += (R.c[i] - .5) * tube; o.hue = ring ? 0.0 : 0.88; o.w = 0.2; },
  nectar(i, N, R, t, o) { if (R.a[i] < 0.35) { const x = R.b[i] * 2 - 1, z = (R.c[i] - .5) * 1.2; set(o, x, 0.75 + 0.04 * sin(x * 6 + t), z); o.hue = 0.1; o.w = 0.3; return; }
    const k = floor(R.b[i] * 7), x0 = -0.8 + k * 0.27, z0 = (fr(k * 0.37) - .5) * 0.8; const ph = fr(t * 0.18 + k * 0.29); const stretch = sm(0, 0.6, ph) * 0.5, fall = max(0, ph - 0.6) / 0.4;
    const u = R.c[i]; if (R.d[i] < 0.5) { set(o, x0 + (R.a[i] - .5) * 0.03 * (1 - u), 0.75 - u * stretch * (fall > 0 ? 0.6 : 1), z0); } else { const [px, py, pz] = sph(R.c[i], R.a[i]); const dr = 0.06; set(o, x0 + px * dr, 0.75 - stretch - fall * fall * 1.4 + py * dr * 1.3, z0 + pz * dr); }
    o.hue = 0.09; o.w = 0.5; },
  magnet(i, N, R, t, o) { const lines = 10, k = floor(R.a[i] * lines), phi = (k % 5) / 5 * PI, L = 0.4 + 0.25 * floor(k / 5); const th = 0.15 + fr(R.b[i] + t * 0.2) * (PI - 0.3); const r = L * pow(sin(th), 2) * 2;
    const x = r * sin(th), y = r * cos(th); set(o, x * cos(phi), y, x * sin(phi)); o.hue = (y > 0 ? 0.92 : 0.0); o.w = 0.2;
    if (R.d[i] < 0.12) { const s = R.d[i] < 0.06 ? 1 : -1; const [px, py, pz] = sph(R.b[i], R.c[i]); set(o, px * 0.06, s * 0.1 + py * 0.06, pz * 0.06); o.w = 1; } },
  blossom(i, N, R, t, o, T) { const sg = treePt(T, i, R, t, o, 0.08); o.hue = 0.05; o.w = 0.05;
    if (sg.d >= T.maxD - 1 && R.a[i] < 0.6) { const bl = sm(0.75, 1.0, fr(t * 0.08) * 1.35); const [x, y, z] = sph(R.c[i], R.a[i]); const rr = 0.1 * bl; set(o, sg.b[0] + x * rr, sg.b[1] + y * rr, sg.b[2] + z * rr); o.hue = 0.92; o.w = 0.5; o.s = 1.2; } },
  // ---------------- ETHER
  hollow(i, N, R, t, o) { const sh = floor(R.a[i] * 3), r = 0.3 + sh * 0.3, sp = (sh % 2 ? 1 : -1) * 0.2 * (sh + 1); const lat = R.b[i] < 0.5;
    let th, ph; if (lat) { th = R.c[i] * TAU; ph = (floor(R.d[i] * 6) + 0.5) / 6 * PI; } else { th = floor(R.d[i] * 8) / 8 * TAU; ph = R.c[i] * PI; }
    th += t * sp; set(o, sin(ph) * cos(th) * r, cos(ph) * r, sin(ph) * sin(th) * r); o.s = 0.6; o.w = 0.2; },
  channels(i, N, R, t, o) { const ch = floor(R.a[i] * 3), y = R.b[i] * 2 - 1; const flow = fr(R.c[i] + t * 0.3) * 2 - 1;
    if (ch === 0) { set(o, (R.d[i] - .5) * 0.03, y, 0); o.hue = 0.62; o.w = abs(y - flow) < 0.06 ? 1 : 0.3; o.s = 1.2; }
    else { const s = ch === 1 ? 1 : -1; const x = s * 0.22 * sin(y * PI * 2.5); set(o, x, y, s * 0.06 * cos(y * PI * 2.5)); o.hue = ch === 1 ? 0.0 : 0.13; o.w = ch === 2 ? 0.8 : 0.1; }
    if (R.d[i] < 0.08) { const yy = flow; set(o, 0, yy, 0); o.w = 1; o.s = 2; } },
  silence(i, N, R, t, o) { const [x, y, z] = sph(R.a[i], R.b[i]); const rr = 0.4 + 0.6 * R.c[i]; set(o, x * rr + 0.05 * sin(t * 0.1 + R.d[i] * 9), y * rr, z * rr);
    o.s = (R.d[i] < 0.2 ? 1.3 : 0.35) * pow(max(0, sin(t * 0.35 + R.d[i] * TAU)), 3); o.w = 0.6; },
  chakras(i, N, R, t, o) { const hs = [-0.85, -0.5, -0.1, 0.25, 0.55, 0.85], pet = [32, 8, 64, 16, 32, 4]; if (R.a[i] < 0.12) { set(o, 0, R.b[i] * 1.9 - 0.95, 0); o.hue = 0.62; o.s = 0.8; return; }
    const k = floor(R.c[i] * 6), th = R.b[i] * TAU, petals = pet[k]; const r = 0.12 + 0.18 * pow(abs(cos(th * petals / 2)), 0.5) * R.d[i] + 0.12; const sp = t * (k % 2 ? 0.6 : -0.6);
    set(o, cos(th + sp) * r, hs[k], sin(th + sp) * r); o.hue = [0.0, 0.08, 0.15, 0.33, 0.6, 0.78][k]; o.w = 0.3; },
  nada(i, N, R, t, o, P) { const ph = fr(t * 0.08) * 3, k = floor(ph), f = sm(0.6, 1, ph - k); const A = P[k % 3], B = P[(k + 1) % 3]; const a = A[i % A.length], b = B[i % B.length];
    const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f; set(o, x * 0.95, 0.03 * sin(t * 30 + i) * (1 - abs(f - 0.5) * 2) + (1 - f) * 0, z * 0.95); o.w = 0.4; o.s = 0.8; },
  sky(i, N, R, t, o) { const th = R.a[i] * TAU + t * 0.05, ph = acos(R.b[i]) ; const r = 1.0; set(o, sin(ph) * cos(th) * r, -0.5 + cos(ph) * r * 0.95, sin(ph) * sin(th) * r);
    o.s = 0.4 + 0.8 * pow(max(0, sin(t * 0.8 + R.c[i] * 30)), 6); o.w = 0.5 * R.d[i]; if (R.d[i] < 0.15) { set(o, (R.a[i] - .5) * 2, -0.5, (R.c[i] - .5) * 2); o.s = 0.4; o.w = 0; } },
  bell(i, N, R, t, o) { if (R.a[i] < 0.65) { const u = R.b[i], th = R.c[i] * TAU; const prof = 0.12 + 0.12 * u + 0.35 * pow(u, 3); set(o, cos(th) * prof, 0.55 - u * 0.95, sin(th) * prof); if (u < 0.08) { set(o, cos(th) * 0.04, 0.6 + u * 2, sin(th) * 0.04); } o.hue = 0.12; o.w = 0.3; return; }
    const k = floor(R.b[i] * 3), ph = fr(t * 0.45 + k / 3), rr = 0.6 + ph * 0.7, th = R.c[i] * TAU; set(o, cos(th) * rr, -0.4 + 0.05 * sin(th * 8 + t * 4), sin(th) * rr); o.s = (1 - ph) * 1.2; o.w = 0.5; },
  torus(i, N, R, t, o) { const u = R.a[i] * TAU, v = R.b[i] * TAU + t * 0.9 * (R.c[i] < .5 ? 1 : 1.2); const Rr = 0.6, r = 0.32; set(o, (Rr + r * cos(v)) * cos(u), r * sin(v), (Rr + r * cos(v)) * sin(u)); o.s = 0.7; o.w = 0.3 * max(0, sin(v)); },
  // ---------------- MIND
  neurons(i, N, R, t, o, T) { if (R.a[i] < 0.12) { const c = T.somas[i % 3]; const [x, y, z] = sph(R.b[i], R.c[i]); const r = 0.08 * (1 + 0.15 * Math.sin(t * 3 + i % 3)); set(o, c[0] + x * r, c[1] + y * r, c[2] + z * r); o.w = 0.8; o.s = 1.3; return; } treePt(T, i, R, t, o, 0.07); o.w = R.d[i] < 0.25 ? 1 : 0.1; },
  thirdEye(i, N, R, t, o) { const blink = 1 - pow(max(0, sin(t * 0.5)), 60); const a = R.a[i];
    if (a < 0.35) { const th = R.b[i] * TAU; const x = cos(th) * 0.85, y = sin(th) * 0.4 * pow(abs(cos(th * 0.5 + PI / 4)) * 0 + 1, 1); const vs = 0.42 * pow(1 - x * x / 0.73, 0.6) * Math.sign(sin(th)); set(o, x, vs * blink, 0); o.w = 0.3; }
    else if (a < 0.8) { const r = 0.08 + 0.24 * R.c[i], th = R.b[i] * TAU + t * 0.2 + r * 3; set(o, cos(th) * r, sin(th) * r * blink, 0.02); o.hue = 0.75 + 0.1 * r; o.w = 0.2 + (r < 0.12 ? 0.8 : 0); }
    else { const [x, y, z] = sph(R.b[i], R.c[i]); const rr = 0.95 + fr(R.d[i] + t * 0.2) * 0.4; set(o, x * rr, y * rr * 0.6, z * rr * 0.2); o.s = 0.5; o.w = 0.6; } },
  moonStars(i, N, R, t, o) { if (R.a[i] < 0.6) { let x, y, tries = 0; const r0 = rng(i * 7 + 1); do { const th = r0() * TAU, r = sqrt(r0()) * 0.5; x = cos(th) * r; y = sin(th) * r; tries++; } while (Math.hypot(x - 0.22, y - 0.1) < 0.43 && tries < 20);
      set(o, x - 0.1, y + 0.05, (R.d[i] - .5) * 0.05); o.w = 0.8; o.hue = 0.14; return; }
    const r0 = rng(i * 3 + 5); set(o, (r0() - .5) * 2, (r0() - .5) * 1.6, (r0() - .5) * 0.6); o.s = 0.4 + 1.6 * pow(max(0, sin(t * 1.3 + R.b[i] * 40)), 10); o.w = 0.9; },
  dream(i, N, R, t, o) { const x = R.a[i] * 2 - 1, z = R.c[i] * 2 - 1; let y = 0; const src = [[-0.4, -0.3, 0], [0.5, 0.2, 1.7], [-0.1, 0.5, 3.1]];
    for (const [sx, sz, p] of src) { const d = Math.hypot(x - sx, z - sz), ph = fr(t * 0.15 + p / 5) * 2.5; y += 0.08 * sin((d - ph) * 14) * exp(-pow((d - ph) * 3, 2)); }
    set(o, x, y - 0.3, z); o.w = abs(y) * 6; o.s = 0.7; if (R.d[i] < 0.08) { set(o, x * 0.8, 0.1 + fr(R.b[i] + t * 0.05) * 0.8, z * 0.8); o.s = 1.4; o.w = 0.7; o.hue = 0.6; } },
  knot(i, N, R, t, o) { const u = R.a[i] * TAU; const x = sin(u) + 2 * sin(2 * u), y = cos(u) - 2 * cos(2 * u), z = -sin(3 * u); const tube = 0.12 * sqrt(R.b[i]), th = R.c[i] * TAU;
    set(o, (x + cos(th) * tube * 3) * 0.3, (y + sin(th) * tube * 3) * 0.3, z * 0.3 + tube * cos(th)); o.w = 0.8 * pow(max(0, sin(u * 3 - t * 2)), 10); },
  galaxy(i, N, R, t, o) { const arm = floor(R.a[i] * 3), r = pow(R.b[i], 0.6) * 0.95, th = arm / 3 * TAU + r * 4.5 + t * 0.25 / (0.3 + r); const sp = 0.08 * (1 - r * 0.4);
    set(o, cos(th) * r + (R.c[i] - .5) * sp, (R.d[i] - .5) * 0.06 * (1 - r), sin(th) * r + (R.d[i] - .5) * sp); o.w = 1 - r; o.s = 0.6 + (1 - r); },
  fractal(i, N, R, t, o, T) { const s = treePt(T, i, R, t, o, 0.1); o.hue = 0.72 + s.d * 0.03; o.w = s.d / T.maxD * 0.6; },
  mandala(i, N, R, t, o) { const ring = floor(R.a[i] * 5), k = [3, 5, 8, 12, 16][ring], th = R.b[i] * TAU; const base = 0.15 + ring * 0.17; const r = base + 0.07 * abs(cos(k * th / 2)); const sp = t * 0.25 * (ring % 2 ? 1 : -1);
    set(o, cos(th + sp) * r, 0.02 * sin(t + ring), sin(th + sp) * r); o.hue = 0.7 + ring * 0.05; o.w = 0.2 + 0.6 * pow(abs(cos(k * th / 2)), 20); },
  // ---------------- AIR
  breath(i, N, R, t, o) { const br = sin(t * 0.9); const Rr = 0.55 + 0.18 * br, r = 0.25 + 0.06 * br; const u = R.a[i] * TAU, v = R.b[i] * TAU + t * 1.2 * Math.sign(cos(t * 0.9) + 0.0001);
    set(o, (Rr + r * cos(v)) * cos(u), r * sin(v) * 1.4, (Rr + r * cos(v)) * sin(u)); o.s = 0.8; o.w = 0.3 + 0.3 * br; },
  wind(i, N, R, t, o) { const x = fr(R.a[i] + t * 0.22 * (0.6 + R.d[i])) * 2.4 - 1.2; const y = (R.b[i] - .5) * 1.4 + 0.18 * sin(x * 3 + t + R.b[i] * 5), z = (R.c[i] - .5) * 1.2 + 0.1 * cos(x * 2 + t);
    set(o, x, y, z); o.s = 0.9 * sin(PI * (x + 1.2) / 2.4); o.w = 0.3; },
  lungs(i, N, R, t, o, T) { const br = 1 + 0.12 * sin(t * 0.9);
    if (R.a[i] < 0.45) { treePt(T, i, R, t, o, 0, false); o.x *= br; o.z *= br; o.w = 0.5; return; }
    if (R.a[i] < 0.5) { set(o, 0, 0.55 + R.b[i] * 0.4, 0); o.w = 0.5; return; }
    const side = R.d[i] < .5 ? -1 : 1; const [x, y, z] = sph(R.b[i], R.c[i]); const rr = 0.5 + 0.5 * R.a[i]; set(o, (side * 0.38 + x * 0.3 * rr) * br, -0.1 + y * 0.55 * rr, z * 0.25 * rr * br);
    if (o.x * side < 0.08) o.x = side * 0.08; o.s = 0.6; o.w = 0.1; o.hue = 0.97 + 0.03 * rr; },
  movement(i, N, R, t, o) { const k = floor(R.a[i] * 5), lag = R.b[i] * 1.4, tt = t * 0.7 - lag + k * 1.3; set(o, sin(tt * (1 + k * 0.1)) * 0.8, sin(tt * 2.1 + k) * 0.4, cos(tt * 1.3 + k * 2) * 0.6);
    o.s = 1.4 * (1 - R.b[i]); o.w = 1 - R.b[i]; },
  vortex(i, N, R, t, o) { const y = R.b[i] * 2 - 1, r = 0.06 + 0.55 * pow((y + 1) / 2, 1.6); const th = R.c[i] * TAU + t * 3 * (1.3 - (y + 1) * 0.3); const wob = 0.1 * sin(t + y * 2);
    set(o, cos(th) * r + wob, y, sin(th) * r); o.w = 0.2; if (R.d[i] < 0.1) { const rr = 0.2 + R.a[i] * 0.6, tt = th * 0.7; set(o, cos(tt) * rr, -0.95 + R.a[i] * 0.2, sin(tt) * rr); o.s = 0.6; } },
  flock(i, N, R, t, o) { const lag = R.a[i] * 0.5; const tt = t * 0.4 - lag; const cx = sin(tt) * 0.6, cy = sin(tt * 2.3) * 0.25, cz = cos(tt * 1.1) * 0.5; const r0 = rng(i + 3);
    const g = r0() - .5; const ox = g * 1.3 + (r0() - .5) * 0.15, oy = -Math.abs(g) * 0.5 + (r0() - .5) * 0.12, oz = (r0() - .5) * 0.4; const flap = 0.03 * sin(t * 12 + i); set(o, cx + ox + 0.05 * sin(t + i), cy + oy + flap, cz + oz); o.s = 1.0; o.w = 0.4; },
  leaves(i, N, R, t, o) { const y = 1 - fr(R.b[i] + t * 0.1) * 2; const rr = 0.35 + 0.3 * sin(y * 2 + R.d[i] * 5); const th = R.c[i] * TAU + t * 0.8 + y * 2; const tumble = 0.04 * sin(t * 5 + i);
    set(o, cos(th) * rr + tumble, y, sin(th) * rr); o.hue = 0.08 + 0.25 * R.a[i]; o.s = 1.1; o.w = 0.1; },
  pulse(i, N, R, t, o) { const k = floor(R.a[i] * 4), r = fr(t * 0.35 + k / 4) * 1.1; const [x, y, z] = sph(R.b[i], R.c[i]); set(o, x * r, y * r, z * r); o.s = 1.4 * (1 - r / 1.1); o.w = 0.4 * (1 - r); },
  // ---------------- LIGHT
  radiance(i, N, R, t, o) { const n = 56, k = floor(R.a[i] * n); const d = sph(fr(k * 0.618), (k + 0.5) / n); const r = 0.1 + fr(R.b[i] + t * 0.35) * 1.0; set(o, d[0] * r, d[1] * r, d[2] * r); o.s = 1.6 * (1 - r * 0.7); o.w = 0.9 * (1 - r); if (R.d[i] < 0.15) { const [x, y, z] = sph(R.b[i], R.c[i]); set(o, x * 0.12, y * 0.12, z * 0.12); o.w = 1; o.s = 1.6; } },
  afterglow(i, N, R, t, o) { const [x, y, z] = sph(R.a[i], R.b[i]); const r = (0.25 + 0.7 * pow(R.c[i], 0.5)) * (1 - 0.3 * fr(t * 0.05 + R.d[i])); set(o, x * r, y * r, z * r);
    o.s = 1.6 * (1 - r) * (0.6 + 0.4 * sin(t * 0.7 + R.d[i] * 9)); o.w = 0.7; },
  eclipse(i, N, R, t, o) { const th = R.a[i] * TAU; if (R.b[i] < 0.5) { const r = 0.42 + 0.03 * R.c[i]; set(o, cos(th) * r, sin(th) * r, 0); o.w = 1; o.s = 1.2; if (abs(th - fr(t * 0.05) * TAU) < 0.06) o.s = 3; return; }
    const ray = floor(R.a[i] * 30) / 30 * TAU; const r = 0.45 + pow(R.c[i], 2) * 0.6 * (0.7 + 0.3 * sin(ray * 5 + t * 0.6)); set(o, cos(ray + (R.d[i] - .5) * 0.08) * r, sin(ray + (R.d[i] - .5) * 0.08) * r, 0); o.s = 1 - (r - 0.45) * 1.4; o.w = 0.5; },
  clearLight(i, N, R, t, o) { const [x, y, z] = sph(R.a[i], R.b[i]); const r = pow(R.c[i], 0.33) * 0.95; set(o, x * r, y * r, z * r); o.s = 1.0 + 0.3 * sin(t * 0.4 + R.d[i] * 6); o.w = 0.85; o.hue = 0.58; },
  rainbow(i, N, R, t, o) { const band = floor(R.a[i] * 7), r = 0.45 + band * 0.07 + R.d[i] * 0.05, th = R.b[i] * PI; set(o, cos(th) * r, sin(th) * r - 0.4, (R.c[i] - .5) * 0.08 + 0.03 * sin(t + th * 4)); o.hue = band / 8; o.w = 0.15; o.s = 1.0 + 0.3 * sin(t * 2 + th * 6); },
  dawn(i, N, R, t, o) { const rise = 0.5 + 0.5 * sin(t * 0.25); if (R.a[i] < 0.4) { const th = R.b[i] * PI, r = 0.35 * sqrt(R.c[i]); set(o, cos(th) * r, -0.4 + rise * 0.3 + sin(th) * r * 0.9, 0); o.hue = 0.08; o.w = 0.6; return; }
    if (R.a[i] < 0.6) { set(o, R.b[i] * 2.2 - 1.1, -0.4 + (R.c[i] - .5) * 0.04, (R.d[i] - .5) * 0.5); o.hue = 0.04; o.w = 0.4; return; }
    const k = floor(R.b[i] * 15), th = (k + 0.5) / 15 * PI, r = 0.4 + fr(R.c[i] + t * 0.2) * 0.7; set(o, cos(th) * r, -0.4 + rise * 0.3 + sin(th) * r, 0); o.s = 1 - (r - 0.4); o.hue = 0.1; o.w = 0.5; },
  aurora(i, N, R, t, o) { const x = R.a[i] * 2 - 1, h = pow(R.b[i], 1.5); const z = 0.3 * sin(x * 3 + t * 0.5) + 0.1 * sin(x * 7 - t * 0.8); set(o, x, -0.5 + h * 1.2 + 0.05 * sin(x * 10 + t), z + 0.03 * sin(h * 8));
    o.hue = 0.38 + 0.4 * h; o.s = (1 - h * 0.6) * (0.7 + 0.5 * pow(max(0, sin(x * 9 - t * 2)), 4)); o.w = 0.1; },
  halo(i, N, R, t, o) { const k = floor(R.a[i] * 5), th = R.b[i] * TAU, r = 0.35 + k * 0.13; const tilt = k * 0.6 + t * 0.15 * (k % 2 ? 1 : -1); const x = cos(th) * r, y0 = sin(th) * r;
    set(o, x, y0 * cos(tilt), y0 * sin(tilt)); o.w = 0.5 + 0.5 * pow(max(0, cos(th - t * (k + 1) * 0.4)), 12); o.s = 0.8; },
};

// forms that live in a horizontal plane are tilted toward the viewer (radians about local x)
export const TILT = { galaxy: 1.15, mandala: 1.2, nada: 1.1, dream: 0.6, torus: 0.7, breath: 0.6, waves: 0.35, sky: 0.15, mitosis: 0, eclipse: 0, magnet: 0.2 };

// ---------------- transitional / climax forms used by the emanation chains (v2)
Object.assign(FORMS, {
  intent(i, N, R, t, o) { const k = R.a[i]; const r = 0.08 + 0.75 * pow(R.b[i], 1.6) * (0.85 + 0.15 * sin(t * 1.5)); const th = R.c[i] * TAU + t * (2.2 - r * 1.6) + r * 7; const ph = (R.d[i] - .5) * PI * (0.25 + r * 0.5);
    set(o, cos(th) * r * cos(ph), sin(ph) * r * 0.9, sin(th) * r * cos(ph)); o.hue = 0.12; o.w = 0.9 * (1 - r); o.s = 0.7 + (1 - r); if (k < 0.08) { const [x, y, z] = sph(R.b[i], R.c[i]); set(o, x * 0.07, y * 0.07, z * 0.07); o.w = 1; o.s = 2; } },
  gravity(i, N, R, t, o) { const u = fr(R.a[i] + t * 0.12); const r = 1.0 * pow(1 - u, 1.5) + 0.12; const th = R.b[i] * TAU + u * 9 + t * 0.4; const tilt = (R.c[i] - .5) * 0.5 * (1 - u);
    set(o, cos(th) * r, tilt * r + sin(th * 0.5) * 0.04, sin(th) * r * 0.85); o.s = 0.5 + u; o.w = u * 0.5;
    if (R.d[i] < 0.2) { const [x, y, z] = sph(R.b[i], R.c[i]); const rr = 0.18 * (0.9 + 0.1 * sin(t * 2)); set(o, x * rr, y * rr, z * rr); o.w = 0.2; o.s = 1.2; } },
  spring(i, N, R, t, o) { if (R.a[i] < 0.45) { const x = R.b[i] * 2 - 1, z = (R.c[i] - .5) * 1.2; set(o, x, 0.45 + 0.15 * sin(x * 4 + z * 3) + 0.08 * sin(x * 11), z); o.hue = 0.1; o.w = 0.05; o.s = 0.8; return; }
    if (R.a[i] < 0.8) { const k = floor(R.b[i] * 9), x0 = -0.8 + k * 0.2, ph = fr(R.c[i] + t * 0.45 + k * 0.13); set(o, x0 + 0.02 * sin(ph * 9), 0.4 - ph * 1.25, (fr(k * 0.37) - .5) * 0.6); o.hue = 0.55; o.w = 0.6; o.s = 0.9; return; }
    const th = R.b[i] * TAU, rr = 0.75 * sqrt(R.c[i]); set(o, cos(th) * rr, -0.85 + 0.02 * sin(rr * 20 - t * 3), sin(th) * rr * 0.6); o.hue = 0.56; o.w = 0.3 * (1 - rr); },
  being(i, N, R, t, o) { const a = R.a[i]; const [x, y, z] = sph(R.b[i], R.c[i]);
    if (a < 0.6) { const q = R.d[i]; let p; if (q < 0.15) p = [x * 0.12, 0.8 + y * 0.14, z * 0.12]; else if (q < 0.55) p = [x * 0.24, 0.22 + y * 0.36, z * 0.15]; else if (q < 0.8) { const s = x < 0 ? -1 : 1, u = R.b[i]; p = [s * 0.1, -0.15 - u * 0.8, z * 0.05]; } else { const s = x < 0 ? -1 : 1, u = R.b[i]; p = [s * (0.28 + u * 0.15), 0.5 - u * 0.6, z * 0.05]; }
      set(o, p[0], p[1], p[2]); o.s = 0.55; o.w = 0.15; return; }
    if (a < 0.85) { const u = fr(R.b[i] + t * 0.3); const loop = u * TAU; set(o, 0.12 * sin(loop) * (1 + 0.6 * sin(loop * 2)), 0.25 + 0.55 * cos(loop) - 0.2, 0.06 * sin(loop * 3)); o.w = 0.7; o.s = 1.1; o.hue = 0.56; return; }
    const s = R.d[i] < .5 ? -1 : 1; const g = 1 + 0.15 * sin(t * 3); set(o, s * 0.13 + x * 0.06 * g, 0.15 + y * 0.1 * g, -0.08 + z * 0.05); o.w = 0.9; o.s = 1.4; o.hue = 0.58; },
  drops(i, N, R, t, o) { const cyc = fr(t / 9), app = sm(0.0, 0.55, cyc), merge = sm(0.5, 0.75, cyc); const mx = 0.25 * (1 - merge);
    if (R.a[i] < 0.42) { const lane = R.b[i]; const u = fr(lane + t * 0.5) ; const x = -1 + u * (0.75 + app * 0.4) ; const [px, py, pz] = sph(R.c[i], R.d[i]); const head = 0.03;
      set(o, min(x, 0.2 - mx) + px * head, 0.1 * sin(u * 8 + lane * 20) * (1 - app) + py * head, (lane - .5) * 0.5 * (1 - app) + pz * head); o.w = 1; o.hue = 0.6; o.s = 0.7; return; }
    if (R.a[i] < 0.82) { const [x, y, z] = sph(R.b[i], R.c[i]); const r = 0.28 * (1 + 0.04 * sin(t * 2)); const cx = 0.45 - 0.45 * merge; set(o, cx + x * r, y * r, z * r); o.hue = 0.99; o.w = 0.3 + 0.5 * merge; o.s = 0.9;
      if (R.d[i] < 0.3) { const th = R.b[i] * TAU; set(o, cx + cos(th) * r * 1.25, sin(th) * r * 1.25 * 0.3, sin(th) * r * 1.25); o.hue = 0.6; o.w = 0.9; o.s = 0.6; } return; }
    const fl = merge * pow(max(0, sin(t * 7 + R.b[i] * 30)), 6); const d = sph(R.b[i], R.c[i]); const r = 0.3 + R.d[i] * 0.7 * merge; set(o, d[0] * r, d[1] * r, d[2] * r); o.s = fl * 1.8; o.w = 1; o.hue = 0.62; },
  blaze(i, N, R, t, o) { const y = fr(R.b[i] + t * 0.5); const r = (0.15 + 0.5 * y) * sqrt(R.a[i]) * (1 + 0.25 * sin(t * 4 + y * 9)); const th = R.c[i] * TAU + y * 6 + t * 2.5;
    set(o, cos(th) * r, -0.9 + y * 1.9, sin(th) * r); o.hue = 0.03 + 0.1 * (1 - y); o.w = 0.8 * (1 - y) * (1 - sqrt(R.a[i])); o.s = 1.5 - y; },
  kindle(i, N, R, t, o) { const [hx, hy] = heart(R.b[i]); const beat = 1 + 0.06 * pow(max(0, sin(t * 3)), 6); if (R.a[i] < 0.5) { set(o, hx * 0.6 * beat, hy * 0.6 * beat - 0.1, (R.c[i] - .5) * 0.1); o.hue = 0.97; o.w = 0.3; o.s = 0.8; return; }
    const y = fr(R.c[i] + t * 0.7); set(o, hx * 0.6 * (1 - y * 0.6) + 0.05 * sin(t * 6 + y * 9), hy * 0.6 - 0.1 + y * 0.6, (R.d[i] - .5) * 0.12); o.hue = 0.04 + 0.06 * (1 - y); o.w = 0.6 * (1 - y); o.s = 1.3 * (1 - y); },
  bloomBurst(i, N, R, t, o) { if (R.a[i] < 0.3) { const p = floor(R.b[i] * 8), az = p / 8 * TAU, u = R.c[i]; const W = 0.18 * sin(u * PI); const v = (R.d[i] - .5) * 2 * W; set(o, cos(az) * u * 0.45 - sin(az) * v, -0.2 + u * 0.25, sin(az) * u * 0.45 + cos(az) * v); o.hue = 0.93; o.w = 0.2; return; }
    const u = fr(R.b[i] + t * 0.12); const d = sph(R.c[i], 0.5 + R.d[i] * 0.5); const r = 0.3 + u * 1.0; set(o, d[0] * r + 0.1 * sin(t + i), -0.15 + d[1] * r * 0.7 + 0.2 * u, d[2] * r); o.s = 1.3 * (1 - u); o.hue = 0.9 + 0.1 * u; o.w = 0.3 + 0.5 * u; },
  constellate(i, N, R, t, o, C) { const S = C.stars, E = C.edges; if (R.a[i] < 0.3) { const s = S[i % S.length]; const [x, y, z] = sph(R.b[i], R.c[i]); const r = 0.025; set(o, s[0] + x * r, s[1] + y * r, s[2] + z * r); o.w = 1; o.s = 1.4 * (0.6 + 0.4 * sin(t * 2 + i)); return; }
    const k = i % E.length, [a, b] = E[k], g = sm(0, 1, fr(t * 0.08) * 1.6 - k / E.length); const u = fr(R.b[i] + t * 0.3) * g; const A = S[a], B = S[b]; set(o, A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u); o.s = g > 0 ? 0.6 : 0; o.w = 0.5; },
  thoughtWind(i, N, R, t, o) { const lane = floor(R.a[i] * 7); const x = fr(R.b[i] + t * 0.18 * (0.7 + lane * 0.07)) * 2.2 - 1.1; const y = -0.7 + lane * 0.23 + 0.12 * sin(x * 3 + t + lane); const z = 0.2 * sin(x * 2 + lane * 2 - t * 0.6);
    set(o, x, y, z); o.s = 0.9 * sin(PI * (x + 1.1) / 2.2); o.w = 0.2; o.hue = 0.72 + 0.03 * lane; if (R.d[i] < 0.08) { o.y += (R.c[i] - .5) * 0.12; o.w = 1; o.s = 1.4; } },
  eyeOfStorm(i, N, R, t, o) { const r = 0.25 + 0.75 * sqrt(R.b[i]); const th = R.c[i] * TAU + t * (1.6 / r) + r * 3; const arm = sin(th * 2 - r * 8); const y = 0.1 * arm * r + (R.d[i] - .5) * 0.06;
    set(o, cos(th) * r, y, sin(th) * r); o.w = 0.15; o.hue = 0.4; o.s = 0.6 + 0.4 * max(0, arm); if (R.a[i] < 0.12) { const [x, yy, z] = sph(R.b[i], R.c[i]); const rr = 0.16 * (1 + 0.1 * sin(t * 2)); set(o, x * rr, yy * rr, z * rr); o.w = 1; o.s = 1.6; o.hue = 0.13; } },
  fiveLights(i, N, R, t, o) { const k = floor(R.a[i] * 5), y = R.b[i] * 2 - 1; const th = y * 4 + t * 1.1 + k / 5 * TAU; const r = 0.28 * (1 - y * y * 0.4);
    set(o, cos(th) * r, y, sin(th) * r); const hues = [-1, 0.33, 0.0, 0.62, 0.14]; if (k === 0) { o.w = 1; o.hue = 0.6; } else { o.hue = hues[k]; o.w = 0.2; } o.s = 0.9 + 0.5 * pow(max(0, cos(th - t * 2)), 8); },
  condense(i, N, R, t, o) { if (R.a[i] < 0.55) { const y = 1 - fr(R.b[i] + t * 0.15) * 1.7; const sp = (y + 0.7) * 0.6; set(o, (R.c[i] - .5) * sp, y, (R.d[i] - .5) * sp); o.w = 0.8; o.s = 0.7; o.hue = 0.13; return; }
    const r0 = rng(floor(R.b[i] * 40) + 7); const cx = (r0() - .5) * 0.7, cz = (r0() - .5) * 0.5, sz = 0.06 + r0() * 0.08; const [x, y, z] = sph(R.c[i], R.d[i]); const f = 1 + 0.25 * Math.sign(sin(x * 9)) ;
    set(o, cx + x * sz * f, -0.75 + abs(cx) * 0.1 + y * sz, cz + z * sz * f); o.hue = 0.12; o.w = 0.4 + 0.6 * pow(max(0, sin(t * 2 + R.b[i] * 40)), 10); },
});
INIT.constellate = () => { const r = rng(77), stars = [], edges = []; for (let k = 0; k < 16; k++) stars.push([(r() - .5) * 1.8, (r() - .5) * 1.4, (r() - .5) * 0.6]);
  for (let k = 1; k < 16; k++) { let best = 0, bd = 9; for (let j = 0; j < k; j++) { const d = Math.hypot(stars[k][0] - stars[j][0], stars[k][1] - stars[j][1]); if (d < bd) { bd = d; best = j; } } edges.push([best, k]); } return { stars, edges }; };
Object.assign(TILT, { gravity: 0.5, eyeOfStorm: 0.9, intent: 0.2 });
