// ===== COMPARADOR (hasta 4 GPUs) =====
// Usa la misma lista que la bandeja de comparación (GPUStore 'compare'), así lo que se añade
// desde cualquier página aparece aquí. La URL (?gpus=a,b,c) permite compartir la comparación.
(function () {
  const table = document.getElementById('compare-table');
  if (!table) return;

  const T = (key, vars) => window.tr(key, undefined, vars);
  const esc = s => window.escapeHtml(s);
  const Store = window.GPUStore;
  const MAX = Store.LIMITS.compare;

  const els = {
    input: document.getElementById('compare-add-input'),
    list: document.getElementById('compare-add-list'),
    slots: document.getElementById('compare-slots'),
    chips: document.getElementById('compare-chips'),
    presets: document.getElementById('compare-presets'),
    empty: document.getElementById('compare-empty'),
    results: document.getElementById('compare-results'),
    verdict: document.getElementById('compare-verdict'),
    metrics: document.getElementById('compare-metrics'),
    canvas: document.getElementById('perf-chart'),
    share: document.getElementById('compare-share'),
    clear: document.getElementById('compare-clear')
  };

  const PRESETS = [
    ['RTX 5090', 'Radeon RX 7900 XTX'],
    ['RTX 5070', 'Radeon RX 9070 XT'],
    ['RTX 4060', 'Arc B580'],
    ['GTX 1080 Ti', 'RTX 3060'],
    ['H100 SXM5', 'Instinct MI300X']
  ];

  const resolve = name => window.findGpu(name) || window.searchGpus(name, getAllGpus(), 1)[0] || null;

  // ---- Lista inicial: URL > lista guardada > duelo por defecto ----
  const params = new URLSearchParams(window.location.search);
  let fromUrl = [];
  if (params.get('gpus')) fromUrl = params.get('gpus').split(',');
  else if (params.get('a') || params.get('b')) fromUrl = [params.get('a'), params.get('b')];
  fromUrl = fromUrl.filter(Boolean).map(n => resolve(n.trim())).filter(Boolean).map(g => g.name);
  if (fromUrl.length) Store.set('compare', fromUrl);
  else if (!Store.count('compare')) Store.set('compare', PRESETS[0]);

  // ---- Métricas ----
  const num = v => (Number.isFinite(v) && v > 0 ? v : 0);
  const lang = () => window.currentLang || 'es';
  const fmtNum = (v, digits = 1) => v.toLocaleString(lang(), { maximumFractionDigits: digits });
  const METRICS = [
    { id: 'perf', key: 'compare2.m_perf', value: g => num(window.gpuGamingIndex(g.name)), fmt: v => window.formatPerf(v), higher: true },
    { id: 'tflops', key: 'compare2.m_tflops', value: g => num(parseFloat(g.tflops)), fmt: v => fmtNum(v), unit: 'TFLOPS', higher: true },
    { id: 'vram', key: 'compare2.m_vram', value: g => num(window.parseVram(g.vram)), fmt: v => fmtNum(v, 0), unit: 'GB', higher: true },
    { id: 'bw', key: 'compare2.m_bw', value: g => num(parseFloat(g.bandwidth || g.bw)), fmt: v => fmtNum(v, 0), unit: 'GB/s', higher: true },
    { id: 'tdp', key: 'compare2.m_tdp', value: g => num(window.parseTdp(g.tdp)), fmt: v => fmtNum(v, 0), unit: 'W', higher: false },
    { id: 'price', key: 'compare2.m_price', value: g => num(window.gpuPrice(g)), fmt: v => window.formatPrice(v), higher: false },
    { id: 'ai', key: 'compare2.m_ai', value: g => num(Number(g.ai)), fmt: v => fmtNum(v, 0), unit: 'TFLOPS', higher: true }
  ];
  let metric = 'perf';

  function selected() {
    return Store.get('compare').map(window.findGpu).filter(Boolean);
  }

  // Rendimiento de referencia: índice gaming si hay al menos 2 GPUs con él; si no, TFLOPS
  function perfBasis(gpus) {
    const withIndex = gpus.filter(g => window.gpuGamingIndex(g.name) > 0).length;
    return withIndex >= 2 ? 'perf' : 'tflops';
  }

  function metricById(id) {
    return METRICS.find(m => m.id === id);
  }

  // ---- Selector para añadir GPUs ----
  const picker = window.createGpuPicker({
    input: els.input,
    list: els.list,
    pool: () => getAllGpus(),
    exclude: g => Store.has('compare', g.name),
    onSelect: gpu => {
      if (!Store.add('compare', gpu.name)) {
        window.showToast({ icon: window.GPUIcons.compare, tone: 'warning', text: T('fx.cmp_full') });
      }
      els.input.focus();
    }
  });

  // ---- Renderizado ----
  function renderChips(gpus) {
    els.slots.textContent = T('compare2.slots', { n: gpus.length, max: MAX });
    const chips = gpus.map(g => `
      <li class="compare-chip brand-line-${g.brand}">
        <button type="button" class="compare-chip-main" data-open-gpu="${esc(g.name)}">
          ${window.brandBadge(g)}
          <span class="compare-chip-name">${esc(g.name)}</span>
          <span class="compare-chip-meta">${esc(window.gpuMetaLine(g))}</span>
        </button>
        <button type="button" class="icon-btn" data-compare-remove="${esc(g.name)}" aria-label="${esc(T('fx.remove'))}: ${esc(g.name)}" title="${esc(T('fx.remove'))}">${window.GPUIcons.close}</button>
      </li>`);
    for (let i = gpus.length; i < MAX; i++) {
      chips.push(`<li class="compare-chip compare-chip-empty"><button type="button" data-compare-focus>${window.GPUIcons.search}<span>${esc(T('compare2.add_slot'))}</span></button></li>`);
    }
    els.chips.innerHTML = chips.join('');
    els.input.disabled = gpus.length >= MAX;
    els.input.placeholder = gpus.length >= MAX ? T('compare2.full_placeholder', { max: MAX }) : T('compare2.add_placeholder');
  }

  function renderPresets() {
    const current = [...Store.get('compare')].sort().join('|');
    els.presets.innerHTML = PRESETS.map((pair, i) => {
      const active = [...pair].sort().join('|') === current;
      return `<button type="button" class="preset-btn" data-preset="${i}" aria-pressed="${active}">${pair.map(n => esc(n.replace(/^Radeon /, ''))).join(' <span>vs</span> ')}</button>`;
    }).join('');
  }

  // Tarjeta del veredicto: ganador y diferencia con el segundo
  function verdictCard(labelKey, icon, gpus, valueFn, unitFmt) {
    const scored = gpus.map(g => ({ g, v: valueFn(g) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    if (scored.length < 2) return '';
    const [first, second] = scored;
    const pct = Math.round((first.v / second.v - 1) * 100);
    const detail = pct <= 0
      ? T('compare2.d_tie', { name: esc(second.g.name) })
      : T('compare2.d_more', { pct, name: esc(second.g.name) });
    return `
      <article class="verdict-card">
        <span class="verdict-icon">${window.GPUIcons[icon]}</span>
        <span class="verdict-label">${esc(T(labelKey))}</span>
        <strong class="verdict-winner">${esc(first.g.name)}</strong>
        <span class="verdict-detail">${unitFmt ? `${unitFmt(first.v)} · ` : ''}${detail}</span>
      </article>`;
  }

  function renderVerdict(gpus) {
    const basis = perfBasis(gpus);
    const perfOf = g => metricById(basis).value(g);
    const price = g => metricById('price').value(g);
    const watts = g => metricById('tdp').value(g);
    els.verdict.innerHTML = [
      verdictCard(basis === 'perf' ? 'compare2.fastest' : 'compare2.most_compute', 'bolt', gpus, perfOf),
      verdictCard('compare2.best_value', 'star', gpus, g => (price(g) ? perfOf(g) / price(g) : 0)),
      verdictCard('compare2.most_efficient', 'sparkle', gpus, g => (watts(g) ? perfOf(g) / watts(g) : 0)),
      verdictCard('compare2.most_vram', 'chip', gpus, g => metricById('vram').value(g), v => `${fmtNum(v, 0)} GB`)
    ].join('');
  }

  function renderMetricButtons(gpus) {
    const available = METRICS.filter(m => gpus.filter(g => m.value(g) > 0).length >= 2);
    if (!available.some(m => m.id === metric)) metric = available.length ? available[0].id : 'tflops';
    els.metrics.innerHTML = METRICS.map(m => {
      const ok = available.includes(m);
      return `<button type="button" role="radio" class="segmented-btn" data-metric="${m.id}" aria-checked="${m.id === metric}" ${ok ? '' : 'disabled'}>${esc(T(m.key))}</button>`;
    }).join('');
  }

  // Tabla con las especificaciones en filas y las GPUs en columnas; se marca el mejor valor de cada fila
  function renderTable(gpus) {
    const basis = perfBasis(gpus);
    const perfOf = g => metricById(basis).value(g);
    const priceOf = g => metricById('price').value(g);
    const wattsOf = g => metricById('tdp').value(g);
    const ratio = fn => {
      const values = gpus.map(fn);
      const best = Math.max(...values);
      return values.map(v => (best > 0 && v > 0 ? Math.round((v / best) * 100) : 0));
    };
    const valueRatio = ratio(g => (priceOf(g) ? perfOf(g) / priceOf(g) : 0));
    const wattRatio = ratio(g => (wattsOf(g) ? perfOf(g) / wattsOf(g) : 0));

    const bestIndex = (values, higher) => {
      const valid = values.map((v, i) => [v, i]).filter(([v]) => v > 0);
      if (valid.length < 2) return -1;
      const target = higher ? Math.max(...valid.map(x => x[0])) : Math.min(...valid.map(x => x[0]));
      const winners = valid.filter(([v]) => v === target);
      return winners.length === valid.length ? -1 : winners[0][1];
    };

    const rows = [
      { label: T('table.cat'), cells: gpus.map(g => esc(T(`fx.cat_${window.gpuCategory(g.name)}`))) },
      { label: T('compare2.row_arch'), cells: gpus.map(g => esc(g.arch || '—')) },
      { label: T('ui.year'), cells: gpus.map(g => esc(g.year || '—')) },
      metricRow('perf', T('compare2.m_perf'), g => {
        const v = window.gpuGamingIndex(g.name);
        return v ? `${window.formatPerf(v)}<small>/100</small>` : `<span class="muted" title="${esc(T('compare2.no_perf'))}">—</span>`;
      }),
      metricRow('tflops', wrapWithTooltip('TFLOPS FP32', 'tflops'), g => esc(window.specText(g.tflops))),
      ...(gpus.some(g => g.ai) ? [metricRow('ai', wrapWithTooltip(esc(T('ui.ai_bf16')), 'ai'), g => (g.ai ? window.formatAi(g.ai) : '—'))] : []),
      metricRow('vram', T('table.vram'), g => esc(window.specText(g.vram))),
      metricRow('bw', T('ui.bw'), g => esc(window.specText(g.bandwidth))),
      metricRow('tdp', wrapWithTooltip(T('ui.tdp'), 'tdp'), g => esc(window.specText(g.tdp))),
      metricRow('price', wrapWithTooltip(esc(T('ui.msrp')), 'msrp'), g => {
        const p = window.priceInfo(g);
        return p.missing ? `<span class="muted">${esc(p.value)}</span>` : `${esc(p.value)}<small class="cell-sub">${esc(p.date)}</small>`;
      }),
      ratioRow(T('compare2.row_perf_price'), valueRatio, T('compare2.ratio_hint')),
      ratioRow(T('compare2.row_perf_watt'), wattRatio, T('compare2.ratio_hint')),
      { label: wrapWithTooltip('DLSS / FSR', 'dlss_fsr'), cells: gpus.map(g => esc(getUpscaler(g))) }
    ];

    function metricRow(id, label, cellFn) {
      const m = metricById(id);
      const best = bestIndex(gpus.map(m.value), m.higher);
      return { label, cells: gpus.map(cellFn), best, lower: !m.higher };
    }
    function ratioRow(label, values, hint) {
      const best = values.filter(v => v > 0).length >= 2 ? values.indexOf(100) : -1;
      return {
        label: `<span class="has-tooltip">${esc(label)}<span class="info-icon">i</span><span class="tooltip-box">${esc(hint)}</span></span>`,
        cells: values.map(v => (v ? `<span class="ratio-cell"><span class="ratio-bar"><span style="width:${v}%"></span></span>${v}</span>` : '—')),
        best
      };
    }

    table.innerHTML = `
      <caption class="visually-hidden">${esc(T('sections.compare_title'))} ${esc(T('sections.compare_title_hl'))}</caption>
      <thead>
        <tr>
          <th scope="col"><span class="visually-hidden">${esc(T('table.gpu'))}</span></th>
          ${gpus.map(g => `<th scope="col" class="brand-top-${g.brand}">${window.brandBadge(g)}<button type="button" class="spec-gpu-name" data-open-gpu="${esc(g.name)}">${esc(g.name)}</button></th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <th scope="row">${r.label}${r.lower ? `<small class="lower-better">${esc(T('compare2.lower_better'))}</small>` : ''}</th>
            ${r.cells.map((c, i) => `<td class="${i === r.best ? 'is-best' : ''}">${c}${i === r.best ? `<span class="best-mark" title="${esc(T('compare2.best'))}">${window.GPUIcons.star}<span class="visually-hidden">${esc(T('compare2.best'))}</span></span>` : ''}</td>`).join('')}
          </tr>`).join('')}
      </tbody>`;
  }

  // ---- Gráfica de barras de la métrica elegida ----
  const BRAND_COLORS = { nvidia: '118,185,0', amd: '237,28,36', intel: '0,150,230', apple: '160,160,170' };

  window.renderChart = function () {
    const gpus = selected();
    if (!els.canvas || gpus.length < 2) return;
    const m = metricById(metric);
    const values = gpus.map(m.value);
    const labels = gpus.map(g => g.name);

    const { ctx, width, height } = fitCanvas(els.canvas, 300);
    const compact = width < 440;
    const padding = compact ? { top: 30, right: 12, bottom: 64, left: 58 } : { top: 30, right: 40, bottom: 70, left: 90 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...values, 1) * 1.08;
    const barW = Math.max(compact ? 24 : 30, Math.min(120, (chartW / labels.length) * 0.45));
    const gap = chartW / labels.length;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = maxVal * (1 - i / 4);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = `${compact ? 10 : 11}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(m.id === 'price' ? m.fmt(val) : fmtNum(val, val >= 10 ? 0 : 1), padding.left - (compact ? 6 : 10), y + 4);
    }

    ctx.save();
    ctx.translate(compact ? 10 : 16, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = textColor;
    ctx.font = "10px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${T(m.key)}${m.unit ? ` (${m.unit})` : ''}`, 0, 0);
    ctx.restore();

    values.forEach((val, i) => {
      const x = padding.left + gap * i + (gap - barW) / 2;
      const barH = (val / maxVal) * chartH;
      const y = padding.top + chartH - barH;
      const rgb = BRAND_COLORS[gpus[i].brand] || '120,120,120';
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, `rgba(${rgb},0.9)`);
      grad.addColorStop(1, `rgba(${rgb},0.25)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      else ctx.rect(x, y, barW, barH);
      ctx.fill();

      ctx.fillStyle = isDark ? '#fff' : '#111';
      ctx.font = "bold 12px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(val ? `${m.fmt(val)}${m.unit && m.id !== 'price' ? ` ${m.unit}` : ''}` : '—', x + barW / 2, y - 8);

      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.72)';
      ctx.font = `${compact ? 10 : 11}px 'IBM Plex Sans', sans-serif`;
      const words = labels[i].split(' ');
      const mid = Math.ceil(words.length / 2);
      const labelY = padding.top + chartH + 22;
      ctx.fillText(words.slice(0, mid).join(' '), x + barW / 2, labelY);
      if (words.length > 1) ctx.fillText(words.slice(mid).join(' '), x + barW / 2, labelY + 14);
    });

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();
  };

  let trackTimer;
  window.renderComparePage = function () {
    const gpus = selected();
    renderChips(gpus);
    renderPresets();
    const enough = gpus.length >= 2;
    els.empty.hidden = enough;
    els.results.hidden = !enough;
    if (enough) {
      renderVerdict(gpus);
      renderMetricButtons(gpus);
      renderTable(gpus);
      window.renderChart();
      clearTimeout(trackTimer);
      trackTimer = setTimeout(() => window.GPUProgress.track('compare', gpus.map(g => g.name)), 600);
    }
    // La URL refleja la comparación para poder compartirla
    const url = new URL(window.location.href);
    url.searchParams.delete('a');
    url.searchParams.delete('b');
    if (gpus.length) url.searchParams.set('gpus', gpus.map(g => g.name).join(','));
    else url.searchParams.delete('gpus');
    history.replaceState(null, '', url.pathname + url.search.replace(/%2C/g, ',') + url.hash);
  };

  window.onCompareListChange = () => window.renderComparePage();

  // ---- Eventos ----
  document.addEventListener('click', e => {
    const rm = e.target.closest('[data-compare-remove]');
    if (rm) {
      Store.remove('compare', rm.dataset.compareRemove);
      return;
    }
    if (e.target.closest('[data-compare-focus]')) {
      els.input.focus();
      return;
    }
    const preset = e.target.closest('[data-preset]');
    if (preset) {
      Store.set('compare', PRESETS[Number(preset.dataset.preset)]);
      return;
    }
    const metricBtn = e.target.closest('[data-metric]');
    if (metricBtn && !metricBtn.disabled) {
      metric = metricBtn.dataset.metric;
      els.metrics.querySelectorAll('[data-metric]').forEach(b => b.setAttribute('aria-checked', b === metricBtn));
      window.renderChart();
    }
  });

  // Flechas izquierda/derecha entre métricas (patrón de grupo de radio)
  els.metrics.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const buttons = [...els.metrics.querySelectorAll('[data-metric]:not([disabled])')];
    const idx = buttons.findIndex(b => b.dataset.metric === metric);
    const next = buttons[(idx + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
    next.click();
    next.focus();
  });

  els.share.addEventListener('click', async () => {
    const copied = await window.copyText(window.location.href);
    window.showToast({ icon: window.GPUIcons.share, tone: copied ? 'success' : 'warning', text: copied ? T('fx.share_copied') : window.location.href });
  });
  els.clear.addEventListener('click', () => {
    Store.clear('compare');
    els.input.focus();
  });
})();
