// Entorno de pruebas: carga una página real en jsdom con sus scripts clásicos.
// jsdom no trae algunas APIs del navegador; aquí se simulan solo esas (sin tocar el código de la web).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');

const ROOT = path.resolve(__dirname, '..', '..');
const LANGS = ['es', 'en', 'fr', 'de', 'it', 'ru'];

// Todas las páginas HTML de la web (raíz + /pages)
function listPages() {
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  const sub = fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html')).map(f => `pages/${f}`);
  return [...pages, ...sub];
}

// Origen ficticio que sirve los archivos del proyecto (como GitHub Pages).
// Lo externo (fuentes, CDN, banderas) se devuelve vacío y se anota. El CSS tampoco se
// analiza en las pruebas (jsdom no entiende parte del CSS moderno).
const ORIGIN = 'http://gpu-universe.test/';
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' };

function localOnly(external) {
  return requestInterceptor(request => {
    if (request.url.startsWith(ORIGIN)) {
      // Como en GitHub Pages, el sitio también responde bajo /GPUUniverse/ (la 404 usa <base href="/GPUUniverse/">)
      const rel = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, '').replace(/^GPUUniverse\//, '');
      if (/\.css$/.test(rel)) return new Response('', { headers: { 'Content-Type': 'text/css' } });
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        return new Response('404', { status: 404 });
      }
      return new Response(fs.readFileSync(file), { headers: { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' } });
    }
    external.push(request.url);
    return new Response('', { headers: { 'Content-Type': 'text/plain' } });
  });
}

// Contexto 2D de mentira: acepta cualquier llamada y devuelve valores neutros
function fakeContext2d(canvas) {
  const target = {
    canvas,
    measureText: text => ({ width: String(text).length * 7 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) })
  };
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      return () => {};
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    }
  });
}

function installBrowserApis(window, options) {
  const { reducedMotion = false, fetchImpl } = options;
  window.matchMedia = query => ({
    matches: /prefers-reduced-motion:\s*reduce/.test(query) ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; }
  });
  class FakeObserver {
    constructor(cb) { this.cb = cb; this.targets = new Set(); }
    observe(el) { this.targets.add(el); }
    unobserve(el) { this.targets.delete(el); }
    disconnect() { this.targets.clear(); }
    takeRecords() { return []; }
  }
  window.IntersectionObserver = FakeObserver;
  window.ResizeObserver = FakeObserver;
  window.HTMLCanvasElement.prototype.getContext = function (type) {
    return type === '2d' ? fakeContext2d(this) : null;
  };
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.scrollTo = () => {};
  window.scrollBy = () => {};
  // jsdom no trae el objeto CSS; los navegadores sí (gaming.js usa CSS.escape con los filtros de la URL)
  if (!window.CSS) window.CSS = { escape: value => String(value).replace(/[^a-zA-Z0-9_-]/g, c => `\\${c}`) };
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: text => { window.__clipboard = text; return Promise.resolve(); } }
  });
  // Por defecto no hay red: las noticias deben mostrar su estado de error, nunca inventarse
  window.fetch = fetchImpl || (() => Promise.reject(new TypeError('Failed to fetch (sin red en las pruebas)')));
}

/**
 * Carga una página y espera a que termine (load + temporizadores cortos).
 * options: lang, theme, storage (objeto clave→valor para localStorage), query ('?gpu=...'),
 *          hash, reducedMotion, fetchImpl, wait (ms tras load), beforeScripts(window)
 */
async function loadPage(page, options = {}) {
  const url = ORIGIN + page + (options.query || '') + (options.hash || '');
  return loadHtml(fs.readFileSync(path.join(ROOT, page), 'utf8'), url, options);
}

