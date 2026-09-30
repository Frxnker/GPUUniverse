// Fase 5: metadatos para buscadores y redes sociales, manifest, service worker, sitemap, robots y 404
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, LANGS, listPages, loadPage, loadTranslations } = require('./helpers/env');
const { SITE, pageId } = require('../scripts/shell');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PAGES = listPages();
const PUBLIC = PAGES.filter(p => p !== '404.html');
const urlOf = page => SITE + (page === 'index.html' ? '' : page);
const attr = (html, re) => (re.exec(html) || [])[1];

test('cada página pública: título y descripción propios, canonical y Open Graph con la URL publicada', () => {
  const titles = new Map();
  const descs = new Map();
  const bad = [];
  for (const page of PUBLIC) {
    const html = read(page);
    const title = attr(html, /<title[^>]*>([^<]+)<\/title>/);
    const desc = attr(html, /<meta name="description" content="([^"]+)"/);
    const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
    const ogUrl = attr(html, /<meta property="og:url" content="([^"]+)"/);
    const ogImage = attr(html, /<meta property="og:image" content="([^"]+)"/);
    if (!title || title.length > 70) bad.push(`${page}: título ausente o de más de 70 caracteres`);
    if (!desc || desc.length < 50 || desc.length > 165) bad.push(`${page}: descripción ausente o fuera de 50-165 caracteres`);
    if (canonical !== urlOf(page)) bad.push(`${page}: canonical ${canonical}`);
    if (ogUrl !== canonical) bad.push(`${page}: og:url distinto del canonical`);
    if (!ogImage || !ogImage.startsWith(SITE) || !fs.existsSync(path.join(ROOT, ogImage.slice(SITE.length)))) bad.push(`${page}: og:image ${ogImage}`);
    for (const prop of ['og:title', 'og:description', 'og:type', 'og:site_name', 'og:locale']) {
      if (!html.includes(`property="${prop}"`)) bad.push(`${page}: falta ${prop}`);
    }
    if (titles.has(title)) bad.push(`${page}: mismo título que ${titles.get(title)}`);
    if (descs.has(desc)) bad.push(`${page}: misma descripción que ${descs.get(desc)}`);
    titles.set(title, page);
    descs.set(desc, page);
  }
  assert.deepEqual(bad, []);
});

test('el título y la descripción cambian con el idioma', async () => {
  const translations = loadTranslations();
  const bad = [];
  for (const page of ['index.html', 'pages/gaming.html', 'pages/compare.html']) {
    const id = pageId(page);
    for (const lang of LANGS) {
      const { document, close } = await loadPage(page, { lang });
      const title = document.title;
      const desc = document.querySelector('meta[name="description"]').getAttribute('content');
      close();
      if (title !== translations[lang].meta[`${id}_title`]) bad.push(`${page} ${lang}: título «${title}»`);
      if (desc !== translations[lang].meta[`${id}_desc`]) bad.push(`${page} ${lang}: descripción`);
    }
  }
  assert.deepEqual(bad, []);
});

test('sitemap.xml lista exactamente las páginas públicas y robots.txt la enlaza', () => {
  const sitemap = read('sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).sort();
  assert.deepEqual(locs, PUBLIC.map(urlOf).sort());
  assert.match(read('robots.txt'), new RegExp(`^Sitemap: ${SITE.replace(/[.]/g, '\\.')}sitemap\\.xml$`, 'm'));
});

test('manifest: se instala como app con iconos que existen (192, 512 y adaptable)', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name && manifest.short_name && manifest.theme_color && manifest.background_color);
  manifest.icons.forEach(icon => assert.ok(fs.existsSync(path.join(ROOT, icon.src)), icon.src));
  const sizes = manifest.icons.map(i => `${i.sizes}${i.purpose === 'maskable' ? ' maskable' : ''}`);
  ['192x192', '512x512', '512x512 maskable'].forEach(s => assert.ok(sizes.includes(s), s));
  for (const page of PAGES) assert.match(read(page), /<link rel="manifest" href="(\.\.\/)?manifest\.webmanifest"/, page);
});

test('service worker: guarda todas las páginas y scripts, y todo lo que guarda existe', () => {
  const src = read('sw.js');
  const precache = Array.from(vm.runInNewContext(/const PRECACHE = (\[[\s\S]*?\]);/.exec(src)[1]));
  const missing = precache.filter(f => f !== './' && !fs.existsSync(path.join(ROOT, f)));
  assert.deepEqual(missing, []);
  const scripts = [...new Set(PAGES.flatMap(p => [...read(p).matchAll(/<script src="(?:\.\.\/)?([^"]+)"/g)].map(m => m[1])))];
  const notCached = [...PAGES, 'css/style.css', 'manifest.webmanifest', ...scripts, 'vendor/three/three-viewer.min.js'].filter(f => !precache.includes(f));
  assert.deepEqual(notCached, []);
  assert.match(src, /const VERSION = '[^']+'/);
  // Solo se registra en http(s) (no al abrir el archivo en local) y desde la raíz del sitio
  assert.match(read('js/app.js'), /serviceWorker\.register\(`\$\{window\.rootPath\(\)\}sw\.js`\)/);
});

test('404: no se indexa, parte de la ruta del sitio y no da XP de «sección nueva»', async () => {
  const html = read('404.html');
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.equal(attr(html, /<base href="([^"]+)"/), new URL(SITE).pathname);
  // Se sirve en cualquier ruta inexistente, como hace GitHub Pages
  const { document, window, errors, close } = await loadPage('404.html', { lang: 'es', query: '' });
  const state = window.GPUProgress.getState();
  const home = document.querySelector('.notfound-actions a').href;
  close();
  assert.deepEqual(errors, []);
  assert.equal(home, 'http://gpu-universe.test/GPUUniverse/index.html');
  assert.deepEqual(Array.from(state.pages), []);
});
