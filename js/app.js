// ===== ALTERNAR TEMA =====
(function initTheme() {
  const saved = localStorage.getItem('gpu-universe-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', () => {
    const btns = document.querySelectorAll('.theme-toggle');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gpu-universe-theme', next);

        // Vuelve a renderizar los gráficos del canvas para que usen los nuevos colores del tema
        if (typeof window.renderChart === 'function') window.renderChart();
        if (typeof window.renderValueChart === 'function') window.renderValueChart();
      });
    });
  });
})();


// ===== FONDO: PISTAS DE CIRCUITO =====
// Pistas de PCB a 0°/45°/90° con vías en los extremos y pulsos de señal que las recorren.
// Las pistas se dibujan una vez en un lienzo aparte; cada fotograma solo pinta los pulsos.
(function initCircuit() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const board = document.createElement('canvas');
  const bctx = board.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Direcciones en pasos de 45°: índices pares = horizontal/vertical
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  let W = 0, H = 0, dpr = 1, traces = [], pulses = [], colors = {};

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    colors = {
      trace: cs.getPropertyValue('--trace-rgb').trim() || '25, 230, 180',
      copper: cs.getPropertyValue('--copper-rgb').trim() || '240, 162, 74',
      light: document.documentElement.getAttribute('data-theme') === 'light'
    };
  }

  function segmentLength(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  }

  function buildTraces() {
    const step = W < 768 ? 30 : 38;
    const cols = Math.ceil(W / step) + 1;
    const rows = Math.ceil(H / step) + 1;
    const used = new Set();
    const target = Math.round((cols * rows) / (W < 768 ? 26 : 18));
    traces = [];
    for (let n = 0; n < target * 3 && traces.length < target; n++) {
      let x = Math.floor(Math.random() * cols);
      let y = Math.floor(Math.random() * rows);
      if (used.has(x + ',' + y)) continue;
      let dir = Math.floor(Math.random() * 4) * 2;
      const cells = [[x, y]];
      used.add(x + ',' + y);
      const segments = 2 + Math.floor(Math.random() * 3);
      for (let seg = 0; seg < segments; seg++) {
        const len = 2 + Math.floor(Math.random() * 4);
        let blocked = false;
        for (let i = 0; i < len; i++) {
          const nx = x + DIRS[dir][0];
          const ny = y + DIRS[dir][1];
          // Las pistas no se cruzan ni se salen de la pantalla
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || used.has(nx + ',' + ny)) { blocked = true; break; }
          x = nx; y = ny;
          used.add(x + ',' + y);
        }
        cells.push([x, y]);
        if (blocked) break;
        dir = (dir + (Math.random() < 0.5 ? 1 : 7)) % 8;
      }
      const pts = cells.filter((c, i) => i === 0 || c[0] !== cells[i - 1][0] || c[1] !== cells[i - 1][1])
        .map(([cx, cy]) => [cx * step, cy * step]);
      if (pts.length < 2) continue;
      let length = 0;
      for (let i = 1; i < pts.length; i++) length += segmentLength(pts[i - 1], pts[i]);
      if (length < step * 2) continue;
      traces.push({ pts, length, copper: Math.random() < 0.2 });
    }
  }

  function drawBoard() {
    board.width = Math.round(W * dpr);
    board.height = Math.round(H * dpr);
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, W, H);
    bctx.lineCap = 'round';
    bctx.lineJoin = 'round';
    const alpha = colors.light ? 0.2 : 0.14;
    traces.forEach(t => {
      const rgb = t.copper ? colors.copper : colors.trace;
      bctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      bctx.lineWidth = 1.2;
      bctx.beginPath();
      t.pts.forEach(([px, py], i) => (i ? bctx.lineTo(px, py) : bctx.moveTo(px, py)));
      bctx.stroke();
      // Pad cuadrado al inicio y vía (anillo) al final
      const [sx, sy] = t.pts[0];
      bctx.fillStyle = `rgba(${rgb}, ${alpha * 1.5})`;
      bctx.fillRect(sx - 2.5, sy - 2.5, 5, 5);
      const [ex, ey] = t.pts[t.pts.length - 1];
      bctx.beginPath();
      bctx.arc(ex, ey, 3, 0, Math.PI * 2);
      bctx.strokeStyle = `rgba(${rgb}, ${alpha * 1.8})`;
      bctx.stroke();
    });
  }

  function pointAt(t, dist) {
    for (let i = 1; i < t.pts.length; i++) {
      const a = t.pts[i - 1];
      const b = t.pts[i];
      const len = segmentLength(a, b);
      if (dist <= len) {
        const k = dist / len;
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      }
      dist -= len;
    }
    return t.pts[t.pts.length - 1];
  }

  function newPulse(spread) {
    const t = traces[Math.floor(Math.random() * traces.length)];
    return { t, d: spread ? -Math.random() * 400 : -Math.random() * 120, speed: 0.7 + Math.random() * 1.1 };
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(board, 0, 0, W, H);
    const headAlpha = colors.light ? 0.6 : 0.9;
    pulses.forEach((p, idx) => {
      p.d += p.speed;
      if (p.d > p.t.length + 40) { pulses[idx] = newPulse(false); return; }
      // Cabeza brillante con estela que se desvanece
      for (let k = 7; k >= 0; k--) {
        const dd = p.d - k * 5;
        if (dd < 0 || dd > p.t.length) continue;
        const [x, y] = pointAt(p.t, dd);
        const a = headAlpha * (1 - k / 8);
        if (k === 0) {
          ctx.fillStyle = `rgba(${colors.trace}, ${a * 0.25})`;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${colors.trace}, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, k === 0 ? 2 : 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    // Alto de la pantalla completa: así mostrar/ocultar la barra del navegador móvil no obliga a redibujar
    H = Math.max(window.innerHeight, (window.screen && window.screen.height) || 0);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + 'px';
    buildTraces();
    drawBoard();
    const count = reduceMotion || !traces.length ? 0 : (W < 768 ? 8 : 16);
    pulses = Array.from({ length: count }, () => newPulse(true));
  }

  readColors();
  setup();
  draw();

  let lastWidth = W;
  let resizeTimer;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { setup(); if (reduceMotion) draw(); }, 200);
  });

  // Al cambiar de tema o de color de acento se repintan las pistas con los colores nuevos
  new MutationObserver(() => {
    readColors();
    drawBoard();
    if (reduceMotion) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] });
})();

