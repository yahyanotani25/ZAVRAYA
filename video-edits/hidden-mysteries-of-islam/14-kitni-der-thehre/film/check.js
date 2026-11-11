// node check.js [query] [step=0.5] : seeks through the whole film without screenshots and reports errors / uncovered time
const { chromium } = require('playwright'); const { start } = require('./server');
(async () => {
  const qs = process.argv[2] ? '?' + process.argv[2] : ''; const step = +(process.argv[3] || 0.5);
  const { srv, port } = await start();
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = {}; let cur = 0;
  const note = (m) => { const k = m.slice(0, 160); (errs[k] = errs[k] || []).push(cur); };
  pg.on('pageerror', e => note('PAGEERROR ' + e.message)); pg.on('console', m => { const t = m.text(); if (/failed|missing cue|asset error|Error|not defined|undefined/.test(t) && !/GPU stall|WebGL-/.test(t)) note('console: ' + t); });
  await pg.goto(`http://127.0.0.1:${port}/index.html${qs}`); await pg.waitForFunction('window.ready===true', null, { timeout: 120000 });
  const info = await pg.evaluate(() => ({ dur: window.film.cues.dur, scenes: window.film.scenes.filter(s => !s.id.startsWith('_')).map(s => [s.id, s.t0, s.t1]) }));
  const t0 = Date.now(); const empty = [];
  for (let t = 0; t < info.dur; t += step) {
    cur = +t.toFixed(2);
    const ids = await pg.evaluate(async (t) => { try { return await window.seek(t); } catch (e) { return ['EXC ' + e.message]; } }, t);
    if (ids.some(x => x.startsWith('EXC'))) note(ids.join('|'));
    if (!ids.filter(x => !x.startsWith('_')).length) empty.push(cur);
  }
  console.log('seeks', Math.round(info.dur / step), 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's', 'scenes', info.scenes.length);
  const runs = []; for (const t of empty) { if (runs.length && t - runs[runs.length - 1][1] <= step + 1e-6) runs[runs.length - 1][1] = t; else runs.push([t, t]); }
  console.log('EMPTY (no scene) ranges:', JSON.stringify(runs));
  for (const [k, v] of Object.entries(errs)) console.log(`ERR x${v.length} @${v.slice(0, 4).join(',')}: ${k}`);
  await b.close(); srv.close();
})();
