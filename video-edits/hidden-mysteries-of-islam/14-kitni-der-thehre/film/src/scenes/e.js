// PART E — DOOSRA SAWAL: the cave, the coin, "three hundred… and nine" on the calculator (lines 155..205)
import { defScene, stage3d, T, gsap, el, clamp, lerp, smooth, rng, W, H, film } from '../engine.js';
import { cap, flash, show, svg, shake, stamp, lowerThird } from '../ui.js';
import { mkL, bg, dust, bokeh, slam, txt, calc, dunes, blob, chapter, coin, coinLights, ay, clipAt, GOLD, CYAN, RED } from '../lib14.js';
import { Q, REF } from '../quran.js';
import { lids, qa } from './b.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);
function skyline(seed, base, hmax) {
  const R = rng(seed); let d = '', x = -40;
  while (x < 1980) { const w = 50 + R() * 120, h = hmax * (0.3 + R() * 0.7); d += `M ${x.toFixed(0)} ${base} L ${x.toFixed(0)} ${(base - h).toFixed(0)} `; d += R() < 0.28 ? `A ${(w / 2).toFixed(0)} ${(w / 2).toFixed(0)} 0 0 1 ${(x + w).toFixed(0)} ${(base - h).toFixed(0)} ` : `L ${(x + w).toFixed(0)} ${(base - h).toFixed(0)} `; d += `L ${(x + w).toFixed(0)} ${base} Z `; x += w + R() * 16; }
  return d;
}
const SUNI = (sz) => `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:radial-gradient(circle,#fff6d0 0%,#ffd27a 38%,rgba(255,190,90,.35) 62%,rgba(255,190,90,0) 76%)"></div>`;
const MOONI = (sz) => `<div style="width:${sz}px;height:${sz}px;border-radius:50%;box-shadow:inset ${-sz * 0.26}px ${sz * 0.06}px 0 0 #dfe8ff;transform:rotate(-18deg)"></div>`;

