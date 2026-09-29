// ===== FUNCIONES GLOBALES =====
// Presentes en todas las páginas: favoritos, lista de comparación, historial, buscador
// rápido (Ctrl+K), panel "Tu espacio", avisos, compartir, enlaces directos (?gpu=) y la
// interfaz de la progresión (chip de nivel y avisos de XP). Necesita app.js y progress.js.
(function () {
  const esc = s => window.escapeHtml(s);
  const T = (key, vars) => window.tr(key, undefined, vars);
  const Progress = window.GPUProgress;

  // Plurales según el idioma (el ruso tiene tres formas): base_one, base_few, base_many, base_other
  window.trPlural = function (base, n) {
    let category = 'other';
    try { category = new Intl.PluralRules(window.currentLang || 'es').select(n); } catch (e) { /* por defecto */ }
    const key = `${base}_${category}`;
    const text = window.tr(key, undefined, { n });
    return text === key ? window.tr(`${base}_other`, undefined, { n }) : text;
  };

  // ---------- Rutas y página actual ----------
  const IN_PAGES = /\/pages\//.test(window.location.pathname);
  const FILE = (window.location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  const PAGE_ID = FILE === 'index' ? 'home' : FILE;

  function pageHref(page) {
    if (page === 'home') return IN_PAGES ? '../index.html' : 'index.html';
    return IN_PAGES ? `${page}.html` : `pages/${page}.html`;
  }

  // ---------- Iconos (SVG de línea, heredan el color del texto) ----------
  const svg = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const ICONS = {
    heart: svg('<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.4 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>'),
    compare: svg('<path d="M12 3v18M6 21h12M4 7h16"/><path d="m4 7-2.5 6a2.5 2.5 0 0 0 5 0zM20 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>'),
    share: svg('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 13.3 7.2 4.3M15.6 6.4l-7.2 4.3"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    trophy: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z"/>'),
    star: svg('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>'),
    flame: svg('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.6 2.6-5.5 3.7-8.7.3-.8 1.3-1 1.8-.3C12.6 8 13 9.5 13 11c1-.6 1.6-1.8 1.7-3 .1-.7.9-1 1.4-.5 1.5 1.6 2.4 3.9 2.4 6.5 0 3.4-2.6 7-6.5 7z"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
    map: svg('<path d="m9 4-6 2.5v14L9 18l6 2.5 6-2.5v-14L15 6.5zM9 4v14M15 6.5v14"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>'),
    cube: svg('<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>'),
    tool: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.4-.6-.6-2.4z"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
    contrast: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>'),
    crown: svg('<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>'),
    dice: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>'),
    keyboard: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
    chip: svg('<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    history: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7.5V12l3 2"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    gamepad: svg('<path d="M6 9h12a4 4 0 0 1 3.9 4.9l-.8 3.4a2.5 2.5 0 0 1-4.3 1.1L14.6 16H9.4l-2.2 2.4a2.5 2.5 0 0 1-4.3-1.1l-.8-3.4A4 4 0 0 1 6 9z"/><path d="M8 11.5v3M6.5 13h3M15.5 12.5h.01M17.5 14.5h.01"/>'),
    monitor: svg('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>'),
    server: svg('<rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>'),
    home: svg('<path d="M3 11 12 3l9 8M5 9.5V21h14V9.5"/>'),
    hourglass: svg('<path d="M6 3h12M6 21h12M7 3c0 5 5 5 5 9s-5 4-5 9M17 3c0 5-5 5-5 9s5 4 5 9"/>'),
    sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>')
  };
  window.GPUIcons = ICONS;

  // ---------- Datos: categorías y grupos de GPUs ----------
  let poolsCache = null;
  // desktop (con índice gaming), laptop (índice normalizado a 100), workstation, server
  window.getGpuPools = function () {
    if (poolsCache) return poolsCache;
    const laptopNames = new Set((typeof MOBILE_GPUS !== 'undefined' ? MOBILE_GPUS : []).map(g => g.name));
    const workNames = new Set((typeof WORKSTATION_GPUS !== 'undefined' ? WORKSTATION_GPUS : []).map(g => g.name));
    const serverNames = new Set((typeof SERVER_GPUS !== 'undefined' ? SERVER_GPUS : []).map(g => g.name));
    const desktop = [], laptop = [], workstation = [], server = [];
    getAllGpus().forEach(gpu => {
      if (serverNames.has(gpu.name)) server.push(gpu);
      else if (workNames.has(gpu.name)) workstation.push(gpu);
      else if (laptopNames.has(gpu.name) || /laptop|mobile/i.test(gpu.name)) laptop.push(gpu);
      else desktop.push(gpu);
    });
    const maxLaptop = Math.max(...laptop.map(g => Number(g.perf) || 0), 1);
    poolsCache = {
      desktop: desktop.map(g => ({ ...g, perf: Number(g.perf) || 0 })),
      laptop: laptop.map(g => ({ ...g, perf: Math.round((Number(g.perf) || 0) / maxLaptop * 100) })),
      workstation,
      server
    };
    return poolsCache;
  };

  window.gpuCategory = function (name) {
    const pools = window.getGpuPools();
    return ['desktop', 'laptop', 'workstation', 'server'].find(cat => pools[cat].some(g => g.name === name)) || 'desktop';
  };

  // Índice gaming comparable (solo GPUs de escritorio; el de portátiles tiene otra escala)
  window.gpuGamingIndex = function (name) {
    const gpu = window.getGpuPools().desktop.find(g => g.name === name);
    return gpu && gpu.perf ? gpu.perf : 0;
  };

  window.findGpu = function (name) {
    return getAllGpus().find(g => g.name === name) || null;
  };

  window.parseTdp = function (tdp) {
    const numbers = String(tdp || '').match(/\d+(?:\.\d+)?/g);
    return numbers ? Math.max(...numbers.map(Number)) : 0;
  };

  const normalize = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Búsqueda tolerante: "4070ti", "rx7900", "blackwell" o "amd 16gb"
  window.searchGpus = function (query, pool = getAllGpus(), limit = 8) {
    const q = normalize(query).trim();
    if (!q) return [];
    const compactQ = q.replace(/[\s\-]+/g, '');
    const tokens = q.split(/\s+/);
    const results = [];
    pool.forEach(gpu => {
      const name = normalize(gpu.name);
      const compactName = name.replace(/[\s\-]+/g, '');
      const haystack = `${name} ${normalize(gpu.arch)} ${gpu.brand} ${normalize(gpu.vram)} ${gpu.year || ''}`;
      let score;
      if (compactName === compactQ || compactName === 'radeon' + compactQ) score = 100;
      else if (name.startsWith(q) || compactName.startsWith(compactQ) || compactName.startsWith('radeon' + compactQ)) score = 80;
      else if (compactName.includes(compactQ)) score = 60;
      else if (tokens.every(t => haystack.includes(t))) score = 40;
      else return;
      // Desempates: más reciente y nombre más corto primero
      score += (parseInt(gpu.year) || 2000) / 100000 - name.length / 1000;
      results.push([score, gpu]);
    });
    return results.sort((a, b) => b[0] - a[0]).slice(0, limit).map(r => r[1]);
  };

  const BRAND = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  window.brandBadge = gpu => `<span class="gpu-brand brand-${gpu.brand}">${BRAND[gpu.brand] || esc(gpu.brand)}</span>`;

  // Línea resumen para listas: categoría · VRAM · índice
  window.gpuMetaLine = function (gpu) {
    const cat = T(`fx.cat_${window.gpuCategory(gpu.name)}`);
    const perf = window.gpuGamingIndex(gpu.name);
    return [cat, gpu.vram, perf ? `${T('catalog.perf_index')} ${window.formatPerf(perf)}` : ''].filter(Boolean).join(' · ');
  };

  // ---------- Selector de GPU con autocompletado (comparador y herramientas) ----------
  // keepValue: el campo muestra la GPU elegida (herramientas); si no, se vacía (comparador)
  window.createGpuPicker = function ({ input, list, pool, onSelect, limit = 7, exclude = () => false, keepValue = false }) {
    let items = [];
    let active = -1;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function highlight() {
      list.querySelectorAll('[data-i]').forEach(opt => {
        const on = Number(opt.dataset.i) === active;
        opt.classList.toggle('is-active', on);
        opt.setAttribute('aria-selected', on);
        if (on) opt.scrollIntoView({ block: 'nearest' });
      });
      if (active >= 0) input.setAttribute('aria-activedescendant', `${list.id}-${active}`);
    }
    function render() {
      const q = input.value.trim();
      if (!q) { close(); return; }
      items = window.searchGpus(q, pool(), limit + 6).filter(g => !exclude(g)).slice(0, limit);
      list.innerHTML = items.length
        ? items.map((g, i) => `
            <div role="option" id="${list.id}-${i}" class="picker-item" data-i="${i}">
              ${window.brandBadge(g)}
              <span class="picker-name">${esc(g.name)}</span>
              <span class="picker-meta">${esc(window.gpuMetaLine(g))}</span>
            </div>`).join('')
        : `<div class="picker-empty">${T('fx.search_empty', { q: esc(q) })}</div>`;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = items.length ? 0 : -1;
      highlight();
    }
    function choose(gpu) {
      if (!gpu) return;
      input.value = keepValue ? gpu.name : '';
      close();
      onSelect(gpu);
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if (!keepValue && input.value.trim()) render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.hidden) { render(); return; }
        if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        highlight();
      } else if (e.key === 'Enter') {
        if (!list.hidden && items[active]) { e.preventDefault(); choose(items[active]); }
      } else if (e.key === 'Escape' && !list.hidden) {
        e.stopPropagation();
        close();
      }
    });
    // mousedown en la lista no quita el foco al campo (así el clic llega a la opción)
    list.addEventListener('mousedown', e => e.preventDefault());
    list.addEventListener('click', e => {
      const opt = e.target.closest('[data-i]');
      if (opt) choose(items[Number(opt.dataset.i)]);
    });
    input.addEventListener('blur', () => setTimeout(close, 120));
    return {
      setValue(name) { input.value = name || ''; },
      close
    };
  };

  // ---------- Almacén persistente: favoritos, comparación, recientes ----------
  const Store = (function () {
    const KEYS = { favorites: 'gpu-universe-favorites', compare: 'gpu-universe-compare', recent: 'gpu-universe-recent' };
    const LIMITS = { favorites: 300, compare: 4, recent: 12 };
    let known = null;
    const isKnown = name => {
      if (!known) known = new Set(getAllGpus().map(g => g.name));
      return known.has(name);
    };
    const read = list => {
      try {
        const value = JSON.parse(localStorage.getItem(KEYS[list]) || '[]');
        return Array.isArray(value) ? value.filter(n => typeof n === 'string' && isKnown(n)).slice(0, LIMITS[list]) : [];
      } catch (e) { return []; }
    };
    const data = { favorites: read('favorites'), compare: read('compare'), recent: read('recent') };
    const emitChange = list => window.dispatchEvent(new CustomEvent('store:change', { detail: { list } }));
    const write = list => {
      try { localStorage.setItem(KEYS[list], JSON.stringify(data[list])); } catch (e) { /* sin persistencia */ }
      emitChange(list);
    };
    // Mantiene sincronizadas varias pestañas abiertas
    window.addEventListener('storage', e => {
      const list = Object.keys(KEYS).find(k => KEYS[k] === e.key);
      if (!list) return;
      data[list] = read(list);
      emitChange(list);
    });
    return {
      LIMITS,
      get: list => [...data[list]],
      has: (list, name) => data[list].includes(name),
      count: list => data[list].length,
      // Devuelve false si la lista está llena (comparación: máximo 4)
      add(list, name) {
        if (!isKnown(name)) return false;
        if (list === 'compare') {
          if (data.compare.includes(name)) return true;
          if (data.compare.length >= LIMITS.compare) return false;
          data.compare.push(name);
        } else {
          data[list] = [name, ...data[list].filter(n => n !== name)].slice(0, LIMITS[list]);
        }
        write(list);
        return true;
      },
      remove(list, name) {
        data[list] = data[list].filter(n => n !== name);
        write(list);
      },
      set(list, names) {
        data[list] = [...new Set(names.filter(isKnown))].slice(0, LIMITS[list]);
        write(list);
      },
      clear(list) {
        data[list] = [];
        write(list);
      }
    };
  })();
  window.GPUStore = Store;

  // ---------- Avisos (toasts) ----------
  const toastStack = document.createElement('div');
  toastStack.className = 'toast-stack';
  toastStack.setAttribute('role', 'status');
  toastStack.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastStack);

  function toast({ icon = ICONS.check, title = '', text = '', tone = 'info', timeout = 3200, actionsHtml = '', className = '' }) {
    const el = document.createElement('div');
    el.className = `toast toast-${tone} ${className}`.trim();
    el.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-body">
        ${title ? `<strong class="toast-title">${title}</strong>` : ''}
        ${text ? `<span class="toast-text">${text}</span>` : ''}
        ${actionsHtml ? `<div class="toast-actions">${actionsHtml}</div>` : ''}
      </div>
      <button type="button" class="toast-close" aria-label="${esc(T('catalog.close'))}">${ICONS.close}</button>`;
    toastStack.appendChild(el);
    // Máximo 4 avisos a la vez
    while (toastStack.children.length > 4) toastStack.firstElementChild.remove();
    const dismiss = () => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector('.toast-close').addEventListener('click', dismiss);
    let timer = setTimeout(dismiss, timeout);
    // Se pausa mientras el ratón está encima
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1500); });
    requestAnimationFrame(() => el.classList.add('is-visible'));
    return { el, dismiss, restart() { clearTimeout(timer); timer = setTimeout(dismiss, timeout); } };
  }
  window.showToast = toast;

  // ---------- Capas modales propias (panel, buscador, atajos): foco y Esc ----------
  const layers = [];
  function openLayer(el, focusTarget) {
    if (layers.some(l => l.el === el)) return;
    layers.push({ el, returnFocus: document.activeElement });
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('layer-open');
    requestAnimationFrame(() => {
      el.classList.add('is-open');
      (focusTarget || el.querySelector('input, button, a[href]'))?.focus({ preventScroll: true });
    });
  }
  function closeLayer(el, restoreFocus = true) {
    const idx = layers.findIndex(l => l.el === el);
    if (idx === -1) return;
    const [layer] = layers.splice(idx, 1);
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, 220);
    if (!layers.length) document.body.classList.remove('layer-open');
    if (restoreFocus && layer.returnFocus && document.contains(layer.returnFocus)) layer.returnFocus.focus({ preventScroll: true });
  }
  function closeAllLayers(restoreFocus = false) {
    [...layers].reverse().forEach(l => closeLayer(l.el, restoreFocus));
  }
  document.addEventListener('keydown', e => {
    if (!layers.length) return;
    const top = layers[layers.length - 1].el;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLayer(top);
    } else if (e.key === 'Tab') {
      const focusables = [...top.querySelectorAll('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])')].filter(n => n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Abre el detalle de una GPU (cerrando antes cualquier panel propio)
  function openGpu(name) {
    closeAllLayers(false);
    ensureModal();
    window.openGpuModal(name);
  }
  window.openGpu = openGpu;

  // Las páginas sin modal de detalle (p. ej. Aprender) lo reciben aquí
  function ensureModal() {
    if (document.getElementById('gpu-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'gpu-modal';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" id="modal-close" class="modal-close" aria-label="${esc(T('catalog.close'))}">&times;</button>
        <div id="modal-body"></div>
      </div>`;
    document.body.appendChild(overlay);
  }
  // Se crea ya (antes de DOMContentLoaded) para que app.js conecte cierre y teclado
  ensureModal();
  const modalEl = document.getElementById('gpu-modal');
  modalEl.setAttribute('aria-hidden', modalEl.classList.contains('active') ? 'false' : 'true');
  const modalContent = modalEl.querySelector('.modal-content');
  if (modalContent && !modalContent.hasAttribute('role')) {
    modalContent.setAttribute('role', 'dialog');
    modalContent.setAttribute('aria-modal', 'true');
    modalContent.setAttribute('aria-labelledby', 'modal-title');
  }

  // ---------- Favoritos y comparación ----------
  function toggleFavorite(name) {
    const gpu = window.findGpu(name);
    if (!gpu) return;
    if (Store.has('favorites', name)) {
      Store.remove('favorites', name);
      toast({ icon: ICONS.heart, text: T('fx.fav_removed', { name: esc(name) }) });
      Progress.track('favorite', { name, count: Store.count('favorites'), added: false });
    } else {
      Store.add('favorites', name);
      toast({
        icon: ICONS.heart, tone: 'success', text: T('fx.fav_added', { name: esc(name) }),
        actionsHtml: `<button type="button" class="toast-link" data-open-drawer="favorites">${esc(T('fx.tab_favorites'))}</button>`
      });
      Progress.track('favorite', { name, count: Store.count('favorites'), added: true });
    }
  }

  function toggleCompare(name) {
    if (Store.has('compare', name)) {
      Store.remove('compare', name);
      toast({ icon: ICONS.compare, text: T('fx.cmp_removed', { name: esc(name) }) });
      return;
    }
    if (!Store.add('compare', name)) {
      toast({
        icon: ICONS.compare, tone: 'warning', text: T('fx.cmp_full'), timeout: 4500,
        actionsHtml: `<button type="button" class="toast-link" data-open-drawer="compare">${esc(T('fx.tab_compare'))}</button>`
      });
      return;
    }
    const count = Store.count('compare');
    toast({
      icon: ICONS.compare, tone: 'success', text: T('fx.cmp_added', { name: esc(name) }),
      actionsHtml: count >= 2 && PAGE_ID !== 'compare' ? `<a class="toast-link" href="${pageHref('compare')}">${esc(T('fx.cmp_now', { n: count }))}</a>` : ''
    });
  }
  window.toggleFavorite = toggleFavorite;
  window.toggleCompare = toggleCompare;

  // Botones de favorito y comparar de las tarjetas (app.js los inserta con esta función)
  window.cardActionsHtml = function (name) {
    const fav = Store.has('favorites', name);
    const cmp = Store.has('compare', name);
    const n = esc(name);
    return `
      <div class="card-actions">
        <button type="button" class="card-action card-action-fav" data-card-action="fav" data-gpu="${n}" aria-pressed="${fav}"
          aria-label="${esc(T(fav ? 'fx.fav_remove' : 'fx.fav_add'))}: ${n}" title="${esc(T(fav ? 'fx.fav_remove' : 'fx.fav_add'))}">${ICONS.heart}</button>
        <button type="button" class="card-action card-action-cmp" data-card-action="compare" data-gpu="${n}" aria-pressed="${cmp}"
          aria-label="${esc(T(cmp ? 'fx.cmp_remove' : 'fx.cmp_add'))}: ${n}" title="${esc(T(cmp ? 'fx.cmp_remove' : 'fx.cmp_add'))}">${ICONS.compare}</button>
      </div>`;
  };

  function syncActionButtons() {
    document.querySelectorAll('[data-card-action]').forEach(btn => {
      const name = btn.dataset.gpu;
      const isFav = btn.dataset.cardAction === 'fav';
      const on = Store.has(isFav ? 'favorites' : 'compare', name);
      const label = T(isFav ? (on ? 'fx.fav_remove' : 'fx.fav_add') : (on ? 'fx.cmp_remove' : 'fx.cmp_add'));
      btn.setAttribute('aria-pressed', on);
      btn.setAttribute('aria-label', `${label}: ${name}`);
      btn.title = label;
    });
  }

  document.addEventListener('click', e => {
    const cardBtn = e.target.closest('[data-card-action]');
    if (cardBtn) {
      e.preventDefault();
      if (cardBtn.dataset.cardAction === 'fav') toggleFavorite(cardBtn.dataset.gpu);
      else toggleCompare(cardBtn.dataset.gpu);
      return;
    }
    const drawerLink = e.target.closest('[data-open-drawer]');
    if (drawerLink) {
      e.preventDefault();
      openDrawer(drawerLink.dataset.openDrawer);
    }
  });

  // ---------- Compartir ----------
  async function shareGpu(name) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('gpu', name);
    const link = url.toString();
    Progress.track('share', name);
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && isTouch) {
      try { await navigator.share({ title: `${name} — GPU Universe`, url: link }); return; } catch (e) { /* cancelado: se copia */ }
    }
    const copied = await copyText(link);
    toast({ icon: ICONS.share, tone: copied ? 'success' : 'warning', text: copied ? T('fx.share_copied') : link, timeout: copied ? 3000 : 8000 });
  }
  window.shareGpu = shareGpu;

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      area.remove();
      return ok;
    }
  }
  window.copyText = copyText;

  // ---------- Detalle de GPU: acciones, historial y XP ----------
  function modalActionsHtml(name) {
    const fav = Store.has('favorites', name);
    const cmp = Store.has('compare', name);
    const count = Store.count('compare');
    return `
      <button type="button" class="btn-modal-compare" data-modal-action="compare" aria-pressed="${cmp}">
        ${ICONS.compare}<span>${esc(T(cmp ? 'fx.cmp_remove' : 'fx.cmp_add'))}</span>
      </button>
      <button type="button" class="btn-modal-secondary" data-modal-action="fav" aria-pressed="${fav}">
        ${ICONS.heart}<span>${esc(T(fav ? 'fx.fav_remove' : 'fx.fav_add'))}</span>
      </button>
      <button type="button" class="btn-modal-secondary" data-modal-action="share">
        ${ICONS.share}<span>${esc(T('fx.share'))}</span>
      </button>
      ${count >= 2 && PAGE_ID !== 'compare' ? `<a class="btn-modal-link" href="${pageHref('compare')}">${esc(T('fx.cmp_now', { n: count }))} ${ICONS.arrow}</a>` : ''}`;
  }

  let currentModalGpu = null;
  const originalOpenGpuModal = window.openGpuModal;
  window.openGpuModal = function (name, trigger) {
    originalOpenGpuModal(name, trigger);
    const overlay = document.getElementById('gpu-modal');
    if (!overlay || !overlay.classList.contains('active')) return;
    currentModalGpu = name;
    const actions = overlay.querySelector('.modal-actions');
    if (actions) actions.innerHTML = modalActionsHtml(name);
    Store.add('recent', name);
    Progress.track('view', name);
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-modal-action]');
    if (!btn || !currentModalGpu) return;
    const action = btn.dataset.modalAction;
    if (action === 'fav') toggleFavorite(currentModalGpu);
    else if (action === 'compare') toggleCompare(currentModalGpu);
    else if (action === 'share') shareGpu(currentModalGpu);
  });

  function refreshModalActions() {
    const overlay = document.getElementById('gpu-modal');
    const actions = overlay && overlay.classList.contains('active') && overlay.querySelector('.modal-actions');
    if (!actions || !currentModalGpu) return;
    const focusedAction = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.modalAction : null;
    actions.innerHTML = modalActionsHtml(currentModalGpu);
    if (focusedAction) actions.querySelector(`[data-modal-action="${focusedAction}"]`)?.focus({ preventScroll: true });
  }

  // Índice gaming, puesto y alternativas en el detalle (gaming.js usaba su propia copia)
  function defaultModalExtras(gpu) {
    const pools = window.getGpuPools();
    const tab = pools.desktop.some(g => g.name === gpu.name) ? 'desktop'
      : (pools.laptop.some(g => g.name === gpu.name) ? 'laptop' : null);
    if (!tab) return {};
    const ranked = pools[tab].filter(g => g.perf > 0).sort((a, b) => b.perf - a.perf);
    const current = ranked.find(g => g.name === gpu.name);
    if (!current) return {};
    const hint = T(tab === 'desktop' ? 'catalog.perf_index_def' : 'catalog.perf_index_laptop_def');
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
            <span class="has-tooltip">${esc(T('catalog.perf_index'))}<span class="info-icon">i</span><span class="tooltip-box">${hint}</span></span>
            <strong>${window.formatPerf(current.perf)}<small> / 100</small></strong>
          </div>
          <div class="gpu-perf-bar"><div class="gpu-perf-fill ${fill}" style="width: ${Math.min(current.perf, 100)}%"></div></div>
          <div class="modal-perf-rank">${T('catalog.perf_rank', { rank: ranked.indexOf(current) + 1, total: ranked.length })}</div>
        </div>`,
      bottom: similar.length ? `
        <div class="modal-similar">
          <h3>${esc(T('catalog.similar'))}</h3>
          <div class="similar-list">
            ${similar.map(g => `
              <button type="button" class="similar-item" data-open-gpu="${esc(g.name)}">
                ${window.brandBadge(g)}
                <span class="similar-name">${esc(g.name)}</span>
                <span class="similar-meta">${window.formatPerf(g.perf)} · ${window.formatPrice(g.price) || '—'}</span>
              </button>`).join('')}
          </div>
        </div>` : ''
    };
  }
  if (typeof window.gpuModalExtras !== 'function') window.gpuModalExtras = defaultModalExtras;

  // ---------- Chip de nivel del menú ----------
  function levelTitle(level) {
    return T(`levels.titles.l${level}`);
  }
  window.levelTitle = levelTitle;

  function updateLevelChip() {
    const chip = document.getElementById('level-chip');
    if (!chip) return;
    const info = Progress.levelInfo();
    chip.querySelector('.level-chip-num').textContent = info.level;
    chip.querySelector('.level-chip-label').textContent = `${T('fx.level_short')} ${info.level}`;
    chip.querySelector('.level-chip-bar span').style.width = `${info.pct}%`;
    const detail = info.isMax ? T('fx.xp_max') : T('fx.xp_progress', { xp: info.xp, next: info.next });
    const label = `${T('fx.drawer_title')} · ${T('fx.level', { n: info.level })} · ${levelTitle(info.level)} · ${detail}`;
    chip.setAttribute('aria-label', label);
    chip.title = label;
  }
  }

  // ---------- Panel "Tu espacio" ----------
  let drawer = null;
  let drawerTab = 'favorites';

  function buildDrawer() {
    drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'user-drawer';
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <div class="drawer-backdrop" data-drawer-close></div>
      <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header class="drawer-head">
          <h2 id="drawer-title"></h2>
          <button type="button" class="icon-btn" data-drawer-close></button>
        </header>
        <div class="drawer-level" id="drawer-level"></div>
        <div class="drawer-tabs" role="tablist"></div>
        <div class="drawer-list" id="drawer-list" role="tabpanel"></div>
      </aside>`;
    document.body.appendChild(drawer);
    drawer.addEventListener('click', e => {
      if (e.target.closest('[data-drawer-close]')) return closeLayer(drawer);
      const tab = e.target.closest('[data-drawer-tab]');
      if (tab) {
        drawerTab = tab.dataset.drawerTab;
        renderDrawer();
        drawer.querySelector(`[data-drawer-tab="${drawerTab}"]`)?.focus();
        return;
      }
      const open = e.target.closest('[data-drawer-open]');
      if (open) return openGpu(open.dataset.drawerOpen);
      const act = e.target.closest('[data-drawer-act]');
      if (!act) return;
      const { drawerAct, gpu } = act.dataset;
      if (drawerAct === 'unfav') Store.remove('favorites', gpu);
      else if (drawerAct === 'uncompare') Store.remove('compare', gpu);
      else if (drawerAct === 'compare') toggleCompare(gpu);
      else if (drawerAct === 'fav') toggleFavorite(gpu);
      else if (drawerAct === 'clear-recent') Store.clear('recent');
      else if (drawerAct === 'clear-compare') Store.clear('compare');
    });
    drawer.addEventListener('keydown', e => {
      if (!e.target.matches('[data-drawer-tab]') || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = ['favorites', 'recent', 'compare'];
      const next = tabs[(tabs.indexOf(drawerTab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
      drawerTab = next;
      renderDrawer();
      drawer.querySelector(`[data-drawer-tab="${next}"]`)?.focus();
    });
  }

  function drawerItem(name, actions) {
    const gpu = window.findGpu(name);
    if (!gpu) return '';
    return `
      <li class="drawer-item">
        <button type="button" class="drawer-item-main" data-drawer-open="${esc(name)}">
          ${window.brandBadge(gpu)}
          <span class="drawer-item-name">${esc(name)}</span>
          <span class="drawer-item-meta">${esc(window.gpuMetaLine(gpu))}</span>
        </button>
        <div class="drawer-item-actions">${actions}</div>
      </li>`;
  }

  function actionBtn(act, name, icon, label, pressed) {
    return `<button type="button" class="icon-btn" data-drawer-act="${act}" data-gpu="${esc(name)}" aria-label="${esc(label)}: ${esc(name)}" title="${esc(label)}"${pressed !== undefined ? ` aria-pressed="${pressed}"` : ''}>${icon}</button>`;
  }

  function renderDrawer() {
    if (!drawer) return;
    drawer.querySelector('#drawer-title').textContent = T('fx.drawer_title');
    const closeBtn = drawer.querySelector('.drawer-head [data-drawer-close]');
    closeBtn.innerHTML = ICONS.close;
    closeBtn.setAttribute('aria-label', T('catalog.close'));

    const info = Progress.levelInfo();
    const state = Progress.getState();
    drawer.querySelector('#drawer-level').innerHTML = `
      <div class="level-badge level-badge-md"><span>${info.level}</span></div>
      <div class="drawer-level-info">
        <span class="drawer-level-kicker">${esc(T('fx.level', { n: info.level }))}</span>
        <strong class="drawer-level-title">${esc(levelTitle(info.level))}</strong>
        <div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${info.pct}" aria-label="XP"><span style="width:${info.pct}%"></span></div>
        <span class="drawer-level-xp">${esc(info.isMax ? T('fx.xp_max') : T('fx.xp_progress', { xp: info.xp, next: info.next }))}
          · ${ICONS.flame} ${esc(window.trPlural('levels.days', state.streak.count || 1))}</span>
      </div>
      <a class="drawer-level-link" href="${pageHref('levels')}">${esc(T('fx.view_levels'))} ${ICONS.arrow}</a>`;

    const counts = { favorites: Store.count('favorites'), recent: Store.count('recent'), compare: Store.count('compare') };
    const tabKeys = { favorites: 'fx.tab_favorites', recent: 'fx.tab_recent', compare: 'fx.tab_compare' };
    drawer.querySelector('.drawer-tabs').innerHTML = Object.keys(tabKeys).map(tab => `
      <button type="button" role="tab" class="drawer-tab" data-drawer-tab="${tab}" id="drawer-tab-${tab}"
        aria-selected="${tab === drawerTab}" tabindex="${tab === drawerTab ? 0 : -1}">
        ${esc(T(tabKeys[tab]))}<span class="tab-count">${tab === 'compare' ? `${counts.compare}/${Store.LIMITS.compare}` : counts[tab]}</span>
      </button>`).join('');

    const list = drawer.querySelector('#drawer-list');
    list.setAttribute('aria-labelledby', `drawer-tab-${drawerTab}`);
    const names = Store.get(drawerTab);
    if (!names.length) {
      const emptyIcon = { favorites: ICONS.heart, recent: ICONS.history, compare: ICONS.compare }[drawerTab];
      list.innerHTML = `
        <div class="drawer-empty">
          <span class="drawer-empty-icon">${emptyIcon}</span>
          <p>${esc(T(`fx.empty_${drawerTab}`))}</p>
          <a class="btn-load-more" href="${pageHref('gaming')}">${esc(T('hero.btn_primary'))} ${ICONS.arrow}</a>
        </div>`;
      return;
    }
    let items = '';
    if (drawerTab === 'favorites') {
      items = names.map(n => drawerItem(n,
        actionBtn('compare', n, ICONS.compare, T(Store.has('compare', n) ? 'fx.cmp_remove' : 'fx.cmp_add'), Store.has('compare', n)) +
        actionBtn('unfav', n, ICONS.trash, T('fx.fav_remove')))).join('');
    } else if (drawerTab === 'recent') {
      items = names.map(n => drawerItem(n,
        actionBtn('fav', n, ICONS.heart, T(Store.has('favorites', n) ? 'fx.fav_remove' : 'fx.fav_add'), Store.has('favorites', n)) +
        actionBtn('compare', n, ICONS.compare, T(Store.has('compare', n) ? 'fx.cmp_remove' : 'fx.cmp_add'), Store.has('compare', n)))).join('');
    } else {
      items = names.map(n => drawerItem(n, actionBtn('uncompare', n, ICONS.close, T('fx.remove')))).join('');
    }
    const footer = drawerTab === 'compare'
      ? `<div class="drawer-footer">
           <button type="button" class="btn-text" data-drawer-act="clear-compare">${esc(T('fx.cmp_clear'))}</button>
           ${names.length >= 2 ? `<a class="btn-primary btn-sm" href="${pageHref('compare')}">${esc(T('fx.cmp_now', { n: names.length }))}</a>` : `<span class="drawer-hint">${esc(T('fx.cmp_hint'))}</span>`}
         </div>`
      : drawerTab === 'recent'
        ? `<div class="drawer-footer"><button type="button" class="btn-text" data-drawer-act="clear-recent">${esc(T('fx.clear_recent'))}</button></div>`
        : '';
    list.innerHTML = `<ul class="drawer-items">${items}</ul>${footer}`;
  }

  function openDrawer(tab) {
    if (!drawer) buildDrawer();
    if (tab) drawerTab = tab;
    renderDrawer();
    try { localStorage.setItem('gpu-universe-drawer-seen', '1'); } catch (e) { /* nada */ }
    document.getElementById('level-chip')?.classList.remove('is-new');
    openLayer(drawer, drawer.querySelector('.drawer-tab[aria-selected="true"]'));
  }
  window.openDrawer = openDrawer;

  // ---------- Bandeja de comparación ----------
  let tray = null;
  function renderTray() {
    const names = Store.get('compare');
    const show = names.length > 0 && PAGE_ID !== 'compare';
    if (!tray) {
      if (!show) return;
      tray = document.createElement('div');
      tray.className = 'compare-tray';
      tray.id = 'compare-tray';
      tray.setAttribute('role', 'region');
      document.body.appendChild(tray);
      tray.addEventListener('click', e => {
        const rm = e.target.closest('[data-tray-remove]');
        if (rm) Store.remove('compare', rm.dataset.trayRemove);
        else if (e.target.closest('[data-tray-clear]')) Store.clear('compare');
        else if (e.target.closest('[data-tray-open]')) openGpu(e.target.closest('[data-tray-open]').dataset.trayOpen);
      });
    }
    tray.setAttribute('aria-label', T('fx.cmp_tray_label'));
    tray.hidden = !show;
    document.body.classList.toggle('has-tray', show);
    if (!show) return;
    const slots = [];
    for (let i = 0; i < Store.LIMITS.compare; i++) {
      const name = names[i];
      const gpu = name && window.findGpu(name);
      slots.push(gpu
        ? `<li class="tray-chip brand-line-${gpu.brand}">
             <button type="button" class="tray-chip-name" data-tray-open="${esc(name)}">${esc(name)}</button>
             <button type="button" class="tray-chip-remove" data-tray-remove="${esc(name)}" aria-label="${esc(T('fx.remove'))}: ${esc(name)}">${ICONS.close}</button>
           </li>`
        : '<li class="tray-slot" aria-hidden="true"></li>');
    }
    tray.innerHTML = `
      <div class="tray-inner">
        <span class="tray-title">${ICONS.compare}<span>${esc(T('fx.cmp_tray_label'))}</span><span class="tab-count">${names.length}/${Store.LIMITS.compare}</span></span>
        <ul class="tray-list">${slots.join('')}</ul>
        <div class="tray-actions">
          <button type="button" class="btn-text" data-tray-clear>${esc(T('fx.cmp_clear'))}</button>
          ${names.length >= 2
            ? `<a class="btn-primary btn-sm" href="${pageHref('compare')}">${esc(T('fx.cmp_now', { n: names.length }))}</a>`
            : `<span class="tray-hint">${esc(T('fx.cmp_hint'))}</span>`}
        </div>
      </div>`;
  }

  // ---------- Buscador rápido (Ctrl+K) ----------
  let palette = null;
  let paletteItems = [];
  let paletteActive = 0;

  const PAGES = [
    { id: 'home', key: 'fx.page_home', icon: 'home' },
    { id: 'gaming', key: 'nav.gaming', icon: 'gamepad' },
    { id: 'workstation', key: 'nav.workstation', icon: 'monitor' },
    { id: 'server', key: 'nav.server', icon: 'server' },
    { id: 'compare', key: 'nav.compare', icon: 'compare' },
    { id: 'history', key: 'nav.history', icon: 'hourglass' },
    { id: 'learn', key: 'nav.learn', icon: 'cube' },
    { id: 'tools', key: 'nav.tools', icon: 'tool' },
    { id: 'levels', key: 'nav.levels', icon: 'trophy' }
  ];

  const ACTIONS = [
    { id: 'drawer', key: 'fx.drawer_title', icon: 'user', run: () => openDrawer() },
    { id: 'random', key: 'fx.action_random', icon: 'dice', run: () => {
      const pool = window.getGpuPools().desktop.filter(g => g.perf);
      openGpu(pool[Math.floor(Math.random() * pool.length)].name);
    } },
    { id: 'theme', key: 'fx.action_theme', icon: 'contrast', run: () => { closeAllLayers(); document.querySelector('.theme-toggle')?.click(); } },
    { id: 'shortcuts', key: 'fx.action_shortcuts', icon: 'keyboard', run: () => openShortcuts() }
  ];

  function buildPalette() {
    palette = document.createElement('div');
    palette.className = 'palette';
    palette.id = 'palette';
    palette.hidden = true;
    palette.setAttribute('aria-hidden', 'true');
    palette.innerHTML = `
      <div class="palette-backdrop" data-palette-close></div>
      <div class="palette-panel" role="dialog" aria-modal="true" aria-labelledby="palette-input">
        <div class="palette-input-row">
          ${ICONS.search}
          <input type="text" id="palette-input" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" />
          <kbd class="palette-esc">Esc</kbd>
        </div>
        <div class="palette-list" id="palette-list" role="listbox"></div>
        <div class="palette-foot"></div>
      </div>`;
    document.body.appendChild(palette);
    const input = palette.querySelector('input');
    input.addEventListener('input', () => renderPalette(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!paletteItems.length) return;
        paletteActive = (paletteActive + (e.key === 'ArrowDown' ? 1 : -1) + paletteItems.length) % paletteItems.length;
        highlightPalette();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        paletteItems[paletteActive]?.run();
      }
    });
    palette.addEventListener('click', e => {
      if (e.target.closest('[data-palette-close]')) return closeLayer(palette);
      const opt = e.target.closest('[data-palette-index]');
      if (opt) paletteItems[Number(opt.dataset.paletteIndex)]?.run();
    });
    palette.addEventListener('mousemove', e => {
      const opt = e.target.closest('[data-palette-index]');
      if (opt && Number(opt.dataset.paletteIndex) !== paletteActive) {
        paletteActive = Number(opt.dataset.paletteIndex);
        highlightPalette(false);
      }
    });
  }

  function highlightMatch(text, query) {
    const q = query.trim();
    if (!q) return esc(text);
    const idx = normalize(text).indexOf(normalize(q));
    if (idx === -1) return esc(text);
    return `${esc(text.slice(0, idx))}<mark>${esc(text.slice(idx, idx + q.length))}</mark>${esc(text.slice(idx + q.length))}`;
  }

  function renderPalette(query) {
    const q = query.trim();
    const groups = [];
    const gpuItem = gpu => ({
      html: `${window.brandBadge(gpu)}<span class="palette-item-main"><span class="palette-item-title">${highlightMatch(gpu.name, q)}</span><span class="palette-item-meta">${esc(window.gpuMetaLine(gpu))}</span></span>`,
      run: () => openGpu(gpu.name)
    });
    if (!q) {
      const recent = Store.get('recent').slice(0, 5).map(window.findGpu).filter(Boolean);
      if (recent.length) groups.push({ label: T('fx.search_recent'), items: recent.map(gpuItem) });
    } else {
      const gpus = window.searchGpus(q, getAllGpus(), 8);
      if (gpus.length) groups.push({ label: T('fx.search_gpus'), items: gpus.map(gpuItem) });
    }
    const pageItems = PAGES
      .filter(p => p.id !== PAGE_ID && (!q || normalize(T(p.key)).includes(normalize(q))))
      .map(p => ({
        html: `<span class="palette-item-icon">${ICONS[p.icon]}</span><span class="palette-item-main"><span class="palette-item-title">${highlightMatch(T(p.key), q)}</span></span>`,
        run: () => { window.location.href = pageHref(p.id); }
      }));
    if (pageItems.length) groups.push({ label: T('fx.search_pages'), items: pageItems });
    const actionItems = ACTIONS
      .filter(a => !q || normalize(T(a.key)).includes(normalize(q)))
      .map(a => ({
        html: `<span class="palette-item-icon">${ICONS[a.icon]}</span><span class="palette-item-main"><span class="palette-item-title">${highlightMatch(T(a.key), q)}</span></span>`,
        run: a.run
      }));
    if (actionItems.length) groups.push({ label: T('fx.search_actions'), items: actionItems });

    paletteItems = groups.flatMap(g => g.items);
    paletteActive = 0;
    const list = palette.querySelector('#palette-list');
    if (!paletteItems.length) {
      list.innerHTML = `<p class="palette-empty">${T('fx.search_empty', { q: esc(q) })}</p>`;
      palette.querySelector('input').removeAttribute('aria-activedescendant');
      return;
    }
    let index = 0;
    list.innerHTML = groups.map((g, gi) => `
      <div class="palette-group" role="group" aria-labelledby="palette-group-${gi}">
        <div class="palette-group-label" id="palette-group-${gi}">${esc(g.label)}</div>
        ${g.items.map(item => `<div class="palette-item" role="option" id="palette-opt-${index}" data-palette-index="${index++}">${item.html}<span class="palette-enter" aria-hidden="true">↵</span></div>`).join('')}
      </div>`).join('');
    highlightPalette(false);
  }

  function highlightPalette(scroll = true) {
    palette.querySelectorAll('.palette-item').forEach(opt => {
      const active = Number(opt.dataset.paletteIndex) === paletteActive;
      opt.classList.toggle('is-active', active);
      opt.setAttribute('aria-selected', active);
      if (active && scroll) opt.scrollIntoView({ block: 'nearest' });
    });
    palette.querySelector('input').setAttribute('aria-activedescendant', `palette-opt-${paletteActive}`);
  }

  function openPalette() {
    if (!palette) buildPalette();
    const input = palette.querySelector('input');
    input.placeholder = T('fx.search_placeholder');
    input.setAttribute('aria-label', T('fx.search_placeholder'));
    palette.querySelector('.palette-foot').textContent = T('fx.search_hint_nav');
    input.value = '';
    renderPalette('');
    openLayer(palette, input);
  }
  window.openPalette = openPalette;

  // ---------- Atajos de teclado ----------
  let shortcuts = null;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const MOD = isMac ? '⌘' : 'Ctrl';

  function openShortcuts() {
    closeAllLayers(false);
    if (!shortcuts) {
      shortcuts = document.createElement('div');
      shortcuts.className = 'palette shortcuts';
      shortcuts.hidden = true;
      shortcuts.setAttribute('aria-hidden', 'true');
      document.body.appendChild(shortcuts);
      shortcuts.addEventListener('click', e => { if (e.target.closest('[data-palette-close]')) closeLayer(shortcuts); });
    }
    const rows = [
      [[MOD, 'K'], 'fx.sc_search'], [['/'], 'fx.sc_search'], [['P'], 'fx.sc_drawer'],
      [['T'], 'fx.sc_theme'], [['?'], 'fx.sc_help'], [['Esc'], 'fx.sc_close']
    ];
    shortcuts.innerHTML = `
      <div class="palette-backdrop" data-palette-close></div>
      <div class="palette-panel shortcuts-panel" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
        <div class="shortcuts-head">
          <h2 id="shortcuts-title">${ICONS.keyboard}${esc(T('fx.shortcuts_title'))}</h2>
          <button type="button" class="icon-btn" data-palette-close aria-label="${esc(T('catalog.close'))}">${ICONS.close}</button>
        </div>
        <dl class="shortcuts-list">
          ${rows.map(([keys, label]) => `<div><dt>${keys.map(k => `<kbd>${k}</kbd>`).join(' ')}</dt><dd>${esc(T(label))}</dd></div>`).join('')}
        </dl>
      </div>`;
    openLayer(shortcuts);
  }

  document.addEventListener('keydown', e => {
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette && !palette.hidden && palette.classList.contains('is-open')) closeLayer(palette);
      else { closeAllLayers(false); window.closeGpuModal && window.closeGpuModal(); openPalette(); }
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || layers.length || document.body.classList.contains('modal-open')) return;
    if (e.key === '/') { e.preventDefault(); openPalette(); }
    else if (e.key === '?') { e.preventDefault(); openShortcuts(); }
    else if (e.key.toLowerCase() === 'p') { e.preventDefault(); openDrawer(); }
    else if (e.key.toLowerCase() === 't') { document.querySelector('.theme-toggle')?.click(); }
  });

  // ---------- Avisos de progresión ----------
  let xpToast = null;
  let xpAmount = 0;
  function reasonLabel(reason) {
    return T(`fx.reason_${reason}`);
  }

  function unlockLabel(u) {
    if (u.type === 'game') return T(`levels.g_${u.id}`);
    if (u.type === 'color') return T('levels.u_color', { color: T(`levels.color_${u.id}`) });
    if (u.type === 'feature') return T(`levels.g_${u.id}`);
    return '';
  }
  window.unlockLabel = unlockLabel;

  window.addEventListener('progress:xp', e => {
    const { amount, reason } = e.detail;
    const info = Progress.levelInfo();
    const bar = `<span class="toast-xpbar"><span style="width:${info.pct}%"></span></span>`;
    if (xpToast && document.contains(xpToast.el) && !xpToast.el.classList.contains('is-leaving')) {
      xpAmount += amount;
      xpToast.el.querySelector('.toast-title').textContent = T('fx.xp_gain', { xp: xpAmount });
      xpToast.el.querySelector('.toast-text').innerHTML = `${esc(reasonLabel(reason))}${bar}`;
      xpToast.restart();
    } else {
      xpAmount = amount;
      xpToast = toast({ icon: ICONS.sparkle, tone: 'xp', title: T('fx.xp_gain', { xp: amount }), text: `${esc(reasonLabel(reason))}${bar}`, timeout: 2600 });
    }
    updateLevelChip();
  });

  window.addEventListener('progress:levelup', e => {
    const { level, unlocks } = e.detail;
    const shown = unlocks.filter(u => !(u.type === 'color' && u.id === 'emerald'));
    toast({
      icon: `<span class="level-badge level-badge-sm"><span>${level}</span></span>`,
      tone: 'level',
      className: 'toast-levelup',
      title: T('fx.level_up', { n: level }),
      text: `${esc(levelTitle(level))}${shown.length ? `<span class="toast-unlocks">${shown.map(u => `<span>${ICONS.check}${esc(T('fx.unlocked', { item: unlockLabel(u) }))}</span>`).join('')}</span>` : ''}`,
      actionsHtml: PAGE_ID !== 'levels' ? `<a class="toast-link" href="${pageHref('levels')}">${esc(T('fx.view_levels'))}</a>` : '',
      timeout: 7000
    });
    document.getElementById('level-chip')?.classList.add('is-levelup');
    setTimeout(() => document.getElementById('level-chip')?.classList.remove('is-levelup'), 1600);
  });

  window.addEventListener('progress:achievement', e => {
    const id = e.detail.id;
    const def = Progress.achievementList().find(a => a.id === id);
    toast({
      icon: ICONS[def ? def.icon : 'trophy'],
      tone: 'achievement',
      title: T('fx.achievement'),
      text: `<strong>${esc(T(`levels.ach.${id}.name`))}</strong> — ${esc(T(`levels.ach.${id}.desc`))}`,
      timeout: 5000
    });
  });

  window.addEventListener('progress:change', updateLevelChip);

  window.addEventListener('store:change', e => {
    syncActionButtons();
    refreshModalActions();
    renderTray();
    updateLevelChip();
    if (drawer && drawer.classList.contains('is-open')) renderDrawer();
    if (e.detail.list === 'compare' && typeof window.onCompareListChange === 'function') window.onCompareListChange();
  });

  // ---------- Bienvenida (primera visita) ----------
  function maybeWelcome() {
    let seen = false;
    try { seen = localStorage.getItem('gpu-universe-welcome') === '1'; } catch (e) { seen = true; }
    if (seen) return;
    setTimeout(() => {
      if (document.body.classList.contains('modal-open') || layers.length) return;
      const card = document.createElement('div');
      card.className = 'welcome-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-labelledby', 'welcome-title');
      card.innerHTML = `
        <div class="welcome-head">
          <span class="level-badge level-badge-sm"><span>1</span></span>
          <h2 id="welcome-title">${esc(T('fx.welcome_title'))}</h2>
        </div>
        <p>${esc(T('fx.welcome_text'))}</p>
        <ul class="welcome-list">
          <li>${ICONS.search}<span>${T('fx.welcome_tip', { key: `<kbd>${MOD}</kbd> <kbd>K</kbd>` })}</span></li>
          <li>${ICONS.heart}<span>${esc(T('fx.welcome_tip_fav'))}</span></li>
          <li>${ICONS.trophy}<span>${esc(T('fx.welcome_tip_levels'))}</span></li>
        </ul>
        <div class="welcome-actions">
          <a class="btn-ghost btn-sm" href="${pageHref('levels')}" data-welcome-close>${esc(T('fx.view_levels'))}</a>
          <button type="button" class="btn-primary btn-sm" data-welcome-close>${esc(T('fx.welcome_start'))}</button>
        </div>`;
      document.body.appendChild(card);
      requestAnimationFrame(() => card.classList.add('is-visible'));
      card.addEventListener('click', e => {
        if (!e.target.closest('[data-welcome-close]')) return;
        try { localStorage.setItem('gpu-universe-welcome', '1'); } catch (err) { /* nada */ }
        card.classList.remove('is-visible');
        setTimeout(() => card.remove(), 250);
      });
    }, 1200);
  }

  // ---------- Botones del menú ----------
  function translateStatic() {
    const search = document.getElementById('nav-search');
    if (search) {
      search.setAttribute('aria-label', T('nav.search'));
      search.title = `${T('nav.search')} (${MOD}+K)`;
      const kbd = search.querySelector('.nav-search-kbd');
      if (kbd) kbd.textContent = `${MOD} K`;
    }
    updateLevelChip();
    if (tray) renderTray();
  }

  // Tras cada applyTranslations (cambio de idioma o renderAll) se actualizan los textos generados aquí
  const originalApply = window.applyTranslations;
  if (typeof originalApply === 'function') {
    window.applyTranslations = function () {
      originalApply();
      translateStatic();
    };
  }

  // ---------- Seguimiento de acciones para la progresión ----------
  document.addEventListener('click', e => {
    if (e.target.closest('.theme-toggle')) {
      setTimeout(() => Progress.track('theme', document.documentElement.getAttribute('data-theme')), 0);
    }
    const lang = e.target.closest('.lang-option');
    if (lang) setTimeout(() => Progress.track('lang', lang.dataset.value), 0);
    const layer = e.target.closest('.layer-btn');
    if (layer) Progress.track('layer', layer.dataset.layer);
  });

  // Enlace directo a una GPU (?gpu=RTX%205090). Se lee ya: gaming.js reescribe la URL al renderizar
  const deepLinkGpu = new URLSearchParams(window.location.search).get('gpu');

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nav-search')?.addEventListener('click', openPalette);
    const chip = document.getElementById('level-chip');
    if (chip) {
      chip.addEventListener('click', () => openDrawer());
      try { if (!localStorage.getItem('gpu-universe-drawer-seen')) chip.classList.add('is-new'); } catch (e) { /* nada */ }
    }
    translateStatic();
    renderTray();
    syncActionButtons();
    Progress.start(PAGE_ID);
    maybeWelcome();

    if (deepLinkGpu && window.findGpu(deepLinkGpu)) {
      setTimeout(() => {
        openGpu(deepLinkGpu);
        const url = new URL(window.location.href);
        url.searchParams.delete('gpu');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }, 60);
    }
  });
})();
