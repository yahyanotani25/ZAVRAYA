// Film assembly: loads the part modules (optionally a subset via ?parts=a,b) and registers their scenes.
import { boot, film, T } from './engine.js';

// first spoken-line key of each part (see edit/spoken.json). A part owns [start, next part's start).
export const PART_FIRST = { a: '0', b: '18', c: '61', d: '92', e: '127', f: '159', g: '176', h: '202', i: '256', j: '272' };
const ORDER = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
export function partRange(p) {
  const k = ORDER.indexOf(p);
  const t0 = p === 'a' ? 0 : T(PART_FIRST[p]) - 0.35;
  const t1 = k === ORDER.length - 1 ? film.cues.dur : T(PART_FIRST[ORDER[k + 1]]) - 0.35;
  return [t0, t1];
}

boot(async () => {
  const q = new URLSearchParams(location.search);
  const want = (q.get('parts') || ORDER.join(',')).split(',');
  for (const p of want) {
    try {
      const m = await import(`./scenes/${p}.js`);
      m.default(partRange(p));
    } catch (e) { console.log(`part ${p} failed: ${e && e.message}`); }
  }
  if (q.get('hud') !== '0') { try { (await import('./scenes/_global.js')).default(); } catch (e) { console.log('global failed ' + e.message); } }
});
