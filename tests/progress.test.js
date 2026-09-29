// Motor de progresión (js/progress.js). Estas pruebas fijan las reglas actuales de XP,
// niveles, logros y desbloqueos: si fallan tras un cambio, ese cambio altera las reglas.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts } = require('./helpers/env');

async function engine(options = {}) {
  const env = await loadScripts(['js/progress.js'], { now: '2026-09-29T10:00:00', wait: 0, ...options });
  const events = [];
  ['progress:xp', 'progress:levelup', 'progress:achievement', 'progress:change'].forEach(name =>
    env.window.addEventListener(name, e => events.push({ name, detail: JSON.parse(JSON.stringify(e.detail)) })));
  return { ...env, P: env.window.GPUProgress, events };
}
const plain = v => JSON.parse(JSON.stringify(v));

test('tabla de niveles: XP acumulada por nivel', async () => {
  const { P, close } = await engine();
  assert.deepEqual(plain(P.LEVEL_XP), [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700]);
  assert.equal(P.MAX_LEVEL, 10);
  assert.equal(P.levelFor(0), 1);
  assert.equal(P.levelFor(99), 1);
  assert.equal(P.levelFor(100), 2);
  assert.equal(P.levelFor(2699), 9);
  assert.equal(P.levelFor(2700), 10);
  assert.equal(P.levelFor(999999), 10);
  const info = P.levelInfo(175);
  assert.deepEqual(plain(info), { level: 2, xp: 175, floor: 100, next: 250, isMax: false, inLevel: 75, needed: 150, pct: 50 });
  assert.equal(P.levelInfo(5000).isMax, true);
  assert.equal(P.levelInfo(5000).pct, 100);
  close();
});

test('XP por acción', async () => {
  const { P, close } = await engine();
  assert.deepEqual(plain(P.XP), { view: 5, page: 15, favorite: 5, compare: 10, quiz: 30, layer: 20, tool: 20, daily: 10, share: 10, achievement: 25, dailyChallenge: 50 });
  close();
});

test('desbloqueos por nivel', async () => {
  const { P, close } = await engine();
  assert.deepEqual(plain(P.UNLOCKS), {
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
  });
  close();
});

test('ver una GPU da XP una sola vez por modelo y desbloquea "first_view"', async () => {
  const { P, events, close } = await engine();
  P.track('view', 'RTX 5090');
  P.track('view', 'RTX 5090');
  const state = P.getState();
  // 5 (vista) + 25 (logro first_view)
  assert.equal(state.xp, 30);
  assert.deepEqual(plain(state.achievements), ['first_view']);
  assert.ok(events.some(e => e.name === 'progress:achievement' && e.detail.id === 'first_view'));
  close();
});

test('páginas: 15 XP la primera vez que se visita cada una', async () => {
  const { P, close } = await engine();
  P.track('page', 'gaming');
  P.track('page', 'gaming');
  P.track('page', 'server');
  assert.equal(P.getState().xp, 30);
  close();
});

test('favoritos: XP una vez por GPU; el pico cuenta para los logros', async () => {
  const { P, close } = await engine();
  P.track('favorite', { name: 'RTX 4090', count: 1, added: true });
  P.track('favorite', { name: 'RTX 4090', count: 0, added: false });
  P.track('favorite', { name: 'RTX 4090', count: 1, added: true });
  const s = P.getState();
  assert.equal(s.favPeak, 1);
  // 5 (favorito, una sola vez) + 25 (logro fav_1)
  assert.equal(s.xp, 30);
  assert.ok(s.achievements.includes('fav_1'));
  close();
});

test('comparar: hace falta un mínimo de 2 GPUs y cada combinación cuenta una vez', async () => {
  const { P, close } = await engine();
  P.track('compare', ['RTX 5090']);
  assert.equal(P.getState().xp, 0);
  P.track('compare', ['RTX 5090', 'RTX 4090']);
  P.track('compare', ['RTX 4090', 'RTX 5090']);
  const s = P.getState();
  assert.equal(s.compares.length, 1);
  // 10 (comparación) + 25 (logro compare_1)
  assert.equal(s.xp, 35);
  close();
});

