// Monta en _site/ lo que se publica en GitHub Pages (publicación con GitHub Actions: ver
// .github/workflows/noticias.yml). Es una lista cerrada: solo la web y su licencia. Nada de partials/,
// tests/, scripts/, docs/, node_modules/, package*.json, README.md, CREDITOS.md ni archivos ocultos.
//   node scripts/site.js [carpeta]   -> por defecto _site; falla si falta algo de la lista (news.json incluido)
// Con la publicación desde la rama, lo mismo lo hacía _config.yml; ahora GitHub Pages ya no lo lee.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_FILES = ['index.html', '404.html', 'sw.js', 'manifest.webmanifest', 'sitemap.xml', 'robots.txt', 'LICENSE', 'news.json'];
const PUBLIC_DIRS = ['pages', 'css', 'js', 'assets', 'vendor'];

function walk(dir, rel = '') {
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true })
    .filter(entry => !entry.name.startsWith('.'))
    .flatMap(entry => {
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      return entry.isDirectory() ? walk(dir, child) : [child];
    });
}

// Archivos que irían al sitio (rutas con "/", relativas a la raíz), en orden
function listSiteFiles(root = ROOT) {
  const files = PUBLIC_FILES.filter(f => fs.existsSync(path.join(root, f)));
  const dirs = PUBLIC_DIRS.filter(d => fs.existsSync(path.join(root, d))).flatMap(d => walk(root, d));
  return [...files, ...dirs].sort();
}

function buildSite(outDir, root = ROOT) {
  const missing = PUBLIC_FILES.filter(f => !fs.existsSync(path.join(root, f)));
  if (missing.length) throw new Error(`faltan archivos del sitio: ${missing.join(', ')}${missing.includes('news.json') ? ' (genera las noticias con npm run news)' : ''}`);
  const out = path.resolve(outDir);
  // Por seguridad solo se vacía una carpeta _site o una carpeta nueva
  if (fs.existsSync(out)) {
    if (path.basename(out) !== '_site') throw new Error(`${out} ya existe y no se llama _site: no se borra`);
    fs.rmSync(out, { recursive: true, force: true });
  }
  const files = listSiteFiles(root);
  for (const f of files) {
    const dest = path.join(out, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, f), dest);
  }
  return files;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(ROOT, '_site');
  try {
    const files = buildSite(out);
    console.log(`✔ ${files.length} archivos en ${path.relative(ROOT, path.resolve(out)) || out}`);
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exitCode = 1;
  }
}

module.exports = { PUBLIC_FILES, PUBLIC_DIRS, listSiteFiles, buildSite };
