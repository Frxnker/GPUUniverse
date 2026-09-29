// Funciones globales integradas en la Fase 1: favoritos, comparación, enlaces, buscador, herramientas y retos
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPage, delay } = require('./helpers/env');

const plain = v => JSON.parse(JSON.stringify(v));

test('la comparación admite 4 GPUs como máximo e ignora nombres desconocidos', async () => {
  const { window, close } = await loadPage('pages/gaming.html');
  const Store = window.GPUStore;
  ['RTX 5090', 'RTX 4090', 'Arc B580', 'Radeon RX 7900 XTX'].forEach(n => assert.equal(Store.add('compare', n), true));
  assert.equal(Store.add('compare', 'RTX 3060'), false);
  assert.equal(Store.add('favorites', 'GPU inventada'), false);
  assert.equal(Store.count('compare'), 4);
  assert.deepEqual(plain(JSON.parse(window.localStorage.getItem('gpu-universe-compare'))), ['RTX 5090', 'RTX 4090', 'Arc B580', 'Radeon RX 7900 XTX']);
  close();
});

test('los botones de las tarjetas guardan favoritos y no abren el detalle', async () => {
  const { window, document, close } = await loadPage('pages/gaming.html');
  const btn = document.querySelector('.gpu-card .card-action-fav');
  const name = btn.dataset.gpu;
  btn.click();
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  assert.ok(window.GPUStore.has('favorites', name));
  assert.equal(document.getElementById('gpu-modal').classList.contains('active'), false);
  close();
});

test('compare.html?gpus= carga la comparación compartida y la URL la refleja', async () => {
  const { window, document, close } = await loadPage('pages/compare.html', { query: '?gpus=RTX%204090,Arc%20B580,Instinct%20MI300X' });
  assert.deepEqual(plain(window.GPUStore.get('compare')), ['RTX 4090', 'Arc B580', 'Instinct MI300X']);
  assert.equal(document.querySelectorAll('#compare-table thead th').length, 4);
  assert.equal(document.getElementById('compare-results').hidden, false);
  assert.equal(new URL(window.location.href).searchParams.get('gpus'), 'RTX 4090,Arc B580,Instinct MI300X');
  close();
});

test('compare.html con una sola GPU muestra el estado vacío', async () => {
  const { document, close } = await loadPage('pages/compare.html', { query: '?gpus=RTX%204090' });
  assert.equal(document.getElementById('compare-empty').hidden, false);
  assert.equal(document.getElementById('compare-results').hidden, true);
  close();
});

test('?gpu= abre el detalle en cualquier página y añade la GPU a recientes', async () => {
  for (const page of ['index.html', 'pages/history.html', 'pages/tools.html']) {
    const { window, document, close } = await loadPage(page, { query: '?gpu=RTX%203060', wait: 200 });
    assert.equal(document.getElementById('gpu-modal').classList.contains('active'), true, page);
    assert.equal(document.getElementById('modal-title').textContent, 'RTX 3060', page);
    assert.equal(window.GPUStore.get('recent')[0], 'RTX 3060', page);
    assert.equal(new URL(window.location.href).searchParams.has('gpu'), false, page);
    close();
  }
});

test('Ctrl+K abre el buscador y encuentra GPUs, páginas y acciones', async () => {
  const { window, document, close } = await loadPage('pages/history.html');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  await delay(50);
  const palette = document.getElementById('palette');
  assert.ok(palette && !palette.hidden);
  const input = document.getElementById('palette-input');
  input.value = '4070ti';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(document.querySelector('.palette-item .palette-item-title').textContent, 'RTX 4070 Ti');
  input.value = 'herram';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.match(document.querySelector('.palette-item').textContent, /Herramientas/);
  close();
});

