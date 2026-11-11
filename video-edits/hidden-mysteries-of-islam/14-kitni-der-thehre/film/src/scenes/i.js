// PART I — the good news: one night heavier than 83 years; length vs weight; Surah Al-'Asr and its four things (lines 336..352)
import { defScene, stage3d, T, gsap, el, clamp, lerp, smooth, W, H, film } from '../engine.js';
import { cap, flash, show, svg, shake, stamp, lowerThird, footage } from '../ui.js';
import { spaceBackdrop } from '../kit3d.js';
import { mkL, bg, dust, slam, txt, ay, GOLD, CYAN, RED } from '../lib14.js';
import { Q, REF, AR } from '../quran.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);

export default function ([P0, P1]) {
  // ───────── I1  "Aur ab achhi khabar": Laylat-ul-Qadr — better than a thousand months ─────────
  defScene('i1_qadr', P0, T('343') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tA = (has('337b') ? L('337b') : L('338')) - 0.1, tH = L('339') - 0.1, tW = L('341') - 0.1;
    footage(s, 'desert1', { n: 450, speed: clamp(450 / (d * 30 + 2), 0.45, 1), kb: { s0: 1.04, s1: 1.14, y0: 0, y1: -2 } });      // one real night: the Milky Way over the Atacama (ESO)
    s.div('fill', { background: 'linear-gradient(180deg, rgba(2,4,12,.30) 0%, rgba(2,4,12,.62) 100%)' });
    const g = slam(s, 'ACHHI KHABAR', L('336', 'achhi') - 0.06, { cls: 'bebas goldgrad', size: 280, y: 380, from: 1.5, out: L('337') - 0.05, amp: 10 });
    txt(s, 'mont sh', 'Jis Quran ne 70 saal ko “din ka kuch hissa” kaha —', { left: '0', width: W + 'px', top: '330px', textAlign: 'center', fontSize: '52px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('337') - 0.02, tA, { opacity: 0, y: 14 }, 0.4);
    txt(s, 'bebas sh', 'USI QURAN NE <span style="color:#E9B955">EK RAAT</span> KE BAARE MEIN KAHA', { left: '0', width: W + 'px', top: '430px', textAlign: 'center', fontSize: '120px' }, L('337', 'usi') - 0.05, tA, { opacity: 0, y: 16 }, 0.35);
    const A = ay(s, '97:3', '97:3', '“Laylat-ul-Qadr <span class="hl">hazaar mahinon</span> se behtar hai.”', tA, tW, { tAr: tA + 0.25, dAr: Math.max(0.9, L('338') - tA - 0.3), trTimes: [L('338') - 0.05], hl: { 4: L('338', 'hazaar') - 0.05, 5: L('338', 'hazaar') - 0.05 }, size: 124, trSize: 54 });
    s.tl.to(A.wrap, { y: -110, duration: 0.6, ease: 'power2.inOut' }, tH);
    txt(s, 'mono sh', '1000 ÷ 12', { left: '0', width: W + 'px', top: '690px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.4em', color: CYAN }, tH + 0.1, tW, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', '= 83 SAAL, 4 MAHINE', { left: '0', width: W + 'px', top: '740px', textAlign: 'center', fontSize: '190px', lineHeight: '1' }, L('340') - 0.05, tW, { opacity: 0, scale: 1.3 }, 0.25);
    // the scale: one night against a whole life
    const cx = 960, cy = 420, arm = 520;
    const sc = svg(s, `<path d="M ${cx} ${cy - 30} L ${cx} 900" stroke="${GOLD}" stroke-width="14" stroke-linecap="round"/><path d="M ${cx - 170} 905 L ${cx + 170} 905" stroke="${GOLD}" stroke-width="14" stroke-linecap="round"/>
      <g class="beam"><path d="M ${cx - arm} ${cy} L ${cx + arm} ${cy}" stroke="${GOLD}" stroke-width="12" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="18" fill="${GOLD}"/></g>
      <g class="pl"><path d="M 0 0 L -150 250 M 0 0 L 150 250" stroke="rgba(233,185,85,.7)" stroke-width="4"/><path d="M -190 250 Q 0 330 190 250 Z" fill="rgba(233,185,85,.9)"/></g>
      <g class="pr"><path d="M 0 0 L -150 250 M 0 0 L 150 250" stroke="rgba(233,185,85,.7)" stroke-width="4"/><path d="M -190 250 Q 0 330 190 250 Z" fill="rgba(233,185,85,.9)"/></g>`);
    const beam = sc.querySelector('.beam'), pl = sc.querySelector('.pl'), pr = sc.querySelector('.pr');
    const lL = s.div('bebas sh', { position: 'absolute', left: '0', top: '0', width: '520px', marginLeft: '-260px', textAlign: 'center', fontSize: '84px', lineHeight: '1' }, '83 SAAL<br><span style="font-size:.5em;color:rgba(245,241,232,.7)">EK POORI ZINDAGI</span>');
    const lR = s.div('bebas sh', { position: 'absolute', left: '0', top: '0', width: '520px', marginLeft: '-260px', textAlign: 'center', fontSize: '120px', lineHeight: '1', color: GOLD }, '1 RAAT');
    const moon = s.div(null, { position: 'absolute', left: '0', top: '0', width: '130px', height: '130px', marginLeft: '-65px', borderRadius: '50%', boxShadow: 'inset -34px 8px 0 0 #F8DE9A', transform: 'rotate(-18deg)' });
    [sc, lL, lR, moon].forEach((n) => show(s, n, tW, null, { opacity: 0 }, 0.5));
    const tT = L('342') - 0.1;
    s.onUpdate((lt) => { const k = Math.max(0, lt - tT), a = (lt < tT ? 0 : 13 * (1 - Math.exp(-k * 3.2) * Math.cos(k * 7))) * Math.PI / 180;      // settles with the night side down
      beam.setAttribute('transform', `rotate(${(a * 180 / Math.PI).toFixed(2)} ${cx} ${cy})`);
      const lx = cx - arm * Math.cos(a), ly = cy - arm * Math.sin(a), rx = cx + arm * Math.cos(a), ry = cy + arm * Math.sin(a);
      pl.setAttribute('transform', `translate(${lx.toFixed(1)} ${ly.toFixed(1)})`); pr.setAttribute('transform', `translate(${rx.toFixed(1)} ${ry.toFixed(1)})`);
      lL.style.left = lx + 'px'; lL.style.top = (ly + 120) + 'px'; lR.style.left = rx + 'px'; lR.style.top = (ry + 138) + 'px'; moon.style.left = rx + 'px'; moon.style.top = (ry + 4) + 'px'; });
    cap(s, 'Ek raat… ek poori zindagi se <span class="hl">bhaari</span>', L('342') - 0.05, d + 1, { size: 50, bottom: 70 });
    s.sfx('shimmer', L('336', 'achhi'), { gain: 0.9 }); s.sfx('swell', 0.1, { dur: 2.0, gain: 0.6 }); s.sfx('shimmer', tA + 0.25, { gain: 0.9 }); s.sfx('ding', L('340'), { gain: 0.7 }); s.sfx('whoosh', tW, { gain: 0.5 }); s.sfx('thud', tT + 0.35, { gain: 0.9 }); s.sfx('chime', tT + 0.5, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── I2  not the LENGTH of time — its WEIGHT ─────────
  const i2end = (has('346b') ? T('346b') : T('347')) - 0.05;
  defScene('i2_weight', T('343') - 0.05, i2end, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tS = L('345') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #151c3a 0%, #070914 58%, #000 100%)');
    txt(s, 'mono sh', 'WAQT KI', { left: '0', width: W + 'px', top: '170px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.8em', paddingLeft: '.8em', color: CYAN }, L('343') - 0.02, tS, { opacity: 0 }, 0.3);
    const a = txt(s, 'bebas sh', '<span style="position:relative">LAMBAI<span class="k" style="position:absolute;left:-14px;right:-14px;top:46%;height:16px;background:#FF4B4B;transform-origin:0 50%"></span></span>', { left: '150px', top: '300px', width: '760px', textAlign: 'center', fontSize: '300px', lineHeight: '1', color: 'rgba(245,241,232,.7)' }, L('343', 'LAMBAI') - 0.05, tS, { opacity: 0, x: -40 }, 0.3);
    s.tl.fromTo(a.querySelector('.k'), { scaleX: 0 }, { scaleX: 1, duration: 0.25 }, L('343', 'nahi') - 0.1);
    txt(s, 'mont sh', 'aapke haath mein nahi', { left: '150px', top: '610px', width: '760px', textAlign: 'center', fontSize: '46px', fontWeight: 700, color: RED }, L('343', 'nahi') - 0.1, tS, { opacity: 0 }, 0.3);
    const w = slam(s, 'WAZAN', L('344', 'WAZAN') - 0.06, { size: 340, x: 1000, w: 800, y: 280, color: GOLD, from: 2.0, out: tS, amp: 22 });
    txt(s, 'mont sh', 'aapke haath mein hai', { left: '1000px', top: '640px', width: '800px', textAlign: 'center', fontSize: '50px', fontWeight: 800, color: GOLD }, L('344', 'aapke') - 0.05, tS, { opacity: 0 }, 0.3);
    flash(s, L('344', 'WAZAN') + 0.14, { peak: 0.4, dur: 0.35, color: '#F8DE9A' }); s.sfx('slash', L('343', 'nahi') - 0.1, { gain: 0.7 }); s.sfx('boom', L('344', 'WAZAN') - 0.04, { gain: 1.1 }); s.sfx('thud', L('344', 'WAZAN') + 0.16, { gain: 1.0 });
    txt(s, 'mont sh', 'Aur wazan kaise badhta hai?', { left: '0', width: W + 'px', top: '250px', textAlign: 'center', fontSize: '60px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, tS + 0.05, null, { opacity: 0, y: 14 }, 0.4);
    txt(s, 'bebas sh', 'ALLAH NE <span style="color:#E9B955">POORI EK SURAT</span> UTARI', { left: '0', width: W + 'px', top: '360px', textAlign: 'center', fontSize: '150px' }, L('345', 'Allah') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    txt(s, 'bebas sh', 'AUR IBTIDA MEIN — KHUD <span style="color:#6FD8FF">WAQT KI QASAM</span>', { left: '0', width: W + 'px', top: '570px', textAlign: 'center', fontSize: '110px' }, L('346') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    s.sfx('hit', L('345', 'Allah'), { gain: 0.7 }); s.sfx('swell', L('346'), { dur: 1.2, gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── I3  Surah Al-'Asr ─────────
  defScene('i3_asr', i2end, T('350') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t0 = 0.05;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #1a2a52 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 90, seed: 21, color: '233,185,85' });
    txt(s, 'cinzel gold sh', REF['103'], { left: '0', width: W + 'px', top: '96px', textAlign: 'center', fontSize: '32px', fontWeight: 700, letterSpacing: '.34em' }, t0, null, { opacity: 0, y: -14 }, 0.6);
    const line = (y, ar, sz, tr, tAr, tTr) => { const a = txt(s, 'ar glowg', ar, { left: '0', width: W + 'px', top: y + 'px', textAlign: 'center', fontSize: sz + 'px', lineHeight: '1.9', color: '#FFF3D0', padding: '0 110px' }, tAr, null, { opacity: 0, y: 18 }, 0.7);
      const b = txt(s, 'mont sh', tr, { left: '0', width: W + 'px', top: (y + Math.round(sz * 1.95)) + 'px', textAlign: 'center', fontSize: '44px', fontWeight: 700, padding: '0 150px' }, tTr, null, { opacity: 0, y: 12 }, 0.4); return [a, b]; };
    line(150, Q['103:1'], 130, '“<span style="color:#E9B955">Zamane ki qasam</span>.', L('347') - 0.45, L('347') - 0.05);
    line(450, Q['103:2'], 96, 'Beshak insaan <span style="color:#FF4B4B">khasare mein</span> hai.', L('348') - 0.4, L('348') - 0.05);
    line(690, Q['103:3'], 64, '<span style="color:#E9B955">Siwaye un ke</span> — jo imaan laye, nek amal kiye, ek doosre ko haq ki naseehat ki, aur sabr ki naseehat ki.”', L('349') - 0.4, L('349') - 0.05);
    s.sfx('shimmer', L('347') - 0.45, { gain: 1.0 }); s.sfx('swell', 0.05, { dur: 2.2, gain: 0.7 }); s.sfx('subdrop', L('348') - 0.1, { gain: 0.7 }); s.sfx('chime', L('349') - 0.1, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── I4  four things — and Imam Shafi'i ─────────
  defScene('i4_four', T('350') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    txt(s, 'bebas sh', 'CHAAR KAAM', { left: '0', width: W + 'px', top: '90px', textAlign: 'center', fontSize: '150px', color: GOLD }, L('350') - 0.04, null, { opacity: 0, scale: 1.3 }, 0.25);
    ['IMAAN', 'NEK AMAL', 'HAQ KI NASEEHAT', 'SABR KI NASEEHAT'].forEach((w, i) => { const g = s.div('panel', { left: (110 + i * 430) + 'px', top: '290px', width: '410px', height: '270px', borderColor: 'rgba(233,185,85,.55)' });
      g.innerHTML = `<div class="bebas" style="position:absolute;left:0;right:0;top:20px;text-align:center;font-size:120px;line-height:1;color:${GOLD}">${i + 1}</div><div class="bebas" style="position:absolute;left:10px;right:10px;top:156px;text-align:center;font-size:${i > 1 ? 60 : 84}px;line-height:1;padding-top:${i > 1 ? 14 : 0}px">${w}</div>`;
      show(s, g, L('350') + 0.2 + i * 0.16, null, { opacity: 0, y: 40 }, 0.35); s.sfx('pop', L('350') + 0.2 + i * 0.16, { gain: 0.8 }); });
    lowerThird(s, "IMAM SHAFI'I", `<span class="ar2" style="font-size:38px;letter-spacing:0;text-transform:none">${AR.shafii}</span> · rahimahullah`, L('351') - 0.05, d + 1, { style: { left: '724px', bottom: 'auto', top: '842px' } });
    txt(s, 'play sh', '“Agar log sirf <span style="color:#E9B955">isi ek surat</span> par ghaur kar lein —<br>to yehi un ke liye <span style="color:#E9B955">kaafi</span> hai.”', { left: '160px', width: '1600px', top: '618px', textAlign: 'center', fontSize: '66px', fontStyle: 'italic', lineHeight: '1.25' }, L('352') - 0.05, null, { opacity: 0, y: 16 }, 0.6);
    s.sfx('hit', L('350'), { gain: 0.8 }); s.sfx('shimmer', L('352'), { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
