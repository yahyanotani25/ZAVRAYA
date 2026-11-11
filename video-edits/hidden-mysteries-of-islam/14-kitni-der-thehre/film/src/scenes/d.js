// PART D — "Apni hatheli kholiye": the muon, GPS, proper time, the fair note, ayah 22:47 (lines 108..154)
import { defScene, stage3d, T, gsap, THREE, el, clamp, lerp, smooth, noise1, W, H, film, glow } from '../engine.js';
import { cap, flash, show, svg, shake, stamp, dateline } from '../ui.js';
import { earth, spaceBackdrop } from '../kit3d.js';
import { mkL, bg, dust, slam, txt, clock, pict, ay, PICT, GOLD, CYAN, RED } from '../lib14.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);
const GRID = (s) => s.div('fill', { backgroundImage: 'linear-gradient(rgba(111,216,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(111,216,255,.06) 1px, transparent 1px)', backgroundSize: '80px 80px' });
const inner = (g) => ({ div: (c, st, h) => g.appendChild(el('div', c, st, h)) });
// streaks passing through the palm: one per second from tA
function streaks(s, tA, cx, cy, o = {}) {
  const cv = el('canvas', 'gl'); cv.width = W; cv.height = H; s.add(cv); const x = cv.getContext('2d');
  s.onUpdate((lt) => {
    x.clearRect(0, 0, W, H); if (lt < tA) return; x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    const k = Math.floor(lt - tA), p = (lt - tA) - k, dx = ((k * 53) % 7 - 3) * 34;          // a new track every second, slightly different angle
    if (p < 0.5) { const q = p / 0.5, y0 = -200 + q * 1500, x0 = cx + dx * (1 - (y0 - cy) / 700) * 0.4 + (y0 - cy) * (dx / 900);
      const g = x.createLinearGradient(x0, y0 - 420, x0, y0); g.addColorStop(0, 'rgba(111,216,255,0)'); g.addColorStop(1, 'rgba(190,240,255,.95)');
      x.strokeStyle = g; x.lineWidth = o.lw || 7; x.beginPath(); x.moveTo(x0 - (dx / 900) * 420, y0 - 420); x.lineTo(x0, y0); x.stroke(); }
    const r = (lt - tA - k - 0.19); if (r > 0 && r < 0.5) { x.strokeStyle = `rgba(190,240,255,${(0.9 * (1 - r / 0.5)).toFixed(3)})`; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, 30 + r * 260, 0, 6.2832); x.stroke(); }
  });
  return cv;
}

