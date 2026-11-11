// PART F — "Dhuaan aur paani" (spoken lines 159..175).  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
// Line 176 belongs to part G; the last scene here holds (with a 0.3 s fade) until P1 + 0.3.
import { defScene, stage3d, T, TW, gsap, THREE, el, clamp, lerp, smooth, ease, noise1, rng, glow } from '../engine.js';
import { cap, flash, show, footage, ayah, shake, words, chars } from '../ui.js';
import { Q, REF } from '../quran.js';

const W = 1920, H = 1080;
const hash = (n) => { let t = (n + 0x6D2B79F5) | 0; t = Math.imul(t ^ t >>> 15, 1 | t); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const typed = (s, node, text, t0, dur) => s.onUpdate((lt) => { const n = Math.round(clamp((lt - t0) / Math.max(0.05, dur)) * text.length); node.textContent = lt < t0 ? '' : text.slice(0, n) + (n < text.length ? '▍' : ''); });
const pop = (s, node, t, o = {}) => {
  gsap.set(node, { autoAlpha: 0 }); s.tl.set(node, { autoAlpha: 1 }, t);
  s.tl.fromTo(node, { opacity: 0, scale: o.s0 ?? 0.5, y: o.y ?? 0 }, { opacity: 1, scale: 1, y: 0, duration: o.dur ?? 0.4, ease: o.ease || 'back.out(2)' }, t);
  if (o.out != null) { s.tl.to(node, { opacity: 0, duration: 0.25, ease: 'power2.in' }, Math.max(t + 0.3, o.out - 0.25)); s.tl.set(node, { autoAlpha: 0 }, Math.max(t + 0.55, o.out)); }
  return node;
};
// mission-HUD frame: corner brackets + a slow scan line (kept clear of the channel bug)
function hudFrame(s) {
  const m = 64, l = 70, b = H - 116;
  s.div('fill', null, `<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0"><g fill="none" stroke="#6FD8FF" stroke-width="4" opacity=".85"><path d="M${m} ${m + l} V${m} H${m + l}"/><path d="M${W - m - l} ${m} H${W - m} V${m + l}"/><path d="M${W - m} ${b - l} V${b} H${W - m - l}"/><path d="M${m + l} ${b} H${m} V${b - l}"/></g></svg>`);
  const ln = s.div(null, { position: 'absolute', left: '64px', right: '64px', top: '0', height: '3px', background: 'linear-gradient(90deg, rgba(111,216,255,0), rgba(111,216,255,.75), rgba(111,216,255,0))' });
  s.onUpdate((lt) => { ln.style.transform = `translateY(${(80 + ((lt * 300) % 860)).toFixed(1)}px)`; });
}
const target = (s, n, name, t0, t1) => { const e = s.div(null, { position: 'absolute', left: '110px', bottom: '150px' }, `<div class="hud sh" style="font-size:28px;font-weight:700">TARGET ${n}</div><div class="bebas sh" style="font-size:120px;line-height:.95;margin-top:6px">${name}</div>`); return show(s, e, t0, t1, { opacity: 0, x: -30 }, 0.35); };
const SY = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
const IC = {
  rock: `<svg width="190" height="170" viewBox="0 0 190 170"><path d="M22 128 L46 62 L96 30 L150 52 L172 110 L140 146 L60 150 Z" fill="#7C8794" stroke="#C9D1DA" stroke-width="4" stroke-linejoin="round"/><path d="M46 62 L92 86 L150 52 M92 86 L100 148 M92 86 L172 110" fill="none" stroke="#C9D1DA" stroke-width="3" opacity=".7"/></svg>`,
  drop: `<svg width="190" height="170" viewBox="0 0 190 170"><path d="M95 14 C95 14 42 82 42 112 A53 53 0 0 0 148 112 C148 82 95 14 95 14 Z" fill="#3FA9F5" stroke="#B9ECFF" stroke-width="4"/><path d="M66 116 A30 30 0 0 0 92 142" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
  iron: `<svg width="190" height="170" viewBox="0 0 190 170"><path d="M40 74 L150 74 L172 136 L18 136 Z" fill="#8A8F98" stroke="#D5D9DE" stroke-width="4" stroke-linejoin="round"/><path d="M40 74 L58 48 L132 48 L150 74" fill="#A9AEB6" stroke="#D5D9DE" stroke-width="4" stroke-linejoin="round"/><text x="95" y="124" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="44" fill="#1b1f27">Fe</text></svg>`,
  hex: `<svg width="150" height="150" viewBox="-75 -75 150 150"><g fill="none" stroke="#6FD8FF" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M0 -60 L52 -30 L52 30 L0 60 L-52 30 L-52 -30 Z"/><path d="M0 -44 L38 -22 M38 22 L0 44 M-38 22 L-38 -22"/></g></svg>`,
  flask: `<svg width="150" height="150" viewBox="-75 -75 150 150"><g fill="none" stroke="#6FD8FF" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M-18 -62 L18 -62 M-10 -62 L-10 -18 L-46 46 Q-54 62 -36 62 L36 62 Q54 62 46 46 L10 -18 L10 -62"/><path d="M-32 22 L32 22"/></g><circle cx="-8" cy="40" r="5" fill="#6FD8FF"/><circle cx="14" cy="47" r="3.5" fill="#6FD8FF"/></svg>`,
};

export default function ([P0, P1]) {
  // ───────── F1  "Ek aur ayat" → and here comes chemistry ─────────
  defScene('f1_stinger', P0, T('160b') + 0.4, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off);
    const tE = L('159', null, -0.05), tC = L('160', null, -0.1), tW = Math.max(tC + 0.2, L('160', 2, -0.08));
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 45%, #0a1830 0%, #040912 60%, #010206 100%)' });
    const tb = s.div('fill'), R = rng(160), all = Array.from({ length: 18 }, (_, i) => i), side = [0, 1, 12, 13, 14, 15, 16, 17], rows = [[0, 17], side, side], tiles = [];
    let k = 0;
    for (let r = 0; r < 7; r++) for (const c of (rows[r] || all)) {
      const hot = k < 2, e = el('div', null, { position: 'absolute', left: (172 + c * 88) + 'px', top: (236 + r * 88) + 'px', width: '80px', height: '80px', borderRadius: '6px', textAlign: 'center', opacity: '0', border: `1.5px solid rgba(111,216,255,${hot ? 1 : 0.55})`, background: `rgba(111,216,255,${hot ? 0.22 : 0.06})`, boxShadow: hot ? '0 0 34px rgba(111,216,255,.55)' : 'none' }, `<span class="oswald" style="font-size:34px;font-weight:600;line-height:78px;color:${hot ? '#fff' : '#B9ECFF'}">${SY[k]}</span>`);
      tb.appendChild(e); tiles.push({ e, hot, r0: R(), r1: R() }); k++;
    }
    s.onUpdate((lt) => { const fr = Math.floor(lt * 30 + 0.5); for (const t of tiles) { const a = lt - (tC + t.r0 * 0.55); let o = 0; if (a > 0) o = (t.hot ? 1 : 0.4 + 0.1 * Math.sin(lt * 3 + t.r1 * 6)) * (a < 0.3 && hash(fr * 131 + Math.floor(t.r1 * 9973)) < 0.45 ? 0.2 : 1); t.e.style.opacity = o.toFixed(3); } });
    // EK AUR AYAT
    const a = s.div(null, { position: 'absolute', left: '0', right: '0', top: '300px', textAlign: 'center' }, '<div class="cinzel gold sh a1" style="font-size:46px;font-weight:700;letter-spacing:.6em">EK AUR</div><div class="bebas goldgrad a2" style="font-size:330px;line-height:1;padding-bottom:8px">AYAT</div><div class="orn a3" style="margin:6px auto 0;width:620px"></div>');
    s.tl.fromTo(a.querySelector('.a1'), { opacity: 0, letterSpacing: '1.3em' }, { opacity: 1, letterSpacing: '.6em', duration: 0.6, ease: 'power2.out' }, tE);
    s.tl.fromTo(a.querySelector('.a2'), { opacity: 0, scale: 1.3, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }, tE + 0.12).fromTo(a.querySelector('.a3'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, tE + 0.3);
    s.tl.to(a, { opacity: 0, scale: 0.86, y: -60, duration: 0.3, ease: 'power2.in' }, tC);
    // CHEMISTRY
    const band = s.div(null, { position: 'absolute', left: '0', right: '0', top: '330px', height: '420px', background: 'linear-gradient(180deg, rgba(2,6,14,0) 0%, rgba(2,6,14,.92) 26%, rgba(2,6,14,.92) 74%, rgba(2,6,14,0) 100%)' }); show(s, band, tC + 0.1, null, { opacity: 0 }, 0.4);
    const au = s.div('hud sh', { position: 'absolute', left: '0', right: '0', top: '398px', textAlign: 'center', fontSize: '30px', fontWeight: 700 }, 'AUR YAHAN…'); show(s, au, tC + 0.1, null, { opacity: 0, y: 10 }, 0.3);
    const ch = s.div('bebas glowc', { position: 'absolute', left: '0', right: '0', top: '430px', textAlign: 'center', fontSize: '260px', lineHeight: '1', color: '#fff' }, 'CHEMISTRY');
    gsap.set(ch, { autoAlpha: 0 }); s.tl.set(ch, { autoAlpha: 1 }, tW).fromTo(chars(ch), { opacity: 0, yPercent: 60, scale: 1.4 }, { opacity: 1, yPercent: 0, scale: 1, duration: 0.4, stagger: 0.03, ease: 'back.out(1.6)' }, tW);
    [[250, IC.hex], [1520, IC.flask]].forEach(([x, ic], i) => { const d = s.div(null, { position: 'absolute', left: x + 'px', top: '484px' }, ic); gsap.set(d, { autoAlpha: 0 }); s.tl.set(d, { autoAlpha: 1 }, tW + 0.1).fromTo(d.querySelectorAll('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.out' }, tW + 0.1 + i * 0.1); });
    s.sfx('shimmer', tE, { gain: 0.8 }); s.sfx('whoosh', tC, { gain: 0.6 }); s.sfx('hit', tW + 0.1, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.3, z: 1 });

  // ───────── F2  41:11 — "…aur woh us waqt dhuaan tha" → the word DUKHAN ─────────
  defScene('f2_ayah', T('160b'), T('163') + 0.35, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const t1 = L('161', null, -0.05), tQ = L('162', null, -0.12), tK = Math.max(tQ + 0.5, L('162', 2, -0.08));
    footage(s, 'f_fog', { n: 310, speed: clamp(310 / (d * 30 + 2), 0.5, 1), kb: { s0: 1.02, s1: 1.1 } });
    s.div('scrim-all', { background: 'rgba(3,4,12,.42)' });
    ayah(s, { ref: REF['41:11'], ar: Q['41:11'], tr: '“Phir Woh aasman ki taraf mutawajjeh hua —|aur woh us waqt <span class="hl">dhuaan</span> tha.”', t0: 0.12, tAr: 0.3, dAr: clamp(t1 - 0.5, 0.7, 2.4), trTimes: [t1, L('161', 8, -0.05)], hl: { 5: L('161', 12, -0.1) }, t1: tQ + 0.4, size: 112 });
    const dk = s.div(null, { position: 'absolute', left: '0', right: '0', top: '70px', textAlign: 'center' });
    dk.innerHTML = `<div class="ar glowg w" style="font-size:220px;line-height:2;color:#FFF3D2">${Q['w:dukhan']}</div><div class="cinzel gold sh t" style="font-size:56px;font-weight:700;letter-spacing:.45em;margin-top:62px">DUKHAN</div><div class="mont sh e" style="font-size:52px;font-weight:700;margin-top:16px">= <span style="color:var(--gold2)">dhuaan</span></div>`;
    const w = dk.querySelector('.w'); gsap.set(dk, { autoAlpha: 0 }); s.tl.set(dk, { autoAlpha: 1 }, tQ + 0.1);
    s.tl.fromTo(w, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, tQ + 0.1).to(w, { scale: 1.05, duration: Math.max(0.5, d - tQ - 0.8), ease: 'none' }, tQ + 0.8);
    s.tl.fromTo(dk.querySelector('.t'), { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '.45em', duration: 0.6, ease: 'power2.out' }, tQ + 0.25).fromTo(dk.querySelector('.e'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4 }, tQ + 0.45);
    const kq = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '826px', textAlign: 'center', fontSize: '140px', lineHeight: '1' }, 'YEH LAFZ <span style="color:var(--gold2)">KYUN?</span>'); pop(s, kq, tK, { s0: 1.5, dur: 0.28, ease: 'power3.out' });
    s.sfx('swell', 0.1, { dur: 2.2 }); s.sfx('shimmer', L('161', 12, -0.1), { gain: 0.8 }); s.sfx('hit', tK + 0.1, { gain: 0.6 });
    s.div('vig');
  }, { fin: 0.4, z: 2 });

  // ───────── F3  no rock, no water, no iron — only hydrogen and helium ─────────
  defScene('f3_elements', T('163'), T('166'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off);
    const items = [['PATHAR', IC.rock, L('163', 5, -0.12)], ['PAANI', IC.drop, L('163', 8, -0.12)], ['LOHA', IC.iron, L('163', 10, -0.12)]];
    const tG = Math.max(L('164', 1, -0.1), items[2][2] + 0.75), tH = Math.max(tG + 0.6, L('165', 1, -0.1)), tHe = Math.max(tH + 0.9, L('165', 4, -0.1));
    const st = stage3d(s, { bg: 0x02040b, fov: 50 }), RA = rng(163), atoms = [];
    for (let i = 0; i < 13; i++) {
      const he = i % 4 === 3, g = new THREE.Group(), col = he ? 0xffb36b : 0x6fd8ff, rr = he ? 1.25 : 1;
      g.add(glow(he ? 0xffd9a8 : 0xd8f3ff, he ? 0.8 : 0.52, 1, 0.12, 2.0));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.0, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); ring.scale.setScalar(rr); g.add(ring);
      const es = Array.from({ length: he ? 2 : 1 }, () => { const e = glow(col, 0.34, 1, 0.1, 2.0); g.add(e); return e; });
      g.rotation.set(RA() * 3, RA() * 3, RA() * 3); st.scene.add(g);
      atoms.push({ g, es, rr, x: (RA() - 0.5) * 24, y: (RA() - 0.5) * 12, z: -1 - RA() * 12, ph: RA() * 6.28, sp: 0.8 + RA() * 0.8 });
    }
    st.frame = (lt) => { for (const a of atoms) { a.g.position.set(a.x + Math.sin(lt * 0.21 + a.ph) * 0.9, a.y + Math.cos(lt * 0.17 + a.ph) * 0.6, a.z); a.es.forEach((e, j) => { const an = lt * 2.2 * a.sp + a.ph + j * Math.PI; e.position.set(Math.cos(an) * a.rr, Math.sin(an) * a.rr, 0); }); } st.camera.position.set(0, 0, 10 - lt * 0.15); };
    const sc = s.div('scrim-all', { background: 'rgba(2,4,12,.62)' }); s.tl.to(sc, { opacity: 0.55, duration: 0.5 }, tG);
    // phase 1: what was NOT there
    const hd = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '116px', textAlign: 'center', fontSize: '46px', fontWeight: 700, letterSpacing: '.4em' }, 'SHURU KI KAINAT MEIN…');
    show(s, hd, 0.05, tG + 0.1, { opacity: 0, y: -16 }, 0.4);
    items.forEach(([k, ic, t], i) => {
      const p = s.div('panel', { left: (250 + i * 500) + 'px', top: '250px', width: '420px', height: '520px', textAlign: 'center' });
      p.innerHTML = `<div class="b"><div style="position:absolute;left:0;right:0;top:44px;height:190px;display:flex;align-items:center;justify-content:center">${ic}</div><div class="bebas" style="position:absolute;left:0;right:0;top:250px;font-size:124px">${k}</div></div>
        <svg width="420" height="520" viewBox="0 0 420 520" style="position:absolute;left:0;top:0"><path class="x" d="M96 58 L324 232" stroke="#FF4B4B" stroke-width="12" stroke-linecap="round" fill="none"/></svg>
        <div class="anton glowr n" style="position:absolute;left:0;right:0;top:392px;font-size:74px;color:var(--red)">✗ NAHI</div>`;
      pop(s, p, t, { s0: 0.8, y: 50, dur: 0.35, ease: 'back.out(1.6)', out: tG + 0.05 + i * 0.04 });
      s.tl.fromTo(p.querySelector('.x'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, t + 0.32).to(p.querySelector('.b'), { opacity: 0.38, duration: 0.25 }, t + 0.36);
      pop(s, p.querySelector('.n'), t + 0.36, { s0: 1.8, dur: 0.2, ease: 'power3.out' }); s.sfx('pop', t, { gain: 0.7 }); s.sfx('slash', t + 0.32, { gain: 0.8 });
    });
    // phase 2: only two light gases
    const h2 = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '84px', textAlign: 'center', fontSize: '124px', lineHeight: '1' }, 'SIRF <span style="color:var(--cyan)">DO</span> HALKI GASEIN');
    gsap.set(h2, { autoAlpha: 0 }); s.tl.set(h2, { autoAlpha: 1 }, tG + 0.05);
    words(h2).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.35 }, Math.max(tG + 0.08 + i * 0.09, L('164', i, -0.08))));
    const C = 2 * Math.PI * 200;
    [[560, 'H', '1', 'HYDROGEN', '#6FD8FF', 0.75, tH, L('165', 3, -0.08)], [1360, 'He', '2', 'HELIUM', '#FFB36B', 0.25, tHe, L('165', 6, -0.08)]].forEach(([cx, sym, num, name, col, pct, tf, tn], i) => {
      const g = s.div(null, { position: 'absolute', left: (cx - 230) + 'px', top: '226px', width: '460px', height: '740px', textAlign: 'center' });
      g.innerHTML = `<svg width="460" height="460" viewBox="-230 -230 460 460"><circle r="200" fill="rgba(4,10,22,.78)" stroke="rgba(255,255,255,.13)" stroke-width="26"/><circle class="arc" r="200" fill="none" stroke="${col}" stroke-width="26" stroke-linecap="round" transform="rotate(-90)" stroke-dasharray="0 1300"/></svg>
        <div class="mono" style="position:absolute;left:0;right:0;top:96px;font-size:32px;font-weight:700;color:${col}">${num}</div><div class="oswald" style="position:absolute;left:0;right:0;top:128px;font-size:200px;font-weight:600;line-height:1.2;color:#fff">${sym}</div>
        <div class="bebas sh pc" style="position:absolute;left:0;right:0;top:472px;font-size:150px;line-height:1;color:${col}"></div><div class="mono sh nm" style="position:absolute;left:0;right:0;top:626px;font-size:36px;font-weight:700;letter-spacing:.4em">${name}</div>`;
      pop(s, g, tG + 0.2 + i * 0.14, { s0: 0.7, dur: 0.45, ease: 'back.out(1.5)' });
      const arc = g.querySelector('.arc'), pc = g.querySelector('.pc'), tnn = Math.max(tf + 0.35, tn);
      s.onUpdate((lt) => { const f = pct * ease.out3(clamp((lt - tf) / 0.9)); arc.setAttribute('stroke-dasharray', `${(f * C).toFixed(1)} 1300`); pc.textContent = lt < tf ? '' : '≈ ' + Math.round(f * 100) + '%'; });
      pop(s, g.querySelector('.nm'), tnn, { s0: 1, y: 14, dur: 0.35, ease: 'power2.out' }); s.sfx('tick', tf); s.sfx('ding', tf + 0.85, { gain: 0.8 });
    });
    s.sfx('whoosh', tG, { gain: 0.6 });
    s.div('vig');
  }, { fin: 0.35, z: 3 });

  // ───────── F4  so hot and dense that light cannot fly straight — a sea of glowing gas ─────────
  defScene('f4_fog', T('166'), T('168') + 0.5, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off);
    const tGa = L('166', 1, -0.08), tGh = L('166', 3, -0.08), tPh = L('166', 6, -0.1), tSe = L('166', 11, -0.1), tNa = Math.max(tSe + 0.4, L('166', 13, -0.08)), tWd = Math.max(tNa + 0.5, L('167', null, -0.3));
    const cv = el('canvas', null, { position: 'absolute', left: '0', top: '0' }); cv.width = W; cv.height = H; s.add(cv); const ctx = cv.getContext('2d');
    const mk = (c0, c1, size) => { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); g.addColorStop(0, c0); g.addColorStop(0.35, c1); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, size, size); return c; };
    const sFog = mk('rgba(255,206,140,.50)', 'rgba(255,104,28,.17)', 96), sFine = mk('rgba(255,236,190,.9)', 'rgba(255,150,50,.3)', 32), sPh = mk('rgba(255,255,255,1)', 'rgba(255,244,180,.6)', 128);
    const R = rng(166), P = Array.from({ length: 1200 }, () => [(R() - 0.5) * 5400, (R() - 0.5) * 3100, 0.55 + R() * 1.3, R() * 100]), F = Array.from({ length: 1000 }, () => [(R() - 0.5) * 5400, (R() - 0.5) * 3100, 0.5 + R(), R() * 100]);
    // the photon's random walk (seeded): it wants to go right, the plasma will not let it
    const pts = [[-1150, 30], [-600, 10]], RW = rng(167);
    for (let i = 0; i < 46; i++) { const [x, y] = pts[pts.length - 1]; let nx, ny, tries = 0; do { const a = RW() * 6.283, l = 120 + RW() * 150; nx = x + Math.cos(a) * l; ny = y + Math.sin(a) * l; tries++; } while ((Math.abs(nx) > 700 || Math.abs(ny) > 350) && tries < 14); pts.push([nx, ny]); }
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const at = (q) => { q = clamp(q, 0, cum[cum.length - 1] - 1); let i = 1; while (cum[i] < q) i++; const k = (q - cum[i - 1]) / (cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; };
    const V = 880, bgG = ctx.createRadialGradient(960, 540, 0, 960, 540, 1150); bgG.addColorStop(0, '#3b1505'); bgG.addColorStop(0.6, '#1d0a03'); bgG.addColorStop(1, '#0a0301');
    const lab = s.div(null, { position: 'absolute', left: '0', top: '0' }), labI = el('div', 'hud sh', { position: 'absolute', left: '30px', top: '-58px', fontSize: '26px', fontWeight: 700, whiteSpace: 'nowrap', color: '#FFF3C9' }, 'ROSHNI'); lab.appendChild(labI);
    s.onUpdate((lt) => {
      const Z = lerp(1, 0.4, ease.io3(clamp((lt - tWd) / 1.6))), zs = Math.pow(Z, 0.75);
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, sz, ph] of P) { const r = 60 * sz * zs, sx = 960 + (x + 14 * noise1(lt * 0.9 + ph, 1)) * Z, sy = 540 + (y + 14 * noise1(lt * 0.8 + ph, 2)) * Z; if (sx < -r || sx > W + r || sy < -r || sy > H + r) continue; ctx.drawImage(sFog, sx - r, sy - r, 2 * r, 2 * r); }
      for (const [x, y, sz, ph] of F) { const r = 13 * sz * zs, sx = 960 + (x + 24 * noise1(lt * 1.7 + ph, 3)) * Z, sy = 540 + (y + 24 * noise1(lt * 1.5 + ph, 4)) * Z; if (sx < -r || sx > W + r || sy < -r || sy > H + r) continue; ctx.drawImage(sFine, sx - r, sy - r, 2 * r, 2 * r); }
      const q = (lt - tPh) * V;
      if (q > 0) {
        ctx.lineCap = 'round';
        for (let j = 20; j >= 1; j--) { const a = at(q - j * 13), b = at(q - (j - 1) * 13); ctx.strokeStyle = `rgba(255,244,190,${((1 - j / 21) * 0.9).toFixed(3)})`; ctx.lineWidth = (13 - j * 0.5) * zs; ctx.beginPath(); ctx.moveTo(960 + a[0] * Z, 540 + a[1] * Z); ctx.lineTo(960 + b[0] * Z, 540 + b[1] * Z); ctx.stroke(); }
        for (let i = 1; i < pts.length; i++) { const age = (q - cum[i]) / V; if (age > 0 && age < 0.3) { ctx.strokeStyle = `rgba(255,220,150,${((1 - age / 0.3) * 0.8).toFixed(3)})`; ctx.lineWidth = 3 * zs; ctx.beginPath(); ctx.arc(960 + pts[i][0] * Z, 540 + pts[i][1] * Z, (12 + 110 * age) * zs, 0, 6.283); ctx.stroke(); } }
        const h = at(q), r = 84 * zs; ctx.drawImage(sPh, 960 + h[0] * Z - r, 540 + h[1] * Z - r, 2 * r, 2 * r);
        lab.style.transform = `translate(${(960 + h[0] * Z).toFixed(1)}px, ${(540 + h[1] * Z).toFixed(1)}px)`;
      }
    });
    show(s, labI, tPh + 0.25, tSe + 0.2, { opacity: 0 }, 0.25);
    const g1 = s.div('bebas sh', { position: 'absolute', left: '110px', top: '88px', fontSize: '136px', lineHeight: '1' }, 'ITNI <span style="color:#FFB36B">GARAM</span>'), g2 = s.div('bebas sh', { position: 'absolute', left: '110px', top: '214px', fontSize: '136px', lineHeight: '1' }, 'AUR <span style="color:#FFB36B">GHANI</span>');
    pop(s, g1, tGa, { s0: 1.4, dur: 0.26, ease: 'power3.out', out: tWd }); pop(s, g2, tGh, { s0: 1.4, dur: 0.26, ease: 'power3.out', out: tWd });
    // the straight path it cannot take
    const sp = s.div('fill', null, `<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0"><path class="l" d="M200 540 L1700 540" fill="none" stroke="#6FD8FF" stroke-width="5" stroke-dasharray="22 16" opacity=".9"/><path class="h" d="M1672 512 L1716 540 L1672 568" fill="none" stroke="#6FD8FF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><g class="x" stroke="#FF4B4B" stroke-width="16" stroke-linecap="round"><path d="M1500 484 L1612 596"/><path d="M1612 484 L1500 596"/></g></svg><div class="hud sh" style="position:absolute;left:1330px;top:440px;font-size:28px;font-weight:700">SEEDHA RASTA</div>`);
    gsap.set(sp, { autoAlpha: 0 }); s.tl.set(sp, { autoAlpha: 1 }, tSe).fromTo(sp.querySelector('.l'), { opacity: 0 }, { opacity: 0.9, duration: 0.4 }, tSe).fromTo([sp.querySelector('.h'), sp.querySelector('.hud')], { opacity: 0 }, { opacity: 1, duration: 0.25 }, tSe + 0.4);
    s.tl.fromTo(sp.querySelectorAll('.x path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.12, stagger: 0.1, ease: 'power2.in' }, tNa).to(sp, { opacity: 0, duration: 0.3 }, tWd).set(sp, { autoAlpha: 0 }, tWd + 0.3);
    s.div('scrim-b', { height: '34%' });
    cap(s, 'Roshni bhi us mein se <span class="hr">seedhi guzar nahi</span> sakti thi', tPh + 0.15, Math.max(tPh + 1.2, tWd), { bottom: 96 });
    // wide: the sea of gas
    const scr = s.div(null, { position: 'absolute', left: '50%', top: '50%', width: '1900px', height: '900px', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 50% 50%, rgba(10,3,1,.78) 0%, rgba(10,3,1,.45) 44%, rgba(10,3,1,0) 70%)' }); show(s, scr, tWd, null, { opacity: 0 }, 0.8);
    const tt = s.div(null, { position: 'absolute', left: '0', right: '0', top: '318px', textAlign: 'center' }, '<div class="bebas sh a" style="font-size:120px;line-height:1"><span class="w0">EK</span> <span class="w1" style="color:#FFB36B">GARAM,</span> <span class="w2" style="color:#FFB36B">DHUNDLA,</span></div><div class="anton sh b" style="font-size:230px;line-height:1.12;color:#fff">GAS KA SAMANDAR</div>');
    ['.w0', '.w1', '.w2'].forEach((c, i) => { const e = tt.querySelector(c); e.style.display = 'inline-block'; pop(s, e, Math.max(tWd + 0.05 + i * 0.08, L('167', i, -0.08)), { s0: 1, y: 30, dur: 0.35, ease: 'power3.out' }); });
    pop(s, tt.querySelector('.b'), Math.max(tWd + 0.4, L('167', 3, -0.08)), { s0: 1.5, dur: 0.3, ease: 'power3.out' });
    s.sfx('whoosh', tPh, { gain: 0.6 }); s.sfx('buzz', tNa + 0.1, { gain: 0.6 }); s.sfx('swell', tWd, { dur: 2.4 });
    s.div('vig');
  }, { z: 1 });

  // ───────── F5  the next part of the same ayah (21:30) — every living thing from water ─────────
  defScene('f5_water', T('168'), T('170') + 0.4, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const t9 = L('169', null, -0.05), tP = L('169', 6, -0.1), tAr = clamp(L('168', 4, -0.2), 0.4, Math.max(0.4, t9 - 1.2));
    footage(s, 'f_ocean1', { n: 270, speed: clamp(270 / (d * 30 + 2), 0.5, 1), kb: { s0: 1.04, s1: 1.12 } });
    s.div('scrim-all', { background: 'rgba(2,10,26,.52)' });
    const chip = s.div('chip', { position: 'absolute', left: '50%', top: '84px', transform: 'translateX(-50%)', background: 'rgba(111,216,255,.12)', borderColor: 'rgba(111,216,255,.7)', color: 'var(--cyan2)', whiteSpace: 'nowrap' }, 'USI AYAT KA AGLA HISSA');
    show(s, chip, L('168', 1, -0.1), null, { opacity: 0, y: -16 }, 0.4);
    ayah(s, { ref: REF['21:30b'], ar: Q['21:30b'], tr: '“Aur Hum ne har zinda cheez|<span style="color:var(--cyan)">paani</span> se banayi.”', t0: 0.15, tAr, dAr: clamp(t9 - tAr - 0.3, 0.7, 1.8), trTimes: [t9, tP], hl: { 2: tP }, size: 116, trSize: 48 });
    s.sfx('swell', 0.1, { dur: 2.2 }); s.sfx('shimmer', tP, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.5, z: 2 });

  // ───────── F6  one ayah: the birth of the universe, and the basis of life ─────────
  defScene('f6_both', T('170'), T('173'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tA = L('171', null, -0.08), tB = L('172', null, -0.08);
    s.div('fill', { background: 'linear-gradient(180deg, #1a0e05 0%, #07080f 47%, #04142a 100%)' });
    s.div('fill', { background: 'radial-gradient(ellipse 60% 44% at 18% 30%, rgba(255,150,60,.20) 0%, rgba(255,150,60,0) 100%), radial-gradient(ellipse 60% 44% at 82% 78%, rgba(63,169,245,.24) 0%, rgba(63,169,245,0) 100%)' });
    const tt = s.div('bebas goldgrad', { position: 'absolute', left: '0', right: '0', top: '62px', textAlign: 'center', fontSize: '156px', lineHeight: '1', paddingBottom: '6px' }, 'EK HI AYAT');
    s.tl.fromTo(tt, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }, 0.05);
    const rf = s.div('ayah-ref sh', { position: 'absolute', left: '0', right: '0', top: '226px', textAlign: 'center', fontSize: '28px' }, REF['21:30a']); show(s, rf, 0.25, null, { opacity: 0 }, 0.4);
    const row = (top, ar, col, n, small, bigTxt) => { const r = s.div(null, { position: 'absolute', left: '0', right: '0', top: top + 'px', textAlign: 'center' });
      r.innerHTML = `<div class="ar glowg q" style="font-size:76px;line-height:1.9;color:#FFF3D2">${ar}</div><div style="height:16px;width:1240px;margin:0 auto;border:3px solid ${col};border-top:none;border-radius:0 0 14px 14px;opacity:.9" class="br"></div>
        <div class="lb" style="margin-top:12px"><span class="mono sh sm" style="font-size:26px;font-weight:700;letter-spacing:.3em;color:${col};margin-right:26px;vertical-align:middle">${n} ${small}</span><span class="bebas sh bg" style="font-size:92px;line-height:1;color:${col};vertical-align:middle">${bigTxt}</span></div>`; return r; };
    const ra = row(262, Q['21:30a'], '#FFB36B', '①', 'PEHLE HISSE MEIN', 'KAINAT KI PAIDAISH'), rb = row(590, Q['21:30b'], '#6FD8FF', '②', 'DOOSRE MEIN', 'ZINDAGI KI BUNYAAD');
    [[ra, 0.15, tA, '171', 3], [rb, 0.4, tB, '172', 2]].forEach(([r, t0, tl, id, from]) => {
      s.tl.fromTo(r.querySelector('.q'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, t0);
      s.tl.fromTo(r.querySelector('.br'), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, tl).fromTo(r.querySelector('.sm'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tl);
      const bg = r.querySelector('.bg'); gsap.set(bg, { autoAlpha: 0 }); s.tl.set(bg, { autoAlpha: 1 }, tl);
      words(bg).forEach((w, i) => s.tl.fromTo(w, { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.35 }, Math.max(tl + 0.1 + i * 0.08, L(id, from + i, -0.08)))); s.sfx('pop', tl + 0.1, { gain: 0.7 });
    });
    s.tl.to(rb.querySelector('.q'), { opacity: 0.35, duration: 0.35 }, tA).to(rb.querySelector('.q'), { opacity: 1, duration: 0.35 }, tB).to(ra.querySelector('.q'), { opacity: 0.5, duration: 0.35 }, tB).to(ra.querySelector('.q'), { opacity: 1, duration: 0.4 }, Math.max(tB + 0.9, d - 0.6));
    s.sfx('shimmer', 0.05, { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.4, z: 3 });

  // ───────── F7  NASA looks for life on other worlds — by what rule? ─────────
  defScene('f7_search', T('173'), T('174'), (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tE = clamp(L('173', 6, -0.12), 1.2, d - 1.2), tU = Math.max(tE + 0.5, L('173', 10, -0.1));
    footage(s, 'f_mars', { n: 120, speed: clamp(120 / (tE * 30 + 2), 0.6, 2), kb: { s0: 1.25, s1: 1.4 } });
    const en = footage(s, 'f_enc', { n: 125, t0: tE, speed: clamp(125 / ((d - tE) * 30 + 2), 0.6, 1.25), kb: { s0: 1.0, s1: 1.06 } });
    gsap.set(en, { autoAlpha: 0 }); s.tl.set(en, { autoAlpha: 1 }, tE);
    s.div('scrim-t'); s.div('scrim-b'); hudFrame(s);
    const hd = s.div(null, { position: 'absolute', left: '110px', top: '100px' }, '<div class="bebas sh n" style="font-size:150px;line-height:.9">NASA</div><div class="mono cyan sh q" style="font-size:30px;font-weight:700;letter-spacing:.24em;margin-top:14px"></div>');
    pop(s, hd.querySelector('.n'), L('173', 1, -0.1), { s0: 1.5, dur: 0.26, ease: 'power3.out' }); typed(s, hd.querySelector('.q'), 'DOOSRE SAYYARON PAR ZINDAGI ?', L('173', 3, -0.1), 1.0);
    target(s, '01', 'MARS', 0.15, tE); target(s, '02', 'ENCELADUS', tE + 0.1, null);
    flash(s, tE, { peak: 0.5, dur: 0.3, color: '#B9ECFF' });
    cap(s, '…to uska <span class="hl">usool</span> kya hai?', tU, d - 0.02, { bottom: 160, size: 58, style: { paddingLeft: '520px', paddingRight: '160px' } });
    s.sfx('whoosh', 0, { gain: 0.6 }); s.sfx('type', L('173', 3, -0.1), { dur: 1.0 }); s.sfx('glitch', tE, { gain: 0.7 });
    s.div('vig');
  }, { z: 1 });

  // ───────── F7b  "Follow the water." ─────────
  const tFact = Math.max(T('174') + 1.6, TW('175', 3) - 0.15);
  defScene('f7_follow', T('174'), tFact + 0.4, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    footage(s, 'f_europa', { n: 150, speed: clamp(150 / (d * 30 + 2), 0.6, 1.6), kb: { s0: 1.0, s1: 1.06 } });
    s.div('scrim-all', { background: 'rgba(2,6,14,.5)' }); hudFrame(s);
    const tg = s.div('hud sh', { position: 'absolute', left: '110px', top: '104px', fontSize: '28px', fontWeight: 700 }, 'TARGET 03 · EUROPA'); show(s, tg, 0.1, null, { opacity: 0, x: -20 }, 0.3);
    const hd = s.div(null, { position: 'absolute', left: '0', right: '0', top: '196px', textAlign: 'center' }, '<div class="anton sh" style="font-size:150px;line-height:1.05;color:#fff"><span class="k">FOLLOW</span> <span class="k">THE</span></div><div class="anton glowc k" style="font-size:340px;line-height:1.02;color:var(--cyan)">WATER</div>');
    const ks = [...hd.querySelectorAll('.k')], tk = ks.map((_, i) => Math.max(0.03 + i * 0.17, L('174', i, -0.05)));
    ks.forEach((k, i) => { k.style.display = 'inline-block'; pop(s, k, tk[i], { s0: i === 2 ? 2.4 : 1.6, dur: i === 2 ? 0.2 : 0.24, ease: i === 2 ? 'power4.in' : 'power3.out' }); });
    flash(s, tk[2] + 0.2, { peak: 0.6, dur: 0.6, color: '#B9ECFF' }); shake(s, hd, tk[2] + 0.2, 0.5, 14);
    const sub = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '742px', textAlign: 'center', fontSize: '84px', fontStyle: 'italic', fontWeight: 700 }, '“Paani ka <span style="color:var(--cyan)">peecha karo</span>.”');
    const t3 = Math.max(tk[2] + 0.45, L('174', 3, -0.05)); gsap.set(sub, { autoAlpha: 0 }); s.tl.set(sub, { autoAlpha: 1 }, t3).fromTo(words(sub), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1 }, t3);
    s.sfx('whoosh', 0, { gain: 0.6 }); s.sfx('impact', tk[2] + 0.2, { gain: 0.9 });
    s.div('vig');
  }, { z: 1 });

  // ───────── F8  not one living thing without water ─────────
  defScene('f8_fact', tFact, P1 + 0.3, (s) => {
    const L = (id, n, off = 0) => Math.max(0.02, (n == null ? T(id) : TW(id, n)) - s.t0 + off), d = s.t1 - s.t0;
    const tJ = Math.max(0.3, L('175', 6, -0.08)), tZ = Math.max(tJ + 0.3, L('175', 7, -0.06)), tP = Math.max(tZ + 0.4, L('175', 10, -0.08)), tS = Math.max(tP + 0.5, L('175', 13, -0.08));
    footage(s, 'f_ocean2', { n: 240, speed: clamp(240 / (d * 30 + 2), 0.5, 1), kb: { s0: 1.04, s1: 1.14 } });
    s.div('scrim-all', { background: 'rgba(2,8,20,.6)' });
    const p = s.div('panel', { left: '230px', top: '240px', width: '1460px', height: '560px', background: 'linear-gradient(180deg, rgba(8,20,44,.86), rgba(3,8,20,.92))' });
    p.innerHTML = `<div class="anton glowc z" style="position:absolute;left:60px;top:30px;width:440px;text-align:center;font-size:440px;line-height:1.1;color:#fff"></div><div style="position:absolute;left:520px;top:70px;bottom:70px;width:3px;background:linear-gradient(180deg, rgba(111,216,255,0), rgba(111,216,255,.8), rgba(111,216,255,0))"></div>
      <div style="position:absolute;left:580px;top:66px"><div class="hud a" style="font-size:30px;font-weight:700">AAJ TAK · EK BHI NAHI MILA</div><div class="bebas b" style="font-size:170px;line-height:1;margin-top:18px">JAANDAAR</div><div class="bebas c" style="font-size:118px;line-height:1;color:var(--cyan)">PAANI KE BAGHAIR</div><div class="mont e" style="font-size:42px;font-weight:700;margin-top:18px;color:rgba(245,241,232,.85)">…jo jee sake</div></div>`;
    pop(s, p, 0.02, { s0: 0.9, y: 60, dur: 0.45, ease: 'power3.out' });
    const z = p.querySelector('.z'); s.onUpdate((lt) => { z.textContent = lt < tZ ? String(1 + Math.floor(hash(Math.floor(lt * 15 + 0.5) * 7 + 3) * 9)) : '0'; z.style.opacity = lt < tZ ? '0.45' : '1'; p.style.translate = `0px ${(-8 * smooth(0, d, lt)).toFixed(1)}px`; });
    s.tl.fromTo(z, { scale: 1.7 }, { scale: 1, duration: 0.22, ease: 'power4.in', immediateRender: false }, tZ); shake(s, p, tZ + 0.22, 0.45, 12);
    pop(s, p.querySelector('.a'), 0.2, { s0: 1, y: 12, dur: 0.3, ease: 'power2.out' }); pop(s, p.querySelector('.b'), tJ, { s0: 1, y: 30, dur: 0.35, ease: 'power3.out' });
    pop(s, p.querySelector('.c'), tP, { s0: 1, y: 30, dur: 0.35, ease: 'power3.out' }); pop(s, p.querySelector('.e'), tS, { s0: 1, y: 14, dur: 0.35, ease: 'power2.out' });
    s.sfx('whoosh', 0, { gain: 0.5 }); s.sfx('hit', tZ + 0.22); s.sfx('ding', tP, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.4, fout: 0.3, z: 2 });
}
