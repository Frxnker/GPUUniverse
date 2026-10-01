// Noticias propias: descarga los feeds de los medios, se queda con las de GPUs y escribe news.json.
// Lo ejecuta la GitHub Action de publicación (.github/workflows/noticias.yml) cada 3 horas, en cada push
// a main y a mano; la web solo lee news.json, del mismo origen, sin servicios externos.
//   npm run news                 -> genera news.json en la raíz (para probar en local)
//   node scripts/news.js --out x -> otro archivo de salida
//
// Reglas:
// - Por noticia: título, enlace (solo https), fuente, fecha ISO (o null) y un extracto corto de texto
//   plano. Nunca HTML del feed ni artículos completos.
// - Si un feed falla o cambia de formato, se anota (en el log de la acción y en failedSources) y se
//   sigue con el resto.
// - Si fallan todos, se conserva el news.json anterior (el publicado o, en local, el que ya hay). Si no
//   hay ninguno válido, termina con error: nunca se publica vacío ni con noticias inventadas.
// Sin dependencias: el lector de RSS/Atom es este archivo.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = (() => {
  const home = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).homepage;
  return home.endsWith('/') ? home : `${home}/`;
})();

const FEEDS = [
  { source: 'TechPowerUp', url: 'https://www.techpowerup.com/rss/news' },
  { source: "Tom's Hardware", url: 'https://www.tomshardware.com/feeds/tag/gpus' },
  { source: 'Wccftech', url: 'https://wccftech.com/category/hardware/feed/' },
  { source: 'PC Gamer', url: 'https://www.pcgamer.com/rss/' }
];
// Mismo criterio que tenía la web: primero las noticias de GPUs; si no llegan, se completa con el resto
const GPU_NEWS_PATTERN = /\b(gpus?|graphics|geforce|radeon|rtx|gtx|arc|nvidia|amd|intel|vram|gddr\d?|dlss|fsr|xess|blackwell|rdna|battlemage|ray tracing)\b/i;
const NEWS_COUNT = 6;
const FORMAT = 1;
const TITLE_MAX = 200;
const EXCERPT_MAX = 160;
const TIMEOUT_MS = 20000;
const MAX_BYTES = 12 * 1024 * 1024; // PC Gamer publica el artículo entero en el feed (~5 MB)
const USER_AGENT = `GPUUniverse-news/1.0 (+${SITE})`;

class FeedError extends Error {}

// ---------- Texto ----------
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', sbquo: '‚', ldquo: '“', rdquo: '”', bdquo: '„', laquo: '«', raquo: '»',
  bull: '•', middot: '·', euro: '€', pound: '£', yen: '¥', cent: '¢', copy: '©', reg: '®', trade: '™',
  deg: '°', times: '×', divide: '÷', plusmn: '±', micro: 'µ', frac12: '½', frac14: '¼', frac34: '¾',
  sup2: '²', sup3: '³', prime: '′', Prime: '″', minus: '−', shy: '', zwj: '', zwnj: '', lrm: '', rlm: '',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í',
  Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', ouml: 'ö', Ouml: 'Ö', auml: 'ä',
  Auml: 'Ä', szlig: 'ß', ccedil: 'ç', egrave: 'è', agrave: 'à', ecirc: 'ê', ocirc: 'ô', iexcl: '¡', iquest: '¿'
};

function decodeEntities(str) {
  return String(str).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]{1,31});/gi, (all, ent) => {
    if (ent[0] === '#') {
      const cp = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      // Sin caracteres de control ni sustitutos sueltos
      const ok = cp === 9 || cp === 10 || cp === 13 || (cp >= 0x20 && cp < 0x7f) || (cp >= 0xa0 && cp <= 0x10ffff && (cp < 0xd800 || cp > 0xdfff));
      return ok ? String.fromCodePoint(cp) : '';
    }
    return Object.prototype.hasOwnProperty.call(NAMED, ent) ? NAMED[ent] : all;
  });
}

