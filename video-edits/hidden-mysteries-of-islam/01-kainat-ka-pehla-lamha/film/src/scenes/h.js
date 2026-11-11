// PART H — "CHAAR RAASTE" (spoken lines 202..255).  Spine: a 3D hall of four doors (home shot) + a persistent tracker HUD.
// All timing comes from cues: T('<line>') / TW('<line>', wordIndex).  Inside a scene: L(id, n) = local time.
import { defScene, stage3d, T, TW, gsap, THREE, el, clamp, lerp, smooth, ease, noise1, rng, texture, glowTexture, W, H } from '../engine.js';
import { cap, big, stamp, flash, show, still, svg, shake, ayah } from '../ui.js';
import { glow } from '../kit3d.js';
import { Q, REF, AR } from '../quran.js';
import { IMG } from '../assets.js';

// ───────────────────────── small helpers ─────────────────────────
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; if (fn) fn(c.getContext('2d'), w, h); return c; };
const ctex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const _v = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const proj = (cam, x, y, z) => { _v.set(x, y, z).project(cam); return [(_v.x * 0.5 + 0.5) * W, (0.5 - _v.y * 0.5) * H]; };
const cnt = (lt, arr) => { let n = 0; for (const t of arr) if (lt >= t) n++; return n; };
const P = (t) => Math.max(0, t);
const mono = (keys) => { for (let i = 1; i < keys.length; i++) keys[i].t = Math.max(keys[i].t, keys[i - 1].t + 0.02); return keys; };
const K = (txt, cls = '', st = '') => `<span class="k ${cls}" style="${st}">${txt}</span>`;
const XS = (sz, sw, col) => `<svg width="${sz}" height="${sz}" viewBox="0 0 40 40" style="overflow:visible;display:block"><path d="M8 8 L32 32" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" fill="none"/><path d="M32 8 L8 32" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" fill="none"/></svg>`;
function camPose(keys, lt) {
  const n = keys.length; if (lt <= keys[0].t) return keys[0]; if (lt >= keys[n - 1].t) return keys[n - 1];
  let i = 0; while (i < n - 2 && lt >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], k0 = clamp((lt - a.t) / (b.t - a.t));
  const k = b.e === 'lin' ? k0 : b.e === 'out' ? ease.out3(k0) : b.e === 'in' ? k0 * k0 : k0 * k0 * (3 - 2 * k0);
  return { p: a.p.map((v, j) => lerp(v, b.p[j], k)), l: a.l.map((v, j) => lerp(v, b.l[j], k)) };
}
function applyCam(cam, keys, lt, o = {}) {
  const c = camPose(keys, lt), dr = o.drift ?? 0.05; let x = c.p[0] + Math.sin(lt * 0.37 + 1) * dr, y = c.p[1] + Math.sin(lt * 0.29) * dr * 0.6;
  for (const [t, amp] of (o.shakes || [])) { const a = lt - t; if (a >= 0 && a < 0.7) { const k = amp * (1 - a / 0.7) ** 2; x += noise1(lt * 37, 3) * k; y += noise1(lt * 41, 7) * k; } }
  cam.position.set(x, y, c.p[2]); cam.lookAt(c.l[0], c.l[1], c.l[2]);
}
// scene wrapper: stacking order = definition order (for clean dissolves), errors are logged instead of killing the frame
let ZI = 1;
function def(id, t0, t1, build, o = {}) {
  return defScene(id, t0, Math.max(t1, t0 + 0.2), (s) => {
    const ou = s.onUpdate.bind(s);
    s.onUpdate = (fn) => ou((lt) => { try { fn(lt, s); } catch (e) { if (!s._e) { s._e = 1; console.log('H-ERR update ' + id + ': ' + (e && e.stack || e)); } } });
    try { build(s, (k, n) => (n == null ? T(k) : TW(k, n)) - s.t0, s.t1 - s.t0); } catch (e) { console.log('H-ERR build ' + id + ': ' + (e && e.stack || e)); }
  }, { z: ZI++, ...o });
}
// reveal the .k spans of a node at the given local times (word-on-cue typography)
function kwords(s, node, times, from = { opacity: 0, y: 26 }, dur = 0.34) {
  const ks = [...node.querySelectorAll('.k')];
  ks.forEach((k, i) => { k.style.display = 'inline-block'; s.tl.fromTo(k, from, { opacity: 1, x: 0, y: 0, scale: 1, duration: dur, ease: 'power3.out' }, P(times[Math.min(i, times.length - 1)])); });
  return ks;
}
const capx = (s, html, t0, t1, o) => cap(s, html, P(t0), Math.max(t1, P(t0) + 0.6), o);
// static star dust + gradient for the 2D scenes
function starsBg(s, seed = 1, grad = 'radial-gradient(ellipse at 50% 42%, #0b1630 0%, #040813 58%, #010205 100%)') {
  s.div('fill', { background: grad });
  const c = cv(W, H, (x) => { const R = rng(seed); for (let i = 0; i < 420; i++) { const r = 0.5 + Math.pow(R(), 4) * 1.9; x.fillStyle = `rgba(${200 + R() * 55 | 0},${215 + R() * 40 | 0},255,${(0.12 + R() * 0.5).toFixed(2)})`; x.beginPath(); x.arc(R() * W, R() * H, r, 0, 6.283); x.fill(); } });
  c.className = 'gl'; s.add(c);
  s.onUpdate((lt) => { c.style.transform = `scale(${(1.02 + lt * 0.004).toFixed(4)})`; });
}
// 12-fold geometric rosette (thin gold lines) — inner markup for an svg centred on 0,0
function rosette(R, col = '#E9B955') {
  const n = 12, pt = (r, i) => `${(r * Math.cos(i * Math.PI / 6)).toFixed(1)} ${(r * Math.sin(i * Math.PI / 6)).toFixed(1)}`; let p = '';
  for (const [k, r, sw, op] of [[5, R, 1.8, 0.55], [4, R * 0.8, 1.5, 0.5], [3, R * 0.62, 1.4, 0.5], [5, R * 0.4, 1.3, 0.6], [2, R * 0.4, 1.2, 0.45]]) {
    let d = ''; for (let i = 0; i < n; i++) d += `M${pt(r, i)} L${pt(r, i + k)} `;
    p += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" opacity="${op}"/>`;
  }
  for (const [r, op] of [[R * 1.03, 0.5], [R * 1.08, 0.25], [R * 0.8, 0.3], [R * 0.4, 0.4], [R * 0.2, 0.5]]) p += `<circle r="${r.toFixed(1)}" fill="none" stroke="${col}" stroke-width="1.3" opacity="${op}"/>`;
  for (let i = 0; i < n; i++) p += `<circle cx="${(R * 0.9 * Math.cos((i + 0.5) * Math.PI / 6)).toFixed(1)}" cy="${(R * 0.9 * Math.sin((i + 0.5) * Math.PI / 6)).toFixed(1)}" r="${(R * 0.075).toFixed(1)}" fill="none" stroke="${col}" stroke-width="1.2" opacity=".45"/>`;
  return p;
}
const HCSS = `<style>
.horb{width:200px;height:200px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#fff 0%,#dff3ff 16%,#74ccff 46%,#1d62b4 78%,#0a2a66 100%);box-shadow:0 0 70px rgba(111,216,255,.8),0 0 190px rgba(111,216,255,.4)}
.hbub{position:absolute;left:-70px;bottom:38px;white-space:nowrap;padding:20px 32px 22px;border-radius:30px;background:#F5F1E8;color:#10131c;font-family:'Montserrat',sans-serif;font-weight:800;font-size:42px;line-height:1.24;box-shadow:0 18px 50px rgba(0,0,0,.6)}
.hbub::after{content:'';position:absolute;left:58px;bottom:-27px;border-right:30px solid transparent;border-top:28px solid #F5F1E8}
.hbub.rt{left:auto;right:-70px}.hbub.rt::after{left:auto;right:58px;border-right:0;border-left:30px solid transparent}
.hbub.b2{background:#0d1a30;color:#EAF6FF;box-shadow:0 0 0 3px #6FD8FF,0 18px 50px rgba(0,0,0,.6)}.hbub.b2::after{border-top-color:#6FD8FF}
.hbub .who{font-family:'Space Mono',monospace;font-weight:700;font-size:20px;letter-spacing:.3em;opacity:.6;margin-bottom:2px}
.hbub b{color:#D8322E}.hbub.b2 b{color:#6FD8FF}
.hnote{position:absolute;width:350px;height:170px;border-radius:12px;background:linear-gradient(135deg,#167a43 0%,#2fb568 48%,#136b3a 100%);box-shadow:0 14px 40px rgba(0,0,0,.6),inset 0 0 0 3px #0c4d2a}
.hnote .in{position:absolute;inset:10px;border:2.5px solid rgba(220,255,232,.75);border-radius:6px}
.hnote .bg{position:absolute;left:0;right:0;top:24px;text-align:center;font-family:'Anton',sans-serif;font-size:92px;line-height:1;color:#F1FFF5;text-shadow:0 3px 0 rgba(0,0,0,.25)}
.hnote .rp{position:absolute;left:0;right:0;bottom:20px;text-align:center;font-family:'Space Mono',monospace;font-weight:700;font-size:21px;letter-spacing:.5em;color:#DFFBE8}
.hnote .c{position:absolute;font-family:'Bebas Neue',sans-serif;font-size:30px;line-height:1;color:#DFFBE8}
.htok{position:absolute;display:flex;align-items:center;gap:24px;white-space:nowrap;padding:16px 36px 14px 26px;border-radius:18px;background:rgba(8,26,44,.9);border:2.5px solid #6FD8FF;box-shadow:0 0 34px rgba(111,216,255,.4),inset 0 0 26px rgba(111,216,255,.14);font-family:'Bebas Neue',sans-serif;font-size:84px;line-height:1.1;color:#DFF5FF;letter-spacing:.04em}
</style>`;
const NOTE = `<div class="in"></div><span class="c" style="left:22px;top:16px">100</span><span class="c" style="right:22px;bottom:14px">100</span><svg width="350" height="170" style="position:absolute;left:0;top:0"><g fill="none" stroke="rgba(220,255,232,.5)" stroke-width="1.6"><circle cx="58" cy="92" r="26"/><circle cx="58" cy="92" r="18"/><circle cx="58" cy="92" r="10"/><circle cx="292" cy="78" r="26"/><circle cx="292" cy="78" r="18"/><circle cx="292" cy="78" r="10"/></g></svg><div class="bg">100</div><div class="rp">RUPAY</div>`;

