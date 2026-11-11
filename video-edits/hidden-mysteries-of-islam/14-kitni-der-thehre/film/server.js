// tiny static server for the film page (+ /frames and /assets mounted from the scratchpad)
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, SCR = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json' };
function start() {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
      let f = (u.startsWith('/frames/') || u.startsWith('/assets/') || u.startsWith('/gfx/')) ? path.join(SCR, u) : path.join(ROOT, u);
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end('nf'); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); });
    }).listen(0, '127.0.0.1', () => res({ srv, port: srv.address().port }));
  });
}
module.exports = { start };
