// Reusable motion-graphics components. All animation goes on the scene's paused GSAP timeline (s.tl) at local times.
import { el, gsap, SplitText, image, clamp, lerp, ease, noise1, track, W, H, film } from './engine.js';

export function words(node) { return SplitText.create(node, { type: 'words', wordsClass: 'w' }).words; }
export function chars(node) { return SplitText.create(node, { type: 'words,chars', wordsClass: 'w', charsClass: 'c' }).chars; }

// ---- full-frame still with Ken Burns ----  kb: {s0,s1,x0,x1,y0,y1} (scale, % offsets)
export function still(s, src, o = {}) {
  const wrap = s.div('fill', { overflow: 'hidden', ...(o.style || {}) });
  const im = image(src, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: o.fit || 'cover', objectPosition: o.pos || '50% 50%', transformOrigin: o.origin || '50% 50%' });
  wrap.appendChild(im);
  const kb = { s0: 1.06, s1: 1.16, x0: 0, x1: 0, y0: 0, y1: 0, ...(o.kb || {}) };
  const dur = (o.dur || (s.t1 - s.t0)), t0 = o.t0 || 0;
  s.onUpdate((lt) => {
    const k = clamp((lt - t0) / dur); const e = o.linear ? k : (k * k * (3 - 2 * k)) * 0.35 + k * 0.65;
    im.style.transform = `translate(${lerp(kb.x0, kb.x1, e)}%, ${lerp(kb.y0, kb.y1, e)}%) scale(${lerp(kb.s0, kb.s1, e)})`;
  });
  if (o.dim) wrap.appendChild(el('div', 'fill', { background: `rgba(2,4,10,${o.dim})` }));
  return wrap;
}

// ---- footage: pre-extracted frames /frames/<clip>/00001.jpg (30 fps) ----
export function footage(s, clip, o = {}) {
  const wrap = s.div('fill', { overflow: 'hidden', ...(o.style || {}) });
  const im = el('img', null, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', transformOrigin: o.origin || '50% 50%' });
  im.decoding = 'sync'; wrap.appendChild(im);
  const n = o.n, start = o.start || 0, speed = o.speed ?? 1, t0 = o.t0 || 0;
  const kb = { s0: 1.0, s1: 1.0, x0: 0, x1: 0, y0: 0, y1: 0, ...(o.kb || {}) };
  let last = -1;
  s.onUpdate((lt) => {
    let f = Math.floor(start + Math.max(0, lt - t0) * 30 * speed);
    if (o.loop) f = ((f % n) + n) % n; else if (o.ping) { const p = f % (2 * n - 2); f = p < n ? p : 2 * n - 2 - p; } else f = Math.min(n - 1, Math.max(0, f));
    if (f !== last) { last = f; im.src = `/frames/${clip}/${String(f + 1).padStart(5, '0')}.jpg`; track(im.decode()); }
    const k = clamp((lt - t0) / ((s.t1 - s.t0) - t0));
    if (o.kb) im.style.transform = `translate(${lerp(kb.x0, kb.x1, k)}%, ${lerp(kb.y0, kb.y1, k)}%) scale(${lerp(kb.s0, kb.s1, k)})`;
  });
  if (o.dim) wrap.appendChild(el('div', 'fill', { background: `rgba(2,4,10,${o.dim})` }));
  return wrap;
}

// ---- emphasis caption (bottom centre). html may contain <span class="hl">..</span> ----
export function cap(s, html, t0, t1, o = {}) {
  const c = s.div('cap sh ' + (o.cls || ''), { ...(o.style || {}) }, html);
  if (o.size) c.style.fontSize = o.size + 'px';
  if (o.bottom != null) c.style.bottom = o.bottom + 'px';
  const ws = words(c);
  gsap.set(c, { autoAlpha: 0 });
  s.tl.set(c, { autoAlpha: 1 }, t0);
  s.tl.fromTo(ws, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.42, stagger: o.stagger ?? 0.045, ease: 'power3.out' }, t0);
  s.tl.to(c, { opacity: 0, y: -14, duration: 0.28, ease: 'power2.in' }, t1 - 0.28);
  s.tl.set(c, { autoAlpha: 0 }, t1);
  return c;
}

