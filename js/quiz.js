// ===== RECOMENDADOR DE GPU (cuestionario de la portada) =====
// Tres preguntas (uso, presupuesto y resolución) y hasta 3 GPUs recomendadas.
// Los botones del HTML llevan data-quiz-start, data-quiz-key/data-quiz-value y data-quiz-reset
// (sin onclick en línea). Solo se expone window.GPUQuiz.recommend, que usan las pruebas.
(function () {
  const STEP_AFTER = { use: 'step-2', budget: 'step-3', perf: 'quiz-results' };
  let answers = { use: '', budget: '', perf: '' };

  // Hasta 3 GPUs para unas respuestas { use, budget, perf }
  function recommend({ use, budget, perf }) {
    // 1. Filtrar por uso
    let pool = [];
    if (use === 'gaming') pool = DESKTOP_GPUS.filter(g => g.year >= 2022);
    else if (use === 'work') pool = WORKSTATION_GPUS;
    else if (use === 'mobile') pool = MOBILE_GPUS.filter(g => g.year >= 2023);

    // 2. Presupuesto: precio de lanzamiento en dólares. Las GPUs de portátil no se venden por
    // separado, así que para ellas el presupuesto se traduce en gamas.
    const maxBudget = { low: 400, mid: 900, high: 99999 }[budget];
    const minBudget = budget === 'mid' ? 400 : (budget === 'high' ? 900 : 0);
    const laptopTiers = { low: ['entry', 'mid'], mid: ['mid', 'high'], high: ['high', 'ultra'] }[budget] || [];

    // Sin precio oficial (p = 0) no se puede decir que quepa en un presupuesto: no se recomienda
    const filtered = pool.filter(g => {
      if (use === 'mobile') return laptopTiers.includes(g.tier);
      const p = window.gpuPrice(g);
      return p > 0 && p >= minBudget && p <= maxBudget;
    });

    // 3. Resolución: se ordena por índice o TFLOPS (las que no tienen ninguno de los dos, al final)
    const power = g => g.perf || parseFloat(g.tflops) || 0;
    filtered.sort((a, b) => power(b) - power(a));
    if (perf === '1080') return filtered.slice(-3).reverse(); // las más asequibles del rango
    if (perf === '1440') return filtered.slice(Math.floor(filtered.length / 3), Math.floor(filtered.length / 3) + 3);
    return filtered.slice(0, 3); // 4K: las más potentes
  }

  window.GPUQuiz = { recommend };

  const box = document.getElementById('quiz-box');
  if (!box) return;

  // Muestra un paso y lleva el foco a su título (teclado y lectores de pantalla siguen el cuestionario)
  function showStep(id) {
    box.querySelectorAll('.quiz-step').forEach(step => step.classList.toggle('active', step.id === id));
    const heading = document.getElementById(id).querySelector('h3');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  function renderResults() {
    const container = document.getElementById('quiz-recommendations');
    const results = recommend(answers);
    const esc = window.escapeHtml;
    if (!results.length) {
      container.innerHTML = window.stateHtml({ icon: window.GPUIcons ? window.GPUIcons.target : '', hint: window.tr('quiz.no_results') });
    } else {
      container.innerHTML = results.map(gpu => {
        const price = window.priceInfo(gpu);
        return `
        <button type="button" class="rec-card" data-open-gpu="${esc(gpu.name)}">
          <span class="rec-tag">${esc(gpu.brand.toUpperCase())}</span>
          <span class="rec-name">${esc(gpu.name)}</span>
          <span class="rec-arch">${esc(gpu.arch)}</span>
          <span class="rec-price${price.missing ? ' is-missing' : ''}">${esc(price.value)}</span>
        </button>`;
      }).join('');
    }
    if (window.GPUProgress) window.GPUProgress.track('quiz');
  }

  box.addEventListener('click', e => {
    if (e.target.closest('[data-quiz-start]')) {
      showStep('step-1');
      return;
    }
    const option = e.target.closest('[data-quiz-key]');
    if (option && option.dataset.quizKey in STEP_AFTER) {
      answers[option.dataset.quizKey] = option.dataset.quizValue;
      const next = STEP_AFTER[option.dataset.quizKey];
      if (next === 'quiz-results') renderResults();
      showStep(next);
      return;
    }
    if (e.target.closest('[data-quiz-reset]')) {
      answers = { use: '', budget: '', perf: '' };
      showStep('quiz-intro');
    }
  });
})();