test('búsqueda tolerante: sin espacios, sin "Radeon" y por arquitectura', async () => {
  const { window, close } = await loadPage('index.html');
  assert.equal(window.searchGpus('4070ti')[0].name, 'RTX 4070 Ti');
  assert.equal(window.searchGpus('rx7900xtx')[0].name, 'Radeon RX 7900 XTX');
  assert.ok(window.searchGpus('battlemage').every(g => /Battlemage/.test(g.arch)));
  assert.deepEqual(plain(window.searchGpus('')), []);
  close();
});

test('plurales: ruso con tres formas y español con dos', async () => {
  const ru = await loadPage('index.html', { lang: 'ru' });
  assert.deepEqual([1, 3, 5, 11, 21, 24].map(n => ru.window.trPlural('levels.days', n)),
    ['1 день', '3 дня', '5 дней', '11 дней', '21 день', '24 дня']);
  ru.close();
  const es = await loadPage('index.html', { lang: 'es' });
  assert.deepEqual([1, 2].map(n => es.window.trPlural('levels.days', n)), ['1 día', '2 días']);
  es.close();
});

test('herramientas: VRAM para IA local y fuente de alimentación', async () => {
  const { window, document, close } = await loadPage('pages/tools.html', { hash: '#vram' });
  document.querySelector('#vram-mode [data-value="ai"]').click();
  document.querySelector('#vram-model [data-value="70"]').click();
  // 70B en 4 bits: 70 × 0,56 × 1,2 + 1,5 = 48,54 → 48,6 GB
  assert.equal(document.querySelector('.vram-need strong span').textContent, '48,6');
  document.getElementById('tab-psu').click();
  const input = document.getElementById('psu-gpu');
  input.value = 'rtx 4090';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  // (450 W GPU + 125 W CPU) + 60 W resto = 635 W; ×1,4 = 889 → fuente de 1000 W
  assert.match(document.querySelector('#psu-result .tool-stat-main strong').textContent, /1\.000 W|1000 W/);
  assert.ok(window.GPUProgress.getState().tools.includes('psu'));
  close();
});

test('herramientas: el asesor solo propone GPUs que mejoran lo pedido y caben en el presupuesto', async () => {
  const { window, document, close } = await loadPage('pages/tools.html');
  const input = document.getElementById('up-gpu');
  input.value = 'gtx 1060 6';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  const base = window.gpuGamingIndex('GTX 1060 (6GB)');
  const names = [...document.querySelectorAll('#up-result .tool-item-name')].map(b => b.textContent);
  assert.ok(names.length > 0);
  const budget = Number(document.getElementById('up-budget').value);
  names.forEach(n => {
    assert.ok(window.gpuGamingIndex(n) >= base * 1.5, `${n} supera +50 %`);
    assert.ok(window.priceToUsd(window.findGpu(n).price) <= budget, `${n} cabe en ${budget}`);
  });
  close();
});

test('retos: "¿Cuál rinde más?" marca como correcta la GPU con más índice', async () => {
  const { window, document, close } = await loadPage('pages/levels.html');
  document.querySelector('[data-play="hl"]').click();
  for (let round = 0; round < 10; round++) {
    const options = [...document.querySelectorAll('#game-stage [data-answer]')];
    assert.equal(options.length, 2);
    options[0].click();
    const correct = document.querySelector('#game-stage .is-correct');
    const other = options.find(o => o !== correct);
    const perf = el => parseFloat(el.querySelector('.game-reveal strong').textContent.replace(',', '.'));
    assert.ok(perf(correct) > perf(other), `ronda ${round + 1}`);
    document.querySelector('[data-game-next]').click();
  }
  assert.ok(document.querySelector('#game-stage .game-result'));
  assert.equal(window.GPUProgress.getState().games.played, 1);
  close();
});

test('los retos bloqueados no se pueden empezar', async () => {
  const { document, close } = await loadPage('pages/levels.html');
  assert.equal(document.querySelector('[data-play="time"]'), null);
  assert.match(document.querySelector('#games-grid .game-card.is-locked').textContent, /nivel/i);
  close();
});
