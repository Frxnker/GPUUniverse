// Fase 6: la hoja de estilos no acumula reglas muertas
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const csstree = require('css-tree');
const { ROOT } = require('./helpers/env');

const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
const sources = [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'pages')).map(f => `pages/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'partials')).map(f => `partials/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'js')).map(f => `js/${f}`)
].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

// Clases que el HTML o el JS aplican de verdad
function appliedClasses() {
  const classes = new Set();
  // "gpu-price${missing ? ' is-missing' : ''}": el nombre acaba donde empieza la expresión
  const add = str => str.replace(/\$\{[^}]*\}?/g, ' ').split(/[\s$]+/).forEach(c => { if (/^[a-zA-Z][\w-]*$/.test(c)) classes.add(c); });
  for (const m of sources.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g)) add(m[1]);
  for (const m of sources.matchAll(/classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g)) {
    for (const s of m[1].matchAll(/["'`]([\w-]+)["'`]/g)) classes.add(s[1]);
  }
  for (const m of sources.matchAll(/(?:querySelector(?:All)?|closest|matches)\(\s*["'`]([^"'`]+)["'`]/g)) {
    for (const s of m[1].matchAll(/\.([a-zA-Z][\w-]*)/g)) classes.add(s[1]);
  }
  // Nombres de clase guardados como datos: cssClass: 'nvidia-card', TIER_FILL = { entry: 'fill-green' }...
  for (const m of sources.matchAll(/(?:cssClass|fillColor|[A-Z_]*FILL[A-Z_]*\s*=\s*\{[^}]*)\s*:\s*'([a-z][\w-]*)'/g)) classes.add(m[1]);
  for (const m of sources.matchAll(/'((?:fill|[a-z]+-card)[\w-]*)'/g)) classes.add(m[1]);
  return classes;
}

test('toda clase del CSS se aplica en algún HTML o JS (sin reglas muertas)', () => {
  const applied = appliedClasses();
  // Prefijos de clases construidas en plantillas: `tier-${gpu.tier}`, `brand-${gpu.brand}`...
  const prefixes = [...new Set([...sources.matchAll(/([a-z][\w-]*-)\$\{/g)].map(m => m[1]))];
  const ast = csstree.parse(css, { parseValue: false, parseCustomProperty: false });
  const unused = new Set();
  csstree.walk(ast, node => {
    if (node.type !== 'ClassSelector') return;
    if (!applied.has(node.name) && !prefixes.some(p => node.name.startsWith(p))) unused.add(node.name);
  });
  assert.deepEqual([...unused], []);
});

test('no quedan bloques @media vacíos', () => {
  assert.deepEqual(css.match(/@media[^{]*\{\s*\}/g) || [], []);
});
