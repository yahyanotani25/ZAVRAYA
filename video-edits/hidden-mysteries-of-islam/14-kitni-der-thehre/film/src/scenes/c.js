// PART C — Newton's one clock, Einstein's two rules, Mr. Clock (1971), head vs feet, the Earth's young core (lines 72..107)
import { defScene, stage3d, T, gsap, THREE, el, clamp, lerp, smooth, noise1, W, H, film, glow, starfield } from '../engine.js';
import { cap, flash, show, svg, shake, lowerThird, dateline, stamp, photoCard } from '../ui.js';
import { earth, latLon, pin, spaceBackdrop } from '../kit3d.js';
import { mkL, bg, dust, slam, txt, clock, pict, ecg, cutEarth, GOLD, CYAN, RED } from '../lib14.js';

const has = (k) => !!(film.cues.s && film.cues.s[k]);
const GRID = (s) => s.div('fill', { backgroundImage: 'linear-gradient(rgba(111,216,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(111,216,255,.06) 1px, transparent 1px)', backgroundSize: '80px 80px' });
const inner = (g) => ({ div: (c, st, h) => g.appendChild(el('div', c, st, h)) });
// boarding pass
function pass(name, hi) {
  return `<div style="position:absolute;inset:0;border-radius:18px;background:linear-gradient(180deg,#f3ead6,#e2d6ba);box-shadow:0 26px 70px rgba(0,0,0,.65);overflow:hidden;color:#1b2238;font-family:'Space Mono',monospace">
    <div style="position:absolute;left:0;right:0;top:0;height:58px;background:${hi ? '#b3261e' : '#1b2a4a'};color:#fff;font-weight:700;font-size:24px;letter-spacing:.34em;line-height:58px;padding-left:28px">BOARDING PASS · OCT 1971</div>
    <div style="position:absolute;left:28px;top:74px;font-size:17px;letter-spacing:.3em;opacity:.6">PASSENGER</div>
    <div style="position:absolute;left:28px;top:96px;font-size:${hi ? 58 : 46}px;font-weight:700;letter-spacing:.04em;color:${hi ? '#b3261e' : '#1b2238'}">${name}</div>
    <div style="position:absolute;left:28px;top:178px;font-size:17px;letter-spacing:.3em;opacity:.6">FROM / TO</div>
    <div style="position:absolute;left:28px;top:200px;font-size:26px;font-weight:700;letter-spacing:.1em">WASHINGTON ⟲ WASHINGTON</div>
    <div style="position:absolute;right:0;top:58px;bottom:0;width:150px;border-left:3px dashed rgba(27,34,56,.45);background:repeating-linear-gradient(90deg,#1b2238 0 5px,transparent 5px 9px,#1b2238 9px 11px,transparent 11px 18px);background-size:100% 100%;background-clip:content-box;padding:26px 26px 26px 30px"></div></div>`;
}

