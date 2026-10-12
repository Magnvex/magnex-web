// Capturas de las 5 demos para la galería «Trabajos» (lo lanza .github/workflows/capturas-demos.yml).
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core'), sharp = require('sharp');

const ROOT = process.cwd(), OUT = path.join(ROOT, 'assets/media/demos');
const SLUGS = (process.argv[2] || 'candela-and-co,maracuja,almunia,los-vencejos,cielito').split(',');
const W = 1280, H = 800, TILES = 3;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

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
    args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
    headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  for (const slug of SLUGS) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(`http://localhost:8080/demos/${slug}/`, { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => errs.push('goto: ' + e.message));
    await page.addStyleTag({ content: '.mgx-demo,.mgx-toast{display:none!important}html{scroll-behavior:auto!important}' });
    await sleep(5000);
    // Recorre la página para disparar las animaciones de entrada y que carguen las fotos diferidas.
    for (let y = 0; y <= H * (TILES + 1); y += 300) { await page.evaluate(v => window.scrollTo(0, v), y); await sleep(160); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(2200);
    const tiles = [];
    for (let i = 0; i < TILES; i++) {
      await page.evaluate(v => window.scrollTo(0, v), i * H);
      await sleep(1800);
      if (i === 1) {
        // Quita barras fijas (menú, botón flotante) para que no se repitan en cada trozo.
        await page.evaluate(() => {
          for (const el of document.querySelectorAll('body *')) {
            const cs = getComputedStyle(el);
            if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height < 220) el.style.setProperty('visibility', 'hidden', 'important');
          }
        });
        await sleep(200);
      }
      tiles.push(await page.screenshot({ type: 'png' }));
    }
    const sy = await page.evaluate(() => [window.scrollY, document.documentElement.scrollHeight]);
    const tall = await sharp({ create: { width: W, height: H * TILES, channels: 3, background: '#000' } })
      .composite(tiles.map((t, i) => ({ input: t, top: i * H, left: 0 }))).png().toBuffer();
    const out = path.join(OUT, slug + '.webp');
    await sharp(tall).resize(880, Math.round(880 * H * TILES / W)).webp({ quality: 66, effort: 6 }).toFile(out);
    console.log(JSON.stringify({ slug, bytes: fs.statSync(out).size, scroll: sy, errs: errs.slice(0, 5) }));
    await page.close();
  }
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
