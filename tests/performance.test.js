// Fase 3: recursos locales, imágenes optimizadas, visor 3D sin WebGL y animaciones que se pausan
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, listPages, loadPage, delay } = require('./helpers/env');

const PAGES = listPages();
const read = page => fs.readFileSync(path.join(ROOT, page), 'utf8');
// Todo se sirve desde el propio sitio (fuentes, banderas, Three.js). Lo único externo son las
// noticias, que se piden con fetch y no cuentan como recurso de la página.
const ALLOWED_EXTERNAL = /^$/;

test('ninguna página carga scripts, imágenes ni estilos de CDN externos', () => {
  const bad = [];
  for (const page of PAGES) {
    for (const m of read(page).matchAll(/<(?:script|img|source|link)\b[^>]*\b(?:src|href|srcset)="(https?:\/\/[^"]+)"/g)) {
      if (!ALLOWED_EXTERNAL.test(m[1]) && !/rel="(?:canonical|alternate)"/.test(m[0])) bad.push(`${page}: ${m[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('al cargar, las páginas no piden nada a otros dominios (fuentes, banderas y Three.js son locales)', async () => {
  const bad = [];
  for (const page of PAGES) {
    const { external, close } = await loadPage(page, { lang: 'ru' });
    close();
    external.filter(url => !ALLOWED_EXTERNAL.test(url)).forEach(url => bad.push(`${page}: ${url}`));
  }
  assert.deepEqual(bad, []);
});

test('toda imagen del HTML tiene ancho y alto, y los archivos que cita existen', () => {
  const bad = [];
  for (const page of PAGES) {
    const html = read(page);
    const dir = path.dirname(path.join(ROOT, page));
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      if (!/\bwidth="\d+"/.test(m[0]) || !/\bheight="\d+"/.test(m[0])) bad.push(`${page}: sin width/height → ${m[0].slice(0, 80)}`);
    }
    for (const m of html.matchAll(/\b(?:src|srcset|imagesrcset)="([^"]+)"/g)) {
      if (m[1].startsWith('data:')) continue;
      m[1].split(',').map(part => part.trim().split(/\s+/)[0])
        .filter(url => url && !/^(https?:|data:)/.test(url))
        .forEach(url => { if (!fs.existsSync(path.join(dir, url))) bad.push(`${page}: no existe ${url}`); });
    }
  }
  assert.deepEqual(bad, []);
});

test('no quedan imágenes PNG/JPEG pesadas en assets (se sirven AVIF/WebP con respaldo)', () => {
  const heavy = fs.readdirSync(path.join(ROOT, 'assets'))
    .filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f))
    .map(f => [f, fs.statSync(path.join(ROOT, 'assets', f)).size])
    .filter(([, size]) => size > 160 * 1024)
    .map(([f, size]) => `${f}: ${Math.round(size / 1024)} KB`);
  assert.deepEqual(heavy, []);
});

test('Salón de la Fama: imágenes diferidas, con tamaño y en AVIF/WebP', async () => {
  const { document, close } = await loadPage('pages/history.html', { lang: 'es' });
  const imgs = [...document.querySelectorAll('#hof-grid img')];
  const sources = [...document.querySelectorAll('#hof-grid source')].map(s => s.getAttribute('type'));
  const files = [...document.querySelectorAll('#hof-grid source, #hof-grid img')]
    .flatMap(el => (el.getAttribute('srcset') || el.getAttribute('src')).split(',').map(p => p.trim().split(/\s+/)[0]));
  close();
  assert.ok(imgs.length > 0);
  imgs.forEach(img => {
    assert.equal(img.getAttribute('loading'), 'lazy');
    assert.ok(img.getAttribute('width') && img.getAttribute('height'));
  });
  assert.ok(sources.includes('image/avif') && sources.includes('image/webp'));
  files.forEach(f => assert.ok(fs.existsSync(path.join(ROOT, 'pages', f)), f));
});

test('Aprender sin WebGL: aviso claro y las piezas se pueden leer (en ruso)', async () => {
  const { document, errors, close } = await loadPage('pages/learn.html', { lang: 'ru' });
  const noWebgl = document.getElementById('learn-section').classList.contains('no-webgl');
  const fallback = document.querySelector('.learn-fallback strong').textContent;
  const chips = [...document.querySelectorAll('#part-list [data-part]')];
  chips.find(c => c.dataset.part === 'die').click();
  const title = document.getElementById('part-title').textContent;
  const stats = document.getElementById('part-stats').textContent;
  const pressed = document.querySelector('#part-list [aria-pressed="true"]').dataset.part;
  close();
  assert.deepEqual(errors, []);
  assert.ok(noWebgl);
  assert.equal(fallback, '3D-модель недоступна');
  assert.equal(chips.length, 11);
  assert.equal(title, 'Графический чип (GPU)');
  assert.match(stats, /92,2 млрд/);
  assert.match(stats, /TSMC 4N/);
  assert.equal(pressed, 'die');
});

test('Aprender: los botones de capa indican cuál está activa', async () => {
  const { document, close } = await loadPage('pages/learn.html', { lang: 'es' });
  document.querySelector('[data-layer="pcb-only"]').click();
  const state = [...document.querySelectorAll('.layer-btn')].map(b => `${b.dataset.layer}:${b.getAttribute('aria-pressed')}`);
  close();
  assert.deepEqual(state, ['full:false', 'pcb-cooler:false', 'pcb-only:true']);
});

// Cuenta los fotogramas que pide el fondo de pistas de circuito
function countFrames(window) {
  const original = window.requestAnimationFrame.bind(window);
  window.__frames = 0;
  window.requestAnimationFrame = cb => { window.__frames++; return original(cb); };
}

test('fondo animado: no pide fotogramas con "reducir movimiento"', async () => {
  const { window, close } = await loadPage('index.html', { reducedMotion: true, beforeScripts: countFrames, wait: 50 });
  window.__frames = 0;
  await delay(300);
  const frames = window.__frames;
  close();
  assert.ok(frames <= 1, `${frames} fotogramas`);
});

test('fondo animado: se detiene con la pestaña oculta y vuelve al mostrarla', async () => {
  const { window, document, close } = await loadPage('index.html', { beforeScripts: countFrames, wait: 50 });
  await delay(200);
  const running = window.__frames;
  let hidden = true;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new window.Event('visibilitychange'));
  await delay(50);
  window.__frames = 0;
  await delay(300);
  const whileHidden = window.__frames;
  hidden = false;
  document.dispatchEvent(new window.Event('visibilitychange'));
  await delay(200);
  const resumed = window.__frames;
  close();
  assert.ok(running > 3, `animaba (${running})`);
  assert.ok(whileHidden <= 1, `oculta: ${whileHidden}`);
  assert.ok(resumed > 3, `reanudada: ${resumed}`);
});