test('bonificación diaria y racha de días seguidos', async () => {
  const { P, window, close } = await engine();
  P.start();
  P.start();
  let s = P.getState();
  assert.equal(s.streak.count, 1);
  assert.equal(s.xp, 10);
  window.__setNow('2026-09-30T09:00:00');
  P.start();
  window.__setNow('2026-10-01T23:00:00');
  P.start();
  s = P.getState();
  assert.equal(s.streak.count, 3);
  assert.equal(s.streak.best, 3);
  assert.ok(s.achievements.includes('streak_3'));
  // Se salta un día: la racha vuelve a 1 pero se conserva la mejor
  window.__setNow('2026-10-03T12:00:00');
  P.start();
  s = P.getState();
  assert.equal(s.streak.count, 1);
  assert.equal(s.streak.best, 3);
  close();
});

test('subir de nivel emite progress:levelup con sus desbloqueos', async () => {
  const { P, events, close } = await engine();
  P.award('test', 260);
  const ups = events.filter(e => e.name === 'progress:levelup').map(e => e.detail);
  assert.deepEqual(ups, [
    { level: 2, unlocks: [{ type: 'color', id: 'blue' }] },
    { level: 3, unlocks: [{ type: 'game', id: 'year' }] }
  ]);
  assert.equal(P.isUnlocked('game', 'year'), true);
  assert.equal(P.isUnlocked('game', 'arch'), false);
  assert.equal(P.unlockLevel('game', 'arch'), 5);
  close();
});

test('retos: XP de la partida, partida perfecta y reto diario una vez al día', async () => {
  const { P, close } = await engine();
  P.track('game', { id: 'hl', correct: 10, total: 10, xp: 50 });
  let s = P.getState();
  assert.equal(s.games.perfect, 1);
  assert.equal(s.games.best.hl, 10);
  P.track('game', { id: 'daily', correct: 3, total: 5, xp: 24 });
  P.track('game', { id: 'daily', correct: 5, total: 5, xp: 40 });
  s = P.getState();
  assert.equal(s.games.dailyCount, 1);
  assert.equal(s.games.best.daily, 5);
  assert.ok(s.achievements.includes('daily'));
  assert.ok(s.achievements.includes('perfect'));
  close();
});

test('colores de acento: solo se aplican si están desbloqueados', async () => {
  const { P, window, close } = await engine();
  assert.equal(P.setAccent('blue'), false);
  P.award('test', 100);
  assert.equal(P.setAccent('blue'), true);
  assert.equal(window.document.documentElement.getAttribute('data-accent'), 'blue');
  assert.equal(P.getAccent(), 'blue');
  assert.equal(P.setAccent('emerald'), true);
  assert.equal(window.document.documentElement.hasAttribute('data-accent'), false);
  close();
});

test('el estado se guarda en localStorage y se recupera', async () => {
  const first = await engine();
  first.P.track('view', 'RTX 5090');
  const saved = first.window.localStorage.getItem('gpu-universe-progress');
  first.close();
  const second = await engine({ storage: { 'gpu-universe-progress': saved } });
  assert.equal(second.P.getState().xp, 30);
  assert.deepEqual(plain(second.P.getState().viewed), ['RTX 5090']);
  second.close();
});

test('un estado guardado corrupto no rompe la página', async () => {
  const { P, errors, close } = await engine({ storage: { 'gpu-universe-progress': '{no es json' } });
  assert.equal(P.getState().xp, 0);
  assert.deepEqual(errors, []);
  close();
});

test('reiniciar vuelve al estado inicial y quita el color', async () => {
  const { P, window, close } = await engine();
  P.award('test', 300);
  P.setAccent('blue');
  P.reset();
  assert.equal(P.getState().xp, 0);
  assert.equal(window.document.documentElement.hasAttribute('data-accent'), false);
  close();
});

test('lista de logros', async () => {
  const { P, close } = await engine();
  assert.deepEqual(Array.from(P.achievementList(), a => `${a.id}:${a.goal}`), [
    'first_view:1', 'viewer_25:25', 'viewer_100:100', 'fav_1:1', 'fav_10:10', 'compare_1:1', 'compare_4:4',
    'explorer:9', 'quiz:1', 'engineer:3', 'tools_all:3', 'streak_3:3', 'streak_7:7', 'perfect:1', 'daily:1',
    'time_15:15', 'polyglot:3', 'theme:2', 'sharer:1', 'level_10:10'
  ]);
  close();
});
