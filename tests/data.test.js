// Coherencia de la base de datos de GPUs (js/data.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadData, LANGS } = require('./helpers/env');

const data = loadData();
const LISTS = ['DESKTOP_GPUS', 'MOBILE_GPUS', 'WORKSTATION_GPUS', 'SERVER_GPUS'];
const BRANDS = ['nvidia', 'amd', 'intel', 'apple'];
const TIERS = ['entry', 'mid', 'high', 'ultra'];
const PRICE_NOTES = ['laptop', 'no-official', 'pending'];

// Campos que deben existir siempre. Un dato sin verificar se deja a null ("pendiente"),
// pero la clave tiene que estar para que se vea que falta a propósito.
const REQUIRED = {
  common: ['brand', 'name', 'arch', 'vram', 'tflops', 'bandwidth', 'tdp', 'msrp', 'src'],
  DESKTOP_GPUS: ['year', 'launch', 'tier', 'perf'],
  MOBILE_GPUS: ['year', 'tier', 'perf', 'priceNote'],
  WORKSTATION_GPUS: ['tier'],
  SERVER_GPUS: ['year', 'ai', 'interconnect', 'workloads', 'desc', 'cssClass']
};
// Campos que no pueden quedar pendientes
const NOT_NULL = ['brand', 'name', 'arch', 'vram'];

// Formatos aceptados
const VRAM_RE = /^\d+(\.\d+)? GB (GDDR\dX?|HBM\d?e?|UMA)$/;
const TDP_RE = /^\d+(-\d+)?W$/;
const BW_RE = /^\d+(\.\d+)? GB\/s$/;
const LAUNCH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const each = fn => LISTS.flatMap(list => data[list].map((gpu, i) => fn(list, gpu, i))).filter(Boolean);
const has = v => v !== null && v !== undefined;

test('todas las listas existen y no están vacías', () => {
  for (const list of LISTS) assert.ok(Array.isArray(data[list]) && data[list].length > 0, list);
});

test('metadatos: fecha de revisión y fuentes con URL', () => {
  assert.match(data.DATA_META.reviewed, /^\d{4}-\d{2}-\d{2}$/);
  const bad = Object.entries(data.DATA_SOURCES).filter(([, s]) => !s.name || !/^https:\/\//.test(s.url)).map(([k]) => k);
  assert.deepEqual(bad, []);
});

test('sin nombres duplicados (ni dentro de una lista ni entre listas)', () => {
  const seen = new Map();
  const dups = each((list, g) => {
    const key = data.gpuKey(g.name);
    const prev = seen.get(key);
    seen.set(key, `${list}:${g.name}`);
    return prev ? `${list}:${g.name} = ${prev}` : null;
  });
  assert.deepEqual(dups, []);
});

test('campos obligatorios presentes', () => {
  const missing = each((list, gpu, i) => {
    const fields = [...REQUIRED.common, ...(REQUIRED[list] || [])];
    const absent = fields.filter(f => gpu[f] === undefined || (NOT_NULL.includes(f) && !gpu[f]));
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

test('TFLOPS numérico y positivo (o pendiente)', () => {
  const bad = each((list, gpu) => (!has(gpu.tflops) || parseFloat(gpu.tflops) > 0 ? null : `${list}: ${gpu.name} → ${gpu.tflops}`));
  assert.deepEqual(bad, []);
});

test('formato de VRAM ("16 GB GDDR6")', () => {
  const bad = each((list, gpu) => (VRAM_RE.test(gpu.vram) ? null : `${list}: ${gpu.name} → "${gpu.vram}"`));
  assert.deepEqual(bad, []);
});

test('formato de TDP ("250W", "35-115W") o pendiente', () => {
  const bad = each((list, gpu) => (!has(gpu.tdp) || TDP_RE.test(gpu.tdp) ? null : `${list}: ${gpu.name} → "${gpu.tdp}"`));
  assert.deepEqual(bad, []);
});

test('formato de ancho de banda ("448 GB/s") o pendiente', () => {
  const bad = each((list, gpu) => (!has(gpu.bandwidth) || BW_RE.test(gpu.bandwidth) ? null : `${list}: ${gpu.name} → "${gpu.bandwidth}"`));
  assert.deepEqual(bad, []);
});

test('precio: PVP de lanzamiento en USD (entero) o null con el motivo', () => {
  const bad = each((list, gpu) => {
    if (has(gpu.msrp)) return Number.isInteger(gpu.msrp) && gpu.msrp > 0 ? null : `${gpu.name}: msrp ${gpu.msrp}`;
    return PRICE_NOTES.includes(gpu.priceNote) ? null : `${gpu.name}: sin precio y sin priceNote válido (${gpu.priceNote})`;
  });
  assert.deepEqual(bad, []);
});

test('fecha de lanzamiento AAAA-MM coherente con el año', () => {
  const bad = each((list, gpu) => {
    if (!has(gpu.launch)) return null;
    if (!LAUNCH_RE.test(gpu.launch)) return `${gpu.name}: launch "${gpu.launch}"`;
    if (gpu.year !== undefined && Number(gpu.launch.slice(0, 4)) !== gpu.year) return `${gpu.name}: launch ${gpu.launch} ≠ año ${gpu.year}`;
    return null;
  });
  assert.deepEqual(bad, []);
});

test('toda fuente es una clave de DATA_SOURCES o una URL https', () => {
  const bad = each((list, gpu) => {
    if (!Array.isArray(gpu.src)) return `${gpu.name}: src no es una lista`;
    const wrong = gpu.src.filter(s => !data.DATA_SOURCES[s] && !/^https:\/\/\S+$/.test(s));
    return wrong.length ? `${gpu.name}: ${wrong.join(', ')}` : null;
  });
  assert.deepEqual(bad, []);
});

test('índice gaming: entre 0 y 100, con la RTX 5090 como referencia', () => {
  const bad = each((list, gpu) => (!has(gpu.perf) || (gpu.perf > 0 && gpu.perf <= 100) ? null : `${gpu.name}: perf ${gpu.perf}`));
  assert.deepEqual(bad, []);
  assert.equal(data.DESKTOP_GPUS.find(g => g.name === 'RTX 5090').perf, 100);
});

test('las descripciones multilingües tienen los 6 idiomas', () => {
  const bad = [];
  [...data.SERVER_GPUS, ...data.TIMELINE_DATA].forEach(item => {
    if (typeof item.desc !== 'object') return;
    LANGS.forEach(lang => { if (!item.desc[lang] || !item.desc[lang].trim()) bad.push(`${item.name || item.title}: ${lang}`); });
  });
  assert.deepEqual(bad, []);
});

test('el mapa de arquitecturas solo enlaza con nodos existentes', () => {
  const ids = new Set(data.ARCHITECTURES_DATA.map(a => a.id));
  const broken = Array.from(data.ARCHITECTURES_DATA.filter(a => a.parent && !ids.has(a.parent)), a => a.id);
  assert.deepEqual(broken, []);
});
