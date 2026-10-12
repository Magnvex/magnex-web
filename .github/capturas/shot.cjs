// Capturas de las 5 demos para la galería «Trabajos» (lo lanza .github/workflows/capturas-demos.yml).
// Saca la portada de cada demo en ordenador (1280×800) y en móvil (390×844), sin hacer scroll.
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core'), sharp = require('sharp');

const ROOT = process.cwd(), OUT = path.join(ROOT, 'assets/media/demos');
const SLUGS = ['candela-and-co', 'maracuja', 'almunia', 'los-vencejos', 'cielito'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const VIEWS = [
  { name: '', viewport: { width: 1280, height: 800, deviceScaleFactor: 1 }, size: [1200, 750], quality: 72 },
  { name: '-movil', viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, size: [300, 650], quality: 74 },
];

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    res.end(buf);
  });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await new Promise(r => server.listen(8080, r));
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--hide-scrollbars'],
    headless: true,
  });
  for (const slug of SLUGS) for (const v of VIEWS) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.setViewport(v.viewport);
    if (v.viewport.isMobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
    await page.goto(`http://localhost:8080/demos/${slug}/`, { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => errs.push('goto: ' + e.message));
    await page.addStyleTag({ content: '.mgx-demo,.mgx-toast{display:none!important}' });
    await sleep(8000);
    const shot = await page.screenshot({ type: 'png' });
    const out = path.join(OUT, slug + v.name + '.webp');
    await sharp(shot).resize(v.size[0], v.size[1], { fit: 'cover', position: 'top' }).webp({ quality: v.quality, effort: 6 }).toFile(out);
    console.log(JSON.stringify({ file: path.basename(out), bytes: fs.statSync(out).size, errs: errs.slice(0, 5) }));
    await page.close();
  }
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
