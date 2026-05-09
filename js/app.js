// ===== THEME TOGGLE =====
(function initTheme() {
  const saved = localStorage.getItem('gpu-universe-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gpu-universe-theme', next);
    });
  });
})();

// ===== PARTICLES =====
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 35 : 80;
  const connectionDist = isMobile ? 90 : 120;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.3),
      dy: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.3),
      alpha: Math.random() * 0.5 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 255, ${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDist) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124,58,255,${0.08 * (1 - dist / connectionDist)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ===== NAVBAR SCROLL =====
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

// ===== UTILS =====
window.formatPrice = function(priceStr) {
  if (!priceStr || priceStr === 'N/A') return priceStr;
  
  const symbol = typeof window.t === 'function' ? window.t('ui.currency') : '$';
  const lang = window.currentLang || 'es';
  
  let numericValue = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  if (isNaN(numericValue)) return priceStr;

  const rates = { es: 0.92, en: 1, fr: 0.92, de: 0.92, it: 0.92, ru: 92.5 };
  const rate = rates[lang] || 1;
  let converted = Math.round(numericValue * rate);
  
  let formatted = converted.toLocaleString(lang === 'ru' ? 'ru-RU' : 'es-ES');
  
  if (lang === 'ru') return `~${formatted} ${symbol}`;
  if (lang === 'en') return `~$${formatted}`;
  return `~${formatted}${symbol}`;
};

// ===== SCROLL REVEAL =====
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// ===== BUILD COMPONENTS =====
function wrapWithTooltip(label, defKey) {
  const def = (typeof window.t === 'function') ? window.t('defs.' + defKey) : '';
  if (!def || def === 'defs.' + defKey) {
    return label; // Fallback: just render the label if translation not ready
  }
  return `<span class="has-tooltip">${label}<span class="info-icon">i</span><span class="tooltip-box">${def}</span></span>`;
}

function buildGpuCard(gpu) {
  const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  const tierMap = { entry: 'Entrada', mid: 'Gama Media', high: 'Alto', ultra: 'Ultra' };
  return `
    <div class="gpu-card reveal" onclick="openGpuModal('${gpu.name}')" style="cursor: pointer;">
      <div class="gpu-card-header">
        <span class="gpu-brand brand-${gpu.brand}">${brandMap[gpu.brand]}</span>
        <span class="gpu-tier tier-${gpu.tier}">${typeof window.t === "function" && window.t("ui.tier_" + gpu.tier) !== "ui.tier_" + gpu.tier ? window.t("ui.tier_" + gpu.tier) : tierMap[gpu.tier]}</span>
      </div>
      <div class="gpu-name">${gpu.name}</div>
      <div class="gpu-arch">${gpu.arch}</div>
      <div class="gpu-specs">
        <div class="spec-item"><label>${typeof t === "function" ? window.t("table.vram") : "VRAM"}</label><span>${gpu.vram}</span></div>
        <div class="spec-item"><label>${wrapWithTooltip('TFLOPS FP32', 'tflops')}</label><span>${gpu.tflops}</span></div>
        <div class="spec-item"><label>${typeof t === "function" ? window.t("ui.bw") : "Ancho de Banda"}</label><span>${gpu.bandwidth}</span></div>
        <div class="spec-item"><label>${wrapWithTooltip(typeof window.t === "function" ? window.t("ui.tdp") || "TDP" : "TDP", 'tdp')}</label><span>${gpu.tdp}</span></div>
      </div>
      <div class="gpu-perf-bar">
        <div class="gpu-perf-fill ${gpu.fillColor}" data-width="${gpu.perf}"></div>
      </div>
      <div class="perf-label">
        <span>${typeof window.t === "function" ? window.t("ui.relative_perf") || "Rendimiento relativo" : "Rendimiento relativo"}</span><span>${gpu.perf}%</span>
      </div>
      <div class="gpu-price">${window.formatPrice(gpu.price)} <small>${typeof window.t === "function" ? window.t("ui.usd_approx") || "USD aprox." : "USD aprox."}</small></div>
    </div>
  `;
}

function buildServerCard(gpu) {
  return `
    <div class="server-card ${gpu.cssClass} reveal" onclick="openGpuModal('${gpu.name}')" style="cursor: pointer;">
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

// ===== RENDER LOGIC =====
window.renderAll = function() {
  const gg = document.getElementById('gaming-grid');
  if (gg) gg.innerHTML = GAMING_GPUS.map(buildGpuCard).join('');
  
  const wg = document.getElementById('workstation-grid');
  if (wg) wg.innerHTML = WORKSTATION_GPUS.map(buildGpuCard).join('');
  
  const mg = document.getElementById('mobile-grid');
  if (mg && typeof MOBILE_GPUS !== 'undefined') mg.innerHTML = MOBILE_GPUS.map(buildGpuCard).join('');
  
  const sg = document.getElementById('server-grid');
  if (sg) sg.innerHTML = SERVER_GPUS.map(buildServerCard).join('');
  
  if (document.getElementById('compare-table')) renderCompareTable();
  if (document.getElementById('timeline-container')) renderTimeline();
  if (document.getElementById('perf-chart')) renderChart();
  
  document.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('visible');
    revealObs.observe(el);
  });

  document.querySelectorAll('.gpu-card').forEach(card => barObs.observe(card));
};

// ===== DYNAMIC COMPARISON =====
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

  // Set defaults
  window.selectForCompare('RTX 5090', 'A');
  window.selectForCompare('RX 7900 XTX', 'B');
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

window.renderCompareTable = function() {
  const table = document.getElementById('compare-table');
  if (!table) return;
  
  const selectedGpus = [];
  if (window.gpuA) selectedGpus.push(window.gpuA);
  if (window.gpuB) selectedGpus.push(window.gpuB);
  
  const displayData = selectedGpus.length > 0 ? selectedGpus : (typeof COMPARE_DATA !== 'undefined' ? COMPARE_DATA.slice(0, 4) : []);

  table.innerHTML = `
    <thead>
      <tr>
        <th>${typeof t === "function" ? window.t("table.gpu") : "GPU"}</th>
        <th>${typeof t === "function" ? window.t("table.vram") : "Memoria"}</th>
        <th>${wrapWithTooltip('TFLOPS', 'tflops')}</th>
        <th>${typeof t === "function" ? window.t("table.bw") : "Ancho Banda"}</th>
        <th>${wrapWithTooltip('TDP', 'tdp')}</th>
        <th>${typeof t === "function" ? window.t("table.price") : "Precio Est."}</th>
      </tr>
    </thead>
    <tbody>
      ${displayData.map(r => `
        <tr class="reveal visible">
          <td><strong>${r.name}</strong><br><small style="opacity:0.6">${r.brand.toUpperCase()} · ${r.arch}</small></td>
          <td class="mono">${r.vram}</td>
          <td class="mono highlight-cell">${parseFloat(r.tflops).toLocaleString()}</td>
          <td class="mono">${r.bandwidth || (r.bw ? r.bw + ' GB/s' : '-')}</td>
          <td class="mono">${r.tdp || '-'}</td>
          <td class="mono">${window.formatPrice(r.price)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
};

window.renderChart = function() {
  const canvas = document.getElementById('perf-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const selectedGpus = [];
  if (window.gpuA) selectedGpus.push(window.gpuA);
  if (window.gpuB) selectedGpus.push(window.gpuB);
  
  const displayData = selectedGpus.length > 0 ? selectedGpus : (typeof COMPARE_DATA !== 'undefined' ? COMPARE_DATA.slice(0, 4) : []);

  const labels = displayData.map(g => g.name);
  const tflopsData = displayData.map(g => parseFloat(g.tflops));
  const colors = displayData.map(g => g.brand === 'nvidia' ? 'rgba(118,185,0,0.8)' : (g.brand === 'amd' ? 'rgba(237,28,36,0.8)' : 'rgba(0,212,255,0.8)'));

  const containerW = canvas.parentElement.offsetWidth - 64;
  canvas.width = containerW;
  // Adaptive height: taller when more bars, but capped
  const baseHeight = 300;
  const perBarExtra = Math.max(0, (displayData.length - 2) * 20);
  canvas.height = Math.min(baseHeight + perBarExtra, 460);

  const maxVal = Math.max(...tflopsData, 10);
  const padding = { top: 30, right: 40, bottom: 70, left: 90 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;

  // Bar width: cap at 120px, and on large screens with few bars don't stretch too wide
  const maxBarW = 120;
  const minBarW = 30;
  const barW = Math.max(minBarW, Math.min(maxBarW, chartW / labels.length * 0.45));
  const gap = chartW / labels.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Determine text color from theme
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i;
    const val = Math.round(maxVal * (1 - i / 5));
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val.toLocaleString(), padding.left - 10, y + 4);
  }

  // TFLOPS label on Y axis
  ctx.save();
  ctx.translate(16, padding.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = textColor;
  ctx.font = '10px Outfit, sans-serif';
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
    ctx.roundRect(x, y, barW, barH, [8, 8, 0, 0]);
    ctx.fill();

    // Value on top of bar
    ctx.fillStyle = isDark ? '#fff' : '#111';
    ctx.font = 'bold 12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(val.toLocaleString(), x + barW / 2, y - 8);

    // Label: wrap long names over 2 lines
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
    ctx.font = '11px Outfit';
    const maxLabelW = Math.max(gap - 4, barW + 20);
    const words = labels[i].split(' ');
    let line1 = '', line2 = '';
    let midIdx = Math.ceil(words.length / 2);
    line1 = words.slice(0, midIdx).join(' ');
    line2 = words.slice(midIdx).join(' ');
    const labelY = padding.top + chartH + 22;
    ctx.fillText(line1, x + barW / 2, labelY);
    if (line2) ctx.fillText(line2, x + barW / 2, labelY + 14);
  });

  // Axes
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();
};


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
function getAllGpus() {
  const all = [
    ...(typeof ALL_DOMESTIC_GPUS !== 'undefined' ? ALL_DOMESTIC_GPUS : []),
    ...GAMING_GPUS,
    ...WORKSTATION_GPUS,
    ...SERVER_GPUS,
    ...(typeof MOBILE_GPUS !== 'undefined' ? MOBILE_GPUS : [])
  ];
  return Array.from(new Map(all.map(item => [item.name, item])).values());
}

window.openGpuModal = function(name) {
  const gpus = getAllGpus();
  const gpu = gpus.find(g => g.name === name);
  if (!gpu) return;

  const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  const modalBody = document.getElementById('modal-body');
  const modalOverlay = document.getElementById('gpu-modal');
  
  modalBody.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${gpu.name}</div>
      <div class="modal-subtitle">${brandMap[gpu.brand]} | ${gpu.arch} ${gpu.year ? '| Año: ' + gpu.year : ''}</div>
    </div>
    <div class="modal-grid">
      <div class="modal-item"><label>${typeof window.t === "function" ? window.t("table.vram") : "Memoria VRAM"}</label><span>${gpu.vram || '-'}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip('TFLOPS', 'tflops')}</label><span>${gpu.tflops || '-'}</span></div>
      <div class="modal-item"><label>${typeof window.t === "function" ? window.t("ui.bw") : "Ancho de Banda"}</label><span>${gpu.bandwidth || gpu.bw || "-"}</span></div>
      <div class="modal-item"><label>${wrapWithTooltip(typeof window.t === "function" ? window.t("ui.tdp") || "TDP / Consumo" : "TDP / Consumo", 'tdp')}</label><span>${gpu.tdp || '-'}</span></div>
      ${gpu.price ? `<div class="modal-item"><label>${typeof window.t === "function" ? window.t("ui.price") : "Precio Estimado"}</label><span>${window.formatPrice(gpu.price)}</span></div>` : ''}
      ${gpu.tier ? `<div class="modal-item"><label>${typeof window.t === "function" ? window.t("table.cat") : "Gama"}</label><span style="text-transform: capitalize;">${typeof window.t === "function" ? window.t("ui.tier_" + gpu.tier) : gpu.tier}</span></div>` : ''}
      <div class="modal-item"><label>${wrapWithTooltip('DLSS / FSR', 'dlss_fsr')}</label><span>${gpu.brand === 'nvidia' ? 'DLSS 3.5' : (gpu.brand === 'amd' ? 'FSR 3.1' : 'XeSS')}</span></div>
    </div>
    ${gpu.desc ? `<div style="margin-top: 1.5rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">${typeof gpu.desc === 'object' ? gpu.desc[window.currentLang || 'es'] : gpu.desc}</div>` : ''}
  `;
  
  modalOverlay.classList.add('active');
  const searchResults = document.getElementById('search-results');
  const searchInput = document.getElementById('gpu-search');
  if (searchResults) searchResults.classList.remove('active');
  if (searchInput) searchInput.value = '';
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      mobileBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileBtn.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !e.target.closest('.nav-links') && !e.target.closest('#mobile-menu-btn')) {
        mobileBtn.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
  }

  // Search
  const searchInput = document.getElementById('gpu-search');
  const searchResults = document.getElementById('search-results');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const term = e.target.value.toLowerCase().trim();
        if (term.length < 2) {
          searchResults.classList.remove('active');
          return;
        }
        const gpus = getAllGpus();
        const filtered = gpus.filter(g => g.name.toLowerCase().includes(term) || g.arch.toLowerCase().includes(term));
        if (filtered.length > 0) {
          searchResults.innerHTML = filtered.slice(0, 8).map(g => `
            <div class="search-result-item" onclick="openGpuModal('${g.name}')">
              <span class="sr-name">${g.name}</span>
              <span class="sr-arch">${g.brand.toUpperCase()} · ${g.year || g.arch}</span>
            </div>
          `).join('');
          searchResults.classList.add('active');
        } else {
          searchResults.innerHTML = `<div style="padding: 0.5rem; color: #888; font-size: 0.8rem;">${typeof window.t === "function" ? window.t("ui.no_results") : "No se encontraron resultados"}</div>`;
          searchResults.classList.add('active');
        }
      }, 200);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) searchResults.classList.remove('active');
    });
  }

  // Modal
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('gpu-modal');
  if (modalClose) modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
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

  // Init
  initComparisonSelectors();
  window.renderAll();

  // Chart resize: redraw on window resize with debounce
  let chartResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => {
      if (document.getElementById('perf-chart')) window.renderChart();
    }, 150);
  });
});