export default function ([P0, P1]) {
  // ───────── E1  chapter card ─────────
  defScene('e1_chap', P0, T('157') - 0.1, (s) => { const L = mkL(s); chapter(s, 2, 'DOOSRA SAWAL', 'SURAH AL-KAHF', 'q', Math.max(0.1, L('155') - 0.08), s.t1 - s.t0); }, { fin: 0.3 });

  // ───────── E2  a few young men, a whole people against them ─────────
  defScene('e2_city', T('157') - 0.1, T('161') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, R = rng(5);
    bg(s, 'linear-gradient(180deg,#05060f 0%,#141026 46%,#3a1a1c 78%,#1a0a0a 100%)');
    let win = ''; for (let i = 0; i < 70; i++) win += `<rect x="${(R() * 1900).toFixed(0)}" y="${(620 + R() * 240).toFixed(0)}" width="8" height="12" fill="rgba(255,190,90,${(0.3 + R() * 0.6).toFixed(2)})"/>`;
    const ly = svg(s, `<path d="${skyline(3, 900, 330)}" fill="#0c0a14"/>${win}<path d="${skyline(8, 1000, 300)}" fill="#050409"/>`);
    s.tl.fromTo(ly, { scale: 1.02 }, { scale: 1.1, duration: d, ease: 'none', transformOrigin: '50% 90%' }, 0);
    const tor = el('canvas', 'gl'); tor.width = W; tor.height = H; s.add(tor); const x = tor.getContext('2d'), P = []; for (let i = 0; i < 34; i++) P.push([R() * W, 880 + R() * 120, 30 + R() * 50, R() * 6]);
    const tQ = L('158') - 0.1;
    s.onUpdate((lt) => { x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; const k = smooth(tQ, tQ + 1.2, lt);
      for (const [px, py, r, ph] of P) { const a = k * (0.5 + 0.3 * Math.sin(lt * 9 + ph)), g = x.createRadialGradient(px, py, 0, px, py, r * 2.2); g.addColorStop(0, `rgba(255,150,60,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(255,90,30,0)'); x.fillStyle = g; x.fillRect(px - r * 2.2, py - r * 2.2, r * 4.4, r * 4.4); } });
    txt(s, 'bebas sh', 'CHAND NAUJAWAN', { left: '110px', top: '150px', fontSize: '150px' }, L('157') - 0.05, null, { opacity: 0, x: -40 }, 0.35);
    txt(s, 'bebas sh', 'POORI QAUM UN KE KHILAF', { left: '110px', top: '310px', fontSize: '110px', color: RED }, tQ + 0.05, null, { opacity: 0, x: -40 }, 0.35);
    const o1 = txt(s, 'panel', '<div class="bebas" style="font-size:96px;line-height:1;padding:34px 44px 24px">IMAAN CHHOD DO</div>', { left: '110px', top: '520px', borderColor: 'rgba(255,75,75,.6)' }, L('160') - 0.05, null, { opacity: 0, y: 30 }, 0.35);
    const o2 = txt(s, 'panel', '<div class="bebas" style="font-size:96px;line-height:1;padding:34px 44px 24px">YA JAAN DE DO</div>', { left: '840px', top: '520px', borderColor: 'rgba(255,75,75,.6)' }, L('160', 'ya') - 0.05, null, { opacity: 0, y: 30 }, 0.35);
    txt(s, 'mono sh', 'SIRF DO RAASTE', { left: '114px', top: '460px', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: 'rgba(245,241,232,.8)' }, L('159') - 0.05, null, { opacity: 0 }, 0.3);
    s.sfx('hit', L('157'), { gain: 0.8 }); s.sfx('swell', tQ, { dur: 1.4, gain: 0.7 }); s.sfx('slam', L('160'), { gain: 0.8 }); s.sfx('slam', L('160', 'ya'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── E3  the cave: sleep — "Kam labithtum?" — the same answer ─────────
  defScene('e3_cave', T('161') - 0.05, T('169') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tS = L('162', 'neend') - 0.2, tW = L('163') - 0.15;
    bg(s, '#000');
    // the sky outside the cave: a real time-lapse (ESO Paranal), still while they are awake, racing while they sleep
    clipAt(s, 'g_sky', 538, (lt) => lt < tS ? 532 - lt * 3 : lt < tW ? 532 - tS * 3 + (lt - tS) * 30 * 13 : 508 + (lt - tW) * 2, { origin: '50% 0%', zoom: 1.75 });
    s.div('fill', { background: 'linear-gradient(180deg, rgba(255,214,150,.10) 0%, rgba(255,170,90,.22) 100%)' });
    svg(s, `<path d="${dunes(3, 720, 36)}" fill="#8a4420"/><path d="${dunes(6, 800, 30)}" fill="#5a2a14"/>`);
    // light shaft from the mouth sweeping as days go by
    const shaft = s.div(null, { position: 'absolute', left: '760px', top: '120px', width: '520px', height: '1300px', transformOrigin: '50% 0%', background: 'linear-gradient(90deg, rgba(255,236,190,0) 0%, rgba(255,236,190,.20) 40%, rgba(255,236,190,.28) 50%, rgba(255,236,190,.20) 60%, rgba(255,236,190,0) 100%)' });
    const rock = svg(s, `<path d="M -100 -100 L 2020 -100 L 2020 1180 L -100 1180 Z ${blob(5, 1000, 500, 470, 320, 0.2)}" fill="#060302" fill-rule="evenodd"/><path d="${blob(5, 1000, 500, 470, 320, 0.2)}" fill="none" stroke="rgba(255,190,110,.35)" stroke-width="5"/>`);
    const vines = svg(s, [[620, 250, 80], [1340, 210, 110], [700, 760, -60], [1300, 780, -90], [1000, 170, 60]].map(([vx, vy, l], i) => `<path class="vn" d="M ${vx} ${vy} q ${l * 0.3} ${l * 0.5} ${l * 0.1} ${l} q ${-l * 0.3} ${l * 0.4} ${l * 0.2} ${l * 0.9}" fill="none" stroke="#2f5a2a" stroke-width="7" stroke-linecap="round"/>`).join(''));
    dust(s, { n: 90, seed: 2 });
    s.tl.fromTo(rock, { scale: 1.12 }, { scale: 1.0, duration: d, ease: 'none' }, 0);
    s.tl.fromTo(vines.querySelectorAll('.vn'), { drawSVG: '0%' }, { drawSVG: '100%', duration: Math.max(0.6, tW - tS - 0.3), ease: 'none', stagger: 0.12 }, tS + 0.3);
    s.onUpdate((lt) => { const k = clamp((lt - tS) / Math.max(0.5, tW - tS)), sp = lt > tS && lt < tW ? 1 : 0, ph = k * 9; shaft.style.transform = `rotate(${(sp ? Math.sin(ph * 6.2832) * 34 : 14).toFixed(2)}deg)`; shaft.style.opacity = (sp ? 0.4 + 0.6 * Math.cos(ph * 6.2832) ** 2 : 1).toFixed(3); });
    const cl = lids(s); s.onUpdate((lt) => cl(smooth(tS - 0.1, tS + 0.5, lt) * (lt < tW ? 0.86 : 0) + (lt >= tW ? 0.86 * (1 - smooth(tW, tW + 1.0, lt)) : 0)));
    txt(s, 'bebas sh', 'EK GHAAR MEIN PANAAH', { left: '110px', top: '110px', fontSize: '110px' }, L('161', 'ghaar') - 0.05, tS, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'mono sh', 'NEEND', { left: '0', width: W + 'px', top: '490px', textAlign: 'center', fontSize: '90px', fontWeight: 700, letterSpacing: '1em', paddingLeft: '1em', color: 'rgba(245,241,232,.9)', zIndex: 40 }, tS + 0.35, tW - 0.1, { opacity: 0, letterSpacing: '1.6em' }, 0.6);
    s.div('scrim-l', { width: '64%', zIndex: 31 });
    const z = (n) => n.forEach((e) => { e.style.zIndex = 41; });
    z(qa(s, Q.q, '“Kitni der thehre?”', 150, L('165') - 0.1, { size: 120 }));
    txt(s, 'mono sh', 'WOHI SAWAL · WOHI JAWAB', { left: '114px', top: '470px', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: CYAN, zIndex: 41 }, L('166') - 0.05, null, { opacity: 0, x: -20 }, 0.35);
    z(qa(s, Q.ans, '“Ek din… ya <span style="color:#E9B955">din ka kuch hissa</span>.”', 530, L('167') - 0.1, { size: 110, tt: L('167') + 0.1 }));
    s.sfx('subdrop', tS, { gain: 0.8 }); s.sfx('riser', tS + 0.3, { dur: Math.max(0.6, tW - tS - 0.3), gain: 0.6 }); s.sfx('whoosh', tW, { gain: 0.6 }); s.sfx('shimmer', L('165') - 0.1, { gain: 0.8 }); s.sfx('shimmer', L('167') - 0.1, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── E4  the coin goes to the bazaar ─────────
  defScene('e4_coin', T('169') - 0.05, T('177') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tB = L('172') - 0.2;
    bg(s, '#010205'); bokeh(s, { seed: 12, n: 54, alpha: (lt) => 0.25 + 0.7 * smooth(tB, tB + 1.2, lt) });
    const st = stage3d(s, { fov: 30 }); const c = coin(); st.scene.add(c); const up = coinLights(st.scene, { a0: -0.6, sp: 0.3, rimI: 13 });
    st.frame = (lt) => { up(lt); c.position.set(1.05, 0, 0); c.rotation.set(-0.36 + Math.sin(lt * 0.5) * 0.1, -0.42 + 0.2 * Math.sin(lt * 0.4), 0.05); const sh = smooth(L('174', 'shor') - 0.1, L('174', 'shor') + 0.2, lt) * (1 - smooth(L('176') - 0.3, L('176'), lt)); c.position.x += Math.sin(lt * 40) * 0.012 * sh; st.camera.position.set(0, 0, 5.5 - lt * 0.03); st.camera.lookAt(0, 0, 0); };
    dust(s, { n: 70, seed: 5 });
    const LX = '110px', one = (cls, html, top, t0, t1, st2 = {}) => txt(s, cls, html, { left: LX, top: top + 'px', width: '820px', ...st2 }, t0, t1, { opacity: 0, x: -30 }, 0.4);
    one('bebas sh', 'BHOOK LAGI HAI', 150, L('169') - 0.05, L('170') - 0.05, { fontSize: '130px' });
    one('bebas sh', 'CHAANDI KA SIKKA', 150, L('170', 'chaandi') - 0.05, tB, { fontSize: '130px' });
    one('ar glowg', Q['w:wariq'], 300, L('170', 'sikka') - 0.05, tB, { fontSize: '100px', lineHeight: '1.9', color: '#FFF3D0', width: 'auto' });
    one('cinzel gold sh', REF['18:19'], 500, L('170', 'sikka') + 0.2, tB, { fontSize: '26px', fontWeight: 700, letterSpacing: '.34em' });
    one('play sh', '“Khana le aao — aur dekhna,<br><span style="color:#E9B955">kisi ko hamari khabar na ho.</span>”', 590, L('171') - 0.05, tB, { fontSize: '56px', fontStyle: 'italic', lineHeight: '1.25' });
    one('bebas sh', 'AUR AAP JAANTE HAIN…', 150, tB + 0.15, L('173') - 0.05, { fontSize: '120px' });
    txt(s, 'tag sh', 'RIWAYATON MEIN AATA HAI', { left: LX, top: '130px', color: CYAN, background: 'rgba(3,8,18,.5)' }, L('173') - 0.05, null, { opacity: 0, x: -20 }, 0.35);
    one('mont sh', 'Dukaandar ne sikka dekha —', 230, L('174') - 0.05, null, { fontSize: '50px', fontWeight: 700 });
    const sh = one('bebas sh', '“IS KE HAATH PURANA <span style="color:#FF4B4B">KHAZANA</span> LAGA HAI!”', 320, L('175') - 0.05, null, { fontSize: '96px', lineHeight: '1.0', whiteSpace: 'normal' });
    shake(s, sh, L('175') + 0.1, 0.8, 9);
    one('mont sh', 'Aur woh kehta raha:', 590, L('175', 'woh') - 0.05, null, { fontSize: '44px', fontWeight: 700, color: 'rgba(245,241,232,.8)' });
    const kl = one('bebas sh', '“<span style="color:#E9B955">KAL TAK</span> YEHI SIKKA YAHAN CHALTA THA!”', 660, L('176') - 0.05, null, { fontSize: '92px', lineHeight: '1.0', whiteSpace: 'normal' });
    s.sfx('chime', L('170', 'sikka'), { gain: 0.7 }); s.sfx('whoosh', tB, { gain: 0.6 }); s.sfx('swell', L('174', 'shor') - 0.2, { dur: 1.2, gain: 0.8 }); s.sfx('hit', L('175'), { gain: 0.9 }); s.sfx('hit', L('176'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.25 });
  defScene('e4b_truth', T('177') - 0.05, T('180') - 0.05, (s) => {
    const L = mkL(s); bg(s, '#000');
    slam(s, 'WOH <span style="color:#E9B955">JHOOT NAHI</span> BOL RAHA THA.', 0.03, { cls: 'bebas sh', size: 150, y: 360, from: 1.22, dur: 0.16, amp: 10 });
    txt(s, 'bebas sh', 'US KE LIYE…', { left: '0', width: W + 'px', top: '560px', textAlign: 'center', fontSize: '110px', color: 'rgba(245,241,232,.8)' }, L('178') - 0.05, null, { opacity: 0, y: 14 }, 0.35);
    slam(s, 'WAQAI KAL THA.', L('179') - 0.06, { cls: 'bebas goldgrad', size: 190, y: 680, from: 1.4, amp: 10 });
    s.sfx('boom', 0, { gain: 1.0 }); s.sfx('subdrop', 0.02, { gain: 0.8 }); s.sfx('hit', L('179') + 0.14, { gain: 0.9 });
  });

  // ───────── E5  ayah 18:25 — "three hundred… and nine" ─────────
  defScene('e5_ayah', T('180') - 0.05, T('186') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t3 = L('184') - 0.1, t9 = L('185', 'nau') - 0.15;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    txt(s, 'bebas sh', 'TO ASAL MEIN KITNA WAQT GUZRA THA?', { left: '0', width: W + 'px', top: '440px', textAlign: 'center', fontSize: '130px' }, L('180') - 0.02, L('181') - 0.1, { opacity: 0, y: 20 }, 0.4);
    const A = ay(s, '18:25', '18:25', '“Woh apne ghaar mein <span class="hl">teen sau saal</span> rahe —|aur <span class="hl">nau aur badha diye</span>.”', L('181') - 0.05, null, { tAr: L('181') + 0.25, dAr: Math.max(1.0, L('182') - L('181') - 0.3), trTimes: [L('182') - 0.05, L('182', 'aur') - 0.05], hl: { 3: t3, 4: t3, 5: t3, 6: t9, 7: t9 }, size: 96 });
    s.tl.to(A.wrap, { y: -90, duration: 0.6, ease: 'power2.inOut' }, L('183') - 0.1);
    txt(s, 'bebas sh', '300', { left: '430px', top: '760px', fontSize: '230px', lineHeight: '1' }, t3, null, { opacity: 0, scale: 1.4 }, 0.25);
    txt(s, 'bebas sh', '…', { left: '790px', top: '760px', fontSize: '230px', lineHeight: '1', color: 'rgba(245,241,232,.5)' }, t3 + 0.3, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', '+ 9', { left: '960px', top: '760px', fontSize: '230px', lineHeight: '1', color: GOLD }, t9, null, { opacity: 0, scale: 1.4 }, 0.25);
    txt(s, 'mont sh', 'Seedha <span style="color:#FF4B4B">“309”</span> kyun nahi?', { left: '1290px', top: '836px', fontSize: '46px', fontWeight: 800 }, L('185', 'seedha') - 0.05, null, { opacity: 0, x: 20 }, 0.35);
    s.sfx('shimmer', L('181') + 0.25, { gain: 0.9 }); s.sfx('hit', t3, { gain: 0.8 }); s.sfx('hit', t9, { gain: 0.9 }); s.sfx('tick', L('185', 'seedha'), { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── E6a  the calculator: 365.24 × 300 ÷ 354.37 = 309.2 ─────────
  defScene('e6a_calc', T('186') - 0.05, T('196') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 66% 50%, #1a1630 0%, #080714 58%, #000 100%)');
    txt(s, 'chip', 'AAP BHI KIJIYE', { left: '110px', top: '110px' }, 0.05, null, { opacity: 0, x: -30 }, 0.4);
    const p = calc(s, { x: 1110, y: 90 }); show(s, p, L('186') - 0.02, null, { opacity: 0, y: 60 }, 0.5);
    txt(s, 'bebas sh', 'CALCULATOR KHOLIYE', { left: '110px', top: '200px', fontSize: '130px' }, L('187') - 0.05, L('189') - 0.1, { opacity: 0, x: -30 }, 0.35);
    const pz = txt(s, 'panel', `<div style="padding:26px 40px;display:flex;align-items:center;gap:26px"><div style="display:flex;gap:12px"><div style="width:16px;height:56px;background:${GOLD}"></div><div style="width:16px;height:56px;background:${GOLD}"></div></div><div class="mono" style="font-size:30px;font-weight:700;letter-spacing:.26em">VIDEO PAUSE KAR LIJIYE</div></div>`, { left: '110px', top: '400px' }, L('188') - 0.05, L('189') - 0.1, { opacity: 0, y: 20 }, 0.35);
    // the steps on the left
    const step = (top, icon, lab, val, t, colr) => { const g = txt(s, null, `<div style="display:flex;align-items:center;gap:30px">${icon}<div><div class="mono" style="font-size:28px;font-weight:700;letter-spacing:.3em;color:${colr}">${lab}</div><div class="bebas" style="font-size:130px;line-height:1">${val}</div></div></div>`, { left: '110px', top: top + 'px' }, t, null, { opacity: 0, x: -30 }, 0.4); return g; };
    step(200, SUNI(130), 'SURAJ WALA SAAL', '365.24 DIN', L('189') - 0.05, GOLD);
    txt(s, 'bebas sh', '× 300', { left: '750px', top: '236px', fontSize: '130px', color: GOLD }, L('191', '300') - 0.1, null, { opacity: 0, scale: 1.3 }, 0.25);
    step(440, MOONI(118), 'CHAAND WALA SAAL', '354.37 DIN', L('192', 'chaand') - 0.05, '#dfe8ff');
    txt(s, 'bebas sh', '÷', { left: '750px', top: '470px', fontSize: '150px', color: '#dfe8ff' }, L('192', 'taqseem') - 0.1, null, { opacity: 0, scale: 1.3 }, 0.25);
    let t = p.type(L('190') - 0.05, '365.24', 0.1); const tx = L('191', '300') - 0.22; p.at(tx, '365.24', '365.24 ×', '×'); t = p.type(tx + 0.18, '300', 0.11, '', '365.24 ×'); p.at(t + 0.25, '109572', '365.24 × 300 =', '=');
    const td = L('193') - 0.3; p.at(td, '109572', '109572 ÷', '÷'); t = p.type(td + 0.2, '354.37', 0.1, '', '109572 ÷');
    const tR = L('194') - 0.12; p.at(tR, '309.2', '109572 ÷ 354.37 =', '=');
    for (const [a, n] of [[L('190') - 0.05, 6], [tx + 0.18, 3], [td + 0.2, 6]]) for (let i = 0; i < n; i++) s.sfx('tick', a + i * 0.105, { gain: 0.7 });
    flash(s, tR, { peak: 0.55, dur: 0.45 }); s.sfx('impact', tR, { gain: 1.0 }); s.sfx('ding', tR + 0.1, { gain: 0.8 });
    s.onUpdate((lt) => { p.main.style.color = lt >= tR ? GOLD : '#fff'; p.style.scale = String(1 + 0.05 * Math.exp(-Math.max(0, lt - tR) * 6) * (lt >= tR ? 1 : 0)); });
    const res = slam(s, '309.2', tR, { size: 300, x: 60, w: 1000, y: 690, color: GOLD, from: 1.5, amp: 16 });
    txt(s, 'mono sh', 'TEEN SAU NAU · POINT DO', { left: '60px', width: '1000px', top: '968px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: 'rgba(245,241,232,.85)' }, L('195') - 0.05, null, { opacity: 0 }, 0.3);
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── E6b  one span, two calendars — both counts in one sentence ─────────
  defScene('e6b_two', T('196') - 0.05, T('201') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #151c3a 0%, #070914 58%, #000 100%)');
    const bar = (top, icon, lab, n, colr, t) => { const g = s.div(null, { position: 'absolute', left: '150px', top: top + 'px', width: '1620px', height: '200px' });
      g.innerHTML = `<div style="position:absolute;left:0;top:30px">${icon}</div><div class="mono" style="position:absolute;left:170px;top:0;font-size:28px;font-weight:700;letter-spacing:.3em;color:${colr}">${lab}</div><div class="br" style="position:absolute;left:170px;top:52px;width:1100px;height:74px;border-radius:8px;background:repeating-linear-gradient(90deg, ${colr} 0 ${1100 / n - 1.4}px, rgba(0,0,0,.55) ${1100 / n - 1.4}px ${1100 / n}px);transform-origin:0 50%"></div><div class="bebas" style="position:absolute;left:1310px;top:14px;font-size:150px;line-height:1;color:${colr}">${n}</div>`;
      show(s, g, t, null, { opacity: 0, x: -40 }, 0.4); s.tl.fromTo(g.querySelector('.br'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.out' }, t + 0.1); return g; };
    bar(190, SUNI(130), '300 SHAMSI SAAL', 300, GOLD, L('196') - 0.05); bar(430, MOONI(118), '309 QAMARI SAAL', 309, '#dfe8ff', L('196', 'barabar') - 0.05);
    txt(s, 'bebas sh', 'EK HI MUDDAT', { left: '320px', top: '650px', fontSize: '110px' }, L('197') - 0.05, null, { opacity: 0, y: 16 }, 0.3);
    txt(s, 'bebas sh', '· DO CALENDAR', { left: '860px', top: '650px', fontSize: '110px', color: CYAN }, L('198') - 0.05, null, { opacity: 0, y: 16 }, 0.3);
    const a1 = txt(s, 'ar glowg', Q['w:300'], { right: '820px', top: '760px', fontSize: '100px', lineHeight: '1.9', color: '#FFF3D0' }, L('199') - 0.05, null, { opacity: 0, y: 16 }, 0.5);
    const a2 = txt(s, 'ar goldgrad', Q['w:tisa'], { right: '330px', top: '760px', fontSize: '100px', lineHeight: '1.9' }, L('199', 'dono') - 0.05, null, { opacity: 0, y: 16 }, 0.5);
    txt(s, 'mono sh', 'DONO GINTI — EK JUMLE MEIN', { left: '0', width: W + 'px', top: '966px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: GOLD }, L('200') - 0.05, null, { opacity: 0 }, 0.35);
    s.sfx('whoosh', L('196'), { gain: 0.6 }); s.sfx('whoosh', L('196', 'barabar'), { gain: 0.6 }); s.sfx('hit', L('197'), { gain: 0.7 }); s.sfx('hit', L('198'), { gain: 0.7 }); s.sfx('shimmer', L('199'), { gain: 0.8 }); s.sfx('chime', L('200'), { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── E7  the fair note ─────────
  defScene('e7_fair', T('201') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #17182c 0%, #08080f 58%, #000 100%)');
    const br = s.div(null, { position: 'absolute', left: '150px', top: '150px', width: '10px', height: '780px', background: GOLD, transformOrigin: '50% 0%' }); s.tl.fromTo(br, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'power2.out' }, 0.02);
    txt(s, 'cinzel gold sh', 'INSAAF KI BAAT', { left: '200px', top: '150px', fontSize: '56px', fontWeight: 700, letterSpacing: '.3em' }, L('201') - 0.05, null, { opacity: 0, x: -20 }, 0.4);
    txt(s, 'mont sh', 'Yeh farq us zamane ke <span style="color:#6FD8FF">hisaab-daanon ko maloom tha</span>.', { left: '204px', top: '280px', fontSize: '48px', fontWeight: 700 }, L('202') - 0.05, null, { opacity: 0, y: 14 }, 0.4);
    lowerThird(s, 'IMAM IBN KATHIR', 'Tafsir (18:25) · saat sau saal pehle yehi likha', L('202', 'Imam') - 0.05, d + 1, { style: { left: '230px', bottom: 'auto', top: '380px' } });
    txt(s, 'bebas sh', 'KAMAAL HISAAB KA NAHI —', { left: '200px', top: '610px', fontSize: '110px' }, L('203') - 0.05, null, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'bebas sh', 'BAYAN KA HAI.', { left: '1160px', top: '610px', fontSize: '110px', color: GOLD }, L('203', 'bayan') - 0.05, null, { opacity: 0, x: 30 }, 0.35);
    txt(s, 'mont sh', 'Ginti badli → number badal gaya.', { left: '204px', top: '760px', fontSize: '50px', fontWeight: 700 }, L('204') - 0.05, null, { opacity: 0, y: 14 }, 0.35);
    txt(s, 'bebas sh', 'WAQT WOHI RAHA.', { left: '200px', top: '836px', fontSize: '100px', color: CYAN }, L('205') - 0.05, null, { opacity: 0, y: 14 }, 0.35);
    s.sfx('tick', L('202'), { gain: 0.8 }); s.sfx('hit', L('203', 'bayan'), { gain: 0.8 }); s.sfx('ding', L('205'), { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
