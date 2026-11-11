// PART E — "Kabootar aur kainat ki goonj" (spoken lines 127..158).  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
// Comedy that turns into awe: globe → horn antenna → the noise that never changes → pigeons → "white dielectric material" → the noise is the universe → TV static → Nobel → "Dekh liya."
import { defScene, stage3d, T, TW, gsap, THREE, el, image, clamp, lerp, smooth, ease, noise1, rng, track } from '../engine.js';
import { cap, flash, show, counter, stamp, shake, words, chars } from '../ui.js';
import { spaceBackdrop, earth, latLon, pin, mapSphere } from '../kit3d.js';
import { Q, REF } from '../quran.js';
import { IMG } from '../assets.js';

const W = 1920, H = 1080;
const HORN = '/gfx/img/e_horn.jpg';        // navy duotone grade of IMG.hornAntenna, laid out in 1920×1510 image space
const PIGEONS = '/gfx/img/e_pigeon_in.jpg'; // cool grade + 16:9 crop of IMG.pigeon1 (four pigeons on a wall)
const CMB = '/gfx/tex/cmb_equirect.jpg';
const TVQ = [[1250, 548], [2276, 800], [2278, 1826], [1300, 1580]];   // CRT glass corners in the 3840×2880 TV photo (TL, TR, BR, BL)