// ---- big headline with per-character reveal ----
export function big(s, html, t0, t1, o = {}) {
  const c = s.div((o.cls || 'bebas sh'), { position: 'absolute', left: (o.x ?? 0) + 'px', top: (o.y ?? 400) + 'px', width: (o.w ?? W) + 'px', textAlign: o.align || 'center', fontSize: (o.size || 190) + 'px', lineHeight: o.lh || '0.95', whiteSpace: o.wrap ? 'normal' : 'nowrap', ...(o.style || {}) }, html);
  const cs = o.by === 'words' ? words(c) : chars(c);
  gsap.set(c, { autoAlpha: 0 });
  s.tl.set(c, { autoAlpha: 1 }, t0);
  const from = o.mode === 'slam' ? { scale: 2.6, opacity: 0 } : o.mode === 'fade' ? { opacity: 0, y: 18 } : { yPercent: 110, opacity: 0, rotate: 6 };
  const to = o.mode === 'slam' ? { scale: 1, opacity: 1, duration: 0.34, ease: 'power4.in', stagger: o.stagger ?? 0.0 } : o.mode === 'fade' ? { opacity: 1, y: 0, duration: 0.6, stagger: o.stagger ?? 0.03, ease: 'power2.out' } : { yPercent: 0, opacity: 1, rotate: 0, duration: 0.55, stagger: o.stagger ?? 0.028, ease: 'back.out(1.5)' };
  if (o.mode === 'slam') s.tl.fromTo(c, from, to, t0); else s.tl.fromTo(cs, from, to, t0);
  if (t1 != null) { s.tl.to(c, { opacity: 0, scale: o.outScale ?? 1.04, duration: 0.3, ease: 'power2.in' }, t1 - 0.3); s.tl.set(c, { autoAlpha: 0 }, t1); }
  return c;
}

// ---- lower third ----
export function lowerThird(s, name, role, t0, t1, o = {}) {
  const c = s.div('lt', { ...(o.style || {}) });
  if (o.right) { c.style.left = 'auto'; c.style.right = '110px'; c.style.textAlign = 'right'; }
  if (o.bottom != null) c.style.bottom = o.bottom + 'px';
  const bar = el('div', 'bar'); const n = el('div', 'name sh', null, name); const r = el('div', 'role sh', null, role);
  if (o.right) { bar.style.left = 'auto'; bar.style.right = '-26px'; }
  c.append(bar, n, r);
  gsap.set(c, { autoAlpha: 0 });
  s.tl.set(c, { autoAlpha: 1 }, t0);
  s.tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: 'power3.out' }, t0);
  s.tl.fromTo(chars(n), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.022, ease: 'power3.out' }, t0 + 0.08);
  s.tl.fromTo(r, { x: o.right ? 30 : -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, t0 + 0.3);
  s.tl.to(c, { opacity: 0, x: o.right ? 40 : -40, duration: 0.32, ease: 'power2.in' }, t1 - 0.32);
  s.tl.set(c, { autoAlpha: 0 }, t1);
  return c;
}

// ---- dateline: big year + place, typewriter ----
export function dateline(s, yr, pl, t0, t1, o = {}) {
  const c = s.div('dl', { ...(o.style || {}) });
  if (o.right) { c.style.left = 'auto'; c.style.right = '110px'; c.style.textAlign = 'right'; }
  const y = el('div', 'yr sh', null, yr), p = el('div', 'pl sh', null, ''), r = el('div', 'rule');
  if (o.right) { r.style.marginLeft = 'auto'; r.style.transformOrigin = '100% 50%'; r.style.background = 'linear-gradient(270deg,var(--cyan),rgba(111,216,255,0))'; }
  c.append(y, r, p);
  gsap.set(c, { autoAlpha: 0 });
  s.tl.set(c, { autoAlpha: 1 }, t0);
  s.tl.fromTo(chars(y), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power4.out' }, t0);
  s.tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, t0 + 0.15);
  const proxy = { n: 0 };
  s.tl.to(proxy, { n: pl.length, duration: Math.max(0.3, pl.length * 0.045), ease: 'none', onUpdate: () => { p.textContent = pl.slice(0, Math.round(proxy.n)) + (proxy.n < pl.length ? '▍' : ''); } }, t0 + 0.3);
  if (t1 != null) { s.tl.to(c, { opacity: 0, duration: 0.3 }, t1 - 0.3); s.tl.set(c, { autoAlpha: 0 }, t1); }
  return c;
}

