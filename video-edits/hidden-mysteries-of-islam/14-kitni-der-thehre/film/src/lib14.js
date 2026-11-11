// Helpers shared by the "Kitni Der Thehre?" scenes. Everything is a pure function of (local) time.
import { T, TW, gsap, THREE, el, clamp, lerp, smooth, rng, texture, glow, W, H, film, track } from './engine.js';
import { words, show, shake, ayah } from './ui.js';
import { Q, REF } from './quran.js';

// film time at which the word containing `frag` (case-insensitive, nth occurrence) of spoken line `id` starts
export function WT(id, frag, nth = 0) {
  const x = film.cues.x && film.cues.x[String(id)]; if (!x) { console.log('missing cue text ' + id); return T(id); }
  const ws = x.split(' '), f = frag.toLowerCase(); let c = 0;
  for (let i = 0; i < ws.length; i++) if (ws[i].toLowerCase().includes(f) && c++ === nth) return TW(id, i);
  console.log(`missing cue word "${frag}" in ${id}`); return T(id);
}
// local-time cue helper: L('12') line start · L('12e') line end · L('12', 3) 4th word · L('12', 'sikka') the word containing "sikka"
export const mkL = (s) => (id, n, nth) => (n == null ? T(id) : typeof n === 'string' ? WT(id, n, nth) : TW(id, n)) - s.t0;
export const bg = (s, css) => s.div('fill', { background: css });
export const GOLD = '#E9B955', CYAN = '#6FD8FF', RED = '#FF4B4B', WHITE = '#F5F1E8';

// ---- drifting dust motes / embers (2D canvas, additive) ----
export function dust(s, o = {}) {
  const c = el('canvas', 'gl'); c.width = W; c.height = H; s.add(c); const x = c.getContext('2d');
  const R = rng(o.seed || 3), N = o.n || 90, P = [], col = o.color || '255,225,170';
  for (let i = 0; i < N; i++) P.push({ x: R() * W, y: R() * H, vx: (R() - .5) * (o.vx ?? 14), vy: -(2 + R() * (o.vy ?? 10)), r: (o.r ?? 2.2) * (0.4 + R() * 1.4), a: 0.15 + R() * 0.55, ph: R() * 6.28, f: 0.3 + R() * 0.8 });
  s.onUpdate((lt) => {
    x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; const al = typeof o.alpha === 'function' ? o.alpha(lt) : (o.alpha ?? 1);
    if (al <= 0.01) return;
    for (const p of P) {
      const px = ((p.x + p.vx * lt + Math.sin(lt * p.f + p.ph) * 18) % W + W) % W, py = ((p.y + p.vy * lt) % H + H) % H;
      const a = p.a * (0.55 + 0.45 * Math.sin(lt * p.f * 2.1 + p.ph)) * al;
      const g = x.createRadialGradient(px, py, 0, px, py, p.r * 3); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(px - p.r * 3, py - p.r * 3, p.r * 6, p.r * 6);
    }
  });
  return c;
}

