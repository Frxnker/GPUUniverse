// Fase de seguridad: nada que venga de la URL, de localStorage o del RSS se ejecuta como HTML,
// la política de seguridad de contenido (CSP) está en todas las páginas y el estado guardado
// corrupto o de otra versión no rompe la web.
// Ojo: en GitHub Pages todos los proyectos de frxnker.github.io comparten origen y, por tanto,
// localStorage; cualquier otra web de ese dominio podría escribir en él.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ROOT, listPages, loadPage, delay } = require('./helpers/env');

const PAGES = listPages();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const XSS = '<img src=x onerror="window.__xss=1"><svg onload="window.__xss=1"></svg>';

// Algo inyectado deja atributos de evento o scripts en línea que la página no tiene
function injected(document, window) {
  const handlers = [...document.querySelectorAll('*')].filter(el => [...el.attributes].some(a => /^on/i.test(a.name))).map(el => el.outerHTML.slice(0, 80));
  const inlineScripts = document.querySelectorAll('script:not([src])').length;
  const jsLinks = [...document.querySelectorAll('[href^="javascript:" i], [src^="javascript:" i]')].map(el => el.outerHTML.slice(0, 80));
  return { handlers, inlineScripts, jsLinks, xss: window.__xss };
}
const CLEAN = { handlers: [], inlineScripts: 1, jsLinks: [], xss: undefined };

test('parámetros de la URL hostiles (?gpu, ?gpus, ?q, ?play, #) no inyectan nada', async () => {
  const q = encodeURIComponent(XSS);
  const cases = [
    ['pages/gaming.html', `?gpu=${q}&q=${q}&brand=${q}&tab=${q}`, ''],
    ['pages/compare.html', `?gpus=${q},RTX%205090,${q}&a=${q}`, ''],
    ['pages/levels.html', `?play=${q}`, ''],
    ['pages/tools.html', '', `#${q}`],
    ['index.html', `?gpu=${q}`, `#${q}`]
  ];
  for (const [page, query, hash] of cases) {
    const { document, window, errors, close } = await loadPage(page, { lang: 'es', query, hash, wait: 150 });
    const found = injected(document, window);
    close();
    assert.deepEqual({ page, errors, ...found }, { page, errors: [], ...CLEAN });
  }
});

test('localStorage hostil (listas, mi GPU, progreso, idioma, tema y color) no inyecta nada', async () => {
  const storage = {
    'gpu-universe-favorites': JSON.stringify([XSS, 'RTX 5090']),
    'gpu-universe-compare': JSON.stringify([XSS, 'RTX 4090', 'RTX 5090']),
    'gpu-universe-recent': JSON.stringify([XSS]),
    'gpu-universe-mygpu': XSS,
    'gpu-universe-progress': JSON.stringify({ v: 1, xp: XSS, viewed: XSS, pages: [XSS], compares: [XSS], games: { played: XSS, best: { [XSS]: XSS } }, streak: { count: XSS, best: XSS, last: XSS }, once: XSS, achievements: [XSS] }),
    gpu_lang: XSS,
    'gpu-universe-theme': XSS,
    'gpu-universe-accent': XSS
  };
  for (const page of ['pages/levels.html', 'pages/tools.html', 'pages/gaming.html', 'pages/compare.html']) {
    const { document, window, errors, close } = await loadPage(page, { storage, wait: 150 });
    document.getElementById('level-chip').click(); // abre «Tu espacio» con las listas
    await delay(50);
    const found = injected(document, window);
    const attrs = { theme: document.documentElement.getAttribute('data-theme'), accent: document.documentElement.getAttribute('data-accent'), lang: document.documentElement.lang };
    close();
    assert.deepEqual({ page, errors, ...found, ...attrs }, { page, errors: [], ...CLEAN, theme: 'dark', accent: null, lang: 'es' });
  }
});

test('RSS hostil: el texto se muestra como texto y los enlaces javascript: se descartan', async () => {
  const feed = {
    status: 'ok',
    items: [
      { title: `GPU ${XSS}`, link: 'https://www.techpowerup.com/1', pubDate: '2026-09-28 10:00:00', description: `<script>window.__xss=1</script>${XSS} texto`, thumbnail: 'javascript:window.__xss=1', categories: ['GPU'] },
      { title: 'NVIDIA con enlace malo', link: 'javascript:window.__xss=1', pubDate: '2026-09-28 11:00:00', description: 'x', categories: ['GPU'] },
      { title: 'AMD con imagen mala', link: 'https://www.tomshardware.com/2', pubDate: '2026-09-28 12:00:00', description: 'x', enclosure: { link: 'data:text/html,<script>1</script>' }, categories: ['GPU'] }
    ]
  };
  const fetchImpl = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(feed) });
  const { document, window, close } = await loadPage('index.html', { lang: 'es', fetchImpl, wait: 200 });
  const found = injected(document, window);
  const titles = [...document.querySelectorAll('#news-container .news-card h3')].map(h => h.textContent.trim());
  const links = [...document.querySelectorAll('#news-container a')].map(a => a.getAttribute('href'));
  const imgs = [...document.querySelectorAll('#news-container img')].map(i => i.getAttribute('src'));
  close();
  assert.deepEqual(found, CLEAN);
  // htmlToText se queda solo con el texto: la etiqueta del título hostil desaparece
  assert.ok(titles.includes('GPU'), titles.join(' | '));
  assert.ok(!titles.includes('NVIDIA con enlace malo'), 'la noticia con enlace javascript: se descarta');
  assert.ok(links.every(h => /^https:\/\//.test(h)), links.join(', '));
  assert.deepEqual(imgs, []);
});

