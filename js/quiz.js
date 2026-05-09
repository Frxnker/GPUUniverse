
// ===== GPU QUIZ LOGIC =====

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
    
    // Transition logic
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
        <div class="rec-card" onclick="openGpuModal('${gpu.name}')" style="cursor:pointer">
            <span class="rec-tag">${gpu.brand.toUpperCase()}</span>
            <div class="rec-name">${gpu.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">${gpu.arch}</div>
            <div class="rec-price">${window.formatPrice(gpu.price)}</div>
        </div>
    `).join('');
}

function calculateRecommendations() {
    let pool = [];
    
    // 1. Filter by Use
    if (quizAnswers.use === 'gaming') pool = GAMING_GPUS;
    else if (quizAnswers.use === 'work') pool = [...WORKSTATION_GPUS, ...SERVER_GPUS];
    else if (quizAnswers.use === 'mobile') pool = MOBILE_GPUS;
    
    // 2. Budget Scoring (Convert price string to number)
    const getPrice = (p) => parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
    
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

    // 3. Performance / Resolution matching
    // We sort by 'perf' property or TFLOPS
    filtered.sort((a, b) => (b.perf || parseFloat(b.tflops)) - (a.perf || parseFloat(a.tflops)));
    
    // Select top 2 or 3
    if (quizAnswers.perf === '1080') return filtered.slice(-3).reverse(); // Cheaper/Entry options in that range
    if (quizAnswers.perf === '1440') return filtered.slice(Math.floor(filtered.length/3), Math.floor(filtered.length/3) + 3);
    return filtered.slice(0, 3); // Top performance for 4K
}
