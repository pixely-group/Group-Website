import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const root = path.resolve(import.meta.dirname,'dist/pixely-landing');
http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost:3001').pathname;
  if (pathname === '/') {
    res.setHeader('Content-Type','text/html');
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/app.css"></head><body class="grain min-h-full bg-ink text-bone"><div id="pixely-root">'+fs.readFileSync(root+'/hero.html','utf8').replaceAll('__PIXELY_ASSETS__','/assets/')+'</div><script>window.PixelyLanding={assets:"/assets/",endpoint:"/api/waitlist"}</script><script type="module" src="/assets/app.js"></script></body></html>');
    return;
  }
  const file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+'/') || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode=404;res.end();return; }
  res.setHeader('Content-Type',({'.css':'text/css','.js':'text/javascript','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(3001,'127.0.0.1',()=>console.log('WordPress package preview: http://localhost:3001'));
