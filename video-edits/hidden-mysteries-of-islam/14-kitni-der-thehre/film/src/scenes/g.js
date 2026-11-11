// PART G — TEESRA SAWAL: narrated in the past tense, the last request for time, the third question, no correction, the shrinking count (lines 258..310)
import { defScene, T, gsap, el, clamp, lerp, smooth, W, H, film } from '../engine.js';
import { cap, flash, show, svg, shake, stamp } from '../ui.js';
import { mkL, bg, dust, slam, txt, ecg, chapter, ay, GOLD, CYAN, RED } from '../lib14.js';
import { Q, REF } from '../quran.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);
const WHITE_BG = 'radial-gradient(ellipse at 50% 46%, #ffffff 0%, #f3eee2 55%, #d6cfbd 100%)', INK = '#141a2e';

export default function ([P0, P1]) {
  // ───────── G1  chapter card ─────────
  const g1end = T(has('259') ? '259' : '268') - 0.05;
  defScene('g1_chap', P0, g1end, (s) => { const L = mkL(s); chapter(s, 3, 'TEESRA SAWAL', 'ABHI POOCHA NAHI GAYA', 'q', Math.max(0.1, L('258') - 0.08), s.t1 - s.t0); }, { fin: 0.3 });

  // ───────── G2  (optional lines 259-267) it has not happened yet — and the Quran tells it in the past tense ─────────
  if (has('259')) defScene('g2_past', T('259') - 0.05, T('268') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tM = L('263') - 0.1, tS = L('265') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 60, seed: 21, color: '233,185,85' });
    txt(s, 'mont sh', 'Phir bhi Quran isay aise sunata hai —', { left: '0', width: W + 'px', top: '120px', textAlign: 'center', fontSize: '52px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('259') - 0.02, tM, { opacity: 0, y: 14 }, 0.4);
    txt(s, 'bebas sh', 'JAISE HO CHUKA', { left: '0', width: W + 'px', top: '190px', textAlign: 'center', fontSize: '150px', color: GOLD }, L('259', 'jaise') - 0.05, tM, { opacity: 0, scale: 1.3 }, 0.25);
    // two tenses
    const c1 = s.div('panel', { left: '170px', top: '420px', width: '740px', height: '430px' });
    c1.innerHTML = `<div class="mono" style="position:absolute;left:0;right:0;top:36px;text-align:center;font-size:28px;font-weight:700;letter-spacing:.4em;color:rgba(245,241,232,.6)">MUSTAQBIL KA SEEGHA</div><div class="bebas q" style="position:absolute;left:0;right:0;top:150px;text-align:center;font-size:112px;line-height:1;color:rgba(245,241,232,.75)">“WOH KAHENGE”</div><div class="mont" style="position:absolute;left:0;right:0;top:310px;text-align:center;font-size:36px;font-weight:700;color:${RED}">ayat yeh nahi kehti</div>`;
    const c2 = s.div('panel', { left: '1010px', top: '420px', width: '740px', height: '430px', borderColor: 'rgba(233,185,85,.7)' });
    c2.innerHTML = `<div class="mono" style="position:absolute;left:0;right:0;top:36px;text-align:center;font-size:28px;font-weight:700;letter-spacing:.4em;color:${GOLD}">MAAZI KA SEEGHA</div><div class="ar goldgrad" style="position:absolute;left:0;right:0;top:60px;text-align:center;font-size:150px;line-height:1.9">${Q['w:qalu']}</div><div class="bebas" style="position:absolute;left:0;right:0;top:318px;text-align:center;font-size:76px;line-height:1">“QALU” — UNHON NE <span style="color:#E9B955">KAHA</span></div>`;
    show(s, c1, L('260') - 0.05, tM, { opacity: 0, x: -50 }, 0.4); show(s, c2, L('261', 'kehti') - 0.05, tM, { opacity: 0, x: 50 }, 0.4);
    const st = svg(s, `<path d="M 250 628 L 830 628" stroke="${RED}" stroke-width="12" stroke-linecap="round"/>`); s.tl.fromTo(st.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25 }, L('261') - 0.1).to(st, { opacity: 0, duration: 0.3 }, tM - 0.3);
    // what the commentators say
    txt(s, 'tag sh', 'MUFASSIREEN', { left: '0', width: 'auto', top: '150px', color: CYAN, background: 'rgba(3,8,18,.5)', marginLeft: '826px' }, tM + 0.05, tS, { opacity: 0, y: -10 }, 0.35);
    txt(s, 'bebas sh', 'JO BAAT <span style="color:#E9B955">YAQEENI</span> HO —', { left: '0', width: W + 'px', top: '260px', textAlign: 'center', fontSize: '150px' }, L('264') - 0.05, tS, { opacity: 0, y: 16 }, 0.35);
    txt(s, 'bebas sh', 'ARABI USAY <span style="color:#E9B955">MAAZI</span> MEIN BAYAN KARTI HAI', { left: '0', width: W + 'px', top: '440px', textAlign: 'center', fontSize: '110px' }, L('264', 'Arabi') - 0.05, tS, { opacity: 0, y: 16 }, 0.35);
    // a thought
    txt(s, 'mont sh', 'Aur ek lamhe ko sochiye —', { left: '0', width: W + 'px', top: '150px', textAlign: 'center', fontSize: '50px', fontWeight: 700, color: 'rgba(245,241,232,.8)' }, tS + 0.05, null, { opacity: 0, y: 14 }, 0.4);
    txt(s, 'bebas sh', 'JIS NE <span style="color:#6FD8FF">WAQT</span> KO PAIDA KIYA', { left: '0', width: W + 'px', top: '240px', textAlign: 'center', fontSize: '130px' }, L('266') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    const ln = svg(s, `<path class="l" d="M 260 600 L 1660 600" stroke="rgba(245,241,232,.8)" stroke-width="5" stroke-linecap="round"/><circle cx="960" cy="600" r="13" fill="#fff"/><text x="960" y="668" text-anchor="middle" fill="rgba(245,241,232,.8)" font-family="Space Mono" font-weight="700" font-size="28" letter-spacing="6">AB</text>`);
    show(s, ln, L('266', 'saamne') - 0.2, null, { opacity: 0 }, 0.4); s.tl.fromTo(ln.querySelector('.l'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.7, ease: 'power2.out' }, L('266', 'saamne') - 0.2);
    txt(s, 'bebas sh', '“HO CHUKA”', { left: '260px', top: '456px', fontSize: '110px', color: GOLD }, L('266', 'chuka') - 0.25, null, { opacity: 0, x: 20 }, 0.3);
    txt(s, 'bebas sh', '“HOGA”', { left: '1380px', top: '456px', fontSize: '110px', color: GOLD }, L('266', 'hoga') - 0.05, null, { opacity: 0, x: -20 }, 0.3);
    slam(s, 'FARQ… HAI HI KITNA?', L('266', 'farq') - 0.06, { cls: 'bebas sh', size: 170, y: 720, from: 1.3, amp: 8 });
    txt(s, 'mont', 'hamara ghaur — tafsir nahi', { left: '0', width: W + 'px', top: '960px', textAlign: 'center', fontSize: '26px', fontWeight: 600, color: 'rgba(245,241,232,.55)' }, L('266', 'farq') + 0.4, null, { opacity: 0 }, 0.4);
    s.sfx('hit', L('259', 'jaise'), { gain: 0.8 }); s.sfx('buzz', L('261') - 0.1, { gain: 0.6 }); s.sfx('shimmer', L('261', 'kehti'), { gain: 0.9 }); s.sfx('whoosh', tM, { gain: 0.5 }); s.sfx('whoosh', tS, { gain: 0.5 }); s.sfx('hit', L('266', 'farq') + 0.14, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── G3  the moment of death: "send me back" — the request is for time — "Kalla" ─────────
  defScene('g3_death', T('268') - 0.05, T('280') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tD = L('269') - 0.05, tA = L('271') - 0.2, tW = L('273') - 0.1, tK = L('279') - 0.06, bps = 1.15;
    bg(s, '#020306');
    const e = ecg(s, { x: 0, y: 110, w: 1920, h: 240, color: RED, ppb: 300, phase: (lt) => (lt + 2) * bps, deadAt: (tD + 0.45 + 2) * bps });
    s.tl.to(e, { opacity: 0.35, duration: 0.6 }, tA);
    txt(s, 'cinzel gold sh', REF['23:99'], { left: '0', width: W + 'px', top: '70px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.34em' }, L('268') - 0.02, null, { opacity: 0, y: -12 }, 0.5);
    slam(s, 'MAUT KA LAMHA', tD, { cls: 'bebas sh', size: 210, y: 400, from: 1.25, dur: 0.18, out: tA, amp: 8 });
    for (let b = 0; b < 8; b++) { const t = (b + 0.36) / bps - 2; if (t > 0.05 && t < tD + 0.45) s.sfx('heartbeat', t, { gain: 0.9 }); }
    s.sfx('static', tD + 0.5, { dur: 0.08, gain: 0.2 }); s.sfx('subdrop', tD + 0.45, { gain: 1.0 });
    // the plea
    const a1 = txt(s, 'ar glowg', Q['23:99'], { left: '0', width: W + 'px', top: '330px', textAlign: 'center', fontSize: '120px', lineHeight: '1.9', color: '#FFF3D0' }, tA, tW, { opacity: 0, y: 20 }, 0.7);
    txt(s, 'mont sh', '“Mere Rab — <span style="color:#E9B955">mujhe wapas bhej de</span>.', { left: '0', width: W + 'px', top: '566px', textAlign: 'center', fontSize: '52px', fontWeight: 700 }, L('271') - 0.05, tW, { opacity: 0, y: 14 }, 0.45);
    txt(s, 'ar glowg', Q['23:100'], { left: '0', width: W + 'px', top: '640px', textAlign: 'center', fontSize: '84px', lineHeight: '1.9', color: '#FFF3D0' }, L('272') - 0.2, tW, { opacity: 0, y: 20 }, 0.7);
    txt(s, 'mont sh', 'Shayad main woh nek kaam kar loon jo chhod aaya hoon.”', { left: '0', width: W + 'px', top: '810px', textAlign: 'center', fontSize: '46px', fontWeight: 700 }, L('272') - 0.05, tW, { opacity: 0, y: 14 }, 0.45);
    // what is he asking for?
    txt(s, 'mont sh', 'Woh kya maang raha hai?', { left: '0', width: W + 'px', top: '370px', textAlign: 'center', fontSize: '60px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, tW + 0.05, tK - 0.1, { opacity: 0, y: 14 }, 0.4);
    const no = (word, x, t) => { const n = txt(s, 'bebas sh', `<span style="position:relative">${word}<span class="k" style="position:absolute;left:-10px;right:-10px;top:46%;height:12px;background:${RED};transform-origin:0 50%"></span></span>`, { left: x + 'px', top: '500px', fontSize: '150px', color: 'rgba(245,241,232,.6)' }, t, tK - 0.1, { opacity: 0, y: 16 }, 0.25); s.tl.fromTo(n.querySelector('.k'), { scaleX: 0 }, { scaleX: 1, duration: 0.2 }, t + 0.3); s.sfx('slash', t + 0.3, { gain: 0.7 }); };
    no('DAULAT', 330, L('274') - 0.05); no('SEHAT', 1190, L('275') - 0.05);
    txt(s, 'mono sh', 'SIRF EK CHEEZ', { left: '0', width: W + 'px', top: '700px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: CYAN }, L('276') - 0.05, tK - 0.1, { opacity: 0 }, 0.3);
    slam(s, 'THODA SA <span style="color:#E9B955">WAQT</span>', L('277') - 0.06, { cls: 'bebas sh', size: 210, y: 740, from: 1.4, out: tK - 0.1, amp: 10 });
    s.sfx('shimmer', tA, { gain: 0.7 }); s.sfx('hit', L('277') + 0.14, { gain: 0.9 });
    // the answer
    txt(s, 'mono sh', 'JAWAB', { left: '0', width: W + 'px', top: '260px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.8em', paddingLeft: '.8em', color: 'rgba(245,241,232,.8)' }, L('278') - 0.05 > tK ? tK : L('278') - 0.05, null, { opacity: 0 }, 0.3);
    const k = s.div('ar', { position: 'absolute', left: '0', width: W + 'px', top: '260px', textAlign: 'center', fontSize: '330px', lineHeight: '1.7', color: '#FF6A5A', textShadow: '0 0 60px rgba(255,75,75,.55)' }, Q['w:kalla']);
    gsap.set(k, { autoAlpha: 0 }); s.tl.set(k, { autoAlpha: 1 }, tK).fromTo(k, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, tK);
    slam(s, 'HARGIZ NAHI.', L('279', 'Hargiz') - 0.06, { cls: 'bebas sh', size: 170, y: 800, from: 1.3, amp: 12 });
    flash(s, tK + 0.2, { peak: 0.35, dur: 0.4, color: '#ff6a5a' }); s.sfx('boom', tK + 0.02, { gain: 1.1 }); s.sfx('hit', L('279', 'Hargiz') + 0.14, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── G4  the third time — the question, a whole life, the same answer (a white, empty plain) ─────────
  defScene('g4_third', T('280') - 0.05, T('296') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tQ = L('283') - 0.3, tY = L('284') - 0.05, tJ = L('292') - 0.1;
    bg(s, WHITE_BG);
    const dk = (cls, html, st, t0, t1, from, dur) => txt(s, cls, html, { color: INK, ...st }, t0, t1, from, dur);
    dk('mono', 'USI SURAT MEIN — CHAND AYATON KE BAAD', { left: '0', width: W + 'px', top: '150px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.4em', paddingLeft: '.4em' }, L('280') - 0.02, tQ, { opacity: 0, y: -10 }, 0.4);
    dk('bebas', 'WOHI SAWAL', { left: '0', width: W + 'px', top: '260px', textAlign: 'center', fontSize: '250px', lineHeight: '1' }, L('280', 'wohi') - 0.05, tQ, { opacity: 0, scale: 1.3 }, 0.25);
    dk('bebas', 'TEESRI BAAR', { left: '0', width: W + 'px', top: '500px', textAlign: 'center', fontSize: '190px', lineHeight: '1', color: '#9a6a12' }, L('281') - 0.05, tQ, { opacity: 0, scale: 1.3 }, 0.25);
    dk('mont', 'un se — jinhon ne apni zindagi <b>ganwa di</b>', { left: '0', width: W + 'px', top: '740px', textAlign: 'center', fontSize: '54px', fontWeight: 600 }, L('282') - 0.05, tQ, { opacity: 0, y: 14 }, 0.4);
    // the question
    dk('cinzel', REF['23:112'], { left: '0', width: W + 'px', top: '120px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.34em', color: '#9a6a12' }, tQ + 0.1, null, { opacity: 0 }, 0.5);
    const q1 = dk('ar', Q['23:112'], { left: '0', width: W + 'px', top: '170px', textAlign: 'center', fontSize: '110px', lineHeight: '1.9', color: '#141008' }, tQ + 0.1, null, { opacity: 0, y: 20 }, 0.7);
    dk('mont', '“Tum zameen mein ginti ke <b style="color:#9a6a12">kitne saal</b> rahe?”', { left: '0', width: W + 'px', top: '390px', textAlign: 'center', fontSize: '56px', fontWeight: 700 }, L('283') - 0.05, null, { opacity: 0, y: 14 }, 0.45);
    // a whole life, word by word, collapsing into a point
    const life = [['284', '60 SAAL'], ['285', '70 SAAL'], ['286', 'PADHAI'], ['287', 'NAUKRI'], ['288', 'SHAADI'], ['289', 'BACHCHE'], ['290', 'PARESHANIYAN'], ['291', 'KHWAB']];
    life.forEach(([k, w], i) => { if (!has(k)) return; const t = L(k) - 0.04, t2 = i + 1 < life.length && has(life[i + 1][0]) ? L(life[i + 1][0]) - 0.04 : tJ;
      const n = s.div('bebas', { position: 'absolute', left: '0', width: W + 'px', top: '540px', textAlign: 'center', fontSize: '250px', lineHeight: '1', color: INK }, w); gsap.set(n, { autoAlpha: 0 });
      s.tl.set(n, { autoAlpha: 1 }, t).fromTo(n, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.12, ease: 'power3.out' }, t).to(n, { scale: 0.02, opacity: 0, duration: Math.min(0.3, Math.max(0.12, t2 - t - 0.14)), ease: 'power3.in' }, Math.max(t + 0.14, t2 - 0.3)).set(n, { autoAlpha: 0 }, t2 + 0.01);
      s.sfx('tick', t, { gain: 0.9 }); });
    const dot = s.div(null, { position: 'absolute', left: '948px', top: '652px', width: '24px', height: '24px', borderRadius: '50%', background: INK }); show(s, dot, tJ - 0.15, null, { opacity: 0, scale: 3 }, 0.3);
    // the same answer
    dk('mono', 'JAWAB — LAFZ BA LAFZ WOHI', { left: '0', width: W + 'px', top: '560px', textAlign: 'center', fontSize: '32px', fontWeight: 700, letterSpacing: '.4em', paddingLeft: '.4em', color: '#9a6a12' }, tJ + 0.05, null, { opacity: 0 }, 0.35);
    dk('ar', Q['23:113'], { left: '0', width: W + 'px', top: '690px', textAlign: 'center', fontSize: '92px', lineHeight: '1.9', color: '#141008' }, L('293') - 0.2, null, { opacity: 0, y: 20 }, 0.7);
    dk('mont', '“Ek din… ya <b style="color:#9a6a12">din ka kuch hissa</b>. Ginne walon se pooch lijiye.”', { left: '0', width: W + 'px', top: '880px', textAlign: 'center', fontSize: '48px', fontWeight: 700 }, L('293') - 0.05, null, { opacity: 0, y: 14 }, 0.45);
    flash(s, 0, { peak: 1, dur: 0.5 }); s.sfx('boom', 0, { gain: 0.9 }); s.sfx('hit', L('281'), { gain: 0.8 }); s.sfx('shimmer', tQ + 0.1, { gain: 0.8 }); s.sfx('whooshRev', tJ - 0.4, { gain: 0.7 }); s.sfx('shimmer', L('293') - 0.2, { gain: 0.7 });
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(60,50,30,.28) 100%)' });
  });

  // ───────── G5  first time: corrected. Second time: corrected. This time: no correction — "Tum thodi der thehre. KAASH tum jaante." ─────────
  defScene('g5_nocorr', T('296') - 0.05, has('304') ? T('304') - 0.05 : P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tN = L('301') - 0.06, tA = (has('301b') ? L('301b') : L('302')) - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #121a36 0%, #06080f 55%, #000 100%)');
    const row = (y, n, a, b, t, tb, c) => { const g = s.div('panel', { left: '260px', top: y + 'px', width: '1400px', height: '170px', borderColor: c ? 'rgba(233,185,85,.7)' : 'rgba(255,255,255,.14)' });
      g.innerHTML = `<div class="bebas" style="position:absolute;left:40px;top:14px;font-size:140px;line-height:1;color:${c ? GOLD : CYAN}">${n}</div><div class="bebas" style="position:absolute;left:150px;top:36px;font-size:100px;line-height:1">${a}</div><div class="bebas x" style="position:absolute;right:44px;top:36px;font-size:100px;line-height:1;color:${c ? GOLD : '#57E39A'}">${b}</div>`;
      show(s, g, t, tN - 0.05, { opacity: 0, x: -40 }, 0.35); const x = g.querySelector('.x'); s.tl.fromTo(x, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.3 }, tb); return g; };
    row(190, '1', '“EK DIN”', 'TASHEEH: 100 SAAL', L('296') - 0.05, L('297') - 0.05); row(390, '2', '“EK DIN”', 'TASHEEH: 300 + 9', L('298') - 0.05, L('299') - 0.05); row(590, '3', '“EK DIN”', '…?', L('300') - 0.05, L('300') + 0.1, 1);
    s.sfx('ding', L('297'), { gain: 0.6 }); s.sfx('ding', L('299'), { gain: 0.6 }); s.sfx('riser', Math.max(0, tN - 1.0), { dur: 0.95, gain: 0.7 });
    const nc = slam(s, 'KOI TASHEEH <span style="color:#FF4B4B">NAHI</span>', tN, { cls: 'bebas sh', size: 250, y: 410, from: 1.4, out: tA, amp: 14 });
    s.sfx('subdrop', tN, { gain: 1.0 }); s.sfx('boom', tN + 0.02, { gain: 1.0 });
    const A = ay(s, '23:114', '23:114', '“Tum <span class="hl">thodi der</span> thehre.|<span class="hl">KAASH</span> tum jaante.”', tA, null, { tAr: tA + 0.25, dAr: Math.max(1.0, L('302') - tA - 0.2), trTimes: [L('302') - 0.05, L('303') - 0.05], hl: { 4: L('302', 'thodi') - 0.05, 6: L('303') - 0.05, 7: L('303') - 0.05, 8: L('303') - 0.05, 9: L('303') - 0.05 }, size: 100, trSize: 60 });
    s.sfx('shimmer', tA + 0.25, { gain: 0.9 }); s.sfx('impact', L('303'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.2, fout: has('304') ? 0 : 0.3 });

  // ───────── G6  (optional lines 304-310) the count keeps shrinking ─────────
  if (has('304')) defScene('g6_count', T('304') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 60, seed: 21, color: '233,185,85' });
    txt(s, 'mont sh', 'Quran yeh manzar baar baar dikhata hai —', { left: '0', width: W + 'px', top: '110px', textAlign: 'center', fontSize: '50px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('304') - 0.02, null, { opacity: 0, y: 14 }, 0.4);
    txt(s, 'bebas sh', 'HAR BAAR GINTI <span style="color:#E9B955">CHHOTI</span> HOTI JATI HAI', { left: '0', width: W + 'px', top: '176px', textAlign: 'center', fontSize: '96px' }, L('304', 'har') - 0.05, null, { opacity: 0, y: 14 }, 0.35);
    const rows = [[L('306') - 0.05, '“DAS DIN”', Q['20:103'], '20:103', 150], [L('307') - 0.05, '“SIRF EK DIN”', Q['20:104'], '20:104 · un mein sab se samajhdar', 118], [L('308') - 0.05, '“DIN KI GHADI”', Q['10:45'], '10:45', 92], [L('309') - 0.05, '“EK SHAAM… YA US KI SUBAH”', Q['79:46'], '79:46', 72]];
    let y = 310;
    rows.forEach(([t, a, ar, ref, sz], i) => { const g = s.div(null, { position: 'absolute', left: '170px', top: y + 'px', width: '1580px', height: (sz + 50) + 'px', borderTop: '1.5px solid rgba(255,255,255,.14)' });
      g.innerHTML = `<div class="bebas" style="position:absolute;left:0;top:18px;font-size:${sz}px;line-height:1;white-space:nowrap">${a}</div><div class="ar goldgrad" style="position:absolute;right:0;top:${-sz * 0.22}px;font-size:${Math.round(sz * 0.62)}px;line-height:1.9;white-space:nowrap">${ar}</div><div class="mono" style="position:absolute;left:4px;top:${sz + 14}px;font-size:20px;font-weight:700;letter-spacing:.24em;color:${CYAN}">${ref}</div>`;
      show(s, g, t, null, { opacity: 0, x: -40 }, 0.35); s.sfx('tick', t, { gain: 0.9 }); y += sz + 66; });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
