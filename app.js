// ===== PARTICLES =====
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
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

    // connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124,58,255,${0.08 * (1 - dist / 120)})`;
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
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== COUNTER ANIMATION =====
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

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('.stat-num').forEach(animateCounter);
      counterObs.disconnect();
    }
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) counterObs.observe(heroStats);

// ===== SCROLL REVEAL =====
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// ===== BUILD GPU CARDS =====
function buildGpuCard(gpu) {
  const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  const tierMap = { entry: 'Entrada', mid: 'Gama Media', high: 'Alto', ultra: 'Ultra' };
  return `
    <div class="gpu-card reveal" onclick="openGpuModal('${gpu.name}')" style="cursor: pointer;">
      <div class="gpu-card-header">
        <span class="gpu-brand brand-${gpu.brand}">${brandMap[gpu.brand]}</span>
        <span class="gpu-tier tier-${gpu.tier}">${tierMap[gpu.tier]}</span>
      </div>
      <div class="gpu-name">${gpu.name}</div>
      <div class="gpu-arch">${gpu.arch}</div>
      <div class="gpu-specs">
        <div class="spec-item"><label>VRAM</label><span>${gpu.vram}</span></div>
        <div class="spec-item"><label>TFLOPs FP32</label><span>${gpu.tflops}</span></div>
        <div class="spec-item"><label>Ancho de Banda</label><span>${gpu.bandwidth}</span></div>
        <div class="spec-item"><label>TDP</label><span>${gpu.tdp}</span></div>
      </div>
      <div class="gpu-perf-bar">
        <div class="gpu-perf-fill ${gpu.fillColor}" data-width="${gpu.perf}"></div>
      </div>
      <div class="perf-label">
        <span>Rendimiento relativo</span><span>${gpu.perf}%</span>
      </div>
      <div class="gpu-price">${gpu.price} <small>USD aprox.</small></div>
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
        <div class="server-desc">${gpu.desc}</div>
      </div>
      <div class="server-specs">
        <div class="server-spec highlight"><label>VRAM</label><span>${gpu.vram}</span></div>
        <div class="server-spec highlight2"><label>TFLOPS INT8</label><span>${gpu.tflops}</span></div>
        <div class="server-spec highlight3"><label>Ancho de Banda</label><span>${gpu.bandwidth}</span></div>
        <div class="server-spec"><label>TDP</label><span>${gpu.tdp}</span></div>
        <div class="server-spec"><label>Interconexión</label><span>${gpu.interconnect}</span></div>
        <div class="server-spec"><label>Caso de Uso</label><span style="font-size:0.8rem">${gpu.use}</span></div>
      </div>
    </div>
  `;
}

// Render Gaming
const gamingGrid = document.getElementById('gaming-grid');
gamingGrid.innerHTML = GAMING_GPUS.map(buildGpuCard).join('');

// Render Workstation
const wsGrid = document.getElementById('workstation-grid');
wsGrid.innerHTML = WORKSTATION_GPUS.map(buildGpuCard).join('');

// Render Server
const serverGrid = document.getElementById('server-grid');
serverGrid.innerHTML = SERVER_GPUS.map(buildServerCard).join('');

