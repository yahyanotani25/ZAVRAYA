// PART A — COLD OPEN (spoken lines 0..17) + title sting.  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
import { defScene, stage3d, T, TW, gsap, THREE, el, image, clamp, lerp, smooth, ease, noise1, W, H } from '../engine.js';
import { cap, big, lowerThird, dateline, stamp, flash, show, still, footage, counter, svg, shake, words, chars } from '../ui.js';
import { spaceBackdrop, galaxyField, glow, starfield } from '../kit3d.js';
import { Q } from '../quran.js';
import { IMG } from '../assets.js';

const EQ = (lam) => `<span class="eqi">R</span><sub>μν</sub> <span class="op">−</span> <span class="half">½</span> <span class="eqi">g</span><sub>μν</sub><span class="eqi">R</span>` +
  (lam ? ` <span class="lam"><span class="op">+</span> <span class="lamL">Λ</span><span class="eqi">g</span><sub>μν</sub></span>` : '') +
  ` <span class="op">=</span> <span class="frac"><span>8π<span class="eqi">G</span></span><span><span class="eqi">c</span><sup>4</sup></span></span> <span class="eqi">T</span><sub>μν</sub>`;
const EQCSS = `<style>
.eq{font-family:'STIX Two Text',serif;font-size:118px;color:#fff;white-space:nowrap;text-shadow:0 0 34px rgba(150,205,255,.55),0 0 90px rgba(120,180,255,.25)}
.eq .eqi{font-style:italic}.eq sub{font-size:.5em;vertical-align:-.28em;font-style:italic;margin-left:.02em}.eq sup{font-size:.55em;vertical-align:.55em}
.eq .op{margin:0 .16em}.eq .frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.74em;line-height:1.05;margin:0 .1em}
.eq .frac>span:first-child{border-bottom:3px solid #fff;padding:0 .18em .04em}.eq .frac>span:last-child{padding-top:.04em}
.eq .lam{display:inline-block;color:#FF5B5B;text-shadow:0 0 30px rgba(255,75,75,.8),0 0 80px rgba(255,75,75,.4)}
</style>`;
const hb = (t) => { const p = (t * 1.05) % 1; return Math.exp(-Math.pow((p - 0.08) / 0.045, 2)) + 0.6 * Math.exp(-Math.pow((p - 0.27) / 0.05, 2)); };

