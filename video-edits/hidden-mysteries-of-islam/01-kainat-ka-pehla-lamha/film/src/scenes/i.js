// PART I — "Science aaj kahan khadi hai" (spoken lines 256..271).
// All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
import { defScene, stage3d, T, TW, gsap, el, image, clamp, lerp, smooth, ease, rng } from '../engine.js';
import { cap, dateline, stamp, flash, show, footage, photoCard, svg, shake, words } from '../ui.js';
import { starfield } from '../kit3d.js';
import { IMG } from '../assets.js';

// reveal the words of `node` on the spoken words of line `id` (word i of node <-> spoken word from+i)
function sync(s, node, id, o = {}) {
  const ws = words(node), from = o.from || 0;
  ws.forEach((w, i) => {
    const t = Math.max(0, TW(id, o.map ? o.map[i] : from + i) - s.t0 - (o.lead ?? 0.08));
    s.tl.fromTo(w, { opacity: 0, y: o.y ?? 14 }, { opacity: 1, y: 0, duration: o.dur ?? 0.36, ease: o.ease || 'power2.out' }, t);
  });
  return ws;
}
const night = (s, seed, bg) => {                      // quiet star backdrop for the quote scenes
  s.div('fill', { background: bg || 'radial-gradient(ellipse at 50% 42%, #0b1a38 0%, #040813 58%, #010207 100%)' });
  const st = stage3d(s, { fov: 50 }), stars = starfield({ count: 2200, radius: 300, seed, px: 2.4 }); st.scene.add(stars);
  st.frame = (lt) => { stars.rotation.z = lt * 0.01; stars.material.uniforms.time.value = lt; st.camera.position.z = 10 - lt * 0.3; };
};
const BOOK = `<svg width="46" height="40" viewBox="0 0 46 40"><path d="M23 8 C17 3 8 3 2 6 V36 C8 33 17 33 23 38 C29 33 38 33 44 36 V6 C38 3 29 3 23 8 Z M23 8 V38" fill="rgba(233,185,85,.12)" stroke="#E9B955" stroke-width="2.6" stroke-linejoin="round"/></svg>`;

