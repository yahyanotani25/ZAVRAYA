// PART J — the bet is settled: the timer, the heartbeat counter, Hasan Basri, "aap khud waqt hain", the next video, end screen (lines 353..385)
import { defScene, T, gsap, el, clamp, lerp, smooth, W, H, film } from '../engine.js';
import { cap, flash, show, svg, shake, stamp, lowerThird, footage } from '../ui.js';
import { mkL, bg, dust, slam, txt, clock, ecg, GOLD, CYAN, RED } from '../lib14.js';
import { AR } from '../quran.js';
import { beats, BPM, CHANNEL } from './_global.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export default function ([P0, P1]) {
  const tEnd = T('385e') + 0.6;

  // ───────── J1  "Aur ab — meri shart." … three seconds of silence ─────────
  defScene('j1_bet', P0, T('358') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tQ = L('356') - 0.06, tS = L('356e') + 0.15;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #141a30 0%, #070912 55%, #000 100%)');
    slam(s, 'MERI SHART', L('353', 'meri') - 0.06, { size: 260, y: 300, color: GOLD, from: 1.6, out: L('355') - 0.05, amp: 14 });
    txt(s, 'bebas sh', 'YAAD HAI?', { left: '0', width: W + 'px', top: '620px', textAlign: 'center', fontSize: '130px' }, L('354') - 0.05, L('355') - 0.05, { opacity: 0, y: 16 }, 0.3);
    txt(s, 'mono sh', 'BINA DEKHE BATAIYE', { left: '0', width: W + 'px', top: '190px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em', color: CYAN }, L('355') - 0.05, null, { opacity: 0, letterSpacing: '1.1em' }, 0.45);
    slam(s, 'YEH VIDEO KITNI DER KI THI?', tQ, { cls: 'bebas sh', size: 170, y: 300, from: 1.3, amp: 8 });
    // the silence: a ring runs down around a question mark, guesses float up
    const C = 2 * Math.PI * 150, rg = svg(s, `<circle cx="960" cy="720" r="150" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="14"/><circle class="a" cx="960" cy="720" r="150" fill="none" stroke="${GOLD}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C} ${C}" transform="rotate(-90 960 720)"/>`);
    const arc = rg.querySelector('.a'), qm = s.div('bebas', { position: 'absolute', left: '810px', top: '596px', width: '300px', textAlign: 'center', fontSize: '250px', lineHeight: '1', color: GOLD }, '?');
    show(s, rg, tS, null, { opacity: 0 }, 0.3); show(s, qm, tS, null, { opacity: 0, scale: 0.6 }, 0.3);
    s.onUpdate((lt) => { const k = clamp((lt - tS) / Math.max(0.5, d - tS - 0.1)); arc.setAttribute('stroke-dashoffset', (C * k).toFixed(1)); qm.style.transform = `scale(${(1 + 0.06 * Math.sin((s.t0 + lt) * BPM / 60 * 6.2832)).toFixed(3)})`; });
    [['5 MINUTE?', 330, 620], ['8 MINUTE?', 1300, 600], ['15 MINUTE?', 420, 860], ['10 MINUTE?', 1270, 850]].forEach(([w, x, y], i) => txt(s, 'mono sh', w, { left: x + 'px', top: y + 'px', fontSize: '40px', fontWeight: 700, letterSpacing: '.2em', color: 'rgba(245,241,232,.6)' }, tS + 0.25 + i * 0.5, null, { opacity: 0, y: 20 }, 0.5));
    s.sfx('braam', L('353', 'meri') - 0.06, { gain: 0.9 }); s.sfx('hit', tQ + 0.16, { gain: 0.9 });
    for (let t = tS; t < d - 0.2; t += 60 / BPM) s.sfx('heartbeat', t, { gain: 1.0 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── J2  the answer is on screen ─────────
  defScene('j2_timer', T('358') - 0.05, T('362') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t0 = L('358') - 0.04, tA = L('359') - 0.1, tB = L('361') - 0.08;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #10203c 0%, #060a16 55%, #000 100%)');
    const lab = txt(s, 'mono sh', 'IS VIDEO KO SHURU HUE', { left: '0', width: W + 'px', top: '170px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em', color: CYAN }, t0, null, { opacity: 0 }, 0.3);
    const tm = s.div('bebas', { position: 'absolute', left: '0', width: W + 'px', top: '236px', textAlign: 'center', fontSize: '520px', lineHeight: '1', letterSpacing: '.02em', textShadow: '0 0 70px rgba(111,216,255,.35)', transformOrigin: '50% 30%' }, '0:00');
    const un = txt(s, 'mono sh', 'MINUTE : SECOND', { left: '0', width: W + 'px', top: '760px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em', color: 'rgba(245,241,232,.7)' }, t0 + 0.2, tA, { opacity: 0 }, 0.3);
    gsap.set(tm, { autoAlpha: 0 });
    s.tl.set(tm, { autoAlpha: 1 }, t0).fromTo(tm, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, t0).to(tm, { scale: 0.52, y: -40, duration: 0.6, ease: 'power2.inOut' }, tA);
    s.onUpdate((lt) => { tm.textContent = mmss(s.t0 + lt); });
    flash(s, t0 + 0.2, { peak: 0.6, dur: 0.45 }); shake(s, tm, t0 + 0.2, 0.5, 16); s.sfx('boom', t0 + 0.02, { gain: 1.1 }); s.sfx('braam', t0 + 0.04, { gain: 1.0 });
    txt(s, 'bebas sh', 'AAPKA ANDAZA <span style="color:#6FD8FF">KAM</span> NIKLA — YA <span style="color:#FF4B4B">ZYADA</span>?', { left: '0', width: W + 'px', top: '560px', textAlign: 'center', fontSize: '120px' }, tA + 0.15, tB, { opacity: 0, y: 16 }, 0.35);
    txt(s, 'mont sh', 'Dono soorton mein ek baat sabit hui:', { left: '0', width: W + 'px', top: '720px', textAlign: 'center', fontSize: '46px', fontWeight: 700, color: 'rgba(245,241,232,.8)' }, L('360') - 0.05, tB, { opacity: 0 }, 0.3);
    slam(s, 'AAPKE ANDAR WAQT NAAPNE WALI<br><span style="color:#FF4B4B">KOI GHADI NAHI</span>', tB, { cls: 'bebas sh', size: 150, y: 560, lh: '1.02', from: 1.3, amp: 10, style: { whiteSpace: 'normal' } });
    s.sfx('hit', tB + 0.16, { gain: 0.9 });
    s.div('vig');
  });

  // ───────── J3  "Lekin ek ghadi hai": the corner counter is your heartbeat ─────────
  defScene('j3_heart', T('362') - 0.05, T('368') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tF = L('363') - 0.1, tL = L('363', 'dil') - 0.1, tZ = L('365') - 0.1, tO = L('366') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #2a0c12 0%, #0c0508 55%, #000 100%)');
    const pulse = s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, rgba(255,75,75,.30) 0%, rgba(255,75,75,0) 60%)' });
    txt(s, 'bebas sh', 'LEKIN EK GHADI HAI.', { left: '0', width: W + 'px', top: '120px', textAlign: 'center', fontSize: '130px' }, L('362') - 0.04, tZ, { opacity: 0, y: 16 }, 0.3);
    ecg(s, { x: 0, y: 700, w: 1920, h: 230, color: RED, ppb: 320, phase: (lt) => (s.t0 + lt) * BPM / 60 + 0.64 });
    const num = s.div('bebas', { position: 'absolute', left: '0', top: '0', fontSize: '440px', lineHeight: '1', letterSpacing: '.02em', color: '#fff', transformOrigin: '0 0', whiteSpace: 'nowrap', textShadow: '0 0 60px rgba(255,75,75,.5)' }, '0000');
    s.onUpdate((lt) => { const t = s.t0 + lt, ph = (t * BPM / 60) % 1, b = Math.exp(-ph * 7); num.textContent = String(beats(t)).padStart(4, '0');
      const k = smooth(tF, tF + 0.75, lt), w = num.offsetWidth || 700, sc = lerp(30 / 440, 1, k) * (1 + 0.035 * b * k);
      num.style.transform = `translate(${lerp(58, 960 - w / 2, k).toFixed(1)}px, ${lerp(1012, 270, k).toFixed(1)}px) scale(${sc.toFixed(4)})`; num.style.opacity = (lt < tF ? 0.6 : 1).toFixed(2);
      pulse.style.opacity = (k * (0.35 + 0.65 * b)).toFixed(3); });
    txt(s, 'mono sh', 'AAPKE DIL KI DHADKANEIN — IS VIDEO MEIN', { left: '0', width: W + 'px', top: '212px', textAlign: 'center', fontSize: '38px', fontWeight: 700, letterSpacing: '.4em', paddingLeft: '.4em', color: '#FF8A8A' }, tL, tZ, { opacity: 0 }, 0.35);
    flash(s, tL + 0.1, { peak: 0.35, dur: 0.4, color: '#ff6a6a' });
    txt(s, 'mono sh', 'POORI ZINDAGI MEIN', { left: '0', width: W + 'px', top: '120px', textAlign: 'center', fontSize: '38px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: 'rgba(245,241,232,.8)' }, tZ + 0.05, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', '≈ 2.5 ARAB DHADKANEIN', { left: '0', width: W + 'px', top: '170px', textAlign: 'center', fontSize: '110px', color: GOLD }, L('365', 'dhaai') - 0.05, null, { opacity: 0, scale: 1.3 }, 0.25);
    const ar = txt(s, 'bebas sh', 'YEH GINTI <span style="color:#FF4B4B">SIRF EK TARAF</span> CHALTI HAI →', { left: '0', width: W + 'px', top: '940px', textAlign: 'center', fontSize: '84px' }, L('367') - 0.05, null, { opacity: 0, x: -30 }, 0.35);
    s.sfx('whoosh', tF, { gain: 0.8 }); s.sfx('impact', tF + 0.75, { gain: 0.9 }); s.sfx('hit', L('365', 'dhaai'), { gain: 0.8 });
    for (let n = Math.ceil((s.t0 + tF + 0.8) * BPM / 60); n * 60 / BPM < s.t1 - 0.1; n++) s.sfx('heartbeat', n * 60 / BPM - s.t0, { gain: 1.0 });
    s.div('vig');
  });

  // ───────── J4  Hasan Basri: "you are a handful of days" — "Aap KHUD waqt hain." ─────────
  defScene('j4_hasan', T('368') - 0.05, T('374') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tB = L('372') - 0.2, N = 84, cols = 21;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    lowerThird(s, 'HASAN BASRI', `<span class="ar2" style="font-size:38px;letter-spacing:0;text-transform:none">${AR.hasan}</span> · rahimahullah`, L('368') - 0.05, tB, { style: { left: '170px', bottom: 'auto', top: '110px' } });
    const tiles = []; for (let i = 0; i < N; i++) { const t = s.div(null, { position: 'absolute', left: (170 + (i % cols) * 76) + 'px', top: (330 + Math.floor(i / cols) * 76) + 'px', width: '62px', height: '62px', borderRadius: '8px', background: 'linear-gradient(180deg,#F8DE9A,#C8902F)' }); tiles.push(t); }
    const tT0 = L('369') - 0.05, tT1 = tB - 0.1;
    s.onUpdate((lt) => { const k = clamp((lt - tT0) / Math.max(0.5, tT1 - tT0)) * N * 0.72; tiles.forEach((t, i) => { const a = clamp(k - i), on = lt >= tT0 - 0.6; t.style.opacity = on ? (lt >= tB ? 0 : (1 - a) * clamp((lt - (tT0 - 0.6) - i * 0.006) / 0.3)).toFixed(3) : '0'; t.style.transform = `translateY(${(a * 60).toFixed(1)}px) rotate(${(a * 18).toFixed(1)}deg)`; }); });
    txt(s, 'play sh', '“Ae Ibn-e-Adam! Tu <span style="color:#E9B955">chand dinon ka majmua</span> hai.', { left: '170px', width: '1580px', top: '690px', fontSize: '68px', fontStyle: 'italic' }, L('369') - 0.05, tB, { opacity: 0, y: 16 }, 0.5);
    txt(s, 'play sh', 'Jab ek din guzarta hai — to <span style="color:#E9B955">tera ek hissa</span> guzar jata hai.”', { left: '170px', width: '1580px', top: '800px', fontSize: '68px', fontStyle: 'italic' }, L('371') - 0.05, tB, { opacity: 0, y: 16 }, 0.5);
    const blk = s.div('fill', { background: '#000' }); show(s, blk, tB, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', 'AAPKE PAAS WAQT NAHI.', { left: '0', width: W + 'px', top: '300px', textAlign: 'center', fontSize: '170px', color: 'rgba(245,241,232,.85)' }, L('372') - 0.04, null, { opacity: 0, y: 14 }, 0.3);
    const y = slam(s, 'AAP <span class="goldgrad">KHUD</span> WAQT HAIN.', L('373') - 0.06, { cls: 'bebas', size: 260, y: 500, from: 1.5, drift: 0.05, amp: 14 });
    for (let i = 0; i < 9; i++) { const t = tT0 + (tT1 - tT0) * i / 9; s.sfx('tick', t, { gain: 0.7 }); }
    s.sfx('shimmer', L('368'), { gain: 0.7 }); s.sfx('subdrop', tB, { gain: 0.9 }); s.sfx('boom', L('373') - 0.04, { gain: 1.2 }); s.sfx('braam', L('373') - 0.02, { gain: 1.0 });
    flash(s, L('373') + 0.14, { peak: 0.5, dur: 0.5, color: '#F8DE9A' });
  }, { fin: 0.25 });

  // ───────── J5  one thing after this video ─────────
  defScene('j5_cta', T('374') - 0.05, T('377') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #141a30 0%, #070912 55%, #000 100%)');
    txt(s, 'chip', 'IS VIDEO KE BAAD — EK KAAM', { left: '0', top: '150px', marginLeft: '700px' }, L('374') - 0.02, null, { opacity: 0, y: -10 }, 0.35);
    txt(s, 'mont sh', 'jis kaam ko — ya jis insaan ko — aap ne', { left: '0', width: W + 'px', top: '280px', textAlign: 'center', fontSize: '52px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('375') - 0.05, null, { opacity: 0, y: 14 }, 0.35);
    const k = txt(s, 'bebas sh', '<span style="position:relative">“KABHI FURSAT MEIN”<span class="k" style="position:absolute;left:-14px;right:-14px;top:46%;height:16px;background:#FF4B4B;transform-origin:0 50%"></span></span>', { left: '0', width: W + 'px', top: '370px', textAlign: 'center', fontSize: '210px', lineHeight: '1' }, L('375', 'kabhi') - 0.05, null, { opacity: 0, scale: 1.2 }, 0.25);
    s.tl.fromTo(k.querySelector('.k'), { scaleX: 0 }, { scaleX: 1, duration: 0.3 }, L('375', 'taal') - 0.1);
    txt(s, 'mont sh', 'keh ke taal rakha hai…', { left: '0', width: W + 'px', top: '610px', textAlign: 'center', fontSize: '52px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('375', 'keh') - 0.05, null, { opacity: 0 }, 0.3);
    slam(s, 'AAJ HI KAR LIJIYE.', L('376') - 0.06, { cls: 'bebas goldgrad', size: 230, y: 720, from: 1.5, amp: 12 });
    s.sfx('slash', L('375', 'taal') - 0.1, { gain: 0.8 }); s.sfx('braam', L('376') - 0.06, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── J6  next video: 286 ÷ 2 = 143 ─────────
  defScene('j6_next', T('377') - 0.05, tEnd, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    txt(s, 'chip', 'AGLI VIDEO', { left: '110px', top: '110px' }, 0.05, null, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'bebas sh', 'WAQT NAHI — <span style="color:#E9B955">TARTEEB</span>', { left: '110px', top: '180px', fontSize: '130px' }, L('377', 'tarteeb') - 0.4, null, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'mono sh', 'SURAH AL-BAQARAH', { left: '114px', top: '380px', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: CYAN }, L('378') - 0.05, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', '286', { left: '104px', top: '410px', fontSize: '330px', lineHeight: '1' }, L('378', '286') - 0.08, null, { opacity: 0, scale: 1.3 }, 0.22);
    txt(s, 'mono sh', 'AYAAT', { left: '500px', top: '640px', fontSize: '34px', fontWeight: 700, letterSpacing: '.4em', color: 'rgba(245,241,232,.75)' }, L('378', 'ayaat') - 0.05, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', '÷ 2', { left: '700px', top: '470px', fontSize: '230px', lineHeight: '1', color: CYAN }, L('379') - 0.05, null, { opacity: 0, scale: 1.3 }, 0.22);
    txt(s, 'bebas sh', '= 143', { left: '1060px', top: '410px', fontSize: '330px', lineHeight: '1', color: GOLD }, L('380') - 0.06, null, { opacity: 0, scale: 1.4 }, 0.22);
    const bar = s.div(null, { position: 'absolute', left: '110px', top: '760px', width: '1700px', height: '40px', borderRadius: '6px', background: `repeating-linear-gradient(90deg, rgba(245,241,232,.75) 0 ${1700 / 286 - 1.5}px, rgba(0,0,0,.6) ${1700 / 286 - 1.5}px ${1700 / 286}px)`, transformOrigin: '0 50%' });
    gsap.set(bar, { autoAlpha: 0 }); s.tl.set(bar, { autoAlpha: 1 }, L('378', '286')).fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.out' }, L('378', '286'));
    const mid = s.div(null, { position: 'absolute', left: (110 + 1700 * 142.5 / 286 - 3) + 'px', top: '736px', width: '6px', height: '88px', background: GOLD, boxShadow: '0 0 18px rgba(233,185,85,.9)' }); show(s, mid, L('380') - 0.06, null, { opacity: 0, scaleY: 0.2 }, 0.25);
    txt(s, 'mont sh', 'Ayat number 143 khol kar dekhiye — us mein ek lafz hai…', { left: '110px', top: '850px', fontSize: '44px', fontWeight: 700, color: 'rgba(245,241,232,.9)' }, L('381') - 0.05, null, { opacity: 0, y: 12 }, 0.4);
    txt(s, 'bebas sh', 'JIS KA MATLAB HAI: <span style="color:#E9B955">“DARMIYAN”</span>', { left: '110px', top: '912px', fontSize: '96px' }, L('382') - 0.05, null, { opacity: 0, y: 12 }, 0.35);
    const sc = s.div('fill', { background: 'rgba(3,5,12,.88)' }); show(s, sc, L('384') - 0.15, null, { opacity: 0 }, 0.35);
    txt(s, 'bebas sh', 'AUR YEH TO SIRF <span style="color:#E9B955">PEHLI PARAT</span> HAI.', { left: '0', width: W + 'px', top: '380px', textAlign: 'center', fontSize: '150px' }, L('384') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    txt(s, 'mono sh', 'SCREEN PAR MULAQAT HOGI', { left: '0', width: W + 'px', top: '600px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em', color: CYAN }, L('385') - 0.05, null, { opacity: 0, letterSpacing: '1.1em' }, 0.5);
    s.sfx('whoosh', 0.05, { gain: 0.6 }); s.sfx('hit', L('378', '286'), { gain: 0.9 }); s.sfx('tick', L('379'), { gain: 0.9 }); s.sfx('impact', L('380'), { gain: 0.9 }); s.sfx('shimmer', L('382'), { gain: 0.8 }); s.sfx('swell', L('384') - 0.2, { dur: 1.6, gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.4 });

  // ───────── J7  end screen (room for YouTube's video + subscribe elements) ─────────
  defScene('j7_end', tEnd - 0.4, film.cues.dur + 0.5, (s) => {
    const d = s.t1 - s.t0;
    footage(s, 'desert1', { n: 450, speed: 1, kb: { s0: 1.04, s1: 1.12 } });
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, rgba(10,16,36,.55) 0%, rgba(4,6,14,.80) 60%, rgba(1,2,5,.92) 100%)' }); dust(s, { n: 90, seed: 31, color: '233,185,85' });
    txt(s, 'bebas goldgrad', 'KITNI DER THEHRE?', { left: '0', width: W + 'px', top: '70px', textAlign: 'center', fontSize: '120px', letterSpacing: '.03em' }, 0.3, null, { opacity: 0, y: -16 }, 0.6);
    const fr = s.div(null, { position: 'absolute', left: '150px', top: '270px', width: '960px', height: '540px', borderRadius: '18px', border: '3px solid rgba(233,185,85,.8)', background: 'rgba(3,6,14,.55)', boxShadow: '0 0 60px rgba(233,185,85,.25)' });
    fr.innerHTML = `<div class="mono" style="position:absolute;left:0;right:0;top:206px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.5em;color:${CYAN}">AGLI VIDEO</div><div class="bebas" style="position:absolute;left:0;right:0;top:254px;text-align:center;font-size:76px;line-height:1.05">QURAN KA CHHUPA HUA NAQSHA</div>`;
    show(s, fr, 0.5, null, { opacity: 0, x: -50 }, 0.6);
    const ci = s.div(null, { position: 'absolute', left: '1320px', top: '350px', width: '340px', height: '340px', borderRadius: '50%', border: '3px solid rgba(233,185,85,.8)', background: 'rgba(3,6,14,.55)', boxShadow: '0 0 60px rgba(233,185,85,.25)' }); show(s, ci, 0.7, null, { opacity: 0, scale: 0.7 }, 0.5);
    txt(s, 'mono sh', 'SUBSCRIBE', { left: '1320px', width: '340px', top: '720px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: GOLD }, 0.9, null, { opacity: 0 }, 0.4);
    txt(s, 'play sh', '“Aapke paas waqt nahi hai. Aap <span style="color:#E9B955">khud</span> waqt hain.”', { left: '0', width: W + 'px', top: '880px', textAlign: 'center', fontSize: '50px', fontStyle: 'italic', color: 'rgba(245,241,232,.9)' }, 1.3, null, { opacity: 0, y: 12 }, 0.6);
    if (CHANNEL) txt(s, 'cinzel gold sh', CHANNEL, { left: '0', width: W + 'px', top: '966px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em' }, 1.6, null, { opacity: 0 }, 0.6);
    s.sfx('shimmer', 0.3, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.4 });
}