// ---- footage frame chosen by a function of time: fn(lt) -> frame index (ping-pongs past either end) ----
export function clipAt(s, clip, n, fn, o = {}) {
  const wrap = s.div('fill', { overflow: 'hidden', ...(o.style || {}) });
  const im = el('img', null, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', transformOrigin: o.origin || '50% 50%', transform: o.zoom ? `scale(${o.zoom})` : 'none' }); im.decoding = 'sync'; wrap.appendChild(im);
  let last = -1; const m = 2 * n - 2;
  s.onUpdate((lt) => { const p = ((Math.round(fn(lt)) % m) + m) % m, f = p < n ? p : m - p; if (f !== last) { last = f; im.src = `/frames/${clip}/${String(f + 1).padStart(5, '0')}.jpg`; track(im.decode()); } });
  if (o.dim) wrap.appendChild(el('div', 'fill', { background: `rgba(2,4,10,${o.dim})` }));
  return wrap;
}

// ---- out-of-focus lights (2D canvas) ----
export function bokeh(s, o = {}) {
  const c = el('canvas', 'gl'); c.width = W; c.height = H; s.add(c); const x = c.getContext('2d');
  const R = rng(o.seed || 9), N = o.n || 46, cols = o.cols || ['255,176,90', '255,214,150', '255,128,64', '255,236,200'], P = [];
  for (let i = 0; i < N; i++) P.push({ x: R() * W, y: (o.y0 ?? 0.1) * H + R() * (o.yh ?? 0.75) * H, r: 28 + Math.pow(R(), 2) * (o.r ?? 120), a: 0.05 + R() * 0.2, col: cols[Math.floor(R() * cols.length)], ph: R() * 6.28, f: 0.4 + R() * 1.3, dx: (R() - .5) * 26 });
  s.onUpdate((lt) => {
    x.clearRect(0, 0, W, H); const al = typeof o.alpha === 'function' ? o.alpha(lt) : (o.alpha ?? 1); if (al <= 0.01) return;
    x.globalCompositeOperation = 'lighter';
    for (const p of P) { const px = p.x + p.dx * lt * 0.3 + Math.sin(lt * 0.2 + p.ph) * 12, a = p.a * al * (0.7 + 0.3 * Math.sin(lt * p.f + p.ph));
      const g = x.createRadialGradient(px, p.y, 0, px, p.y, p.r); g.addColorStop(0, `rgba(${p.col},${a.toFixed(3)})`); g.addColorStop(0.72, `rgba(${p.col},${(a * 0.85).toFixed(3)})`); g.addColorStop(1, `rgba(${p.col},0)`);
      x.fillStyle = g; x.fillRect(px - p.r, p.y - p.r, p.r * 2, p.r * 2); }
  });
  return c;
}

// ---- ECG trace (2D canvas). o.phase(lt) = beats elapsed (may stop growing = flat line when o.flat(lt) is true) ----
export function ecg(s, o) {
  const c = el('canvas', null, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', ...(o.style || {}) }); c.width = o.w; c.height = o.h; s.add(c); const g = c.getContext('2d'), ppb = o.ppb || 260;
  const wave = (p) => { const G = (m, sd, a) => a * Math.exp(-Math.pow((p - m) / sd, 2)); return G(0.18, 0.035, 0.12) - G(0.335, 0.012, 0.18) + G(0.36, 0.014, 1.0) - G(0.392, 0.013, 0.28) + G(0.62, 0.06, 0.22); };
  s.onUpdate((lt) => {
    g.clearRect(0, 0, o.w, o.h); g.strokeStyle = o.color || '#FF4B4B'; g.lineWidth = o.lw || 4; g.lineJoin = 'round'; g.shadowColor = o.color || '#FF4B4B'; g.shadowBlur = 14; g.beginPath();
    const ph0 = o.phase(lt), dead = o.deadAt != null ? o.deadAt : Infinity;
    for (let i = 0; i <= o.w; i += 3) { const ph = ph0 - (o.w - i) / ppb; const v = (ph < 0 || ph > dead) ? 0 : wave(((ph % 1) + 1) % 1); const y = o.h * 0.72 - v * o.h * 0.62; if (i) g.lineTo(i, y); else g.moveTo(i, y); }
    g.stroke();
  });
  return c;
}

// ---- cinematic letterbox bars ----
export function bars(s, h = 96, tOut = null) {
  const top = s.div(null, { position: 'absolute', left: '0', right: '0', top: '0', height: h + 'px', background: '#000', transformOrigin: '50% 0%', zIndex: 60 });
  const bot = s.div(null, { position: 'absolute', left: '0', right: '0', bottom: '0', height: h + 'px', background: '#000', transformOrigin: '50% 100%', zIndex: 60 });
  if (tOut != null) s.tl.to([top, bot], { scaleY: 0, duration: 0.7, ease: 'power2.inOut' }, tOut - 0.75);
  return [top, bot];
}

// ---- headline that slams in on a word ----
export function slam(s, html, t, o = {}) {
  const c = s.div((o.cls || 'anton sh'), { position: 'absolute', left: (o.x ?? 0) + 'px', width: (o.w ?? W) + 'px', top: (o.y ?? 400) + 'px', textAlign: o.align || 'center', fontSize: (o.size || 200) + 'px', lineHeight: o.lh || '1.02', color: o.color || (/goldgrad/.test(o.cls || '') ? 'transparent' : '#fff'), whiteSpace: 'nowrap', ...(o.style || {}) }, html);
  gsap.set(c, { autoAlpha: 0 }); const d = o.dur ?? 0.2;
  s.tl.set(c, { autoAlpha: 1 }, t).fromTo(c, { scale: o.from ?? 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: d, ease: 'power4.in' }, t);
  const end = o.out ?? (s.t1 - s.t0);
  if (o.drift && end - t - d > 0.1) s.tl.to(c, { scale: 1 + o.drift, duration: end - t - d, ease: 'none' }, t + d);
  if (o.shake !== false) shake(s, c, t + d, 0.45, o.amp ?? 14);
  if (o.out != null) { s.tl.to(c, { opacity: 0, duration: 0.22, ease: 'power2.in' }, o.out - 0.22); s.tl.set(c, { autoAlpha: 0 }, o.out); }
  return c;
}
// simple absolutely-positioned text block with show/hide
export function txt(s, cls, html, style, t0, t1, from, dur) {
  const c = s.div(cls, { position: 'absolute', ...style }, html); show(s, c, t0, t1, from || { opacity: 0, y: 22 }, dur ?? 0.5); return c;
}

// ---- analogue clock (SVG). c.set(seconds) positions the hands; pure function of the value ----
export function clock(s, o = {}) {
  const r = o.r || 120, col = o.color || WHITE, sec = o.sec || RED; let ticks = '';
  for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r0 = r * (big ? 0.8 : 0.9), r1 = r * 0.95;
    ticks += `<line x1="${(Math.sin(a) * r0).toFixed(1)}" y1="${(-Math.cos(a) * r0).toFixed(1)}" x2="${(Math.sin(a) * r1).toFixed(1)}" y2="${(-Math.cos(a) * r1).toFixed(1)}" stroke="${col}" stroke-width="${(big ? r * 0.03 : r * 0.012).toFixed(1)}" opacity="${big ? 0.95 : 0.45}"/>`; }
  const d = s.div(null, { position: 'absolute', left: (o.x - r) + 'px', top: (o.y - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', ...(o.style || {}) });
  d.innerHTML = `<svg width="${2 * r}" height="${2 * r}" viewBox="${-r} ${-r} ${2 * r} ${2 * r}" style="overflow:visible">
    <circle r="${r * 1.12}" fill="none" stroke="${col}" stroke-width="${r * 0.012}" opacity=".25"/><circle r="${r}" fill="${o.fill || 'rgba(6,10,22,.78)'}" stroke="${col}" stroke-width="${r * 0.04}"/>${ticks}
    <line class="hh" x1="0" y1="${r * 0.1}" x2="0" y2="${-r * 0.5}" stroke="${col}" stroke-width="${r * 0.065}" stroke-linecap="round"/>
    <line class="mm" x1="0" y1="${r * 0.12}" x2="0" y2="${-r * 0.74}" stroke="${col}" stroke-width="${r * 0.042}" stroke-linecap="round"/>
    <line class="ss" x1="0" y1="${r * 0.2}" x2="0" y2="${-r * 0.84}" stroke="${sec}" stroke-width="${r * 0.02}" stroke-linecap="round"/><circle r="${r * 0.055}" fill="${sec}"/></svg>`;
  const hh = d.querySelector('.hh'), mm = d.querySelector('.mm'), ss = d.querySelector('.ss');
  d.set = (v) => { hh.setAttribute('transform', `rotate(${((v / 120) % 360).toFixed(2)})`); mm.setAttribute('transform', `rotate(${((v / 10) % 360).toFixed(2)})`); ss.setAttribute('transform', `rotate(${(((o.sweep ? v : Math.floor(v)) * 6) % 360).toFixed(2)})`); };
  d.set(o.start ?? 36610); return d;
}

// ---- phone calculator. p.at(t, main, small, key) schedules display changes; p.type(t0, '365.24') presses keys one by one ----
export function calc(s, o = {}) {
  const p = s.div(null, { position: 'absolute', left: (o.x ?? 660) + 'px', top: (o.y ?? 90) + 'px', width: '600px', height: '900px', transform: `scale(${o.scale || 1})`, transformOrigin: '50% 50%', borderRadius: '64px', background: 'linear-gradient(180deg,#161b28,#0a0d15)', border: '3px solid rgba(255,255,255,.22)', boxShadow: '0 50px 140px rgba(0,0,0,.8), inset 0 0 0 10px #05070c' });
  const disp = el('div', null, { position: 'absolute', left: '48px', right: '48px', top: '64px', height: '236px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', fontFamily: "'Oswald',sans-serif" });
  const small = el('div', null, { fontSize: '40px', color: 'rgba(255,255,255,.5)', height: '56px', whiteSpace: 'nowrap' }), main = el('div', null, { fontSize: '112px', lineHeight: '1.08', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap' });
  disp.append(small, main); p.appendChild(disp);
  const K = {}, grid = el('div', null, { position: 'absolute', left: '48px', right: '48px', top: '330px', bottom: '54px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' });
  ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '⌫', '='].forEach((k) => {
    const op = '÷×−+='.includes(k), fn = 'C±%⌫'.includes(k), base = op ? [233, 185, 85] : fn ? [58, 65, 82] : [35, 41, 56];
    const b = el('div', null, { borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Oswald',sans-serif", fontSize: '46px', color: op ? '#0a0d15' : '#fff', background: `rgb(${base})` }, k); b._base = base; K[k] = b; grid.appendChild(b); });
  p.appendChild(grid);
  const ev = [];
  p.at = (t, m, sm, key) => { ev.push({ t, m, sm, key }); ev.sort((a, b) => a.t - b.t); return p; };
  p.type = (t0, str, per = 0.11, prefix = '', sm) => { let cur = prefix; [...str].forEach((ch, i) => { cur += ch; p.at(t0 + i * per, cur, sm, ch); }); return t0 + str.length * per; };
  s.onUpdate((lt) => {
    let m = o.init ?? '0', sm = '';
    for (const e of ev) { if (e.t > lt) break; if (e.m != null) m = e.m; if (e.sm != null) sm = e.sm; }
    if (main.textContent !== m) { main.textContent = m; main.style.fontSize = (m.length > 8 ? Math.max(58, 112 * 8.4 / m.length) : 112) + 'px'; }
    if (small.textContent !== sm) small.textContent = sm;
    for (const k in K) { let h = 0; for (const e of ev) if (e.key === k && lt >= e.t && lt < e.t + 0.18) h = Math.max(h, 1 - (lt - e.t) / 0.18); const b = K[k]._base; K[k].style.background = `rgb(${b.map((v) => Math.round(lerp(v, 255, h * 0.75)))})`; }
  });
  p.main = main; return p;
}

// ---- procedural silhouettes (SVG path data) ----
export function dunes(seed, y0, amp) {
  const R = rng(seed), ph = [R() * 6, R() * 6, R() * 6], f = [1 + R(), 2 + R() * 2, 4 + R() * 3]; let d = `M -200 1300 L -200 ${y0}`;
  for (let x = -200; x <= 2120; x += 20) { const u = x / 1920; d += ` L ${x} ${(y0 + amp * (Math.sin(u * f[0] * 3.1 + ph[0]) * 0.6 + Math.sin(u * f[1] * 3.1 + ph[1]) * 0.28 + Math.sin(u * f[2] * 3.1 + ph[2]) * 0.12)).toFixed(1)}`; }
  return d + ' L 2120 1300 Z';
}
export function ruins(seed, base, hmax, o = {}) {
  const R = rng(seed); let d = '', x = o.x0 ?? -160; const f = (v) => v.toFixed(1);
  while (x < (o.x1 ?? 2080)) {
    const kind = R(), w = 50 + R() * (o.w ?? 170), h = hmax * (0.3 + R() * 0.7), gap = 20 + R() * (o.gap ?? 150);
    if (kind < 0.28) { const cw = 26 + R() * 24; d += `M ${f(x)} ${base} L ${f(x)} ${f(base - h)} L ${f(x + cw * 0.3)} ${f(base - h - 8 - R() * 16)} L ${f(x + cw * 0.7)} ${f(base - h + R() * 10)} L ${f(x + cw)} ${f(base - h - R() * 12)} L ${f(x + cw)} ${base} Z `; x += cw + gap * 0.6; }
    else if (kind < 0.78) {
      let p = `M ${f(x)} ${base} L ${f(x)} ${f(base - h * (0.6 + R() * 0.4))}`; const st = 3 + Math.floor(R() * 5);
      for (let i = 1; i <= st; i++) p += ` L ${f(x + w * i / st)} ${f(base - h * (0.35 + R() * 0.65))}`;
      p += ` L ${f(x + w)} ${base} Z `;
      if (w > 110 && R() < 0.75) { const dw = 28 + R() * 22, dx = x + w * (0.3 + R() * 0.3), dh = Math.min(h * 0.42, 100); p += `M ${f(dx)} ${base} L ${f(dx)} ${f(base - dh)} A ${f(dw / 2)} ${f(dw / 2)} 0 0 1 ${f(dx + dw)} ${f(base - dh)} L ${f(dx + dw)} ${base} Z `; }
      d += p; x += w + gap;
    } else { for (let i = 0; i < 4; i++) { const bw = 18 + R() * 44, bh = 10 + R() * 28, bx = x + i * 28 + R() * 10; d += `M ${f(bx)} ${base} L ${f(bx + R() * 8)} ${f(base - bh)} L ${f(bx + bw - R() * 8)} ${f(base - bh + R() * 8)} L ${f(bx + bw)} ${base} Z `; } x += 130 + gap * 0.5; }
  }
  return d;
}
// irregular cave-mouth opening (closed path around cx,cy) for evenodd cut-outs
export function blob(seed, cx, cy, rx, ry, rough = 0.16, n = 46) {
  const R = rng(seed), ph = [R() * 6, R() * 6, R() * 6]; let d = '';
  for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, k = 1 + rough * (Math.sin(a * 3 + ph[0]) * 0.5 + Math.sin(a * 5 + ph[1]) * 0.3 + Math.sin(a * 9 + ph[2]) * 0.2); d += `${i ? 'L' : 'M'} ${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)} `; }
  return d + 'Z';
}

// ---- pictograms (inline SVG strings, drawn in a 100×100 box, stroke = currentColor) ----
const P = (inner, sw = 5) => `<g fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
export const PICT = {
  person: `<g fill="currentColor"><circle cx="50" cy="11" r="9.5"/><path d="M37 25 L63 25 Q72 25 72 34 L72 60 Q72 64 68.5 64 Q65 64 65 60 L65 38 L63 38 L63 96 Q63 100 58.5 100 Q54 100 54 96 L54 64 L46 64 L46 96 Q46 100 41.5 100 Q37 100 37 96 L37 38 L35 38 L35 60 Q35 64 31.5 64 Q28 64 28 60 L28 34 Q28 25 37 25Z"/></g>`,
  hand: P(`<path d="M33 96 Q25 80 22 62 L17 42 Q15 34 21 33 Q27 32 29 40 L33 54 L33 16 Q33 9 39 9 Q45 9 45 16 L45 46 L45 10 Q45 3 51 3 Q57 3 57 10 L57 46 L57 15 Q57 8 63 8 Q69 8 69 15 L69 50 L69 26 Q69 19 75 19 Q81 19 81 26 L81 66 Q81 84 72 96 Z"/>`, 4.5),
  eye: P(`<path d="M6 50 Q50 10 94 50 Q50 90 6 50Z"/><circle cx="50" cy="50" r="15"/><circle cx="50" cy="50" r="5" fill="currentColor"/>`),
  ear: P(`<path d="M62 92 Q40 96 38 74 Q37 62 28 52 Q18 40 26 24 Q36 6 58 10 Q80 15 78 40 Q77 52 66 60"/><path d="M40 40 Q42 26 55 26 Q66 27 65 40 Q64 50 54 54 Q48 58 50 68"/>`),
  bowl: P(`<path d="M10 52 L90 52 Q88 84 50 86 Q12 84 10 52Z"/><path d="M36 92 L64 92"/><path class="st" d="M34 40 Q28 30 34 22 Q40 14 34 6"/><path class="st" d="M50 40 Q44 30 50 22 Q56 14 50 6"/><path class="st" d="M66 40 Q60 30 66 22 Q72 14 66 6"/>`),
  bones: P(`<path d="M18 30 L82 78"/><path d="M82 30 L18 78"/><circle cx="14" cy="26" r="6"/><circle cx="21" cy="24" r="6"/><circle cx="86" cy="26" r="6"/><circle cx="79" cy="24" r="6"/><circle cx="14" cy="82" r="6"/><circle cx="21" cy="84" r="6"/><circle cx="86" cy="82" r="6"/><circle cx="79" cy="84" r="6"/>`, 6),
  star: P(`<path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z"/>`),
  globe: P(`<circle cx="50" cy="50" r="42"/><ellipse cx="50" cy="50" rx="18" ry="42"/><path d="M8 50 L92 50"/><path d="M14 30 Q50 40 86 30"/><path d="M14 70 Q50 60 86 70"/>`, 4.5),
  sat: P(`<rect x="38" y="36" width="24" height="28" rx="4"/><rect x="4" y="40" width="28" height="20" rx="2"/><rect x="68" y="40" width="28" height="20" rx="2"/><path d="M32 50 L38 50"/><path d="M62 50 L68 50"/><path d="M50 36 L50 22"/><path d="M40 16 Q50 8 60 16"/>`, 4.5),
  atom: P(`<circle cx="50" cy="50" r="7" fill="currentColor"/><ellipse cx="50" cy="50" rx="42" ry="16"/><ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(120 50 50)"/>`, 4),
  phone: P(`<rect x="28" y="4" width="44" height="92" rx="9"/><path d="M44 86 L56 86"/>`),
};
export const pict = (name, size, color, style = '') => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="color:${color};overflow:visible;${style}">${PICT[name]}</svg>`;

// ---- ayah card shortcut:  ay(s, 'Qkey', 'REFkey', 'tr line|tr line', t0, t1, {tAr, dAr, trTimes, hl, size, trSize}) ----
export function ay(s, qk, rk, tr, t0, t1, o = {}) { return ayah(s, { ref: REF[rk] || rk, ar: Q[qk], tr, t0, t1, ...o }); }

// ---- chapter card ("PEHLA SAWAL · 1/3") ----
export function chapter(s, n, title, sub, qk, t0, t1) {
  const wrap = s.div('fill', { background: 'radial-gradient(ellipse at 50% 50%, #0b1630 0%, #03060f 60%, #000 100%)' });
  const num = el('div', 'mono cyan', { position: 'absolute', left: '0', right: '0', top: '250px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em' }, `SAWAL ${n} / 3`);
  const h = el('div', 'bebas', { position: 'absolute', left: '0', right: '0', top: '318px', textAlign: 'center', fontSize: '250px', lineHeight: '1', letterSpacing: '.03em' }, title);
  const ar = el('div', 'ar goldgrad', { position: 'absolute', left: '0', right: '0', top: '560px', textAlign: 'center', fontSize: '120px', lineHeight: '1.9' }, Q[qk]);
  const su = el('div', 'mont', { position: 'absolute', left: '0', right: '0', top: '800px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(245,241,232,.75)' }, sub);
  const dots = el('div', null, { position: 'absolute', left: '0', right: '0', top: '900px', display: 'flex', justifyContent: 'center', gap: '22px' });
  for (let i = 1; i <= 3; i++) dots.appendChild(el('div', null, { width: '86px', height: '8px', borderRadius: '4px', background: i <= n ? GOLD : 'rgba(255,255,255,.18)' }));
  wrap.append(num, h, ar, su, dots);
  s.tl.fromTo(num, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 }, t0);
  s.tl.fromTo(h, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, t0 + 0.05).to(h, { scale: 1.05, duration: Math.max(0.2, t1 - t0 - 0.3), ease: 'none' }, t0 + 0.25);
  s.tl.fromTo(ar, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, t0 + 0.45);
  s.tl.fromTo(su, { opacity: 0 }, { opacity: 1, duration: 0.5 }, t0 + 0.8);
  s.tl.fromTo(dots.children, { scaleX: 0 }, { scaleX: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, t0 + 0.3);
  shake(s, h, t0 + 0.25, 0.4, 12);
  s.sfx('braam', Math.max(0, t0 - 0.02), { gain: 0.9 }); s.sfx('hit', t0 + 0.24, { gain: 0.9 }); s.sfx('shimmer', t0 + 0.5, { gain: 0.7 });
  return wrap;
}

// ---- 3D: ancient silver coin ----
function coinCanvas(seed) {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), R = rng(seed), cx = S / 2, cy = S / 2;
  x.fillStyle = '#767676'; x.fillRect(0, 0, S, S);
  x.strokeStyle = '#d6d6d6'; x.lineWidth = 36; x.beginPath(); x.arc(cx, cy, S * 0.46, 0, 6.2832); x.stroke();
  x.fillStyle = '#e6e6e6'; for (let i = 0; i < 60; i++) { const a = i / 60 * 6.2832; x.beginPath(); x.arc(cx + Math.cos(a) * S * 0.402, cy + Math.sin(a) * S * 0.402, 9.5, 0, 6.2832); x.fill(); }
  x.strokeStyle = '#dedede'; x.lineCap = 'round'; x.lineJoin = 'round';
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832 + 0.13; x.save(); x.translate(cx + Math.cos(a) * S * 0.33, cy + Math.sin(a) * S * 0.33); x.rotate(a + Math.PI / 2); x.lineWidth = 9; x.beginPath(); const k = Math.floor(R() * 5);
    if (k === 0) { x.moveTo(-11, 17); x.lineTo(0, -17); x.lineTo(11, 17); } else if (k === 1) { x.moveTo(-10, -17); x.lineTo(-10, 17); x.moveTo(-10, 0); x.lineTo(10, 0); x.moveTo(10, -17); x.lineTo(10, 17); } else if (k === 2) { x.arc(0, 0, 14, 0.7, 5.6); } else if (k === 3) { x.moveTo(-11, -17); x.lineTo(11, -17); x.moveTo(0, -17); x.lineTo(0, 17); } else { x.arc(0, 0, 13, 0, 6.2832); }
    x.stroke(); x.restore(); }
  x.fillStyle = '#e4e4e4'; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 - Math.PI / 2, r = (i % 2 ? 0.1 : 0.232) * S; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill();
  x.fillStyle = '#8c8c8c'; x.beginPath(); x.arc(cx, cy, S * 0.072, 0, 6.2832); x.fill(); x.fillStyle = '#efefef'; x.beginPath(); x.arc(cx, cy, S * 0.04, 0, 6.2832); x.fill();
  for (let i = 0; i < 70; i++) { const a = R() * 6.2832, r = R() * S * 0.47, rr = 18 + R() * 70, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r, g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, `rgba(118,118,118,${(0.22 + R() * 0.34).toFixed(2)})`); g.addColorStop(1, 'rgba(118,118,118,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  x.strokeStyle = 'rgba(40,40,40,.55)'; for (let i = 0; i < 46; i++) { x.lineWidth = 1 + R() * 2.2; x.beginPath(); const a = R() * S, b = R() * S; x.moveTo(a, b); x.lineTo(a + (R() - .5) * 260, b + (R() - .5) * 260); x.stroke(); }
  return c;
}
export function coin(o = {}) {
  const g = new THREE.Group(), mk = (seed) => { const t = new THREE.CanvasTexture(coinCanvas(seed)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const b = new THREE.CanvasTexture(t.image); return { t, b }; };
  const A = mk(o.seed || 41), B = mk((o.seed || 41) + 9), tint = o.tint ?? 0xe4e8f0;
  const face = (m) => new THREE.MeshStandardMaterial({ map: m.t, bumpMap: m.b, bumpScale: o.bump ?? 7, color: tint, metalness: 0.62, roughness: 0.42 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xa2a6ae, metalness: 0.6, roughness: 0.5 });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.085, 120, 1, false), [edge, face(A), face(B)]);
  mesh.rotation.x = Math.PI / 2; g.add(mesh); g.userData.mesh = mesh; return g;
}
// standard light rig for the coin: returns update(lt) that sweeps the key light
export function coinLights(scene, o = {}) {
  scene.add(new THREE.AmbientLight(0x2a3246, o.amb ?? 0.9));
  const key = new THREE.DirectionalLight(o.key ?? 0xfff4e4, o.keyI ?? 2.3), rim = new THREE.PointLight(0x8fc2ff, o.rimI ?? 26, 30), fill = new THREE.PointLight(o.fill ?? 0xdfe8ff, o.fillI ?? 9, 30);
  scene.add(key, rim, fill); rim.position.set(-3.2, 1.6, 1.4); fill.position.set(2.4, -2.2, 3);
  return (lt) => { const a = (o.a0 ?? -0.9) + lt * (o.sp ?? 0.22); key.position.set(Math.sin(a) * 4, 2.2 + Math.sin(lt * 0.4) * 0.6, 3.2 + Math.cos(a) * 1.5); };
}

// ---- 3D: Earth with a quarter wedge removed, showing the layers down to the core ----
export function cutEarth() {
  const g = new THREE.Group(), p0 = 0.875 * Math.PI, pl = 1.5 * Math.PI;
  const outer = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64, p0, pl), new THREE.MeshLambertMaterial({ map: texture('/gfx/tex/earth_day_4k.jpg') }));
  // the texture must stay registered to the globe although the geometry starts at p0: shift u
  outer.material.map.wrapS = THREE.RepeatWrapping; outer.material.map.repeat.set(pl / (2 * Math.PI), 1); outer.material.map.offset.set(p0 / (2 * Math.PI), 0);
  g.add(outer);
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), gr = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  [[0, '#fffbe0'], [0.17, '#ffe98a'], [0.19, '#ffb53a'], [0.52, '#ff7a1c'], [0.545, '#c43a12'], [0.9, '#7a1c0c'], [0.985, '#4a1408'], [0.99, '#3a2a1c'], [1, '#2a2218']].forEach(([p, col]) => gr.addColorStop(p, col));
  x.fillStyle = gr; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; for (const r of [0.19, 0.545, 0.985]) { x.beginPath(); x.arc(S / 2, S / 2, r * S / 2, 0, 6.2832); x.stroke(); }
  const ft = new THREE.CanvasTexture(c); ft.colorSpace = THREE.SRGBColorSpace;
  for (const ph of [p0, p0 + pl]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.999, 64, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ map: ft, side: THREE.DoubleSide, toneMapped: false })); f.rotation.y = Math.PI + ph; g.add(f); }
  const core = glow(0xfff0b0, 0.9, 0.9, 0.1, 2.0); g.add(core); g.userData = { core, outer };
  return g;
}
export { smooth, clamp, lerp };
