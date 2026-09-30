// Servidor estático para revisar la web en local (sin dependencias).
// Imita a GitHub Pages: sirve index.html en las carpetas, 404.html cuando no existe la ruta y
// comprime con gzip los archivos de texto (así las medidas de Lighthouse se parecen a producción).
//   npm start                 -> http://localhost:8080
//   PORT=3000 npm start       -> otro puerto
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8080;
// Como en GitHub Pages, la web también responde bajo su ruta publicada (/GPUUniverse/):
// así la 404, que usa <base href="/GPUUniverse/">, funciona igual en local
const BASE_PATH = new URL(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).homepage).pathname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg)/;

// GitHub Pages distingue mayúsculas y minúsculas; Windows y macOS no. Aquí se exige la misma
// grafía que en el disco para que un "Style.css" falle también en local.
function existsExact(file) {
  if (!fs.existsSync(file)) return false;
  const rel = path.relative(ROOT, file);
  let dir = ROOT;
  for (const part of rel.split(path.sep).filter(Boolean)) {
    if (!fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

function send(req, res, status, file) {
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {})
  });
  const stream = fs.createReadStream(file);
  (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (pathname === BASE_PATH.slice(0, -1)) {
    res.writeHead(301, { Location: BASE_PATH }).end();
    return;
  }
  if (pathname.startsWith(BASE_PATH)) pathname = '/' + pathname.slice(BASE_PATH.length);
  let file = path.join(ROOT, pathname);
  // Nada fuera de la carpeta del proyecto ni carpetas internas
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || /(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(rel)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (existsExact(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (existsExact(file)) return send(req, res, 200, file);
  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) return send(req, res, 404, notFound);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
});

server.listen(PORT, () => {
  console.log(`GPU Universe en http://localhost:${PORT}/`);
});

module.exports = server;