// ===== DESPLAZAMIENTO DE LA BARRA DE NAVEGACIÓN =====
const navbar = document.getElementById('navbar');
if (navbar) {
  let isScrolling = false;
  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        isScrolling = false;
      });
      isScrolling = true;
    }
  });
}

// ===== UTILIDADES =====
const LOCALES = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', ru: 'ru-RU' };
window.currentLocale = () => LOCALES[window.currentLang] || 'es-ES';

// Traduce una clave con texto de respaldo e interpolación de {variables}
window.tr = function(key, fallback, vars) {
  let text = typeof window.t === 'function' ? window.t(key) : key;
  if (!text || text === key) text = fallback !== undefined ? fallback : key;
  if (vars) Object.keys(vars).forEach(k => { text = text.split(`{${k}}`).join(vars[k]); });
  return text;
};

window.escapeHtml = function(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
};

// Texto de un campo multilingüe de data.js ({ es, en, ... }) en el idioma actual
window.localText = function(value) {
  if (!value || typeof value !== 'object') return value || '';
  return value[window.currentLang] || value.es || '';
};

// Precio de lanzamiento en dólares (0 si no hay precio oficial)
window.gpuPrice = function(gpu) {
  return gpu && Number(gpu.msrp) > 0 ? Number(gpu.msrp) : 0;
};

window.parseVram = function(vramStr) {
  const match = String(vramStr || '').match(/(\d+(?:\.\d+)?)\s*GB/i);
  return match ? parseFloat(match[1]) : 0;
};

window.formatPerf = function(perf) {
  const value = Number(perf) || 0;
  if (value >= 10) return String(Math.round(value));
  return value.toLocaleString(window.currentLang || 'es', { maximumFractionDigits: 1 });
};

// Los precios son el PVP de lanzamiento en EE. UU.: se muestran en dólares con el formato del
// idioma ("1.999 US$", "$1,999", "1 999 $"), sin convertir a otras monedas con un cambio inventado.
window.formatPrice = function(usd) {
  const value = Number(usd);
  if (!(value > 0)) return '—';
  return new Intl.NumberFormat(window.currentLocale(), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

// Mes y año de lanzamiento ("mar 2017"); si solo se conoce el año, el año
window.formatLaunch = function(gpu) {
  if (gpu && /^\d{4}-\d{2}$/.test(gpu.launch || '')) {
    const [y, m] = gpu.launch.split('-').map(Number);
    return new Intl.DateTimeFormat(window.currentLocale(), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, 1));
  }
  return gpu && gpu.year ? String(gpu.year) : '';
};

// Precio y su contexto: valor, fecha y, si no hay precio, el motivo
window.priceInfo = function(gpu) {
  const price = window.gpuPrice(gpu);
  if (price) return { value: window.formatPrice(price), date: window.formatLaunch(gpu), missing: false };
  const reason = { laptop: 'ui.price_laptop', 'no-official': 'ui.price_none' }[gpu && gpu.priceNote] || 'ui.price_pending';
  return { value: window.tr(reason), date: '', missing: true };
};

// Valor de una especificación; los datos pendientes de verificar se muestran como "—"
window.specText = function(value, suffix = '') {
  return value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
};

window.PENDING_TITLE = () => window.tr('ui.pending_hint');

// ===== APARICIÓN AL HACER SCROLL =====
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// ===== CONSTRUCCIÓN DE COMPONENTES =====
function wrapWithTooltip(label, defKey) {
  const def = (typeof window.t === 'function') ? window.t('defs.' + defKey) : '';
  if (!def || def === 'defs.' + defKey) {
    return label; // Respaldo: solo renderiza la etiqueta si la traducción aún no está lista
  }
  return `<span class="has-tooltip">${label}<span class="info-icon">i</span><span class="tooltip-box">${def}</span></span>`;
}

const TIER_FILL = { entry: 'fill-green', mid: 'fill-blue', high: 'fill-purple', ultra: 'fill-gold' };

function buildGpuCard(gpu) {
  const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  const tierMap = { entry: 'Entrada', mid: 'Gama Media', high: 'Alto', ultra: 'Ultra' };
  const esc = window.escapeHtml;
  const perf = Math.min(Number(gpu.perf) || 0, 100);
  const perfLabel = gpu.perfLabel || window.tr('ui.relative_perf', 'Rendimiento relativo');
  // gpu.perfHint permite explicar la escala del índice en un tooltip
  const perfLabelHtml = gpu.perfHint
    ? `<span class="has-tooltip">${esc(perfLabel)}<span class="info-icon">i</span><span class="tooltip-box">${gpu.perfHint}</span></span>`
    : esc(perfLabel);
  const perfSuffix = gpu.perfSuffix !== undefined ? gpu.perfSuffix : '%';
  const spec = value => (value === null || value === undefined ? `<span class="spec-pending" title="${esc(window.PENDING_TITLE())}">—</span>` : esc(value));
  const price = window.priceInfo(gpu);
  return `
    <article class="gpu-card reveal" data-open-gpu="${esc(gpu.name)}">
      <div class="gpu-card-header">
        <div class="gpu-card-badges">
          <span class="gpu-brand brand-${gpu.brand}">${brandMap[gpu.brand]}</span>
          <span class="gpu-tier tier-${gpu.tier}">${typeof window.t === "function" && window.t("ui.tier_" + gpu.tier) !== "ui.tier_" + gpu.tier ? window.t("ui.tier_" + gpu.tier) : tierMap[gpu.tier]}</span>
        </div>
        ${typeof window.cardActionsHtml === 'function' ? window.cardActionsHtml(gpu.name) : ''}
      </div>
      <h3 class="gpu-name">${esc(gpu.name)}</h3>
      <div class="gpu-arch">${esc(gpu.arch)}${gpu.year ? ` · ${gpu.year}` : ''}</div>
      <div class="gpu-specs">
        <div class="spec-item"><label>${typeof t === "function" ? window.t("table.vram") : "VRAM"}</label><span>${spec(gpu.vram)}</span></div>
        <div class="spec-item"><label>${wrapWithTooltip('TFLOPS FP32', 'tflops')}</label><span>${spec(gpu.tflops)}</span></div>
        <div class="spec-item"><label>${typeof t === "function" ? window.t("ui.bw") : "Ancho de Banda"}</label><span>${spec(gpu.bandwidth)}</span></div>
        <div class="spec-item"><label>${wrapWithTooltip(typeof window.t === "function" ? window.t("ui.tdp") || "TDP" : "TDP", 'tdp')}</label><span>${spec(gpu.tdp)}</span></div>
      </div>
      <div class="gpu-perf-bar">
        <div class="gpu-perf-fill ${gpu.fillColor || TIER_FILL[gpu.tier] || 'fill-purple'}" data-width="${perf}"></div>
      </div>
      <div class="perf-label">
        <span>${perfLabelHtml}</span><span class="perf-value"${perf ? '' : ` title="${esc(window.tr('catalog.perf_pending'))}"`}>${perf ? window.formatPerf(perf) + perfSuffix : '—'}</span>
      </div>
      <div class="gpu-card-footer">
        <div class="gpu-price${price.missing ? ' is-missing' : ''}">${esc(price.value)}${price.date ? ` <small>${wrapWithTooltip(esc(window.tr('ui.msrp_date', '', { date: price.date })), 'msrp')}</small>` : ''}</div>
        <button type="button" class="gpu-card-more" aria-label="${esc(window.tr('catalog.view_details', 'Detalles'))}: ${esc(gpu.name)}">${esc(window.tr('catalog.view_details', 'Detalles'))} <span aria-hidden="true">→</span></button>
      </div>
      ${gpu.brand !== 'apple' && gpu.formFactor !== 'laptop' ? '<div class="gpu-card-fingers" aria-hidden="true"></div>' : ''}
    </article>
  `;
}

// Cifra de IA de un acelerador (BF16 denso) en TFLOPS
window.formatAi = function(value) {
  return value ? `${Number(value).toLocaleString(window.currentLocale(), { maximumFractionDigits: 1 })} TFLOPS` : '—';
};

// Cargas de trabajo de un acelerador (entrenamiento, inferencia, HPC), traducidas
window.workloadText = function(gpu) {
  return (gpu.workloads || []).map(w => window.tr(`workload.${w}`)).join(' · ');
};

function buildServerCard(gpu) {
  const esc = window.escapeHtml;
  const spec = value => (value === null || value === undefined ? `<span class="spec-pending" title="${esc(window.PENDING_TITLE())}">—</span>` : esc(value));
  return `
    <div class="server-card ${gpu.cssClass} reveal">
      <div class="server-meta">
        <div class="server-meta-top">
          <span class="server-badge">${gpu.brand.toUpperCase()}</span>
          ${typeof window.cardActionsHtml === 'function' ? window.cardActionsHtml(gpu.name) : ''}
        </div>
        <div class="server-name">${esc(gpu.name)}</div>
        <div class="server-arch">${esc(gpu.arch)}${gpu.year ? ` · ${gpu.year}` : ''}${gpu.preliminary ? ` <span class="data-flag">${esc(window.tr('ui.preliminary'))}</span>` : ''}</div>
        <div class="server-desc">${esc(window.localText(gpu.desc))}</div>
        <button type="button" class="gpu-card-more server-card-more" data-open-gpu="${esc(gpu.name)}">${esc(window.tr('catalog.view_details', 'Detalles'))} <span aria-hidden="true">→</span></button>
      </div>
      <div class="server-specs">
        <div class="server-spec highlight"><label>VRAM</label><span>${spec(gpu.vram)}</span></div>
        <div class="server-spec highlight2"><label>${wrapWithTooltip(esc(window.tr('ui.ai_bf16')), 'ai')}</label><span>${window.formatAi(gpu.ai)}</span></div>
        <div class="server-spec"><label>${wrapWithTooltip('TFLOPS FP32', 'tflops')}</label><span>${spec(gpu.tflops)}</span></div>
        <div class="server-spec highlight3"><label>${typeof t === "function" ? window.t("ui.bw") : "Ancho de Banda"}</label><span>${spec(gpu.bandwidth)}</span></div>
        <div class="server-spec"><label>${wrapWithTooltip(typeof window.t === "function" ? window.t("ui.tdp") || "TDP" : "TDP", 'tdp')}</label><span>${spec(gpu.tdp)}</span></div>
        <div class="server-spec"><label>${typeof t === "function" ? window.t("ui.interconnect") : "Interconexión"}</label><span>${spec(gpu.interconnect)}</span></div>
        <div class="server-spec server-spec-wide"><label>${typeof t === "function" ? window.t("ui.use_case") : "Caso de Uso"}</label><span>${esc(window.workloadText(gpu))}</span></div>
      </div>
    </div>
  `;
}

// ===== LÓGICA DE FILTROS =====
window.activeFilters = { brand: 'all', vram: 'all', era: 'all', use: 'all', sort: 'perf', sortDir: 'desc', search: '' };

// Refleja el estado de activeFilters en los botones (clase, aria-pressed y sentido del orden)
window.syncFilterButtons = function() {
  document.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
    const isActive = String(window.activeFilters[btn.dataset.type]) === btn.dataset.value;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
    if (btn.dataset.type === 'sort') {
      if (isActive) btn.dataset.dir = window.activeFilters.sortDir || 'desc';
      else delete btn.dataset.dir;
    }
  });
};

