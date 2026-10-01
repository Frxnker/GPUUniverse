// Noticias propias (Fase B): el generador (scripts/news.js) y la sección de noticias de la web.
// El generador se prueba con feeds de ejemplo guardados en tests/fixtures/news (válidos, rotos, con HTML
// hostil y sin fechas), sin red: la descarga se simula con fetchImpl.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const news = require('../scripts/news');
const { ROOT, ORIGIN, LANGS, listPages, loadPage, loadTranslations, delay } = require('./helpers/env');

const FIXTURES = path.join(__dirname, 'fixtures', 'news');
const fixture = name => fs.readFileSync(path.join(FIXTURES, name), 'utf8');
const NOW = new Date('2026-10-01T12:00:00Z');
const TAGLIKE = /<[a-z!/?]/i;
const quietLog = () => {
  const lines = [];
  return { lines, info: m => lines.push(`info ${m}`), warn: m => lines.push(`warn ${m}`), error: m => lines.push(`error ${m}`) };
};
const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gpu-news-'));

// ---------- Lector de feeds ----------

test('RSS válido: título, enlace, fecha ISO, categorías y extracto corto en texto plano', () => {
  const items = news.parseFeed(fixture('rss-valido.xml'), { source: 'Medio', now: NOW });
  assert.equal(items.length, 4);
  const [first, second, , fourth] = items;
  assert.equal(first.title, 'NVIDIA presenta una GPU de prueba & su disipador');
  assert.equal(first.link, 'https://medio.example/noticias/1-gpu-de-prueba');
  assert.equal(first.date, '2026-09-30T10:00:00.000Z');
  assert.deepEqual(first.categories, ['GPUs', 'Hardware']);
  assert.equal(first.source, 'Medio');
  // Extracto: de description (no del artículo completo), sin la imagen ni su pie, cortado en una palabra
  assert.ok(first.excerpt.startsWith('La tarjeta de prueba llega con 16 GB'), first.excerpt);
  assert.ok(first.excerpt.length <= news.EXCERPT_MAX && first.excerpt.endsWith('…'), first.excerpt);
  assert.ok(!/Crédito|Artículo completo/.test(first.excerpt));
  assert.equal(second.title, 'Oferta de teclados mecánicos', 'CDATA con espacios');
  assert.equal(second.excerpt, 'Un teclado rebajado con interruptores ópticos.', 'HTML escapado → texto');
  assert.equal(fourth.link, 'https://medio.example/noticias/4-guid', 'sin <link>, el guid permanente');
});

test('Atom válido: enlace «alternate», fecha de publicación o de actualización y resumen', () => {
  const items = news.parseFeed(fixture('atom-valido.xml'), { source: 'Blog', now: NOW });
  assert.deepEqual(items.map(i => [i.title, i.link, i.date, i.excerpt, i.categories]), [
    ['GeForce de prueba con DLSS', 'https://blog.example/2026/09/geforce-de-prueba', '2026-09-30T16:00:00.000Z', 'Resumen de la GeForce de prueba.', ['GPU']],
    ['Entrada solo con fecha de actualización', 'https://blog.example/2026/09/otra', '2026-09-29T05:00:00.000Z', 'Contenido de la segunda entrada.', []]
  ]);
});

test('feeds rotos: una página HTML o un XML cortado dan un error claro, no noticias a medias', () => {
  assert.throws(() => news.parseFeed(fixture('roto.html')), /formato no reconocido/);
  assert.throws(() => news.parseFeed(fixture('roto-cortado.xml')), /formato no reconocido/);
  assert.throws(() => news.parseFeed(''), /formato no reconocido/);
});

