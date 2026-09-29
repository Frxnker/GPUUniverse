// ===== HERRAMIENTAS: asesor de mejora, fuente de alimentación y VRAM necesaria =====
(function () {
  const root = document.getElementById('tools');
  if (!root) return;

  const T = (key, vars) => window.tr(key, undefined, vars);
  const esc = s => window.escapeHtml(s);
  const ICONS = window.GPUIcons;
  const MY_GPU_KEY = 'gpu-universe-mygpu';
  const lang = () => window.currentLang || 'es';
  const fmt = (v, digits = 0) => Number(v).toLocaleString(lang(), { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const priceUsd = g => window.priceToUsd(g.price) || 0;
  const priceText = usd => window.formatPrice('$' + Math.round(usd));

  const pools = () => window.getGpuPools();
  // GPUs de escritorio a la venta hoy: las del catálogo actual o lanzadas desde 2022
  const currentNames = new Set(GAMING_GPUS.map(g => window.findGpu(g.name) ? window.findGpu(g.name).name : g.name));
  const buyable = () => pools().desktop.filter(g => g.perf > 0 && priceUsd(g) > 0 && ((parseInt(g.year) || 0) >= 2022 || currentNames.has(g.name)));

  function rememberGpu(name) {
    try { localStorage.setItem(MY_GPU_KEY, name); } catch (e) { /* nada */ }
  }
  function rememberedGpu() {
    try { return localStorage.getItem(MY_GPU_KEY); } catch (e) { return null; }
  }

  function trackTool(id) {
    window.GPUProgress.track('tool', id);
  }

  // Grupo de botones tipo radio: data-group="nombre" + data-value
  function bindSegmented(container, onChange) {
    container.addEventListener('click', e => {
      const btn = e.target.closest('[role="radio"]');
      if (!btn || btn.disabled) return;
      container.querySelectorAll('[role="radio"]').forEach(b => {
        b.setAttribute('aria-checked', b === btn);
        b.tabIndex = b === btn ? 0 : -1;
      });
      onChange(btn.dataset.value);
    });
    container.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const buttons = [...container.querySelectorAll('[role="radio"]:not([disabled])')];
      const idx = buttons.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const next = buttons[(idx + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + buttons.length) % buttons.length];
      next.click();
      next.focus();
    });
    container.querySelectorAll('[role="radio"]').forEach(b => { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
  }
  const checkedValue = container => container.querySelector('[aria-checked="true"]')?.dataset.value;

  // ---------- Pestañas ----------
  const TOOLS = ['upgrade', 'psu', 'vram'];
  let activeTool = TOOLS.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'upgrade';

  function setTool(id, focus = false) {
    activeTool = id;
    TOOLS.forEach(t => {
      const tab = document.getElementById(`tab-${t}`);
      tab.setAttribute('aria-selected', t === id);
      tab.tabIndex = t === id ? 0 : -1;
      document.getElementById(`panel-${t}`).hidden = t !== id;
    });
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    if (focus) document.getElementById(`tab-${id}`).focus();
    renderActive();
  }
  document.querySelectorAll('[data-tool-tab]').forEach(tab => {
    tab.addEventListener('click', () => setTool(tab.dataset.toolTab));
    tab.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const idx = TOOLS.indexOf(activeTool);
      setTool(TOOLS[(idx + (e.key === 'ArrowRight' ? 1 : TOOLS.length - 1)) % TOOLS.length], true);
    });
  });

  // =====================================================================
  // 1. ASESOR DE MEJORA
  // =====================================================================
  const up = {
    input: document.getElementById('up-gpu'),
    list: document.getElementById('up-gpu-list'),
    budget: document.getElementById('up-budget'),
    budgetOut: document.getElementById('up-budget-out'),
    gain: document.getElementById('up-gain'),
    sort: document.getElementById('up-sort'),
    result: document.getElementById('up-result'),
    current: null
  };

  window.createGpuPicker({
    input: up.input,
    list: up.list,
    keepValue: true,
    pool: () => pools().desktop.filter(g => g.perf > 0),
    onSelect: gpu => {
      up.current = gpu;
      rememberGpu(gpu.name);
      renderUpgrade(true);
    }
  });
  up.budget.addEventListener('input', () => renderUpgrade(true));
  bindSegmented(up.gain, () => renderUpgrade(true));
  bindSegmented(up.sort, () => renderUpgrade(true));

  function renderUpgrade(userAction) {
    const budget = Number(up.budget.value);
    up.budgetOut.textContent = priceText(budget);
    const gpu = up.current;
    if (!gpu) {
      up.result.innerHTML = emptyState(ICONS.search, T('tools.up_empty_pick'));
      return;
    }
    const desktop = pools().desktop.filter(g => g.perf > 0).sort((a, b) => b.perf - a.perf);
    const rank = desktop.findIndex(g => g.name === gpu.name) + 1;
    const minGain = Number(checkedValue(up.gain));
    const sort = checkedValue(up.sort);
    let options = buyable()
      .filter(g => g.name !== gpu.name && priceUsd(g) <= budget && g.perf >= gpu.perf * (1 + minGain / 100))
      .map(g => ({ g, gain: Math.round((g.perf / gpu.perf - 1) * 100), value: (g.perf - gpu.perf) / priceUsd(g) }));
    if (sort === 'perf') options.sort((a, b) => b.g.perf - a.g.perf);
    else if (sort === 'price') options.sort((a, b) => priceUsd(a.g) - priceUsd(b.g));
    else options.sort((a, b) => b.value - a.value);
    options = options.slice(0, 6);

    const summary = `
      <div class="tool-summary">
        ${window.brandBadge(gpu)}
        <div>
          <strong>${esc(gpu.name)}</strong>
          <span>${T('tools.up_rank', { perf: window.formatPerf(gpu.perf), rank, total: desktop.length })}</span>
        </div>
        <div class="tool-summary-meter" title="${esc(T('catalog.perf_index'))}"><span style="width:${Math.min(gpu.perf, 100)}%"></span></div>
      </div>`;

    if (!options.length) {
      up.result.innerHTML = summary + emptyState(ICONS.bolt, T('tools.up_none'));
      return;
    }
    const maxPerf = Math.max(...options.map(o => o.g.perf), gpu.perf);
    up.result.innerHTML = summary + `
      <ol class="tool-list">
        ${options.map((o, i) => `
          <li class="tool-item">
            <span class="tool-rank">${i + 1}</span>
            <div class="tool-item-main">
              <div class="tool-item-head">
                ${window.brandBadge(o.g)}
                <button type="button" class="tool-item-name" data-open-gpu="${esc(o.g.name)}">${esc(o.g.name)}</button>
                ${i === 0 ? `<span class="tool-flag">${esc(T(sort === 'perf' ? 'tools.up_fastest' : sort === 'price' ? 'tools.up_cheapest' : 'tools.up_best'))}</span>` : ''}
              </div>
              <div class="tool-compare-bar" aria-hidden="true">
                <span class="tool-compare-new" style="width:${(o.g.perf / maxPerf) * 100}%"></span>
                <span class="tool-compare-old" style="width:${(gpu.perf / maxPerf) * 100}%"></span>
              </div>
              <div class="tool-item-meta">
                <strong class="tool-gain">${esc(T('tools.up_gain', { pct: o.gain }))}</strong>
                <span>${esc(T('catalog.perf_index'))} ${window.formatPerf(o.g.perf)} · ${esc(o.g.vram)}</span>
              </div>
            </div>
            <div class="tool-item-side">
              <span class="tool-price">${window.formatPrice(o.g.price)}</span>
              <button type="button" class="btn-text" data-compare-pair="${esc(gpu.name)}|${esc(o.g.name)}">${ICONS.compare}<span>${esc(T('tools.compare_both'))}</span></button>
            </div>
          </li>`).join('')}
      </ol>
      <p class="tool-note">${esc(T('tools.up_note'))}</p>`;
    if (userAction) trackTool('upgrade');
  }

  // =====================================================================
  // 2. FUENTE DE ALIMENTACIÓN Y CONSUMO
  // =====================================================================
  const psu = {
    input: document.getElementById('psu-gpu'),
    list: document.getElementById('psu-gpu-list'),
    cpu: document.getElementById('psu-cpu'),
    rgb: document.getElementById('psu-rgb'),
    oc: document.getElementById('psu-oc'),
    hours: document.getElementById('psu-hours'),
    hoursOut: document.getElementById('psu-hours-out'),
    price: document.getElementById('psu-price'),
    priceUnit: document.getElementById('psu-price-unit'),
    result: document.getElementById('psu-result'),
    gpu: null
  };
  const PSU_SIZES = [450, 550, 650, 750, 850, 1000, 1200, 1350, 1600];
  const BASE_SYSTEM_W = 60;
  const CURRENCY = { es: 'EUR', fr: 'EUR', de: 'EUR', it: 'EUR', en: 'USD', ru: 'RUB' };
  const KWH_PRICE = { EUR: 0.2, USD: 0.17, RUB: 6.5 };
  const currency = () => CURRENCY[lang()] || 'EUR';
  let priceEdited = false;

  window.createGpuPicker({
    input: psu.input,
    list: psu.list,
    keepValue: true,
    // Los Mac no usan fuente ATX: fuera
    pool: () => [...pools().desktop, ...pools().workstation].filter(g => g.brand !== 'apple' && window.parseTdp(g.tdp) > 0),
    onSelect: gpu => {
      psu.gpu = gpu;
      renderPsu(true);
    }
  });
  bindSegmented(psu.cpu, () => renderPsu(true));
  [psu.rgb, psu.oc].forEach(el => el.addEventListener('change', () => renderPsu(true)));
  psu.hours.addEventListener('input', () => renderPsu(true));
  psu.price.addEventListener('input', () => { priceEdited = true; renderPsu(true); });

  function connectors(gpu, tdp) {
    if (tdp <= 75) return T('tools.conn_slot');
    if (gpu.brand === 'nvidia' && /RTX (40|50)\d\d/.test(gpu.name) && tdp > 200) return T('tools.conn_12v');
    return T('tools.conn_pcie', { n: Math.max(1, Math.ceil((tdp - 75) / 150)) });
  }

  function renderPsu(userAction) {
    psu.hoursOut.textContent = T('tools.cost_hours_value', { h: fmt(Number(psu.hours.value), Number(psu.hours.value) % 1 ? 1 : 0) });
    const cur = currency();
    psu.priceUnit.textContent = `${new Intl.NumberFormat(lang(), { style: 'currency', currency: cur }).formatToParts(0).find(p => p.type === 'currency').value}/kWh`;
    if (!priceEdited) psu.price.value = KWH_PRICE[cur];
    const gpu = psu.gpu;
    if (!gpu) {
      psu.result.innerHTML = emptyState(ICONS.bolt, T('tools.psu_empty'));
      return;
    }
    const gpuW = window.parseTdp(gpu.tdp);
    const cpuW = Number(checkedValue(psu.cpu));
    const ocFactor = psu.oc.checked ? 1.15 : 1;
    const restW = BASE_SYSTEM_W + (psu.rgb.checked ? 30 : 0);
    const load = Math.round((gpuW + cpuW) * ocFactor + restW);
    const recommended = PSU_SIZES.find(size => size >= load * 1.4) || PSU_SIZES[PSU_SIZES.length - 1];
    const cert = recommended >= 1000 ? '80 PLUS Platinum' : recommended >= 650 ? '80 PLUS Gold' : '80 PLUS Bronze';
    const pct = w => `${(w / recommended) * 100}%`;
    const gpuPart = Math.round(gpuW * ocFactor);
    const cpuPart = Math.round(cpuW * ocFactor);

    // Consumo típico jugando (no siempre al máximo)
    const gamingW = gpuW * 0.85 * ocFactor + cpuW * 0.55 * ocFactor + restW;
    const hours = Number(psu.hours.value);
    const kwhYear = (gamingW * hours * 365) / 1000;
    const kwhPrice = Math.max(0, Number(psu.price.value) || 0);
    const money = v => new Intl.NumberFormat(lang(), { style: 'currency', currency: cur, maximumFractionDigits: cur === 'RUB' ? 0 : 2 }).format(v);

    psu.result.innerHTML = `
      <div class="tool-stats">
        <div class="tool-stat">
          <span class="tool-stat-label">${esc(T('tools.psu_load'))}</span>
          <strong>${fmt(load)} W</strong>
        </div>
        <div class="tool-stat tool-stat-main">
          <span class="tool-stat-label">${esc(T('tools.psu_recommended'))}</span>
          <strong>${fmt(recommended)} W</strong>
          <span class="tool-stat-sub">${esc(cert)}</span>
        </div>
        <div class="tool-stat">
          <span class="tool-stat-label">${esc(T('tools.psu_connectors'))}</span>
          <strong class="tool-stat-text">${esc(connectors(gpu, gpuW))}</strong>
        </div>
      </div>
      <div class="power-bar" role="img" aria-label="${esc(T('tools.psu_breakdown'))}: GPU ${gpuPart} W, CPU ${cpuPart} W, ${esc(T('tools.psu_rest'))} ${restW} W">
        <span class="power-seg power-gpu" style="width:${pct(gpuPart)}"></span>
        <span class="power-seg power-cpu" style="width:${pct(cpuPart)}"></span>
        <span class="power-seg power-rest" style="width:${pct(restW)}"></span>
      </div>
      <ul class="power-legend">
        <li><span class="power-dot power-gpu"></span>GPU · ${fmt(gpuPart)} W</li>
        <li><span class="power-dot power-cpu"></span>CPU · ${fmt(cpuPart)} W</li>
        <li><span class="power-dot power-rest"></span>${esc(T('tools.psu_rest'))} · ${fmt(restW)} W</li>
        <li><span class="power-dot power-free"></span>${esc(T('tools.psu_headroom'))} · ${fmt(recommended - load)} W</li>
      </ul>
      <p class="tool-note">${esc(T('tools.psu_note'))}</p>
      <div class="tool-cost">
        <h3>${esc(T('tools.cost_title'))}</h3>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-label">${esc(T('tools.cost_month'))}</span><strong>${money((kwhYear * kwhPrice) / 12)}</strong></div>
          <div class="tool-stat tool-stat-main"><span class="tool-stat-label">${esc(T('tools.cost_year'))}</span><strong>${money(kwhYear * kwhPrice)}</strong></div>
          <div class="tool-stat"><span class="tool-stat-label">kWh</span><strong>${fmt(kwhYear)}</strong><span class="tool-stat-sub">${esc(T('tools.cost_kwh'))}</span></div>
        </div>
      </div>`;
    if (userAction) trackTool('psu');
  }

  // =====================================================================
  // 3. VRAM NECESARIA
  // =====================================================================
  const vram = {
    mode: document.getElementById('vram-mode'),
    games: document.getElementById('vram-games'),
    ai: document.getElementById('vram-ai'),
    res: document.getElementById('vram-res'),
    quality: document.getElementById('vram-quality'),
    model: document.getElementById('vram-model'),
    quant: document.getElementById('vram-quant'),
    result: document.getElementById('vram-result')
  };
  // GB recomendados: [resolución][calidad]
  const GAME_VRAM = { '1080': { medium: 6, ultra: 8, rt: 10 }, '1440': { medium: 8, ultra: 12, rt: 16 }, '2160': { medium: 12, ultra: 16, rt: 20 } };
  const BYTES_PER_PARAM = { 4: 0.56, 8: 1.06, 16: 2 };

  bindSegmented(vram.mode, mode => {
    vram.games.hidden = mode !== 'games';
    vram.ai.hidden = mode !== 'ai';
    renderVram(true);
  });
  [vram.res, vram.quality, vram.model, vram.quant].forEach(el => bindSegmented(el, () => renderVram(true)));

  function renderVram(userAction) {
    const mode = checkedValue(vram.mode);
    let need;
    if (mode === 'games') {
      need = GAME_VRAM[checkedValue(vram.res)][checkedValue(vram.quality)];
    } else {
      const params = Number(checkedValue(vram.model));
      need = Math.ceil((params * BYTES_PER_PARAM[checkedValue(vram.quant)] * 1.2 + 1.5) * 10) / 10;
    }
    const pool = mode === 'games'
      ? buyable()
      : [...buyable(), ...pools().workstation, ...pools().server].filter(g => priceUsd(g) > 0);
    const fits = pool
      .filter(g => window.parseVram(g.vram) >= need)
      .sort((a, b) => priceUsd(a) - priceUsd(b) || window.parseVram(b.vram) - window.parseVram(a.vram))
      .slice(0, 6);
    const gaugeMax = mode === 'games' ? 24 : Math.max(48, Math.ceil(need / 16) * 16);

    vram.result.innerHTML = `
      <div class="vram-need">
        <span class="tool-stat-label">${esc(T('tools.vram_need'))}</span>
        <strong><span>${fmt(need, need % 1 ? 1 : 0)}</span> GB</strong>
        <div class="vram-gauge" aria-hidden="true"><span style="width:${Math.min(100, (need / gaugeMax) * 100)}%"></span></div>
        <div class="vram-gauge-scale" aria-hidden="true"><span>0</span><span>${gaugeMax} GB</span></div>
      </div>
      ${fits.length ? `
        <h3 class="tool-subtitle">${esc(T('tools.vram_fits'))}</h3>
        <ul class="tool-list tool-list-compact">
          ${fits.map(g => `
            <li class="tool-item">
              ${window.brandBadge(g)}
              <button type="button" class="tool-item-name" data-open-gpu="${esc(g.name)}">${esc(g.name)}</button>
              <span class="tool-item-vram">${esc(g.vram)}</span>
              <span class="tool-price">${window.formatPrice(g.price)}</span>
            </li>`).join('')}
        </ul>` : emptyState(ICONS.chip, T('tools.vram_none'))}
      ${mode === 'ai' ? `<p class="tool-note">${esc(T('tools.vram_ai_note'))}</p>` : ''}`;
    if (userAction) trackTool('vram');
  }

  // ---------- Común ----------
  function emptyState(icon, text) {
    return `<div class="tool-empty"><span class="tool-empty-icon">${icon}</span><p>${esc(text)}</p></div>`;
  }

  document.addEventListener('click', e => {
    const pair = e.target.closest('[data-compare-pair]');
    if (!pair) return;
    window.GPUStore.set('compare', pair.dataset.comparePair.split('|'));
    window.location.href = 'compare.html';
  });

  function renderActive() {
    if (activeTool === 'upgrade') renderUpgrade(false);
    else if (activeTool === 'psu') renderPsu(false);
    else renderVram(false);
  }

  // Estado inicial: la GPU recordada se usa en el asesor y en la calculadora de fuente
  const saved = rememberedGpu() && window.findGpu(rememberedGpu());
  if (saved && pools().desktop.some(g => g.name === saved.name && g.perf > 0)) {
    up.current = pools().desktop.find(g => g.name === saved.name);
    up.input.value = saved.name;
  }
  psu.gpu = (saved && window.parseTdp(saved.tdp) > 0 ? saved : null) || window.findGpu('RTX 5070');
  if (psu.gpu) psu.input.value = psu.gpu.name;

  // Se vuelve a pintar tras cambiar de idioma (moneda y textos)
  window.renderToolsPage = renderActive;
  const originalApply = window.applyTranslations;
  window.applyTranslations = function () {
    originalApply();
    renderActive();
  };

  setTool(activeTool);
})();
