// PART B — "Woh kainat jo hamesha se thi" (spoken lines 18..60).  All timing comes from cues: T('<line>') / TW('<line>', wordIndex).
// Derived stills (gfx/img/b_*.jpg) are made by out/b/prep_b.py; footage frames: frames/b_xdfflight (A01_xdf_flight_svs30681.mp4, 3.0–13.0 s).
import { defScene, stage3d, T, TW, gsap, THREE, el, image, track, clamp, lerp, smooth, ease, noise1, rng, glowTexture, W, H } from '../engine.js';
import { cap, big, lowerThird, dateline, stamp, flash, show, footage, counter, svg, shake, words, photoCard } from '../ui.js';
import { spaceBackdrop, galaxyField, glow, starfield, gridPlane, earth, latLon, pin } from '../kit3d.js';
import { IMG } from '../assets.js';

const GI = '/gfx/img/';
const PIC = { e47: GI + 'b_einstein47.jpg', e21: GI + 'b_einstein21.jpg', ari: GI + 'b_aristotle.jpg', rus: GI + 'b_russell.jpg', hooker: GI + 'b_hooker.jpg', hubble: GI + 'b_hubble.jpg', stars: GI + 'b_stars.jpg', m51: GI + 'b_m51.jpg', lem: IMG.lemaitre || IMG.placeholder };
const X = 0.3;                                                    // standard dissolve: outgoing scene runs X longer, incoming fades in on top

