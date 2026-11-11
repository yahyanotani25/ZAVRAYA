const { chromium } = require('playwright'); const { start } = require('./server'); const fs = require('fs');
(async () => {
  const { srv, port } = await start(); fs.mkdirSync('../out/brand', { recursive: true });
  const b = await chromium.launch({ args: ['--font-render-hinting=none'] });
  for (const [v, W, H] of [['thumb', 1920, 1080], ['logo', 1600, 1600], ['banner', 2560, 1440]]) {
    const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => { if (/rror|404/.test(m.text())) console.log('console:', m.text()); });
    await pg.goto(`http://127.0.0.1:${port}/brand.html?v=${v}&name=${process.argv[2] || 'UQOL'}`); await pg.waitForFunction('window.ready===true', null, { timeout: 60000 });
    await pg.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => 0)))); await pg.waitForTimeout(400);
    await pg.screenshot({ path: `../out/brand/${v}_master.png`, type: 'png' }); await pg.close(); console.log(v, 'ok');
  }
  await b.close(); srv.close();
})();
