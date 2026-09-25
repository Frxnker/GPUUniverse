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

  // Al cambiar de tema se repintan las pistas con los colores nuevos
  new MutationObserver(() => {
    readColors();
    drawBoard();
    if (reduceMotion) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
const USD_TO_EUR = 0.92;

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

// Los precios de data.js mezclan euros ("2499€") y dólares ("~$899"): se normalizan a USD
window.priceToUsd = function(priceStr) {
  const value = parseFloat(String(priceStr || '').replace(/[^0-9.]/g, ''));
  if (isNaN(value)) return NaN;
  return String(priceStr).includes('€') ? value / USD_TO_EUR : value;
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

window.formatPrice = function(priceStr) {
  if (!priceStr || priceStr === 'N/A') return priceStr;

  const symbol = typeof window.t === 'function' ? window.t('ui.currency') : '$';
  const lang = window.currentLang || 'es';

  const usdValue = window.priceToUsd(priceStr);
  if (isNaN(usdValue)) return priceStr;

  const rates = { es: USD_TO_EUR, en: 1, fr: USD_TO_EUR, de: USD_TO_EUR, it: USD_TO_EUR, ru: 92.5 };
  const rate = rates[lang] || 1;
  const converted = Math.round(usdValue * rate);
  const plus = String(priceStr).includes('+') ? '+' : '';

  const locales = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', ru: 'ru-RU' };
  const formatted = converted.toLocaleString(locales[lang] || 'es-ES');

  if (lang === 'ru') return `~${formatted}${plus} ${symbol}`;
  if (lang === 'en') return `~$${formatted}${plus}`;
  return `~${formatted}${symbol}${plus}`;
};

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
  return `
    <article class="gpu-card reveal" data-open-gpu="${esc(gpu.name)}">
      <div class="gpu-card-header">
        <span class="gpu-brand brand-${gpu.brand}">${brandMap[gpu.brand]}</span>
        <span class="gpu-tier tier-${gpu.tier}">${typeof window.t === "function" && window.t("ui.tier_" + gpu.tier) !== "ui.tier_" + gpu.tier ? window.t("ui.tier_" + gpu.tier) : tierMap[gpu.tier]}</span>
      </div>
      <h3 class="gpu-name">${esc(gpu.name)}</h3>
      <div class="gpu-arch">${esc(gpu.arch)}${gpu.year ? ` · ${gpu.year}` : ''}</div>
      <div class="gpu-specs">
        <div class="spec-item"><label>${typeof t === "function" ? window.t("table.vram") : "VRAM"}</label><span>${gpu.vram}</span></div>
        <div class="spec-item"><label>${wrapWithTooltip('TFLOPS FP32', 'tflops')}</label><span>${gpu.tflops}</span></div>
        <div class="spec-item"><label>${typeof t === "function" ? window.t("ui.bw") : "Ancho de Banda"}</label><span>${gpu.bandwidth}</span></div>
        <div class="spec-item"><label>${wrapWithTooltip(typeof window.t === "function" ? window.t("ui.tdp") || "TDP" : "TDP", 'tdp')}</label><span>${gpu.tdp}</span></div>
      </div>
      <div class="gpu-perf-bar">
        <div class="gpu-perf-fill ${gpu.fillColor || TIER_FILL[gpu.tier] || 'fill-purple'}" data-width="${perf}"></div>
      </div>
      <div class="perf-label">
        <span>${perfLabelHtml}</span><span class="perf-value">${perf ? window.formatPerf(perf) + perfSuffix : '—'}</span>
      </div>
      <div class="gpu-card-footer">
        <div class="gpu-price">${window.formatPrice(gpu.price)} <small>${typeof window.t === "function" ? window.t("ui.usd_approx") || "USD aprox." : "USD aprox."}</small></div>
        <button type="button" class="gpu-card-more" aria-label="${esc(window.tr('catalog.view_details', 'Detalles'))}: ${esc(gpu.name)}">${esc(window.tr('catalog.view_details', 'Detalles'))} <span aria-hidden="true">→</span></button>
      </div>
      ${gpu.brand !== 'apple' && gpu.formFactor !== 'laptop' ? '<div class="gpu-card-fingers" aria-hidden="true"></div>' : ''}
    </article>
  `;
}

function buildServerCard(gpu) {
  return `
    <div class="server-card ${gpu.cssClass} reveal">
      <div class="server-meta">
        <span class="server-badge">${gpu.brand.toUpperCase()}</span>
        <div class="server-name">${gpu.name}</div>
        <div class="server-arch">${gpu.arch}</div>
        <div class="server-desc">${typeof gpu.desc === "object" ? gpu.desc[window.currentLang || "es"] : gpu.desc}</div>
      </div>
      <div class="server-specs">
        <div class="server-spec highlight"><label>VRAM</label><span>${gpu.vram}</span></div>
        <div class="server-spec highlight2"><label>${wrapWithTooltip('TFLOPS INT8', 'tflops')}</label><span>${gpu.tflops}</span></div>
        <div class="server-spec highlight3"><label>${typeof t === "function" ? window.t("ui.bw") : "Ancho de Banda"}</label><span>${gpu.bandwidth}</span></div>
        <div class="server-spec"><label>${wrapWithTooltip(typeof window.t === "function" ? window.t("ui.tdp") || "TDP" : "TDP", 'tdp')}</label><span>${gpu.tdp}</span></div>
        <div class="server-spec"><label>${typeof t === "function" ? window.t("ui.interconnect") : "Interconexión"}</label><span>${gpu.interconnect}</span></div>
        <div class="server-spec"><label>${typeof t === "function" ? window.t("ui.use_case") : "Caso de Uso"}</label><span style="font-size:0.8rem">${gpu.use}</span></div>
        <div class="server-spec highlight-price"><label>${typeof window.t === "function" ? window.t("ui.price") : "Precio Estimado"}</label><span>${window.formatPrice(gpu.price)}</span></div>
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
      const tflopsNum = parseFloat(gpu.tflops);

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
          if (!name.includes('M3') && !name.includes('M4')) return false;
        }
      } else if (use === 'video') {
        if (vramNum < 12) return false;
      } else if (use === 'ia') {
        if (gpu.brand !== 'nvidia' && vramNum < 16) return false;
        if (vramNum < 8) return false;
      } else if (use === 'inference' || use === 'hpc') {
        const useStr = (gpu.use || "").toLowerCase();
        if (!useStr.includes(use)) return false;
      }
    }
    return true;
  });
}

const SORT_KEYS = {
  perf: g => parseFloat(g.perf) || 0,
  price: g => window.priceToUsd(g.price) || 0,
  vram: g => window.parseVram(g.vram),
  year: g => parseInt(g.year) || 0,
  // Rendimiento por dólar: solo tiene sentido si la GPU tiene índice y precio
  value: g => {
    const price = window.priceToUsd(g.price);
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
        perf: g.perf || calculatedPerf,
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
  
  if (document.getElementById('compare-table')) renderCompareTable();
  if (document.getElementById('timeline-container')) renderTimeline();
  if (document.getElementById('perf-chart')) renderChart();
  if (document.getElementById('value-chart')) renderValueChart();
  
  // Solo vuelve a observar las tarjetas recién renderizadas
  document.querySelectorAll('.gpu-grid .reveal, .server-showcase .reveal').forEach(el => {
    revealObs.observe(el);
  });
  
  document.querySelectorAll('.gpu-card').forEach(card => barObs.observe(card));
  if (typeof window.applyTranslations === 'function') window.applyTranslations();
};

// ===== COMPARACIÓN DINÁMICA =====
window.gpuA = null;
window.gpuB = null;

function initComparisonSelectors() {
  const inputA = document.getElementById('gpu-a-input');
  const resultsA = document.getElementById('results-a');
  const badgeA = document.getElementById('selected-a');
  
  const inputB = document.getElementById('gpu-b-input');
  const resultsB = document.getElementById('results-b');
  const badgeB = document.getElementById('selected-b');

  if (!inputA || !inputB) return;

  function setupSelector(input, results, badge, side) {
    let timeout;
    input.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const term = e.target.value.toLowerCase().trim();
        if (term.length < 2) {
          results.classList.remove('active');
          return;
        }
        const gpus = getAllGpus();
        const filtered = gpus.filter(g => g.name.toLowerCase().includes(term) || g.arch.toLowerCase().includes(term));
        
        if (filtered.length > 0) {
          results.innerHTML = filtered.slice(0, 6).map(g => `
            <div class="search-result-item" onclick="selectForCompare('${g.name}', '${side}')">
              <div class="sr-info">
                <span class="gpu-brand brand-${g.brand}">${g.brand.toUpperCase()}</span>
                <span class="sr-name">${g.name}</span>
              </div>
              <span class="sr-arch">${g.arch}</span>
            </div>
          `).join('');
          results.classList.add('active');
        } else {
          results.innerHTML = `<div style="padding: 0.5rem; color: #888; font-size: 0.8rem;">No hay resultados</div>`;
          results.classList.add('active');
        }
      }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.compare-select')) results.classList.remove('active');
    });
  }

  setupSelector(inputA, resultsA, badgeA, 'A');
  setupSelector(inputB, resultsB, badgeB, 'B');

  // Valores predeterminados (se pueden fijar desde la URL: compare.html?a=RTX%204090&b=...)
  const params = new URLSearchParams(window.location.search);
  window.selectForCompare(params.get('a') || 'RTX 5090', 'A');
  window.selectForCompare(params.get('b') || 'RX 7900 XTX', 'B');
}

window.selectForCompare = function(name, side) {
  const gpus = getAllGpus();
  const gpu = gpus.find(g => g.name === name) || gpus.find(g => g.name.includes(name));
  if (!gpu) return;

  const sideId = side === 'A' ? 'a' : 'b';
  const input = document.getElementById(`gpu-${sideId}-input`);
  const badge = document.getElementById(`selected-${sideId}`);
  const results = document.getElementById(`results-${sideId}`);

  if (side === 'A') window.gpuA = gpu;
  else window.gpuB = gpu;

  if (input) input.value = '';
  if (badge) {
    badge.innerHTML = `
      <div class="selected-card-inner">
        <span class="gpu-brand brand-${gpu.brand}">${gpu.brand.toUpperCase()}</span>
        <div class="selected-name">${gpu.name}</div>
        <div class="selected-meta">${gpu.vram} · ${gpu.tflops} TFLOPS</div>
      </div>
    `;
    badge.classList.add('active');
  }
  if (results) results.classList.remove('active');

  window.renderCompareTable();
  window.renderChart();
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

window.renderCompareTable = function() {
  const table = document.getElementById('compare-table');
  if (!table) return;

  const selectedGpus = [];
  if (window.gpuA) selectedGpus.push(window.gpuA);
  if (window.gpuB) selectedGpus.push(window.gpuB);

  const displayData = selectedGpus.length > 0 ? selectedGpus : (typeof COMPARE_DATA !== 'undefined' ? COMPARE_DATA.slice(0, 4) : []);
  // data-label: en móvil la tabla se muestra como tarjetas y cada celda lleva su título
  const labels = {
    vram: window.tr('table.vram', 'Memoria'),
    bw: window.tr('table.bw', 'Ancho Banda'),
    price: window.tr('table.price', 'Precio Est.')
  };

  table.innerHTML = `
    <thead>
      <tr>
        <th>${typeof t === "function" ? window.t("table.gpu") : "GPU"}</th>
        <th>${labels.vram}</th>
        <th>${wrapWithTooltip('TFLOPS', 'tflops')}</th>
        <th>${labels.bw}</th>
        <th>${wrapWithTooltip('TDP', 'tdp')}</th>
        <th>${labels.price}</th>
      </tr>
    </thead>
    <tbody>
      ${displayData.map(r => `
        <tr class="reveal visible">
          <td><strong>${r.name}</strong><br><small style="opacity:0.6">${r.brand.toUpperCase()} · ${r.arch}</small></td>
          <td class="mono" data-label="${labels.vram}">${r.vram}</td>
          <td class="mono highlight-cell" data-label="TFLOPS">${parseFloat(r.tflops).toLocaleString()}</td>
          <td class="mono" data-label="${labels.bw}">${r.bandwidth || (r.bw ? r.bw + ' GB/s' : '-')}</td>
          <td class="mono" data-label="TDP">${r.tdp || '-'}</td>
          <td class="mono" data-label="${labels.price}">${window.formatPrice(r.price)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
};

window.renderChart = function() {
  const canvas = document.getElementById('perf-chart');
  if (!canvas) return;

  const selectedGpus = [];
  if (window.gpuA) selectedGpus.push(window.gpuA);
  if (window.gpuB) selectedGpus.push(window.gpuB);

  const displayData = selectedGpus.length > 0 ? selectedGpus : (typeof COMPARE_DATA !== 'undefined' ? COMPARE_DATA.slice(0, 4) : []);

  const labels = displayData.map(g => g.name);
  const tflopsData = displayData.map(g => parseFloat(g.tflops));
  const colors = displayData.map(g => g.brand === 'nvidia' ? 'rgba(118,185,0,0.8)' : (g.brand === 'amd' ? 'rgba(237,28,36,0.8)' : 'rgba(0,212,255,0.8)'));

  // Altura adaptable: más alta cuando hay más barras, pero limitada
  const baseHeight = 300;
  const perBarExtra = Math.max(0, (displayData.length - 2) * 20);
  const { ctx, width, height } = fitCanvas(canvas, Math.min(baseHeight + perBarExtra, 460));
  const compact = width < 440;

  const maxVal = Math.max(...tflopsData, 10);
  const padding = compact
    ? { top: 30, right: 12, bottom: 64, left: 58 }
    : { top: 30, right: 40, bottom: 70, left: 90 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Ancho de barra: límite de 120px y en pantallas grandes con pocas barras no se estira demasiado
  const maxBarW = 120;
  const minBarW = compact ? 24 : 30;
  const barW = Math.max(minBarW, Math.min(maxBarW, chartW / labels.length * 0.45));
  const gap = chartW / labels.length;

  ctx.clearRect(0, 0, width, height);

  // Determina el color del texto según el tema
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Líneas de la cuadrícula
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i;
    const val = Math.round(maxVal * (1 - i / 5));
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = `${compact ? 10 : 11}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(val.toLocaleString(), padding.left - (compact ? 6 : 10), y + 4);
  }

  // Etiqueta TFLOPS en el eje Y
  ctx.save();
  ctx.translate(compact ? 10 : 16, padding.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = textColor;
  ctx.font = "10px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('TFLOPS FP32', 0, 0);
  ctx.restore();

  tflopsData.forEach((val, i) => {
    const x = padding.left + gap * i + (gap - barW) / 2;
    const barH = (val / maxVal) * chartH;
    const y = padding.top + chartH - barH;

    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, colors[i]);
    grad.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [8, 8, 0, 0]);
    else ctx.rect(x, y, barW, barH);
    ctx.fill();

    // Valor encima de la barra
    ctx.fillStyle = isDark ? '#fff' : '#111';
    ctx.font = "bold 12px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(val.toLocaleString(), x + barW / 2, y - 8);

    // Etiqueta: ajusta nombres largos en 2 líneas
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
    ctx.font = `${compact ? 10 : 11}px 'IBM Plex Sans', sans-serif`;
    const words = labels[i].split(' ');
    const midIdx = Math.ceil(words.length / 2);
    const line1 = words.slice(0, midIdx).join(' ');
    const line2 = words.slice(midIdx).join(' ');
    const labelY = padding.top + chartH + 22;
    ctx.fillText(line1, x + barW / 2, labelY);
    if (line2) ctx.fillText(line2, x + barW / 2, labelY + 14);
  });

  // Ejes
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();
};


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
            <div class="arch-node-innovation">${arch.innovation}</div>
            <div class="arch-node-desc">${arch.desc}</div>
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
    gpus = GAMING_GPUS;
  } else if (window.valueCategory === 'workstation') {
    gpus = WORKSTATION_GPUS;
  } else if (window.valueCategory === 'server') {
    gpus = SERVER_GPUS;
  }

  gpus = gpus.filter(g => {
    const price = window.priceToUsd(g.price) || 0;
    const tflops = parseFloat(g.tflops) || 0;
    return price > 0 && tflops > 0 && !g.name.toLowerCase().includes('laptop') && !g.name.toLowerCase().includes('mobile');
  });

  const valueData = gpus.map(g => {
    const price = window.priceToUsd(g.price) || 0;
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
        <div class="value-stats">${d.tflops} TFLOPS · ${window.formatPrice(d.price.toString())}</div>
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
      <p>${typeof item.desc === "object" ? item.desc[window.currentLang || 'es'] : item.desc}</p>
    </div>
  `).join('');
  
  document.querySelectorAll('#timeline-container .reveal').forEach(el => revealObs.observe(el));
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
// ALL_DOMESTIC_GPUS y GAMING_GPUS), se fusionan sus datos en lugar de duplicarlo.
function getAllGpus() {
  if (allGpusCache) return allGpusCache;
  const all = [
    ...(typeof ALL_DOMESTIC_GPUS !== 'undefined' ? ALL_DOMESTIC_GPUS : []),
    ...GAMING_GPUS,
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

function getUpscaler(gpu) {
  const name = gpu.name.toUpperCase();
  const arch = (gpu.arch || '').toLowerCase();
  if (gpu.brand === 'nvidia') return name.includes('RTX') ? 'DLSS 4.5' : 'FSR / XeSS';
  if (gpu.brand === 'amd') return arch.includes('rdna 4') ? 'FSR 4' : 'FSR 3.1';
  if (gpu.brand === 'apple') return 'MetalFX';
  return 'XeSS';
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
  const desc = gpu.desc ? (typeof gpu.desc === 'object' ? gpu.desc[window.currentLang || 'es'] : gpu.desc) : '';

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
      <div class="modal-item"><label>${window.tr('table.vram', 'Memoria VRAM')}</label><span>${esc(gpu.vram || '-')}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip('TFLOPS', 'tflops')}</label><span>${esc(gpu.tflops || '-')}</span></div>
      <div class="modal-item"><label>${window.tr('ui.bw', 'Ancho de Banda')}</label><span>${esc(gpu.bandwidth || gpu.bw || '-')}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip(window.tr('ui.tdp', 'TDP / Consumo'), 'tdp')}</label><span>${esc(gpu.tdp || '-')}</span></div>
      ${gpu.price ? `<div class="modal-item"><label>${window.tr('ui.price', 'Precio Estimado')}</label><span>${window.formatPrice(gpu.price)}</span></div>` : ''}
      <div class="modal-item"><label>${wrapWithTooltip('DLSS / FSR', 'dlss_fsr')}</label><span>${getUpscaler(gpu)}</span></div>
    </div>
    ${desc ? `<p class="modal-desc">${desc}</p>` : ''}
    ${extras.bottom || ''}
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
    if (!trigger || e.target.closest('.has-tooltip')) return;
    if (document.getElementById('gpu-modal')) window.openGpuModal(trigger.dataset.openGpu, trigger);
  });

  // Counters
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
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
  initComparisonSelectors();
  initFilters();
  window.renderAll();
  initNews();
  window.renderArchMap();
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
