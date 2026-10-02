// Menú móvil y capas: el panel se desplaza por sí mismo y la página de fondo no se mueve.
// El gesto real con el dedo (375×600 y 740×360) se comprueba además en Chrome con un móvil emulado.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const csstree = require('css-tree');
const { ROOT, loadPage, delay } = require('./helpers/env');

const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

// Reglas de la hoja en orden: cada selector por separado, el @media que la contiene y sus declaraciones
const rules = [];
csstree.walk(csstree.parse(css, { parseValue: false, parseCustomProperty: false }), {
  visit: 'Rule',
  enter(node) {
    rules.push({
      selectors: node.prelude.children.toArray().map(s => csstree.generate(s)),
      media: this.atrule ? csstree.generate(this.atrule.prelude) : '',
      decls: node.block.children.toArray().map(d => [d.property, csstree.generate(d.value).trim()])
    });
  }
});
// Valor que gana (el último en el código) entre las reglas que cumplen el filtro
const lastValue = (filter, prop) => rules.filter(filter).flatMap(r => r.decls).filter(([p]) => p === prop).map(([, v]) => v).pop();

test('menú móvil: el panel se desplaza por sí mismo, el gesto no pasa a la página y mide la altura visible', () => {
  const mobile = selector => r => r.media.includes('max-width:1180px') && r.selectors.includes(selector);
  assert.deepEqual({
    overflowY: lastValue(mobile('.nav-links'), 'overflow-y'),
    overscroll: lastValue(mobile('.nav-links'), 'overscroll-behavior'),
    height: lastValue(mobile('.nav-menu-wrapper'), 'height')
  }, { overflowY: 'auto', overscroll: 'contain', height: '100dvh' });
});

test('el bloqueo del fondo (menú, detalle de GPU y capas) va en <html>, que es quien desplaza la página', () => {
  // Con overflow-x: clip en html, el overflow de body no pasa a la ventana: bloquear body no hace nada
  assert.equal(lastValue(r => r.selectors.includes('html'), 'overflow-x'), 'clip');
  const lock = cls => lastValue(r => r.selectors.some(s => s.startsWith('html') && s.includes(`body.${cls}`)), 'overflow');
  assert.deepEqual(
    { menu: lock('menu-open'), modal: lock('modal-open'), layer: lock('layer-open') },
    { menu: 'hidden', modal: 'hidden', layer: 'hidden' }
  );
  // Al ocultar la barra se guarda su hueco (en escritorio el contenido no se mueve)
  assert.equal(lastValue(r => r.selectors.includes('html.keep-scrollbar-gap'), 'scrollbar-gutter'), 'stable');
});

test('el hueco de la barra solo se guarda mientras el fondo está bloqueado y si la página se desplazaba', async () => {
  const { window, document, close } = await loadPage('pages/gaming.html', { lang: 'es' });
  const root = document.documentElement;
  // jsdom no mide nada: alto del contenido y de la ventana a mano
  let contentHeight = 3000;
  Object.defineProperty(root, 'scrollHeight', { configurable: true, get: () => contentHeight });
  Object.defineProperty(root, 'clientHeight', { configurable: true, get: () => 900 });
  const gap = async () => { await delay(0); return root.classList.contains('keep-scrollbar-gap'); };
  const states = {};
  states.idle = await gap();
  document.querySelector('[data-open-gpu]').click();
  states.modal = await gap();
  window.closeGpuModal();
  states.closed = await gap();
  document.getElementById('mobile-menu-btn').click();
  states.menu = await gap();
  document.getElementById('close-menu-btn').click();
  // Página sin barra (como learn.html): no se añade un hueco que antes no estaba
  contentHeight = 900;
  window.openPalette();
  states.paletteNoScroll = await gap();
  close();
  assert.deepEqual(states, { idle: false, modal: true, closed: false, menu: true, paletteNoScroll: false });
});

test('menú móvil: al reabrirlo empieza arriba', async () => {
  const { document, close } = await loadPage('pages/gaming.html', { lang: 'es' });
  const menuBtn = document.getElementById('mobile-menu-btn');
  const panel = document.getElementById(menuBtn.getAttribute('aria-controls'));
  // jsdom no desplaza nada: la posición del panel se guarda a mano
  let top = 0;
  Object.defineProperty(panel, 'scrollTop', { configurable: true, get: () => top, set: v => { top = v; } });
  menuBtn.click();
  await delay(40);
  top = 300;
  menuBtn.click();
  menuBtn.click();
  const reopened = { active: panel.classList.contains('active'), top };
  close();
  assert.deepEqual(reopened, { active: true, top: 0 });
});