test('HTML hostil: ni etiquetas ni scripts en el texto, solo enlaces https y textos con tope', () => {
  const items = news.parseFeed(fixture('hostil.xml'), { source: 'Hostil', now: NOW });
  for (const item of items) {
    for (const field of ['title', 'excerpt', 'source', ...item.categories.map((c, i) => i)]) {
      const value = typeof field === 'number' ? item.categories[field] : item[field];
      assert.ok(!TAGLIKE.test(value), `${field}: ${value}`);
      assert.ok(!/__xss|alert\(|javascript:|onerror|onload|display:none/i.test(value), `${field}: ${value}`);
      assert.ok(!/[\u0000-\u001f]/.test(value), `${field} sin caracteres de control`);
    }
    assert.match(item.link, /^https:\/\/hostil\.example\/\d$/);
    assert.ok(item.title.length <= news.TITLE_MAX && item.excerpt.length <= news.EXCERPT_MAX);
  }
  // Fuera: javascript:, http:, data:, usuario y contraseña en el enlace, y sin título
  assert.deepEqual(items.map(i => i.link), ['https://hostil.example/1', 'https://hostil.example/2', 'https://hostil.example/5']);
  assert.equal(items[0].title, 'GPU con etiquetas');
  assert.equal(items[0].excerpt, 'Texto visible');
  assert.equal(items[1].title, 'GPU con HTML escapado dos veces: fin');
});

test('sin fechas: la noticia se queda con fecha null y va detrás de las fechadas', () => {
  const undated = news.parseFeed(fixture('sin-fechas.xml'), { source: 'Sin fechas', now: NOW });
  assert.deepEqual(undated.map(i => i.date), [null, null, null], 'sin fecha, ilegible o en el futuro lejano');
  const dated = news.parseFeed(fixture('atom-valido.xml'), { source: 'Blog', now: NOW });
  const built = news.buildNews([{ source: 'Sin fechas', items: undated }, { source: 'Blog', items: dated }], NOW);
  // Entre las de GPUs, la fechada va primero y las sin fecha detrás, en su orden; la entrada del blog que
  // no habla de GPUs va al final por el criterio de selección
  assert.deepEqual(built.items.map(i => i.title), [
    'GeForce de prueba con DLSS',
    'GPU sin fecha de publicación', 'GPU con una fecha que no es una fecha', 'GPU con una fecha del futuro lejano',
    'Entrada solo con fecha de actualización'
  ]);
  assert.deepEqual(news.validateNews(built), []);
});

// ---------- Selección ----------

test('selección: primero las de GPUs (mismo patrón que antes), sin duplicados y como mucho 6', () => {
  const item = (title, link, date, categories = []) => ({ title, link, source: 'S', date, excerpt: 'x', categories });
  const results = [
    { source: 'A', items: [
      item('Oferta de ratones', 'https://a.example/1', '2026-10-01T11:00:00.000Z'),
      item('NVIDIA GeForce nueva', 'https://a.example/2', '2026-10-01T10:00:00.000Z'),
      item('Teclado nuevo', 'https://a.example/3', '2026-10-01T09:00:00.000Z', ['GPU'])
    ] },
    { source: 'B', items: [
      item('nvidia geforce nueva', 'https://b.example/1', '2026-10-01T10:30:00.000Z'), // mismo título
      item('Radeon barata', 'https://a.example/2', '2026-10-01T08:00:00.000Z'), // mismo enlace
      ...Array.from({ length: 8 }, (_, i) => item(`Monitor ${i}`, `https://b.example/m${i}`, `2026-09-30T0${i}:00:00.000Z`))
    ] },
    { source: 'C', items: [], error: 'HTTP 503' }
  ];
  const built = news.buildNews(results, NOW);
  assert.deepEqual(built.items.map(i => i.title), ['NVIDIA GeForce nueva', 'Teclado nuevo', 'Oferta de ratones', 'Monitor 7', 'Monitor 6', 'Monitor 5']);
  assert.deepEqual(built.failedSources, [{ source: 'C', reason: 'HTTP 503' }]);
  assert.equal(built.generatedAt, NOW.toISOString());
  assert.deepEqual(Object.keys(built.items[0]).sort(), ['date', 'excerpt', 'link', 'source', 'title'], 'sin categorías ni nada más');
  assert.equal(news.buildNews([{ source: 'C', items: [], error: 'HTTP 503' }], NOW), null, 'sin noticias no hay archivo');
});

test('validateNews rechaza archivos con otra forma', () => {
  const ok = { format: 1, generatedAt: NOW.toISOString(), failedSources: [], items: [{ title: 'T', link: 'https://x.example/', source: 'S', date: null, excerpt: '' }] };
  assert.deepEqual(news.validateNews(ok), []);
  const bad = [
    null, [], { ...ok, format: 2 }, { ...ok, generatedAt: 'ayer' }, { ...ok, items: [] },
    { ...ok, items: Array(7).fill(ok.items[0]) },
    { ...ok, items: [{ ...ok.items[0], link: 'http://x.example/' }] },
    { ...ok, items: [{ ...ok.items[0], title: '<b>T</b>' }] },
    { ...ok, items: [{ ...ok.items[0], image: 'https://x.example/a.jpg' }] },
    { ...ok, failedSources: 'ninguna' }
  ];
  bad.forEach(data => assert.notDeepEqual(news.validateNews(data), [], JSON.stringify(data)));
});

// ---------- Ejecución completa (descarga simulada) ----------

function fakeFetch(routes) {
  return async url => {
    const route = routes[url];
    if (route === undefined || route instanceof Error) throw route || new TypeError('fetch failed');
    if (typeof route === 'number') return new Response('error', { status: route });
    return new Response(route, { status: 200 });
  };
}
const FEEDS = [
  { source: 'Medio', url: 'https://medio.example/rss' },
  { source: 'Blog', url: 'https://blog.example/atom.xml' },
  { source: 'Caído', url: 'https://caido.example/rss' },
  { source: 'Roto', url: 'https://roto.example/rss' }
];

test('si un feed falla o cambia de formato, se anota y se sigue con el resto', async () => {
  const dir = tmpDir();
  const out = path.join(dir, 'news.json');
  const log = quietLog();
  const fetchImpl = fakeFetch({ 'https://medio.example/rss': fixture('rss-valido.xml'), 'https://blog.example/atom.xml': fixture('atom-valido.xml'), 'https://caido.example/rss': 503, 'https://roto.example/rss': fixture('roto.html') });
  const result = await news.run({ feeds: FEEDS, fetchImpl, out, previousUrl: null, now: NOW, log });
  const written = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(result.status, 'fresh');
  assert.deepEqual(news.validateNews(written), []);
  assert.deepEqual(written.failedSources, [{ source: 'Caído', reason: 'HTTP 503' }, { source: 'Roto', reason: 'formato no reconocido (no es RSS ni Atom)' }]);
  assert.equal(written.items.length, 6);
  assert.ok(written.items.every(i => ['Medio', 'Blog'].includes(i.source)));
  assert.ok(log.lines.some(l => l.startsWith('warn Caído: HTTP 503')), log.lines.join('\n'));
  assert.ok(log.lines.some(l => l.startsWith('warn Roto: formato no reconocido')), log.lines.join('\n'));
});

test('si fallan todos los feeds se conserva el news.json anterior; sin copia válida, error y nada escrito', async () => {
  const allDown = { 'https://medio.example/rss': 500, 'https://blog.example/atom.xml': new TypeError('fetch failed'), 'https://caido.example/rss': 404, 'https://roto.example/rss': '<rss><channel></channel></rss>' };
  const previous = { format: 1, generatedAt: '2026-09-30T09:00:00.000Z', failedSources: [], items: [{ title: 'Noticia anterior', link: 'https://medio.example/antes', source: 'Medio', date: '2026-09-30T08:00:00.000Z', excerpt: 'Resumen.' }] };
  const PUBLISHED = 'https://sitio.example/news.json';

  // 1) La copia publicada se reutiliza tal cual (con su fecha: la web dirá su antigüedad real)
  let dir = tmpDir();
  let out = path.join(dir, 'news.json');
  let log = quietLog();
  let result = await news.run({ feeds: FEEDS, fetchImpl: fakeFetch({ ...allDown, [PUBLISHED]: JSON.stringify(previous) }), out, previousUrl: PUBLISHED, now: NOW, log });
  assert.equal(result.status, 'kept');
  assert.deepEqual(JSON.parse(fs.readFileSync(out, 'utf8')), previous);
  assert.ok(log.lines.some(l => /warn Han fallado todas las fuentes: se conserva la copia anterior/.test(l)), log.lines.join('\n'));

  // 2) Publicada inválida (vacía) → se queda la local, sin tocarla
  dir = tmpDir();
  out = path.join(dir, 'news.json');
  const local = JSON.stringify(previous);
  fs.writeFileSync(out, local);
  result = await news.run({ feeds: FEEDS, fetchImpl: fakeFetch({ ...allDown, [PUBLISHED]: JSON.stringify({ ...previous, items: [] }) }), out, previousUrl: PUBLISHED, now: NOW, log: quietLog() });
  assert.equal(result.status, 'kept');
  assert.equal(fs.readFileSync(out, 'utf8'), local);

  // 3) Ninguna copia válida → error y no se escribe nada (nunca un news.json vacío)
  dir = tmpDir();
  out = path.join(dir, 'news.json');
  log = quietLog();
  await assert.rejects(news.run({ feeds: FEEDS, fetchImpl: fakeFetch({ ...allDown, [PUBLISHED]: 404 }), out, previousUrl: PUBLISHED, now: NOW, log }));
  assert.equal(fs.existsSync(out), false);
  assert.ok(log.lines.some(l => l.startsWith('error Han fallado todas las fuentes')), log.lines.join('\n'));
});

test('news.json del proyecto (si existe, p. ej. el que acaba de generar la acción) cumple el formato', { skip: !fs.existsSync(path.join(ROOT, 'news.json')) && 'no hay news.json (se genera con npm run news)' }, () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'news.json'), 'utf8'));
  assert.deepEqual(news.validateNews(data), []);
});

