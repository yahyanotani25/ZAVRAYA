// global overlays that sit above every scene (kept minimal: channel bug)
import { defScene, film } from '../engine.js';
export default function () {
  defScene('_bug', 0, film.cues.dur + 1, (s) => {
    s.div('cinzel', { position: 'absolute', right: '54px', bottom: '40px', fontSize: '19px', fontWeight: 700, letterSpacing: '.34em', color: 'rgba(245,241,232,.34)', textShadow: '0 1px 6px rgba(0,0,0,.8)' }, 'HIDDEN MYSTERIES OF ISLAM');
  }, { z: 90 });
}