export default function ([P0, P1]) {
  // ───────── C1  Newton: one clock for the whole universe ─────────
  defScene('c1_newton', P0, T('75') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 66% 50%, #121c38 0%, #060914 58%, #010205 100%)'); GRID(s);
    photoCard(s, '/gfx/img/newton1689.jpg', { x: 110, y: 170, w: 600, h: 740 }, L('74') - 0.3, null, { pos: '50% 18%' });
    lowerThird(s, 'ISAAC NEWTON', 'Principia · 1687', L('74') - 0.1, d + 1, { bottom: 96 });
    txt(s, 'mont sh', 'Sadiyon tak science ka jawab:', { left: '790px', top: '150px', fontSize: '50px', fontWeight: 700, color: 'rgba(245,241,232,.85)' }, L('72') - 0.05, null, { opacity: 0, y: 16 }, 0.45);
    stamp(s, 'HARGIZ NAHI', L('73') - 0.05, { x: 800, y: 222, size: 84, rot: -4 }); s.sfx('slam', L('73'), { gain: 0.9 });
    const cs = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) cs.push(clock(s, { x: 900 + c * 250, y: 560 + r * 250, r: 96, color: '#F5F1E8', sweep: false }));
    cs.forEach((c, i) => show(s, c, L('74', 'waqt') - 0.1 + i * 0.06, null, { opacity: 0, scale: 0.6 }, 0.35));
    s.onUpdate((lt) => cs.forEach((c) => c.set(36610 + lt)));
    txt(s, 'bebas sh', 'EK HI RAFTAAR', { left: '1250px', top: '236px', fontSize: '110px', color: CYAN }, L('74', 'ek') - 0.05, null, { opacity: 0, x: 30 }, 0.35);
    cap(s, 'Mera ek second = aapka ek second = <span class="hc">sab barabar</span>', L('74', 'mera') - 0.05, d + 1, { size: 44, bottom: 40, style: { paddingLeft: '760px', paddingRight: '60px' } });
    s.sfx('clock', L('74', 'waqt'), { dur: Math.max(1, d - L('74', 'waqt')), gain: 0.9 });
    s.div('vig');
  }, { fin: 0.3 });

  // ───────── C2  Einstein: two rules ─────────
  defScene('c2_einstein', T('75') - 0.05, T('84') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, t1 = L('77') - 0.05, t2 = L('79') - 0.05, t3 = L('81') - 0.1;
    bg(s, 'radial-gradient(ellipse at 34% 50%, #132448 0%, #060a16 58%, #010205 100%)'); GRID(s);
    const ph = photoCard(s, '/gfx/img/einstein1921.jpg', { x: 110, y: 170, w: 560, h: 740 }, 0.02, t3, { pos: '50% 20%', from: { x: -60, opacity: 0 } });
    lowerThird(s, 'ALBERT EINSTEIN', 'Relativity · 1905 aur 1915', L('75') - 0.05, t3, { bottom: 96 });
    flash(s, 0, { peak: 0.45, dur: 0.3 }); s.sfx('hit', 0, { gain: 0.9 });
    const rule = (n, y, t, a, b, moving) => {
      const g = s.div(null, { position: 'absolute', left: '760px', top: y + 'px', width: '1060px', height: '330px', borderRadius: '22px', background: 'linear-gradient(180deg,rgba(14,22,44,.82),rgba(6,10,22,.86))', border: '1.5px solid rgba(255,255,255,.14)' });
      g.appendChild(el('div', 'bebas', { position: 'absolute', left: '34px', top: '18px', fontSize: '150px', color: GOLD, lineHeight: '1' }, n));
      const A = el('div', 'bebas', { position: 'absolute', left: '140px', top: '34px', fontSize: '82px', lineHeight: '1' }, a), B = el('div', 'bebas', { position: 'absolute', left: '140px', top: '124px', fontSize: '82px', lineHeight: '1', color: CYAN }, b);
      g.append(A, B);
      const fast = clock(inner(g), { x: 730, y: 165, r: 92, color: '#F5F1E8', sweep: true }), slow = clock(inner(g), { x: 940, y: 165, r: 92, color: CYAN, sec: '#fff', sweep: true });
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '638px', top: '276px', width: '184px', textAlign: 'center', fontSize: '20px', fontWeight: 700, letterSpacing: '.2em', color: 'rgba(245,241,232,.7)' }, moving ? 'RUKI HUI' : 'DOOR'));
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '848px', top: '276px', width: '184px', textAlign: 'center', fontSize: '20px', fontWeight: 700, letterSpacing: '.2em', color: CYAN }, moving ? 'TEZ' : 'QAREEB'));
      show(s, g, t, null, { opacity: 0, x: 80 }, 0.5); s.tl.fromTo(B, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.35 }, L(String(+moving ? 78 : 80), 'utna') - 0.05);
      s.onUpdate((lt) => { const k = Math.max(0, lt - t); fast.set(36610 + k * 6); slow.set(36610 + k * 2.2); if (moving) slow.style.translate = `${(Math.sin(lt * 7) * 16).toFixed(1)}px 0`; });
      s.sfx('whoosh', t, { gain: 0.6 }); s.sfx('ding', L(String(moving ? 78 : 80), 'utna'), { gain: 0.6 });
      return g;
    };
    const g1 = rule('1', 170, t1, 'TEZ RAFTAAR', '= SUST WAQT', true), g2 = rule('2', 540, t2, 'ZYADA GRAVITY', '= SUST WAQT', false);
    s.tl.to([g1, g2], { opacity: 0, duration: 0.35 }, t3 - 0.1);
    // "ghadi ki kharabi nahi — waqt khud sust ho jata hai — aapka dil dheere dhadakta hai"
    txt(s, 'mono sh', 'GHADI KI KHARABI NAHI', { left: '0', width: W + 'px', top: '150px', textAlign: 'center', fontSize: '40px', fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em', color: RED }, t3 + 0.1, null, { opacity: 0, y: -12 }, 0.4);
    slam(s, 'WAQT <span style="color:#6FD8FF">KHUD</span> SUST HO JATA HAI', L('82') - 0.06, { cls: 'bebas sh', size: 150, y: 240, from: 1.3, amp: 8 });
    const tH = L('83') - 0.1;
    const e1 = ecg(s, { x: 160, y: 470, w: 1600, h: 190, color: 'rgba(245,241,232,.55)', ppb: 250, phase: (lt) => Math.max(0, lt - tH) * 1.25 });
    const e2 = ecg(s, { x: 160, y: 700, w: 1600, h: 190, color: RED, ppb: 250, phase: (lt) => Math.max(0, lt - tH) * 0.52 });
    show(s, e1, tH, null, { opacity: 0 }, 0.3); show(s, e2, tH, null, { opacity: 0 }, 0.3);
    txt(s, 'mono', 'AAM RAFTAAR', { left: '160px', top: '452px', fontSize: '22px', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(245,241,232,.6)' }, tH, null, { opacity: 0 }, 0.3);
    txt(s, 'mono', 'JAB WAQT SUST HO — AAPKA DIL', { left: '160px', top: '682px', fontSize: '22px', fontWeight: 700, letterSpacing: '.3em', color: RED }, tH, null, { opacity: 0 }, 0.3);
    for (let b = 0; b < 4; b++) if (tH + 0.7 + b / 0.52 < d - 0.2) s.sfx('heartbeat', tH + 0.7 + b / 0.52, { gain: 0.8 });
    cap(s, '…aur aapko <span class="hl">kuch mehsoos nahi hota</span>', L('83', 'aur') - 0.05, d + 1, { size: 46, bottom: 70 });
    s.sfx('hit', L('82') + 0.14, { gain: 0.9 });
    s.div('vig');
  });

  // ───────── C3  "Yeh to sirf theory hai." — Nahi. ─────────
  defScene('c3_theory', T('84') - 0.05, T('85') - 0.05, (s) => {
    const L = mkL(s); bg(s, '#000');
    txt(s, 'play sh', '“Yeh to sirf theory hai.”', { left: '0', width: W + 'px', top: '330px', textAlign: 'center', fontSize: '110px', fontStyle: 'italic', color: 'rgba(245,241,232,.9)' }, 0.04, null, { opacity: 0, y: 20 }, 0.35);
    const t = L('84', 'Nahi') - 0.05; slam(s, 'NAHI.', t, { size: 300, y: 520, color: RED, amp: 18 }); flash(s, t + 0.2, { peak: 0.28, dur: 0.3, color: '#ff5a5a' });
    s.sfx('boom', t + 0.02, { gain: 1.0 });
  });

  // ───────── C4a  "Saal 1971. Washington." ─────────
  defScene('c4a_1971', T('85') - 0.05, T('87') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x01030a, fov: 34 }); const bd = spaceBackdrop(st, { gain: 0.3, count: 3000, seed: 6 });
    const E = earth(); st.scene.add(E); E.rotation.y = -0.25; E.position.set(0, -1.5, 0); E.scale.setScalar(1.7);
    st.frame = (lt) => { bd.update(lt); E.rotation.y = -0.2 + lt * 0.03; st.camera.position.set(0, 0.4, 5.2); st.camera.lookAt(0, 0.1, 0); };
    slam(s, '1971', L('85'), { cls: 'bebas', size: 520, y: 150, from: 1.6, dur: 0.16, drift: 0.06, amp: 16, style: { textShadow: '0 0 60px rgba(160,200,255,.4)', letterSpacing: '.04em' } });
    txt(s, 'mono cyan', 'WASHINGTON', { left: '0', width: W + 'px', top: '650px', textAlign: 'center', fontSize: '60px', fontWeight: 700, letterSpacing: '.9em', paddingLeft: '.9em' }, L('86'), null, { opacity: 0, letterSpacing: '1.6em' }, 0.4);
    flash(s, L('85'), { peak: 0.6, dur: 0.35 }); s.sfx('braam', Math.max(0, L('85') - 0.03), { gain: 1.0 }); s.sfx('hit', L('86'), { gain: 0.8 });
    s.div('vig');
  });

  // ───────── C4b  four tickets: two for the scientists, two for "Mr. Clock" ─────────
  defScene('c4b_tickets', T('87') - 0.05, T('93') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 40%, #13213f 0%, #070b18 58%, #010205 100%)'); GRID(s);
    dateline(s, '1971', 'US NAVAL OBSERVATORY · WASHINGTON', 0.05, null, { style: { top: '96px' } });
    const P = [['J. C. HAFELE', 0, L('87', 'ticket') - 0.1, 200, 330, -5], ['R. E. KEATING', 0, L('88') - 0.05, 300, 610, 3], ['MR. CLOCK', 1, L('91') - 0.1, 1010, 300, 4], ['MR. CLOCK', 1, L('91') + 0.22, 1090, 590, -4]];
    P.forEach(([nm, hi, t, x, y, rot]) => { const c = s.div(null, { position: 'absolute', left: x + 'px', top: y + 'px', width: '700px', height: '262px' }, pass(nm, hi));
      gsap.set(c, { autoAlpha: 0, rotate: rot }); s.tl.set(c, { autoAlpha: 1 }, t).fromTo(c, { y: -260, opacity: 0, rotate: rot * 3 }, { y: 0, opacity: 1, rotate: rot, duration: 0.45, ease: 'power3.out' }, t); s.sfx('paper', t, { gain: 0.9 }); s.sfx('thud', t + 0.4, { gain: 0.5 }); });
    txt(s, 'mono sh', 'DO APNE LIYE', { left: '200px', top: '920px', width: '800px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.4em', color: 'rgba(245,241,232,.85)' }, L('88') - 0.05, null, { opacity: 0 }, 0.3);
    txt(s, 'mono sh', 'AUR DO… ?', { left: '1010px', top: '920px', width: '780px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.4em', color: RED }, L('89') - 0.05, null, { opacity: 0 }, 0.3);
    flash(s, L('91') - 0.1, { peak: 0.4, dur: 0.3 }); s.sfx('hit', L('91') + 0.3, { gain: 1.0 });
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── C4c  Mr. Clock is not a person: clocks strapped into seats, once around the world ─────────
  defScene('c4c_flight', T('93') - 0.05, T('97') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tF = L('95', 'duniya') - 0.3;
    const st = stage3d(s, { bg: 0x01030a, fov: 34 }); const bd = spaceBackdrop(st, { gain: 0.3, count: 3000, seed: 6 });
    const E = earth(); st.scene.add(E);
    const pts = []; for (let i = 0; i <= 240; i++) pts.push(latLon(38.9 + Math.sin(i / 240 * Math.PI * 2) * 9, -77 + i * 1.5, 1.035));
    const geo = new THREE.BufferGeometry().setFromPoints(pts), line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 })); E.add(line);
    const head = glow(0xffe9a8, 0.14, 1, 0.2, 2.0); E.add(head); const wp = pin(0x6fd8ff, 0.035); wp.position.copy(latLon(38.9, -77, 1.01)); wp.lookAt(wp.position.clone().multiplyScalar(2)); E.add(wp);
    st.frame = (lt) => { bd.update(lt); const k = smooth(tF, Math.max(tF + 1.5, d - 0.6), lt), n = Math.floor(k * 240); geo.setDrawRange(0, n + 1); head.position.copy(pts[n]);
      E.rotation.y = (-(-77 + n * 1.5) - 90) * Math.PI / 180 + 0.2; wp.userData.update(lt);
      const z = smooth(tF - 0.6, tF + 0.6, lt); E.position.set(lerp(2.6, 0.9, z), lerp(-0.2, 0, z), 0); st.camera.position.set(0, 0.9, 4.6); st.camera.lookAt(0.2, 0, 0); };
    s.div('scrim-l', { width: '56%' });
    // two seats with the instrument strapped in
    const seat = (x) => `<g transform="translate(${x} 0)"><rect x="0" y="0" width="250" height="330" rx="38" fill="#1c2742" stroke="rgba(255,255,255,.25)" stroke-width="3"/><rect x="28" y="24" width="194" height="70" rx="20" fill="#26345a"/><rect x="-16" y="318" width="282" height="96" rx="26" fill="#1c2742" stroke="rgba(255,255,255,.25)" stroke-width="3"/><rect x="-30" y="232" width="34" height="120" rx="12" fill="#101a30"/><rect x="246" y="232" width="34" height="120" rx="12" fill="#101a30"/>
      <rect x="34" y="120" width="182" height="190" rx="10" fill="#c9ced8" stroke="#0a0d15" stroke-width="4"/><circle cx="125" cy="188" r="50" fill="#0a0d15" stroke="#e9b955" stroke-width="4"/><line class="hnd" x1="125" y1="188" x2="125" y2="148" stroke="#e9b955" stroke-width="5" stroke-linecap="round"/><rect x="54" y="258" width="60" height="26" rx="4" fill="#0a0d15"/><circle cx="150" cy="271" r="9" fill="#b3261e"/><circle cx="182" cy="271" r="9" fill="#2a7a3a"/>
      <rect x="-6" y="238" width="262" height="16" fill="#e9b955"/><rect x="-6" y="130" width="262" height="12" fill="#e9b955" opacity=".9"/><rect x="104" y="232" width="42" height="28" rx="5" fill="#0a0d15" stroke="#e9b955" stroke-width="3"/></g>`;
    const sv = svg(s, `<g transform="translate(200 330)">${seat(0)}${seat(340)}</g>`); show(s, sv, 0.05, null, { opacity: 0, y: 40 }, 0.5);
    const hn = sv.querySelectorAll('.hnd'); s.onUpdate((lt) => hn.forEach((h, i) => h.setAttribute('transform', `rotate(${((lt * 60 + i * 40) % 360).toFixed(1)} 125 188)`)));
    stamp(s, 'INSAAN NAHI', L('94', 'insaan') - 0.05, { x: 250, y: 150, size: 96, rot: -4, out: L('95') - 0.05 });
    txt(s, 'bebas sh', 'ATOMIC GHADIYAN', { left: '170px', top: '146px', fontSize: '130px', color: GOLD }, L('95', 'atomic') - 0.05, null, { opacity: 0, x: -30 }, 0.4);
    txt(s, 'mono sh', 'SEAT PAR BANDHI HUI', { left: '176px', top: '778px', fontSize: '32px', fontWeight: 700, letterSpacing: '.36em', color: 'rgba(245,241,232,.85)' }, L('95', 'seat') - 0.05, null, { opacity: 0 }, 0.35);
    txt(s, 'mono sh', 'DUNIYA KA POORA CHAKKAR', { left: '1010px', top: '120px', width: '800px', textAlign: 'center', fontSize: '34px', fontWeight: 700, letterSpacing: '.36em', color: CYAN }, tF + 0.3, null, { opacity: 0 }, 0.4);
    if (has('96')) cap(s, 'Unhein khana mila ya nahi — <span class="hl">tareekh khamosh hai</span>', L('96') - 0.05, d + 1, { size: 44, bottom: 70 });
    s.sfx('slam', L('94', 'insaan'), { gain: 0.8 }); s.sfx('shimmer', L('95', 'atomic'), { gain: 0.7 }); s.sfx('whoosh', tF, { gain: 0.7 }); s.sfx('swell', tF, { dur: Math.max(1.2, d - tF - 0.8), gain: 0.6 });
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── C4d  the result ─────────
  defScene('c4d_result', T('97') - 0.05, T('100') - 0.05, (s) => {
    const L = mkL(s), d = s.t1 - s.t0;
    bg(s, 'radial-gradient(ellipse at 50% 46%, #10213f 0%, #060a16 58%, #010205 100%)'); GRID(s);
    txt(s, 'mono sh', 'WAPAS AA KAR — ZAMEEN KI GHADI SE MILAYA', { left: '0', width: W + 'px', top: '128px', textAlign: 'center', fontSize: '32px', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(245,241,232,.8)' }, 0.05, null, { opacity: 0 }, 0.4);
    slam(s, 'WAQT <span style="color:#FF4B4B">ALAG</span> NIKLA', L('98', 'alag') - 0.3, { cls: 'bebas sh', size: 160, y: 176, from: 1.3, amp: 10 });
    const row = (y, lab, val, pre, t) => { const g = s.div('panel', { left: '260px', top: y + 'px', width: '1400px', height: '170px' });
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '44px', top: '34px', fontSize: '30px', fontWeight: 700, letterSpacing: '.24em', color: 'rgba(245,241,232,.8)' }, lab));
      g.appendChild(el('div', 'mono', { position: 'absolute', left: '44px', top: '96px', fontSize: '24px', letterSpacing: '.14em', color: CYAN }, 'EINSTEIN KI PESHGOI: ' + pre));
      g.appendChild(el('div', 'bebas', { position: 'absolute', right: '50px', top: '20px', fontSize: '140px', lineHeight: '1', color: GOLD }, val));
      show(s, g, t, null, { opacity: 0, x: 60 }, 0.45); s.sfx('ding', t + 0.3, { gain: 0.7 }); };
    row(378, 'MASHRIQ KI TARAF UDI GHADIYAN', '−59 ns', '−40 ± 23 ns', L('99') - 0.1); row(566, 'MAGHRIB KI TARAF UDI GHADIYAN', '+273 ns', '+275 ± 21 ns', L('99', 'aur') - 0.1);
    txt(s, 'mont sh', '1 nanosecond = ek second ka <span style="color:#E9B955">arabwan hissa</span>', { left: '0', width: W + 'px', top: '762px', textAlign: 'center', fontSize: '40px', fontWeight: 700 }, L('99', 'arabwen') - 0.05, null, { opacity: 0, y: 14 }, 0.4);
    stamp(s, 'EINSTEIN ✓', L('99', 'Einstein') - 0.05, { cls: 'green', x: 720, y: 836, size: 78, rot: -3 }); s.sfx('hit', L('98', 'alag') - 0.1, { gain: 0.9 }); s.sfx('chime', L('99', 'Einstein'), { gain: 0.8 });
    s.div('vig');
  }, { fin: 0.2 });

  // ───────── C5  the Colorado clocks again → your head is older than your feet ─────────
  const c5end = has('105') ? T('105') - 0.05 : P1 + 0.3;
  defScene('c5_head', T('100') - 0.05, c5end, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tP = L('102') - 0.1;
    bg(s, 'radial-gradient(ellipse at 50% 50%, #0d2140 0%, #060c1c 55%, #010308 100%)'); GRID(s);
    const grp = s.div(null, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
    const cA = clock(inner(grp), { x: 960, y: 300, r: 160, sweep: true }), cB = clock(inner(grp), { x: 960, y: 740, r: 160, sweep: true });
    grp.appendChild(el('div', null, { position: 'absolute', left: '0', right: '0', top: '940px', height: '6px', background: 'linear-gradient(90deg,rgba(111,216,255,0),rgba(111,216,255,.8),rgba(111,216,255,0))' }));
    const up = el('div', 'bebas', { position: 'absolute', left: '1190px', top: '236px', fontSize: '120px', color: GOLD }, 'OONCHI = TEZ'); grp.appendChild(up);
    const gv = el('div', 'mono', { position: 'absolute', left: '1196px', top: '372px', fontSize: '30px', fontWeight: 700, letterSpacing: '.24em', color: CYAN, lineHeight: '1.5' }, 'ZAMEEN SE ZARA DOOR<br>GRAVITY ZARA KAM'); grp.appendChild(gv);
    s.tl.fromTo(grp, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.02).fromTo(up, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35 }, L('101') - 0.05).fromTo(gv, { opacity: 0 }, { opacity: 1, duration: 0.4 }, L('101', 'kyunke') - 0.05).to(grp, { opacity: 0, duration: 0.3 }, tP - 0.1);
    dateline(s, '2010', 'NIST · BOULDER, COLORADO', 0.05, tP, { style: { top: '110px' } });
    // the viewer
    const man = s.div(null, { position: 'absolute', left: '560px', top: '170px' }, pict('person', 800, 'rgba(245,241,232,.94)'));
    const cH = clock(s, { x: 1330, y: 290, r: 124, color: GOLD, sec: '#fff', sweep: true }), cF = clock(s, { x: 1330, y: 850, r: 124, color: CYAN, sec: '#fff', sweep: true });
    const lH = svg(s, `<path d="M 1010 250 L 1196 280" stroke="${GOLD}" stroke-width="4" stroke-dasharray="10 10"/><path d="M 1030 950 L 1196 860" stroke="${CYAN}" stroke-width="4" stroke-dasharray="10 10"/>`);
    [man, cH, cF, lH].forEach((n) => show(s, n, tP, null, { opacity: 0, y: 20 }, 0.5));
    s.onUpdate((lt) => { const b = 36612 + lt; cB.set(b); cA.set(b + lt * 1.6); cF.set(b); cH.set(b + Math.max(0, lt - tP) * 1.9); });
    txt(s, 'bebas sh', 'SAR', { left: '1480px', top: '236px', fontSize: '110px', color: GOLD }, L('103', 'SAR') - 0.05, null, { opacity: 0, x: 20 }, 0.3);
    txt(s, 'bebas sh', 'PAIR', { left: '1480px', top: '796px', fontSize: '110px', color: CYAN }, L('103', 'PAIRON') - 0.05, null, { opacity: 0, x: 20 }, 0.3);
    const h = slam(s, 'AAPKA SAR<br><span style="color:#E9B955">ZYADA BOODHA</span> HAI', L('103', 'zyada') - 0.06, { cls: 'bebas sh', size: 124, x: 80, w: 560, y: 380, align: 'left', lh: '1.0', from: 1.4, amp: 10, style: { whiteSpace: 'normal' } });
    txt(s, 'mono sh', '80 SAAL MEIN FARQ:', { left: '84px', top: '760px', fontSize: '26px', fontWeight: 700, letterSpacing: '.24em', color: 'rgba(245,241,232,.75)' }, L('104') - 0.05, null, { opacity: 0 }, 0.35);
    txt(s, 'bebas sh', '0.000 000 47 SECOND', { left: '80px', top: '796px', fontSize: '74px', color: '#fff' }, L('104', 'ek') - 0.05, null, { opacity: 0, x: -20 }, 0.35);
    txt(s, 'mont sh', '— lekin <span style="color:#E9B955">hai</span>.', { left: '84px', top: '884px', fontSize: '44px', fontWeight: 800 }, L('104', 'lekin') - 0.05, null, { opacity: 0, y: 10 }, 0.3);
    txt(s, 'mont', 'farq bada kar ke dikhaya gaya hai', { left: '1130px', top: '986px', width: '500px', textAlign: 'center', fontSize: '22px', fontWeight: 600, letterSpacing: '.08em', color: 'rgba(245,241,232,.5)' }, tP + 0.4, null, { opacity: 0 }, 0.4);
    s.sfx('clock', 0.1, { dur: d - 0.2, gain: 0.8 }); s.sfx('whoosh', tP, { gain: 0.6 }); s.sfx('pop', L('103', 'SAR'), { gain: 0.9 }); s.sfx('pop', L('103', 'PAIRON'), { gain: 0.9 }); s.sfx('braam', L('103', 'zyada') - 0.06, { gain: 0.85 }); s.sfx('tick', L('104', 'lekin'), { gain: 1.0 });
    s.div('vig');
  }, { fin: 0.2, fout: has('105') ? 0 : 0.3 });

  // ───────── C6  (optional lines 105-107) the Earth's centre is 2.5 years younger than its surface ─────────
  if (has('105')) defScene('c6_core', T('105') - 0.05, P1 + 0.3, (s) => {
    const L = mkL(s), d = s.t1 - s.t0, tC = L('106', 'markaz') - 0.2;
    const st = stage3d(s, { bg: 0x01030a, fov: 34 }); const bd = spaceBackdrop(st, { gain: 0.34, count: 3200, seed: 9 });
    const E = cutEarth(); st.scene.add(E); st.scene.add(new THREE.AmbientLight(0xffffff, 0.75)); const dl = new THREE.DirectionalLight(0xfff2dc, 2.8); dl.position.set(-2, 2.5, 4); st.scene.add(dl);
    st.frame = (lt) => { bd.update(lt); const k = smooth(0, d, lt); E.rotation.set(0.2, -0.95 + k * 0.4, 0); E.position.set(-1.05, 0, 0); E.userData.core.scale.setScalar(0.8 + 0.12 * Math.sin(lt * 3)); st.camera.position.set(0, 0.25, lerp(5.0, 4.2, k)); st.camera.lookAt(-0.2, 0, 0); };
    s.div('scrim-r', { width: '52%' });
    txt(s, 'mono sh', 'GEHRAI MEIN → GRAVITY KA ASAR ZYADA', { left: '1010px', top: '150px', fontSize: '28px', fontWeight: 700, letterSpacing: '.24em', color: CYAN }, 0.1, null, { opacity: 0 }, 0.4);
    txt(s, 'mono sh', 'SATAH', { left: '1014px', top: '250px', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: 'rgba(245,241,232,.8)' }, L('106', 'satah') - 0.3, null, { opacity: 0 }, 0.3);
    txt(s, 'bebas sh', '4.5 ARAB SAAL', { left: '1010px', top: '286px', fontSize: '120px' }, L('106', 'satah') - 0.3, null, { opacity: 0, x: 30 }, 0.35);
    txt(s, 'mono sh', 'MARKAZ', { left: '1014px', top: '470px', fontSize: '30px', fontWeight: 700, letterSpacing: '.4em', color: GOLD }, tC, null, { opacity: 0 }, 0.3);
    const y = slam(s, '2.5 SAAL CHHOTA', L('106', 'DHAAI') - 0.06, { cls: 'bebas sh', size: 150, x: 1010, w: 820, y: 506, align: 'left', color: GOLD, from: 1.4, amp: 12 });
    txt(s, 'mont sh', 'hisaab ke mutabiq (Uggerhøj et al., 2016)', { left: '1014px', top: '676px', fontSize: '28px', fontWeight: 600, color: 'rgba(245,241,232,.65)' }, L('106', 'DHAAI') + 0.5, null, { opacity: 0 }, 0.4);
    if (has('107')) txt(s, 'bebas sh', 'EK HI SAYYARA — <span style="color:#6FD8FF">DO UMREIN</span>', { left: '1010px', top: '790px', fontSize: '92px' }, L('107') - 0.05, null, { opacity: 0, y: 16 }, 0.35);
    s.sfx('swell', 0.1, { dur: 1.6, gain: 0.7 }); s.sfx('impact', L('106', 'DHAAI') + 0.1, { gain: 0.9 }); if (has('107')) s.sfx('hit', L('107'), { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.25, fout: 0.3 });
}