export default function ([P0, P1]) {
  // ───────── I1  stinger "SCIENCE · AAJ" → 2003 · Borde, Guth, Vilenkin · a theorem ─────────
  defScene('i1_science', P0, T('258') + 0.02, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0, tP = L('257') - 0.12;
    footage(s, 'i_deep', { n: 276, speed: clamp(270 / (d * 30), 0.45, 1), kb: { s0: 1.0, s1: 1.1 } });
    const dim = s.div('fill', { background: 'linear-gradient(90deg, rgba(2,6,16,.82) 0%, rgba(2,6,16,.5) 55%, rgba(2,6,16,.35) 100%)' });
    s.tl.fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.6 }, tP);
    // HUD
    const hud = svg(s, [[70, 60, 1, 1], [1850, 60, -1, 1], [70, 1000, 1, -1], [1850, 1000, -1, -1]].map(([x, y, a, b]) => `<path d="M ${x} ${y + 90 * b} L ${x} ${y} L ${x + 90 * a} ${y}" fill="none" stroke="#6FD8FF" stroke-width="5"/>`).join('') +
      `<path d="M 96 540 H 330 M 1590 540 H 1824 M 960 96 V 170 M 960 910 V 984" stroke="rgba(111,216,255,.5)" stroke-width="2"/><rect class="sc" x="70" y="0" width="1780" height="3" fill="#8EE2FF" opacity=".55"/>`);
    s.tl.fromTo(hud, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, 0.05).to(hud, { opacity: 0.35, duration: 0.5 }, tP);
    s.tl.fromTo(hud.querySelector('.sc'), { attr: { y: 70 } }, { attr: { y: 990 }, duration: Math.max(1, tP), ease: 'none' }, 0);
    const hl = s.div('hud sh', { position: 'absolute', left: '110px', top: '96px' }, 'HUBBLE · DEEP FIELD');
    show(s, hl, 0.2, tP, { opacity: 0, x: -20 }, 0.4);
    const hd = s.div(null, { position: 'absolute', left: '0', right: '0', top: '332px', textAlign: 'center' });
    hd.innerHTML = `<div class="bebas glowc" style="font-size:300px;line-height:.92;color:#fff;white-space:nowrap"><span class="a" style="display:inline-block">SCIENCE</span> <span class="b cyan" style="display:inline-block">· AAJ</span></div>
      <div class="mono cyan sh q" style="font-size:46px;font-weight:700;letter-spacing:.42em;margin-top:30px">KAHAN KHADI HAI?</div>`;
    const tSl = Math.max(0.1, L('256', 1) - 0.12);
    s.tl.fromTo(hd.querySelector('.a'), { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power4.in' }, tSl);
    s.tl.fromTo(hd.querySelector('.b'), { opacity: 0, x: 70 }, { opacity: 1, x: 0, duration: 0.4 }, L('256', 2) - 0.08);
    s.tl.fromTo(words(hd.querySelector('.q')), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1 }, Math.max(tSl + 0.2, L('256', 3) - 0.08));
    s.sfx('whoosh', 0, { gain: 0.7 }); s.sfx('hit', tSl + 0.22); shake(s, hd, tSl + 0.22, 0.4, 12);
    s.tl.to(hd, { scale: 1.12, duration: tP, ease: 'none' }, 0).to(hd, { opacity: 0, duration: 0.25, ease: 'power2.in' }, tP - 0.2).set(hd, { autoAlpha: 0 }, tP + 0.06);
    // 2003
    dateline(s, '2003', 'TEEN COSMOLOGISTS', tP + 0.08, null); s.sfx('type', tP + 0.4, { dur: 0.7 });
    const NAMES = ['ARVIND BORDE', 'ALAN GUTH', 'ALEXANDER VILENKIN'], tN = [L('257', 5), L('257', 6), L('257', 8)].map((t) => t - 0.1);
    const nm = s.div(null, { position: 'absolute', left: '110px', top: '410px' }, NAMES.map((n) => `<div class="bebas sh" style="font-size:104px;line-height:1.06;display:flex;align-items:center;gap:26px;white-space:nowrap"><span style="display:inline-block;width:18px;height:18px;transform:rotate(45deg);background:#6FD8FF"></span>${n}</div>`).join(''));
    [...nm.children].forEach((r, i) => { s.tl.fromTo(r, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.45, ease: 'back.out(1.6)' }, tN[i]); s.sfx('pop', tN[i] + 0.05); });
    // the paper
    const R = rng(77), bars = (n) => Array.from({ length: n }, (_, i) => `<div style="height:11px;margin-top:14px;border-radius:2px;background:rgba(27,26,23,.3);width:${i === n - 1 ? 46 : 86 + Math.round(R() * 14)}%"></div>`).join('');
    const paper = s.div(null, { position: 'absolute', left: '1050px', top: '150px', width: '740px', height: '700px', background: 'linear-gradient(180deg,#F3EEE2,#DDD6C6)', borderRadius: '6px', boxShadow: '0 40px 120px rgba(0,0,0,.75)', color: '#1b1a17', overflow: 'hidden' });
    paper.innerHTML = `<div style="background:#1d3557;color:#fff;padding:22px 40px 16px;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:42px;letter-spacing:.13em;white-space:nowrap">PHYSICAL REVIEW LETTERS</div>
      <div class="mono" style="padding:16px 40px 0;font-size:21px;font-weight:700;letter-spacing:.14em;color:#55524a">VOL. 90 · 151301 · 2003</div>
      <div class="au" style="padding:24px 40px 0;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:40px;line-height:1.3"><span>Arvind Borde,</span> <span>Alan H. Guth,</span> <span>Alexander Vilenkin</span></div>
      <div style="margin:22px 40px 0;height:2px;background:rgba(27,26,23,.55)"></div>
      <div style="padding:6px 40px 0">${bars(5)}<div class="mono" style="margin-top:30px;font-size:24px;font-weight:700;letter-spacing:.3em;color:#1d3557">THEOREM</div>${bars(4)}</div>`;
    const tPa = Math.max(tP + 0.2, L('257', 3) - 0.15);
    gsap.set(paper, { autoAlpha: 0 }); s.tl.set(paper, { autoAlpha: 1 }, tPa).fromTo(paper, { opacity: 0, x: 140, rotate: 7 }, { opacity: 1, x: 0, rotate: 1.6, duration: 0.7, ease: 'power3.out' }, tPa);
    s.sfx('paper', tPa);
    [...paper.querySelectorAll('.au span')].forEach((a, i) => { a.style.background = 'linear-gradient(#FFD75E,#FFD75E) no-repeat 0 88% / 0% 42%'; s.tl.to(a, { backgroundSize: '100% 42%', duration: 0.35, ease: 'power2.out' }, tN[i] + 0.05); });
    const tSt = Math.min(L('257', 12) - 0.08, d - 0.9);
    stamp(s, 'THEOREM SABIT', tSt, { x: 1100, y: 660, size: 84, rot: -7, cls: 'st', style: { color: '#0E8F50', background: 'rgba(243,238,226,.82)' } });
    s.sfx('hit', tSt + 0.22, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── I2  the BGV result on NASA's expansion funnel: trace it back → "MAAZI KI HAD" ─────────
  defScene('i3_had', T('258'), T('260') + 0.27, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tB = L('258', 8) - 0.1, tE = Math.max(tB + 0.8, L('258', 12) - 0.05), tI = Math.max(tB + 0.2, Math.min(L('258', 10) - 0.1, tE - 0.4)), tH = L('259', 1) - 0.12, tHad = Math.max(tH + 0.3, L('259', 4) - 0.1);
    footage(s, 'i_funnel', { n: 288, speed: clamp(282 / (d * 30), 0.45, 1) });
    s.div('scrim-t');
    const A = [518, 500, 228], B = [1562, 565, 412];              // funnel in the footage: past end (x, y, half-height) ↔ today's rim
    s.div(null, { position: 'absolute', left: '-10px', top: '290px', width: '440px', height: '420px', background: 'radial-gradient(ellipse at 50% 50%, rgba(2,4,10,.8) 0%, rgba(2,4,10,.5) 45%, rgba(2,4,10,0) 70%)' });
    const o = svg(s, `<ellipse class="rim" cx="${B[0]}" cy="${B[1]}" rx="${B[2] * 0.19}" ry="${B[2]}" fill="none" stroke="#6FD8FF" stroke-width="5"/>
      <g class="ar" stroke="#6FD8FF" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path class="a1" d="M 1562 138 V 100 M 1546 116 L 1562 98 L 1578 116"/><path class="a2" d="M 1652 565 H 1700 M 1684 549 L 1702 565 L 1684 581"/></g>
      <g class="ax" stroke="#6FD8FF" fill="none" stroke-width="4" stroke-linecap="round"><path d="M 870 962 H 1250"/><path d="M 1228 947 L 1252 962 L 1228 977"/></g>
      <ellipse class="r0" fill="none" stroke="rgba(111,216,255,.25)" stroke-width="16"/><ellipse class="r1" fill="none" stroke="#8EE2FF" stroke-width="5"/>
      <g class="inf" transform="translate(212 500)"><path d="M 0 0 C 26 -56 100 -56 100 0 C 100 56 26 56 0 0 C -26 -56 -100 -56 -100 0 C -100 56 -26 56 0 0 Z" fill="none" stroke="#F5F1E8" stroke-width="13" stroke-linejoin="round"/></g>
      <g class="xx" stroke="#FF4B4B" stroke-width="20" stroke-linecap="round" fill="none"><path class="x1" d="M 132 428 L 292 572"/><path class="x2" d="M 292 428 L 132 572"/></g>
      <g class="bnd" fill="none"><ellipse cx="${A[0]}" cy="${A[1]}" rx="37" ry="${A[2] + 4}" stroke="rgba(242,201,104,.28)" stroke-width="22"/><ellipse class="b1" cx="${A[0]}" cy="${A[1]}" rx="37" ry="${A[2] + 4}" stroke="#F8DE9A" stroke-width="7"/><path class="ld" d="M 505 738 L 400 806" stroke="#F2C968" stroke-width="4" stroke-linecap="round"/></g>`);
    const q = (c) => o.querySelector(c), rim = q('.rim'), arr = q('.ar'), r0 = q('.r0'), r1 = q('.r1'), inf = q('.inf'), bnd = q('.bnd');
    const tag = s.div('mono sh', { position: 'absolute', left: '0', top: '0', fontSize: '26px', fontWeight: 700, letterSpacing: '.3em', color: '#8EE2FF', whiteSpace: 'nowrap' }, '◀◀ MAAZI');
    const wq = s.div('mono cyan sh', { position: 'absolute', left: '990px', top: '906px', fontSize: '26px', fontWeight: 700, letterSpacing: '.34em' }, 'WAQT');
    gsap.set([inf, bnd, q('.xx')], { opacity: 0 });
    s.tl.fromTo([q('.ax'), wq], { opacity: 0 }, { opacity: 0.9, duration: 0.5 }, 0.3);
    s.onUpdate((lt) => {
      const ex = smooth(0.25, 0.8, lt) * (1 - smooth(tB - 0.25, tB + 0.15, lt)), pu = (lt * 0.9) % 1;        // "phailti rahi": today's rim keeps widening
      rim.setAttribute('ry', (B[2] * (1 + 0.035 * pu)).toFixed(1)); rim.setAttribute('rx', (B[2] * 0.19 * (1 + 0.035 * pu)).toFixed(1)); rim.setAttribute('opacity', (ex * (1 - 0.6 * pu)).toFixed(3));
      arr.setAttribute('opacity', ex.toFixed(3)); q('.a1').setAttribute('transform', `translate(0 ${(-16 * pu).toFixed(1)})`); q('.a2').setAttribute('transform', `translate(${(16 * pu).toFixed(1)} 0)`);
      const u = 1 - ease.io3(clamp((lt - tB) / (tE - tB))), hit = lt > tE ? Math.exp(-(lt - tE) * 5) * Math.abs(Math.sin((lt - tE) * 26)) : 0;   // scan back in time: 1 = today … 0 = the boundary
      const cx = lerp(A[0], B[0], u) + 26 * hit, cy = lerp(A[1], B[1], u), ry = A[2] + (B[2] - A[2]) * Math.pow(u, 1.6), rx = ry * lerp(0.155, 0.19, u);
      const vis = lt < tB ? 0 : 1 - smooth(tH - 0.1, tH + 0.3, lt);
      [r0, r1].forEach((r) => { r.setAttribute('cx', cx.toFixed(1)); r.setAttribute('cy', cy.toFixed(1)); r.setAttribute('rx', rx.toFixed(1)); r.setAttribute('ry', ry.toFixed(1)); r.setAttribute('opacity', vis.toFixed(3)); });
      r1.setAttribute('stroke', lt > tE ? '#FF6B6B' : '#8EE2FF');
      tag.style.transform = `translate(${(cx - 100).toFixed(1)}px, ${(cy - ry - 56).toFixed(1)}px)`; tag.style.opacity = (lt < tB ? 0 : 1 - smooth(tE - 0.1, tE + 0.3, lt)).toFixed(3);
    });
    s.sfx('rewind', tB, { dur: tE - tB, gain: 0.8 });
    // the statement, on its words
    const mk = (html, top) => s.div('mont sh', { position: 'absolute', left: '110px', top: top + 'px', fontSize: '52px', fontWeight: 800, whiteSpace: 'nowrap' }, html);
    const hA = mk('Jo kainat ausatan <span style="color:#8EE2FF">phailti rahi</span> ho…', 92), hB = mk('…woh <span style="color:#FF6B6B">hamesha se nahi</span> ho sakti', 164);
    sync(s, hA, '258', { y: 20 }); s.tl.to(hA, { opacity: 0, duration: 0.3 }, tH - 0.2).set(hA, { autoAlpha: 0 }, tH + 0.12);
    sync(s, hB, '258', { map: [7, 10, 11, 12, 13, 14], y: 20 }); s.tl.to(hB, { opacity: 0, duration: 0.3 }, tH - 0.2).set(hB, { autoAlpha: 0 }, tH + 0.12);
    // "hamesha se" = ∞ … struck out
    s.tl.fromTo(inf, { opacity: 0 }, { opacity: 0.95, duration: 0.4 }, tI);
    s.tl.set(q('.xx'), { opacity: 1 }, tE).fromTo(q('.x1'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, tE).fromTo(q('.x2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, tE + 0.14);
    s.sfx('slash', tE); s.sfx('buzz', tE + 0.14, { gain: 0.7 });
    s.tl.to([inf, q('.xx')], { opacity: 0.4, duration: 0.4 }, tH);
    // the boundary
    s.tl.set(bnd, { opacity: 1 }, tH).fromTo(q('.b1'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.5, ease: 'power2.out' }, tH).fromTo(q('.ld'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35 }, tH + 0.2);
    const lb = s.div('bebas', { position: 'absolute', left: '110px', top: '800px', fontSize: '134px', lineHeight: '1', whiteSpace: 'nowrap' }, ['MAAZI', 'KI', 'HAD'].map((w) => `<span class="goldgrad" style="display:inline-block;padding-top:8px;margin-right:.2em">${w}</span>`).join(''));
    [L('259', 1) - 0.1, L('259', 2) - 0.08, tHad].forEach((t, i) => s.tl.fromTo(lb.children[i], { opacity: 0, scale: i === 2 ? 2.4 : 1, y: i === 2 ? 0 : 30 }, { opacity: 1, scale: 1, y: 0, duration: i === 2 ? 0.2 : 0.4, ease: i === 2 ? 'power4.in' : 'power3.out' }, Math.max(tH, t)));
    s.sfx('hit', tHad + 0.2); shake(s, lb, tHad + 0.2, 0.4, 12); flash(s, tHad + 0.18, { color: '#F8DE9A', peak: 0.28, dur: 0.6 });
    s.onUpdate((lt) => { if (lt > tH) bnd.setAttribute('opacity', (0.78 + 0.22 * Math.sin((lt - tH) * 6)).toFixed(3)); });
    s.div('vig');
  });

  // ───────── I3  Vilenkin: "…nahi chhup sakte. Bhaagne ka koi raasta nahi." — every exit is shut ─────────
  defScene('i4_vilenkin', T('260'), T('263') + 0.27, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    night(s, 61);
    const X0 = 80, X1 = 1840, Y0 = 70, Y1 = 985, EX = [[640, Y0, 0, -1], [1280, Y0, 0, -1], [X1, 527, 1, 0], [1180, Y1, 0, 1], [600, Y1, 0, 1], [X0, 527, -1, 0]];   // x, y, outward normal
    const sg = (a, b, c, e) => `M ${a} ${b} L ${c} ${e} `;
    const fr = sg(X0, Y0, 565, Y0) + sg(715, Y0, 1205, Y0) + sg(1355, Y0, X1, Y0) + sg(X1, Y0, X1, 452) + sg(X1, 602, X1, Y1) + sg(X1, Y1, 1255, Y1) + sg(1105, Y1, 675, Y1) + sg(525, Y1, X0, Y1) + sg(X0, Y1, X0, 602) + sg(X0, 452, X0, Y0);
    const g = svg(s, `<path d="${fr}" fill="none" stroke="#6FD8FF" stroke-width="4" class="f1"/><path d="${fr}" fill="none" stroke="#FF4B4B" stroke-width="5" class="f2" opacity="0"/>` +
      EX.map(() => `<g class="ea" fill="none" stroke="#8EE2FF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M -28 -22 L -4 0 L -28 22 M 0 -22 L 24 0 L 0 22"/></g>`).join('') +
      EX.map(() => `<g class="eb"><rect x="-10" y="-92" width="20" height="184" rx="4" fill="#FF4B4B"/><path d="M -34 -24 L 14 24 M 14 -24 L -34 24" stroke="#fff" stroke-width="7" stroke-linecap="round" transform="translate(10 0)"/></g>`).join(''));
    const ea = [...g.querySelectorAll('.ea')], eb = [...g.querySelectorAll('.eb')], f1 = g.querySelector('.f1'), f2 = g.querySelector('.f2');
    const tX = L('261') - 0.1, step = Math.max(0.12, (T('262e') - T('262') - 0.2) / 5), tb = EX.map((_, i) => L('262') - 0.06 + i * step), tLast = tb[5] + 0.16;
    s.onUpdate((lt) => {
      EX.forEach(([x, y, nx, ny], i) => {
        const ang = Math.atan2(ny, nx) * 180 / Math.PI, pu = (lt * 1.1 + i * 0.17) % 1, k = clamp((lt - tb[i]) / 0.16), kk = k * k * k;
        ea[i].setAttribute('transform', `translate(${(x + nx * (8 + 22 * pu)).toFixed(1)} ${(y + ny * (8 + 22 * pu)).toFixed(1)}) rotate(${ang})`);
        ea[i].setAttribute('opacity', (smooth(tX + i * 0.08, tX + 0.4 + i * 0.08, lt) * (1 - 0.5 * pu) * (1 - k)).toFixed(3));
        eb[i].setAttribute('transform', `translate(${(x + nx * 90 * (1 - kk)).toFixed(1)} ${(y + ny * 90 * (1 - kk)).toFixed(1)}) rotate(${ang})`); eb[i].setAttribute('opacity', k > 0 ? '1' : '0');
      });
      const rk = smooth(tLast, tLast + 0.3, lt); f1.setAttribute('opacity', (1 - rk).toFixed(3)); f2.setAttribute('opacity', rk.toFixed(3));
    });
    tb.forEach((t, i) => s.sfx(i % 2 === 0 || i === 5 ? 'slam' : 'tick', t + 0.14, { gain: 0.55 + 0.08 * i }));
    const qb = s.div(null, { position: 'absolute', left: '250px', top: '180px', width: '1420px' });
    qb.innerHTML = `<div class="play gold mk" style="font-size:220px;line-height:.6;height:92px;opacity:.9">“</div>
      <div class="quote sh q1" style="font-size:70px;line-height:1.28">Cosmologists ab ek <span style="color:#F2C968">hamesha-se-maujood kainat</span> ke peeche nahi chhup sakte.</div>
      <div class="play sh q2" style="font-size:104px;font-weight:800;font-style:italic;line-height:1.1;margin-top:36px;color:#fff;white-space:nowrap">Bhaagne ka koi <span style="color:#FF6B6B">raasta nahi.”</span></div>
      <div class="quote-by sh by" style="margin-top:44px">ALEXANDER VILENKIN · <span style="color:#F5F1E8">Many Worlds in One (2006)</span></div>`;
    s.tl.fromTo(qb.querySelector('.mk'), { opacity: 0, scale: 0.4, transformOrigin: '0 0' }, { opacity: 0.9, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.1);
    s.tl.fromTo(qb.querySelector('.by'), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5 }, 0.15);
    sync(s, qb.querySelector('.q1'), '261', { y: 16 }); sync(s, qb.querySelector('.q2'), '262', { y: 26, dur: 0.3 });
    s.sfx('pop', 0.15, { gain: 0.6 }); shake(s, qb, tLast, 0.4, 9);
    s.tl.to(qb, { scale: 1.03, duration: d, ease: 'none' }, 0);
    s.div('vig');
  }, { fin: 0.25, z: 1 });

  // ───────── I4  Hawking: "kainat — aur khud waqt — ki ibtida Big Bang se hui" ─────────
  defScene('i5_hawking', T('263'), T('265') + 0.27, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tW = L('264', 11) - 0.1, tI = Math.max(tW + 0.5, L('264', 14) - 0.1), tBB = Math.max(tI + 0.3, L('264', 16) - 0.08);
    night(s, 14, 'radial-gradient(ellipse at 62% 44%, #0c1c3c 0%, #040813 58%, #010207 100%)');
    const pc = photoCard(s, IMG.hawking, { x: 110, y: 120, w: 640, h: 800 }, 0.05, null, { pos: '50% 50%', z0: 1.12, z1: 1.0, from: { x: -90, opacity: 0, scale: 0.96 } });
    s.sfx('camera', 0.1, { gain: 0.7 });
    const nmh = el('div', 'bebas sh', { position: 'absolute', left: '32px', bottom: '22px', fontSize: '84px', lineHeight: '1' }, 'STEPHEN HAWKING'), cr = el('div', 'mono', { position: 'absolute', right: '18px', top: '14px', fontSize: '16px', fontWeight: 700, letterSpacing: '.2em', color: 'rgba(245,241,232,.6)' }, 'PHOTO: NASA');
    pc.append(nmh, cr); s.tl.fromTo(nmh, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, Math.max(0.2, L('263', 1) - 0.1));
    const qb = s.div(null, { position: 'absolute', left: '836px', top: '150px', width: '970px' });
    qb.innerHTML = `<div class="play gold mk" style="font-size:220px;line-height:.6;height:92px;opacity:.9">“</div>
      <div class="quote sh q1" style="font-size:67px;line-height:1.3">Taqreeban har koi ab yeh maanta hai ke kainat — aur <span class="kw" style="display:inline-block;margin:0 .1em">khud waqt</span> — ki ibtida <span class="bb" style="display:inline-block">Big Bang</span> se hui.”</div>
      <div class="quote-by sh by" style="font-size:24px;letter-spacing:.14em;white-space:nowrap">STEPHEN HAWKING · <span style="color:#F5F1E8">The Nature of Space and Time (1996)</span></div>`;
    s.tl.fromTo(qb.querySelector('.mk'), { opacity: 0, scale: 0.4, transformOrigin: '0 0' }, { opacity: 0.9, scale: 1, duration: 0.5, ease: 'back.out(2)' }, Math.max(0.3, L('263', 3) - 0.1));
    s.tl.fromTo(qb.querySelector('.by'), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5 }, Math.max(0.35, L('263', 3)));
    sync(s, qb.querySelector('.q1'), '264', { y: 16 });
    s.tl.to(qb.querySelector('.kw'), { color: '#F6CF6B', scale: 1.04, textShadow: '0 0 28px rgba(233,185,85,.6), 0 3px 14px rgba(0,0,0,.8)', duration: 0.4, ease: 'back.out(2)' }, tW + 0.12);
    s.tl.to(qb.querySelector('.bb'), { color: '#8EE2FF', duration: 0.3 }, tBB + 0.1);
    // time itself starts here: a clock that runs back to zero, then the axis of time is drawn out of it
    const cxk = 884, cyk = 806;
    const g = svg(s, `<g class="ck"><circle cx="${cxk}" cy="${cyk}" r="50" fill="rgba(10,8,2,.75)" stroke="#F2C968" stroke-width="5"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<line x1="${cxk}" y1="${cyk - 42}" x2="${cxk}" y2="${cyk - (i % 3 ? 37 : 32)}" stroke="#F2C968" stroke-width="3" transform="rotate(${i * 30} ${cxk} ${cyk})"/>`).join('')}
      <line class="h1" x1="${cxk}" y1="${cyk + 6}" x2="${cxk}" y2="${cyk - 34}" stroke="#FFF3D2" stroke-width="4" stroke-linecap="round"/><line class="h2" x1="${cxk}" y1="${cyk + 4}" x2="${cxk}" y2="${cyk - 22}" stroke="#FFF3D2" stroke-width="6" stroke-linecap="round"/><circle cx="${cxk}" cy="${cyk}" r="5" fill="#FFF3D2"/></g>
      <circle class="bg" cx="${cxk}" cy="${cyk}" r="50" fill="none" stroke="#fff" stroke-width="6" opacity="0"/>
      <path class="axl" d="M ${cxk + 50} ${cyk} H 1760" fill="none" stroke="#6FD8FF" stroke-width="4"/><path class="axh" d="M 1738 ${cyk - 16} L 1764 ${cyk} L 1738 ${cyk + 16}" fill="none" stroke="#6FD8FF" stroke-width="4" stroke-linecap="round"/>
      <path class="tk" d="${[0, 1, 2, 3, 4, 5].map((i) => `M ${1050 + i * 120} ${cyk - 10} V ${cyk + 10}`).join(' ')}" stroke="rgba(111,216,255,.7)" stroke-width="3"/>`);
    const h1 = g.querySelector('.h1'), h2 = g.querySelector('.h2'), bgc = g.querySelector('.bg');
    gsap.set([g.querySelector('.ck'), g.querySelector('.axh'), g.querySelector('.tk')], { opacity: 0 });
    s.tl.to(g.querySelector('.ck'), { opacity: 1, duration: 0.3 }, tW).fromTo(g.querySelector('.axl'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut' }, tI).to([g.querySelector('.axh'), g.querySelector('.tk')], { opacity: 1, duration: 0.3 }, tI + 0.8);
    s.onUpdate((lt) => {
      const k = ease.out3(clamp((lt - tW) / Math.max(0.5, tI - tW))); h1.setAttribute('transform', `rotate(${(-1080 * (1 - k)).toFixed(1)} ${cxk} ${cyk})`); h2.setAttribute('transform', `rotate(${(-150 * (1 - k)).toFixed(1)} ${cxk} ${cyk})`);
      const b = clamp((lt - tBB) / 0.9); bgc.setAttribute('r', (50 + 150 * ease.out3(b)).toFixed(1)); bgc.setAttribute('opacity', (lt > tBB ? 0.9 * (1 - b) : 0).toFixed(3));
    });
    s.sfx('clock', tW, { dur: Math.max(0.5, tI - tW), gain: 0.8 });
    const t0l = s.div('mono sh', { position: 'absolute', left: (cxk - 60) + 'px', top: (cyk + 62) + 'px', width: '120px', textAlign: 'center', fontSize: '28px', fontWeight: 700, color: '#F8DE9A' }, 't = 0');
    const wql = s.div('mono cyan sh', { position: 'absolute', left: '1620px', top: (cyk - 56) + 'px', fontSize: '26px', fontWeight: 700, letterSpacing: '.34em' }, 'WAQT');
    const bbl = s.div('bebas sh', { position: 'absolute', left: (cxk + 76) + 'px', top: (cyk - 84) + 'px', fontSize: '64px', lineHeight: '1', color: '#fff' }, 'BIG BANG');
    show(s, t0l, tI - 0.05, null, { opacity: 0, y: -10 }, 0.4); show(s, wql, tI + 0.7, null, { opacity: 0, x: -20 }, 0.4); show(s, bbl, tBB, null, { opacity: 0, x: -24 }, 0.35);
    s.sfx('hit', tBB + 0.05, { gain: 0.7 }); flash(s, tBB, { peak: 0.22, dur: 0.6 });
    s.div('vig');
  }, { fin: 0.25, z: 2 });

  // ───────── I5  honesty beat ("behas jaari hai") → the old fortress falls: GIR CHUKA HAI ─────────
  defScene('i6_qila', T('265'), T('267') + 0.37, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tF = L('266') - 0.15, tK = Math.max(tF + 0.5, L('266', 8) - 0.1), tC = Math.max(tK + 0.3, L('266', 11) - 0.06), tS = Math.min(Math.max(tC + 0.3, L('266', 12) - 0.05), d - 0.95);
    night(s, 27);
    // A — what came "before"? an open question
    const pa = s.div('fill'), CX = 960, CY = 440;
    pa.innerHTML = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0;overflow:visible"><defs><linearGradient id="i6g" x1="0" x2="1"><stop offset="0" stop-color="#8EE2FF" stop-opacity="0"/><stop offset="1" stop-color="#8EE2FF" stop-opacity=".8"/></linearGradient></defs>
        <path class="rt" d="M ${CX} ${CY} H 1700" stroke="#6FD8FF" stroke-width="5" fill="none"/><path class="rh" d="M 1676 ${CY - 18} L 1706 ${CY} L 1676 ${CY + 18}" stroke="#6FD8FF" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="lf" d="M 220 ${CY} H ${CX}" stroke="url(#i6g)" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round" fill="none"/></svg>
      <div style="position:absolute;left:${CX - 170}px;top:${CY - 170}px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle, rgba(255,246,214,1) 0%, rgba(248,222,154,.85) 9%, rgba(233,185,85,.3) 30%, rgba(233,185,85,0) 68%)" class="bb"></div>
      <div class="bebas sh ib" style="position:absolute;left:${CX - 200}px;width:400px;text-align:center;top:${CY - 190}px;font-size:84px;line-height:1">IBTIDA</div>
      <div class="mono cyan sh wq" style="position:absolute;right:214px;top:${CY + 30}px;font-size:26px;font-weight:700;letter-spacing:.3em;white-space:nowrap">WAQT · 13.8 ARAB SAAL</div>
      ${[[610, 250, 150], [400, 480, 210], [240, 290, 120]].map(([x, y, sz]) => `<div class="anton qm" style="position:absolute;left:${x}px;top:${y}px;font-size:${sz}px;line-height:1;color:rgba(142,226,255,.8);text-shadow:0 0 30px rgba(111,216,255,.4)">?</div>`).join('')}
      <div class="play sh ph" style="position:absolute;left:560px;top:${CY + 46}px;font-size:92px;font-style:italic;font-weight:700;color:#fff">“pehle”</div>
      <div class="pm mono sh" style="position:absolute;left:560px;top:${CY + 196}px;font-size:26px;font-weight:700;letter-spacing:.3em;color:rgba(245,241,232,.7)">PHYSICS MEIN</div>
      <div class="tg" style="position:absolute;left:560px;top:${CY + 244}px"><span class="tag cyan sh" style="font-size:40px;padding:12px 26px 10px;background:rgba(4,16,30,.7)"><i class="dot" style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#6FD8FF;margin-right:18px"></i>BEHAS JAARI HAI</span></div>`;
    const P = (c) => pa.querySelector(c), qm = [...pa.querySelectorAll('.qm')];
    s.tl.fromTo(P('.bb'), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, 0.1).fromTo(P('.rt'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.out' }, 0.3)
      .fromTo([P('.rh'), P('.wq')], { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.0).fromTo(P('.ib'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, Math.max(0.3, L('265', 3) - 0.1));
    const tPh = L('265', 5) - 0.1;
    s.tl.fromTo(P('.lf'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, tPh - 0.2).fromTo(P('.ph'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5 }, tPh)
      .fromTo(qm, { opacity: 0, scale: 0.3, rotate: -30 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.5, stagger: 0.16, ease: 'back.out(2)' }, tPh + 0.1)
      .fromTo(P('.pm'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, L('265', 10) - 0.1).fromTo(P('.tg'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45 }, L('265', 12) - 0.1);
    s.onUpdate((lt) => { if (lt > tF + 0.5) return; qm.forEach((e, i) => { e.style.translate = `0px ${(Math.sin(lt * 1.3 + i * 2.1) * 12).toFixed(1)}px`; }); P('.dot').style.opacity = ((lt * 1.6) % 1 < 0.55 ? 1 : 0.2).toFixed(1); });
    s.sfx('pop', tPh + 0.1, { gain: 0.6 }); s.sfx('tick', L('265', 12) - 0.05);
    cap(s, 'Haan — us ibtida se <span class="hc">“pehle”</span> kya tha…', 0.05, L('265', 8) - 0.1, { bottom: 120 });
    cap(s, 'is par physics mein <span class="hc">behas jaari hai</span>', L('265', 8) - 0.04, tF + 0.1, { bottom: 120 });
    s.tl.to(pa, { opacity: 0, scale: 0.96, duration: 0.35, ease: 'power2.in' }, tF - 0.1).set(pa, { autoAlpha: 0 }, tF + 0.27);
    // B — the fortress "KAINAT HAMESHA SE HAI" (stone blocks → cracks → falls under gravity)
    const cv = el('canvas', null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' }); cv.width = 1920; cv.height = 1080; s.add(cv);
    const c2 = cv.getContext('2d'), R = rng(905), G = 2600, GY = 905, blocks = [];
    const addB = (x, y, w, h) => {
      const bx = x + w / 2, by = y + h / 2, heap = 150 * Math.exp(-Math.pow((bx - 960) / 430, 2)) + 56, yEnd = Math.max(by, GY - h / 2 - R() * heap);
      blocks.push({ w, h, bx, by, sh: 0.8 + R() * 0.42, vx: (bx - 960) * 0.1 + (R() - 0.5) * 240, om: (R() - 0.5) * 6, dl: 0.02 + Math.abs(bx - 960) / 1500 * 0.42 + R() * 0.12, yEnd, tl: Math.sqrt(2 * Math.max(0, yEnd - by) / G) });
    };
    for (let r = 0; r < 6; r++) for (let c = 0; c < 15; c++) {
      const x = 470 + c * 70 - (r % 2 ? 35 : 0), x0 = Math.max(470, x), x1 = Math.min(1450, x + 70), y = GY - (r + 1) * 46, bx = (x0 + x1) / 2, by = y + 23;
      if (x1 - x0 < 10 || (Math.abs(bx - 960) < 80 && by > GY - 125) || Math.hypot(bx - 960, by - (GY - 125)) < 80) continue; addB(x0, y, x1 - x0, 46);
    }
    for (let c = 0; c < 14; c += 2) addB(475 + c * 70, GY - 276 - 40, 60, 40);
    for (const tx of [320, 1440]) {
      for (let r = 0; r < 10; r++) for (const [a, b] of (r % 2 ? [[0, 40], [40, 120], [120, 160]] : [[0, 80], [80, 160]])) addB(tx + a, GY - (r + 1) * 46, b - a, 46);
      for (const a of [0, 58, 116]) addB(tx + a, GY - 460 - 46, 44, 46);
    }
    const cracks = [[[936, 632], [958, 668], [940, 700], [972, 742], [952, 790], [985, 838], [968, 900]], [[706, 632], [724, 676], [700, 712], [742, 760], [730, 812]], [[1214, 640], [1190, 690], [1216, 726], [1176, 780], [1160, 836]]];
    const dust = Array.from({ length: 30 }, () => ({ x: 360 + R() * 1200, y: GY - R() * 130, t0: R() * 0.55, r0: 40 + R() * 60, r1: 190 + R() * 220, a: 0.15 + R() * 0.15 }));
    s.tl.fromTo(cv, { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, tF);
    s.onUpdate((lt) => {
      c2.clearRect(0, 0, 1920, 1080); if (lt < tF - 0.05) return;
      const gr = c2.createLinearGradient(0, GY, 0, 1080); gr.addColorStop(0, '#0a1222'); gr.addColorStop(1, '#02040a'); c2.fillStyle = gr; c2.fillRect(0, GY, 1920, 1080 - GY); c2.fillStyle = 'rgba(140,170,220,.22)'; c2.fillRect(0, GY, 1920, 2);
      if (lt < tC) { c2.fillStyle = '#01030a'; c2.beginPath(); c2.moveTo(880, GY); c2.lineTo(880, GY - 125); c2.arc(960, GY - 125, 80, Math.PI, 0); c2.lineTo(1040, GY); c2.closePath(); c2.fill(); c2.strokeStyle = 'rgba(130,150,190,.4)'; c2.lineWidth = 4; c2.beginPath(); for (let i = 0; i < 5; i++) { c2.moveTo(900 + i * 30, GY); c2.lineTo(900 + i * 30, GY - 150); } c2.moveTo(884, GY - 60); c2.lineTo(1036, GY - 60); c2.moveTo(884, GY - 120); c2.lineTo(1036, GY - 120); c2.stroke(); }
      for (const b of blocks) {
        const tt = Math.min(Math.max(0, lt - tC - b.dl), b.tl), y = b.by + 0.5 * G * tt * tt, x = b.bx + b.vx * tt, v = b.sh;
        c2.save(); c2.translate(x, y); c2.rotate(b.om * tt);
        c2.fillStyle = `rgb(${Math.round(72 * v)},${Math.round(86 * v)},${Math.round(112 * v)})`; c2.fillRect(-b.w / 2 + 1.5, -b.h / 2 + 1.5, b.w - 3, b.h - 3);
        c2.fillStyle = 'rgba(210,225,255,.16)'; c2.fillRect(-b.w / 2 + 1.5, -b.h / 2 + 1.5, b.w - 3, 5); c2.fillStyle = 'rgba(0,0,0,.28)'; c2.fillRect(-b.w / 2 + 1.5, b.h / 2 - 8, b.w - 3, 6.5);
        c2.restore();
      }
      if (lt < tC) {
        c2.fillStyle = '#01030a'; c2.fillRect(390, GY - 350, 20, 64); c2.fillRect(1510, GY - 350, 20, 64);
        const k = clamp((lt - tK) / Math.max(0.2, Math.min(0.6, tC - tK)));
        if (k > 0) for (const cr of cracks) { const n = (cr.length - 1) * k; c2.beginPath(); c2.moveTo(cr[0][0], cr[0][1]); for (let i = 1; i <= Math.ceil(n); i++) { const f = Math.min(1, n - (i - 1)); c2.lineTo(lerp(cr[i - 1][0], cr[i][0], f), lerp(cr[i - 1][1], cr[i][1], f)); } c2.strokeStyle = '#01020a'; c2.lineWidth = 7; c2.lineJoin = 'round'; c2.stroke(); c2.strokeStyle = 'rgba(255,120,90,.5)'; c2.lineWidth = 2; c2.stroke(); }
      } else for (const p of dust) {
        const k = clamp((lt - tC - p.t0) / 1.9); if (k <= 0 || k >= 1) continue; const r = lerp(p.r0, p.r1, ease.out3(k)), a = p.a * (1 - k) * smooth(0, 0.12, k), y = p.y - 60 * k;
        const g2 = c2.createRadialGradient(p.x, y, 0, p.x, y, r); g2.addColorStop(0, `rgba(170,182,205,${a.toFixed(3)})`); g2.addColorStop(1, 'rgba(170,182,205,0)'); c2.fillStyle = g2; c2.fillRect(p.x - r, y - r, 2 * r, 2 * r);
      }
    });
    const bn = s.div('bebas', { position: 'absolute', left: '655px', top: '630px', width: '610px', height: '70px', lineHeight: '77px', textAlign: 'center', fontSize: '56px', letterSpacing: '.08em', color: '#1a1408', background: 'linear-gradient(180deg,#F1DFAE,#C9A85A)', borderRadius: '4px', boxShadow: '0 6px 24px rgba(0,0,0,.6)' }, 'KAINAT HAMESHA SE HAI');
    const tlb = Math.sqrt(2 * 206 / G);
    s.tl.fromTo(bn, { opacity: 0 }, { opacity: 1, duration: 0.5 }, tF + 0.15);
    s.onUpdate((lt) => { const tt = Math.min(Math.max(0, lt - tC - 0.07), tlb), pu = lt < tC ? 1 + 0.05 * Math.exp(-Math.pow((lt - (L('266', 2) + 0.1)) / 0.25, 2)) : 1; bn.style.transform = `translate(${(-46 * tt / tlb).toFixed(1)}px, ${(0.5 * G * tt * tt + (lt < tF + 0.6 ? 46 * (1 - ease.out3(clamp((lt - tF) / 0.6))) : 0)).toFixed(1)}px) rotate(${(-9 * tt / tlb).toFixed(2)}deg) scale(${pu.toFixed(4)})`; });
    const hq = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '138px', textAlign: 'center', fontSize: '84px', fontStyle: 'italic', fontWeight: 700, color: '#fff' }, '“kainat <span style="color:#F2C968">hamesha se</span> aisi hi thi”');
    sync(s, hq, '266', { from: 1, y: 22 }); s.tl.to(hq, { opacity: 0.4, duration: 0.3 }, tC);
    const pq = s.div(null, { position: 'absolute', left: '0', right: '0', top: '262px', textAlign: 'center' }, '<span class="tag gold sh" style="background:rgba(16,11,3,.6)">WOH PURANA QILA</span>');
    show(s, pq, Math.max(tF + 0.6, L('266', 8) - 0.1), tS - 0.05, { opacity: 0, y: -14 }, 0.4);
    s.sfx('riser', tK, { dur: Math.max(0.3, tC - tK), gain: 0.6 }); s.sfx('impact', tC + 0.05, { gain: 1.1 }); s.sfx('thud', tC + 0.45); shake(s, cv, tC + 0.04, 0.8, 22); shake(s, bn, tC + 0.04, 0.8, 22);
    stamp(s, 'GIR CHUKA HAI', tS, { x: 418, y: 318, size: 158, rot: -6, style: { background: 'rgba(20,0,0,.55)' } }); s.sfx('hit', tS + 0.22, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.25, z: 3 });

  // ───────── I6  Robert Jastrow → the mountain of ignorance (route to the summit) ─────────
  const tG = TW('270', 11) - 0.15;                                 // "…to wahan" → the summit shot
  const HEAD = 'ROBERT JASTROW · <span style="color:#F5F1E8">God and the Astronomers (1978)</span>';
  defScene('i7_pahaad', T('267'), tG + 0.9, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0, tQ = L('268') - 0.22, tTop = Math.max(tQ + 2, L('270', 9) - 0.05);
    const IW = 1920, IH = 1440, wrap = s.div('fill', { overflow: 'hidden', background: '#04070f' });
    const pan = el('div', null, { position: 'absolute', left: '0', top: '0', width: IW + 'px', height: IH + 'px', transformOrigin: '0 0' }), flip = el('div', null, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', transform: 'scaleX(-1)' });
    flip.appendChild(image('/gfx/img/i_denali.jpg', { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%' }));
    const RP = [[820, 1156], [790, 1040], [800, 900], [880, 740], [1040, 600], [1130, 470], [1090, 340], [960, 285], [800, 215], [630, 130]];   // glacier → ramp → col → summit ridge (image px)
    let rd = `M ${RP[0][0]} ${RP[0][1]} `; for (let i = 1; i < RP.length - 1; i++) rd += `Q ${RP[i][0]} ${RP[i][1]} ${(RP[i][0] + RP[i + 1][0]) / 2} ${(RP[i][1] + RP[i + 1][1]) / 2} `; rd += `L ${RP[RP.length - 1][0]} ${RP[RP.length - 1][1]}`;
    const rs = el('div', null, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%' }, `<svg width="${IW}" height="${IH}" viewBox="0 0 ${IW} ${IH}" style="position:absolute;left:0;top:0;overflow:visible">
      <path class="p0" d="${rd}" fill="none" stroke="rgba(0,10,30,.55)" stroke-width="13" stroke-linecap="round"/><path class="p1" d="${rd}" fill="none" stroke="rgba(111,216,255,.35)" stroke-width="13" stroke-linecap="round"/><path class="p2" d="${rd}" fill="none" stroke="#DDF6FF" stroke-width="4.5" stroke-linecap="round"/>
      <circle class="hg" r="26" fill="rgba(111,216,255,.4)"/><circle class="hd" r="9" fill="#fff"/></svg>`);
    flip.appendChild(rs); pan.appendChild(flip); wrap.appendChild(pan);
    const ps = [...rs.querySelectorAll('path')], hd = rs.querySelector('.hd'), hg = rs.querySelector('.hg'), len = ps[2].getTotalLength(); ps.forEach((p) => { p.style.strokeDasharray = `${len} ${len}`; });
    const KP = [[tQ + 0.25, 0], [L('269'), 0.42], [L('270'), 0.78], [tTop, 1]];
    const prog = (lt) => { if (lt <= KP[0][0]) return 0; for (let i = 1; i < KP.length; i++) if (lt < KP[i][0]) { const k = (lt - KP[i - 1][0]) / Math.max(0.01, KP[i][0] - KP[i - 1][0]); return lerp(KP[i - 1][1], KP[i][1], k * k * (3 - 2 * k) * 0.5 + k * 0.5); } return 1; };
    const lab = s.div('mono sh', { position: 'absolute', left: '0', top: '0', fontSize: '22px', fontWeight: 700, letterSpacing: '.28em', color: '#B9ECFF', whiteSpace: 'nowrap' }, 'SCIENTIST');
    const bloom = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1400px', height: '1400px', marginLeft: '-700px', marginTop: '-700px', background: 'radial-gradient(circle, rgba(255,240,200,1) 0%, rgba(255,205,120,.7) 14%, rgba(255,165,70,.28) 38%, rgba(255,150,60,0) 68%)', mixBlendMode: 'screen' });
    s.onUpdate((lt) => {
      const p = prog(lt), k = p * p * (3 - 2 * p), ki = clamp(lt / Math.max(0.5, tQ));
      const S = lt < tQ ? lerp(1.2, 1.36, ki) : lerp(1.36, 1.1, k), tx = lt < tQ ? lerp(0, -60, ki) : lerp(-60, 0, k), ty = lt < tQ ? lerp(-648, -878, ki) : lerp(-878, 0, k);
      pan.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${S.toFixed(4)})`;
      ps.forEach((pp) => { pp.style.strokeDashoffset = (len * (1 - p)).toFixed(1); pp.style.opacity = p > 0 ? '1' : '0'; });
      const q = ps[2].getPointAtLength(len * p), on = smooth(tQ, tQ + 0.4, lt);
      hd.setAttribute('cx', q.x.toFixed(1)); hd.setAttribute('cy', q.y.toFixed(1)); hg.setAttribute('cx', q.x.toFixed(1)); hg.setAttribute('cy', q.y.toFixed(1)); hd.setAttribute('opacity', on.toFixed(2)); hg.setAttribute('r', (22 + 8 * Math.sin(lt * 5)).toFixed(1)); hg.setAttribute('opacity', on.toFixed(2));
      const sx = tx + (IW - q.x) * S, sy = ty + q.y * S; lab.style.transform = `translate(${(sx + 30).toFixed(1)}px, ${(sy - 40).toFixed(1)}px)`; lab.style.opacity = (on * (1 - smooth(tTop - 0.3, tTop + 0.2, lt))).toFixed(3);
      const bk = smooth(tTop - 0.35, d, lt), ex = tx + (IW - RP[9][0]) * S, ey = ty + RP[9][1] * S; bloom.style.transform = `translate(${ex.toFixed(1)}px, ${ey.toFixed(1)}px) scale(${(0.12 + 1.1 * bk).toFixed(3)})`; bloom.style.opacity = bk.toFixed(3);
    });
    const dimA = s.div('fill', { background: 'rgba(2,5,14,.5)' }), dimB = s.div('scrim-b'); s.tl.to([dimA, dimB], { opacity: 0, duration: 0.8 }, tQ - 0.2);
    s.div('scrim-l', { width: '60%' });
    // who: Robert Jastrow
    const X = IMG.jastrow ? 420 : 110, tNm = Math.max(0.3, L('267', 4) - 0.12);
    const who = s.div('fill');
    if (IMG.jastrow) { const pc = photoCard(s, IMG.jastrow, { x: 110, y: 282, w: 270, h: 360 }, tNm, tQ + 0.2, { pos: '50% 18%', z0: 1.1, z1: 1.0, from: { x: -60, opacity: 0, scale: 0.96 } }); pc.appendChild(el('div', 'mono', { position: 'absolute', right: '10px', bottom: '8px', fontSize: '13px', fontWeight: 700, letterSpacing: '.18em', color: 'rgba(245,241,232,.7)' }, 'NASA')); }
    who.innerHTML = `<div class="c1" style="position:absolute;left:${X}px;top:286px"><span class="chip" style="background:rgba(111,216,255,.12);border-color:rgba(111,216,255,.75);color:#B9ECFF">NASA astronomer</span></div>
      <div class="bebas sh nm" style="position:absolute;left:${X}px;top:352px;font-size:156px;line-height:.95;white-space:nowrap">ROBERT JASTROW</div>
      <div class="c2" style="position:absolute;left:${X}px;top:512px"><span class="chip">khud ko <b style="color:#fff">“agnostic”</b> kehte the</span></div>
      <div class="bk" style="position:absolute;left:${X}px;top:590px;display:flex;align-items:center;gap:18px">${BOOK}<span class="serif sh" style="font-size:54px;font-style:italic;font-weight:700;color:#F8DE9A;white-space:nowrap">God and the Astronomers</span><span class="mono sh" style="font-size:26px;font-weight:700;color:rgba(245,241,232,.75)">(1978)</span></div>`;
    const W = (c) => who.querySelector(c);
    s.tl.fromTo(W('.c1'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45 }, Math.max(0.15, L('267', 1) - 0.1));
    s.tl.fromTo(words(W('.nm')), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power3.out' }, tNm);
    s.tl.fromTo(W('.c2'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45 }, L('267', 8) - 0.1).fromTo(W('.bk'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, L('267', 14) - 0.1);
    s.sfx('whoosh', tNm, { gain: 0.5 }); s.sfx('paper', L('267', 14) - 0.1, { gain: 0.7 });
    s.tl.to(who, { opacity: 0, x: -40, duration: 0.35, ease: 'power2.in' }, tQ - 0.15).set(who, { autoAlpha: 0 }, tQ + 0.22);
    cap(s, 'woh <span class="hl">sunne se ta\'alluq</span> rakhta hai', Math.max(tNm + 1, L('267', 17) - 0.05), tQ + 0.05, { bottom: 120 });
    // the quote, each sentence on its line
    const qb = s.div(null, { position: 'absolute', left: '110px', top: '150px', width: '700px' });
    qb.innerHTML = `<div class="quote-by sh hd0" style="margin-top:0;font-size:24px;white-space:nowrap">${HEAD}</div><div class="play gold mk" style="font-size:200px;line-height:.6;height:84px;opacity:.9;margin-top:40px">“</div>
      <div class="quote sh ln" style="font-size:52px;line-height:1.28">Scientist <span style="color:#8EE2FF">jahalat ke pahaad</span> chadhta gaya.</div>
      <div class="quote sh ln" style="font-size:52px;line-height:1.28;margin-top:22px">Sab se <span style="color:#F2C968">oonchi choti</span> sar karne hi wala tha.</div>
      <div class="quote sh ln" style="font-size:52px;line-height:1.28;margin-top:22px">Aur jab woh <span style="color:#F2C968">aakhri chattan</span> par chadh kar upar aaya —</div>`;
    const ln = [...qb.querySelectorAll('.ln')];
    s.tl.fromTo(qb.querySelector('.hd0'), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5 }, tQ + 0.05).fromTo(qb.querySelector('.mk'), { opacity: 0, scale: 0.4, transformOrigin: '0 0' }, { opacity: 0.9, scale: 1, duration: 0.5, ease: 'back.out(2)' }, tQ + 0.05);
    ['268', '269', '270'].forEach((id, i) => { sync(s, ln[i], id, { y: 14 }); if (i) s.tl.to(ln[i - 1], { opacity: 0.5, duration: 0.5 }, L(id) - 0.1); });
    s.sfx('swell', tQ, { dur: 3, gain: 0.6 }); s.sfx('shimmer', tTop, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.35, z: 4 });

  // ───────── I7  the summit: "…jo sadiyon se wahin baitha tha." — golden light ─────────
  defScene('i8_choti', tG, P1 + 0.3, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0, tE = L('271') - 0.1, SX = 1460, SY = 664;
    const wrap = s.div('fill', { overflow: 'hidden' }), im = image('/gfx/img/i_summit.jpg', { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', transformOrigin: `${SX}px ${SY}px` }); wrap.appendChild(im);
    const rays = s.div(null, { position: 'absolute', left: (SX - 1300) + 'px', top: (SY - 1300) + 'px', width: '2600px', height: '2600px', background: 'repeating-conic-gradient(from 0deg, rgba(255,222,150,.16) 0deg 3deg, rgba(255,222,150,0) 3deg 15deg)', WebkitMaskImage: 'radial-gradient(circle, #000 6%, rgba(0,0,0,.55) 28%, rgba(0,0,0,0) 60%)', maskImage: 'radial-gradient(circle, #000 6%, rgba(0,0,0,.55) 28%, rgba(0,0,0,0) 60%)', mixBlendMode: 'screen' });
    const bloom = s.div(null, { position: 'absolute', left: (SX - 800) + 'px', top: (SY - 800) + 'px', width: '1600px', height: '1600px', background: 'radial-gradient(circle, rgba(255,244,214,.95) 0%, rgba(255,208,125,.6) 15%, rgba(255,168,74,.24) 38%, rgba(255,150,60,0) 66%)', mixBlendMode: 'screen' });
    const warm = s.div('fill', { background: 'linear-gradient(250deg, rgba(255,176,84,.3) 0%, rgba(255,176,84,.08) 46%, rgba(0,0,0,0) 70%)', mixBlendMode: 'screen' });
    s.onUpdate((lt) => {
      const k = clamp(lt / d), g = smooth(0, tE + 1.4, lt), g2 = smooth(tE - 0.2, tE + 1.6, lt);
      im.style.transform = `scale(${(1.02 + 0.13 * k).toFixed(4)})`;
      bloom.style.transform = `scale(${(0.5 + 0.38 * g + 0.22 * g2 + 0.02 * Math.sin(lt * 1.7)).toFixed(4)})`; bloom.style.opacity = (0.55 + 0.45 * g).toFixed(3);
      rays.style.transform = `rotate(${(lt * 1.6).toFixed(2)}deg)`; rays.style.opacity = (0.25 + 0.75 * g2).toFixed(3); warm.style.opacity = (0.2 + 0.8 * g2).toFixed(3);
    });
    s.div('fill', { background: 'linear-gradient(118deg, rgba(3,6,16,.82) 0%, rgba(3,6,16,.5) 34%, rgba(3,6,16,0) 60%)' });
    const qb = s.div(null, { position: 'absolute', left: '110px', top: '150px', width: '1040px' });
    qb.innerHTML = `<div class="quote-by sh" style="margin-top:0;font-size:24px;white-space:nowrap">${HEAD}</div>
      <div class="quote sh l1" style="font-size:52px;line-height:1.26;margin-top:30px">…to wahan <span style="color:#F2C968">mazhabi aalimon ka ek giroh</span> us ka istiqbal kar raha tha…</div>
      <div class="play l2" style="font-size:78px;line-height:1.14;margin-top:16px;white-space:nowrap;font-style:italic;font-weight:800;color:#F8DE9A;text-shadow:0 0 30px rgba(233,185,85,.45), 0 3px 6px rgba(0,0,0,.9), 0 4px 30px rgba(0,0,0,.9)">jo sadiyon se wahin baitha tha.”</div>
      <div class="orn o" style="margin-top:22px;width:600px;transform-origin:0 50%;background:linear-gradient(90deg,rgba(233,185,85,.9),rgba(233,185,85,0))"></div>`;
    sync(s, qb.querySelector('.l1'), '270', { from: 11, y: 14 }); sync(s, qb.querySelector('.l2'), '271', { y: 26, dur: 0.5 });
    s.tl.to(qb.querySelector('.l1'), { opacity: 0.62, duration: 0.6 }, tE).fromTo(qb.querySelector('.o'), { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power2.inOut' }, Math.min(L('271e') - 0.2, d - 1.2));
    s.sfx('swell', 0, { dur: 3, gain: 0.8 }); s.sfx('shimmer', tE, { gain: 1 }); s.sfx('chime', Math.min(L('271e') - 0.2, d - 1.2), { gain: 0.6 });
    s.div('vig');
  }, { fin: 0.8, fout: 0.3, z: 5 });
}
