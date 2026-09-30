// Lógica pura: precios, VRAM, filtros y ordenación del catálogo (js/app.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts } = require('./helpers/env');

let win;
test.before(async () => {
  ({ window: win } = await loadScripts(['js/i18n.js', 'js/data.js', 'js/app.js'], { lang: 'es' }));
});
test.after(() => win.close());

const gpu = (name, extra = {}) => ({ brand: 'nvidia', name, arch: 'Test', year: 2023, vram: '8 GB GDDR6', tflops: '10', msrp: 300, perf: 10, ...extra });

test('gpuPrice devuelve el PVP de lanzamiento en dólares o 0 si no hay precio oficial', () => {
  assert.equal(win.gpuPrice({ msrp: 899 }), 899);
  assert.equal(win.gpuPrice({ msrp: null, priceNote: 'laptop' }), 0);
  assert.equal(win.gpuPrice({}), 0);
  assert.equal(win.gpuPrice(undefined), 0);
});

test('parseVram extrae los GB', () => {
  assert.equal(win.parseVram('16 GB GDDR6'), 16);
  assert.equal(win.parseVram('1.5 GB GDDR5'), 1.5);
  assert.equal(win.parseVram('192 GB HBM3'), 192);
  assert.equal(win.parseVram(''), 0);
  assert.equal(win.parseVram(undefined), 0);
});

test('formatPrice muestra dólares con el formato del idioma, sin convertir', () => {
  win.currentLang = 'en';
  assert.equal(win.formatPrice(1999), '$1,999');
  // es-ES no agrupa los números de 4 cifras
  win.currentLang = 'es';
  assert.match(win.formatPrice(1999), /^1\.?999\s?US\$$/);
  win.currentLang = 'ru';
  assert.match(win.formatPrice(1999), /^1\s999\s\$$/);
  win.currentLang = 'es';
  assert.equal(win.formatPrice(0), '—');
  assert.equal(win.formatPrice(null), '—');
});

test('priceInfo explica por qué falta el precio', () => {
  assert.equal(win.priceInfo({ msrp: 499, launch: '2016-05', year: 2016 }).missing, false);
  assert.equal(win.priceInfo({ msrp: null, priceNote: 'laptop' }).value, win.tr('ui.price_laptop'));
  assert.equal(win.priceInfo({ msrp: null, priceNote: 'no-official' }).value, win.tr('ui.price_none'));
  assert.equal(win.priceInfo({ msrp: null }).value, win.tr('ui.price_pending'));
});

test('matchesRange acepta rangos "min-max"', () => {
  assert.equal(win.matchesRange(10, '10-12'), true);
  assert.equal(win.matchesRange(12, '10-12'), true);
  assert.equal(win.matchesRange(13, '10-12'), false);
  assert.equal(win.matchesRange(2025, '2024-9999'), true);
});

function filter(list, filters) {
  Object.assign(win.activeFilters, { brand: 'all', vram: 'all', era: 'all', use: 'all', search: '' }, filters);
  return Array.from(win.applyGpuFilters(list), g => g.name);
}

test('filtro de búsqueda ignora espacios y mayúsculas', () => {
  const list = [gpu('RTX 4070 Ti'), gpu('RTX 4070'), gpu('Radeon RX 7900 XT', { brand: 'amd' })];
  assert.deepEqual(filter(list, { search: '4070ti' }), ['RTX 4070 Ti']);
  assert.deepEqual(filter(list, { search: 'rtx 4070' }), ['RTX 4070 Ti', 'RTX 4070']);
  assert.deepEqual(filter(list, { search: 'amd' }), ['Radeon RX 7900 XT']);
});

test('filtros de marca, VRAM y año', () => {
  const list = [
    gpu('A', { vram: '8 GB GDDR6', year: 2016 }),
    gpu('B', { brand: 'amd', vram: '12 GB GDDR6', year: 2021 }),
    gpu('C', { vram: '24 GB GDDR6X', year: 2025 })
  ];
  assert.deepEqual(filter(list, { brand: 'amd' }), ['B']);
  assert.deepEqual(filter(list, { vram: '8-8' }), ['A']);
  assert.deepEqual(filter(list, { vram: '10-12' }), ['B']);
  assert.deepEqual(filter(list, { vram: '17-9999' }), ['C']);
  assert.deepEqual(filter(list, { vram: '24' }), ['C']);
  assert.deepEqual(filter(list, { era: '2020-2023' }), ['B']);
  assert.deepEqual(filter(list, { era: '0-2015' }), []);
});

test('filtro de uso: ray tracing según marca y arquitectura', () => {
  const list = [
    gpu('GTX 1080 Ti'),
    gpu('RTX 2060'),
    gpu('Radeon RX 5700 XT', { brand: 'amd', arch: 'RDNA 1' }),
    gpu('Radeon RX 6600', { brand: 'amd', arch: 'RDNA 2' }),
    gpu('Arc A750', { brand: 'intel' })
  ];
  assert.deepEqual(filter(list, { use: 'rt' }), ['RTX 2060', 'Radeon RX 6600', 'Arc A750']);
  assert.deepEqual(filter(list, { use: 'ia' }), ['GTX 1080 Ti', 'RTX 2060']);
});

test('ordenación por rendimiento, precio y valor; los que no tienen dato van al final', () => {
  const list = [
    gpu('Lenta', { perf: 10, msrp: 100 }),
    gpu('Rápida', { perf: 50, msrp: 1000 }),
    gpu('Sin datos', { perf: 0, msrp: null }),
    gpu('Media', { perf: 30, msrp: 300 })
  ];
  const names = (sort, dir) => Array.from(win.sortGpus(list, sort, dir), g => g.name);
  assert.deepEqual(names('perf', 'desc'), ['Rápida', 'Media', 'Lenta', 'Sin datos']);
  assert.deepEqual(names('perf', 'asc'), ['Lenta', 'Media', 'Rápida', 'Sin datos']);
  assert.deepEqual(names('price', 'asc'), ['Lenta', 'Media', 'Rápida', 'Sin datos']);
  assert.deepEqual(names('value', 'desc'), ['Lenta', 'Media', 'Rápida', 'Sin datos']);
  // No modifica la lista original
  assert.equal(list[0].name, 'Lenta');
});

test('getAllGpus fusiona el mismo modelo presente en varias listas', () => {
  const all = win.getAllGpus();
  const names = all.map(g => win.gpuKey(g.name));
  assert.equal(new Set(names).size, names.length);
  assert.ok(all.find(g => g.name === 'RTX 5090'));
});
