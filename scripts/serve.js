// Servidor estático para revisar la web en local (sin dependencias).
// Imita a GitHub Pages: sirve index.html en las carpetas y 404.html cuando no existe la ruta.
//   npm start                 -> http://localhost:8080
//   PORT=3000 npm start       -> otro puerto
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8080;

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

function send(res, status, file) {
  res.writeHead(status, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    res.writeHead(400).end('Bad request');
    return;
  }
  let file = path.join(ROOT, pathname);
  // Nada fuera de la carpeta del proyecto ni carpetas internas
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || /(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(rel)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (fs.existsSync(file)) return send(res, 200, file);
  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) return send(res, 404, notFound);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
});

server.listen(PORT, () => {
  console.log(`GPU Universe en http://localhost:${PORT}/`);
});

module.exports = server;