// ---- stamp ----
export function stamp(s, text, t, o = {}) {
  const c = s.div('stamp ' + (o.cls || 'red'), { left: (o.x ?? 660) + 'px', top: (o.y ?? 440) + 'px', fontSize: (o.size || 120) + 'px', ...(o.style || {}) }, text);
  gsap.set(c, { autoAlpha: 0, rotate: o.rot ?? -9 });
  s.tl.set(c, { autoAlpha: 1 }, t);
  s.tl.fromTo(c, { scale: 3.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'power4.in' }, t);
  s.tl.fromTo(c, { x: 0 }, { x: 0, keyframes: [{ x: -9, duration: 0.04 }, { x: 7, duration: 0.04 }, { x: -4, duration: 0.04 }, { x: 0, duration: 0.05 }] }, t + 0.22);
  if (o.out != null) { s.tl.to(c, { opacity: 0, duration: 0.25 }, o.out - 0.25); s.tl.set(c, { autoAlpha: 0 }, o.out); }
  return c;
}

// ---- white/gold flash ----
export function flash(s, t, o = {}) {
  const f = s.div('flash', { background: o.color || '#fff', zIndex: 40 });
  s.tl.fromTo(f, { opacity: 0 }, { opacity: o.peak ?? 0.9, duration: o.up ?? 0.06, ease: 'none' }, t);
  s.tl.to(f, { opacity: 0, duration: o.dur ?? 0.5, ease: 'power2.out' }, t + (o.up ?? 0.06));
  return f;
}

// ---- number counter (el.textContent) ----
export function counter(s, node, from, to, t, dur, fmt = (v) => Math.round(v).toLocaleString('en-US'), easing = 'power2.out') {
  const p = { v: from }; node.textContent = fmt(from);
  s.tl.to(p, { v: to, duration: dur, ease: easing, onUpdate: () => { node.textContent = fmt(p.v); } }, t);
}