function resetGridLimits() {
  for (let k in window.gridLimits) window.gridLimits[k] = 12;
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      // Pulsar de nuevo el orden activo invierte el sentido
      if (type === 'sort') {
        const isSame = window.activeFilters.sort === value;
        window.activeFilters.sortDir = isSame && window.activeFilters.sortDir !== 'asc' ? 'asc' : 'desc';
      }

      window.activeFilters[type] = value;
      window.syncFilterButtons();
      resetGridLimits();
      window.renderAll();
    });
  });
  window.syncFilterButtons();
}

// Un valor "min-max" filtra por rango (ej. "10-12"); si no, se mantiene la lógica anterior
function matchesRange(value, filterValue) {
  const [min, max] = filterValue.split('-').map(Number);
  return value >= min && value <= max;
}

function applyGpuFilters(gpus) {
  return gpus.filter(gpu => {
    // Filtro de búsqueda (ignora espacios: "4070ti" encuentra "RTX 4070 Ti")
    if (window.activeFilters.search) {
      const term = window.activeFilters.search.toLowerCase().trim();
      const haystack = `${gpu.name} ${gpu.arch || ''} ${gpu.brand}`.toLowerCase();
      const searchMatch = haystack.includes(term) ||
                          haystack.replace(/\s+/g, '').includes(term.replace(/\s+/g, ''));
      if (!searchMatch) return false;
    }

    // Filtro por marca
    if (window.activeFilters.brand !== 'all' && gpu.brand !== window.activeFilters.brand) return false;

    // Filtro por VRAM
    if (window.activeFilters.vram !== 'all') {
      const vramNum = window.parseVram(gpu.vram);
      const targetVram = parseInt(window.activeFilters.vram);
      if (window.activeFilters.vram.includes('-')) {
        if (!matchesRange(vramNum, window.activeFilters.vram)) return false;
      } else if (['24', '32', '48', '80', '141', '192'].includes(window.activeFilters.vram)) {
        if (vramNum < targetVram) return false;
      } else {
        if (vramNum !== targetVram) return false;
      }
    }

    // Filtro por año de lanzamiento
    if (window.activeFilters.era && window.activeFilters.era !== 'all') {
      if (!matchesRange(parseInt(gpu.year) || 0, window.activeFilters.era)) return false;
    }

    // Filtro por uso
    if (window.activeFilters.use !== 'all') {
      const use = window.activeFilters.use;
      const vramNum = window.parseVram(gpu.vram);

      if (use === 'rt') {
        const name = gpu.name.toUpperCase();
        const arch = (gpu.arch || "").toLowerCase();
        if (gpu.brand === 'nvidia') {
          if (!name.includes('RTX')) return false;
        } else if (gpu.brand === 'amd') {
          const isRdna2Plus = arch.includes('rdna 2') || arch.includes('rdna 3') || arch.includes('rdna 4');
          const isRx6000Plus = name.includes('RX 6') || name.includes('RX 7') || name.includes('RX 8') || name.includes('RX 9');
          if (!isRdna2Plus && !isRx6000Plus) return false;
        } else if (gpu.brand === 'intel') {
          if (!name.includes('ARC') && !name.includes('B580')) return false;
        } else if (gpu.brand === 'apple') {
          // Apple tiene ray tracing por hardware desde la familia M3
          if (!/\bM([3-9]|\d{2})\b/.test(name)) return false;
        }
      } else if (use === 'video') {
        if (vramNum < 12) return false;
      } else if (gpu.workloads) {
        // Aceleradores de servidor: se filtra por sus cargas de trabajo declaradas
        const tag = { ia: 'training', inference: 'inference', hpc: 'hpc' }[use];
        if (tag && !gpu.workloads.includes(tag)) return false;
      } else if (use === 'ia') {
        if (gpu.brand !== 'nvidia' && vramNum < 16) return false;
        if (vramNum < 8) return false;
      }
    }
    return true;
  });
}

