// PART J — "Anjaam, aur ek wada" (spoken lines 272..302) + END SCREEN.  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
import { defScene, stage3d, T, TW, gsap, THREE, el, image, texture, glow, glowTexture, rng, clamp, lerp, smooth, ease, noise1, W, H } from '../engine.js';
import { cap, flash, show, footage, counter, svg, shake, words, chars, ayah } from '../ui.js';
import { spaceBackdrop, galaxyField, starfield } from '../kit3d.js';
import { Q, REF } from '../quran.js';

// ───────────────────────── local helpers ─────────────────────────
const GOLD = '#F2C968';
const LL = (s) => (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0;
// reveal the words of `node` exactly on their spoken cues: on-screen word i <-> spoken word idx+i (or idx[i]) of line `key`
function sync(s, node, key, idx = 0, o = {}) {
  const ws = o.nodes || words(node);
  ws.forEach((w, i) => {
    const n = Array.isArray(idx) ? idx[Math.min(i, idx.length - 1)] : idx + i;
    const t = Math.max(o.min ?? 0.02, TW(key, n) - s.t0 - (o.lead ?? 0.08));
    s.tl.fromTo(w, { opacity: 0, y: o.y ?? 16, scale: o.sc ?? 1 }, { opacity: 1, y: 0, scale: 1, duration: o.dur ?? 0.36, ease: o.ease || 'power2.out' }, t);
  });
  return ws;
}
// C1 interpolation through keyframes [[x, [values…]], …] (finite-difference tangents) — camera paths
function hermite(keys, x) {
  const n = keys.length; if (x <= keys[0][0]) return keys[0][1].slice(); if (x >= keys[n - 1][0]) return keys[n - 1][1].slice();
  let i = 0; while (x > keys[i + 1][0]) i++;
  const x0 = keys[i][0], p0 = keys[i][1], x1 = keys[i + 1][0], p1 = keys[i + 1][1], h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
  const m = (j, c) => { const a = keys[Math.max(0, j - 1)], b = keys[Math.min(n - 1, j + 1)]; return (b[1][c] - a[1][c]) / (b[0] - a[0]); };
  return p0.map((_, c) => (2 * t3 - 3 * t2 + 1) * p0[c] + (t3 - 2 * t2 + t) * h * m(i, c) + (-2 * t3 + 3 * t2) * p1[c] + (t3 - t2) * h * m(i + 1, c));
}
const gwords = (txt, cls = 'gk') => txt.split(' ').map((w) => `<span class="${cls} goldgrad" style="display:inline-block;padding-bottom:.06em">${w}</span>`).join(' ');
const TICK = (col = GOLD, sw = 13) => `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible"><path class="tk" d="M14 54 L40 80 L88 20" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CROSS = (col = '#FF5B5B', sw = 13) => `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible"><path class="x1" d="M20 20 L80 80" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/><path class="x2" d="M80 20 L20 80" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/></svg>`;

// ---- line icons (drawn, no assets) ----
function burstIcon(seed = 5, n = 22) {
  const R = rng(seed); let rays = '', dots = '';
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.2832 + (R() - 0.5) * 0.14, r0 = 17 + R() * 6, r1 = (i % 2 ? 46 : 70) + R() * 24, c = Math.cos(a), sn = Math.sin(a);
    rays += `<line class="ray" x1="${(c * r0).toFixed(1)}" y1="${(sn * r0).toFixed(1)}" x2="${(c * r1).toFixed(1)}" y2="${(sn * r1).toFixed(1)}" stroke-width="${i % 2 ? 2.6 : 4.6}"/>`;
    if (i % 3 === 0) dots += `<circle class="dot" cx="${(c * (r1 + 10)).toFixed(1)}" cy="${(sn * (r1 + 10)).toFixed(1)}" r="${(1.8 + R() * 2).toFixed(1)}"/>`;
  }
  return `<svg viewBox="-110 -110 220 220" width="100%" height="100%" style="overflow:visible"><g class="rot"><g stroke="${GOLD}" stroke-linecap="round" fill="none">${rays}</g><g fill="#FFE9B0">${dots}</g></g><circle class="core2" r="19" fill="none" stroke="#FFE9B0" stroke-width="2" opacity=".55"/><circle class="core" r="10" fill="#FFF6DC"/></svg>`;
}
const star4 = (x, y, r) => `<path class="st" d="M${x} ${y - r} L${x + r * 0.24} ${y - r * 0.24} L${x + r} ${y} L${x + r * 0.24} ${y + r * 0.24} L${x} ${y + r} L${x - r * 0.24} ${y + r * 0.24} L${x - r} ${y} L${x - r * 0.24} ${y - r * 0.24} Z"/>`;
// the sky as a sheet being rolled up (same idea as the 3D scroll)
function scrollIcon() {
  return `<svg viewBox="0 0 240 180" width="100%" height="100%" style="overflow:visible"><g fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path class="ln" d="M150 46 H22 V134 H150"/><path class="ln" d="M150 32 V148"/><path class="ln" d="M206 32 V148"/><path class="ln" d="M150 148 A28 10 0 0 0 206 148"/>
    <ellipse class="ln" cx="178" cy="32" rx="28" ry="10"/><path class="ln" d="M194 32 A16 5.6 0 1 0 184 37 A8 3 0 1 0 172 33" stroke-width="3.2"/></g>
    <g fill="#FFE9B0">${star4(56, 78, 9)}${star4(102, 106, 6.5)}${star4(118, 68, 5)}<circle class="st" cx="78" cy="112" r="2.6"/><circle class="st" cx="132" cy="96" r="2.2"/><circle class="st" cx="40" cy="104" r="2"/></g></svg>`;
}
function bookIcon() {
  return `<svg viewBox="-180 -70 360 190" width="100%" height="100%" style="overflow:visible"><g fill="rgba(255,243,210,.07)" stroke="${GOLD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path class="ln" d="M0 -22 C-42 -46 -112 -50 -160 -34 V74 C-112 58 -42 62 0 86"/><path class="ln" d="M0 -22 C42 -46 112 -50 160 -34 V74 C112 58 42 62 0 86"/></g>
    <g fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path class="ln" d="M0 -22 V86"/><path class="ln" d="M-160 74 L-170 90 C-112 76 -42 80 0 104 C42 80 112 76 170 90 L160 74" opacity=".7"/></g></svg>`;
}
const personIcon = () => `<svg viewBox="0 0 120 150" width="96" height="120"><g fill="none" stroke="#9FB8D4" stroke-width="5" stroke-linecap="round"><circle cx="60" cy="46" r="25"/><path d="M12 138 C12 100 34 86 60 86 C86 86 108 100 108 138"/></g></svg>`;

// ---- the sky as a sheet that rolls up like a scroll (vertex shader wraps everything right of `xf` into a spiral) ----
function skySheet() {
  const Wd = 32, Hd = 16, RIN = 0.62, B = 0.62 / Math.PI;
  const uni = { map: { value: texture('/gfx/img/j_skysheet.jpg') }, xf: { value: Wd / 2 }, hw: { value: Wd / 2 }, rin: { value: RIN }, B: { value: B }, time: { value: 0 }, gain: { value: 1 }, light: { value: new THREE.Vector3(-0.55, 0.3, 0.78).normalize() } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, side: THREE.DoubleSide,
    vertexShader: `uniform float xf, hw, rin, B; varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying float vS;
      void main(){ vUv = uv; vec3 p = position; vec3 n = vec3(0.0, 0.0, 1.0); float s = p.x - xf; vS = s;
        if (s > 0.0) { float r0 = sqrt(rin * rin + B * (hw - xf)); float r = sqrt(max(r0 * r0 - B * s, 1e-4)); float th = 2.0 / B * (r0 - r);
          p.x = xf + r * sin(th); p.z = r0 - r * cos(th); n = vec3(-sin(th), 0.0, cos(th)); }
        vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform sampler2D map; uniform float time, gain; uniform vec3 light; varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying float vS;
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; vec3 v = normalize(cameraPosition - vW); vec3 tex = texture2D(map, vUv).rgb; vec3 col;
        float rolled = step(0.0, vS);
        if (gl_FrontFacing) { col = tex * gain * mix(1.0, 0.35 + 0.5 * max(dot(n, v), 0.0), rolled); col += vec3(1.0, 0.78, 0.45) * 0.10 * exp(-pow(vS / 2.2, 2.0)) * (1.0 - rolled); }
        else { float dif = max(dot(n, light), 0.0); vec3 hv = normalize(light + v); float sp = pow(max(dot(n, hv), 0.0), 42.0);
          float fl = 0.72 + 0.28 * sin(vW.y * 1.9 + time * 2.1) * sin(vW.y * 0.53 - time * 1.3);
          float fr = pow(1.0 - max(dot(n, v), 0.0), 2.2);
          col = tex * gain * (0.16 + 0.5 * dif) + vec3(0.030, 0.045, 0.095) * (0.5 + 1.1 * dif) + vec3(1.0, 0.80, 0.46) * sp * 1.25 * fl + vec3(0.95, 0.62, 0.24) * fr * 0.30; }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hd, 600, 12), mat); mesh.frustumCulled = false;
  return { mesh, uni, Wd, Hd, r0: (xf) => Math.sqrt(RIN * RIN + B * (Wd / 2 - xf)) };
}

// ---- additive point cloud with explicit positions: pts = [[x,y,z,size,r,g,b], …] ----
function cloud(pts, o = {}) {
  const N = pts.length, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), ph = new Float32Array(N), R = rng(o.seed || 3);
  pts.forEach((p, i) => { pos.set([p[0], p[1], p[2]], i * 3); col.set([p[4], p[5], p[6]], i * 3); siz[i] = p[3]; ph[i] = R() * 6.283; });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('acol', new THREE.BufferAttribute(col, 3)); g.setAttribute('size', new THREE.BufferAttribute(siz, 1)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, px: { value: o.px || 1 }, opacity: { value: 1 }, tw: { value: o.tw ?? 0.22 } },
    vertexShader: `attribute float size; attribute float phase; attribute vec3 acol; varying vec3 vC; varying float vT; uniform float time, px, tw;
      void main(){ vC = acol; vT = 1.0 - tw + tw * sin(time * 2.6 + phase); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(size * px * 10.0 / max(0.7, -mv.z), 1.5, 72.0); }`,
    fragmentShader: `varying vec3 vC; varying float vT; uniform float opacity; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = pow(clamp(1.0 - r, 0.0, 1.0), 1.5); gl_FragColor = vec4(vC * vT * 1.45, a * opacity); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}
function lineSet(vs, color, opacity = 0.5) {
  const g = new THREE.BufferGeometry().setFromPoints(vs);
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })); l.frustumCulled = false; l.userData.op = opacity; return l;
}
const sph = (R) => { const u = R() * 2 - 1, th = R() * 6.2832, q = Math.sqrt(1 - u * u); return [q * Math.cos(th), u, q * Math.sin(th)]; };

