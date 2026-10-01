// Fase B: con la publicación por GitHub Actions, _config.yml ya no filtra nada; lo publicado es lo que
// monta scripts/site.js. Debe ser exactamente lo que se servía publicando desde la rama: la web y su
// licencia, más news.json. Nada de partials/, tests/, scripts/, docs/, node_modules/, package*.json,
// README.md, CREDITOS.md ni archivos ocultos.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { listSiteFiles, buildSite, PUBLIC_FILES } = require('../scripts/site');
const { ROOT, listPages } = require('./helpers/env');

const site = listSiteFiles().filter(f => f !== 'news.json');

test('el sitio lleva las páginas, estilos, scripts, recursos, service worker, metadatos y LICENSE', () => {
  const must = [...listPages(), 'sw.js', 'manifest.webmanifest', 'sitemap.xml', 'robots.txt', 'LICENSE', 'css/style.css', 'vendor/three/three-viewer.min.js', 'assets/icons/icon.svg'];
  const js = fs.readdirSync(path.join(ROOT, 'js')).map(f => `js/${f}`);
  assert.deepEqual([...must, ...js].filter(f => !site.includes(f)), []);
  assert.ok(PUBLIC_FILES.includes('news.json'));
});

test('el sitio no lleva nada del desarrollo', () => {
  const banned = /^(partials|tests|scripts|docs|node_modules|screenshots|_site)\/|^(package(-lock)?\.json|README\.md|CREDITOS\.md|_config\.yml)$|(^|\/)\./;
  assert.deepEqual(site.filter(f => banned.test(f)), []);
});

test('el sitio es exactamente lo que GitHub Pages servía desde la rama (archivos de git menos _config.yml)', () => {
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch (e) {
    return; // sin git (no debería pasar: GitHub Actions hace checkout del repositorio)
  }
  // Lo que excluía _config.yml, más lo que Jekyll nunca publica (ocultos y los que empiezan por _)
  const config = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8');
  const excluded = [...config.matchAll(/^\s+-\s+(\S+)/gm)].map(m => m[1]);
  const servedFromBranch = tracked.filter(f => !excluded.some(x => (x.endsWith('/') ? f.startsWith(x) : f === x)) && !/(^|\/)[._]/.test(f) && fs.existsSync(path.join(ROOT, f)));
  assert.deepEqual(site.filter(f => tracked.includes(f)), servedFromBranch.sort());
  assert.deepEqual(site.filter(f => !tracked.includes(f)), [], 'archivos sin versionar dentro de las carpetas publicadas');
});

test('lo que guarda el service worker está en el sitio', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const precache = JSON.parse(sw.slice(sw.indexOf('[', sw.indexOf('const PRECACHE')), sw.indexOf('];') + 1).replace(/'/g, '"').replace(/,\s*\]/, ']'));
  assert.deepEqual(precache.filter(f => f !== './' && !site.includes(f)), []);
});

test('montar el sitio: copia la lista y no se monta sin news.json', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gpu-site-'));
  // Raíz falsa con lo mínimo: sin news.json falla y no crea nada
  const root = path.join(tmp, 'raiz');
  fs.mkdirSync(path.join(root, 'js'), { recursive: true });
  PUBLIC_FILES.filter(f => f !== 'news.json').forEach(f => fs.writeFileSync(path.join(root, f), f));
  fs.writeFileSync(path.join(root, 'js', 'app.js'), '// app');
  fs.writeFileSync(path.join(root, 'README.md'), 'no se publica');
  const out = path.join(tmp, '_site');
  assert.throws(() => buildSite(out, root), /news\.json/);
  assert.equal(fs.existsSync(out), false);
  // Con news.json se copia exactamente la lista
  fs.writeFileSync(path.join(root, 'news.json'), '{}');
  const files = buildSite(out, root);
  assert.deepEqual(files, [...PUBLIC_FILES, 'js/app.js'].sort());
  assert.equal(fs.existsSync(path.join(out, 'README.md')), false);
  // Una carpeta de salida que existe y no se llama _site no se borra
  assert.throws(() => buildSite(root, root), /no se borra/);
});