const SORT_KEYS = {
  perf: g => parseFloat(g.perf) || 0,
  price: g => window.gpuPrice(g),
  vram: g => window.parseVram(g.vram),
  year: g => parseInt(g.year) || 0,
  // Rendimiento por dólar: solo tiene sentido si la GPU tiene índice y precio
  value: g => {
    const price = window.gpuPrice(g);
    return price > 0 ? (parseFloat(g.perf) || 0) / price : 0;
  }
};

function sortGpus(gpus, sortBy, sortDir) {
  const getKey = SORT_KEYS[sortBy];
  if (!getKey) return [...gpus];
  const direction = sortDir === 'asc' ? -1 : 1;
  return [...gpus].sort((a, b) => {
    const keyA = getKey(a);
    const keyB = getKey(b);
    // Los modelos sin dato (precio "Legacy", sin año...) siempre al final
    if ((keyA > 0) !== (keyB > 0)) return keyA > 0 ? -1 : 1;
    return direction * (keyB - keyA);
  });
}


window.gridLimits = {
  gaming: 12,
  workstation: 12,
  mobile: 12,
  server: 12
};

function renderWithPagination(container, sortedItems, limitKey, buildCardFn) {
  const currentLimit = window.gridLimits[limitKey];
  const visibleItems = sortedItems.slice(0, currentLimit);
  
  if (!sortedItems.length) {
    const canReset = typeof window.resetFilters === 'function';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div>
        <p class="empty-state-title">${window.tr('catalog.no_results', window.tr('ui.no_results', 'No se encontraron resultados'))}</p>
        <p class="empty-state-hint">${window.tr('catalog.no_results_hint', '')}</p>
        ${canReset ? `<button type="button" class="btn-load-more" onclick="resetFilters()"><span aria-hidden="true">↺</span> ${window.tr('catalog.reset', 'Restablecer')}</button>` : ''}
      </div>`;
  } else {
    container.innerHTML = visibleItems.map(buildCardFn).join('');
  }
  
  // Gestiona el botón de "Cargar más"
  let btnContainer = document.getElementById(`${container.id}-load-more`);
  if (!btnContainer) {
    btnContainer = document.createElement('div');
    btnContainer.id = `${container.id}-load-more`;
    btnContainer.className = 'load-more-container';
    container.parentNode.insertBefore(btnContainer, container.nextSibling);
  }
  
  if (sortedItems.length > currentLimit) {
    const remaining = window.tr('catalog.remaining', '{n} restantes', { n: sortedItems.length - currentLimit });
    btnContainer.innerHTML = `<button type="button" class="btn-load-more" onclick="loadMore('${limitKey}')">${window.tr('catalog.load_more', 'Ver más GPUs')} <small class="load-more-count">${remaining}</small> <span class="arrow" aria-hidden="true">↓</span></button>`;
  } else {
    btnContainer.innerHTML = '';
  }

  // Observa elementos nuevos para la animación de aparición
  if (window.revealObs) {
    container.querySelectorAll('.reveal').forEach(el => window.revealObs.observe(el));
  }
}

window.loadMore = function(limitKey) {
  window.gridLimits[limitKey] += 12;
  window.renderAll();
};

// ===== LÓGICA DE RENDERIZADO =====


window.renderAll = function() {
  // La página gaming (escritorio + portátiles) se gestiona en js/gaming.js
  if (typeof window.renderGamingPage === 'function') window.renderGamingPage();

  const wg = document.getElementById('workstation-grid');
  if (wg) {
    const maxTflops = Math.max(...WORKSTATION_GPUS.map(g => parseFloat(g.tflops) || 0), 1);
    const prepared = WORKSTATION_GPUS.map(g => {
      const tflops = parseFloat(g.tflops) || 0;
      const calculatedPerf = Math.round((tflops / maxTflops) * 100);
      return {
        ...g,
        perf: calculatedPerf,
        fillColor: g.fillColor || 'fill-blue'
      };
    });
    const filtered = applyGpuFilters(prepared);
    const sorted = sortGpus(filtered, window.activeFilters.sort, window.activeFilters.sortDir);
    renderWithPagination(wg, sorted, 'workstation', buildGpuCard);
  }

  const sg = document.getElementById('server-grid');
  if (sg) {
    const filtered = applyGpuFilters(SERVER_GPUS);
    const sorted = sortGpus(filtered, window.activeFilters.sort, window.activeFilters.sortDir);
    renderWithPagination(sg, sorted, 'server', buildServerCard);
  }
  
  if (typeof window.renderComparePage === 'function') window.renderComparePage();
  if (document.getElementById('timeline-container')) renderTimeline();
  window.renderHallOfFame();
  window.renderArchMap();
  renderDataNotes();
  if (document.getElementById('value-chart')) renderValueChart();
  
  // Solo vuelve a observar las tarjetas recién renderizadas
  document.querySelectorAll('.gpu-grid .reveal, .server-showcase .reveal').forEach(el => {
    revealObs.observe(el);
  });
  
  document.querySelectorAll('.gpu-card').forEach(card => barObs.observe(card));
  if (typeof window.applyTranslations === 'function') window.applyTranslations();
};

// Ajusta el lienzo al ancho disponible y a la densidad de píxeles de la pantalla
// (sin esto las gráficas se ven borrosas en móviles y pantallas retina)
function fitCanvas(canvas, height) {
  const parent = canvas.parentElement;
  const cs = getComputedStyle(parent);
  const width = Math.max(220, parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

// ===== MAPA DE ARQUITECTURA =====
window.renderArchMap = function() {
  const container = document.getElementById('arch-map-container');
  if (!container) return;

  // Agrupa por nivel
  const levels = {};
  ARCHITECTURES_DATA.forEach(arch => {
    if (!levels[arch.level]) levels[arch.level] = [];
    levels[arch.level].push(arch);
  });

  const maxLevel = Math.max(...Object.keys(levels).map(Number));
  
  let html = '';
  for (let l = 1; l <= maxLevel; l++) {
    if (!levels[l]) continue;
    html += `
      <div class="arch-level level-${l}">
        ${levels[l].map(arch => `
          <div class="arch-node brand-${arch.brand}" id="node-${arch.id}" data-parent="${arch.parent || ''}">
            <div class="arch-node-header">
              <span class="arch-year">${arch.year}</span>
              <span class="arch-brand">${arch.brand.toUpperCase()}</span>
            </div>
            <div class="arch-node-name">${arch.name}</div>
            <div class="arch-node-innovation">${window.escapeHtml(window.localText(arch.innovation))}</div>
            <div class="arch-node-desc">${window.escapeHtml(window.localText(arch.desc))}</div>
            ${arch.parent ? `<div class="arch-connector" data-from="node-${arch.parent}" data-to="node-${arch.id}"></div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Vuelve a observar para animaciones
  document.querySelectorAll('#arch-map-container .reveal').forEach(el => revealObs.observe(el));
};

// ===== GRÁFICO DEL VALOR DESTACADO =====
window.valueCategory = 'all';

window.renderValueChart = function() {
  const canvas = document.getElementById('value-chart');
  const listContainer = document.getElementById('value-ranking-list');
  if (!canvas || !listContainer) return;

  let gpus = [];
  if (window.valueCategory === 'all') {
    gpus = getAllGpus();
  } else if (window.valueCategory === 'gaming') {
    gpus = DESKTOP_GPUS;
  } else if (window.valueCategory === 'workstation') {
    gpus = WORKSTATION_GPUS;
  } else if (window.valueCategory === 'server') {
    gpus = SERVER_GPUS;
  }

  gpus = gpus.filter(g => {
    const price = window.gpuPrice(g);
    const tflops = parseFloat(g.tflops) || 0;
    return price > 0 && tflops > 0 && !g.name.toLowerCase().includes('laptop') && !g.name.toLowerCase().includes('mobile');
  });

  const valueData = gpus.map(g => {
    const price = window.gpuPrice(g);
    const tflops = parseFloat(g.tflops) || 0;
    const value = (tflops / price) * 1000; 
    return { name: g.name, brand: g.brand, value: value, price: price, tflops: tflops };
  }).sort((a, b) => b.value - a.value).slice(0, 10);

  // En pantallas estrechas el nombre va encima de cada barra en lugar de a la izquierda
  const compactWidth = canvas.parentElement.clientWidth < 560;
  const rowH = compactWidth ? 46 : 0;
  const chartHeight = compactWidth
    ? valueData.length * rowH + 70
    : Math.min(400, valueData.length * 40 + 100);
  const { ctx, width, height } = fitCanvas(canvas, chartHeight);

  const padding = compactWidth
    ? { top: 16, right: 4, bottom: 54, left: 4 }
    : { top: 40, right: 30, bottom: 60, left: 140 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...valueData.map(v => v.value), 1);

  ctx.clearRect(0, 0, width, height);

  // Colores adaptados al tema
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const labelColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  // Cuadrícula de fondo
  ctx.strokeStyle = gridColor;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const x = padding.left + (chartW * i / 5);
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
  }
  ctx.stroke();

  const barH = compactWidth ? 12 : Math.min(24, chartH / Math.max(1, valueData.length) - 10);
  valueData.forEach((d, i) => {
    const rowY = padding.top + (i * (chartH / valueData.length));
    const y = compactWidth ? rowY + 22 : rowY;
    const barW = Math.max(2, (d.value / maxVal) * (compactWidth ? chartW : chartW - 60));

    const grad = ctx.createLinearGradient(padding.left, 0, padding.left + barW, 0);
    if (d.brand === 'nvidia') { grad.addColorStop(0, '#76b900'); grad.addColorStop(1, '#adff2f'); }
    else if (d.brand === 'amd') { grad.addColorStop(0, '#ed1c24'); grad.addColorStop(1, '#ff6a00'); }
    else { grad.addColorStop(0, '#0070c0'); grad.addColorStop(1, '#00d4ff'); }

    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.beginPath(), ctx.roundRect(padding.left, y, barW, barH, 4), ctx.fill();
    else ctx.fillRect(padding.left, y, barW, barH);

    if (compactWidth) {
      // Nombre a la izquierda y puntuación a la derecha, sobre la barra
      ctx.fillStyle = labelColor;
      ctx.font = "700 12px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(d.name, padding.left, rowY + 14);
      ctx.fillStyle = mutedColor;
      ctx.font = "400 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'right';
      ctx.fillText(`${d.value.toFixed(1)} pts`, width - padding.right, rowY + 14);
      return;
    }

    // Etiqueta del nombre de la GPU (izquierda)
    ctx.fillStyle = labelColor;
    ctx.font = "700 11px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(d.name, padding.left - 15, y + barH/2 + 4);

    // Etiqueta de puntuación (derecha de la barra)
    ctx.textAlign = 'left';
    ctx.font = "400 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = mutedColor;
    ctx.fillText(`${d.value.toFixed(1)} pts`, padding.left + barW + 10, y + barH/2 + 4);
  });

  // Leyenda: en pantallas estrechas se parte en dos líneas por el guion largo
  ctx.fillStyle = mutedColor;
  ctx.textAlign = 'center';
  ctx.font = `400 ${compactWidth ? 10 : 11}px 'IBM Plex Sans', sans-serif`;
  const caption = window.t('value.score_desc');
  const captionParts = compactWidth ? caption.split(' — ') : [caption];
  captionParts.forEach((part, i) => {
    ctx.fillText(part, width / 2, height - 20 - (captionParts.length - 1 - i) * 14);
  });

  listContainer.innerHTML = valueData.map((d, i) => `
    <div class="value-item reveal visible">
      <div class="value-rank">#${i + 1}</div>
      <div class="value-info">
        <div class="value-name">${d.name}</div>
        <div class="value-stats">${d.tflops} TFLOPS · ${window.formatPrice(d.price)}</div>
      </div>
      <div class="value-score">${d.value.toFixed(1)} <small>pts</small></div>
    </div>
  `).join('');
};

// Initializer for Value Filters
function initValueFilters() {
  document.querySelectorAll('.value-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.value-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.valueCategory = btn.dataset.category;
      window.renderValueChart();
    });
  });
}

