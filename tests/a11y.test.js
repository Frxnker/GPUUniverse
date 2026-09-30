// Fase 4: estructura accesible, teclado, etiquetas traducidas y estados vacíos/de error coherentes.
// El foco real, el contraste y la trampa de foco con Tab se comprueban además en Chrome, Firefox y WebKit.
const test = require('node:test');
const assert = require('node:assert/strict');
const { listPages, loadPage, delay } = require('./helpers/env');

const PAGES = listPages();
const key = (window, el, k, extra = {}) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));

test('cada página: un <h1>, un <main id="main">, enlace de salto a #main y encabezados sin saltos', async () => {
  const bad = [];
  for (const page of PAGES) {
    const { document, close } = await loadPage(page, { lang: 'es' });
    const h1 = document.querySelectorAll('h1').length;
    const main = document.querySelectorAll('main#main').length === 1 && document.querySelectorAll('main').length === 1;
    const firstFocusable = document.querySelector('a[href], button, input, select, textarea, [tabindex]');
    const skipOk = firstFocusable && firstFocusable.matches('a.skip-link[href="#main"]');
    let prev = 0;
    const skips = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const level = Number(h.tagName[1]);
      if (level > prev + 1) skips.push(`h${prev}→h${level}`);
      prev = level;
    });
    const noAlt = document.querySelectorAll('img:not([alt])').length;
    close();
    if (h1 !== 1) bad.push(`${page}: ${h1} <h1>`);
    if (!main) bad.push(`${page}: falta un único <main id="main">`);
    if (!skipOk) bad.push(`${page}: el primer elemento enfocable no es el enlace de salto`);
    if (skips.length) bad.push(`${page}: saltos de encabezado ${skips.join(', ')}`);
    if (noAlt) bad.push(`${page}: ${noAlt} imágenes sin alt`);
  }
  assert.deepEqual(bad, []);
});

test('selector de idioma: botón de menú con flechas, Esc y elección con Intro', async () => {
  const { window, document, close } = await loadPage('pages/tools.html', { lang: 'es' });
  const btn = document.querySelector('.nav-actions .lang-btn');
  const option = lang => document.querySelector(`.nav-actions .lang-option[data-value="${lang}"]`);
  assert.equal(btn.getAttribute('aria-haspopup'), 'menu');
  assert.equal(document.getElementById(btn.getAttribute('aria-controls')).getAttribute('role'), 'menu');

  btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement, option('es'), 'al abrir, el foco va al idioma actual');
  key(window, document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement, option('en'));
  key(window, document.activeElement, 'End');
  assert.equal(document.activeElement, option('ru'));
  key(window, document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement, option('es'), 'da la vuelta');
  key(window, document.activeElement, 'Escape');
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, btn, 'Esc devuelve el foco al botón');

  key(window, btn, 'ArrowUp');
  assert.equal(document.activeElement, option('ru'), 'flecha arriba abre en la última');
  key(window, document.activeElement, 'i');
  assert.equal(document.activeElement, option('it'), 'la inicial salta a Italiano');
  document.activeElement.click();
  const state = {
    lang: document.documentElement.lang,
    checked: [...document.querySelectorAll('.lang-option[aria-checked="true"]')].map(o => o.dataset.value),
    expanded: btn.getAttribute('aria-expanded'),
    focus: document.activeElement === btn,
    label: document.querySelector('.nav-actions .lang-btn .visually-hidden').textContent
  };
  close();
  assert.deepEqual(state, { lang: 'it', checked: ['it', 'it'], expanded: 'false', focus: true, label: 'Lingua' });
});

test('menú móvil: aria-expanded, Esc lo cierra y el foco vuelve al botón', async () => {
  const { window, document, close } = await loadPage('pages/gaming.html', { lang: 'es' });
  const menuBtn = document.getElementById('mobile-menu-btn');
  const panel = document.getElementById(menuBtn.getAttribute('aria-controls'));
  menuBtn.click();
  await delay(40);
  const open = { expanded: menuBtn.getAttribute('aria-expanded'), active: panel.classList.contains('active'), focus: document.activeElement.id };
  key(window, document.activeElement, 'Escape');
  const closed = { expanded: menuBtn.getAttribute('aria-expanded'), active: panel.classList.contains('active'), focus: document.activeElement === menuBtn };
  close();
  assert.deepEqual(open, { expanded: 'true', active: true, focus: 'close-menu-btn' });
  assert.deepEqual(closed, { expanded: 'false', active: false, focus: true });
});