// HTML (o texto con entidades) → texto plano de una línea. Se repite por si el feed escapa el HTML
// dos veces; al final no queda nada con forma de etiqueta.
function toText(html) {
  let s = String(html == null ? '' : html);
  for (let i = 0; i < 4; i++) {
    const before = s;
    s = s.replace(/<(script|style|noscript|iframe|object|embed|template|svg|figure|figcaption|table)\b[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?\/?>/gi, ' ')
      .replace(/<![^<>]*>|<\?[^<>]*\?>/g, ' ');
    s = decodeEntities(s);
    if (s === before) break;
  }
  return s.replace(/<(?=[a-z!/?])/gi, '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
}

// Corta en un espacio y añade «…»
function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const atWord = cut.replace(/\s+\S*$/, '');
  return (atWord.length > max / 2 ? atWord : cut).replace(/[\s,;:.\-–—]+$/, '') + '…';
}

function httpsUrl(value) {
  const s = String(value == null ? '' : value).trim();
  if (!s || s.length > 2048) return '';
  try {
    const url = new URL(s);
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.href : '';
  } catch (e) {
    return '';
  }
}

function isoDate(value, now) {
  const s = String(value == null ? '' : value).trim();
  if (!s) return null;
  const t = Date.parse(s);
  // Una fecha imposible o en el futuro (más de 2 días) no se usa para ordenar
  if (!Number.isFinite(t) || t > now.getTime() + 2 * 86400000 || t < Date.UTC(2000, 0, 1)) return null;
  return new Date(t).toISOString();
}

// ---------- Lector de RSS 2.0 / RDF / Atom ----------
// Los bloques CDATA se apartan antes de buscar etiquetas: dentro va HTML (a veces el artículo entero)
// que podría tener sus propias <link>, <title>...
function protectCdata(xml) {
  const parts = [];
  const body = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (all, inner) => `\u0000${parts.push(inner) - 1}\u0000`);
  // Valor crudo de un campo: el CDATA tal cual y el resto con las entidades XML resueltas
  const raw = inner => inner.split(/(\u0000\d+\u0000)/).map(seg => {
    const m = /^\u0000(\d+)\u0000$/.exec(seg);
    return m ? parts[Number(m[1])] : decodeEntities(seg);
  }).join('');
  return { body, raw };
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function elements(block, name) {
  const re = new RegExp(`<${escapeRe(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeRe(name)}\\s*>`, 'gi');
  return [...block.matchAll(re)].map(m => m[1]);
}

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-z][a-z0-9:_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) out[m[1].toLowerCase()] = decodeEntities(m[2] !== undefined ? m[2] : m[3]);
  return out;
}

function parseFeed(xml, { source = '', now = new Date() } = {}) {
  const text = String(xml == null ? '' : xml).replace(/^﻿/, '');
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(text)) throw new FeedError('formato no reconocido (no es RSS ni Atom)');
  const { body, raw } = protectCdata(text);
  const atom = !/<(rss|rdf:RDF)[\s>]/i.test(body);
  const blocks = [...body.matchAll(atom ? /<entry[\s>][\s\S]*?<\/entry\s*>/gi : /<item[\s>][\s\S]*?<\/item\s*>/gi)].map(m => m[0]);
  if (!blocks.length && !/<\/(channel|feed|rdf:RDF)\s*>/i.test(body)) throw new FeedError('formato no reconocido (XML incompleto)');
  const first = (block, names) => {
    for (const name of names) {
      const found = elements(block, name).map(raw).find(v => v.trim());
      if (found !== undefined) return found;
    }
    return '';
  };
  const items = [];
  for (const block of blocks) {
    const title = truncate(toText(first(block, ['title'])), TITLE_MAX);
    let link = '';
    if (atom) {
      const links = [...block.matchAll(/<link\b[^>]*>/gi)].map(m => attrs(m[0]));
      const alt = links.find(a => (!a.rel || a.rel === 'alternate') && a.href) || links.find(a => a.href);
      link = alt ? alt.href : '';
    } else {
      link = toText(first(block, ['link']));
      if (!httpsUrl(link)) {
        const guid = /<guid\b([^>]*)>([\s\S]*?)<\/guid\s*>/i.exec(block);
        if (guid && attrs(guid[1]).ispermalink !== 'false') link = toText(raw(guid[2]));
      }
    }
    link = httpsUrl(link);
    if (!title || !link) continue; // sin título o sin enlace https: fuera
    const date = isoDate(toText(first(block, ['pubDate', 'dc:date', 'published', 'updated', 'dc:modified'])), now);
    const summary = toText(first(block, ['description', 'summary', 'content:encoded', 'dc:content', 'content']))
      .replace(/\s*\[(?:…|\.\.\.)\]\s*$/, '');
    const categories = [
      ...elements(block, 'category').map(v => toText(raw(v))),
      ...[...block.matchAll(/<category\b[^>]*\bterm\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/gi)].map(m => toText(attrs(m[0]).term || ''))
    ].filter(Boolean).slice(0, 30).map(c => c.slice(0, 80));
    items.push({ title, link, source, date, excerpt: truncate(summary, EXCERPT_MAX), categories });
  }
  return items;
}

