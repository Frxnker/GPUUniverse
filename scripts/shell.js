// Bloques compartidos de las páginas: cabecera común, metadatos, barra, pie, modal, noticias y scripts.
// Cada bloque se edita UNA vez en partials/<nombre>.html y este script lo copia en cada página HTML
// (index.html, 404.html y pages/*.html), entre las marcas <!-- shell:nombre --> y <!-- /shell:nombre -->.
// Además genera sitemap.xml con las páginas públicas.
// Los HTML publicados siguen completos (funcionan sin JS y sin compilar nada); esto solo evita
// copiar a mano los cambios en cada archivo.
//   npm run shell            -> reescribe las páginas y sitemap.xml
//   npm run shell -- --check -> solo comprueba; sale con código 1 si algo no coincide
//
// Marcadores en las plantillas:
//   {{root}}        ruta a la raíz del sitio ('' en la raíz, '../' en pages/)
//   {{pages}}       ruta a la carpeta pages ('pages/' en la raíz, '' en pages/)
//   {{current:x}}   ' class="active" aria-current="page"' si la página actual es pages/x.html
//   {{id}}          identificador de la página (home, gaming, notfound...)
//   {{title}}       título en español (meta.<id>_title de js/i18n.js), escapado para HTML
//   {{desc}}        descripción en español (meta.<id>_desc)
//   {{url}}         URL pública de la página ("homepage" de package.json + ruta)
//   {{site}}        URL pública del sitio, acabada en /
//   {{basepath}}    ruta del sitio en el dominio (/GPUUniverse/)
//   {{scripthash}}  hashes sha256 de los <script> en línea de la misma plantilla (para la CSP)
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PARTIALS = path.join(ROOT, 'partials');
const MARK = /^([ \t]*)<!-- shell:([a-z-]+) -->$/;
const SITE = (() => {
  const home = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).homepage;
  if (!home) throw new Error('package.json: falta "homepage" (URL pública del sitio)');
  return home.endsWith('/') ? home : `${home}/`;
})();

function listPages() {
  const root = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
  const sub = fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html')).sort().map(f => `pages/${f}`);
  return [...root, ...sub];
}

// Páginas que no van en sitemap.xml
const NOT_PUBLIC = ['404.html'];

function pageId(page) {
  if (page === 'index.html') return 'home';
  if (page === '404.html') return 'notfound';
  return path.basename(page, '.html');
}

// Textos en español de js/i18n.js (solo se evalúa el objeto de traducciones, sin tocar el DOM)
let metaCache = null;
function spanishMeta() {
  if (metaCache) return metaCache;
  const src = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
  const start = src.indexOf('const translations = {');
  const end = src.indexOf('\n};', start);
  const translations = vm.runInNewContext(`(() => { ${src.slice(start, end + 3)} return translations; })()`);
  metaCache = translations.es.meta || {};
  return metaCache;
}

const escAttr = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function context(page) {
  const nested = page.includes('/');
  const id = pageId(page);
  return {
    root: nested ? '../' : '',
    pages: nested ? '' : 'pages/',
    current: nested ? path.basename(page, '.html') : 'index',
    id,
    page
  };
}

function render(name, page) {
  const file = path.join(PARTIALS, `${name}.html`);
  if (!fs.existsSync(file)) throw new Error(`${page}: no existe la plantilla partials/${name}.html`);
  const ctx = context(page);
  const meta = key => {
    const value = spanishMeta()[`${ctx.id}_${key}`];
    if (!value) throw new Error(`${page}: falta meta.${ctx.id}_${key} en js/i18n.js`);
    return escAttr(value);
  };
  const template = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
  // Hash de cada script en línea de la plantilla, para la CSP (así el script puede cambiar sin tocarla)
  const scriptHashes = () => [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`).join(' ');
  return template.replace(/\{\{([a-z]+)(?::([a-z-]+))?\}\}/g, (all, key, arg) => {
    if (key === 'root') return ctx.root;
    if (key === 'scripthash') return scriptHashes();
    if (key === 'pages') return ctx.pages;
    if (key === 'current') return arg === ctx.current ? ' class="active" aria-current="page"' : '';
    if (key === 'id') return ctx.id;
    if (key === 'title') return meta('title');
    if (key === 'desc') return meta('desc');
    if (key === 'url') return escAttr(SITE + (page === 'index.html' ? '' : page));
    if (key === 'site') return escAttr(SITE);
    if (key === 'basepath') return escAttr(new URL(SITE).pathname);
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

// sitemap.xml: páginas públicas; <lastmod> es el día en que cambió la lista de URL
function sitemapXml(lastmod) {
  const urls = listPages().filter(p => !NOT_PUBLIC.includes(p)).map(p => {
    const loc = SITE + (p === 'index.html' ? '' : p);
    return `  <url>\n    <loc>${escAttr(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

// La fecha de sitemap.xml no se reescribe si las URL no han cambiado (así --check no falla cada día)
function sitemapStatus() {
  const file = path.join(ROOT, 'sitemap.xml');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  const kept = (/<lastmod>([\d-]+)<\/lastmod>/.exec(current) || [])[1];
  const expectedSameDate = kept ? sitemapXml(kept) : '';
  if (kept && current === expectedSameDate) return { file, changed: false, xml: current };
  return { file, changed: true, xml: sitemapXml(new Date().toISOString().slice(0, 10)) };
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const results = listPages().map(syncPage);
  const changed = results.filter(r => r.changed);
  const sitemap = sitemapStatus();
  if (check) {
    changed.forEach(r => console.error(`✖ ${r.page} no coincide con partials/ (ejecuta npm run shell)`));
    if (sitemap.changed) console.error('✖ sitemap.xml no coincide con las páginas (ejecuta npm run shell)');
    if (!changed.length && !sitemap.changed) console.log(`✔ ${results.length} páginas y sitemap.xml sincronizados con partials/`);
    process.exitCode = changed.length || sitemap.changed ? 1 : 0;
  } else {
    changed.forEach(r => fs.writeFileSync(r.file, r.after));
    if (sitemap.changed) fs.writeFileSync(sitemap.file, sitemap.xml);
    console.log(`${changed.length} de ${results.length} páginas actualizadas${changed.length ? ': ' + changed.map(r => r.page).join(', ') : ''}${sitemap.changed ? ' · sitemap.xml actualizado' : ''}`);
  }
}

module.exports = { SITE, listPages, pageId, render, syncHtml, syncPage, sitemapStatus };
