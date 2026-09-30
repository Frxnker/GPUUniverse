// Bloques compartidos (partials/): todas las páginas deben coincidir con las plantillas
const test = require('node:test');
const assert = require('node:assert/strict');
const { listPages, syncPage, syncHtml } = require('../scripts/shell');

const REQUIRED = ['head', 'nav', 'modal', 'scripts'];
// learn.html ocupa toda la pantalla con el visor 3D y no tiene pie
const WITHOUT_FOOTER = ['pages/learn.html'];

test('cada página coincide con partials/ (si falla: npm run shell)', () => {
  const stale = listPages().map(syncPage).filter(r => r.changed).map(r => r.page);
  assert.deepEqual(stale, []);
});

test('cada página tiene los bloques compartidos que le corresponden', () => {
  const bad = [];
  for (const page of listPages()) {
    const { blocks } = syncPage(page);
    const expected = WITHOUT_FOOTER.includes(page) ? REQUIRED : [...REQUIRED, 'footer'];
    expected.filter(b => !blocks.includes(b)).forEach(b => bad.push(`${page}: falta shell:${b}`));
    if (new Set(blocks).size !== blocks.length) bad.push(`${page}: bloque repetido`);
  }
  assert.deepEqual(bad, []);
});

test('rutas relativas y enlace activo según la página', () => {
  const html = '<body>\n  <!-- shell:nav -->\n  <!-- /shell:nav -->\n</body>';
  const root = syncHtml('index.html', html).html;
  const sub = syncHtml('pages/tools.html', html).html;
  assert.match(root, /href="pages\/tools\.html" data-i18n/);
  assert.match(root, /src="assets\/flags\/es\.svg"/);
  assert.doesNotMatch(root, /aria-current/);
  assert.match(sub, /href="tools\.html" class="active" aria-current="page" data-i18n="nav\.tools"/);
  assert.match(sub, /href="\.\.\/index\.html"/);
  assert.equal((sub.match(/aria-current/g) || []).length, 1);
});

test('una marca sin cierre es un error, no una página rota en silencio', () => {
  assert.throws(() => syncHtml('index.html', '<!-- shell:nav -->\n<nav></nav>'), /falta <!-- \/shell:nav -->/);
});
