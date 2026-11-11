// PART B — PEHLA SAWAL: the ruined town, a hundred years, three clocks (spoken lines 38..71)
import { defScene, T, gsap, el, clamp, lerp, smooth, W, H, film } from '../engine.js';
const has = (k) => !!(film.cues.s && film.cues.s[k]);
import { cap, flash, show, svg, shake, lowerThird, counter } from '../ui.js';
import { mkL, bg, dust, slam, txt, clock, dunes, ruins, pict, chapter, clipAt, GOLD, CYAN, RED } from '../lib14.js';
import { Q, REF } from '../quran.js';

const SUNSET = 'linear-gradient(180deg,#140c1c 0%,#4a2218 36%,#c9742f 60%,#f2b862 72%,#34190e 74.5%,#0e0604 100%)';
// five silhouette layers (far → near) that can move separately for parallax
export function town(s, seed = 0, hk = 1) {
  const mk = (d, fill) => svg(s, `<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`);
  return [mk(dunes(4 + seed, 800, 30), '#3b1d12'), mk(ruins(7 + seed, 818, 250 * hk, { gap: 240 }), '#2a130c'), mk(dunes(9 + seed, 868, 40), '#1c0d08'), mk(ruins(12 + seed, 925, 450 * hk, { w: 260, gap: 330 }), '#0c0504'), mk(dunes(15 + seed, 985, 46), '#050202')];
}
const sun = (s, x, y, r = 320) => s.div(null, { position: 'absolute', left: (x - r / 2) + 'px', top: (y - r / 2) + 'px', width: r + 'px', height: r + 'px', borderRadius: '50%', background: 'radial-gradient(circle,#fff6d0 0%,#ffd27a 30%,rgba(255,190,90,.35) 55%,rgba(255,190,90,0) 72%)' });
// eyelids: two soft-edged black shutters; k = 0 open … 1 closed
export function lids(s) {
  const a = s.div(null, { position: 'absolute', left: '-5%', width: '110%', top: '-70%', height: '120%', background: 'radial-gradient(ellipse 60% 100% at 50% 0%, #000 0%, #000 82%, rgba(0,0,0,0) 100%)', zIndex: 30 });
  const b = s.div(null, { position: 'absolute', left: '-5%', width: '110%', bottom: '-70%', height: '120%', background: 'radial-gradient(ellipse 60% 100% at 50% 100%, #000 0%, #000 82%, rgba(0,0,0,0) 100%)', zIndex: 30 });
  return (k) => { a.style.transform = `translateY(${(-52 + 62 * k).toFixed(2)}%)`; b.style.transform = `translateY(${(52 - 62 * k).toFixed(2)}%)`; };
}
// one Q/A block: arabic line (gold) + Roman-Urdu line
export function qa(s, ar, tr, y, t, o = {}) {
  const a = txt(s, 'ar glowg', ar, { left: '110px', top: y + 'px', fontSize: (o.size || 92) + 'px', lineHeight: '1.9', color: '#FFF3D0' }, t, o.out, { opacity: 0, y: 20 }, 0.6);
  const b = txt(s, 'mont sh', tr, { left: '114px', top: (y + Math.round((o.size || 92) * 1.98)) + 'px', fontSize: '44px', fontWeight: 700 }, o.tt ?? t + 0.25, o.out, { opacity: 0, x: -20 }, 0.45);
  return [a, b];
}