// ───────────────────────── the hall of four doors (three.js) ─────────────────────────
const DOORX = [-6.9, -2.3, 2.3, 6.9], DW = 2.3, DH = 4.5, X5 = 11.5, OPENA = 1.95, SW = 0.36;
const PLAQ = [[['“KUCH', 'NAHI”', 'SE', '—', 'KHUD', 'BA', 'KHUD']], [['KHUD', 'KO', 'KHUD', 'BANAYA']], [['KISI', 'AUR', 'NE…'], ['AUR', 'USAY', 'KISI', 'AUR', 'NE…']], [['JIS', 'KA', 'WUJOOD', 'US', 'KA', 'APNA', 'HAI']]];
const COOL = new THREE.Color(0xcfe8ff), GOLD = new THREE.Color(0xffc257), RED = new THREE.Color(0xff3a3a);
let _HT = null;
function hallTex() {
  if (_HT) return _HT; const R = rng(2024), X = {};
  const speck = (x, w, h, n) => { for (let i = 0; i < n; i++) { const a = 0.015 + R() * 0.035; x.fillStyle = R() < 0.5 ? `rgba(255,255,255,${a.toFixed(3)})` : `rgba(0,0,0,${(a * 1.6).toFixed(3)})`; x.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); } };
  X.wall = ctex(cv(512, 512, (x, w, h) => {
    x.fillStyle = '#222b45'; x.fillRect(0, 0, w, h); speck(x, w, h, 2600);
    for (let r = 0; r < 4; r++) { const y = r * 128; x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(0, y, w, 4); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(0, y + 4, w, 2);
      for (let c = 0; c < 2; c++) { const xx = c * 256 + (r % 2 ? 128 : 0); x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(xx, y, 4, 128); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(xx + 4, y, 2, 128); } }
  })); X.wall.wrapS = X.wall.wrapT = THREE.RepeatWrapping;
  X.floor = ctex(cv(512, 512, (x, w, h) => { x.fillStyle = '#141b2e'; x.fillRect(0, 0, w, h); speck(x, w, h, 1500); x.strokeStyle = 'rgba(160,190,255,.2)'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); }));
  X.floor.wrapS = X.floor.wrapT = THREE.RepeatWrapping; X.floor.repeat.set(22, 11);
  X.light = ctex(cv(128, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, h * 0.75); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b4c2d6'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
  X.pool = ctex(cv(256, 512, (x, w, h) => { x.translate(w / 2, 0); x.scale(0.42, 1); const g = x.createRadialGradient(0, 0, 0, 0, 0, h * 0.98); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.3, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-w * 2, 0, w * 4, h); }));
  X.x = ctex(cv(256, 512, (x) => { x.lineCap = 'round'; for (const [lw, c, bl] of [[30, '#ff4040', 26], [9, '#ffc0b8', 0]]) { x.strokeStyle = c; x.lineWidth = lw; x.shadowColor = '#ff2a2a'; x.shadowBlur = bl; x.beginPath(); x.moveTo(44, 70); x.lineTo(212, 442); x.moveTo(212, 70); x.lineTo(44, 442); x.stroke(); } }));
  X.leaf = ctex(cv(512, 1000, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3a4666'); g.addColorStop(1, '#232c47'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 8; x.strokeRect(16, 16, w - 32, h - 32);
    for (const [py, ph] of [[70, 470], [600, 330]]) { x.fillStyle = 'rgba(0,0,0,.26)'; x.fillRect(64, py, w - 128, ph); x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 5; x.strokeRect(66, py + 2, w - 132, ph - 4); x.strokeStyle = 'rgba(0,0,0,.45)'; x.strokeRect(78, py + 14, w - 156, ph - 28); }
    x.fillStyle = '#d9b25a'; x.beginPath(); x.arc(w - 40, 566, 17, 0, 6.283); x.fill(); x.fillRect(w - 46, 520, 12, 34);
  }));
  X.ghost = ctex(cv(256, 512, (x, w, h) => { x.strokeStyle = 'rgba(235,245,255,.9)'; x.lineWidth = 7; x.setLineDash([24, 18]); x.strokeRect(10, 10, w - 20, h - 14); }));
  return (_HT = X);
}
function drawPlaque(c, num, lines, n, mode) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const col = mode === 1 ? '#FF6A6A' : mode === 2 ? '#F8D77A' : '#EAF4FF', bcol = mode === 1 ? 'rgba(255,75,75,.9)' : mode === 2 ? 'rgba(246,207,107,.95)' : 'rgba(150,200,255,.6)';
  x.clearRect(0, 0, w, h); x.fillStyle = mode === 2 ? '#171104' : mode === 1 ? '#140608' : '#070b16'; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 34); x.fill();
  x.strokeStyle = bcol; x.lineWidth = 7; x.beginPath(); x.roundRect(8, 8, w - 16, h - 16, 30); x.stroke();
  x.beginPath(); x.arc(128, h / 2, 84, 0, 6.2832); x.fillStyle = mode === 1 ? 'rgba(255,75,75,.18)' : mode === 2 ? 'rgba(246,207,107,.22)' : 'rgba(150,200,255,.12)'; x.fill(); x.lineWidth = 7; x.strokeStyle = col; x.stroke();
  x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "400 150px 'Bebas Neue'"; x.fillText(String(num), 128, h / 2 + 9);
  const cx = 690, maxW = 830;
  if (n <= 0) { x.globalAlpha = 0.3; x.font = "400 120px 'Bebas Neue'"; x.fillText('?', cx, h / 2 + 8); x.globalAlpha = 1; return; }
  x.textAlign = 'left'; let k = 0; const two = lines.length > 1;
  lines.forEach((ws, li) => {
    let fs = two ? 84 : 112; x.font = `400 ${fs}px 'Bebas Neue'`; const full = ws.join(' '); let tw = x.measureText(full).width;
    if (tw > maxW) { fs *= maxW / tw; x.font = `400 ${fs.toFixed(1)}px 'Bebas Neue'`; tw = x.measureText(full).width; }
    let px = cx - tw / 2; const y = two ? (li === 0 ? 86 : 178) : h / 2 + 8;
    for (const wd of ws) { if (k < n) x.fillText(wd, px, y); px += x.measureText(wd + ' ').width; k++; }
  });
}
function buildHall(st) {
  const TX = hallTex(), sc = st.scene; sc.fog = new THREE.FogExp2(0x02040a, 0.026);
  const hemi = new THREE.HemisphereLight(0x9db4e6, 0x0a0e18, 1.1); sc.add(hemi);
  const wallMat = new THREE.MeshLambertMaterial({ map: TX.wall });
  const rect = (x0, x1, y0, y1) => { const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0)) / 4, (y0 + uv.getY(i) * (y1 - y0)) / 4); const m = new THREE.Mesh(g, wallMat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); sc.add(m); };
  let px = -42; for (const dx of DOORX) { rect(px, dx - DW / 2, 0, 10.5); rect(dx - DW / 2, dx + DW / 2, DH, 10.5); px = dx + DW / 2; } rect(px, 42, 0, 10.5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(88, 44), new THREE.MeshLambertMaterial({ map: TX.floor, transparent: true, opacity: 0.84 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 21.2); floor.renderOrder = 1; sc.add(floor);
  const real = new THREE.Group(), mir = new THREE.Group(); mir.scale.y = -1; sc.add(mir, real);
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x566080 }), sideMat = new THREE.MeshLambertMaterial({ color: 0x1c2438 }), faceMat = new THREE.MeshLambertMaterial({ map: TX.leaf });
  const leafMats = [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat];
  const G = { light: new THREE.PlaneGeometry(DW, DH), revS: new THREE.PlaneGeometry(0.7, DH), revT: new THREE.PlaneGeometry(DW, 0.7), jamb: new THREE.BoxGeometry(0.3, DH + 0.36, 0.22), lintel: new THREE.BoxGeometry(DW + 0.6, 0.36, 0.26),
    trimV: new THREE.BoxGeometry(0.06, DH, 0.03), trimH: new THREE.BoxGeometry(DW + 0.18, 0.06, 0.03), leaf: new THREE.BoxGeometry(DW, DH, 0.09), xpl: new THREE.PlaneGeometry(DW * 0.92, DH * 0.92), plaque: new THREE.PlaneGeometry(3.9, 3.9 * 256 / 1152), pool: new THREE.PlaneGeometry(5.4, 9.5) };
  const dustT = glowTexture(0, 1.3);
  const doors = DOORX.map((dx, i) => {
    const d = { x: dx, pivots: [], key: '', dust: [] };
    d.lightMat = new THREE.MeshBasicMaterial({ map: TX.light, toneMapped: false }); d.revMat = new THREE.MeshBasicMaterial({ toneMapped: false }); d.trimMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    d.xMat = new THREE.MeshBasicMaterial({ map: TX.x, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    d.pc = cv(1152, 256); d.ptex = ctex(d.pc); d.plMat = new THREE.MeshBasicMaterial({ map: d.ptex, toneMapped: false });
    for (const isM of [false, true]) {
      const g = new THREE.Group(); g.position.x = dx; (isM ? mir : real).add(g);
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
      add(G.light, d.lightMat, 0, DH / 2, -0.7);
      add(G.revS, d.revMat, -DW / 2, DH / 2, -0.35).rotation.y = Math.PI / 2; add(G.revS, d.revMat, DW / 2, DH / 2, -0.35).rotation.y = -Math.PI / 2; add(G.revT, d.revMat, 0, DH, -0.35).rotation.x = Math.PI / 2;
      add(G.jamb, frameMat, -DW / 2 - 0.15, (DH + 0.36) / 2, 0.11); add(G.jamb, frameMat, DW / 2 + 0.15, (DH + 0.36) / 2, 0.11); add(G.lintel, frameMat, 0, DH + 0.18, 0.13);
      add(G.trimV, d.trimMat, -DW / 2 - 0.05, DH / 2, 0.235); add(G.trimV, d.trimMat, DW / 2 + 0.05, DH / 2, 0.235); add(G.trimH, d.trimMat, 0, DH + 0.05, 0.275);
      const pv = new THREE.Group(); pv.position.set(-DW / 2, 0, 0.05); g.add(pv); d.pivots.push(pv);
      const leaf = new THREE.Mesh(G.leaf, leafMats); leaf.position.set(DW / 2, DH / 2, 0); pv.add(leaf);
      if (!isM) { const xm = new THREE.Mesh(G.xpl, d.xMat); xm.position.set(DW / 2, DH / 2, 0.052); xm.renderOrder = 3; pv.add(xm); add(G.plaque, d.plMat, 0, DH + 0.36 + 0.66, 0.05); }
    }
    d.pool = new THREE.Mesh(G.pool, new THREE.MeshBasicMaterial({ map: TX.pool, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 }));
    d.pool.rotation.x = -Math.PI / 2; d.pool.position.set(dx, 0.012, 4.75); d.pool.renderOrder = 2; sc.add(d.pool);
    d.haze = glow(0xffffff, 1, 0, 0, 1.6); d.haze.position.set(dx, DH * 0.52, 0.6); d.haze.renderOrder = 4; sc.add(d.haze);
    d.pt = new THREE.PointLight(0xffffff, 0, 0, 2); d.pt.position.set(dx, 2.7, 1.9); sc.add(d.pt);
    const rd = rng(900 + i);
    for (let k = 0; k < 18; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustT, color: 0x93a0be, transparent: true, opacity: 0, depthWrite: false })); sp.visible = false; sp.renderOrder = 5; sc.add(sp);
      const side = k < 10 ? 0 : (k < 14 ? -1 : 1);
      d.dust.push({ sp, x0: side === 0 ? (rd() - 0.5) * DW : side * DW / 2, y0: side === 0 ? 0.05 : rd() * DH, vx: (rd() - 0.5) * 1.6 + side * 0.9, vy: side === 0 ? 0.25 + rd() * 0.7 : (rd() - 0.3) * 0.5, vz: 0.5 + rd() * 1.3, s: 0.4 + rd() * 0.6 });
    }
    return d;
  });
  // the place where a fifth door would be: solid wall
  const g5m = new THREE.MeshBasicMaterial({ map: TX.ghost, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), x5m = new THREE.MeshBasicMaterial({ map: TX.x, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const g5 = new THREE.Mesh(new THREE.PlaneGeometry(DW + 0.4, DH + 0.2), g5m); g5.position.set(X5, (DH + 0.2) / 2, 0.03); g5.renderOrder = 3; sc.add(g5);
  const x5 = new THREE.Mesh(G.xpl, x5m); x5.position.set(X5, DH / 2, 0.05); x5.renderOrder = 4; sc.add(x5);
  const p5c = cv(1152, 256), p5t = ctex(p5c), p5m = new THREE.MeshBasicMaterial({ map: p5t, transparent: true, opacity: 0, toneMapped: false }); let p5k = '';
  const p5 = new THREE.Mesh(G.plaque, p5m); p5.position.set(X5, DH + 1.02, 0.05); p5.renderOrder = 3; sc.add(p5);
  const update = (S) => {
    for (let i = 0; i < 4; i++) {
      const d = doors[i], lit = S.lit[i], op = S.open[i], xm = S.xm[i], warm = i === 3 ? (S.warm || 0) : 0, boost = i === 3 ? (S.boost || 1) : 1;
      _c.copy(COOL).lerp(GOLD, warm);
      d.lightMat.color.copy(_c).multiplyScalar(Math.min(1.2, lit)).addScalar(0.012);
      d.revMat.color.copy(_c).multiplyScalar(0.5 * Math.min(1.2, lit) * (0.25 + 0.75 * op)).addScalar(0.01);
      d.trimMat.color.copy(_c).multiplyScalar(0.1 + 0.9 * Math.min(1, lit)).lerp(RED, xm);
      d.pool.material.color.copy(_c); d.pool.material.opacity = Math.min(1, 0.5 * lit * Math.pow(op, 0.7) * (0.6 + 0.4 * boost)); d.pool.scale.set((0.3 + 0.7 * op) * (0.85 + 0.15 * boost), 1, 1);
      d.haze.material.color.copy(_c); d.haze.material.opacity = Math.min(0.5, 0.26 * lit * op * boost); d.haze.scale.set(DW * 3.0 * (0.8 + 0.2 * boost), DH * 1.9 * (0.8 + 0.2 * boost), 1);
      d.pt.color.copy(_c); d.pt.intensity = 34 * Math.min(1.3, lit) * (0.08 + 0.92 * op) * boost;
      for (const pv of d.pivots) pv.rotation.y = -OPENA * op;
      d.xMat.opacity = xm;
      const mode = xm > 0.5 ? 1 : (warm > 0.45 ? 2 : 0), key = S.pl[i] + '|' + mode;
      if (key !== d.key) { d.key = key; drawPlaque(d.pc, i + 1, PLAQ[i], S.pl[i], mode); d.ptex.needsUpdate = true; }
      const a = S.dust[i];
      for (const q of d.dust) {
        if (a < 0 || a > 2.4) { q.sp.visible = false; continue; }
        const k = 1 - Math.exp(-a * 2.4), sz = q.s * (0.35 + 1.9 * k); q.sp.visible = true; q.sp.position.set(d.x + q.x0 + q.vx * k, q.y0 + q.vy * k + 0.1, 0.25 + q.vz * k); q.sp.scale.set(sz, sz, 1);
        q.sp.material.opacity = 0.22 * Math.min(1, a / 0.06) * Math.pow(1 - a / 2.4, 1.6);
      }
    }
    hemi.intensity = 1.1 + 0.7 * (S.warm || 0) * ((S.boost || 1) - 1); hemi.color.set(0x9db4e6).lerp(_c2.set(0xffd9a0), 0.6 * (S.warm || 0));
    const f = S.five || [0, 0]; g5m.opacity = f[0]; x5m.opacity = f[1]; p5m.opacity = Math.min(1, f[0] * 1.4);
    const k5 = f[1] > 0.5 ? 'x' : 'o'; if (k5 !== p5k) { p5k = k5; drawPlaque(p5c, 5, [['KOI', 'NAHI']], k5 === 'x' ? 9 : 0, k5 === 'x' ? 1 : 0); p5t.needsUpdate = true; }
  };
  return { doors, update };
}
const openAt = (lt, ts) => { if (ts == null) return 1; if (lt >= ts) { const a = lt - ts; return 0.03 * Math.exp(-a * 10) * Math.abs(Math.sin(a * 30)); } const k = clamp((lt - (ts - SW)) / SW); return 1 - k * k * k; };
// one visit to the hall.  cfg(s, L, d) -> { keys, slams:[local slam time | null | -9 (already shut)], lit(lt,i), pl(lt), warm(lt), boost(lt), five(lt), html() }
function hallScene(id, t0, t1, cfg, opt) {
  def(id, t0, t1, (s, L, d) => {
    const st = stage3d(s, { bg: 0x02040a, fov: 40 }), hall = buildHall(st), c = cfg(s, L, d, st);
    const shakes = c.slams.filter((t) => t != null && t > 0).map((t) => [t, 0.26]);
    st.frame = (lt) => {
      const S = { lit: [], open: [], xm: [], dust: [], pl: c.pl ? c.pl(lt) : [0, 0, 0, 0], warm: c.warm ? c.warm(lt) : 0, boost: c.boost ? c.boost(lt) : 1, five: c.five ? c.five(lt) : [0, 0] };
      for (let i = 0; i < 4; i++) { const ts = c.slams[i]; S.open[i] = openAt(lt, ts); S.xm[i] = ts == null ? 0 : smooth(ts + 0.1, ts + 0.45, lt); S.dust[i] = ts == null ? -1 : lt - ts; S.lit[i] = c.lit ? c.lit(lt, i) : 1; }
      hall.update(S); applyCam(st.camera, c.keys, lt, { drift: 0.06, shakes });
    };
    for (const [ts] of shakes) { s.sfx('slam', ts - 0.03, { gain: 1.2 }); flash(s, ts, { peak: 0.2, dur: 0.4, color: '#ffd0c8' }); shake(s, st.canvas, ts, 0.45, 14); }
    s.div('scrim-b', { height: '30%' });
    if (c.html) c.html();
    s.div('vig');
  }, opt);
}

export default function ([P0, P1]) {
  const tHall1 = Math.max(P0 + 2.0, TW('202', 13) - 0.15);
  const tLit = [0, 1, 2, 3].map((i) => Math.max(tHall1 + 0.3, TW('202', 15) - 0.12) + i * 0.2);     // doors light up 1-2-3-4 on "chaar"
  const tSlam1 = T('221') + 0.1, tSlam2 = TW('225', 9) + 0.14, tSlam3 = T('243') + 0.1, tCheck = TW('248', 2) - 0.05;

  // ───────── H1  "pehle nahi thi → phir wujood mein aa gayi" ─────────
  def('h01_intro', P0, tHall1, (s, L, d) => {
    starsBg(s, 7);
    const bx = { position: 'absolute', top: '236px', width: '470px', height: '470px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const tg = (t, c) => `<div class="mono ${c}" style="position:absolute;left:0;right:0;top:-66px;text-align:center;font-weight:700;font-size:30px;letter-spacing:.4em">${t}</div>`;
    const lb = (t, st) => `<div class="lb bebas" style="position:absolute;left:-60px;right:-60px;bottom:-92px;text-align:center;font-size:64px;letter-spacing:.04em;${st}">${t}</div>`;
    const a = s.div(null, { ...bx, left: '290px', border: '4px dashed rgba(245,241,232,.4)' }, HCSS + tg('PEHLE', 'dim') + `<svg width="210" height="210" viewBox="0 0 210 210"><circle cx="105" cy="105" r="98" fill="none" stroke="rgba(245,241,232,.3)" stroke-width="4" stroke-dasharray="10 14"/></svg>` + lb('NAHI THI', 'color:rgba(245,241,232,.8)'));
    const b = s.div(null, { ...bx, left: '1160px', border: '4px solid rgba(111,216,255,.8)', boxShadow: '0 0 60px rgba(111,216,255,.2), inset 0 0 60px rgba(111,216,255,.1)' }, tg('PHIR', 'cyan') + `<div class="ring" style="position:absolute;width:200px;height:200px;border-radius:50%;border:5px solid #BFEAFF"></div><div class="horb"></div>` + lb('WUJOOD MEIN AA GAYI', 'color:#9FE2FF'));
    const tA = P(L('202', 3) - 0.1), tAr = P(L('202', 6) - 0.1), tOrb = P(L('202', 8) - 0.1), tQ = Math.min(d - 0.5, L('202', 11) + 0.1);
    show(s, a, 0.05, null, { opacity: 0, scale: 0.94 }, 0.5); s.tl.fromTo(a.querySelector('.lb'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }, tA);
    const ar = svg(s, `<path class="l" d="M10 50 L330 50" stroke="#F5F1E8" stroke-width="8" stroke-linecap="round" fill="none"/><path class="h" d="M296 20 L340 50 L296 80" stroke="#F5F1E8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`, { x: 786, y: 421, w: 350, h: 100 });
    s.tl.fromTo(ar.querySelector('.l'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.inOut' }, tAr).fromTo(ar.querySelector('.h'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.25 }, tAr + 0.35);
    show(s, b, tAr + 0.15, null, { opacity: 0, scale: 0.94 }, 0.45);
    const orb = b.querySelector('.horb'), ring = b.querySelector('.ring');
    s.tl.fromTo(orb, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2.2)' }, tOrb).to(orb, { scale: 1.08, duration: Math.max(0.5, d - tOrb - 0.55), ease: 'sine.inOut' }, tOrb + 0.55);
    s.tl.fromTo(ring, { scale: 0.3, opacity: 0 }, { scale: 2.5, opacity: 0, duration: 0.8, ease: 'power2.out', keyframes: { opacity: [0, 0.9, 0] } }, tOrb);
    s.tl.fromTo(b.querySelector('.lb'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }, P(L('202', 10) - 0.1));
    flash(s, tOrb, { peak: 0.25, dur: 0.5, color: '#bfeaff' }); s.sfx('pop', tOrb, { gain: 1.1 });
    const q = s.div('bebas gold glowg', { position: 'absolute', left: '786px', top: '300px', width: '350px', textAlign: 'center', fontSize: '104px' }, 'KAISE?');
    show(s, q, tQ, null, { opacity: 0, scale: 1.7 }, 0.35);
    capx(s, 'Jo cheez <span class="hl">pehle nahi thi</span>…', 0.3, tAr - 0.02, { bottom: 96 });
    capx(s, '…aur phir <span class="hc">wujood mein aa gayi</span>', tAr, d + 0.3, { bottom: 96 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── H2  the hall: four doors light up · no fifth · door 1 ─────────
  hallScene('h02_hall1', tHall1, T('206') - 0.1, (s, L, d) => {
    const tl = tLit.map((t) => t - s.t0), t5 = P(L('203') - 0.05), t5x = L('203', 2) - 0.05, tP5 = Math.max(tl[3] + 0.3, L('203') - 0.75), tD1 = Math.max(tP5 + 1.25, L('204') - 0.15);
    const w1 = [L('205', 1), L('205', 2), L('205', 3), L('205', 5), L('205', 10), L('205', 11), L('205', 12)].map((t) => t - 0.08);
    s.sfx('swell', 0.1, { dur: 2.2, gain: 0.7 }); s.sfx('buzz', t5x, { gain: 0.8 });
    return {
      slams: [null, null, null, null],
      lit: (lt, i) => { const a = lt - tl[i]; return a < 0 ? 0 : Math.min(1, a / 0.1) * (1 + 0.7 * Math.exp(-a * 6)); },
      pl: (lt) => [cnt(lt, w1), 0, 0, 0],
      five: (lt) => [smooth(t5, t5 + 0.25, lt) * (0.7 + 0.3 * Math.abs(Math.sin(lt * 23))), smooth(t5x, t5x + 0.1, lt)],
      keys: mono([{ t: 0, p: [0, 1.9, 21], l: [0, 3.2, 0] }, { t: tP5, p: [0, 2.2, 17.5], l: [0, 3.2, 0], e: 'out' }, { t: tP5 + 0.75, p: [8.6, 2.5, 12.5], l: [10.6, 3.0, 0] }, { t: tD1, p: [8.9, 2.5, 12.2], l: [10.8, 3.0, 0] },
        { t: tD1 + 0.85, p: [-5.6, 2.3, 9.4], l: [-6.9, 3.1, 0] }, { t: d, p: [-6.0, 2.4, 8.3], l: [-6.9, 3.25, 0] }]),
      html: () => {
        capx(s, 'Sirf <span class="hl">chaar hi raaste</span> ho sakte hain', L('202', 14) - 0.1, L('203') - 0.2);
        capx(s, 'Paanchwan <span class="hr">koi nahi</span>', L('203') - 0.05, L('204') - 0.15, { size: 64 });
        capx(s, '<span class="hl">Pehla</span> raasta', L('204') - 0.05, L('205') - 0.08);
        capx(s, 'woh <span class="hl">“kuch nahi”</span> se…', L('205') - 0.03, L('205', 5) - 0.1);
        capx(s, '…bina kisi <span class="hc">sabab</span> ke…', L('205', 5) - 0.05, L('205', 10) - 0.1);
        capx(s, '…<span class="hl">khud ba khud</span> aa gayi', L('205', 10) - 0.05, d + 0.3);
      },
    };
  });

  // ───────── H3  the elephant in the locked bedroom ─────────
  def('h03_room', T('206') - 0.1, T('214') - 0.1, (s, L, d) => {
    const st = stage3d(s, { bg: 0x03050c, fov: 40 }), sc = st.scene;
    const hemi = new THREE.HemisphereLight(0x4a66b8, 0x06080f, 1), sun = new THREE.DirectionalLight(0x8fb0ff, 1), fill = new THREE.DirectionalLight(0x6f8fe0, 1);
    sun.position.set(-1.5, 5, -6); fill.position.set(5, 6, 8); sc.add(hemi, sun, fill);
    const M = (c) => new THREE.MeshLambertMaterial({ color: c });
    const bx = (w, h, dp, c, x, y, z, par = sc) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), c.isMaterial ? c : M(c)); m.position.set(x, y, z); par.add(m); return m; };
    const planks = ctex(cv(512, 512, (x, w) => { const R = rng(31); for (let i = 0; i < 8; i++) { const v = 118 + R() * 30 | 0; x.fillStyle = `rgb(${v + 30},${v - 16},${v - 56})`; x.fillRect(0, i * 64, w, 64); x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, i * 64, w, 3); x.fillRect((R() * w) | 0, i * 64, 3, 64); } }));
    planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(2, 2);
    bx(8.4, 0.2, 6.4, new THREE.MeshLambertMaterial({ map: planks }), 0, -0.1, 0);
    bx(8.4, 3.7, 0.2, 0x6c7fa8, 0, 1.75, -3.1); bx(0.2, 3.7, 6.4, 0x5d7098, -4.1, 1.75, 0);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), M(0x8c3f52)); rug.rotation.x = -Math.PI / 2; rug.scale.y = 0.6; rug.position.set(1.2, 0.012, 0.6); sc.add(rug);
    // window (night sky ↔ morning sky)
    const wx = -0.3, wy = 2.05, ww = 1.9, wh = 1.5;
    const night = ctex(cv(256, 200, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070d2c'); g.addColorStop(1, '#1b2e6e'); x.fillStyle = g; x.fillRect(0, 0, w, h); const R = rng(9); x.fillStyle = '#fff'; for (let i = 0; i < 40; i++) x.fillRect(R() * w, R() * h, 2, 2);
      const m = x.createRadialGradient(182, 62, 20, 182, 62, 70); m.addColorStop(0, 'rgba(220,232,255,.5)'); m.addColorStop(1, 'rgba(220,232,255,0)'); x.fillStyle = m; x.fillRect(0, 0, w, h); x.fillStyle = '#f2f5ff'; x.beginPath(); x.arc(182, 62, 26, 0, 6.283); x.fill(); x.fillStyle = '#0b1338'; x.beginPath(); x.arc(194, 54, 22, 0, 6.283); x.fill(); }));
    const day = ctex(cv(256, 200, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8cc6ff'); g.addColorStop(1, '#ffe7b4'); x.fillStyle = g; x.fillRect(0, 0, w, h); const m = x.createRadialGradient(70, 120, 6, 70, 120, 120); m.addColorStop(0, 'rgba(255,250,225,1)'); m.addColorStop(0.2, 'rgba(255,236,170,.8)'); m.addColorStop(1, 'rgba(255,230,160,0)'); x.fillStyle = m; x.fillRect(0, 0, w, h); }));
    const pn = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: night, toneMapped: false })); pn.position.set(wx, wy, -2.99); sc.add(pn);
    const pd = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: day, toneMapped: false, transparent: true, opacity: 0 })); pd.position.set(wx, wy, -2.985); sc.add(pd);
    for (const [w_, h_, x_, y_] of [[ww + 0.2, 0.1, 0, wh / 2 + 0.05], [ww + 0.2, 0.1, 0, -wh / 2 - 0.05], [0.1, wh, -ww / 2 - 0.05, 0], [0.1, wh, ww / 2 + 0.05, 0], [0.05, wh, 0, 0], [ww, 0.05, 0, 0]]) bx(w_, h_, 0.08, 0xeeeae0, wx + x_, wy + y_, -2.96);
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.6), new THREE.MeshBasicMaterial({ map: hallTex().pool, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.1 })); patch.rotation.x = -Math.PI / 2; patch.position.set(wx, 0.02, -1.15); sc.add(patch);
    // wall clock
    const ck = new THREE.Group(); ck.position.set(-2.75, 2.9, -2.98); sc.add(ck);
    ck.add(new THREE.Mesh(new THREE.CircleGeometry(0.37, 40), M(0x232838))); const face = new THREE.Mesh(new THREE.CircleGeometry(0.31, 40), M(0xf4f0e6)); face.position.z = 0.006; ck.add(face);
    const hh = new THREE.Group(), mh = new THREE.Group(); hh.position.z = 0.012; mh.position.z = 0.016; ck.add(hh, mh); bx(0.04, 0.17, 0.004, 0x151820, 0, 0.085, 0, hh); bx(0.025, 0.26, 0.004, 0x151820, 0, 0.13, 0, mh);
    // door (closes + locks)
    const dxc = 2.75, dwid = 1.15, dht = 2.45;
    const dk = new THREE.Mesh(new THREE.PlaneGeometry(dwid, dht), new THREE.MeshBasicMaterial({ color: 0x020308 })); dk.position.set(dxc, dht / 2, -2.995); sc.add(dk);
    bx(0.1, dht + 0.1, 0.1, 0xeeeae0, dxc - dwid / 2 - 0.05, (dht + 0.1) / 2, -2.95); bx(0.1, dht + 0.1, 0.1, 0xeeeae0, dxc + dwid / 2 + 0.05, (dht + 0.1) / 2, -2.95); bx(dwid + 0.2, 0.1, 0.1, 0xeeeae0, dxc, dht + 0.05, -2.95);
    const dpv = new THREE.Group(); dpv.position.set(dxc - dwid / 2, 0, -2.93); sc.add(dpv); bx(dwid, dht, 0.06, 0x8a6a48, dwid / 2, dht / 2, 0, dpv);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), M(0xe0b860)); knob.position.set(dwid - 0.13, 1.1, 0.07); dpv.add(knob);
    // bed + sleeper (generic pictogram head) + bedside table
    bx(2.1, 0.36, 3.1, 0x5a4030, -2.7, 0.22, -1.5); bx(2.0, 0.26, 3.0, 0xe9e5dc, -2.7, 0.53, -1.5); bx(2.1, 1.25, 0.14, 0x4a3426, -2.7, 0.75, -2.97); bx(1.3, 0.16, 0.62, 0xfaf7f0, -2.7, 0.74, -2.55); bx(2.06, 0.14, 2.05, 0x3e62b8, -2.7, 0.71, -1.02);
    const lump = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), M(0x3e62b8)); lump.scale.set(0.55, 0.26, 1.0); lump.position.set(-2.7, 0.82, -1.15); sc.add(lump);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), M(0xe8dfcc)); head.position.set(-2.7, 0.93, -2.38); sc.add(head);
    bx(0.62, 0.62, 0.52, 0x5a4030, -1.25, 0.31, -2.7); bx(0.05, 0.3, 0.05, 0x333333, -1.25, 0.77, -2.7); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.19, 0.28, 20), M(0xf2e6c8)); shade.position.set(-1.25, 1.02, -2.7); sc.add(shade);
    // the elephant: photo cut-out (gfx/img/h_elephant.png, derived from IMG.elephant) standing on the rug
    const eh = 3.0, ew = eh * 1496 / 861;
    const ele = new THREE.Mesh(new THREE.PlaneGeometry(ew, eh), new THREE.MeshBasicMaterial({ map: texture('/gfx/img/h_elephant.png'), transparent: true, alphaTest: 0.03, side: THREE.DoubleSide, toneMapped: false, color: 0xe8dfd2 }));
    ele.position.set(1.25, eh / 2 - 0.13, 0.55); ele.rotation.y = 0.22; ele.scale.x = -1; ele.renderOrder = 3; sc.add(ele);
    const shT = ctex(cv(256, 128, (x, w, h) => { x.translate(w / 2, h / 2); x.scale(1, 0.5); const g = x.createRadialGradient(0, 0, 10, 0, 0, w / 2); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(-w, -h * 2, w * 2, h * 4); }));
    const esh = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.3), new THREE.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false })); esh.rotation.x = -Math.PI / 2; esh.position.set(1.25, 0.03, 0.6); esh.renderOrder = 2; sc.add(esh);
    const tC0 = P(L('206', 3) - 0.1), tC1 = L('206', 4) + 0.02, tTL0 = Math.max(tC1 + 0.4, L('206e') - 0.15), tTL1 = Math.max(tTL0 + 0.8, L('207') + 0.55), tPull0 = Math.max(tTL1 + 0.3, L('207', 8) - 0.2), tPull1 = tPull0 + 0.85;
    const keys = mono([{ t: 0, p: [5.0, 4.4, 9.6], l: [-0.3, 1.2, -0.6] }, { t: tTL0, p: [4.5, 4.1, 9.0], l: [-0.3, 1.2, -0.6], e: 'lin' }, { t: tTL1, p: [-1.9, 2.0, 1.2], l: [-2.45, 1.7, -3.0] }, { t: tPull0, p: [-1.8, 2.0, 1.45], l: [-2.35, 1.7, -3.0] },
      { t: tPull1, p: [4.4, 3.6, 9.4], l: [0.5, 1.45, -0.2], e: 'out' }, { t: d, p: [4.0, 3.4, 8.8], l: [0.6, 1.45, -0.2] }]);
    st.frame = (lt) => {
      const k = smooth(tTL0, tTL1, lt);
      hemi.color.set(0x4a66b8).lerp(_c.set(0xfff1dc), k); hemi.groundColor.set(0x06080f).lerp(_c.set(0x4a3c30), k); hemi.intensity = lerp(1.0, 2.7, k);
      sun.color.set(0x8fb0ff).lerp(_c.set(0xffd49a), k); sun.intensity = lerp(0.5, 3.0, k); fill.color.set(0x6f8fe0).lerp(_c.set(0xfff2e0), k); fill.intensity = lerp(0.6, 1.9, k);
      pd.material.opacity = k; patch.material.color.set(0x7f9fff).lerp(_c.set(0xffd9a0), k); patch.material.opacity = lerp(0.12, 0.55, k);
      const hr = 23 + 8 * k; hh.rotation.z = -(hr % 12) / 12 * 6.2832; mh.rotation.z = -(hr % 1) * 6.2832;
      dpv.rotation.y = -1.15 * (1 - smooth(tC0, tC1, lt));
      ele.visible = esh.visible = lt > tTL1 - 0.1; ele.rotation.z = Math.sin(lt * 1.3) * 0.006;
      applyCam(st.camera, keys, lt, { drift: 0.03, shakes: [[tPull1 - 0.12, 0.12]] });
    };
    // overlays
    const moon = `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M24 4 A14 14 0 1 0 30 24 A11 11 0 0 1 24 4 Z" fill="#CFE0FF"/></svg>`;
    const sunI = `<svg width="40" height="40" viewBox="0 0 38 38"><circle cx="19" cy="19" r="8" fill="#FFD27A"/><g stroke="#FFD27A" stroke-width="3" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * Math.PI / 4; return `<path d="M${(19 + 12.5 * Math.cos(a)).toFixed(1)} ${(19 + 12.5 * Math.sin(a)).toFixed(1)} L${(19 + 17 * Math.cos(a)).toFixed(1)} ${(19 + 17 * Math.sin(a)).toFixed(1)}"/>`; }).join('')}</g></svg>`;
    const tagS = { position: 'absolute', right: '100px', top: '82px', display: 'flex', alignItems: 'center', gap: '16px', fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '36px', letterSpacing: '.34em', padding: '10px 18px 10px 24px', borderRadius: '14px', background: 'rgba(3,6,13,.66)', border: '1.5px solid rgba(255,255,255,.14)' };
    show(s, s.div('sh', { ...tagS, color: '#CFE0FF' }, HCSS + moon + 'RAAT'), P(L('206', 1) - 0.1), tTL0 + 0.55, { opacity: 0, x: 30 }, 0.4);
    show(s, s.div('sh', { ...tagS, color: '#FFD27A' }, sunI + 'SUBAH'), tTL0 + 0.6, L('213') - 0.1, { opacity: 0, x: 30 }, 0.4);
    const anchor = (x, y, z, html) => { const h = s.div(null, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' }, html); s.onUpdate(() => { const p = proj(st.camera, x, y, z); h.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px)`; }); return h.firstElementChild; };
    const lock = anchor(dxc, 1.45, -2.9, `<div style="position:absolute;left:-48px;top:-48px;width:96px;height:96px;border-radius:50%;background:rgba(8,12,24,.92);border:3px solid #F2C968;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(233,185,85,.5)"><svg width="46" height="52" viewBox="0 0 46 52"><path d="M11 22 V15 a12 12 0 0 1 24 0 V22" fill="none" stroke="#F2C968" stroke-width="5.5" stroke-linecap="round"/><rect x="5" y="22" width="36" height="27" rx="6" fill="#F2C968"/><circle cx="23" cy="35" r="4.5" fill="#0a0e18"/></svg></div>`);
    show(s, lock, tC1, tTL1 - 0.2, { opacity: 0, scale: 2.2 }, 0.3);
    const zz = anchor(-2.7, 1.75, -2.4, `<div class="mono cyan sh" style="position:absolute;left:10px;top:-60px;font-size:50px;font-weight:700;white-space:nowrap">z Z z</div>`);
    show(s, zz, P(L('206', 7) - 0.15), tTL0 + 0.3, { opacity: 0, y: 20 }, 0.5);
    s.sfx('thud', tPull1 - 0.12, { gain: 1.2 });
    const ex = anchor(-2.7, 1.9, -2.4, `<div class="anton" style="position:absolute;left:-36px;top:-120px;width:72px;text-align:center;font-size:120px;color:#FF4B4B;text-shadow:0 0 30px rgba(255,75,75,.7)">!</div>`);
    show(s, ex, tPull1 - 0.15, L('208') + 0.1, { opacity: 0, scale: 0.3, y: 30 }, 0.3);
    const b1 = anchor(-2.7, 1.6, -2.4, `<div class="hbub rt"><div class="who">AAP</div>Yeh kahan se aaya?</div>`);
    show(s, b1, L('209') - 0.1, L('213') - 0.15, { opacity: 0, scale: 0.5, y: 30 }, 0.35); s.sfx('pop', L('209') - 0.1);
    const b2 = s.div('hbub b2', { left: 'auto', right: '120px', bottom: 'auto', top: '250px' }, `<div class="who">JAWAB</div><div class="l1">“Kahin se <b>nahi</b>.</div><div class="l2">Bas <b>aa gaya</b>.”</div>`);
    show(s, b2, L('211') - 0.1, L('213') - 0.15, { opacity: 0, scale: 0.5, y: 30 }, 0.35);
    s.tl.fromTo(b2.querySelector('.l2'), { opacity: 0 }, { opacity: 1, duration: 0.25 }, L('212') - 0.08);
    show(s, s.div('fill', { background: 'rgba(2,4,10,.62)' }), L('213') - 0.15, null, { opacity: 0 }, 0.3);
    const mq = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '400px', textAlign: 'center', fontSize: '230px', lineHeight: '1' }, `${K('AAP')} ${K('MAAN')} ${K('LENGE?', 'gold glowg')}`);
    kwords(s, mq, [L('213'), L('213', 1), L('213', 2)].map((t) => t - 0.06), { opacity: 0, scale: 1.6, y: 0 }, 0.28);
    s.div('vig');
  });

  // ───────── H4  "kuch nahi": no power, no law, no possibility ─────────
  const boxRig = (sc, o = {}) => {
    const g = new THREE.Group(); sc.add(g); const S = 2.4, h = S / 2, th = 0.045;
    const eMat = new THREE.MeshBasicMaterial({ color: o.edge ?? 0xd6ecff, toneMapped: false });
    const fMat = new THREE.MeshBasicMaterial({ color: o.faceCol ?? 0x0c1528, transparent: true, opacity: o.face ?? 0.06, depthWrite: (o.face ?? 0) > 0.5, toneMapped: false, side: THREE.DoubleSide });
    const lid = new THREE.Group(); lid.position.set(0, h, -h); g.add(lid);
    const E = (lx, ly, lz, x, y, z, par) => { const m = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), eMat); m.position.set(x, y, z); par.add(m); };
    const F = (x, y, z, rx, ry, par) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(S, S), fMat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); par.add(m); };
    for (const a of [-h, h]) { for (const b of [-h, h]) E(th, S, th, a, 0, b, g); E(S, th, th, 0, -h, a, g); E(th, th, S, a, -h, 0, g); E(S, th, th, 0, 0, a + h, lid); E(th, th, S, a, 0, h, lid); }
    F(0, 0, h, 0, 0, g); F(0, 0, -h, 0, 0, g); F(-h, 0, 0, 0, Math.PI / 2, g); F(h, 0, 0, 0, Math.PI / 2, g); F(0, -h, 0, Math.PI / 2, 0, g); F(0, 0, h, Math.PI / 2, 0, lid);
    return { g, lid, eMat, fMat };
  };
  const boxCam = (cam) => { cam.position.set(3.4, 2.5, 6.4); cam.lookAt(1.5, 0.15, 0); };
  def('h04_void', T('214') - 0.1, T('215') - 0.1, (s, L, d) => {
    starsBg(s, 14);
    const st = stage3d(s, { fov: 40 }), rig = boxRig(st.scene, { face: 0.05 });
    st.frame = (lt) => { rig.g.scale.setScalar(0.82); rig.g.rotation.y = 0.55 + lt * 0.22; rig.eMat.color.setScalar(0.3 + 0.6 * smooth(0, 0.5, lt)); boxCam(st.camera); };
    const lbl = s.div('anton sh', { position: 'absolute', left: '326px', top: '868px', width: '700px', textAlign: 'center', fontSize: '104px', lineHeight: '1' }, '“KUCH NAHI”');
    show(s, lbl, 0.05, null, { opacity: 0, scale: 1.3 }, 0.4);
    show(s, s.div('mono dim', { position: 'absolute', left: '1094px', top: '176px', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, 'KE PAAS:'), P(L('214', 2) - 0.05), null, { opacity: 0, x: 30 }, 0.3);
    [['TAQAT', 4, 5], ['QANOON', 7, 8], ['IMKAAN', 9, 10]].forEach(([w, a, b], i) => {
      const row = s.div(null, { position: 'absolute', left: '1090px', top: (232 + i * 196) + 'px', whiteSpace: 'nowrap' }, `<span class="t bebas sh" style="font-size:176px;line-height:1;color:#F5F1E8">${w}</span><i class="bar" style="position:absolute;left:-16px;right:-16px;top:70px;height:15px;background:#FF4B4B;border-radius:8px;box-shadow:0 0 22px rgba(255,75,75,.7)"></i><span class="x" style="position:absolute;left:100%;top:26px;margin-left:46px">${XS(104, 6.5, '#FF4B4B')}</span>`);
      const ta = P(L('214', a) - 0.05), ts = Math.max(ta + 0.25, L('214', b) + 0.12), bar = row.querySelector('.bar'), xp = row.querySelectorAll('.x path');
      show(s, row, ta, null, { opacity: 0, x: 70 }, 0.32); gsap.set(bar, { scaleX: 0, transformOrigin: '0 50%' }); gsap.set(xp, { drawSVG: '0%' });
      s.tl.to(bar, { scaleX: 1, duration: 0.15, ease: 'power2.in' }, ts).to(row.querySelector('.t'), { opacity: 0.42, duration: 0.2 }, ts + 0.12).to(xp, { drawSVG: '100%', duration: 0.14, stagger: 0.07, ease: 'power2.in' }, ts + 0.05);
      if (i === 2) s.sfx('slash', ts, { gain: 0.9 });
    });
    s.div('vig');
  });
  def('h05_zero', T('215') - 0.1, T('217') - 0.1, (s, L, d) => {
    starsBg(s, 15, 'radial-gradient(ellipse at 50% 45%, #0a1228 0%, #03060f 60%, #000 100%)');
    const Z = (lab) => `<span class="k" style="position:relative;margin:0 .03em">0<i style="position:absolute;left:50%;transform:translateX(-50%);top:104%;font:normal 700 24px 'Space Mono',monospace;letter-spacing:.3em;color:rgba(245,241,232,.5);text-decoration:line-through">${lab}</i></span>`;
    const op = (c) => K(c, 'cyan', 'font-size:.62em;margin:0 .16em;vertical-align:.16em');
    const row = s.div('anton', { position: 'absolute', left: '0', right: '0', top: '236px', textAlign: 'center', fontSize: '330px', lineHeight: '1', whiteSpace: 'nowrap', color: '#F5F1E8' }, `${Z('TAQAT')}${op('+')}${Z('QANOON')}${op('+')}${Z('IMKAAN')}${op('=')}<span class="fin glowr" style="display:inline-block;color:#FF4B4B;margin-left:.03em">0</span>`);
    const tZ = Math.max(L('215', 4) + 0.5, L('216') + 0.02);
    kwords(s, row, [L('215', 0), L('215', 1), L('215', 2), L('215', 3), L('215', 4), tZ - 0.42].map((t) => t - 0.05), { opacity: 0, y: 60 }, 0.3);
    s.tl.fromTo(row.querySelector('.fin'), { scale: 3.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, tZ - 0.2);
    s.sfx('hit', tZ, { gain: 1.1 }); shake(s, row, tZ, 0.45, 18); flash(s, tZ, { peak: 0.22, dur: 0.4, color: '#ff8a80' });
    big(s, 'ZERO HI <span class="red">REHTA HAI</span>', Math.max(tZ + 0.25, L('216', 1) - 0.06), null, { size: 130, y: 770, mode: 'fade', by: 'words', stagger: 0.12 });
    s.div('vig');
  });

  // ───────── H6  the scientist's "nothing" is full: energy, fields, laws ─────────
  def('h06_nothing', T('217') - 0.1, tSlam1 - SW, (s, L, d) => {
    starsBg(s, 16);
    const st = stage3d(s, { fov: 40 }), rig = boxRig(st.scene, { face: 0.93, edge: 0x8fdcff });
    const lab = ctex(cv(512, 512, (x, w, h) => { x.strokeStyle = 'rgba(111,216,255,.5)'; x.lineWidth = 4; x.strokeRect(40, 40, w - 80, h - 80); x.fillStyle = '#8FE2FF'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "700 76px 'Space Mono'"; x.fillText('“NOTHING”', w / 2, h / 2 + 4); }));
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: lab, transparent: true, toneMapped: false })); lp.position.z = 1.206; rig.g.add(lp);
    const gl = glow(0x6fd8ff, 3.4, 0, 0, 1.8), beam = glow(0x9fe6ff, 1, 0, 0, 1.3); gl.position.set(0, 1.0, 0); beam.scale.set(2.8, 7, 1); beam.position.set(0, 3.2, 0); rig.g.add(gl, beam);
    const tOpen = L('217', 12) - 0.1, tSaw = L('219') - 0.05;
    st.frame = (lt) => {
      const o = clamp((lt - tOpen) / 0.8), a = smooth(0, 0.45, lt);
      rig.g.rotation.y = 0.3 + Math.sin(lt * 0.4) * 0.06; rig.g.scale.setScalar(0.8 + 0.2 * ease.out3(a)); rig.lid.rotation.x = -1.95 * ease.outBack(o);
      gl.material.opacity = 0.85 * o * (0.85 + 0.15 * Math.sin(lt * 5)); beam.material.opacity = 0.42 * o; rig.eMat.color.set(0x8fdcff).multiplyScalar(0.5 + 0.5 * o); boxCam(st.camera);
    };
    show(s, s.div('mono cyan sh', { position: 'absolute', left: '1070px', top: '300px', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, HCSS + 'KOI SCIENTIST KEHTA HAI:'), P(L('217', 2) - 0.1), tOpen, { opacity: 0, x: 30 }, 0.4);
    const qt = s.div('play sh', { position: 'absolute', left: '1066px', top: '356px', width: '760px', fontSize: '84px', fontStyle: 'italic', fontWeight: 700, lineHeight: '1.18' }, `${K('“Kainat')} ${K('nothing', 'cyan')} ${K('se')} ${K('bani”')}`);
    kwords(s, qt, [6, 7, 8, 9].map((i) => L('217', i) - 0.08)); s.tl.to(qt, { opacity: 0, duration: 0.3 }, tOpen - 0.1);
    s.sfx('shimmer', tOpen, { gain: 0.9 });
    const scr = s.div('fill', { background: 'rgba(2,4,10,.74)' }); show(s, scr, tSaw, null, { opacity: 0 }, 0.4);
    const bolt = `<svg width="56" height="72" viewBox="0 0 56 72"><path d="M34 2 L6 40 H26 L20 70 L50 28 H30 Z" fill="#6FD8FF"/></svg>`, wave = `<svg width="72" height="62" viewBox="0 0 72 62"><g fill="none" stroke="#6FD8FF" stroke-width="5" stroke-linecap="round"><path d="M4 14 C16 0 28 28 40 14 S60 0 68 14"/><path d="M4 32 C16 18 28 46 40 32 S60 18 68 32"/><path d="M4 50 C16 36 28 64 40 50 S60 36 68 50"/></g></svg>`;
    const law = `<span style="font-family:'Playfair Display',serif;font-style:italic;font-weight:700;font-size:40px;color:#6FD8FF;letter-spacing:.02em">E=mc²</span>`;
    const chips = [[bolt, 'ENERGY', 16], [wave, 'FIELDS', 17], [law, 'PHYSICS KE QAWANEEN', 19]].map(([ic, tx, wi], i) => {
      const c = s.div('htok', { left: '1080px', top: (236 + i * 156) + 'px', fontSize: '68px' }, ic + `<span>${tx}</span>`), t = Math.max(tOpen + 0.5 + i * 0.25, L('217', wi) - 0.08);
      gsap.set(c, { autoAlpha: 0 }); s.tl.set(c, { autoAlpha: 1 }, t).fromTo(c, { x: -400, y: 70 - i * 156, scale: 0.15, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }, t);
      return c;
    });
    capx(s, 'Yeh “nothing” to <span class="hc">bhara hua</span> hai', L('217', 22) - 0.1, L('218') - 0.12, { bottom: 96 });
    const neq = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '846px', textAlign: 'center', fontSize: '112px', lineHeight: '1', whiteSpace: 'nowrap' }, `<span class="a cyan">“NOTHING”</span><span class="n" style="position:relative;display:inline-block;color:#FF4B4B;margin:0 .32em">=<i style="position:absolute;left:38%;top:8%;width:16%;height:88%;background:#FF4B4B;transform:rotate(24deg);border-radius:6px"></i></span><span class="b">“KUCH NAHI”</span>`);
    const tN = Math.max(L('218') + 0.5, L('218', 3) - 0.08);
    s.tl.fromTo(neq.querySelector('.a'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.35 }, L('218') - 0.05).fromTo(neq.querySelector('.b'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.35 }, L('218', 1) - 0.05)
      .fromTo(neq.querySelector('.n'), { opacity: 0, scale: 3.2 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, tN - 0.2).to(neq, { opacity: 0, duration: 0.3 }, tSaw - 0.1);
    s.sfx('hit', tN, { gain: 0.9 }); shake(s, neq, tN, 0.4, 12);
    s.tl.to([chips[0], chips[1]], { opacity: 0, duration: 0.35 }, tSaw).to(chips[2], { x: -470, y: -322, duration: 0.6, ease: 'power2.inOut' }, tSaw).to(chips[2], { boxShadow: '0 0 60px rgba(111,216,255,.75),inset 0 0 26px rgba(111,216,255,.3)', duration: 0.5 }, tSaw + 0.3);
    const hd = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '120px', textAlign: 'center', fontSize: '38px', fontWeight: 700, letterSpacing: '.3em' }, 'SAWAL WAHIN KHADA HAI');
    show(s, hd, tSaw + 0.1, null, { opacity: 0, y: -20 }, 0.5);
    const qq = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '430px', textAlign: 'center', fontSize: '200px', lineHeight: '.96' }, `${K('WOH')} ${K('QAWANEEN', 'cyan glowc')}<br>${K('KAHAN')} ${K('SE')} ${K('AAYE?', 'gold')}`);
    kwords(s, qq, [0, 1, 2, 3, 4].map((i) => L('220', i) - 0.07), { opacity: 0, y: 50 }, 0.3);
    s.div('vig');
  });

  // ───────── H7  DOOR 1 SLAMS · door 2: "khud ko khud banaya" ─────────
  hallScene('h07_hall2', tSlam1 - SW, T('223') - 0.12, (s, L, d) => {
    const w2 = [1, 2, 3, 4].map((i) => L('222', i) - 0.08), tM = Math.max(SW + 0.45, L('221'));
    return { slams: [SW, null, null, null], pl: (lt) => [99, cnt(lt, w2), 0, 0],
      keys: mono([{ t: 0, p: [-4.4, 1.7, 8.0], l: [-6.7, 2.6, 0] }, { t: tM, p: [-4.3, 1.75, 7.8], l: [-6.7, 2.6, 0] }, { t: tM + 0.95, p: [-1.0, 2.3, 9.3], l: [-2.3, 3.1, 0] }, { t: d, p: [-1.5, 2.4, 8.3], l: [-2.3, 3.25, 0] }]),
      html: () => { capx(s, '<span class="hl">Doosra</span> raasta', L('221') - 0.03, L('222') - 0.08); capx(s, 'usne <span class="hl">khud ko khud</span> bana liya', L('222') - 0.03, d + 0.3); } };
  });

  // ───────── H8  the paradox: it had to exist BEFORE it was made ─────────
  def('h08_loop', T('223') - 0.12, T('224') - 0.1, (s, L, d) => {
    starsBg(s, 18);
    const tP = Math.max(0.9, L('223', 3) - 0.08), tM = Math.max(tP + 0.4, L('223', 5) - 0.08);
    const g = svg(s, `<path class="ax" d="M250 760 L1650 760" stroke="rgba(245,241,232,.7)" stroke-width="5" stroke-linecap="round" fill="none"/><path class="ax" d="M1622 738 L1654 760 L1622 782" stroke="rgba(245,241,232,.7)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="tk" d="M1240 738 L1240 782" stroke="#6FD8FF" stroke-width="7" stroke-linecap="round"/>
      <path class="lp" d="M1222 452 C 1150 190, 700 190, 632 440" stroke="#F2C968" stroke-width="9" stroke-linecap="round" fill="none"/><path class="lh" d="M604 396 L630 446 L672 410" stroke="#F2C968" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="gh"><circle cx="620" cy="560" r="96" fill="rgba(255,75,75,.08)" stroke="#FF4B4B" stroke-width="6" stroke-dasharray="16 14"/><path d="M620 668 L620 782" stroke="#FF4B4B" stroke-width="5" stroke-dasharray="10 10"/></g>
      <g class="bk"><path d="M1200 716 L672 716" stroke="#6FD8FF" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M700 698 L670 716 L700 734" stroke="#6FD8FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`);
    s.tl.fromTo(g.querySelectorAll('.ax'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, ease: 'power2.out' }, 0.02).fromTo(g.querySelector('.tk'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.15);
    s.tl.fromTo(g.querySelector('.lp'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.65, ease: 'power2.inOut' }, 0.2).fromTo(g.querySelector('.lh'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.2 }, 0.8);
    s.tl.fromTo(g.querySelector('.bk'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tP).fromTo(g.querySelector('.gh'), { opacity: 0, scale: 0.6, transformOrigin: '620px 560px' }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, tP + 0.1);
    const orb = s.div('horb', { position: 'absolute', left: '1140px', top: '460px' }, HCSS); show(s, orb, 0.05, null, { opacity: 0, scale: 0.4 }, 0.4);
    show(s, s.div('bebas sh', { position: 'absolute', left: '1090px', top: '792px', width: '300px', textAlign: 'center', fontSize: '70px', color: '#9FE2FF' }, 'BANA'), 0.15, null, { opacity: 0, y: 16 }, 0.3);
    show(s, s.div('mono dim', { position: 'absolute', left: '1480px', top: '790px', fontSize: '26px', fontWeight: 700, letterSpacing: '.3em' }, 'WAQT'), 0.15, null, { opacity: 0 }, 0.3);
    show(s, s.div('mont gold sh', { position: 'absolute', left: '620px', top: '196px', width: '620px', textAlign: 'center', fontSize: '40px', fontWeight: 800, letterSpacing: '.1em' }, 'KHUD KO KHUD BANAYA'), 0.45, null, { opacity: 0, y: 14 }, 0.35);
    show(s, s.div('mono cyan sh', { position: 'absolute', left: '790px', top: '664px', width: '300px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em' }, 'PEHLE'), tP, null, { opacity: 0, x: 30 }, 0.3);
    const mj = s.div('bebas glowr', { position: 'absolute', left: '380px', top: '792px', width: '480px', textAlign: 'center', fontSize: '74px', color: '#FF5B5B' }, 'MAUJOOD?!');
    show(s, mj, tM, null, { opacity: 0, scale: 2.2 }, 0.22); shake(s, mj, tM + 0.2, 0.4, 10);
    show(s, s.div('anton glowr', { position: 'absolute', left: '560px', top: '488px', width: '120px', textAlign: 'center', fontSize: '130px', lineHeight: '1.1', color: '#FF5B5B' }, '?'), tP + 0.2, null, { opacity: 0, scale: 0.4 }, 0.3);
    flash(s, tM + 0.2, { peak: 0.2, dur: 0.4, color: '#ff6a60' }); s.sfx('buzz', tM + 0.15, { gain: 0.9 });
    capx(s, 'Yaani banne se <span class="hc">pehle</span> hi <span class="hr">maujood</span> tha', 0.1, d + 0.3, { bottom: 84, size: 50 });
    s.div('vig');
  });
  def('h09_tree', T('224') - 0.1, tSlam2 - SW, (s, L, d) => {
    starsBg(s, 19);
    const node = (t, y) => s.div('panel', { left: '400px', top: y + 'px', width: '330px', height: '124px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: '84px', letterSpacing: '.05em', paddingTop: '6px' }, t);
    const g = svg(s, `<g class="a1"><path d="M565 388 L565 470" stroke="#F5F1E8" stroke-width="7" stroke-linecap="round"/><path d="M543 446 L565 474 L587 446" stroke="#F5F1E8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      <g class="a2"><path d="M565 636 L565 718" stroke="#F5F1E8" stroke-width="7" stroke-linecap="round"/><path d="M543 694 L565 722 L587 694" stroke="#F5F1E8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      <path class="lp" d="M736 520 C 930 400, 930 700, 744 586" stroke="#FF4B4B" stroke-width="9" stroke-linecap="round" fill="none"/><path class="lh" d="M790 640 L742 584 L812 578" stroke="#FF4B4B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="xx"><path d="M543 408 L587 452" stroke="#FF4B4B" stroke-width="8" stroke-linecap="round"/><path d="M587 408 L543 452" stroke="#FF4B4B" stroke-width="8" stroke-linecap="round"/></g>`);
    const nani = node('NANI', 260), ammi = node('AMMI', 508), main = node('MAIN', 756), a1 = g.querySelector('.a1'), a2 = g.querySelector('.a2');
    show(s, nani, 0.12, null, { opacity: 0, y: -30 }, 0.35); show(s, ammi, 0.5, null, { opacity: 0, y: -30 }, 0.35); show(s, main, 0.88, null, { opacity: 0, y: -30 }, 0.35);
    s.tl.fromTo(a1, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.36).fromTo(a2, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.74);
    show(s, s.div('mono dim', { position: 'absolute', left: '600px', top: '412px', fontSize: '24px', fontWeight: 700, letterSpacing: '.3em' }, 'JANAM'), 0.4, null, { opacity: 0 }, 0.3);
    show(s, s.div('mono dim', { position: 'absolute', left: '600px', top: '660px', fontSize: '24px', fontWeight: 700, letterSpacing: '.3em' }, 'JANAM'), 0.78, null, { opacity: 0 }, 0.3);
    const tAm = Math.max(1.3, L('225', 1) - 0.08), tKh = Math.max(tAm + 0.4, L('225', 3) - 0.08), tJ = Math.max(tKh + 0.6, L('225', 7) - 0.08);
    s.tl.to(ammi, { borderColor: '#F2C968', boxShadow: '0 0 0 3px rgba(233,185,85,.9), 0 0 70px rgba(233,185,85,.4)', scale: 1.08, duration: 0.35 }, tAm);
    s.tl.to([nani, a1], { opacity: 0.22, duration: 0.4 }, tKh).fromTo(g.querySelector('.xx'), { opacity: 0, scale: 2, transformOrigin: '565px 430px' }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power3.in' }, tKh);
    s.tl.fromTo(g.querySelector('.lp'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, tKh + 0.1).fromTo(g.querySelector('.lh'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.2 }, tKh + 0.65);
    show(s, s.div('bebas glowr', { position: 'absolute', left: '900px', top: '508px', fontSize: '66px', color: '#FF5B5B', whiteSpace: 'nowrap' }, 'KHUD KO JANAM?!'), tJ, null, { opacity: 0, scale: 1.8 }, 0.25);
    show(s, s.div('mono cyan sh', { position: 'absolute', left: '1010px', top: '250px', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, 'JAISE KOI KAHE:'), P(L('224', 3) - 0.05), null, { opacity: 0, x: 30 }, 0.35);
    const qt = s.div('play sh', { position: 'absolute', left: '1006px', top: '640px', width: '800px', fontSize: '66px', fontStyle: 'italic', fontWeight: 700, lineHeight: '1.25' },
      `${K('“Meri')} ${K('ammi', 'gold')} ${K('ne')} ${K('khud', 'red')} ${K('apne', 'red')} ${K('aap', 'red')} ${K('ko', 'red')} ${K('janam')} ${K('diya.”')}`);
    kwords(s, qt, [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => L('225', i) - 0.06), { opacity: 0, y: 18 }, 0.3);
    s.div('vig');
  });

  // ───────── H10  DOOR 2 SLAMS on "Namumkin" · door 3 ─────────
  hallScene('h10_hall3', tSlam2 - SW, TW('227', 3) - 0.1, (s, L, d) => {
    const tM = Math.max(SW + 0.5, L('226') - 0.1), w3 = [L('227', 1) - 0.08, L('227', 2) - 0.08, L('227', 2) + 0.14];
    return { slams: [-9, SW, null, null], pl: (lt) => [99, 99, cnt(lt, w3), 0],
      keys: mono([{ t: 0, p: [0.2, 1.0, 6.8], l: [-2.2, 2.8, 0] }, { t: tM, p: [0.3, 1.05, 6.6], l: [-2.2, 2.8, 0] }, { t: tM + 0.95, p: [3.6, 2.3, 9.3], l: [2.3, 3.1, 0] }, { t: d, p: [3.2, 2.4, 8.5], l: [2.3, 3.25, 0] }]),
      html: () => { stamp(s, 'NAMUMKIN', SW - 0.2, { x: 560, y: 380, size: 160, rot: -7, out: tM + 0.55 });
        capx(s, '<span class="hl">Teesra</span> raasta', L('226') - 0.03, L('227') - 0.08); capx(s, 'usay <span class="hl">kisi aur</span> ne banaya…', L('227') - 0.03, d + 0.3); } };
  });

  // ───────── H11  the endless chain: "aur usay kisi aur ne…" ─────────
  const buildChain = (st, N = 44) => {
    const sc = st.scene; sc.fog = new THREE.FogExp2(0x02040a, 0.034); const DZ = 2.3;
    const face = (txt) => ctex(cv(384, 608, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#16233f'); g.addColorStop(1, '#0a1124'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28); x.beginPath(); x.arc(w / 2, 220, 84, 0, 6.283); x.lineWidth = 12; x.stroke(); x.beginPath(); x.arc(w / 2, 220, 30, 0, 6.283); x.fillStyle = '#fff'; x.fill();
      x.textAlign = 'center'; x.font = "400 78px 'Bebas Neue'"; txt.split('|').forEach((l, i) => x.fillText(l, w / 2, 440 + i * 84)); }));
    const tx0 = face('YEH|CHEEZ'), tx1 = face('BANI HUI|CHEEZ');
    const rimT = ctex(cv(256, 384, (x, w, h) => { x.strokeStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 30; x.lineWidth = 10; x.strokeRect(48, 48, w - 96, h - 96); x.strokeRect(48, 48, w - 96, h - 96); }));
    const arT = ctex(cv(128, 256, (x) => { x.strokeStyle = '#fff'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round'; for (let i = 0; i < 3; i++) { x.globalAlpha = 0.45 + i * 0.27; x.beginPath(); x.moveTo(24, 40 + i * 62); x.lineTo(64, 86 + i * 62); x.lineTo(104, 40 + i * 62); x.stroke(); } }));
    const rayT = ctex(cv(512, 512, (x) => { const R = rng(5); x.translate(256, 256); for (let i = 0; i < 70; i++) { const a = R() * 6.283, len = 120 + R() * 136, wd = 0.012 + R() * 0.03; const g = x.createRadialGradient(0, 0, 0, 0, 0, len); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, len, a - wd, a + wd); x.closePath(); x.fill(); } }));
    const geo = new THREE.BoxGeometry(1.5, 2.4, 0.08), rimG = new THREE.PlaneGeometry(2.4, 3.2), arG = new THREE.PlaneGeometry(0.5, 1.25), cards = [];
    for (let i = 0; i < N; i++) {
      const bm = new THREE.MeshBasicMaterial({ map: i ? tx1 : tx0, transparent: true, opacity: 0, toneMapped: false }), b = new THREE.Mesh(geo, bm); b.position.set(0, 1.25, -i * DZ); sc.add(b);
      const rm = new THREE.MeshBasicMaterial({ map: rimT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), r = new THREE.Mesh(rimG, rm); r.position.set(0, 1.25, -i * DZ - 0.06); sc.add(r);
      const am = new THREE.MeshBasicMaterial({ map: arT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), a = new THREE.Mesh(arG, am); a.rotation.x = -Math.PI / 2; a.position.set(0, 0.02, -i * DZ + DZ / 2); sc.add(a);
      const pl = glow(0xffffff, 1, 0, 0, 1.6); pl.scale.set(2.8, 0.55, 1); pl.position.set(0, 0.04, -i * DZ); sc.add(pl);
      cards.push({ b, r, a, bm, rm, am, pl });
    }
    const CY = new THREE.Color(0x8fdcff), GD = new THREE.Color(0xffcf6b);
    const set = (i, a, gold = 0, boost = 0) => {
      const c = cards[i], vis = a > 0.01; c.b.visible = c.r.visible = c.a.visible = c.pl.visible = vis; if (!vis) return;
      _c.copy(CY).lerp(GD, gold); c.bm.opacity = Math.min(1, a * 1.2); c.bm.color.copy(_c).multiplyScalar(0.8 + 0.4 * boost + 0.2 * gold);
      c.rm.color.copy(_c); c.rm.opacity = Math.min(1, a * (0.5 + 0.4 * gold + boost)); c.am.color.copy(_c); c.am.opacity = i === 0 ? 0 : a * 0.9; c.pl.material.color.copy(_c); c.pl.material.opacity = a * (0.2 + 0.3 * gold + 0.3 * boost);
    };
    const src = new THREE.Group(); src.position.set(0, 1.7, -N * DZ - 4); sc.add(src);
    const s1 = glow(0xfff4d6, 1, 0, 0.05, 2.0), s2 = glow(0xffc24a, 1, 0, 0, 1.5); s1.material.fog = s2.material.fog = false;
    const rays = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rayT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, toneMapped: false, color: 0xffd98a }));
    src.add(s2, rays, s1);
    const setSrc = (a, lt) => { s1.material.opacity = a; s1.scale.setScalar(13 + 2.5 * Math.sin(lt * 1.7)); s2.material.opacity = a * 0.75; s2.scale.setScalar(48); rays.material.opacity = a * 0.6; rays.scale.setScalar(74); rays.rotation.z = lt * 0.06; };
    return { N, DZ, set, setSrc };
  };
  const inf = `<span class="bebas">…</span> <span style="font-family:'Noto Sans Math','STIX Two Text',serif">∞</span>`;
  def('h11_chain', TW('227', 3) - 0.1, T('231') - 0.1, (s, L, d) => {
    const st = stage3d(s, { bg: 0x02040a, fov: 42 }), ch = buildChain(st);
    const tc = [0, 0.35, L('228', 1) - 0.1, L('229', 1) - 0.1]; for (let i = 1; i < 4; i++) tc[i] = Math.max(tc[i], tc[i - 1] + 0.3);
    let tt = Math.max(tc[3] + 0.4, L('230') - 0.15), iv = 0.2; while (tc.length < ch.N) { tc.push(tt); tt += iv; iv = Math.max(0.035, iv * 0.86); }
    const keys = mono([{ t: 0, p: [-2.9, 2.0, 5.2], l: [0.3, 1.25, -3] }, { t: tc[4] - 0.1, p: [-2.7, 2.3, 4.6], l: [0.5, 1.2, -6] }, { t: d, p: [-2.2, 3.1, 2.4], l: [0.6, 1.0, -15] }]);
    st.frame = (lt) => { for (let i = 0; i < ch.N; i++) { const a = lt - tc[i]; ch.set(i, a < 0 ? 0 : Math.min(1, a / 0.25), 0, a < 0 ? 0 : 0.8 * Math.exp(-a * 3.5)); } ch.setSrc(0, lt); applyCam(st.camera, keys, lt, { drift: 0.05 }); };
    s.div('scrim-b', { height: '30%' });
    s.sfx('riser', tc[4], { dur: Math.max(0.6, d - tc[4]), gain: 0.6 });
    capx(s, 'usay <span class="hl">kisi aur</span> bani hui cheez ne banaya', 0.05, L('228') - 0.1, { size: 50 });
    capx(s, 'Aur usay <span class="hl">kisi aur</span> ne…', L('228') - 0.05, L('229') - 0.1);
    capx(s, '…aur usay <span class="hl">kisi aur</span> ne…', L('229') - 0.05, L('230') - 0.1);
    capx(s, 'Kabhi na khatam hone wala <span class="hr">silsila</span>', L('230') - 0.05, d + 0.3);
    const io = s.div('sh', { position: 'absolute', left: '0', top: '0', fontSize: '120px', lineHeight: '1', color: '#DFF3FF', whiteSpace: 'nowrap' }, inf);
    show(s, io, L('230', 2) - 0.1, null, { opacity: 0, scale: 0.6 }, 0.5);
    s.onUpdate(() => { const p = proj(st.camera, 0, 2.6, -ch.N * ch.DZ); io.style.left = (p[0] - 70).toFixed(1) + 'px'; io.style.top = (p[1] - 150).toFixed(1) + 'px'; });
    s.div('vig');
  });

  // ───────── H12  the 100-rupee example: an endless row of empty pockets ─────────
  def('h12_row', T('231') - 0.1, TW('238', 19) - 0.1, (s, L, d) => {
    const st = stage3d(s, { bg: 0x03050b, fov: 40 }), sc = st.scene; sc.fog = new THREE.FogExp2(0x03050b, 0.02);
    const NP = 46, DX = 2.6, SEG = 16;
    const pT = ctex(cv(256, 448, (x) => { const g = x.createLinearGradient(0, 0, 0, 448); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c4c8d4'); x.fillStyle = g; x.beginPath(); x.arc(128, 60, 50, 0, 6.283); x.fill();
      for (const r of [[58, 124, 140, 196, 46], [20, 130, 34, 168, 17], [202, 130, 34, 168, 17], [66, 280, 56, 160, 24], [134, 280, 56, 160, 24]]) { x.beginPath(); x.roundRect(...r); x.fill(); } }));
    const lbT = (t) => ctex(cv(256, 128, (x) => { x.fillStyle = '#0b1020'; x.textAlign = 'center'; x.textBaseline = 'middle'; const ls = t.split('|'); x.font = `400 ${ls.length > 1 ? 54 : 84}px 'Bebas Neue'`; ls.forEach((l, i) => x.fillText(l, 128, ls.length > 1 ? 40 + i * 52 : 70)); }));
    const bgT = ctex(cv(256, 112, (x) => { x.fillStyle = '#E23B3B'; x.beginPath(); x.roundRect(4, 4, 248, 104, 26); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 5; x.stroke(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "700 62px 'Space Mono'"; x.fillText('Rs 0', 128, 60); }));
    const tkT = ctex(cv(256, 128, (x) => { x.fillStyle = 'rgba(10,40,24,.85)'; x.beginPath(); x.roundRect(8, 8, 240, 112, 14); x.fill(); x.strokeStyle = '#57E39A'; x.lineWidth = 7; x.setLineDash([18, 12]); x.stroke(); x.fillStyle = '#8CF5BE'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "400 84px 'Bebas Neue'"; x.fillText('100 ?', 128, 70); }));
    const tints = [0xF2C968, 0x8FDFFF, 0xF2EDE2], labs = ['MAIN', 'AAP', 'DOST', 'DOST KA|DOST'];
    const hop = [L('233', 1), L('235', 5), L('236', 7), L('236', 14), L('237', 3)].map((t) => t - 0.1); for (let i = 1; i < hop.length; i++) hop[i] = Math.max(hop[i], hop[i - 1] + 0.5);
    { let tt = Math.max(hop[4] + 0.5, L('238') - 0.25), iv = 0.4; while (hop.length < NP - 1) { hop.push(tt); tt += iv; iv = Math.max(0.09, iv * 0.9); } }
    const hd = hop.map((t, i) => Math.min(0.42, (hop[i + 1] ?? t + 1) - t));
    const ap = [0.1, L('233') - 0.15, L('235', 4) - 0.15, L('236', 6) - 0.15], bd = [1e9, L('235', 2) - 0.1, L('236', 3) - 0.1], tWave = L('238', 9) - 0.1;
    for (let i = 4; i < NP; i++) ap[i] = L('236', 11) - 0.2 + (i - 4) * 0.04; for (let i = 3; i < NP; i++) bd[i] = hop[i - 1] + hd[i - 1] + 0.12;
    const PP = [];
    for (let i = 0; i < NP; i++) {
      const col = tints[i] ?? 0xAEB6C8, x = i * DX;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pT, color: col, transparent: true })); sp.position.set(x, 1.3125, 0); sc.add(sp);
      const mr = new THREE.Sprite(new THREE.SpriteMaterial({ map: pT, color: col, transparent: true, opacity: 0.13, rotation: Math.PI })); mr.position.set(x, -1.3125, 0); sc.add(mr);
      const pool = glow(col, 1, 0.16, 0, 1.6); pool.scale.set(2.2, 0.42, 1); pool.position.set(x, 0.02, 0.02); sc.add(pool);
      let lb = null; if (labs[i]) { lb = new THREE.Sprite(new THREE.SpriteMaterial({ map: lbT(labs[i]), transparent: true })); lb.scale.set(0.8, 0.4, 1); lb.position.set(x, 1.62, 0.06); sc.add(lb); }
      const bg = new THREE.Sprite(new THREE.SpriteMaterial({ map: bgT, transparent: true })); bg.position.set(x + 0.14, 1.0, 0.09); bg.visible = false; sc.add(bg);
      PP.push({ sp, mr, pool, lb, bg });
    }
    const arcs = hop.map((t, j) => { const x0 = j * DX + 0.3, x1 = (j + 1) * DX - 0.3, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x0, 2.8, 0), new THREE.Vector3((x0 + x1) / 2, 3.95, 0), new THREE.Vector3(x1, 2.8, 0));
      const mat = new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, toneMapped: false }), mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.035, 5, false), mat); mesh.visible = false; sc.add(mesh); return { curve, mat, mesh }; });
    const tok = new THREE.Sprite(new THREE.SpriteMaterial({ map: tkT, transparent: true, depthTest: false })); tok.scale.set(0.9, 0.45, 1); tok.renderOrder = 9; tok.visible = false; sc.add(tok);
    const keys = mono([{ t: 0, p: [-0.4, 1.8, 7.0], l: [0.4, 1.6, 0] }, { t: L('232'), p: [-0.3, 1.8, 6.8], l: [0.5, 1.6, 0], e: 'lin' }, { t: L('233') + 0.5, p: [1.0, 1.9, 8.4], l: [1.5, 1.65, 0] }, { t: L('235', 4), p: [1.1, 1.9, 8.3], l: [1.6, 1.65, 0] },
      { t: L('235', 5) + 0.6, p: [3.3, 1.95, 8.7], l: [4.3, 1.65, 0] }, { t: L('236', 6), p: [3.4, 1.95, 8.6], l: [4.4, 1.65, 0] }, { t: L('236', 7) + 0.6, p: [5.8, 2.0, 8.9], l: [7.2, 1.65, 0] }, { t: L('236', 14) + 0.5, p: [8.2, 2.05, 9.1], l: [10.0, 1.65, 0] },
      { t: L('237', 3) + 0.5, p: [10.6, 2.05, 9.3], l: [12.8, 1.65, 0] }, { t: L('238', 2) + 0.9, p: [9.0, 5.6, 9.5], l: [34, 0.2, 0] }, { t: d, p: [12.5, 5.2, 8.6], l: [40, 0.2, 0] }]);
    st.frame = (lt) => {
      for (let i = 0; i < NP; i++) {
        const p = PP[i], a = clamp((lt - ap[i]) / 0.35), vis = a > 0; p.sp.visible = p.mr.visible = p.pool.visible = vis; if (p.lb) p.lb.visible = a >= 1;
        if (!vis) { p.bg.visible = false; continue; }
        const e = ease.outBack(a); p.sp.scale.set(1.5 * (0.7 + 0.3 * e), 2.625 * e, 1); p.sp.position.y = 1.3125 * e; p.sp.material.opacity = Math.min(1, a * 2); p.mr.scale.copy(p.sp.scale); p.mr.position.y = -1.3125 * e;
        const b = i === 0 ? 0 : clamp((lt - Math.min(bd[i], tWave + i * 0.05)) / 0.25), pulse = Math.exp(-Math.pow((lt - tWave - i * 0.05) / 0.16, 2));
        p.bg.visible = b > 0; if (b > 0) { const sb = ease.outBack(b) * (1 + 0.55 * pulse); p.bg.scale.set(0.66 * sb, 0.29 * sb, 1); }
      }
      let cur = -1;
      for (let j = 0; j < arcs.length; j++) { const k = clamp((lt - hop[j]) / hd[j]), A = arcs[j]; A.mesh.visible = k > 0; if (k > 0) { cur = j; A.mesh.geometry.setDrawRange(0, Math.round(k * SEG) * 30); A.mat.opacity = k < 1 ? 1 : 0.5; } }
      tok.visible = cur >= 0; if (cur >= 0) { const k = clamp((lt - hop[cur]) / hd[cur]); arcs[cur].curve.getPoint(k * k * (3 - 2 * k), tok.position); tok.position.y += 0.3; }
      applyCam(st.camera, keys, lt, { drift: 0.04 });
    };
    s.sfx('riser', hop[5], { dur: 2.4, gain: 0.5 });
    // overlays
    show(s, s.div('chip', { position: 'absolute', right: '110px', top: '92px', fontSize: '32px' }, HCSS + 'EK MISAAL'), 0.15, L('233') - 0.1, { opacity: 0, y: -20 }, 0.4);
    const bub = (i, cls, html, t0, t1, y = 2.78) => { const h = s.div(null, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' }, `<div class="hbub ${cls}">${html}</div>`), b = h.firstElementChild;
      s.onUpdate(() => { const p = proj(st.camera, i * DX, y, 0); h.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px)`; }); show(s, b, P(t0), Math.max(t1, P(t0) + 0.5), { opacity: 0, scale: 0.5, y: 30 }, 0.3); return b; };
    bub(0, '', `<div style="display:flex;align-items:center;gap:22px"><div class="hnote" style="position:relative;transform:scale(.5);margin:-42px -88px">${NOTE}</div><span>100 rupay chahiyen</span></div>`, L('232', 1) - 0.1, L('233') + 0.3);
    const two = (b, t) => s.tl.fromTo(b.querySelector('.l2'), { opacity: 0 }, { opacity: 1, duration: 0.25 }, P(t));
    two(bub(1, '', `<div class="who">AAP</div><div>“Mere paas <b>nahi</b>…</div><div class="l2">…apne dost se le kar deta hoon”</div>`, L('235') - 0.1, L('235', 11) - 0.05), L('235', 4) - 0.1);
    two(bub(2, '', `<div class="who">DOST</div><div>“Mere paas <b>bhi nahi</b>…</div><div class="l2">…main apne dost se leta hoon”</div>`, L('236') - 0.1, L('236', 11) - 0.05), L('236', 5) - 0.1);
    bub(3, '', `“…apne dost se”`, L('236', 12) - 0.1, L('237') - 0.05); bub(4, '', `“…apne dost se…”`, L('237', 1) - 0.1, L('238') - 0.1);
    const slot = s.div(null, { position: 'absolute', left: '110px', bottom: '116px' }, `<div class="mono" style="font-size:20px;font-weight:700;letter-spacing:.34em;color:rgba(245,241,232,.78);margin-bottom:10px">MERA HAATH</div><div class="sl" style="width:236px;height:112px;border:4px dashed #57E39A;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:70px;padding-top:6px;color:#57E39A;background:rgba(87,227,154,.07)">100 ?</div>`);
    show(s, slot, P(L('232', 1) - 0.1), L('238', 2) + 0.5, { opacity: 0, x: -30 }, 0.4);
    for (const t of [bd[1], bd[2]]) { s.tl.fromTo(slot.querySelector('.sl'), { scale: 1 }, { scale: 1.12, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' }, P(t)); }
    capx(s, 'Agar yeh silsila <span class="hl">kabhi khatam hi na ho</span>…', L('238') - 0.05, L('238', 9) - 0.1);
    capx(s, '…kisi ke paas bhi <span class="hr">apna paisa</span> na ho…', L('238', 9) - 0.05, d + 0.3);
    const io = s.div('sh', { position: 'absolute', left: '0', top: '0', fontSize: '110px', lineHeight: '1', color: '#DFF3FF', whiteSpace: 'nowrap' }, inf);
    show(s, io, L('238', 2) + 1.0, null, { opacity: 0, scale: 0.6 }, 0.5);
    s.onUpdate(() => { const p = proj(st.camera, 150, 2.2, 0); io.style.left = (p[0] - 60).toFixed(1) + 'px'; io.style.top = (p[1] - 130).toFixed(1) + 'px'; });
    s.div('vig');
  });

  // ───────── H13  the empty hand → "KABHI NAHI" → but the note IS in my hand ─────────
  def('h13_hand', TW('238', 19) - 0.1, T('241') - 0.1, (s, L, d) => {
    starsBg(s, 21, 'radial-gradient(ellipse at 50% 68%, #12203c 0%, #050a16 55%, #010205 100%)');
    const tK = Math.max(1.6, L('239', 1) - 0.2), tLek = Math.max(tK + 0.6, L('240') - 0.06), tDrop = Math.max(tLek + 0.1, L('240', 1) - 0.3), tLand = tDrop + 0.5;
    const hand = s.div(null, { position: 'absolute', left: '660px', top: '440px', width: '600px', height: '520px' }, HCSS + `<svg width="600" height="520" viewBox="0 0 600 520"><g fill="#E4DCCB"><rect x="222" y="392" width="156" height="150" rx="34" fill="#B4AB97"/><rect x="150" y="196" width="300" height="250" rx="84"/><rect x="158" y="62" width="62" height="220" rx="31"/><rect x="232" y="30" width="62" height="250" rx="31"/><rect x="306" y="40" width="62" height="240" rx="31"/><rect x="380" y="82" width="62" height="200" rx="31"/><rect x="72" y="236" width="64" height="170" rx="32" transform="rotate(-42 104 380)"/></g></svg>`);
    show(s, hand, 0.02, null, { opacity: 0, y: 60 }, 0.5);
    const gl = s.div(null, { position: 'absolute', left: '560px', top: '460px', width: '800px', height: '600px', background: 'radial-gradient(ellipse at 50% 50%, rgba(120,255,170,.5) 0%, rgba(233,185,85,.22) 35%, rgba(0,0,0,0) 68%)' });
    s.tl.fromTo(gl, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.15, duration: 0.35, ease: 'power2.out' }, tLand).to(gl, { opacity: 0.55, scale: 1, duration: 0.8 }, tLand + 0.35);
    const sl = s.div('bebas', { position: 'absolute', left: '785px', top: '675px', width: '350px', height: '170px', border: '5px dashed #57E39A', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '96px', paddingTop: '8px', color: '#57E39A', background: 'rgba(10,30,20,.55)' }, '100 ?');
    show(s, sl, 0.25, tLand, { opacity: 0, scale: 1.3 }, 0.35); s.tl.to(sl, { borderColor: '#FF4B4B', color: '#FF4B4B', duration: 0.15 }, tK + 0.2);
    const q = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '236px', textAlign: 'center', fontSize: '100px', lineHeight: '1.02' }, `${K('TO')} ${K('KYA')} ${K('MERE')} ${K('HAATH')} ${K('MEIN')}<br>${K('KABHI')} ${K('100', 'green')} ${K('KA', 'green')} ${K('NOTE', 'green')} ${K('AAYEGA?')}`);
    kwords(s, q, [19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((i) => L('238', i) - 0.07)); s.tl.to(q, { opacity: 0, duration: 0.25 }, tLek - 0.1);
    stamp(s, 'KABHI NAHI', tK, { x: 470, y: 470, size: 210, rot: -5, out: tLek + 0.05 }); s.sfx('buzz', tK + 0.2, { gain: 1 });
    const note = s.div('hnote', { left: '785px', top: '675px' }, NOTE);
    gsap.set(note, { autoAlpha: 0 }); s.tl.set(note, { autoAlpha: 1 }, tDrop).fromTo(note, { y: -760, rotate: -28, scale: 1.5, opacity: 0 }, { y: 0, rotate: -5, scale: 1, opacity: 1, duration: 0.5, ease: 'power2.in' }, tDrop)
      .fromTo(note, { y: 0 }, { y: 0, keyframes: [{ y: 14, scale: 0.96, duration: 0.07 }, { y: 0, scale: 1, duration: 0.2 }] }, tLand).to(note, { scale: 1.06, duration: Math.max(0.3, d - tLand - 0.3), ease: 'sine.out' }, tLand + 0.3);
    flash(s, tLand, { peak: 0.3, dur: 0.5, color: '#c8ffdc' }); s.sfx('ding', tLand, { gain: 1.1 });
    const lk = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '250px', textAlign: 'center', fontSize: '124px', lineHeight: '1' }, `${K('LEKIN')} ${K('NOTE', 'green')} ${K('MERE')} ${K('HAATH')} ${K('MEIN')} ${K('HAI', 'gold glowg')}`);
    kwords(s, lk, [L('240') - 0.04, tDrop + 0.25, L('240', 2) - 0.05, L('240', 3) - 0.05, L('240', 4) - 0.05, L('240', 5) - 0.05].map((t, i) => Math.max(t, tLek + i * 0.08)));
    s.div('vig');
  });
  def('h14_kainat', T('241') - 0.1, T('242') - 0.1, (s, L, d) => {
    still(s, IMG.hudf || IMG.xdf || IMG.placeholder, { kb: { s0: 1.25, s1: 1.42 }, linear: true }); s.div('scrim-all', { background: 'rgba(2,4,10,.28)' });
    flash(s, 0, { peak: 0.6, dur: 0.45 }); s.sfx('hit', 0.02, { gain: 1 });
    const h = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '360px', textAlign: 'center', fontSize: '250px', lineHeight: '1.02' }, `${K('KAINAT', 'cyan glowc')}<br>${K('MAUJOOD')} ${K('HAI')}`);
    kwords(s, h, [L('241'), L('241', 1), L('241', 2)].map((t) => t - 0.06), { opacity: 0, scale: 1.5, y: 0 }, 0.26); s.tl.to(h, { scale: 1.05, duration: d, ease: 'none' }, 0);
    s.div('vig');
  });
  def('h15_aap', T('242') - 0.1, tSlam3 - SW, (s, L, d) => {
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, #1a1407 0%, #060503 55%, #000 100%)' });
    const g = svg(s, [0, 1, 2, 3].map(() => `<circle r="100" fill="none" stroke="#E9B955" stroke-width="3"/>`).join(''), { vb: '-960 -500 1920 1080' }), cs = [...g.querySelectorAll('circle')];
    s.onUpdate((lt) => cs.forEach((c, i) => { const k = ((lt * 0.55 + i * 0.25) % 1); c.setAttribute('r', (160 + k * 900).toFixed(1)); c.setAttribute('opacity', (0.5 * (1 - k)).toFixed(3)); }));
    flash(s, 0, { peak: 0.5, dur: 0.4, color: '#ffe9b0' }); s.sfx('hit', 0.02, { gain: 1 });
    const h = s.div(null, { position: 'absolute', left: '0', right: '0', top: '170px', textAlign: 'center' }, `<div class="k anton goldgrad" style="font-size:470px;line-height:1.05">AAP</div><div class="bebas sh" style="font-size:170px;line-height:1;margin-top:-10px">${K('MAUJOOD')} ${K('HAIN')}</div>`);
    kwords(s, h, [L('242'), L('242', 1), L('242', 2)].map((t) => t - 0.06), { opacity: 0, scale: 1.6, y: 0 }, 0.24);
  });

  // ───────── H16  DOOR 3 SLAMS — only door 4 is left ─────────
  hallScene('h16_hall4', tSlam3 - SW, TW('244', 1) - 0.1, (s, L, d) => ({
    slams: [-9, -9, SW, null], pl: () => [99, 99, 99, 0], warm: (lt) => 0.55 * smooth(SW + 0.2, d, lt), boost: (lt) => 1 + 0.6 * smooth(SW + 0.2, d, lt),
    keys: mono([{ t: 0, p: [5.4, 1.9, 11.0], l: [4.0, 2.7, 0] }, { t: SW + 0.3, p: [5.45, 1.9, 10.9], l: [4.0, 2.7, 0] }, { t: d, p: [6.0, 2.0, 9.2], l: [5.6, 2.7, 0] }]),
    html: () => capx(s, 'Iska <span class="hl">matlab</span>…', L('243') - 0.03, d + 0.3),
  }));

  // ───────── H17  behind the chain: ONE whose existence is its own (pure light) ─────────
  def('h17_source', TW('244', 1) - 0.1, T('247') - 0.12, (s, L, d) => {
    const st = stage3d(s, { bg: 0x02040a, fov: 42 }), ch = buildChain(st), N = ch.N;
    const tS = Math.max(0.5, L('244', 3) - 0.1), tW = Math.max(tS + 0.5, L('244', 5) - 0.1), wd = 1.25;
    const keys = mono([{ t: 0, p: [-3.4, 2.5, 6.0], l: [0.9, 1.3, -10] }, { t: d, p: [-2.7, 2.15, -4.0], l: [0.7, 1.45, -30], e: 'lin' }]);
    st.frame = (lt) => {
      for (let i = 0; i < N; i++) { const tj = tW + wd * (1 - i / (N - 1)), g = smooth(tj, tj + 0.25, lt); ch.set(i, 0.8 + 0.2 * g, g, g * (0.9 * Math.exp(-Math.max(0, lt - tj) * 2.5) + 0.22 * Math.max(0, Math.sin(lt * 2.4 + i * 0.55)))); }
      ch.setSrc(smooth(tS, tS + 1.0, lt), lt); applyCam(st.camera, keys, lt, { drift: 0.04 });
    };
    s.sfx('swell', tS, { dur: 2.6, gain: 1 });
    s.div(null, { position: 'absolute', left: '0', top: '0', bottom: '0', width: '56%', background: 'linear-gradient(90deg, rgba(2,4,10,.82) 0%, rgba(2,4,10,.5) 55%, rgba(2,4,10,0) 100%)' });
    s.div('scrim-b', { height: '26%' });
    capx(s, 'Is silsile ke <span class="hl">peeche</span>…', 0.05, L('244', 4) - 0.1); capx(s, '…koi <span class="hl">EK</span> aisa zaroor hai', L('244', 4) - 0.05, L('245') - 0.1);
    [['245', 0, `JIS KA WUJOOD <span class="gold">US KA APNA</span> HAI`], ['246', 0, `JO KISI KA <span class="gold">MOHTAJ NAHI</span>`], ['246', 6, `SAB <span class="gold">JIS KE MOHTAJ</span> HAIN`]].forEach(([id, w, tx], i) => {
      const r = s.div('bebas sh', { position: 'absolute', left: '110px', top: (590 + i * 108) + 'px', fontSize: '86px', lineHeight: '1', whiteSpace: 'nowrap' }, `<i style="display:inline-block;width:14px;height:70px;background:#E9B955;margin-right:26px;vertical-align:-4px"></i>${tx}`);
      show(s, r, L(id, w) - 0.08, null, { opacity: 0, x: -50 }, 0.5);
    });
    s.div('vig');
  });

  // ───────── H18  the fourth door — the only one left ─────────
  hallScene('h18_hall5', T('247') - 0.12, T('249') - 0.1 + 0.45, (s, L, d) => {
    const w4 = [0, 1, 2, 3, 4, 5, 6].map((i) => L('247', 1) - 0.1 + i * 0.1), tc = tCheck - s.t0;
    s.sfx('chime', tc, { gain: 1 });
    return { slams: [-9, -9, -9, null], pl: (lt) => [99, 99, 99, cnt(lt, w4)], warm: (lt) => 0.55 + 0.45 * smooth(0, 1.2, lt), boost: (lt) => 1.6 + 1.0 * smooth(0.4, d, lt),
      keys: mono([{ t: 0, p: [2.6, 2.1, 14.5], l: [5.6, 2.9, 0] }, { t: d, p: [6.5, 2.35, 5.4], l: [6.9, 2.75, 0] }]),
      html: () => {
        capx(s, 'Yehi <span class="hl">chautha raasta</span> hai', L('247') - 0.03, L('248') - 0.1); capx(s, 'Aur yehi <span class="hl">akela raasta</span> bachta hai', L('248') - 0.03, L('248e') + 0.35);
        const wash = s.div('fill', { background: 'radial-gradient(ellipse at 58% 46%, #fff6dc 0%, #f2c968 45%, #b8862e 100%)', opacity: '0' }); s.onUpdate((lt) => { wash.style.opacity = (0.92 * smooth(d - 0.95, d - 0.3, lt)).toFixed(3); });
      } };
  });

  // ───────── H19  Ibn Sina: "Wajib-ul-Wujood" (name plate only) ─────────
  def('h19_ibnsina', T('249') - 0.1, TW('249', 9) - 0.1 + 0.3, (s, L, d) => {
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 45%, #2a1f0a 0%, #0d0a04 55%, #020201 100%)' });
    const ro = svg(s, `<g class="r">${rosette(560)}</g>`, { vb: '-960 -540 1920 1080', style: { opacity: '0.4' } }), rg = ro.querySelector('.r'); s.onUpdate((lt) => rg.setAttribute('transform', `rotate(${(lt * 1.6).toFixed(3)})`));
    s.div(null, { position: 'absolute', left: '0', right: '0', top: '180px', height: '720px', background: 'radial-gradient(ellipse at 50% 50%, rgba(6,5,2,.9) 0%, rgba(6,5,2,.6) 50%, rgba(6,5,2,0) 75%)' });
    const tW = Math.max(0.9, L('249', 5) - 0.1);
    show(s, s.div('ar2 glowg', { position: 'absolute', left: '130px', top: '236px', width: '780px', textAlign: 'center', fontSize: '190px', lineHeight: '1.4', color: '#F8DE9A' }, AR.ibn_sina), 0.1, null, { opacity: 0, scale: 0.9 }, 0.8);
    big(s, 'IBN SINA', P(L('249') - 0.02), null, { x: 130, w: 780, y: 520, size: 170 });
    show(s, s.div('mont dim sh', { position: 'absolute', left: '130px', top: '700px', width: '780px', textAlign: 'center', fontSize: '36px', fontWeight: 600, letterSpacing: '.12em' }, 'ne isay kaha —'), L('249', 2) - 0.05, null, { opacity: 0 }, 0.4);
    const dv = s.div(null, { position: 'absolute', left: '958px', top: '270px', width: '3px', height: '480px', background: 'linear-gradient(180deg, rgba(233,185,85,0), rgba(233,185,85,.9), rgba(233,185,85,0))' }); s.tl.fromTo(dv, { scaleY: 0 }, { scaleY: 1, duration: 0.6 }, tW - 0.2);
    show(s, s.div('ar2 glowg', { position: 'absolute', left: '1000px', top: '262px', width: '800px', textAlign: 'center', fontSize: '150px', lineHeight: '1.5', color: '#FFF3D2' }, AR.wajib), tW, null, { opacity: 0, y: 30, scale: 0.92 }, 0.7);
    show(s, s.div('cinzel gold sh', { position: 'absolute', left: '1000px', top: '560px', width: '800px', textAlign: 'center', fontSize: '60px', fontWeight: 700, letterSpacing: '.1em' }, 'WAJIB-UL-WUJOOD'), tW + 0.15, null, { opacity: 0, y: 20 }, 0.6);
    s.div('vig');
  }, { fin: 0.45 });

  // ───────── H20  THE AYAH — Al-Ikhlas 112:2 (the emotional peak: room and stillness) ─────────
  const tAyOut = T('251') - 0.15;   // the ayah leaves completely BEFORE the hall (with its red marks) dissolves back in
  def('h20_ayah', TW('249', 9) - 0.1, tAyOut + 0.7, (s, L, d) => {
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 44%, #1b1a2c 0%, #070912 52%, #010205 100%)' });
    s.div(null, { position: 'absolute', left: '50%', top: '47%', width: '1500px', height: '1100px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.26) 0%, rgba(233,185,85,.08) 40%, rgba(233,185,85,0) 66%)' });
    const ro = svg(s, `<g class="r1">${rosette(520)}</g><g class="r2">${rosette(860, '#C9A24A')}</g>`, { vb: '-960 -520 1920 1080' }), r1 = ro.querySelector('.r1'), r2 = ro.querySelector('.r2');
    s.onUpdate((lt) => { r1.setAttribute('transform', `rotate(${(lt * 1.5).toFixed(3)})`); r2.setAttribute('transform', `rotate(${(-lt * 0.9).toFixed(3)})`); r2.setAttribute('opacity', '0.5'); });
    s.tl.fromTo(ro, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' }, 0).to(ro, { scale: 1.05, duration: Math.max(1, d - 2.2), ease: 'none' }, 2.2);
    const tAr = Math.max(0.32, L('249', 10) - 0.1), tRef = Math.max(tAr + 0.8, L('249b') - 0.1);
    const r = ayah(s, { ref: REF['112:2'], ar: Q['112:2'], tr: 'Allah <span class="hl">be-niyaz</span> hai', size: 220, trSize: 70, t0: 0.02, tAr, dAr: 1.1, trTimes: [Math.max(tRef + 0.6, L('250') - 0.1)] });
    r.ar.style.color = '#F8DE9A'; r.ref.style.fontSize = '36px'; s.tl.to(r.wrap, { opacity: 0, duration: 0.25, ease: 'power1.in' }, tAyOut - s.t0);
    gsap.killTweensOf(r.ref); gsap.set(r.ref, { opacity: 0 }); s.tl.fromTo(r.ref, { opacity: 0, y: -16, letterSpacing: '0.7em' }, { opacity: 1, y: 0, letterSpacing: '0.34em', duration: 0.9, ease: 'power2.out' }, tRef);
    s.sfx('shimmer', tAr, { gain: 1 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── H21  recap: three doors shut, one open — "do ayaton ne har raasta band kar diya" ─────────
  hallScene('h21_recap', tAyOut + 0.25, T('253') - 0.1 + 0.4, (s, L, d) => ({
    slams: [-9, -9, -9, null], pl: () => [99, 99, 99, 99], warm: () => 1, boost: (lt) => 2.0 + 0.3 * Math.sin(lt * 1.4),
    keys: mono([{ t: 0, p: [0, 2.9, 17.6], l: [0, 4.0, 0] }, { t: d, p: [0, 2.9, 15.8], l: [0, 4.0, 0], e: 'lin' }]),
    html: () => {
      s.div('scrim-t', { height: '36%' });
      capx(s, 'Ab samjhe — <span class="hl">Jubayr</span> ka dil kyun <span class="hr">udne laga</span> tha?', L('251') - 0.02, L('252') - 0.12, { bottom: 70, size: 50 });
      s.sfx('heartbeat', L('251', 5), { gain: 1.1 });
      const rf = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '170px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.34em' }, 'SURAH AT-TUR · 52:35–36');
      show(s, rf, L('252') - 0.1, null, { opacity: 0, y: -16 }, 0.6);
      const h = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '232px', textAlign: 'center', fontSize: '100px', lineHeight: '1', whiteSpace: 'nowrap' }, `${K('DO')} ${K('AYATON')} ${K('NE')} ${K('HAR', 'gold')} ${K('RAASTA', 'gold')} ${K('BAND', 'gold')} ${K('KAR')} ${K('DIYA')}`);
      kwords(s, h, [0, 1, 2, 3, 4, 5, 6, 7].map((i) => L('252', i) - 0.07));
    },
  }), { fin: 0.45 });

  // ───────── H22  "The Kalam Cosmological Argument" — the word is Arabic ─────────
  def('h22_kalam', T('253') - 0.1, P1 + 0.3, (s, L, d) => {
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 42%, #1c2c26 0%, #101a17 55%, #070c0a 100%)', boxShadow: 'inset 0 0 0 16px #2a1f15, inset 0 0 0 21px #5a452e, inset 0 0 160px rgba(0,0,0,.6)' });
    const dust = cv(W, H, (x) => { const R = rng(77); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${(0.01 + R() * 0.035).toFixed(3)})`; x.fillRect(R() * W, R() * H, 20 + R() * 160, 1 + R() * 2); } }); dust.className = 'gl'; s.add(dust);
    const uni = `<svg width="92" height="78" viewBox="0 0 92 78"><g fill="#E9E4D4"><path d="M46 2 L88 24 H4 Z"/><rect x="6" y="28" width="80" height="6"/>${[14, 30, 46, 62, 78].map((x) => `<rect x="${x - 4}" y="38" width="8" height="26"/>`).join('')}<rect x="4" y="66" width="84" height="6"/><rect x="0" y="72" width="92" height="6"/></g></svg>`;
    const tT = L('254') - 0.06, tK = Math.max(tT + 1.0, L('254', 3) - 0.08), tA = Math.max(tK + 0.5, L('254', 6) - 0.1);
    const hd = s.div(null, { position: 'absolute', left: '0', right: '0', top: '108px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }, uni + `<span class="cinzel" style="font-size:40px;font-weight:700;letter-spacing:.3em;color:#E9E4D4">WEST KI UNIVERSITIES</span>`);
    show(s, hd, P(L('253', 2) - 0.1), tK + 0.2, { opacity: 0, y: -20 }, 0.5);
    const q1 = s.div('serif sh', { position: 'absolute', left: '0', right: '0', top: '400px', textAlign: 'center', fontSize: '130px', fontWeight: 600, fontStyle: 'italic', lineHeight: '1.1', color: '#EEE9DA' }, `${K('isi')} ${K('daleel')} ${K('ka')} ${K('naam', 'gold')} ${K('kya')} ${K('hai?')}`);
    kwords(s, q1, [6, 7, 8, 9, 10, 11].map((i) => L('253', i) - 0.07)); s.tl.to(q1, { opacity: 0, y: -30, duration: 0.3 }, tT - 0.3);
    const tb = s.div(null, { position: 'absolute', left: '0', right: '0', top: '330px', textAlign: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#EEE9DA', letterSpacing: '.06em' },
      `<div style="font-size:160px;line-height:1.08">${K('THE', 'o', 'font-size:.46em;vertical-align:.62em;margin-right:.35em')}${K('KALAM', 'kal')}</div><div style="font-size:100px;line-height:1.2">${K('COSMOLOGICAL', 'o')} ${K('ARGUMENT', 'o')}</div><div class="ul o" style="height:4px;width:1120px;margin:22px auto 0;background:#EEE9DA"></div><div class="by o mono" style="font-size:24px;letter-spacing:.34em;margin-top:22px;color:rgba(238,233,218,.7)">W. L. CRAIG · 1979</div>`);
    kwords(s, tb, [tT, tT + 0.04, L('254', 1) - 0.06, L('254', 2) - 0.06], { opacity: 0, y: 30 }, 0.4);
    s.tl.fromTo(tb.querySelector('.ul'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, L('254', 2)).fromTo(tb.querySelector('.by'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, L('254', 2) + 0.25);
    s.tl.to(tb.querySelectorAll('.o'), { opacity: 0.26, duration: 0.4 }, tK).to(tb.querySelector('.kal'), { color: '#F2C968', textShadow: '0 0 40px rgba(233,185,85,.6)', duration: 0.4 }, tK).to(tb, { y: -185, scale: 0.6, duration: 0.7, ease: 'power2.inOut' }, tK + 0.15);
    s.sfx('shimmer', tA, { gain: 0.9 });
    const arw = s.div('ar2 glowg', { position: 'absolute', left: '0', right: '0', top: '468px', textAlign: 'center', fontSize: '250px', lineHeight: '1.3', color: '#F8DE9A' }, AR.kalam);
    show(s, arw, tA, null, { opacity: 0, scale: 0.6, y: -110 }, 0.9);
    const tg = s.div(null, { position: 'absolute', left: '0', right: '0', top: '818px', display: 'flex', justifyContent: 'center', gap: '26px' }, `<span class="chip c1" style="font-size:32px">ARABI LAFZ</span><span class="chip c2" style="font-size:32px">MUSALMAN MUTAKALLIMEEN SE LIYA GAYA</span>`);
    s.tl.fromTo(tg.querySelector('.c1'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45 }, Math.max(tA + 0.4, L('254', 7) - 0.08)).fromTo(tg.querySelector('.c2'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45 }, Math.max(tA + 0.9, L('255') - 0.05));
    show(s, s.div('ar2', { position: 'absolute', left: '0', right: '0', top: '886px', textAlign: 'center', fontSize: '56px', lineHeight: '1.6', color: 'rgba(248,222,154,.8)' }, AR.ilm_kalam), Math.max(tA + 1.3, L('255', 1) - 0.05), null, { opacity: 0, y: 14 }, 0.5);
    s.div('vig');
  }, { fin: 0.4, fout: 0.3 });

  // ───────── persistent tracker HUD (top-left, above every scene of the part) ─────────
  def('h00_tracker', tHall1, P1 + 0.3, (s) => {
    const A = (t) => Math.max(0, t - s.t0);
    const tAct = [T('204') - 0.1, T('221') + 0.12, Math.max(tSlam2 + 0.35, T('226') - 0.05), tSlam3 + 0.45], tEnd = [tSlam1, tSlam2, tSlam3];
    const subs = ['“KUCH NAHI” SE — KHUD BA KHUD', 'KHUD KO KHUD BANAYA', 'KISI AUR NE… AUR USAY…', 'JIS KA WUJOOD US KA APNA HAI'];
    const mk = (i) => i < 3 ? `<svg width="46" height="46" viewBox="0 0 46 46"><path d="M15 15 L31 31" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M31 15 L15 31" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`
      : `<svg width="46" height="46" viewBox="0 0 46 46"><path d="M12.5 24 L20 31.5 L33.5 15.5" stroke="#241703" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
    const box = s.div('htk', null, `<style>
      .htk{position:absolute;left:96px;top:78px;width:410px;padding:15px 20px 14px 22px;border-radius:16px;background:rgba(3,6,13,.7);border:1.5px solid rgba(255,255,255,.14);box-shadow:0 12px 40px rgba(0,0,0,.45)}
      .htk .hd{font-family:'Space Mono',monospace;font-weight:700;font-size:19px;letter-spacing:.38em;color:rgba(245,241,232,.84)}
      .htk .row{display:flex;align-items:center;margin-top:12px}
      .htk .pip{position:relative;width:46px;height:46px;border-radius:50%;border:2.5px solid rgba(245,241,232,.5);background-color:rgba(255,255,255,.05);box-shadow:0 0 0px rgba(233,185,85,0);display:flex;align-items:center;justify-content:center}
      .htk .pip .n{font-family:'Bebas Neue',sans-serif;font-size:31px;line-height:1;padding-top:3px;color:#F5F1E8}
      .htk .pip svg{position:absolute;left:-2.5px;top:-2.5px}
      .htk .ln{width:22px;height:2px;background:rgba(255,255,255,.22)}
      .htk .sub{position:relative;height:24px;margin-top:11px}
      .htk .sub div{position:absolute;left:0;top:0;white-space:nowrap;font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;letter-spacing:.07em;color:#DFF3FF}
      </style><div class="hd">CHAAR RAASTE</div><div class="row">${[0, 1, 2, 3].map((i) => `${i ? '<div class="ln"></div>' : ''}<div class="pip"><span class="n">${i + 1}</span>${mk(i)}</div>`).join('')}</div><div class="sub">${subs.map((t) => `<div>${t}</div>`).join('')}</div>`);
    const tb = A(tLit[0] - 0.25); gsap.set(box, { autoAlpha: 0 }); s.tl.set(box, { autoAlpha: 1 }, tb).fromTo(box, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45 }, tb);
    const pips = [...box.querySelectorAll('.pip')], sub = [...box.querySelectorAll('.sub div')];
    pips.forEach((p, i) => {
      const n = p.querySelector('.n'), m = p.querySelectorAll('path'); gsap.set(m, { drawSVG: '0%' });
      s.tl.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.4)' }, A(tLit[i]));
      s.tl.to(p, { scale: 1.2, borderColor: i === 3 ? '#F2C968' : '#ffffff', backgroundColor: i === 3 ? 'rgba(233,185,85,.28)' : 'rgba(111,216,255,.28)', duration: 0.3 }, A(tAct[i]));
      if (i < 3) {
        s.tl.to(p, { scale: 1, borderColor: '#FF4B4B', backgroundColor: 'rgba(225,50,50,.95)', boxShadow: '0 0 18px rgba(255,75,75,.6)', duration: 0.12, ease: 'power2.in' }, A(tEnd[i])).to(n, { opacity: 0, duration: 0.1 }, A(tEnd[i])).to(m, { drawSVG: '100%', duration: 0.16, stagger: 0.08, ease: 'power2.in' }, A(tEnd[i]) + 0.04);
      } else {
        s.tl.to(p, { scale: 1.16, borderColor: '#FFF0C0', backgroundColor: '#E9B955', boxShadow: '0 0 28px rgba(233,185,85,.85)', duration: 0.3 }, A(tCheck)).to(n, { opacity: 0, duration: 0.12 }, A(tCheck)).to(m, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, A(tCheck) + 0.08);
      }
      const sb = sub[i], t0 = A(i === 0 ? tAct[0] : i === 3 ? T('245') - 0.1 : Math.max(tAct[i], tEnd[i - 1] + 0.8));
      gsap.set(sb, { autoAlpha: 0 }); if (i === 3) sb.style.color = '#F8DE9A';
      s.tl.set(sb, { autoAlpha: 1 }, t0).fromTo(sb, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.35 }, t0);
      if (i < 3) s.tl.to(sb, { color: '#FF6B6B', duration: 0.12 }, A(tEnd[i])).to(sb, { opacity: 0, duration: 0.3 }, A(tEnd[i]) + 0.45).set(sb, { autoAlpha: 0 }, A(tEnd[i]) + 0.76);
    });
  }, { z: 60, fout: 0.3 });
}
