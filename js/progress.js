// ===== PROGRESIÓN POR NIVELES =====
// Motor de experiencia (XP), niveles, desbloqueos y logros. Guarda el estado en localStorage
// y avisa de cada cambio con eventos en window:
//   progress:xp          { amount, reason, total }
//   progress:levelup     { level, unlocks }
//   progress:achievement { id }
//   progress:change      { state }
// La interfaz (avisos, chip del menú...) vive en features.js; aquí solo hay lógica.
(function () {
  const STORAGE_KEY = 'gpu-universe-progress';

  // XP acumulada necesaria para cada nivel (índice 0 = nivel 1)
  const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  const MAX_LEVEL = LEVEL_XP.length;

  // Qué se desbloquea al llegar a cada nivel
  const UNLOCKS = {
    1: [{ type: 'game', id: 'daily' }, { type: 'game', id: 'hl' }, { type: 'color', id: 'emerald' }],
    2: [{ type: 'color', id: 'blue' }],
    3: [{ type: 'game', id: 'year' }],
    4: [{ type: 'color', id: 'amber' }],
    5: [{ type: 'game', id: 'arch' }],
    6: [{ type: 'color', id: 'magenta' }],
    7: [{ type: 'game', id: 'time' }],
    8: [{ type: 'color', id: 'red' }],
    9: [{ type: 'feature', id: 'expert' }],
    10: [{ type: 'color', id: 'gold' }]
  };

  // XP de cada acción (las que se repiten tienen tope: una vez por GPU, por día, etc.)
  const XP = {
    view: 5, page: 15, favorite: 5, compare: 10, quiz: 30, layer: 20,
    tool: 20, daily: 10, share: 10, achievement: 25, dailyChallenge: 50
  };

  // Secciones que cuentan para el logro "Explorador"
  const PAGES = ['home', 'gaming', 'workstation', 'server', 'compare', 'history', 'learn', 'tools', 'levels'];
  const TOOLS = ['upgrade', 'psu', 'vram'];
  const LAYERS = ['full', 'pcb-cooler', 'pcb-only'];

  const ACHIEVEMENTS = [
    { id: 'first_view', icon: 'eye', goal: 1, value: s => s.viewed.length },
    { id: 'viewer_25', icon: 'grid', goal: 25, value: s => s.viewed.length },
    { id: 'viewer_100', icon: 'book', goal: 100, value: s => s.viewed.length },
    { id: 'fav_1', icon: 'heart', goal: 1, value: s => s.favPeak },
    { id: 'fav_10', icon: 'heart', goal: 10, value: s => s.favPeak },
    { id: 'compare_1', icon: 'compare', goal: 1, value: s => s.compares.length },
    { id: 'compare_4', icon: 'compare', goal: 4, value: s => s.maxCompare },
    { id: 'explorer', icon: 'map', goal: PAGES.length, value: s => s.pages.filter(p => PAGES.includes(p)).length },
    { id: 'quiz', icon: 'target', goal: 1, value: s => s.quizCount },
    { id: 'engineer', icon: 'cube', goal: LAYERS.length, value: s => s.layers.length },
    { id: 'tools_all', icon: 'tool', goal: TOOLS.length, value: s => s.tools.length },
    { id: 'streak_3', icon: 'flame', goal: 3, value: s => s.streak.best },
    { id: 'streak_7', icon: 'flame', goal: 7, value: s => s.streak.best },
    { id: 'perfect', icon: 'star', goal: 1, value: s => s.games.perfect },
    { id: 'daily', icon: 'calendar', goal: 1, value: s => s.games.dailyCount },
    { id: 'time_15', icon: 'bolt', goal: 15, value: s => s.games.best.time || 0 },
    { id: 'polyglot', icon: 'globe', goal: 3, value: s => s.langs.length },
    { id: 'theme', icon: 'contrast', goal: 2, value: s => s.themes.length },
    { id: 'sharer', icon: 'share', goal: 1, value: s => s.shares },
    { id: 'level_10', icon: 'crown', goal: MAX_LEVEL, value: s => levelFor(s.xp) }
  ];

  const COLORS = [
    { id: 'emerald', level: 1 }, { id: 'blue', level: 2 }, { id: 'amber', level: 4 },
    { id: 'magenta', level: 6 }, { id: 'red', level: 8 }, { id: 'gold', level: 10 }
  ];
  const ACCENT_KEY = 'gpu-universe-accent';

  function freshState() {
    return {
      v: VERSION, xp: 0,
      viewed: [], pages: [], compares: [], layers: [], tools: [], langs: [], themes: [],
      once: {}, achievements: [],
      favPeak: 0, maxCompare: 0, quizCount: 0, shares: 0,
      streak: { count: 0, best: 0, last: '' },
      games: { played: 0, best: {}, perfect: 0, dailyCount: 0, dailyDone: '' }
    };
  }

  // Versión del formato guardado. Si cambia la forma del estado, se sube VERSION y se añade en
  // MIGRATIONS la conversión desde la versión anterior (clave = versión de origen).
  const VERSION = 1;
  const MIGRATIONS = {
    // 0: estado sin campo "v" (anterior a la versión 1): se rescata lo que encaje en el formato actual
    0: saved => ({ ...saved, v: 1 })
  };

  // Deja lo guardado con los tipos y topes del formato actual: lo que no encaja se descarta.
  // Importante: localStorage lo comparten todas las webs de frxnker.github.io, así que no se
  // confía en nada de lo que venga de ahí (la interfaz pinta estos números sin escapar).
  function sanitize(saved) {
    const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    const count = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
    const day = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
    const texts = (v, cap = 1000) => (Array.isArray(v) ? [...new Set(v.filter(x => typeof x === 'string' && x.length <= 300))].slice(-cap) : []);
    const s = obj(saved);
    const games = obj(s.games);
    const streak = obj(s.streak);
    const best = {};
    Object.entries(obj(games.best)).forEach(([id, score]) => { if (/^[a-z]{1,20}$/.test(id) && typeof score === 'number') best[id] = count(score); });
    const once = {};
    Object.keys(obj(s.once)).slice(0, 20000).forEach(key => { if (key.length <= 300) once[key] = 1; });
    return {
      v: VERSION,
      xp: count(s.xp),
      viewed: texts(s.viewed, 2000), pages: texts(s.pages), compares: texts(s.compares, 300),
      layers: texts(s.layers), tools: texts(s.tools), langs: texts(s.langs), themes: texts(s.themes),
      once, achievements: texts(s.achievements),
      favPeak: count(s.favPeak), maxCompare: count(s.maxCompare), quizCount: count(s.quizCount), shares: count(s.shares),
      streak: { count: count(streak.count), best: count(streak.best), last: day(streak.last) },
      games: { played: count(games.played), best, perfect: count(games.perfect) ? 1 : 0, dailyCount: count(games.dailyCount), dailyDone: day(games.dailyDone) }
    };
  }

  function load() {
    try {
      let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return freshState();
      let version = Number.isInteger(saved.v) ? saved.v : 0;
      while (version < VERSION && MIGRATIONS[version]) saved = MIGRATIONS[version++](saved);
      // Una versión más nueva (p. ej. tras volver a una versión anterior de la web) no borra el
      // progreso: se queda con lo que este formato entiende
      return sanitize(saved);
    } catch (e) { /* almacenamiento no disponible o JSON roto */ }
    return freshState();
  }

  let state = load();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* sin persistencia */ }
    emit('progress:change', { state: getState() });
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function today(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function levelFor(xp) {
    let level = 1;
    LEVEL_XP.forEach((min, i) => { if (xp >= min) level = i + 1; });
    return level;
  }

  function levelInfo(xp = state.xp) {
    const level = levelFor(xp);
    const floor = LEVEL_XP[level - 1];
    const next = level < MAX_LEVEL ? LEVEL_XP[level] : null;
    return {
      level,
      xp,
      floor,
      next,
      isMax: next === null,
      inLevel: xp - floor,
      needed: next === null ? 0 : next - floor,
      pct: next === null ? 100 : Math.round(((xp - floor) / (next - floor)) * 100)
    };
  }

  function addUnique(list, value, cap = 1000) {
    if (list.includes(value)) return false;
    list.push(value);
    if (list.length > cap) list.shift();
    return true;
  }

  // Suma XP. onceKey evita repetir el mismo premio (por GPU, por día...)
  function award(reason, amount, onceKey) {
    if (!amount) return 0;
    if (onceKey) {
      if (state.once[onceKey]) return 0;
      state.once[onceKey] = 1;
    }
    const before = levelFor(state.xp);
    state.xp += amount;
    emit('progress:xp', { amount, reason, total: state.xp });
    const after = levelFor(state.xp);
    for (let lvl = before + 1; lvl <= after; lvl++) {
      emit('progress:levelup', { level: lvl, unlocks: UNLOCKS[lvl] || [] });
    }
    return amount;
  }

  // Comprueba los logros; al desbloquear uno se suma XP, lo que puede desbloquear otro
  function checkAchievements() {
    let changed = true;
    while (changed) {
      changed = false;
      ACHIEVEMENTS.forEach(a => {
        if (state.achievements.includes(a.id)) return;
        if (a.value(state) >= a.goal) {
          state.achievements.push(a.id);
          emit('progress:achievement', { id: a.id });
          award('achievement', XP.achievement);
          changed = true;
        }
      });
    }
  }

  // Registro de acciones del usuario
  function track(type, payload) {
    const day = today();
    switch (type) {
      case 'view':
        if (addUnique(state.viewed, payload, 2000)) award('view', XP.view);
        break;
      case 'page':
        if (addUnique(state.pages, payload)) award('page', XP.page);
        break;
      case 'favorite':
        state.favPeak = Math.max(state.favPeak, payload.count || 0);
        if (payload.added) award('favorite', XP.favorite, `fav:${payload.name}`);
        break;
      case 'compare': {
        const names = (payload || []).filter(Boolean);
        if (names.length < 2) break;
        state.maxCompare = Math.max(state.maxCompare, names.length);
        const key = [...names].sort().join('|');
        if (addUnique(state.compares, key, 300)) award('compare', XP.compare);
        break;
      }
      case 'quiz':
        state.quizCount++;
        award('quiz', XP.quiz, `quiz:${day}`);
        break;
      case 'layer':
        if (LAYERS.includes(payload) && addUnique(state.layers, payload)) award('layer', XP.layer);
        break;
      case 'tool':
        if (TOOLS.includes(payload)) {
          addUnique(state.tools, payload);
          award('tool', XP.tool, `tool:${payload}:${day}`);
        }
        break;
      case 'lang':
        addUnique(state.langs, payload);
        break;
      case 'theme':
        addUnique(state.themes, payload);
        break;
      case 'share':
        state.shares++;
        award('share', XP.share, `share:${payload}`);
        break;
      case 'game': {
        const { id, correct = 0, total = 0, score = correct, xp = 0 } = payload;
        state.games.played++;
        state.games.best[id] = Math.max(state.games.best[id] || 0, score);
        if (total >= 10 && correct === total) state.games.perfect = 1;
        award('game', xp);
        if (id === 'daily' && state.games.dailyDone !== day) {
          state.games.dailyDone = day;
          state.games.dailyCount++;
          award('dailyChallenge', XP.dailyChallenge, `dailyChallenge:${day}`);
        }
        break;
      }
      default:
        return;
    }
    checkAchievements();
    save();
  }

  // Racha de días seguidos y bonificación diaria; se llama una vez por carga de página
  function start(pageId) {
    const day = today();
    if (state.streak.last !== day) {
      state.streak.count = state.streak.last === today(-1) ? state.streak.count + 1 : 1;
      state.streak.best = Math.max(state.streak.best, state.streak.count);
      state.streak.last = day;
      award('daily', XP.daily, `daily:${day}`);
    }
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme) addUnique(state.themes, theme);
    if (window.currentLang) addUnique(state.langs, window.currentLang);
    if (pageId) track('page', pageId);
    else { checkAchievements(); save(); }
  }

  function isUnlocked(type, id) {
    const level = levelFor(state.xp);
    return Object.entries(UNLOCKS).some(([lvl, items]) => Number(lvl) <= level && items.some(u => u.type === type && u.id === id));
  }

  function unlockLevel(type, id) {
    const entry = Object.entries(UNLOCKS).find(([, items]) => items.some(u => u.type === type && u.id === id));
    return entry ? Number(entry[0]) : null;
  }

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function achievementList() {
    return ACHIEVEMENTS.map(a => ({
      id: a.id,
      icon: a.icon,
      goal: a.goal,
      value: Math.min(a.value(state), a.goal),
      done: state.achievements.includes(a.id)
    }));
  }

  // Color de acento (LED) de toda la web
  function getAccent() {
    try { return localStorage.getItem(ACCENT_KEY) || 'emerald'; } catch (e) { return 'emerald'; }
  }

  function setAccent(id) {
    if (!COLORS.some(c => c.id === id) || !isUnlocked('color', id)) return false;
    try {
      if (id === 'emerald') localStorage.removeItem(ACCENT_KEY);
      else localStorage.setItem(ACCENT_KEY, id);
    } catch (e) { /* sin persistencia */ }
    if (id === 'emerald') document.documentElement.removeAttribute('data-accent');
    else document.documentElement.setAttribute('data-accent', id);
    emit('progress:change', { state: getState() });
    return true;
  }

  function reset() {
    state = freshState();
    setAccentSilently('emerald');
    save();
  }

  function setAccentSilently(id) {
    try { localStorage.removeItem(ACCENT_KEY); } catch (e) { /* nada */ }
    if (id === 'emerald') document.documentElement.removeAttribute('data-accent');
  }

  // Si se guardó un color que ya no está desbloqueado (p. ej. tras reiniciar), se vuelve al de serie
  if (getAccent() !== 'emerald' && !isUnlocked('color', getAccent())) setAccentSilently('emerald');

  // Versión pública de award: además guarda y revisa los logros
  function awardAndSave(reason, amount, onceKey) {
    const gained = award(reason, amount, onceKey);
    if (gained) {
      checkAchievements();
      save();
    }
    return gained;
  }

  window.GPUProgress = {
    LEVEL_XP, MAX_LEVEL, UNLOCKS, XP, PAGES, TOOLS, COLORS,
    award: awardAndSave, track, start, levelFor, levelInfo, isUnlocked, unlockLevel,
    getState, achievementList, getAccent, setAccent, reset, today
  };
})();
