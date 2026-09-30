// Publicación: GitHub Pages distingue mayúsculas y minúsculas (Windows no). Cada ruta local que usa
// la web debe coincidir letra por letra con un archivo que existe.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, listPages } = require('./helpers/env');

// ¿Existe la ruta con exactamente esas mayúsculas? (se comprueba cada tramo contra readdir)
function existsExact(rel) {
  let dir = ROOT;
  for (const part of rel.split('/').filter(Boolean)) {
    if (part === '.') continue;
    if (part === '..') { dir = path.dirname(dir); continue; }
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

const isLocal = url => url && !/^(?:[a-z]+:|\/\/|#|\{\{|\$\{)/i.test(url);
const clean = url => url.split(/[?#]/)[0];

test('rutas de las páginas (href, src, srcset) con las mayúsculas exactas', () => {
  const bad = [];
  for (const page of listPages()) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    // La 404 resuelve sus rutas desde la raíz del sitio (<base>)
    const baseDir = page === '404.html' ? '' : path.posix.dirname(page).replace(/^\.$/, '');
    const refs = [
      ...[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m => m[1]),
      // (un srcset "data:…" lleva comas dentro: no es una lista de archivos)
      ...[...html.matchAll(/\b(?:srcset|imagesrcset)="([^"]+)"/g)].filter(m => !m[1].startsWith('data:')).flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+/)[0]))
    ].filter(isLocal).filter(u => !u.startsWith('/'));
    for (const ref of refs) {
      const rel = path.posix.normalize(path.posix.join(baseDir, clean(ref)));
      if (rel && !existsExact(rel)) bad.push(`${page}: ${ref}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('rutas del CSS, del manifest y de la precaché del service worker con las mayúsculas exactas', () => {
  const bad = [];
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  for (const m of css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) {
    if (isLocal(m[2]) && !existsExact(path.posix.normalize(path.posix.join('css', clean(m[2]))))) bad.push(`style.css: ${m[2]}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  manifest.icons.forEach(i => { if (!existsExact(i.src)) bad.push(`manifest: ${i.src}`); });
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const precache = Array.from(vm.runInNewContext(/const PRECACHE = (\[[\s\S]*?\]);/.exec(sw)[1]));
  precache.filter(f => f !== './').forEach(f => { if (!existsExact(f)) bad.push(`sw.js: ${f}`); });
  assert.deepEqual(bad, []);
});

test('rutas escritas en el JS (assets, pages, vendor) con las mayúsculas exactas', () => {
  const bad = [];
  for (const file of fs.readdirSync(path.join(ROOT, 'js'))) {
    const src = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
    for (const m of src.matchAll(/['"`](?:\.\.\/)?((?:assets|pages|vendor|css|js)\/[\w./-]+\.(?:html|js|css|svg|png|jpg|webp|avif|woff2|json))['"`]/g)) {
      if (!existsExact(m[1])) bad.push(`js/${file}: ${m[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});

// Las licencias (OFL-*.txt, LICENSE) conservan su nombre habitual
test('ningún archivo que carga la web depende de mayúsculas: nombres en minúsculas', () => {
  const skip = new Set(['node_modules', '.git', '.github', '.claude', '.vscode', 'screenshots']);
  const upper = [];
  (function walk(dir, rel) {
    for (const name of fs.readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = path.join(dir, name);
      const r = rel ? `${rel}/${name}` : name;
      if (fs.statSync(full).isDirectory()) walk(full, r);
      else if (/[A-Z]/.test(name) && /\.(html|js|css|svg|png|jpg|webp|avif|woff2|json|webmanifest|xml)$/.test(name)) upper.push(r);
    }
  })(ROOT, '');
  assert.deepEqual(upper, []);
});
