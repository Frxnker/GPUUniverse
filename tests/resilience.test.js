// Un efecto decorativo nunca puede romper la web.
// Caso real (01/10/2026, en producción): con 0 px de ancho (iframe oculto, navegador integrado en una
// app, panel que se abre animado) el fondo de circuitos dibujaba un lienzo de 0 px, el navegador lanzaba
// InvalidStateError en drawImage y app.js se cortaba antes de definir window.tr: features.js fallaba
// en cadena y no había textos dinámicos, catálogo ni funciones hasta recargar.
// jsdom no tiene canvas: tests/helpers/env.js simula el lienzo y su drawImage lanza el mismo error
// que un navegador real cuando el origen mide 0 px.
const test = require('node:test');
const assert = require('node:assert/strict');
const { listPages, loadPage, loadTranslations, loadData, delay } = require('./helpers/env');

const PAGES = listPages();
const DE = loadTranslations().de;

// Lo que otros scripts necesitan de app.js, features.js y progress.js, y una muestra de texto dinámico
function health(window, document) {
  const chip = document.querySelector('.level-chip-label');
  return {
    tr: typeof window.tr,
    escapeHtml: typeof window.escapeHtml,
    formatPrice: typeof window.formatPrice,
    GPUStore: typeof window.GPUStore,
    GPUProgress: typeof window.GPUProgress,
    lang: document.documentElement.lang,
    // El chip de nivel lo pinta features.js con window.tr: si sale en alemán, la cadena entera funciona
    chipTranslated: !!chip && chip.textContent.startsWith(DE.fx.level_short)
  };
}
const HEALTHY = { tr: 'function', escapeHtml: 'function', formatPrice: 'function', GPUStore: 'object', GPUProgress: 'object', lang: 'de', chipTranslated: true };

for (const page of PAGES) {
  test(`${page}: con la ventana a 0 × 0 px carga entera, traducida y sin errores`, async () => {
    const { window, document, errors, close } = await loadPage(page, { lang: 'de', viewport: { width: 0, height: 0 } });
    const result = { ...health(window, document), errors: Array.from(errors) };
    close();
    assert.deepEqual(result, { ...HEALTHY, errors: [] });
  });
}

test('el fondo de circuitos aparece al pasar de 0 px a un tamaño válido y sigue animándose', async () => {
  const { window, document, errors, close } = await loadPage('index.html', { lang: 'es', viewport: { width: 0, height: 0 } });
  const canvas = document.getElementById('particles-canvas');
  const before = canvas.__draws || 0;
  window.__setViewport(1280, 800);
  await delay(350);
  const drawn = canvas.__draws || 0;
  await delay(150);
  const later = canvas.__draws || 0;
  const size = [canvas.width, canvas.height];
  close();
  assert.deepEqual(errors, []);
  assert.equal(before, 0, 'con 0 px no se dibuja nada');
  assert.ok(drawn > 0, 'al agrandar la ventana se dibuja el fondo');
  assert.ok(later > drawn, 'y se anima');
  assert.ok(size[0] > 0 && size[1] > 0);
});