// ---------- La web ----------

const PAGES_WITH_NEWS = listPages().filter(p => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('id="news-container"'));
const TR = loadTranslations();
const SAMPLE = {
  format: 1,
  generatedAt: '2026-10-01T09:00:00.000Z',
  failedSources: [],
  items: [
    { title: 'NVIDIA anuncia una GPU', link: 'https://www.techpowerup.com/1', source: 'TechPowerUp', date: '2026-10-01T08:00:00.000Z', excerpt: 'Resumen de la noticia.' },
    { title: 'AMD responde', link: 'https://wccftech.com/2', source: 'Wccftech', date: null, excerpt: '' }
  ]
};
// Respuesta de fetch como la de un navegador; offline = copia del service worker
function newsFetch(data, { offline = false, status = 200, calls = [] } = {}) {
  return url => {
    calls.push(String(url));
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: name => (offline && name.toLowerCase() === 'x-gpu-universe-copy' ? 'offline' : null) },
      json: () => (typeof data === 'string' ? Promise.reject(new SyntaxError('JSON roto')) : Promise.resolve(JSON.parse(JSON.stringify(data))))
    });
  };
}

test('las páginas con noticias leen news.json del propio sitio y muestran solo lo que trae', async () => {
  assert.ok(PAGES_WITH_NEWS.length >= 4);
  for (const page of PAGES_WITH_NEWS) {
    const calls = [];
    const { document, errors, external, close } = await loadPage(page, { lang: 'es', now: '2026-10-01T12:00:00Z', fetchImpl: newsFetch(SAMPLE, { calls }) });
    const titles = [...document.querySelectorAll('#news-container .news-card h3')].map(h => h.textContent.trim());
    const imgs = document.querySelectorAll('#news-container img').length;
    const dates = [...document.querySelectorAll('#news-container time')].map(t => t.getAttribute('datetime'));
    close();
    assert.deepEqual(errors, []);
    assert.deepEqual(calls.map(u => new URL(u, ORIGIN + page).href), [`${ORIGIN}news.json`], page);
    assert.deepEqual(titles, ['NVIDIA anuncia una GPU', 'AMD responde'], page);
    assert.equal(imgs, 0, 'sin imágenes de terceros');
    assert.deepEqual(dates, ['2026-10-01T08:00:00.000Z'], 'la noticia sin fecha no lleva <time>');
    assert.deepEqual(external, []);
  }
});

