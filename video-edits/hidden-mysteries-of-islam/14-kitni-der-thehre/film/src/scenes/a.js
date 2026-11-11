// PART A — TEASER (spoken lines 0..37) + title sting. All timing comes from cues: L('<line>') / L('<line>', '<word>').
import { defScene, stage3d, T, gsap, el, clamp, lerp, smooth, noise1, W, H } from '../engine.js';
import { cap, big, dateline, stamp, flash, show, svg, shake, words, footage } from '../ui.js';
import { mkL, bg, dust, bokeh, bars, slam, txt, clock, calc, dunes, ruins, blob, pict, coin, coinLights, GOLD, CYAN, RED } from '../lib14.js';
import { Q } from '../quran.js';

const SUNSET = 'linear-gradient(180deg,#140c1c 0%,#4a2218 36%,#c9742f 60%,#f2b862 72%,#34190e 74.5%,#0e0604 100%)';
export const ruinsLayer = (s) => svg(s, `<path d="${dunes(4, 800, 30)}" fill="#3b1d12"/><path d="${ruins(7, 818, 250, { gap: 240 })}" fill="#2a130c" fill-rule="evenodd"/><path d="${dunes(9, 868, 40)}" fill="#1c0d08"/><path d="${ruins(12, 925, 450, { w: 260, gap: 330 })}" fill="#0c0504" fill-rule="evenodd"/><path d="${dunes(15, 985, 46)}" fill="#050202"/>`);
export const sunDisc = (s, x, y, r = 300) => s.div(null, { position: 'absolute', left: (x - r / 2) + 'px', top: (y - r / 2) + 'px', width: r + 'px', height: r + 'px', borderRadius: '50%', background: 'radial-gradient(circle,#fff6d0 0%,#ffd27a 30%,rgba(255,190,90,.35) 55%,rgba(255,190,90,0) 72%)' });
export const caveLayer = (s, seed = 5) => svg(s, `<path d="${dunes(3, 720, 36)}" fill="#8a4420"/><path d="${dunes(6, 800, 30)}" fill="#5a2a14"/><path d="M -100 -100 L 2020 -100 L 2020 1180 L -100 1180 Z ${blob(seed, 1000, 520, 480, 330, 0.2)}" fill="#060302" fill-rule="evenodd"/><path d="${blob(seed, 1000, 520, 480, 330, 0.2)}" fill="none" stroke="rgba(255,190,110,.35)" stroke-width="5"/>`);
const tag = (s, html, t0, t1, col = CYAN, o = {}) => txt(s, 'mono sh', html, { left: '110px', top: '128px', fontSize: '32px', fontWeight: 700, letterSpacing: '.42em', color: col, ...o }, t0, t1, { opacity: 0, x: -24 }, 0.35);

