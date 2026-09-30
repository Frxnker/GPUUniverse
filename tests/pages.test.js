// Cada página carga sin errores, traducida y con sus scripts en el mismo orden
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, LANGS, listPages, loadPage, scriptsOf, loadData } = require('./helpers/env');

const PAGES = listPages();
const NAMESPACES = ['nav', 'filters', 'quiz', 'hero', 'news', 'categories', 'sections', 'compare', 'compare2', 'footer', 'ui', 'table',
  'hof', 'defs', 'arch_map', 'value', 'catalog', 'gaming_page', 'fx', 'levels', 'tools', 'learn', 'meta', 'a11y', 'history', 'common'];
const RAW_KEY = new RegExp(`\\b(?:${NAMESPACES.join('|')})\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)*\\b`, 'g');
// Textos legítimos con forma de clave (nombres de archivo, dominios)
const ALLOWED = /\.(html|js|css|com|png|webp|svg)$/;

function visibleTextIssues(document) {
  const text = document.body.textContent;
  const attrs = [...document.querySelectorAll('[aria-label], [title], [placeholder], [alt]')]
    .flatMap(el => ['aria-label', 'title', 'placeholder', 'alt'].map(a => el.getAttribute(a) || ''));
  const found = [text, ...attrs, document.title].flatMap(s => s.match(RAW_KEY) || []);
  return [...new Set(found.filter(k => !ALLOWED.test(k)))];
}

// learn.html depende de Three.js desde un CDN: si no carga, la página falla (se arregla en la Fase 3)
const KNOWN = {};

for (const page of PAGES) {
  test(`${page}: carga sin errores de consola`, { todo: KNOWN[page] }, async () => {
    const { errors, close } = await loadPage(page, { lang: 'es' });
    close();
    assert.deepEqual(errors, []);
  });

  test(`${page}: sin claves sin traducir en los 6 idiomas y con <html lang> correcto`, { todo: KNOWN[page] }, async () => {
    for (const lang of LANGS) {
      const { document, errors, close } = await loadPage(page, { lang });
      const leaked = visibleTextIssues(document);
      const htmlLang = document.documentElement.lang;
      close();
      assert.deepEqual({ lang, errors, leaked, htmlLang }, { lang, errors: [], leaked: [], htmlLang: lang });
    }
  });
}

// Texto sin traducir: lo que sale igual en español y en ruso y contiene palabras latinas en minúscula
// (en ruso solo pueden ser restos en español; los nombres de GPU y las siglas empiezan en mayúscula)
const LATIN_WORD = /(?:^|[^\p{L}])[a-záéíóúñü]{4,}(?![\p{L}])/u;
// Términos técnicos que se escriben igual en todos los idiomas
const SAME_EVERYWHERE = /^(?:\d+ )?(?:pts|aprox\.)$/;
// Los nombres comerciales de las GPUs tampoco se traducen ("M5 Ultra GPU (80-core)")
const GPU_NAMES = (() => {
  const d = loadData();
  return new Set([...d.DESKTOP_GPUS, ...d.MOBILE_GPUS, ...d.WORKSTATION_GPUS, ...d.SERVER_GPUS].map(g => g.name));
})();

function visibleTexts(document) {
  const texts = new Set();
  const walker = document.createTreeWalker(document.body, 4);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement.closest('script, style')) continue;
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (text) texts.add(text);
  }
  return texts;
}

function accessibleTexts(document) {
  const texts = new Set();
  document.querySelectorAll('[aria-label], [title], [placeholder], img[alt]').forEach(el => {
    ['aria-label', 'title', 'placeholder', 'alt'].forEach(attr => {
      const value = (el.getAttribute(attr) || '').trim();
      if (value) texts.add(value);
    });
  });
  return texts;
}

async function untranslated(extract) {
  const leaks = [];
  for (const page of PAGES) {
    const es = await loadPage(page, { lang: 'es' });
    const ru = await loadPage(page, { lang: 'ru' });
    const spanish = extract(es.document);
    for (const text of extract(ru.document)) {
      if (spanish.has(text) && LATIN_WORD.test(text) && !SAME_EVERYWHERE.test(text) && !GPU_NAMES.has(text)) leaks.push(`${page}: ${text.slice(0, 80)}`);
    }
    es.close();
    ru.close();
  }
  return leaks;
}

test('en ruso no queda texto visible en español', async () => {
  assert.deepEqual(await untranslated(visibleTexts), []);
});

test('en ruso no quedan etiquetas accesibles en español', async () => {
  assert.deepEqual(await untranslated(accessibleTexts), []);
});

test('las noticias sin red muestran error y botón de reintento, nunca noticias inventadas', async () => {
  const withNews = PAGES.filter(p => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('id="news-container"'));
  assert.ok(withNews.length > 0);
  for (const page of withNews) {
    const { document, close } = await loadPage(page, { lang: 'es', wait: 200 });
    const container = document.getElementById('news-container');
    const cards = container.querySelectorAll('.news-card:not(.news-skeleton)');
    const retry = container.querySelector('button');
    close();
    assert.equal(cards.length, 0, `${page}: no debe haber noticias sin red`);
    assert.ok(retry, `${page}: falta el botón de reintento`);
  }
});

test('las noticias muestran solo lo que devuelve el servicio', async () => {
  const feed = {
    status: 'ok',
    items: [{ title: 'NVIDIA anuncia una GPU', link: 'https://www.techpowerup.com/1', pubDate: '2026-09-28 10:00:00', description: 'Texto', categories: ['GPU'] }]
  };
  const fetchImpl = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(feed) });
  const { document, close } = await loadPage('index.html', { lang: 'es', fetchImpl, wait: 200 });
  const titles = [...document.querySelectorAll('#news-container .news-card h3')].map(h => h.textContent.trim());
  close();
  assert.deepEqual(titles, ['NVIDIA anuncia una GPU']);
});

test('todas las páginas cargan los scripts comunes en el mismo orden', () => {
  const COMMON = ['js/i18n.js', 'js/data.js', 'js/app.js', 'js/progress.js', 'js/features.js'];
  const orders = PAGES.map(page => [page, scriptsOf(page).filter(s => COMMON.includes(s)).join(' → ')]);
  const bad = orders.filter(([, order]) => order !== COMMON.join(' → '));
  assert.deepEqual(bad, []);
});

test('ningún archivo de js/ queda sin usar', () => {
  const used = new Set(PAGES.flatMap(scriptsOf));
  const orphans = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => `js/${f}`).filter(f => !used.has(f));
  assert.deepEqual(orphans, []);
});