// ---- ayah card ----
// o: {ref, ar, tr (html, lines separated by |), t0, tAr (start of arabic reveal), dAr (duration of reveal), trTimes:[...], hl:{wordIndex:time}, t1, size, trSize}
export function ayah(s, o) {
  const wrap = s.div('ayah-wrap', { ...(o.style || {}) });
  const glowbg = el('div', null, { position: 'absolute', left: '50%', top: '50%', width: '1700px', height: '900px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 50%, rgba(3,6,14,.90) 0%, rgba(3,6,14,.72) 45%, rgba(3,6,14,0) 72%)' });
  wrap.appendChild(glowbg);
  const inner = el('div', null, { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' });
  wrap.appendChild(inner);
  const ref = el('div', 'ayah-ref sh', null, o.ref);
  const o1 = el('div', 'orn', { marginTop: '18px' });
  const ar = el('div', 'ayah-ar glowg', { fontSize: (o.size || 96) + 'px' });
  const aws = o.ar.split(/\s+/).map((w) => { const sp = el('span', 'aw', null, w); ar.appendChild(sp); ar.appendChild(document.createTextNode(' ')); return sp; });
  const o2 = el('div', 'orn', { marginTop: '10px' });
  inner.append(ref, o1, ar, o2);
  const lines = (o.tr || '').split('|').filter(Boolean).map((h) => { const d = el('div', 'ayah-tr sh', { fontSize: (o.trSize || 44) + 'px' }, h); inner.appendChild(d); return d; });
  gsap.set(wrap, { autoAlpha: 0 });
  const t0 = o.t0, tAr = o.tAr ?? t0 + 0.5, dAr = o.dAr ?? Math.min(4, aws.length * 0.45);
  s.tl.set(wrap, { autoAlpha: 1 }, t0);
  s.tl.fromTo(glowbg, { opacity: 0 }, { opacity: 1, duration: 0.8 }, t0);
  s.tl.fromTo(ref, { opacity: 0, y: -16, letterSpacing: '0.7em' }, { opacity: 1, y: 0, letterSpacing: '0.34em', duration: 0.9, ease: 'power2.out' }, t0 + 0.1);
  s.tl.fromTo([o1, o2], { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power2.inOut' }, t0 + 0.2);
  s.tl.fromTo(aws, { opacity: 0, y: 22, scale: 1.12 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out', stagger: dAr / Math.max(1, aws.length) }, tAr);
  lines.forEach((d, i) => {
    const t = (o.trTimes && o.trTimes[i] != null) ? o.trTimes[i] : tAr + dAr + 0.3 + i * 1.2;
    s.tl.fromTo(words(d), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.035, ease: 'power2.out' }, t);
  });
  if (o.hl) for (const [idx, t] of Object.entries(o.hl)) {
    const w = aws[+idx]; if (!w) continue;
    s.tl.to(w, { color: '#F6CF6B', scale: 1.14, duration: 0.5, ease: 'power2.out' }, t);
    s.tl.to(aws.filter((x) => x !== w && !(String(aws.indexOf(x)) in o.hl)), { opacity: 0.38, duration: 0.5 }, t);
  }
  if (o.t1 != null) { s.tl.to(wrap, { opacity: 0, scale: 1.03, duration: 0.5, ease: 'power2.in' }, o.t1 - 0.5); s.tl.set(wrap, { autoAlpha: 0 }, o.t1); }
  return { wrap, ar, aws, lines, ref };
}

// ---- quote block ----
export function quote(s, html, by, t0, t1, o = {}) {
  const c = s.div(null, { position: 'absolute', left: (o.x ?? 200) + 'px', top: (o.y ?? 300) + 'px', width: (o.w ?? 1200) + 'px', ...(o.style || {}) });
  const mark = el('div', 'play gold', { fontSize: '220px', lineHeight: '0.6', height: '90px', opacity: '0.9' }, '“');
  const q = el('div', 'quote sh', { fontSize: (o.size || 62) + 'px' }, html);
  const b = el('div', 'quote-by sh', null, by);
  c.append(mark, q, b);
  gsap.set(c, { autoAlpha: 0 });
  s.tl.set(c, { autoAlpha: 1 }, t0);
  s.tl.fromTo(mark, { opacity: 0, scale: 0.4, transformOrigin: '0 0' }, { opacity: 0.9, scale: 1, duration: 0.5, ease: 'back.out(2)' }, t0);
  s.tl.fromTo(words(q), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: o.stagger ?? 0.07, ease: 'power2.out' }, t0 + 0.25);
  s.tl.fromTo(b, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 }, o.tBy ?? (t0 + 1.2));
  if (t1 != null) { s.tl.to(c, { opacity: 0, duration: 0.35 }, t1 - 0.35); s.tl.set(c, { autoAlpha: 0 }, t1); }
  return c;
}

// ---- framed photo card (pre-graded image) ----
export function photoCard(s, src, r, t0, t1, o = {}) {
  const c = s.div('photo', { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', ...(o.style || {}) });
  const im = image(src, { objectPosition: o.pos || '50% 30%' }); c.appendChild(im);
  c.appendChild(el('div', 'fill', { background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)' }));
  gsap.set(c, { autoAlpha: 0, rotate: o.rot ?? 0 });
  s.tl.set(c, { autoAlpha: 1 }, t0);
  const fromv = o.from || { y: 70, opacity: 0, scale: 0.94 };
  s.tl.fromTo(c, fromv, { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, t0);
  s.tl.fromTo(im, { scale: o.z0 ?? 1.18 }, { scale: o.z1 ?? 1.04, duration: (t1 ?? (s.t1 - s.t0)) - t0, ease: 'none' }, t0);
  if (t1 != null) { s.tl.to(c, { opacity: 0, scale: 1.04, duration: 0.35, ease: 'power2.in' }, t1 - 0.35); s.tl.set(c, { autoAlpha: 0 }, t1); }
  return c;
}

// ---- generic show/hide helper for arbitrary elements ----
export function show(s, node, t0, t1, from = { opacity: 0, y: 24 }, dur = 0.6) {
  gsap.set(node, { autoAlpha: 0 });
  s.tl.set(node, { autoAlpha: 1 }, t0);
  s.tl.fromTo(node, from, { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, duration: dur, ease: 'power3.out' }, t0);
  if (t1 != null) { s.tl.to(node, { opacity: 0, duration: 0.3, ease: 'power2.in' }, t1 - 0.3); s.tl.set(node, { autoAlpha: 0 }, t1); }
  return node;
}

// ---- svg helper ----
export function svg(s, inner, o = {}) {
  const d = s.div(null, { position: 'absolute', left: (o.x ?? 0) + 'px', top: (o.y ?? 0) + 'px', width: (o.w ?? W) + 'px', height: (o.h ?? H) + 'px', ...(o.style || {}) });
  d.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w ?? W}" height="${o.h ?? H}" viewBox="${o.vb || `0 0 ${o.w ?? W} ${o.h ?? H}`}" style="overflow:visible">${inner}</svg>`;
  return d;
}
// subtle procedural camera shake for an element: amp px, decays over dur from t
export function shake(s, node, t, dur = 0.5, amp = 14) {
  s.onUpdate((lt) => {
    const k = (lt - t) / dur; if (k < 0 || k > 1) { if (node._shk) { node.style.translate = '0px 0px'; node._shk = false; } return; }
    const a = amp * Math.pow(1 - k, 2); node.style.translate = `${(noise1(lt * 38, 3) * a).toFixed(2)}px ${(noise1(lt * 41, 9) * a).toFixed(2)}px`; node._shk = true;
  });
}