// ===== COMPARE TABLE =====
(function buildTable() {
  const table = document.getElementById('compare-table');
  const headers = ['Modelo', 'Categoría', 'TFLOPS FP32/INT8', 'VRAM', 'Ancho de Banda', 'Precio Est.'];
  table.innerHTML = `
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>
      ${COMPARE_DATA.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.cat}</td>
          <td class="mono highlight-cell">${r.tflops.toLocaleString()}</td>
          <td class="mono">${r.vram}</td>
          <td class="mono">${r.bw.toLocaleString()} GB/s</td>
          <td class="mono">${r.price}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
})();

// ===== TIMELINE =====
(function buildTimeline() {
  const container = document.getElementById('timeline-container');
  container.innerHTML = TIMELINE_DATA.map(item => `
    <div class="timeline-item reveal">
      <div class="timeline-dot"></div>
      <div class="timeline-year">${item.year}</div>
      <h4>${item.title}</h4>
      <p>${item.desc}</p>
    </div>
  `).join('');
})();

// ===== OBSERVE REVEALS =====
setTimeout(() => {
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
}, 100);

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
document.querySelectorAll('.gpu-card').forEach(card => barObs.observe(card));

// ===== CATEGORY CARDS CLICK =====
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', () => {
    const href = card.dataset.href;
    if (href) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  });
});

// ===== PERFORMANCE CHART =====
(function buildChart() {
  const canvas = document.getElementById('perf-chart');
  const ctx = canvas.getContext('2d');

  const labels = ['RTX 4060', 'RX 9070 XT', 'RTX 4090', 'RTX 5090', 'RTX 6000 Ada', 'H100 SXM', 'H200 SXM', 'MI300X'];
  const tflopsData = [15.1, 73.0, 82.6, 209.8, 91.1, 3028, 3958, 5220];
  const colors = [
    'rgba(0,255,136,0.8)', 'rgba(237,28,36,0.8)', 'rgba(118,185,0,0.8)',
    'rgba(255,215,0,0.8)', 'rgba(118,185,0,0.8)', 'rgba(0,212,255,0.6)',
    'rgba(124,58,255,0.8)', 'rgba(237,28,36,0.8)'
  ];

  // responsive
  canvas.width = canvas.parentElement.offsetWidth - 64;
  canvas.height = 360;

  const maxVal = Math.max(...tflopsData);
  const padding = { top: 20, right: 20, bottom: 80, left: 80 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;
  const barW = chartW / labels.length * 0.6;
  const gap = chartW / labels.length;

  // grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i;
    const val = Math.round(maxVal * (1 - i / 5));
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val.toLocaleString(), padding.left - 10, y + 4);
  }

  // bars (animated)
  let progress = 0;
  function animBars() {
    ctx.clearRect(padding.left, padding.top, chartW, chartH);
    // redraw grid
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
    }
    tflopsData.forEach((val, i) => {
      const x = padding.left + gap * i + (gap - barW) / 2;
      const fullH = (val / maxVal) * chartH;
      const animH = fullH * Math.min(progress, 1);
      const y = padding.top + chartH - animH;

      // gradient bar
      const grad = ctx.createLinearGradient(0, y, 0, y + animH);
      grad.addColorStop(0, colors[i]);
      grad.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, animH, [6, 6, 0, 0]);
      ctx.fill();

      // label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barW / 2, padding.top + chartH + 12);
      ctx.rotate(-0.5);
      ctx.fillText(labels[i], 0, 0);
      ctx.restore();
    });

    if (progress < 1) {
      progress += 0.025;
      requestAnimationFrame(animBars);
    }
  }

  // trigger on scroll
  const chartObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animBars(); chartObs.disconnect(); }
  }, { threshold: 0.3 });
  chartObs.observe(canvas);

  // axis
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();

  // Y axis label
  ctx.save();
  ctx.translate(16, padding.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TFLOPS (FP32 / INT8)', 0, 0);
  ctx.restore();
})();

// ===== SEARCH & MODAL LOGIC =====
const searchInput = document.getElementById('gpu-search');
const searchResults = document.getElementById('search-results');
const modalOverlay = document.getElementById('gpu-modal');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');

function getAllGpus() {
  const all = [...(typeof ALL_DOMESTIC_GPUS !== 'undefined' ? ALL_DOMESTIC_GPUS : []), ...GAMING_GPUS, ...WORKSTATION_GPUS, ...SERVER_GPUS];
  return Array.from(new Map(all.map(item => [item.name, item])).values());
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
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
      searchResults.innerHTML = '<div style="padding: 0.5rem; color: #888; font-size: 0.8rem;">No se encontraron resultados</div>';
      searchResults.classList.add('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.classList.remove('active');
    }
  });
}

window.openGpuModal = function(name) {
  const gpus = getAllGpus();
  const gpu = gpus.find(g => g.name === name);
  if (!gpu) return;

  const brandMap = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };
  
  modalBody.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${gpu.name}</div>
      <div class="modal-subtitle">${brandMap[gpu.brand]} | ${gpu.arch} ${gpu.year ? '| Año: ' + gpu.year : ''}</div>
    </div>
    <div class="modal-grid">
      <div class="modal-item"><label>Memoria VRAM</label><span>${gpu.vram || '-'}</span></div>
      <div class="modal-item"><label>TFLOPS</label><span>${gpu.tflops || '-'}</span></div>
      <div class="modal-item"><label>Ancho de Banda</label><span>${gpu.bandwidth || '-'}</span></div>
      <div class="modal-item"><label>TDP / Consumo</label><span>${gpu.tdp || '-'}</span></div>
      ${gpu.price ? `<div class="modal-item"><label>Precio Estimado</label><span>${gpu.price}</span></div>` : ''}
      ${gpu.tier ? `<div class="modal-item"><label>Gama</label><span style="text-transform: capitalize;">${gpu.tier}</span></div>` : ''}
    </div>
    ${gpu.desc ? `<div style="margin-top: 1.5rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">${gpu.desc}</div>` : ''}
  `;
  
  modalOverlay.classList.add('active');
  if (searchResults) searchResults.classList.remove('active');
  if (searchInput) searchInput.value = '';
};

if (modalClose) {
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
}
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });
}
