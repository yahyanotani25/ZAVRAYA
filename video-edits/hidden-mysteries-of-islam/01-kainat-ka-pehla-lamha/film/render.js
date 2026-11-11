// node render.js <f0> <f1> <out.mp4>  : renders frames [f0,f1) at 30 fps, pipes JPEGs into ffmpeg (x264)
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const { start } = require('./server');
(async () => {
  const f0 = +process.argv[2], f1 = +process.argv[3], out = process.argv[4]; const FPS = 30; const qs = process.argv[5] ? '?' + process.argv[5] : '';
  const { srv, port } = await start();
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-web-security', '--font-render-hinting=none'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  pg.setDefaultTimeout(0); pg.on('pageerror', e => console.log('PAGEERROR', e.message));
  pg.on('console', m => { const t = m.text(); if (/asset error|missing cue|Error/.test(t)) console.log('console:', t); });
  await pg.goto(`http://127.0.0.1:${port}/index.html${qs}`);
  await pg.waitForFunction('window.ready===true', null, { timeout: 60000 });
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', '-g', '30', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await pg.evaluate(async (t) => { await window.seek(t); }, f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 96, timeout: 0 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 150 === 0) console.log(`[${out.split('/').pop()}] frame ${f} (${f - f0}/${f1 - f0}) ${((Date.now() - t0) / Math.max(1, f - f0 + 1)).toFixed(0)} ms/f`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`[${out.split('/').pop()}] DONE ${f1 - f0} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await b.close(); srv.close();
})();
