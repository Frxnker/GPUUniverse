// ===== PÁGINA GAMING (escritorio + portátiles) =====
// Se ejecuta al final del <body>, antes de DOMContentLoaded: así el estado de la URL
// ya está aplicado cuando app.js hace el primer renderAll().
(function initGamingPage() {
  const desktopGrid = document.getElementById('gaming-grid');
  const laptopGrid = document.getElementById('mobile-grid');
  if (!desktopGrid || !laptopGrid) return;

  const DEFAULT_FILTERS = { brand: 'all', vram: 'all', era: 'all', use: 'all', sort: 'perf', sortDir: 'desc', search: '' };
  const FILTER_KEYS = ['brand', 'vram', 'era', 'use', 'sort'];
  const TABS = {
    desktop: { grid: desktopGrid, limitKey: 'gaming', hintKey: 'catalog.perf_index_def' },
    laptop: { grid: laptopGrid, limitKey: 'mobile', hintKey: 'catalog.perf_index_laptop_def' }
  };

  const searchInput = document.getElementById('gpu-search');
  const searchField = document.getElementById('search-field');
  const filtersPanel = document.getElementById('catalog-filters');
  const filtersToggle = document.getElementById('filters-toggle');
  const filtersBadge = document.getElementById('filters-badge');
  const resetBtn = document.getElementById('btn-reset');
  const resultsCount = document.getElementById('results-count');
  const backToTop = document.getElementById('back-to-top');
  const tabButtons = document.querySelectorAll('.catalog-tab');

  let activeTab = 'desktop';
  let pools = null;

  // ----- Datos -----
  function buildPools() {
    const laptopNames = new Set(MOBILE_GPUS.map(g => g.name));
    const proNames = new Set([...WORKSTATION_GPUS, ...SERVER_GPUS].map(g => g.name));
    const desktop = [];
    const laptop = [];
    getAllGpus().forEach(gpu => {
      if (proNames.has(gpu.name)) return;
      const isLaptop = laptopNames.has(gpu.name) || /laptop|mobile/i.test(gpu.name);
      (isLaptop ? laptop : desktop).push(gpu);
    });
    // Las GPUs de portátil se normalizan para que la más potente sea 100
    const maxLaptopPerf = Math.max(...laptop.map(g => Number(g.perf) || 0), 1);
    return {
      desktop: desktop.map(g => ({ ...g, perf: Number(g.perf) || 0 })),
      laptop: laptop.map(g => ({ ...g, perf: Math.round((Number(g.perf) || 0) / maxLaptopPerf * 100) }))
    };
  }

  function getPools() {
    if (!pools) pools = buildPools();
    return pools;
  }

  function withCardLabels(gpu, tab) {
    return {
      ...gpu,
      perfLabel: window.tr('catalog.perf_index', 'Índice gaming'),
      perfHint: window.tr(TABS[tab].hintKey, ''),
      perfSuffix: '',
      // Las GPUs de portátil van soldadas: sin contactos PCIe en la tarjeta
      formFactor: tab
    };
  }

  // ----- Estado de filtros -----
  function countActiveFilters() {
    const f = window.activeFilters;
    return ['brand', 'vram', 'era', 'use'].filter(k => f[k] !== 'all').length + (f.search ? 1 : 0);
  }

  function isDefaultState() {
    const f = window.activeFilters;
    return countActiveFilters() === 0 && f.sort === DEFAULT_FILTERS.sort && f.sortDir === DEFAULT_FILTERS.sortDir;
  }

  window.resetFilters = function() {
    Object.assign(window.activeFilters, DEFAULT_FILTERS);
    searchInput.value = '';
    searchField.classList.remove('has-value');
    resetGridLimits();
    window.syncFilterButtons();
    window.renderAll();
  };

  // ----- URL compartible (?q=4070&brand=nvidia&tab=laptop...) -----
  function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const f = window.activeFilters;
    FILTER_KEYS.forEach(key => {
      const value = params.get(key);
      if (value && document.querySelector(`.filter-btn[data-type="${key}"][data-value="${CSS.escape(value)}"]`)) f[key] = value;
    });
    if (params.get('dir') === 'asc') f.sortDir = 'asc';
    const query = params.get('q');
    if (query) {
      searchInput.value = query;
      f.search = query.toLowerCase().trim();
    }
    // Compatibilidad con el antiguo ancla #mobile
    const wantsLaptop = params.get('tab') === 'laptop' || /^#(mobile|laptop)$/.test(window.location.hash);
    setTab(wantsLaptop ? 'laptop' : 'desktop', false);
  }

  function writeStateToUrl() {
    const f = window.activeFilters;
    const params = new URLSearchParams();
    if (activeTab !== 'desktop') params.set('tab', activeTab);
    if (f.search) params.set('q', f.search);
    FILTER_KEYS.forEach(key => {
      if (f[key] !== DEFAULT_FILTERS[key]) params.set(key, f[key]);
    });
    if (f.sortDir !== DEFAULT_FILTERS.sortDir) params.set('dir', f.sortDir);
    const query = params.toString();
    const hash = /^#(mobile|laptop)$/.test(window.location.hash) ? '' : window.location.hash;
    history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + hash);
  }

  // ----- Pestañas -----
  function setTab(tab, shouldRender = true) {
    activeTab = tab;
    tabButtons.forEach(btn => {
      const selected = btn.dataset.tab === tab;
      btn.setAttribute('aria-selected', selected);
      btn.tabIndex = selected ? 0 : -1;
    });
    Object.keys(TABS).forEach(key => {
      document.getElementById(`panel-${key}`).hidden = key !== tab;
    });
    // Apple solo tiene GPUs de portátil en el catálogo
    document.querySelectorAll('[data-only-tab]').forEach(btn => {
      btn.hidden = btn.dataset.onlyTab !== tab;
      if (btn.hidden && window.activeFilters[btn.dataset.type] === btn.dataset.value) {
        window.activeFilters[btn.dataset.type] = 'all';
      }
    });
    window.syncFilterButtons();
    if (shouldRender) {
      resetGridLimits();
      window.renderAll();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
    // Navegación con flechas entre pestañas (patrón ARIA de tabs)
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const next = activeTab === 'desktop' ? 'laptop' : 'desktop';
      setTab(next);
      document.getElementById(`tab-${next}`).focus();
    });
  });

  // ----- Renderizado (lo llama window.renderAll de app.js) -----
  window.renderGamingPage = function() {
    const { desktop, laptop } = getPools();
    const f = window.activeFilters;
    const results = {
      desktop: sortGpus(applyGpuFilters(desktop), f.sort, f.sortDir),
      laptop: sortGpus(applyGpuFilters(laptop), f.sort, f.sortDir)
    };

    document.getElementById('count-desktop').textContent = results.desktop.length;
    document.getElementById('count-laptop').textContent = results.laptop.length;

    const { grid, limitKey } = TABS[activeTab];
    const list = results[activeTab].map(gpu => withCardLabels(gpu, activeTab));
    renderWithPagination(grid, list, limitKey, buildGpuCard);

    const shown = Math.min(list.length, window.gridLimits[limitKey]);
    resultsCount.innerHTML = list.length
      ? window.tr('catalog.showing', 'Mostrando <strong>{shown}</strong> de <strong>{total}</strong> GPUs', { shown, total: list.length })
      : '';

    const activeCount = countActiveFilters();
    filtersBadge.hidden = activeCount === 0;
    filtersBadge.textContent = activeCount;
    resetBtn.hidden = isDefaultState();

    writeStateToUrl();
  };

  // ----- Cabecera: estadísticas calculadas a partir de los datos -----
  function renderStats() {
    const { desktop, laptop } = getPools();
    const years = [...desktop, ...laptop].map(g => parseInt(g.year)).filter(Boolean);
    const strongest = desktop.reduce((best, gpu) => (gpu.perf > best.perf ? gpu : best), desktop[0]);
    document.getElementById('stat-desktop').textContent = desktop.length;
    document.getElementById('stat-laptop').textContent = laptop.length;
    document.getElementById('stat-years').textContent = `${Math.min(...years)}–${Math.max(...years)}`;
    document.getElementById('stat-top').textContent = strongest ? strongest.name : '—';
  }

  // ----- Detalle en el modal: índice, puesto y alternativas -----
  window.gpuModalExtras = function(gpu) {
    const allPools = getPools();
    const tab = allPools.desktop.some(g => g.name === gpu.name) ? 'desktop'
      : (allPools.laptop.some(g => g.name === gpu.name) ? 'laptop' : null);
    if (!tab) return {};

    const ranked = allPools[tab].filter(g => g.perf > 0).sort((a, b) => b.perf - a.perf);
    const current = ranked.find(g => g.name === gpu.name);
    if (!current) return {};

    const esc = window.escapeHtml;
    const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
    const fill = { entry: 'fill-green', mid: 'fill-blue', high: 'fill-purple', ultra: 'fill-gold' }[current.tier] || 'fill-purple';
    const similar = ranked
      .filter(g => g !== current)
      .sort((a, b) => Math.abs(a.perf - current.perf) - Math.abs(b.perf - current.perf))
      .slice(0, 4)
      .sort((a, b) => b.perf - a.perf);

    return {
      top: `
        <div class="modal-perf">
          <div class="modal-perf-head">
            <span class="has-tooltip">${esc(window.tr('catalog.perf_index', 'Índice gaming'))}<span class="info-icon">i</span><span class="tooltip-box">${window.tr(TABS[tab].hintKey, '')}</span></span>
            <strong>${window.formatPerf(current.perf)}<small> / 100</small></strong>
          </div>
          <div class="gpu-perf-bar"><div class="gpu-perf-fill ${fill}" style="width: ${Math.min(current.perf, 100)}%"></div></div>
          <div class="modal-perf-rank">${window.tr('catalog.perf_rank', 'Puesto <strong>#{rank}</strong> de {total} en rendimiento', { rank: ranked.indexOf(current) + 1, total: ranked.length })}</div>
        </div>`,
      bottom: similar.length ? `
        <div class="modal-similar">
          <h3>${esc(window.tr('catalog.similar', 'Alternativas con rendimiento similar'))}</h3>
          <div class="similar-list">
            ${similar.map(g => `
              <button type="button" class="similar-item" data-open-gpu="${esc(g.name)}">
                <span class="gpu-brand brand-${g.brand}">${brandMap[g.brand] || esc(g.brand)}</span>
                <span class="similar-name">${esc(g.name)}</span>
                <span class="similar-meta">${window.formatPerf(g.perf)} · ${window.formatPrice(g.price) || '—'}</span>
              </button>`).join('')}
          </div>
        </div>` : ''
    };
  };

  // ----- Controles -----
  function updateSearchField() {
    searchField.classList.toggle('has-value', searchInput.value.length > 0);
  }
  searchInput.addEventListener('input', updateSearchField);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchInput.value) {
      e.preventDefault();
      document.getElementById('search-clear').click();
    }
  });
  document.getElementById('search-clear').addEventListener('click', () => {
    searchInput.value = '';
    updateSearchField();
    // Dispara el manejador de búsqueda de app.js (con su debounce)
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.focus();
  });

  filtersToggle.addEventListener('click', () => {
    const isOpen = filtersPanel.classList.toggle('is-open');
    filtersToggle.setAttribute('aria-expanded', isOpen);
  });

  resetBtn.addEventListener('click', window.resetFilters);

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.nav-logo')?.focus({ preventScroll: true });
  });
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      backToTop.classList.toggle('visible', window.scrollY > 900);
      scrollTicking = false;
    });
  }, { passive: true });

  // Etiquetas accesibles traducidas (no se pueden poner con data-i18n)
  function translateAriaLabels() {
    document.getElementById('search-clear').setAttribute('aria-label', window.tr('catalog.clear_search', 'Borrar búsqueda'));
    backToTop.setAttribute('aria-label', window.tr('catalog.back_to_top', 'Volver arriba'));
    document.getElementById('modal-close').setAttribute('aria-label', window.tr('catalog.close', 'Cerrar'));
  }

  // renderAll() llama a window.applyTranslations al final, también tras cambiar de idioma
  const originalApplyTranslations = window.applyTranslations;
  if (typeof originalApplyTranslations === 'function') {
    window.applyTranslations = function() {
      originalApplyTranslations();
      translateAriaLabels();
    };
  }

  readStateFromUrl();
  updateSearchField();
  renderStats();
  translateAriaLabels();
})();
