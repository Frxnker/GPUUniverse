// Service worker de GPU Universe: la web sigue funcionando sin conexión.
// - Páginas, CSS, JS y manifest: primero la red (así siempre se ve lo último publicado) y, si no hay
//   conexión, la copia guardada.
// - Fuentes, imágenes, banderas e iconos: primero la copia guardada (no cambian) y, si no está, la red.
// - Noticias (news.json, del propio sitio): primero la red y, sin conexión, la última copia guardada,
//   marcada con la cabecera X-GPU-Universe-Copy: offline para que la página lo diga. Va en una caché
//   aparte que no depende de VERSION, así la última copia sobrevive a las actualizaciones de la web.
// - Otros dominios no pasan por aquí (la web no pide nada fuera).
// Al cambiar la lista PRECACHE o los archivos que se sirven desde la caché, sube VERSION.
const VERSION = 'v3';
const CACHE = `gpu-universe-${VERSION}`;
const NEWS_CACHE = 'gpu-universe-news';

const PRECACHE = [
  './',
  'index.html',
  '404.html',
  'pages/gaming.html',
  'pages/workstation.html',
  'pages/server.html',
  'pages/compare.html',
  'pages/history.html',
  'pages/learn.html',
  'pages/tools.html',
  'pages/levels.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/i18n.js',
  'js/data.js',
  'js/app.js',
  'js/progress.js',
  'js/features.js',
  'js/quiz.js',
  'js/gaming.js',
  'js/compare.js',
  'js/tools.js',
  'js/levels.js',
  'js/learn-3d.js',
  'vendor/three/three-viewer.min.js',
  'assets/fonts/exo-2-latin.woff2',
  'assets/fonts/exo-2-latin-ext.woff2',
  'assets/fonts/exo-2-cyrillic.woff2',
  'assets/fonts/exo-2-cyrillic-ext.woff2',
  'assets/fonts/ibm-plex-sans-latin.woff2',
  'assets/fonts/ibm-plex-sans-latin-ext.woff2',
  'assets/fonts/ibm-plex-sans-cyrillic.woff2',
  'assets/fonts/ibm-plex-sans-cyrillic-ext.woff2',
  'assets/fonts/jetbrains-mono-latin.woff2',
  'assets/fonts/jetbrains-mono-latin-ext.woff2',
  'assets/fonts/jetbrains-mono-cyrillic.woff2',
  'assets/fonts/jetbrains-mono-cyrillic-ext.woff2',
  'assets/flags/es.svg',
  'assets/flags/us.svg',
  'assets/flags/fr.svg',
  'assets/flags/de.svg',
  'assets/flags/it.svg',
  'assets/flags/ru.svg',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png'
];

const NETWORK_FIRST = /\.(html|css|js|json|webmanifest)$|\/$/;
const NEWS = /\/news\.json$/;

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)),
    // La primera copia de las noticias (en la primera visita la página las pide antes de que este
    // service worker la controle). Si falla, se instala igual: las guardará la siguiente vez
    caches.open(NEWS_CACHE).then(cache => cache.add('news.json')).catch(() => {})
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('gpu-universe-') && key !== CACHE && key !== NEWS_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const networkFirst = request.mode === 'navigate' || NETWORK_FIRST.test(url.pathname);
  event.respondWith(networkFirst ? fromNetwork(request, NEWS.test(url.pathname) ? NEWS_CACHE : CACHE) : fromCache(request));
});

async function fromNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  } catch (err) {
    // Sin conexión: la copia guardada (sin tener en cuenta ?gpus=... ni #anclas)
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return markCopy(cached);
    if (request.mode === 'navigate') {
      const notFound = await cache.match('404.html');
      if (notFound) return notFound;
    }
    throw err;
  }
}

// La copia guardada lleva una marca para que la página sepa que no viene de la red
function markCopy(response) {
  const headers = new Headers(response.headers);
  headers.set('X-GPU-Universe-Copy', 'offline');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') cache.put(request, response.clone());
  return response;
}