// ===== TIMELINE =====
window.renderTimeline = function() {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  container.innerHTML = TIMELINE_DATA.map(item => `
    <div class="timeline-item reveal">
      <div class="timeline-dot"></div>
      <div class="timeline-year">${item.year}</div>
      <h4>${item.title}</h4>
      <p>${window.escapeHtml(window.localText(item.desc))}</p>
    </div>
  `).join('');
  
  document.querySelectorAll('#timeline-container .reveal').forEach(el => revealObs.observe(el));
};

// ===== SALÓN DE LA FAMA =====
window.renderHallOfFame = function() {
  const container = document.getElementById('hof-grid');
  if (!container || typeof HALL_OF_FAME === 'undefined') return;
  const esc = window.escapeHtml;
  const base = window.location.pathname.includes('/pages/') ? '../assets/' : 'assets/';
  container.innerHTML = HALL_OF_FAME.map(item => `
    <article class="hof-card">
      <div class="hof-img-wrapper">
        <img src="${base}${item.img}.png" alt="${esc(item.name)}" class="hof-img" loading="lazy" decoding="async">
        <div class="hof-year">${item.year}</div>
      </div>
      <div class="hof-content">
        <h3>${esc(item.name)}</h3>
        <p class="hof-desc">${esc(window.localText(item.desc))}</p>
        <div class="hof-impact">
          <strong>${esc(window.tr('hof.impact'))}</strong> ${esc(window.localText(item.impact))}
        </div>
      </div>
    </article>`).join('');
};

