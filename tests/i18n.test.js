// Traducciones: paridad entre idiomas y cobertura de las claves que usa el código publicado
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, LANGS, listPages, scriptsOf, loadTranslations, flattenKeys } = require('./helpers/env');

const translations = loadTranslations();
const flat = Object.fromEntries(LANGS.map(lang => [lang, Object.fromEntries(flattenKeys(translations[lang]))]));
const NAMESPACES = Object.keys(translations.es);

// Claves que el código construye por partes: cada patrón debe declararse aquí con sus valores posibles.
// Si aparece un patrón nuevo sin declarar, la prueba falla y pide añadirlo.
const DYNAMIC = {
  'defs.*': ['tflops', 'tdp', 'dlss_fsr'],
  'ui.tier_*': ['entry', 'mid', 'high', 'ultra'],
  'fx.cat_*': ['desktop', 'laptop', 'workstation', 'server'],
  'fx.empty_*': ['favorites', 'recent', 'compare'],
  'fx.reason_*': ['view', 'page', 'favorite', 'compare', 'quiz', 'layer', 'tool', 'daily', 'share', 'achievement', 'dailyChallenge', 'game'],
  'levels.titles.l*': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  'levels.g_*': ['daily', 'hl', 'year', 'arch', 'time', 'expert'],
  'levels.g_*_desc': ['daily', 'hl', 'year', 'arch', 'time'],
  'levels.color_*': ['emerald', 'blue', 'amber', 'magenta', 'red', 'gold'],
  'levels.*': ['done', 'current', 'locked'],
  'levels.ach.*.name': ACHIEVEMENT_IDS(),
  'levels.ach.*.desc': ACHIEVEMENT_IDS(),
  'meta.*.title': PAGE_IDS(),
  'meta.*.description': PAGE_IDS()
};

function ACHIEVEMENT_IDS() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'progress.js'), 'utf8');
  const block = src.slice(src.indexOf('const ACHIEVEMENTS'), src.indexOf('];', src.indexOf('const ACHIEVEMENTS')));
  return [...block.matchAll(/id:\s*'([a-z0-9_]+)'/g)].map(m => m[1]);
}
function PAGE_IDS() {
  return listPages().map(p => path.basename(p, '.html')).map(id => (id === 'index' ? 'home' : id));
}

// Código que realmente se publica: los scripts que cargan las páginas
const shippedScripts = [...new Set(listPages().flatMap(scriptsOf))].filter(s => s.startsWith('js/') && s !== 'js/i18n.js');
const shippedSources = shippedScripts.map(s => [s, fs.readFileSync(path.join(ROOT, s), 'utf8')]);
const htmlSources = listPages().map(p => [p, fs.readFileSync(path.join(ROOT, p), 'utf8')]);

function usedKeys() {
  const keys = new Map(); // clave -> archivo donde aparece
  const plurals = new Map();
  const dynamicFound = new Set();
  const nsGroup = NAMESPACES.join('|');
  const literal = new RegExp(`(['"\`])((?:${nsGroup})\\.[a-zA-Z0-9_.]+)\\1(?!\\s*\\+)`, 'g');
  const attr = /data-i18n(?:-[a-z-]+)?="([^"$]+)"/g;
  const template = /\b(?:T|t|tr|trPlural)\(\s*`([^`]*\$\{[^`]*)`/g;
  const concat = new RegExp(`(['"])((?:${nsGroup})\\.[a-zA-Z0-9_.]*)\\1\\s*\\+`, 'g');
  const plural = /trPlural\(\s*'([a-zA-Z0-9_.]+)'/g;

  for (const [file, src] of [...shippedSources, ...htmlSources]) {
    for (const m of src.matchAll(attr)) keys.set(m[1], file);
    if (file.endsWith('.html')) continue;
    for (const m of src.matchAll(plural)) plurals.set(m[1], file);
    for (const m of src.matchAll(literal)) {
      const key = m[2];
      if (/\.(html|js|css|png|webp|svg|json)$/.test(key) || key.endsWith('.')) continue;
      if (plurals.has(key)) continue;
      keys.set(key, file);
    }
    for (const m of src.matchAll(template)) {
      const pattern = m[1].replace(/\$\{[^}]*\}/g, '*');
      // "${base}_other" es la implementación de trPlural: lo cubre la prueba de plurales
      if (!pattern.startsWith('*')) dynamicFound.add([pattern, file]);
    }
    for (const m of src.matchAll(concat)) dynamicFound.add([`${m[2]}*`, file]);
  }
  return { keys, plurals, dynamicFound: [...dynamicFound] };
}

test('los 6 idiomas tienen exactamente las mismas claves', () => {
  const base = Object.keys(flat.es).sort();
  for (const lang of LANGS) {
    const keys = Object.keys(flat[lang]).sort();
    const missing = base.filter(k => !(k in flat[lang]));
    const extra = keys.filter(k => !(k in flat.es));
    assert.deepEqual({ lang, missing, extra }, { lang, missing: [], extra: [] });
  }
});

test('ninguna traducción está vacía', () => {
  for (const lang of LANGS) {
    const empty = Object.entries(flat[lang]).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
    assert.deepEqual({ lang, empty }, { lang, empty: [] });
  }
});

test('las variables {x} coinciden en todos los idiomas', () => {
  const vars = s => [...String(s).matchAll(/\{([a-z_]+)\}/g)].map(m => m[1]).sort().join(',');
  const mismatches = [];
  for (const key of Object.keys(flat.es)) {
    for (const lang of LANGS) {
      if (vars(flat[lang][key]) !== vars(flat.es[key])) mismatches.push(`${lang}:${key}`);
    }
  }
  assert.deepEqual(mismatches, []);
});

test('toda clave usada en HTML y JS publicados existe en los 6 idiomas', () => {
  const { keys } = usedKeys();
  const missing = [];
  for (const [key, file] of keys) {
    for (const lang of LANGS) if (!(key in flat[lang])) missing.push(`${lang}:${key} (${file})`);
  }
  assert.deepEqual(missing, []);
});

test('las claves construidas por partes están declaradas y existen', () => {
  const { dynamicFound } = usedKeys();
  const undeclared = dynamicFound.filter(([pattern]) => !(pattern in DYNAMIC)).map(([p, f]) => `${p} (${f})`);
  assert.deepEqual(undeclared, [], 'Declara el patrón en DYNAMIC con sus valores posibles');
  const missing = [];
  for (const [pattern] of dynamicFound) {
    for (const value of DYNAMIC[pattern]) {
      const key = pattern.replace('*', value);
      for (const lang of LANGS) if (!(key in flat[lang])) missing.push(`${lang}:${key}`);
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

test('los plurales tienen todas las formas de cada idioma (ruso: one/few/many)', () => {
  const { plurals } = usedKeys();
  const missing = [];
  for (const [base] of plurals) {
    for (const lang of LANGS) {
      const rules = new Intl.PluralRules(lang);
      const needed = new Set(['other']);
      for (let n = 0; n <= 200; n++) needed.add(rules.select(n));
      for (const cat of needed) if (!(`${base}_${cat}` in flat[lang])) missing.push(`${lang}:${base}_${cat}`);
    }
  }
  assert.deepEqual(missing, []);
});
