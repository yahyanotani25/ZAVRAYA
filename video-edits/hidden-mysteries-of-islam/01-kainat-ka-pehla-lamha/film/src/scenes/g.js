// PART G — "Woh sawal jis ne dil uda diya" · the story (spoken lines 176..201).
// Seerah story: told with place, sky, light, maps, name plates and text only — no figures of anyone.
// All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
import { defScene, stage3d, T, TW, gsap, THREE, el, image, clamp, lerp, smooth, ease, noise1, rng, film } from '../engine.js';
import { cap, lowerThird, dateline, flash, show, footage, svg, shake, words } from '../ui.js';
import { spaceBackdrop, starfield, earth, latLon, pin, gridPlane } from '../kit3d.js';
import { Q, REF, AR } from '../quran.js';

// ---- local helpers ----
// reveal the words of `node` on the spoken words of line `id` (word i of node <-> spoken word from+i)
function sync(s, node, id, o = {}) {
  const ws = words(node), from = o.from || 0;
  ws.forEach((w, i) => {
    const t = Math.max(0, TW(id, from + i) - s.t0 - (o.lead ?? 0.08));
    s.tl.fromTo(w, { opacity: 0, y: o.y ?? 14, scale: o.s0 ?? 1 }, { opacity: 1, y: 0, scale: 1, duration: o.dur ?? 0.36, ease: o.ease || 'power2.out' }, t);
  });
  return ws;
}
// typewriter: one span per character, characters of word i appear inside the spoken slot of word i. returns [[span, time], …]
function typeLine(s, node, id, ws, hl = {}) {
  const cs = [];
  ws.forEach((w, i) => {
    const t0 = TW(id, i) - s.t0 - 0.07, t1 = (i + 1 < ws.length ? TW(id, i + 1) : T(id + 'e')) - s.t0 - 0.07;
    const step = Math.min(0.04, Math.max(0.01, (t1 - t0) * 0.7 / (w.length + 1)));
    const wsp = el('span', hl[i] || null, { display: 'inline-block', whiteSpace: 'pre' });
    [...(w + (i + 1 < ws.length ? ' ' : ''))].forEach((ch, j) => { const c = el('span', null, { opacity: '0' }); c.textContent = ch; wsp.appendChild(c); cs.push([c, t0 + j * step]); });
    node.appendChild(wsp);
  });
  return cs;
}
// date-palm silhouettes + dune line (trees and ground only). list: [x, baseY, height, lean, scale]
function grove(s, list, o = {}) {
  const R = rng(o.seed || 5), col = o.col || '#02030a'; let h = '';
  for (const [x, y, hh, lean, k] of list) {
    const tx = x + lean, ty = y - hh, w0 = 13 * k, w1 = 7 * k, cx = x + lean * 0.2, cy = y - hh * 0.55;
    h += `<path d="M ${x - w0} ${y} Q ${cx - w0 * 0.8} ${cy} ${tx - w1} ${ty} L ${tx + w1} ${ty} Q ${cx + w0 * 0.8} ${cy} ${x + w0} ${y} Z" stroke="none"/>`;
    let sp = '', lf = ''; const n = 17;
    for (let i = 0; i < n; i++) {
      const a = (-212 + 244 * i / (n - 1) + (R() - 0.5) * 12) * Math.PI / 180, len = (150 + R() * 80) * k * (0.78 + 0.22 * Math.abs(Math.sin(a)));
      const ca = Math.cos(a), sa = Math.sin(a), droop = len * (0.16 + 0.5 * Math.pow(Math.abs(ca), 1.4));
      const p1 = [tx + ca * len * 0.5, ty + sa * len * 0.5 - len * 0.16], p2 = [tx + ca * len, ty + sa * len + droop];
      sp += `M ${tx} ${ty} Q ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
      for (let j = 2; j <= 15; j++) {
        const t = j / 15, u = 1 - t, px = u * u * tx + 2 * u * t * p1[0] + t * t * p2[0], py = u * u * ty + 2 * u * t * p1[1] + t * t * p2[1];
        let gx = 2 * u * (p1[0] - tx) + 2 * t * (p2[0] - p1[0]), gy = 2 * u * (p1[1] - ty) + 2 * t * (p2[1] - p1[1]); const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
        const ll = len * 0.27 * Math.pow(Math.sin(Math.PI * (0.08 + 0.9 * t)), 0.7);
        for (const sd of [-1, 1]) { let dx = -gy * sd + gx * 0.35, dy = gx * sd + gy * 0.35 + 0.75; const dl = Math.hypot(dx, dy) || 1; lf += `M ${px.toFixed(1)} ${py.toFixed(1)} l ${(dx / dl * ll).toFixed(1)} ${(dy / dl * ll).toFixed(1)} `; }
      }
    }
    h += `<g class="cr" data-x="${tx}" data-y="${ty}"><circle cx="${tx}" cy="${ty + 4 * k}" r="${15 * k}" stroke="none"/><path d="${sp}" fill="none" stroke-width="${(4.5 * k).toFixed(1)}"/><path d="${lf}" fill="none" stroke-width="${(2.3 * k).toFixed(1)}"/></g>`;
  }
  const d = svg(s, `<g fill="${col}" stroke="${col}" stroke-linecap="round">${h}<path d="${o.dune || 'M -10 1090 L -10 905 C 260 872 520 938 900 918 S 1560 866 1930 902 L 1930 1090 Z'}" stroke="none"/></g>`);
  const cr = [...d.querySelectorAll('.cr')];
  s.onUpdate((lt) => cr.forEach((c, i) => c.setAttribute('transform', `rotate(${(Math.sin(lt * 0.7 + i * 1.7) * 1.2 + Math.sin(lt * 1.9 + i) * 0.4).toFixed(3)} ${c.dataset.x} ${c.dataset.y})`)));
  return d;
}
const TICK = (sz, sw = 12) => `<svg width="${sz}" height="${sz}" viewBox="0 0 150 150" style="overflow:visible;display:block"><circle cx="75" cy="75" r="64" fill="rgba(8,40,24,.82)" stroke="#57E39A" stroke-width="7"/><path class="ck" d="M44 78 L67 100 L108 52" fill="none" stroke="#57E39A" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SKY_N = 538;                                   // frames/g_sky (ESO Paranal twilight time-lapse, played backwards: dusk falls into night)

export default function ([P0, P1]) {
  // film.js currently starts this part at line 177, but its first sentence is line 176 → start early and sit above the previous part's tail
  const g0 = Math.min(P0, T('176') - 0.35);

  // ───────── G1  the sceptic's comment → "bohat acha sawal" → the Quran itself raised it · 2 ayaat ─────────
  defScene('g1_sawal', g0, T('184') + 0.3, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0;
    const tOK = L('180') - 0.06, tK = L('181') - 0.05, tQ = L('182') - 0.34, t2 = L('183') - 0.06;
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 40%, #0c1e40 0%, #050b18 56%, #010207 100%)' });
    const st = stage3d(s, { fov: 55 });
    const grid = gridPlane({ n: 36, size: 90, seg: 36, color: 0x6fd8ff, opacity: 0.2 }); grid.position.y = -6; st.scene.add(grid);
    const stars = starfield({ count: 1800, radius: 300, seed: 71, px: 2.4 }); st.scene.add(stars);
    const cA = new THREE.Color(0x6fd8ff), cB = new THREE.Color(0xe9b955);
    st.frame = (lt) => {
      grid.material.color.copy(cA).lerp(cB, smooth(tQ, tQ + 0.9, lt));
      grid.position.z = (lt * 1.1) % 2.5;                                            // endless slow glide over the HUD floor
      stars.material.uniforms.time.value = lt; stars.rotation.z = lt * 0.006;
      st.camera.position.set(Math.sin(lt * 0.13) * 0.8, 1.2 + Math.sin(lt * 0.1) * 0.3, 12); st.camera.lookAt(0, -1.5, -20);
    };
    const warm = s.div('fill', { background: 'radial-gradient(ellipse at 50% 40%, rgba(233,185,85,.26) 0%, rgba(233,185,85,.07) 46%, rgba(0,0,0,0) 72%)' });
    s.tl.fromTo(warm, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, tQ);

    // header (typed)
    const HT = 'EK SAMAJHDAR AADMI KA SAWAL';
    const hd = s.div('mono cyan sh', { position: 'absolute', left: '310px', top: '124px', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em', display: 'flex', alignItems: 'center', gap: '20px' },
      `<svg width="54" height="48" viewBox="0 0 54 48"><path d="M5 4 H49 a4 4 0 0 1 4 4 V30 a4 4 0 0 1 -4 4 H24 L12 45 V34 H5 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 Z" fill="rgba(111,216,255,.14)" stroke="#6FD8FF" stroke-width="3" stroke-linejoin="round"/><circle cx="16" cy="19" r="3" fill="#6FD8FF"/><circle cx="27" cy="19" r="3" fill="#6FD8FF"/><circle cx="38" cy="19" r="3" fill="#6FD8FF"/></svg><span class="ht"></span>`);
    const ht = hd.querySelector('.ht'), th = Math.max(0.2, L('176', 2) - 0.1), pr = { n: 0 };
    show(s, hd, 0.15, tQ + 0.1, { opacity: 0, x: -24 }, 0.4);
    s.tl.to(pr, { n: HT.length, duration: Math.min(1.0, Math.max(0.4, L('177') - th - 0.2)), ease: 'none', onUpdate: () => { ht.textContent = HT.slice(0, Math.round(pr.n)) + (pr.n < HT.length ? '▍' : ''); } }, th);
    s.sfx('type', th, { dur: 0.9 });

    // the comment card: front = the objection (science blue), back = the Quran's own question (gold)
    const cardW = s.div(null, { position: 'absolute', left: '310px', top: '192px', width: '1300px', height: '420px' });
    const front = el('div', 'panel', { left: '0', top: '0', width: '1300px', height: '420px', borderColor: 'rgba(111,216,255,.5)', boxShadow: '0 30px 90px rgba(0,0,0,.6), 0 0 60px rgba(111,216,255,.12), inset 0 1px 0 rgba(255,255,255,.12)' });
    front.innerHTML = `<div style="position:absolute;left:0;top:34px;bottom:34px;width:7px;border-radius:0 4px 4px 0;background:#6FD8FF"></div>
      <div class="dots" style="position:absolute;left:66px;top:74px;display:flex;gap:14px">${[0, 1, 2].map(() => '<i style="display:block;width:20px;height:20px;border-radius:50%;background:#6FD8FF"></i>').join('')}</div>
      <div class="mont tx" style="position:absolute;left:66px;right:50px;top:50px;font-size:56px;font-weight:600;line-height:1.5;color:#F5F1E8"><div class="l1"></div><div class="l2"></div><div class="l3"></div></div>
      <div class="mono" style="position:absolute;right:40px;bottom:26px;font-size:20px;font-weight:700;letter-spacing:.3em;color:rgba(111,216,255,.55)">↩ JAWAB</div>
      <div style="position:absolute;left:92px;bottom:-25px;width:46px;height:46px;transform:rotate(45deg);background:#070c1a;border-right:1.5px solid rgba(111,216,255,.5);border-bottom:1.5px solid rgba(111,216,255,.5)"></div>`;
    const back = el('div', 'panel', { left: '0', top: '0', width: '1300px', height: '420px', background: 'linear-gradient(180deg, rgba(52,38,10,.94), rgba(18,12,3,.95))', borderColor: 'rgba(233,185,85,.85)', boxShadow: '0 0 0 2px rgba(233,185,85,.3), 0 0 130px rgba(233,185,85,.3), 0 30px 90px rgba(0,0,0,.6)' });
    back.innerHTML = `<div class="cinzel gold" style="position:absolute;left:0;right:0;top:40px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.5em">YEH SAWAL</div>
      <div class="orn" style="position:absolute;left:390px;top:92px"></div>
      <div class="bebas goldgrad" style="position:absolute;left:0;right:0;top:112px;text-align:center;font-size:152px;line-height:.94;padding-bottom:8px">QURAN NE<br>KHUD UTHAYA HAI</div>`;
    cardW.append(front, back);
    show(s, cardW, 0.2, null, { opacity: 0, y: 50, scale: 0.96 }, 0.6); s.sfx('pop', 0.25, { gain: 0.6 });
    gsap.set(back, { autoAlpha: 0 });
    const hlC = 'color:#8EE2FF;font-weight:800';
    const all = [
      ...typeLine(s, front.querySelector('.l1'), '177', ['“Theek', 'hai,', 'kainat', 'ki', 'shuruaat', 'hui.']),
      ...typeLine(s, front.querySelector('.l2'), '178', ['Lekin', 'is', 'se', 'Khuda', 'kaise', 'sabit', 'hua?'], { 3: 'k' }),
      ...typeLine(s, front.querySelector('.l3'), '179', ['Ho', 'sakta', 'hai', 'yeh', 'sab', 'khud', 'ba', 'khud', 'ho', 'gaya', 'ho.”'], { 5: 'c', 6: 'c', 7: 'c' }),
    ];
    front.querySelectorAll('.k').forEach((e) => { e.style.cssText += ';color:#F8DE9A;font-weight:800'; }); front.querySelectorAll('.c').forEach((e) => { e.style.cssText += ';' + hlC; });
    const dots = [...front.querySelectorAll('.dots i')], tType = L('177') - 0.1, tEndType = L('179e');
    s.onUpdate((lt) => {
      dots.forEach((dd, i) => { dd.style.opacity = lt < tType ? (0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(lt * 7 - i * 1.1), 2)).toFixed(3) : '0'; });
      let last = null; for (const [c, t] of all) { const on = lt >= t; c.style.opacity = on ? '1' : '0'; c.style.boxShadow = 'none'; if (on) last = c; }
      if (last && lt < tEndType + 0.5 && (lt < tEndType || (lt * 2.5) % 1 < 0.55)) last.style.boxShadow = '5px 0 0 #6FD8FF';
    });
    ['177', '178', '179'].forEach((id) => s.sfx('type', L(id), { dur: Math.max(0.4, T(id + 'e') - T(id) - 0.2), gain: 0.6 }));

    // "KHUD BA KHUD?"
    const kb = s.div('anton', { position: 'absolute', left: '0', right: '0', top: '672px', textAlign: 'center', fontSize: '236px', lineHeight: '1', color: '#fff', textShadow: '0 0 40px rgba(111,216,255,.35), 0 6px 30px rgba(0,0,0,.8)' },
      '<span class="k">KHUD</span> <span class="k">BA</span> <span class="k">KHUD</span><span class="k cyan" style="margin-left:.06em">?</span>');
    const ks = [...kb.querySelectorAll('.k')]; ks.forEach((k) => { k.style.display = 'inline-block'; });
    gsap.set(kb, { autoAlpha: 0 }); s.tl.set(kb, { autoAlpha: 1 }, L('179', 5) - 0.1);
    [L('179', 5), L('179', 6), L('179', 7), Math.min(L('179', 10) + 0.12, tOK - 0.5)].forEach((t, i) => {
      s.tl.fromTo(ks[i], { opacity: 0, scale: i === 3 ? 3 : 1.6, y: 24, rotate: i === 3 ? 24 : 0 }, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: i === 3 ? 0.26 : 0.3, ease: i === 3 ? 'power4.in' : 'power3.out' }, t - 0.06);
    });
    const tHit = Math.min(L('179', 10) + 0.12, tOK - 0.5) + 0.2; s.sfx('hit', tHit); shake(s, kb, tHit, 0.45, 12);
    s.tl.to(kb, { opacity: 0, scale: 0.92, y: 20, duration: 0.3, ease: 'power2.in' }, tOK - 0.22).set(kb, { autoAlpha: 0 }, tOK + 0.08);

    // "BOHAT ACHA SAWAL" ✓
    const ok = s.div(null, { position: 'absolute', left: '0', right: '0', top: '676px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' },
      `${TICK(170)}<div class="bebas sh" style="font-size:190px;line-height:1;padding-top:16px">BOHAT ACHA <span class="green">SAWAL</span></div>`);
    gsap.set(ok, { autoAlpha: 0 }); s.tl.set(ok, { autoAlpha: 1 }, tOK);
    s.tl.fromTo(ok.querySelector('svg'), { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2)' }, tOK);
    s.tl.fromTo(ok.querySelector('.ck'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, tOK + 0.2);
    sync(s, ok.querySelector('.bebas'), '180', { y: 40, dur: 0.4, ease: 'back.out(1.6)' });
    s.sfx('ding', tOK + 0.2);
    s.tl.to(ok, { opacity: 0, y: -16, duration: 0.3, ease: 'power2.in' }, tK - 0.2).set(ok, { autoAlpha: 0 }, tK + 0.1);

    // "Aur kamaal yeh hai ke yeh sawal…" → the card flips to gold
    const km = s.div('mont sh', { position: 'absolute', left: '0', right: '0', top: '716px', textAlign: 'center', fontSize: '74px', fontWeight: 800 }, 'Aur kamaal yeh hai ke <span style="color:#F2C968">yeh sawal…</span>');
    gsap.set(km, { autoAlpha: 0 }); s.tl.set(km, { autoAlpha: 1 }, tK + 0.1); sync(s, km, '181', { y: 26 });
    s.tl.to(km, { opacity: 0, duration: 0.3 }, tQ + 0.05).set(km, { autoAlpha: 0 }, tQ + 0.36);
    s.tl.to(front, { borderColor: 'rgba(242,201,104,.95)', boxShadow: '0 30px 90px rgba(0,0,0,.6), 0 0 90px rgba(233,185,85,.4), inset 0 1px 0 rgba(255,255,255,.12)', duration: 0.5 }, L('181', 5) - 0.1);
    s.tl.to(cardW, { scale: 1.04, duration: 0.5, ease: 'power2.out' }, L('181', 5) - 0.1);
    s.tl.to(front, { rotationY: 90, transformPerspective: 1800, duration: 0.34, ease: 'power2.in' }, tQ).set(front, { autoAlpha: 0 }, tQ + 0.34);
    s.tl.set(back, { autoAlpha: 1 }, tQ + 0.34).fromTo(back, { rotationY: -90, transformPerspective: 1800 }, { rotationY: 0, duration: 0.5, ease: 'back.out(1.4)' }, tQ + 0.34);
    s.tl.to(cardW, { y: 36, scale: 1.08, duration: 0.8, ease: 'power2.out' }, tQ + 0.34);
    s.sfx('whoosh', tQ, { gain: 0.7 }); s.sfx('shimmer', tQ + 0.4); flash(s, tQ + 0.34, { color: '#F8DE9A', peak: 0.3, dur: 0.7 });
    s.tl.to(cardW, { y: -34, scale: 0.94, duration: 0.5, ease: 'power2.inOut' }, t2 - 0.25);

    // "Sirf do ayaton mein" → 2 AYAAT
    const two = s.div(null, { position: 'absolute', left: '0', right: '0', top: '610px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '44px' },
      `<div class="mont sh a" style="font-size:54px;font-weight:800;letter-spacing:.34em;padding-top:30px">SIRF</div>
       <div class="anton goldgrad b" style="font-size:330px;line-height:1.08;padding:0 8px">2</div>
       <div class="c" style="padding-top:26px"><div class="bebas sh" style="font-size:170px;line-height:.9">AYAAT</div>
         <div style="display:flex;gap:16px;margin-top:10px"><span class="chip r1">${REF['52:35']}</span><span class="chip r2">${REF['52:36']}</span></div></div>`);
    gsap.set(two, { autoAlpha: 0 }); s.tl.set(two, { autoAlpha: 1 }, t2);
    s.tl.fromTo(two.querySelector('.a'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4 }, t2);
    s.tl.fromTo(two.querySelector('.b'), { opacity: 0, scale: 2.8 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'power4.in' }, L('183', 1) - 0.14);
    s.tl.fromTo(two.querySelector('.c .bebas'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.45 }, L('183', 2) - 0.08);
    s.tl.fromTo([two.querySelector('.r1'), two.querySelector('.r2')], { opacity: 0, y: 16, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.18, ease: 'back.out(2)' }, L('183', 2) + 0.15);
    s.sfx('hit', L('183', 1) + 0.1, { gain: 0.8 }); shake(s, two, L('183', 1) + 0.1, 0.4, 9);
    s.div('vig');
  }, { fin: 0.3, fout: 0.3, z: 3 });

  // ───────── G3  callback to the cold open's promise (card 03) → ✓ wada poora ─────────
  defScene('g3_wada', T('184'), T('185') + 0.02, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x02040b, fov: 50 }); const bd = spaceBackdrop(st, { gain: 0.5, seed: 31, rx: 0.4 });
    st.frame = (lt) => { bd.update(lt * 3 + 70); st.camera.position.set(0, 0, 10); st.camera.rotation.z = 0.2 + lt * 0.01; };
    s.div('scrim-all', { background: 'rgba(2,4,12,.5)' });
    const grp = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', transformOrigin: '1400px 500px' });
    grp.appendChild(el('div', 'cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '86px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.5em' }, 'AAJ KI VIDEO MEIN'));
    const cards = [
      { n: '01', title: '3 AYAAT', sub: 'jo kainat ki poori kahani<br>suna deti hain', icon: `<div style="font-family:'Cinzel',serif;font-weight:700;font-size:40px;letter-spacing:.12em;color:#F8DE9A;line-height:1.75">51 : 47<br>21 : 30<br>41 : 11</div>` },
      { n: '02', title: 'KABOOTAR', sub: 'jinhone do scientists ko<br><b style="color:#F8DE9A">Nobel Prize</b> dilwa diya', icon: `<svg width="230" height="190" viewBox="0 0 230 190"><g fill="#E9E4D8"><ellipse cx="112" cy="112" rx="66" ry="40" transform="rotate(-14 112 112)"/><circle cx="170" cy="62" r="25"/><path d="M192 56 L222 64 L193 72 Z"/><path d="M52 118 L4 150 L20 112 L6 96 Z"/><path d="M82 96 Q112 52 150 92 Q116 126 82 96 Z" fill="#B9B3A6"/><rect x="100" y="146" width="7" height="30"/><rect x="124" y="146" width="7" height="30"/></g><circle cx="176" cy="58" r="4.5" fill="#101010"/></svg>` },
      { n: '03', title: 'WOH SAWAL', sub: 'Quran ka — sirf <b style="color:#F8DE9A">2 ayaton</b> ka', icon: `<div class="anton glowg" style="font-size:190px;line-height:1;color:#F2C968">?</div>` },
    ].map((c, i) => {
      const p = el('div', 'panel', { left: (150 + i * 560) + 'px', top: '210px', width: '500px', height: '610px', textAlign: 'center' });
      p.innerHTML = `<div class="mono cyan" style="position:absolute;left:34px;top:26px;font-size:30px;font-weight:700">${c.n}</div>
        <div style="position:absolute;left:0;right:0;top:86px;height:230px;display:flex;align-items:center;justify-content:center">${c.icon}</div>
        <div class="bebas" style="position:absolute;left:0;right:0;top:350px;font-size:104px;color:#fff">${c.title}</div>
        <div class="mont" style="position:absolute;left:30px;right:30px;top:468px;font-size:33px;font-weight:600;line-height:1.3;color:rgba(245,241,232,.86)">${c.sub}</div>`;
      grp.appendChild(p); return p;
    });
    gsap.set([cards[0], cards[1]], { opacity: 0.26 });
    gsap.set(cards[2], { boxShadow: '0 0 0 3px rgba(233,185,85,.9), 0 0 90px rgba(233,185,85,.35)' });
    s.tl.fromTo(grp, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0).to(grp, { scale: 1.07, duration: Math.max(0.5, d - 0.55), ease: 'none' }, 0.55);
    s.sfx('whooshRev', 0, { dur: 0.5, gain: 0.7 });
    // ✓ wada poora — lands on "wada"
    const tw = Math.min(L('184', 5) - 0.1, d - 1.0);
    const tk = el('div', null, { position: 'absolute', right: '-44px', top: '-44px', width: '150px', height: '150px' }, TICK(150)); cards[2].appendChild(tk);
    const tg = el('div', 'tag green', { position: 'absolute', left: '50%', bottom: '34px', whiteSpace: 'nowrap', background: 'rgba(6,34,20,.85)', fontSize: '28px' }, 'WADA POORA'); cards[2].appendChild(tg);
    gsap.set(tg, { xPercent: -50 }); gsap.set([tk, tg], { autoAlpha: 0 });
    s.tl.set(tk, { autoAlpha: 1 }, tw).fromTo(tk, { scale: 2.6, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.24, ease: 'power4.in' }, tw);
    s.tl.fromTo(tk.querySelector('.ck'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, tw + 0.2);
    s.tl.set(tg, { autoAlpha: 1 }, tw + 0.3).fromTo(tg, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }, tw + 0.3);
    s.tl.to(cards[2], { boxShadow: '0 0 0 3px rgba(87,227,154,.9), 0 0 100px rgba(87,227,154,.32)', duration: 0.4 }, tw + 0.2);
    s.sfx('ding', tw + 0.22); shake(s, cards[2], tw + 0.24, 0.35, 8);
    cap(s, 'Ab <span class="hl">woh waqia</span> — jiska wada kiya tha', 0.05, d - 0.02, { bottom: 104, size: 52 });
    s.div('vig');
  }, { z: 1 });

  // ───────── G4  2 Hijri: globe → the Hejaz · Makkah → Madinah · JUBAYR BIN MUT'IM ─────────
  const tMap = T('186');
  defScene('g4_globe', T('185'), tMap + 0.5, (s) => {
    const d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x01030a, fov: 34 });
    const bd = spaceBackdrop(st, { gain: 0.34, seed: 19 });
    const e = earth(); st.scene.add(e); e.userData.sun.copy(latLon(6, 4));
    const pins = [[21.42, 39.83], [24.47, 39.61]].map(([la, lo]) => { const p = pin(0xf2c968, 0.014); p.position.copy(latLon(la, lo, 1.004)); p.lookAt(latLon(la, lo, 3)); e.add(p); return p; });
    const a0 = latLon(-4, 8), a1 = latLon(22.9, 40.0);
    st.frame = (lt) => {
      const k = ease.io3(clamp(lt / d)); bd.update(lt + 10);
      st.camera.position.copy(a0.clone().lerp(a1, k).normalize().multiplyScalar(lerp(3.5, 1.5, k))); st.camera.up.set(0, 1, 0); st.camera.lookAt(0, 0, 0);
      pins.forEach((p, i) => p.userData.update(lt + i * 0.4));
    };
    dateline(s, '2 HIJRI', 'JANG-E-BADR KE BAAD', 0.05, null);
    s.sfx('whoosh', 0, { gain: 0.8 }); s.sfx('type', 0.35, { dur: 0.8 });
    s.div('vig');
  }, { z: 1 });
  defScene('g4_map', tMap, T('189') + 0.02, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const MX = (lon) => (lon - 25) / 30 * 1920, MY = (lat) => (31.375 - lat) / 16.875 * 1080;          // g_hejaz.jpg: lon 25..55, lat 31.375..14.5
    const mk = [MX(39.83), MY(21.42)], md = [MX(39.61), MY(24.47)], bdr = [MX(38.79), MY(23.78)], sea = [MX(38.0), MY(21.2)];
    const F = [(mk[0] + md[0]) / 2, (mk[1] + md[1]) / 2], C = [bdr[0] - 26, F[1] + 6];
    const tJ = L('186', 9) - 0.1, tArr = Math.max(tJ + 0.6, L('186', 12));
    const map = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', transformOrigin: '0 0' });
    map.appendChild(image('/gfx/img/g_hejaz.jpg', { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' }));
    const view = (lt) => { const k = ease.out3(clamp(lt / Math.max(3, tArr + 0.6))), S = lerp(1.1, 2.5, k) + lt * 0.012; return { S, tx: lerp(1010, 1250, k) - F[0] * S, ty: lerp(540, 566, k) - F[1] * S }; };
    s.div('scrim-l', { width: '56%' });
    // route + pins (screen space, re-projected every frame)
    const N = 30, ov = svg(s, `<path class="rl" d="" fill="none" stroke="rgba(242,201,104,.22)" stroke-width="10" stroke-linecap="round"/>` + Array.from({ length: N }, () => '<circle r="5" fill="#FFE9B0"/>').join('') + '<circle class="hd" r="11" fill="#fff" style="filter:none"/>');
    const dts = [...ov.querySelectorAll('circle:not(.hd)')], hdot = ov.querySelector('.hd'), rl = ov.querySelector('.rl');
    const bz = (t) => { const u = 1 - t; return [u * u * mk[0] + 2 * u * t * C[0] + t * t * md[0], u * u * mk[1] + 2 * u * t * C[1] + t * t * md[1]]; };
    const mkPin = (label, sub) => {
      const p = s.div(null, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' });
      p.innerHTML = `<div class="in" style="position:absolute;left:0;top:0"><div class="ring" style="position:absolute;left:-44px;top:-44px;width:88px;height:88px;border-radius:50%;border:3px solid #F2C968"></div>
        <div style="position:absolute;left:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#FFF3D2;box-shadow:0 0 22px 8px rgba(242,201,104,.8)"></div>
        <div style="position:absolute;left:40px;top:-36px;white-space:nowrap"><div class="bebas sh" style="font-size:70px;line-height:1">${label}</div>${sub}</div></div>`;
      return p;
    };
    const pM = mkPin('MAKKAH', `<div class="mono sh" style="font-size:22px;font-weight:700;letter-spacing:.26em;color:#F8DE9A;margin-top:2px">QURAYSH</div><div class="mono sh mt" style="font-size:22px;font-weight:700;letter-spacing:.16em;color:rgba(245,241,232,.9);margin-top:8px">SARDAR · MUT'IM BIN ADI</div>`);
    const pD = mkPin('MADINAH', '');
    const bd = s.div('mono sh', { position: 'absolute', left: '0', top: '0', fontSize: '20px', fontWeight: 700, letterSpacing: '.24em', color: 'rgba(245,241,232,.6)', whiteSpace: 'nowrap' }, '<span style="color:#F2C968">◆</span> BADR');
    const sl = s.div('serif', { position: 'absolute', left: '0', top: '0', fontSize: '40px', fontStyle: 'italic', letterSpacing: '.5em', color: 'rgba(150,200,240,.5)', whiteSpace: 'nowrap' }, 'RED SEA');
    const km = s.div(null, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' }, `<div class="in tag sh" style="position:absolute;right:26px;top:-24px;white-space:nowrap;color:#F8DE9A;background:rgba(10,8,2,.6);font-size:24px">≈ 340 KM</div>`);
    s.onUpdate((lt) => {
      const v = view(lt), P = (p) => [v.tx + p[0] * v.S, v.ty + p[1] * v.S];
      map.style.transform = `translate(${v.tx.toFixed(2)}px, ${v.ty.toFixed(2)}px) scale(${v.S.toFixed(4)})`;
      const a = P(mk), b = P(md), c = P(bdr), e2 = P(sea), m = P(bz(0.5));
      pM.style.transform = `translate(${a[0].toFixed(1)}px, ${a[1].toFixed(1)}px)`; pD.style.transform = `translate(${b[0].toFixed(1)}px, ${b[1].toFixed(1)}px)`;
      bd.style.transform = `translate(${(c[0] - 150).toFixed(1)}px, ${(c[1] - 14).toFixed(1)}px)`; sl.style.transform = `translate(${(e2[0] - 120).toFixed(1)}px, ${e2[1].toFixed(1)}px) rotate(57deg)`;
      km.style.transform = `translate(${m[0].toFixed(1)}px, ${m[1].toFixed(1)}px)`;
      [pM, pD].forEach((p, i) => { const k = (lt * 0.8 + i * 0.5) % 1, r = p.querySelector('.ring'); r.style.transform = `scale(${(0.35 + 1.1 * k).toFixed(3)})`; r.style.opacity = (1 - k).toFixed(3); });
      const pr = smooth(tJ, tArr, lt); let dp = '';
      dts.forEach((dt, i) => { const t = (i + 0.5) / N, q = P(bz(t)); dt.setAttribute('cx', q[0].toFixed(1)); dt.setAttribute('cy', q[1].toFixed(1)); dt.setAttribute('opacity', t <= pr ? '1' : '0'); if (t <= pr + 1 / N) dp += (dp ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); });
      rl.setAttribute('d', pr > 0.03 ? dp : ''); const h = P(bz(pr)); hdot.setAttribute('cx', h[0].toFixed(1)); hdot.setAttribute('cy', h[1].toFixed(1)); hdot.setAttribute('opacity', pr > 0 && pr < 1 ? '1' : '0');
    });
    // Makkah first, then Mut'im, then the journey
    show(s, pM.querySelector('.in'), 0.1, null, { opacity: 0, scale: 0.4 }, 0.5); s.sfx('pop', 0.15);
    const mt = pM.querySelector('.mt'); show(s, mt, Math.max(0.5, L('186', 3) - 0.1), null, { opacity: 0, x: -16 }, 0.4);
    show(s, pD.querySelector('.in'), tArr - 0.12, null, { opacity: 0, scale: 0.4 }, 0.5); s.sfx('chime', tArr - 0.05, { gain: 0.8 });
    show(s, km.querySelector('.in'), tArr + 0.25, null, { opacity: 0, x: 16 }, 0.4);
    s.sfx('whoosh', tJ, { gain: 0.5, dur: Math.min(1.4, tArr - tJ) });
    // dateline carries over from the globe (already typed there)
    s.div('dl', null, '<div class="yr sh">2 HIJRI</div><div class="rule"></div><div class="pl sh">JANG-E-BADR KE BAAD</div>');
    // name plate + the three facts
    const np = s.div(null, { position: 'absolute', left: '110px', top: '448px', width: '860px' });
    np.innerHTML = `<div class="bar" style="position:absolute;left:-26px;top:6px;height:128px;width:6px;background:var(--gold);transform-origin:50% 100%"></div>
      <div class="bebas sh nm" style="font-size:136px;line-height:.95;letter-spacing:.02em">JUBAYR BIN MUT'IM</div>
      ${['Quraysh ke sardar ka beta', 'Qaidiyon ko chhudwane aaya', 'Abhi <b style="color:#8EE2FF">Musalman nahi</b>'].map((t, i) => `<div class="row mont sh" style="display:flex;align-items:center;gap:20px;margin-top:${i ? 14 : 26}px;font-size:42px;font-weight:700"><span style="display:inline-block;width:14px;height:14px;transform:rotate(45deg);background:${i === 2 ? '#6FD8FF' : '#E9B955'}"></span><span>${t}</span></div>`).join('')}`;
    const rows = [...np.querySelectorAll('.row')]; gsap.set([np, ...rows], { autoAlpha: 0 });
    s.tl.set(np, { autoAlpha: 1 }, tJ).fromTo(np.querySelector('.bar'), { scaleY: 0 }, { scaleY: 1, duration: 0.4 }, tJ);
    s.tl.fromTo(words(np.querySelector('.nm')), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.09, ease: 'power3.out' }, tJ + 0.04);
    [tJ + 0.55, L('187') - 0.05, L('188') - 0.05].forEach((t, i) => { s.tl.set(rows[i], { autoAlpha: 1 }, t).fromTo(rows[i], { opacity: 0, x: -34 }, { opacity: 1, x: 0, duration: 0.45 }, t); s.sfx('tick', t + 0.05); });
    s.div('vig');
  }, { fin: 0.5, z: 2 });

  // ───────── G5  Maghrib · the recitation of Surah At-Tur travels through the dusk ─────────
  const tAy = TW('192', 6) - 0.2;                     // "…Surah Tur ki" → the ayah card starts coming in
  defScene('g5_maghrib', T('189'), tAy + 0.7, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    footage(s, 'g_sky', { n: SKY_N, start: SKY_N - 1, speed: -clamp(250 / (d * 30), 0.45, 1), kb: { s0: 1.16, s1: 1.24, y0: 7, y1: 9 } });
    const warm = s.div('fill', { background: 'linear-gradient(0deg, rgba(255,112,36,.62) 0%, rgba(255,140,60,.40) 20%, rgba(214,92,110,.16) 44%, rgba(0,0,0,0) 68%)', mixBlendMode: 'screen' });
    const cool = s.div('fill', { background: 'linear-gradient(180deg, rgba(4,10,34,.62) 0%, rgba(4,10,34,.18) 46%, rgba(0,0,0,0) 70%)' });
    s.onUpdate((lt) => { warm.style.opacity = (1 - 0.72 * smooth(d * 0.12, d * 0.95, lt)).toFixed(3); cool.style.opacity = (0.55 + 0.45 * smooth(0, d, lt)).toFixed(3); });
    // recitation ripples rising from beyond the horizon (no source shown)
    const NR = 9, RM = 1500, rp = svg(s, Array.from({ length: NR }, () => '<circle cx="960" cy="1010" r="10" fill="none" stroke="#F2C968" stroke-width="2.5"/>').join(''));
    const rings = [...rp.querySelectorAll('circle')], tR = L('190', 6) - 0.2;
    s.onUpdate((lt) => {
      const vis = smooth(tR, tR + 1.2, lt), boost = 1 + 0.6 * smooth(L('192') - 0.2, L('192') + 1.2, lt);
      rings.forEach((r, i) => { const rr = (((lt - tR) * 150 + i * (RM / NR)) % RM + RM) % RM; r.setAttribute('r', rr.toFixed(1)); r.setAttribute('stroke-opacity', (lt - tR > (i * (RM / NR) - rr) / 150 ? vis * boost * 0.55 * Math.pow(1 - rr / RM, 1.3) * smooth(0, 160, rr) : 0).toFixed(3)); });
    });
    grove(s, [[150, 950, 520, 46, 1.25], [330, 935, 380, -30, 1.0], [520, 950, 250, 18, 0.72], [1470, 940, 300, -22, 0.8], [1640, 945, 470, 38, 1.15], [1820, 950, 560, -50, 1.3], [820, 928, 120, 6, 0.36], [1130, 922, 100, -5, 0.3], [1230, 924, 132, 8, 0.38]], { seed: 11 });
    s.div('fill', { background: 'linear-gradient(180deg, rgba(2,4,10,.5) 0%, rgba(2,4,10,0) 26%)' });
    dateline(s, 'MAGHRIB', 'KA WAQT · MADINAH', 0.08, tAy - s.t0 + 0.3);
    s.sfx('swell', 0, { dur: 2.2, gain: 0.7 });
    // "Aap ﷺ — Surah At-Tur ki tilawat"
    const tx = s.div(null, { position: 'absolute', left: '0', right: '0', top: '300px', textAlign: 'center' });
    tx.innerHTML = `<div class="play sh a" style="font-size:112px;font-style:italic;font-weight:700;color:#FFF3D2;line-height:1.1">Aap <span class="ar2 glowg" style="font-size:132px;color:#F2C968;font-style:normal;font-weight:400">${AR.saw}</span></div>
      <div class="orn" style="margin:20px auto 0;width:560px"></div>
      <div class="cinzel sh b" style="font-size:54px;font-weight:700;letter-spacing:.22em;margin-top:30px;color:#fff"><span class="gold">SURAH AT-TUR</span> KI TILAWAT</div>
      <div class="wv" style="margin:26px auto 0;width:760px;height:90px"></div>`;
    const t0 = L('190') - 0.1, t1 = L('192') - 0.1;
    gsap.set(tx, { autoAlpha: 0 }); s.tl.set(tx, { autoAlpha: 1 }, t0);
    s.tl.fromTo(tx.querySelector('.a'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, t0);
    s.tl.fromTo(tx.querySelector('.orn'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, t0 + 0.3);
    s.tl.fromTo(words(tx.querySelector('.b')), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 }, L('190', 6) - 0.1);
    s.tl.to(tx, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, t1 - 0.3).set(tx, { autoAlpha: 0 }, t1 + 0.1);
    s.sfx('shimmer', t0, { gain: 0.7 });
    // live "voice" waveform under the line (gold bars)
    const NB = 64, wv = tx.querySelector('.wv'); wv.innerHTML = `<svg width="760" height="90" viewBox="0 0 760 90"><path d="" fill="none" stroke="#F2C968" stroke-width="5" stroke-linecap="round"/></svg>`; const wp = wv.querySelector('path');
    s.onUpdate((lt) => {
      if (lt < tR - 0.2 || lt > t1 + 0.2) return; const on = smooth(tR, tR + 0.6, lt); let p = '';
      for (let i = 0; i < NB; i++) { const e = Math.sin(Math.PI * (i + 0.5) / NB), a = 3 + 40 * on * e * Math.pow(0.5 + 0.5 * noise1(lt * 3.1 + i * 0.37, 4), 1.4) * (0.6 + 0.4 * noise1(lt * 1.3, 8)); const x = 6 + i * (748 / (NB - 1)); p += `M ${x.toFixed(1)} ${(45 - a).toFixed(1)} L ${x.toFixed(1)} ${(45 + a).toFixed(1)} `; }
      wp.setAttribute('d', p);
    });
    // Jubayr is listening
    const tj = L('191') - 0.1, lt3 = lowerThird(s, 'JUBAYR', 'sun raha hai', tj, d - 0.1, { bottom: 196 });
    const ear = s.div(null, { position: 'absolute', left: '452px', top: '766px', width: '0', height: '0' }, [0, 1, 2].map(() => '<i style="position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:3px solid #F2C968;display:block"></i>').join(''));
    const er = [...ear.querySelectorAll('i')];
    s.onUpdate((lt) => er.forEach((r, i) => { const k = ((lt - tj) * 0.7 + i / 3) % 1; r.style.transform = `scale(${(1.3 - 1.05 * k).toFixed(3)})`; r.style.opacity = (lt > tj + 0.3 ? 0.8 * Math.sin(Math.PI * k) : 0).toFixed(3); }));
    s.sfx('pop', tj + 0.1, { gain: 0.5 });
    cap(s, 'Aur phir <span class="hl">yeh ayat</span> aati hai…', L('192') + 0.02, d - 0.05, { bottom: 96, size: 54 });
    s.sfx('riser', Math.max(0, tAy - s.t0 - 1.6), { dur: 1.6, gain: 0.5 });
    s.div('vig');
  }, { z: 1 });

  // ───────── G6  the two ayaat (52:35–36): each question lights its part of the Arabic ─────────
  defScene('g6_ayah', tAy, T('197') + 0.35, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    footage(s, 'g_sky', { n: SKY_N, start: 285, speed: -clamp(250 / (d * 30), 0.45, 1), kb: { s0: 1.24, s1: 1.36, y0: 9, y1: 11 } });
    s.div('fill', { background: 'linear-gradient(180deg, rgba(4,10,34,.5) 0%, rgba(4,10,34,.12) 50%, rgba(0,0,0,0) 72%)' });
    grove(s, [[120, 1010, 430, 40, 1.2], [300, 1000, 290, -26, 0.9], [1650, 1004, 330, 30, 0.95], [1830, 1012, 470, -44, 1.25]], { seed: 23, dune: 'M -10 1090 L -10 985 C 300 962 620 1010 960 1000 S 1600 962 1930 988 L 1930 1090 Z' });
    const wrap = s.div('ayah-wrap');
    const gbg = el('div', null, { position: 'absolute', left: '50%', top: '50%', width: '1800px', height: '1000px', marginLeft: '-900px', marginTop: '-500px', background: 'radial-gradient(ellipse at 50% 50%, rgba(3,6,14,.92) 0%, rgba(3,6,14,.76) 45%, rgba(3,6,14,0) 72%)' });
    const inner = el('div', null, { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' });
    wrap.append(gbg, inner);
    const ref = el('div', 'ayah-ref sh', null, REF['52:35'] + ' – 36'), o1 = el('div', 'orn', { marginTop: '16px' }), o2 = el('div', 'orn', { marginTop: '4px' });
    // one span per word (a pause mark stays attached to the word it follows, exactly as in the plain text)
    const mkAr = (txt) => {
      const a = el('div', 'ayah-ar glowg', { fontSize: '88px', lineHeight: '1.8', marginTop: '0' }), toks = [];
      for (const w of txt.split(/\s+/)) { if (toks.length && /^[ۖ-ۭ]+$/.test(w)) toks[toks.length - 1] += ' ' + w; else toks.push(w); }
      return [a, toks.map((w) => { const sp = el('span', 'aw', null, w); a.appendChild(sp); a.appendChild(document.createTextNode(' ')); return sp; })];
    };
    const [ar1, w1] = mkAr(Q['52:35']), [ar2, w2] = mkAr(Q['52:36']);
    inner.append(ref, o1, ar1, ar2, o2);
    const TR = ['“Kya yeh <span class="hl">kisi cheez ke baghair</span> hi paida ho gaye?', 'Ya yeh <span class="hl">khud apne khaliq</span> hain?', 'Ya inhone <span class="hl">aasmanon aur zameen</span> ko paida kiya hai?', 'Nahi — balke yeh <span class="hl">yaqeen hi nahi rakhte.</span>”'];
    const lines = TR.map((h, i) => { const dv = el('div', 'ayah-tr sh', { fontSize: '43px', marginTop: i ? '10px' : '24px', padding: '0 160px' }, h); inner.appendChild(dv); return dv; });
    const all = [...w1, ...w2], groups = [w1.slice(0, 5), w1.slice(5), w2.slice(0, 4), w2.slice(4)];
    const tQ1 = L('193') - 0.1, rev = Math.max(0.5, tQ1 - 0.75), wd = Math.min(0.7, rev * 0.5);
    s.tl.fromTo(gbg, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0);
    s.tl.fromTo(ref, { opacity: 0, y: -16, letterSpacing: '0.7em' }, { opacity: 1, y: 0, letterSpacing: '0.34em', duration: 0.8, ease: 'power2.out' }, 0.15);
    s.tl.fromTo([o1, o2], { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, 0.25);
    s.tl.fromTo(all, { opacity: 0, y: 20, scale: 1.1 }, { opacity: 1, y: 0, scale: 1, duration: wd, ease: 'power2.out', stagger: (rev - wd) / all.length }, 0.55);
    s.sfx('shimmer', 0.5, { gain: 0.9 }); s.sfx('swell', 0.1, { dur: 2.2, gain: 0.6 });
    groups.forEach((g, i) => {
      const id = String(193 + i), t = Math.max(0.55 + rev + 0.05, L(id) - 0.1);
      s.tl.to(all.filter((x) => !g.includes(x)), { opacity: 0.3, color: '#FFF7E2', scale: 1, duration: 0.45, ease: 'power2.out' }, t);
      s.tl.to(g, { opacity: 1, color: '#F6CF6B', scale: 1.07, duration: 0.45, ease: 'power2.out' }, t);
      sync(s, lines[i], id, { y: 16 });
      if (i) s.tl.to(lines[i - 1], { opacity: 0.5, duration: 0.4 }, t);
      s.sfx('chime', t, { gain: 0.45 });
    });
    const tEnd = Math.min(L('196e') + 0.15, d - 0.9);
    s.tl.to(all, { opacity: 1, color: '#FFF7E2', scale: 1, duration: 0.6 }, tEnd).to(lines, { opacity: 1, duration: 0.6 }, tEnd);
    s.tl.to(wrap, { scale: 1.035, duration: d, ease: 'none' }, 0);
    s.div('vig');
  }, { fin: 0.7, fout: 0.35, z: 2 });

  // ───────── G7  "Qareeb tha ke mera dil ud jaye" · Sahih al-Bukhari 4854 ─────────
  defScene('g7_dil', T('197'), T('199') + 0.02, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tDil = L('198', 9), tLift = Math.min(L('198', 10) - 0.05, d - 0.9), yB = 900, xL = 1130;
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, #101a34 0%, #05070f 58%, #000 100%)' });
    const st = stage3d(s, { fov: 50 }); const stars = starfield({ count: 2000, radius: 300, seed: 33, px: 2.4 }); st.scene.add(stars);
    st.frame = (lt) => { stars.rotation.z = lt * 0.01; stars.material.uniforms.time.value = lt; st.camera.position.z = 10 - lt * 0.3; };
    // beats: calm → racing; the last one lands on "dil"
    const beats = []; { let t = 0.45; while (t < tDil - 0.42) { beats.push([t, lerp(58, 104, smooth(L('198') - 0.5, tDil, t))]); t += lerp(0.98, 0.5, smooth(L('198') - 1.2, tDil, t)); } beats.push([tDil, 150]); }
    const xOf = (t) => xL * t / tLift, pts = [[0, yB]];
    for (const [t, h] of beats) { const x = xOf(t); pts.push([x - 40, yB], [x - 30, yB - 9], [x - 20, yB], [x - 9, yB], [x, yB - h], [x + 11, yB + h * 0.36], [x + 20, yB], [x + 32, yB - 15], [x + 46, yB]); }
    pts.push([xL, yB]);
    const dE = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const FLY = `M ${xL} ${yB} C ${xL + 190} ${yB} ${xL + 350} ${yB - 30} ${xL + 430} ${yB - 130} C ${xL + 520} ${yB - 250} ${xL + 480} ${yB - 380} ${xL + 590} ${yB - 470} C ${xL + 680} ${yB - 545} ${xL + 720} ${yB - 690} ${xL + 880} ${yB - 830}`;
    const pulse = s.div('fill', { background: 'radial-gradient(ellipse at 50% 78%, rgba(255,60,60,.34) 0%, rgba(255,60,60,.08) 40%, rgba(0,0,0,0) 66%)' });
    const g = svg(s, `<defs><clipPath id="g7c"><rect x="-10" y="0" width="0" height="1080"/></clipPath></defs>
      <line x1="0" y1="${yB}" x2="1920" y2="${yB}" stroke="rgba(255,91,91,.14)" stroke-width="2" stroke-dasharray="4 14"/>
      <g clip-path="url(#g7c)"><path d="${dE}" fill="none" stroke="rgba(255,91,91,.2)" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/><path d="${dE}" fill="none" stroke="#FF5B5B" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/></g>
      <path class="f0" d="${FLY}" fill="none" stroke="rgba(255,120,110,.2)" stroke-width="16" stroke-linecap="round"/><path class="f1" d="${FLY}" fill="none" stroke="#FF7A6E" stroke-width="5.5" stroke-linecap="round"/>
      <circle class="hd" r="9" fill="#fff"/><circle class="hg" r="26" fill="rgba(255,110,100,.35)"/>
      <g class="bird"><path class="wg" d="M -40 -12 Q -18 -30 0 0 Q 18 -30 40 -12" fill="none" stroke="#FFE2DC" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`);
    const rect = g.querySelector('#g7c rect'), f0 = g.querySelector('.f0'), f1 = g.querySelector('.f1'), hd = g.querySelector('.hd'), hg = g.querySelector('.hg'), bird = g.querySelector('.bird'), wg = g.querySelector('.wg');
    const fl = f1.getTotalLength(), fd = Math.max(0.6, Math.min(1.5, d - tLift - 0.05));
    [f0, f1].forEach((p) => { p.style.strokeDasharray = `${fl} ${fl}`; });
    const yAt = (x) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * ((x - a[0]) / Math.max(0.001, b[0] - a[0])); } return yB; };
    s.onUpdate((lt) => {
      let pu = 0; for (const [t, h] of beats) if (lt >= t) pu = Math.max(pu, Math.exp(-(lt - t) / 0.28) * h / 100);
      pulse.style.opacity = (0.22 + 0.78 * Math.min(1, pu)).toFixed(3);
      const x = Math.min(xL, xOf(lt)); rect.setAttribute('width', (x + 10).toFixed(1));
      const k = clamp((lt - tLift) / fd), p = k * k * (3 - 2 * k) * 0.55 + k * 0.45, off = fl * (1 - p);
      f0.style.strokeDashoffset = off.toFixed(1); f1.style.strokeDashoffset = off.toFixed(1); f0.style.opacity = f1.style.opacity = k > 0 ? '1' : '0';
      let hx = x, hy = yAt(x), ang = 0;
      if (k > 0) { const q = f1.getPointAtLength(fl * p), q2 = f1.getPointAtLength(Math.min(fl, fl * p + 6)); hx = q.x; hy = q.y; ang = Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI; }
      hd.setAttribute('cx', hx.toFixed(1)); hd.setAttribute('cy', hy.toFixed(1)); hg.setAttribute('cx', hx.toFixed(1)); hg.setAttribute('cy', hy.toFixed(1));
      hd.setAttribute('opacity', k > 0.04 ? '0' : '1'); hg.setAttribute('opacity', k > 0.04 ? '0' : '1');
      const fp = Math.sin((lt - tLift) * 17), by = -16 - 14 * fp;
      bird.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${(ang * 0.6 + 8).toFixed(1)}) scale(${(0.5 + 0.7 * smooth(0, 0.25, k)).toFixed(3)})`);
      wg.setAttribute('d', `M -40 ${by.toFixed(1)} Q -18 ${(by - 14).toFixed(1)} 0 0 Q 18 ${(by - 14).toFixed(1)} 40 ${by.toFixed(1)}`); bird.setAttribute('opacity', k > 0.02 ? '1' : '0');
    });
    beats.forEach(([t, h]) => s.sfx('heartbeat', t, { gain: 0.5 + h / 150 })); s.sfx('flutter', tLift, { gain: 1 }); s.sfx('whoosh', tLift + 0.1, { gain: 0.5 });
    flash(s, tDil, { color: '#FF5B5B', peak: 0.16, dur: 0.5 });
    // who says it + source
    lowerThird(s, "JUBAYR BIN MUT'IM", 'kehte hain —', 0.12, d, { style: { top: '96px', bottom: 'auto' } });
    const src = s.div(null, { position: 'absolute', left: '110px', top: '250px', display: 'flex', alignItems: 'center', gap: '18px' },
      `<svg width="46" height="40" viewBox="0 0 46 40"><path d="M23 8 C17 3 8 3 2 6 V36 C8 33 17 33 23 38 C29 33 38 33 44 36 V6 C38 3 29 3 23 8 Z M23 8 V38" fill="rgba(233,185,85,.12)" stroke="#E9B955" stroke-width="2.6" stroke-linejoin="round"/></svg><span class="tag gold sh" style="background:rgba(16,11,3,.6);font-size:26px">SAHIH AL-BUKHARI · 4854</span>`);
    show(s, src, Math.max(0.5, L('197', 5) - 0.1), null, { opacity: 0, x: -30 }, 0.5); s.sfx('paper', Math.max(0.5, L('197', 5) - 0.1), { gain: 0.6 });
    // the phrase: Arabic words on their spoken words, then the Roman-Urdu
    const arW = AR.hadith_qalbi.split(/\s+/);
    const ar = s.div('ar2 glowg', { position: 'absolute', left: '0', right: '0', top: '296px', textAlign: 'center', fontSize: '176px', lineHeight: '1.5', color: '#FFF3D2' }, arW.map((w) => `<span style="display:inline-block;margin:0 .12em">${w}</span>`).join(' '));
    [...ar.children].forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: 26, scale: 1.12 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, L('198', i) - 0.1));
    const tl8 = s.div('cinzel sh', { position: 'absolute', left: '0', right: '0', top: '562px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.42em', color: 'rgba(248,222,154,.8)' }, 'KAADA QALBI AN YATIR');
    sync(s, tl8, '198', { y: 8 });
    s.sfx('shimmer', L('198') - 0.1, { gain: 0.9 });
    const ur = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '634px', textAlign: 'center', fontSize: '88px', fontStyle: 'italic', fontWeight: 700, color: '#fff' }, '“Qareeb tha ke mera <span style="color:#FF6B6B">dil ud jaye.</span>”');
    sync(s, ur, '198', { from: 5, y: 22 });
    s.tl.to(ar, { scale: 1.04, duration: d, ease: 'none' }, 0);
    s.div('vig');
  }, { fin: 0.35, z: 1 });

  // ───────── G8  KYUN? → in do ayaton mein aisa kya hai → DHYAN SE SUNIYE (hand-over to the four doors) ─────────
  defScene('g8_kyun', T('199'), P1 + 0.3, (s) => {
    const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0, d = s.t1 - s.t0;
    const tA = L('200') - 0.1, tD = L('201') - 0.1, tG = Math.min(L('201', 4) - 0.1, d - 2.0);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, #0a1730 0%, #03060f 60%, #000 100%)' });
    const st = stage3d(s, { fov: 50 }); const stars = starfield({ count: 2200, radius: 300, seed: 52, px: 2.4 }); st.scene.add(stars);
    st.frame = (lt) => { stars.rotation.z = lt * 0.012; stars.material.uniforms.time.value = lt; st.camera.position.z = 10 - lt * 0.35; };
    const warm = s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, rgba(233,185,85,.24) 0%, rgba(233,185,85,.06) 46%, rgba(0,0,0,0) 72%)' });
    s.tl.fromTo(warm, { opacity: 0 }, { opacity: 1, duration: 0.9 }, tG);
    // four slits of light — the four doors of the next part
    const slits = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px' }, [0, 1, 2, 3].map((i) => `<i style="position:absolute;left:${372 + i * 392 - 4}px;top:150px;width:8px;height:780px;display:block;background:linear-gradient(180deg, rgba(248,222,154,0) 0%, rgba(248,222,154,.95) 22%, rgba(255,246,214,1) 50%, rgba(248,222,154,.95) 78%, rgba(248,222,154,0) 100%);box-shadow:0 0 50px 14px rgba(233,185,85,.35)"></i>`).join(''));
    const sl = [...slits.querySelectorAll('i')], tS = d - 1.25;
    s.tl.fromTo(sl, { opacity: 0, scaleY: 0.2, scaleX: 1 }, { opacity: 0.85, scaleY: 1, scaleX: 3.2, duration: 1.2, stagger: 0.07, ease: 'power2.out' }, tS);
    // KYUN?
    const ky = s.div('anton', { position: 'absolute', left: '0', right: '0', top: '300px', textAlign: 'center', fontSize: '450px', lineHeight: '1', color: '#fff', textShadow: '0 8px 50px rgba(0,0,0,.8)' }, 'KYUN<span class="gold glowg">?</span>');
    s.tl.fromTo(ky, { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, 0);
    s.sfx('hit', 0.2, { gain: 1.1 }); shake(s, ky, 0.2, 0.45, 16); flash(s, 0.18, { peak: 0.3, dur: 0.4 });
    s.tl.to(ky, { scale: 0.3, y: -322, duration: 0.6, ease: 'power3.inOut' }, tA - 0.15);
    // the two ayaat under the scanner
    const ay = s.div(null, { position: 'absolute', left: '210px', top: '322px', width: '1500px' });
    ay.innerHTML = [['52:35'], ['52:36']].map(([k]) => `<div class="rw" style="position:relative;display:flex;align-items:center;justify-content:space-between;gap:30px;height:178px;margin-bottom:22px;padding:0 44px;border:1.5px solid rgba(233,185,85,.5);border-radius:14px;background:linear-gradient(90deg, rgba(40,29,8,.5), rgba(10,8,3,.62))">
      <span class="cinzel gold" style="font-size:30px;font-weight:700;letter-spacing:.2em;white-space:nowrap">${k.replace(':', ' : ')}</span><span class="ar glowg" style="font-size:74px;line-height:1.6;color:#FFF3D2;white-space:nowrap">${Q[k]}</span></div>`).join('') +
      `<div class="sc" style="position:absolute;left:-30px;right:-30px;top:0;height:5px;background:#8EE2FF;box-shadow:0 0 30px 8px rgba(111,216,255,.6)"></div>`;
    const rws = [...ay.querySelectorAll('.rw')], sc = ay.querySelector('.sc');
    gsap.set(ay, { autoAlpha: 0 }); s.tl.set(ay, { autoAlpha: 1 }, tA);
    s.tl.fromTo(rws, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.16, ease: 'power3.out' }, Math.max(tA, L('200', 1) - 0.12));
    const tSc = Math.max(tA + 0.5, L('200', 4) - 0.15), dSc = Math.max(0.5, tD - tSc - 0.2);
    s.tl.fromTo(sc, { opacity: 0, y: -10 }, { opacity: 1, y: 388, duration: dSc, ease: 'power1.inOut' }, tSc).to(sc, { opacity: 0, duration: 0.15 }, tSc + dSc - 0.15);
    s.sfx('whoosh', Math.max(tA, L('200', 1) - 0.12), { gain: 0.5 }); s.sfx('riser', tSc, { dur: dSc, gain: 0.6 });
    const q2 = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '752px', textAlign: 'center', fontSize: '118px' }, 'IN DO AYATON MEIN <span class="gold">AISA KYA HAI?</span>');
    gsap.set(q2, { autoAlpha: 0 }); s.tl.set(q2, { autoAlpha: 1 }, tA); sync(s, q2, '200', { y: 30, dur: 0.4 });
    s.tl.to([ay, q2, ky], { opacity: 0, duration: 0.22, ease: 'power2.in' }, tD - 0.2).set([ay, q2, ky], { autoAlpha: 0 }, tD + 0.02);
    // pattern interrupt: bars close in, DHYAN SE SUNIYE (cyan → gold)
    const bt = s.div(null, { position: 'absolute', left: '0', right: '0', top: '0', height: '150px', background: '#000', transformOrigin: '50% 0' }), bb = s.div(null, { position: 'absolute', left: '0', right: '0', bottom: '0', height: '150px', background: '#000', transformOrigin: '50% 100%' });
    s.tl.fromTo([bt, bb], { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power4.out' }, tD); s.sfx('slam', tD + 0.05, { gain: 0.8 });
    const HL = 'DHYAN SE SUNIYE', hs = { position: 'absolute', left: '0', right: '0', top: '286px', textAlign: 'center', fontSize: '300px', lineHeight: '1', whiteSpace: 'nowrap' };
    const h1 = s.div('bebas glowc', { ...hs, color: '#C9F1FF' }, HL), h2 = s.div('bebas goldgrad', { ...hs, paddingBottom: '10px' }, HL);
    gsap.set([h1, h2], { autoAlpha: 0 }); s.tl.set(h1, { autoAlpha: 1 }, tD);
    words(h1).forEach((w, i) => { const t = L('201', i) - 0.1; s.tl.fromTo(w, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power4.in' }, t); s.sfx('hit', t + 0.22, { gain: 0.55 + 0.2 * i }); });
    shake(s, h1, L('201', 2) + 0.12, 0.4, 12);
    s.tl.set(h2, { autoAlpha: 1 }, tG).fromTo(h2, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut' }, tG).to(h1, { opacity: 0, duration: 0.3 }, tG + 0.5);
    s.sfx('shimmer', tG, { gain: 0.9 });
    const br = svg(s, [[150, 262, 1, 1], [1770, 262, -1, 1], [150, 606, 1, -1], [1770, 606, -1, -1]].map(([x, y, a, b]) => `<path d="M ${x} ${y + 70 * b} L ${x} ${y} L ${x + 70 * a} ${y}" fill="none" stroke="#6FD8FF" stroke-width="6" stroke-linecap="square"/>`).join(''));
    const bps = [...br.querySelectorAll('path')]; gsap.set(br, { autoAlpha: 0, transformOrigin: '960px 434px' });
    s.tl.set(br, { autoAlpha: 1 }, tD).fromTo(br, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }, tD).to(bps, { stroke: '#F2C968', duration: 0.6 }, tG);
    const sub = s.div('mont sh', { position: 'absolute', left: '0', right: '0', top: '640px', textAlign: 'center', fontSize: '62px', fontWeight: 800, letterSpacing: '.06em' }, 'YEH IS VIDEO KA <span style="color:#F2C968">SAB SE AHAM HISSA</span> HAI');
    gsap.set(sub, { autoAlpha: 0 }); s.tl.set(sub, { autoAlpha: 1 }, tG); sync(s, sub, '201', { from: 4, y: 20 });
    // where we are in the film: elapsed (cyan) · the coming part (gold)
    const dur = film.cues.dur, now = T('202') / dur, nx = T('256') / dur, fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`, BW = 1400;
    const pb = s.div(null, { position: 'absolute', left: '260px', top: '818px', width: BW + 'px', height: '60px' });
    pb.innerHTML = `<div style="position:absolute;left:0;right:0;top:27px;height:6px;border-radius:3px;background:rgba(255,255,255,.16)"></div>
      <div class="el" style="position:absolute;left:0;top:27px;height:6px;border-radius:3px;width:${(now * BW).toFixed(1)}px;background:#6FD8FF;transform-origin:0 50%"></div>
      <div class="nx" style="position:absolute;left:${(now * BW).toFixed(1)}px;top:22px;height:16px;border-radius:8px;width:${((nx - now) * BW).toFixed(1)}px;background:linear-gradient(90deg,#F8DE9A,#E9B955);box-shadow:0 0 26px 4px rgba(233,185,85,.6);transform-origin:0 50%"></div>
      <div class="ph" style="position:absolute;left:${(now * BW - 13).toFixed(1)}px;top:17px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 0 20px 6px rgba(255,255,255,.55)"></div>
      <div class="mono" style="position:absolute;left:0;top:44px;font-size:20px;font-weight:700;color:rgba(245,241,232,.55)">0:00</div><div class="mono" style="position:absolute;right:0;top:44px;font-size:20px;font-weight:700;color:rgba(245,241,232,.55)">${fmt(dur)}</div>
      <div class="mono tc" style="position:absolute;left:${(now * BW - 60).toFixed(1)}px;width:120px;text-align:center;top:-14px;font-size:22px;font-weight:700;color:#fff">${fmt(T('202'))}</div>`;
    gsap.set(pb, { autoAlpha: 0 }); const tP = tG + 0.35;
    s.tl.set(pb, { autoAlpha: 1 }, tP).fromTo(pb, { opacity: 0 }, { opacity: 1, duration: 0.3 }, tP).fromTo(pb.querySelector('.el'), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.out' }, tP)
      .fromTo([pb.querySelector('.ph'), pb.querySelector('.tc')], { opacity: 0 }, { opacity: 1, duration: 0.3 }, tP + 0.6).fromTo(pb.querySelector('.nx'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, tP + 0.75);
    const nxe = pb.querySelector('.nx'); s.onUpdate((lt) => { nxe.style.opacity = (0.72 + 0.28 * Math.sin((lt - tP) * 5)).toFixed(3); });
    s.sfx('tick', tP + 0.75);
    s.tl.to([h2, br, sub], { scale: 1.03, duration: Math.max(0.5, d - tG), ease: 'none' }, tG);
    s.div('vig');
  }, { fout: 0.3 });
}