// ===== PERF BAR ANIMATION =====
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.gpu-perf-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
      barObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

// ===== SEARCH & MODAL LOGIC =====
let allGpusCache = null;

// Une todas las listas. Si un modelo aparece en varias (p. ej. "RTX 5090" en
// dos listas), se fusionan sus datos en lugar de duplicarlo.
function getAllGpus() {
  if (allGpusCache) return allGpusCache;
  const all = [
    ...DESKTOP_GPUS,
    ...WORKSTATION_GPUS,
    ...SERVER_GPUS,
    ...(typeof MOBILE_GPUS !== 'undefined' ? MOBILE_GPUS : [])
  ];
  const keyOf = typeof gpuKey === 'function' ? gpuKey : (name => name);
  const merged = new Map();
  all.forEach(item => {
    const key = keyOf(item.name);
    merged.set(key, { ...(merged.get(key) || {}), ...item });
  });
  allGpusCache = Array.from(merged.values());
  return allGpusCache;
}

// Tecnología de reescalado compatible (sin versión: depende de la generación y del juego)
function getUpscaler(gpu) {
  if (gpu.workloads) return '';
  const name = gpu.name.toUpperCase();
  const arch = (gpu.arch || '').toLowerCase();
  if (gpu.brand === 'nvidia') return name.includes('RTX') ? 'DLSS' : 'FSR / XeSS';
  if (gpu.brand === 'amd') return arch.includes('rdna 4') ? 'FSR 4' : 'FSR';
  if (gpu.brand === 'apple') return 'MetalFX';
  return 'XeSS';
}