// ---------- Selección ----------
function buildNews(results, now = new Date()) {
  const seenTitles = new Set();
  const seenLinks = new Set();
  const all = results.flatMap(r => r.items || []).filter(item => {
    const key = item.title.toLowerCase();
    if (seenTitles.has(key) || seenLinks.has(item.link)) return false;
    seenTitles.add(key);
    seenLinks.add(item.link);
    return true;
  });
  // Más recientes primero; las que no tienen fecha, al final (en su orden)
  const sorted = all.map((item, i) => ({ item, i })).sort((a, b) => {
    const ta = a.item.date ? Date.parse(a.item.date) : -Infinity;
    const tb = b.item.date ? Date.parse(b.item.date) : -Infinity;
    return tb - ta || a.i - b.i;
  }).map(x => x.item);
  const gpu = sorted.filter(item => GPU_NEWS_PATTERN.test(`${item.title} ${item.categories.join(' ')}`));
  const picked = [...gpu, ...sorted.filter(item => !gpu.includes(item))].slice(0, NEWS_COUNT);
  if (!picked.length) return null;
  return {
    format: FORMAT,
    generatedAt: now.toISOString(),
    failedSources: results.filter(r => r.error).map(r => ({ source: r.source, reason: r.error })),
    items: picked.map(({ title, link, source, date, excerpt }) => ({ title, link, source, date, excerpt }))
  };
}

// Comprueba que un news.json tiene el formato esperado (para la copia anterior y para las pruebas)
function validateNews(data) {
  const errors = [];
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const noTags = s => !/<[a-z!/?]/i.test(s);
  if (!isObj(data)) return ['no es un objeto'];
  if (data.format !== FORMAT) errors.push(`format ${JSON.stringify(data.format)} (se espera ${FORMAT})`);
  if (typeof data.generatedAt !== 'string' || !Number.isFinite(Date.parse(data.generatedAt))) errors.push('generatedAt no es una fecha');
  if (!Array.isArray(data.failedSources) || data.failedSources.some(f => !isObj(f) || typeof f.source !== 'string' || typeof f.reason !== 'string')) errors.push('failedSources no válido');
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > NEWS_COUNT) errors.push(`items: se esperan entre 1 y ${NEWS_COUNT}`);
  (Array.isArray(data.items) ? data.items : []).forEach((item, i) => {
    if (!isObj(item)) { errors.push(`items[${i}] no es un objeto`); return; }
    const keys = Object.keys(item).sort().join(',');
    if (keys !== 'date,excerpt,link,source,title') errors.push(`items[${i}]: campos ${keys}`);
    if (typeof item.title !== 'string' || !item.title || item.title.length > TITLE_MAX || !noTags(item.title)) errors.push(`items[${i}].title`);
    if (typeof item.link !== 'string' || httpsUrl(item.link) !== item.link) errors.push(`items[${i}].link`);
    if (typeof item.source !== 'string' || !item.source || item.source.length > 60) errors.push(`items[${i}].source`);
    if (item.date !== null && (typeof item.date !== 'string' || !Number.isFinite(Date.parse(item.date)))) errors.push(`items[${i}].date`);
    if (typeof item.excerpt !== 'string' || item.excerpt.length > EXCERPT_MAX || !noTags(item.excerpt)) errors.push(`items[${i}].excerpt`);
  });
  return errors;
}

// ---------- Descarga ----------
async function readCapped(res, max) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const text = await res.text();
    if (Buffer.byteLength(text) > max) throw new FeedError('respuesta demasiado grande');
    return text;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new FeedError('respuesta demasiado grande');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function reasonOf(err) {
  if (err instanceof FeedError) return err.message;
  if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) return 'tiempo de espera agotado';
  return 'error de red';
}

