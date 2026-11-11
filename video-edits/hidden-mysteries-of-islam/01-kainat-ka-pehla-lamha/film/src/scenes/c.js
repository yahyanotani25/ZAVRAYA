// PART C — "Do lafz: La-musi'un" (spoken lines 61..91).  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
// Scenes are stacked with rising z: an incoming scene fades in ON TOP of the previous one (which stays opaque underneath) -> order-independent dissolves.
import { defScene, stage3d, T, TW, gsap, el, image, track, clamp, lerp, smooth, noise1, rng } from '../engine.js';
import { cap, big, dateline, flash, show, footage, svg, shake, words, ayah } from '../ui.js';
import { spaceBackdrop, galaxyField } from '../kit3d.js';
import { Q, REF, AR } from '../quran.js';

const LL = (s) => (id, n, o = 0) => Math.max(0, (n == null ? T(id) : TW(id, n)) - s.t0 + o);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
const io2 = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));

// footage with an arbitrary time -> frame map (pause / slow / reverse)
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
// film-strip bars (top + bottom): the perforations travel with the film frame, so they visibly stop / reverse
function filmBars(s, frameAt, tIn) {
  const mk = (top) => {
    const b = s.div(null, { position: 'absolute', left: '0', right: '0', [top ? 'top' : 'bottom']: '0', height: '60px', background: '#000', overflow: 'hidden' });
    const p = el('div', null, { position: 'absolute', left: '-120px', right: '-120px', top: '17px', height: '26px', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 26px, rgba(235,240,255,.8) 26px, rgba(235,240,255,.8) 62px, rgba(0,0,0,0) 62px, rgba(0,0,0,0) 88px)' });
    b.appendChild(p); return [b, p];
  };
  const [b1, p1] = mk(true), [b2, p2] = mk(false);
  if (tIn != null) { s.tl.fromTo(b1, { yPercent: -100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out' }, tIn); s.tl.fromTo(b2, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out' }, tIn); }
  s.onUpdate((lt) => { const x = -((((frameAt(lt) * 7) % 88) + 88) % 88); p1.style.transform = p2.style.transform = `translateX(${x.toFixed(2)}px)`; });
}
// thin tracking streaks while the film runs backwards
function rewindFx(s, t0, t1) {
  const ls = [0, 1, 2, 3].map(() => s.div(null, { position: 'absolute', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.6) 30%, rgba(255,255,255,.25) 70%, rgba(255,255,255,0))', opacity: '0' }));
  s.onUpdate((lt) => { const on = lt >= t0 && lt < t1; ls.forEach((l, i) => { if (!on) { l.style.opacity = '0'; return; } const r = rng(Math.floor(lt * 15) * 7 + i * 131 + 5); l.style.top = (80 + r() * 900).toFixed(0) + 'px'; l.style.height = (2 + r() * 5).toFixed(0) + 'px'; l.style.opacity = (0.12 + r() * 0.45).toFixed(2); }); });
}

// little SVG car (faces right; wheels touch y = 96)
const WHEEL = (x) => `<g transform="translate(${x} 78)"><circle r="18" fill="#0a0d16" stroke="#cfd6e6" stroke-width="3.5"/><g class="sp"><path d="M-12 0H12M0 -12V12M-8.5 -8.5L8.5 8.5M-8.5 8.5L8.5 -8.5" stroke="#cfd6e6" stroke-width="2.4"/></g><circle r="4.5" fill="#cfd6e6"/></g>`;
const CAR = `<ellipse cx="117" cy="97" rx="112" ry="6" fill="rgba(0,0,0,.5)"/>
  <path class="beam" d="M226 49 L350 22 L350 92 L226 58 Z" fill="url(#cBeam)"/>
  <g class="sl" stroke="#6FD8FF" stroke-width="4" stroke-linecap="round"><path d="M-70 30H-14M-96 50H-22M-60 68H-12"/></g>
  <path d="M8 74 L8 56 Q9 46 24 43 L58 38 Q78 12 108 10 L150 10 Q176 11 194 38 L214 43 Q226 46 226 58 L226 74 Q226 78 222 78 L12 78 Q8 78 8 74 Z" fill="#ECE7DB"/>
  <path d="M68 38 Q84 19 108 18 L121 18 L121 38 Z M130 18 L150 18 Q169 19 183 38 L130 38 Z" fill="#0b1326"/>
  <rect x="8" y="57" width="218" height="6" fill="#6FD8FF"/>
  <rect x="213" y="46" width="13" height="9" rx="3" fill="#FFE9A8"/><rect class="brake" x="6" y="47" width="7" height="10" rx="2" fill="#FF4B4B"/>
  ${WHEEL(58)}${WHEEL(176)}`;
const LEMP = (t) => { const sn = Math.sin(t), c = Math.cos(t), dn = 1 + sn * sn; return [70 * c / dn, 88 * sn * c / dn]; };
const LEM = 'M' + Array.from({ length: 97 }, (_, i) => LEMP(i / 96 * Math.PI * 2).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
const STAR4 = (r) => `M0 ${-r}L${r * 0.24} ${-r * 0.24}L${r} 0L${r * 0.24} ${r * 0.24}L0 ${r}L${-r * 0.24} ${r * 0.24}L${-r} 0L${-r * 0.24} ${-r * 0.24}Z`;

export default function ([P0, P1]) {
  // ───────── C1  night sky · 1929 → 620 · the ayah 51:47 · "La-musi'un" ─────────
  defScene('c1_ayah', P0, T('66') + 0.15, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const tRoll = L('62', 8, -0.35), dRoll = Math.max(1.0, L('62', 12) - tRoll), tCard = L('62b', null, -0.2);
    const tDim = L('64', null, -0.05), tLift = L('64', 1, -0.1), tStop = L('64', 4, -0.08), tWord = L('65', null, -0.1);
    const N = 538, sp = Math.min(1, (N - 6) / ((tStop + 0.35) * 30));
    clip(s, 'c_sky', N, (lt) => { const u = clamp((lt - tStop) / 0.7); return 30 * sp * (Math.min(lt, tStop) + 0.7 * (u - u * u / 2)); },   // the sky itself stops on "rukiye"
      (lt) => `scale(${(1.02 + 0.1 * lt / d).toFixed(5)})`);
    const wash = s.div('fill', { background: 'radial-gradient(ellipse 80% 62% at 50% 100%, rgba(233,185,85,.36) 0%, rgba(233,185,85,.11) 45%, rgba(233,185,85,0) 76%)' });   // science-blue → gold
    s.tl.fromTo(wash, { opacity: 0 }, { opacity: 1, duration: dRoll + 0.8, ease: 'power1.inOut' }, tRoll);
    s.div('scrim-b'); s.div('scrim-t');
    // "Aur ab…"
    const ab = s.div('cinzel sh', { position: 'absolute', left: '0', right: '0', top: '455px', textAlign: 'center', fontSize: '92px', fontWeight: 700, color: '#F8DE9A' }, 'AUR AB…');
    gsap.set(ab, { autoAlpha: 0 });
    const tAbOut = Math.max(L('61') + 0.9, L('62', 4, -0.25));
    s.tl.set(ab, { autoAlpha: 1 }, L('61')).fromTo(ab, { opacity: 0, letterSpacing: '1.1em' }, { opacity: 1, letterSpacing: '.42em', duration: 1.1, ease: 'power2.out' }, L('61'))
      .to(ab, { opacity: 0, y: -30, duration: 0.35, ease: 'power2.in' }, tAbOut - 0.35).set(ab, { autoAlpha: 0 }, tAbOut);
    s.sfx('swell', L('61'), { dur: 1.6, gain: 0.7 });
    cap(s, '…woh <span class="hl">ayat</span> suniye', L('62', null, -0.05), Math.max(L('62') + 0.8, L('62', 4, 0.1)), { bottom: 130 });
    // year scrubber: 1929 → 620
    const ticks = [];
    for (let y = 500; y <= 2000; y += 20) { const maj = y % 100 === 0, x = (y - 500) * 1.3;
      ticks.push(`<div style="position:absolute;left:${x.toFixed(1)}px;top:0;width:2px;height:${maj ? 26 : 12}px;background:rgba(255,255,255,${maj ? 0.8 : 0.35})"></div>` + (maj ? `<div class="mono" style="position:absolute;left:${(x - 40).toFixed(1)}px;top:32px;width:80px;text-align:center;font-size:20px;letter-spacing:.05em;color:rgba(255,255,255,.6)">${y}</div>` : '')); }
    const yb = s.div(null, { position: 'absolute', left: '0', right: '0', top: '250px', textAlign: 'center' }, `
      <div class="mono sh lab0" style="font-size:30px;font-weight:700;letter-spacing:.42em;color:#B9ECFF">US WAQT</div>
      <div class="bebas sh yr" style="font-size:300px;line-height:.92;letter-spacing:.03em;margin-top:6px">1929</div>
      <div style="position:relative;width:1200px;height:64px;margin:4px auto 0;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,0),#000 18%,#000 82%,rgba(0,0,0,0));mask-image:linear-gradient(90deg,rgba(0,0,0,0),#000 18%,#000 82%,rgba(0,0,0,0))"><div class="strip" style="position:absolute;left:0;top:0">${ticks.join('')}</div></div>
      <div style="margin:-66px auto 0;width:0;border-left:8px solid rgba(0,0,0,0);border-right:8px solid rgba(0,0,0,0);border-top:13px solid #F2C968;position:relative"></div>
      <div class="cinzel sh lab1" style="font-size:52px;font-weight:700;letter-spacing:.42em;color:#F2C968;margin-top:86px">1300 SAAL PEHLE</div>`);
    const yn = yb.querySelector('.yr'), strip = yb.querySelector('.strip'), yr = { v: 1929 };
    show(s, yb, L('62', 4, -0.15), tCard + 0.1, { opacity: 0, scale: 0.92 }, 0.5);
    s.tl.to(yr, { v: 620, duration: dRoll, ease: 'power2.inOut' }, tRoll);
    s.tl.to(yb.querySelector('.lab0'), { opacity: 0, duration: 0.3 }, tRoll);
    s.tl.fromTo(yb.querySelector('.lab1'), { opacity: 0, letterSpacing: '.9em' }, { opacity: 1, letterSpacing: '.42em', duration: 0.7, ease: 'power2.out' }, tRoll + dRoll * 0.7);
    s.onUpdate(() => { const k = clamp((1929 - yr.v) / 1309); yn.textContent = String(Math.round(yr.v)); yn.style.color = mix('#CFEFFF', '#F6CF6B', k); strip.style.transform = `translateX(${(600 - (yr.v - 500) * 1.3).toFixed(2)}px)`; });
    s.sfx('rewind', tRoll, { dur: dRoll }); s.sfx('chime', tRoll + dRoll * 0.75, { gain: 0.7 });
    cap(s, 'Quran mein <span class="hl">nazil ho chuki thi</span>', L('62', 12, -0.1), Math.max(L('62', 12) + 0.9, tCard), { bottom: 130 });
    // the ayah
    const ay = ayah(s, { ref: REF['51:47'], ar: Q['51:47'], tr: `Aur aasman ko Hum ne <span class="hl">quwwat</span> se banaya —|aur yaqeenan Hum <span class="hl">wus'at dene wale</span> hain.`,
      t0: tCard, tAr: L('62b', null, 0.45), dAr: clamp(L('63') - L('62b') - 1.5, 1.2, 3.0), trTimes: [L('63', null, -0.08), L('63', 9, -0.08)], size: 108, trSize: 46 });
    const A = ay.aws, orns = ay.wrap.querySelectorAll('.orn'), hw = (i) => [...ay.lines[i].querySelectorAll('.hl .w')];
    s.sfx('swell', tCard, { dur: 2.0 }); s.sfx('shimmer', L('62b', null, 0.45));
    s.tl.to(A[2], { color: '#F6CF6B', duration: 0.4 }, L('63', 5, -0.1)).to(A[2], { color: '#FFF7E2', duration: 0.6 }, L('63', 9, -0.1));
    s.tl.fromTo(hw(0), { scale: 1 }, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }, L('63', 5, -0.05));
    s.tl.to([A[3], A[4]], { color: '#F6CF6B', duration: 0.5 }, L('63', 12, -0.1));
    s.tl.fromTo(hw(1), { scale: 1 }, { scale: 1.1, duration: 0.2, stagger: { each: 0.14, repeat: 1, yoyo: true }, ease: 'power2.out' }, L('63', 12, -0.05));
    s.sfx('chime', L('63', 12));
    // "Is aakhri lafz par rukiye" — everything else falls away, the last word lifts to the centre
    s.tl.to(A.slice(0, 4), { opacity: 0.16, duration: 0.5 }, tDim).to(ay.lines, { opacity: 0, duration: 0.45 }, tDim).to(orns, { opacity: 0, duration: 0.45 }, tDim)
      .to(A.slice(0, 4), { opacity: 0, duration: 0.5 }, Math.max(tDim + 0.5, tStop - 0.45)).to(ay.ref, { y: -170, duration: 0.8, ease: 'power2.inOut' }, tLift);
    const gl = s.div(null, { position: 'absolute', left: '960px', top: '416px', width: '1500px', height: '560px', marginLeft: '-750px', marginTop: '-280px', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.24) 0%, rgba(233,185,85,0) 64%)' });
    s.tl.fromTo(gl, { opacity: 0 }, { opacity: 1, duration: 1.2 }, tLift);
    const hero = s.div('ayah-ar glowg', { position: 'absolute', left: '0', top: '0', padding: '0', margin: '0', fontSize: '108px', whiteSpace: 'nowrap', color: '#F6CF6B' }, `<span class="aw" style="margin:0">${Q['w:lamusiun']}</span>`);
    const inner = ay.ar.parentNode, hk = { k: 0 };
    gsap.set(hero, { autoAlpha: 0 });
    s.tl.set(hero, { autoAlpha: 1 }, tLift).set(A[4], { autoAlpha: 0 }, tLift).to(hk, { k: 1, duration: Math.max(0.7, tStop - tLift + 0.2), ease: 'power2.inOut' }, tLift);
    s.onUpdate((lt) => {
      if (lt < tLift - 0.2) return;
      const a = A[4], x0 = inner.offsetLeft + a.offsetLeft + a.offsetWidth / 2, y0 = inner.offsetTop + a.offsetTop + a.offsetHeight / 2;
      hero.style.transform = `translate(${lerp(x0, 960, hk.k).toFixed(2)}px, ${lerp(y0, 416, hk.k).toFixed(2)}px) translate(-50%,-50%) scale(${(lerp(1, 2.35, hk.k) * (1 + 0.05 * clamp((lt - tStop) / Math.max(0.5, d - tStop)))).toFixed(4)})`;
    });
    const chipA = s.div(null, { position: 'absolute', left: '0', right: '0', top: '694px', textAlign: 'center' }, '<div class="chip">ayat ka aakhri lafz</div>');
    show(s, chipA, tLift + 0.35, Math.max(tLift + 0.9, tWord), { opacity: 0, y: 16 }, 0.4);
    // pause motif
    const pz = s.div('mono sh', { position: 'absolute', right: '110px', top: '96px', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em', color: '#F8DE9A' }, '❚❚&nbsp; RUKIYE');
    show(s, pz, tStop, null, { opacity: 0, x: 30 }, 0.4); s.sfx('subdrop', tStop, { gain: 0.7 }); s.sfx('tick', tStop);
    const ring = s.div(null, { position: 'absolute', left: '580px', top: '226px', width: '760px', height: '380px', borderRadius: '50%', border: '2px solid rgba(248,222,154,.85)' });
    s.tl.fromTo(ring, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.45, ease: 'power2.out' }, tStop).to(ring, { scale: 1.4, opacity: 0, duration: 1.3, ease: 'power1.out' }, tStop + 0.45);
    // "La-musi'un"
    const tr = s.div(null, { position: 'absolute', left: '0', right: '0', top: '676px', textAlign: 'center' }, `<div class="orn" style="margin:0 auto 24px;width:620px"></div><div class="cinzel gold sh nm" style="font-size:84px;font-weight:700">LA-MUSI'UN</div>`);
    gsap.set(tr, { autoAlpha: 0 });
    s.tl.set(tr, { autoAlpha: 1 }, tWord).fromTo(tr.querySelector('.orn'), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, tWord)
      .fromTo(tr.querySelector('.nm'), { opacity: 0, letterSpacing: '.9em' }, { opacity: 1, letterSpacing: '.3em', duration: 0.8, ease: 'power2.out' }, tWord);
    s.sfx('shimmer', tWord, { gain: 1 });
    s.div('vig');
  }, { fin: 0.3, z: 1 });

  // ───────── C2  the grammar lesson: ① KAAM (fi'l)  vs  ② PEHCHAAN (sifat) ─────────
  defScene('c2_grammar', T('66') - 0.15, T('73') + 0.15, (s) => {
    const L = LL(s);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 36%, #101c3d 0%, #070c1c 58%, #02040a 100%)' });
    s.div('fill', { backgroundImage: 'radial-gradient(rgba(150,190,255,.13) 1.5px, rgba(0,0,0,0) 2.2px)', backgroundSize: '48px 48px' });
    const hd = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '74px', textAlign: 'center', fontSize: '96px' }, 'ARABI MEIN KAAM BATANE KE <span class="two" style="display:inline-block;color:#F2C968">2 TAREEQE</span>');
    show(s, hd, L('66', null, -0.02), null, { opacity: 0, y: -24 }, 0.5);
    const tCards = L('66', 5, -0.05);
    s.tl.fromTo(hd.querySelector('.two'), { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }, tCards);
    const hdr = (n, col, title, sub) => `<div style="position:absolute;left:40px;top:28px;display:flex;align-items:center;gap:22px"><div class="mono num" style="width:66px;height:66px;border-radius:50%;border:3px solid ${col};color:${col};font-size:38px;font-weight:700;display:flex;align-items:center;justify-content:center;letter-spacing:0">${n}</div><div class="bebas ttl" style="font-size:84px;line-height:1;padding-top:6px;color:#fff">${title}</div><div class="serif" style="font-size:46px;font-style:italic;color:rgba(245,241,232,.62)">${sub}</div></div>`;
    const sent = (t) => `<div class="play sent" style="position:absolute;left:44px;right:30px;top:128px;font-size:58px;font-style:italic;font-weight:600;color:#fff">${t}</div>`;
    const cL = s.div('panel', { left: '110px', top: '222px', width: '830px', height: '660px' }), cR = s.div('panel', { left: '980px', top: '222px', width: '830px', height: '660px' });
    cL.innerHTML = hdr(1, '#6FD8FF', 'KAAM', '(fi\'l)') + sent('“Ahmad ne gaadi chalayi.”') + `
      <svg width="750" height="230" viewBox="0 0 750 230" style="position:absolute;left:40px;top:232px;overflow:visible">
        <defs><linearGradient id="cBeam" x1="0" x2="1"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></linearGradient></defs>
        <rect x="0" y="176" width="750" height="34" rx="6" fill="#141d36"/><rect x="0" y="176" width="750" height="3" fill="rgba(255,255,255,.28)"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${20 + i * 94}" y="191" width="50" height="4" rx="2" fill="rgba(255,255,255,.4)"/>`).join('')}
        <rect x="694" y="92" width="5" height="84" fill="#cfd6e6"/><path d="M699 94H742V124H699Z" fill="#fff"/><path d="M699 94h14v10h-14zM727 94h15v10h-15zM713 104h14v10h-14zM699 114h14v10h-14zM727 114h15v10h-15z" fill="#10182e"/>
        <g class="car">${CAR}</g>
      </svg>
      <div style="position:absolute;left:40px;top:478px;width:750px;height:16px;border-radius:8px;background:rgba(255,255,255,.10);overflow:hidden"><div class="pf" style="width:100%;height:100%;background:#6FD8FF;transform-origin:0 50%"></div></div>
      <div class="mono" style="position:absolute;left:40px;top:504px;width:750px;display:flex;justify-content:space-between;font-size:22px;font-weight:700;color:rgba(245,241,232,.55)"><span>SHURU</span><span class="kh" style="color:#B9ECFF">KAAM HUA</span><span>KHATAM</span></div>
      <div style="position:absolute;left:0;right:0;top:562px;text-align:center"><div class="tag green tg" style="font-size:30px;background:rgba(10,40,24,.5)">KHATAM ✓ — HO GAYA</div></div>`;
    cR.innerHTML = hdr(2, '#F2C968', 'PEHCHAAN', '(sifat)') + sent('“Ahmad driver hai.”') + `
      <div class="lic" style="position:absolute;left:120px;top:238px;width:590px;height:236px;border-radius:20px;background:linear-gradient(135deg,#22325c 0%,#0f1833 100%);border:2px solid rgba(233,185,85,.75);box-shadow:0 18px 50px rgba(0,0,0,.55)">
        <div class="mono" style="position:absolute;left:28px;top:16px;font-size:18px;font-weight:700;letter-spacing:.34em;color:#F8DE9A">DRIVER CARD</div>
        <div style="position:absolute;right:26px;top:20px;width:74px;height:10px;border-radius:5px;background:rgba(248,222,154,.35)"></div>
        <svg width="132" height="132" viewBox="-66 -66 132 132" style="position:absolute;left:30px;top:66px"><circle r="58" fill="none" stroke="#F8DE9A" stroke-width="9"/><g class="spk"><path d="M-54 0H54M0 0V54" stroke="#F8DE9A" stroke-width="9" stroke-linecap="round"/><circle r="15" fill="#F8DE9A"/></g></svg>
        <div class="bebas" style="position:absolute;left:192px;top:60px;font-size:104px;line-height:1;color:#fff">AHMAD</div>
        <div class="mono" style="position:absolute;left:194px;top:160px;font-size:36px;font-weight:700;letter-spacing:.42em;color:#F2C968">DRIVER</div>
      </div>
      <div class="gz mont" style="position:absolute;left:0;right:0;top:494px;text-align:center;font-size:34px;font-weight:600;color:rgba(245,241,232,.62)"><span style="position:relative;display:inline-block">guzra hua kaam<span class="gzl" style="position:absolute;left:-6px;right:-6px;top:56%;height:3px;background:#FF4B4B;transform-origin:0 50%"></span></span> &nbsp;<span class="gzx" style="color:#FF6B6B;font-weight:800;display:inline-block">✗ nahi</span></div>
      <div class="jr" style="position:absolute;left:0;right:0;top:550px;display:flex;align-items:center;justify-content:center;gap:22px">
        <svg width="170" height="74" viewBox="-85 -37 170 74"><path d="${LEM}" fill="none" stroke="rgba(233,185,85,.45)" stroke-width="5"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="jd" r="${8 - i}" fill="#FFE9A8" opacity="${(1 - i * 0.16).toFixed(2)}"/>`).join('')}</svg>
        <div class="tag gold" style="font-size:30px;background:rgba(40,28,6,.5)">JAARI SIFAT</div></div>`;
    [cL, cR].forEach((c, i) => { gsap.set(c, { autoAlpha: 0 }); s.tl.set(c, { autoAlpha: 1 }, tCards + i * 0.12).fromTo(c, { y: 90, opacity: 0 }, { y: 0, opacity: 0.4, duration: 0.6, ease: 'power3.out' }, tCards + i * 0.12); });
    s.sfx('whoosh', tCards, { gain: 0.6 });
    const pulse = (n, t) => s.tl.fromTo(n, { scale: 1 }, { scale: 1.35, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, t);
    // ① the action: the car drives, stops — done
    const t1 = L('67', null, -0.08), t2 = L('69', null, -0.08);
    s.tl.to(cL, { opacity: 1, borderColor: 'rgba(111,216,255,.95)', duration: 0.35 }, t1); pulse(cL.querySelector('.num'), t1); s.sfx('pop', t1);
    words(cL.querySelector('.sent')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, L('68', i, -0.06)));
    const tGo = L('68', 2, -0.1), tSt = Math.max(tGo + 0.8, L('68', 7, -0.12));
    const car = cL.querySelector('.car'), sps = [...cL.querySelectorAll('.car .sp')], sl = cL.querySelector('.car .sl'), brk = cL.querySelector('.car .brake'), beam = cL.querySelector('.car .beam'), pf = cL.querySelector('.pf');
    s.onUpdate((lt) => {
      const u = clamp((lt - tGo) / (tSt - tGo)), e = io2(u), v = u <= 0 || u >= 1 ? 0 : (u < 0.5 ? 2 * u : 2 * (1 - u));
      const x = lerp(14, 444, e), dip = 1.8 * Math.exp(-Math.pow((u - 0.92) / 0.08, 2)) - 1.2 * Math.exp(-Math.pow((u - 0.08) / 0.07, 2));
      car.setAttribute('transform', `translate(${x.toFixed(2)} 80) rotate(${dip.toFixed(3)} 117 78)`);
      sps.forEach((g) => g.setAttribute('transform', `rotate(${((x - 14) / 18 * 57.2958).toFixed(2)})`));
      sl.setAttribute('opacity', (v * 0.9).toFixed(3)); brk.setAttribute('opacity', u > 0.7 && lt < tSt + 0.6 ? '1' : '0.3');
      beam.setAttribute('opacity', (1 - smooth(tSt + 0.3, tSt + 0.9, lt)).toFixed(3));
      pf.style.transform = `scaleX(${e.toFixed(4)})`; pf.style.background = u >= 1 ? '#57E39A' : '#6FD8FF';
    });
    s.sfx('whoosh', tGo, { gain: 0.5 });
    s.tl.fromTo(cL.querySelector('.kh'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, L('68', 4, -0.05));
    s.tl.fromTo(cL.querySelector('.tg'), { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, tSt + 0.05); s.sfx('ding', tSt + 0.25);
    // ② the identity: licence card, never "finished"
    s.tl.to(cL, { opacity: 0.5, borderColor: 'rgba(255,255,255,.14)', duration: 0.4 }, t2).to(cR, { opacity: 1, borderColor: 'rgba(233,185,85,.95)', duration: 0.35 }, t2); pulse(cR.querySelector('.num'), t2); s.sfx('pop', t2);
    words(cR.querySelector('.sent')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, L('70', i, -0.06)));
    const lic = cR.querySelector('.lic');
    s.tl.fromTo(lic, { opacity: 0, rotateY: -85, transformPerspective: 1100 }, { opacity: 1, rotateY: 0, duration: 0.6, ease: 'back.out(1.4)' }, L('70', 1, -0.12)); s.sfx('paper', L('70', 1, -0.12));
    s.tl.fromTo(cR.querySelector('.gz'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35 }, L('70', 3, -0.05));
    s.tl.fromTo(cR.querySelector('.gzl'), { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: 'power2.in' }, L('70', 7, -0.12));
    s.tl.fromTo(cR.querySelector('.gzx'), { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.2 }, L('70', 7, -0.02));
    const tP = L('71', 2, -0.08), ttl = cR.querySelector('.ttl');
    s.tl.to(ttl, { color: '#F2C968', duration: 0.3 }, tP).to(lic, { boxShadow: '0 0 0 3px rgba(233,185,85,.9), 0 0 70px rgba(233,185,85,.45)', duration: 0.4 }, tP); s.sfx('chime', tP);
    s.tl.fromTo(ttl, { scale: 1 }, { scale: 1.14, transformOrigin: '0% 60%', duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }, tP);
    s.tl.fromTo(cR.querySelector('.jr'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, L('72', null, -0.08)); s.sfx('shimmer', L('72', null, -0.08), { gain: 0.6 });
    const jd = [...cR.querySelectorAll('.jd')], spk = cR.querySelector('.spk');
    s.onUpdate((lt) => { jd.forEach((c, i) => { const p = LEMP(lt * 2.6 - i * 0.17); c.setAttribute('cx', p[0].toFixed(2)); c.setAttribute('cy', p[1].toFixed(2)); }); spk.setAttribute('transform', `rotate(${(30 * Math.sin(lt * 1.5)).toFixed(2)})`); });
    s.div('vig');
  }, { fin: 0.3, z: 2 });

  // ───────── C3  Quran chose the second way: not "Hum ne phailaya" — "Hum phailane wale HAIN" ─────────
  defScene('c3_chuna', T('73') - 0.15, T('76'), (s) => {
    const L = LL(s), tH = L('75', 3, -0.06);
    const st = stage3d(s, { bg: 0x02030a, fov: 55 });
    const bd = spaceBackdrop(st, { gain: 0.34, seed: 17, tint: 0xffe6c0 });
    const gal = galaxyField({ count: 300, radius: 70, size: 4.2, seed: 29 }); st.scene.add(gal);
    st.frame = (lt) => { bd.update(lt + 10); const a = Math.max(0, lt - tH - 0.2);
      gal.userData.update({ scale: 0.7 + lt * 0.05 + 0.5 * (1 - Math.exp(-a * 1.8)), opacity: 0.85 });           // never stops expanding
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = lt * 0.015; };
    s.div('scrim-all', { background: 'rgba(2,4,12,.45)' });
    big(s, 'QURAN NE YAHAN <span style="color:#F2C968">DOOSRA TAREEQA</span> CHUNA', L('73', null, -0.02), null, { size: 96, y: 86, mode: 'fade', by: 'words', stagger: 0.07 });
    const chips = s.div(null, { position: 'absolute', left: '0', right: '0', top: '214px', display: 'flex', justifyContent: 'center', gap: '36px' },
      `<div class="chip k1" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.4);color:rgba(245,241,232,.8)">1 · KAAM — ho gaya</div><div class="chip k2">2 · PEHCHAAN — jaari</div>`);
    show(s, chips, L('73', null, 0.25), null, { opacity: 0, y: 16 }, 0.4);
    const tSel = L('73', 3, -0.06);
    s.tl.to(chips.querySelector('.k1'), { opacity: 0.35, duration: 0.3 }, tSel).to(chips.querySelector('.k2'), { scale: 1.12, boxShadow: '0 0 0 3px rgba(233,185,85,.9), 0 0 50px rgba(233,185,85,.4)', duration: 0.3 }, tSel); s.sfx('tick', tSel);
    // the rejected (past-tense) phrasing
    const no = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '356px', textAlign: 'center', fontSize: '104px', fontStyle: 'italic', fontWeight: 600, color: '#AEB6C6' }, '“Hum ne phailaya”');
    words(no).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, L('74', i, -0.06)));
    const tNo = L('74', 3, -0.06);
    s.tl.to(no, { scale: 0.5, x: -170, y: -34, opacity: 0.6, duration: 0.4, ease: 'power3.inOut' }, tNo);
    const noTag = s.div('tag red', { position: 'absolute', left: '1056px', top: '366px', fontSize: '26px', background: 'rgba(30,0,0,.5)' }, '✗ YEH NAHI');
    show(s, noTag, tNo + 0.15, null, { opacity: 0, x: -20 }, 0.3); s.sfx('buzz', tNo, { gain: 0.5 });
    // the chosen one
    const yes = s.div('anton', { position: 'absolute', left: '0', right: '0', top: '440px', textAlign: 'center', fontSize: '150px', lineHeight: '1.1', whiteSpace: 'nowrap' },
      ['HUM', 'PHAILANE', 'WALE', 'HAIN'].map((w) => `<span class="goldgrad k" style="display:inline-block;margin:0 .1em;padding:0 .02em">${w}</span>`).join(''));
    const ks = [...yes.querySelectorAll('.k')];
    ks.forEach((k, i) => { if (i < 3) s.tl.fromTo(k, { opacity: 0, y: 40, scale: 1.2 }, { opacity: 1, y: 0, scale: 1, duration: 0.35 }, L('75', i, -0.06)); });
    s.tl.fromTo(ks[3], { opacity: 0, scale: 2.6 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power4.in' }, tH);
    s.sfx('hit', tH + 0.24); shake(s, yes, tH + 0.24, 0.5, 14); flash(s, tH + 0.2, { peak: 0.3, color: '#FFE9B0', dur: 0.5 });
    const ar = s.div('ar glowg', { position: 'absolute', left: '0', right: '0', top: '584px', textAlign: 'center', fontSize: '150px', color: '#FFF3D2' }, Q['w:lamusiun']);
    show(s, ar, L('75', null, -0.1), null, { opacity: 0, y: 30, scale: 0.9 }, 0.8); s.sfx('shimmer', L('75', null, -0.1), { gain: 0.7 });
    const lab = s.div(null, { position: 'absolute', left: '0', right: '0', top: '872px', textAlign: 'center' }, `<div class="tag gold" style="font-size:28px;background:rgba(40,28,6,.5)">ISM-E-FA'IL — JAARI SIFAT</div>`);
    show(s, lab, L('75', 2, -0.1), null, { opacity: 0, y: 14 }, 0.4);
    s.div('vig');
  }, { fin: 0.3, z: 3 });

  // ───────── C4  honesty badge: "INSAAF KI BAAT" (cyan / white pattern-interrupt) ─────────
  defScene('c4_insaaf', T('76'), T('77') + 0.15, (s) => {
    const L = LL(s);
    s.div('fill', { background: 'radial-gradient(ellipse at 28% 50%, #0c2940 0%, #061523 55%, #02070d 100%)' });
    s.div('fill', { backgroundImage: 'linear-gradient(rgba(111,216,255,.07) 1px, rgba(0,0,0,0) 1px), linear-gradient(90deg, rgba(111,216,255,.07) 1px, rgba(0,0,0,0) 1px)', backgroundSize: '60px 60px' });
    flash(s, 0, { peak: 0.55, dur: 0.4, color: '#CFF3FF' }); s.sfx('whoosh', 0, { gain: 0.6 }); s.sfx('ding', 0.05);
    [[96, 96, 'Top', 'Left'], [96, 96, 'Top', 'Right'], [96, 96, 'Bottom', 'Left'], [96, 96, 'Bottom', 'Right']].forEach(([a, b, v, h], i) => {
      const c = s.div(null, { position: 'absolute', width: '70px', height: '70px', [v.toLowerCase()]: a + 'px', [h.toLowerCase()]: b + 'px', ['border' + v]: '4px solid #6FD8FF', ['border' + h]: '4px solid #6FD8FF' });
      s.tl.fromTo(c, { opacity: 0, scale: 1.8 }, { opacity: 0.9, scale: 1, duration: 0.4 }, 0.05 + i * 0.04);
    });
    const sc = svg(s, `<g fill="none" stroke="#DFF6FF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-90 170H90M0 170V-120"/><path class="bm" d="M-170 -120H170"/><circle cx="0" cy="-120" r="15" fill="#6FD8FF" stroke="none"/>
        <g class="pL"><path d="M0 0L-58 118M0 0L58 118" stroke-width="5"/><path d="M-74 118Q0 178 74 118Z" fill="rgba(111,216,255,.25)" stroke="#6FD8FF"/></g>
        <g class="pR"><path d="M0 0L-58 118M0 0L58 118" stroke-width="5"/><path d="M-74 118Q0 178 74 118Z" fill="rgba(111,216,255,.25)" stroke="#6FD8FF"/></g></g>`, { x: 170, y: 270, w: 520, h: 520, vb: '-260 -290 520 520' });
    const bm = sc.querySelector('.bm'), pL = sc.querySelector('.pL'), pR = sc.querySelector('.pR');
    s.onUpdate((lt) => { const a = 15 * Math.exp(-1.15 * lt) * Math.cos(5.2 * lt), r = a * Math.PI / 180, cx = 170 * Math.cos(r), sy = 170 * Math.sin(r);
      bm.setAttribute('transform', `rotate(${a.toFixed(3)} 0 -120)`); pL.setAttribute('transform', `translate(${(-cx).toFixed(2)} ${(-120 - sy).toFixed(2)})`); pR.setAttribute('transform', `translate(${cx.toFixed(2)} ${(-120 + sy).toFixed(2)})`); });
    s.tl.fromTo(sc, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0.02);
    big(s, 'INSAAF', L('76', 1, -0.1), null, { x: 760, y: 296, w: 1060, align: 'left', size: 250 });
    big(s, 'KI BAAT', L('76', 2, -0.08), null, { x: 760, y: 520, w: 1060, align: 'left', size: 250, style: { color: '#6FD8FF' } });
    const rule = s.div(null, { position: 'absolute', left: '764px', top: '764px', width: '700px', height: '4px', background: 'linear-gradient(90deg,#6FD8FF,rgba(111,216,255,0))', transformOrigin: '0 50%' });
    s.tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, L('76', 3));
    const sub = s.div('mont sh', { position: 'absolute', left: '764px', top: '792px', fontSize: '46px', fontWeight: 700 }, 'is channel par hum aap se <span class="ss" style="color:#6FD8FF">sirf sach</span> kahenge');
    words(sub).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, L('76', 6 + i, -0.06)));
    const tS = L('76', 12, -0.05);
    s.tl.fromTo(sub.querySelectorAll('.ss .w'), { scale: 1 }, { scale: 1.1, duration: 0.2, stagger: { each: 0.14, repeat: 1, yoyo: true } }, tS);
    const ok = s.div(null, { position: 'absolute', left: '394px', top: '290px', width: '72px', height: '72px', borderRadius: '50%', background: '#57E39A', color: '#04140b', fontSize: '50px', fontWeight: 900, lineHeight: '72px', textAlign: 'center' }, '✓');
    s.tl.fromTo(ok, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.4)' }, tS); s.sfx('ding', tS);
    s.div('vig');
  }, { z: 4 });

  // ───────── C5  the two classical meanings + Maududi ─────────
  defScene('c5_maani', T('77') - 0.15, T('81') + 0.15, (s) => {
    const L = LL(s), t80 = L('80');
    const st = stage3d(s, { bg: 0x03040a, fov: 55 });
    const bd = spaceBackdrop(st, { gain: 0.3, seed: 23, tint: 0xffe2b8 });
    const gal = galaxyField({ count: 220, radius: 70, size: 4, seed: 61 }); st.scene.add(gal);
    st.frame = (lt) => { bd.update(lt * 2 + 5); const a = Math.max(0, lt - t80);
      gal.userData.update({ scale: 0.8 + a * 0.08, opacity: 0.8 * smooth(t80 - 0.3, t80 + 1.2, lt) });
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = lt * 0.006; };
    s.div('scrim-all', { background: 'rgba(3,5,12,.5)' });
    const ar = s.div('ar glowg', { position: 'absolute', left: '0', right: '0', top: '14px', textAlign: 'center', fontSize: '104px', color: '#FFF3D2' }, Q['w:lamusiun']);
    show(s, ar, 0.05, null, { opacity: 0, y: -20 }, 0.6);
    const hd = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '226px', textAlign: 'center', fontSize: '32px', fontWeight: 700, letterSpacing: '.3em' }, 'PURANE MUFASSIREEN &nbsp;·&nbsp; IS LAFZ KE <span style="color:#fff">DO MA\'NI</span>');
    show(s, hd, L('77', null, -0.02), null, { opacity: 0, y: 14 }, 0.5);
    const pcard = (x, n, q, foot) => {
      const c = s.div(null, { position: 'absolute', left: x + 'px', top: '300px', width: '780px', height: '400px', borderRadius: '10px', overflow: 'hidden', background: '#e6d5ab', border: '3px solid rgba(0,0,0,0)', boxShadow: '0 30px 90px rgba(0,0,0,.65)' });
      c.appendChild(image('/gfx/img/c_parch.jpg', { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' }));
      c.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:14px;top:14px;right:14px;bottom:14px;border:2px solid rgba(110,74,30,.55);border-radius:6px"></div><div style="position:absolute;left:21px;top:21px;right:21px;bottom:21px;border:1px solid rgba(110,74,30,.35);border-radius:4px"></div>
        <div class="cinzel mh" style="position:absolute;left:0;right:0;top:42px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.42em;color:#8a4a1c">MA'NI ${n}</div>
        <div class="play q" style="position:absolute;left:50px;right:50px;top:${foot ? 104 : 136}px;text-align:center;font-size:62px;font-style:italic;font-weight:600;line-height:1.25;color:#2e1f0e">${q}</div>${foot || ''}`);
      return c;
    };
    const B = (t) => `<b style="font-style:normal;font-weight:900;color:#8a2c0e">${t}</b>`;
    const c1 = pcard(150, 1, `“Hum badi ${B('QUDRAT')} wale hain.”`);
    const c2 = pcard(990, 2, `“Hum ne isay ${B('WASEE\'')} kar diya.”`, `<div class="np" style="position:absolute;left:0;right:0;bottom:38px;display:flex;justify-content:center;align-items:center;gap:26px"><span style="font-family:'Aref Ruqaa',serif;direction:rtl;font-size:56px;line-height:1.3;color:#5b2d10">${AR.ibn_kathir}</span><span style="width:2px;height:54px;background:rgba(110,74,30,.5)"></span><span class="cinzel" style="font-size:24px;font-weight:700;letter-spacing:.2em;line-height:1.5;color:#5b3a1a;text-align:left">IMAM IBN KATHIR<br><span style="font-weight:400;letter-spacing:.12em">Tafsir Ibn Kathir · 51:47</span></span></div>`);
    const tC = L('77', 6, -0.1);
    [c1, c2].forEach((c, i) => { gsap.set(c, { autoAlpha: 0 }); s.tl.set(c, { autoAlpha: 1 }, tC + i * 0.15).fromTo(c, { y: 70, opacity: 0, rotateX: 22, transformPerspective: 1200 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: 'back.out(1.2)' }, tC + i * 0.15); s.sfx('paper', tC + i * 0.15); });
    const mhp = (c, t) => s.tl.fromTo(c.querySelector('.mh'), { scale: 1 }, { scale: 1.25, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }, t);
    mhp(c1, L('78', null, -0.05));
    words(c1.querySelector('.q')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, L('79', i, -0.06)));
    mhp(c2, L('79', 5, -0.05));
    s.tl.fromTo(c2.querySelector('.np'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, L('79', 8, -0.1)); s.sfx('chime', L('79', 8, -0.1), { gain: 0.6 });
    words(c2.querySelector('.q')).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, L('79', 14 + i, -0.06)));
    // Maududi strip
    const strip = s.div('panel', { left: '150px', top: '752px', width: '1620px', height: '176px', borderColor: 'rgba(233,185,85,.5)' });
    strip.innerHTML = `<div class="mm" style="position:absolute;left:44px;top:26px"><div class="bebas" style="font-size:70px;line-height:1;color:#fff">MAULANA MAUDUDI</div><div class="serif" style="font-size:38px;font-style:italic;font-weight:600;color:#F2C968;margin-top:6px">Tafheem-ul-Quran</div></div>
      <div class="dn mont" style="position:absolute;left:560px;top:36px;width:300px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.14em;color:rgba(245,241,232,.9)">DONO MA'NI<br><span style="color:#57E39A;font-size:44px;letter-spacing:.3em">✓ ✓</span></div>
      <div class="dv" style="position:absolute;left:890px;top:22px;bottom:22px;width:2px;background:rgba(233,185,85,.35)"></div>
      <div style="position:absolute;left:930px;top:20px;right:20px"><div class="mono c0" style="font-size:24px;font-weight:700;letter-spacing:.2em;color:#F8DE9A">DOOSRE MA'NI KE MUTABIQ:</div><div class="bebas c1" style="font-size:50px;line-height:1;margin-top:10px;color:#fff">YEH KAINAT</div><div class="bebas c2" style="font-size:64px;line-height:1;margin-top:4px;color:#F2C968;white-space:nowrap">MUSALSAL PHAIL RAHI HAI</div></div>`;
    show(s, strip, L('79', 20, -0.1), null, { opacity: 0, y: 60 }, 0.6); s.sfx('whoosh', L('79', 20, -0.1), { gain: 0.5 });
    s.tl.fromTo(strip.querySelector('.mm'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5 }, L('79', 21, -0.1));
    s.tl.fromTo(strip.querySelector('.dn'), { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.35 }, L('79', 24, -0.06)); s.sfx('ding', L('79', 24), { gain: 0.6 });
    s.tl.fromTo([strip.querySelector('.dv'), strip.querySelector('.c0')], { opacity: 0 }, { opacity: 1, duration: 0.4 }, L('80', null, -0.05));
    [...words(strip.querySelector('.c1')), ...words(strip.querySelector('.c2'))].forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, L('80', 4 + i, -0.06)));
    const arw = svg(s, `<path class="p" d="M1380 706V742" fill="none" stroke="#F2C968" stroke-width="7" stroke-linecap="round"/><path class="h" d="M1362 734L1380 754L1398 734" fill="none" stroke="#F2C968" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`);
    s.tl.fromTo(arw.querySelector('.p'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'none' }, t80).fromTo(arw.querySelector('.h'), { opacity: 0 }, { opacity: 1, duration: 0.15 }, t80 + 0.25);
    s.tl.to(c1, { opacity: 0.45, duration: 0.5 }, t80).to(c2, { borderColor: '#F2C968', boxShadow: '0 30px 90px rgba(0,0,0,.65), 0 0 80px rgba(233,185,85,.5)', duration: 0.5 }, t80); s.sfx('shimmer', L('80', 6), { gain: 0.6 });
    s.div('vig');
  }, { fin: 0.3, z: 5 });

  // ───────── C6a  the honest disclaimer → "Sawal yeh hai:" ─────────
  defScene('c6a_daawa', T('81') - 0.15, T('84') + 0.15, (s) => {
    const L = LL(s), t83 = L('83', null, -0.1);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 45%, #0a1a30 0%, #050a16 58%, #010307 100%)' });
    const A = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' });
    const h = el('div', 'bebas sh', { position: 'absolute', left: '0', right: '0', top: '120px', textAlign: 'center', fontSize: '210px' }, '<span class="k">DAAWA</span> <span class="k" style="color:#FF4B4B">YEH</span> <span class="k glowr" style="color:#FF4B4B">NAHI</span>'); A.appendChild(h);
    [...h.querySelectorAll('.k')].forEach((k, i) => { k.style.display = 'inline-block'; s.tl.fromTo(k, { opacity: 0, scale: i === 2 ? 2.2 : 1.4, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: i === 2 ? 0.22 : 0.3, ease: i === 2 ? 'power4.in' : 'power3.out' }, L('81', 1 + i, -0.05)); });
    s.sfx('hit', L('81', 3, 0.17), { gain: 0.7 }); shake(s, h, L('81', 3, 0.17), 0.4, 10);
    const box = (x, w, col, html) => { const b = el('div', null, { position: 'absolute', left: x + 'px', top: '424px', width: w + 'px', height: '132px', borderRadius: '16px', border: `2.5px solid ${col}`, background: 'rgba(10,18,36,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px' }, html); A.appendChild(b); return b; };
    const b1 = box(190, 600, 'rgba(255,255,255,.4)', '<span class="bebas" style="font-size:80px;padding-top:8px">7WIN SADI KE ARAB</span>');
    const b2 = box(1130, 600, '#6FD8FF', `<svg width="78" height="78" viewBox="-39 -39 78 78"><g stroke="#6FD8FF" stroke-width="4" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r0 = 11, r1 = i % 2 ? 26 : 36; return `<path d="M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)}L${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}"/>`; }).join('')}</g><circle r="7" fill="#fff"/></svg><span class="bebas" style="font-size:80px;padding-top:8px;color:#B9ECFF">“BIG BANG”</span>`);
    s.tl.fromTo(b1, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.45 }, L('81', 5, -0.08)).fromTo(b2, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.45 }, L('81', 9, -0.08));
    const lk = el('div', null, { position: 'absolute', left: '800px', top: '420px', width: '320px', height: '140px' }, `<div class="mont" style="position:absolute;left:0;right:0;top:6px;text-align:center;font-size:32px;font-weight:600;font-style:italic;color:rgba(245,241,232,.75)">jaante the?</div><div style="position:absolute;left:14px;right:14px;top:68px;border-top:4px dashed rgba(255,255,255,.5)"></div><div class="x" style="position:absolute;left:128px;top:38px;width:64px;height:64px;border-radius:50%;background:#FF4B4B;color:#fff;font-size:44px;font-weight:900;line-height:64px;text-align:center">✗</div>`); A.appendChild(lk);
    s.tl.fromTo(lk, { opacity: 0 }, { opacity: 1, duration: 0.3 }, L('81', 11, -0.08)).fromTo(lk.querySelector('.x'), { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, L('82', 2, -0.08));
    s.sfx('buzz', L('82', 2, 0.1), { gain: 0.6 });
    const z = el('div', 'bebas sh', { position: 'absolute', left: '0', right: '0', top: '640px', textAlign: 'center', fontSize: '124px' }, 'ZAHIR HAI — <span style="color:#6FD8FF">NAHI JAANTE THE</span>'); A.appendChild(z);
    const zt = [L('82', 0), L('82', 1), L('82', 2, -0.12), L('82', 2), L('82', 3), L('82', 4)];
    words(z).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, Math.max(0, (zt[i] ?? zt[5]) - 0.06)));
    s.tl.to(A, { opacity: 0, y: -40, duration: 0.4, ease: 'power2.in' }, Math.max(0, t83 - 0.3)).set(A, { autoAlpha: 0 }, t83 + 0.1);
    // the real question
    const qm = s.div('anton', { position: 'absolute', left: '0', right: '0', top: '150px', textAlign: 'center', fontSize: '760px', lineHeight: '1', color: 'rgba(233,185,85,.13)' }, '?');
    s.tl.fromTo(qm, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, t83).to(qm, { scale: 1.12, duration: 3, ease: 'none' }, t83 + 1.2);
    const sw = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '450px', textAlign: 'center', fontSize: '136px', fontWeight: 700, letterSpacing: '.12em' }, 'SAWAL YEH HAI:');
    gsap.set(sw, { autoAlpha: 0 }); s.tl.set(sw, { autoAlpha: 1 }, t83 + 0.08);
    s.tl.fromTo(words(sw), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07 }, t83 + 0.08);
    s.sfx('riser', t83 + 0.1, { dur: Math.max(0.8, s.t1 - s.t0 - t83 - 0.2), gain: 0.7 });
    s.div('vig');
  }, { fin: 0.3, z: 6 });

  // ───────── C6b  the ancient picture: flat earth under a fixed roof — and this word above it ─────────
  defScene('c6b_chhat', T('84') - 0.15, T('85'), (s) => {
    const L = LL(s), d = s.t1 - s.t0, tRise = L('84', 14, -0.1), tQ = L('84', 20, -0.1), tQ2 = L('84', 22, -0.08);
    s.div('fill', { background: 'linear-gradient(180deg, #060a1c 0%, #0b1434 46%, #070b18 80%, #020308 100%)' });
    const R = rng(84), E = (rx, ry, th) => [960 - rx * Math.cos(th), 860 - ry * Math.sin(th)];
    const bricks = Array.from({ length: 35 }, (_, i) => { const th = (i + 1) * Math.PI / 36, a = E(590, 545, th), b = E(630, 580, th); return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }).join('');
    const stars = Array.from({ length: 46 }, () => { const th = (0.1 + 0.8 * R()) * Math.PI, f = 0.5 + 0.44 * Math.sqrt(R()), p = E(590 * f, 545 * f, th); return { x: p[0], y: p[1], r: 6 + R() * 9, ph: R() * 6.28 }; });
    const g = svg(s, `<defs><linearGradient id="cDome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9cc8"/><stop offset="1" stop-color="#2d3a62"/></linearGradient>
        <radialGradient id="cIn" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#1c2f6e" stop-opacity=".75"/><stop offset="1" stop-color="#0a1230" stop-opacity=".5"/></radialGradient>
        <linearGradient id="cEarth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a2a"/><stop offset="1" stop-color="#2a1a0c"/></linearGradient></defs>
      <path class="in" d="M370 860A590 545 0 0 1 1550 860Z" fill="url(#cIn)"/>
      <g class="sts">${stars.map((p) => `<g class="st"><path d="${STAR4(p.r)}" fill="#FFE9B0"/><circle r="1.6" fill="#fff"/></g>`).join('')}</g>
      <g class="band"><path class="bd" d="M330 860A630 580 0 0 1 1590 860L1550 860A590 545 0 0 0 370 860Z" fill="url(#cDome)" stroke="#c9d6f5" stroke-width="2"/><path d="${bricks}" stroke="rgba(8,12,30,.55)" stroke-width="2.5" fill="none"/></g>
      <ellipse cx="960" cy="892" rx="650" ry="62" fill="#1c1109"/><ellipse cx="960" cy="862" rx="650" ry="60" fill="url(#cEarth)" stroke="#b08a5a" stroke-width="2"/>
      <path d="M560 852L640 792L684 824L748 762L812 834L850 812L900 852Z" fill="#1a1230" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/><path d="M1010 854Q1090 818 1170 846Q1250 812 1350 852Z" fill="#3a2714"/>
      <path class="ld" d="M374 398L574 404" stroke="#6FD8FF" stroke-width="3" fill="none"/><circle class="ldd" cx="574" cy="404" r="8" fill="#6FD8FF"/>`);
    const band = g.querySelector('.band'), stEls = [...g.querySelectorAll('.st')];
    s.tl.fromTo(g.querySelector('.bd'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.1, ease: 'power2.inOut' }, 0.1);
    s.tl.fromTo(band, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.1).fromTo(g.querySelector('.in'), { opacity: 0 }, { opacity: 1, duration: 1.0 }, 0.4);
    s.tl.fromTo(stEls, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.02 }, L('84', 3, -0.1));
    s.tl.to(band, { opacity: 0.4, duration: 1.0 }, tRise + 0.4).to(stEls, { opacity: 0.45, duration: 0.5 }, tQ);
    s.onUpdate((lt) => { const k = 0.22 * smooth(tRise, d + 0.5, lt);                                   // the "fixed" stars start to drift apart once the word rises
      stEls.forEach((e, i) => { const p = stars[i], tw = 0.85 + 0.15 * Math.sin(lt * 2.2 + p.ph); e.setAttribute('transform', `translate(${(p.x + (p.x - 960) * k).toFixed(2)} ${(p.y + (p.y - 700) * k).toFixed(2)}) scale(${tw.toFixed(3)})`); }); });
    s.tl.fromTo(g, { scale: 1.0 }, { scale: 1.035, transformOrigin: '50% 80%', duration: d, ease: 'none' }, 0);
    const t0 = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '100px', fontSize: '28px', fontWeight: 700, letterSpacing: '.3em' }, 'US ZAMANE KI DUNIYA');
    show(s, t0, L('84', 1, -0.1), null, { opacity: 0, x: -20 }, 0.4);
    const t1 = s.div('mont sh', { position: 'absolute', left: '110px', top: '158px', fontSize: '42px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, 'AASMAN = EK');
    show(s, t1, L('84', 5, -0.08), null, { opacity: 0, y: 14 }, 0.35);
    big(s, 'THEHRI HUI<br>CHHAT', L('84', 8, -0.08), null, { x: 106, y: 216, w: 700, align: 'left', size: 124, lh: '0.98' });
    s.tl.fromTo(g.querySelector('.ld'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, L('84', 10, -0.05)).fromTo(g.querySelector('.ldd'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, L('84', 10, 0.3));
    s.sfx('thud', L('84', 10), { gain: 0.6 });
    const sq = s.div('cinzel gold sh', { position: 'absolute', right: '110px', top: '98px', fontSize: '34px', fontWeight: 700, letterSpacing: '.24em' }, 'SAWAL YEH HAI:');
    s.tl.fromTo(sq, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3);
    // the word rises above the roof
    const ar = s.div('ar glowg', { position: 'absolute', left: '0', right: '0', top: '14px', textAlign: 'center', fontSize: '150px', color: '#FFE9B0' }, Q['w:lamusiun']);
    gsap.set(ar, { autoAlpha: 0 });
    s.tl.set(ar, { autoAlpha: 1 }, tRise).fromTo(ar, { opacity: 0, y: 420, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, duration: Math.max(1.0, tQ - tRise + 0.3), ease: 'power2.inOut' }, tRise);
    s.sfx('swell', tRise, { dur: 1.8 }); s.sfx('shimmer', tRise + 0.8);
    const gl = s.div(null, { position: 'absolute', left: '360px', top: '-90px', width: '1200px', height: '500px', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.26) 0%, rgba(233,185,85,0) 64%)' });
    s.tl.fromTo(gl, { opacity: 0 }, { opacity: 1, duration: 1.4 }, tRise + 0.5);
    const scr = s.div(null, { position: 'absolute', left: '160px', top: '410px', width: '1600px', height: '330px', background: 'radial-gradient(ellipse at 50% 50%, rgba(3,5,14,.86) 0%, rgba(3,5,14,.6) 50%, rgba(3,5,14,0) 72%)' });
    s.tl.fromTo(scr, { opacity: 0 }, { opacity: 1, duration: 0.4 }, tQ);
    const q = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '488px', textAlign: 'center', fontSize: '176px', whiteSpace: 'nowrap' }, '<span class="a" style="display:inline-block">YEH LAFZ</span> <span class="b" style="display:inline-block;color:#F2C968">KISNE CHUNA?</span>');
    s.tl.fromTo(q.querySelector('.a'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35 }, tQ).fromTo(q.querySelector('.b'), { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power4.in' }, tQ2);
    s.sfx('impact', tQ2 + 0.24, { gain: 0.9 }); shake(s, q, tQ2 + 0.24, 0.5, 14);
    s.div('vig');
  }, { fin: 0.3, z: 7 });

  // ───────── C7a  1998 — a white dwarf blows up ─────────
  defScene('c7a_1998', T('85'), T('86'), (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    footage(s, 'c_sn', { n: 105, speed: 105 / (d * 30 + 1), kb: { s0: 1.0, s1: 1.07 } });
    s.div('scrim-t'); s.div('scrim-b');
    dateline(s, '1998', 'TYPE Ia SUPERNOVAE', L('85', 1, -0.1), null);
    s.sfx('type', L('85', 1, 0.2), { dur: 0.7 }); s.sfx('swell', 0, { dur: d * 0.62 }); s.sfx('impact', d * 0.64, { gain: 0.9 });
    cap(s, 'ek aur baat <span class="hc">pata chali</span>…', L('85', 3, -0.08), d + 0.2, { bottom: 130 });
    const nb = s.div('chip', { position: 'absolute', right: '110px', top: '92px', fontSize: '24px' }, 'NOBEL PRIZE 2011');
    show(s, nb, L('85', 4, -0.05), null, { opacity: 0, y: -14 }, 0.4); s.sfx('ding', L('85', 4), { gain: 0.5 });
    const f = s.div('flash'); s.tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.in' }, Math.max(0, d - 0.2));
    s.div('vig');
  }, { z: 8 });

  // ───────── C7b  not slowing down — speeding up … "Lekin rukiye" freezes it ─────────
  defScene('c7b_tez', T('86'), T('89') - 0.1, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tT = L('87', null, -0.1), tP = Math.min(L('88', 1, -0.05), d - 0.4);
    const st = stage3d(s, { bg: 0x01030a, fov: 55 });
    const bd = spaceBackdrop(st, { gain: 0.36, seed: 8 });
    const gal = galaxyField({ count: 320, radius: 70, size: 4.2, seed: 12 }); st.scene.add(gal);
    st.frame = (lt) => { const q = Math.min(lt, tP), a = Math.max(0, q - tT); bd.update(q + 30);                 // q stops on "rukiye": freeze-frame
      gal.userData.update({ scale: 0.8 + q * 0.05 + 0.32 * a * a, redshift: clamp(a * 0.3), opacity: 0.9 });      // the flight outwards accelerates
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = q * 0.012; };
    s.div('scrim-l', { width: '74%' });
    const wf = s.div('flash', { zIndex: 40 }); s.tl.fromTo(wf, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0);
    const g = svg(s, `<defs><linearGradient id="cAcc" x1="650" y1="590" x2="1090" y2="330" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6FD8FF"/><stop offset="1" stop-color="#FFE9A8"/></linearGradient></defs>
      <path d="M170 280V900H1140" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"/>
      ${[1, 2, 3, 4, 5].map((i) => `<path d="M170 ${900 - i * 110}H1140" stroke="rgba(111,216,255,.10)" stroke-width="1.5"/>`).join('')}
      <path class="ex" d="M650 590C780 568 930 556 1090 552" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-dasharray="14 12"/>
      <path class="a" d="M170 900C330 690 480 620 650 590" fill="none" stroke="#6FD8FF" stroke-width="8" stroke-linecap="round"/>
      <path class="bg" d="M650 590C780 568 930 520 1090 330" fill="none" stroke="rgba(255,233,168,.25)" stroke-width="26" stroke-linecap="round"/>
      <path class="b" d="M650 590C780 568 930 520 1090 330" fill="none" stroke="url(#cAcc)" stroke-width="9" stroke-linecap="round"/>
      <path class="ah" d="M0 0L-40 -17L-30 0L-40 17Z" fill="#FFE9A8" transform="translate(1096 322) rotate(-50)"/>
      <g class="xx" stroke="#FF4B4B" stroke-width="9" stroke-linecap="round"><path d="M905 528L955 586M955 528L905 586"/></g>`);
    const ax = s.div('mono', { position: 'absolute', left: '170px', top: '236px', fontSize: '24px', fontWeight: 700, letterSpacing: '.24em', color: 'rgba(185,236,255,.85)' }, 'KAINAT KA PHAILAO ↑');
    const ax2 = s.div('mono', { position: 'absolute', left: '940px', top: '916px', width: '200px', textAlign: 'right', fontSize: '24px', fontWeight: 700, letterSpacing: '.24em', color: 'rgba(185,236,255,.85)' }, 'WAQT →');
    show(s, ax, 0.1, null, { opacity: 0 }, 0.4); show(s, ax2, 0.1, null, { opacity: 0 }, 0.4);
    s.div('chip', { position: 'absolute', right: '110px', top: '92px', fontSize: '24px' }, 'NOBEL PRIZE 2011');
    const tX = L('86', 3, -0.05), tD = Math.max(0.3, Math.min(L('86', 2, -0.1), tX - 0.3));
    s.tl.fromTo(g.querySelector('.a'), { drawSVG: '0%' }, { drawSVG: '100%', duration: Math.max(0.4, tD - 0.05), ease: 'power1.out' }, 0.08);
    s.tl.fromTo(g.querySelector('.ex'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tD);
    s.tl.fromTo(g.querySelector('.xx'), { opacity: 0 }, { opacity: 1, duration: 0.15 }, tX).to(g.querySelector('.ex'), { opacity: 0.4, duration: 0.3 }, tX + 0.15);
    const rk = s.div('bebas sh', { position: 'absolute', left: '1124px', top: '566px', fontSize: '72px', whiteSpace: 'nowrap' }, 'RUK <span style="color:#FF5B5B">NAHI</span> RAHA');
    show(s, rk, tD + 0.05, null, { opacity: 0, x: -20 }, 0.35); s.sfx('buzz', tX, { gain: 0.5 });
    const dB = clamp(tP - tT - 0.5, 0.35, 0.8);
    s.tl.fromTo([g.querySelector('.b'), g.querySelector('.bg')], { drawSVG: '0%' }, { drawSVG: '100%', duration: dB, ease: 'power2.in' }, tT);
    s.tl.fromTo(g.querySelector('.ah'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, tT + dB - 0.05);
    s.sfx('riser', Math.max(0, tT - 0.3), { dur: dB + 0.3 }); s.sfx('whoosh', tT + dB - 0.2);
    big(s, 'TEZ HO', L('87', 0, 0.02), null, { x: 1230, y: 190, w: 600, align: 'left', size: 176, style: { color: '#FFE9A8' } });
    big(s, 'RAHA HAI', L('87', 2, -0.08), null, { x: 1230, y: 356, w: 600, align: 'left', size: 176 });
    // "Lekin rukiye." — freeze-frame
    const dim = s.div('fill', { background: 'rgba(2,4,10,.84)' }); s.tl.fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.2 }, tP);
    flash(s, tP, { peak: 0.45, dur: 0.3 }); s.sfx('camera', tP); s.sfx('subdrop', tP, { gain: 0.6 });
    const fz = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' });
    fz.innerHTML = `<div class="mont sh" style="position:absolute;left:0;right:0;top:236px;text-align:center;font-size:50px;font-weight:800;letter-spacing:.3em">LEKIN…</div>
      <div style="position:absolute;left:0;right:0;top:336px;display:flex;justify-content:center;gap:54px"><div style="width:56px;height:170px;border-radius:10px;background:#fff;box-shadow:0 0 50px rgba(111,216,255,.8)"></div><div style="width:56px;height:170px;border-radius:10px;background:#fff;box-shadow:0 0 50px rgba(111,216,255,.8)"></div></div>
      <div class="bebas sh" style="position:absolute;left:0;right:0;top:548px;text-align:center;font-size:190px">RUKIYE.</div>` +
      [['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => `<div style="position:absolute;${v}:96px;${h}:96px;width:80px;height:80px;border-${v}:5px solid #fff;border-${h}:5px solid #fff"></div>`).join('');
    show(s, fz, tP, null, { opacity: 0, scale: 1.12 }, 0.25);
    s.div('vig');
  }, { z: 9 });

  // ───────── C8  "sirf phailao" → "asli jhatka" → run the film backwards (hands over to Part D) ─────────
  defScene('c8_rewind', T('89') - 0.1, P1 + 0.3, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tEnd = P1 - s.t0;
    const tSlow = L('90', 2), tRev = Math.min(L('91', 5, -0.15), tEnd - 1.0);
    const F0 = 318, V = 20, FX = 300, sInt = (x) => x - 0.25 * (1 - Math.exp(-x / 0.25));
    const F1 = F0 + V * sInt(tSlow), F2 = Math.min(446, F1 + V * 0.5 * (1 - Math.exp(-Math.max(0, tRev - tSlow) / 0.5))), acc = 2 * (F2 - FX) / Math.pow(tEnd - tRev, 2);
    const F = (lt) => lt < tSlow ? F0 + V * sInt(lt) : lt < tRev ? Math.min(446, F1 + V * 0.5 * (1 - Math.exp(-(lt - tSlow) / 0.5))) : F2 - 0.5 * acc * Math.pow(lt - tRev, 2);   // play → coast to a stop → reverse (frame FX at P1; Part D continues from there)
    clip(s, 'c_expand', 450, F, (lt) => `translateX(${(lt >= tRev ? noise1(lt * 40, 3) * 7 : 0).toFixed(2)}px) scale(${(1.02 + 0.02 * lt / d).toFixed(4)})`);
    s.div('scrim-b'); s.div('scrim-t');
    filmBars(s, F, L('91', 2, -0.15)); rewindFx(s, tRev, d + 1);
    const pl = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '32px', fontWeight: 700, letterSpacing: '.3em' }, '▶&nbsp; PHAILAO');
    show(s, pl, 0.05, Math.max(0.8, tRev), { opacity: 0, x: -20 }, 0.3); s.sfx('whoosh', 0, { gain: 0.5 });
    cap(s, 'Yeh to sirf <span class="hc">“phailao”</span> hai', L('89', null, -0.03), Math.max(L('89') + 0.8, L('90', null, -0.08)), { size: 64, bottom: 150 });
    const tJ = L('90', null, -0.05), tJ1 = Math.max(tJ + 0.9, L('91', null, 0.12));
    const jh = big(s, 'ASLI <span style="color:#FF5B5B">JHATKA</span>…', tJ, tJ1, { size: 200, y: 400, by: 'words', stagger: Math.max(0.1, L('90', 1) - L('90')) });
    shake(s, jh, L('90', 1, 0.1), 0.7, 12); s.sfx('riser', tJ, { dur: Math.max(1, tRev - tJ) });
    const sb = s.div('mont sh', { position: 'absolute', left: '0', right: '0', top: '610px', textAlign: 'center', fontSize: '50px', fontWeight: 700, color: 'rgba(245,241,232,.9)' }, 'tab lagta hai…');
    show(s, sb, L('90', 2, -0.05), tJ1, { opacity: 0, y: 14 }, 0.3);
    cap(s, 'jab aap <span class="hl">film</span> ko poora <span class="hl">ULTA</span> chalate hain', tJ1 + 0.02, d + 0.4, { size: 58, bottom: 150 });
    const rw = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '34px', fontWeight: 700, letterSpacing: '.3em' }, '◀◀&nbsp; REWIND');
    show(s, rw, tRev, null, { opacity: 0, x: -20 }, 0.25);
    s.sfx('rewind', tRev, { dur: d - tRev }); s.sfx('whooshRev', tRev, { dur: 0.8 }); s.sfx('glitch', tRev);
    s.div('vig');
  }, { fout: 0.3, z: 10 });
}