// powers-of-ten layers: each group is built around the origin so that the next (40x smaller) world sits exactly at its centre
function buildCell() {
  const g = new THREE.Group(), R = rng(11), pts = [], segs = [];
  const wob = (d) => 1 + 0.05 * Math.sin(d[0] * 5 + 1) * Math.sin(d[1] * 4 + 2) + 0.04 * Math.sin(d[2] * 6);
  for (let i = 0; i < 4400; i++) { const d = sph(R), r = (i % 2 ? 4.0 : 3.74) * wob(d); pts.push([d[0] * r, d[1] * r, d[2] * r, 1.5 + R() * 1.7, 0.30, 0.78, 1.0]); }          // double membrane
  for (let i = 0; i < 1500; i++) { const d = sph(R), r = (i % 2 ? 1.3 : 1.2) * (1 + 0.04 * Math.sin(d[0] * 7) * Math.sin(d[1] * 6)); pts.push([d[0] * r, d[1] * r, d[2] * r, 1.5 + R() * 1.5, 1.0, 0.72, 0.42]); }   // nucleus
  for (let b = 0; b < 16; b++) { const d = sph(R), rr = 2.0 + R() * 1.3, c = [d[0] * rr, d[1] * rr, d[2] * rr], sz = 0.16 + R() * 0.2, tint = b % 3 === 0 ? [0.8, 0.6, 1.0] : [0.45, 0.95, 0.85];
    for (let i = 0; i < 70; i++) { const e = sph(R), q = sz * Math.cbrt(R()); pts.push([c[0] + e[0] * q * 1.8, c[1] + e[1] * q, c[2] + e[2] * q, 1.3 + R(), tint[0], tint[1], tint[2]]); } }   // organelles
  for (let k = 0; k < 7; k++) {   // membrane rings (great circles)
    const ax = new THREE.Vector3(...sph(R)), u = new THREE.Vector3(0.3, 1, 0.2).cross(ax).normalize(), v = ax.clone().cross(u).normalize(), rr = k < 5 ? 4.02 : 1.31;
    for (let i = 0; i < 96; i++) { const a0 = i / 96 * 6.2832, a1 = (i + 1) / 96 * 6.2832; const P = (a) => { const d = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)); return d.multiplyScalar(rr * (rr > 2 ? wob([d.x, d.y, d.z]) : 1)); }; segs.push(P(a0), P(a1)); }
  }
  const pc = cloud(pts, { seed: 12 }), ln = lineSet(segs, 0x6fd8ff, 0.3); g.add(pc, ln); g.userData = { pc, ln, px: 1.0 }; return g;
}
function buildDNA() {
  const g = new THREE.Group(), pts = [], segs = [];
  const a = new THREE.Vector3(0.80, 0.50, -0.33).normalize(), u = new THREE.Vector3(0, 0, 1).cross(a).normalize(), v = a.clone().cross(u).normalize(), r = 1.15, om = 6.2832 / 3.9, c = u.clone().multiplyScalar(-r);
  const P = (t, ph) => c.clone().addScaledVector(a, t).addScaledVector(u, r * Math.cos(om * t + ph)).addScaledVector(v, r * Math.sin(om * t + ph));
  for (let i = -30; i <= 30; i++) { const t = i * 0.36, p1 = P(t, 0), p2 = P(t, 2.35);
    pts.push([p1.x, p1.y, p1.z, 6.0, 0.42, 0.85, 1.0], [p2.x, p2.y, p2.z, 6.0, 1.0, 0.80, 0.50]); segs.push(p1, p2);
    for (let j = 1; j < 7; j++) { const q = p1.clone().lerp(p2, j / 7); pts.push([q.x, q.y, q.z, 1.7, 0.5, 0.78, 0.95]); }
    for (let j = 1; j < 6; j++) { const q1 = P(t + j * 0.06, 0), q2 = P(t + j * 0.06, 2.35); pts.push([q1.x, q1.y, q1.z, 2.5, 0.32, 0.7, 0.95], [q2.x, q2.y, q2.z, 2.5, 0.9, 0.68, 0.42]); } }
  const pc = cloud(pts, { seed: 24, tw: 0.12 }), ln = lineSet(segs, 0x8fdcff, 0.34); g.add(pc, ln); g.userData = { pc, ln, px: 1.25 }; return g;
}
function buildMolecule() {
  const g = new THREE.Group(), R = rng(31), pts = [], segs = [], at = [], rho = 2.5, hex = [];
  for (let k = 0; k < 6; k++) hex.push(new THREE.Vector3(rho + rho * Math.cos(k * Math.PI / 3), rho * Math.sin(k * Math.PI / 3), 0));   // hex[3] is the origin
  hex.forEach((p, k) => { at.push(p); segs.push(p, hex[(k + 1) % 6]); });
  const out = (k, len, zz) => { const dir = hex[k].clone().sub(new THREE.Vector3(rho, 0, 0)).normalize(), q = hex[k].clone().addScaledVector(dir, len); q.z += zz; at.push(q); segs.push(hex[k], q); return q; };
  out(0, 2.4, 0.9); out(1, 2.3, -1.0); out(5, 2.3, 0.7); out(2, 2.2, 1.1); out(4, 2.2, -0.8); const q3 = out(3, 2.5, -1.2);
  [[-1.6, 1.9, 0.6], [-1.7, -1.8, -0.5]].forEach((o3) => { const q = q3.clone().add(new THREE.Vector3(...o3)); at.push(q); segs.push(q3, q); });
  at.forEach((p, i) => { const warm = i % 4 === 1, cc = warm ? [1.0, 0.78, 0.5] : [0.4, 0.85, 1.0]; pts.push([p.x, p.y, p.z, 12, cc[0], cc[1], cc[2]]);
    for (let j = 0; j < 150; j++) { const e = sph(R), q = 0.62 * Math.pow(R(), 0.7); pts.push([p.x + e[0] * q, p.y + e[1] * q, p.z + e[2] * q, 1.4 + R() * 1.2, cc[0] * 0.8, cc[1] * 0.8, cc[2] * 0.8]); } });
  const pc = cloud(pts, { seed: 32 }), ln = lineSet(segs, 0x9fe4ff, 0.4); g.add(pc, ln); g.rotation.set(-0.55, 0.35, 0.1); g.userData = { pc, ln, px: 1.2 }; return g;
}
function buildAtom() {
  const g = new THREE.Group(), R = rng(41), pts = [], gam = (k, a) => { let p = 1; for (let i = 0; i < k; i++) p *= Math.max(1e-6, R()); return -Math.log(p) * a; };
  for (let i = 0; i < 3200; i++) { const d = sph(R), r = gam(3, 0.42), b = 0.55 + 0.45 * R(); pts.push([d[0] * r, d[1] * r, d[2] * r, 1.2 + R() * 1.5, 0.30 * b, 0.80 * b, 1.0 * b]); }             // s-like cloud
  const axes = [new THREE.Vector3(1, 0.25, 0.1).normalize(), new THREE.Vector3(-0.2, 1, 0.3).normalize()];
  for (let i = 0; i < 4200; i++) { let d, ax = axes[i % 2], c; do { d = sph(R); c = d[0] * ax.x + d[1] * ax.y + d[2] * ax.z; } while (R() > c * c); const r = gam(5, 0.44), b = 0.5 + 0.5 * R();
    pts.push([d[0] * r, d[1] * r, d[2] * r, 1.1 + R() * 1.4, (i % 2 ? 0.36 : 0.26) * b, (i % 2 ? 0.86 : 0.74) * b, 1.0 * b]); }                                                              // p-like lobes
  const nuc = []; for (let i = 0; i < 14; i++) { const d = sph(R), r = 0.17 * Math.cbrt(R()); nuc.push([d[0] * r, d[1] * r, d[2] * r, 9 + R() * 4, i % 2 ? 1.0 : 0.6, i % 2 ? 0.62 : 0.85, i % 2 ? 0.35 : 1.0]); }
  const pc = cloud(pts, { seed: 42, tw: 0.45 }), nc = cloud(nuc, { seed: 43, tw: 0.1 }); g.add(pc, nc); g.userData = { pc, nc, px: 1.0 }; return g;
}
// procedural flame outline (teardrop with a swaying tip)
function flamePath(cx, by, w, h, tipx, k1, k2) {
  const f = (n) => n.toFixed(1);
  return `M${f(cx - w * 0.6)} ${f(by)} C${f(cx - w * 1.3)} ${f(by - h * 0.32)} ${f(cx - w * 0.45 + k1)} ${f(by - h * 0.62)} ${f(tipx)} ${f(by - h)} C${f(cx + w * 0.45 + k2)} ${f(by - h * 0.62)} ${f(cx + w * 1.3)} ${f(by - h * 0.32)} ${f(cx + w * 0.6)} ${f(by)} Q${f(cx)} ${f(by + h * 0.12)} ${f(cx - w * 0.6)} ${f(by)} Z`;
}