test('botón de tema: la etiqueta dice qué hará y se traduce', async () => {
  const { window, document, close } = await loadPage('index.html', { lang: 'es', theme: 'dark' });
  const btn = document.querySelector('.theme-toggle.desktop-only');
  const before = btn.getAttribute('aria-label');
  btn.click();
  const after = btn.getAttribute('aria-label');
  window.setLanguage('ru');
  const ru = btn.getAttribute('aria-label');
  close();
  assert.deepEqual([before, after, ru], ['Cambiar a tema claro', 'Cambiar a tema oscuro', 'Включить тёмную тему']);
});

test('un idioma o tema guardado desconocido no rompe la página: se usa español y tema oscuro', async () => {
  const { document, errors, close } = await loadPage('pages/gaming.html', { storage: { gpu_lang: 'xx', 'gpu-universe-theme': '<b>' } });
  const state = { errors, lang: document.documentElement.lang, theme: document.documentElement.getAttribute('data-theme'), nav: document.querySelector('[data-i18n="nav.gaming"]').textContent };
  close();
  assert.deepEqual(state, { errors: [], lang: 'es', theme: 'dark', nav: 'Gaming' });
});

test('estados vacíos: el catálogo sin resultados usa el componente común y su botón restablece', async () => {
  const { document, close } = await loadPage('pages/gaming.html', { lang: 'es', query: '?q=zzzzzz' });
  const empty = document.querySelector('#gaming-grid .state-msg');
  const title = empty && empty.querySelector('.state-msg-title').textContent;
  empty.querySelector('[data-reset-filters]').click();
  const cards = document.querySelectorAll('#gaming-grid .gpu-card').length;
  close();
  assert.equal(title, 'Ninguna GPU coincide con estos filtros');
  assert.ok(cards > 0, 'tras restablecer vuelven las GPUs');
});

test('noticias: sin servicio, error con icono y reintento; sin conexión, lo dice', async () => {
  const failing = () => Promise.reject(new TypeError('Failed to fetch'));
  let r = await loadPage('index.html', { lang: 'es', fetchImpl: failing, wait: 200 });
  const online = { title: r.document.querySelector('#news-container .state-msg.is-error .state-msg-title')?.textContent, retry: !!r.document.querySelector('#news-container [data-news-retry]'), busy: r.document.getElementById('news-container').getAttribute('aria-busy') };
  r.close();
  const offline = win => Object.defineProperty(win.navigator, 'onLine', { configurable: true, get: () => false });
  r = await loadPage('index.html', { lang: 'es', fetchImpl: failing, wait: 200, beforeScripts: offline });
  const offTitle = r.document.querySelector('#news-container .state-msg-title')?.textContent;
  r.close();
  assert.deepEqual(online, { title: 'No se pudieron cargar las noticias en este momento.', retry: true, busy: 'false' });
  assert.equal(offTitle, 'Sin conexión');
});

test('recomendador: una GPU sin precio oficial nunca encaja en un presupuesto', async () => {
  const { window, close } = await loadPage('index.html', { lang: 'es' });
  const bad = [];
  for (const use of ['gaming', 'work']) {
    for (const budget of ['low', 'mid', 'high']) {
      for (const perf of ['1080', '1440', '4k']) {
        window.eval(`quizAnswers = ${JSON.stringify({ use, budget, perf })}`);
        window.calculateRecommendations().forEach(g => {
          if (!(window.gpuPrice(g) > 0)) bad.push(`${use}/${budget}/${perf}: ${g.name}`);
        });
      }
    }
  }
  close();
  assert.deepEqual(bad, []);
});
