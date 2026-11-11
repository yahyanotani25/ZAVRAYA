// component test bench (not part of the film)
import { defScene, stage3d, THREE, el, glow, starfield } from '../engine.js';
import { mkL, bg, dust, bars, slam, txt, clock, calc, dunes, ruins, blob, pict, chapter, coin, coinLights, cutEarth, GOLD, CYAN } from '../lib14.js';
import { svg } from '../ui.js';
export default function () {
  defScene('z_coin', 0, 10, (s) => {
    const st = stage3d(s, { bg: 0x020308, fov: 32 }); const c = coin(); st.scene.add(c); const up = coinLights(st.scene);
    st.frame = (lt) => { up(lt); c.rotation.set(-0.35 + Math.sin(lt * 0.5) * 0.12, 0.5 * Math.sin(lt * 0.35) + lt * 0.05, 0.1); st.camera.position.set(0, 0, 5.2 - lt * 0.08); st.camera.lookAt(0, 0, 0); };
    dust(s, { n: 60, seed: 5 }); bars(s); s.div('vig');
  });
  defScene('z_earth', 10, 20, (s) => {
    const st = stage3d(s, { bg: 0x01030a, fov: 36 }); const e = cutEarth(); st.scene.add(e); st.scene.add(new THREE.AmbientLight(0xffffff, 0.5)); const d = new THREE.DirectionalLight(0xffffff, 2.6); d.position.set(2, 2, 4); st.scene.add(d);
    st.scene.add(starfield({ count: 2000, radius: 300, seed: 3 }));
    st.frame = (lt) => { e.rotation.y = -0.25 + lt * 0.04; e.rotation.x = 0.2; st.camera.position.set(0, 0.3, 4.3); st.camera.lookAt(0, 0, 0); };
    s.div('vig');
  });
  defScene('z_ui', 20, 30, (s) => {
    bg(s, 'radial-gradient(ellipse at 50% 40%, #0d1b38 0%, #03060f 60%, #000 100%)');
    const c1 = clock(s, { x: 300, y: 300, r: 150 }), c2 = clock(s, { x: 300, y: 720, r: 110, color: GOLD, sweep: true });
    s.onUpdate((lt) => { c1.set(36610 + lt); c2.set(36610 + lt * 400); });
    const p = calc(s, { x: 660, y: 90 }); let t = p.type(0.5, '365.24'); p.at(t + 0.3, '365.24', '365.24 ×', '×'); t = p.type(t + 0.6, '300', 0.12, '', '365.24 ×'); p.at(t + 0.3, '109572', '365.24 × 300 =', '=');
    ['person', 'hand', 'eye', 'ear', 'bowl', 'bones', 'phone'].forEach((n, i) => { const d = s.div(null, { position: 'absolute', left: (1330 + (i % 3) * 190) + 'px', top: (120 + Math.floor(i / 3) * 290) + 'px' }, pict(n, 170, i % 2 ? GOLD : CYAN)); });
  });
  defScene('z_land', 30, 40, (s) => {
    bg(s, 'linear-gradient(180deg,#1a1020 0%,#5a2a1c 38%,#d9843a 62%,#f5c06a 74%,#3a1c10 76%,#120806 100%)');
    s.div(null, { position: 'absolute', left: '1180px', top: '560px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,#fff6d0 0%,#ffd27a 30%,rgba(255,190,90,.35) 55%,rgba(255,190,90,0) 72%)' });
    svg(s, `<path d="${dunes(4, 820, 30)}" fill="#3b1d12"/><path d="${ruins(7, 838, 260, { gap: 240 })}" fill="#2a130c" fill-rule="evenodd"/><path d="${dunes(9, 880, 40)}" fill="#1c0d08"/><path d="${ruins(12, 930, 460, { w: 260, gap: 330 })}" fill="#0c0504" fill-rule="evenodd"/><path d="${dunes(15, 990, 46)}" fill="#050202"/>`);
    dust(s, { n: 120, seed: 8, color: '255,210,150' }); s.div('vig');
  });
  defScene('z_chap', 40, 50, (s) => { chapter(s, 1, 'PEHLA SAWAL', 'SAU SAAL', '2:259q', 0.5, 9); });
  defScene('z_cave', 50, 60, (s) => {
    bg(s, 'linear-gradient(180deg,#f7e3b0 0%,#f0b866 40%,#a5562a 100%)');
    svg(s, `<path d="${dunes(3, 700, 40)}" fill="#7a3a1c"/><path d="M -100 -100 L 2020 -100 L 2020 1180 L -100 1180 Z ${blob(5, 1010, 500, 470, 330, 0.2)}" fill="#050302" fill-rule="evenodd"/>`);
    dust(s, { n: 90, seed: 2 }); s.div('vig');
  });
}
