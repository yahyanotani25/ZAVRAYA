// PART H — the ayah comes back with a calculator: 70 ÷ 1000 × 24 = 1.68 → "din ka kuch hissa"; 50,000 → 2 minutes; the leaked exam paper; 23:115 (lines 311..335)
import { defScene, T, gsap, el, clamp, lerp, smooth, W, H, film } from '../engine.js';
import { cap, flash, show, svg, shake, stamp } from '../ui.js';
import { mkL, bg, dust, slam, txt, calc, ay, GOLD, CYAN, RED } from '../lib14.js';
import { Q, REF } from '../quran.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);
// a 24-hour ring; f = fraction of the day that is lit (gold arc from the top, clockwise)
function ring(s, cx, cy, r, w = 44) {
  const C = 2 * Math.PI * r, d = svg(s, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="${w}"/><circle class="arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${GOLD}" stroke-width="${w}" stroke-dasharray="0 ${C}" transform="rotate(-90 ${cx} ${cy})" style="filter:none"/>` +
    Array.from({ length: 24 }, (_, i) => { const a = i * 15 * Math.PI / 180; return `<line x1="${cx + Math.sin(a) * (r + w / 2 + 8)}" y1="${cy - Math.cos(a) * (r + w / 2 + 8)}" x2="${cx + Math.sin(a) * (r + w / 2 + (i % 6 ? 22 : 40))}" y2="${cy - Math.cos(a) * (r + w / 2 + (i % 6 ? 22 : 40))}" stroke="rgba(245,241,232,.6)" stroke-width="${i % 6 ? 2 : 4}"/>`; }).join(''));
  const arc = d.querySelector('.arc'); d.set = (f) => arc.setAttribute('stroke-dasharray', `${(Math.max(0.0005, f) * C).toFixed(2)} ${C.toFixed(2)}`); return d;
}

export default function ([P0, P1]) {
  // ───────── H1  the calculator, one last time: 70 ÷ 1000 × 24 = 1.68 ─────────
  defScene('h1_calc', P0, T('318') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 34% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 60, seed: 21, color: '233,185,85' });
    const bm = s.div(null, { position: 'absolute', left: '110px', top: '0', width: '110px', height: '190px', background: 'linear-gradient(180deg,#F8DE9A,#C8902F)', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)', transformOrigin: '50% 0%' });
    s.tl.fromTo(bm, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'back.out(1.6)' }, Math.max(0.05, L('311') - 0.1));
    txt(s, 'cinzel gold sh', REF['22:47'], { left: '260px', top: '110px', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, L('311', 'ayat') - 0.1, null, { opacity: 0, x: -20 }, 0.4);
    txt(s, 'ar glowg', Q['22:47'], { left: '110px', top: '150px', width: '1000px', fontSize: '74px', lineHeight: '1.9', color: '#FFF3D0', textAlign: 'right' }, L('312') - 0.2, null, { opacity: 0, y: 16 }, 0.6);
    txt(s, 'mont sh', '“Ek din — tumhari ginti ke <span style="color:#E9B955">hazaar saal</span> jaisa.”', { left: '110px', top: '310px', width: '1000px', fontSize: '42px', fontWeight: 700, textAlign: 'right' }, L('312') - 0.05, null, { opacity: 0, y: 12 }, 0.4);
    const p = calc(s, { x: 1190, y: 90 }); show(s, p, L('312', 'Calculator') - 0.1, null, { opacity: 0, y: 60 }, 0.5);
    txt(s, 'chip', 'AAKHRI BAAR', { left: '860px', top: '110px' }, L('313') - 0.05, null, { opacity: 0, y: -10 }, 0.35);
    const step = (y, a, b, t, c = '#fff') => txt(s, null, `<span class="bebas" style="font-size:128px;line-height:1;color:${c}">${a}</span><span class="mono" style="font-size:28px;font-weight:700;letter-spacing:.24em;color:rgba(245,241,232,.75);margin-left:26px">${b}</span>`, { left: '110px', top: y + 'px', whiteSpace: 'nowrap' }, t, null, { opacity: 0, x: -30 }, 0.35);
    step(440, '70', 'SAAL KI ZINDAGI', L('314') - 0.05); step(580, '÷ 1000', 'EK “DIN” KE SAAL', L('315') - 0.05, GOLD); step(720, '× 24', 'DIN KE GHANTE', L('316', 'chaubees') - 0.05, CYAN);
    let t = p.type(L('314') + 0.15, '70', 0.14); const t1 = L('315') + 0.15; p.at(t1, '70', '70 ÷', '÷'); t = p.type(t1 + 0.2, '1000', 0.11, '', '70 ÷');
    const t2 = L('316', 'chaubees') + 0.1; p.at(t2 - 0.25, '0.07', '70 ÷ 1000 =', '='); p.at(t2, '0.07', '0.07 ×', '×'); t = p.type(t2 + 0.18, '24', 0.13, '', '0.07 ×');
    const tR = L('317') - 0.1; p.at(tR, '1.68', '0.07 × 24 =', '=');
    for (const [a, n, dt] of [[L('314') + 0.15, 2, 0.14], [t1 + 0.2, 4, 0.11], [t2 + 0.18, 2, 0.13]]) for (let i = 0; i < n; i++) s.sfx('tick', a + i * dt, { gain: 0.7 });
    s.onUpdate((lt) => { p.main.style.color = lt >= tR ? GOLD : '#fff'; });
    const r = slam(s, '= 1.68 <span style="font-size:.42em;letter-spacing:.1em">GHANTE</span>', tR, { size: 190, x: 100, w: 1000, y: 850, align: 'left', color: GOLD, from: 1.4, amp: 12 });
    flash(s, tR, { peak: 0.5, dur: 0.45 }); s.sfx('paper', Math.max(0.05, L('311') - 0.1), { gain: 0.7 }); s.sfx('shimmer', L('312') - 0.2, { gain: 0.7 }); s.sfx('impact', tR, { gain: 1.0 }); s.sfx('ding', tR + 0.1, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── H2  one hour forty-one minutes of a thousand-year day: "din ka kuch hissa" — and two minutes of a 50,000-year day ─────────
  const h2end = T(has('326') ? '326' : '334') - 0.05;
  defScene('h2_ring', T('318') - 0.05, h2end, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t5 = has('320') ? L('320') - 0.1 : d + 9, tM = has('323') ? L('323') - 0.06 : d + 9, tN = has('324') ? L('324') - 0.1 : d + 9;
    bg(s, 'radial-gradient(ellipse at 30% 50%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 60, seed: 21, color: '233,185,85' });
    const R = ring(s, 520, 560, 330);
    s.onUpdate((lt) => { const a = 1.68 / 24 * smooth(0.1, 1.3, lt), b = 70 / 50000; R.set(lt < t5 ? a : lerp(1.68 / 24, b, smooth(t5 + 0.6, t5 + 1.8, lt))); });
    const c1 = txt(s, 'mono sh', 'POORA DIN =<br><span class="bebas" style="font-size:110px;letter-spacing:.02em;color:#fff;line-height:1.05">1000 SAAL</span>', { left: '320px', top: '470px', width: '400px', textAlign: 'center', fontSize: '26px', fontWeight: 700, letterSpacing: '.3em', color: CYAN }, 0.15, t5 + 0.5, { opacity: 0 }, 0.4);
    const c2 = txt(s, 'mono sh', 'POORA DIN =<br><span class="bebas" style="font-size:96px;letter-spacing:.02em;color:#fff;line-height:1.05">50,000 SAAL</span>', { left: '300px', top: '470px', width: '440px', textAlign: 'center', fontSize: '26px', fontWeight: 700, letterSpacing: '.3em', color: CYAN }, t5 + 0.6, null, { opacity: 0 }, 0.4);
    txt(s, 'mono sh', '← AAPKE 70 SAAL', { left: '580px', top: '150px', fontSize: '28px', fontWeight: 700, letterSpacing: '.24em', color: GOLD }, 0.9, null, { opacity: 0, x: 20 }, 0.4);
    txt(s, 'mono sh', 'US PAIMANE PAR — POORI ZINDAGI', { left: '1000px', top: '200px', fontSize: '28px', fontWeight: 700, letterSpacing: '.24em', whiteSpace: 'nowrap', color: 'rgba(245,241,232,.8)' }, L('318', 'us') - 0.05, t5, { opacity: 0 }, 0.35);
    const hh = slam(s, '1 GHANTA', L('318', 'ek') - 0.06, { size: 214, x: 990, w: 860, y: 252, align: 'left', from: 1.4, out: t5, amp: 12 });
    const mm = slam(s, '41 MINUTE', L('318', 'ektalees') - 0.06, { size: 214, x: 990, w: 860, y: 462, align: 'left', color: GOLD, from: 1.4, out: t5, amp: 12 });
    const dk = txt(s, 'ar goldgrad', Q.ans, { left: '990px', top: '650px', fontSize: '110px', lineHeight: '1.9' }, L('319') - 0.2, t5, { opacity: 0, y: 16 }, 0.5);
    txt(s, 'bebas sh', '“DIN KA KUCH HISSA”', { left: '990px', top: '850px', fontSize: '110px' }, L('319') - 0.05, t5, { opacity: 0, y: 16 }, 0.35);
    s.sfx('swell', 0.1, { dur: 1.3, gain: 0.7 }); s.sfx('hit', L('318', 'ek') + 0.14, { gain: 0.9 }); s.sfx('braam', L('318', 'ektalees') - 0.06, { gain: 0.9 }); s.sfx('shimmer', L('319') - 0.2, { gain: 0.9 });
    // 50,000 years
    if (has('320')) {
      txt(s, 'cinzel gold sh', REF['70:4'], { left: '994px', top: '170px', fontSize: '28px', fontWeight: 700, letterSpacing: '.34em' }, t5 + 0.1, tN, { opacity: 0 }, 0.4);
      txt(s, 'ar glowg', Q['w:50k'], { left: '990px', top: '200px', fontSize: '110px', lineHeight: '1.9', color: '#FFF3D0' }, L('320', 'pachaas') - 0.3, tN, { opacity: 0, y: 16 }, 0.5);
      txt(s, 'bebas sh', '70 SAAL =', { left: '990px', top: '470px', fontSize: '150px' }, (has('322') ? L('322') : tM) - 0.05, tN, { opacity: 0, x: 30 }, 0.3);
      slam(s, '2 MINUTE', tM, { size: 236, x: 990, w: 860, y: 630, align: 'left', color: RED, from: 1.5, out: tN, amp: 14 });
      txt(s, 'mono sh', '70 ÷ 50,000 × 24 × 60 = 2', { left: '994px', top: '920px', fontSize: '30px', fontWeight: 700, letterSpacing: '.2em', color: CYAN }, tM + 0.5, tN, { opacity: 0 }, 0.4);
      s.sfx('whooshRev', t5 + 0.6, { gain: 0.7 }); s.sfx('boom', tM + 0.02, { gain: 1.0 });
      // the fair note
      if (has('324')) {
        const sc = s.div('fill', { background: 'rgba(4,6,14,.96)' }); show(s, sc, tN, null, { opacity: 0 }, 0.35);
        const br = s.div(null, { position: 'absolute', left: '330px', top: '330px', width: '10px', height: '420px', background: GOLD, transformOrigin: '50% 0%' }); gsap.set(br, { autoAlpha: 0 }); s.tl.set(br, { autoAlpha: 1 }, tN).fromTo(br, { scaleY: 0 }, { scaleY: 1, duration: 0.5 }, tN);
        txt(s, 'cinzel gold sh', 'INSAAF KI BAAT', { left: '380px', top: '330px', fontSize: '48px', fontWeight: 700, letterSpacing: '.3em' }, tN + 0.05, null, { opacity: 0, x: -20 }, 0.35);
        txt(s, 'bebas sh', 'YEH HISAAB <span style="color:#FF4B4B">TAFSIR NAHI</span>', { left: '376px', top: '420px', fontSize: '150px' }, L('324') - 0.02, null, { opacity: 0, x: -30 }, 0.3);
        txt(s, 'mont sh', 'sirf andaza lagane ke liye hai.', { left: '382px', top: '590px', fontSize: '56px', fontWeight: 700 }, L('324', 'sirf') - 0.05, null, { opacity: 0, y: 12 }, 0.35);
        if (has('325')) txt(s, 'mont sh', 'Lekin <span style="color:#E9B955">andaza ho gaya hoga</span>.', { left: '382px', top: '676px', fontSize: '56px', fontWeight: 700 }, L('325') - 0.05, null, { opacity: 0, y: 12 }, 0.35);
        s.sfx('tick', tN + 0.05, { gain: 0.8 });
      }
    }
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── H3  "Kaash tum jaante." — the ayah is being recited to YOU, today: the exam paper before the exam ─────────
  defScene('h3_parcha', T('326') - 0.05, T('334') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tQ = L('327') - 0.1, tP = L('332') - 0.15;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 60, seed: 21, color: '233,185,85' });
    txt(s, 'ar glowg', Q['w:law'], { left: '0', width: W + 'px', top: '250px', textAlign: 'center', fontSize: '130px', lineHeight: '1.9', color: '#FFF3D0' }, 0.05, tQ, { opacity: 0, y: 18 }, 0.6);
    slam(s, '“<span style="color:#E9B955">KAASH</span> TUM JAANTE.”', L('326') - 0.04, { cls: 'bebas sh', size: 210, y: 560, from: 1.25, out: tQ, amp: 8 });
    txt(s, 'bebas sh', 'YEH AYAT KIS KO SUNAYI JA RAHI HAI?', { left: '0', width: W + 'px', top: '130px', textAlign: 'center', fontSize: '110px' }, L('328') - 0.05, tP, { opacity: 0, y: 16 }, 0.35);
    const o1 = txt(s, 'panel', `<div class="bebas" style="font-size:84px;line-height:1.05;padding:38px 40px 26px;text-align:center;color:rgba(245,241,232,.6)"><span style="position:relative">UN KO — JIN SE<br>SAWAL HO CHUKA<span class="k" style="position:absolute;left:-10px;right:-10px;top:48%;height:10px;background:${RED};transform-origin:0 50%"></span></span></div>`, { left: '190px', top: '380px', width: '700px' }, L('329') - 0.05, tP, { opacity: 0, x: -40 }, 0.35);
    s.tl.fromTo(o1.querySelector('.k'), { scaleX: 0 }, { scaleX: 1, duration: 0.25 }, L('329', 'nahi') - 0.05);
    const o2 = txt(s, 'panel', `<div class="bebas" style="font-size:210px;line-height:1;padding:50px 40px 26px;text-align:center;color:${GOLD}">AAPKO</div>`, { left: '1030px', top: '360px', width: '700px', borderColor: 'rgba(233,185,85,.8)' }, L('330', 'AAPKO') - 0.06, tP, { opacity: 0, scale: 1.4 }, 0.22);
    slam(s, 'AAJ.', L('331') - 0.06, { cls: 'bebas sh', size: 230, x: 1030, w: 700, y: 690, from: 1.5, out: tP, amp: 12 });
    s.sfx('shimmer', 0.05, { gain: 0.7 }); s.sfx('slash', L('329', 'nahi') - 0.05, { gain: 0.7 }); s.sfx('braam', L('330', 'AAPKO') - 0.06, { gain: 0.9 }); s.sfx('hit', L('331') + 0.14, { gain: 0.9 });
    // the paper
    txt(s, 'bebas sh', 'IMTIHAN SE PEHLE…', { left: '110px', top: '250px', fontSize: '130px' }, tP + 0.05, null, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'bebas sh', 'PARCHA AAPKE<br>HAATH MEIN HAI', { left: '110px', top: '420px', fontSize: '150px', lineHeight: '1', color: GOLD }, L('333') - 0.05, null, { opacity: 0, x: -30 }, 0.35);
    const pp = s.div(null, { position: 'absolute', left: '1090px', top: '130px', width: '660px', height: '840px', background: 'linear-gradient(180deg,#f7f1e1,#e8dfc8)', borderRadius: '10px', boxShadow: '0 40px 110px rgba(0,0,0,.7)', color: '#1b2238' });
    pp.innerHTML = `<div class="mono" style="position:absolute;left:44px;top:40px;font-size:24px;font-weight:700;letter-spacing:.3em">IMTIHAN · PARCHA</div><div style="position:absolute;left:44px;right:44px;top:84px;height:3px;background:#1b2238"></div>
      <div class="bebas" style="position:absolute;left:44px;top:110px;font-size:84px;line-height:1">SAWAL 3</div>
      <div class="ar" style="position:absolute;left:30px;right:44px;top:200px;font-size:60px;line-height:2;color:#141008;text-align:right">${Q['23:112']}</div>
      <div class="mont" style="position:absolute;left:44px;right:44px;top:440px;font-size:38px;font-weight:700;line-height:1.3">“Tum zameen mein ginti ke kitne saal rahe?”</div>
      ${[590, 650, 710].map((y) => `<div style="position:absolute;left:44px;right:44px;top:${y}px;height:2px;background:rgba(27,34,56,.35)"></div>`).join('')}`;
    gsap.set(pp, { autoAlpha: 0, rotate: 4 }); s.tl.set(pp, { autoAlpha: 1 }, tP).fromTo(pp, { y: 900, rotate: 14 }, { y: 0, rotate: 4, duration: 0.6, ease: 'power3.out' }, tP);
    const stp = el('div', 'stamp red', { left: '36px', top: '724px', fontSize: '42px', whiteSpace: 'nowrap', transform: 'rotate(-8deg)', background: 'rgba(247,241,225,.7)' }, 'PEHLE SE BATA DIYA GAYA'); pp.appendChild(stp);
    gsap.set(stp, { autoAlpha: 0 }); s.tl.set(stp, { autoAlpha: 1 }, L('333') + 0.5).fromTo(stp, { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, L('333') + 0.5);
    s.sfx('paper', tP, { gain: 1.0 }); s.sfx('slam', L('333') + 0.7, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── H4  the very next ayah: "did you think We created you without purpose?" ─────────
  defScene('h4_abath', T('334') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t0 = L('335') - 0.3;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    txt(s, 'bebas sh', 'AUR AGLI HI AYAT POOCHTI HAI', { left: '0', width: W + 'px', top: '440px', textAlign: 'center', fontSize: '130px' }, L('334') - 0.02, t0, { opacity: 0, y: 18 }, 0.35);
    ay(s, '23:115', '23:115', '“To kya tum ne yeh samjha tha ke Hum ne tumhein <span class="hl">be-maqsad</span> paida kiya hai —|aur tum Hamari taraf lautaye nahi jaoge?”', t0, null, { tAr: t0 + 0.25, dAr: 1.6, trTimes: [L('335') - 0.05, L('335', 'aur') - 0.05], hl: { 3: L('335', 'maqsad') - 0.1 }, size: 92, trSize: 46 });
    s.sfx('shimmer', t0 + 0.25, { gain: 0.9 }); s.sfx('impact', L('335', 'maqsad'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