test('caché de noticias manipulada en sessionStorage: se vuelve a validar al pintar', async () => {
  const items = [{ title: 'Noticia', link: 'javascript:window.__xss=1', image: 'javascript:1', date: '2026-09-28 10:00:00', source: XSS, summary: XSS },
    { title: 'Buena', link: 'https://www.pcgamer.com/1', image: 'javascript:1', date: '2026-09-28 10:00:00', source: XSS, summary: XSS }];
  const beforeScripts = window => window.sessionStorage.setItem('gpu-universe-news', JSON.stringify({ time: Date.now(), items }));
  const { document, window, close } = await loadPage('index.html', { lang: 'es', beforeScripts, wait: 200 });
  const found = injected(document, window);
  const titles = [...document.querySelectorAll('#news-container .news-card h3')].map(h => h.textContent.trim());
  close();
  assert.deepEqual(found, CLEAN);
  assert.deepEqual(titles, ['Buena']);
});

test('estado de progreso: versión, migración y saneado de lo guardado', async () => {
  const load = async saved => {
    const { window, errors, close } = await loadPage('pages/levels.html', { storage: { 'gpu-universe-progress': typeof saved === 'string' ? saved : JSON.stringify(saved) } });
    // Copia en el ámbito de la prueba (los objetos de la página son de otro «realm»)
    const state = JSON.parse(JSON.stringify(window.GPUProgress.getState()));
    close();
    return { errors: Array.from(errors), state };
  };
  // JSON roto
  let r = await load('{roto');
  assert.deepEqual(r.errors, []);
  assert.equal(r.state.v, 1);
  // Formato sin versión (anterior a la v1): se rescata lo que encaja
  r = await load({ xp: 260, viewed: ['RTX 5090', 42, 'RTX 4090'], achievements: ['first_view'], streak: { count: 2, best: 3, last: '2026-09-28' } });
  assert.equal(r.state.v, 1);
  assert.equal(r.state.xp >= 260, true);
  assert.deepEqual(r.state.viewed.slice(0, 2), ['RTX 5090', 'RTX 4090']);
  assert.equal(r.state.streak.best >= 3, true);
  // Tipos equivocados: se descartan sin romper nada
  r = await load({ v: 1, xp: '100', viewed: 'x', pages: null, games: { played: -5, best: { hl: 'mucho', daily: 7 } }, once: [1, 2], streak: 'hoy' });
  assert.deepEqual(r.errors, []);
  assert.equal(typeof r.state.xp, 'number');
  assert.ok(Array.isArray(r.state.viewed) && Array.isArray(r.state.pages));
  assert.equal(r.state.games.best.daily, 7);
  assert.equal('hl' in r.state.games.best, false);
  assert.equal(typeof r.state.once, 'object');
  // Una versión futura no borra el progreso: se queda lo que se entiende
  r = await load({ v: 99, xp: 1000, nuevoCampo: true });
  assert.equal(r.state.v, 1);
  assert.equal(r.state.xp >= 1000, true);
  // Listas enormes: se recortan a su tope
  r = await load({ v: 1, viewed: Array.from({ length: 5000 }, (_, i) => `GPU ${i}`) });
  assert.ok(r.state.viewed.length <= 2000);
});

test('CSP en todas las páginas: sin scripts en línea salvo el de pre-pintado (con su hash)', () => {
  const bad = [];
  for (const page of PAGES) {
    const html = read(page);
    const head = html.slice(0, html.indexOf('</head>'));
    const csp = (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(head) || [])[1];
    if (!csp) { bad.push(`${page}: sin CSP`); continue; }
    const directives = Object.fromEntries(csp.split(';').map(d => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
    if (!directives['script-src'] || directives['script-src'].some(v => /unsafe-(inline|eval)/.test(v))) bad.push(`${page}: script-src inseguro`);
    if (!(directives['object-src'] || []).includes("'none'")) bad.push(`${page}: falta object-src 'none'`);
    if (!(directives['base-uri'] || []).includes("'self'")) bad.push(`${page}: falta base-uri 'self'`);
    // La CSP va antes que cualquier script o recurso
    if (head.indexOf('Content-Security-Policy') > head.search(/<script|<link rel="(?:stylesheet|preload)"/)) bad.push(`${page}: la CSP llega tarde`);
    // Cada script en línea tiene su hash en la política
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const hash = `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`;
      if (!directives['script-src'].includes(hash)) bad.push(`${page}: script en línea sin su hash`);
    }
  }
  assert.deepEqual(bad, []);
});

test('sin manejadores de eventos en línea ni URLs javascript: en HTML y plantillas JS', () => {
  const files = [...PAGES, ...fs.readdirSync(path.join(ROOT, 'partials')).map(f => `partials/${f}`), ...fs.readdirSync(path.join(ROOT, 'js')).map(f => `js/${f}`)];
  const bad = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/<[a-z][^>]*\son[a-z]+\s*=/gi)) bad.push(`${f}: ${m[0].slice(0, 60)}`);
    for (const m of src.matchAll(/(?:href|src)\s*=\s*["'`]\s*javascript:/gi)) bad.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test('todo enlace que abre otra pestaña lleva rel="noopener"', () => {
  const files = [...PAGES, ...fs.readdirSync(path.join(ROOT, 'partials')).map(f => `partials/${f}`), ...fs.readdirSync(path.join(ROOT, 'js')).map(f => `js/${f}`)];
  const bad = [];
  for (const f of files) {
    for (const m of read(f).matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      if (!/rel="[^"]*noopener/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 80)}`);
    }
  }
  assert.deepEqual(bad, []);
});
