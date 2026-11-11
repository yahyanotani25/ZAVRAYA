// node thumb.js [out.png]  -> 1920x1080 PNG master of the thumbnail (thumb.html), same local server as the film
const { chromium } = require('playwright'); const { start } = require('./server');
(async () => {
  const out = process.argv[2] || '../v14/out/thumb_master.png';
  const { srv, port } = await start();
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => { if (/rror|404|missing/.test(m.text())) console.log('console:', m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/thumb.html`); await pg.waitForFunction('window.ready===true', null, { timeout: 120000 });
  await pg.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => 0)))); await pg.waitForTimeout(500);
  console.log(JSON.stringify(await pg.evaluate(() => window.geo)));
  await pg.screenshot({ path: out, type: 'png' }); await b.close(); srv.close(); console.log('ok', out);
})();