// ───────────────────────── local helpers ─────────────────────────
// photo "camera": the image lives in its own pixel space; set(cx, cy, z) centres image point (cx, cy) at zoom z (always covering the frame)
function photoCam(s, src, iw, ih) {
  const wrap = s.div('fill', { overflow: 'hidden', background: '#000' });
  const pl = el('div', null, { position: 'absolute', left: '0', top: '0', width: iw + 'px', height: ih + 'px', transformOrigin: '0 0' });
  pl.appendChild(image(src, { position: 'absolute', left: '0', top: '0', width: iw + 'px', height: ih + 'px' })); wrap.appendChild(pl);
  return { wrap, pl, z: 1, tx: 0, ty: 0, mirrors: [],
    set(cx, cy, z) {
      z = Math.max(z, W / iw, H / ih); this.z = z; this.tx = clamp(W / 2 - cx * z, W - iw * z, 0); this.ty = clamp(H / 2 - cy * z, H - ih * z, 0);
      const tr = `translate(${this.tx.toFixed(2)}px, ${this.ty.toFixed(2)}px) scale(${z.toFixed(5)})`; pl.style.transform = tr; for (const m of this.mirrors) m.style.transform = tr;
    },
    scr(px, py) { return [px * this.z + this.tx, py * this.z + this.ty]; } };
}
// keyframed path: keys [t, a, b, c, 'l'?] ('l' = linear drift into this key, otherwise ease in-out); c is interpolated geometrically (zoom / radius)
function camPath(keys) {
  for (let i = 1; i < keys.length; i++) keys[i][0] = Math.max(keys[i][0], keys[i - 1][0] + 0.05);
  return (lt) => {
    if (lt <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3]];
    for (let i = 1; i < keys.length; i++) if (lt <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i]; let k = clamp((lt - a[0]) / (b[0] - a[0])); if (b[4] !== 'l') k = ease.io3(k);
      return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), a[3] * Math.pow(b[3] / a[3], k)];
    }
    const e = keys[keys.length - 1]; return [e[1], e[2], e[3]];
  };
}
const hash = (n) => { let t = (n + 0x6D2B79F5) | 0; t = Math.imul(t ^ t >>> 15, 1 | t); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
// receiver hiss on a scope: a pure function of time (same seed → the very same trace everywhere: "shor wahi")
function drawWave(ctx, w, h, t, o = {}) {
  const amp = (o.amp ?? 0.3) * h, mid = h * 0.5, pts = [];
  ctx.clearRect(0, 0, w, h); ctx.lineJoin = 'round';
  for (let x = 0; x <= w; x += 3) pts.push(x, mid + amp * (0.5 * noise1(x * 0.045 + t * 9, 3) + 0.34 * noise1(x * 0.16 + t * 31, 4) + 0.26 * noise1(x * 0.53 + t * 87, 5)));
  for (const [lw, a] of [[11, 0.07], [5, 0.2], [2.2, 1]]) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.strokeStyle = `rgba(${o.rgb || '111,216,255'},${a})`; ctx.lineWidth = lw; ctx.stroke(); }
}
function hudBg(s) {
  s.div('fill', { background: 'radial-gradient(ellipse at 50% 42%, #0b1c36 0%, #050b18 58%, #010309 100%)' });
  s.div('fill', { backgroundImage: 'linear-gradient(rgba(111,216,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(111,216,255,.05) 1px, transparent 1px)', backgroundSize: '64px 64px' });
}
function scopePanel(parent, x, y, w, h) {
  const p = el('div', null, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(5,16,30,.97), rgba(2,7,15,.98))', border: '1.5px solid rgba(111,216,255,.4)', boxShadow: '0 30px 90px rgba(0,0,0,.6), inset 0 0 90px rgba(60,160,220,.10)' });
  const gs = Math.round(h / 6);
  p.appendChild(el('div', 'fill', { backgroundImage: 'linear-gradient(rgba(111,216,255,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(111,216,255,.10) 1px, transparent 1px)', backgroundSize: `${gs}px ${gs}px`, backgroundPosition: `0 ${h / 2}px` }));
  const cv = el('canvas', null, { position: 'absolute', left: '0', top: '0' }); cv.width = w; cv.height = h; p.appendChild(cv); parent.appendChild(p);
  return { p, ctx: cv.getContext('2d'), w, h };
}
// the receiver rig: antenna porthole (with azimuth dial) → cable → big oscilloscope + level row.  Used twice (before / after the cleaning) on purpose.
function scopeRig(s) {
  hudBg(s);
  const ticks = Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12, c = Math.sin(a), d = -Math.cos(a), r0 = i % 6 === 0 ? 142 : 150; return `<line x1="${(c * r0).toFixed(1)}" y1="${(d * r0).toFixed(1)}" x2="${(c * 160).toFixed(1)}" y2="${(d * 160).toFixed(1)}" stroke="rgba(111,216,255,.7)" stroke-width="${i % 6 === 0 ? 3 : 1.5}"/>`; }).join('');
  const ph = s.div(null, { position: 'absolute', left: '120px', top: '262px', width: '330px', height: '330px' });
  ph.innerHTML = `<div class="pc" style="position:absolute;inset:30px;border-radius:50%;overflow:hidden;border:2px solid rgba(111,216,255,.75);box-shadow:0 0 50px rgba(111,216,255,.22)"></div>
    <svg width="330" height="330" viewBox="-165 -165 330 330" style="position:absolute;left:0;top:0;overflow:visible"><circle r="160" fill="none" stroke="rgba(111,216,255,.3)" stroke-width="1.5"/>${ticks}<g class="ndl"><path d="M0 -168 L12 -142 L-12 -142 Z" fill="#6FD8FF"/></g></svg>
    <div class="hud" style="position:absolute;left:-40px;right:-40px;top:352px;text-align:center;font-weight:700">HORN ANTENNA</div><div class="hud deg" style="position:absolute;left:-40px;right:-40px;top:388px;text-align:center;color:rgba(245,241,232,.7)"></div>`;
  const im = image(HORN, { position: 'absolute', width: '640px', height: '503px', left: '-196px', top: '-80px' }); ph.querySelector('.pc').appendChild(im);
  const cable = s.div(null, { position: 'absolute', left: '452px', top: '425px', width: '90px', height: '4px', background: 'repeating-linear-gradient(90deg, #6FD8FF 0 10px, rgba(111,216,255,.15) 10px 18px)' });
  const sc = scopePanel(s.el, 540, 232, 1270, 460);
  sc.p.appendChild(el('div', 'hud', { position: 'absolute', left: '26px', top: '18px', fontWeight: 700 }, 'RECEIVER OUTPUT'));
  sc.p.appendChild(el('div', 'hud', { position: 'absolute', right: '26px', top: '18px', fontWeight: 700 }, '● LIVE'));
  const row = s.div(null, { position: 'absolute', left: '540px', top: '716px', width: '1270px', height: '70px', display: 'flex', alignItems: 'center', gap: '22px' });
  row.innerHTML = `<span class="hud" style="font-weight:700">LEVEL</span><span style="display:flex;gap:5px">${Array.from({ length: 26 }, (_, i) => `<i style="display:block;width:15px;height:28px;border-radius:2px;background:${i < 16 ? '#6FD8FF' : 'rgba(111,216,255,.16)'}"></i>`).join('')}</span><span class="st bebas" style="font-size:64px;line-height:1;margin-left:14px"></span>`;
  return { ph, im, ndl: ph.querySelector('.ndl'), deg: ph.querySelector('.deg'), sc, cable, status: row.querySelector('.st'), draw: (t) => drawWave(sc.ctx, sc.w, sc.h, t) };
}
// TV snow: deterministic per frame number
function makeSnow(cw, ch) {
  const cv = el('canvas'); cv.width = cw; cv.height = ch; const ctx = cv.getContext('2d'), id = ctx.createImageData(cw, ch), dd = id.data;
  return { cv, ctx, draw(frame, gain = 1) {
    let a = Math.imul(frame + 1, 0x9E3779B1) | 0; const n = cw * ch;
    for (let i = 0; i < n; i++) { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; const r = ((t ^ t >>> 14) >>> 0) / 4294967296, v = (r * r * 218 + 20) * gain, k = i * 4; dd[k] = v; dd[k + 1] = v; dd[k + 2] = v * 1.05; dd[k + 3] = 255; }
    ctx.putImageData(id, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, ((frame * 5) % (ch + 60)) - 60, cw, 46);       // slow rolling bar
  } };
}
// css matrix3d that maps a w×h box (transform-origin 0 0) onto an arbitrary quad (TL, TR, BR, BL)
function quadCoef(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q, dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2, g = (dx3 * dy2 - dy3 * dx2) / den, h = (dx1 * dy3 - dy1 * dx3) / den;
  return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h };
}
const quadMatrix = (w, h, q) => { const m = quadCoef(q); return `matrix3d(${m.a / w},${m.d / w},0,${m.g / w}, ${m.b / h},${m.e / h},0,${m.h / h}, 0,0,1,0, ${m.c},${m.f},0,1)`; };
const quadPoint = (m, u, v) => { const k = m.g * u + m.h * v + 1; return [(m.a * u + m.b * v + m.c) / k, (m.d * u + m.e * v + m.f) / k]; };
// the old TV photo with live snow mapped onto its glass
function tvPlate(s, src, res) {
  const cam = photoCam(s, src, 3840, 2880);
  const scr = el('div', null, { position: 'absolute', left: '0', top: '0', width: '560px', height: '440px', transformOrigin: '0 0', transform: quadMatrix(560, 440, TVQ), borderRadius: '118px / 92px', overflow: 'hidden', background: '#07090c' });
  const sn = makeSnow(res[0], res[1]); Object.assign(sn.cv.style, { position: 'absolute', left: '0', top: '0', width: '560px', height: '440px', imageRendering: 'pixelated', transformOrigin: '50% 50%' });
  scr.appendChild(sn.cv); scr.appendChild(el('div', 'fill', { boxShadow: 'inset 0 0 60px 26px rgba(0,0,0,.8)', borderRadius: '118px / 92px' }));
  cam.pl.appendChild(scr);
  return { cam, scr, sn, m: quadCoef(TVQ) };
}
// tasteful bird-dropping splat (svg group content, centred on 0,0)
function splat(R, r0) {
  const n = 9, pts = [], f = (v) => v.toFixed(1);
  for (let i = 0; i < n; i++) { const a = i / n * 6.283, rr = r0 * (0.7 + 0.5 * R()); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`; }
  let h = `<path d="${d} Z" fill="#F4F2E8"/><path d="M ${f(-r0 * 0.14)} ${f(r0 * 0.55)} q ${f(r0 * 0.03)} ${f(r0 * 0.95)} ${f(r0 * 0.13)} ${f(r0 * 1.2)} q ${f(r0 * 0.12)} ${f(-r0 * 0.3)} ${f(r0 * 0.12)} ${f(-r0 * 1.2)} Z" fill="#F4F2E8"/><ellipse cx="${f((R() - 0.5) * r0 * 0.3)}" cy="${f((R() - 0.5) * r0 * 0.3)}" rx="${f(r0 * 0.3)}" ry="${f(r0 * 0.22)}" fill="#C4C8B6" opacity=".85"/>`;
  for (let k = 0; k < 5; k++) { const a = R() * 6.283, dd = r0 * (1.25 + R() * 0.9); h += `<circle cx="${f(Math.cos(a) * dd)}" cy="${f(Math.sin(a) * dd)}" r="${f(r0 * (0.06 + R() * 0.12))}" fill="#F4F2E8"/>`; }
  return h;
}
const typed = (s, node, text, t0, dur) => s.onUpdate((lt) => { const n = Math.round(clamp((lt - t0) / Math.max(0.05, dur)) * text.length); node.textContent = lt < t0 ? '' : text.slice(0, n) + (n < text.length ? '▍' : ''); });
const pop = (s, node, t, o = {}) => {
  gsap.set(node, { autoAlpha: 0 }); s.tl.set(node, { autoAlpha: 1 }, t);
  s.tl.fromTo(node, { opacity: 0, scale: o.s0 ?? 0.5, y: o.y ?? 0 }, { opacity: 1, scale: 1, y: 0, duration: o.dur ?? 0.4, ease: o.ease || 'back.out(2)' }, t);
  if (o.out != null) { s.tl.to(node, { opacity: 0, duration: 0.25, ease: 'power2.in' }, Math.max(t + 0.3, o.out - 0.25)); s.tl.set(node, { autoAlpha: 0 }, Math.max(t + 0.55, o.out)); }
  return node;
};
const ray = (n, r0, r1, col, sw) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, c = Math.cos(a), d = Math.sin(a); return `<line x1="${(c * r0).toFixed(1)}" y1="${(d * r0).toFixed(1)}" x2="${(c * r1).toFixed(1)}" y2="${(d * r1).toFixed(1)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`; }).join('');
const IC = {
  sun: `<svg width="170" height="170" viewBox="-85 -85 170 170"><circle r="31" fill="#F2C968"/>${ray(8, 47, 70, '#F2C968', 7)}</svg>`,
  moon: `<svg width="170" height="170" viewBox="-85 -85 170 170"><path d="M18 -58 A62 62 0 1 0 58 30 A50 50 0 1 1 18 -58 Z" fill="#CFE3FF"/><g fill="#CFE3FF"><circle cx="48" cy="-46" r="4.5"/><circle cx="68" cy="-12" r="3"/><circle cx="30" cy="-14" r="2.6"/></g></svg>`,
  hot: `<svg width="170" height="170" viewBox="-85 -85 170 170"><rect x="-27" y="-72" width="26" height="104" rx="13" fill="none" stroke="#F5F1E8" stroke-width="5"/><circle cx="-14" cy="44" r="25" fill="#FF9A4A" stroke="#F5F1E8" stroke-width="5"/><rect x="-20" y="-56" width="12" height="94" rx="6" fill="#FF9A4A"/><g fill="none" stroke="#FF9A4A" stroke-width="6" stroke-linecap="round"><path d="M30 -8 q12 -14 0 -28 q-12 -14 0 -28"/><path d="M56 -8 q12 -14 0 -28 q-12 -14 0 -28"/></g></svg>`,
  cold: `<svg width="170" height="170" viewBox="-85 -85 170 170"><g stroke="#6FD8FF" stroke-width="6" stroke-linecap="round" fill="none">${[0, 60, 120].map((a) => `<g transform="rotate(${a})"><line x1="0" y1="-68" x2="0" y2="68"/><path d="M-15 -52 L0 -38 L15 -52 M-15 52 L0 38 L15 52"/></g>`).join('')}</g></svg>`,
};
const BIRD = `<svg width="130" height="90" viewBox="-65 -45 130 90" style="overflow:visible"><g fill="#070C16"><ellipse cx="0" cy="6" rx="31" ry="12"/><circle cx="31" cy="-2" r="9.5"/><path d="M39 -3 L52 1 L39 4 Z"/><path d="M-27 3 L-60 -6 L-54 13 Z"/><path class="wg" d="M-14 2 Q-6 -48 28 -38 Q10 -22 13 2 Z" fill="#101A2C"/></g></svg>`;
// texture whose tracked promise resolves exactly when its image is in place → the first frame of a freshly built scene is already complete
const _tx = new Map();
function texT(url) {
  if (_tx.has(url)) return _tx.get(url);
  const tex = new THREE.Texture(), im = new Image(); im.decoding = 'sync'; im.src = url; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  track((im.decode ? im.decode() : new Promise((r) => { im.onload = r; im.onerror = r; })).then(() => { tex.image = im; tex.needsUpdate = true; }));
  _tx.set(url, tex); return tex;
}
const cmbSphere = (o) => { const m = mapSphere(CMB, o); m.material.map = texT(CMB); return m; };
const milky = (bd) => { bd.dome.material.map = texT('/gfx/tex/milkyway_4k.jpg'); return bd; };
const brightEarth = (g, gain = 1.4) => { const m = g.userData.mat; m.uniforms.dayT.value = texT('/gfx/tex/earth_day_4k.jpg'); m.uniforms.nightT.value = texT('/gfx/tex/earth_night_4k.jpg'); m.fragmentShader = m.fragmentShader.replace('gl_FragColor = vec4(col, 1.0);', `gl_FragColor = vec4(pow(col * ${gain.toFixed(2)}, vec3(0.4545)), 1.0);`); m.needsUpdate = true; return g; };
const SPARK = 'M0 -24 Q3 -3 24 0 Q3 3 0 24 Q-3 3 -24 0 Q-3 -3 0 -24 Z';

export default function ([P0, P1]) {
  // ───────── E1  1964 · America · New Jersey — the globe turns to Holmdel ─────────
  defScene('e1_globe', P0, T('130') - 0.1, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tY = L('127', null, -0.08), tA = L('128', null, -0.08), tN = L('129', null, -0.08);
    const st = stage3d(s, { bg: 0x01030a, fov: 38 });
    const bd = milky(spaceBackdrop(st, { gain: 0.3, seed: 5, count: 3500 }));
    const g = brightEarth(earth(), 1.15); st.scene.add(g);
    const p = latLon(40.39, -74.18, 1.004), v = new THREE.Vector3();
    const pn = pin(0x6fd8ff, 0.03); pn.position.copy(p); pn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize()); g.add(pn);
    const ryT = Math.atan2(-p.x, p.z);
    const call = s.div(null, { position: 'absolute', left: '0', top: '0' });
    const ci = el('div', null, null, `<svg width="420" height="200" viewBox="0 0 420 200" style="position:absolute;left:0;top:-200px;overflow:visible"><path class="ln" d="M4 196 L74 126 L400 126" fill="none" stroke="#6FD8FF" stroke-width="2.5"/></svg>
      <div class="bebas sh" style="position:absolute;left:82px;top:-158px;font-size:80px;white-space:nowrap">HOLMDEL</div>
      <div class="mono cyan sh" style="position:absolute;left:84px;top:-62px;font-size:24px;font-weight:700;white-space:nowrap">40.39° N · 74.18° W</div>`); call.appendChild(ci);
    st.frame = (lt) => {
      bd.update(lt + 10);
      g.rotation.set(0.42, ryT - (1 - ease.out3(clamp(lt / Math.max(1.2, tN + 0.3)))) * 1.7, 0);     // America swings in from the night side
      const kz = smooth(tA, d + 0.5, lt);
      st.camera.position.set(lerp(0, 0.1, kz), lerp(0.25, 0.4, kz), lerp(4.5, 2.45, kz)); st.camera.lookAt(lerp(0, -0.16, kz), lerp(0.05, 0.25, kz), 0);
      pn.userData.update(lt); pn.visible = lt > tN - 0.35;
      g.updateMatrixWorld(true); st.camera.updateMatrixWorld(true); v.copy(p).applyMatrix4(g.matrixWorld).project(st.camera);
      call.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((0.5 - v.y * 0.5) * H).toFixed(1)}px)`;
    };
    show(s, ci, tN, null, { opacity: 0 }, 0.35); s.tl.fromTo(ci.querySelector('.ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.out' }, tN);
    // dateline typed on the three words
    const dl = s.div('dl', null, '<div class="yr sh">1964</div><div class="rule"></div><div class="pl sh"></div>'), pl = dl.querySelector('.pl');
    gsap.set(dl, { autoAlpha: 0 }); s.tl.set(dl, { autoAlpha: 1 }, tY);
    s.tl.fromTo(chars(dl.querySelector('.yr')), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power4.out' }, tY);
    s.tl.fromTo(dl.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, tY + 0.15);
    const A = 'AMERICA', B = ' · NEW JERSEY';
    s.onUpdate((lt) => { const n1 = Math.round(clamp((lt - tA) / 0.35) * A.length), n2 = Math.round(clamp((lt - tN) / 0.5) * B.length); pl.textContent = A.slice(0, n1) + B.slice(0, n2) + (lt > tA && (n1 < A.length || (lt > tN && n2 < B.length)) ? '▍' : ''); });
    s.sfx('whoosh', 0, { gain: 0.6 }); s.sfx('type', tA, { dur: Math.max(0.6, tN - tA + 0.5) }); s.sfx('tick', tN + 0.1);
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── E2  the Holmdel horn · Penzias & Wilson ─────────
  defScene('e2_horn', T('130') - 0.1, T('131'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tR = L('130', 0, -0.02), tP = L('130', 4, -0.12), tWi = L('130', 7, -0.12), tH = L('130', 10, -0.2), tS = L('130', 12, -0.15);
    const cam = photoCam(s, HORN, 1920, 1510);
    const path = camPath([[0, 960, 690, 1.0], [tP - 0.4, 945, 700, 1.05, 'l'], [tP + 0.7, 590, 850, 1.8], [tH, 600, 850, 1.88, 'l'], [tH + 1.1, 1010, 650, 1.1], [d + 0.6, 1050, 630, 1.17, 'l']]);
    cam.pl.insertAdjacentHTML('beforeend', `<svg width="1920" height="1510" viewBox="0 0 1920 1510" style="position:absolute;left:0;top:0;overflow:visible">
      <path class="ol" d="M530 505 L1060 380 L1655 240 Q1820 470 1892 772 L1640 880 L1440 905 L1000 830 L545 580 Z" fill="rgba(111,216,255,.08)" stroke="#6FD8FF" stroke-width="5" stroke-linejoin="round"/>
      <rect class="rt" x="722" y="812" width="176" height="232" rx="10" fill="none" stroke="#6FD8FF" stroke-width="3"/></svg>`);
    const ol = cam.pl.querySelector('.ol'), rt = cam.pl.querySelector('.rt');
    s.onUpdate((lt) => { const c = path(lt); cam.set(c[0], c[1], c[2]); });
    s.div('scrim-t'); s.div('scrim-b'); const sl = s.div('scrim-l'); show(s, sl, 0.02, tH + 0.5, { opacity: 0 }, 0.5);
    flash(s, 0, { peak: 0.75, dur: 0.5 }); s.sfx('camera', 0);
    const chip = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '28px', fontWeight: 700, letterSpacing: '.3em' }, '1964 · HOLMDEL, NEW JERSEY');
    show(s, chip, 0.15, null, { opacity: 0, x: -20 }, 0.4);
    // the two radio astronomers
    gsap.set(rt, { autoAlpha: 0 }); s.tl.set(rt, { autoAlpha: 1 }, tP + 0.3).fromTo(rt, { opacity: 0 }, { opacity: 1, duration: 0.3 }, tP + 0.3).to(rt, { opacity: 0, duration: 0.3 }, tH + 0.2);
    const nm = s.div('lt', { bottom: '150px' }, '<div class="bar"></div><div class="role sh" style="margin:0 0 12px">Do radio astronomers</div><div class="name sh n1">ARNO PENZIAS</div><div class="name sh n2" style="margin-top:6px">ROBERT WILSON</div>');
    gsap.set(nm, { autoAlpha: 0 }); s.tl.set(nm, { autoAlpha: 1 }, tR);
    s.tl.fromTo(nm.querySelector('.bar'), { scaleY: 0 }, { scaleY: 1, duration: 0.4 }, tR).fromTo(nm.querySelector('.role'), { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45 }, tR + 0.05);
    s.tl.fromTo(chars(nm.querySelector('.n1')), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.02 }, tP);
    s.tl.fromTo(chars(nm.querySelector('.n2')), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.02 }, tWi);
    s.tl.to(nm, { opacity: 0, x: -40, duration: 0.32, ease: 'power2.in' }, tH).set(nm, { autoAlpha: 0 }, tH + 0.32);
    s.sfx('whoosh', tP - 0.1, { gain: 0.5 }); s.sfx('pop', tP + 0.1); s.sfx('pop', tWi + 0.1);
    // the horn itself
    gsap.set(ol, { autoAlpha: 0 }); s.tl.set(ol, { autoAlpha: 1 }, tS).fromTo(ol, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.0, ease: 'power2.inOut' }, tS);
    const hl = s.div(null, { position: 'absolute', left: '110px', bottom: '128px' }, '<div class="bebas sh" style="font-size:130px">HORN ANTENNA</div><div class="play sh" style="font-size:54px;font-style:italic;font-weight:700;color:var(--gold2);margin-top:2px">“seeng jaisa” — ek bada antenna</div>');
    show(s, hl, tS + 0.05, null, { opacity: 0, y: 30 }, 0.55);
    s.sfx('whoosh', tH, { gain: 0.6 }); s.sfx('shimmer', tS, { gain: 0.6 });
    s.div('vig');
  });

  // ───────── E3  "ek ajeeb shor" — and it is the same in every direction ─────────
  defScene('e3_shor', T('131'), T('134') - 0.05, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const t3 = L('133', null, -0.05), tSw = L('133', 6), tW = L('133', 7, -0.1);
    const rig = scopeRig(s);
    s.tl.fromTo(rig.sc.p, { scaleY: 0.02, opacity: 0.4 }, { scaleY: 1, opacity: 1, duration: 0.28, ease: 'power3.out' }, 0);
    const sh = el('div', 'mono cyan', { position: 'absolute', left: '28px', bottom: '18px', fontSize: '36px', fontWeight: 700, letterSpacing: '.12em' }); rig.sc.p.appendChild(sh);
    typed(s, sh, 'shhhhhhhhhhhhhhhhhhhh…', L('131', 4, -0.1), 1.3);
    s.onUpdate((lt) => {
      rig.draw(lt + s.t0);
      const a = 360 * ease.io3(clamp((lt - t3) / Math.max(0.8, tSw - t3)));
      rig.ndl.setAttribute('transform', `rotate(${a.toFixed(1)})`); rig.im.style.transform = `scaleX(${Math.cos(a * Math.PI / 180).toFixed(3)})`;
      rig.deg.textContent = lt < t3 ? '' : 'RUKH ' + String(Math.round(a) % 360).padStart(3, '0') + '°';
    });
    cap(s, 'Antenna mein ek <span class="hl">ajeeb shor</span> hai', 0.08, Math.max(1, t3 - 0.05), { bottom: 150 });
    cap(s, 'Jis taraf bhi ghumao — <span class="hl">shor wahi</span>', t3 + 0.05, d - 0.02, { bottom: 150 });
    rig.status.innerHTML = '<span style="color:var(--green)">WAHI ✓</span>'; pop(s, rig.status, tW, { s0: 1.8, dur: 0.3, ease: 'power3.out' });
    s.sfx('static', 0.02, { dur: Math.min(3.2, d - 0.1), gain: 0.8 }); s.sfx('whoosh', t3, { gain: 0.4 }); s.sfx('ding', tW + 0.05);
    s.div('vig');
  });

  // ───────── E3b  Din · Raat · Garmi · Sardi — wahi ─────────
  defScene('e3_tiles', T('134') - 0.05, T('137'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off);
    hudBg(s);
    const hd = s.div('hud sh', { position: 'absolute', left: '110px', top: '112px', fontSize: '26px', fontWeight: 700 }, 'RECEIVER OUTPUT · HORN ANTENNA');
    show(s, hd, 0.02, null, { opacity: 0 }, 0.3);
    const tiles = [['DIN', IC.sun, L('134', null, -0.03), L('134', 3, -0.08)], ['RAAT', IC.moon, L('135', null, -0.08), L('135', 3, -0.08)], ['GARMI', IC.hot, L('136', null, -0.08), L('136', 3, -0.08)], ['SARDI', IC.cold, L('136', 1, -0.08), L('136', 3, 0.06)]];
    const ctxs = tiles.map(([k, ic, t, tw], i) => {
      const p = s.div('panel', { left: (110 + i * 435) + 'px', top: '200px', width: '395px', height: '640px', textAlign: 'center' });
      p.innerHTML = `<div style="position:absolute;left:0;right:0;top:34px;height:180px;display:flex;align-items:center;justify-content:center">${ic}</div>
        <div class="bebas" style="position:absolute;left:0;right:0;top:226px;font-size:124px">${k}</div>
        <div class="sc" style="position:absolute;left:28px;top:372px;width:339px;height:124px;border-radius:10px;overflow:hidden;background:rgba(2,8,16,.9);border:1.5px solid rgba(111,216,255,.35)"><canvas width="339" height="124"></canvas></div>
        <div class="wh bebas" style="position:absolute;left:0;right:0;top:522px;font-size:84px;color:var(--green)">WAHI ✓</div>`;
      pop(s, p, t, { s0: 0.8, y: 60, dur: 0.45, ease: 'back.out(1.5)' }); s.sfx('pop', t + 0.05);
      const wh = p.querySelector('.wh'); pop(s, wh, tw, { s0: 2, dur: 0.26, ease: 'power3.out' }); if (i !== 3) s.sfx('ding', tw + 0.05, { gain: 0.8 });
      s.tl.to(p, { boxShadow: '0 30px 90px rgba(0,0,0,.6), 0 0 0 2.5px rgba(87,227,154,.8), 0 0 60px rgba(87,227,154,.22)', duration: 0.3 }, tw);
      return p.querySelector('canvas').getContext('2d');
    });
    s.onUpdate((lt) => { for (const c of ctxs) drawWave(c, 339, 124, lt + s.t0, { amp: 0.34 }); });
    s.div('vig');
  });

  // ───────── E4  "antenna kharab hai?" → look inside → pigeons, a nest… and the rest ─────────
  defScene('e4_kabootar', T('137'), T('142'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tK = L('138', null, -0.08), tIn = L('139', null, -0.12), tF = L('139', 6, -0.1), tNest = L('139', 8, -0.12), tAur = L('140', null, -0.05), tB = L('141', 2, -0.08), pd = clamp((tF - tIn) * 0.5, 0.4, 0.9);
    const cam = photoCam(s, HORN, 1920, 1510);
    const path = camPath([[0, 990, 700, 1.1], [tIn, 1000, 690, 1.16, 'l'], [tIn + pd, 1500, 600, 6.5]]);
    const blk = s.div('fill', { background: '#020409', opacity: '0' });
    // inside the horn: only what the torch touches is visible
    const amb = s.div('fill', { opacity: '0' }); amb.appendChild(image(PIGEONS, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' }));
    const inn = s.div('fill', { visibility: 'hidden' }); inn.appendChild(image(PIGEONS, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' }));
    const R = rng(141), spots = [[960, 735, 58], [620, 790, 46], [1320, 780, 50], [300, 950, 40], [1600, 940, 42], [820, 965, 36], [1130, 975, 38], [470, 650, 28], [1470, 660, 30], [540, 900, 26], [1390, 905, 28], [760, 600, 22], [1120, 620, 24], [1730, 760, 30], [215, 760, 30]];
    inn.insertAdjacentHTML('beforeend', `<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0">${spots.map(([x, y, r]) => `<g transform="translate(${x} ${y})"><g class="sp">${splat(R, r)}</g></g>`).join('')}
      <g class="nest" transform="translate(600 640)" fill="none" stroke="#F8DE9A" stroke-width="5" stroke-linecap="round"><path d="M-150 0 Q0 120 150 0"/><path d="M-160 -6 Q-60 34 30 8 Q110 -16 162 -4"/><path d="M-138 16 Q-30 64 122 22"/><path d="M-112 40 Q0 98 104 48"/><path d="M-150 -2 L-178 -26 M150 -2 L182 -22 M-60 30 L-96 60 M70 34 L104 66 M-20 74 L-10 100"/><ellipse cx="-34" cy="-14" rx="26" ry="19" fill="#F4F2E8" stroke="none"/><ellipse cx="26" cy="-18" rx="26" ry="19" fill="#F4F2E8" stroke="none"/></g></svg>`);
    const lp = camPath([[tIn + pd * 0.85, 150, 800, 170], [tF - 0.15, 235, 540, 185], [tF + 0.08, 315, 300, 225], [tNest - 0.15, 330, 310, 235, 'l'], [tNest + 0.5, 960, 430, 1050], [tAur, 960, 440, 1100, 'l'], [tAur + 0.55, 960, 730, 250], [tB + 0.12, 960, 735, 262, 'l'], [tB + 1.0, 960, 560, 1500]]);
    s.onUpdate((lt) => {
      const c = path(lt); cam.set(c[0], c[1], c[2]);
      blk.style.opacity = smooth(tIn + pd * 0.3, tIn + pd * 0.9, lt).toFixed(3);
      const on = lt > tIn + pd * 0.85; inn.style.visibility = on ? 'visible' : 'hidden'; amb.style.opacity = on ? '0.07' : '0';
      if (on) { const q = lp(lt), x = q[0] + 14 * noise1(lt * 1.3, 5), y = q[1] + 10 * noise1(lt * 1.1, 6); const m = `radial-gradient(circle ${q[2].toFixed(0)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, #000 0%, #000 60%, rgba(0,0,0,.4) 82%, rgba(0,0,0,0) 100%)`; inn.style.webkitMaskImage = m; inn.style.maskImage = m; }
    });
    // the thought
    const dots = [[736, 642, 10], [702, 578, 16], [652, 500, 24]].map(([x, y, r], i) => pop(s, s.div(null, { position: 'absolute', left: (x - r) + 'px', top: (y - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', borderRadius: '50%', background: 'rgba(8,14,28,.9)', border: '2px solid rgba(245,241,232,.75)' }), 0.02 + i * 0.05, { dur: 0.25, out: tIn + 0.1 }));
    const bub = s.div(null, { position: 'absolute', left: '150px', top: '210px', width: '800px', height: '250px', borderRadius: '125px', background: 'rgba(8,14,28,.9)', border: '2px solid rgba(245,241,232,.75)', boxShadow: '0 30px 80px rgba(0,0,0,.6)', textAlign: 'center' },
      '<div class="hud" style="margin-top:38px;font-weight:700">UNHONE SOCHA:</div><div class="bebas th" style="font-size:104px;margin-top:10px;line-height:1">ANTENNA <span class="glowr" style="color:var(--red)">KHARAB</span> HAI?</div>');
    pop(s, bub, 0.1, { s0: 0.7, dur: 0.3, out: tIn + 0.1 }); s.tl.fromTo(words(bub.querySelector('.th')), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.14 }, tK);
    shake(s, bub, tK + 0.2, 0.4, 8); s.sfx('pop', 0.1); s.sfx('buzz', tK + 0.2, { gain: 0.7 });
    // the discovery
    const sb = s.div('scrim-b'); show(s, sb, tF, null, { opacity: 0 }, 0.4);
    const kb = s.div(null, { position: 'absolute', left: '110px', bottom: '110px' }, '<div class="hud sh" style="font-weight:700">ANDAR JHAANK KAR DEKHA —</div><div class="bebas sh" style="font-size:170px;line-height:.95">KABOOTAR!</div>');
    pop(s, kb, tF + 0.05, { s0: 1.5, dur: 0.3, ease: 'power3.out', out: tAur });
    const nest = inn.querySelector('.nest'); gsap.set(nest, { autoAlpha: 0 }); s.tl.set(nest, { autoAlpha: 1 }, tNest + 0.15);
    s.tl.fromTo(nest.querySelectorAll('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, stagger: 0.08, ease: 'power2.out' }, tNest + 0.15).fromTo(nest.querySelectorAll('ellipse'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tNest + 0.6);
    const gh = s.div(null, { position: 'absolute', left: '1240px', bottom: '118px' }, '<div class="bebas sh" style="font-size:120px;color:var(--gold2);line-height:.95">GHONSLA</div><div class="mont sh" style="font-size:34px;font-weight:700">…bana rakha tha</div>');
    pop(s, gh, tNest + 0.1, { s0: 0.7, out: tAur });
    // …aur beet
    inn.querySelectorAll('.sp').forEach((g, i) => { const t = tB + (i === 0 ? 0 : 0.22 + i * 0.075); gsap.set(g, { autoAlpha: 0 }); s.tl.set(g, { autoAlpha: 1 }, t).fromTo(g, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2.4)', transformOrigin: '50% 50%' }, t); if (i < 4) s.sfx('pop', t, { gain: 1 - i * 0.15 }); });
    cap(s, 'Aur antenna… un ki <span class="hl">beet</span> se <span class="hl">bhara pada</span> tha', tAur + 0.05, d - 0.02, { bottom: 84 });
    s.sfx('whoosh', tIn, { gain: 0.7 }); s.sfx('tick', tF); s.sfx('hit', tF + 0.08, { gain: 0.6 });
    s.div('vig');
  });

  // ───────── E5  the polite, scientific name ─────────
  defScene('e5_report', T('142'), TW('144', 1) - 0.15, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tO = L('142', 5, -0.1), tV = L('143', null, -0.08), tS = L('143', 3, -0.1), tYa = Math.min(tS + 0.6, d - 0.6);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 40%, #1c2436 0%, #0a0e18 60%, #04060c 100%)' });
    const card = s.div(null, { position: 'absolute', left: '330px', top: '92px', width: '1260px', height: '800px', background: 'linear-gradient(160deg, #F4EEDD 0%, #E7DDC4 100%)', borderRadius: '6px', boxShadow: '0 50px 140px rgba(0,0,0,.75)', color: '#1B1A22', fontFamily: "'Space Mono', monospace", padding: '52px 70px', transformOrigin: '50% 64%' });
    const row = (k, c) => `<div style="font-size:34px;line-height:2.05;white-space:pre"><span>${k}</span><span class="${c}" style="font-weight:700"></span></div>`;
    card.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;font-size:30px;letter-spacing:.3em"><span>ANTENNA REPORT</span><span>HOLMDEL · 1964</span></div><div style="height:3px;background:#1B1A22;margin:16px 0 26px"></div>
      ${row('MASLA ........ ', 'v1')}${row('ANDAR MILA ... ', 'v2')}${row('OBSERVATION .. ', 'v3')}
      <div style="font-size:66px;font-weight:700;margin-top:20px;white-space:pre;height:104px;border-bottom:4px solid #1B1A22"><span class="v4"></span></div>
      <div class="stp" style="position:absolute;right:64px;top:150px;font-family:'Anton',sans-serif;font-size:50px;letter-spacing:.08em;color:#1F4E8C;border:6px solid #1F4E8C;border-radius:10px;padding:2px 22px 0;line-height:1.3">OFFICIAL</div>
      <svg width="200" height="170" viewBox="0 0 200 170" style="position:absolute;left:92px;top:520px;overflow:visible"><path class="ar1" d="M30 8 C0 70, 30 126, 128 132" fill="none" stroke="#2743B8" stroke-width="6" stroke-linecap="round"/><path class="ar2" d="M100 108 L130 132 L98 152" fill="none" stroke="#2743B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="n1 play" style="position:absolute;left:250px;top:592px;font-size:88px;font-style:italic;font-weight:700;color:#2743B8;line-height:1">= safed maada</div>
      <div class="n2 play" style="position:absolute;left:262px;top:700px;font-size:50px;font-style:italic;font-weight:700;color:#1B1A22">(yaani… kabootar ki beet)</div>
      <svg class="n3" width="110" height="110" viewBox="-55 -55 110 110" style="position:absolute;left:1010px;top:656px;overflow:visible"><g style="filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))">${splat(rng(7), 30)}</g></svg>`;
    typed(s, card.querySelector('.v1'), 'AJEEB SHOR', 0.4, 0.45); typed(s, card.querySelector('.v2'), 'KABOOTAR + GHONSLA', Math.min(1.1, tO - 0.9), 0.7);
    typed(s, card.querySelector('.v3'), '(science-wala naam)', tO, 0.7); typed(s, card.querySelector('.v4'), 'WHITE DIELECTRIC MATERIAL', tV, Math.max(0.5, tS - tV - 0.2));
    s.onUpdate((lt) => { const sc = 1 + 0.03 * lt / d + 0.08 * smooth(tV - 0.25, tV + 0.4, lt), y = (1 - ease.out3(clamp(lt / 0.6))) * 900; card.style.transform = `translateY(${y.toFixed(1)}px) rotate(-1.2deg) scale(${sc.toFixed(4)})`; });
    const stp = card.querySelector('.stp'); gsap.set(stp, { autoAlpha: 0, rotate: 7 }); s.tl.set(stp, { autoAlpha: 1 }, tS - 0.3).fromTo(stp, { scale: 2.8, opacity: 0 }, { scale: 1, opacity: 0.85, duration: 0.2, ease: 'power4.in' }, tS - 0.3);
    s.tl.fromTo(card.querySelector('.ar1'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, tS).fromTo(card.querySelector('.ar2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14 }, tS + 0.28);
    pop(s, card.querySelector('.n1'), tS + 0.08, { s0: 0.8, dur: 0.35 }); pop(s, card.querySelector('.n2'), tYa, { s0: 0.8, dur: 0.3 }); pop(s, card.querySelector('.n3'), tYa + 0.12, { s0: 0, dur: 0.3, ease: 'back.out(3)' });
    cap(s, 'Penzias ne <span class="hl">badi sharafat se</span>…', 0.1, Math.max(0.8, tO - 0.05), { bottom: 64, size: 50 });
    cap(s, '…isay ek <span class="hc">science-wala naam</span> diya:', tO, Math.max(tO + 0.6, tV - 0.05), { bottom: 64, size: 50 });
    s.sfx('paper', 0); s.sfx('type', 0.4, { dur: 0.5 }); s.sfx('type', tO, { dur: 0.7 }); s.sfx('type', tV, { dur: Math.max(0.5, tS - tV - 0.2) }); s.sfx('thud', tS - 0.1); s.sfx('pop', tYa + 0.12);
    s.div('vig');
  });

  // ───────── E6  two PhDs clean the antenna by hand · the pigeons are removed ─────────
  defScene('e6_clean', TW('144', 1) - 0.15, T('146'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tHd = L('144', 4, -0.1), tC = L('144', 9, -0.2), tKb = L('145', null, -0.1), tHt = L('145', 1, -0.05);
    const cam = photoCam(s, HORN, 1920, 1510);
    const path = camPath([[0, 900, 730, 1.42], [tC, 960, 700, 1.3, 'l'], [tKb + 0.3, 1010, 640, 1.08], [d + 0.4, 1020, 630, 1.12, 'l']]);
    // dirty overlay (splats in image space) that the squeegee wipes away
    const dirt = s.div('fill', { overflow: 'hidden' }), pl2 = el('div', null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1510px', transformOrigin: '0 0' }); dirt.appendChild(pl2); cam.mirrors.push(pl2);
    const R = rng(144); pl2.innerHTML = `<svg width="1920" height="1510" viewBox="0 0 1920 1510" style="position:absolute;left:0;top:0">${[[1500, 520, 60], [1690, 640, 50], [1560, 770, 44], [1250, 560, 40], [900, 560, 34], [700, 600, 28], [1110, 470, 28], [1750, 420, 34], [1400, 660, 32], [640, 520, 22], [1010, 700, 26], [330, 520, 30]].map(([x, y, r]) => `<g transform="translate(${x} ${y})">${splat(R, r)}</g>`).join('')}</svg>`;
    dirt.appendChild(el('div', 'fill', { background: 'rgba(58,46,22,.28)' }));
    const stars = el('div', null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1510px', transformOrigin: '0 0' }); cam.wrap.appendChild(stars); cam.mirrors.push(stars);
    const SP = [[1560, 430, 1.3], [1750, 650, 1], [1290, 520, 0.9], [960, 560, 0.8], [700, 560, 0.7], [1480, 790, 1], [330, 470, 0.8]];
    stars.innerHTML = `<svg width="1920" height="1510" viewBox="0 0 1920 1510" style="position:absolute;left:0;top:0;overflow:visible">${SP.map(([x, y]) => `<g transform="translate(${x} ${y})"><path class="sk" d="${SPARK}" fill="#fff"/></g>`).join('')}</svg>`;
    const sks = [...stars.querySelectorAll('.sk')];
    const bar = s.div(null, { position: 'absolute', left: '0', top: '-60px', width: '14px', height: '1200px', background: 'linear-gradient(90deg, rgba(111,216,255,0), #fff 45%, #B9ECFF 55%, rgba(111,216,255,0))', boxShadow: '0 0 40px 10px rgba(185,236,255,.55)', transformOrigin: '50% 0', opacity: '0' });
    // PhD × 2
    const tags = [[-200, -150], [36, -210]].map(([ox, oy], i) => { const w = s.div(null, { position: 'absolute', left: '0', top: '0' }), c = el('div', 'chip', { fontSize: '40px', letterSpacing: '.08em', padding: '8px 26px', background: 'rgba(20,14,2,.82)', whiteSpace: 'nowrap', textTransform: 'none' }, 'PhD'); w.appendChild(c); pop(s, c, 0.06 + i * 0.16, { out: tC + 0.3 }); s.sfx('pop', 0.06 + i * 0.16); return [w, ox, oy]; });
    // birds leaving
    const RB = rng(145), birds = Array.from({ length: 6 }, (_, i) => { const w = s.div(null, { position: 'absolute', left: '0', top: '0', visibility: 'hidden' }, BIRD); return { w, wg: w.querySelector('.wg'), t0: tKb + 0.05 + i * 0.09, dir: i % 3 === 2 ? -1 : 1, vx: 520 + RB() * 380, vy: 330 + RB() * 260, ox: (RB() - 0.5) * 260, oy: (RB() - 0.5) * 160, sc: 0.8 + RB() * 0.7, ph: RB() * 6 }; });
    s.onUpdate((lt) => {
      const c = path(lt); cam.set(c[0], c[1], c[2]);
      const X = lerp(-220, 2320, ease.io3(clamp((lt - tC) / 0.95)));
      dirt.style.clipPath = `polygon(${X.toFixed(1)}px 0px, 1920px 0px, 1920px 1080px, ${(X - 130).toFixed(1)}px 1080px)`; dirt.style.visibility = X > 2060 ? 'hidden' : 'visible';
      bar.style.opacity = lt > tC && lt < tC + 0.95 ? '1' : '0'; bar.style.transform = `translate(${(X - 7 + 7.2).toFixed(1)}px, 0px) rotate(6.86deg)`;
      sks.forEach((k, i) => { const sx = cam.scr(SP[i][0], SP[i][1])[0], on = X > sx + 60 ? 1 : 0, tw = 0.55 + 0.45 * Math.sin(lt * 7 + i * 1.9); k.setAttribute('transform', `scale(${(on * SP[i][2] * tw).toFixed(3)}) rotate(${(lt * 40 + i * 30).toFixed(1)})`); });
      const m = cam.scr(806, 850); for (const [w, ox, oy] of tags) w.style.transform = `translate(${(m[0] + ox).toFixed(1)}px, ${(m[1] + oy).toFixed(1)}px)`;
      const h = cam.scr(1540, 560);
      for (const b of birds) { const a = lt - b.t0; if (a < 0 || a > 2.6) { b.w.style.visibility = 'hidden'; continue; } b.w.style.visibility = 'visible';
        const x = h[0] + b.ox + b.dir * b.vx * a, y = h[1] + b.oy - b.vy * a - 60 * a * a + 16 * Math.sin(a * 9 + b.ph);
        b.w.style.transform = `translate(${(x - 65).toFixed(1)}px, ${(y - 45).toFixed(1)}px) scale(${(b.dir * b.sc).toFixed(2)}, ${b.sc.toFixed(2)}) rotate(-16deg)`;
        b.wg.setAttribute('transform', `translate(0 2) scale(1 ${Math.sin(a * 30 + b.ph).toFixed(3)}) translate(0 -2)`); }
    });
    s.div('scrim-b'); s.div('scrim-t');
    cap(s, 'apne <span class="hl">haathon se</span> — woh antenna <span class="hc">saaf</span> kiya', tHd, Math.max(tHd + 0.8, tKb - 0.05), { bottom: 110 });
    // checklist
    const mk = (txt) => `<div style="display:flex;align-items:center;gap:20px;margin-bottom:16px"><svg width="44" height="44" viewBox="0 0 44 44"><rect x="3" y="3" width="38" height="38" rx="6" fill="rgba(2,8,16,.6)" stroke="#6FD8FF" stroke-width="3"/><path class="ck" d="M10 23 L19 32 L35 12" fill="none" stroke="#57E39A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mono sh" style="font-size:32px;font-weight:700;letter-spacing:.14em">${txt}</span></div>`;
    const r1 = s.div(null, { position: 'absolute', left: '110px', top: '96px' }, mk('ANTENNA SAAF')), r2 = s.div(null, { position: 'absolute', left: '110px', top: '160px' }, mk('KABOOTAR HATA DIYE'));
    show(s, r1, tC - 0.1, null, { opacity: 0, x: -20 }, 0.3); show(s, r2, tKb, null, { opacity: 0, x: -20 }, 0.3);
    s.tl.fromTo(r1.querySelector('.ck'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25 }, tC + 0.9).fromTo(r2.querySelector('.ck'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25 }, tHt + 0.4);
    // the last one out
    const pc = s.div('photo', { left: '1330px', top: '560px', width: '440px', height: '330px', border: '8px solid #F4EEDD' }); pc.appendChild(image('/gfx/img/e_pigeon_fly.jpg', { objectPosition: '50% 50%' }));
    gsap.set(pc, { autoAlpha: 0, rotate: 5 }); s.tl.set(pc, { autoAlpha: 1 }, tKb).fromTo(pc, { opacity: 0, scale: 0.6, x: 0, y: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, tKb)
      .to(pc, { x: 760, y: -980, rotate: 34, duration: 0.6, ease: 'power2.in' }, Math.max(tKb + 0.5, tHt + 0.25));
    s.sfx('whoosh', tC, { gain: 0.8 }); s.sfx('shimmer', tC + 0.6, { gain: 0.7 }); s.sfx('ding', tC + 0.95); s.sfx('flutter', tKb + 0.05); s.sfx('flutter', Math.max(tKb + 0.5, tHt + 0.25), { gain: 0.8 }); s.sfx('ding', tHt + 0.45);
    s.div('vig');
  });

  // ───────── E7  hard cut back to the scope: "Shor… wahin ka wahin." ─────────
  defScene('e7_wahin', T('146'), T('148'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tW = L('147', null, -0.06);
    const rig = scopeRig(s); s.onUpdate((lt) => rig.draw(lt + s.t0));
    const ck = (txt, ok) => `<div style="display:flex;align-items:center;gap:18px;margin-bottom:10px"><span class="mono" style="font-size:30px;font-weight:700;color:${ok ? 'var(--green)' : 'var(--white)'};width:34px">${ok ? '✓' : '?'}</span><span class="mono sh" style="font-size:28px;font-weight:700;letter-spacing:.14em;color:${ok ? 'rgba(245,241,232,.6)' : 'var(--white)'}">${txt}</span></div>`;
    s.div(null, { position: 'absolute', left: '110px', top: '92px' }, ck('ANTENNA SAAF', 1) + ck('KABOOTAR HATA DIYE', 1));
    const q = s.div('bebas sh', { position: 'absolute', left: '790px', top: '88px', fontSize: '124px', lineHeight: '1' }, 'SHOR…'); pop(s, q, 0.04, { s0: 1.3, dur: 0.3, ease: 'power3.out' });
    stamp(s, 'WAHIN KA WAHIN', tW, { x: 720, y: 520, size: 124, rot: -5, style: { background: 'rgba(16,0,0,.55)' } });
    shake(s, rig.sc.p, tW + 0.22, 0.45, 12); s.sfx('static', 0, { dur: Math.min(2, d) }); s.sfx('buzz', tW + 0.22);
    rig.status.innerHTML = '<span style="color:var(--red)">WAHI ✗</span>'; pop(s, rig.status, tW + 0.3, { s0: 1.6, dur: 0.25, ease: 'power3.out' });
    s.div('vig');
  });

  // ───────── E8  the turn: not the antenna's noise — the universe's ─────────
  defScene('e8_kainat', T('148'), T('150') + 0.4, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tNh = L('148', 5, -0.1), tT = L('149', null, -0.3), tHit = L('149', 2, -0.06), tSl = tHit + 0.22;
    const st = stage3d(s, { bg: 0x01030a, fov: 52 });
    const bd = milky(spaceBackdrop(st, { gain: 0.42, seed: 23 }));
    const cmb = cmbSphere({ inside: true, radius: 600, opacity: 0 }); cmb.material.depthWrite = false; cmb.renderOrder = 5; st.scene.add(cmb);
    const sil = s.div('fill'), kT = (lt) => ease.io3(clamp((lt - tT - 0.1) / Math.max(0.7, tSl - tT + 0.3)));
    st.frame = (lt) => {
      bd.update(lt + 30); const k = kT(lt);
      st.camera.position.set(0, 0, 0); st.camera.rotation.set(lerp(0.1, 0.66, k), 0.3 * k + lt * 0.012, 0, 'YXZ'); st.camera.fov = lerp(52, 76, k); st.camera.updateProjectionMatrix();
      cmb.material.opacity = 0.95 * smooth(tT + 0.2, tSl + 0.5, lt); cmb.rotation.y = 1.2 + lt * 0.025;
      sil.style.transform = `translate(${(-140 * k).toFixed(1)}px, ${(780 * k).toFixed(1)}px) scale(${(1 - 0.2 * k).toFixed(3)})`;
    };
    // the horn under the night sky, with the hiss raining in from everywhere
    const cv = el('canvas', null, { position: 'absolute', left: '0', top: '0' }); cv.width = W; cv.height = H; sil.appendChild(cv); const ctx = cv.getContext('2d');
    sil.appendChild(el('div', null, { position: 'absolute', left: '-200px', right: '-200px', bottom: '-300px', height: '396px', background: 'linear-gradient(180deg, #03060d 0%, #010204 100%)', borderTop: '2px solid rgba(111,216,255,.35)' }));
    sil.insertAdjacentHTML('beforeend', `<svg width="900" height="520" viewBox="0 0 900 520" style="position:absolute;left:150px;top:466px;overflow:visible"><g fill="#03060d" stroke="rgba(111,216,255,.6)" stroke-width="2.5" stroke-linejoin="round">
      <path d="M100 330 L230 470 M250 330 L300 470 M480 470 L590 215 L700 470 M150 330 L150 470" fill="none" stroke-width="5"/><circle cx="590" cy="215" r="188" fill="none" stroke-width="7"/>
      <path d="M250 205 L560 150 L800 62 Q872 190 890 318 L770 368 L640 372 L420 300 L250 255 Z"/><rect x="62" y="150" width="190" height="180"/><rect x="180" y="470" width="560" height="28"/></g></svg>`);
    const RR = rng(148), drops = Array.from({ length: 70 }, () => [RR() * 2300 - 200, -RR() * 500 - 40, RR(), 0.35 + RR() * 0.4]);
    s.onUpdate((lt) => { ctx.clearRect(0, 0, W, H); if (lt > tSl) return; ctx.lineCap = 'round';
      for (const [ox, oy, ph, sp] of drops) { const f = (lt * sp + ph) % 1, x = lerp(ox, 1010, f), y = lerp(oy, 650, f), x2 = lerp(ox, 1010, f - 0.035), y2 = lerp(oy, 650, f - 0.035);
        ctx.strokeStyle = `rgba(111,216,255,${(0.75 * Math.sin(f * Math.PI)).toFixed(3)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke(); } });
    const tx = s.div(null, { position: 'absolute', left: '1120px', top: '250px' }, '<div class="hud sh a" style="font-size:30px;font-weight:700">WOH SHOR…</div><div class="bebas sh b" style="font-size:170px;line-height:.95;margin-top:10px">ANTENNA KA</div><div class="bebas sh c" style="font-size:170px;line-height:.95"><span class="glowr" style="color:var(--red)">NAHI</span> THA</div>');
    pop(s, tx.querySelector('.a'), L('148', 1, -0.08), { s0: 1, y: 14, dur: 0.3, ease: 'power2.out' }); pop(s, tx.querySelector('.b'), L('148', 3, -0.08), { s0: 1, y: 30, dur: 0.35, ease: 'power3.out' }); pop(s, tx.querySelector('.c'), tNh, { s0: 1.7, dur: 0.24, ease: 'power3.in' });
    s.tl.to(tx, { opacity: 0, y: 60, duration: 0.25, ease: 'power2.in' }, Math.max(tT + 0.15, tNh + 0.6)); s.sfx('hit', tNh + 0.22, { gain: 0.7 });
    // KAINAT
    const scr = s.div(null, { position: 'absolute', left: '50%', top: '50%', width: '1900px', height: '900px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 50%, rgba(2,4,12,.82) 0%, rgba(2,4,12,.55) 42%, rgba(2,4,12,0) 70%)' }); show(s, scr, tT + 0.2, null, { opacity: 0 }, 0.8);
    const hd = s.div(null, { position: 'absolute', left: '0', right: '0', top: '300px', textAlign: 'center' }, '<div class="anton sh h1" style="font-size:124px;letter-spacing:.05em">WOH SHOR</div><div class="anton sh h2" style="font-size:270px;line-height:1.08"><span style="color:var(--gold2)">KAINAT</span> KA THA</div>');
    pop(s, hd.querySelector('.h1'), L('149', null, -0.05), { s0: 1, y: 30, dur: 0.4, ease: 'power3.out' }); pop(s, hd.querySelector('.h2'), tHit, { s0: 2.4, dur: 0.22, ease: 'power4.in' });
    s.tl.to(hd, { scale: 1.05, duration: Math.max(0.5, d - tSl), ease: 'none' }, tSl);
    flash(s, tSl, { peak: 0.9, dur: 0.9 }); shake(s, hd, tSl, 0.6, 18);
    s.sfx('riser', Math.max(0, tT - 0.5), { dur: Math.max(0.6, tSl - tT + 0.5) }); s.sfx('impact', tSl, { gain: 1.2 }); s.sfx('subdrop', tSl);
    s.div('vig');
  }, { z: 1 });

  // ───────── E9a  the oldest light: the all-sky map ─────────
  defScene('e9_map', T('150'), TW('150', 10) - 0.1, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 40%, #0b1730 0%, #04070f 60%, #000 100%)' });
    const ov = s.div(null, { position: 'absolute', left: '340px', top: '104px', width: '1240px', height: '620px' });
    ov.appendChild(el('div', null, { position: 'absolute', inset: '-90px -120px', background: 'radial-gradient(ellipse at 50% 50%, rgba(111,216,255,.30) 0%, rgba(111,216,255,.10) 45%, rgba(111,216,255,0) 68%)' }));
    ov.appendChild(image(IMG.cmbMollweide, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', clipPath: 'ellipse(49.6% 49.3% at 50% 50%)' }));
    s.onUpdate((lt) => { ov.style.transform = `scale(${(lerp(1.5, 1, ease.out3(clamp(lt / 1.3))) * (1 + 0.012 * lt)).toFixed(4)})`; });
    const hd = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '28px', fontWeight: 700, letterSpacing: '.3em' }); typed(s, hd, 'COSMIC MICROWAVE BACKGROUND', 0.3, 0.9);
    const t1 = s.div('mont sh', { position: 'absolute', left: '0', right: '0', top: '768px', textAlign: 'center', fontSize: '46px', fontWeight: 700, letterSpacing: '.04em' }, 'us <span style="color:var(--cyan)">pehle lamhe</span> ki…');
    show(s, t1, L('150', 1, -0.08), null, { opacity: 0, y: 16 }, 0.4);
    const t2 = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '828px', textAlign: 'center', fontSize: '150px', lineHeight: '1' }, 'BACHI HUI <span style="color:var(--gold2)">ROSHNI</span>');
    words(t2).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.4 }, L('150', 5 + i, -0.08)));
    s.sfx('swell', 0, { dur: 2.2 }); s.sfx('type', 0.3, { dur: 0.9 });
    s.div('vig');
  }, { fin: 0.4, z: 2 });

  // ───────── E9b  13.8 arab saal ka safar — still arriving from every corner of the sky ─────────
  defScene('e9_safar', TW('150', 10) - 0.1, T('151') + 0.4, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tC = L('150', 11, -0.1), tA = L('150', 19, -0.1), tK = L('150', 24, -0.1);
    const st = stage3d(s, { bg: 0x000000, fov: 50 });
    const cmb = cmbSphere({ inside: true, radius: 60 }); cmb.material.depthWrite = false; cmb.renderOrder = -5; cmb.material.color.setScalar(0.42); st.scene.add(cmb);
    const g = brightEarth(earth(), 1.5); st.scene.add(g); g.rotation.set(0.3, 2.2, 0);
    const N = 560, K = 6, R = rng(91), dirs = new Float32Array(N * 3), ph = new Float32Array(N), sp = new Float32Array(N), pos = new Float32Array(N * K * 3), siz = new Float32Array(N * K), alp = new Float32Array(N * K);
    for (let i = 0; i < N; i++) { const u = R() * 2 - 1, th = R() * 6.283, q = Math.sqrt(1 - u * u); dirs.set([q * Math.cos(th), u, q * Math.sin(th)], i * 3); ph[i] = R(); sp[i] = 0.75 + 0.5 * R(); for (let k = 0; k < K; k++) siz[i * K + k] = [1, 0.8, 0.62, 0.46, 0.32, 0.2][k]; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('size', new THREE.BufferAttribute(siz, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alp, 1));
    const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float size; attribute float alpha; varying float vA; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(size * 430.0 / max(1.0, -mv.z), 1.5, 34.0); }',
      fragmentShader: 'varying float vA; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = pow(clamp(1.0 - r, 0.0, 1.0), 1.5); gl_FragColor = vec4(vec3(1.0, 0.88, 0.58) * 1.7, a * vA); }' }));
    pts.frustumCulled = false; st.scene.add(pts);
    st.frame = (lt) => {
      const k = ease.io3(clamp(lt / Math.max(2.4, tA))), dist = lerp(44, 7.4, k), a = 0.5 + lt * 0.05;
      st.camera.position.set(Math.sin(a) * dist, dist * 0.2, Math.cos(a) * dist); st.camera.lookAt(0, lerp(0, -0.9, k), 0);
      g.rotation.y = 2.2 + lt * 0.06; cmb.rotation.y = lt * 0.01;
      for (let i = 0; i < N; i++) { const f = (lt * 0.085 * sp[i] + ph[i]) % 1, r = 58 - f * 56.9, fa = smooth(0, 0.06, f) * (0.4 + 0.6 * f);
        for (let q = 0; q < K; q++) { const rr = r + q * (0.3 + 0.5 * f), j = (i * K + q) * 3; pos[j] = dirs[i * 3] * rr; pos[j + 1] = dirs[i * 3 + 1] * rr; pos[j + 2] = dirs[i * 3 + 2] * rr; alp[i * K + q] = fa * (q === 0 ? 1 : 0.7 / q); } }
      geo.attributes.position.needsUpdate = true; geo.attributes.alpha.needsUpdate = true;
    };
    s.div('scrim-b'); s.div('scrim-t');
    const hd = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '28px', fontWeight: 700, letterSpacing: '.3em' }, 'COSMIC MICROWAVE BACKGROUND → ZAMEEN');
    const cn = s.div(null, { position: 'absolute', left: '110px', bottom: '118px' }, '<div class="bebas sh" style="font-size:210px;line-height:.9"><span class="n">0.0</span> <span style="font-size:120px">ARAB SAAL</span></div><div class="mono cyan sh" style="font-size:32px;font-weight:700;letter-spacing:.3em;margin-top:10px">SE SAFAR KAR RAHI HAI</div>');
    show(s, cn, tC, tA + 0.1, { opacity: 0, y: 30 }, 0.4); counter(s, cn.querySelector('.n'), 0, 13.8, tC, Math.max(0.8, Math.min(2.6, tA - tC - 0.4)), (v) => v.toFixed(1), 'power1.inOut');
    const aj = s.div('hud sh', { position: 'absolute', left: '0', right: '0', bottom: '300px', textAlign: 'center', fontSize: '32px', fontWeight: 700 }, '…AUR AAJ BHI'); show(s, aj, tA + 0.1, null, { opacity: 0, y: 12 }, 0.35);
    const hk = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', bottom: '112px', textAlign: 'center', fontSize: '170px', lineHeight: '1' }, 'AASMAN KE <span style="color:var(--gold2)">HAR KONE SE</span>');
    gsap.set(hk, { autoAlpha: 0 }); s.tl.set(hk, { autoAlpha: 1 }, L('150', 22, -0.08));
    words(hk).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.4 }, L('150', 22 + i, -0.08)));
    s.sfx('whoosh', 0, { gain: 0.7 }); s.sfx('swell', tC, { dur: 2.6 }); s.sfx('shimmer', tK, { gain: 0.8 });
    s.div('vig');
  }, { z: 1 });

  // ───────── E10  the old antenna TV: "jhilmil" — a small part of it was this very light ─────────
  defScene('e10_tv', T('151'), T('154') + 0.5, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tTV = L('151', 4, -0.1), tOn = L('151', 7, -0.1), tCh = L('151', 10, -0.1), tJ = L('151', 17, -0.12), tH = L('152', null, -0.1), tY = L('153', null, -0.1);
    const tv = tvPlate(s, '/gfx/img/e_tv_day.jpg', [280, 220]), path = camPath([[0, 2300, 1330, 0.6], [d, 2420, 1300, 0.69, 'l']]);
    s.div('scrim-r'); s.div('scrim-b', { height: '30%' });
    // gold motes: a small part of the snow lifts out of the screen and gathers into the CMB
    const gc = el('canvas', null, { position: 'absolute', left: '0', top: '0' }); gc.width = W; gc.height = H; const gx = gc.getContext('2d');
    const spr = document.createElement('canvas'); spr.width = spr.height = 64; { const x = spr.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,246,214,1)'); gr.addColorStop(0.25, 'rgba(248,210,110,.8)'); gr.addColorStop(1, 'rgba(233,185,85,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
    const RG = rng(152), OV = { x: 1150, y: 300, w: 640, h: 320 }, motes = Array.from({ length: 90 }, () => { const a = RG() * 6.283, r = Math.sqrt(RG()); return { u: 0.12 + RG() * 0.76, v: 0.12 + RG() * 0.76, tg: tH + RG() * 0.5, tb: tH + 0.3 + RG() * Math.max(0.6, tY - tH - 0.7), tx: OV.x + OV.w / 2 + Math.cos(a) * r * OV.w * 0.47, ty: OV.y + OV.h / 2 + Math.sin(a) * r * OV.h * 0.46, ph: RG() * 6, bend: (RG() - 0.5) * 260 }; });
    const ov = s.div(null, { position: 'absolute', left: OV.x + 'px', top: OV.y + 'px', width: OV.w + 'px', height: OV.h + 'px' });
    ov.appendChild(el('div', null, { position: 'absolute', inset: '-60px -80px', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.30) 0%, rgba(233,185,85,0) 66%)' }));
    ov.appendChild(image(IMG.cmbMollweide, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', clipPath: 'ellipse(49.6% 49.3% at 50% 50%)' }));
    show(s, ov, tY - 0.2, null, { opacity: 0, scale: 0.9 }, 1.0); s.add(gc);
    s.onUpdate((lt) => {
      const c = path(lt); tv.cam.set(c[0], c[1], c[2]);
      const fr = Math.round((lt + s.t0) * 30), on = clamp((lt - tOn) / 0.25);
      tv.sn.cv.style.transform = `scaleY(${Math.max(0.012, ease.out3(on)).toFixed(3)})`; tv.sn.cv.style.opacity = lt < tOn ? '0' : '1'; tv.sn.draw(fr, 0.75 + 0.25 * on);
      if (lt > tCh && lt < tH) { const ch = 2 + Math.floor((lt - tCh) / 0.42), x = tv.sn.ctx; x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(176, 12, 92, 34); x.fillStyle = '#7CFF8A'; x.font = "700 24px 'Space Mono', monospace"; x.textBaseline = 'top'; x.fillText('CH ' + String(ch).padStart(2, '0'), 182, 15); }
      gx.clearRect(0, 0, W, H); gx.globalCompositeOperation = 'lighter';
      for (const m of motes) { if (lt < m.tg) continue; const o = quadPoint(tv.m, m.u, m.v), p = tv.cam.scr(o[0], o[1]), k = ease.io3(clamp((lt - m.tb) / 1.1));
        const x = lerp(p[0], m.tx, k), y = lerp(p[1], m.ty, k) - Math.sin(k * Math.PI) * (120 + m.bend), sz = (k <= 0 ? 16 * clamp((lt - m.tg) / 0.3) : lerp(22, 15, k)) * (0.8 + 0.2 * Math.sin(lt * 9 + m.ph));
        gx.drawImage(spr, x - sz, y - sz, sz * 2, sz * 2); }
      gx.globalCompositeOperation = 'source-over';
    });
    // right column
    const col = s.div(null, { position: 'absolute', left: '1150px', top: '150px', width: '660px' });
    col.innerHTML = `<div class="play sh q" style="font-size:72px;font-style:italic;font-weight:700;color:var(--gold2)">Aapko yaad hai…?</div>
      <div class="bebas sh a" style="font-size:96px;line-height:.98;margin-top:34px">PURANA<br>ANTENNA WALA TV</div><div class="hud sh b" style="font-size:28px;font-weight:700;margin-top:26px">CHANNEL NAHI LAGTA…</div>
      <div class="bebas sh glowc j" style="font-size:210px;line-height:1;margin-top:26px;color:#fff">“JHILMIL”</div>`;
    pop(s, col.querySelector('.q'), 0.1, { s0: 1, y: 20, dur: 0.5, ease: 'power2.out', out: tH }); pop(s, col.querySelector('.a'), tTV, { s0: 1, y: 30, dur: 0.45, ease: 'power3.out', out: tH });
    pop(s, col.querySelector('.b'), tCh, { s0: 1, y: 14, dur: 0.3, ease: 'power2.out', out: tH }); pop(s, col.querySelector('.j'), tJ, { s0: 1.6, dur: 0.26, ease: 'power3.out', out: tH });
    const c2 = s.div(null, { position: 'absolute', left: '1150px', top: '96px', width: '680px' }, '<div class="hud sh" style="font-size:28px;font-weight:700">US JHILMIL KA…</div><div class="bebas sh" style="font-size:104px;line-height:1;margin-top:10px">EK <span style="color:var(--gold2)">CHHOTA SA HISSA</span></div>');
    show(s, c2, tH + 0.1, null, { opacity: 0, y: 20 }, 0.4);
    const c3 = s.div('bebas glowg', { position: 'absolute', left: '1150px', top: '668px', width: '640px', textAlign: 'center', fontSize: '100px', lineHeight: '1', whiteSpace: 'nowrap', color: 'var(--gold2)' }, 'YEHI ROSHNI THI'); pop(s, c3, tY, { s0: 1.5, dur: 0.3, ease: 'power3.out' });
    s.sfx('tick', tOn); s.sfx('static', tOn, { dur: Math.max(1, tH - tOn), gain: 0.7 }); s.sfx('pop', tJ + 0.05); s.sfx('shimmer', tH + 0.3); s.sfx('chime', tY + 0.1);
    s.div('vig');
  }, { fin: 0.4, z: 2 });

  // ───────── E11  in your own drawing room — the echo of creation ─────────
  defScene('e11_room', T('154'), T('156'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tP = L('154', 5, -0.2), tK = L('154', 7, -0.1), tG = L('154', 11, -0.1), t5 = L('155', null, -0.05);
    const tv = tvPlate(s, '/gfx/img/e_tv_night.jpg', [560, 440]);
    const path = camPath([[0, 2420, 1300, 0.69], [tP, 2330, 1290, 0.74, 'l'], [tG + 0.5, 1763, 1190, 2.3], [d + 0.5, 1763, 1190, 2.7, 'l']]);
    const lamp = s.div('fill', { background: 'radial-gradient(ellipse 46% 60% at 0% 24%, rgba(255,176,88,.34) 0%, rgba(255,150,60,.10) 50%, rgba(255,150,60,0) 100%)' });
    const glw = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1500px', height: '1500px', background: 'radial-gradient(circle at 50% 50%, rgba(170,200,255,.30) 0%, rgba(150,185,255,.10) 36%, rgba(150,185,255,0) 62%)' });
    const chair = s.div(null, { position: 'absolute', left: '-40px', top: '560px', transformOrigin: '0 100%' }, '<svg width="760" height="560" viewBox="0 0 760 560"><path d="M60 560 L60 300 Q60 232 128 228 L128 150 Q132 40 300 34 L470 34 Q636 40 640 150 L640 228 Q706 232 708 300 L708 560 Z" fill="#010205"/></svg>');
    const cm = s.div('fill', { overflow: 'hidden', opacity: '0' }), ci = image(CMB, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' }); cm.appendChild(ci);
    s.onUpdate((lt) => {
      const c = path(lt); tv.cam.set(c[0], c[1], c[2]); tv.sn.draw(Math.round((lt + s.t0) * 30), 1);
      const k = smooth(tP, tG + 0.5, lt), p = tv.cam.scr(1763, 1190), f = 0.72 + 0.28 * noise1(lt * 13, 3);
      glw.style.transform = `translate(${(p[0] - 750).toFixed(1)}px, ${(p[1] - 750).toFixed(1)}px) scale(${(tv.cam.z / 0.7).toFixed(3)})`; glw.style.opacity = (f * (1 - 0.6 * k)).toFixed(3); lamp.style.opacity = (1 - k).toFixed(3);
      const kc = clamp(k * 2.2); chair.style.transform = `translate(${(-760 * kc).toFixed(1)}px, ${(520 * kc).toFixed(1)}px) scale(${(1 + 0.5 * kc).toFixed(3)})`;
      cm.style.opacity = smooth(tG - 0.25, tG + 0.9, lt).toFixed(3); ci.style.transform = `scale(${(1.3 - 0.02 * lt).toFixed(4)})`;
    });
    cap(s, 'Aap apne <span class="hl">drawing room</span> mein baith kar…', 0.25, Math.max(1.2, tK - 0.05), { bottom: 110 });
    const scr = s.div(null, { position: 'absolute', left: '50%', top: '50%', width: '1900px', height: '1000px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 50%, rgba(2,4,12,.80) 0%, rgba(2,4,12,.5) 44%, rgba(2,4,12,0) 70%)' }); show(s, scr, tK, null, { opacity: 0 }, 0.8);
    const hd = s.div(null, { position: 'absolute', left: '0', right: '0', top: '212px', textAlign: 'center' }, '<div class="mont sh h1" style="font-size:60px;font-weight:800;letter-spacing:.08em">KAINAT KI PAIDAISH KI</div><div class="anton sh h2" style="font-size:300px;line-height:1.1;color:var(--gold2)">GOONJ</div><div class="mont sh h3" style="font-size:44px;font-weight:700">…dekh rahe the</div>');
    gsap.set(hd.querySelector('.h1'), { autoAlpha: 0 }); s.tl.set(hd.querySelector('.h1'), { autoAlpha: 1 }, tK);
    words(hd.querySelector('.h1')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35 }, L('154', 7 + i, -0.08)));
    pop(s, hd.querySelector('.h2'), tG, { s0: 1.8, dur: 0.28, ease: 'power3.in' }); pop(s, hd.querySelector('.h3'), L('154', 12, -0.05), { s0: 1, y: 14, dur: 0.35, ease: 'power2.out' });
    const l5 = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '800px', textAlign: 'center', fontSize: '84px', fontStyle: 'italic', fontWeight: 700 }, 'Aur aapko <span style="color:var(--gold2)">pata bhi nahi</span> tha.');
    gsap.set(l5, { autoAlpha: 0 }); s.tl.set(l5, { autoAlpha: 1 }, t5).fromTo(words(l5), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, t5);
    s.sfx('static', 0, { dur: Math.max(1, tG), gain: 0.5 }); s.sfx('riser', tP, { dur: Math.max(0.8, tG - tP + 0.28) }); s.sfx('hit', tG + 0.28); s.sfx('swell', tG + 0.3, { dur: 2.2 });
    s.div('vig');
  }, { fin: 0.5, z: 3 });

  // ───────── E12  1978 · Nobel Prize ─────────
  defScene('e12_nobel', T('156'), T('157') + 0.35, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tD = L('156', 2, -0.1), tN = L('156', 4, -0.1);
    s.div('fill', { background: 'radial-gradient(ellipse at 33% 50%, #2c1d06 0%, #0b0803 55%, #000 100%)' });
    const rays = s.div(null, { position: 'absolute', left: '-110px', top: '-210px', width: '1500px', height: '1500px', background: 'repeating-conic-gradient(from 0deg, rgba(233,185,85,.13) 0deg 5deg, rgba(233,185,85,0) 5deg 15deg)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,.5) 34%, rgba(0,0,0,0) 62%)', maskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,.5) 34%, rgba(0,0,0,0) 62%)' });
    const leaf = (sd) => Array.from({ length: 9 }, (_, i) => { const a = (30 + i * 16.5) * Math.PI / 180, x = sd * Math.sin(a) * 176, y = -Math.cos(a) * 176, rot = sd * (a * 180 / Math.PI - 62); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="12" ry="30" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="url(#eG2)"/>`; }).join('');
    const md = s.div(null, { position: 'absolute', left: '370px', top: '270px', width: '540px', height: '540px' });
    md.innerHTML = `<svg width="540" height="540" viewBox="-270 -270 540 540"><defs><linearGradient id="eG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3C9"/><stop offset=".35" stop-color="#F2CB6B"/><stop offset=".7" stop-color="#B8862E"/><stop offset="1" stop-color="#F3D27C"/></linearGradient><linearGradient id="eG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0BF"/><stop offset="1" stop-color="#C8902F"/></linearGradient><radialGradient id="eG3"><stop offset="0" stop-color="#D9A84A"/><stop offset="1" stop-color="#8F651C"/></radialGradient></defs>
      <circle r="262" fill="url(#eG1)"/><circle r="240" fill="none" stroke="#7A5514" stroke-width="3"/><circle r="230" fill="url(#eG3)"/>${leaf(-1)}${leaf(1)}
      <g fill="none" stroke="url(#eG2)" stroke-width="7"><ellipse rx="98" ry="36"/><ellipse rx="98" ry="36" transform="rotate(60)"/><ellipse rx="98" ry="36" transform="rotate(120)"/></g><circle r="15" fill="#FFF0BF"/><path d="${SPARK}" transform="translate(0 -196) scale(.8)" fill="#FFF0BF"/></svg>
      <div style="position:absolute;inset:8px;border-radius:50%;overflow:hidden"><div class="shm" style="position:absolute;left:0;top:-40px;width:150px;height:620px;background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85), rgba(255,255,255,0));transform:translateX(-300px) skewX(-18deg)"></div></div>`;
    const shm = md.querySelector('.shm');
    s.tl.fromTo(md, { scale: 0.5, opacity: 0, rotateY: -80, transformPerspective: 1400 }, { scale: 1, opacity: 1, rotateY: 0, duration: 0.7, ease: 'back.out(1.4)' }, 0.02);
    s.onUpdate((lt) => { rays.style.transform = `rotate(${(lt * 7).toFixed(2)}deg)`; shm.style.transform = `translateX(${lerp(-300, 760, clamp((lt - tN) / 0.75)).toFixed(1)}px) skewX(-18deg)`; md.style.translate = `0px ${(Math.sin(lt * 1.3) * 6).toFixed(1)}px`; });
    const tx = s.div(null, { position: 'absolute', left: '1010px', top: '226px', width: '800px' });
    tx.innerHTML = `<div class="bebas sh y" style="font-size:250px;line-height:.9">1978</div><div class="mont sh n" style="font-size:37px;font-weight:800;letter-spacing:.05em;margin-top:18px;white-space:nowrap">ARNO PENZIAS · ROBERT WILSON</div>
      <div class="bebas goldgrad p" style="font-size:176px;line-height:1;margin-top:20px;padding-bottom:6px">NOBEL PRIZE</div><div class="orn o" style="width:640px;margin-top:6px"></div><div class="cinzel gold sh f" style="font-size:40px;font-weight:700;letter-spacing:.5em;margin-top:22px">PHYSICS</div>`;
    s.tl.fromTo(chars(tx.querySelector('.y')), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power4.out' }, 0.02);
    pop(s, tx.querySelector('.n'), tD, { s0: 1, y: 20, dur: 0.4, ease: 'power3.out' }); pop(s, tx.querySelector('.p'), tN, { s0: 1.5, dur: 0.28, ease: 'power3.out' });
    s.tl.fromTo(tx.querySelector('.o'), { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.6 }, tN + 0.1); pop(s, tx.querySelector('.f'), tN + 0.25, { s0: 1, y: 12, dur: 0.4, ease: 'power2.out' });
    flash(s, 0, { color: '#FFE9B0', peak: 0.7, dur: 0.6 }); s.sfx('hit', 0, { gain: 0.6 }); s.sfx('chime', tN); s.sfx('shimmer', tN + 0.1);
    s.div('vig');
  }, { z: 1 });

  // ───────── E13  "Kya unhone nahi dekha?" — DEKH LIYA. ─────────
  defScene('e13_dekh', T('157'), P1 + 0.3, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tD = L('158', null, -0.08), tSl = tD + 0.2;
    const st = stage3d(s, { bg: 0x000000, fov: 60 });
    const cmb = cmbSphere({ inside: true, radius: 400 }); cmb.material.color.setScalar(0.26); st.scene.add(cmb);
    st.frame = (lt) => { st.camera.position.set(0, 0, 0); st.camera.rotation.set(0.3, 2.0 + lt * 0.03, 0, 'YXZ'); cmb.material.color.setScalar(0.26 + 0.1 * smooth(tSl, tSl + 0.8, lt)); };
    s.div(null, { position: 'absolute', left: '50%', top: '50%', width: '2100px', height: '1150px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 46%, rgba(2,4,12,.78) 0%, rgba(2,4,12,.5) 46%, rgba(2,4,12,0) 72%)' });
    const ref = s.div('ayah-ref sh', { position: 'absolute', left: '0', right: '0', top: '96px', textAlign: 'center' }, REF['21:30a']); show(s, ref, 0.1, null, { opacity: 0, y: -14 }, 0.6);
    const ar = s.div('ar glowg', { position: 'absolute', left: '0', right: '0', top: '112px', textAlign: 'center', fontSize: '200px', lineHeight: '1.75', color: '#FFF3D2' }, Q['w:awalam_yara']);
    s.tl.fromTo(ar, { opacity: 0, scale: 0.9, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.05);
    const tr = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '486px', textAlign: 'center', fontSize: '70px', fontStyle: 'italic', fontWeight: 700 }, '“Kya unhone <span style="color:var(--gold2)">nahi dekha?”</span>');
    words(tr).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35 }, L('157', i, -0.06)));
    const dk = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '606px', textAlign: 'center', fontSize: '300px', lineHeight: '1.1', color: '#fff' }, 'DEKH LIYA.');
    pop(s, dk, tD, { s0: 2.6, dur: 0.2, ease: 'power4.in' }); s.tl.to(dk, { scale: 1.05, duration: Math.max(0.4, d - tSl), ease: 'none' }, tSl).to(tr, { opacity: 0.85, duration: 0.4 }, tSl);
    flash(s, tSl, { peak: 0.85, dur: 0.8 }); shake(s, dk, tSl, 0.55, 18);
    s.sfx('shimmer', 0.05, { gain: 0.8 }); s.sfx('impact', tSl, { gain: 1.2 }); s.sfx('subdrop', tSl);
    s.div('vig');
  }, { fin: 0.35, fout: 0.3, z: 2 });
}
