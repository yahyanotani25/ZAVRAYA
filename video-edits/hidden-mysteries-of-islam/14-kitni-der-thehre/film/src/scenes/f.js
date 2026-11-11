// PART F — why 300 years felt like "a day": the brain builds time out of memories; the hadith of shrinking time (lines 206..257)
import { defScene, T, gsap, el, clamp, lerp, smooth, rng, W, H, film } from '../engine.js';
import { cap, flash, show, svg, shake, stamp } from '../ui.js';
import { mkL, bg, dust, slam, txt, clock, pict, GOLD, CYAN, RED } from '../lib14.js';
import { AR } from '../quran.js';
import { lids } from './b.js';

const inner = (g) => ({ div: (c, st, h) => g.appendChild(el('div', c, st, h)) });
const TILE = ['#E9B955', '#6FD8FF', '#57E39A', '#FF8A5B', '#C58BFF', '#FF6B9A', '#8FE3D0', '#F5E08A'];

export default function ([P0, P1]) {
  // ───────── F1  "300 saal guzar gaye — aur unhein laga: ek din. Kyun?" ─────────
  defScene('f1_why', P0, T('209') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #17142c 0%, #080712 58%, #000 100%)');
    txt(s, 'mont sh', 'Lekin asal sawal to reh gaya.', { left: '0', width: W + 'px', top: '160px', textAlign: 'center', fontSize: '54px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('206') - 0.02, null, { opacity: 0, y: 16 }, 0.4);
    txt(s, 'bebas sh', '300 SAAL', { left: '170px', top: '340px', fontSize: '230px', lineHeight: '1' }, L('207') - 0.05, null, { opacity: 0, x: -40 }, 0.35);
    const ar = svg(s, `<path d="M 900 450 L 1050 450" stroke="${GOLD}" stroke-width="10" stroke-linecap="round"/><path d="M 1020 420 L 1054 450 L 1020 480" fill="none" stroke="${GOLD}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`); show(s, ar, L('207', 'laga') - 0.1, null, { opacity: 0, x: -20 }, 0.3);
    txt(s, 'bebas sh', '“EK DIN”', { left: '1100px', top: '340px', fontSize: '230px', lineHeight: '1', color: GOLD }, L('208') - 0.05, null, { opacity: 0, x: 40 }, 0.35);
    const k = slam(s, 'KYUN?', L('208', 'kyun') - 0.06, { size: 300, y: 620, color: CYAN, from: 1.6, amp: 14, style: { textShadow: '0 0 40px rgba(111,216,255,.5)' } });
    s.sfx('hit', L('207'), { gain: 0.8 }); s.sfx('hit', L('208'), { gain: 0.8 }); s.sfx('braam', L('208', 'kyun') - 0.06, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── F2  the operating table: four hours of anaesthesia — one moment ─────────
  defScene('f2_surgery', T('209') - 0.05, T('215') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tC = L('212') - 0.1, tO = L('213') - 0.15;
    bg(s, 'radial-gradient(ellipse at 50% 30%, #1d4a4c 0%, #0c2224 50%, #030809 100%)');
    // surgical lamp seen from below
    const lamp = s.div(null, { position: 'absolute', left: '560px', top: '-60px', width: '800px', height: '800px' });
    lamp.innerHTML = `<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(220,255,250,.55) 0%,rgba(160,230,220,.18) 45%,rgba(160,230,220,0) 70%)"></div><div style="position:absolute;left:150px;top:150px;width:500px;height:500px;border-radius:50%;background:#16302f;border:8px solid #2f5957"></div>` +
      [[400, 400, 150], ...[0, 1, 2, 3, 4, 5].map((i) => [400 + Math.cos(i * 1.047) * 165, 400 + Math.sin(i * 1.047) * 165, 96])].map(([x, y, r]) => `<div style="position:absolute;left:${x - r / 2}px;top:${y - r / 2}px;width:${r}px;height:${r}px;border-radius:50%;background:radial-gradient(circle,#fff 0%,#e6fffb 45%,#9fe6dc 100%);box-shadow:0 0 60px rgba(200,255,248,.9)"></div>`).join('');
    s.onUpdate((lt) => { lamp.style.transform = `translate(${(Math.sin(lt * 0.7) * 10).toFixed(1)}px, ${(Math.cos(lt * 0.5) * 6).toFixed(1)}px) scale(${(1 + 0.03 * Math.sin(lt * 0.4)).toFixed(4)})`; });
    const ck = clock(s, { x: 1600, y: 300, r: 130, color: '#E6FFFB', sweep: false }); s.onUpdate((lt) => ck.set((lt < tO ? 9 : 13) * 3600 + 120 + (lt < tO ? lt : lt - tO)));
    txt(s, 'mono sh', 'DEEWAR KI GHADI', { left: '1470px', top: '450px', width: '260px', textAlign: 'center', fontSize: '22px', fontWeight: 700, letterSpacing: '.24em', color: 'rgba(230,255,251,.75)' }, 0.1, null, { opacity: 0 }, 0.4);
    txt(s, 'bebas sh', 'OPERATION', { left: '110px', top: '600px', fontSize: '150px' }, L('209', 'operation') - 0.05, L('210') - 0.05, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'bebas sh', 'BEHOSHI · 4 GHANTE', { left: '110px', top: '600px', fontSize: '150px' }, L('210') - 0.05, tC, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'bebas sh', '= EK PAL', { left: '110px', top: '760px', fontSize: '150px', color: GOLD }, L('211') - 0.05, tC, { opacity: 0, x: -30 }, 0.3);
    const cl = lids(s); s.onUpdate((lt) => cl(smooth(tC, tC + 0.35, lt) * (1 - smooth(tO, tO + 0.5, lt))));
    txt(s, 'mono sh', 'AANKH BAND HUI', { left: '0', width: W + 'px', top: '500px', textAlign: 'center', fontSize: '54px', fontWeight: 700, letterSpacing: '.6em', paddingLeft: '.6em', zIndex: 40 }, tC + 0.25, tO, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', 'AANKH KHULI', { left: '110px', top: '600px', fontSize: '150px' }, tO + 0.3, L('214') - 0.05, { opacity: 0, x: -30 }, 0.3);
    txt(s, 'mono sh', '+ 4 GHANTE', { left: '1470px', top: '120px', width: '260px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.14em', color: GOLD }, tO + 0.5, null, { opacity: 0, y: 10 }, 0.3);
    txt(s, 'bebas sh', 'BEECH MEIN —', { left: '110px', top: '600px', fontSize: '150px' }, L('214') - 0.05, null, { opacity: 0, x: -30 }, 0.3);
    slam(s, 'KUCH NAHI.', L('214', 'kuch') - 0.06, { size: 190, x: 110, w: 900, y: 750, align: 'left', color: RED, from: 1.4, amp: 10 });
    s.sfx('heartbeat', 0.3, { gain: 0.6 }); s.sfx('heartbeat', 1.3, { gain: 0.6 }); s.sfx('subdrop', tC, { gain: 0.9 }); s.sfx('whoosh', tO, { gain: 0.6 }); s.sfx('ding', tO + 0.5, { gain: 0.6 }); s.sfx('hit', L('214', 'kuch') + 0.14, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── F3  an eye for light, an ear for sound — nothing for time. The brain BUILDS time, out of memories ─────────
  defScene('f3_sense', T('215') - 0.05, T('223') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tB = L('220') - 0.4;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #14203f 0%, #070b18 55%, #010205 100%)');
    const cols = [[L('215', 'roshni') - 0.05, 'ROSHNI', pict('eye', 230, '#F5F1E8'), 'AANKH', GOLD], [L('216') - 0.05, 'AWAAZ', pict('ear', 230, '#F5F1E8'), 'KAAN', GOLD], [L('217') - 0.05, 'WAQT', '<div class="bebas" style="font-size:230px;line-height:1;color:#FF4B4B;width:230px;text-align:center">?</div>', 'KOI HISSA NAHI', RED]];
    const G = cols.map(([t, a, ic, b, c], i) => { const g = s.div('panel', { left: (170 + i * 540) + 'px', top: '190px', width: '500px', height: '640px' });
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '0', right: '0', top: '44px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: CYAN }, a));
      g.appendChild(el('div', null, { position: 'absolute', left: '135px', top: '150px' }, ic));
      const nm = el('div', 'bebas', { position: 'absolute', left: '0', right: '0', top: '450px', textAlign: 'center', fontSize: i === 2 ? '92px' : '130px', lineHeight: '1', color: c, paddingTop: i === 2 ? '18px' : '0' }, b); g.appendChild(nm);
      show(s, g, t, tB, { opacity: 0, y: 40 }, 0.4); if (i === 2) { gsap.set(nm, { autoAlpha: 0 }); s.tl.set(nm, { autoAlpha: 1 }, L('218') - 0.05).fromTo(nm, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, L('218') - 0.05); }
      s.sfx('pop', t, { gain: 0.8 }); return g; });
    s.sfx('buzz', L('218'), { gain: 0.8 });
    // the brain builds time
    txt(s, 'bebas sh', 'DIMAGH WAQT KO…', { left: '0', width: W + 'px', top: '130px', textAlign: 'center', fontSize: '130px' }, tB + 0.05, null, { opacity: 0, y: 16 }, 0.35);
    slam(s, '<span style="color:#E9B955">BANATA</span> HAI', L('220', 'BANATA') - 0.06, { cls: 'bebas sh', size: 250, y: 256, from: 1.4, amp: 12 });
    txt(s, 'mono sh', 'YAADON SE', { left: '0', width: W + 'px', top: '500px', textAlign: 'center', fontSize: '54px', fontWeight: 700, letterSpacing: '.8em', paddingLeft: '.8em', color: CYAN }, L('221') - 0.05, null, { opacity: 0, letterSpacing: '1.4em' }, 0.5);
    // memory tiles: many new memories = a long stretch; few = a short one
    const row = (y, n, lab, t) => { const g = s.div(null, { position: 'absolute', left: '260px', top: y + 'px', width: '1400px', height: '110px' });
      for (let i = 0; i < n; i++) { const tl = el('div', null, { position: 'absolute', left: (i * 74) + 'px', top: '0', width: '64px', height: '84px', borderRadius: '8px', background: TILE[i % TILE.length], opacity: '0.92' }); g.appendChild(tl); s.tl.fromTo(tl, { opacity: 0, y: -30 }, { opacity: 0.92, y: 0, duration: 0.25, ease: 'power2.out' }, t + i * 0.035); }
      g.appendChild(el('div', 'mono', { position: 'absolute', left: (n * 74 + 22) + 'px', top: '22px', fontSize: '28px', fontWeight: 700, letterSpacing: '.2em', color: 'rgba(245,241,232,.85)', whiteSpace: 'nowrap' }, lab)); show(s, g, t, null, { opacity: 0 }, 0.2); };
    row(650, 14, 'LAMBA WAQT', L('222') - 0.05); row(790, 3, 'CHHOTA WAQT', L('222', 'utna') - 0.05);
    s.sfx('braam', L('220', 'BANATA') - 0.06, { gain: 0.9 }); s.sfx('shimmer', L('221'), { gain: 0.7 }); s.sfx('type', L('222'), { dur: 0.5, gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── F4  childhood: everything new, the brain records it all — now: the same road, the same work, the same phone ─────────
  defScene('f4_reel', T('223') - 0.05, T('237') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tN = L('227') - 0.1, tR = L('234') - 0.1, R = rng(11);
    bg(s, 'radial-gradient(ellipse at 50% 50%, #1b1730 0%, #090712 58%, #000 100%)');
    const kid = ['PEHLA<br>SCHOOL', 'PEHLI<br>CYCLE', 'PEHLI<br>EID', 'PEHLI<br>BARISH', 'PEHLA<br>DOST', 'PEHLI<br>KITAAB', 'PEHLA<br>SAFAR', 'PEHLI<br>PATANG', 'PEHLA<br>ROZA', 'PEHLA<br>INAAM'], now = ['WOHI<br>RAASTA', 'WOHI<br>KAAM', 'WOHI<br>PHONE'];
    const strip = s.div(null, { position: 'absolute', left: '0', top: '360px', width: '12000px', height: '360px' }); const FW = 420;
    strip.appendChild(el('div', null, { position: 'absolute', left: '0', top: '0', width: '12000px', height: '360px', background: '#0b0c12', borderTop: '3px solid rgba(255,255,255,.2)', borderBottom: '3px solid rgba(255,255,255,.2)' }));
    for (let i = 0; i < 28; i++) { const k = i < 10, f = el('div', null, { position: 'absolute', left: (40 + i * FW) + 'px', top: '48px', width: (FW - 40) + 'px', height: '264px', borderRadius: '12px', background: k ? TILE[i % TILE.length] : '#3a3d47', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' });
      f.innerHTML = `<div class="bebas" style="font-size:76px;line-height:.95;color:${k ? '#10131c' : 'rgba(255,255,255,.55)'}">${k ? kid[i] : now[(i - 10) % 3]}</div>`; strip.appendChild(f);
      for (const yy of [12, 326]) strip.appendChild(el('div', null, { position: 'absolute', left: (40 + i * FW + 20) + 'px', top: yy + 'px', width: (FW - 80) + 'px', height: '22px', background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.55) 0 26px, transparent 26px 52px)' })); }
    // position of the strip: slow while everything is new, a blur once nothing is
    const X = (lt) => { const a = Math.min(lt, tN) * 250; const b = lt > tN ? (lt - tN) * 250 + Math.pow(Math.max(0, lt - tN - 0.6), 2) * 460 : 0; return 700 - a - b; };
    s.onUpdate((lt) => { const x = X(lt); strip.style.transform = `translateX(${Math.max(-10100, x).toFixed(1)}px)`; strip.style.opacity = lt > tR - 0.2 ? Math.max(0, 1 - (lt - tR + 0.2) / 0.4).toFixed(3) : '1'; });
    const rec = txt(s, 'mono sh', '<span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#FF4B4B;margin-right:16px;vertical-align:-2px"></span>DIMAGH LIKH RAHA HAI', { left: '110px', top: '260px', fontSize: '34px', fontWeight: 700, letterSpacing: '.3em', color: RED }, L('225') - 0.05, L('231') - 0.05, { opacity: 0 }, 0.3);
    s.onUpdate((lt) => { rec.firstChild.style.opacity = (Math.floor(lt * 2) % 2) ? '1' : '0.25'; });
    txt(s, 'mono sh', '<span style="display:inline-block;width:10px;height:26px;background:rgba(245,241,232,.6);margin-right:8px;vertical-align:-2px"></span><span style="display:inline-block;width:10px;height:26px;background:rgba(245,241,232,.6);margin-right:16px;vertical-align:-2px"></span>LIKHNA BAND', { left: '110px', top: '260px', fontSize: '34px', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(245,241,232,.6)' }, L('232', 'likhna') - 0.05, tR, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', 'BACHPAN', { left: '110px', top: '110px', fontSize: '130px' }, L('223') - 0.05, tN, { opacity: 0, x: -30 }, 0.35);
    txt(s, 'mont sh', 'har cheez <span style="color:#E9B955">pehli baar</span> ho rahi thi', { left: '520px', top: '152px', fontSize: '50px', fontWeight: 700 }, L('224') - 0.05, tN, { opacity: 0 }, 0.35);
    cap(s, 'Is liye garmiyon ki chhuttiyan <span class="hl">khatam hi nahi hoti thin</span>', L('226') - 0.05, tN, { size: 48, bottom: 180 });
    txt(s, 'bebas sh', 'AUR AB?', { left: '110px', top: '110px', fontSize: '130px', color: CYAN }, tN + 0.05, tR, { opacity: 0, x: -30 }, 0.3);
    cap(s, '“Yeh sab <span class="hr">dekha hua hai</span>”', L('232') - 0.05, tR, { size: 52, bottom: 180 });
    // "Ramzan aata hai… aur chala jata hai"
    const moon = s.div(null, { position: 'absolute', left: '0', top: '330px', width: '330px', height: '330px', borderRadius: '50%', boxShadow: 'inset -86px 20px 0 0 #F8DE9A', transform: 'rotate(-18deg)' });
    const t1 = L('234') - 0.05, t2 = L('235') - 0.05, t3 = L('235e') + 0.25;
    s.onUpdate((lt) => { const k = lt < t2 ? lerp(-0.25, 0.42, smooth(t1, t2, lt)) : lerp(0.42, 1.25, Math.pow(clamp((lt - t2) / Math.max(0.3, t3 - t2)), 2)); moon.style.left = (k * W) + 'px'; moon.style.opacity = lt < t1 ? '0' : '1'; });
    txt(s, 'bebas sh', 'RAMZAN AATA HAI…', { left: '110px', top: '110px', fontSize: '130px' }, t1, null, { opacity: 0, x: -30 }, 0.3);
    txt(s, 'bebas sh', 'AUR CHALA JATA HAI.', { left: '110px', top: '760px', fontSize: '130px', color: GOLD }, t2, null, { opacity: 0, x: 30 }, 0.3);
    const tt = L('236') - 0.05; const sc = s.div('fill', { background: 'rgba(5,4,10,.86)' }); show(s, sc, tt, null, { opacity: 0 }, 0.3);
    slam(s, '10 SAAL = <span style="color:#E9B955">10 MAHINE</span>', tt + 0.05, { size: 230, y: 410, from: 1.4, amp: 12 });
    s.sfx('type', L('224'), { dur: 1.6, gain: 0.5 }); s.sfx('whoosh', tN, { gain: 0.6 }); s.sfx('riser', tN + 0.6, { dur: Math.max(0.6, tR - tN - 0.6), gain: 0.7 }); s.sfx('whoosh', t2, { gain: 0.9 }); s.sfx('braam', tt + 0.05, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── F5  a model: half of an 80-year life, as it is felt, is over by 20 ─────────
  defScene('f5_model', T('237') - 0.05, T('240') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, X0 = 260, BW = 1400, xa = (a) => X0 + a / 80 * BW, tA = L('238', 'AADHI') - 0.1, tB = L('239') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #14203f 0%, #070b18 55%, #010205 100%)');
    txt(s, 'tag sh', 'EK MODEL · LEMLICH, 1975', { left: '110px', top: '120px', color: CYAN, background: 'rgba(3,8,18,.5)' }, 0.1, null, { opacity: 0, x: -20 }, 0.35);
    txt(s, 'bebas sh', 'AGAR AAP 80 SAAL JIYEIN', { left: '0', width: W + 'px', top: '210px', textAlign: 'center', fontSize: '120px' }, L('238') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    let tk = ''; for (let a = 0; a <= 80; a += 10) tk += `<line x1="${xa(a)}" y1="560" x2="${xa(a)}" y2="600" stroke="rgba(245,241,232,.7)" stroke-width="4"/><text x="${xa(a)}" y="646" text-anchor="middle" fill="rgba(245,241,232,.85)" font-family="Space Mono" font-weight="700" font-size="30">${a}</text>`;
    const ax = svg(s, `<rect x="${X0}" y="480" width="${BW}" height="80" rx="10" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.3)" stroke-width="2"/>${tk}<text x="${X0 + BW + 24}" y="646" fill="rgba(245,241,232,.6)" font-family="Space Mono" font-weight="700" font-size="24">SAAL</text>`); show(s, ax, L('238') + 0.2, null, { opacity: 0 }, 0.4);
    const fill = s.div(null, { position: 'absolute', left: X0 + 'px', top: '480px', width: BW + 'px', height: '80px', borderRadius: '10px', background: 'linear-gradient(90deg,#F8DE9A,#C8902F)', transformOrigin: '0 50%' });
    const mk = s.div(null, { position: 'absolute', left: '0', top: '400px', width: '6px', height: '200px', background: '#fff' });
    const lab = s.div('mono sh', { position: 'absolute', left: '0', top: '340px', width: '700px', marginLeft: '-350px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.2em' }, '');
    gsap.set([fill, mk, lab], { autoAlpha: 0 }); s.tl.set([fill, mk, lab], { autoAlpha: 1 }, tA);
    s.onUpdate((lt) => { const k = smooth(tB, tB + 0.9, lt), age = lerp(40, 20, k); fill.style.transform = `scaleX(${(age / 80).toFixed(4)})`; mk.style.left = (xa(age) - 3) + 'px'; lab.style.left = xa(age) + 'px'; lab.innerHTML = k < 0.5 ? 'GHADI KE HISAAB SE AADHI' : '<span style="color:#E9B955">EHSAAS KE HISAAB SE AADHI</span>'; });
    slam(s, '20 SAAL', L('239', 'bees') - 0.06, { size: 260, y: 700, color: GOLD, from: 1.5, amp: 14 });
    txt(s, 'mont sh', 'yeh ek model hai — qanoon nahi', { left: '0', width: W + 'px', top: '966px', textAlign: 'center', fontSize: '28px', fontWeight: 600, color: 'rgba(245,241,232,.6)' }, tB + 0.6, null, { opacity: 0 }, 0.4);
    s.sfx('tick', tA, { gain: 0.9 }); s.sfx('whooshRev', tB, { gain: 0.7 }); s.sfx('impact', L('239', 'bees') + 0.1, { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.25 });

  // ───────── F6  the hadith: a year like a month, a month like a week … an hour like the flare of a fire ─────────
  defScene('f6_hadith', T('240') - 0.05, T('253') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tU = L('249') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #17254a 0%, #080d1c 52%, #010205 100%)'); dust(s, { n: 70, seed: 21, color: '233,185,85' });
    txt(s, 'cinzel gold sh', `RASULULLAH <span class="ar2" style="font-size:54px;letter-spacing:0">${AR.saw}</span> NE FARMAYA`, { left: '0', width: W + 'px', top: '96px', textAlign: 'center', fontSize: '44px', fontWeight: 700, letterSpacing: '.34em' }, L('241') - 0.05, null, { opacity: 0, y: -14 }, 0.5);
    txt(s, 'mono sh', "JAMI' AT-TIRMIDHI · 2332", { left: '0', width: W + 'px', top: '176px', textAlign: 'center', fontSize: '26px', fontWeight: 700, letterSpacing: '.4em', color: CYAN }, L('241', 'Tirmidhi') - 0.05, null, { opacity: 0 }, 0.4);
    const q = txt(s, 'play sh', '“Qayamat qaim nahi hogi jab tak <span style="color:#E9B955">zamana simat na jaye</span>.”', { left: '160px', width: '1600px', top: '250px', textAlign: 'center', fontSize: '56px', fontStyle: 'italic' }, L('242') - 0.05, tU, { opacity: 0, y: 14 }, 0.5);
    const rows = [['243', 'SAAL', 'MAHINE JAISA', 1 / 12], ['244', 'MAHINA', 'HAFTE JAISA', 1 / 4.3], ['245', 'HAFTA', 'DIN JAISA', 1 / 7], ['246', 'DIN', 'GHANTE JAISA', 1 / 24], ['247', 'GHANTA', 'AAG KI EK BHADAK', 0.006]];
    rows.forEach(([key, a, b, f], i) => { const y = 370 + i * 108, t = L(key) - 0.05, t2 = key === '247' ? L('248') - 0.05 : L(key, 'jaisa') - 0.35;
      const g = s.div(null, { position: 'absolute', left: '200px', top: y + 'px', width: '1520px', height: '96px' });
      const la = el('div', 'bebas', { position: 'absolute', left: '0', top: '6px', width: '260px', fontSize: '84px', lineHeight: '1' }, a), bar = el('div', null, { position: 'absolute', left: '290px', top: '18px', width: '760px', height: '54px', borderRadius: '8px', background: 'linear-gradient(90deg,#B9ECFF,#6FD8FF)', transformOrigin: '0 50%' }), lb = el('div', 'bebas', { position: 'absolute', left: '1090px', top: '6px', fontSize: '84px', lineHeight: '1', color: GOLD, whiteSpace: 'nowrap' }, '→ ' + b);
      g.append(la, bar, lb); show(s, g, t, tU, { opacity: 0, x: -30 }, 0.3);
      s.tl.to(bar, { scaleX: f, duration: 0.5, ease: 'power3.inOut' }, t2).fromTo(lb, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3 }, t2 + 0.15);
      if (key === '247') { const sp = el('div', null, { position: 'absolute', left: '262px', top: '-8px', width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle,#fff 0%,#ffd27a 26%,rgba(255,140,40,.55) 50%,rgba(255,90,20,0) 72%)' }); g.appendChild(sp); s.tl.fromTo(sp, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1.25, duration: 0.18, ease: 'power2.out' }, t2 + 0.35).to(sp, { opacity: 0, scale: 0.5, duration: 0.5 }, t2 + 0.55); s.sfx('whoosh', t2 + 0.3, { gain: 0.8 }); }
      s.sfx('tick', t, { gain: 0.8 }); s.sfx('whooshRev', t2, { gain: 0.45 }); });
    // what the scholars said
    txt(s, 'mono sh', 'ULAMA NE IS KA EK MA\'NI YEH LIKHA HAI', { left: '0', width: W + 'px', top: '300px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.34em', color: CYAN }, tU + 0.1, null, { opacity: 0 }, 0.4);
    slam(s, 'WAQT SE <span style="color:#E9B955">BARKAT</span> UTH JAYEGI', L('250') - 0.06, { cls: 'bebas sh', size: 170, y: 360, from: 1.3, amp: 10 });
    txt(s, 'mont sh', 'Din wohi <span style="color:#6FD8FF">24 ghante</span> ka — lekin haath kuch nahi aayega.', { left: '0', width: W + 'px', top: '590px', textAlign: 'center', fontSize: '52px', fontWeight: 700 }, L('251') - 0.05, null, { opacity: 0, y: 14 }, 0.4);
    stamp(s, '1400 SAAL PEHLE', L('252') - 0.05, { cls: 'gold', x: 590, y: 720, size: 100, rot: -3 });
    s.sfx('shimmer', L('241'), { gain: 0.8 }); s.sfx('braam', L('250') - 0.06, { gain: 0.85 }); s.sfx('slam', L('252'), { gain: 0.9 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── F7  two questions down, both answers wrong — the third will not be ─────────
  defScene('f7_bridge', T('253') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t3 = L('255') - 0.1, t56 = L('256') - 0.1, tE = L('257') - 0.06;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #131a33 0%, #06070f 58%, #000 100%)');
    const row = (y, n, a, b, t, tx) => { const g = s.div('panel', { left: '260px', top: y + 'px', width: '1400px', height: '170px' });
      g.innerHTML = `<div class="bebas" style="position:absolute;left:40px;top:14px;font-size:140px;line-height:1;color:${CYAN}">${n}</div><div class="bebas" style="position:absolute;left:150px;top:36px;font-size:100px;line-height:1">${a}</div><div class="bebas x" style="position:absolute;right:44px;top:36px;font-size:100px;line-height:1;color:${RED}">${b}</div>`;
      show(s, g, t, t56, { opacity: 0, x: -40 }, 0.35); const x = g.querySelector('.x'); s.tl.fromTo(x, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, tx); s.sfx('buzz', tx, { gain: 0.6 }); return g; };
    row(200, '1', '“EK DIN” — ASAL: 100 SAAL', '✗ GHALAT', L('253') - 0.05, L('254', 'ghalat') - 0.1);
    row(400, '2', '“EK DIN” — ASAL: 300 + 9', '✗ GHALAT', L('253') + 0.25, L('254', 'ghalat') + 0.15);
    const g3 = s.div('panel', { left: '260px', top: '600px', width: '1400px', height: '170px', borderColor: 'rgba(233,185,85,.7)' });
    g3.innerHTML = `<div class="bebas" style="position:absolute;left:40px;top:14px;font-size:140px;line-height:1;color:${GOLD}">3</div><div class="bebas" style="position:absolute;left:150px;top:36px;font-size:100px;line-height:1">AB TEESRA…</div><div class="bebas" style="position:absolute;right:60px;top:20px;font-size:130px;line-height:1;color:${GOLD}">?</div>`;
    show(s, g3, t3, t56, { opacity: 0, x: -40 }, 0.35); s.sfx('hit', t3 + 0.2, { gain: 0.8 });
    txt(s, 'mont sh', 'Aur is baar masla yeh hai…', { left: '0', width: W + 'px', top: '280px', textAlign: 'center', fontSize: '56px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, t56 + 0.08, null, { opacity: 0 }, 0.3);
    slam(s, 'JAWAB GHALAT<br><span style="color:#E9B955">NAHI HOGA.</span>', tE, { cls: 'bebas sh', size: 250, y: 380, lh: '.95', from: 1.4, amp: 14, style: { whiteSpace: 'normal' } });
    s.sfx('subdrop', tE, { gain: 1.0 }); s.sfx('boom', tE + 0.02, { gain: 1.0 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