// Documento mínimo que solo carga los scripts indicados (rutas desde la raíz del proyecto)
function loadScripts(scripts, options = {}) {
  const body = options.body || '';
  const tags = scripts.map(s => `<script src="${s}"></script>`).join('');
  const url = ORIGIN + (options.page || 'index.html');
  return loadHtml(`<!DOCTYPE html><html lang="es"><head></head><body>${body}${tags}</body></html>`, url, options);
}

// Reloj controlable: window.__setNow('2026-09-29T10:00:00') cambia la fecha "actual" de la página
function installClock(window, start) {
  let now = new Date(start).getTime();
  const RealDate = window.Date;
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length) super(...args);
      else super(now);
    }
    static now() { return now; }
  }
  window.Date = FakeDate;
  window.__setNow = value => { now = new RealDate(value).getTime(); };
}

async function loadHtml(html, url, options = {}) {
  const errors = [];
  const warnings = [];
  const external = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (...args) => errors.push(args.map(String).join(' ')));
  virtualConsole.on('warn', (...args) => warnings.push(args.map(String).join(' ')));
  virtualConsole.on('jsdomError', err => {
    // La navegación (clic en enlaces, location.href) no existe en jsdom; no es un error de la web
    if (err.type === 'not-implemented' && /navigation/i.test(err.message)) return;
    const cause = err.cause ? ` — ${err.cause.stack || err.cause}` : '';
    errors.push(`[${err.type || 'jsdom'}] ${err.message}${cause}`);
  });

  const storage = {
    // Por defecto se omite la tarjeta de bienvenida (tiene su propia prueba)
    'gpu-universe-welcome': '1',
    ...(options.lang ? { gpu_lang: options.lang } : {}),
    ...(options.theme ? { 'gpu-universe-theme': options.theme } : {}),
    ...(options.storage || {})
  };

  const dom = new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    resources: { interceptors: [localOnly(external)] },
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      Object.entries(storage).forEach(([k, v]) => window.localStorage.setItem(k, v));
      installBrowserApis(window, options);
      if (options.now) installClock(window, options.now);
      if (options.beforeScripts) options.beforeScripts(window);
    }
  });
  const { window } = dom;
  await new Promise(resolve => {
    if (window.document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  await delay(options.wait !== undefined ? options.wait : 120);
  return { dom, window, document: window.document, errors, warnings, external, close: () => window.close() };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scripts locales que carga una página, en orden
function scriptsOf(page) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const dir = path.posix.dirname(page);
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
    .map(m => m[1])
    .filter(src => !/^https?:/.test(src))
    .map(src => path.posix.normalize(path.posix.join(dir, src)));
}

// Evalúa data.js y devuelve sus constantes (sin navegador)
function loadData() {
  const vm = require('vm');
  const src = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
  const names = [...src.matchAll(/^(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=/gm)].map(m => m[1]);
  const fnNames = [...src.matchAll(/^function\s+([A-Za-z_]\w*)/gm)].map(m => m[1]);
  const ctx = vm.createContext({});
  return vm.runInContext(`${src}\n;({ ${[...names, ...fnNames].join(', ')} })`, ctx, { filename: 'data.js' });
}

// Evalúa i18n.js (con un documento vacío de mentira) y devuelve el objeto de traducciones
function loadTranslations() {
  const vm = require('vm');
  const src = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
  const noop = () => {};
  const element = { setAttribute: noop, getAttribute: () => null, addEventListener: noop, style: {}, dataset: {} };
  const document = {
    readyState: 'loading',
    documentElement: element,
    addEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ ...element })
  };
  const store = {};
  const localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const ctx = vm.createContext({ document, localStorage, navigator: { language: 'es-ES', languages: ['es-ES'] }, console });
  ctx.window = ctx;
  vm.runInContext(src, ctx, { filename: 'i18n.js' });
  return vm.runInContext('translations', ctx);
}

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? flattenKeys(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
}

module.exports = { ROOT, ORIGIN, LANGS, listPages, loadPage, loadScripts, scriptsOf, loadData, loadTranslations, flattenKeys, delay };