test('«Actualizado hace…» en los 6 idiomas, y sin conexión avisa de que es la última copia guardada', async () => {
  for (const lang of LANGS) {
    const time = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-3, 'hour');
    let r = await loadPage('index.html', { lang, now: '2026-10-01T12:00:00Z', fetchImpl: newsFetch(SAMPLE) });
    let meta = r.document.getElementById('news-updated');
    const online = { hidden: meta.hidden, text: meta.textContent, offline: meta.classList.contains('is-offline') };
    r.close();
    assert.deepEqual(online, { hidden: false, text: TR[lang].news.updated.replace('{time}', time), offline: false }, lang);

    r = await loadPage('index.html', { lang, now: '2026-10-01T12:00:00Z', fetchImpl: newsFetch(SAMPLE, { offline: true }) });
    meta = r.document.getElementById('news-updated');
    const cards = r.document.querySelectorAll('#news-container .news-card h3').length;
    const copy = { text: meta.textContent, offline: meta.classList.contains('is-offline'), cards };
    r.close();
    assert.deepEqual(copy, { text: TR[lang].news.updated_offline.replace('{time}', time), offline: true, cards: 2 }, lang);
  }
});

test('al cambiar de idioma se vuelven a escribir el «Actualizado hace…» y las fechas', async () => {
  const { document, close } = await loadPage('index.html', { lang: 'es', now: '2026-10-01T12:00:00Z', fetchImpl: newsFetch(SAMPLE) });
  document.querySelector('.lang-option[data-value="de"]').click();
  await delay(20);
  const meta = document.getElementById('news-updated').textContent;
  const date = document.querySelector('#news-container time').textContent;
  close();
  assert.equal(meta, TR.de.news.updated.replace('{time}', 'vor 3 Stunden'));
  assert.equal(date, 'vor 4 Stunden');
});