export default function ([P0, P1]) {
  // scene boundaries (B fades in on top of A, A holds until the fade is done -> true dissolve, no dip)
  const tb1 = T('272b') - 0.3, tb2 = T('276') - 0.2, tb3 = T('277') - 0.14, tb4 = T('280') - 0.2, tb5 = T('292') - 0.2, tb6 = T('294b') - 0.3, tb7 = T('296') - 0.2;
  const tb8 = Math.max(T('298') + 0.5, T('298e') - 0.25), tb9 = T('302') - 0.1;
  const tEnd = T('302e') + clamp((P1 - T('302e')) - 11.5, 0.6, 1.7);          // cliff-hanger hold, then >= 10 s of end screen

  // ───────── J1  IBTIDA ⟷ ANJAAM (272) ─────────
  defScene('j1_ibtida', P0, tb1 + 0.6, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    footage(s, 'j_cliffs', { n: 186, speed: clamp(186 / (d * 30 + 2), 0.45, 1), kb: { s0: 1.04, s1: 1.13 } });
    s.div('fill', { background: 'linear-gradient(180deg, rgba(12,7,2,.78) 0%, rgba(12,7,2,.56) 46%, rgba(6,4,2,.86) 100%)' });
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.15) 0%, rgba(233,185,85,0) 62%)' });
    const grp = s.div('fill');
    const tK = Math.max(0.12, L('272', 1) - 0.12), tI = L('272', 4) - 0.12, tLn = L('272', 6) - 0.05, tAn = L('272', 8) - 0.12, tSc = L('272', 10) - 0.08;
    // the book both statements come from
    const bk = el('div', null, { position: 'absolute', left: '820px', top: '120px', width: '280px', height: '150px' }, bookIcon()); grp.appendChild(bk);
    const bkl = el('div', 'cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '300px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.5em' }, 'JIS KITAB NE…'); grp.appendChild(bkl);
    show(s, bk, tK, null, { opacity: 0, y: -20 }, 0.6); s.tl.fromTo(bk.querySelectorAll('.ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'power2.inOut', stagger: 0.06 }, tK);
    show(s, bkl, tK + 0.15, null, { opacity: 0, y: 10 }, 0.5);
    const mk = (cx, html) => { const c = el('div', null, { position: 'absolute', left: (cx - 430) + 'px', top: '300px', width: '860px', height: '580px' }, html); grp.appendChild(c); gsap.set(c, { autoAlpha: 0 }); return c; };
    const sub = 'position:absolute;left:0;right:0;top:452px;text-align:center;font-size:32px;font-weight:700;letter-spacing:.42em;color:rgba(245,241,232,.82)';
    // left: IBTIDA + burst
    const A = mk(470, `<div style="position:absolute;left:230px;top:-20px;width:400px;height:240px;background:radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.30) 0%, rgba(233,185,85,0) 65%)"></div>
      <div class="ic" style="position:absolute;left:330px;top:0;width:200px;height:200px">${burstIcon(5)}</div>
      <div class="wd bebas sh" style="position:absolute;left:0;right:0;top:216px;text-align:center;font-size:236px;color:#fff">IBTIDA</div><div class="sb mont sh" style="${sub}">BATAYI</div>`);
    s.tl.set(A, { autoAlpha: 1 }, tI);
    s.tl.fromTo(A.querySelectorAll('.ray'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.55, ease: 'power3.out', stagger: 0.012 }, tI);
    s.tl.fromTo(A.querySelectorAll('.core, .core2'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, tI);
    s.tl.fromTo(A.querySelectorAll('.dot'), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.03 }, tI + 0.35);
    s.tl.fromTo(chars(A.querySelector('.wd')), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.035, ease: 'power3.out' }, tI);
    s.tl.fromTo(A.querySelector('.sb'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, L('272', 5) - 0.08);
    s.sfx('shimmer', tI, { gain: 0.8 });
    // connector
    const ar = svg(s, `<g fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path class="l1" d="M960 624 H806"/><path class="l2" d="M960 624 H1094"/><path class="h1" d="M826 606 L804 624 L826 642"/><path class="h2" d="M1074 606 L1096 624 L1074 642"/></g>`); grp.appendChild(ar);
    s.tl.fromTo(ar.querySelectorAll('.l1, .l2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.out' }, tLn);
    s.tl.fromTo(ar.querySelectorAll('.h1, .h2'), { opacity: 0 }, { opacity: 1, duration: 0.25 }, tLn + 0.4);
    s.sfx('whoosh', tLn, { gain: 0.5 });
    // right: ANJAAM + "?" -> scroll
    const Bc = mk(1450, `<div style="position:absolute;left:230px;top:-20px;width:400px;height:240px;background:radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.30) 0%, rgba(233,185,85,0) 65%)"></div>
      <div class="ic" style="position:absolute;left:310px;top:0;width:240px;height:200px"><div class="qm anton glowg" style="position:absolute;left:0;right:0;top:-8px;text-align:center;font-size:214px;line-height:1;color:${GOLD}">?</div><div class="sc" style="position:absolute;left:0;top:12px;width:240px;height:180px">${scrollIcon()}</div></div>
      <div class="wd bebas goldgrad" style="position:absolute;left:0;right:0;top:216px;text-align:center;font-size:236px;padding-bottom:10px">ANJAAM</div><div class="sb mont sh" style="${sub}">BHI BATAYA HAI</div>`);
    s.tl.set(Bc, { autoAlpha: 1 }, tAn);
    s.tl.fromTo(Bc.querySelector('.qm'), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, tAn);
    s.tl.fromTo(Bc.querySelector('.wd'), { opacity: 0, scale: 1.25, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }, tAn);
    s.tl.fromTo(Bc.querySelector('.sb'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, L('272', 9) - 0.08);
    s.tl.to(Bc.querySelector('.qm'), { opacity: 0, scale: 0.4, duration: 0.25, ease: 'power2.in' }, tSc);
    s.tl.fromTo(Bc.querySelectorAll('.sc .ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut', stagger: 0.05 }, tSc + 0.1);
    s.tl.fromTo(Bc.querySelectorAll('.sc .st'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(2)' }, tSc + 0.45);
    s.sfx('pop', tAn + 0.1); s.sfx('paper', tSc + 0.1); s.sfx('chime', tSc + 0.5, { gain: 0.7 });
    const rot = A.querySelector('.rot'), c2 = A.querySelector('.core2');
    s.onUpdate((lt) => { rot.setAttribute('transform', `rotate(${(lt * 5).toFixed(2)})`); c2.setAttribute('r', (19 + 3 * Math.sin(lt * 2.4)).toFixed(2)); });
    s.tl.fromTo(grp, { scale: 1 }, { scale: 1.045, duration: d, ease: 'none' }, 0);
    s.div('vig');
  }, { fin: 0.3, z: 1 });

  // ───────── J2  Al-Anbiya 21:104 — the sky rolls up like a scroll (272b–275) ─────────
  defScene('j2_scroll', tb1, tb2 + 0.4, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x000000, fov: 40, far: 900 });
    const sk = skySheet(); st.scene.add(sk.mesh);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTexture(0, 1.6), color: 0xffd39a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    st.scene.add(halo);
    const R = rng(77), sparks = [];
    for (let i = 0; i < 18; i++) { const g = glow(0xfff0cf, 1, 0, 0.0, 3.0); st.scene.add(g); sparks.push({ g, y: (R() - 0.5) * 15, ph: R() * 6.283, sp: 1.4 + R() * 2.4, a: -1.0 + R() * 1.3 }); }
    const BX = -49.6, BY = -0.4, BZ = 2.5;                                        // where "khola gaya" blooms (left of the rolled scroll)
    const burst = starfield({ count: 1500, radius: 1, seed: 9, px: 2.3 }), bcore = glow(0xfff0c8, 1, 0, 0.05, 1.8), bhalo = glow(0xffb45a, 1, 0, 0, 1.5);
    [burst, bcore, bhalo].forEach((o) => { o.position.set(BX, BY, BZ); st.scene.add(o); });
    const tR0 = L('273', 6) - 0.2, tR1 = Math.max(tR0 + 3.5, L('274e') - 0.05), dR = tR1 - tR0, t75 = L('275'), tKh = L('275', 1) - 0.12, tLp = Math.max(tKh + 0.5, L('275', 6) - 0.12);
    const camK = [
      [0, [0.0, 0.0, 15.8, 0.0, 0.0]], [tR0, [0.7, 0.0, 14.6, 0.7, 0.0]],
      [tR0 + 0.2 * dR, [8.5, 0.6, 22.5, 5.0, 0.0]], [tR0 + 0.58 * dR, [3.5, 3.2, 35.0, -4.0, -0.3]],
      [tR1, [-21, 8.0, 52.0, -25.0, -1.0]], [Math.max(tR1 + 0.6, t75 + 0.7), [-32.8, 10, 63, -32.8, -1.6]], [d + 1, [-33.4, 10.6, 60.5, -32.8, -1.6]],
    ];
    st.frame = (lt) => {
      const k = clamp((lt - tR0) / dR), p = 0.45 * k + 0.55 * k * k * (3 - 2 * k), xf = 16 - 32 * p, r0 = sk.r0(xf);
      sk.uni.xf.value = xf; sk.uni.time.value = lt;
      const on = smooth(0, 0.05, k);
      halo.position.set(xf - r0 * 0.15, 0, 0.05); halo.scale.set(r0 * 7 + 2.5, 22, 1); halo.material.opacity = 0.5 * on * (1 - 0.45 * smooth(0.92, 1, k));
      for (const q of sparks) { const tw = Math.pow(Math.max(0, Math.sin(lt * q.sp + q.ph)), 8); q.g.position.set(xf + r0 * Math.sin(q.a) * 1.01, q.y, r0 + r0 * Math.cos(q.a) * 1.01); q.g.scale.setScalar((0.5 + r0 * 0.5) * (0.6 + tw)); q.g.material.opacity = 0.95 * tw * on; }
      const c = hermite(camK, lt); st.camera.position.set(c[0], c[1], c[2]); st.camera.lookAt(c[3], c[4], 0);
      const b = clamp((lt - tKh) / 1.0), bs = ease.out3(b) * 6.0 + Math.max(0, lt - tKh) * 0.25;
      burst.visible = b > 0; burst.scale.setScalar(Math.max(0.001, bs)); burst.material.uniforms.time.value = lt; burst.rotation.z = lt * 0.05;
      bcore.scale.setScalar(1.2 + 5 * ease.out3(b)); bcore.material.opacity = b > 0 ? 0.25 + 0.75 * (1 - smooth(0.1, 1, b)) : 0; bhalo.scale.setScalar(4 + 13 * ease.out3(b)); bhalo.material.opacity = b > 0 ? 0.5 - 0.22 * b : 0;
    };
    s.sfx('swell', 0.1, { dur: 2.6 }); s.sfx('paper', Math.max(0, tR0), { gain: 0.9 }); s.sfx('riser', Math.max(0, tR1 - 2.6), { dur: 2.6, gain: 0.6 }); s.sfx('thud', tR1, { gain: 0.8 });
    // ayah card (Arabic + reference on top), translation synced word by word below
    s.div(null, { position: 'absolute', left: '0', right: '0', bottom: '0', height: '380px', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(1,2,6,.62) 55%, rgba(1,2,6,.86) 100%)' });
    const tA0 = Math.max(0.05, L('272b') - 0.1), tAr = Math.max(tA0 + 0.3, L('272b', 1));
    const ay = ayah(s, { ref: REF['21:104'], ar: Q['21:104'], tr: '', t0: tA0, tAr, dAr: clamp(L('273') - tAr - 0.25, 1.4, 3.2), size: 82, t1: t75 + 0.15, style: { bottom: 'auto', height: '520px' } });
    ay.wrap.firstChild.style.background = 'radial-gradient(ellipse at 50% 50%, rgba(1,3,9,.80) 0%, rgba(1,3,9,.58) 46%, rgba(1,3,9,0) 72%)';
    s.sfx('shimmer', tAr, { gain: 0.8 });
    const trl = (html, top) => s.div('ayah-tr sh', { position: 'absolute', left: '0', right: '0', top: top + 'px', fontSize: '43px', marginTop: '0', padding: '0 150px' }, html);
    const p1a = trl('“Jis din Hum aasman ko yun <span class="hl">lapet denge</span>', 846), p1b = trl('jaise likhe hue kaghzaat ka <span class="hl">tumaar</span> lapet diya jata hai.', 908);
    const p2a = trl('Jaise Hum ne pehli takhleeq ki <span class="hl">ibtida</span> ki thi —', 846), p2b = trl('waise hi usay <span class="hl">lautayenge</span>.”', 908);
    sync(s, p1a, '273', 0); sync(s, p1b, '273', 8); sync(s, p2a, '274', 0); sync(s, p2b, '274', 10);
    s.tl.to([p1a, p1b], { opacity: 0, y: -12, duration: 0.25, ease: 'power2.in' }, L('274') - 0.3).set([p1a, p1b], { autoAlpha: 0 }, L('274') - 0.05);
    s.tl.to([p2a, p2b], { opacity: 0, y: -12, duration: 0.3, ease: 'power2.in' }, t75 - 0.2).set([p2a, p2b], { autoAlpha: 0 }, t75 + 0.1);
    // 275: what was opened … will be rolled up
    const ref2 = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '92px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.34em' }, REF['21:104'].toUpperCase());
    show(s, ref2, t75 + 0.3, null, { opacity: 0, y: -14 }, 0.6);
    const lab = (cx, top, html, cls, st2) => s.div(cls, { position: 'absolute', left: (cx - 480) + 'px', width: '960px', top: top + 'px', textAlign: 'center', ...st2 }, html);
    const k1 = lab(548, 236, 'IBTIDA', 'mono sh', { fontSize: '26px', fontWeight: 700, letterSpacing: '.4em', color: 'rgba(245,241,232,.7)' }), k2 = lab(1372, 236, 'ANJAAM', 'mono gold sh', { fontSize: '26px', fontWeight: 700, letterSpacing: '.4em' });
    const l1 = lab(548, 766, 'KHOLA GAYA', 'bebas sh', { fontSize: '104px', color: '#fff' }), l2 = lab(1372, 766, 'LAPET DIYA JAYEGA', 'bebas goldgrad', { fontSize: '104px', paddingBottom: '8px' });
    show(s, k1, tKh, null, { opacity: 0, y: 10 }, 0.4); sync(s, l1, '275', 1);
    show(s, k2, tLp, null, { opacity: 0, y: 10 }, 0.4); show(s, l2, tLp, null, { opacity: 0, scale: 1.18, y: 16 }, 0.5);
    const arw = svg(s, `<g fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path class="l" d="M770 500 H1150"/><path class="h" d="M1124 478 L1152 500 L1124 522"/></g>`);
    const tAw = Math.max(tKh + 0.3, L('275', 4) - 0.1);
    s.tl.fromTo(arw.querySelector('.l'), { drawSVG: '0%' }, { drawSVG: '100%', duration: Math.max(0.3, Math.min(0.7, tLp - tAw)), ease: 'power2.inOut' }, tAw).fromTo(arw.querySelector('.h'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tLp - 0.1);
    s.sfx('pop', tKh + 0.05); s.sfx('whoosh', tAw, { gain: 0.5 }); s.sfx('chime', tLp + 0.1, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.6, z: 2 });

  // ───────── J3  honesty: science does not know the end (276) → "sirf itna" (277–279) ─────────
  defScene('j3_science', tb2, tb3 + 0.3, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    s.div('fill', { background: 'radial-gradient(ellipse at 56% 52%, #0e1c36 0%, #070d1c 58%, #02040a 100%)' });
    let gl = ''; for (let x = 120; x < 1920; x += 120) gl += `<path d="M${x} 0 V1080"/>`; for (let y = 60; y < 1080; y += 120) gl += `<path d="M0 ${y} H1920"/>`;
    svg(s, `<g stroke="rgba(111,216,255,.055)" stroke-width="1.5" fill="none">${gl}</g>`);
    const hd = s.div('bebas sh', { position: 'absolute', left: '110px', top: '100px', fontSize: '138px', color: '#fff', whiteSpace: 'nowrap' }, '<span class="cyan">SCIENCE</span> ABHI NAHI JAANTI');
    sync(s, hd, '276', 0, { min: 0.3, y: 30 });
    const sb = s.div('mont sh', { position: 'absolute', left: '116px', top: '250px', fontSize: '42px', fontWeight: 700, color: 'rgba(245,241,232,.8)' }, 'kainat ka <span class="cyan">anjaam</span> kya hoga…');
    sync(s, sb, '276', 5);
    // graph: one known past, three open futures (no claims attached)
    const X0 = 250, XN = 930, YN = 660, XE = 1560;
    const g = svg(s, `<defs><clipPath id="j3clip"><rect class="cr" x="${XN}" y="150" width="0" height="800"/></clipPath></defs>
      <path class="ax" d="M${X0 - 40} 900 H1700" stroke="rgba(185,236,255,.38)" stroke-width="2.5" fill="none"/>
      <path class="now" d="M${XN} 900 V${YN - 150}" stroke="rgba(185,236,255,.32)" stroke-width="2" stroke-dasharray="6 9" fill="none"/>
      <path class="past2" d="M${X0} 880 C440 850 660 760 ${XN} ${YN}" stroke="rgba(111,216,255,.22)" stroke-width="13" stroke-linecap="round" fill="none"/>
      <path class="past" d="M${X0} 880 C440 850 660 760 ${XN} ${YN}" stroke="#6FD8FF" stroke-width="5" stroke-linecap="round" fill="none"/>
      <g clip-path="url(#j3clip)" fill="none" stroke="rgba(214,236,255,.62)" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 15"><path class="f0"/><path class="f1"/><path class="f2"/></g>
      <circle class="nd2" cx="${XN}" cy="${YN}" r="18" fill="none" stroke="#fff" stroke-width="2"/><circle class="nd" cx="${XN}" cy="${YN}" r="9" fill="#fff"/>`);
    const tG = L('276', 5) - 0.1;
    s.tl.fromTo(g.querySelector('.ax'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.out' }, 0.25);
    s.tl.fromTo(g.querySelectorAll('.past, .past2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: Math.max(0.6, tG - 0.5), ease: 'power1.inOut' }, 0.4);
    s.tl.fromTo(g.querySelectorAll('.nd, .nd2, .now'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, Math.max(0.5, tG - 0.15));
    s.tl.fromTo(g.querySelector('.cr'), { attr: { width: 0 } }, { attr: { width: XE - XN + 30 }, duration: Math.max(0.8, L('276', 9) - tG + 0.2), ease: 'power1.inOut' }, tG);
    const fs = [0, 1, 2].map((i) => g.querySelector('.f' + i)), ends = [[250, -1], [520, 0.3], [820, 1]], nd2 = g.querySelector('.nd2');
    s.onUpdate((lt) => {
      fs.forEach((f, i) => { const ey = ends[i][0] + 16 * Math.sin(lt * 0.9 + i * 2.1), c2y = lerp(YN, ey, 0.55) + ends[i][1] * -70 + 8 * Math.sin(lt * 1.3 + i);
        f.setAttribute('d', `M${XN} ${YN} C${XN + 230} ${YN - 78} ${XE - 240} ${c2y.toFixed(1)} ${XE} ${ey.toFixed(1)}`); f.style.strokeDashoffset = (-lt * 14).toFixed(1); });
      const k = (lt * 0.7) % 1; nd2.setAttribute('r', (12 + 26 * k).toFixed(1)); nd2.style.opacity = (0.8 * (1 - k)).toFixed(3);
    });
    const tick = (x, txt, t, cls = 'dim') => { const e = s.div('mono sh ' + cls, { position: 'absolute', left: (x - 200) + 'px', width: '400px', top: '918px', textAlign: 'center', fontSize: '24px', fontWeight: 700, letterSpacing: '.3em' }, txt); show(s, e, t, null, { opacity: 0, y: 8 }, 0.4); return e; };
    tick(X0 + 30, 'IBTIDA', 0.7); tick(XN, 'AAJ', Math.max(0.6, tG - 0.15), ''); tick(XE + 10, 'ANJAAM', L('276', 7) - 0.1, 'cyan');
    const qm = s.div('anton glowc', { position: 'absolute', left: (XE + 50) + 'px', top: '380px', width: '200px', textAlign: 'center', fontSize: '300px', lineHeight: '1', color: '#D8F3FF' }, '?');
    const tQ = L('276', 8) - 0.1; gsap.set(qm, { autoAlpha: 0 });
    s.tl.set(qm, { autoAlpha: 1 }, tQ).fromTo(qm, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(2.2)' }, tQ);
    s.onUpdate((lt) => { if (lt > tQ + 0.6) qm.style.scale = (1 + 0.035 * Math.sin((lt - tQ) * 2.6)).toFixed(4); });
    s.sfx('tick', 0.35); s.sfx('pop', tQ + 0.1);
    // no claim
    const tg = s.div('tag sh', { position: 'absolute', left: '116px', top: '352px', fontSize: '31px', letterSpacing: '.24em', padding: '13px 26px 11px', color: '#F5F1E8', background: 'rgba(8,14,28,.72)', borderColor: 'rgba(245,241,232,.78)' }, 'HUM KOI DAAWA NAHI KARTE');
    const tT = L('276', 13) - 0.12; gsap.set(tg, { autoAlpha: 0 });
    s.tl.set(tg, { autoAlpha: 1 }, tT).fromTo(tg, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4 }, tT); sync(s, tg, '276', [13, 15, 16, 17, 18], { y: 0, min: tT });
    s.sfx('tick', L('276', 16));
    s.div('vig');
  }, { fin: 0.4, z: 3 });

  defScene('j3_itna', tb3, tb4 + 0.4, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x030201, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.3, seed: 17, tint: 0xffdca6, rx: 0.9, rz: 0.5 });
    st.frame = (lt) => { bd.update(lt * 2 + 30); st.camera.position.set(0, 0, 10 - lt * 0.12); st.camera.rotation.z = lt * 0.008; };
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 58%, rgba(233,185,85,.17) 0%, rgba(120,80,20,.06) 45%, rgba(0,0,0,.35) 100%)' });
    const si = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '124px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.6em' }, 'SIRF ITNA');
    show(s, si, Math.max(0.05, L('277') - 0.05), null, { opacity: 0, y: -16 }, 0.5);
    const o1 = s.div('orn', { position: 'absolute', left: '660px', top: '196px', width: '600px' }); s.tl.fromTo(o1, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, Math.max(0.1, L('277')));
    // row 1: the beginning turned out true
    const r1 = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '262px', textAlign: 'center', fontSize: '138px', whiteSpace: 'nowrap' },
      `<span class="a">IBTIDA WALI BAAT</span><span class="tk" style="display:inline-block;width:104px;height:104px;margin:0 30px 0 56px;vertical-align:-8px">${TICK()}</span><span class="b">${gwords('SACH NIKLI')}</span>`);
    sync(s, r1.querySelector('.a'), '278', 3, { y: 26 });
    const tS = L('278', 6) - 0.12;
    s.tl.fromTo(r1.querySelector('.tk path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, tS - 0.05);
    sync(s, null, '278', 6, { nodes: [...r1.querySelectorAll('.gk')], y: 0, sc: 1.3, dur: 0.3, lead: 0.1 });
    s.sfx('ding', tS + 0.1);
    // row 2: so do not take the end lightly
    const r2 = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '470px', textAlign: 'center', fontSize: '110px', color: 'rgba(245,241,232,.92)', whiteSpace: 'nowrap' }, 'ANJAAM WALI BAAT KO…');
    sync(s, r2, '279', 1, { y: 22 });
    const r3 = s.div('bebas', { position: 'absolute', left: '0', right: '0', top: '600px', textAlign: 'center', fontSize: '250px', whiteSpace: 'nowrap', lineHeight: '1' }, gwords('HALKA MAT LIJIYE'));
    const gl = s.div(null, { position: 'absolute', left: '160px', top: '520px', width: '1600px', height: '420px', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.26) 0%, rgba(233,185,85,0) 66%)' }); s.el.insertBefore(gl, r3);
    const tH = L('279', 5) - 0.1; s.tl.fromTo(gl, { opacity: 0 }, { opacity: 1, duration: 0.8 }, tH);
    sync(s, null, '279', 5, { nodes: [...r3.querySelectorAll('.gk')], y: 0, sc: 1.7, dur: 0.24, ease: 'power3.in', lead: 0.14 });
    shake(s, r3, L('279', 7) + 0.1, 0.4, 9); s.sfx('hit', tH + 0.14); s.sfx('impact', L('279', 7) + 0.1, { gain: 0.8 });
    s.tl.fromTo([r1, r2], { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0);
    s.tl.to(r3, { scale: 1.04, duration: Math.max(0.5, d - tH), ease: 'none' }, tH + 0.3);
    s.div('vig');
  }, { fin: 0.28, z: 4 });

  // ───────── J4  the recap board (280–291) ─────────
  defScene('j4_recap', tb4, tb5 + 0.4, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x02040b, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.42, seed: 23, rx: 0.7 });
    st.frame = (lt) => { bd.update(lt * 2 + 5); st.camera.position.set(0, 0, 10); st.camera.rotation.z = -lt * 0.006; };
    s.div('scrim-all', { background: 'rgba(2,4,12,.66)' });
    const hd = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '54px', textAlign: 'center', fontSize: '94px', letterSpacing: '.05em' }, 'AAJ HUMNE <span class="gold">KYA DEKHA?</span>');
    sync(s, hd, '280', 1, { min: 0.3, y: 24 });
    const orn = s.div('orn', { position: 'absolute', left: '560px', top: '150px', width: '800px' }); s.tl.fromTo(orn, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, L('280', 3));
    s.sfx('whoosh', 0.3, { gain: 0.5 });
    const LX = 110, LW = 700, RX = 920, RW = 890, hl = (t) => `<span style="color:#F8DE9A">${t}</span>`;
    const rows = [
      { y: 176, h: 204, thumb: '/gfx/img/j_einstein_th.jpg', who: 'EINSTEIN', tWho: L('281'), said: 'KAINAT RUKI<br>HUI HAI', kSaid: '282', tQ: L('283'), ql: 'QURAN', qt: `“Hum ${hl('wus\'at dene wale')} hain.”`, kq: '284', ar: [[Q['w:wainna_lamusiun'], L('284', 1)]], arSize: 62, done: T('284e') - s.t0 },
      { y: 396, h: 204, thumb: '/gfx/img/j_aristotle_th.jpg', who: 'FALSAFA', tWho: L('285'), said: 'KAINAT HAMESHA<br>SE HAI', kSaid: '286', tQ: L('287'), ql: 'QURAN', qt: `“Yeh ${hl('judi hui')} thi —<br>Hum ne isay ${hl('khola')}.”`, kq: '288', ar: [[Q['w:ratqan'], L('288', 1)], [Q['w:fafataqna'], L('288', 8)]], arSize: 52, done: T('288e') - s.t0 },
      { y: 616, h: 330, thumb: null, who: 'INSAAN', tWho: L('289'), said: '“YEH SAB<br>KHUD BA KHUD<br>HO GAYA”', kSaid: '290', tQ: L('290', 8), ql: 'QURAN NE POOCHA', qt: `“Kya yeh ${hl('kisi cheez ke baghair')}<br>paida ho gaye —<br>ya yeh ${hl('khud khaliq')} hain?”`, kq: '291', ar: [[Q['52:35'], L('291') + 0.25]], arSize: 50, done: L('291', 14) + 0.45 },
    ];
    const cells = rows.map((r, i) => {
      const lc = s.div(null, { position: 'absolute', left: LX + 'px', top: r.y + 'px', width: LW + 'px', height: r.h + 'px', borderRadius: '18px', background: 'linear-gradient(180deg, rgba(22,32,56,.86), rgba(9,14,28,.9))', border: '1.5px solid rgba(150,185,225,.28)', boxShadow: '0 20px 60px rgba(0,0,0,.5)', overflow: 'hidden' });
      lc.innerHTML = `<div class="th" style="position:absolute;left:16px;top:16px;width:150px;height:${r.h - 32}px;border-radius:10px;overflow:hidden;background:#0c1628;display:flex;align-items:center;justify-content:center"></div>
        <div class="mono" style="position:absolute;left:194px;top:22px;font-size:24px;font-weight:700;letter-spacing:.34em;color:#8FB6DC">${r.who}</div>
        <div class="said bebas" style="position:absolute;left:192px;top:${r.h > 300 ? 76 : 58}px;right:16px;font-size:72px;line-height:.98;color:#D7E0EC">${r.said}</div>`;
      if (r.thumb) lc.querySelector('.th').appendChild(image(r.thumb, { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%' })); else lc.querySelector('.th').innerHTML = personIcon();
      const tW = Math.max(0.3, r.tWho - 0.12); gsap.set(lc, { autoAlpha: 0 });
      s.tl.set(lc, { autoAlpha: 1 }, tW).fromTo(lc, { opacity: 0, x: -70 }, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' }, tW);
      sync(s, lc.querySelector('.said'), r.kSaid, 0, { y: 20 });
      s.sfx('whoosh', tW, { gain: 0.45 });
      // arrow
      const cy = r.y + r.h / 2, aw = svg(s, `<g fill="none" stroke="${GOLD}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path class="l" d="M${LX + LW + 16} ${cy} H${RX - 18}"/><path class="h" d="M${RX - 36} ${cy - 16} L${RX - 16} ${cy} L${RX - 36} ${cy + 16}"/></g>`);
      const tQ = r.tQ - 0.12;
      s.tl.fromTo(aw.querySelector('.l'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' }, tQ).fromTo(aw.querySelector('.h'), { opacity: 0 }, { opacity: 1, duration: 0.15 }, tQ + 0.25);
      // Quran cell
      const rc = s.div(null, { position: 'absolute', left: RX + 'px', top: r.y + 'px', width: RW + 'px', height: r.h + 'px', borderRadius: '18px', background: 'linear-gradient(180deg, rgba(58,42,12,.72), rgba(20,14,5,.86))', border: '1.5px solid rgba(233,185,85,.6)', boxShadow: '0 20px 60px rgba(0,0,0,.5)' });
      const arH = r.ar.length > 1 ? `<div class="arw" style="position:absolute;right:34px;top:${(r.h - r.ar.length * r.arSize * 1.62) / 2}px;text-align:right">${r.ar.map((a) => `<div class="ar a" style="font-size:${r.arSize}px;line-height:1.62;color:#FFF3D2">${a[0]}</div>`).join('')}</div>`
        : `<div class="arw" style="position:absolute;right:34px;left:34px;bottom:${r.h > 300 ? 12 : 6}px;text-align:${r.h > 300 ? 'center' : 'right'}"><div class="ar a" style="font-size:${r.arSize}px;line-height:1.7;color:#FFF3D2">${r.ar[0][0]}</div></div>`;
      rc.innerHTML = `<div class="cinzel gold" style="position:absolute;left:34px;top:20px;font-size:25px;font-weight:700;letter-spacing:.34em">${r.ql}</div>
        <div class="qt mont" style="position:absolute;left:34px;top:${r.h > 300 ? 66 : 62}px;font-size:${r.h > 300 ? 41 : 43}px;font-weight:800;line-height:1.24;color:#F5F1E8">${r.qt}</div>${arH}
        <div class="bd" style="position:absolute;left:-23px;top:-23px;width:50px;height:50px;border-radius:50%;background:#1a1408;border:2.5px solid ${GOLD};box-shadow:0 0 22px rgba(233,185,85,.55)"><div style="position:absolute;left:11px;top:11px;width:24px;height:24px">${TICK(GOLD, 16)}</div></div>`;
      gsap.set(rc, { autoAlpha: 0 });
      s.tl.set(rc, { autoAlpha: 1 }, tQ).fromTo(rc, { opacity: 0, x: 70 }, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' }, tQ);
      sync(s, rc.querySelector('.qt'), r.kq, 0, { y: 14 });
      [...rc.querySelectorAll('.ar.a')].forEach((a, j) => s.tl.fromTo(a, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, r.ar[j][1] - 0.1));
      const bdg = rc.querySelector('.bd');
      s.tl.fromTo(bdg, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)' }, r.done)
        .fromTo(bdg.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25 }, r.done + 0.12)
        .fromTo(rc, { boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 0 0 rgba(233,185,85,0)' }, { boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 46px 2px rgba(233,185,85,.42)', duration: 0.5 }, r.done)
        .to(rc, { boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 26px 0 rgba(233,185,85,.2)', duration: 0.8 }, r.done + 0.5);
      s.sfx('whoosh', tQ, { gain: 0.45 }); s.sfx('ding', r.done + 0.1, { gain: 0.7 });
      return [lc, aw, rc];
    });
    // focus: earlier rows step back while the next one is built, all three return at the end
    cells.forEach((c, i) => { if (i < 2) s.tl.to(c, { opacity: 0.45, duration: 0.5 }, rows[i + 1].tWho - 0.15); });
    const tAll = rows[2].done + 0.25; s.tl.to([...cells[0], ...cells[1]], { opacity: 1, duration: 0.5 }, tAll);
    s.sfx('shimmer', tAll, { gain: 0.6 });
    s.div('vig');
  }, { fin: 0.4, z: 5 });

  // ───────── J5  not a physics book — a book of guidance — but it made a promise (292–294) ─────────
  defScene('j5_hidayat', tb5, tb6 + 0.6, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x020308, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.3, seed: 37, rx: 1.3, rz: 0.2 });
    st.frame = (lt) => { bd.update(lt * 2 + 12); st.camera.position.set(0, 0, 10 - lt * 0.1); st.camera.rotation.z = lt * 0.006; };
    s.div('scrim-all', { background: 'rgba(2,3,9,.6)' });
    const tB = L('293') - 0.12, tW = L('294') - 0.05;
    // plain line
    const ra = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '112px', textAlign: 'center', fontSize: '124px', color: '#A9B8CE', whiteSpace: 'nowrap' },
      `<span class="a">PHYSICS KI KITAB</span><span class="x" style="display:inline-block;width:74px;height:74px;margin:0 22px 0 50px;vertical-align:-2px">${CROSS('#E06A6A', 15)}</span><span class="n" style="display:inline-block;color:#E9E4D8">NAHI</span>`);
    sync(s, ra.querySelector('.a'), '292', 1, { min: 0.3, y: 24 });
    const tN = L('292', 4) - 0.1;
    s.tl.fromTo(ra.querySelector('.x1'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, tN).fromTo(ra.querySelector('.x2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, tN + 0.12);
    s.tl.fromTo(ra.querySelector('.n'), { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' }, tN + 0.05);
    s.tl.to(ra, { opacity: 0.34, scale: 0.86, duration: 0.6, ease: 'power2.inOut' }, tB);
    s.sfx('tick', tN + 0.05); s.sfx('tick', tN + 0.17);
    // light rising from the book
    const cone = s.div(null, { position: 'absolute', left: '560px', top: '0', width: '800px', height: '470px', background: 'linear-gradient(0deg, rgba(248,222,154,.42) 0%, rgba(248,222,154,.14) 45%, rgba(248,222,154,0) 100%)', clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)', transformOrigin: '50% 100%' });
    const gl = s.div(null, { position: 'absolute', left: '260px', top: '250px', width: '1400px', height: '620px', background: 'radial-gradient(ellipse at 50% 42%, rgba(233,185,85,.30) 0%, rgba(233,185,85,.08) 40%, rgba(233,185,85,0) 68%)' });
    s.tl.fromTo(cone, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 1.1, ease: 'power2.out' }, tB + 0.15).fromTo(gl, { opacity: 0 }, { opacity: 1, duration: 0.9 }, tB);
    const R = rng(52), motes = []; for (let i = 0; i < 30; i++) { const m = s.div(null, { position: 'absolute', left: '0', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: 'radial-gradient(circle, #FFF3C9 0%, rgba(248,222,154,.5) 45%, rgba(248,222,154,0) 70%)', opacity: '0' }); motes.push({ m, ph: R(), v: 0.16 + R() * 0.2, x: (R() - 0.5), sz: 0.7 + R() * 1.6 }); }
    s.onUpdate((lt) => {
      const on = smooth(tB + 0.2, tB + 1.0, lt);
      for (const q of motes) { const c = (lt * q.v + q.ph) % 1, y = 440 - c * 420, x = 960 + q.x * (120 + 620 * c) + 10 * Math.sin(lt * 1.7 + q.ph * 9); q.m.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${q.sz})`; q.m.style.opacity = (on * Math.sin(Math.PI * c) * 0.9).toFixed(3); }
      cone.style.filter = ''; cone.style.opacity = (on * (0.82 + 0.18 * noise1(lt * 2.2, 5))).toFixed(3);
    });
    const bk = s.div(null, { position: 'absolute', left: '790px', top: '300px', width: '340px', height: '180px' }, bookIcon());
    gsap.set(bk, { autoAlpha: 0 }); s.tl.set(bk, { autoAlpha: 1 }, tB).fromTo(bk, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, tB).fromTo(bk.querySelectorAll('.ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.05 }, tB);
    const hk = s.div('bebas', { position: 'absolute', left: '0', right: '0', top: '520px', textAlign: 'center', fontSize: '250px', whiteSpace: 'nowrap', lineHeight: '1' }, gwords('HIDAYAT KI KITAB'));
    sync(s, null, '293', 1, { nodes: [...hk.querySelectorAll('.gk')], y: 30, sc: 1.25, dur: 0.5, ease: 'power3.out', lead: 0.1 });
    s.sfx('swell', Math.max(0, tB - 0.2), { dur: 1.6 }); s.sfx('shimmer', L('293', 1), { gain: 0.9 });
    // …but it made a promise
    const wd = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '806px', textAlign: 'center', fontSize: '118px', color: '#fff', whiteSpace: 'nowrap' }, `<span class="a">…LEKIN ISNE EK</span> <span class="b goldgrad" style="display:inline-block;font-size:150px;vertical-align:-10px;padding:0 10px 6px">WADA</span> <span class="c">KIYA THA</span>`);
    sync(s, wd.querySelector('.a'), '294', 0, { y: 20 }); sync(s, wd.querySelector('.c'), '294', 4, { y: 20 });
    const tWd = L('294', 3) - 0.1; s.tl.fromTo(wd.querySelector('.b'), { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power3.in' }, tWd);
    s.tl.to([hk, bk], { opacity: 0.55, duration: 0.5 }, tW); s.sfx('hit', tWd + 0.28, { gain: 0.7 }); s.sfx('chime', tWd + 0.3);
    s.div('vig');
  }, { fin: 0.4, z: 6 });

  // ───────── J6  the promise: Fussilat 41:53 (294b–295) ─────────
  defScene('j6_wada', tb6, tb7 + 0.45, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x02040b, fov: 55 }); const bd = spaceBackdrop(st, { gain: 0.5, seed: 43, rx: 0.5, rz: -0.2 });
    const gal = galaxyField({ count: 150, radius: 60, size: 3.6, seed: 19, minR: 26 }); st.scene.add(gal);
    const tAf = L('295', 6) - 0.1, tJa = L('295', 13) - 0.1, tHq = L('295', 25) - 0.1;
    st.frame = (lt) => { bd.update(lt * 1.5 + 50); gal.userData.update({ scale: 1 + lt * 0.006, opacity: 0.15 + 0.85 * smooth(tAf - 0.3, tAf + 1.2, lt) * (1 - 0.6 * smooth(tJa - 0.2, tJa + 1, lt)) }); st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = lt * 0.007; };
    const inner = s.div(null, { position: 'absolute', left: '660px', top: '240px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,185,85,.30) 0%, rgba(233,185,85,.10) 40%, rgba(233,185,85,0) 68%)', opacity: '0' });
    s.onUpdate((lt) => { const k = smooth(tJa - 0.2, tJa + 0.7, lt); inner.style.opacity = (k * (0.55 + 0.25 * Math.sin((lt - tJa) * 4.4))).toFixed(3); inner.style.scale = (0.9 + 0.1 * Math.sin((lt - tJa) * 4.4)).toFixed(4); });
    const tA0 = Math.max(0.1, L('294b') - 0.05), tAr = Math.max(tA0 + 0.3, L('294b', 1));
    const ay = ayah(s, { ref: REF['41:53'], ar: Q['41:53'], tr: '', t0: tA0, tAr, dAr: clamp(L('295') - tAr - 0.2, 1.4, 3.0), size: 90, hl: { 3: tAf, 5: tJa, 10: tHq } });
    const inn = ay.ref.parentNode;
    const trs = ['“Hum unhein apni <span class="hl">nishaniyan</span> dikhayenge —', '<span class="hl">aafaaq</span> mein bhi, aur khud unki apni <span class="hl">jaanon</span> mein bhi —', 'yahan tak ke un par khul jayega ke <span class="hl">yehi haq hai</span>.”'].map((h) => { const e = el('div', 'ayah-tr sh', { fontSize: '43px', marginTop: '18px', padding: '0 120px' }, h); inn.appendChild(e); return e; });
    sync(s, trs[0], '295', 0); sync(s, trs[1], '295', 6); sync(s, trs[2], '295', 17);
    s.tl.to(ay.aws, { opacity: 1, duration: 0.6 }, tHq + 0.1).fromTo(ay.ar, { textShadow: '0 0 28px rgba(233,185,85,.55), 0 0 80px rgba(233,185,85,.28), 0 3px 14px rgba(0,0,0,.8)' }, { textShadow: '0 0 34px rgba(233,185,85,.9), 0 0 110px rgba(233,185,85,.55), 0 3px 14px rgba(0,0,0,.8)', duration: 0.8 }, tHq + 0.1);
    s.sfx('swell', 0.1, { dur: 2.4 }); s.sfx('shimmer', tAr, { gain: 0.8 }); s.sfx('chime', tAf, { gain: 0.6 }); s.sfx('heartbeat', tJa + 0.05, { gain: 0.8 }); s.sfx('shimmer', tHq + 0.1, { gain: 1 });
    s.div('vig');
  }, { fin: 0.6, z: 7 });

  // ───────── J7  aafaaq ✓ — anfus ? (296–298) ─────────
  const AYW = Q['41:53'].split(/\s+/), AR_AFAQ = AYW.slice(2, 4).join(' '), AR_ANFUS = AYW.slice(4, 6).join(' ');
  defScene('j7_split', tb7, tb8 + 0.55, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    s.div('fill', { background: '#010207' });
    const t97 = L('297') - 0.1, t98 = L('298') - 0.1, tDive = Math.max(t98 + 0.35, L('298', 2) - 0.1);
    // left: the horizons we looked at today
    const lp = s.div(null, { position: 'absolute', left: '0', top: '0', width: '960px', height: '1080px', overflow: 'hidden' });
    const fw = footage(s, 'j_xdf', { n: 200, speed: clamp(200 / (d * 30 + 2), 0.45, 1), kb: { s0: 1.08, s1: 1.2 } }); lp.appendChild(fw);
    lp.appendChild(el('div', 'fill', { background: 'linear-gradient(180deg, rgba(2,4,10,.55) 0%, rgba(2,4,10,.18) 40%, rgba(2,4,10,.6) 100%)' }));
    const col = (parent, html) => { const c = el('div', null, { position: 'absolute', left: '0', top: '0', width: '960px', height: '1080px', textAlign: 'center' }, html); parent.appendChild(c); return c; };
    const lc = col(lp, `<div class="ar glowg a" style="position:absolute;left:0;right:0;top:150px;font-size:92px;color:#FFF3D2;line-height:1.6">${AR_AFAQ}</div>
      <div class="t bebas sh" style="position:absolute;left:0;right:0;top:336px;font-size:200px;color:#fff">AAFAAQ</div>
      <div class="u mont sh" style="position:absolute;left:0;right:0;top:536px;font-size:40px;font-weight:700;letter-spacing:.08em;color:rgba(245,241,232,.86)">door aasmanon mein</div>
      <div class="ok" style="position:absolute;left:210px;top:668px;width:540px;height:128px;border:6px solid ${GOLD};border-radius:14px;background:rgba(20,14,4,.55);box-shadow:0 0 50px rgba(233,185,85,.35)"><div style="position:absolute;left:34px;top:26px;width:70px;height:70px">${TICK(GOLD, 15)}</div><div class="bebas gold" style="position:absolute;left:130px;top:22px;font-size:100px;letter-spacing:.04em">DEKH LIYA</div></div>`);
    s.tl.fromTo(lc.querySelector('.a'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 0.25);
    s.tl.fromTo(chars(lc.querySelector('.t')), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.03 }, Math.max(0.15, L('296') - 0.1));
    sync(s, lc.querySelector('.u'), '296', 3);
    const ok = lc.querySelector('.ok'), tOk = L('296', 9) - 0.14; gsap.set(ok, { autoAlpha: 0, rotate: -4 });
    s.tl.set(ok, { autoAlpha: 1 }, tOk).fromTo(ok, { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'power4.in' }, tOk).fromTo(ok.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25 }, tOk + 0.2);
    shake(s, lp, tOk + 0.22, 0.35, 8); s.sfx('ding', tOk + 0.22); s.sfx('hit', tOk + 0.22, { gain: 0.6 });
    // right: the self — still dark
    const rp = s.div(null, { position: 'absolute', left: '960px', top: '0', width: '960px', height: '1080px', background: 'radial-gradient(ellipse at 50% 62%, #0a1326 0%, #04070f 55%, #010207 100%)' });
    const rc = col(rp, `<div class="ar glowg a" style="position:absolute;left:0;right:0;top:150px;font-size:92px;color:#FFF3D2;line-height:1.6">${AR_ANFUS}</div>
      <div class="t bebas sh" style="position:absolute;left:0;right:0;top:336px;font-size:200px;color:#fff">ANFUS</div>
      <div class="u mont sh" style="position:absolute;left:0;right:0;top:536px;font-size:40px;font-weight:700;letter-spacing:.08em;color:rgba(245,241,232,.86)">“khud unki jaanon mein”</div>
      <div class="u2 mont sh" style="position:absolute;left:0;right:0;top:536px;font-size:46px;font-weight:800;letter-spacing:.06em;color:#B9ECFF">aapke apne andar?</div>
      <div class="pt" style="position:absolute;left:330px;top:596px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle, #fff 0%, rgba(210,240,255,.95) 5%, rgba(111,216,255,.5) 16%, rgba(111,216,255,.14) 40%, rgba(111,216,255,0) 68%)"></div>
      <div class="q anton glowc" style="position:absolute;left:0;right:0;top:610px;font-size:270px;line-height:1;color:#D8F3FF">?</div>`);
    gsap.set(rc, { opacity: 0.16 }); s.tl.to(rc, { opacity: 1, duration: 0.5 }, t97);
    const dv = s.div(null, { position: 'absolute', left: '958px', top: '0', width: '4px', height: '1080px', background: 'linear-gradient(180deg, rgba(233,185,85,0), rgba(233,185,85,.9) 20%, rgba(233,185,85,.9) 80%, rgba(233,185,85,0))', boxShadow: '0 0 26px rgba(233,185,85,.6)', transformOrigin: '50% 0%' });
    s.tl.fromTo(dv, { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'power2.inOut' }, 0.05);
    s.tl.fromTo(rc.querySelector('.a'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, t97);
    s.tl.fromTo(chars(rc.querySelector('.t')), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.03 }, t97 + 0.05);
    sync(s, rc.querySelector('.u'), '297', 1);
    const q = rc.querySelector('.q'), pt = rc.querySelector('.pt'), tQ = L('297', 4) - 0.05; gsap.set([q, pt], { opacity: 0 });
    s.tl.fromTo(q, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, tQ); s.sfx('pop', tQ + 0.08);
    // 298: "inside you?" — the left side goes, the question becomes a point of light, we dive in
    s.tl.to(rc.querySelector('.u'), { opacity: 0, y: -10, duration: 0.22 }, t98 - 0.1); sync(s, rc.querySelector('.u2'), '298', 0, { y: 14 });
    s.tl.to([lp, dv], { opacity: 0, duration: 0.5, ease: 'power2.in' }, t98 + 0.1).to(rp, { x: -480, duration: 0.75, ease: 'power2.inOut' }, t98 + 0.15);
    s.tl.to(q, { opacity: 0, scale: 0.2, duration: 0.3, ease: 'power2.in' }, tDive).fromTo(pt, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4 }, tDive);
    s.tl.to(pt, { y: -206, scale: 0.55, duration: Math.max(0.3, d - tDive - 0.1), ease: 'power2.inOut' }, tDive + 0.05);
    s.tl.to(rc.querySelectorAll('.a, .t, .u2'), { opacity: 0, duration: 0.35 }, Math.max(tDive + 0.1, d - 0.6));
    s.sfx('whoosh', t98 + 0.15, { gain: 0.6 }); s.sfx('subdrop', tDive, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.4, z: 8 });

  // ───────── J8  the dive: cell → DNA → atoms → the atom; "do jagah"; Imam Ghazali · 900 saal (298–301) ─────────
  defScene('j8_atom', tb8, tb9, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x010207, fov: 50, near: 0.1, far: 3000 });
    const stars = starfield({ count: 1400, radius: 600, seed: 5, px: 2.0, shell: true }); st.scene.add(stars);
    const layers = [buildCell(), buildDNA(), buildMolecule(), buildAtom()]; layers.forEach((g) => st.scene.add(g));
    const seed = glow(0xbfeaff, 1.6, 1, 0.04, 2.0), seedH = glow(0x6fd8ff, 5, 0.4, 0, 1.6); st.scene.add(seed, seedH);
    const pA = glow(0xffffff, 0.9, 0, 0.12, 2.0), pB = glow(0xffffff, 0.9, 0, 0.12, 2.0), hA = glow(0x6fd8ff, 2.6, 0, 0, 1.6), hB = glow(0x6fd8ff, 2.6, 0, 0, 1.6); st.scene.add(hA, hB, pA, pB);
    const G = Math.log(36), tA = Math.max(2.4, L('299', 13) - 0.2);                       // tA: we arrive inside the atom on "atom ke andar"
    const t300 = L('300'), tOne = L('300', 1) - 0.12, tTwo = L('300', 7) - 0.1, t301 = L('301');
    const zoomAt = (lt) => { const u = Math.pow(clamp(lt / tA), 0.82); return -1 + 4 * u * u * (3 - 2 * u) + Math.max(0, lt - tA) * 0.006; };
    const V0 = new THREE.Vector3(1.75, 1.25, 0.9), VA = new THREE.Vector3(-2.75, 1.05, 0.6), VB = new THREE.Vector3(2.85, -0.75, 0.6), tmp = new THREE.Vector3();
    st.frame = (lt) => {
      const z = zoomAt(lt), dim = smooth(t301 + 0.05, t301 + 0.9, lt);
      stars.material.uniforms.time.value = lt; stars.rotation.y = lt * 0.01; stars.material.uniforms.opacity.value = 0.5 * (1 - 0.6 * dim);
      layers.forEach((g, k) => {
        const S = Math.exp(G * (z - k)), op = smooth(k - 1.25, k - 0.5, z) * (k < 3 ? 1 - smooth(k + 0.42, k + 0.98, z) : 1 - 0.74 * dim);
        g.visible = op > 0.003; if (!g.visible) return;
        g.scale.setScalar(S); const u = g.userData, px = u.px * clamp(Math.pow(S, 0.55), 0.3, 3.2);
        u.pc.material.uniforms.opacity.value = op; u.pc.material.uniforms.px.value = px; u.pc.material.uniforms.time.value = lt;
        if (u.ln) u.ln.material.opacity = u.ln.userData.op * op;
        if (u.nc) { u.nc.material.uniforms.opacity.value = op; u.nc.material.uniforms.px.value = px * 1.4; u.nc.material.uniforms.time.value = lt; }
        if (k === 0) g.rotation.set(0.2, lt * 0.12, 0.1); else if (k === 1) g.rotation.set(0, 0, lt * 0.05); else if (k === 3) g.rotation.set(0.25 + lt * 0.03, lt * 0.22, 0.1);
      });
      const so = 1 - smooth(-0.95, -0.25, z); seed.material.opacity = so; seedH.material.opacity = 0.45 * so; seed.scale.setScalar(1.5 + 0.2 * Math.sin(lt * 5)); seedH.scale.setScalar(5 + 0.6 * Math.sin(lt * 5));
      // the one particle … in two places at once
      const a1 = smooth(tOne, tOne + 0.35, lt) * (1 - dim), sp = ease.out3(clamp((lt - tTwo) / 0.55)), jx = 0.06 * Math.sin(lt * 9), jy = 0.06 * Math.cos(lt * 7.3);
      pA.position.copy(V0).lerp(VA, sp); pA.position.x += jx; pA.position.y += jy; pB.position.copy(V0).lerp(VB, sp); pB.position.x -= jx; pB.position.y -= jy;
      hA.position.copy(pA.position); hB.position.copy(pB.position);
      const gh = sp > 0 ? 0.5 * sp : 0, fA = 1 - gh * (0.5 + 0.5 * Math.sin(lt * 11)), fB = sp > 0 ? 1 - gh * (0.5 - 0.5 * Math.sin(lt * 11)) : 0;
      pA.material.opacity = a1 * fA; hA.material.opacity = 0.55 * a1 * fA; pB.material.opacity = a1 * fB; hB.material.opacity = 0.55 * a1 * fB;
      const push = smooth(t300, t301, lt);
      st.camera.position.set(Math.sin(lt * 0.21) * 0.25, Math.cos(lt * 0.17) * 0.15, 10 - 0.9 * push + 1.6 * dim); st.camera.lookAt(0, 0, 0);
    };
    s.sfx('riser', 0.1, { dur: Math.max(1, tA - 0.2), gain: 0.8 }); s.sfx('whoosh', tA * 0.3, { gain: 0.5 }); s.sfx('whoosh', tA * 0.56, { gain: 0.5 }); s.sfx('whoosh', tA * 0.78, { gain: 0.5 }); s.sfx('subdrop', tA, { gain: 0.9 });
    // HUD: next video + where we are
    const nv = s.div('tag gold sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '30px', padding: '10px 22px 9px', background: 'rgba(20,14,4,.55)' }, 'AGLI VIDEO');
    show(s, nv, Math.max(0.1, L('299') - 0.05), null, { opacity: 0, x: -24 }, 0.4); s.sfx('pop', Math.max(0.1, L('299')));
    const bc = s.div('mono sh', { position: 'absolute', right: '110px', top: '104px', fontSize: '24px', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(185,236,255,.3)' }, '<span>CELL</span> &nbsp;·&nbsp; <span>DNA</span> &nbsp;·&nbsp; <span>ATOM</span>');
    const bcs = [...bc.querySelectorAll('span')]; show(s, bc, 0.5, t301 + 0.3, { opacity: 0 }, 0.5);
    s.onUpdate((lt) => { const z = zoomAt(lt), c = [0, 1, 2.6]; bcs.forEach((e, i) => { const k = Math.max(0, 1 - Math.abs(z - c[i]) / (i === 2 ? 0.9 : 0.6)), on = i === 2 && z > 2.6 ? 1 : k; e.style.color = `rgba(${Math.round(185 - 74 * on)},${Math.round(236 - 20 * on)},255,${(0.3 + 0.7 * on).toFixed(3)})`; }); });
    const c1 = cap(s, 'kainat ki <span class="hc">sab se chhoti duniya</span> mein…', Math.max(0.2, L('299', 4) - 0.1), Math.max(L('299', 4) + 0.8, tA - 0.05), { bottom: 120, size: 52 });
    const an = s.div('bebas glowc', { position: 'absolute', left: '0', right: '0', top: '790px', textAlign: 'center', fontSize: '170px', color: '#CFF2FF', letterSpacing: '.04em' }, 'ATOM KE ANDAR');
    gsap.set(an, { autoAlpha: 0 }); s.tl.set(an, { autoAlpha: 1 }, tA).fromTo(chars(an), { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.03, ease: 'power3.out' }, tA).to(an, { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' }, t300 - 0.3).set(an, { autoAlpha: 0 }, t300);
    // 300: one thing — one moment — two places
    const row = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '836px', textAlign: 'center', fontSize: '104px', whiteSpace: 'nowrap', color: '#fff' },
      '<span class="p1" style="display:inline-block">EK CHEEZ</span><span class="d1 cyan" style="display:inline-block;margin:0 26px">·</span><span class="p2" style="display:inline-block">EK HI WAQT MEIN</span><span class="d2 cyan" style="display:inline-block;margin:0 26px">·</span><span class="p3 glowc" style="display:inline-block;color:#8FE3FF;font-size:150px;vertical-align:-12px">DO JAGAH</span>');
    const tW2 = L('300', 3) - 0.1; gsap.set(row.children, { opacity: 0 });
    s.tl.fromTo(row.querySelector('.p1'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, tOne).fromTo(row.querySelectorAll('.d1, .p2'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, tW2)
      .fromTo(row.querySelector('.d2'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tTwo - 0.1).fromTo(row.querySelector('.p3'), { opacity: 0, scale: 1.9 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power4.in' }, tTwo - 0.1)
      .to(row, { opacity: 0, duration: 0.35 }, t301 + 0.05);
    flash(s, tTwo + 0.12, { peak: 0.35, dur: 0.5, color: '#bfeaff' }); s.sfx('pop', tOne + 0.05); s.sfx('glitch', tTwo); s.sfx('hit', tTwo + 0.14);
    const mkM = (txt) => { const m = s.div(null, { position: 'absolute', left: '0', top: '0', width: '0', height: '0', opacity: '0' }, `<div style="position:absolute;left:-46px;top:-46px;width:92px;height:92px;border-radius:50%;border:2.5px solid #6FD8FF;box-shadow:0 0 18px rgba(111,216,255,.6)"></div><div class="mono cyan sh" style="position:absolute;left:-150px;width:300px;top:56px;text-align:center;font-size:24px;font-weight:700;letter-spacing:.3em">${txt}</div>`); return m; };
    const mA = mkM('JAGAH 1'), mB = mkM('JAGAH 2'), lk = svg(s, `<path d="" fill="none" stroke="rgba(143,227,255,.7)" stroke-width="3" stroke-dasharray="4 12" stroke-linecap="round"/>`), lkp = lk.querySelector('path');
    const scr = (v) => { tmp.copy(v).project(st.camera); return [(tmp.x * 0.5 + 0.5) * W, (-tmp.y * 0.5 + 0.5) * H]; };
    s.onUpdate((lt) => {
      const dim = smooth(t301 + 0.05, t301 + 0.6, lt), a1 = smooth(tOne, tOne + 0.3, lt) * (1 - dim), sp = clamp((lt - tTwo) / 0.55), a = scr(pA.position), b = scr(pB.position);
      const ring = 1 + 0.5 * (1 - smooth(tOne, tOne + 0.4, lt));
      mA.style.transform = `translate(${a[0].toFixed(1)}px, ${a[1].toFixed(1)}px) scale(${ring.toFixed(3)})`; mA.style.opacity = a1.toFixed(3); mA.lastChild.style.opacity = sp.toFixed(3);
      mB.style.transform = `translate(${b[0].toFixed(1)}px, ${b[1].toFixed(1)}px)`; mB.style.opacity = (a1 * (sp > 0 ? 1 : 0)).toFixed(3); mB.lastChild.style.opacity = sp.toFixed(3);
      lkp.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`); lkp.style.opacity = (a1 * sp * (0.55 + 0.45 * Math.sin(lt * 11))).toFixed(3); lkp.style.strokeDashoffset = (-lt * 30).toFixed(1);
    });
    // 301: the name, and the 900 years
    const sc = s.div('fill', { background: 'radial-gradient(ellipse at 50% 50%, rgba(1,2,7,.5) 0%, rgba(1,2,7,.8) 100%)' }); gsap.set(sc, { opacity: 0 }); s.tl.to(sc, { opacity: 1, duration: 0.8 }, t301 + 0.05);
    const tNm = L('301', 3) - 0.12, tJm = L('301', 6) - 0.1, tSaal = L('301', 12) - 0.05, t900 = L('301', 13) - 0.1;
    const np = s.div(null, { position: 'absolute', left: '0', right: '0', top: '168px', textAlign: 'center' }, `<div class="o1 orn" style="margin:0 auto;width:760px"></div>
      <div class="nm cinzel goldgrad" style="font-size:150px;font-weight:700;letter-spacing:.1em;line-height:1.25;padding:6px 0 4px">IMAM GHAZALI</div><div class="o2 orn" style="margin:0 auto;width:760px"></div>`);
    gsap.set(np, { autoAlpha: 0 });
    s.tl.set(np, { autoAlpha: 1 }, tNm).fromTo(np.querySelector('.nm'), { opacity: 0, letterSpacing: '.34em' }, { opacity: 1, letterSpacing: '.1em', duration: 1.0, ease: 'power2.out' }, tNm).fromTo(np.querySelectorAll('.orn'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, tNm + 0.1);
    s.sfx('swell', Math.max(0, tNm - 0.3), { dur: 1.6 }); s.sfx('shimmer', tNm + 0.1);
    const jm = s.div(null, { position: 'absolute', left: '0', right: '0', top: '452px', textAlign: 'center', whiteSpace: 'nowrap' }, `<span class="play gold" style="font-size:150px;line-height:0;vertical-align:-66px;margin-right:18px">“</span>${[3, 5, 2, 4, 6].map((n) => `<span class="blk" style="display:inline-block;width:${n * 34}px;height:46px;margin:0 9px;border-radius:8px;background:linear-gradient(180deg, rgba(248,222,154,.34), rgba(233,185,85,.14));border:1.5px solid rgba(233,185,85,.5)"></span>`).join('')}<span class="play gold" style="font-size:150px;line-height:0;vertical-align:-66px;margin-left:18px">”</span>
      <div class="mono sh" style="margin-top:34px;font-size:25px;font-weight:700;letter-spacing:.4em;color:rgba(245,241,232,.72)">WOH JUMLA</div>`);
    gsap.set(jm, { autoAlpha: 0 }); s.tl.set(jm, { autoAlpha: 1 }, tJm).fromTo(jm.querySelectorAll('.play'), { opacity: 0 }, { opacity: 0.9, duration: 0.4 }, tJm).fromTo(jm.querySelectorAll('.blk'), { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }, tJm + 0.05).fromTo(jm.querySelector('.mono'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, tJm + 0.2);
    const blks = [...jm.querySelectorAll('.blk')]; s.onUpdate((lt) => { if (lt > tJm + 0.6) blks.forEach((b, i) => { b.style.filter = ''; b.style.opacity = (0.72 + 0.28 * Math.sin(lt * 3.2 - i * 0.9)).toFixed(3); }); });
    const yr = s.div(null, { position: 'absolute', left: '0', right: '0', top: '650px', textAlign: 'center', whiteSpace: 'nowrap' }, `<span class="n bebas sh" style="display:inline-block;font-size:260px;line-height:.9;color:#fff;min-width:420px;text-align:right">0</span><span class="bebas gold sh" style="font-size:150px;margin-left:30px">SAAL</span>
      <div class="c mont sh" style="font-size:44px;font-weight:800;margin-top:6px;color:#F5F1E8">duniya <span style="color:#FF6B6B">hansti rahi</span></div>`);
    gsap.set(yr, { autoAlpha: 0 }); s.tl.set(yr, { autoAlpha: 1 }, tSaal).fromTo(yr, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, tSaal);
    counter(s, yr.querySelector('.n'), 0, 900, tSaal, Math.max(0.5, t900 - tSaal + 0.45), (v) => String(Math.round(v / 10) * 10), 'power2.out');
    sync(s, yr.querySelector('.c'), '301', [12, 15, 16], { y: 14 });
    s.sfx('clock', tSaal, { dur: Math.max(0.5, t900 - tSaal + 0.45) }); s.sfx('hit', t900 + 0.4, { gain: 0.7 });
    s.sfx('whooshRev', Math.max(0, d - 0.7), { dur: 0.7 });
    s.div('vig');
  }, { fin: 0.55, fout: 0.14, z: 9 });

  // ───────── J9  the cliff-hanger: "Aag kapde ko nahi jalati." (302) ─────────
  defScene('j9_aag', tb9, tEnd + 0.7, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    s.div('fill', { background: '#000' });
    const tw = [0, 1, 2, 3, 4].map((i) => Math.max(0.03, L('302', i) - 0.14));
    const gl = s.div(null, { position: 'absolute', left: '1150px', top: '330px', width: '860px', height: '760px', background: 'radial-gradient(ellipse at 50% 60%, rgba(255,140,40,.26) 0%, rgba(255,90,20,.09) 38%, rgba(255,90,20,0) 66%)', opacity: '0' });
    const nv = s.div('tag gold sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '30px', padding: '10px 22px 9px', background: 'rgba(20,14,4,.55)' }, 'AGLI VIDEO');
    const tx = s.div('anton', { position: 'absolute', left: '104px', top: '236px', fontSize: '214px', lineHeight: '1.13', whiteSpace: 'nowrap', color: '#fff' },
      `<span class="q play gold" style="display:inline-block;font-size:190px;line-height:0;vertical-align:-10px;margin-right:6px">“</span><span class="k" style="display:inline-block;background:linear-gradient(180deg,#FFF1B0 0%,#FFC14A 38%,#FF7A1E 74%,#E0461A 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-right:4px">AAG</span> <span class="k" style="display:inline-block">KAPDE</span> <span class="k" style="display:inline-block">KO</span><br><span class="k glowr" style="display:inline-block;color:#FF4B4B">NAHI</span> <span class="k" style="display:inline-block">JALATI.</span><span class="q play gold" style="display:inline-block;font-size:190px;line-height:0;vertical-align:-10px;margin-left:10px">”</span>`);
    const ks = [...tx.querySelectorAll('.k')], qs = [...tx.querySelectorAll('.q')];
    ks.forEach((k, i) => s.tl.fromTo(k, { opacity: 0, scale: i === 3 ? 2.3 : 1.7, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: i === 3 ? 0.2 : 0.22, ease: 'power4.in' }, tw[i]));
    s.tl.fromTo(qs[0], { opacity: 0 }, { opacity: 1, duration: 0.2 }, tw[0]).fromTo(qs[1], { opacity: 0 }, { opacity: 1, duration: 0.3 }, tw[4] + 0.2);
    shake(s, tx, tw[3] + 0.2, 0.5, 15); flash(s, tw[3] + 0.2, { peak: 0.22, dur: 0.4, color: '#ff5030' });
    s.sfx('impact', tw[0] + 0.2, { gain: 0.9 }); s.sfx('flutter', tw[1] + 0.1, { gain: 0.6 }); s.sfx('hit', tw[3] + 0.2); s.sfx('slam', tw[4] + 0.22, { gain: 0.8 }); s.sfx('subdrop', tw[4] + 0.25);
    const by = s.div('cinzel gold sh', { position: 'absolute', left: '118px', top: '768px', fontSize: '40px', fontWeight: 700, letterSpacing: '.34em' }, '— IMAM GHAZALI');
    show(s, by, tw[4] + 0.55, null, { opacity: 0, x: -24 }, 0.6);
    const ol = s.div('orn', { position: 'absolute', left: '118px', top: '742px', width: '620px', transformOrigin: '0 50%', background: 'linear-gradient(90deg, rgba(233,185,85,.9), rgba(233,185,85,0))' }); s.tl.fromTo(ol, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, tw[4] + 0.45);
    // a flame that licks a cloth which does not burn
    const CX = 196, BY = 590, RY = 64;
    const il = svg(s, `<defs><linearGradient id="j9f1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF3D12"/><stop offset=".55" stop-color="#FF7A1E"/><stop offset="1" stop-color="#FFB13C" stop-opacity=".85"/></linearGradient>
      <linearGradient id="j9f2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF8A1E"/><stop offset="1" stop-color="#FFD15A"/></linearGradient>
      <linearGradient id="j9f3" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFE79A"/><stop offset="1" stop-color="#FFFBE6"/></linearGradient>
      <linearGradient id="j9c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6F1E6"/><stop offset=".55" stop-color="#DCD5C6"/><stop offset="1" stop-color="#B4AC9B"/></linearGradient></defs>
      <g class="cl"><path class="rod" d="M70 ${RY} H392" stroke="#B8862E" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="70" cy="${RY}" r="9" fill="#E9B955"/><circle cx="392" cy="${RY}" r="9" fill="#E9B955"/>
        <path class="cloth" fill="url(#j9c)" stroke="rgba(255,255,255,.5)" stroke-width="2"/><g class="folds" fill="none" stroke="rgba(60,52,40,.28)" stroke-width="3" stroke-linecap="round"><path/><path/><path/></g></g>
      <g class="fl"><path class="f1" fill="url(#j9f1)"/><path class="f2" fill="url(#j9f2)"/><path class="f3" fill="url(#j9f3)"/><g class="sp" fill="#FFD27A">${'<circle r="3"/>'.repeat(8)}</g></g>`, { x: 1370, y: 236, w: 450, h: 640 });
    const cloth = il.querySelector('.cloth'), folds = [...il.querySelectorAll('.folds path')], f1 = il.querySelector('.f1'), f2 = il.querySelector('.f2'), f3 = il.querySelector('.f3'), sps = [...il.querySelectorAll('.sp circle')], clg = il.querySelector('.cl');
    gsap.set(clg, { opacity: 0 }); s.tl.fromTo(clg, { opacity: 0, scaleY: 0.05, svgOrigin: `231 ${RY}` }, { opacity: 1, scaleY: 1, duration: 0.45, ease: 'power3.out' }, tw[1] - 0.02);
    const f = (n) => n.toFixed(1);
    s.onUpdate((lt) => {
      const ig = ease.out3(clamp((lt - tw[0]) / 0.45)), sw = 7 * Math.sin(lt * 1.3), sw2 = 5 * Math.sin(lt * 1.9 + 1), x1 = 112, x2 = 350, hy = 372 + 3 * Math.sin(lt * 1.6);
      let hem = ''; const n = 5, ww = (x2 - 12 - (x1 + 12)) / n; for (let i = 0; i < n; i++) { const xa = x2 - 12 + sw - i * ww, xb = xa - ww; hem += ` Q${f((xa + xb) / 2 + sw2 * 0.4)} ${f(hy + 20 + 5 * Math.sin(lt * 2.1 + i * 1.4))} ${f(xb)} ${f(hy + (i % 2 ? 3 : -2))}`; }
      cloth.setAttribute('d', `M${x1} ${RY} L${x2} ${RY} C${x2 + 7} ${RY + 110} ${f(x2 - 4 + sw * 0.6)} ${RY + 220} ${f(x2 - 12 + sw)} ${f(hy)}${hem} C${f(x1 + 4 + sw * 0.6)} ${RY + 220} ${x1 - 7} ${RY + 110} ${x1} ${RY} Z`);
      folds.forEach((p, i) => { const fx = x1 + 60 + i * 62; p.setAttribute('d', `M${fx} ${RY + 14} C${f(fx + 8 + sw * 0.3)} ${RY + 110} ${f(fx - 8 + sw * 0.7)} ${RY + 210} ${f(fx + sw)} ${f(hy - 6)}`); });
      [[f1, 60, 236, 1], [f2, 40, 170, 2], [f3, 22, 98, 3]].forEach(([p, w, h, sd]) => { const hh = Math.max(1, h * ig * (1 + 0.11 * noise1(lt * 5.2, sd))), tip = CX + (16 + sd * 5) * noise1(lt * 3.3, sd + 10) + 10 * ig;
        p.setAttribute('d', flamePath(CX, BY, w * (0.5 + 0.5 * ig), hh, tip, 12 * noise1(lt * 4.1, sd + 20), 12 * noise1(lt * 4.6, sd + 30))); });
      sps.forEach((c, i) => { const cy = ((lt * (0.5 + 0.13 * i) + i * 0.37) % 1), x = CX + 46 * noise1(lt * 1.5 + i * 3.1, i) + (i - 4) * 9, y = BY - 150 - cy * 230; c.setAttribute('cx', f(x)); c.setAttribute('cy', f(y)); c.setAttribute('r', f(1.5 + 2.2 * (1 - cy))); c.style.opacity = (ig * Math.sin(Math.PI * cy) * 0.9).toFixed(3); });
      gl.style.opacity = (ig * (0.8 + 0.2 * noise1(lt * 6, 4))).toFixed(3);
    });
    s.sfx('whoosh', tw[0], { gain: 0.7 });
    s.tl.fromTo(tx, { scale: 1 }, { scale: 1.03, duration: d, ease: 'none', transformOrigin: '0% 50%' }, 0);
  }, { z: 10 });

  // ───────── J10  END SCREEN (room for YouTube's video + subscribe elements) ─────────
  defScene('j10_end', tEnd, P1, (s) => {
    const d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x010207, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.46, seed: 61, rx: 0.85, rz: 0.12 });
    st.frame = (lt) => { bd.update(lt * 2.2 + 14, 0.005); st.camera.position.set(0, 0, 10); st.camera.rotation.set(0.02 * Math.sin(lt * 0.1), lt * 0.004, lt * 0.005); };
    s.div('scrim-all', { background: 'rgba(2,4,12,.40)' });
    s.sfx('swell', 0.2, { dur: 3 }); s.sfx('shimmer', 1.0, { gain: 0.6 });
    const cn = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '92px', textAlign: 'center', fontSize: '46px', fontWeight: 700, letterSpacing: '.26em', whiteSpace: 'nowrap' }, 'HIDDEN MYSTERIES OF ISLAM');
    s.tl.fromTo(cn, { opacity: 0, letterSpacing: '.7em' }, { opacity: 1, letterSpacing: '.3em', duration: 1.5, ease: 'power2.out' }, 0.5);
    const o1 = s.div('orn', { position: 'absolute', left: '560px', top: '182px', width: '800px' }); s.tl.fromTo(o1, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.8);
    const ln = s.div('mont sh', { position: 'absolute', left: '0', right: '0', top: '204px', textAlign: 'center', fontSize: '31px', fontWeight: 600, letterSpacing: '.24em', color: 'rgba(245,241,232,.82)' }, 'Islam &nbsp;·&nbsp; Science &nbsp;·&nbsp; Falsafa &nbsp;·&nbsp; Mantiq');
    s.tl.fromTo(words(ln), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.09 }, 1.2);
    // video frame (16:9, 760x428) + subscribe circle (280)
    const FX = 190, FY = 356, FW = 760, FH = 428, RR = 22, CXc = 1440, CYc = 560, CR = 140;
    const fr = svg(s, `<rect class="b0" x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="${RR}" fill="rgba(3,6,14,.62)" stroke="rgba(233,185,85,.42)" stroke-width="2.5"/>
      <path d="M${FX + FW / 2 - 26} ${FY + FH / 2 - 34} L${FX + FW / 2 + 36} ${FY + FH / 2} L${FX + FW / 2 - 26} ${FY + FH / 2 + 34} Z" fill="none" stroke="rgba(233,185,85,.30)" stroke-width="3" stroke-linejoin="round"/>
      <rect class="sw2" x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="${RR}" fill="none" stroke="rgba(248,222,154,.30)" stroke-width="10" stroke-linecap="round"/><rect class="sw" x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="${RR}" fill="none" stroke="#FCE9B0" stroke-width="3.5" stroke-linecap="round"/>
      <circle class="b0" cx="${CXc}" cy="${CYc}" r="${CR}" fill="rgba(3,6,14,.62)" stroke="rgba(233,185,85,.42)" stroke-width="2.5"/>
      <circle class="cw2" cx="${CXc}" cy="${CYc}" r="${CR}" fill="none" stroke="rgba(248,222,154,.30)" stroke-width="10" stroke-linecap="round"/><circle class="cw" cx="${CXc}" cy="${CYc}" r="${CR}" fill="none" stroke="#FCE9B0" stroke-width="3.5" stroke-linecap="round"/>`);
    const per = 2 * (FW + FH) - 8 * RR + 2 * Math.PI * RR, cper = 2 * Math.PI * CR, sw = [fr.querySelector('.sw'), fr.querySelector('.sw2')], cw = [fr.querySelector('.cw'), fr.querySelector('.cw2')];
    s.tl.fromTo(fr.querySelectorAll('.b0'), { drawSVG: '0%', fillOpacity: 0 }, { drawSVG: '100%', fillOpacity: 1, duration: 1.3, ease: 'power2.inOut', stagger: 0.25 }, 0.5);
    s.onUpdate((lt) => {
      const on = smooth(1.4, 2.4, lt), a = (lt * 0.085) % 1, c = (lt * 0.11 + 0.4) % 1;
      sw.forEach((e, i) => { const seg = per * (i ? 0.2 : 0.16); e.style.strokeDasharray = `${seg.toFixed(1)} ${(per - seg).toFixed(1)}`; e.style.strokeDashoffset = (-(per * a) + (i ? per * 0.02 : 0)).toFixed(1); e.style.opacity = on.toFixed(3); });
      cw.forEach((e, i) => { const seg = cper * (i ? 0.24 : 0.2); e.style.strokeDasharray = `${seg.toFixed(1)} ${(cper - seg).toFixed(1)}`; e.style.strokeDashoffset = (-(cper * c) + (i ? cper * 0.02 : 0)).toFixed(1); e.style.opacity = on.toFixed(3); });
    });
    const tg = s.div('tag gold sh', { position: 'absolute', left: FX + 'px', top: (FY - 66) + 'px', fontSize: '26px', padding: '8px 18px 7px', background: 'rgba(20,14,4,.55)' }, 'AGLI VIDEO');
    show(s, tg, 1.0, null, { opacity: 0, x: -20 }, 0.5);
    const tt = s.div('bebas sh', { position: 'absolute', left: FX + 'px', top: (FY + FH + 26) + 'px', width: FW + 'px', fontSize: '78px', color: '#fff', whiteSpace: 'nowrap', letterSpacing: '.03em' }, '<span style="color:#FFB040">AAG</span> KAPDE KO <span style="color:#FF5B5B">NAHI</span> JALATI');
    s.tl.fromTo(words(tt), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 1.3);
    const sb = s.div('bebas sh', { position: 'absolute', left: (CXc - 300) + 'px', width: '600px', top: (CYc + CR + 30) + 'px', textAlign: 'center', fontSize: '84px', letterSpacing: '.1em', color: '#fff' }, 'SUBSCRIBE');
    s.tl.fromTo(chars(sb), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.035 }, 1.6);
    s.div('vig');
  }, { fin: 0.7, fout: 1.0, z: 11 });
}