export default function ([P0, P1]) {
  // ───────── A0  letterbox for the whole teaser (retracts when the title sting ends) ─────────
  defScene('a0_cine', 0, P1 + 0.3, (s) => { bars(s, 96, s.t1 - s.t0); }, { z: 50 });

  // ───────── A1  the coin: "300 saal purana" … "kal tak isi bazaar mein chalta tha" ─────────
  defScene('a1_coin', 0, T('3') - 0.06, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tBaz = L('1') - 0.15;
    bg(s, '#010205');
    bokeh(s, { seed: 12, n: 54, alpha: (lt) => 0.9 * smooth(tBaz, tBaz + 1.4, lt) });
    s.div(null, { position: 'absolute', left: '-200px', top: '-420px', width: '900px', height: '1900px', transform: 'rotate(34deg)', transformOrigin: '50% 50%', background: 'linear-gradient(90deg, rgba(255,236,200,0) 0%, rgba(255,236,200,.10) 38%, rgba(255,236,200,.16) 50%, rgba(255,236,200,.10) 62%, rgba(255,236,200,0) 100%)' });
    const st = stage3d(s, { fov: 30 }); const c = coin(); st.scene.add(c); const up = coinLights(st.scene, { a0: -1.9, sp: 0.36, rimI: 13 });
    st.frame = (lt) => {
      up(lt); const k = smooth(tBaz, tBaz + 1.3, lt);
      c.position.set(lerp(-0.95, 0.9, k), 0, 0);
      c.rotation.set(-0.4 + Math.sin(lt * 0.45) * 0.1, lerp(0.5, -0.45, k) + 0.16 * Math.sin(lt * 0.5), 0.06);
      st.camera.position.set(0, 0, 5.7 - lt * 0.09); st.camera.lookAt(0, 0, 0);
    };
    dust(s, { n: 70, seed: 5 });
    const blk = s.div('fill', { background: '#000' }); s.tl.fromTo(blk, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0.05);
    // "300 SAAL PURANA"
    const t3 = L('0', 'TEEN') - 0.06;
    const n300 = slam(s, '300', t3, { x: 960, w: 860, y: 250, size: 420, out: tBaz + 0.25, drift: 0.05, amp: 18 });
    txt(s, 'mono sh', 'SAAL PURANA', { left: '960px', width: '860px', top: '690px', textAlign: 'center', fontSize: '58px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: CYAN }, L('0', 'saal') - 0.05, tBaz + 0.25, { opacity: 0, letterSpacing: '1em' }, 0.45);
    flash(s, t3 + 0.2, { peak: 0.5, dur: 0.3 });
    // "KAL"
    const tK = L('2', 'kal') - 0.06;
    slam(s, 'KAL', tK, { x: 60, w: 900, y: 270, size: 400, color: GOLD, drift: 0.05, amp: 18 });
    txt(s, 'mont sh', '“…tak yehi sikka isi bazaar mein chalta tha”', { left: '60px', width: '900px', top: '700px', textAlign: 'center', fontSize: '40px', fontWeight: 700, lineHeight: '1.3', color: 'rgba(245,241,232,.92)' }, L('2', 'tak') + 0.1, null, { opacity: 0, y: 18 }, 0.5);
    s.sfx('swell', 0, { dur: 2.2, gain: 0.8 }); s.sfx('chime', 0.35, { gain: 0.7 }); s.sfx('heartbeat', 0.9, { gain: 0.8 }); s.sfx('heartbeat', 1.75, { gain: 0.8 });
    s.sfx('braam', Math.max(0, t3 - 0.02), { gain: 0.95 }); s.sfx('whoosh', tBaz, { gain: 0.7 }); s.sfx('hit', tK + 0.18, { gain: 1.0 }); s.sfx('riser', Math.max(tK + 0.4, d - 1.7), { dur: Math.min(1.6, d - tK - 0.5) });
    s.div('vig');
  });

  // ───────── A2  "Woh jhoot nahi bol raha." ─────────
  defScene('a2_truth', T('3') - 0.06, T('4') - 0.05, (s) => {
    bg(s, '#000');
    slam(s, 'WOH <span style="color:#E9B955">JHOOT NAHI</span> BOL RAHA.', 0.03, { cls: 'bebas sh', size: 170, y: 440, from: 1.22, dur: 0.16, drift: 0.05, amp: 10 });
    s.sfx('boom', 0, { gain: 1.0 }); s.sfx('subdrop', 0.02, { gain: 0.9 });
  });

  // ───────── A3  the question: "Kam labithtum?" ─────────
  defScene('a3_q', T('4') - 0.05, T('8') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)');
    dust(s, { n: 60, seed: 21, color: '233,185,85' });
    txt(s, 'cinzel gold sh', 'YEH QISSA QURAN KA HAI', { left: '0', width: W + 'px', top: '176px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.5em' }, L('4'), null, { opacity: 0, y: -16 }, 0.7);
    const gl = s.div(null, { position: 'absolute', left: '360px', top: '250px', width: '1200px', height: '520px', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.30) 0%, rgba(233,185,85,.10) 40%, rgba(233,185,85,0) 70%)' });
    const ar = s.div('ar goldgrad', { position: 'absolute', left: '0', width: W + 'px', top: '236px', textAlign: 'center', fontSize: '320px', lineHeight: '1.7' }, Q.q);
    const tq = L('6') - 0.12; gsap.set([ar, gl], { autoAlpha: 0 });
    s.tl.set([ar, gl], { autoAlpha: 1 }, tq).fromTo(ar, { opacity: 0, scale: 1.22 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' }, tq).to(ar, { scale: 1.06, duration: Math.max(0.3, d - tq - 0.9), ease: 'none' }, tq + 0.9);
    s.tl.fromTo(gl, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.15, duration: 1.6, ease: 'power2.out' }, tq);
    big(s, 'KITNI DER THEHRE?', L('7') - 0.05, null, { cls: 'anton sh', size: 124, y: 822 });
    txt(s, 'mono sh', 'DO LAFZ', { left: '0', width: W + 'px', top: '250px', textAlign: 'center', fontSize: '28px', fontWeight: 700, letterSpacing: '.6em', color: CYAN }, L('5', 'do') - 0.05, tq + 0.2, { opacity: 0 }, 0.3);
    s.sfx('shimmer', tq, { gain: 0.9 }); s.sfx('swell', Math.max(0, tq - 0.9), { dur: 1.0 }); s.sfx('hit', L('7'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── A4  three times — the same answer, word for word ─────────
  defScene('a4_three', T('8') - 0.05, T('10') - 0.05, (s) => {
    const L = mkL(s), t0 = L('8', 'teen') - 0.05, t1 = L('9', 'ek') - 0.05;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #101d3c 0%, #050814 60%, #000 100%)');
    txt(s, 'bebas sh', 'TEEN BAAR', { left: '110px', top: '120px', fontSize: '120px' }, t0, null, { opacity: 0, x: -40 }, 0.4);
    txt(s, 'bebas sh', 'EK HI JAWAB', { right: '110px', top: '120px', fontSize: '120px', color: GOLD }, t1, null, { opacity: 0, x: 40 }, 0.4);
    [['AL-BAQARAH · 2:259', Q['2:259q']], ['AL-KAHF · 18:19', Q.q], ["AL-MU'MINUN · 23:112", Q.q]].forEach(([ref, qa], i) => {
      const y = 262 + i * 196;
      const row = s.div(null, { position: 'absolute', left: '110px', right: '110px', top: y + 'px', height: '180px', borderTop: '1.5px solid rgba(255,255,255,.14)' });
      const n = el('div', 'bebas', { position: 'absolute', left: '0', top: '36px', fontSize: '110px', color: 'rgba(111,216,255,.9)' }, String(i + 1));
      const r = el('div', 'mono', { position: 'absolute', left: '86px', top: '26px', fontSize: '24px', fontWeight: 700, letterSpacing: '.3em', color: CYAN }, ref);
      const q = el('div', 'ar', { position: 'absolute', left: '86px', top: '36px', fontSize: '84px', lineHeight: '1.9', color: '#fff' }, qa);
      const a = el('div', 'ar goldgrad', { position: 'absolute', right: '0', top: '6px', fontSize: '104px', lineHeight: '1.9' }, Q.ans);
      row.append(n, r, q, a);
      s.tl.fromTo([n, r, q], { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.04 }, t0 + 0.12 + i * 0.2);
      s.tl.fromTo(a, { opacity: 0, scale: 1.2, transformOrigin: '100% 50%' }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, t1 + 0.1 + i * 0.26);
      s.sfx('tick', t0 + 0.12 + i * 0.2, { gain: 0.9 }); s.sfx('pop', t1 + 0.1 + i * 0.26, { gain: 0.9 });
    });
    cap(s, '“Ek din… ya <span class="hl">din ka kuch hissa</span>”', t1 + 0.9, s.t1 - s.t0 + 1, { size: 44, bottom: 112 });
    s.div('vig');
  }, { fin: 0.15 });

  // ───────── A5  three slams: 100 saal · 300 saal · ? ─────────
  defScene('a5_one', T('10') - 0.05, T('12') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0; bg(s, SUNSET); sunDisc(s, 1330, 760); const ly = ruinsLayer(s); dust(s, { n: 90, seed: 8, color: '255,210,150' });
    s.tl.fromTo(ly, { scale: 1.03 }, { scale: 1.12, duration: d, ease: 'none', transformOrigin: '60% 80%' }, 0);
    tag(s, 'PEHLI BAAR', 0.02, null, '#fff');
    const t = L('11', 'SAU') - 0.06; slam(s, '100 SAAL', t, { size: 330, y: 300, drift: 0.04, amp: 18 }); stamp(s, 'GHALAT', L('11', 'ghalat') - 0.03, { x: 1160, y: 640, size: 110, rot: -7 });
    flash(s, 0, { peak: 0.7, dur: 0.3 }); s.sfx('hit', 0, { gain: 1.0 }); s.sfx('braam', Math.max(0, t), { gain: 0.9 }); s.sfx('slam', L('11', 'ghalat'), { gain: 0.8 });
    s.div('vig');
  });
  defScene('a5_two', T('12') - 0.05, T('14') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0; bg(s, 'linear-gradient(180deg,#f9e7b8 0%,#f0b866 44%,#b5622c 100%)'); const ly = caveLayer(s); dust(s, { n: 80, seed: 2 });
    s.tl.fromTo(ly, { scale: 1.0 }, { scale: 1.1, duration: d, ease: 'none' }, 0);
    tag(s, 'DOOSRI BAAR', 0.02, null, '#fff');
    const t = L('13', 'TEEN') - 0.06; slam(s, '300 SAAL', t, { size: 330, y: 330, drift: 0.04, amp: 18 }); stamp(s, 'GHALAT', t + 0.75, { x: 1160, y: 680, size: 110, rot: -7 });
    flash(s, 0, { peak: 0.7, dur: 0.3 }); s.sfx('hit', 0, { gain: 1.0 }); s.sfx('braam', Math.max(0, t), { gain: 0.95 }); s.sfx('slam', t + 0.75, { gain: 0.8 });
    s.div('vig');
  });
  defScene('a5_three', T('14') - 0.05, T('16') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0; bg(s, 'radial-gradient(ellipse at 50% 46%, #ffffff 0%, #f1ece0 55%, #cfc8b6 100%)');
    txt(s, 'mono', 'TEESRI BAAR', { left: '110px', top: '128px', fontSize: '32px', fontWeight: 700, letterSpacing: '.42em', color: '#1b2238' }, 0.02, null, { opacity: 0, x: -24 }, 0.35);
    const q = s.div('anton', { position: 'absolute', left: '0', width: W + 'px', top: '150px', textAlign: 'center', fontSize: '560px', lineHeight: '1', color: '#10162a' }, '?');
    s.tl.fromTo(q, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, 0.05).to(q, { scale: 1.08, duration: d, ease: 'none' }, 0.25);
    txt(s, 'mont', 'Yeh sawal abhi <b>poocha jana baqi hai</b>', { left: '0', width: W + 'px', top: '800px', textAlign: 'center', fontSize: '56px', fontWeight: 600, color: '#10162a' }, L('15') - 0.05, null, { opacity: 0, y: 20 }, 0.45);
    flash(s, 0, { peak: 1, dur: 0.4 }); s.sfx('boom', 0, { gain: 0.9 }); s.sfx('subdrop', 0.3, { gain: 0.8 });
  });
  defScene('a5_you', T('16') - 0.05, T('19') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0; bg(s, '#000');
    txt(s, 'mont sh', 'Us din jawab dene walon mein…', { left: '0', width: W + 'px', top: '300px', textAlign: 'center', fontSize: '54px', fontWeight: 600, color: 'rgba(245,241,232,.78)' }, L('16') - 0.02, null, { opacity: 0, y: 16 }, 0.5);
    const t = L('17') - 0.04; slam(s, 'AAP BHI', t, { size: 300, y: 400, from: 1.6, drift: 0.05, shake: false });
    txt(s, 'bebas sh', 'AUR MAIN BHI.', { left: '0', width: W + 'px', top: '760px', textAlign: 'center', fontSize: '110px', color: GOLD, letterSpacing: '.06em' }, L('18') - 0.04, null, { opacity: 0, y: 14 }, 0.5);
    s.sfx('heartbeat', Math.max(0, t - 0.5), { gain: 1.0 }); s.sfx('subdrop', t + 0.05, { gain: 1.0 }); s.sfx('heartbeat', L('18') + 0.5, { gain: 0.9 });
  });

  // ───────── A6  "Saal 2010. America. Colorado ki ek laboratory." two clocks, one foot apart ─────────
  defScene('a6_2010', T('19') - 0.05, T('26') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t22 = L('22') - 0.1, t23 = L('23'), t24 = L('24') - 0.04, t25 = L('25') - 0.1;
    bg(s, 'radial-gradient(ellipse at 62% 50%, #0d2140 0%, #060c1c 55%, #010308 100%)');
    s.div('fill', { backgroundImage: 'linear-gradient(rgba(111,216,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(111,216,255,.07) 1px, transparent 1px)', backgroundSize: '80px 80px', opacity: '0.8' });
    const bigY = slam(s, '2010', L('19'), { cls: 'bebas', size: 520, y: 238, from: 1.6, dur: 0.16, out: t22, drift: 0.06, amp: 16, style: { textShadow: '0 0 60px rgba(160,200,255,.35)', letterSpacing: '.04em' } });
    txt(s, 'mono cyan', 'AMERICA', { left: '0', width: W + 'px', top: '742px', textAlign: 'center', fontSize: '60px', fontWeight: 700, letterSpacing: '.9em', paddingLeft: '.9em' }, L('20'), L('21') - 0.05, { opacity: 0, letterSpacing: '1.6em' }, 0.4);
    txt(s, 'mono cyan', 'BOULDER · COLORADO', { left: '0', width: W + 'px', top: '742px', textAlign: 'center', fontSize: '60px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em' }, L('21'), t22, { opacity: 0, letterSpacing: '1em' }, 0.4);
    flash(s, L('19'), { peak: 0.6, dur: 0.35 }); s.sfx('braam', Math.max(0, L('19') - 0.03), { gain: 1.0 }); s.sfx('hit', L('20'), { gain: 0.8 }); s.sfx('type', L('21'), { dur: 0.7 });
    dateline(s, '2010', 'NIST · BOULDER, COLORADO', t22, t25, { style: { top: '120px' } });
    // the two clocks
    const grp = s.div(null, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
    const cA = clock({ div: (c, st, h) => grp.appendChild(el('div', c, st, h)) }, { x: 1250, y: 330, r: 168, color: '#F5F1E8', sweep: true });
    const cB = clock({ div: (c, st, h) => grp.appendChild(el('div', c, st, h)) }, { x: 1250, y: 762, r: 168, color: '#F5F1E8', sweep: true });
    const rul = el('div', null, { position: 'absolute', left: '1500px', top: '330px', width: '120px', height: '432px', borderLeft: '3px solid ' + CYAN, borderTop: '3px solid ' + CYAN, borderBottom: '3px solid ' + CYAN, borderRadius: '2px', transform: 'scaleX(-1)' });
    const rl = el('div', 'mono cyan', { position: 'absolute', left: '1560px', top: '506px', fontSize: '44px', fontWeight: 700, letterSpacing: '.1em', lineHeight: '1.2' }, '1 FOOT<br><span style="font-size:26px;opacity:.75">33 cm</span>');
    grp.append(rul, rl); show(s, grp, t22, null, { opacity: 0, x: 60 }, 0.6);
    const dlt = txt(s, 'anton', 'ALAG', { left: '760px', top: '470px', width: '330px', textAlign: 'center', fontSize: '150px', color: RED, textShadow: '0 0 30px rgba(255,75,75,.5)' }, t24, t25 + 0.2, { opacity: 0, scale: 1.8 }, 0.2);
    txt(s, 'mont', 'farq bada kar ke dikhaya gaya hai', { left: '1010px', top: '942px', width: '480px', textAlign: 'center', fontSize: '22px', fontWeight: 600, letterSpacing: '.08em', color: 'rgba(245,241,232,.5)' }, t23, null, { opacity: 0 }, 0.4);
    s.onUpdate((lt) => { const base = 36612 + lt; cB.set(base); cA.set(base + Math.max(0, lt - t23 + 0.6) * 2.4); });
    s.sfx('clock', t22, { dur: Math.max(1, d - t22), gain: 0.9 }); s.sfx('hit', t24 + 0.18, { gain: 1.0 }); s.sfx('whoosh', t22, { gain: 0.6 });
    // "aapke sar aur aapke pairon ke liye bhi"
    const man = s.div(null, { position: 'absolute', left: '250px', top: '236px' }, pict('person', 620, 'rgba(245,241,232,.92)'));
    show(s, man, t25, null, { opacity: 0, y: 30 }, 0.5);
    const hd = txt(s, 'bebas', 'SAR', { left: '690px', top: '250px', fontSize: '110px', color: CYAN }, L('25', 'sar') - 0.05, null, { opacity: 0, x: -20 }, 0.3);
    const ft = txt(s, 'bebas', 'PAIR', { left: '690px', top: '740px', fontSize: '110px', color: CYAN }, L('25', 'pairon') - 0.05, null, { opacity: 0, x: -20 }, 0.3);
    s.sfx('pop', L('25', 'sar'), { gain: 0.9 }); s.sfx('pop', L('25', 'pairon'), { gain: 0.9 });
    cap(s, 'Waqt sab ke liye <span class="hr">ek raftaar se nahi chalta</span>', L('25', 'ek') - 0.1, d + 1, { size: 46, bottom: 104 });
    s.div('vig');
  });

  // ───────── A7  three promises ─────────
  defScene('a7_p1', T('26') - 0.05, T('28') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0; bg(s, 'radial-gradient(ellipse at 34% 50%, #0b2038 0%, #050a16 58%, #000 100%)');
    tag(s, 'AAJ · 1', 0.02, null);
    const hand = s.div(null, { position: 'absolute', left: '300px', top: '230px' }, pict('hand', 600, 'rgba(245,241,232,.9)'));
    s.tl.fromTo(hand, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, 0.05);
    const cv = el('canvas', 'gl'); cv.width = W; cv.height = H; s.add(cv); const x = cv.getContext('2d');
    s.onUpdate((lt) => { x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const p = ((lt * 0.95 + i * 0.27) % 1), ox = 520 + i * 60, a = Math.sin(p * Math.PI); x.strokeStyle = `rgba(111,216,255,${(0.9 * a).toFixed(3)})`; x.lineWidth = 5;
        x.beginPath(); x.moveTo(ox + 420 - p * 900, -60 + p * 1250); x.lineTo(ox + 420 - (p + 0.1) * 900, -60 + (p + 0.1) * 1250); x.stroke(); } });
    txt(s, 'bebas sh', 'HAR SECOND', { left: '1010px', top: '330px', fontSize: '190px' }, L('27', 'har') - 0.05, null, { opacity: 0, x: 40 }, 0.35);
    txt(s, 'mont sh', 'aapki hatheli se ek zarra guzarta hai —<br><span style="color:#FF4B4B">jise raaste mein hi mar jana chahiye tha</span>', { left: '1014px', top: '540px', width: '800px', fontSize: '42px', fontWeight: 700, lineHeight: '1.3' }, L('27', 'hatheli') - 0.05, null, { opacity: 0, y: 18 }, 0.4);
    flash(s, 0, { peak: 0.5, dur: 0.25 }); s.sfx('hit', 0, { gain: 0.9 }); s.sfx('whoosh', L('27', 'guzarta'), { gain: 0.6 }); s.div('vig');
  });
  defScene('a7_p2', T('28') - 0.05, T('30') - 0.05, (s) => {
    const L = mkL(s); bg(s, 'radial-gradient(ellipse at 66% 50%, #1a1630 0%, #080714 58%, #000 100%)');
    tag(s, 'AAJ · 2', 0.02, null);
    const p = calc(s, { x: 1130, y: 90, scale: 0.86 }); const t = L('28', 'teen') - 0.05; let e = p.type(t, '300', 0.12); p.at(L('29', 'nau') - 0.25, '300', '300 +', '+'); p.type(L('29', 'nau') - 0.08, '9', 0.1, '', '300 +');
    txt(s, 'mono sh', 'SURAH AL-KAHF · 18:25', { left: '110px', top: '290px', fontSize: '30px', fontWeight: 700, letterSpacing: '.34em', color: GOLD }, 0.1, null, { opacity: 0 }, 0.4);
    txt(s, 'bebas sh', '“TEEN SAU…', { left: '110px', top: '350px', fontSize: '200px' }, t, null, { opacity: 0, x: -40 }, 0.35);
    txt(s, 'bebas sh', 'AUR NAU”', { left: '110px', top: '540px', fontSize: '200px', color: GOLD }, L('29', 'aur') - 0.05, null, { opacity: 0, x: -40 }, 0.35);
    txt(s, 'mont sh', 'jo aap khud calculator par nikalenge', { left: '114px', top: '770px', fontSize: '42px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('29', 'khud') - 0.05, null, { opacity: 0, y: 16 }, 0.4);
    flash(s, 0, { peak: 0.5, dur: 0.25 }); s.sfx('hit', 0, { gain: 0.9 }); [0, 0.12, 0.24].forEach((o) => s.sfx('tick', t + o, { gain: 0.8 })); s.sfx('tick', L('29', 'nau') - 0.08, { gain: 0.9 }); s.div('vig');
  });
  defScene('a7_p3', T('30') - 0.05, T('32') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0; bg(s, 'radial-gradient(ellipse at 50% 50%, #1c1226 0%, #0a0612 58%, #000 100%)');
    tag(s, 'AAJ · 3', 0.02, null);
    const a = s.div('anton sh', { position: 'absolute', left: '0', width: W + 'px', top: '330px', textAlign: 'center', fontSize: '340px', lineHeight: '1' }, '10 SAAL');
    const b = s.div('anton sh', { position: 'absolute', left: '0', width: W + 'px', top: '330px', textAlign: 'center', fontSize: '340px', lineHeight: '1', color: GOLD }, '10 MAHINE');
    const t1 = L('30', 'das') - 0.05, t2 = L('31', 'das') - 0.05; gsap.set([a, b], { autoAlpha: 0 });
    s.tl.set(a, { autoAlpha: 1 }, t1).fromTo(a, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, t1).to(a, { scaleX: 0.08, opacity: 0, duration: 0.28, ease: 'power3.in' }, t2 - 0.28).set(a, { autoAlpha: 0 }, t2);
    s.tl.set(b, { autoAlpha: 1 }, t2).fromTo(b, { scaleX: 0.08, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.3, ease: 'power3.out' }, t2);
    txt(s, 'mont sh', 'pichhle das saal… das mahinon mein kyun guzar gaye', { left: '0', width: W + 'px', top: '760px', textAlign: 'center', fontSize: '44px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, t2 + 0.3, null, { opacity: 0, y: 16 }, 0.4);
    flash(s, 0, { peak: 0.5, dur: 0.25 }); s.sfx('hit', 0, { gain: 0.9 }); s.sfx('whooshRev', Math.max(0, t2 - 0.45), { gain: 0.8 }); s.sfx('hit', t2 + 0.05, { gain: 0.9 }); s.div('vig');
  });

  // ───────── A8  the bet + the unlabelled counter ─────────
  defScene('a8_bet', T('32') - 0.05, T('37e') + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t33 = L('33') - 0.05, t34 = L('34') - 0.05, t35 = L('35') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #141a30 0%, #070912 55%, #000 100%)');
    const h = slam(s, 'EK SHART', L('32', 'ek') - 0.06, { size: 250, y: 380, color: GOLD, from: 1.7, amp: 14, out: t33 + 0.05 });
    s.sfx('braam', Math.max(0, L('32', 'ek') - 0.08), { gain: 0.9 });
    // "ghadi mat dekhiye"
    const ck = clock(s, { x: 960, y: 470, r: 230, sweep: false }); s.onUpdate((lt) => ck.set(36612 + lt));
    show(s, ck, t33, t34, { opacity: 0, scale: 0.8 }, 0.4);
    const no = svg(s, `<circle cx="960" cy="470" r="290" fill="none" stroke="${RED}" stroke-width="26"/><path class="sl" d="M 760 270 L 1160 670" stroke="${RED}" stroke-width="26" stroke-linecap="round"/>`);
    gsap.set(no, { autoAlpha: 0 }); const tn = L('33', 'mat') - 0.06;
    s.tl.set(no, { autoAlpha: 1 }, tn).fromTo(no, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, tn).to(no, { opacity: 0, duration: 0.25 }, t34 - 0.25).set(no, { autoAlpha: 0 }, t34);
    cap(s, 'Is video ke dauran <span class="hr">ghadi mat dekhiye</span>', t33 + 0.1, t34, { size: 50, bottom: 150 });
    s.sfx('clock', t33, { dur: Math.max(0.6, t34 - t33), gain: 1.0 }); s.sfx('buzz', tn + 0.15, { gain: 0.8 });
    // "aakhir mein ek seedha sa sawal … aapka jawab ghalat hoga"
    txt(s, 'mont sh', 'Aakhir mein — ek seedha sa sawal', { left: '0', width: W + 'px', top: '330px', textAlign: 'center', fontSize: '60px', fontWeight: 700 }, t34, t35, { opacity: 0, y: 18 }, 0.45);
    const tw = L('34', 'aapka') - 0.06; slam(s, 'AAPKA JAWAB <span style="color:#FF4B4B">GHALAT</span> HOGA', tw, { cls: 'bebas sh', size: 170, y: 450, from: 1.3, out: t35, amp: 10 });
    s.sfx('hit', tw + 0.18, { gain: 1.0 });
    // "aur kone mein jo ginti chal rahi hai?"
    txt(s, 'bebas sh', 'AUR YEH GINTI?', { left: '330px', top: '660px', fontSize: '130px' }, t35 + 0.1, null, { opacity: 0, x: 30 }, 0.4);
    txt(s, 'bebas sh', 'GHADI NAHI.', { left: '330px', top: '430px', fontSize: '130px', color: RED }, L('36') - 0.05, null, { opacity: 0, x: 30 }, 0.3);
    txt(s, 'bebas sh', 'KYA HAI? — AAKHIR MEIN.', { left: '330px', top: '250px', fontSize: '130px', color: GOLD }, L('37') - 0.05, null, { opacity: 0, x: 30 }, 0.3);
    s.sfx('pop', t35 + 0.1, { gain: 0.9 }); s.sfx('tick', L('36'), { gain: 1.0 }); s.sfx('shimmer', L('37'), { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.15 });
  // pointer to the counter (must sit above the letterbox bars)
  defScene('a8_ptr', T('35') - 0.1, T('37e') + 0.3, (s) => {
    const p = svg(s, `<path class="ln" d="M 300 760 Q 150 880 128 990" fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/><path class="hd" d="M 108 962 L 128 996 L 152 966" fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect class="bx" x="40" y="994" width="178" height="62" rx="12" fill="none" stroke="${GOLD}" stroke-width="4"/>`);
    s.tl.fromTo(p.querySelector('.ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.out' }, 0.25).fromTo(p.querySelector('.hd'), { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.7);
    const bx = p.querySelector('.bx'); s.tl.fromTo(bx, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.75);
    s.onUpdate((lt) => { if (lt > 0.95) bx.setAttribute('stroke-opacity', (0.55 + 0.45 * Math.sin(lt * 7)).toFixed(2)); });
  }, { z: 95, fout: 0.25 });

  // ───────── A9  title sting ─────────
  defScene('a9_title', T('37e') + 0.3, P1 + 0.3, (s) => {
    const d = s.t1 - s.t0;
    footage(s, 'desert1', { n: 450, start: 120, speed: 1, kb: { s0: 1.06, s1: 1.14 } });
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 48%, rgba(10,16,36,.50) 0%, rgba(4,6,14,.78) 60%, rgba(1,2,5,.92) 100%)' });
    dust(s, { n: 90, seed: 31, color: '233,185,85' });
    const ar = s.div('ar', { position: 'absolute', left: '0', width: W + 'px', top: '120px', textAlign: 'center', fontSize: '470px', lineHeight: '1.7', color: 'rgba(233,185,85,.13)' }, Q.q);
    s.tl.fromTo(ar, { scale: 1.0 }, { scale: 1.1, duration: d, ease: 'none' }, 0);
    const t = s.div('bebas goldgrad', { position: 'absolute', left: '0', width: W + 'px', top: '392px', textAlign: 'center', fontSize: '250px', lineHeight: '1', letterSpacing: '.03em' }, 'KITNI DER THEHRE?');
    s.tl.fromTo(t, { scale: 1.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'power4.in' }, 0.12).to(t, { scale: 1.05, duration: d - 0.34, ease: 'none' }, 0.34);
    const ln = s.div(null, { position: 'absolute', left: '560px', top: '690px', width: '800px', height: '3px', background: 'linear-gradient(90deg,rgba(233,185,85,0),#E9B955,rgba(233,185,85,0))' });
    s.tl.fromTo(ln, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, 0.4);
    txt(s, 'mono', 'WAQT KA RAAZ', { left: '0', width: W + 'px', top: '724px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.9em', paddingLeft: '.9em', color: CYAN }, 0.6, null, { opacity: 0, letterSpacing: '1.5em' }, 0.7);
    flash(s, 0.3, { peak: 0.8, dur: 0.5 }); shake(s, t, 0.34, 0.5, 16);
    s.sfx('boom', 0.14, { gain: 1.1 }); s.sfx('braam', 0.16, { gain: 1.0 }); s.sfx('shimmer', 0.7, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.12, fout: 0.3 });
}