test('el fondo de circuitos conserva las pausas: pestaña oculta y movimiento reducido', async () => {
  // Pestaña oculta: deja de dibujar; visible otra vez: sigue
  let page = await loadPage('index.html', { lang: 'es', viewport: { width: 0, height: 0 } });
  let canvas = page.document.getElementById('particles-canvas');
  page.window.__setViewport(1280, 800);
  await delay(300);
  Object.defineProperty(page.document, 'hidden', { configurable: true, get: () => true });
  page.document.dispatchEvent(new page.window.Event('visibilitychange'));
  await delay(50);
  const hiddenStart = canvas.__draws;
  await delay(150);
  const hiddenEnd = canvas.__draws;
  Object.defineProperty(page.document, 'hidden', { configurable: true, get: () => false });
  page.document.dispatchEvent(new page.window.Event('visibilitychange'));
  await delay(150);
  const visibleAgain = canvas.__draws;
  assert.deepEqual(page.errors, []);
  page.close();
  assert.equal(hiddenEnd, hiddenStart, 'oculta: sin fotogramas');
  assert.ok(visibleAgain > hiddenEnd, 'visible: vuelve a animarse');

  // Movimiento reducido: al agrandar se dibuja un único fotograma fijo
  page = await loadPage('index.html', { lang: 'es', reducedMotion: true, viewport: { width: 0, height: 0 } });
  canvas = page.document.getElementById('particles-canvas');
  page.window.__setViewport(1280, 800);
  await delay(350);
  const still = canvas.__draws || 0;
  await delay(200);
  const stillLater = canvas.__draws || 0;
  assert.deepEqual(page.errors, []);
  page.close();
  assert.ok(still > 0, 'hay un fotograma fijo');
  assert.equal(stillLater, still, 'y no se anima');
});

test('si un efecto decorativo falla, se desactiva solo ese efecto y el error queda en la consola', async () => {
  // El lienzo del fondo falla siempre al dibujar (no por tamaño: cualquier error inesperado)
  const beforeScripts = window => {
    const original = window.HTMLCanvasElement.prototype.getContext;
    window.HTMLCanvasElement.prototype.getContext = function (type) {
      const ctx = original.call(this, type);
      if (this.id !== 'particles-canvas' || !ctx) return ctx;
      return new Proxy(ctx, { get: (obj, prop) => (prop === 'drawImage' ? () => { throw new Error('fallo simulado del lienzo'); } : obj[prop]) });
    };
  };
  for (const page of ['index.html', 'pages/gaming.html']) {
    const { window, document, errors, close } = await loadPage(page, { lang: 'de', beforeScripts });
    const result = health(window, document);
    const cards = document.querySelectorAll('.gpu-card').length;
    const logged = Array.from(errors);
    close();
    assert.deepEqual(result, HEALTHY, page);
    assert.equal(logged.length, 1, `${page}: un único error registrado\n${logged.join('\n')}`);
    assert.match(logged[0], /fallo simulado del lienzo/);
    if (page === 'pages/gaming.html') assert.ok(cards > 0, 'el catálogo se pinta');
  }
});

test('portada: la cifra «Revisión de datos» se muestra fija, sin animarse desde 0', async () => {
  const year = String(loadData().DATA_META.reviewed).slice(0, 4);
  const { window, document, errors, close } = await loadPage('index.html', { lang: 'es' });
  const reviewed = document.querySelector('[data-stat="reviewed"]');
  const models = document.querySelector('[data-stat="models"]');
  const samples = [reviewed.textContent];
  // La franja de cifras entra en pantalla: las demás cifras se animan
  const stats = document.querySelector('.hero-stats');
  window.__observers.filter(o => o.targets.has(stats)).forEach(o => o.cb([{ isIntersecting: true, target: stats }], o));
  for (let i = 0; i < 6; i++) {
    await delay(40);
    samples.push(reviewed.textContent);
  }
  const modelsMidway = models.textContent;
  close();
  assert.deepEqual(errors, []);
  assert.deepEqual([...new Set(samples)], [year]);
  assert.notEqual(modelsMidway, '0', 'las demás cifras sí se animan');

  // Con «reducir movimiento» todas las cifras salen ya con su valor final, sin esperar a la animación
  const still = await loadPage('index.html', { lang: 'es', reducedMotion: true });
  const values = [...still.document.querySelectorAll('.hero-stats [data-stat]')].map(el => [el.dataset.stat, el.textContent]);
  const targets = [...still.document.querySelectorAll('.hero-stats [data-stat]')].map(el => [el.dataset.stat, el.dataset.stat === 'reviewed' ? year : el.dataset.target]);
  assert.deepEqual(still.errors, []);
  still.close();
  assert.deepEqual(values, targets);
  assert.ok(values.every(([, v]) => Number(v) > 0), JSON.stringify(values));
});
