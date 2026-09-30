
// ===== LÓGICA DEL CUESTIONARIO DE GPU =====

let quizAnswers = {
    use: '',
    budget: '',
    perf: ''
};

window.startQuiz = function() {
    document.getElementById('quiz-intro').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
};

window.setQuizAns = function(key, val) {
    quizAnswers[key] = val;
    
    // Lógica de transición
    const currentStepId = key === 'use' ? 'step-1' : (key === 'budget' ? 'step-2' : 'step-3');
    const nextStepId = key === 'use' ? 'step-2' : (key === 'budget' ? 'step-3' : 'quiz-results');
    
    document.getElementById(currentStepId).classList.remove('active');
    document.getElementById(nextStepId).classList.add('active');
    
    if (nextStepId === 'quiz-results') {
        renderQuizResults();
    }
};

window.resetQuiz = function() {
    quizAnswers = { use: '', budget: '', perf: '' };
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.getElementById('quiz-intro').classList.add('active');
};

function renderQuizResults() {
    const container = document.getElementById('quiz-recommendations');
    const results = calculateRecommendations();
    
    const esc = window.escapeHtml;
    if (!results.length) {
        container.innerHTML = window.stateHtml({ icon: window.GPUIcons ? window.GPUIcons.target : '', hint: window.tr('quiz.no_results') });
    } else {
        container.innerHTML = results.map(gpu => {
            const price = window.priceInfo(gpu);
            return `
        <button type="button" class="rec-card" data-open-gpu="${esc(gpu.name)}">
            <span class="rec-tag">${gpu.brand.toUpperCase()}</span>
            <span class="rec-name">${esc(gpu.name)}</span>
            <span class="rec-arch">${esc(gpu.arch)}</span>
            <span class="rec-price${price.missing ? ' is-missing' : ''}">${esc(price.value)}</span>
        </button>`;
        }).join('');
    }
    if (window.GPUProgress) window.GPUProgress.track('quiz');
}

function calculateRecommendations() {
    let pool = [];

    // 1. Filtrar por uso
    if (quizAnswers.use === 'gaming') pool = DESKTOP_GPUS.filter(g => g.year >= 2022);
    else if (quizAnswers.use === 'work') pool = WORKSTATION_GPUS;
    else if (quizAnswers.use === 'mobile') pool = MOBILE_GPUS.filter(g => g.year >= 2023);

    // 2. Presupuesto: precio de lanzamiento en dólares. Las GPUs de portátil no se venden por
    // separado, así que para ellas el presupuesto se traduce en gamas.
    const budgetLimits = {
        low: 400,
        mid: 900,
        high: 99999
    };
    const maxBudget = budgetLimits[quizAnswers.budget];
    const minBudget = quizAnswers.budget === 'mid' ? 400 : (quizAnswers.budget === 'high' ? 900 : 0);
    const laptopTiers = { low: ['entry', 'mid'], mid: ['mid', 'high'], high: ['high', 'ultra'] }[quizAnswers.budget];

    // Sin precio oficial (p = 0) no se puede decir que quepa en un presupuesto: no se recomienda
    let filtered = pool.filter(g => {
        if (quizAnswers.use === 'mobile') return laptopTiers.includes(g.tier);
        const p = window.gpuPrice(g);
        return p > 0 && p >= minBudget && p <= maxBudget;
    });

    // 3. Coincidencia de rendimiento / resolución
    // Ordenamos por la propiedad 'perf' o por TFLOPS (las que no tienen ninguno de los dos, al final)
    const power = g => g.perf || parseFloat(g.tflops) || 0;
    filtered.sort((a, b) => power(b) - power(a));
    
    // Selecciona los mejores 2 o 3
    if (quizAnswers.perf === '1080') return filtered.slice(-3).reverse(); // Opciones más baratas o de entrada para ese rango
    if (quizAnswers.perf === '1440') return filtered.slice(Math.floor(filtered.length/3), Math.floor(filtered.length/3) + 3);
    return filtered.slice(0, 3); // Máximo rendimiento para 4K
}