// Enlaces a las fuentes de los datos de una GPU
function sourcesHtml(gpu) {
  const esc = window.escapeHtml;
  const items = (gpu.src || []).map(s => {
    const known = typeof DATA_SOURCES !== 'undefined' && DATA_SOURCES[s];
    const url = known ? known.url : s;
    if (!/^https:\/\//.test(url)) return '';
    const label = known ? known.name : new URL(url).hostname.replace(/^www\./, '');
    return `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></li>`;
  }).filter(Boolean);
  const reviewed = typeof DATA_META !== 'undefined' ? window.formatDate(DATA_META.reviewed) : '';
  if (!items.length) return `<p class="modal-sources-note">${esc(window.tr('catalog.no_sources'))}</p>`;
  return `
    <details class="modal-sources">
      <summary>${esc(window.tr('catalog.sources'))}</summary>
      <ul>${items.join('')}</ul>
      ${reviewed ? `<p>${esc(window.tr('catalog.reviewed', '', { date: reviewed }))}</p>` : ''}
    </details>`;
}

// Fecha larga en el idioma actual ("29 de septiembre de 2026")
window.formatDate = function(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return isNaN(d) ? '' : new Intl.DateTimeFormat(window.currentLocale(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
};

// Notas de datos de los catálogos: precios orientativos y fecha de revisión
function renderDataNotes() {
  if (typeof DATA_META === 'undefined') return;
  document.querySelectorAll('[data-data-note]').forEach(el => {
    el.textContent = window.tr('catalog.data_note', '', { date: window.formatDate(DATA_META.reviewed) });
  });
}

let modalReturnFocus = null;

// trigger: elemento que abrió el modal, para devolverle el foco al cerrar
window.openGpuModal = function(name, trigger) {
  const gpu = getAllGpus().find(g => g.name === name);
  const modalBody = document.getElementById('modal-body');
  const modalOverlay = document.getElementById('gpu-modal');
  if (!gpu || !modalBody || !modalOverlay) return;

  const esc = window.escapeHtml;
  const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  // Contenido adicional que puede aportar cada página (índice, alternativas...)
  const extras = typeof window.gpuModalExtras === 'function' ? (window.gpuModalExtras(gpu) || {}) : {};
  const comparePath = window.location.pathname.includes('/pages/') ? 'compare.html' : 'pages/compare.html';
  const desc = window.localText(gpu.desc);
  const price = window.priceInfo(gpu);

  modalBody.innerHTML = `
    <div class="modal-header">
      <div class="modal-badges">
        <span class="gpu-brand brand-${gpu.brand}">${brandMap[gpu.brand] || esc(gpu.brand)}</span>
        ${gpu.tier ? `<span class="gpu-tier tier-${gpu.tier}">${window.tr('ui.tier_' + gpu.tier, gpu.tier)}</span>` : ''}
      </div>
      <h2 class="modal-title" id="modal-title">${esc(gpu.name)}</h2>
      <div class="modal-subtitle">${esc(gpu.arch)}${gpu.year ? ` · ${gpu.year}` : ''}</div>
    </div>
    ${extras.top || ''}
    <div class="modal-grid">
      <div class="modal-item"><label>${window.tr('table.vram', 'Memoria VRAM')}</label><span>${esc(window.specText(gpu.vram))}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip('TFLOPS FP32', 'tflops')}</label><span>${esc(window.specText(gpu.tflops))}</span></div>
      ${gpu.ai ? `<div class="modal-item"><label>${wrapWithTooltip(esc(window.tr('ui.ai_bf16')), 'ai')}</label><span>${window.formatAi(gpu.ai)}</span></div>` : ''}
      <div class="modal-item"><label>${window.tr('ui.bw', 'Ancho de Banda')}</label><span>${esc(window.specText(gpu.bandwidth))}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip(window.tr('ui.tdp', 'TDP / Consumo'), 'tdp')}</label><span>${esc(window.specText(gpu.tdp))}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip(esc(window.tr('ui.msrp')), 'msrp')}</label><span>${esc(price.value)}${price.date ? `<small class="modal-item-sub">${esc(price.date)}</small>` : ''}</span></div>
      ${getUpscaler(gpu) ? `<div class="modal-item"><label>${wrapWithTooltip('DLSS / FSR', 'dlss_fsr')}</label><span>${getUpscaler(gpu)}</span></div>` : ''}
      ${gpu.interconnect ? `<div class="modal-item"><label>${window.tr('ui.interconnect')}</label><span>${esc(gpu.interconnect)}</span></div>` : ''}
    </div>
    ${desc ? `<p class="modal-desc">${esc(desc)}</p>` : ''}
    ${extras.bottom || ''}
    ${sourcesHtml(gpu)}
    <div class="modal-actions">
      <a class="btn-modal-compare" href="${comparePath}?a=${encodeURIComponent(gpu.name)}"><span aria-hidden="true">⚖️</span> ${window.tr('catalog.compare', 'Comparar')}</a>
    </div>
  `;

  const alreadyOpen = modalOverlay.classList.contains('active');
  if (!alreadyOpen) {
    const focusableTrigger = trigger && (trigger.matches('button, a[href]') ? trigger : trigger.querySelector('button, a[href]'));
    modalReturnFocus = focusableTrigger || document.activeElement;
  }
  modalOverlay.classList.add('active');
  modalOverlay.setAttribute('aria-hidden', 'false');
  modalOverlay.scrollTop = 0;
  document.body.classList.add('modal-open');
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) closeBtn.focus({ preventScroll: true });
};

window.closeGpuModal = function() {
  const modalOverlay = document.getElementById('gpu-modal');
  if (!modalOverlay || !modalOverlay.classList.contains('active')) return;
  modalOverlay.classList.remove('active');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus({ preventScroll: true });
  modalReturnFocus = null;
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  const closeMenu = () => {
    if (mobileBtn) {
      mobileBtn.classList.remove('active');
      mobileBtn.setAttribute('aria-expanded', 'false');
    }
    if (navLinks) navLinks.classList.remove('active');
    document.body.classList.remove('menu-open');
  };

  if (mobileBtn && navLinks) {
    mobileBtn.setAttribute('aria-expanded', 'false');
    mobileBtn.addEventListener('click', () => {
      const isOpen = mobileBtn.classList.toggle('active');
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
      navLinks.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !e.target.closest('.nav-links') && !e.target.closest('#mobile-menu-btn')) {
        closeMenu();
      }
    });
  }

  // Search
  const searchInput = document.getElementById('gpu-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const term = e.target.value.toLowerCase().trim();
        if (term === window.activeFilters.search) return;
        
        // Update grid dynamically
        window.activeFilters.search = term;
        resetGridLimits();
        if (typeof window.renderAll === 'function') window.renderAll();
      }, 200);
    });
  }

  // Modal
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('gpu-modal');
  if (modalClose) modalClose.addEventListener('click', window.closeGpuModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) window.closeGpuModal();
    });
    // Esc cierra y Tab no sale del modal mientras está abierto
    document.addEventListener('keydown', (e) => {
      if (!modalOverlay.classList.contains('active')) return;
      if (e.key === 'Escape') {
        window.closeGpuModal();
      } else if (e.key === 'Tab') {
        const focusables = modalOverlay.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // Cualquier elemento con data-open-gpu (tarjetas, alternativas del modal) abre el detalle
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-gpu]');
    if (!trigger || e.target.closest('.has-tooltip, [data-card-action]')) return;
    if (document.getElementById('gpu-modal')) window.openGpuModal(trigger.dataset.openGpu, trigger);
  });

  // Cifras de la portada calculadas a partir de los datos
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const all = getAllGpus();
    const families = new Set(all.map(g => String(g.arch || '').split('/')[0].trim()).filter(Boolean));
    // VRAM dedicada máxima (la memoria unificada de Apple no cuenta)
    const maxVram = Math.max(...all.filter(g => !/UMA/.test(g.vram || '')).map(g => window.parseVram(g.vram)));
    const stats = { models: all.length, vram: maxVram, archs: families.size, reviewed: Number(String(DATA_META.reviewed).slice(0, 4)) };
    heroStats.querySelectorAll('[data-stat]').forEach(el => { el.dataset.target = stats[el.dataset.stat]; });
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          document.querySelectorAll('.stat-num').forEach(animateCounter);
          counterObs.disconnect();
        }
      });
    }, { threshold: 0.5 });
    counterObs.observe(heroStats);
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  // Category cards
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.dataset.href;
      if (href) {
        if (href.startsWith('#')) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        else window.location.href = href;
      }
    });
  });

  // Reveal Observer
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // Init
  initFilters();
  window.renderAll();
  initNews();
  initValueFilters();

  // Chart resize: redraw on window resize with debounce
  let chartResizeTimer;
  let lastResizeWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    // En móvil, mostrar/ocultar la barra del navegador cambia solo la altura: no hace falta redibujar
    if (window.innerWidth === lastResizeWidth) return;
    lastResizeWidth = window.innerWidth;
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => {
      if (document.getElementById('perf-chart')) window.renderChart();
      if (document.getElementById('value-chart')) window.renderValueChart();
    }, 150);
  });
});

