// Coherencia de la base de datos de GPUs (js/data.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadData, LANGS } = require('./helpers/env');

const data = loadData();
const LISTS = ['GAMING_GPUS', 'ALL_DOMESTIC_GPUS', 'MOBILE_GPUS', 'WORKSTATION_GPUS', 'SERVER_GPUS'];
const BRANDS = ['nvidia', 'amd', 'intel', 'apple'];
const TIERS = ['entry', 'mid', 'high', 'ultra'];

const REQUIRED = {
  common: ['brand', 'name', 'arch', 'vram', 'tflops', 'bandwidth', 'tdp', 'price'],
  GAMING_GPUS: ['year', 'tier'],
  ALL_DOMESTIC_GPUS: ['year', 'tier'],
  MOBILE_GPUS: ['year', 'tier'],
  WORKSTATION_GPUS: ['tier'],
  SERVER_GPUS: ['interconnect', 'use', 'desc', 'cssClass']
};

// Formatos aceptados
const VRAM_RE = /^\d+(\.\d+)? GB (GDDR\dX?|HBM\d?e?|UMA)$/;
const TDP_RE = /^~?\d+(-\d+)?W\+?$/;
const BW_RE = /^\d+(\.\d+)? GB\/s$/;
const PRICE_RE = /^(~?\$\d{1,3}(,\d{3})*\+?|~?\$\d+\+?|\d+€|Legacy)$/;

const each = fn => LISTS.flatMap(list => data[list].map((gpu, i) => fn(list, gpu, i))).filter(Boolean);

test('todas las listas existen y no están vacías', () => {
  for (const list of LISTS) assert.ok(Array.isArray(data[list]) && data[list].length > 0, list);
});

test('sin nombres duplicados dentro de cada lista', () => {
  for (const list of LISTS) {
    const seen = new Map();
    const dups = [];
    data[list].forEach(g => {
      const key = data.gpuKey(g.name);
      if (seen.has(key)) dups.push(`${g.name} = ${seen.get(key)}`);
      seen.set(key, g.name);
    });
    assert.deepEqual({ list, dups }, { list, dups: [] });
  }
});

test('campos obligatorios presentes', () => {
  const missing = each((list, gpu, i) => {
    const fields = [...REQUIRED.common, ...(REQUIRED[list] || [])];
    const absent = fields.filter(f => gpu[f] === undefined || gpu[f] === null || gpu[f] === '');
    return absent.length ? `${list}[${i}] ${gpu.name || '?'}: ${absent.join(', ')}` : null;
  });
  assert.deepEqual(missing, []);
});

test('marca, gama y año válidos', () => {
  const bad = each((list, gpu) => {
    if (!BRANDS.includes(gpu.brand)) return `${gpu.name}: marca ${gpu.brand}`;
    if (gpu.tier !== undefined && !TIERS.includes(gpu.tier)) return `${gpu.name}: gama ${gpu.tier}`;
    if (gpu.year !== undefined && !(Number.isInteger(gpu.year) && gpu.year >= 1995 && gpu.year <= 2030)) return `${gpu.name}: año ${gpu.year}`;
    return null;
  });
  assert.deepEqual(bad, []);
});

test('TFLOPS numérico y positivo', () => {
  const bad = each((list, gpu) => (parseFloat(gpu.tflops) > 0 ? null : `${list}: ${gpu.name} → ${gpu.tflops}`));
  assert.deepEqual(bad, []);
});

test('formato de VRAM ("16 GB GDDR6")', { todo: 'Fase 2: unificar la VRAM de las GPUs de Apple' }, () => {
  const bad = each((list, gpu) => (VRAM_RE.test(gpu.vram) ? null : `${list}: ${gpu.name} → "${gpu.vram}"`));
  assert.deepEqual(bad, []);
});

test('formato de TDP ("250W", "35-115W")', () => {
  const bad = each((list, gpu) => (TDP_RE.test(gpu.tdp) ? null : `${list}: ${gpu.name} → "${gpu.tdp}"`));
  assert.deepEqual(bad, []);
});

test('formato de ancho de banda ("448 GB/s")', () => {
  const bad = each((list, gpu) => (BW_RE.test(gpu.bandwidth) ? null : `${list}: ${gpu.name} → "${gpu.bandwidth}"`));
  assert.deepEqual(bad, []);
});

test('formato de precio', { todo: 'Fase 2: formato único de precio' }, () => {
  const bad = each((list, gpu) => (PRICE_RE.test(gpu.price) ? null : `${list}: ${gpu.name} → "${gpu.price}"`));
  assert.deepEqual(bad, []);
});

test('las descripciones multilingües tienen los 6 idiomas', () => {
  const bad = [];
  [...data.SERVER_GPUS, ...data.TIMELINE_DATA].forEach(item => {
    if (typeof item.desc !== 'object') return;
    LANGS.forEach(lang => { if (!item.desc[lang] || !item.desc[lang].trim()) bad.push(`${item.name || item.title}: ${lang}`); });
  });
  assert.deepEqual(bad, []);
});

test('el índice gaming solo referencia GPUs que existen', () => {
  const keys = new Set([...data.GAMING_GPUS, ...data.ALL_DOMESTIC_GPUS].map(g => data.gpuKey(g.name)));
  const orphans = Object.keys(data.GAMING_PERF_INDEX).filter(k => !keys.has(k));
  assert.deepEqual(orphans, []);
});

test('toda GPU de escritorio tiene índice gaming', () => {
  const laptop = new Set(data.MOBILE_GPUS.map(g => data.gpuKey(g.name)));
  const missing = [...data.GAMING_GPUS, ...data.ALL_DOMESTIC_GPUS]
    .filter(g => !laptop.has(data.gpuKey(g.name)) && !/laptop|mobile/i.test(g.name))
    .filter(g => !(data.gpuKey(g.name) in data.GAMING_PERF_INDEX))
    .map(g => g.name);
  assert.deepEqual([...new Set(missing)], []);
});

test('el mapa de arquitecturas solo enlaza con nodos existentes', () => {
  const ids = new Set(data.ARCHITECTURES_DATA.map(a => a.id));
  const broken = Array.from(data.ARCHITECTURES_DATA.filter(a => a.parent && !ids.has(a.parent)), a => a.id);
  assert.deepEqual(broken, []);
});

test('una misma GPU no tiene datos contradictorios entre listas', { todo: 'Fase 2: revisar duplicados entre listas' }, () => {
  const byKey = new Map();
  const conflicts = [];
  const FIELDS = ['vram', 'tflops', 'bandwidth', 'tdp', 'price', 'year', 'brand'];
  LISTS.forEach(list => data[list].forEach(gpu => {
    const key = data.gpuKey(gpu.name);
    const prev = byKey.get(key);
    if (prev) {
      FIELDS.forEach(f => {
        if (prev.gpu[f] !== undefined && gpu[f] !== undefined && String(prev.gpu[f]) !== String(gpu[f]) &&
            parseFloat(prev.gpu[f]) !== parseFloat(gpu[f])) {
          conflicts.push(`${gpu.name}.${f}: ${prev.list}="${prev.gpu[f]}" vs ${list}="${gpu[f]}"`);
        }
      });
    } else byKey.set(key, { list, gpu });
  }));
  assert.deepEqual(conflicts, []);
});