export default function ([P0, P1]) {
  // ───────── A1  1917 · Berlin · Einstein stares at his equations ─────────
  const a1 = [0, T('3')];
  defScene('a1_berlin', a1[0], a1[1] + 0.25, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0;
    const st = stage3d(s, { bg: 0x000000, fov: 50 });
    const bd = spaceBackdrop(st, { gain: 0.32, count: 4200, px: 2.6, seed: 4 });
    const dot = glow(0xffffff, 0.5, 1, 0.05, 2.4), halo = glow(0x9cc8ff, 3.2, 0.35, 0, 1.6); st.scene.add(dot, halo);
    st.frame = (lt) => {
      bd.update(lt, 0.006);
      const vis = smooth(1.2, 5.0, lt);                     // stars come up slowly out of black
      bd.dome.material.opacity = 0.75 * vis; bd.s1.material.uniforms.opacity.value = vis; bd.s2.material.uniforms.opacity.value = vis;
      const k = hb(lt), out = 1 - smooth(L('2') - 0.2, L('2') + 1.0, lt);
      dot.scale.setScalar((0.34 + 0.34 * k) * (0.5 + 0.5 * out)); dot.material.opacity = out; halo.scale.setScalar(2.4 + 2.6 * k); halo.material.opacity = (0.16 + 0.3 * k) * out;
      st.camera.position.set(Math.sin(lt * 0.11) * 0.5, Math.cos(lt * 0.09) * 0.25, 13 - lt * 0.14); st.camera.lookAt(0, 0, 0);
    };
    for (let b = 0; b < (a1[1] - 0.4) / (1 / 1.05); b++) s.sfx('heartbeat', b / 1.05 + 0.08, { gain: b < 6 ? 0.9 : 0.5 });
    s.sfx('clock', 0, { dur: L('2') });
    // portrait (right) with a soft left edge, slow push-in
    const ph = s.div(null, { position: 'absolute', right: '0', top: '0', width: '1060px', height: '1080px', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.85) 34%, #000 60%)', maskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.85) 34%, #000 60%)' });
    const im = image(IMG.einstein1921, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 22%' }); ph.appendChild(im);
    ph.appendChild(el('div', 'fill', { background: 'linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,.65) 100%)' }));
    gsap.set(ph, { autoAlpha: 0 });
    s.tl.set(ph, { autoAlpha: 1 }, L('2') - 0.1).fromTo(ph, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, L('2') - 0.1);
    s.tl.fromTo(im, { scale: 1.02 }, { scale: 1.16, duration: a1[1] - L('2') + 1, ease: 'none' }, L('2') - 0.1);
    s.sfx('swell', L('2') - 0.3, { dur: 1.6 });
    dateline(s, '1917', 'BERLIN · GERMANY', L('0'), null);
    s.sfx('type', L('1') + 0.3, { dur: 0.8 });
    lowerThird(s, 'ALBERT EINSTEIN', 'Duniya ka sab se bada dimagh', L('2', 5) - 0.1, a1[1] - 0.1, { bottom: 150 });
    // the equation he is staring at
    const eq = s.div('eq', { position: 'absolute', left: '110px', top: '470px', fontSize: '88px' }, EQCSS + EQ(false));
    gsap.set(eq, { autoAlpha: 0 });
    const t = L('2', 9);
    s.tl.set(eq, { autoAlpha: 1 }, t).fromTo(eq, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out' }, t);
    s.sfx('shimmer', t, { gain: 0.7 });
    s.div('vig');
  }, { fout: 0.25 });

  // ───────── A2  the equation speaks → "KAINAT RUKI HUI NAHI HAI" ─────────
  const a2 = [T('3'), T('5')];
  defScene('a2_eq', a2[0], T('4') + 0.02, (s) => {
    const d = s.t1 - s.t0;
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 45%, #0b1b3a 0%, #03060f 55%, #000 100%)' });
    const st = stage3d(s, { fov: 50 }); const stars = starfield({ count: 2600, radius: 300, seed: 21, px: 2.6 }); st.scene.add(stars);
    st.frame = (lt) => { stars.rotation.z = lt * 0.01; stars.material.uniforms.time.value = lt; st.camera.position.z = 10 - lt * 0.6; };
    const eq = s.div('eq center', { fontSize: '150px' }, EQCSS + EQ(false));
    s.tl.fromTo(eq, { scale: 0.62, opacity: 0 }, { scale: 0.86, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0).to(eq, { scale: 1.12, duration: d - 0.7, ease: 'power1.in' }, 0.7);
    cap(s, 'Equations usay ek aisi baat bata rahi hain<br>jo usay <span class="hr">bilkul pasand nahi</span>', 0.25, d - 0.05, { size: 50, bottom: 120 });
    s.sfx('riser', Math.max(0, d - 2.2), { dur: 2.2 });
    s.div('vig');
  }, { fin: 0.25 });
  defScene('a2_expand', T('4'), a2[1], (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x01030a, fov: 55 });
    const bd = spaceBackdrop(st, { gain: 0.4, seed: 8 });
    const gal = galaxyField({ count: 320, radius: 70, size: 4.2, seed: 12 }); st.scene.add(gal);
    st.frame = (lt) => {
      bd.update(lt + 20);
      gal.userData.update({ scale: 0.55 + lt * 0.085 + 0.02 * lt * lt, redshift: clamp(lt * 0.12) });   // everything flies apart
      const sh = Math.max(0, 1 - lt / 0.6) * 0.5;
      st.camera.position.set(noise1(lt * 30, 1) * sh, noise1(lt * 33, 2) * sh, 0.01); st.camera.lookAt(0, 0, -10);
      st.camera.rotation.z = lt * 0.02;
    };
    flash(s, 0, { dur: 0.5, peak: 0.85 }); s.sfx('impact', 0); s.sfx('whoosh', 0.05, { gain: 0.6 });
    const h = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '360px', textAlign: 'center', fontSize: '210px', lineHeight: '1.02' },
      '<span class="k">KAINAT</span> <span class="k">RUKI</span> <span class="k">HUI</span><br><span class="k glowr" style="color:#FF4B4B">NAHI</span> <span class="k">HAI</span>');
    const ks = [...h.querySelectorAll('.k')]; ks.forEach((k) => { k.style.display = 'inline-block'; });
    ks.forEach((k, i) => {
      const t = Math.max(0, L('4', i) - 0.04);
      s.tl.fromTo(k, { opacity: 0, scale: i === 3 ? 2.4 : 1.5, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: i === 3 ? 0.22 : 0.3, ease: i === 3 ? 'power4.in' : 'power3.out' }, t);
    });
    s.sfx('hit', Math.max(0, L('4', 3) + 0.18));
    shake(s, h, Math.max(0, L('4', 3) + 0.18), 0.5, 16);
    s.tl.to(h, { scale: 1.06, duration: d, ease: 'none' }, 0);
    s.div('vig');
  }, { fout: 0.3 });

  // ───────── A3  Λ — the forced extra number, "sab se badi ghalti" ─────────
  defScene('a3_lambda', T('5'), T('8'), (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tLam = L('6', 5), tFreeze = L('6', 10), tBlunder = L('7', 6);
    const st = stage3d(s, { bg: 0x01030a, fov: 55 });
    const bd = spaceBackdrop(st, { gain: 0.36, seed: 8 });
    const gal = galaxyField({ count: 320, radius: 70, size: 4.2, seed: 12 }); st.scene.add(gal);
    st.frame = (lt) => {
      bd.update(lt + 26);
      const k = smooth(tLam, tFreeze + 0.4, lt);                        // expansion slows to a dead stop when Λ goes in
      const travel = lt < tFreeze + 0.4 ? lt - (lt - tLam) * k * 0.5 : null;
      const tt = travel == null ? (tFreeze + 0.4) - (tFreeze + 0.4 - tLam) * 0.5 : travel;
      gal.userData.update({ scale: 1.0 + tt * 0.07, redshift: 0.45 * (1 - k), opacity: 0.55 });
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = 0.12 + tt * 0.012;
    };
    s.div('scrim-all', { background: 'rgba(1,3,10,.35)' });
    cap(s, 'To Einstein ne <span class="hl">kya kiya?</span>', 0.05, L('6') - 0.05, { bottom: 760, size: 66 });
    const eq = s.div('eq center', { fontSize: '128px' }, EQCSS + EQ(true));
    const lam = eq.querySelector('.lam');
    gsap.set(lam, { width: 0, opacity: 0, display: 'inline-block', overflow: 'visible' });
    s.tl.fromTo(eq, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6 }, L('6') - 0.1);
    s.tl.to(lam, { width: 'auto', duration: 0.5, ease: 'power2.inOut' }, tLam - 0.25);
    s.tl.fromTo(lam, { opacity: 0, scale: 2.6, y: -90 }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'power4.in' }, tLam);
    s.sfx('hit', tLam + 0.4); shake(s, eq, tLam + 0.42, 0.45, 12);
    const tag = s.div('tag red sh', { position: 'absolute', left: '50%', top: '690px', transform: 'translateX(-50%)', background: 'rgba(20,0,0,.5)' }, 'EK EXTRA NUMBER · Λ · ZABARDASTI');
    show(s, tag, tLam + 0.5, tBlunder - 0.1, { opacity: 0, y: -18 }, 0.4);
    // freeze badge
    const fz = s.div('mono cyan sh', { position: 'absolute', right: '110px', top: '96px', fontSize: '30px', letterSpacing: '.3em' }, '❚❚&nbsp; KAINAT “RUKI HUI”');
    show(s, fz, tFreeze + 0.2, null, { opacity: 0, x: 30 }, 0.4); s.sfx('tick', tFreeze + 0.2);
    // the blunder
    const x = svg(s, `<path class="x1" d="M -150 -110 L 150 110" stroke="#FF4B4B" stroke-width="20" stroke-linecap="round" fill="none"/><path class="x2" d="M 150 -110 L -150 110" stroke="#FF4B4B" stroke-width="20" stroke-linecap="round" fill="none"/>`, { x: 0, y: 0, vb: '-960 -540 1920 1080' });
    const lr = () => { const r = lam.getBoundingClientRect(); return { cx: r.left + r.width / 2 - 960, cy: r.top + r.height / 2 - 540 }; };
    s.onUpdate((lt) => { if (lt > tBlunder - 0.5) { const c = lr(); x.querySelector('svg').style.transform = `translate(${c.cx}px, ${c.cy}px)`; } });
    s.tl.fromTo(x.querySelector('.x1'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.16, ease: 'power2.in' }, tBlunder - 0.2);
    s.tl.fromTo(x.querySelector('.x2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.16, ease: 'power2.in' }, tBlunder - 0.02);
    s.sfx('slash', tBlunder - 0.2); s.sfx('slash', tBlunder - 0.02);
    stamp(s, 'SAB SE BADI GHALTI', tBlunder + 0.15, { x: 500, y: 730, size: 104, rot: -5 }); s.sfx('impact', tBlunder + 0.37, { gain: 0.8 });
    const by = s.div('mont dim sh', { position: 'absolute', left: '0', right: '0', top: '930px', textAlign: 'center', fontSize: '30px', fontWeight: 600, letterSpacing: '.06em' }, '“biggest blunder” — Einstein ka apna lafz (George Gamow ki riwayat)');
    show(s, by, tBlunder + 0.7, null, { opacity: 0, y: 12 }, 0.5);
    s.div('vig');
  }, { fin: 0.3, fout: 0.12 });

  // ───────── A4  "asal kahani yeh nahi" → 1300 years earlier, two words ─────────
  defScene('a4_asal', T('8'), T('9') + 0.05, (s) => {
    s.div('fill', { background: '#000' });
    big(s, 'LEKIN ASAL KAHANI <span class="gold">YEH NAHI</span>', 0.02, null, { size: 150, y: 455, mode: 'fade', by: 'words', stagger: 0.09 });
    s.sfx('subdrop', 0); s.sfx('whooshRev', Math.max(0, s.t1 - s.t0 - 0.9), { dur: 0.9 });
  });
  defScene('a4_desert', T('9'), T('12'), (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    footage(s, 'desert1', { n: 450, speed: 450 / (d * 30 + 2), kb: { s0: 1.0, s1: 1.1 } });
    s.div('scrim-b'); s.div('scrim-t');
    // year counter rewinding 1917 → 610
    const yr = s.div('dl', null, '<div class="yr sh"></div><div class="rule"></div><div class="pl sh">1300 SAAL PEHLE</div>');
    const yn = yr.querySelector('.yr'); gsap.set(yr.querySelector('.pl'), { opacity: 0 });
    show(s, yr, 0.05, L('10') - 0.2, { opacity: 0 }, 0.3);
    counter(s, yn, 1917, 617, L('9', 5) - 0.3, 1.9, (v) => String(Math.round(v)), 'power2.inOut');
    s.sfx('rewind', L('9', 5) - 0.3, { dur: 1.9 });
    s.tl.to(yr.querySelector('.pl'), { opacity: 1, duration: 0.4 }, L('9', 5) + 1.5);
    cap(s, 'Arab ke <span class="hl">registan</span> mein…', L('9', 10) - 0.1, L('9', 14) + 0.1, { bottom: 150 });
    cap(s, 'ek kitab mein <span class="hl">do lafz</span> maujood the', L('9', 14) + 0.15, L('10') - 0.15, { bottom: 150 });
    // the two words
    const ar = s.div('ar glowg', { position: 'absolute', left: '0', right: '0', top: '300px', textAlign: 'center', fontSize: '230px', color: '#FFF3D2', lineHeight: '1.5' }, Q['w:wainna_lamusiun']);
    gsap.set(ar, { autoAlpha: 0 });
    const ta = L('9', 17) - 0.2;
    s.tl.set(ar, { autoAlpha: 1 }, ta).fromTo(ar, { opacity: 0, scale: 0.86, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 1.8, ease: 'power2.out' }, ta).to(ar, { scale: 1.07, duration: d - ta - 1.8, ease: 'none' }, ta + 1.8);
    s.sfx('shimmer', ta, { gain: 1 }); s.sfx('swell', ta - 0.6, { dur: 2.4 });
    const g = s.div(null, { position: 'absolute', left: '50%', top: '500px', width: '1500px', height: '520px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 50%, rgba(233,185,85,.20) 0%, rgba(233,185,85,0) 62%)', zIndex: -0 });
    show(s, g, ta, null, { opacity: 0 }, 2.0);
    cap(s, 'In do lafzon ka seedha ma\'ni <span class="hl">wohi</span> hai —<br>jo Einstein ki equations keh rahi thin', L('10') + 0.05, L('11') - 0.1, { bottom: 110, size: 48 });
    cap(s, '…aur jise maan\'ne se khud Einstein ne <span class="hr">inkaar</span> kar diya', L('11') + 0.05, d - 0.1, { bottom: 130, size: 48 });
    s.div('vig');
  }, { fin: 0.7, fout: 0.3 });

  // ───────── A5  the three promises ─────────
  defScene('a5_promise', T('12'), T('17'), (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x02040b, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.5, seed: 31, rx: 0.4 });
    st.frame = (lt) => { bd.update(lt * 3 + 40); st.camera.position.set(0, 0, 10); st.camera.rotation.z = lt * 0.01; };
    s.div('scrim-all', { background: 'rgba(2,4,12,.5)' });
    const hd = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '86px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.5em' }, 'AAJ KI VIDEO MEIN');
    show(s, hd, 0.0, null, { opacity: 0, y: -20 }, 0.5);
    const cards = [
      { t: L('13'), n: '01', title: '3 AYAAT', sub: 'jo kainat ki poori kahani<br>suna deti hain', icon: `<div style="font-family:'Cinzel',serif;font-weight:700;font-size:40px;letter-spacing:.12em;color:#F8DE9A;line-height:1.75">51 : 47<br>21 : 30<br>41 : 11</div>` },
      { t: L('14'), n: '02', title: 'KABOOTAR', sub: 'jinhone do scientists ko<br><b style="color:#F8DE9A">Nobel Prize</b> dilwa diya', icon: `<svg width="230" height="190" viewBox="0 0 230 190"><g fill="#E9E4D8"><ellipse cx="112" cy="112" rx="66" ry="40" transform="rotate(-14 112 112)"/><circle cx="170" cy="62" r="25"/><path d="M192 56 L222 64 L193 72 Z"/><path d="M52 118 L4 150 L20 112 L6 96 Z"/><path d="M82 96 Q112 52 150 92 Q116 126 82 96 Z" fill="#B9B3A6"/><rect x="100" y="146" width="7" height="30"/><rect x="124" y="146" width="7" height="30"/></g><circle cx="176" cy="58" r="4.5" fill="#101010"/></svg>` },
      { t: L('15'), n: '03', title: 'WOH SAWAL', sub: 'Quran ka — sirf <b style="color:#F8DE9A">2 ayaton</b> ka', icon: `<div class="anton glowg" style="font-size:190px;line-height:1;color:#F2C968">?</div>` },
    ];
    const cardEls = cards.map((c, i) => {
      const p = s.div('panel', { left: (150 + i * 560) + 'px', top: '210px', width: '500px', height: '610px', textAlign: 'center' });
      p.innerHTML = `<div class="mono cyan" style="position:absolute;left:34px;top:26px;font-size:30px;font-weight:700">${c.n}</div>
        <div style="position:absolute;left:0;right:0;top:86px;height:230px;display:flex;align-items:center;justify-content:center">${c.icon}</div>
        <div class="bebas" style="position:absolute;left:0;right:0;top:350px;font-size:104px;color:#fff">${c.title}</div>
        <div class="mont" style="position:absolute;left:30px;right:30px;top:468px;font-size:33px;font-weight:600;line-height:1.3;color:rgba(245,241,232,.86)">${c.sub}</div>`;
      gsap.set(p, { autoAlpha: 0 });
      s.tl.set(p, { autoAlpha: 1 }, c.t - 0.1).fromTo(p, { y: 120, opacity: 0, rotateX: 28, transformPerspective: 1200 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: 'back.out(1.3)' }, c.t - 0.1);
      s.sfx('whoosh', c.t - 0.15, { gain: 0.7 }); s.sfx('pop', c.t + 0.3);
      return p;
    });
    // the quote + heartbeat line
    const tq = L('16') - 0.1;
    s.tl.to([cardEls[0], cardEls[1]], { opacity: 0.28, duration: 0.5 }, tq).to(cardEls[2], { boxShadow: '0 0 0 3px rgba(233,185,85,.9), 0 0 90px rgba(233,185,85,.35)', duration: 0.5 }, tq);
    const ecg = svg(s, `<path d="M0 60 L420 60 L450 60 L470 22 L492 104 L514 4 L538 96 L556 60 L620 60 L650 40 L680 60 L1060 60 L1090 60 L1110 22 L1132 104 L1154 4 L1178 96 L1196 60 L1260 60 L1290 40 L1320 60 L1620 60" fill="none" stroke="#FF5B5B" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`, { x: 150, y: 846, w: 1620, h: 120 });
    s.tl.fromTo(ecg.querySelector('path'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 2.2, ease: 'none' }, tq);
    const qt = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '948px', textAlign: 'center', fontSize: '58px', fontStyle: 'italic', fontWeight: 700, color: '#fff' }, '“Qareeb tha ke mera <span style="color:#FF6B6B">dil ud jaye</span>.”');
    gsap.set(qt, { autoAlpha: 0 }); s.tl.set(qt, { autoAlpha: 1 }, tq + 0.1).fromTo(words(qt), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.09 }, tq + 0.1);
    s.sfx('heartbeat', tq + 0.5, { gain: 1.2 }); s.sfx('heartbeat', tq + 1.5, { gain: 1.2 });
    s.div('vig');
  }, { fin: 0.35, fout: 0.25 });

  // ───────── A6  rewind → TITLE ─────────
  defScene('a6_title', T('17'), P1, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tBang = Math.min(T('17e') - s.t0 + 0.25, d - 2.4);
    const st = stage3d(s, { bg: 0x000000, fov: 60 });
    const bd = spaceBackdrop(st, { gain: 0.3, seed: 3 });
    const gal = galaxyField({ count: 420, radius: 80, size: 4.5, seed: 44 }); st.scene.add(gal);
    const burst = starfield({ count: 14000, radius: 60, seed: 88, px: 2.6 }); st.scene.add(burst);
    const core = glow(0xfff0c8, 1, 1, 0.08, 1.8), core2 = glow(0xff9a3c, 1, 0.8, 0, 1.4); st.scene.add(core, core2);
    st.frame = (lt) => {
      bd.update(lt + 60);
      const k = clamp(lt / tBang), kk = ease.in3(k);
      gal.userData.update({ scale: Math.max(0.0005, 1.25 * (1 - kk)), redshift: 0, opacity: 1 });          // everything falls back to a point
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = -kk * 1.4;
      const a = lt - tBang;                                                                                 // after the bang
      burst.visible = a > 0; if (a > 0) { burst.scale.setScalar(0.02 + ease.out3(clamp(a / 3.2)) * 3.2 + a * 0.12); burst.material.uniforms.opacity.value = clamp(1.2 - a / 4.5); burst.material.uniforms.time.value = lt; }
      const c = a < 0 ? smooth(0.55, 1.0, k) * 0.9 : Math.max(0, 1 - a / 1.6);
      core.position.set(0, 0, -10); core2.position.set(0, 0, -10);
      core.scale.setScalar(a < 0 ? 0.4 + 2.2 * c : 3 + a * 14); core.material.opacity = a < 0 ? c : Math.max(0, 1 - a / 1.3);
      core2.scale.setScalar(a < 0 ? 1 + 5 * c : 8 + a * 26); core2.material.opacity = (a < 0 ? c * 0.6 : Math.max(0, 0.8 - a / 2.4));
      bd.dome.material.opacity = a < 0 ? 0.75 * (1 - kk) : 0.75 * smooth(1.0, 3.0, a);
    };
    const rw = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '34px', fontWeight: 700, letterSpacing: '.3em' }, '◀◀&nbsp; REWIND');
    show(s, rw, 0.1, tBang, { opacity: 0, x: -20 }, 0.3);
    const yb = s.div('bebas sh', { position: 'absolute', right: '110px', top: '80px', fontSize: '96px', textAlign: 'right' }, '');
    show(s, yb, 0.1, tBang, { opacity: 0 }, 0.3);
    counter(s, yb, 0, 13.8, 0.15, tBang - 0.25, (v) => `− ${v.toFixed(1)} ARAB SAAL`, 'power2.in');
    cap(s, 'Chaliye — <span class="hl">waqt ko ulta</span> chalate hain', L('17') + 0.02, tBang - 0.05, { bottom: 130 });
    s.sfx('rewind', 0.1, { dur: tBang - 0.1 }); s.sfx('riser', Math.max(0, tBang - 1.8), { dur: 1.8 });
    flash(s, tBang, { peak: 1, up: 0.05, dur: 1.1 }); s.sfx('impact', tBang, { gain: 1.3 }); s.sfx('subdrop', tBang);
    // title
    const tw = s.div(null, { position: 'absolute', left: '0', right: '0', top: '330px', textAlign: 'center' });
    tw.innerHTML = `<div class="cinzel gold sh" style="font-size:36px;font-weight:700;letter-spacing:.6em;margin-bottom:26px">HIDDEN MYSTERIES OF ISLAM</div>
      <div class="bebas sh t1" style="font-size:250px;line-height:.9;color:#fff">KAINAT KA</div>
      <div class="bebas goldgrad t2" style="font-size:250px;line-height:.95;padding-bottom:10px">PEHLA LAMHA</div>
      <div class="orn" style="margin:22px auto 0;width:760px"></div>`;
    gsap.set(tw, { autoAlpha: 0 });
    const tt = tBang + 0.25;
    s.tl.set(tw, { autoAlpha: 1 }, tt);
    s.tl.fromTo(tw.querySelector('.cinzel'), { opacity: 0, letterSpacing: '1.4em' }, { opacity: 1, letterSpacing: '.6em', duration: 1.4, ease: 'power2.out' }, tt + 0.2);
    s.tl.fromTo(chars(tw.querySelector('.t1')), { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out' }, tt);
    s.tl.fromTo(tw.querySelector('.t2'), { opacity: 0, scale: 1.25, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power3.out' }, tt + 0.45);
    s.tl.fromTo(tw.querySelector('.orn'), { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power2.inOut' }, tt + 0.7);
    s.tl.to(tw, { scale: 1.05, duration: d - tt, ease: 'none' }, tt);
    s.sfx('shimmer', tt + 0.45);
    s.div('vig');
  }, { fin: 0.25, fout: 0.45 });
}