export default function ([P0, P1]) {
  // ───────── D1  open your palm — a muon just went through it ─────────
  defScene('d1_palm', P0, T('116') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tH = L('109') - 0.1, tA = L('111', 'Abhi') - 0.05;
    bg(s, 'radial-gradient(ellipse at 50% 52%, #0c2440 0%, #050b18 58%, #000 100%)');
    const chip = txt(s, 'chip', 'AAP BHI KIJIYE', { left: '110px', top: '120px' }, L('108') - 0.05, null, { opacity: 0, x: -30 }, 0.4);
    const hand = s.div(null, { position: 'absolute', left: '610px', top: '190px' }, pict('hand', 700, 'rgba(245,241,232,.94)'));
    const hp = hand.querySelector('path'); gsap.set(hand, { autoAlpha: 0 });
    s.tl.set(hand, { autoAlpha: 1 }, tH).fromTo(hp, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' }, tH);
    s.onUpdate((lt) => { hand.style.transform = `scale(${(1 + 0.012 * Math.sin(lt * 2.2)).toFixed(4)})`; });
    txt(s, 'bebas sh', 'APNI HATHELI KHOLIYE', { left: '110px', top: '200px', width: '520px', fontSize: '120px', lineHeight: '.98', whiteSpace: 'normal' }, tH, tA - 0.1, { opacity: 0, x: -30 }, 0.4);
    txt(s, 'mono sh', 'SACH MEIN.', { left: '114px', top: '590px', fontSize: '40px', fontWeight: 700, letterSpacing: '.4em', color: GOLD }, L('110') - 0.05, tA - 0.1, { opacity: 0 }, 0.3);
    streaks(s, tA, 960, 620);
    const cnt = txt(s, 'mono sh', '', { left: '1330px', top: '250px', fontSize: '30px', fontWeight: 700, letterSpacing: '.24em', color: CYAN, lineHeight: '1.5' }, tA + 0.1, null, { opacity: 0 }, 0.3);
    s.onUpdate((lt) => { const n = Math.max(0, Math.floor(lt - tA) + 1); cnt.innerHTML = `HATHELI SE GUZRE<br><span class="bebas" style="font-size:170px;letter-spacing:.02em;color:#fff;line-height:1">${n}</span>`; });
    for (let k = 0; tA + k < d - 0.3; k++) s.sfx(k === 0 ? 'whoosh' : 'tick', tA + k + (k === 0 ? 0 : 0.19), { gain: k === 0 ? 0.9 : 1.0 });
    flash(s, tA + 0.19, { peak: 0.45, dur: 0.35, color: '#bfefff' });
    txt(s, 'bebas sh', 'ABHI — IS EK SECOND MEIN', { left: '110px', top: '250px', width: '520px', fontSize: '96px', lineHeight: '1', whiteSpace: 'normal' }, tA, L('112') - 0.05, { opacity: 0, x: -30 }, 0.35);
    const mu = slam(s, 'MUON', L('113') - 0.06, { size: 230, x: 60, w: 620, y: 300, color: CYAN, from: 1.6, amp: 12, style: { textShadow: '0 0 40px rgba(111,216,255,.6)' } });
    stamp(s, 'BHAGODA', L('114', 'bhagoda') - 0.05, { x: 150, y: 590, size: 96, rot: -6 });
    cap(s, 'Isay yahan <span class="hr">hona hi nahi chahiye</span>', L('115') - 0.05, d + 1, { size: 50, bottom: 86 });
    s.sfx('pop', tH, { gain: 0.8 }); s.sfx('hit', L('113') + 0.14, { gain: 0.9 }); s.sfx('slam', L('114', 'bhagoda'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── D2  born 15 km up, 2 microseconds to live, 660 m at best — and yet it reaches the palm ─────────
  defScene('d2_descent', T('116') - 0.05, T('127') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, X0 = 150, CW = 470, Y0 = 120, CH = 840, yk = (km) => Y0 + CH - km / 15 * CH, mx = X0 + CW / 2;
    bg(s, 'radial-gradient(ellipse at 70% 50%, #0b1c38 0%, #050914 58%, #000 100%)'); GRID(s);
    const col = s.div(null, { position: 'absolute', left: X0 + 'px', top: Y0 + 'px', width: CW + 'px', height: CH + 'px', borderRadius: '18px', overflow: 'hidden', background: 'linear-gradient(180deg,#02030a 0%,#07122c 30%,#123a72 62%,#4d7fb8 86%,#e9b06a 100%)', border: '1.5px solid rgba(255,255,255,.2)' });
    [[10.2, 0.16], [6.4, 0.22], [2.3, 0.3]].forEach(([km, a], i) => col.appendChild(el('div', null, { position: 'absolute', left: (-60 + i * 50) + 'px', top: (CH - km / 15 * CH - 26) + 'px', width: (420 - i * 60) + 'px', height: '52px', borderRadius: '50%', background: `radial-gradient(ellipse, rgba(255,255,255,${a}) 0%, rgba(255,255,255,0) 70%)` })));
    let tk = ''; for (let km = 0; km <= 15; km++) tk += `<line x1="${X0 + CW}" y1="${yk(km)}" x2="${X0 + CW + (km % 5 ? 14 : 30)}" y2="${yk(km)}" stroke="rgba(245,241,232,.7)" stroke-width="${km % 5 ? 2 : 4}"/>` + (km % 5 ? '' : `<text x="${X0 + CW + 42}" y="${yk(km) + 9}" fill="rgba(245,241,232,.85)" font-family="Space Mono" font-weight="700" font-size="26">${km} km</text>`);
    svg(s, tk);
    const hd = s.div(null, { position: 'absolute', left: (mx - 55) + 'px', top: (Y0 + CH - 122) + 'px' }, pict('hand', 110, 'rgba(255,255,255,.95)'));
    // birth spark, the "should have died here" ghost, and the real track
    const tB = L('116', 'paida') - 0.2, tG0 = L('119', 'daude') - 0.1, tG1 = L('119', 'khatam') - 0.05, tR0 = L('123') - 0.25, tR1 = Math.min(L('124') - 0.3, tR0 + 2.6);
    const y660 = yk(15 - 0.66);
    const cv = el('canvas', 'gl'); cv.width = W; cv.height = H; s.add(cv); const x = cv.getContext('2d');
    s.onUpdate((lt) => {
      x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
      const spark = (px, py, r, c, a) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); };
      if (lt > tB) spark(mx, Y0 + 8, 46 + 10 * Math.sin(lt * 9), '190,240,255', (0.9 * Math.min(1, (lt - tB) / 0.3)).toFixed(3));
      if (lt > tG0 && lt < tG1 + 1.2) { const k = clamp((lt - tG0) / Math.max(0.2, tG1 - tG0)), py = lerp(Y0 + 8, y660, k), a = lt < tG1 ? 1 : Math.max(0, 1 - (lt - tG1) / 1.2); spark(mx - 70, py, 22, '255,90,90', a.toFixed(3)); x.strokeStyle = `rgba(255,90,90,${(0.8 * a).toFixed(3)})`; x.lineWidth = 4; x.beginPath(); x.moveTo(mx - 70, Y0 + 8); x.lineTo(mx - 70, py); x.stroke(); }
      if (lt > tR0) { const k = clamp((lt - tR0) / (tR1 - tR0)), py = lerp(Y0 + 8, Y0 + CH - 70, k); const g = x.createLinearGradient(0, Y0, 0, py); g.addColorStop(0, 'rgba(111,216,255,.15)'); g.addColorStop(1, 'rgba(190,240,255,.95)'); x.strokeStyle = g; x.lineWidth = 6; x.beginPath(); x.moveTo(mx, Y0 + 8); x.lineTo(mx, py); x.stroke(); spark(mx, py, 30, '190,240,255', 1); if (k >= 1) spark(mx, py, 70 + 20 * Math.sin(lt * 8), '190,240,255', 0.5); }
    });
    const l660 = svg(s, `<line x1="${X0 - 20}" y1="${y660}" x2="${X0 + CW + 20}" y2="${y660}" stroke="${RED}" stroke-width="5" stroke-dasharray="14 10"/><text x="${X0 + 14}" y="${y660 + 44}" fill="${RED}" font-family="Space Mono" font-weight="700" font-size="24" letter-spacing="2">660 m — YAHAN TAK</text>`);
    show(s, l660, tG1 - 0.3, null, { opacity: 0 }, 0.3);
    txt(s, 'mono sh', 'YAHAN PAIDA', { left: (X0 + 20) + 'px', top: (Y0 - 46) + 'px', fontSize: '26px', fontWeight: 700, letterSpacing: '.3em', color: CYAN }, tB, null, { opacity: 0 }, 0.3);
    // right-hand panels, one per beat
    const RX = 840, blk = (t0, t1, html) => txt(s, null, html, { left: RX + 'px', top: '150px', width: '980px' }, t0, t1, { opacity: 0, x: 40 }, 0.4);
    const H1 = (a, c = '#fff', sz = 170) => `<div class="bebas sh" style="font-size:${sz}px;line-height:1;color:${c}">${a}</div>`, M = (a, c = 'rgba(245,241,232,.82)') => `<div class="mont sh" style="font-size:42px;font-weight:700;line-height:1.3;margin-top:18px;color:${c}">${a}</div>`, K = (a, c = CYAN) => `<div class="mono" style="font-size:28px;font-weight:700;letter-spacing:.3em;color:${c};margin-bottom:14px">${a}</div>`;
    blk(L('116') - 0.05, L('117') - 0.05, K('PAIDAISH') + H1('15 KM UPAR') + M('aasman ke kinare — jahan kainati shuayen hawa se takrati hain'));
    blk(L('117') - 0.05, L('119') - 0.05, K('AUSAT UMAR') + H1('2 MICROSECOND', CYAN, 150) + M('ek second ka taqreeban <span style="color:#E9B955">paanch lakhwan hissa</span>'));
    blk(L('119') - 0.05, L('120') - 0.05, K('ROSHNI KI RAFTAAR SE BHI', RED) + H1('660 METER', RED) + M('…mein khatam', RED));
    const cmp = blk(L('120') - 0.05, L('123') - 0.1, K('HISAAB KEHTA HAI: NAMUMKIN', RED) + `<div style="margin-top:20px"><div class="mono" style="font-size:26px;letter-spacing:.2em;color:${RED}">JITNA JA SAKTA THA</div><div class="b1" style="height:54px;width:42px;background:${RED};margin:10px 0 6px;border-radius:6px"></div><div class="bebas" style="font-size:110px;line-height:1;color:${RED}">660 m</div>
      <div class="mono" style="font-size:26px;letter-spacing:.2em;color:${CYAN};margin-top:44px">JITNA SAFAR HAI</div><div class="b2" style="height:54px;width:950px;background:${CYAN};margin:10px 0 6px;border-radius:6px;transform-origin:0 50%"></div><div class="bebas" style="font-size:110px;line-height:1;color:${CYAN}">15,000 m</div></div>`);
    s.tl.fromTo(cmp.querySelector('.b2'), { scaleX: 0.044 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, L('122') - 0.2);
    blk(tR0, L('124') - 0.05, H1('PHIR YEH ZINDA', '#fff', 150) + H1('KAISE POHANCHA?', GOLD, 150));
    // the two clocks
    const g = blk(L('124') - 0.05, null, K('JAWAB: IS KI APNI GHADI SUST CHAL RAHI HAI', GOLD) + `<div style="display:flex;gap:40px;margin-top:26px">
      <div class="panel" style="position:relative;width:460px;height:420px"><div class="mono" style="position:absolute;left:0;right:0;top:232px;text-align:center;font-size:26px;font-weight:700;letter-spacing:.24em;color:rgba(245,241,232,.8)">HAMARI GHADI</div><div class="bebas v1" style="position:absolute;left:0;right:0;top:268px;text-align:center;font-size:120px;line-height:1">0.0 μs</div></div>
      <div class="panel" style="position:relative;width:460px;height:420px;border-color:rgba(111,216,255,.6)"><div class="mono" style="position:absolute;left:0;right:0;top:232px;text-align:center;font-size:26px;font-weight:700;letter-spacing:.24em;color:${CYAN}">MUON KI APNI GHADI</div><div class="bebas v2" style="position:absolute;left:0;right:0;top:268px;text-align:center;font-size:120px;line-height:1;color:${CYAN}">0.0 μs</div></div></div>`);
    const pn = g.querySelectorAll('.panel'), c1 = clock(inner(pn[0]), { x: 230, y: 124, r: 92, sweep: true }), c2 = clock(inner(pn[1]), { x: 230, y: 124, r: 92, color: CYAN, sec: '#fff', sweep: true });
    const v1 = g.querySelector('.v1'), v2 = g.querySelector('.v2'), tC = L('125') - 0.1, tE = has('126') ? L('126e') : d - 0.3;
    s.onUpdate((lt) => { const k = clamp((lt - tC) / Math.max(0.5, tE - tC)); v1.textContent = (50 * k).toFixed(1) + ' μs'; v2.textContent = (1.3 * k).toFixed(1) + ' μs'; c1.set(36610 + k * 50 * 60); c2.set(36610 + k * 1.3 * 60); });
    s.sfx('shimmer', tB, { gain: 0.8 }); s.sfx('whoosh', tG0, { gain: 0.5 }); s.sfx('buzz', tG1, { gain: 0.8 }); s.sfx('riser', tR0, { dur: tR1 - tR0, gain: 0.8 }); s.sfx('impact', tR1, { gain: 0.9 }); s.sfx('clock', tC, { dur: Math.max(0.6, tE - tC), gain: 0.9 }); s.sfx('ding', tE, { gain: 0.7 });
    flash(s, tR1, { peak: 0.4, dur: 0.4, color: '#bfefff' });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── D3  "Har second. Aapki hatheli par. Waqt ke sust hone ka zinda saboot." ─────────
  const d3end = T(has('130') ? '130' : '135') - 0.05;
  defScene('d3_proof', T('127') - 0.05, d3end, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 52%, #0c2440 0%, #050b18 58%, #000 100%)');
    s.div(null, { position: 'absolute', left: '1010px', top: '190px' }, pict('hand', 700, 'rgba(245,241,232,.94)')); streaks(s, 0.05, 1360, 620);
    txt(s, 'bebas sh', 'HAR SECOND.', { left: '110px', top: '250px', fontSize: '190px' }, L('127') - 0.05, null, { opacity: 0, x: -40 }, 0.3);
    txt(s, 'bebas sh', 'AAPKI HATHELI PAR.', { left: '110px', top: '440px', fontSize: '120px', color: CYAN }, L('128') - 0.05, null, { opacity: 0, x: -40 }, 0.3);
    const z = slam(s, 'ZINDA SABOOT', L('129', 'zinda') - 0.06, { size: 150, x: 110, w: 880, y: 620, align: 'left', color: GOLD, from: 1.4, amp: 10 });
    txt(s, 'mont sh', 'waqt ke sust hone ka', { left: '114px', top: '576px', fontSize: '40px', fontWeight: 700, color: 'rgba(245,241,232,.8)' }, L('129') - 0.05, null, { opacity: 0 }, 0.3);
    s.sfx('hit', L('127'), { gain: 0.9 }); s.sfx('hit', L('128'), { gain: 0.8 }); s.sfx('braam', L('129', 'zinda') - 0.06, { gain: 0.9 }); for (let k = 0; k + 0.25 < d; k++) s.sfx('tick', 0.24 + k, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── D4  (optional lines 130-134) GPS ─────────
  if (has('130')) defScene('d4_gps', T('130') - 0.05, T('135') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tS = L('132') - 0.1, tW = L('133', 'location') - 0.1;
    const st = stage3d(s, { bg: 0x01030a, fov: 36 }); const bd = spaceBackdrop(st, { gain: 0.3, count: 3000, seed: 14 });
    const E = earth(); st.scene.add(E); E.userData.sun.set(0.2, 0.45, 1).normalize(); const sats = [];
    for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.rotation.set(0.5 + i * 0.9, i * 1.1, 0.3 * i); const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.006, 8, 160), new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0.5 })); g.add(ring);
      for (let j = 0; j < 2; j++) { const sp = glow(0xbfefff, 0.16, 1, 0.2, 2.0); g.add(sp); sats.push({ sp, ph: j * Math.PI + i }); } st.scene.add(g); }
    st.frame = (lt) => { bd.update(lt); E.rotation.y = 1.0 + lt * 0.04; sats.forEach((o) => { const a = o.ph + lt * 0.22; o.sp.position.set(Math.cos(a) * 2.25, Math.sin(a) * 2.25, 0); }); E.position.set(1.7, 0, 0); st.scene.children.forEach((c) => { if (c.type === 'Group' && c !== E) c.position.set(1.7, 0, 0); }); st.camera.position.set(0, 0.5, 7.6); st.camera.lookAt(0.3, 0, 0); };
    s.div('scrim-l', { width: '58%' });
    // phone with a map and the blue dot
    const ph = s.div(null, { position: 'absolute', left: '150px', top: '150px', width: '430px', height: '780px', borderRadius: '54px', background: '#0d1424', border: '3px solid rgba(255,255,255,.25)', boxShadow: '0 40px 110px rgba(0,0,0,.7), inset 0 0 0 9px #05070c', overflow: 'hidden' });
    ph.appendChild(el('div', null, { position: 'absolute', inset: '9px', borderRadius: '46px', backgroundColor: '#15233a', backgroundImage: 'linear-gradient(rgba(255,255,255,.10) 3px, transparent 3px), linear-gradient(90deg, rgba(255,255,255,.10) 3px, transparent 3px), linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '130px 130px, 130px 130px, 43px 43px, 43px 43px' }));
    const home = el('div', null, { position: 'absolute', left: '199px', top: '430px', width: '32px', height: '32px', borderRadius: '50%', border: '4px solid rgba(255,255,255,.75)' }), dot = el('div', null, { position: 'absolute', left: '199px', top: '430px', width: '32px', height: '32px', borderRadius: '50%', background: '#3d8bff', border: '5px solid #fff', boxShadow: '0 0 0 14px rgba(61,139,255,.25)' });
    ph.append(home, dot); show(s, ph, L('130', 'phone') - 0.1, null, { opacity: 0, y: 50 }, 0.5);
    s.onUpdate((lt) => { const k = smooth(tW, Math.max(tW + 1.2, d - 0.5), lt); dot.style.transform = `translate(${(k * 150).toFixed(1)}px, ${(-k * 300).toFixed(1)}px)`; home.style.opacity = k > 0.02 ? '1' : '0'; });
    txt(s, 'mono sh', 'GPS SATELLITES · 20,000 KM UPAR', { left: '640px', top: '160px', fontSize: '28px', fontWeight: 700, letterSpacing: '.26em', color: CYAN }, tS, null, { opacity: 0 }, 0.4);
    txt(s, 'bebas sh', '+38 MICROSECOND', { left: '636px', top: '210px', fontSize: '150px' }, L('132', '38') - 0.05, tW, { opacity: 0, x: 30 }, 0.35);
    txt(s, 'mont sh', 'har roz — un ki ghadiyan aage nikal jati hain', { left: '640px', top: '380px', fontSize: '38px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('132', 'roz') - 0.05, tW, { opacity: 0 }, 0.35);
    txt(s, 'bebas sh', '10 KM GHALAT', { left: '636px', top: '210px', fontSize: '170px', color: RED }, L('133', 'das') - 0.05, null, { opacity: 0, x: 30 }, 0.3);
    txt(s, 'mont sh', 'har roz — agar yeh farq theek na kiya jaye', { left: '640px', top: '400px', fontSize: '38px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('133', 'das') + 0.2, null, { opacity: 0 }, 0.35);
    if (has('134')) cap(s, 'Aapka rider khana le kar <span class="hl">doosre shehar</span> pohanch jaye', L('134') - 0.05, d + 1, { size: 44, bottom: 60 });
    s.sfx('pop', L('130', 'phone'), { gain: 0.8 }); s.sfx('radio', tS, { dur: 1.2, gain: 0.5 }); s.sfx('ding', L('132', '38'), { gain: 0.6 }); s.sfx('buzz', L('133', 'das'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── D5  no master clock — everything carries its own: "proper time" ─────────
  defScene('d5_proper', T('135') - 0.05, T('139') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tX = L('136', 'nahi') - 0.1, tM = L('137') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #101e3c 0%, #060914 58%, #000 100%)'); GRID(s);
    txt(s, 'mono sh', 'SCIENCE KA FAISLA', { left: '0', width: W + 'px', top: '110px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: CYAN }, L('135') - 0.05, null, { opacity: 0, y: -10 }, 0.4);
    const mc = clock(s, { x: 960, y: 520, r: 250, sweep: false }); s.onUpdate((lt) => mc.set(36610 + lt));
    const ml = txt(s, 'mono sh', '“MASTER GHADI”', { left: '0', width: W + 'px', top: '810px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.4em', paddingLeft: '.4em' }, L('136', 'master') - 0.1, tM, { opacity: 0 }, 0.3);
    show(s, mc, L('136') - 0.05, tM, { opacity: 0, scale: 0.8 }, 0.4);
    const xx = svg(s, `<path class="a" d="M 700 260 L 1220 780" stroke="${RED}" stroke-width="30" stroke-linecap="round"/><path class="b" d="M 1220 260 L 700 780" stroke="${RED}" stroke-width="30" stroke-linecap="round"/>`);
    s.tl.fromTo(xx.querySelector('.a'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.15 }, tX).fromTo(xx.querySelector('.b'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.15 }, tX + 0.14).to(xx, { opacity: 0, duration: 0.25 }, tM - 0.25);
    s.sfx('slash', tX, { gain: 0.9 }); s.sfx('slash', tX + 0.14, { gain: 0.9 });
    // every thing with its own clock
    const items = [['person', 'AAP', 1], ['sat', 'SATELLITE', 1.6], ['atom', 'MUON', 0.12], ['star', 'SITARA', 0.7], ['bowl', 'KHANA', 0], ['globe', 'ZAMEEN KA MARKAZ', 0.85]], cs = [];
    items.forEach(([ic, nm, rate], i) => { const x = 250 + (i % 3) * 520, y = 230 + Math.floor(i / 3) * 330;
      const g = s.div('panel', { left: x + 'px', top: y + 'px', width: '460px', height: '290px' });
      g.appendChild(el('div', null, { position: 'absolute', left: '34px', top: '50px' }, pict(ic, 150, 'rgba(245,241,232,.9)')));
      const c = clock(inner(g), { x: 320, y: 124, r: 88, color: i % 2 ? GOLD : CYAN, sec: '#fff', sweep: true }); cs.push([c, rate]);
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '0', right: '0', top: '232px', textAlign: 'center', fontSize: '24px', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(245,241,232,.8)' }, nm));
      show(s, g, tM + i * 0.09, null, { opacity: 0, scale: 0.8 }, 0.35); s.sfx('pop', tM + i * 0.09, { gain: 0.6 }); });
    s.onUpdate((lt) => cs.forEach(([c, r]) => c.set(36610 + Math.max(0, lt - tM) * r * 9)));
    const sc = s.div('fill', { background: 'rgba(3,5,12,.74)' }); show(s, sc, L('137', 'proper') - 0.25, null, { opacity: 0 }, 0.4);
    slam(s, 'PROPER TIME', L('137', 'proper') - 0.06, { cls: 'bebas sh', size: 250, y: 290, color: CYAN, from: 1.5, amp: 12, style: { textShadow: '0 0 50px rgba(111,216,255,.5)' } });
    slam(s, 'APNA WAQT', L('138') - 0.06, { cls: 'bebas goldgrad', size: 200, y: 560, from: 1.5, amp: 10 });
    s.sfx('braam', L('137', 'proper') - 0.06, { gain: 0.9 }); s.sfx('hit', L('138') + 0.14, { gain: 0.9 }); s.sfx('clock', tM, { dur: Math.max(0.6, d - tM), gain: 0.6 });
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── D6  the fair note ─────────
  defScene('d6_fair', T('139') - 0.05, T('143') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #17182c 0%, #08080f 58%, #000 100%)');
    const bar = s.div(null, { position: 'absolute', left: '150px', top: '150px', width: '10px', height: '780px', background: GOLD, transformOrigin: '50% 0%' }); s.tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'power2.out' }, 0.02);
    txt(s, 'cinzel gold sh', 'INSAAF KI BAAT', { left: '200px', top: '150px', fontSize: '56px', fontWeight: 700, letterSpacing: '.3em' }, L('139') - 0.05, null, { opacity: 0, x: -20 }, 0.4);
    txt(s, 'mono sh', 'LABORATORY MEIN FARQ', { left: '204px', top: '290px', fontSize: '28px', fontWeight: 700, letterSpacing: '.3em', color: CYAN }, L('140') - 0.05, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', 'SECOND KA ARABWAN HISSA', { left: '200px', top: '330px', fontSize: '120px' }, L('140', 'second') - 0.05, null, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'bebas sh', '— SAU SAAL NAHI', { left: '200px', top: '456px', fontSize: '120px', color: RED }, L('140', 'sau') - 0.05, null, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'mont sh', "Woh waqia <span style=\"color:#E9B955\">mo'jiza</span> tha — hum us ki “science” nahi bata rahe.", { left: '204px', top: '610px', fontSize: '44px', fontWeight: 700 }, L('141') - 0.05, null, { opacity: 0, y: 14 }, 0.4);
    const p = s.div('panel', { left: '200px', top: '716px', width: '1500px', height: '190px' });
    p.innerHTML = `<div class="bebas" style="position:absolute;left:44px;top:26px;font-size:92px;line-height:1">“EK JAGAH, DO ALAG WAQT”</div><div class="mono" style="position:absolute;left:48px;top:128px;font-size:28px;font-weight:700;letter-spacing:.3em;color:${CYAN}">AB PHYSICS KA PEHLA SABAQ</div><div class="bebas" style="position:absolute;right:50px;top:28px;font-size:130px;line-height:1;color:#57E39A">✓</div>`;
    show(s, p, L('142') - 0.05, null, { opacity: 0, y: 30 }, 0.45);
    s.sfx('tick', L('140'), { gain: 0.8 }); s.sfx('buzz', L('140', 'sau'), { gain: 0.6 }); s.sfx('ding', L('142', 'sabaq') - 0.05, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── D7  ayah 22:47 — "tumhari ginti ke" ─────────
  defScene('d7_ayah', T('143') - 0.05, T('151') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tHl = L('146') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    txt(s, 'mont sh', 'Quran ne yeh usool <span style="color:#E9B955">ek jumle</span> mein keh rakha tha', { left: '0', width: W + 'px', top: '470px', textAlign: 'center', fontSize: '58px', fontWeight: 700 }, L('143') - 0.02, L('144') - 0.1, { opacity: 0, y: 18 }, 0.5);
    const A = ay(s, '22:47', '22:47', '“Tumhare Rab ke haan ek din —|<span class="hl">tumhari ginti ke</span> hazaar saal jaisa hai.”', L('144') - 0.05, null, { tAr: L('144') + 0.25, dAr: Math.max(1.0, L('145') - L('144') - 0.3), trTimes: [L('145') - 0.05, L('145', 'tumhari') - 0.05], hl: { 6: tHl, 7: tHl }, size: 104 });
    s.tl.to(A.wrap, { y: -70, duration: 0.6, ease: 'power2.inOut' }, tHl);
    txt(s, 'bebas sh', 'GINTI <span style="color:#E9B955">TUMHARI</span> HAI', { left: '0', width: W + 'px', top: '800px', textAlign: 'center', fontSize: '84px', letterSpacing: '.04em' }, L('146', 'ginti', 1) - 0.05, L('149') - 0.1, { opacity: 0, y: 16 }, 0.35);
    txt(s, 'bebas sh', 'PAIMANA… <span style="color:#6FD8FF">EK NAHI</span>', { left: '0', width: W + 'px', top: '890px', textAlign: 'center', fontSize: '84px', letterSpacing: '.04em' }, L('147') - 0.05, L('149') - 0.1, { opacity: 0, y: 16 }, 0.35);
    // bookmark: this ayah comes back — with a calculator
    const bm = s.div(null, { position: 'absolute', right: '150px', top: '0', width: '150px', height: '250px', background: 'linear-gradient(180deg,#F8DE9A,#C8902F)', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)', transformOrigin: '50% 0%' });
    gsap.set(bm, { autoAlpha: 0 }); s.tl.set(bm, { autoAlpha: 1 }, L('149') - 0.05).fromTo(bm, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'back.out(1.6)' }, L('149') - 0.05);
    txt(s, 'bebas sh', 'YAAD RAKHIYE', { left: '0', width: W + 'px', top: '800px', textAlign: 'center', fontSize: '110px', color: GOLD }, L('149') - 0.05, null, { opacity: 0, scale: 1.3 }, 0.25);
    txt(s, 'mont sh', 'Aakhir mein yeh ayat wapas aayegi — <span style="color:#6FD8FF">ek calculator ke saath</span>', { left: '0', width: W + 'px', top: '920px', textAlign: 'center', fontSize: '42px', fontWeight: 700 }, L('150') - 0.05, null, { opacity: 0, y: 12 }, 0.4);
    s.sfx('shimmer', L('144') + 0.25, { gain: 0.9 }); s.sfx('chime', tHl, { gain: 0.8 }); s.sfx('paper', L('149') - 0.05, { gain: 0.8 }); s.sfx('hit', L('149') + 0.2, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── D8  bridge: the other clock — inside your head ─────────
  defScene('d8_bridge', T('151') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tI = L('152') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #1a1430 0%, #090712 58%, #000 100%)');
    txt(s, 'mont sh', 'Yeh to <span style="color:#6FD8FF">ghadiyon</span> ka waqt tha.', { left: '0', width: W + 'px', top: '150px', textAlign: 'center', fontSize: '56px', fontWeight: 700 }, L('151') - 0.02, null, { opacity: 0, y: 16 }, 0.4);
    const man = s.div(null, { position: 'absolute', left: '-1040px', top: '180px' }, pict('person', 4000, 'rgba(245,241,232,.1)'));
    const hc = clock(s, { x: 960, y: 620, r: 300, color: GOLD, sec: '#fff', sweep: true });
    s.onUpdate((lt) => hc.set(36610 + (lt - tI) * 30 + 260 * Math.sin((lt - tI) * 1.3) + 90 * Math.sin((lt - tI) * 3.1)));     // an unreliable clock: races, stalls, runs back
    show(s, man, tI, null, { opacity: 0 }, 0.6); show(s, hc, tI, null, { opacity: 0, scale: 0.7 }, 0.5);
    txt(s, 'bebas sh', 'EK AUR WAQT — SAR KE <span style="color:#E9B955">ANDAR</span>', { left: '0', width: W + 'px', top: '238px', textAlign: 'center', fontSize: '100px', letterSpacing: '.03em' }, L('152', 'jo') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    const z = slam(s, 'SAALON KI', L('154') - 0.06, { size: 250, y: 480, color: RED, from: 1.6, amp: 16, style: { textShadow: '0 0 50px rgba(0,0,0,.9)' } });
    txt(s, 'mont sh', 'wahan gadbad second ke arabwen hisse ki nahi…', { left: '0', width: W + 'px', top: '940px', textAlign: 'center', fontSize: '40px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('153') - 0.05, null, { opacity: 0 }, 0.4);
    s.sfx('whoosh', tI, { gain: 0.6 }); s.sfx('clock', tI, { dur: Math.max(0.6, d - tI), gain: 0.8 }); s.sfx('boom', L('154') - 0.04, { gain: 1.0 }); s.sfx('riser', Math.max(0, L('154') - 1.4), { dur: 1.3, gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
