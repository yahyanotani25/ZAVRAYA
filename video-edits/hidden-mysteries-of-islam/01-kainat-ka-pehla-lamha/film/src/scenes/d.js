// PART D — "Ratq aur Fatq" (spoken lines 92..126).  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
// Scenes are stacked with rising z: an incoming scene fades in ON TOP of the previous one (which stays opaque underneath) -> order-independent dissolves.
import { defScene, stage3d, T, TW, gsap, el, image, track, clamp, lerp, smooth, ease, noise1, rng, W, H } from '../engine.js';
import { cap, big, flash, show, footage, svg, shake, words, ayah, stamp } from '../ui.js';
import { spaceBackdrop, fireball, starfield, glow } from '../kit3d.js';
import { Q, REF, AR } from '../quran.js';

const LL = (s) => (id, n, o = 0) => Math.max(0, (n == null ? T(id) : TW(id, n)) - s.t0 + o);

// footage with an arbitrary time -> frame map (reverse play)
function clip(s, name, n, fmap, xf) {
  const wrap = s.div('fill', { overflow: 'hidden' });
  const im = el('img', null, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' }); im.decoding = 'sync'; wrap.appendChild(im);
  let last = -1;
  s.onUpdate((lt) => {
    const f = Math.round(clamp(fmap(lt), 0, n - 1));
    if (f !== last) { last = f; im.src = `/frames/${name}/${String(f + 1).padStart(5, '0')}.jpg`; track(im.decode()); }
    if (xf) im.style.transform = xf(lt);
  });
  return wrap;
}
function filmBars(s, frameAt) {   // same film-strip bars as the end of Part C
  const mk = (top) => {
    const b = s.div(null, { position: 'absolute', left: '0', right: '0', [top ? 'top' : 'bottom']: '0', height: '60px', background: '#000', overflow: 'hidden' });
    const p = el('div', null, { position: 'absolute', left: '-120px', right: '-120px', top: '17px', height: '26px', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 26px, rgba(235,240,255,.8) 26px, rgba(235,240,255,.8) 62px, rgba(0,0,0,0) 62px, rgba(0,0,0,0) 88px)' });
    b.appendChild(p); return p;
  };
  const p1 = mk(true), p2 = mk(false);
  s.onUpdate((lt) => { const x = -((((frameAt(lt) * 7) % 88) + 88) % 88); p1.style.transform = p2.style.transform = `translateX(${x.toFixed(2)}px)`; });
}
function rewindFx(s, t0, t1) {
  const ls = [0, 1, 2, 3].map(() => s.div(null, { position: 'absolute', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.6) 30%, rgba(255,255,255,.25) 70%, rgba(255,255,255,0))', opacity: '0' }));
  s.onUpdate((lt) => { const on = lt >= t0 && lt < t1; ls.forEach((l, i) => { if (!on) { l.style.opacity = '0'; return; } const r = rng(Math.floor(lt * 15) * 7 + i * 131 + 5); l.style.top = (80 + r() * 900).toFixed(0) + 'px'; l.style.height = (2 + r() * 5).toFixed(0) + 'px'; l.style.opacity = (0.12 + r() * 0.45).toFixed(2); }); });
}

// ---- the cloth: two woven halves (sky / earth) meeting on a horizontal seam at y = 540, drawn column by column so the seam can open like a zip ----
// o: { xs:[stitch x], gap(x, lt) -> half-gap px, sewn(i, lt) -> 0..1, popT(i) -> local time the stitch snaps, needle(lt), light(lt) 0..1, glint(lt) -> x }
function clothRig(s, par, o) {
  const cv = el('canvas', null, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' }); cv.width = W; cv.height = H; par.appendChild(cv);
  const c = cv.getContext('2d'), top = image('/gfx/img/d_cloth_sky.jpg'), bot = image('/gfx/img/d_cloth_earth.jpg');
  const gs = document.createElement('canvas'); gs.width = 1; gs.height = 64;
  { const x = gs.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,200,120,0)'); g.addColorStop(0.5, 'rgba(255,228,176,1)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 1, 64); }
  const CH = 600, Y0 = 540, SW = 2;
  const thread = (path, al) => {
    c.lineCap = 'round'; c.globalAlpha = al;
    c.save(); c.translate(1.5, 3); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 11; path(); c.stroke(); c.restore();
    c.strokeStyle = '#8a6118'; c.lineWidth = 10; path(); c.stroke();
    c.strokeStyle = '#E3B04B'; c.lineWidth = 6.6; path(); c.stroke();
    c.save(); c.translate(-1, -1); c.strokeStyle = '#FFF0C2'; c.lineWidth = 2.2; path(); c.stroke(); c.restore();
    c.globalAlpha = 1;
  };
  s.onUpdate((lt) => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
    if (!top.naturalWidth || !bot.naturalWidth) return;
    for (let x = 0; x < W; x += SW) { const g = o.gap(x + 1, lt); if (g < 560) { c.drawImage(top, x, 0, SW, CH, x, Y0 - g - CH, SW, CH); c.drawImage(bot, x, 0, SW, CH, x, Y0 + g, SW, CH); } }
    const li = o.light ? o.light(lt) : 0;
    if (li > 0.01) {                                                   // light spilling over the parted edges
      c.globalCompositeOperation = 'lighter';
      for (let x = 0; x < W; x += 12) { const g = o.gap(x + 6, lt); if (g > 0.6 && g < 700) { c.globalAlpha = Math.min(1, li * clamp(g / 16) * 0.6); c.drawImage(gs, x, Y0 - g - 120, 12, 2 * g + 240); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    const gl = o.glint ? o.glint(lt) : -9999;
    o.xs.forEach((xi, i) => {
      const a = o.sewn(i, lt); if (a <= 0) return;
      const g = o.gap(xi, lt); if (g > 520) return;
      const px = xi - 12, py = Y0 - g - 25, qx = xi + 12, qy = Y0 + g + 25, tp = o.popT(i);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.ellipse(px, py, 5.6, 4.2, 0, 0, 6.283); c.fill();
      if (a >= 1) { c.beginPath(); c.ellipse(qx, qy, 5.6, 4.2, 0, 0, 6.283); c.fill(); }
      if (lt < tp) {
        const ex = lerp(px, qx, a), ey = lerp(py, qy, a);
        thread(() => { c.beginPath(); c.moveTo(px, py); c.lineTo(ex, ey); }, 1);
        const k = Math.exp(-Math.pow((xi - gl) / 90, 2));
        if (k > 0.03 && a >= 1) { c.globalAlpha = k; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(px, py); c.lineTo(qx, qy); c.stroke(); c.globalAlpha = 1; }
      } else {
        const b = (lt - tp) / 0.55; if (b >= 1) return;                // snapped: the two ends curl back and fade
        const mx = (px + qx) / 2, my = (py + qy) / 2, r = 1 - 0.8 * b, al = 1 - b * b;
        thread(() => { c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + (mx - px) * r * 0.5 - 16 * b, py + (my - py) * r * 0.5 - 6 * b, px + (mx - px) * r - 10 * b, py + (my - py) * r - 14 * b); }, al);
        thread(() => { c.beginPath(); c.moveTo(qx, qy); c.quadraticCurveTo(qx + (mx - qx) * r * 0.5 + 16 * b, qy + (my - qy) * r * 0.5 + 6 * b, qx + (mx - qx) * r + 10 * b, qy + (my - qy) * r + 14 * b); }, al);
        if (b < 0.4) { const rr = 10 + 70 * b, gr = c.createRadialGradient(mx, my, 0, mx, my, rr); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - b / 0.4; c.fillStyle = gr; c.beginPath(); c.arc(mx, my, rr, 0, 6.283); c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      }
    });
    const nd = o.needle ? o.needle(lt) : null;
    if (nd && nd.al > 0.01) {
      const body = () => { c.beginPath(); c.moveTo(0, 0); c.lineTo(-22, -3.2); c.lineTo(-156, -4); c.lineTo(-168, 0); c.lineTo(-156, 4); c.lineTo(-22, 3.2); c.closePath(); };
      c.save(); c.globalAlpha = nd.al; c.translate(nd.x, nd.y); c.rotate(nd.ang);
      c.save(); c.translate(6, 10); c.fillStyle = 'rgba(0,0,0,.4)'; body(); c.fill(); c.restore();
      const lg = c.createLinearGradient(0, -4, 0, 4); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.5, '#cdd5e0'); lg.addColorStop(1, '#6f7886'); c.fillStyle = lg; body(); c.fill();
      c.fillStyle = '#15151c'; c.beginPath(); c.ellipse(-152, 0, 8, 1.6, 0, 0, 6.283); c.fill();
      c.restore();
    }
  });
  return cv;
}
const STITCH_N = 18, STITCH_X = Array.from({ length: STITCH_N }, (_, i) => 105 + i * (1710 / (STITCH_N - 1)));
const STAR4 = (r) => `M0 ${-r}L${r * 0.24} ${-r * 0.24}L${r} 0L${r * 0.24} ${r * 0.24}L0 ${r}L${-r * 0.24} ${r * 0.24}L${-r} 0L${-r * 0.24} ${-r * 0.24}Z`;
const STAR8 = 'M' + Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8 - Math.PI / 2, r = k % 2 ? 20 : (k % 4 ? 46 : 90); return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; }).join('L') + 'Z';
const SPIRAL = [0, 1].map((arm) => 'M' + Array.from({ length: 34 }, (_, i) => { const th = 0.3 + i * 0.15, r = 9 * Math.exp(0.42 * th), a = th + arm * Math.PI; return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; }).join('L')).join('');
const ICONS = {
  SITARE: `<path d="${STAR8}" fill="#FFF1C9"/><circle r="24" fill="#fff"/><path d="${STAR4(22)}" transform="translate(64 -60)" fill="#FFE9B0"/><path d="${STAR4(15)}" transform="translate(-68 54)" fill="#FFE9B0"/>`,
  GALAXIES: `<g transform="rotate(-18) scale(1 .62)"><path d="${SPIRAL}" fill="none" stroke="#BFD4FF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle r="17" fill="#FFF1C9"/></g>`,
  ZAMEEN: `<clipPath id="dGlobe"><circle r="84"/></clipPath><circle r="84" fill="#2C6FBF"/><g clip-path="url(#dGlobe)" fill="#5DBB6E"><path d="M-70 -46Q-30 -78 4 -52Q22 -30 -6 -12Q-20 16 -52 6Q-84 -14 -70 -46Z"/><path d="M22 2Q60 -14 80 14Q74 54 44 66Q14 60 12 30Q10 10 22 2Z"/><path d="M-40 44Q-12 34 -4 60Q-14 90 -40 86Q-56 66 -40 44Z"/></g><circle r="84" fill="none" stroke="#A9DAFF" stroke-width="5"/>`,
  AASMAN: `<path d="M-90 62A90 90 0 0 1 90 62Z" fill="#2B63C9"/><path d="M-90 62A90 90 0 0 1 90 62" fill="none" stroke="#A9DAFF" stroke-width="6"/><path d="M-96 62H96" stroke="#A9DAFF" stroke-width="6" stroke-linecap="round"/><g fill="#fff"><circle cx="-26" cy="26" r="17"/><circle cx="-4" cy="16" r="22"/><circle cx="20" cy="28" r="16"/><rect x="-42" y="26" width="76" height="18" rx="9"/></g><path d="${STAR4(11)}" transform="translate(44 -14)" fill="#FFE9B0"/><path d="${STAR4(8)}" transform="translate(-48 -16)" fill="#FFE9B0"/><path d="${STAR4(7)}" transform="translate(4 -52)" fill="#FFE9B0"/>`,
};
// simple flying pigeon (faces right); wings flap by scaling about the shoulder line
const BIRD = `<path d="M44 86L2 66L12 90L0 110L46 100Z" fill="#CFC9BC"/>
  <g class="w2"><path d="M96 84Q112 6 172 -34Q176 26 146 84Z" fill="#8F8A7F"/></g>
  <ellipse cx="112" cy="90" rx="72" ry="30" transform="rotate(-8 112 90)" fill="#E2DDD0"/><circle cx="180" cy="66" r="21" fill="#E2DDD0"/><path d="M198 60L224 67L198 75Z" fill="#E8A552"/><circle cx="186" cy="61" r="3.6" fill="#15151c"/>
  <g class="w1"><path d="M84 86Q96 -6 156 -52Q168 20 138 88Z" fill="#F4F0E6"/></g>`;

export default function ([P0, P1]) {
  // ───────── D1  the film runs backwards: − 1 … − 10 … − 13.8 ARAB SAAL ─────────
  defScene('d1_rewind', P0, T('96'), (s) => {
    const L = LL(s), d = s.t1 - s.t0, tZ = Math.max(1.5, Math.min(L('95', 5, 0.25), d - 0.5));
    const F = (lt) => 300 * Math.pow(1 - clamp(lt / tZ), 1.25);                                  // continues the reverse play started in Part C
    const fw = clip(s, 'c_expand', 450, F, (lt) => `translateX(${(lt < tZ ? noise1(lt * 40, 3) * 7 : 0).toFixed(2)}px) scale(1.04)`);
    s.tl.to(fw, { opacity: 0, duration: 0.45, ease: 'power2.in' }, tZ);
    s.div('scrim-b'); s.div('scrim-t');
    filmBars(s, F); rewindFx(s, 0, tZ);
    const rw = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '34px', fontWeight: 700, letterSpacing: '.3em' }, '◀◀&nbsp; REWIND');
    s.tl.to(rw, { opacity: 0, duration: 0.3 }, tZ);
    s.sfx('rewind', 0, { dur: tZ }); s.sfx('subdrop', tZ);
    cap(s, '<span class="hl">Peeche</span> chaliye…', L('92', null, -0.05), Math.max(L('92') + 0.7, L('93', null, -0.05)), { size: 60, bottom: 190 });
    // stepped counter + timeline scrubber
    const cb = s.div(null, { position: 'absolute', right: '110px', top: '88px', textAlign: 'right' }, `<div class="bebas sh num" style="font-size:210px;line-height:.9;transform-origin:100% 60%">− 1</div><div class="mono cyan sh" style="font-size:36px;font-weight:700;letter-spacing:.34em;margin-top:6px">ARAB SAAL</div>`);
    const num = cb.querySelector('.num'), cv = { v: 0 };
    const t1 = L('93', null, -0.08), t2 = L('94', null, -0.08), t3 = L('95', null, -0.05);
    show(s, cb, t1, null, { opacity: 0, x: 40 }, 0.3);
    s.tl.to(cv, { v: 1, duration: 0.25, ease: 'power2.out' }, t1).to(cv, { v: 10, duration: 0.4, ease: 'power2.out' }, t2).to(cv, { v: 13.8, duration: Math.max(0.5, L('95', 2, 0.2) - t3), ease: 'power1.inOut' }, t3);
    [t1, t2, t3 + Math.max(0.5, L('95', 2, 0.2) - t3) - 0.1].forEach((t, i) => { s.tl.fromTo(num, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: 'power3.out' }, t + (i === 1 ? 0.1 : 0)); s.sfx(i === 2 ? 'hit' : 'tick', t + 0.05); });
    const X1 = 1720, PX = 1520 / 13.8;
    const tl = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' }, `<div style="position:absolute;left:200px;top:968px;width:1520px;height:3px;background:rgba(255,255,255,.3)"></div>
      <div class="fl" style="position:absolute;right:200px;top:966px;height:7px;width:0;background:#6FD8FF"></div>
      ${Array.from({ length: 14 }, (_, i) => `<div style="position:absolute;left:${(X1 - i * PX - 1).toFixed(1)}px;top:960px;width:2px;height:${i % 5 ? 12 : 20}px;background:rgba(255,255,255,.6)"></div>`).join('')}
      <div class="mono" style="position:absolute;left:1640px;top:922px;width:160px;text-align:center;font-size:24px;font-weight:700;letter-spacing:.2em;color:rgba(245,241,232,.8)">AAJ</div>
      <div class="mono" style="position:absolute;left:120px;top:922px;width:160px;text-align:center;font-size:24px;font-weight:700;letter-spacing:.1em;color:rgba(245,241,232,.8)">− 13.8</div>
      <div class="ph" style="position:absolute;left:0;top:940px;width:0;height:0"><div style="position:absolute;left:-12px;top:0;border-left:12px solid rgba(0,0,0,0);border-right:12px solid rgba(0,0,0,0);border-top:20px solid #F2C968"></div><div style="position:absolute;left:-1.5px;top:16px;width:3px;height:26px;background:#F2C968"></div></div>`);
    const fl = tl.querySelector('.fl'), ph = tl.querySelector('.ph');
    show(s, tl, 0.3, null, { opacity: 0 }, 0.4);
    s.onUpdate(() => { const v = cv.v; num.textContent = '− ' + (v >= 10.05 ? v.toFixed(1) : String(Math.max(1, Math.round(v)))); num.style.color = v >= 13.79 ? '#F6CF6B' : '#fff';
      ph.style.transform = `translateX(${(X1 - v * PX).toFixed(2)}px)`; fl.style.width = (v * PX).toFixed(2) + 'px'; });
    cap(s, '<span class="hc">13.8 billion years</span> peeche', L('95', 3, -0.05), d + 0.3, { size: 60, bottom: 190 });
    s.div('vig');
  }, { z: 1 });

  defScene('d1b_wahan', T('96'), T('97') - 0.25, (s) => {
    s.div('fill', { background: '#000' });
    const b = big(s, 'WAHAN <span class="gold">KYA</span> HAI?', 0.03, null, { size: 220, y: 440, mode: 'fade', by: 'words', stagger: 0.16 });
    s.tl.to(b, { scale: 1.06, duration: s.t1 - s.t0, ease: 'none' }, 0);
    s.sfx('heartbeat', 0.1, { gain: 0.8 });
  }, { z: 2 });

  // ───────── D2  no stars, no galaxies, no earth, no sky — one hot, dense, joined state ─────────
  defScene('d2_nothing', T('97') - 0.25, T('104') + 0.15, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const tIn = L('101', null, -0.05), tBall = L('101', 5, -0.1), tGa = L('101', 7, -0.08), tGh = L('101', 9, -0.08), tY = L('102', null, -0.06), tJ = L('103', null, -0.04);
    const st = stage3d(s, { bg: 0x000000, fov: 45 });
    const fb = fireball(); fb.position.set(0, 0.45, 0); st.scene.add(fb);
    const dust = starfield({ count: 6000, radius: 9, seed: 5, px: 3.4, size: 1.8 }); dust.position.set(0, 0.45, 0); st.scene.add(dust);
    const core = glow(0xffd29a, 1, 0, 0.05, 2.0); core.position.set(0, 0.45, 0); st.scene.add(core);
    st.frame = (lt) => {
      const k = smooth(tIn, tBall + 0.5, lt);                                                   // everything falls together…
      dust.scale.setScalar(lerp(1.7, 0.04, k * k)); dust.rotation.z = lt * 0.5; dust.material.uniforms.time.value = lt;
      dust.material.uniforms.opacity.value = smooth(tIn - 0.1, tIn + 0.4, lt) * (1 - smooth(tBall + 0.1, tBall + 0.7, lt));
      core.scale.setScalar(0.6 + 3.2 * k); core.material.opacity = 0.9 * k * (1 - smooth(tBall + 0.3, tBall + 1.1, lt));
      const g = ease.outBack(clamp((lt - tBall) / 1.5));                                         // …into a fireball
      fb.scale.setScalar(Math.max(0.001, g * (1.42 + 0.04 * Math.sin(lt * 3.1)))); fb.userData.update(lt, 0.75 + 0.45 * smooth(tGa, tGa + 0.6, lt));
      st.camera.position.set(0, 0, 10 - 1.0 * smooth(tBall, d, lt)); st.camera.lookAt(0, 0, 0);
    };
    // four things, switched off one by one
    const names = ['SITARE', 'GALAXIES', 'ZAMEEN', 'AASMAN'], offT = ['97', '98', '99', '100'].map((k) => L(k, 1, -0.05));
    const tiles = names.map((n, i) => {
      const t = s.div(null, { position: 'absolute', left: (150 + i * 420) + 'px', top: '270px', width: '360px', textAlign: 'center' },
        `<div class="ic"><svg width="230" height="230" viewBox="-110 -110 220 220">${ICONS[n]}</svg></div><div class="bebas lb" style="font-size:84px;margin-top:22px;color:#fff">${n}</div><div style="margin-top:18px"><div class="tag red tg" style="font-size:26px;background:rgba(30,0,0,.5)">✗ NAHI</div></div>`);
      s.tl.fromTo(t, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.02 + i * 0.07);
      const to = Math.max(0.35 + i * 0.07, offT[i]);
      s.tl.to(t.querySelector('.ic'), { keyframes: [{ opacity: 0.25, duration: 0.05 }, { opacity: 0.85, duration: 0.05 }, { opacity: 0.12, duration: 0.14 }] }, to).to(t.querySelector('.lb'), { color: 'rgba(245,241,232,.32)', duration: 0.2 }, to);
      s.tl.fromTo(t.querySelector('.tg'), { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.18 }, to + 0.04); s.sfx('tick', to); s.sfx('buzz', to + 0.02, { gain: 0.35 });
      s.tl.to(t, { x: 780 - (150 + i * 420), y: 150, scale: 0.05, opacity: 0, duration: 0.8, ease: 'power2.in' }, tIn + i * 0.05);
      return t;
    });
    s.sfx('whooshRev', tIn, { dur: 1.0 }); s.sfx('swell', Math.max(0, tBall - 0.4), { dur: 2.2 });
    const hd = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '104px', textAlign: 'center', fontSize: '100px' }, '<span class="a" style="display:inline-block">SAARA MAADA</span><span class="p" style="display:inline-block;color:#F2C968;margin:0 .35em">+</span><span class="b" style="display:inline-block">SAARI ENERGY</span>');
    s.tl.fromTo(hd.querySelector('.a'), { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.4 }, L('101', 0, 0.3)).fromTo([hd.querySelector('.p'), hd.querySelector('.b')], { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4 }, L('101', 2, -0.05));
    s.tl.to(hd, { opacity: 0, y: -20, duration: 0.4 }, Math.max(tGh + 0.4, tY - 0.45));
    const kw = (x, al, t, txt, col) => { const k = s.div(null, { position: 'absolute', left: x + 'px', top: '380px', width: '590px', textAlign: al }, `<div class="mont sh" style="font-size:38px;font-weight:600;font-style:italic;color:rgba(245,241,232,.85)">intehai</div><div class="anton sh" style="font-size:160px;line-height:1.05;color:${col};text-shadow:0 0 40px ${col}88,0 4px 20px rgba(0,0,0,.8)">${txt}</div>`); show(s, k, t, null, { opacity: 0, scale: 1.3 }, 0.35); s.sfx('hit', t + 0.1, { gain: 0.5 }); return k; };
    kw(64, 'right', tGa, 'GARAM', '#FFB45E'); kw(1266, 'left', tGh, 'GHANI', '#FFE9A8');
    // YAKJA — two half-rings clasp shut around it
    const rg = svg(s, `<g fill="none" stroke="#F2C968" stroke-width="6" stroke-linecap="round"><path class="l" d="M0 -262A262 262 0 0 0 0 262"/><path class="r" d="M0 -262A262 262 0 0 1 0 262"/></g>`, { x: 660, y: 181, w: 600, h: 600, vb: '-300 -300 600 600' });
    s.tl.fromTo(rg.querySelector('.l'), { x: -110, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.in' }, tY).fromTo(rg.querySelector('.r'), { x: 110, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.in' }, tY);
    const yk = s.div('bebas goldgrad', { position: 'absolute', left: '0', right: '0', top: '716px', textAlign: 'center', fontSize: '220px', lineHeight: '.95' }, 'YAKJA');
    s.tl.fromTo(yk, { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.26, ease: 'power4.in' }, tY); s.sfx('impact', tY + 0.26, { gain: 0.8 }); flash(s, tY + 0.24, { peak: 0.3, color: '#FFE9B0', dur: 0.5 });
    const jd = s.div('cinzel sh', { position: 'absolute', left: '0', right: '0', top: '918px', textAlign: 'center', fontSize: '50px', fontWeight: 700, color: '#F8DE9A' }, '— JUDA HUA —');
    gsap.set(jd, { autoAlpha: 0 }); s.tl.set(jd, { autoAlpha: 1 }, tJ).fromTo(jd, { opacity: 0, letterSpacing: '1.2em' }, { opacity: 1, letterSpacing: '.5em', duration: 0.6, ease: 'power2.out' }, tJ); s.sfx('chime', tJ);
    s.div('vig');
  }, { z: 3 });

  // ───────── D3  the ayah 21:30 → two words: Ratq / Fatq ─────────
  defScene('d3_ayah', T('104') - 0.15, T('108') + 0.2, (s) => {
    const L = LL(s);
    const st = stage3d(s, { bg: 0x030308, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.3, seed: 41, tint: 0xffdfb0 });
    const em = glow(0xff8a30, 16, 0.13, 0, 1.6); st.scene.add(em);
    st.frame = (lt) => { bd.update(lt * 2 + 12); em.scale.setScalar(16 + 1.2 * Math.sin(lt * 0.9)); st.camera.position.set(0, 0, 10 - lt * 0.05); };
    const ay = ayah(s, { ref: REF['21:30a'], ar: Q['21:30a'], size: 96, trSize: 40,
      tr: `Kya inkaar karne walon ne nahi <span class="hl">dekha</span>|ke aasman aur zameen aapas mein <span class="hl">jude hue</span> the —|phir Hum ne unhein <span class="hl">juda juda</span> kar diya?`,
      t0: L('104', null, -0.02), tAr: L('104', null, 0.45), dAr: clamp(L('105') - L('104') - 1.1, 1.3, 3.6), trTimes: [L('105', null, -0.08), L('105', 7, -0.08), L('105', 17, -0.08)] });
    const A = ay.aws; ay.ar.insertBefore(document.createElement('br'), A[7]);                 // layout only: break the line after "wal-ard"
    s.sfx('swell', 0.1, { dur: 2.0 }); s.sfx('shimmer', L('104', null, 0.45));
    const hw = (i) => [...ay.lines[i].querySelectorAll('.hl .w')];
    s.tl.fromTo(hw(1), { scale: 1 }, { scale: 1.1, duration: 0.2, stagger: { each: 0.14, repeat: 1, yoyo: true } }, L('105', 13, -0.05));
    s.tl.fromTo(hw(2), { scale: 1 }, { scale: 1.1, duration: 0.2, stagger: { each: 0.14, repeat: 1, yoyo: true } }, L('105', 21, -0.05));
    // "Do lafz."  →  RATQ · FATQ
    const tDo = L('106', null, -0.05), orn2 = ay.wrap.querySelectorAll('.orn')[1];
    s.tl.to(A.filter((_, i) => i !== 8 && i !== 9), { opacity: 0.26, duration: 0.5 }, tDo).to(ay.lines, { opacity: 0, duration: 0.4 }, tDo).to(orn2, { opacity: 0, duration: 0.3 }, tDo);
    const lab = (aw, txt, t) => { aw.style.position = 'relative';
      const l = el('div', 'cinzel', { position: 'absolute', left: '50%', top: '98%', width: '300px', marginLeft: '-150px', textAlign: 'center', direction: 'ltr', fontSize: '36px', fontWeight: 700, letterSpacing: '.3em', lineHeight: '1', color: '#F2C968', textShadow: '0 2px 10px rgba(0,0,0,.9)' }, txt); aw.appendChild(l);
      s.tl.to(aw, { color: '#F6CF6B', scale: 1.16, duration: 0.4, ease: 'power2.out' }, t).fromTo(l, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.35 }, t + 0.05); s.sfx('chime', t, { gain: 0.8 }); };
    lab(A[8], 'RATQ', L('107', 0, -0.08)); lab(A[9], 'FATQ', Math.max(L('107', 0) + 0.25, L('107', 2, -0.08)));
    s.div('vig');
  }, { fin: 0.3, z: 4 });

  // ───────── D4  RATQ = sewn shut   →   FATQ = unpicked, torn apart ─────────
  defScene('d4_cloth', T('108') - 0.2, T('114') + 0.2, (s) => {
    const L = LL(s), d = s.t1 - s.t0, xs = STITCH_X, N = STITCH_N;
    const tS0 = L('108', 2, -0.1), tS1 = Math.max(tS0 + 1.6, L('109', null, -0.05)), dt = (tS1 - 0.2 - tS0) / N;
    const tF = L('112', null, -0.1), tA = Math.max(tF + 0.3, L('112', 2)), tB = Math.max(tA + 0.6, L('113', null, -0.08)), tC = Math.max(tB + 0.3, L('113', 1, 0.05)), tD = Math.max(tB + 0.2, L('113', 2, -0.08));
    const wav = (x) => 9 * Math.sin(x * 0.011 + 1.3) + 5 * Math.sin(x * 0.027 + 0.4);
    const nx = (lt) => xs[0] + (lt - tS0) / dt * (xs[1] - xs[0]);
    const XA = xs[0] - 80, XB = xs[6] + 30, XC = W + 420;
    const ripX = (lt) => lt < tB ? lerp(XA, XB, clamp((lt - tA) / (tB - tA))) : lerp(XB, XC, clamp((lt - tB) / (tC - tB)));
    const popT = (i) => xs[i] <= XB ? tA + (tB - tA) * (xs[i] - XA) / (XB - XA) : tB + (tC - tB) * (xs[i] - XB) / (XC - XB);
    const Gop = (lt) => 30 * smooth(tA, tA + 0.5, lt) + 230 * ease.out3(clamp((lt - tD) / 1.0));
    const gap = (x, lt) => {
      if (lt < tA) { const c1 = Math.max(smooth(0, 1, (nx(lt) - 70 - x) / 220), smooth(tS1 - 0.3, tS1, lt)); return Math.max(0, (38 + wav(x)) * (1 - c1)); }
      return smooth(0, 1, (ripX(lt) - x) / 320) * (Gop(lt) + 0.4 * wav(x) * smooth(tA, tA + 0.5, lt));
    };
    const hole = (k, lt) => { const kk = clamp(k, 0, N - 1), g = gap(xs[kk], lt); return [xs[kk] - 12, 540 - g - 25, xs[kk] + 12, 540 + g + 25]; };
    const needle = (lt) => {
      const q = (lt - tS0) / dt, i = Math.floor(q), u = q - i, al = smooth(tS0 - 0.5, tS0 - 0.15, lt) * (1 - smooth(tS1 - 0.25, tS1 + 0.1, lt));
      if (al <= 0) return null; let x, y;
      if (i < 0) { const p = hole(0, lt); x = p[0] + 40 * q; y = p[1] + 60 * q; }
      else if (i >= N) { const p = hole(N - 1, lt); x = p[2] + 50 * (q - N); y = p[3] - 80 * (q - N); }
      else if (u < 0.7) { const p = hole(i, lt), a = u / 0.7; x = lerp(p[0], p[2], a); y = lerp(p[1], p[3], a); }
      else { const p = hole(i, lt), n2 = hole(i + 1, lt), a = (u - 0.7) / 0.3; x = lerp(p[2], n2[0], a); y = lerp(p[3], n2[1], a) - 26 * Math.sin(a * Math.PI); }
      return { x: x + 4, y: y + 6, ang: 1.15 + 0.22 * Math.sin(q * 6.283), al };
    };
    const light = (lt) => 0.45 * smooth(tA, tA + 0.8, lt) + 0.55 * smooth(tD, tD + 0.8, lt);
    const g1 = L('110', null, -0.1), g2 = L('111', 2, -0.1);
    const glint = (lt) => lt >= g2 ? lerp(-200, 2150, clamp((lt - g2) / 1.0)) : lerp(-200, 2150, clamp((lt - g1) / 0.8));
    const cam = s.div('fill', { transformOrigin: '50% 50%' });
    cam.appendChild(el('div', 'fill', { background: '#02040a' }));
    const lightEl = el('div', 'fill', { background: 'linear-gradient(180deg, rgba(2,4,10,0) 20%, #6a3d0c 33%, #ffd27a 44%, #fffaf0 50%, #ffd27a 56%, #6a3d0c 67%, rgba(2,4,10,0) 80%)', opacity: '0' }); cam.appendChild(lightEl);
    clothRig(s, cam, { xs, gap, sewn: (i, lt) => clamp((lt - (tS0 + i * dt)) / (0.7 * dt)), popT, needle, light, glint });
    s.onUpdate((lt) => { lightEl.style.opacity = light(lt).toFixed(3); });
    s.tl.fromTo(cam, { scale: 1.06 }, { scale: 1.0, duration: d, ease: 'none' }, 0);
    s.sfx('type', tS0, { dur: tS1 - tS0, gain: 0.5 }); s.sfx('thud', tS1, { gain: 0.9 }); s.sfx('shimmer', g1, { gain: 0.5 });
    [0, 2, 4].forEach((i) => s.sfx('pop', popT(i))); s.sfx('slash', tB); s.sfx('swell', tD, { dur: 1.4 });
    // word blocks (top-left)
    const blk = (ar, name, def, t0, t1, tDef) => {
      const b = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '300px' }, `<div style="position:absolute;left:-200px;top:-140px;width:1500px;height:560px;background:radial-gradient(ellipse at 42% 50%, rgba(3,5,14,.82) 0%, rgba(3,5,14,.5) 45%, rgba(3,5,14,0) 70%)"></div>
        <div style="position:absolute;left:110px;top:44px;display:flex;align-items:center;gap:44px"><div class="ar glowg" style="font-size:132px;line-height:1.75;color:#FFF3D2;white-space:nowrap">${ar}</div>
        <div><div class="cinzel gold sh" style="font-size:88px;font-weight:700;letter-spacing:.16em;line-height:1.1">${name}</div><div class="mont sh df" style="font-size:44px;font-weight:700;margin-top:6px;color:#fff">${def}</div></div></div>`);
      show(s, b, t0, t1, { opacity: 0, x: -40 }, 0.5); s.tl.fromTo(b.querySelector('.df'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4 }, tDef); return b;
    };
    blk(Q['w:ratqan'], 'RATQ', '= sila hua, <span style="color:#F2C968">band</span>', L('108', null, -0.05), tF, L('108', 9, -0.05));
    blk(Q['w:fafataqna'], 'FATQ', '= <span style="color:#F2C968">udhed</span> dena', tF + 0.05, null, L('112', 5, -0.08));
    s.sfx('shimmer', L('108', null, -0.05), { gain: 0.6 }); s.sfx('shimmer', tF + 0.05, { gain: 0.6 });
    // keywords on the lower cloth
    const k1 = L('109', null, -0.05), k2 = Math.max(k1 + 0.4, L('110', null, -0.05)), k3 = Math.max(k2 + 0.4, L('111', 2, -0.05));
    big(s, 'BAND', k1, k2, { size: 230, y: 660, mode: 'slam' });
    big(s, 'JUDI HUI', k2, k3, { size: 230, y: 660, mode: 'slam' });
    big(s, 'KOI <span style="color:#F2C968">DARZ</span> NAHI', k3, Math.max(k3 + 0.6, tF + 0.2), { size: 210, y: 670, mode: 'slam' });
    const bm = s.div('mont sh', { position: 'absolute', left: '0', right: '0', top: '610px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.2em' }, 'BEECH MEIN');
    show(s, bm, L('111', null, -0.03), Math.max(k3 + 0.6, tF + 0.2), { opacity: 0, y: 10 }, 0.3);
    big(s, 'CHEER KAR…', tB, Math.max(tB + 0.4, tD + 0.15), { size: 210, y: 680, mode: 'slam' });
    const al = big(s, 'ALAG', tD + 0.38, null, { size: 250, y: 425, mode: 'slam', cls: 'bebas', style: { color: '#1a0f04' } });
    s.tl.to(al, { letterSpacing: '.14em', duration: 1.4, ease: 'power1.out' }, tD + 0.7);
    s.div('vig');
  }, { fin: 0.4, z: 5 });

  // ───────── D5  the ayah's claim: sky + earth = one sewn piece … "phir Hum ne usay udhed diya" ─────────
  const tPopAbs = TW('116', 4) - 0.05;
  defScene('d5b_bang', tPopAbs - 0.2, T('120') + 0.15, (s) => {          // the cosmos behind the seam (also the backdrop of D6)
    const d = s.t1 - s.t0;
    footage(s, 'd_bang', { n: 456, speed: clamp(456 / (d * 30), 0.6, 1.3), kb: { s0: 1.03, s1: 1.14 } });
    s.div('vig');
  }, { z: 6 });
  defScene('d5_kainat', T('114') - 0.2, T('117') + 0.15, (s) => {
    const L = LL(s), d = s.t1 - s.t0, xs = STITCH_X;
    const tPh = L('116', null, -0.05), tPop = tPopAbs - s.t0, tFly = Math.max(tPop + 0.2, L('116', 5, -0.1)), dFly = clamp(L('117') - tFly, 0.45, 0.8);
    const ripR = (lt) => lerp(-30, 1500, clamp((lt - tPop) / 0.4));
    const gap = (x, lt) => lt < tPop ? 0 : smooth(0, 1, (ripR(lt) - Math.abs(x - 960)) / 300) * (34 * smooth(tPop, tPop + 0.3, lt) + 900 * Math.pow(clamp((lt - tFly) / dFly), 2.2));
    const g1 = L('115', 9, -0.15);
    const cam = s.div('fill', { transformOrigin: '50% 50%' });
    clothRig(s, cam, { xs, gap, sewn: () => 1, popT: (i) => tPop + 0.4 * (Math.abs(xs[i] - 960) + 30) / 1530, light: (lt) => smooth(tPop, tPop + 0.3, lt), glint: (lt) => lerp(-200, 2150, clamp((lt - g1) / 1.3)) });
    s.tl.fromTo(cam, { scale: 1.0 }, { scale: 1.045, duration: d, ease: 'none' }, 0);
    s.onUpdate((lt) => { const a = 5 * smooth(tPh, tPop, lt) * (lt < tFly ? 1 : 0); cam.style.translate = `${(noise1(lt * 36, 2) * a).toFixed(2)}px ${(noise1(lt * 39, 7) * a).toFixed(2)}px`; });   // the seam strains
    // embroidered labels travel with their cloth half
    const emb = (txt, top, dir, t) => { const w = el('div', null, { position: 'absolute', left: '0', right: '0', top: top + 'px', textAlign: 'center' }, `<div class="cinzel" style="font-size:112px;font-weight:700;color:#EDC469;text-shadow:0 3px 0 #5c4010,0 6px 16px rgba(0,0,0,.7)">${txt}</div>`); cam.appendChild(w);
      const i = w.firstChild; gsap.set(i, { autoAlpha: 0 }); s.tl.set(i, { autoAlpha: 1 }, t).fromTo(i, { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '.5em', duration: 0.7, ease: 'power2.out' }, t);
      s.onUpdate((lt) => { w.style.transform = `translateY(${(dir * gap(960, lt)).toFixed(2)}px)`; }); s.sfx('chime', t, { gain: 0.6 }); return w; };
    emb('AASMAN', 250, -1, L('115', 0, -0.08)); emb('ZAMEEN', 716, 1, L('115', 2, -0.08));
    const X = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' });      // everything that leaves before the rip
    const hd = el('div', 'cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '92px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.4em' }, 'TO AYAT KEH RAHI HAI:'); X.appendChild(hd);
    s.tl.fromTo(hd, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5 }, L('114', null, -0.02));
    const br = el('div', null, { position: 'absolute', left: '0', top: '0' }, `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;overflow:visible"><path class="bk" d="M1440 300H1476V780H1440M1476 540H1498" fill="none" stroke="#F2C968" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="bebas sh y1" style="position:absolute;left:1516px;top:410px;font-size:84px;color:#fff;white-space:nowrap">YEH POORI</div><div class="bebas sh y2" style="position:absolute;left:1516px;top:578px;font-size:84px;color:#F2C968">KAINAT</div>`); X.appendChild(br);
    const tK = L('115', 4, -0.08);
    s.tl.fromTo(br.querySelector('.bk'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5 }, tK).fromTo(br.querySelector('.y1'), { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35 }, L('115', 5, -0.08)).fromTo(br.querySelector('.y2'), { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35 }, L('115', 7, -0.08));
    const tg = el('div', null, { position: 'absolute', left: '0', right: '0', top: '592px', textAlign: 'center' }, `<div class="bebas" style="display:inline-block;font-size:72px;line-height:1;padding:14px 40px 6px;border-radius:14px;background:rgba(4,6,14,.78);border:2px solid rgba(233,185,85,.7);color:#fff">EK <span style="color:#F2C968">SILI HUI</span>, YAKJA CHEEZ</div>`); X.appendChild(tg);
    s.tl.fromTo(tg, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, L('115', 9, -0.08)); s.sfx('shimmer', g1, { gain: 0.6 });
    s.tl.to(X, { opacity: 0, duration: 0.3 }, tPh);
    const ar = s.div('ar glowg', { position: 'absolute', left: '0', right: '0', top: '6px', textAlign: 'center', fontSize: '124px', color: '#FFE9B0' }, Q['w:fafataqna']);
    show(s, ar, tPh + 0.05, Math.max(tPh + 0.5, tFly + 0.1), { opacity: 0, y: -20, scale: 0.9 }, 0.5);
    s.sfx('riser', tPh, { dur: Math.max(0.4, tFly - tPh) }); s.sfx('slash', tPop); s.sfx('impact', tFly, { gain: 1.3 }); s.sfx('subdrop', tFly);
    flash(s, tFly, { peak: 1, up: 0.05, dur: 0.9 });
    const ud = s.div('bebas', { position: 'absolute', left: '0', right: '0', top: '430px', textAlign: 'center', fontSize: '250px', lineHeight: '.95', color: '#FFE9A8', textShadow: '0 0 60px rgba(233,185,85,.7), 0 6px 30px rgba(0,0,0,.9)' }, 'UDHED DIYA');
    s.tl.fromTo(ud, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power4.in' }, tFly + 0.1).to(ud, { scale: 1.08, duration: Math.max(0.3, d - tFly - 0.34), ease: 'none' }, tFly + 0.34)
      .to(ud, { opacity: 0, duration: 0.3 }, Math.max(tFly + 0.4, d - 0.33));
    shake(s, ud, tFly + 0.34, 0.5, 16);
  }, { fin: 0.4, z: 7 });

  // ───────── D6  not a "modern" reading: Hasan Basri & Qatadah, 1300 years ago ─────────
  defScene('d6_tafsir', T('117') - 0.15, T('120') + 0.15, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    s.div('scrim-all', { background: 'rgba(5,3,10,.6)' });
    const tg = s.div(null, { position: 'absolute', left: '0', right: '0', top: '84px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px' }, `<div class="tag cyan q" style="font-size:34px;background:rgba(4,12,24,.6)">NAYI “MODERN” TAFSIR?</div><div class="anton n" style="font-size:64px;line-height:1;color:#FF4B4B;border:6px solid #FF4B4B;border-radius:10px;padding:6px 24px 0;transform:rotate(-4deg)">✗ NAHI</div>`);
    const tC = Math.max(L('118', null, -0.12), Math.min(L('118', 1, -0.05), L('118', 4, -0.45)));   // give the "NAHI" stamp a beat before the card arrives
    big(s, 'NAYI <span style="color:#6FD8FF">“MODERN”</span> TAFSIR?', L('117', 2, -0.1), tC + 0.2, { size: 190, y: 392, mode: 'fade', by: 'words', stagger: 0.16 });
    stamp(s, 'NAHI', L('117', 6, -0.08), { x: 716, y: 588, size: 150, rot: -6, out: tC + 0.2 }); s.sfx('thud', L('117', 6, 0.14));
    s.tl.fromTo(tg.querySelector('.q'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 }, tC + 0.1);
    s.tl.fromTo(tg.querySelector('.n'), { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.25 }, tC + 0.25);
    const c = s.div(null, { position: 'absolute', left: '250px', top: '196px', width: '1420px', height: '650px', borderRadius: '10px', overflow: 'hidden', background: '#e6d5ab', boxShadow: '0 40px 120px rgba(0,0,0,.75)' });
    c.appendChild(image('/gfx/img/c_parch.jpg', { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' }));
    const plate = (cls, ar, nm) => `<div class="${cls}" style="width:520px;text-align:center"><div style="font-family:'Aref Ruqaa',serif;direction:rtl;font-size:92px;line-height:1.35;color:#4a240c">${ar}</div><div class="cinzel" style="font-size:36px;font-weight:700;letter-spacing:.22em;color:#5b3a1a">${nm}</div></div>`;
    const B = (t) => `<b style="font-style:normal;font-weight:900;color:#8a2c0e">${t}</b>`;
    c.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:14px;top:14px;right:14px;bottom:14px;border:2px solid rgba(110,74,30,.55);border-radius:6px"></div><div style="position:absolute;left:21px;top:21px;right:21px;bottom:21px;border:1px solid rgba(110,74,30,.35);border-radius:4px"></div>
      <div class="cinzel hd" style="position:absolute;left:64px;top:48px;font-size:32px;font-weight:700;letter-spacing:.42em;color:#8a4a1c">TABI'EEN KE IMAM</div>
      <div style="position:absolute;left:0;right:0;top:96px;display:flex;justify-content:center;align-items:center;gap:30px">${plate('p1', AR.hasan, 'HASAN BASRI')}<div class="serif au" style="font-size:44px;font-style:italic;color:#6b4a22">aur</div>${plate('p2', AR.qatadah, 'QATADAH')}</div>
      <div class="dv" style="position:absolute;left:260px;right:260px;top:306px;height:2px;background:linear-gradient(90deg,rgba(110,74,30,0),rgba(110,74,30,.8),rgba(110,74,30,0))"></div>
      <div class="play q" style="position:absolute;left:90px;right:90px;top:336px;text-align:center;font-size:66px;font-style:italic;font-weight:600;line-height:1.3;color:#2e1f0e">“Dono ${B('jude')} ${B('hue')} the —<br>phir Allah ne unhein ${B('juda')} kar diya.”</div>
      <div class="cinzel src" style="position:absolute;left:0;right:0;bottom:46px;text-align:center;font-size:28px;font-weight:700;letter-spacing:.24em;color:#6b4a22">— Tafsir Ibn Kathir · 21:30</div>`);
    gsap.set(c, { autoAlpha: 0 }); s.tl.set(c, { autoAlpha: 1 }, tC).fromTo(c, { y: 90, opacity: 0, rotateX: 18, transformPerspective: 1400 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: 'back.out(1.15)' }, tC); s.sfx('paper', tC);
    s.tl.fromTo(c, { scale: 1 }, { scale: 1.025, duration: Math.max(1, d - tC - 0.7), ease: 'none' }, tC + 0.7);
    s.tl.fromTo(c.querySelector('.p1'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45 }, L('118', 4, -0.1)).fromTo(c.querySelector('.au'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, L('118', 6, -0.05)).fromTo(c.querySelector('.p2'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45 }, L('118', 7, -0.1));
    s.sfx('chime', L('118', 4), { gain: 0.6 }); s.sfx('chime', L('118', 7), { gain: 0.6 });
    stamp(s, '1300 SAAL PEHLE', L('118', 10, -0.05), { x: 1168, y: 222, size: 44, rot: 5, cls: '', style: { color: '#a02c14', borderWidth: '6px' } }); s.sfx('thud', L('118', 10, 0.17), { gain: 0.7 });
    s.tl.fromTo(c.querySelector('.dv'), { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, L('118', 13, -0.05));
    words(c.querySelector('.q')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, L('119', i, -0.06)));
    s.tl.fromTo(c.querySelector('.src'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, L('119', 9));
    s.div('vig');
  }, { fin: 0.3, z: 8 });

  // ───────── D7  "Awalam yara" — did they not SEE?  →  7th century: no one … 1964: they did ─────────
  defScene('d7_dekha', T('120') - 0.15, T('126') + 0.15, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const tB = L('122', null, -0.1), tC = L('124', null, -0.08), tOpA = L('121', 5, -0.1), tCl = Math.max(tB + 0.1, L('122', 3, -0.05)), tOpC = L('125', 3, -0.08);
    const st = stage3d(s, { bg: 0x02030a, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.3, seed: 52 });
    st.frame = (lt) => { bd.update(lt * 2 + 3); st.camera.position.set(0, 0, 10); st.camera.rotation.z = lt * 0.004; };
    s.div('scrim-all', { background: 'rgba(2,4,12,.5)' });
    // A: the first word of the ayah
    const PA = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' });
    const line = el('div', 'ayah-ar glowg', { position: 'absolute', left: '0', right: '0', top: '46px', fontSize: '62px', lineHeight: '1.9', padding: '0', margin: '0' }); PA.appendChild(line);
    const aws = Q['21:30a'].split(/\s+/).map((w) => { const sp = el('span', 'aw', null, w); line.appendChild(sp); line.appendChild(document.createTextNode(' ')); return sp; });
    s.tl.fromTo(line, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.6 }, L('120', null, -0.02));
    const tHl = L('120', 3, -0.08);
    s.tl.to([aws[0], aws[1]], { color: '#F6CF6B', scale: 1.14, duration: 0.4 }, tHl).to(aws.slice(2), { opacity: 0.3, duration: 0.4 }, tHl); s.sfx('chime', tHl, { gain: 0.7 });
    const bigAr = el('div', 'ar glowg', { position: 'absolute', left: '110px', width: '850px', top: '176px', textAlign: 'center', fontSize: '186px', color: '#FFE9B0', whiteSpace: 'nowrap' }, Q['w:awalam_yara']); PA.appendChild(bigAr);
    s.tl.fromTo(bigAr, { opacity: 0, y: -60, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, L('121', 0, -0.12)); s.sfx('shimmer', L('121', 0, -0.12));
    const trl = el('div', 'cinzel gold sh', { position: 'absolute', left: '110px', width: '850px', top: '552px', textAlign: 'center', fontSize: '60px', fontWeight: 700, letterSpacing: '.18em', whiteSpace: 'nowrap' }, 'AWALAM YARA'); PA.appendChild(trl);
    s.tl.fromTo(trl, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, L('121', 1, -0.1));
    const trn = el('div', 'play sh', { position: 'absolute', left: '110px', width: '850px', top: '676px', textAlign: 'center', fontSize: '66px', fontStyle: 'italic', fontWeight: 600 }, '“kya unhone <span style="color:#F2C968;font-style:normal;font-weight:900">DEKHA</span> nahi?”'); PA.appendChild(trn);
    words(trn).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, L('121', 3 + i, -0.06)));
    s.tl.to(PA, { opacity: 0, duration: 0.25 }, Math.max(0, tB - 0.15)).set(PA, { autoAlpha: 0 }, tB + 0.1);
    // the lens / iris (abstract aperture)
    const IR = svg(s, `<defs><radialGradient id="dIrG"><stop offset="0" stop-color="#F6CF6B" stop-opacity=".6"/><stop offset=".6" stop-color="#B8862E" stop-opacity=".28"/><stop offset="1" stop-color="#B8862E" stop-opacity="0"/></radialGradient>
        <radialGradient id="dIrW"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#FFF1CC"/><stop offset=".85" stop-color="#F2B95A"/><stop offset="1" stop-color="#8a4a12"/></radialGradient>
        <linearGradient id="dIrB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2444"/><stop offset="1" stop-color="#090d1c"/></linearGradient><clipPath id="dIrC"><circle r="298"/></clipPath></defs>
      <circle r="298" fill="#04060d"/><circle class="gg" r="298" fill="url(#dIrG)" opacity="0"/><circle class="gw" r="298" fill="url(#dIrW)" opacity="0"/>
      <g clip-path="url(#dIrC)">${Array.from({ length: 8 }, () => `<path class="bl" fill="url(#dIrB)" stroke="rgba(233,185,85,.5)" stroke-width="2" stroke-linejoin="round"/>`).join('')}</g>
      <circle r="300" fill="none" stroke="#E9B955" stroke-width="4"/><circle r="324" fill="none" stroke="rgba(233,185,85,.35)" stroke-width="1.5"/>
      <path d="${Array.from({ length: 72 }, (_, i) => { const a = i * Math.PI / 36, r0 = 306, r1 = i % 6 ? 313 : 320; return `M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)}L${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}`; }).join('')}" stroke="rgba(233,185,85,.7)" stroke-width="2"/>`, { x: 1060, y: 180, w: 680, h: 680, vb: '-340 -340 680 680' });
    const bl = [...IR.querySelectorAll('.bl')], gg = IR.querySelector('.gg'), gw = IR.querySelector('.gw'), ir = { r: 0, g: 0, w: 0 };
    s.tl.fromTo(IR, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, L('120', null, 0.1));
    s.tl.to(ir, { r: 178, g: 1, duration: 0.5, ease: 'back.out(1.5)' }, tOpA).to(ir, { r: 0, g: 0, duration: 0.5, ease: 'power2.in' }, tCl).to(ir, { r: 268, w: 1, duration: 0.45, ease: 'power3.out' }, tOpC);
    s.sfx('camera', tOpA); s.sfx('slam', tCl + 0.45, { gain: 0.7 });
    s.onUpdate((lt) => {
      const tr = smooth(tC, tOpC, lt) * (lt < tOpC ? 1 : 0), r = ir.r + tr * 9 * Math.abs(noise1(lt * 14, 4)), tw = (1 - r / 270) * 1.05 + lt * 0.02;
      const V = [], O = []; for (let k = 0; k <= 8; k++) { const a = k * Math.PI / 4 + tw; V.push([r * Math.cos(a), r * Math.sin(a)]); O.push([336 * Math.cos(a + 0.9), 336 * Math.sin(a + 0.9)]); }
      bl.forEach((p, k) => p.setAttribute('d', `M${V[k][0].toFixed(1)} ${V[k][1].toFixed(1)}L${V[k + 1][0].toFixed(1)} ${V[k + 1][1].toFixed(1)}L${O[k + 1][0].toFixed(1)} ${O[k + 1][1].toFixed(1)}L${O[k][0].toFixed(1)} ${O[k][1].toFixed(1)}Z`));
      gg.setAttribute('opacity', ir.g.toFixed(3)); gw.setAttribute('opacity', Math.max(ir.w, tr * 0.6).toFixed(3));
    });
    const inA = s.div('anton', { position: 'absolute', left: '1100px', width: '600px', top: '452px', textAlign: 'center', fontSize: '112px', lineHeight: '1.2', color: '#FFE9B0', textShadow: '0 0 40px rgba(233,185,85,.8)' }, 'DEKHA');
    s.tl.fromTo(inA, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, tOpA + 0.05).to(inA, { opacity: 0, scale: 0.6, duration: 0.3 }, tCl);
    // B: 7th century — who could see?
    const PB = s.div(null, { position: 'absolute', left: '110px', top: '0', width: '850px', height: '1080px', textAlign: 'center' });
    PB.innerHTML = `<div class="bebas sh c7" style="position:absolute;left:0;right:0;top:244px;font-size:230px;line-height:.95">7WIN SADI</div>
      <div class="mont sh kq" style="position:absolute;left:0;right:0;top:500px;font-size:60px;font-weight:800">kaun <span style="color:#6FD8FF">dekh</span> sakta tha?</div>
      <div class="anton kn glowr" style="position:absolute;left:0;right:0;top:616px;font-size:170px;line-height:1.1;color:#FF4B4B">KOI NAHI.</div>`;
    s.tl.fromTo(PB.querySelector('.c7'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, tB + 0.1).fromTo(PB.querySelector('.kq'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, tCl);
    s.tl.fromTo(PB.querySelector('.kn'), { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power4.in' }, L('123', null, -0.08)); s.sfx('thud', L('123', null, 0.14)); shake(s, PB, L('123', null, 0.14), 0.4, 10);
    s.tl.to(PB, { opacity: 0, duration: 0.25 }, Math.max(0, tC - 0.2)).set(PB, { autoAlpha: 0 }, tC + 0.05);
    // C: … but in 1964
    const PC = s.div(null, { position: 'absolute', left: '110px', top: '0', width: '850px', height: '1080px', textAlign: 'center' });
    PC.innerHTML = `<div class="mono cyan sh lk" style="position:absolute;left:0;right:0;top:214px;font-size:34px;font-weight:700;letter-spacing:.4em">LEKIN…</div>
      <div class="bebas sh yr" style="position:absolute;left:0;right:0;top:262px;font-size:340px;line-height:.95;color:#B9ECFF"></div>
      <div class="bebas sh iw" style="position:absolute;left:0;right:0;top:616px;font-size:110px">INSAAN NE <span style="color:#F2C968">WAQAI</span>…</div>`;
    const yn = PC.querySelector('.yr'), yv = { v: 650 }, dY = Math.max(0.5, L('124', 1, 0.3) - tC);
    gsap.set(PC, { autoAlpha: 0 }); s.tl.set(PC, { autoAlpha: 1 }, tC).fromTo(PC.querySelector('.lk'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tC).fromTo(yn, { opacity: 0 }, { opacity: 1, duration: 0.25 }, tC + 0.05);
    s.tl.to(yv, { v: 1964, duration: dY, ease: 'power2.inOut' }, tC + 0.05).fromTo(yn, { scale: 1.2 }, { scale: 1, duration: 0.35, ease: 'power3.out' }, tC + dY);
    s.onUpdate(() => { yn.textContent = String(Math.round(yv.v)); });
    s.sfx('clock', tC, { dur: dY }); s.sfx('hit', tC + dY + 0.05, { gain: 0.6 }); s.sfx('riser', Math.max(tC, tOpC - 1.4), { dur: Math.min(1.4, tOpC - tC) });
    words(PC.querySelector('.iw')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, L('125', i, -0.06)));
    flash(s, tOpC, { peak: 0.75, dur: 0.7, color: '#FFF3D2' }); s.sfx('impact', tOpC + 0.05); s.sfx('shimmer', tOpC + 0.1);
    const inC = s.div('anton', { position: 'absolute', left: '1100px', width: '600px', top: '370px', textAlign: 'center', fontSize: '150px', lineHeight: '1.0', color: '#120a02' }, 'DEKH<br>LIYA');
    s.tl.fromTo(inC, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, tOpC + 0.05).to(inC, { scale: 1.06, duration: Math.max(0.3, d - tOpC - 0.45), ease: 'none' }, tOpC + 0.45);
    s.div('vig');
  }, { fin: 0.3, z: 9 });

  // ───────── D8  …and here the pigeons enter the story ─────────
  defScene('d8_kabootar', T('126') - 0.15, P1 + 0.3, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x02040b, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.5, seed: 77, rx: 0.5 });
    st.frame = (lt) => { bd.update(lt * 3 + 20); st.camera.position.set(0, 0, 10); st.camera.rotation.z = -lt * 0.01; };
    s.div('scrim-b');
    const R = rng(126), t0 = L('126', 3, -0.5);
    const birds = Array.from({ length: 7 }, (_, i) => {
      const b = s.div(null, { position: 'absolute', left: '0', top: '0', width: '240px', height: '170px' }, `<svg width="240" height="170" viewBox="-6 -60 240 170" style="overflow:visible">${BIRD}</svg>`);
      return { b, w1: b.querySelector('.w1'), w2: b.querySelector('.w2'), t: t0 + i * 0.17 + R() * 0.08, dur: 1.9 + R() * 0.7, y: 150 + R() * 520, sc: 0.75 + R() * 0.95, fq: 15 + R() * 5, ph: R() * 6.28, up: 60 + R() * 160 };
    });
    s.onUpdate((lt) => birds.forEach((o) => {
      const u = (lt - o.t) / o.dur, x = lerp(-340, 2100, u), y = o.y - o.up * u + 22 * Math.sin(lt * 5 + o.ph), f = Math.cos(lt * o.fq + o.ph), f2 = Math.cos(lt * o.fq + o.ph - 0.5);
      o.b.style.opacity = u < 0 || u > 1.05 ? '0' : '1';
      o.b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${o.sc.toFixed(3)}) rotate(${(-8 + 5 * Math.sin(lt * 3 + o.ph)).toFixed(2)}deg)`;
      o.w1.setAttribute('transform', `translate(0 86) scale(1 ${(0.12 + 0.88 * f).toFixed(3)}) translate(0 -86)`); o.w2.setAttribute('transform', `translate(0 84) scale(1 ${(0.12 + 0.88 * f2).toFixed(3)}) translate(0 -84)`);
    }));
    s.sfx('flutter', t0 + 0.1, { gain: 1 }); s.sfx('flutter', t0 + 0.9, { gain: 0.8 });
    const c = cap(s, '…aur yahan kahani mein <span class="hl">KABOOTAR</span> aate hain', L('126', null, 0.02), d + 0.4, { size: 54, bottom: 150 });
    s.tl.fromTo(c.querySelectorAll('.hl .w'), { y: 0 }, { y: -14, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, L('126', 4, -0.03));
    s.div('vig');
  }, { fin: 0.3, fout: 0.3, z: 10 });
}