test('estados: sin noticias, error con reintento que funciona y archivo roto o con tipos erróneos', async () => {
  // Sin noticias: estado vacío con reintento
  let r = await loadPage('index.html', { lang: 'es', fetchImpl: newsFetch({ ...SAMPLE, items: [] }) });
  let state = { title: r.document.querySelector('#news-container .state-msg-title')?.textContent, retry: !!r.document.querySelector('#news-container [data-news-retry]'), meta: r.document.getElementById('news-updated').hidden };
  assert.deepEqual(r.errors, []);
  r.close();
  assert.deepEqual(state, { title: TR.es.news.empty, retry: true, meta: false });

  // Error (HTTP 500) y reintento: la segunda vez llega bien
  let attempt = 0;
  const flaky = url => (attempt++ === 0 ? newsFetch(SAMPLE, { status: 500 })(url) : newsFetch(SAMPLE)(url));
  r = await loadPage('index.html', { lang: 'es', fetchImpl: flaky });
  const container = r.document.getElementById('news-container');
  state = { title: container.querySelector('.state-msg.is-error .state-msg-title')?.textContent, hint: container.querySelector('.state-msg-hint')?.textContent, meta: r.document.getElementById('news-updated').hidden };
  container.querySelector('[data-news-retry]').click();
  await delay(50);
  const titles = [...container.querySelectorAll('.news-card h3')].map(h => h.textContent.trim());
  assert.deepEqual(r.errors, []);
  r.close();
  assert.deepEqual(state, { title: TR.es.catalog.news_error, hint: TR.es.catalog.news_error_hint, meta: true });
  assert.deepEqual(titles, ['NVIDIA anuncia una GPU', 'AMD responde']);

  // Archivos rotos o con otra forma: nunca un error de la página ni noticias inventadas
  const broken = ['{roto', [], { items: 'nada' }, { items: [null, 1, 'x', { title: 5, link: 'https://a.example' }, { title: 'Sin enlace' }], generatedAt: 'ayer' }];
  for (const data of broken) {
    r = await loadPage('index.html', { lang: 'es', fetchImpl: newsFetch(data) });
    const cards = r.document.querySelectorAll('#news-container .news-card:not(.news-skeleton)').length;
    const shown = !!r.document.querySelector('#news-container .state-msg [data-news-retry]');
    const meta = r.document.getElementById('news-updated').hidden;
    assert.deepEqual(r.errors, [], JSON.stringify(data));
    r.close();
    assert.deepEqual({ cards, shown, meta }, { cards: 0, shown: true, meta: true }, JSON.stringify(data));
  }
});