async function fetchText(url, fetchImpl) {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new FeedError(`HTTP ${res.status}`);
  return readCapped(res, MAX_BYTES);
}

async function fetchFeed(feed, fetchImpl, now) {
  try {
    const items = parseFeed(await fetchText(feed.url, fetchImpl), { source: feed.source, now });
    if (!items.length) throw new FeedError('sin noticias válidas (¿ha cambiado el formato?)');
    return { ...feed, items };
  } catch (err) {
    return { ...feed, items: [], error: reasonOf(err) };
  }
}

// Copia anterior: la publicada y, si no se puede descargar, la que haya en el archivo de salida
async function previousNews({ previousUrl, out, fetchImpl }) {
  const candidates = [];
  if (previousUrl) {
    try {
      candidates.push({ from: previousUrl, data: JSON.parse(await fetchText(previousUrl, fetchImpl)) });
    } catch (err) {
      candidates.push({ from: previousUrl, error: reasonOf(err) });
    }
  }
  if (out && fs.existsSync(out)) {
    try {
      candidates.push({ from: out, data: JSON.parse(fs.readFileSync(out, 'utf8')), local: true });
    } catch (err) {
      candidates.push({ from: out, error: 'JSON roto' });
    }
  }
  for (const c of candidates) {
    if (c.data && !validateNews(c.data).length) return c;
  }
  return { error: candidates.map(c => `${c.from}: ${c.error || validateNews(c.data).join('; ')}`).join(' | ') || 'no hay copia anterior' };
}

// Avisos en el log; en GitHub Actions, como anotaciones visibles en el resumen del run
function makeLogger(stream = console) {
  const gh = !!process.env.GITHUB_ACTIONS;
  const esc = s => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  return {
    info: msg => stream.log(msg),
    warn: msg => stream.log(gh ? `::warning title=Noticias::${esc(msg)}` : `⚠ ${msg}`),
    error: msg => stream.log(gh ? `::error title=Noticias::${esc(msg)}` : `✖ ${msg}`)
  };
}

/**
 * Genera el archivo de noticias. Devuelve { status: 'fresh' | 'kept', news } o lanza un error si no hay
 * noticias nuevas ni copia anterior válida (y entonces no escribe nada).
 */
async function run({ feeds = FEEDS, fetchImpl = fetch, out = path.join(ROOT, 'news.json'), previousUrl = `${SITE}news.json`, now = new Date(), log = makeLogger() } = {}) {
  const results = await Promise.all(feeds.map(feed => fetchFeed(feed, fetchImpl, now)));
  results.forEach(r => {
    if (r.error) log.warn(`${r.source}: ${r.error} (${r.url})`);
    else log.info(`✔ ${r.source}: ${r.items.length} noticias leídas`);
  });
  const news = buildNews(results, now);
  if (news) {
    fs.writeFileSync(out, JSON.stringify(news, null, 2) + '\n');
    log.info(`✔ ${path.basename(out)}: ${news.items.length} noticias (${news.items.map(i => i.source).join(', ')})${news.failedSources.length ? ` · fallaron ${news.failedSources.length} de ${feeds.length} fuentes` : ''}`);
    return { status: 'fresh', news };
  }
  const prev = await previousNews({ previousUrl, out, fetchImpl });
  if (!prev.data) {
    log.error(`Han fallado todas las fuentes y no hay copia anterior válida (${prev.error}). No se escribe nada.`);
    throw new Error('sin noticias ni copia anterior');
  }
  if (!prev.local) fs.writeFileSync(out, JSON.stringify(prev.data, null, 2) + '\n');
  log.warn(`Han fallado todas las fuentes: se conserva la copia anterior (${prev.from}, generada el ${prev.data.generatedAt}).`);
  return { status: 'kept', news: prev.data };
}

if (require.main === module) {
  const i = process.argv.indexOf('--out');
  const out = i > 0 ? path.resolve(process.argv[i + 1]) : path.join(ROOT, 'news.json');
  run({ out }).catch(() => { process.exitCode = 1; });
}

module.exports = { FEEDS, GPU_NEWS_PATTERN, NEWS_COUNT, FORMAT, TITLE_MAX, EXCERPT_MAX, decodeEntities, toText, truncate, httpsUrl, parseFeed, buildNews, validateNews, run };
