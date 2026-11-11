// node export_sfx.js -> ../audio/sfx.json (all sound cues) + ../out/scenes.json (scene list)
const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('./server');
(async () => {
  const { srv, port } = await start();
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => { const t = m.text(); if (/failed|missing cue|asset error/.test(t)) console.log('console:', t); });
  await pg.goto(`http://127.0.0.1:${port}/index.html${process.argv[2] ? '?' + process.argv[2] : ''}`); await pg.waitForFunction('window.ready===true', null, { timeout: 90000 });
  const r = await pg.evaluate(() => { const sfx = window.buildAll(); return { sfx, scenes: window.film.scenes.map(s => ({ id: s.id, t0: s.t0, t1: s.t1 })), dur: window.film.cues.dur }; });
  fs.mkdirSync('../v14/audio', { recursive: true }); fs.writeFileSync('../v14/audio/sfx.json', JSON.stringify(r.sfx)); fs.writeFileSync('../v14/out/scenes.json', JSON.stringify(r.scenes, null, 1));
  console.log('sfx', r.sfx.length, 'scenes', r.scenes.length, 'dur', r.dur);
  // coverage check: any gap not covered by a scene (ignoring the global overlay)
  const sc = r.scenes.filter(s => !s.id.startsWith('_')).sort((a, b) => a.t0 - b.t0); let t = 0; const gaps = [];
  for (const s of sc) { if (s.t0 > t + 0.02) gaps.push([+t.toFixed(2), +s.t0.toFixed(2)]); t = Math.max(t, s.t1); }
  if (t < r.dur - 0.05) gaps.push([+t.toFixed(2), r.dur]);
  console.log('uncovered gaps', JSON.stringify(gaps));
  await b.close(); srv.close();
})();
