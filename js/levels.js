// ===== PÁGINA DE NIVELES: perfil, retos jugables, camino de niveles, logros y colores =====
(function () {
  const page = document.getElementById('levels-page');
  if (!page) return;

  const T = (key, vars) => window.tr(key, undefined, vars);
  const esc = s => window.escapeHtml(s);
  const ICONS = window.GPUIcons;
  const Progress = window.GPUProgress;
  const Store = window.GPUStore;

  const els = {
    profile: document.getElementById('profile-card'),
    howto: document.getElementById('howto-list'),
    games: document.getElementById('games-grid'),
    stage: document.getElementById('game-stage'),
    path: document.getElementById('level-path'),
    achProgress: document.getElementById('ach-progress'),
    ach: document.getElementById('ach-grid'),
    colors: document.getElementById('color-grid'),
    reset: document.getElementById('reset-zone')
  };

  // ---------- Datos para las preguntas ----------
  const pools = window.getGpuPools();
  const perfPool = pools.desktop.filter(g => g.perf > 0);
  const yearPool = pools.desktop.filter(g => parseInt(g.year) >= 2009 && parseInt(g.year) <= 2025);
  const family = g => String(g.arch || '').split('/')[0].trim();
  const archPool = pools.desktop.filter(g => family(g));

  // Generador pseudoaleatorio con semilla (el reto diario es igual para todos ese día)
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pick = (list, rng) => list[Math.floor(rng() * list.length)];
  function shuffle(list, rng) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // ¿Cuál rinde más? Normal: diferencia clara (15 %–4×). Experto: muy igualadas (3 %–15 %)
  function hlQuestion(rng, expert) {
    for (let tries = 0; tries < 400; tries++) {
      const a = pick(perfPool, rng);
      const b = pick(perfPool, rng);
      if (a === b || a.perf === b.perf) continue;
      const ratio = Math.max(a.perf, b.perf) / Math.min(a.perf, b.perf);
      if (expert ? ratio >= 1.03 && ratio <= 1.15 : ratio >= 1.15 && ratio <= 4) {
        return { type: 'hl', options: [a, b], correct: a.perf > b.perf ? 0 : 1 };
      }
    }
    return null;
  }

  function yearQuestion(rng) {
    const gpu = pick(yearPool, rng);
    const year = parseInt(gpu.year);
    const years = new Set([year]);
    while (years.size < 4) {
      const candidate = year + Math.round(rng() * 8 - 4);
      if (candidate >= 2009 && candidate <= 2025) years.add(candidate);
    }
    const options = shuffle([...years], rng);
    return { type: 'year', gpu, options: options.map(String), correct: options.indexOf(year) };
  }

  function archQuestion(rng) {
    const gpu = pick(archPool, rng);
    const answer = family(gpu);
    const sameBrand = shuffle([...new Set(archPool.filter(g => g.brand === gpu.brand).map(family))].filter(f => f !== answer), rng);
    const others = shuffle([...new Set(archPool.map(family))].filter(f => f !== answer && !sameBrand.includes(f)), rng);
    const options = shuffle([answer, ...[...sameBrand, ...others].slice(0, 3)], rng);
    return { type: 'arch', gpu, options, correct: options.indexOf(answer) };
  }

  const GAMES = {
    daily: { icon: 'star', total: 5, xp: 8, types: ['hl', 'year', 'arch', 'hl', 'year'], seeded: true },
    hl: { icon: 'bolt', total: 10, xp: 5, types: ['hl'] },
    year: { icon: 'calendar', total: 10, xp: 6, types: ['year'] },
    arch: { icon: 'chip', total: 10, xp: 6, types: ['arch'] },
    time: { icon: 'hourglass', total: 0, xp: 4, types: ['hl'], seconds: 60 }
  };
  const GAME_ORDER = ['daily', 'hl', 'year', 'arch', 'time'];

  function isGameUnlocked(id) {
    return Progress.isUnlocked('game', id);
  }
  function dailyDoneToday() {
    return Progress.getState().games.dailyDone === Progress.today();
  }

  // ---------- Partida ----------
  let run = null;

  function makeQuestion() {
    const type = run.cfg.types[run.round % run.cfg.types.length];
    if (type === 'hl') return hlQuestion(run.rng, run.expert);
    if (type === 'year') return yearQuestion(run.rng);
    return archQuestion(run.rng);
  }

  function startGame(id) {
    const cfg = GAMES[id];
    if (!cfg || !isGameUnlocked(id) || (id === 'daily' && dailyDoneToday())) return;
    const expert = id === 'hl' && Progress.isUnlocked('feature', 'expert') && document.getElementById('expert-toggle')?.checked;
    run = {
      id, cfg, expert,
      rng: cfg.seeded ? mulberry32(hashString(`gpu-universe-${Progress.today()}`)) : Math.random,
      round: 0, correct: 0, streak: 0, bestStreak: 0, answered: false,
      timeLeft: cfg.seconds || 0, timer: null, bestBefore: Progress.getState().games.best[id] || 0
    };
    run.question = makeQuestion();
    els.games.hidden = true;
    els.stage.hidden = false;
    renderQuestion();
    els.stage.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    if (cfg.seconds) {
      run.timer = setInterval(() => {
        run.timeLeft--;
        const timerEl = els.stage.querySelector('[data-game-timer]');
        if (timerEl) timerEl.textContent = `${run.timeLeft}s`;
        const bar = els.stage.querySelector('.game-progress span');
        if (bar) bar.style.width = `${(run.timeLeft / cfg.seconds) * 100}%`;
        if (run.timeLeft <= 10) els.stage.querySelector('.game-panel')?.classList.add('is-hurry');
        if (run.timeLeft <= 0) finishGame();
      }, 1000);
    }
  }

  function gpuOption(gpu, i, q) {
    return `
      <button type="button" class="game-option game-option-gpu" data-answer="${i}">
        <span class="game-key" aria-hidden="true">${i + 1}</span>
        ${window.brandBadge(gpu)}
        <strong class="game-option-name">${esc(gpu.name)}</strong>
        <span class="game-option-meta">${esc(family(gpu))} · ${esc(gpu.year || '')} · ${esc(gpu.vram)}</span>
        <span class="game-reveal" aria-hidden="true">
          <span class="game-reveal-label">${esc(T('catalog.perf_index'))}</span>
          <strong>${window.formatPerf(gpu.perf)}</strong>
          <span class="game-reveal-bar"><span style="width:${Math.min(100, (gpu.perf / Math.max(q.options[0].perf, q.options[1].perf)) * 100)}%"></span></span>
        </span>
      </button>`;
  }

  function renderQuestion() {
    const q = run.question;
    const cfg = run.cfg;
    const total = cfg.total;
    const progress = cfg.seconds ? (run.timeLeft / cfg.seconds) * 100 : (run.round / total) * 100;
    const prompt = q.type === 'hl' ? T('levels.q_hl') : q.type === 'year' ? T('levels.q_year') : T('levels.q_arch');
    const options = q.type === 'hl'
      ? `<div class="game-options game-options-hl">${q.options.map((g, i) => gpuOption(g, i, q)).join('<span class="game-vs" aria-hidden="true">VS</span>')}</div>`
      : `
        <div class="game-subject">
          ${window.brandBadge(q.gpu)}
          <strong>${esc(q.gpu.name)}</strong>
          <span>${esc(q.type === 'year' ? family(q.gpu) : `${q.gpu.year} · ${q.gpu.vram}`)}</span>
        </div>
        <div class="game-options game-options-grid">
          ${q.options.map((opt, i) => `<button type="button" class="game-option" data-answer="${i}"><span class="game-key" aria-hidden="true">${i + 1}</span><span>${esc(opt)}</span></button>`).join('')}
        </div>`;

    els.stage.innerHTML = `
      <div class="game-panel${run.timeLeft && run.timeLeft <= 10 ? ' is-hurry' : ''}">
        <header class="game-head">
          <button type="button" class="btn-text" data-game-quit>${ICONS.close}<span>${esc(T('levels.quit'))}</span></button>
          <h3>${ICONS[cfg.icon]}${esc(T(`levels.g_${run.id}`))}${run.expert ? `<span class="xp-chip">${esc(T('levels.g_expert'))}</span>` : ''}</h3>
          <dl class="game-meta">
            ${cfg.seconds
              ? `<div><dt>${esc(T('levels.time_left'))}</dt><dd data-game-timer>${run.timeLeft}s</dd></div>`
              : `<div><dt>${esc(T('levels.question'))}</dt><dd>${run.round + 1}/${total}</dd></div>`}
            <div><dt>${esc(T('levels.score'))}</dt><dd>${run.correct}</dd></div>
            <div><dt>${esc(T('levels.streak'))}</dt><dd>${run.streak}</dd></div>
          </dl>
        </header>
        <div class="game-progress" aria-hidden="true"><span style="width:${progress}%"></span></div>
        <p class="game-prompt" id="game-prompt">${esc(prompt)}</p>
        <div role="group" aria-labelledby="game-prompt">${options}</div>
        <p class="game-feedback" aria-live="assertive"></p>
        <div class="game-foot">
          <span class="game-keys-hint">${esc(T('levels.keys_hint'))}</span>
          <button type="button" class="btn-primary btn-sm" data-game-next hidden>${esc(T(!cfg.seconds && run.round + 1 >= total ? 'levels.finish' : 'levels.next_q'))} ${ICONS.arrow}</button>
        </div>
      </div>`;
    els.stage.querySelector('[data-answer]')?.focus({ preventScroll: true });
  }

  function answer(index) {
    if (!run || run.answered) return;
    const q = run.question;
    run.answered = true;
    const ok = index === q.correct;
    if (ok) {
      run.correct++;
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
    } else {
      run.streak = 0;
    }
    els.stage.querySelector('.game-panel').classList.add('is-answered');
    els.stage.querySelectorAll('[data-answer]').forEach(btn => {
      const i = Number(btn.dataset.answer);
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('is-correct');
      else if (i === index) btn.classList.add('is-wrong');
    });
    const answerText = q.type === 'hl' ? q.options[q.correct].name : q.options[q.correct];
    const feedback = els.stage.querySelector('.game-feedback');
    feedback.className = `game-feedback ${ok ? 'is-ok' : 'is-ko'}`;
    feedback.innerHTML = ok
      ? `${ICONS.check}<span>${esc(T('levels.correct'))}</span>`
      : `${ICONS.close}<span>${esc(T('levels.wrong'))} · ${esc(T('levels.answer_was', { answer: answerText }))}</span>`;
    const meta = els.stage.querySelectorAll('.game-meta dd');
    meta[1].textContent = run.correct;
    meta[2].textContent = run.streak;

    if (run.cfg.seconds) {
      setTimeout(nextQuestion, ok ? 350 : 900);
    } else {
      const next = els.stage.querySelector('[data-game-next]');
      next.hidden = false;
      next.focus({ preventScroll: true });
    }
  }

  function nextQuestion() {
    if (!run) return;
    run.round++;
    run.answered = false;
    if (!run.cfg.seconds && run.round >= run.cfg.total) return finishGame();
    if (run.cfg.seconds && run.timeLeft <= 0) return finishGame();
    run.question = makeQuestion();
    renderQuestion();
  }

  function finishGame() {
    if (!run) return;
    clearInterval(run.timer);
    const finished = run;
    run = null;
    const total = finished.cfg.seconds ? finished.round + (finished.answered ? 1 : 0) : finished.cfg.total;
    const xp = finished.correct * finished.cfg.xp * (finished.expert ? 2 : 1);
    const record = finished.correct > finished.bestBefore && finished.correct > 0;
    Progress.track('game', { id: finished.id, correct: finished.correct, total, score: finished.correct, xp });
    const bonus = finished.id === 'daily' ? Progress.XP.dailyChallenge : 0;
    els.stage.innerHTML = `
      <div class="game-panel game-result">
        <span class="game-result-icon">${ICONS[record ? 'trophy' : finished.cfg.icon]}</span>
        <h3>${esc(T('levels.result_title'))} · ${esc(T(`levels.g_${finished.id}`))}</h3>
        <p class="game-result-score">${esc(finished.cfg.seconds ? T('levels.result_time', { score: finished.correct }) : T('levels.result_score', { score: finished.correct, total }))}</p>
        <div class="game-result-chips">
          <span class="xp-chip xp-chip-lg">${esc(T('levels.result_xp', { xp: xp + bonus }))}</span>
          ${record ? `<span class="xp-chip xp-chip-gold">${ICONS.star}${esc(T('levels.new_record'))}</span>` : ''}
          ${finished.bestStreak >= 3 ? `<span class="xp-chip">${ICONS.flame}${esc(T('levels.best_streak', { n: finished.bestStreak }))}</span>` : ''}
        </div>
        <div class="game-result-actions">
          <button type="button" class="btn-ghost btn-sm" data-game-back>${esc(T('levels.back'))}</button>
          ${finished.id !== 'daily' ? `<button type="button" class="btn-primary btn-sm" data-play="${finished.id}">${esc(T('levels.play_again'))}</button>` : ''}
        </div>
      </div>`;
    els.stage.querySelector('[data-play], [data-game-back]')?.focus({ preventScroll: true });
    renderGames();
  }

  function quitGame() {
    if (run) clearInterval(run.timer);
    run = null;
    els.stage.hidden = true;
    els.stage.innerHTML = '';
    els.games.hidden = false;
    renderGames();
    els.games.querySelector('[data-play]')?.focus({ preventScroll: true });
  }

  // ---------- Secciones de la página ----------
  function unlockLabels(level) {
    return (Progress.UNLOCKS[level] || []).filter(u => !(u.type === 'color' && u.id === 'emerald')).map(window.unlockLabel);
  }

  function renderProfile() {
    const info = Progress.levelInfo();
    const state = Progress.getState();
    const achievements = Progress.achievementList();
    const total = getAllGpus().length;
    const nextUnlocks = info.isMax ? [] : unlockLabels(info.level + 1);
    els.profile.innerHTML = `
      <div class="profile-main">
        <div class="level-badge level-badge-lg"><span>${info.level}</span></div>
        <div class="profile-info">
          <span class="profile-kicker">${esc(T('fx.level', { n: info.level }))} · ${esc(T('levels.of_levels', { n: Progress.MAX_LEVEL }))}</span>
          <h2 class="profile-title">${esc(window.levelTitle(info.level))}</h2>
          <div class="xp-bar xp-bar-lg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${info.pct}" aria-label="XP"><span style="width:${info.pct}%"></span></div>
          <p class="profile-xp">
            ${info.isMax
              ? esc(T('levels.max'))
              : `<strong>${info.xp}</strong> / ${info.next} XP · ${esc(T('levels.xp_left', { n: info.next - info.xp }))}`}
          </p>
          ${info.isMax ? '' : `<p class="profile-next">${esc(T('levels.next', { title: window.levelTitle(info.level + 1) }))}${nextUnlocks.length ? ` · ${esc(T('levels.next_unlock', { item: nextUnlocks.join(', ') }))}` : ''}</p>`}
        </div>
      </div>
      <dl class="profile-stats">
        <div><dt>${ICONS.eye}${esc(T('levels.stat_viewed'))}</dt><dd>${state.viewed.length}<small>/${total}</small></dd></div>
        <div><dt>${ICONS.flame}${esc(T('levels.stat_streak'))}</dt><dd>${esc(window.trPlural('levels.days', state.streak.count || 1))}<small>${esc(T('levels.best', { n: state.streak.best || 1 }))}</small></dd></div>
        <div><dt>${ICONS.trophy}${esc(T('levels.stat_achievements'))}</dt><dd>${achievements.filter(a => a.done).length}<small>/${achievements.length}</small></dd></div>
        <div><dt>${ICONS.gamepad}${esc(T('levels.stat_games'))}</dt><dd>${state.games.played}</dd></div>
        <div><dt>${ICONS.heart}${esc(T('levels.stat_favs'))}</dt><dd>${Store.count('favorites')}</dd></div>
        <div><dt>${ICONS.compare}${esc(T('levels.stat_compares'))}</dt><dd>${state.compares.length}</dd></div>
      </dl>`;
  }

  function renderHowTo() {
    const XP = Progress.XP;
    const items = [
      ['eye', 'levels.how_view', `+${XP.view}`],
      ['map', 'levels.how_page', `+${XP.page}`],
      ['heart', 'levels.how_fav', `+${XP.favorite}`],
      ['compare', 'levels.how_compare', `+${XP.compare}`],
      ['bolt', 'levels.how_game', '+4–10'],
      ['star', 'levels.how_daily', `+${XP.dailyChallenge}`],
      ['tool', 'levels.how_tools', `+${XP.tool}`],
      ['flame', 'levels.how_streak', `+${XP.daily}`],
      ['trophy', 'levels.how_ach', `+${XP.achievement}`]
    ];
    els.howto.innerHTML = items.map(([icon, key, xp]) => `<li>${ICONS[icon]}<span>${esc(T(key))}</span><span class="xp-chip">${xp} XP</span></li>`).join('');
  }

  function renderGames() {
    const state = Progress.getState();
    const expertUnlocked = Progress.isUnlocked('feature', 'expert');
    const expertChecked = document.getElementById('expert-toggle')?.checked || false;
    els.games.innerHTML = GAME_ORDER.map(id => {
      const cfg = GAMES[id];
      const unlocked = isGameUnlocked(id);
      const done = id === 'daily' && dailyDoneToday();
      const best = state.games.best[id];
      let action;
      if (!unlocked) action = `<span class="lock-note">${ICONS.lock}${esc(T('levels.unlock_at', { n: Progress.unlockLevel('game', id) }))}</span>`;
      else if (done) action = `<span class="lock-note is-done">${ICONS.check}${esc(T('levels.daily_done'))}</span>`;
      else action = `<button type="button" class="btn-primary btn-sm" data-play="${id}">${esc(T('levels.play'))} ${ICONS.arrow}</button>`;
      return `
        <article class="game-card${unlocked ? '' : ' is-locked'}${done ? ' is-done' : ''}${id === 'daily' ? ' is-featured' : ''}">
          <span class="game-card-icon">${ICONS[cfg.icon]}</span>
          <h3>${esc(T(`levels.g_${id}`))}</h3>
          <p>${esc(T(`levels.g_${id}_desc`))}</p>
          <div class="game-card-meta">
            <span class="xp-chip">${esc(T('levels.xp_per', { n: cfg.xp }))}${id === 'daily' ? ` · +${Progress.XP.dailyChallenge}` : ''}</span>
            ${best ? `<span class="game-best">${ICONS.star}${esc(T('levels.best', { n: best }))}</span>` : ''}
          </div>
          ${id === 'hl' && unlocked ? `
            <label class="switch${expertUnlocked ? '' : ' is-locked'}">
              <input type="checkbox" id="expert-toggle" ${expertUnlocked ? '' : 'disabled'} ${expertChecked && expertUnlocked ? 'checked' : ''}>
              <span class="switch-track" aria-hidden="true"></span>
              <span>${esc(expertUnlocked ? T('levels.expert_toggle') : T('levels.expert_locked', { n: Progress.unlockLevel('feature', 'expert') }))}</span>
            </label>` : ''}
          <div class="game-card-action">${action}</div>
        </article>`;
    }).join('');
  }

  function renderPath() {
    const info = Progress.levelInfo();
    els.path.innerHTML = Progress.LEVEL_XP.map((xp, i) => {
      const level = i + 1;
      const status = level < info.level ? 'done' : level === info.level ? 'current' : 'locked';
      const unlocks = unlockLabels(level);
      return `
        <li class="level-node is-${status}">
          <div class="level-badge level-badge-sm"><span>${level}</span></div>
          <div class="level-node-body">
            <span class="level-node-xp">${xp} XP · ${esc(T(`levels.${status}`))}</span>
            <strong>${esc(window.levelTitle(level))}</strong>
            ${unlocks.length ? `<span class="level-node-unlocks">${unlocks.map(u => `<span>${status === 'locked' ? ICONS.lock : ICONS.check}${esc(u)}</span>`).join('')}</span>` : ''}
            ${status === 'current' && !info.isMax ? `<div class="xp-bar"><span style="width:${info.pct}%"></span></div>` : ''}
          </div>
        </li>`;
    }).join('');
  }

  function renderAchievements() {
    const list = Progress.achievementList();
    els.achProgress.textContent = T('levels.ach_progress', { n: list.filter(a => a.done).length, total: list.length });
    els.ach.innerHTML = list.map(a => `
      <li class="ach-card${a.done ? ' is-done' : ''}">
        <span class="ach-icon">${ICONS[a.icon]}</span>
        <div class="ach-body">
          <strong>${esc(T(`levels.ach.${a.id}.name`))}</strong>
          <span>${esc(T(`levels.ach.${a.id}.desc`))}</span>
          ${a.done
            ? `<span class="ach-status">${ICONS.check}${esc(T('levels.done'))}</span>`
            : `<div class="xp-bar xp-bar-sm" aria-hidden="true"><span style="width:${(a.value / a.goal) * 100}%"></span></div><span class="ach-status">${a.value}/${a.goal}</span>`}
        </div>
      </li>`).join('');
  }

  function renderColors() {
    const current = Progress.getAccent();
    els.colors.innerHTML = Progress.COLORS.map(c => {
      const unlocked = Progress.isUnlocked('color', c.id);
      return `
        <button type="button" class="color-swatch swatch-${c.id}" data-color="${c.id}" aria-pressed="${c.id === current}" ${unlocked ? '' : 'disabled'}>
          <span class="swatch-led" aria-hidden="true"></span>
          <span class="swatch-name">${esc(T(`levels.color_${c.id}`))}</span>
          <span class="swatch-state">${unlocked ? (c.id === current ? `${ICONS.check}${esc(T('levels.in_use'))}` : esc(T('levels.use'))) : `${ICONS.lock}${esc(T('fx.level', { n: c.level }))}`}</span>
        </button>`;
    }).join('');
  }

  let resetArmed = false;
  function renderReset() {
    els.reset.innerHTML = resetArmed
      ? `<p>${esc(T('levels.reset_confirm'))}</p>
         <div class="reset-actions">
           <button type="button" class="btn-ghost btn-sm" data-reset="cancel">${esc(T('levels.cancel'))}</button>
           <button type="button" class="btn-danger btn-sm" data-reset="confirm">${ICONS.trash}${esc(T('levels.reset'))}</button>
         </div>`
      : `<button type="button" class="btn-text btn-text-danger" data-reset="arm">${ICONS.trash}${esc(T('levels.reset'))}</button>`;
  }

  function renderPage() {
    renderProfile();
    renderHowTo();
    if (!run) renderGames();
    renderPath();
    renderAchievements();
    renderColors();
    renderReset();
  }

  // ---------- Eventos ----------
  page.addEventListener('click', e => {
    const play = e.target.closest('[data-play]');
    if (play) return startGame(play.dataset.play);
    const ans = e.target.closest('[data-answer]');
    if (ans) return answer(Number(ans.dataset.answer));
    if (e.target.closest('[data-game-next]')) return nextQuestion();
    if (e.target.closest('[data-game-quit]') || e.target.closest('[data-game-back]')) return quitGame();
    const color = e.target.closest('[data-color]');
    if (color && !color.disabled) {
      Progress.setAccent(color.dataset.color);
      renderColors();
      els.colors.querySelector(`[data-color="${color.dataset.color}"]`)?.focus();
      return;
    }
    const reset = e.target.closest('[data-reset]');
    if (reset) {
      const action = reset.dataset.reset;
      if (action === 'arm') resetArmed = true;
      else if (action === 'cancel') resetArmed = false;
      else if (action === 'confirm') {
        resetArmed = false;
        quitGame();
        Progress.reset();
        window.showToast({ icon: ICONS.check, text: T('levels.reset_done') });
        renderPage();
      }
      renderReset();
      els.reset.querySelector('button')?.focus();
    }
  });

  // Teclado en los retos: 1-4 responde, ←/→ en "¿Cuál rinde más?", Enter pasa a la siguiente
  document.addEventListener('keydown', e => {
    if (!run || els.stage.hidden || document.body.classList.contains('modal-open') || document.body.classList.contains('layer-open')) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const q = run.question;
    if (!run.answered) {
      let idx = -1;
      if (/^[1-4]$/.test(e.key)) idx = Number(e.key) - 1;
      else if (q.type === 'hl' && e.key === 'ArrowLeft') idx = 0;
      else if (q.type === 'hl' && e.key === 'ArrowRight') idx = 1;
      if (idx >= 0 && idx < q.options.length) {
        e.preventDefault();
        answer(idx);
      }
    } else if (e.key === 'Enter' && !run.cfg.seconds && document.activeElement?.dataset?.gameNext === undefined) {
      e.preventDefault();
      nextQuestion();
    }
  });

  window.addEventListener('progress:change', () => { if (!run) renderPage(); else { renderProfile(); renderPath(); renderAchievements(); renderColors(); } });
  window.addEventListener('store:change', renderProfile);

  // Cambio de idioma: se repinta todo (y la pregunta en curso)
  const originalApply = window.applyTranslations;
  window.applyTranslations = function () {
    originalApply();
    renderPage();
    if (run && !run.answered) renderQuestion();
  };

  renderPage();
  // Enlace directo a un reto: levels.html?play=daily
  const playParam = new URLSearchParams(window.location.search).get('play');
  if (playParam) document.addEventListener('DOMContentLoaded', () => setTimeout(() => startGame(playParam), 80));
})();