export default function ([P0, P1]) {
  // ───────── B1  chapter card ─────────
  defScene('b1_chap', P0, T('40') - 0.1, (s) => { const L = mkL(s); chapter(s, 1, 'PEHLA SAWAL', 'SURAH AL-BAQARAH · AYAT 259', '2:259q', Math.max(0.1, L('38') - 0.08), s.t1 - s.t0); }, { fin: 0.3 });

  // ───────── B2  POV: riding through the ruined town ─────────
  defScene('b2_town', T('40') - 0.1, T('45') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, SUNSET); const sn = sun(s, 1330, 770); const ly = town(s);
    s.onUpdate((lt) => { const k = lt / d, bob = Math.sin(lt * 2.6) * 5;
      ly.forEach((l, i) => { const z = 1.03 + k * (0.03 + i * 0.045); l.style.transform = `translate(${(-k * (10 + i * 22)).toFixed(1)}px, ${(bob * (0.3 + i * 0.25)).toFixed(1)}px) scale(${z.toFixed(4)})`; l.style.transformOrigin = '55% 82%'; });
      sn.style.transform = `translate(${(-k * 8).toFixed(1)}px, ${(k * 14).toFixed(1)}px)`; });
    dust(s, { n: 120, seed: 8, color: '255,210,150', vx: 30 });
    s.div('scrim-b', { height: '36%' });
    lowerThird(s, 'HAZRAT UZAIR', '(alayhis-salam) · mashhoor qaul ke mutabiq', L('40', 'Hazrat') - 0.1, L('41') - 0.1, { bottom: 150 });
    txt(s, 'mono sh', 'CHHATEIN ZAMEEN PAR', { left: '0', width: W + 'px', top: '240px', textAlign: 'center', fontSize: '50px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em' }, L('41') - 0.05, L('42') - 0.05, { opacity: 0, letterSpacing: '.9em' }, 0.5);
    txt(s, 'mono sh', 'GALIYON MEIN SANNATA', { left: '0', width: W + 'px', top: '240px', textAlign: 'center', fontSize: '50px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em' }, L('42') - 0.05, L('43') - 0.05, { opacity: 0, letterSpacing: '.9em' }, 0.5);
    const sc = s.div('fill', { background: 'rgba(4,2,6,.55)' }); show(s, sc, L('44') - 0.3, null, { opacity: 0 }, 0.6);
    const q = s.div('play sh', { position: 'absolute', left: '210px', right: '210px', top: '300px', textAlign: 'center', fontSize: '82px', fontStyle: 'italic', lineHeight: '1.25' }, '“Allah is basti ko marne ke baad<br><span style="color:#E9B955">dobara kaise zinda karega?</span>”');
    show(s, q, L('44') - 0.1, null, { opacity: 0, y: 24 }, 0.7);
    txt(s, 'cinzel gold sh', REF['2:259'], { left: '0', width: W + 'px', top: '590px', textAlign: 'center', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, L('44') + 0.5, null, { opacity: 0 }, 0.5);
    s.sfx('swell', 0.1, { dur: 2.4, gain: 0.6 }); s.sfx('shimmer', L('44') - 0.1, { gain: 0.6 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── B3  "Allah usay wahin maut de deta hai. Sau saal." ─────────
  defScene('b3_death', T('45') - 0.05, T('48') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tC = L('46', 'maut') - 0.15, tY = L('47') - 0.1;
    bg(s, SUNSET); sun(s, 1330, 770); town(s); dust(s, { n: 80, seed: 8, color: '255,210,150' });
    const blk = s.div('fill', { background: '#03040a' }); show(s, blk, tC + 0.3, null, { opacity: 0 }, 0.5);
    // days and nights racing by behind the counter
    // real nights and days racing past (ESO Paranal time-lapse, sky only)
    const run = Math.max(0.8, d - tY - 0.5);
    const sky = clipAt(s, 'c_sky', 538, (lt) => { const k = clamp((lt - tY) / run), e = 1 - Math.pow(1 - k, 2.2); return e * 538 * 9; }, { origin: '50% 0%', zoom: 1.7, dim: 0.42 });
    show(s, sky, tY - 0.15, null, { opacity: 0 }, 0.4);
    const ck = clock(s, { x: 960, y: 250, r: 120, color: GOLD, sec: '#fff', sweep: true }); gsap.set(ck, { autoAlpha: 0 }); s.tl.set(ck, { autoAlpha: 1 }, tY);
    const num = s.div('bebas', { position: 'absolute', left: '0', width: W + 'px', top: '400px', textAlign: 'center', fontSize: '430px', lineHeight: '1', textShadow: '0 0 60px rgba(0,0,0,.8)' }, '0');
    const lab = s.div('mono', { position: 'absolute', left: '0', width: W + 'px', top: '810px', textAlign: 'center', fontSize: '60px', fontWeight: 700, letterSpacing: '.9em', paddingLeft: '.9em', color: GOLD }, 'SAAL');
    gsap.set([num, lab], { autoAlpha: 0 }); s.tl.set([num, lab], { autoAlpha: 1 }, tY);
    s.onUpdate((lt) => { const k = clamp((lt - tY) / run), e = 1 - Math.pow(1 - k, 2.2); num.textContent = String(Math.round(100 * e)); ck.set(36610 + e * 86400 * 365); });
    const cl = lids(s); s.onUpdate((lt) => cl(smooth(tC - 0.25, tC + 0.5, lt) * (1 - smooth(tY - 0.2, tY + 0.2, lt))));
    s.tl.fromTo(num, { scale: 1 }, { scale: 1.12, duration: 0.18, ease: 'power2.out' }, tY + run).to(num, { scale: 1, duration: 0.3 }, tY + run + 0.18);
    s.sfx('subdrop', tC, { gain: 1.0 }); s.sfx('thud', tC + 0.45, { gain: 0.8 }); s.sfx('riser', tY, { dur: run, gain: 0.9 }); s.sfx('clock', tY, { dur: run, gain: 1.1 }); s.sfx('impact', tY + run, { gain: 1.0 });
    flash(s, tY + run, { peak: 0.5, dur: 0.4 }); s.div('vig');
  });

  // ───────── B4  raised: "Kam labitht?" — "Ek din… ya din ka kuch hissa." — "Nahi. Tum SAU SAAL thehre ho." ─────────
  defScene('b4_wake', T('48') - 0.05, T('57') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, SUNSET); const sn = sun(s, 1420, 720, 360); const ly = town(s, 30, 0.72);
    s.onUpdate((lt) => { const k = lt / d; ly.forEach((l, i) => { l.style.transform = `scale(${(1.02 + k * (0.02 + i * 0.02)).toFixed(4)})`; l.style.transformOrigin = '70% 80%'; }); });
    dust(s, { n: 110, seed: 18, color: '255,210,150' });
    s.div('scrim-l', { width: '70%' });
    const cl = lids(s); s.onUpdate((lt) => cl(1 - smooth(0.05, 1.3, lt)));
    if (has('49b')) txt(s, 'cinzel gold sh', REF['2:259'], { left: '114px', top: '96px', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, L('49b') - 0.05, null, { opacity: 0, y: -10 }, 0.4);
    qa(s, Q['2:259q'], '“Tum kitni der thehre?”', 130, L('50') - 0.1, { size: 110 });
    // he looks at the sun: a ring pulses around it
    const ring = s.div(null, { position: 'absolute', left: '1190px', top: '490px', width: '460px', height: '460px', borderRadius: '50%', border: '4px solid rgba(255,246,208,.9)' });
    gsap.set(ring, { autoAlpha: 0 }); const tS = L('51', 'suraj') - 0.05;
    s.tl.set(ring, { autoAlpha: 1 }, tS).fromTo(ring, { scale: 0.5, opacity: 0.9 }, { scale: 1.25, opacity: 0, duration: 1.1, ease: 'power2.out', repeat: 1 }, tS);
    txt(s, 'mono sh', 'SURAJ ABHI GHUROOB NAHI HUA', { left: '1130px', top: '420px', width: '580px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em', color: '#FFF3D0' }, L('51', 'abhi') - 0.05, L('55') - 0.1, { opacity: 0, y: 10 }, 0.4);
    qa(s, Q['2:259a'], '“Ek din… ya <span style="color:#E9B955">din ka kuch hissa</span>.”', 430, L('53') - 0.1, { size: 80, tt: L('53') + 0.1 });
    const [a3, b3] = qa(s, Q['2:259b'], '“Nahi. Tum <span style="color:#FF4B4B">SAU SAAL</span> thehre.”', 680, L('55') - 0.1, { size: 80, tt: L('55') + 0.05 });
    shake(s, b3, L('56', 'SAU'), 0.5, 12); flash(s, L('56', 'SAU'), { peak: 0.45, dur: 0.4 });
    s.sfx('whoosh', 0.1, { gain: 0.6 }); s.sfx('shimmer', L('50') - 0.1, { gain: 0.8 }); s.sfx('pop', tS, { gain: 0.7 }); s.sfx('shimmer', L('53') - 0.1, { gain: 0.6 }); s.sfx('impact', L('56', 'SAU'), { gain: 0.9 });
    s.div('vig');
  });

  // ───────── B5  the proof: the ayah ─────────
  defScene('b5_ayah', T('57') - 0.05, T('60') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 60, seed: 21, color: '233,185,85' });
    const tHl = L('58', 'saal') - 0.1, tR = has('57b') ? L('57b') - 0.05 : 0.1;
    txt(s, 'bebas sh', 'AUR SABOOT — US KE SAAMNE', { left: '0', width: W + 'px', top: '440px', textAlign: 'center', fontSize: '150px' }, 0.04, tR, { opacity: 0, y: 18 }, 0.35);
    const A = s.div('ayah-wrap');
    const ref = el('div', 'ayah-ref sh', null, REF['2:259']), o1 = el('div', 'orn', { marginTop: '18px' });
    const ar = el('div', 'ayah-ar glowg', { fontSize: '84px', padding: '0 60px' });
    const aws = Q['2:259c'].split(/\s+/).map((w) => { const sp = el('span', 'aw', null, w); ar.appendChild(sp); ar.appendChild(document.createTextNode(' ')); return sp; });
    const t1 = el('div', 'ayah-tr sh', { fontSize: '46px' }, '“Apne khane ko dekho — is par <span class="hl">saal guzre hi nahi</span>.'), t2 = el('div', 'ayah-tr sh', { fontSize: '46px', marginTop: '6px' }, 'Aur apne gadhe ko dekho.”');
    A.append(ref, o1, ar, el('div', 'orn', { marginTop: '10px' }), t1, t2);
    gsap.set(o1, { opacity: 0 }); s.tl.to(o1, { opacity: 1, duration: 0.4 }, tR);
    s.tl.fromTo(ref, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.6 }, tR);
    s.tl.fromTo(aws, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, stagger: clamp((L('58') - tR - 0.6) / aws.length, 0.08, 0.3) }, tR + 0.3);
    s.tl.fromTo(t1, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, L('58') - 0.05).fromTo(t2, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, L('59') - 0.05);
    s.tl.to([aws[4], aws[5]], { color: '#F6CF6B', scale: 1.12, duration: 0.5 }, tHl).to(aws.filter((x, i) => i !== 4 && i !== 5), { opacity: 0.42, duration: 0.5 }, tHl);
    s.sfx('hit', 0.04, { gain: 0.7 }); s.sfx('shimmer', tR + 0.3, { gain: 0.8 }); s.sfx('chime', tHl, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── B6  three things, three times ─────────
  defScene('b6_three', T('60') - 0.05, T('68') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'linear-gradient(180deg,#1a1020 0%,#4a2218 46%,#8a4a22 100%)');
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 100%, rgba(255,190,90,.28) 0%, rgba(255,190,90,0) 60%)' });
    const C = [], X = [330, 960, 1590];
    const col = (i, t, icon, name, big, note, colr, rate) => {
      const g = s.div(null, { position: 'absolute', left: (X[i] - 290) + 'px', top: '150px', width: '580px', height: '800px', borderRadius: '26px', background: 'linear-gradient(180deg,rgba(8,6,10,.72),rgba(8,6,10,.5))', border: '1.5px solid rgba(255,255,255,.14)' });
      const ck = clock({ div: (c, st, h) => g.appendChild(el('div', c, st, h)) }, { x: 290, y: 150, r: 104, color: colr, sec: colr === RED ? '#fff' : RED, sweep: true });
      g.appendChild(el('div', null, { position: 'absolute', left: '170px', top: '286px' }, icon));
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '0', right: '0', top: '540px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: 'rgba(245,241,232,.8)' }, name));
      g.appendChild(el('div', 'bebas', { position: 'absolute', left: '0', right: '0', top: '584px', textAlign: 'center', fontSize: i === 2 ? '84px' : '150px', lineHeight: i === 2 ? '1.05' : '1', color: colr, paddingTop: i === 2 ? '22px' : '0' }, big));
      g.appendChild(el('div', 'mont', { position: 'absolute', left: '30px', right: '30px', top: '738px', textAlign: 'center', fontSize: '26px', fontWeight: 600, color: 'rgba(245,241,232,.75)' }, note));
      show(s, g, t, null, { opacity: 0, y: 50 }, 0.5); s.sfx('whoosh', t, { gain: 0.5 }); s.sfx('hit', t + 0.3, { gain: 0.7 });
      C.push({ ck, rate, t });
    };
    col(0, L('60') - 0.1, pict('bowl', 240, GOLD), 'KHANA', '0 SAAL', 'ek din mein kharab hone wala — taaza', GOLD, 0);
    col(1, L('61') - 0.1, pict('bones', 240, '#F5F1E8'), 'GADHA', '100 SAAL', 'wahin khada tha — haddiyon ka dher', RED, 9000);
    col(2, L('62') - 0.1, `<div style="width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,#fff6d0 0%,#ffd27a 34%,rgba(255,190,90,.3) 60%,rgba(255,190,90,0) 74%)"></div>`, 'WOH KHUD', '“DIN KA<br>KUCH HISSA”', 'us ke ehsaas mein', CYAN, 22);
    s.onUpdate((lt) => { for (const c of C) c.ck.set(36610 + Math.max(0, lt - c.t) * c.rate); });
    // steam rises from the fresh food
    const stm = s.el.querySelectorAll('.st'); s.onUpdate((lt) => stm.forEach((p, i) => { p.style.opacity = (0.45 + 0.45 * Math.sin(lt * 2.4 + i * 1.3)).toFixed(2); p.style.transform = `translateY(${(-4 * Math.sin(lt * 1.7 + i)).toFixed(1)}px)`; }));
    const hd = (html, t, colr = '#fff') => { const h = txt(s, 'bebas sh', html, { left: '0', width: W + 'px', top: '34px', textAlign: 'center', fontSize: '96px', color: colr, letterSpacing: '.04em' }, t, null, { opacity: 0, scale: 1.4 }, 0.22); return h; };
    const h1 = hd('EK HI JAGAH', L('64') - 0.05), h2 = hd('EK HI JAGAH · EK HI DHOOP', L('65') - 0.05), h3 = hd('TEEN CHEEZEIN — <span style="color:#E9B955">TEEN ALAG WAQT</span>', L('67', 'teen') - 0.06);
    s.tl.set(h1, { autoAlpha: 0 }, L('65') - 0.05).set(h2, { autoAlpha: 0 }, L('67', 'teen') - 0.06);
    s.sfx('tick', L('64'), { gain: 0.9 }); s.sfx('tick', L('65'), { gain: 0.9 }); s.sfx('braam', L('67', 'teen') - 0.06, { gain: 0.9 }); shake(s, h3, L('67', 'teen') + 0.16, 0.45, 12);
    s.sfx('clock', L('61'), { dur: Math.max(1, d - L('61')), gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── B7  the question the ayah leaves behind ─────────
  defScene('b7_q', T('68') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #101a36 0%, #05070f 60%, #000 100%)');
    const cs = [[300, 300, 120, 1], [1620, 300, 120, 14], [300, 800, 120, 150], [1620, 800, 120, 0.25]].map(([x, y, r, k]) => { const c = clock(s, { x, y, r, color: 'rgba(245,241,232,.5)', sweep: true }); c._k = k; c.style.opacity = '0.55'; return c; });
    s.onUpdate((lt) => cs.forEach((c) => c.set(36610 + lt * c._k)));
    txt(s, 'cinzel gold sh', "YEH MO'JIZA THA", { left: '0', width: W + 'px', top: '250px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em' }, L('68') - 0.05, L('70') - 0.1, { opacity: 0, y: -14 }, 0.5);
    txt(s, 'mont sh', 'Lekin yeh ayat ek sawal chhod gayi:', { left: '0', width: W + 'px', top: '340px', textAlign: 'center', fontSize: '46px', fontWeight: 600, color: 'rgba(245,241,232,.8)' }, L('69') - 0.05, L('70') - 0.1, { opacity: 0, y: 14 }, 0.45);
    const q1 = slam(s, 'KYA WAQT…', L('70') - 0.06, { cls: 'bebas sh', size: 200, y: 300, from: 1.4, amp: 8 });
    const q2 = slam(s, 'HAR CHEEZ KE LIYE <span style="color:#6FD8FF">ALAG</span> HO SAKTA HAI?', L('71') - 0.06, { cls: 'bebas sh', size: 128, y: 540, from: 1.3, amp: 10 });
    s.sfx('hit', L('70') + 0.12, { gain: 0.9 }); s.sfx('braam', L('71') - 0.06, { gain: 0.8 }); s.sfx('clock', 0, { dur: d, gain: 0.6 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
