// global overlays above every scene: the unlabelled counter (bottom-left) and the channel bug (bottom-right)
import { defScene, film, T, clamp } from '../engine.js';
export const BPM = 70, CHANNEL = '';
export const beats = (t) => Math.floor(Math.max(0, t) * BPM / 60);
export default function () {
  defScene('_bug', 0, film.cues.dur + 1, (s) => {
    if (CHANNEL) s.div('cinzel', { position: 'absolute', right: '54px', bottom: '40px', fontSize: '19px', fontWeight: 700, letterSpacing: '.34em', color: 'rgba(245,241,232,.34)', textShadow: '0 1px 6px rgba(0,0,0,.8)' }, CHANNEL);
    const c = s.div('mono', { position: 'absolute', left: '58px', bottom: '34px', fontSize: '30px', fontWeight: 700, letterSpacing: '.14em', color: 'rgba(245,241,232,.6)', textShadow: '0 1px 8px rgba(0,0,0,.9)', transformOrigin: '0% 100%' });
    const hide0 = T('362') - 0.2, hide1 = T('374') + 0.2;         // the big in-scene counter takes over during the reveal
    s.onUpdate((lt) => {
      const n = beats(lt), ph = (lt * BPM / 60) % 1;
      c.textContent = String(n).padStart(4, '0');
      c.style.transform = `scale(${(1 + 0.1 * Math.exp(-ph * 9)).toFixed(3)})`;
      c.style.opacity = (lt > hide0 && lt < hide1) ? '0' : String(0.55 + 0.35 * Math.exp(-ph * 9));
    });
  }, { z: 90 });
}
