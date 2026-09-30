// Bloques compartidos de las páginas: cabecera común, barra de navegación, pie, modal y scripts comunes.
// Cada bloque se edita UNA vez en partials/<nombre>.html y este script lo copia en index.html y
// pages/*.html, entre las marcas <!-- shell:nombre --> y <!-- /shell:nombre -->.
// Los HTML publicados siguen completos (funcionan sin JS y sin compilar nada); esto solo evita
// copiar a mano los cambios en 9 archivos.
//   npm run shell            -> reescribe las páginas
//   npm run shell -- --check -> solo comprueba; sale con código 1 si alguna página no coincide
//
// Marcadores en las plantillas:
//   {{root}}        ruta a la raíz del sitio ('' en index.html, '../' en pages/)
//   {{pages}}       ruta a la carpeta pages ('pages/' en index.html, '' en pages/)
//   {{current:x}}   ' class="active" aria-current="page"' si la página actual es pages/x.html
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PARTIALS = path.join(ROOT, 'partials');
const MARK = /^([ \t]*)<!-- shell:([a-z-]+) -->$/;

function listPages() {
  const sub = fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html')).sort().map(f => `pages/${f}`);
  return ['index.html', ...sub];
}

function context(page) {
  const nested = page.includes('/');
  return {
    root: nested ? '../' : '',
    pages: nested ? '' : 'pages/',
    current: nested ? path.basename(page, '.html') : 'index'
  };
}

function render(name, page) {
  const file = path.join(PARTIALS, `${name}.html`);
  if (!fs.existsSync(file)) throw new Error(`${page}: no existe la plantilla partials/${name}.html`);
  const ctx = context(page);
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').replace(/\{\{([a-z]+)(?::([a-z-]+))?\}\}/g, (all, key, arg) => {
    if (key === 'root') return ctx.root;
    if (key === 'pages') return ctx.pages;
    if (key === 'current') return arg === ctx.current ? ' class="active" aria-current="page"' : '';
    throw new Error(`partials/${name}.html: marcador desconocido ${all}`);
  });
}

// Devuelve el HTML de la página con cada bloque marcado sustituido por su plantilla
function syncHtml(page, html) {
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const lines = html.split(/\r?\n/);
  const out = [];
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = MARK.exec(lines[i]);
    if (!m) { out.push(lines[i]); continue; }
    const [, indent, name] = m;
    const end = lines.findIndex((l, n) => n > i && l.trim() === `<!-- /shell:${name} -->`);
    if (end < 0) throw new Error(`${page}: falta <!-- /shell:${name} -->`);
    // La plantilla se sangra como su marca (p. ej. dentro de <main>)
    const block = render(name, page).split('\n');
    const base = Math.min(...block.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    out.push(lines[i], ...block.map(l => (l.trim() ? indent + l.slice(base) : l)), `${indent}<!-- /shell:${name} -->`);
    blocks.push(name);
    i = end;
  }
  return { html: out.join(eol), blocks };
}

function syncPage(page) {
  const file = path.join(ROOT, page);
  const before = fs.readFileSync(file, 'utf8');
  const { html, blocks } = syncHtml(page, before);
  return { page, file, before, after: html, blocks, changed: html !== before };
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const results = listPages().map(syncPage);
  const changed = results.filter(r => r.changed);
  if (check) {
    changed.forEach(r => console.error(`✖ ${r.page} no coincide con partials/ (ejecuta npm run shell)`));
    if (!changed.length) console.log(`✔ ${results.length} páginas sincronizadas con partials/`);
    process.exitCode = changed.length ? 1 : 0;
  } else {
    changed.forEach(r => fs.writeFileSync(r.file, r.after));
    console.log(`${changed.length} de ${results.length} páginas actualizadas${changed.length ? ': ' + changed.map(r => r.page).join(', ') : ''}`);
  }
}

module.exports = { listPages, render, syncHtml, syncPage };