// ---------- local helpers ----------
const LL = (s) => (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0;
// reveal the words of `node` on the spoken words of line `id` (node word i <-> spoken word from+i)
function sync(s, node, id, o = {}) {
  const ws = words(node), from = o.from || 0;
  ws.forEach((w, i) => s.tl.fromTo(w, { opacity: 0, y: o.y ?? 16 }, { opacity: 1, y: 0, duration: o.dur ?? 0.36, ease: 'power2.out' }, Math.max(0, TW(id, from + i) - s.t0 - (o.lead ?? 0.08))));
  return ws;
}
// reveal hand-made .k spans at explicit local times; o.slam = index of the word that hits hard
function keys(s, root, times, o = {}) {
  const ks = [...root.querySelectorAll('.k')]; ks.forEach((k) => { k.style.display = 'inline-block'; });
  ks.forEach((k, i) => {
    const hit = i === o.slam, t = Math.max(0, times[Math.min(i, times.length - 1)] - (hit ? 0.16 : 0.06));
    s.tl.fromTo(k, { opacity: 0, scale: hit ? 2.3 : 1.4, y: hit ? 0 : 18 }, { opacity: 1, scale: 1, y: 0, duration: hit ? 0.22 : 0.3, ease: hit ? 'power4.in' : 'power3.out' }, t);
  });
  return ks;
}
const pic = (parent, src, style) => parent.appendChild(image(src, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', ...(style || {}) }));
const proj = (st, v) => { const p = v.clone().project(st.camera); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H]; };
const brightEarth = (g, gain = 1.25) => {
  const m = g.userData.mat; m.fragmentShader = m.fragmentShader.replace('gl_FragColor = vec4(col, 1.0);', `gl_FragColor = vec4(pow(col * ${gain.toFixed(2)}, vec3(0.4545)), 1.0);`); m.needsUpdate = true;
  track(new Promise((res) => { let n = 0; const chk = () => { const a = m.uniforms.dayT.value.image, b = m.uniforms.nightT.value.image; if ((a && b) || ++n > 400) res(); else setTimeout(chk, 25); }; chk(); }));      // asset wait only (not animation)
  return g;
};
const ICO = {
  ok: (c = '#57E39A') => `<svg width="34" height="34" viewBox="0 0 34 34" style="vertical-align:-6px;margin-right:12px"><path d="M5 18 L14 27 L30 8" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  no: (c = '#FF4B4B') => `<svg width="34" height="34" viewBox="0 0 34 34" style="vertical-align:-6px;margin-right:12px"><path d="M7 7 L27 27 M27 7 L7 27" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`,
  arrow: (down) => `<svg width="64" height="92" viewBox="0 0 64 92" style="vertical-align:-10px;margin-left:14px;${down ? 'transform:rotate(180deg)' : ''}"><path d="M32 86 V14 M8 40 L32 10 L56 40" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
// soft dust puffs (impact on the ground)
function dust(s, xs, y, t, col = '160,175,205') {
  xs.forEach((x, i) => {
    const b = s.div(null, { position: 'absolute', left: (x - 160) + 'px', top: (y - 120) + 'px', width: '320px', height: '240px', borderRadius: '50%', background: `radial-gradient(ellipse at 50% 60%, rgba(${col},.5) 0%, rgba(${col},.18) 45%, rgba(${col},0) 72%)`, opacity: '0' });
    s.tl.fromTo(b, { opacity: 0, scale: 0.35, y: 0 }, { opacity: 0.9, scale: 1, duration: 0.22, ease: 'power2.out' }, t + i * 0.02).to(b, { opacity: 0, scale: 1.9, y: -70 - 14 * (i % 3), duration: 1.3, ease: 'power1.out' }, t + 0.24 + i * 0.02);
  });
}
// Einstein field equation (same markup as the cold open)
const EQ = () => `<span class="eqi">R</span><sub>μν</sub> <span class="op">−</span> <span class="half">½</span> <span class="eqi">g</span><sub>μν</sub><span class="eqi">R</span> <span class="op">=</span> <span class="frac"><span>8π<span class="eqi">G</span></span><span><span class="eqi">c</span><sup>4</sup></span></span> <span class="eqi">T</span><sub>μν</sub>`;
const EQCSS = `<style>
.eq{font-family:'STIX Two Text',serif;font-size:118px;color:#fff;white-space:nowrap;text-shadow:0 0 34px rgba(150,205,255,.55),0 0 90px rgba(120,180,255,.25)}
.eq .eqi{font-style:italic}.eq sub{font-size:.5em;vertical-align:-.28em;font-style:italic;margin-left:.02em}.eq sup{font-size:.55em;vertical-align:.55em}
.eq .op{margin:0 .16em}.eq .frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.74em;line-height:1.05;margin:0 .1em}
.eq .frac>span:first-child{border-bottom:3px solid #fff;padding:0 .18em .04em}.eq .frac>span:last-child{padding-top:.04em}
</style>`;

// ---- the metaphor: a star picture in a gilded frame hanging from a nail (used twice: it hangs in b3, falls in b7) ----
function hangPicture(s) {
  const world = s.div('fill', { transformOrigin: '960px 500px', background: '#0d1220' });
  world.innerHTML = `<div class="fill" style="background:linear-gradient(180deg,#1c2542 0%,#141b32 55%,#0c1120 100%)"></div>
    <div class="fill" style="background:repeating-linear-gradient(90deg,rgba(255,255,255,.024) 0 2px,rgba(255,255,255,0) 2px 96px)"></div>
    <div style="position:absolute;left:0;right:0;top:884px;height:196px;background:linear-gradient(180deg,#0a0e1b,#060912)"></div>
    <div style="position:absolute;left:0;right:0;top:874px;height:10px;background:linear-gradient(180deg,#3b486c,#121a2c)"></div>
    <div class="fill" style="background:radial-gradient(ellipse 860px 660px at 960px 410px,rgba(255,232,180,.24) 0%,rgba(255,232,180,.07) 55%,rgba(255,232,180,0) 78%)"></div>
    <div class="ghost" style="position:absolute;left:618px;top:258px;width:684px;height:484px;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 2px rgba(255,255,255,.07);opacity:0"></div>
    <div class="hang" style="position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:960px 168px">
      <svg width="1920" height="1080" style="position:absolute;left:0;top:0;overflow:visible"><path d="M 706 258 L 960 168 L 1214 258" fill="none" stroke="#a7aebf" stroke-width="2.5"/></svg>
      <div style="position:absolute;left:614px;top:254px;width:692px;height:492px;border-radius:5px;background:linear-gradient(135deg,#6b4a14 0%,#e8c56a 16%,#a9792a 36%,#f6dc94 54%,#8f6420 74%,#d9b358 100%);box-shadow:0 36px 70px rgba(0,0,0,.66),0 8px 16px rgba(0,0,0,.5),inset 0 0 0 3px rgba(255,240,190,.55),inset 0 0 0 10px rgba(90,60,14,.5),inset 0 0 0 13px rgba(250,225,150,.5),inset 0 0 0 30px rgba(120,84,24,.18)">
        <div class="pw" style="position:absolute;left:46px;top:46px;width:600px;height:400px;overflow:hidden;background:#000;box-shadow:0 0 0 4px #3d2a0a,0 0 0 8px #d9b358"></div>
      </div>
    </div>
    <div style="position:absolute;left:951px;top:159px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f2f4f8,#8b93a6 55%,#2c3242);box-shadow:0 3px 6px rgba(0,0,0,.6)"></div>`;
  const pw = world.querySelector('.pw'); pic(pw, PIC.stars);
  const glare = pw.appendChild(el('div', 'fill', { background: 'linear-gradient(115deg,rgba(255,255,255,.11) 0%,rgba(255,255,255,0) 32%)', boxShadow: 'inset 0 0 34px rgba(0,0,0,.75)' }));
  return { world, hang: world.querySelector('.hang'), ghost: world.querySelector('.ghost'), glare };
}

// ---- the fortress ("inkaar ka qila"): crenellated wall + two towers + gate + banner.  1920x1080 viewBox, ground at y=960.
// Exported so Part I can rebuild the same drawing and make it crumble: groups .q-side .q-wall .q-towerL .q-towerR .q-gate .q-banner .q-flag
export function qilaSVG(o = {}) {
  const GY = 960, text = o.banner ?? 'KAINAT HAMESHA SE HAI';
  const cren = (x0, x1, y, n, mh) => { const seg = (x1 - x0) / (2 * n - 1); let d = ''; for (let i = 0; i < 2 * n - 1; i++) { const xb = (x0 + (i + 1) * seg).toFixed(1); d += i % 2 === 0 ? ` V ${y - mh} H ${xb} V ${y}` : ` H ${xb}`; } return d; };
  const body = (d, cls) => `<g class="${cls}"><path d="${d}" fill="url(#qStone)"/><path d="${d}" fill="url(#qBrick)" stroke="#6c7fa8" stroke-width="3" stroke-linejoin="round"/>`;
  const tower = (cx, cls) => {
    const hw = 125, cp = 40, top = 250;
    const d = `M ${cx - hw} ${GY} V ${top + 112} L ${cx - hw - cp} ${top + 70} V ${top}${cren(cx - hw - cp, cx + hw + cp, top, 4, 46)} V ${top + 70} L ${cx + hw} ${top + 112} V ${GY} Z`;
    return body(d, cls) + `<rect x="${cx - 10}" y="${top + 170}" width="20" height="78" rx="10" fill="#ffd27c" opacity=".9"/><rect x="${cx - 10}" y="${top + 380}" width="20" height="78" rx="10" fill="#ffd27c" opacity=".55"/>
      <path d="M ${cx} ${top - 46} V ${top - 138}" stroke="#93a1c2" stroke-width="4"/><path class="q-flag" style="transform-origin:${cx}px ${top - 116}px" d="M ${cx} ${top - 138} L ${cx + 80} ${top - 117} L ${cx} ${top - 96} Z" fill="#E9B955"/></g>`;
  };
  const gate = `M 852 ${GY} V 800 A 108 108 0 0 1 1068 800 V ${GY} Z`;
  let bars = ''; for (let x = 874; x <= 1048; x += 29) bars += `M ${x} 680 V ${GY} `; for (let y = 730; y < GY; y += 52) bars += `M 852 ${y} H 1068 `;
  let cloth = 'M 650 512 H 1270 V 630'; for (let i = 1; i <= 20; i++) cloth += ` L ${1270 - i * 31} ${i % 2 ? 606 : 630}`; cloth += ' Z';
  return `<defs><linearGradient id="qStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34425f"/><stop offset="1" stop-color="#111727"/></linearGradient>
    <linearGradient id="qCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20346a"/><stop offset="1" stop-color="#0e1834"/></linearGradient>
    <pattern id="qBrick" width="110" height="60" patternUnits="userSpaceOnUse"><path d="M0 1 H110 M0 31 H110 M1 0 V30 M56 30 V60" stroke="rgba(160,185,230,.17)" stroke-width="2" fill="none"/></pattern>
    <clipPath id="qGateClip"><path d="${gate}"/></clipPath></defs>
    ${body(`M -40 ${GY} V 600${cren(-40, 296, 600, 4, 36)} V ${GY} Z`, 'q-side')}</g>${body(`M 1624 ${GY} V 600${cren(1624, 1960, 600, 4, 36)} V ${GY} Z`, 'q-side')}</g>
    ${body(`M 545 ${GY} V 450${cren(545, 1375, 450, 9, 40)} V ${GY} Z`, 'q-wall')}</g>
    ${tower(420, 'q-towerL')}${tower(1500, 'q-towerR')}
    <g class="q-gate"><path d="${gate}" fill="#03050a" stroke="#8fa2cc" stroke-width="9"/><path d="${bars}" stroke="rgba(150,170,210,.42)" stroke-width="4" fill="none" clip-path="url(#qGateClip)"/></g>
    <g class="q-banner"><path d="M 626 508 H 1294" stroke="#93a1c2" stroke-width="6" stroke-linecap="round"/><path d="${cloth}" fill="url(#qCloth)" stroke="#E9B955" stroke-width="3" stroke-linejoin="round"/>
      <text x="960" y="591" text-anchor="middle" font-family="Bebas Neue" font-size="76" letter-spacing="3" fill="#F2C968">${text}</text></g>
    <rect x="-40" y="${GY}" width="2000" height="140" fill="#04060c"/><path d="M -40 ${GY} H 1960" stroke="#52648c" stroke-width="3"/>`;
}

// ---- the thrown ball: lit sphere, floor grid, blob shadow, motion trail ----
const RB = 0.55, HF = 3.3;                                         // ball radius, height at which it "freezes"
function ballTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'), R = rng(31);
  x.fillStyle = '#ebe3d1'; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '120,100,70' : '255,255,255'},${0.03 + R() * 0.05})`; x.beginPath(); x.arc(R() * 1024, R() * 512, 1 + R() * 3, 0, 6.283); x.fill(); }
  x.strokeStyle = '#8c6a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 256); x.lineTo(1024, 256); x.stroke();       // seam + stitches around the equator
  x.strokeStyle = '#b08a3c'; x.lineWidth = 3;
  for (const off of [-32, -19, 19, 32]) for (let i = 0; i < 128; i++) { x.beginPath(); x.moveTo(i * 8 + 1, 256 + off - 3); x.lineTo(i * 8 + 6, 256 + off + 3); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function ballWorld(s) {
  const st = stage3d(s, { bg: 0x02040a, fov: 40 });
  st.scene.fog = new THREE.Fog(0x02040a, 15, 48);
  const stars = starfield({ count: 6000, radius: 260, seed: 61, px: 2.8 }); st.scene.add(stars);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshBasicMaterial({ color: 0x050a17 })); floor.rotation.x = -Math.PI / 2; st.scene.add(floor);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ map: glowTexture(0, 1.6), color: 0x1d4a86, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.01; pool.renderOrder = 1; st.scene.add(pool);
  const grid = gridPlane({ n: 60, size: 90, seg: 2, opacity: 0.3 }); grid.position.y = 0.02; grid.renderOrder = 2; st.scene.add(grid);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTexture(0.1, 1.5), color: 0x000000, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; shadow.renderOrder = 3; st.scene.add(shadow);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(RB, 48, 32), new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.58, metalness: 0 })); ball.renderOrder = 6; st.scene.add(ball);
  const key = new THREE.DirectionalLight(0xfff0d8, 3.3); key.position.set(5, 9, 6); const rim = new THREE.DirectionalLight(0x6fd8ff, 1.5); rim.position.set(-6, 3, -5);
  st.scene.add(key, rim, new THREE.HemisphereLight(0xa8c8ff, 0x0b1020, 1.25));
  const trail = []; for (let i = 0; i < 14; i++) { const t = glow(0xbfe6ff, 1, 0, 0.1, 1.8); t.material.fog = false; t.renderOrder = 5; st.scene.add(t); trail.push(t); }
  const setBall = (x, y, z, spin) => {
    ball.position.set(x, y, z); ball.rotation.set(spin * 2.6, 0.3, 0.55);
    const h = Math.max(0, y - RB); shadow.position.x = x; shadow.position.z = z; shadow.scale.setScalar(1.5 + h * 0.42); shadow.material.opacity = 0.85 / (1 + h * 0.55);
  };
  return { st, stars, ball, trail, setBall };
}

// ---- the shrinking universe (AAJ → KAL → PARSON → ek nuqta): shared by b11_steps and b11_rewind ----
const U = { R: 7.0, K: [1, 0.66, 0.4], cx: 800 }, ppu = (z) => 540 / Math.tan(20 * Math.PI / 180) / z;      // px per world unit at camera distance z (fov 40)
function uniWorld(s) {
  const st = stage3d(s, { bg: 0x000206, fov: 40 }); const bd = spaceBackdrop(st, { gain: 0.26, seed: 53 });
  const gal = galaxyField({ count: 170, radius: U.R, size: 1.0, seed: 57 }); st.scene.add(gal);
  return { st, bd, gal };
}

export default function ([P0, P1]) {
  let Z = 1;

  // ───────── B1  "Einstein itna pareshan kyun tha?" ─────────
  defScene('b1_pareshan', P0, T('19') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    s.div('fill', { background: 'radial-gradient(ellipse at 72% 46%, #0d1934 0%, #04070f 58%, #000 100%)' });
    const st = stage3d(s, { fov: 50 }); const stars = starfield({ count: 2200, radius: 300, seed: 5, px: 2.4 }); st.scene.add(stars);
    st.frame = (lt) => { stars.rotation.y = lt * 0.012; stars.material.uniforms.time.value = lt; st.camera.position.z = 10 - lt * 0.3; };
    const m = 'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.8) 30%, #000 56%)';
    const ph = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1000px', height: '1080px', overflow: 'hidden', WebkitMaskImage: m, maskImage: m });
    const im = pic(ph, PIC.e47, { objectPosition: '50% 16%', transformOrigin: '50% 36%' });
    ph.appendChild(el('div', 'fill', { background: 'linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,.6) 100%)' }));
    s.tl.fromTo(im, { scale: 1.02 }, { scale: 1.2, duration: d, ease: 'none' }, 0);
    const qm = s.div('anton', { position: 'absolute', left: '1250px', top: '30px', fontSize: '1040px', lineHeight: '1', color: 'rgba(233,185,85,.075)' }, '?');
    s.tl.fromTo(qm, { rotate: 6, scale: 0.94 }, { rotate: 12, scale: 1.08, duration: d, ease: 'none' }, 0);
    const ch = s.div(null, { position: 'absolute', left: '930px', top: '104px' }, `<div class="mono cyan sh" style="font-size:26px;font-weight:700;letter-spacing:.42em">PART 1</div><div class="rl" style="height:2px;width:540px;margin:14px 0 12px;background:linear-gradient(90deg,var(--cyan),rgba(111,216,255,0));transform-origin:0 50%"></div><div class="cinzel gold sh" style="font-size:27px;font-weight:700;letter-spacing:.2em">WOH KAINAT JO HAMESHA SE THI</div>`);
    show(s, ch, 0.15, null, { opacity: 0, x: 30 }, 0.7); s.tl.fromTo(ch.querySelector('.rl'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, 0.25);
    const hd = s.div(null, { position: 'absolute', left: '930px', top: '312px', width: '900px' });
    hd.innerHTML = `<div class="mont sh a" style="font-size:38px;font-weight:700;letter-spacing:.05em;color:rgba(245,241,232,.82)">Pehle yeh samjhiye —</div>
      <div class="bebas sh" style="font-size:150px;margin-top:22px"><span class="k">EINSTEIN</span> <span class="k">ITNA</span></div>
      <div class="anton" style="font-size:222px;line-height:1.1"><span class="k goldgrad" style="transform-origin:0 60%">PARESHAN</span></div>
      <div class="bebas sh" style="font-size:150px;margin-top:8px"><span class="k">KYUN</span> <span class="k">THA?</span></div>`;
    show(s, hd.querySelector('.a'), Math.max(0.1, L('18') - 0.05), null, { opacity: 0, x: 24 }, 0.5);
    keys(s, hd, [4, 5, 6, 7, 8].map((i) => L('18', i)), { slam: 2 });
    s.sfx('swell', 0.05, { dur: 1.6 }); s.sfx('hit', L('18', 6) + 0.04, { gain: 0.8 }); shake(s, hd, L('18', 6) + 0.06, 0.4, 10);
    s.div('vig');
  }, { fin: 0.35, z: Z++ });

  // ───────── B2  Aristotle → 2000+ saal → "kainat hamesha se hai" ─────────
  defScene('b2_athens', T('19'), T('20') + 0.02, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const tTl = Math.max(0.9, L('19', 5) - 0.2), tEnd = Math.max(tTl + 1.0, L('19', 8) + 0.12), tSci = Math.max(tEnd + 0.1, L('19', 11) - 0.1), tFal = Math.max(tSci + 0.3, L('19', 13) - 0.1), tRay = Math.max(tFal + 0.3, L('19', 15) - 0.1);
    const wrap = s.div('fill', { overflow: 'hidden', background: '#000' });
    const im = pic(wrap, IMG.schoolOfAthens, { objectPosition: '50% 60%', transformOrigin: '1010px 640px' });
    const dim = s.div('fill', { background: '#03060e' }); s.tl.fromTo(dim, { opacity: 0.26 }, { opacity: 0.72, duration: 0.7, ease: 'power2.out' }, tTl - 0.1);
    s.div('scrim-t');
    // call-out on Aristotle (the right-hand central figure); follows the Ken-Burns push
    const co = svg(s, `<circle class="r" cx="0" cy="0" r="40" fill="none" stroke="#F2C968" stroke-width="3.5"/><path class="l" d="" stroke="#F2C968" stroke-width="2.5" fill="none"/>`);
    const lab = s.div('cinzel sh', { position: 'absolute', left: '0', top: '0', fontSize: '44px', fontWeight: 700, letterSpacing: '.2em', whiteSpace: 'nowrap', color: '#F8DE9A', background: 'rgba(4,6,12,.78)', padding: '8px 22px 6px 26px', borderLeft: '4px solid #E9B955' }, 'ARISTOTLE');
    const ring = co.querySelector('.r'), ln = co.querySelector('.l');
    s.onUpdate((lt) => {
      const k = clamp(lt / d), e = k * 0.6 + (k * k * (3 - 2 * k)) * 0.4, sc = lerp(1.04, 2.0, e), tx = lerp(0, -50, e), ty = lerp(0, -205, e);
      im.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`;
      const hx = tx + 1010 + sc * 42, hy = ty + 640 - sc * 18, r = 38 * sc, ax = hx + r * 0.707, ay = hy - r * 0.707;
      ring.setAttribute('cx', hx.toFixed(1)); ring.setAttribute('cy', hy.toFixed(1)); ring.setAttribute('r', r.toFixed(1));
      ln.setAttribute('d', `M ${ax.toFixed(1)} ${ay.toFixed(1)} l 64 -64 h 44`);
      lab.style.left = (ax + 108).toFixed(1) + 'px'; lab.style.top = (ay - 100).toFixed(1) + 'px';
    });
    show(s, co, 0.15, tTl + 0.5, { opacity: 0 }, 0.4); show(s, lab, 0.22, tTl + 0.5, { opacity: 0, x: -20 }, 0.45); s.sfx('shimmer', 0.2, { gain: 0.6 });
    // timeline 350 BC → 1900s
    const tg = s.div('fill'); gsap.set(tg, { autoAlpha: 0 }); s.tl.set(tg, { autoAlpha: 1 }, tTl);
    const X0 = 330, X1 = 1590, Y = 770;
    tg.appendChild(el('div', null, { position: 'absolute', left: X0 + 'px', top: (Y - 2) + 'px', width: (X1 - X0) + 'px', height: '4px', background: 'rgba(245,241,232,.22)' }));
    for (let i = 1; i < 9; i++) tg.appendChild(el('div', null, { position: 'absolute', left: (X0 + (X1 - X0) * i / 9 - 1) + 'px', top: (Y - 12) + 'px', width: '2px', height: '24px', background: 'rgba(245,241,232,.3)' }));
    const fill = tg.appendChild(el('div', null, { position: 'absolute', left: X0 + 'px', top: (Y - 4) + 'px', width: (X1 - X0) + 'px', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg,#B8862E,#F8DE9A)', boxShadow: '0 0 24px rgba(233,185,85,.6)', transformOrigin: '0 50%' }));
    s.tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: tEnd - tTl - 0.1, ease: 'power1.inOut' }, tTl + 0.1);
    const med = (x, src, pos, yr, nm) => {
      const g = tg.appendChild(el('div', null, { position: 'absolute', left: (x - 84) + 'px', top: (Y - 84) + 'px', width: '168px' }));
      const c = g.appendChild(el('div', null, { position: 'relative', width: '168px', height: '168px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #E9B955', boxShadow: '0 0 0 6px rgba(4,6,12,.85),0 0 40px rgba(233,185,85,.35),0 16px 40px rgba(0,0,0,.7)', background: '#000' }));
      pic(c, src, { objectPosition: pos });
      g.appendChild(el('div', 'bebas sh', { textAlign: 'center', fontSize: '66px', marginTop: '16px', whiteSpace: 'nowrap', marginLeft: '-60px', marginRight: '-60px' }, yr));
      g.appendChild(el('div', 'mono cyan sh', { textAlign: 'center', fontSize: '22px', fontWeight: '700', letterSpacing: '.3em', marginLeft: '-60px', marginRight: '-60px' }, nm));
      return g;
    };
    const m0 = med(X0, PIC.ari, '50% 40%', '350 BC', 'ARISTOTLE'), m1 = med(X1, PIC.e21, '56% 24%', '1900s', 'EINSTEIN');
    s.tl.fromTo(m0, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, tTl);
    s.tl.fromTo(m1, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, tEnd - 0.2);
    const cn = tg.appendChild(el('div', 'anton goldgrad', { position: 'absolute', left: '0', right: '0', top: '214px', textAlign: 'center', fontSize: '250px', lineHeight: '1.08' }, '0'));
    const cs = tg.appendChild(el('div', 'bebas sh', { position: 'absolute', left: '0', right: '0', top: '486px', textAlign: 'center', fontSize: '92px', letterSpacing: '.3em' }, 'SAAL SE ZYADA'));
    counter(s, cn, 0, 2000, tTl + 0.1, tEnd - tTl - 0.1, (v) => (v >= 1999.5 ? '2000+' : String(Math.round(v / 10) * 10)), 'power1.inOut');
    s.tl.fromTo(cn, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, tTl).fromTo(cn, { scale: 1 }, { scale: 1.07, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, tEnd);
    s.tl.fromTo(cs, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, Math.max(tTl + 0.3, L('19', 7) - 0.1));
    s.sfx('clock', tTl, { dur: tEnd - tTl }); s.sfx('hit', tEnd, { gain: 0.6 });
    const chip = (x, t, col, bg) => tg.appendChild(el('div', 'chip', { position: 'absolute', left: (x - 150) + 'px', top: (Y - 36) + 'px', width: '300px', textAlign: 'center', fontSize: '32px', background: bg, color: col, borderColor: col }, t));
    const c1 = chip(X0 + (X1 - X0) * 0.36, 'SCIENCE', '#B9ECFF', '#0a1626'), c2 = chip(X0 + (X1 - X0) * 0.64, 'FALSAFA', '#F8DE9A', '#1a1408');
    s.tl.fromTo(c1, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)' }, tSci); s.tl.fromTo(c2, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)' }, tFal);
    s.sfx('pop', tSci + 0.1); s.sfx('pop', tFal + 0.1);
    cap(s, 'ghalib raaye — <span class="hl">ek hi</span> thi:', tRay, d + 1, { bottom: 58, size: 50 });
    s.div('vig');
  }, { fin: X, z: Z++ });

  defScene('b2_dogma', T('20'), T('22') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 46%, #0d1a38 0%, #050914 56%, #000 100%)' });
    const st = stage3d(s, { fov: 50 }); st.scene.add(starfield({ count: 2600, radius: 320, seed: 9, px: 2.4 }));          // a perfectly still sky: nothing moves, nothing changes
    const P = (u) => { const sn = Math.sin(u), cs = Math.cos(u), q = 1 + sn * sn; return [960 + 330 * cs / q, 286 + 300 * sn * cs / q]; };
    let dd = ''; for (let i = 0; i <= 160; i++) { const [x, y] = P(i / 160 * Math.PI * 2); dd += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1); }
    const inf = svg(s, `<defs><linearGradient id="bInf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B8862E"/><stop offset=".5" stop-color="#F8DE9A"/><stop offset="1" stop-color="#B8862E"/></linearGradient></defs><path d="${dd} Z" fill="none" stroke="url(#bInf)" stroke-width="7" stroke-linejoin="round"/>`);
    s.tl.fromTo(inf.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.3, ease: 'power2.inOut' }, 0.05);
    const dot = s.div(null, { position: 'absolute', left: '-70px', top: '-70px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, rgba(248,222,154,.9) 13%, rgba(233,185,85,.35) 36%, rgba(233,185,85,0) 66%)' });
    s.onUpdate((lt) => { const [x, y] = P(lt * 1.5 + 0.3); dot.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; dot.style.opacity = smooth(0.5, 1.3, lt).toFixed(3); });
    const tag = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '92px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.46em' }, '2000+ SAAL KI GHALIB RAAYE');
    show(s, tag, 0.05, null, { opacity: 0, y: -16 }, 0.5);
    const h = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '430px', textAlign: 'center', fontSize: '200px', whiteSpace: 'nowrap' }, '<span class="k">KAINAT</span> <span class="k goldgrad" style="text-shadow:none">HAMESHA</span> <span class="k">SE</span> <span class="k">HAI</span>');
    keys(s, h, [0, 1, 2, 3].map((i) => L('20', i)));
    s.tl.to(h, { scale: 1.04, duration: d, ease: 'none' }, 0);
    flash(s, 0, { peak: 0.3, dur: 0.5 }); s.sfx('subdrop', 0); s.sfx('shimmer', L('20', 1), { gain: 0.6 });
    const sub = (x, html, t) => { const e = s.div('bebas sh', { position: 'absolute', left: x + 'px', top: '716px', width: '590px', textAlign: 'center', fontSize: '86px', letterSpacing: '.05em', borderTop: '2px solid rgba(111,216,255,.55)', borderBottom: '2px solid rgba(111,216,255,.55)', padding: '18px 0 8px' }, html); show(s, e, t, null, { opacity: 0, y: 30 }, 0.45); s.sfx('tick', t + 0.05); return e; };
    sub(330, '<span class="cyan">NA</span> KOI SHURUAAT', Math.max(0.6, L('21') - 0.08)); sub(1000, '<span class="cyan">NA</span> KOI BADLAAV', Math.max(1.0, L('21', 4) - 0.08));
    s.div('vig');
  }, { z: Z++ });

  // ───────── B3  "Sitare latke hue hain — jaise deewar par tangi hui tasveer" ─────────
  defScene('b3_frame', T('22'), T('23') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tR = clamp(L('22', 7) - 0.3, 1.0, Math.max(1.0, d - 2.2)), tT = Math.max(0.25, Math.min(L('22', 3) - 0.3, tR - 1.15));
    const hp = hangPicture(s);
    s.onUpdate((lt) => {                                                // full-screen star field → pull back: it is only a picture on a wall
      const k = ease.io3(clamp((lt - tR) / 1.3));
      const z = Math.exp(lerp(Math.log(lerp(3.52, 3.36, clamp(lt / tR))), Math.log(1.22 + 0.05 * clamp((lt - tR) / Math.max(0.1, d - tR))), k));
      hp.world.style.transform = `scale(${z.toFixed(4)})`;
      hp.hang.style.transform = `rotate(${(smooth(tR + 0.8, tR + 2.0, lt) * 0.6 * Math.sin((lt - tR) * 1.9)).toFixed(3)}deg)`;
      hp.glare.style.opacity = k.toFixed(3);
    });
    const pts = [[214, 430], [468, 262], [716, 568], [982, 318], [1236, 604], [1492, 286], [1716, 470]];          // threads: the stars "hang" in place
    const th = svg(s, pts.map(([x, y]) => `<path class="t" d="M ${x} -10 V ${y - 17}" stroke="rgba(190,225,255,.6)" stroke-width="2" fill="none"/><circle class="c" cx="${x}" cy="${y}" r="16" fill="none" stroke="#6FD8FF" stroke-width="2.5"/><circle class="d" cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join(''));
    gsap.set(th, { autoAlpha: 0 }); s.tl.set(th, { autoAlpha: 1 }, tT);
    s.tl.fromTo(th.querySelectorAll('.t'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.36, ease: 'power2.out', stagger: 0.05 }, tT);
    s.tl.fromTo(th.querySelectorAll('.c, .d'), { opacity: 0 }, { opacity: 1, duration: 0.22, stagger: 0.025 }, tT + 0.3);
    s.tl.to(th, { opacity: 0, duration: 0.3 }, tR - 0.05);
    const hud = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em' }, '❚❚&nbsp; SITARE “APNI JAGAH”');
    show(s, hud, tT, tR, { opacity: 0, x: -20 }, 0.4);
    cap(s, 'Sitare apni jagah <span class="hl">latke hue</span> hain', 0.1, tR + 0.1, { bottom: 110 });
    cap(s, 'jaise deewar par tangi hui <span class="hl">tasveer</span>', Math.max(tR + 0.2, L('22', 7) - 0.05), d + 1, { bottom: 136 });
    s.sfx('shimmer', tT, { gain: 0.5 }); s.sfx('whoosh', tR, { gain: 0.7 });
    s.div('vig');
  }, { fin: X, z: Z++ });

  // ───────── B4  the logic: no beginning → no "who began it?" ─────────
  defScene('b4_logic', T('23'), T('27') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const tA = Math.max(0.35, L('24') - 0.1), tTo = Math.max(tA + 0.5, L('25') - 0.08), tB = Math.max(tTo + 0.4, L('25', 1) - 0.1), tK = Math.max(tB + 0.5, L('25', 6) - 0.05);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 40%, #0e1a36 0%, #060a16 60%, #020409 100%)' });
    const grid = s.div('fill', { opacity: '.6', backgroundImage: 'linear-gradient(rgba(111,216,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(111,216,255,.06) 1px, transparent 1px)', backgroundSize: '80px 80px' });
    s.onUpdate((lt) => { grid.style.backgroundPosition = `${(lt * 7).toFixed(2)}px ${(lt * 4).toFixed(2)}px`; });
    const hd = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '104px', textAlign: 'center', fontSize: '38px', fontWeight: 700, letterSpacing: '.5em' }, 'AUR SOCHIYE…');
    show(s, hd, 0.05, null, { opacity: 0, y: -18 }, 0.5);
    const node = (x, lb, html) => {
      const p = s.div('panel', { left: x + 'px', top: '262px', width: '470px', height: '206px', textAlign: 'center' });
      p.innerHTML = `<div class="mono cyan" style="position:absolute;left:0;right:0;top:-48px;font-size:26px;font-weight:700;letter-spacing:.42em">${lb}</div><div class="bebas" style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);font-size:74px;line-height:1;color:#fff">${html}</div>`;
      return p;
    };
    const arrow = (x) => svg(s, `<path class="ln" d="M 4 30 H 104" stroke="#6FD8FF" stroke-width="4" fill="none" stroke-linecap="round"/><path class="hd" d="M 98 14 L 124 30 L 98 46 Z" fill="#6FD8FF"/>`, { x, y: 335, w: 130, h: 60 });
    const n1 = node(105, 'AGAR', 'KAINAT<br><span class="gold">HAMESHA SE HAI</span>'), n2 = node(725, 'TO', 'KOI SHURUAAT<br><span class="cyan">NAHI</span>'), n3 = node(1345, 'TO PHIR', '“BANANE WALE”<br>KA SAWAL'), a1 = arrow(585), a2 = arrow(1205);
    const pop = (n, t) => { show(s, n, t, null, { opacity: 0, y: 30, scale: 0.94 }, 0.5); s.sfx('pop', t + 0.05, { gain: 0.7 }); };
    const draw = (a, t) => { s.tl.fromTo(a.querySelector('.ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.28, ease: 'power2.out' }, t); s.tl.fromTo(a.querySelector('.hd'), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.2 }, t + 0.18); };
    pop(n1, tA); draw(a1, tTo); pop(n2, tTo + 0.15); draw(a2, tB); pop(n3, tB + 0.12);
    // "sawal hi khatam": the chain is cut at the arrow, the question fades (the words themselves are not struck out)
    const cut = svg(s, `<path class="x1" d="M 38 4 L 90 56" stroke="#FF4B4B" stroke-width="9" stroke-linecap="round" fill="none"/><path class="x2" d="M 90 4 L 38 56" stroke="#FF4B4B" stroke-width="9" stroke-linecap="round" fill="none"/>`, { x: 1205, y: 335, w: 130, h: 60 });
    s.tl.fromTo(cut.querySelector('.x1'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, tK).fromTo(cut.querySelector('.x2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.in' }, tK + 0.14);
    s.tl.to(n3, { opacity: 0.34, duration: 0.45 }, tK + 0.3).to(a2, { opacity: 0.3, duration: 0.3 }, tK + 0.3);
    stamp(s, 'SAWAL HI KHATAM', tK + 0.25, { x: 1326, y: 502, size: 50, rot: -4 });
    s.sfx('slash', tK); s.sfx('slash', tK + 0.14); s.sfx('hit', tK + 0.47, { gain: 0.7 });
    const q1 = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '626px', textAlign: 'center', fontSize: '64px', fontStyle: 'italic', fontWeight: 500 }, 'Jo cheez kabhi <span style="color:#F6CF6B">shuru hi nahi</span> hui —');
    const q2 = s.div('play sh', { position: 'absolute', left: '0', right: '0', top: '716px', textAlign: 'center', fontSize: '116px', fontStyle: 'italic', fontWeight: 700 }, 'usay shuru <span class="gold">kisne</span> kiya?');
    sync(s, q1, '26'); sync(s, q2, '26', { from: 8, y: 26 });
    s.tl.to(q2, { scale: 1.05, duration: Math.max(0.5, d - L('26', 8)), ease: 'none' }, L('26', 8));
    s.sfx('swell', L('26', 8) - 0.3, { dur: 1.4, gain: 0.7 });
    s.div('vig');
  }, { fin: X, z: Z++ });

  // ───────── B5  Bertrand Russell, BBC radio: "Kainat bas hai — aur baat khatam." ─────────
  defScene('b5_russell', T('27'), T('29') + 0.02, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tOn = Math.max(0.3, L('27', 5) - 0.15), tOff = T('28e') - s.t0 + 0.12;
    s.div('fill', { background: 'radial-gradient(ellipse at 30% 40%, #101c38 0%, #060a15 60%, #010207 100%)' });
    s.div('fill', { background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 2px, rgba(0,0,0,0) 2px 6px)' });
    photoCard(s, PIC.rus, { x: 130, y: 92, w: 540, h: 690 }, 0.05, null, { rot: -2.5, pos: '50% 14%', from: { x: -90, opacity: 0, scale: 0.96 } });
    lowerThird(s, 'BERTRAND RUSSELL', 'Falsafi · BBC Radio, 1948', Math.max(0.2, L('27', 2) - 0.12), d + 5, { bottom: 100 });
    const rh = s.div(null, { position: 'absolute', left: '800px', top: '122px', width: '984px', display: 'flex', alignItems: 'center', gap: '22px' });
    rh.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#6FD8FF" stroke-width="3.5" stroke-linecap="round"><path d="M32 30 V60 M20 60 H44"/><circle cx="32" cy="24" r="6" fill="#6FD8FF"/><path class="w1" d="M19 12 A18 18 0 0 0 19 36 M45 12 A18 18 0 0 1 45 36"/><path class="w2" d="M10 4 A30 30 0 0 0 10 44 M54 4 A30 30 0 0 1 54 44"/></g></svg>
      <div class="mono cyan sh" style="font-size:36px;font-weight:700;letter-spacing:.34em">BBC RADIO</div><div class="mono sh" style="font-size:36px;letter-spacing:.2em;color:rgba(245,241,232,.7)">· 1948</div>
      <div class="oa mono" style="margin-left:auto;font-size:24px;font-weight:700;letter-spacing:.3em;color:#6FD8FF;border:2px solid #6FD8FF;border-radius:6px;padding:7px 16px 5px">● ON AIR</div>`;
    show(s, rh, tOn, null, { opacity: 0, y: -20 }, 0.5); s.sfx('radio', tOn, { dur: Math.max(0.5, L('28') - tOn), gain: 0.6 }); s.sfx('static', tOn, { dur: Math.max(0.5, tOff - tOn), gain: 0.35 });
    const wf = s.div(null, { position: 'absolute', left: '800px', top: '226px', width: '984px', height: '170px' }); show(s, wf, tOn, null, { opacity: 0 }, 0.4);
    const NB = 82, bars = []; for (let i = 0; i < NB; i++) bars.push(wf.appendChild(el('div', null, { position: 'absolute', left: (i * 12) + 'px', top: '0', width: '6px', height: '170px', borderRadius: '3px', background: 'linear-gradient(180deg,#B9ECFF,#6FD8FF 50%,#B9ECFF)' })));
    const wq = [0, 1, 2, 4, 5, 6].map((i) => L('28', i)), oa = rh.querySelector('.oa'), w1 = rh.querySelector('.w1'), w2 = rh.querySelector('.w2');
    s.onUpdate((lt) => {                                               // voice waveform: speaks on the quote, flat-lines on "khatam"
      let amp = 0.07 + 0.3 * smooth(tOn, tOn + 0.4, lt) * (0.6 + 0.4 * Math.abs(noise1(lt * 3.1, 4)));
      for (const t of wq) if (lt > t) amp += 0.75 * Math.exp(-(lt - t) * 4.5);
      const off = smooth(tOff, tOff + 0.35, lt); amp *= 1 - off * 0.97;
      bars.forEach((b, i) => { const env = Math.pow(Math.sin(Math.PI * (i + 0.5) / NB), 0.7), v = 0.03 + Math.min(1, amp) * env * (0.25 + 0.75 * Math.abs(noise1(lt * 11 + i * 0.41, i % 7))); b.style.transform = `scaleY(${v.toFixed(3)})`; });
      oa.style.opacity = (off > 0.5 ? 0.25 : 0.65 + 0.35 * Math.sin(lt * 6)).toFixed(3);
      const ph = (lt * 1.6) % 1; w1.style.opacity = (off > 0.5 ? 0.2 : 1 - ph).toFixed(3); w2.style.opacity = (off > 0.5 ? 0.2 : 1 - ((ph + 0.5) % 1)).toFixed(3);
    });
    const qb = s.div(null, { position: 'absolute', left: '800px', top: '446px', width: '1010px' });
    qb.innerHTML = `<div class="play gold m" style="font-size:210px;line-height:.6;height:86px;opacity:.9">“</div><div class="quote sh q" style="font-size:92px;line-height:1.22">Kainat <span style="color:#F6CF6B">bas hai</span> —<br>aur baat khatam.</div><div class="quote-by sh by">— Bertrand Russell</div>`;
    const tq = Math.max(tOn + 0.3, L('28') - 0.3);
    s.tl.fromTo(qb.querySelector('.m'), { opacity: 0, scale: 0.4, transformOrigin: '0 0' }, { opacity: 0.9, scale: 1, duration: 0.45, ease: 'back.out(2)' }, tq);
    sync(s, qb.querySelector('.q'), '28'); s.tl.fromTo(qb.querySelector('.by'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 }, tOff);
    s.sfx('slam', tOff, { gain: 0.8 });
    s.div('vig');
  }, { fin: X, z: Z++ });

  // ───────── B6  "inkaar ka sab se mazboot qila" ─────────
  defScene('b6_qila', T('29'), T('30') + 0.35, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tHit = 0.42, tBan = Math.max(tHit + 0.35, L('29', 2) - 0.1), tHd = Math.max(tBan + 0.3, L('29', 4) - 0.1);
    s.div('fill', { background: 'linear-gradient(180deg,#050915 0%,#0b1630 55%,#1b2748 100%)' });
    const sky = s.div('fill', { overflow: 'hidden', opacity: '.5', WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 40%,rgba(0,0,0,0) 80%)', maskImage: 'linear-gradient(180deg,#000 0%,#000 40%,rgba(0,0,0,0) 80%)' }); const si = pic(sky, PIC.stars);
    s.tl.fromTo(si, { scale: 1.12, x: 0 }, { scale: 1.2, x: -30, duration: d, ease: 'none' }, 0);
    s.div(null, { position: 'absolute', left: '1180px', top: '40px', width: '900px', height: '700px', background: 'radial-gradient(ellipse at 50% 50%, rgba(160,190,255,.2) 0%, rgba(160,190,255,0) 62%)' });
    const q = svg(s, qilaSVG()); gsap.set(q, { scale: 0.88, transformOrigin: '960px 960px' });
    s.tl.fromTo(q, { y: -1050 }, { y: 0, duration: tHit, ease: 'power3.in' }, 0);                                   // the fortress drops into place: solid
    s.tl.fromTo(q, { scale: 0.88 }, { scale: 0.92, duration: d - tHit, ease: 'none', immediateRender: false }, tHit);
    shake(s, q, tHit, 0.55, 22); s.sfx('impact', tHit); s.sfx('thud', tHit, { gain: 0.8 }); flash(s, tHit, { peak: 0.28, dur: 0.4 });
    dust(s, [330, 620, 960, 1300, 1590], 985, tHit);
    s.tl.fromTo(q.querySelector('.q-banner'), { scaleY: 0, svgOrigin: '960 508' }, { scaleY: 1, duration: 0.5, ease: 'back.out(1.6)' }, tBan); s.sfx('paper', tBan, { gain: 0.6 });
    const flags = [...q.querySelectorAll('.q-flag')];
    s.onUpdate((lt) => flags.forEach((f, i) => { f.style.transform = `skewY(${(7 * Math.sin(lt * 4.2 + i * 1.3)).toFixed(2)}deg) scaleX(${(0.9 + 0.1 * Math.sin(lt * 5.3 + i)).toFixed(3)})`; }));
    s.div(null, { position: 'absolute', left: '0', right: '0', bottom: '0', height: '260px', background: 'linear-gradient(180deg, rgba(4,6,12,0) 0%, rgba(4,6,12,.85) 100%)' });
    const h = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '72px', textAlign: 'center', fontSize: '112px', whiteSpace: 'nowrap' }, '<span class="k">INKAAR</span> <span class="k">KA</span> <span class="k gold">SAB SE MAZBOOT</span> <span class="k">QILA</span>');
    keys(s, h, [tHd - 0.25, tHd - 0.12, tHd + 0.06, Math.max(tHd + 0.4, L('29', 7))], { slam: 2 }); s.sfx('hit', tHd + 0.06, { gain: 0.7 });
    s.div('vig');
  }, { z: Z++ });

  // ───────── B7  General Relativity: the picture cannot stay on the wall ─────────
  defScene('b7_gr', T('30'), T('32') + 0.25, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tGR = Math.max(0.7, L('30', 6) - 0.12), tM = Math.max(tGR + 0.9, L('31') - 0.05);
    const st = stage3d(s, { bg: 0x01030a, fov: 42 }); const bd = spaceBackdrop(st, { gain: 0.26, seed: 17 });
    const well = 6.5, wr = 26, zf = (r) => -well / (1 + r * r / wr);
    st.scene.add(gridPlane({ n: 44, size: 56, seg: 96, well, wr, opacity: 0.6 }));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.85, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffe2a8, toneMapped: false })); sun.position.y = zf(0) + 1.0; st.scene.add(sun);
    const g1 = glow(0xffb45a, 9, 0.55, 0.05, 1.8), g2 = glow(0xfff0c8, 4, 0.8, 0.15, 2.2); g1.position.copy(sun.position); g2.position.copy(sun.position); st.scene.add(g1, g2);
    const pl = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), new THREE.MeshBasicMaterial({ color: 0xcfeaff, toneMapped: false })), pg = glow(0x6fd8ff, 1.7, 0.8, 0.1, 2); st.scene.add(pl, pg);
    const trail = []; for (let i = 0; i < 26; i++) { const t = glow(0x6fd8ff, 0.5, 0.5, 0, 2); st.scene.add(t); trail.push(t); }
    const R = 7.4, pos = (a) => new THREE.Vector3(Math.cos(a) * R, zf(R) + 0.32, Math.sin(a) * R);
    st.frame = (lt) => {
      bd.update(lt + 5);
      const a = lt * 1.15 + 0.8; pl.position.copy(pos(a)); pg.position.copy(pl.position);
      trail.forEach((t, i) => { t.position.copy(pos(a - (i + 1) * 0.07)); t.material.opacity = 0.5 * (1 - i / 26); t.scale.setScalar(0.5 * (1 - i / 34)); });
      const ca = 0.5 + lt * 0.05, cr = 19 - lt * 0.5;
      st.camera.position.set(Math.sin(ca) * cr, 12.5 - lt * 0.25, Math.cos(ca) * cr); st.camera.lookAt(0, -3.4, 0);
      g1.scale.setScalar(9 * (1 + 0.04 * Math.sin(lt * 2.2)));
    };
    s.div('scrim-b'); s.div('scrim-t');
    dateline(s, '1915', 'EINSTEIN KI APNI THEORY', 0.12, null); s.sfx('type', 0.4, { dur: 0.9 });
    big(s, 'GENERAL RELATIVITY', tGR, tM + 0.05, { size: 176, y: 770, cls: 'bebas glowc' }); s.sfx('whoosh', tGR - 0.1, { gain: 0.6 });
    const tg = s.div('mono cyan sh', { position: 'absolute', left: '0', right: '0', top: '742px', textAlign: 'center', fontSize: '28px', fontWeight: 700, letterSpacing: '.36em' }, 'AUR USKI MATHS KEHTI HAI ▾');
    show(s, tg, tM + 0.15, null, { opacity: 0, y: -14 }, 0.4);
    const ew = s.div(null, { position: 'absolute', left: '0', right: '0', top: '786px', textAlign: 'center' }), eq = ew.appendChild(el('div', 'eq', { display: 'inline-block', fontSize: '112px' }, EQCSS + EQ()));
    s.tl.fromTo(eq, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, tM + 0.2); s.sfx('shimmer', tM + 0.2, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.35, z: Z++ });

  defScene('b7_fall', T('32'), T('33') + 0.02, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tTilt = Math.max(0.5, L('32', 4) - 0.12), tFall = Math.max(tTilt + 0.45, L('32', 6) - 0.05), tThud = tFall + 0.37;
    const hp = hangPicture(s); hp.glare.style.opacity = '1';
    s.onUpdate((lt) => {
      hp.world.style.transform = `scale(${(1.27 + 0.03 * clamp(lt / d)).toFixed(4)})`;
      const a = Math.max(0, lt - tTilt), f = Math.max(0, lt - tFall);
      const rot = lt < tTilt ? 0.6 * Math.sin(lt * 1.9 + 1.2) : 8.5 * (1 - Math.exp(-6 * a) * Math.cos(15 * a)) + 34 * f;
      hp.hang.style.transform = `translate(${(60 * f).toFixed(1)}px, ${(0.5 * 3700 * f * f).toFixed(1)}px) rotate(${rot.toFixed(3)}deg)`;
      hp.ghost.style.opacity = smooth(tFall, tFall + 0.3, lt).toFixed(3);
    });
    shake(s, hp.world, tThud, 0.5, 18); dust(s, [760, 1000, 1240], 1070, tThud, '190,180,160');
    s.sfx('slash', tTilt, { gain: 0.7 }); s.sfx('whoosh', tFall, { gain: 0.6 }); s.sfx('thud', tThud); s.sfx('impact', tThud, { gain: 0.6 });
    const tg = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '28px', fontWeight: 700, letterSpacing: '.3em' }, 'GENERAL RELATIVITY ▸ MATHS');
    show(s, tg, 0.05, null, { opacity: 0, x: -20 }, 0.4);
    cap(s, 'yeh tasveer deewar par <span class="hr">tik hi nahi sakti</span>', 0.05, d + 1, { bottom: 136 });
    s.div('vig');
  }, { fin: 0.25, z: Z++ });

  defScene('b7_arrows', T('33'), T('35') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tP = Math.max(0.4, L('33', 3) - 0.12), tS = Math.max(tP + 0.6, L('33', 6) - 0.12), tRuk = Math.max(tS + 0.6, L('34') - 0.05);
    const st = stage3d(s, { bg: 0x01030a, fov: 55 }); const bd = spaceBackdrop(st, { gain: 0.34, seed: 19 });
    const gal = galaxyField({ count: 240, radius: 70, size: 4.0, seed: 33 }); st.scene.add(gal);
    st.frame = (lt) => {
      bd.update(lt + 9);
      const sc = 0.9 + 0.55 * smooth(tP, tS, lt) - 0.85 * smooth(tS, tRuk + 0.2, lt) + 0.35 * smooth(tRuk + 0.3, d + 1, lt);          // out … in … it never rests
      gal.userData.update({ scale: sc, redshift: 0.5 * smooth(tP, tS, lt) * (1 - smooth(tS, tS + 0.5, lt)), opacity: 0.8 });
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = 0.2 + lt * 0.012;
    };
    s.div('scrim-all', { background: 'rgba(1,3,10,.45)' });
    const hd = s.div('cinzel gold sh', { position: 'absolute', left: '0', right: '0', top: '100px', textAlign: 'center', fontSize: '38px', fontWeight: 700, letterSpacing: '.6em' }, 'KAINAT — YA TO…');
    show(s, hd, 0.05, null, { opacity: 0, y: -16 }, 0.45);
    const icon = (x, dir, col) => svg(s, `<circle class="rg" cx="150" cy="150" r="80" fill="none" stroke="${col}" stroke-width="6"/><circle cx="150" cy="150" r="14" fill="${col}" opacity=".9"/>` +
      [0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 150 150)"><path class="aw" d="${dir > 0 ? 'M150 46 V10 M134 28 L150 8 L166 28' : 'M150 6 V44 M134 26 L150 46 L166 26'}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`).join(''), { x, y: 196, w: 300, h: 300 });
    const iA = icon(370, 1, '#6FD8FF'), iB = icon(1250, -1, '#F5F1E8');
    s.onUpdate((lt) => [[iA, 1], [iB, -1]].forEach(([ic, dir]) => {
      const ph = (lt * 0.9) % 1, r = dir > 0 ? 58 + 46 * ph : 104 - 46 * ph;
      ic.querySelector('.rg').setAttribute('r', r.toFixed(1)); ic.querySelector('.rg').style.opacity = (dir > 0 ? 1 - 0.7 * ph : 0.3 + 0.7 * ph).toFixed(3);
      ic.querySelectorAll('.aw').forEach((a) => { a.style.transform = `translateY(${(dir > 0 ? -20 * ph : 20 * ph).toFixed(1)}px)`; a.style.opacity = (1 - 0.6 * ph).toFixed(3); });
    }));
    const lb = (x, t, col) => s.div('bebas sh', { position: 'absolute', left: x + 'px', top: '500px', width: '700px', textAlign: 'center', fontSize: '160px', color: col }, t);
    const la = lb(170, 'PHAILEGI', '#6FD8FF'), lbb = lb(1050, 'SIKUDEGI', '#F5F1E8');
    show(s, iA, tP, null, { opacity: 0, scale: 0.6 }, 0.45); show(s, la, tP + 0.05, null, { opacity: 0, y: 30 }, 0.45);
    const ya = s.div('cinzel sh', { position: 'absolute', left: '860px', top: '376px', width: '200px', textAlign: 'center', fontSize: '70px', fontWeight: 700, color: 'rgba(245,241,232,.7)' }, 'YA'); show(s, ya, Math.max(tP + 0.4, tS - 0.4), null, { opacity: 0 }, 0.3);
    show(s, iB, tS, null, { opacity: 0, scale: 1.5 }, 0.45); show(s, lbb, tS + 0.05, null, { opacity: 0, y: 30 }, 0.45);
    s.sfx('whoosh', tP, { gain: 0.6 }); s.sfx('whooshRev', tS, { gain: 0.6, dur: 0.6 });
    const rk = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '752px', textAlign: 'center', fontSize: '176px' }, '<span class="k">RUK</span> <span class="k glowr" style="color:#FF4B4B">NAHI</span> <span class="k">SAKTI</span>');
    keys(s, rk, [0, 1, 2].map((i) => Math.max(tRuk, L('34', i))), { slam: 1 }); s.sfx('hit', Math.max(tRuk, L('34', 1)) + 0.06); shake(s, rk, Math.max(tRuk, L('34', 1)) + 0.06, 0.45, 14);
    s.div('vig');
  }, { z: Z++ });

  // ───────── B8  the ball: up or down — never hanging in mid-air ─────────
  const t35 = T('35'), tFzA = Math.max(TW('37', 2), T('37') + 0.3);
  const camAng = (tA) => 0.42 + (tA - t35) * 0.028 + 1.1 * smooth(tFzA - 0.1, tFzA + 4.0, tA) + 0.03 * Math.max(0, tA - tFzA - 4.0);
  const camPose = (st, tA) => { const a = camAng(tA), k = smooth(tFzA, tFzA + 3, tA), R = 12.6 - 1.7 * k; st.camera.position.set(Math.sin(a) * R, 2.3 + 0.6 * k, Math.cos(a) * R); st.camera.lookAt(0, 3.0 + 0.45 * k, 0); st.camera.updateMatrixWorld(true); };

  defScene('b8_ball', T('35'), T('39') + 0.35, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const tUp = Math.max(0.5, L('35', 5) - 0.08), tAp = Math.max(tUp + 1.0, L('36', 6)), tFz = Math.max(tAp + 1.3, tFzA - s.t0), tLd = clamp(L('37') - 0.4, tAp + 0.6, tFz - 0.45), tNo = Math.max(tFz + 0.4, L('38') - 0.1);
    const hB = (lt) => (lt < tUp ? 1.1 * Math.abs(Math.sin(Math.PI * lt / 0.62)) * Math.exp(-lt * 2.6)
      : lt < tAp ? 5.2 * (1 - Math.pow((lt - tAp) / (tAp - tUp), 2)) : lt < tLd ? 5.2 * (1 - Math.pow((lt - tAp) / (tLd - tAp), 2))
      : lt < tFz ? HF * (1 - Math.pow((lt - tFz) / (tFz - tLd), 2)) : HF);
    const bw = ballWorld(s), st = bw.st;
    const up = s.div('bebas glowc', { position: 'absolute', left: '0', top: '0', fontSize: '120px', color: '#6FD8FF', whiteSpace: 'nowrap' }, 'UPAR' + ICO.arrow(false));
    const dn = s.div('bebas glowc', { position: 'absolute', left: '0', top: '0', fontSize: '120px', color: '#B9ECFF', whiteSpace: 'nowrap' }, 'NEECHE' + ICO.arrow(true));
    const rg = s.div(null, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' }), rgi = rg.appendChild(el('div', null, { position: 'absolute', left: '-110px', top: '-110px', width: '220px', height: '220px', borderRadius: '50%', border: '4px solid #6FD8FF', boxShadow: '0 0 30px rgba(111,216,255,.6)', opacity: '0' }));
    const dl = svg(s, `<path d="" stroke="#6FD8FF" stroke-width="3" stroke-dasharray="10 12" fill="none" opacity=".7"/>`), dlp = dl.querySelector('path');
    st.frame = (lt) => {
      camPose(st, s.t0 + lt); bw.stars.material.uniforms.time.value = lt;
      const y = RB + hB(lt); bw.setBall(0, y, 0, lt < tFz ? lt : tFz);
      const sp = Math.abs(hB(lt) - hB(lt - 0.033));
      bw.trail.forEach((t, i) => { const yy = RB + hB(lt - (i + 1) * 0.03); t.position.set(0, yy, 0); t.scale.setScalar(1.25 * (1 - i / 16)); t.material.opacity = lt > tUp && lt < tFz ? clamp(sp * 6) * 0.42 * (1 - i / 14) : 0; });
      const [bx, by] = proj(st, bw.ball.position), [fx, fy] = proj(st, new THREE.Vector3(0, 0.03, 0));
      up.style.left = (bx + 96) + 'px'; up.style.top = (by - 66) + 'px'; dn.style.left = (bx + 96) + 'px'; dn.style.top = (by - 66) + 'px';
      rg.style.left = bx + 'px'; rg.style.top = by + 'px';
      dlp.setAttribute('d', `M ${bx.toFixed(1)} ${(by + 62).toFixed(1)} L ${fx.toFixed(1)} ${fy.toFixed(1)}`);
    };
    cap(s, 'Jaise aap <span class="hl">gend</span> hawa mein uchhalein', 0.1, Math.max(1.2, L('36') - 0.1), { bottom: 84 });
    show(s, up, Math.max(tUp + 0.25, L('36', 2) - 0.1), tAp + 0.1, { opacity: 0, y: 30 }, 0.35); show(s, dn, Math.max(tAp + 0.3, L('36', 8) - 0.1), tLd + 0.05, { opacity: 0, y: -30 }, 0.35);
    s.sfx('whoosh', tUp, { gain: 0.7 }); s.sfx('thud', tLd, { gain: 0.5 });
    // freeze: bullet-time orbit around a ball that just hangs there
    s.tl.fromTo(rgi, { opacity: 0.95, scale: 0.4 }, { opacity: 0, scale: 2.8, duration: 0.8, ease: 'power2.out' }, tFz); s.sfx('glitch', tFz, { gain: 0.6 });
    show(s, dl, tUp + 0.3, null, { opacity: 0 }, 0.4);
    const pz = s.div('mono cyan sh', { position: 'absolute', right: '110px', top: '96px', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em' }, '❚❚&nbsp; RUKI HUI');
    show(s, pz, tFz, null, { opacity: 0, x: 30 }, 0.35); s.sfx('tick', tFz + 0.05);
    cap(s, 'Hawa mein <span class="hl">ruki hui</span> gend?', Math.max(tLd + 0.1, L('37') - 0.05), d + 1, { bottom: 84 });
    stamp(s, 'NAMUMKIN', tNo, { x: 1060, y: 590, size: 150, rot: -7 }); s.sfx('buzz', tNo + 0.1); s.sfx('impact', tNo + 0.22, { gain: 0.8 }); shake(s, st.canvas, tNo + 0.22, 0.45, 14);
    s.div('vig');
  }, { fin: X, z: Z++ });

  // ───────── B9  Λ: the extra number that props the ball up ─────────
  defScene('b9_lambda', T('39'), T('41') + 0.45, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tJ = Math.max(0.6, L('39', 4) - 0.1), tSink = L('40') - 0.1, tSeat = Math.max(tSink + 0.8, L('40', 4)), tRk = Math.max(tSeat + 0.6, L('40', 7) - 0.05);
    const bw = ballWorld(s), st = bw.st, aL = camAng(s.t0 + tSeat + 1.5), up = new THREE.Vector3(0, 1, 0);
    const shp = new THREE.Shape(), w = 1.55, b = 0.62; shp.moveTo(-w, 0); shp.lineTo(-w + b, 0); shp.lineTo(0, HF - 1.0); shp.lineTo(w - b, 0); shp.lineTo(w, 0); shp.lineTo(0.17, HF); shp.lineTo(-0.17, HF); shp.closePath();
    const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.44, bevelEnabled: false }); geo.translate(0, 0, -0.22);
    const lam = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4a0808, emissive: 0xff2a2a, emissiveIntensity: 1.5, roughness: 0.45 })); lam.rotation.y = aL; lam.renderOrder = 4; st.scene.add(lam);
    const lg = glow(0xff3030, 9, 0, 0, 1.6); lg.material.fog = false; lg.position.set(0, 1.7, 0); lg.renderOrder = 3; st.scene.add(lg);
    const pl = new THREE.PointLight(0xff3838, 0, 9); pl.position.set(Math.sin(aL) * 1.3, 2.3, Math.cos(aL) * 1.3); st.scene.add(pl);
    const tag = s.div(null, { position: 'absolute', left: '0', top: '0' }), tgi = tag.appendChild(el('div', 'tag red sh', { background: 'rgba(20,0,0,.55)', whiteSpace: 'nowrap', fontSize: '26px' }, 'Λ · EXTRA NUMBER'));
    const tp = new THREE.Vector3(w + 0.55, 1.5, 0).applyAxisAngle(up, aL);
    st.frame = (lt) => {
      camPose(st, s.t0 + lt); bw.stars.material.uniforms.time.value = lt;
      const u = clamp((lt - (tSeat - 0.38)) / 0.6), sy = u <= 0 ? 0.0001 : ease.outBack(u), on = clamp(u * 2);
      lam.visible = u > 0; lam.scale.set(1, sy, 1); lg.material.opacity = 0.5 * on; lg.scale.setScalar(9 + 0.6 * Math.sin(lt * 2.4)); pl.intensity = 30 * on;
      const jit = smooth(tJ, tJ + 0.6, lt) * (1 - on) * 0.04;                                                    // it "wants" to move: trembles, sags … until Λ catches it
      const y = Math.max(RB + HF - 0.85 * smooth(tSink, tSeat + 0.1, lt), u > 0 ? RB + HF * sy : 0);
      bw.setBall(noise1(lt * 23, 3) * jit, y + noise1(lt * 27, 5) * jit, 0, tFzA - t35);
      bw.trail.forEach((t) => { t.material.opacity = 0; });
      const [tx, ty] = proj(st, tp); tag.style.left = tx + 'px'; tag.style.top = ty + 'px';
    };
    photoCard(s, PIC.e21, { x: 120, y: 104, w: 330, h: 420 }, 0.05, null, { rot: -3, pos: '50% 18%', from: { x: -70, opacity: 0, scale: 0.96 } });
    const nm = s.div('mono cyan sh', { position: 'absolute', left: '120px', top: '546px', width: '330px', textAlign: 'center', fontSize: '24px', fontWeight: 700, letterSpacing: '.34em' }, 'EINSTEIN'); show(s, nm, 0.3, null, { opacity: 0 }, 0.4);
    cap(s, 'Einstein ko apni hi <span class="hc">maths</span> par <span class="hr">yaqeen nahi</span> aaya', 0.08, tSink + 0.05, { bottom: 84, size: 50 });
    cap(s, 'Usne woh <span class="hr">extra number</span> jod diya', tSink + 0.1, tRk, { bottom: 84 });
    cap(s, 'taake gend hawa mein <span class="hl">ruki rahe</span>', tRk + 0.03, d + 1, { bottom: 84 });
    show(s, tgi, tSeat + 0.15, null, { opacity: 0, x: -24 }, 0.4);
    flash(s, tSeat - 0.1, { peak: 0.35, color: '#ff5050', dur: 0.45 }); s.sfx('whoosh', tSeat - 0.4, { gain: 0.7 }); s.sfx('hit', tSeat - 0.08); shake(s, st.canvas, tSeat - 0.08, 0.4, 12);
    const pz = s.div('mono cyan sh', { position: 'absolute', right: '110px', top: '96px', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em' }, '❚❚&nbsp; GEND “RUKI HUI”');
    show(s, pz, Math.max(tRk + 0.4, L('40', 11) - 0.1), null, { opacity: 0, x: 30 }, 0.35); s.sfx('tick', Math.max(tRk + 0.4, L('40', 11) - 0.05));
    s.div('vig');
  }, { fin: 0.35, z: Z++ });

  // ───────── B10  the unexpected character: a priest who was also a physicist ─────────
  defScene('b10_lemaitre', T('41'), T('44') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tSp = Math.max(0.6, L('41', 6) - 0.1), tRv = Math.max(tSp + 0.8, L('42') - 0.15), tP = Math.max(tRv + 0.3, L('42', 1) - 0.1), tPh = Math.max(tP + 0.4, L('42', 4) - 0.1), tN = Math.max(tPh + 0.4, L('43') - 0.08);
    s.div('fill', { background: 'radial-gradient(ellipse at 28% 46%, #0c1832 0%, #04070f 56%, #000 100%)' });
    const cone = s.div(null, { position: 'absolute', left: '80px', top: '-60px', width: '840px', height: '1200px', background: 'linear-gradient(180deg, rgba(255,236,190,.17) 0%, rgba(255,236,190,.05) 70%, rgba(255,236,190,0) 100%)', clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)' });
    show(s, cone, tSp, null, { opacity: 0 }, 0.35); s.sfx('swell', tSp - 0.2, { dur: 1.6, gain: 0.7 });
    const pc = s.div('photo', { left: '250px', top: '170px', width: '500px', height: '660px', background: '#070b16' });
    const im = pic(pc, PIC.lem, { objectPosition: '30% 6%', transformOrigin: '34% 22%' });
    pc.appendChild(el('div', 'fill', { background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,.5) 100%)' }));
    const cv = pc.appendChild(el('div', 'fill', { background: 'linear-gradient(160deg,#0c1326,#04060c)' }, '<div class="anton qm" style="position:absolute;left:0;right:0;top:120px;text-align:center;font-size:420px;line-height:1;color:rgba(245,241,232,.14)">?</div>'));
    const edge = pc.appendChild(el('div', null, { position: 'absolute', left: '0', top: '-40px', width: '8px', height: '760px', background: '#fff', boxShadow: '0 0 30px 10px rgba(248,222,154,.8)', transformOrigin: '50% 0', opacity: '0' }));
    show(s, pc, 0.1, null, { opacity: 0, y: 50, scale: 0.96 }, 0.9);
    s.tl.fromTo(im, { scale: 1.16 }, { scale: 1.03, duration: Math.max(1, d - tRv), ease: 'power1.out' }, tRv);
    const qm = cv.querySelector('.qm');
    s.onUpdate((lt) => {                                               // dark card → diagonal light sweep reveals the photograph
      const k = ease.io3(clamp((lt - tRv) / 0.85)), xt = (k * 1.5 - 0.22) * 500, xb = xt - 110;
      cv.style.clipPath = `polygon(${xt.toFixed(1)}px 0px, 700px 0px, 700px 660px, ${xb.toFixed(1)}px 660px)`;
      edge.style.opacity = k > 0.01 && k < 0.99 ? '1' : '0'; edge.style.transform = `translateX(${(xt - 4).toFixed(1)}px) rotate(9.46deg)`;
      qm.style.opacity = (0.75 + 0.25 * Math.sin(lt * 2.6)).toFixed(3);
    });
    s.sfx('shimmer', tRv, { gain: 0.9 }); s.sfx('whoosh', tRv, { gain: 0.5 });
    const tx = s.div(null, { position: 'absolute', left: '900px', top: '300px', width: '900px' });
    tx.innerHTML = `<div class="mono cyan sh a" style="font-size:28px;font-weight:700;letter-spacing:.34em">KAHANI MEIN…</div><div class="bebas sh b" style="font-size:150px;margin-top:20px">EK AISA KIRDAAR</div><div class="mont sh c" style="font-size:48px;font-weight:700;margin-top:14px">jiski kisi ko <span style="color:var(--gold)">tawaqqo nahi</span> thi</div>`;
    show(s, tx.querySelector('.a'), Math.max(0.3, L('41', 2) - 0.1), null, { opacity: 0, x: 24 }, 0.45);
    sync(s, tx.querySelector('.b'), '41', { from: 4, y: 30 }); sync(s, tx.querySelector('.c'), '41', { from: 9 });
    s.tl.to(tx, { opacity: 0, x: 30, duration: 0.3, ease: 'power2.in' }, tRv - 0.1);
    const collar = `<svg width="88" height="88" viewBox="0 0 84 84"><path d="M10 80 V56 Q10 40 28 34 L42 50 L56 34 Q74 40 74 56 V80 Z" fill="#141a2a" stroke="#F8DE9A" stroke-width="3"/><rect x="33" y="34" width="18" height="12" rx="2" fill="#fff"/><circle cx="42" cy="17" r="13" fill="none" stroke="#F8DE9A" stroke-width="3"/></svg>`;
    const atom = `<svg width="88" height="88" viewBox="0 0 84 84"><g fill="none" stroke="#6FD8FF" stroke-width="3"><ellipse cx="42" cy="42" rx="37" ry="13"/><ellipse cx="42" cy="42" rx="37" ry="13" transform="rotate(60 42 42)"/><ellipse cx="42" cy="42" rx="37" ry="13" transform="rotate(120 42 42)"/></g><circle cx="42" cy="42" r="6" fill="#6FD8FF"/></svg>`;
    const chip = (x, wd, ico, t, col) => { const p = s.div('panel', { left: x + 'px', top: '262px', width: wd + 'px', height: '156px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '22px', borderColor: col }); p.innerHTML = ico + `<div class="bebas" style="font-size:80px;color:#fff;padding-top:8px">${t}</div>`; return p; };
    const c1 = chip(900, 370, collar, 'PADRI', 'rgba(233,185,85,.7)'), c2 = chip(1362, 448, atom, 'PHYSICIST', 'rgba(111,216,255,.7)');
    const plus = s.div('bebas gold sh', { position: 'absolute', left: '1270px', top: '288px', width: '92px', textAlign: 'center', fontSize: '110px' }, '+');
    show(s, c1, tP, null, { opacity: 0, y: 30, scale: 0.9 }, 0.5); show(s, plus, tPh - 0.05, null, { opacity: 0, scale: 0.3 }, 0.3); show(s, c2, tPh, null, { opacity: 0, y: 30, scale: 0.9 }, 0.5);
    s.sfx('pop', tP + 0.05); s.sfx('pop', tPh + 0.05);
    lowerThird(s, 'GEORGES LEMAÎTRE', 'Padri + Physicist · Belgium', tN, d + 5, { style: { left: '926px', bottom: '400px' } }); s.sfx('chime', tN, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.45, z: Z++ });

  // ───────── B11  1927: it is expanding → so yesterday it was smaller → … → one point ─────────
  defScene('b11_1927', T('44'), T('46') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tEq = Math.max(0.6, L('44', 4) - 0.15), tX = Math.max(tEq + 0.8, L('45') - 0.08);
    const st = stage3d(s, { bg: 0x01030a, fov: 55 }); const bd = spaceBackdrop(st, { gain: 0.38, seed: 23 });
    const gal = galaxyField({ count: 300, radius: 70, size: 4.2, seed: 27 }); st.scene.add(gal);
    st.frame = (lt) => {
      bd.update(lt + 11); const a = Math.max(0, lt - tX);
      gal.userData.update({ scale: 0.6 + lt * 0.012 + a * 0.17 + 0.035 * a * a, redshift: clamp(a * 0.1), opacity: 0.9 });
      st.camera.position.set(0, 0, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = lt * 0.012;
    };
    s.div('scrim-all', { background: 'rgba(1,3,10,.3)' });
    dateline(s, '1927', 'GEORGES LEMAÎTRE', 0.1, null); s.sfx('type', 0.4, { dur: 0.7 });
    photoCard(s, PIC.lem, { x: 1500, y: 96, w: 300, h: 384 }, 0.2, tX + 0.2, { rot: 3, pos: '30% 6%' });
    const ew = s.div(null, { position: 'absolute', left: '0', right: '0', top: '520px', textAlign: 'center' }), eq = ew.appendChild(el('div', 'eq', { display: 'inline-block', fontSize: '124px' }, EQCSS + EQ()));
    const tg = s.div(null, { position: 'absolute', left: '0', right: '0', top: '724px', textAlign: 'center' }, '<div class="tag cyan sh" style="background:rgba(2,10,20,.5)">EINSTEIN KI HI EQUATIONS</div>');
    s.tl.fromTo(eq, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.6 }, tEq).to(eq, { opacity: 0, scale: 1.7, duration: 0.45, ease: 'power2.in' }, tX - 0.3);
    show(s, tg, tEq + 0.3, tX - 0.05, { opacity: 0, y: -14 }, 0.4); s.sfx('shimmer', tEq, { gain: 0.6 });
    flash(s, tX, { peak: 0.5, dur: 0.5 }); s.sfx('impact', tX, { gain: 0.8 }); s.sfx('whoosh', tX, { gain: 0.6 });
    const h = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '330px', textAlign: 'center', fontSize: '200px', lineHeight: '1.04' }, '<span class="k">KAINAT</span><br><span class="k glowc" style="color:#6FD8FF">PHAIL</span> <span class="k glowc" style="color:#6FD8FF">RAHI</span> <span class="k">HAI</span>');
    keys(s, h, [0, 1, 2, 3].map((i) => Math.max(tX, L('45', i))));
    s.tl.to(h, { scale: 1.06, duration: Math.max(0.5, d - tX), ease: 'none' }, tX);
    s.div('vig');
  }, { fin: X, z: Z++ });

  const cB = 14;                                                     // backdrop phase of b11_steps (b11_rewind continues from it)
  defScene('b11_steps', T('46'), T('49') + 0.02, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tA = Math.max(0.4, L('46', 2) - 0.1), t1 = Math.max(tA + 0.8, L('47', 1) - 0.12), t2 = Math.max(t1 + 0.8, L('48') - 0.12), P = ppu(30);
    const { st, bd, gal } = uniWorld(s);
    const rs = svg(s, `<circle class="g0" cx="${U.cx}" cy="540" r="${(U.R * U.K[0] * P).toFixed(1)}" fill="none" stroke="#6FD8FF" stroke-width="2.5" stroke-dasharray="4 12" opacity="0"/><circle class="g1" cx="${U.cx}" cy="540" r="${(U.R * U.K[1] * P).toFixed(1)}" fill="none" stroke="#6FD8FF" stroke-width="2.5" stroke-dasharray="4 12" opacity="0"/><circle class="lv" cx="${U.cx}" cy="540" r="10" fill="none" stroke="#B9ECFF" stroke-width="4"/>`);
    const lv = rs.querySelector('.lv');
    const kOf = (lt) => lerp(lerp(U.K[0] * (0.93 + 0.07 * clamp(lt / t1)), U.K[1], ease.io3(clamp((lt - t1) / 0.5))), U.K[2], ease.io3(clamp((lt - t2) / 0.5)));
    st.frame = (lt) => {
      bd.update(lt + cB); const k = kOf(lt);
      st.camera.position.set((960 - U.cx) / P, 0, 30); st.camera.rotation.set(0, 0, 0);
      gal.userData.update({ scale: k, sizeK: 0.5 + 0.5 * k, opacity: 0.55 + 0.45 * k });
      lv.setAttribute('r', (U.R * k * P).toFixed(1));
    };
    show(s, rs, tA - 0.2, null, { opacity: 0 }, 0.4);
    s.tl.to(rs.querySelector('.g0'), { opacity: 0.55, duration: 0.3 }, t1).to(rs.querySelector('.g1'), { opacity: 0.55, duration: 0.3 }, t2);
    const rows = [['AAJ', 'phail rahi hai', -38, 228, tA], ['KAL', 'chhoti thi', -12, 430, t1 + 0.2], ['PARSON', 'aur chhoti', 22, 632, t2 + 0.2]].map(([nm, sb, ang, y, t], i) => {
      const r = U.R * U.K[i] * P, a = ang * Math.PI / 180, ax = U.cx + r * Math.cos(a), ay = 540 + r * Math.sin(a);
      const ln = svg(s, `<path d="M ${ax.toFixed(1)} ${ay.toFixed(1)} L 1262 ${y + 62} H 1296" fill="none" stroke="#6FD8FF" stroke-width="2.5"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="7" fill="#6FD8FF"/>`);
      const lb = s.div(null, { position: 'absolute', left: '1312px', top: y + 'px', width: '520px' }, `<div class="bebas sh" style="font-size:124px;color:#fff">${nm}</div><div class="mono cyan sh" style="font-size:26px;font-weight:700;letter-spacing:.24em;margin-top:2px">${sb}</div>`);
      gsap.set(ln, { autoAlpha: 0 }); s.tl.set(ln, { autoAlpha: 1 }, t).fromTo(ln.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' }, t);
      show(s, lb, t + 0.1, null, { opacity: 0, x: 40 }, 0.45); s.sfx('tick', t + 0.1);
      return [ln, lb];
    });
    s.tl.to(rows[0], { opacity: 0.4, duration: 0.4 }, t1 + 0.2).to(rows[1], { opacity: 0.4, duration: 0.4 }, t2 + 0.2);
    s.sfx('whooshRev', t1, { dur: 0.5, gain: 0.6 }); s.sfx('whooshRev', t2, { dur: 0.5, gain: 0.6 });
    const hd = s.div('mono cyan sh', { position: 'absolute', left: '110px', top: '96px', fontSize: '30px', fontWeight: 700, letterSpacing: '.3em' }, 'AGAR AAJ PHAIL RAHI HAI…'); show(s, hd, 0.1, null, { opacity: 0, x: -20 }, 0.4);
    s.div('vig');
  }, { fin: X, z: Z++ });

  defScene('b11_rewind', T('49'), T('50') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tPt = clamp(L('49', 14) + 0.1, 2.0, Math.max(2.0, d - 1.2)), c0 = cB + (T('49') - T('46'));
    const { st, bd, gal } = uniWorld(s);
    const halo = glow(0xa8d0ff, 1, 0, 0, 1.5), core = glow(0xffffff, 1, 0, 0.1, 2.4); st.scene.add(halo, core);
    const rs = svg(s, `<circle class="lv" cx="${U.cx}" cy="540" r="10" fill="none" stroke="#B9ECFF" stroke-width="4"/>`), lv = rs.querySelector('.lv');
    const strip = (top, cut) => { const b = s.div(null, { position: 'absolute', left: '0', top: top + 'px', width: '1920px', height: '66px', background: '#000' }); return b.appendChild(el('div', null, { position: 'absolute', left: '0', right: cut + 'px', top: '19px', height: '28px', backgroundImage: 'repeating-linear-gradient(90deg, rgba(245,241,232,.2) 0 34px, rgba(0,0,0,0) 34px 78px)' })); };
    const h1 = strip(0, 0), h2 = strip(1014, 470);
    const X0 = 560, X1 = 1560, pb = s.div(null, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '220px' });
    pb.innerHTML = `<div class="mono cyan sh" style="position:absolute;left:110px;top:100px;font-size:34px;font-weight:700;letter-spacing:.3em">◀◀&nbsp; REWIND</div>
      <div style="position:absolute;left:${X0}px;top:120px;width:${X1 - X0}px;height:4px;background:rgba(245,241,232,.25)"></div><div class="fl" style="position:absolute;left:${X0}px;top:118px;width:${X1 - X0}px;height:8px;background:linear-gradient(90deg,#6FD8FF,#B9ECFF);transform-origin:0 50%"></div>
      <div class="hdm" style="position:absolute;left:-7px;top:98px;width:14px;height:48px;border-radius:7px;background:#fff;box-shadow:0 0 22px rgba(111,216,255,.9)"></div>
      <div class="mono sh" style="position:absolute;left:${X1 + 26}px;top:104px;font-size:28px;font-weight:700;letter-spacing:.2em;color:rgba(245,241,232,.8)">AAJ</div>
      <div class="mono cyan sh lm" style="position:absolute;left:${X0 - 14}px;top:154px;font-size:26px;font-weight:700;letter-spacing:.26em">▲ EK LAMHA</div>`;
    const fl = pb.querySelector('.fl'), hdm = pb.querySelector('.hdm');
    show(s, pb.querySelector('.lm'), Math.max(0.8, L('49', 7) - 0.1), null, { opacity: 0, y: 12 }, 0.4);
    st.frame = (lt) => {
      const u = clamp(lt / tPt), k = U.K[2] * (1 - Math.pow(u, 1.5)), z = lerp(30, 15, ease.io3(u)), a = Math.max(0, lt - tPt), P = ppu(z);
      st.camera.position.set((960 - U.cx) / P, 0, z); st.camera.rotation.set(0, 0, 0);
      bd.update(c0 - 5 * tPt * (1 - Math.pow(1 - u, 2)));                                                       // the sky runs backwards, then goes dark: before the stars
      const vis = 1 - smooth(0.25, 0.95, u); bd.dome.material.opacity = 0.75 * vis; bd.s1.material.uniforms.opacity.value = vis; bd.s2.material.uniforms.opacity.value = vis;
      gal.userData.update({ scale: Math.max(k, 0.0005), sizeK: 0.5 + 0.5 * k, opacity: (0.55 + 0.45 * k) * (1 - smooth(0.82, 1, u)) }); gal.rotation.z = -1.8 * u * u;
      const c = smooth(0.4, 1, u), p = 1 + 0.1 * Math.sin(a * 3.2);
      core.scale.setScalar((0.3 + 1.2 * c) * p); core.material.opacity = c; halo.scale.setScalar((1 + 6.5 * c) * p); halo.material.opacity = 0.5 * c;
      lv.setAttribute('r', Math.max(0.5, U.R * k * P).toFixed(1)); lv.style.opacity = (1 - smooth(0.7, 0.98, u)).toFixed(3);
      const off = 1500 * (1 - Math.pow(1 - u, 2)); h1.style.backgroundPositionX = off.toFixed(1) + 'px'; h2.style.backgroundPositionX = off.toFixed(1) + 'px';
      fl.style.transform = `scaleX(${(1 - u).toFixed(4)})`; hdm.style.transform = `translateX(${lerp(X1, X0, u).toFixed(1)}px)`;
    };
    cap(s, 'Film ko <span class="hl">ulta</span> chalate jaiye…', 0.05, Math.max(1.0, Math.min(L('49', 6), tPt - 0.4)), { bottom: 104 });
    s.sfx('rewind', 0.05, { dur: tPt }); s.sfx('riser', Math.max(0, tPt - 1.8), { dur: 1.8 }); s.sfx('hit', tPt); flash(s, tPt, { peak: 0.35, dur: 0.6 });
    const pt = svg(s, `<path d="M ${U.cx + 52} 540 H 990" stroke="#B9ECFF" stroke-width="3" fill="none"/>`);
    gsap.set(pt, { autoAlpha: 0 }); s.tl.set(pt, { autoAlpha: 1 }, tPt + 0.1).fromTo(pt.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, tPt + 0.1);
    const nq = s.div(null, { position: 'absolute', left: '1012px', top: '438px', width: '800px' }, `<div class="bebas glowc" style="font-size:190px;color:#fff">EK NUQTA</div><div class="mont sh" style="font-size:40px;font-weight:700;margin-top:6px;color:rgba(245,241,232,.88)">sab kuch — yahin <span style="color:var(--cyan)">simta hua</span> tha</div>`);
    show(s, nq, tPt + 0.2, null, { opacity: 0, x: 40 }, 0.6);
    s.div('vig');
  }, { z: Z++ });

  // ───────── B12  Einstein's reply ─────────
  defScene('b12_jawab', T('50'), T('53') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tAt = Math.max(0.7, L('51') - 0.08), tQ = Math.max(tAt + 0.5, L('52') - 0.3);
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 42%, #0e1a36 0%, #060a16 58%, #010207 100%)' });
    const st = stage3d(s, { fov: 50 }); const stars = starfield({ count: 1800, radius: 300, seed: 71, px: 2.2 }); st.scene.add(stars);
    st.frame = (lt) => { stars.rotation.y = lt * 0.012; stars.material.uniforms.time.value = lt; };
    const cE = photoCard(s, PIC.e21, { x: 110, y: 214, w: 380, h: 500 }, 0.05, null, { rot: -2, pos: '50% 18%', from: { x: -80, opacity: 0, scale: 0.96 } });
    photoCard(s, PIC.lem, { x: 1430, y: 214, w: 380, h: 500 }, 0.2, null, { rot: 2, pos: '30% 6%', from: { x: 80, opacity: 0, scale: 0.96 } });
    const nt = (x, t, c) => show(s, s.div('bebas sh', { position: 'absolute', left: x + 'px', top: '740px', width: '380px', textAlign: 'center', fontSize: '66px', letterSpacing: '.06em' }, t), c, null, { opacity: 0, y: 14 }, 0.4);
    nt(110, 'EINSTEIN', 0.3); nt(1430, 'LEMAÎTRE', 0.45);
    s.tl.to(cE, { boxShadow: '0 40px 120px rgba(0,0,0,.75), 0 0 0 3px rgba(233,185,85,.95), 0 0 70px rgba(233,185,85,.35)', duration: 0.5 }, 0.5);
    const hd = s.div('bebas sh', { position: 'absolute', left: '0', right: '0', top: '92px', textAlign: 'center', fontSize: '120px' }, 'EINSTEIN KA <span class="gold">JAWAB?</span>'); sync(s, hd, '50', { y: 30 }); s.sfx('whoosh', 0.05, { gain: 0.6 });
    const qb = s.div(null, { position: 'absolute', left: '530px', top: '250px', width: '860px', textAlign: 'center' });
    qb.innerHTML = `<div class="play gold m" style="font-size:190px;line-height:.6;height:74px;opacity:.9">“</div>
      <div class="quote sh q1" style="font-size:60px;line-height:1.25;white-space:nowrap">Tumhara <span class="g">hisaab durust</span> hai —</div>
      <div class="quote sh q2" style="font-size:60px;line-height:1.25;margin-top:12px;white-space:nowrap">lekin tumhari <span class="r">physics<br>bardasht se bahar</span> hai.”</div>`;
    s.tl.fromTo(qb.querySelector('.m'), { opacity: 0, scale: 0.4 }, { opacity: 0.9, scale: 1, duration: 0.45, ease: 'back.out(2)' }, tQ);
    sync(s, qb.querySelector('.q1'), '52'); sync(s, qb.querySelector('.q2'), '52', { from: 5 });
    const tG = L('52', 2) + 0.1, tR = L('52', 8) + 0.1;
    s.tl.to(qb.querySelector('.g'), { color: '#57E39A', duration: 0.3 }, tG).to(qb.querySelector('.r'), { color: '#FF5B5B', duration: 0.3 }, tR);
    const tgf = (x, col, html) => s.div('mono', { position: 'absolute', left: x + 'px', top: '640px', width: '300px', textAlign: 'center', fontSize: '30px', fontWeight: 700, letterSpacing: '.22em', color: col, border: `2.5px solid ${col}`, borderRadius: '8px', padding: '12px 0 10px', background: 'rgba(4,6,12,.6)', whiteSpace: 'nowrap' }, html);
    show(s, tgf(645, '#57E39A', ICO.ok() + 'HISAAB'), tG, null, { opacity: 0, scale: 1.6 }, 0.3); show(s, tgf(975, '#FF4B4B', ICO.no() + 'PHYSICS'), tR, null, { opacity: 0, scale: 1.6 }, 0.3);
    s.sfx('ding', tG); s.sfx('buzz', tR);
    const by = s.div('quote-by sh', { position: 'absolute', left: '0', right: '0', top: '842px', textAlign: 'center', marginTop: '0' }, '— Einstein · Lemaître ke apne bayan ke mutabiq'); show(s, by, tAt, null, { opacity: 0, y: 14 }, 0.5);
    s.div('vig');
  }, { fin: X, z: Z++ });

  // ───────── B13  1929 · Mount Wilson · Edwin Hubble ─────────
  const tH = Math.max(T('55') + 1.0, TW('55', 5) - 0.25);
  defScene('b13_earth', T('53'), tH + 0.4, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tC0 = Math.max(0.3, L('53', 1) - 0.1), tY = Math.max(tC0 + 0.4, L('54') - 0.05), tC = Math.max(tY + 0.3, L('55') - 0.05);
    const st = stage3d(s, { bg: 0x000208, fov: 38 }); const bd = spaceBackdrop(st, { gain: 0.3, seed: 41 });
    const g = brightEarth(earth({ nightGain: 1.4 })); st.scene.add(g); g.userData.sun.set(0.35, 0.5, 0.8).normalize();
    const v = latLon(34.22, -118.06), th1 = -Math.atan2(v.x, v.z), th0 = th1 - 1.5, pf = new THREE.Vector3(0, v.y, Math.hypot(v.x, v.z));
    const pn = pin(0x6fd8ff, 0.034); pn.position.copy(v.clone().multiplyScalar(1.006)); pn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.clone().normalize()); g.add(pn);
    const co = s.div(null, { position: 'absolute', left: '0', top: '0' }), coi = co.appendChild(el('div', null, { position: 'absolute', left: '0', top: '0' }, `<svg width="140" height="100" style="position:absolute;left:0;top:-100px;overflow:visible"><path d="M 6 94 L 70 30 H 130" fill="none" stroke="#6FD8FF" stroke-width="2.5"/></svg><div class="mono cyan sh" style="position:absolute;left:142px;top:-92px;font-size:30px;font-weight:700;letter-spacing:.26em;white-space:nowrap">MOUNT WILSON</div>`));
    st.frame = (lt) => {
      bd.update(lt + 30);
      const k = ease.io3(clamp(lt / Math.max(1.5, tC + 0.75)));
      g.rotation.y = lerp(th0, th1, k); g.updateMatrixWorld(true);
      st.camera.position.copy(new THREE.Vector3(0.12, lerp(0.25, 0.62, k), 1).normalize().multiplyScalar(lerp(4.9, 2.25, k) - 0.12 * clamp(lt / d)));
      st.camera.lookAt(pf.clone().multiplyScalar(0.55 * k)); st.camera.updateMatrixWorld(true);
      pn.userData.update(lt); pn.visible = k > 0.3;
      const [px, py] = proj(st, pn.getWorldPosition(new THREE.Vector3())); co.style.left = px.toFixed(1) + 'px'; co.style.top = py.toFixed(1) + 'px';
    };
    s.div('scrim-t');
    const yr = s.div('dl', null, '<div class="yr sh">1927</div><div class="rule"></div><div class="pl sh"></div>'), yn = yr.querySelector('.yr'), plc = yr.querySelector('.pl');
    show(s, yr, 0.1, null, { opacity: 0 }, 0.3); s.tl.fromTo(yr.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, 0.2);
    counter(s, yn, 1927, 1929, tC0, tY - tC0, (x) => String(Math.round(x)), 'power2.in'); s.sfx('tick', tC0 + (tY - tC0) * 0.5); s.sfx('hit', tY, { gain: 0.7 });
    s.tl.fromTo(yn, { scale: 1 }, { scale: 1.14, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '0 60%' }, tY);
    const ch = s.div('chip', { position: 'absolute', left: '440px', top: '124px' }, 'SIRF 2 SAAL BAAD'); show(s, ch, Math.max(0.15, L('53') - 0.05), null, { opacity: 0, x: -24 }, 0.45);
    const pls = 'MOUNT WILSON, CALIFORNIA', pr = { n: 0 };
    s.tl.to(pr, { n: pls.length, duration: 1.0, ease: 'none', onUpdate: () => { plc.textContent = pls.slice(0, Math.round(pr.n)) + (pr.n > 0 && pr.n < pls.length ? '▍' : ''); } }, tC); s.sfx('type', tC, { dur: 1.0 });
    show(s, coi, tC + 0.4, null, { opacity: 0, x: -20 }, 0.4);
    cap(s, 'California ki ek <span class="hl">pahadi</span> par…', tC + 0.05, d + 1, { bottom: 84 });
    s.sfx('whoosh', tC, { gain: 0.5 });
    s.div('vig');
  }, { fin: X, z: Z++ });

  defScene('b13_hubble', tH, T('56') + X, (s) => {
    const L = LL(s), d = s.t1 - s.t0, tT = Math.max(0.9, L('55', 10) - 0.15), tG = Math.max(tT + 0.8, L('55', 15) - 0.15);
    s.div('fill', { background: 'radial-gradient(ellipse at 40% 42%, #0e1a36 0%, #060a16 58%, #010207 100%)' });
    photoCard(s, PIC.hubble, { x: 120, y: 104, w: 500, h: 668 }, 0.0, null, { rot: -2, pos: '55% 18%', from: { x: -80, opacity: 0, scale: 0.96 } });
    lowerThird(s, 'EDWIN HUBBLE', 'Mount Wilson · 1929', 0.2, d + 5, { bottom: 92 });
    photoCard(s, PIC.hooker, { x: 730, y: 92, w: 590, h: 752 }, tT, null, { rot: 1.5, pos: '50% 40%', from: { y: 80, opacity: 0, scale: 0.95 } }); s.sfx('camera', tT);
    const tl = s.div(null, { position: 'absolute', left: '730px', top: '868px', width: '700px' }, `<div class="mono cyan sh" style="font-size:27px;font-weight:700;letter-spacing:.26em">100-INCH HOOKER TELESCOPE</div><div class="mont sh" style="font-size:36px;font-weight:700;margin-top:8px">us waqt ki <span style="color:var(--gold)">sab se badi</span> telescope</div>`);
    show(s, tl, tT + 0.3, null, { opacity: 0, y: 16 }, 0.45);
    const ey = s.div(null, { position: 'absolute', left: '1404px', top: '236px', width: '400px', height: '400px', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(111,216,255,.8)', boxShadow: '0 0 0 10px rgba(4,6,12,.7), 0 0 60px rgba(111,216,255,.35)', background: '#000' });
    const gi = pic(ey, PIC.m51); ey.appendChild(el('div', 'fill', { background: 'linear-gradient(90deg, rgba(0,0,0,0) calc(50% - 1px), rgba(111,216,255,.5) calc(50% - 1px), rgba(111,216,255,.5) calc(50% + 1px), rgba(0,0,0,0) calc(50% + 1px)), linear-gradient(180deg, rgba(0,0,0,0) calc(50% - 1px), rgba(111,216,255,.5) calc(50% - 1px), rgba(111,216,255,.5) calc(50% + 1px), rgba(0,0,0,0) calc(50% + 1px)), radial-gradient(circle, rgba(0,0,0,0) 55%, rgba(0,0,0,.7) 100%)' }));
    show(s, ey, tG, null, { opacity: 0, scale: 0.5 }, 0.6); s.tl.fromTo(gi, { scale: 1.5, rotate: -8 }, { scale: 1.1, rotate: 4, duration: Math.max(1, d - tG), ease: 'power1.out' }, tG);
    const el2 = s.div('mono cyan sh', { position: 'absolute', left: '1354px', top: '664px', width: '500px', textAlign: 'center', fontSize: '27px', fontWeight: 700, letterSpacing: '.26em' }, 'DOOR KI GALAXIES'); show(s, el2, tG + 0.3, null, { opacity: 0, y: 14 }, 0.4);
    s.sfx('shimmer', tG, { gain: 0.7 });
    s.div('vig');
  }, { fin: 0.4, z: Z++ });

  // ───────── B14  the galaxies are fleeing — the farther, the faster ─────────
  defScene('b14_recede', T('56'), T('58') + 0.02, (s) => {
    const L = LL(s), d = s.t1 - s.t0, N = 300, tD = Math.max(1.2, L('57') - 0.3), tLn = Math.max(tD + 0.7, L('57', 2) - 0.1), tTz = Math.max(tLn + 0.8, L('57', 6) - 0.1);
    footage(s, 'b_xdfflight', { n: N, start: N - 1, speed: -clamp((N - 1) / (d * 30), 0.45, 1), kb: { s0: 1.14, s1: 1.0 } });       // the fly-through played backwards: everything recedes
    const chv = svg(s, [45, 135, 225, 315].map((a) => `<g transform="rotate(${a} 960 540)"><path class="cv" d="M 936 150 L 960 174 L 984 150 M 936 186 L 960 210 L 984 186" fill="none" stroke="#6FD8FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`).join(''));
    const cvs = [...chv.querySelectorAll('.cv')];
    s.onUpdate((lt) => { const ph = (lt * 0.8) % 1; cvs.forEach((c) => { c.style.transform = `translateY(${(90 * ph).toFixed(1)}px)`; c.style.opacity = (0.7 * Math.sin(Math.PI * ph)).toFixed(3); }); });
    show(s, chv, 0.3, tD + 0.3, { opacity: 0 }, 0.5);
    s.div('scrim-b');
    cap(s, 'Door ki galaxies hum se <span class="hl">door bhaag rahi</span> hain', 0.08, tD + 0.1, { bottom: 84 }); s.sfx('whooshRev', 0.05, { dur: 1.2, gain: 0.6 });
    // Hubble diagram
    const pn = s.div('panel', { left: '1010px', top: '150px', width: '800px', height: '690px' });
    const R = rng(29); let dots = '';
    for (let i = 0; i < 16; i++) { const x = 168 + i * 35 + R() * 14, y = 580 - (x - 120) * 0.75 + (R() - 0.5) * (30 + i * 3.4); dots += `<circle class="pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="#B9ECFF"/>`; }
    pn.innerHTML = `<div class="mono cyan" style="position:absolute;left:44px;top:30px;font-size:24px;font-weight:700;letter-spacing:.3em">EDWIN HUBBLE · 1929</div>
      <svg width="800" height="690" viewBox="0 0 800 690" style="position:absolute;left:0;top:0;overflow:visible">
        <path d="M 120 250 H 740 M 120 415 H 740 M 325 96 V 580 M 530 96 V 580" stroke="rgba(245,241,232,.09)" stroke-width="2"/>
        <path d="M 120 96 V 580 H 746 M 108 112 L 120 92 L 132 112 M 730 568 L 750 580 L 730 592" fill="none" stroke="rgba(245,241,232,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}<path class="fit" d="M 120 580 L 712 136" stroke="#F2C968" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path class="px" d="" stroke="#6FD8FF" stroke-width="3" stroke-dasharray="8 9" fill="none"/><circle class="mk" cx="120" cy="580" r="13" fill="#fff" stroke="#F2C968" stroke-width="5"/>
        <text class="lx" x="430" y="646" text-anchor="middle" font-family="Space Mono" font-weight="700" font-size="32" letter-spacing="7" fill="#6FD8FF">FASLA</text>
        <text class="ly" transform="translate(70 338) rotate(-90)" text-anchor="middle" font-family="Space Mono" font-weight="700" font-size="32" letter-spacing="7" fill="#6FD8FF">RAFTAAR</text></svg>
      <div class="bebas cx" style="position:absolute;right:44px;top:598px;font-size:64px;color:#F8DE9A">JITNI DOOR</div><div class="bebas cy" style="position:absolute;left:156px;top:84px;font-size:64px;color:#F8DE9A">UTNI TEZ</div>`;
    show(s, pn, tD, null, { opacity: 0, x: 80 }, 0.6); s.sfx('whoosh', tD, { gain: 0.5 });
    s.tl.fromTo(pn.querySelectorAll('.pt'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', stagger: Math.min(0.06, Math.max(0.02, (tLn - tD - 0.3) / 16)) }, tD + 0.3);
    s.tl.fromTo(pn.querySelector('.fit'), { drawSVG: '0%' }, { drawSVG: '100%', duration: Math.max(0.6, tTz - tLn + 0.3), ease: 'power1.inOut' }, tLn);
    const mk = pn.querySelector('.mk'), px = pn.querySelector('.px');
    s.onUpdate((lt) => { const u = ease.io3(clamp((lt - tLn) / Math.max(0.6, tTz - tLn + 0.3))), x = lerp(120, 712, u), y = lerp(580, 136, u); mk.setAttribute('cx', x.toFixed(1)); mk.setAttribute('cy', y.toFixed(1)); mk.style.opacity = lt < tLn ? '0' : '1'; px.setAttribute('d', lt < tLn ? '' : `M ${x.toFixed(1)} 580 V ${y.toFixed(1)} H 120`); });
    show(s, pn.querySelector('.cx'), tLn + 0.15, null, { opacity: 0, x: -24 }, 0.4); show(s, pn.querySelector('.cy'), tTz, null, { opacity: 0, y: 24 }, 0.4);
    s.sfx('tick', tLn + 0.15); s.sfx('ding', tTz + 0.1, { gain: 0.7 });
    cap(s, 'jo jitni <span class="hl">door</span> — utni hi <span class="hl">tez</span>', tLn, d + 1, { bottom: 84 });
    s.div('vig');
  }, { fin: X, z: Z++ });

  // ───────── B15  the verdict: three hard beats ─────────
  defScene('b15_phail', T('58'), T('59') + 0.02, (s) => {
    const L = LL(s), d = s.t1 - s.t0;
    const st = stage3d(s, { bg: 0x01030a, fov: 55 }); const bd = spaceBackdrop(st, { gain: 0.4, seed: 8 });
    const gal = galaxyField({ count: 320, radius: 70, size: 4.2, seed: 12 }); st.scene.add(gal);
    st.frame = (lt) => {
      bd.update(lt + 44); gal.userData.update({ scale: 0.55 + lt * 0.1 + 0.03 * lt * lt, redshift: clamp(lt * 0.14) });
      const sh = Math.max(0, 1 - lt / 0.6) * 0.5; st.camera.position.set(noise1(lt * 30, 1) * sh, noise1(lt * 33, 2) * sh, 0.01); st.camera.lookAt(0, 0, -10); st.camera.rotation.z = lt * 0.02;
    };
    flash(s, 0, { dur: 0.5, peak: 0.85 }); s.sfx('impact', 0); s.sfx('whoosh', 0.05, { gain: 0.6 });
    const h = s.div('anton sh', { position: 'absolute', left: '0', right: '0', top: '296px', textAlign: 'center', fontSize: '226px', lineHeight: '1.04' }, '<span class="k">KAINAT</span> <span class="k">PHAIL</span><br><span class="k">RAHI</span> <span class="k goldgrad" style="text-shadow:none">THI.</span>');
    keys(s, h, [0, 1, 2, 3].map((i) => L('58', i)), { slam: 3 }); s.sfx('hit', L('58', 3) + 0.06); shake(s, h, L('58', 3) + 0.06, 0.45, 16);
    s.tl.to(h, { scale: 1.05, duration: d, ease: 'none' }, 0);
    s.div('vig');
  }, { z: Z++ });

  const verdict = (s, phase) => {                                   // split board: Einstein | Lemaître
    s.div('fill', { background: 'radial-gradient(ellipse at 50% 44%, #0f1b38 0%, #060a16 58%, #010207 100%)' });
    s.div(null, { position: 'absolute', left: '959px', top: '120px', width: '2px', height: '820px', background: 'linear-gradient(180deg, rgba(245,241,232,0), rgba(245,241,232,.3) 30%, rgba(245,241,232,.3) 70%, rgba(245,241,232,0))' });
    const card = (x, src, pos) => { const c = s.div('photo', { left: x + 'px', top: '130px', width: '500px', height: '640px' }); pic(c, src, { objectPosition: pos }); c.appendChild(el('div', 'fill', { background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)' })); return c; };
    const name = (x, t) => s.div('bebas sh', { position: 'absolute', left: (x - 100) + 'px', top: '792px', width: '700px', textAlign: 'center', fontSize: '128px', letterSpacing: '.04em' }, t);
    return { cE: card(230, PIC.e47, '50% 16%'), nE: name(230, 'EINSTEIN'), cL: card(1190, PIC.lem, '30% 6%'), nL: name(1190, 'PADRI'), phase };
  };
  defScene('b15_ghalat', T('59'), T('60') + 0.02, (s) => {
    const L = LL(s), v = verdict(s, 1), tS = Math.max(0.3, L('59', 1) - 0.12);
    gsap.set([v.cL, v.nL], { autoAlpha: 0 });
    flash(s, 0, { peak: 0.6, dur: 0.4 }); s.sfx('hit', 0, { gain: 0.8 });
    s.tl.fromTo(v.cE, { scale: 1.16, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' }, 0).fromTo(v.nE, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.08);
    stamp(s, 'GHALAT', tS, { x: 250, y: 520, size: 136, rot: -9 }); s.sfx('buzz', tS + 0.12); s.sfx('impact', tS + 0.22, { gain: 0.9 }); shake(s, v.cE, tS + 0.22, 0.45, 16);
    s.div('vig');
  }, { z: Z++ });
  defScene('b15_sahi', T('60'), P1 + 0.3, (s) => {
    const L = LL(s), v = verdict(s, 2), tS = Math.max(0.3, L('60', 1) - 0.12);
    gsap.set([v.cE, v.nE], { opacity: 0.42 });
    s.div('stamp red', { left: '250px', top: '520px', fontSize: '136px', transform: 'rotate(-9deg)', opacity: '.55' }, 'GHALAT');
    flash(s, 0, { peak: 0.6, dur: 0.4 }); s.sfx('hit', 0, { gain: 0.8 });
    s.tl.fromTo(v.cL, { scale: 1.16, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' }, 0).fromTo(v.nL, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.08);
    stamp(s, 'SAHI', tS, { x: 1286, y: 510, size: 150, rot: -7, cls: 'green' }); s.sfx('ding', tS + 0.12, { gain: 1.1 }); s.sfx('impact', tS + 0.22, { gain: 0.9 }); shake(s, v.cL, tS + 0.22, 0.45, 14);
    s.tl.to(v.cL, { boxShadow: '0 40px 120px rgba(0,0,0,.75), 0 0 0 3px rgba(87,227,154,.9), 0 0 90px rgba(87,227,154,.4)', duration: 0.4 }, tS + 0.22);
    s.div('vig');
  }, { fout: 0.3, z: Z++ });
}