// ===== NOTICIAS =====
// Feeds comprobados con rss2json (VideoCardz, Guru3D y AnandTech ya no responden)
const NEWS_FEEDS = [
  'https://www.techpowerup.com/rss/news',
  'https://www.tomshardware.com/feeds/tag/gpus',
  'https://wccftech.com/category/hardware/feed/',
  'https://www.pcgamer.com/rss/'
];
const NEWS_SOURCES = { techpowerup: 'TechPowerUp', tomshardware: "Tom's Hardware", wccftech: 'Wccftech', pcgamer: 'PC Gamer' };
const GPU_NEWS_PATTERN = /\b(gpus?|graphics|geforce|radeon|rtx|gtx|arc|nvidia|amd|intel|vram|gddr\d?|dlss|fsr|xess|blackwell|rdna|battlemage|ray tracing)\b/i;
const NEWS_CACHE_KEY = 'gpu-universe-news';
const NEWS_CACHE_MS = 30 * 60 * 1000;
const NEWS_COUNT = 6;

// rss2json devuelve fechas "YYYY-MM-DD HH:MM:SS" en UTC, que Safari no sabe interpretar
function parseNewsDate(dateStr) {
  const date = new Date(String(dateStr || '').replace(' ', 'T') + 'Z');
  return isNaN(date) ? new Date(dateStr) : date;
}

function formatNewsDate(date) {
  if (isNaN(date)) return '';
  const lang = window.currentLang || 'es';
  const hours = (Date.now() - date.getTime()) / 3600000;
  if (hours >= 0 && hours < 48 && typeof Intl.RelativeTimeFormat === 'function') {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    return hours < 1 ? rtf.format(-Math.max(1, Math.round(hours * 60)), 'minute') : rtf.format(-Math.round(hours), 'hour');
  }
  return date.toLocaleDateString(lang, { day: 'numeric', month: 'long' });
}

function htmlToText(html) {
  return (new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
}

function safeUrl(url) {
  return /^https?:\/\//i.test(String(url || '')) ? url : '';
}

async function fetchFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: controller.signal });
    const data = await res.json();
    return data.status === 'ok' ? data.items : [];
  } finally {
    clearTimeout(timer);
  }
}

async function loadNewsItems() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(NEWS_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.time < NEWS_CACHE_MS && cached.items.length) return cached.items;
  } catch (e) { /* sessionStorage no disponible */ }

  // allSettled: si un feed falla, se muestran los demás
  const results = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed));
  const seenTitles = new Set();
  const items = results
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(item => item && item.title && safeUrl(item.link))
    .filter(item => {
      const key = item.title.toLowerCase();
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .sort((a, b) => parseNewsDate(b.pubDate) - parseNewsDate(a.pubDate));

  // Primero las noticias de GPUs; si no hay suficientes, se completa con el resto
  const gpuNews = items.filter(item => GPU_NEWS_PATTERN.test(`${item.title} ${(item.categories || []).join(' ')}`));
  const picked = [...gpuNews, ...items.filter(item => !gpuNews.includes(item))].slice(0, NEWS_COUNT).map(item => {
    let image = item.thumbnail || (item.enclosure && item.enclosure.link) || '';
    if (!image && item.description) {
      const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) image = imgMatch[1];
    }
    const hostname = new URL(item.link).hostname;
    const sourceKey = Object.keys(NEWS_SOURCES).find(k => hostname.includes(k));
    return {
      title: htmlToText(item.title),
      link: item.link,
      image: safeUrl(image),
      date: item.pubDate,
      source: sourceKey ? NEWS_SOURCES[sourceKey] : hostname.replace(/^www\./, ''),
      summary: htmlToText(item.description).slice(0, 160)
    };
  });

  if (picked.length) {
    try { sessionStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ time: Date.now(), items: picked })); } catch (e) { /* sin caché */ }
  }
  return picked;
}

async function initNews() {
  const container = document.getElementById('news-container');
  if (!container) return;
  const esc = window.escapeHtml;

  try {
    const items = await loadNewsItems();
    if (!items.length) throw new Error('No news items found');

    container.innerHTML = items.map(item => {
      const date = parseNewsDate(item.date);
      const summary = item.summary.length >= 160 ? item.summary.replace(/\s+\S*$/, '') + '…' : item.summary;
      const image = item.image
        ? `<img src="${esc(item.image)}" class="news-img" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
        : `<div class="news-img news-img-fallback" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg></div>`;
      return `
        <article class="news-card">
          ${image}
          <div class="news-content">
            <div class="news-date">
              <time datetime="${isNaN(date) ? '' : date.toISOString()}">${esc(formatNewsDate(date))}</time> · <strong>${esc(item.source)}</strong>
            </div>
            <h3><a href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
            <p>${esc(summary)}</p>
            <a href="${esc(item.link)}" target="_blank" rel="noopener noreferrer" class="news-link" tabindex="-1" aria-hidden="true">${window.tr('catalog.news_read_more', 'Leer más')} <span>→</span></a>
          </div>
        </article>
      `;
    }).join('');

    // Si una imagen falla, se sustituye por el marcador genérico
    container.querySelectorAll('img.news-img').forEach(img => {
      img.addEventListener('error', () => {
        const fallback = document.createElement('div');
        fallback.className = 'news-img news-img-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        fallback.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>';
        img.replaceWith(fallback);
      }, { once: true });
    });
  } catch (error) {
    console.warn('Error loading news:', error);
    container.innerHTML = `
      <div class="news-empty">
        <p>${window.tr('catalog.news_error', 'No se pudieron cargar las noticias en este momento.')}</p>
        <button type="button" class="btn-load-more" id="news-retry"><span aria-hidden="true">↻</span> ${window.tr('catalog.news_retry', 'Reintentar')}</button>
      </div>
    `;
    document.getElementById('news-retry')?.addEventListener('click', () => {
      container.innerHTML = '<div class="loading-news"><div class="spinner"></div></div>';
      initNews();
    });
  }
}
