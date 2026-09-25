
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
    
    container.innerHTML = results.map(gpu => `
        <div class="rec-card">
            <span class="rec-tag">${gpu.brand.toUpperCase()}</span>
            <div class="rec-name">${gpu.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">${gpu.arch}</div>
            <div class="rec-price">${window.formatPrice(gpu.price)}</div>
        </div>
    `).join('');
}

function calculateRecommendations() {
    let pool = [];
    
    // 1. Filtrar por uso
    if (quizAnswers.use === 'gaming') pool = GAMING_GPUS;
    else if (quizAnswers.use === 'work') pool = [...WORKSTATION_GPUS, ...SERVER_GPUS];
    else if (quizAnswers.use === 'mobile') pool = MOBILE_GPUS;
    
    // 2. Puntuación por presupuesto (convierte el texto del precio a número)
    const getPrice = (p) => window.priceToUsd(p) || 0;
    
    const budgetLimits = {
        low: 400,
        mid: 900,
        high: 99999
    };
    const maxBudget = budgetLimits[quizAnswers.budget];
    const minBudget = quizAnswers.budget === 'mid' ? 400 : (quizAnswers.budget === 'high' ? 900 : 0);
    
    let filtered = pool.filter(g => {
        const p = getPrice(g.price);
        return p >= minBudget && p <= maxBudget;
    });

    // 3. Coincidencia de rendimiento / resolución
    // Ordenamos por la propiedad 'perf' o por TFLOPS
    filtered.sort((a, b) => (b.perf || parseFloat(b.tflops)) - (a.perf || parseFloat(a.tflops)));
    
    // Selecciona los mejores 2 o 3
    if (quizAnswers.perf === '1080') return filtered.slice(-3).reverse(); // Opciones más baratas o de entrada para ese rango
    if (quizAnswers.perf === '1440') return filtered.slice(Math.floor(filtered.length/3), Math.floor(filtered.length/3) + 3);
    return filtered.slice(0, 3); // Máximo rendimiento para 4K
}
