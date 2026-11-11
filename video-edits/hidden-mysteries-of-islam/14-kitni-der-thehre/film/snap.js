// node snap.js out_dir t1 t2 ...   (or --range a b step) -> JPEG stills for review; prints ms/frame
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { start } = require('./server');
(async () => {
  const args = process.argv.slice(2); const out = args.shift(); fs.mkdirSync(out, { recursive: true });
  let times = []; let scale = 1; let qs = '';
  while (args[0] && args[0].startsWith('--q=')) { qs = '?' + args.shift().slice(4); }
  if (args[0] === '--half') { scale = 0.5; args.shift(); }
  if (args[0] === '--range') { const a = +args[1], b = +args[2], st = +args[3]; for (let t = a; t < b - 1e-9; t += st) times.push(+t.toFixed(4)); } else times = args.map(Number);
  const { srv, port } = await start();
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-web-security', '--font-render-hinting=none'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  pg.on('console', m => { const t = m.text(); if (!/GPU stall|WebGL-|willReadFrequently/.test(t)) console.log('console:', t); }); pg.on('pageerror', e => console.log('PAGEERROR', e.message));
  await pg.goto(`http://127.0.0.1:${port}/index.html${qs}`);
  await pg.waitForFunction('window.ready===true', null, { timeout: 60000 });
  const t0 = Date.now();
  for (const t of times) {
    const ids = await pg.evaluate(async (t) => await window.seek(t), t);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 88, scale: 'css' });
    const name = path.join(out, `t${t.toFixed(2).padStart(7, '0')}.jpg`); fs.writeFileSync(name, buf);
    if (times.length <= 12) console.log(t, ids.join(','));
  }
  console.log('ms/frame', ((Date.now() - t0) / times.length).toFixed(0), 'frames', times.length);
  await b.close(); srv.close();
})();
