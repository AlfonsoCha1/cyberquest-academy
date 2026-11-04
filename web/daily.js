/* ===== Misión del día y racha: inglés + programación + ciberseguridad, todos los días ===== */
const DAILY_AREA = { ingles: 'en', devlab: 'dev', ctf: 'sec', soc: 'sec', imprevistos: 'sec', redes: 'sec', terminal: 'sec', comandos: 'sec', sql: 'sec', secplus: 'sec', ramas: 'sec', cursos: 'sec' };
const dailyState = () => (ST.daily = Object.assign({ days: {} }, ST.daily || {}));
function dailyMark(area) {
  if (!area) return;
  const D = dailyState(), k = extDay();
  const day = D.days[k] = Object.assign({}, D.days[k] || {});
  if (day[area]) return;
  day[area] = 1;
  const keys = Object.keys(D.days).sort(); while (keys.length > 120) delete D.days[keys.shift()];
  saveStore();
  const done = ['en', 'dev', 'sec'].filter(a => day[a]).length;
  setTimeout(() => toast(done === 3 ? '🔥 ¡Misión del día completa! Inglés, código y seguridad.' : `Misión del día: ${done} de 3`), 2700);
}
/* Cualquier XP ganada en una sección cuenta para su área de la misión. */
const _baseAddXP = addXP;
addXP = function (n, why) { _baseAddXP(n, why); if (n > 0) dailyMark(DAILY_AREA[String(ST.last || '').split('/')[0]]); };
function dailyStreak() {
  const D = dailyState().days, d = new Date();
  const has = k => D[k] && Object.keys(D[k]).length;
  if (!has(extDay(d))) d.setDate(d.getDate() - 1); // la racha sigue viva si hoy todavía no practicas
  let n = 0; while (has(extDay(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function dailyPick(list, salt) { const s = extDay() + salt; let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return list[x % list.length]; }
function dailyMissions() {
  const cats = Object.keys(EN_VOCAB), c = dailyPick(cats.map((t, i) => [t, i]), 'en');
  const dev = dailyPick([...PARSONS.map(p => ['par', p]), ...REVIEW.map(r => ['rev', r])], 'dev');
  const pool = [...CTF.filter(x => !(ST.ctf && ST.ctf.solved && ST.ctf.solved[x.id])).map(x => ['ctf', x]), ...SOC_SCN.map(x => ['soc', x])];
  const sec = dailyPick(pool.length ? pool : SOC_SCN.map(x => ['soc', x]), 'sec');
  return [
    { a: 'en', ico: 'ingles', t: 'Inglés', d: `Vocabulario de ${c[0].toLowerCase()} y su quiz`, go: () => { ST.sub.enTab = 'voc'; ST.sub.enCat = c[1]; go('ingles'); } },
    { a: 'dev', ico: 'devlab', t: 'Programación', d: dev[0] === 'par' ? `Ordena el código: ${dev[1].t}` : `Encuentra la vulnerabilidad: ${dev[1].t}`, go: () => { ST.sub.devTab = dev[0]; go('devlab'); } },
    { a: 'sec', ico: sec[0] === 'ctf' ? 'ctf' : 'soc', t: 'Ciberseguridad', d: sec[0] === 'ctf' ? `CTF: ${sec[1].t}` : `Caso SOC: ${sec[1].title}`, go: () => { if (sec[0] === 'ctf') { ST.sub.ctfOpen = sec[1].id; go('ctf'); } else go('soc'); } }
  ];
}

/* Tocar en el menú la sección donde ya estás te regresa a su vista principal (antes no pasaba nada). */
(function () {
  const nav = document.getElementById('nav');
  if (nav) nav.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.nav-i'); if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); route(); } });
})();

/* Inicio: misión del día + accesos a lo nuevo */
const _baseInicio = VIEWS.inicio;
VIEWS.inicio = function (view) {
  _baseInicio(view);
  const today = dailyState().days[extDay()] || {}, streak = dailyStreak();
  const ms = dailyMissions(), done = ms.filter(m => today[m.a]).length;
  const week = (() => { const out = []; const d = extWeekStart(new Date()); for (let i = 0; i < 7; i++) { const k = extDay(d); const v = dailyState().days[k] || {}; out.push({ k, n: ['en', 'dev', 'sec'].filter(a => v[a]).length, future: d > new Date() }); d.setDate(d.getDate() + 1); } return out; })();
  const panel = h(`<section class="panel mission"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Misión del día</span><h2>${done === 3 ? '¡Completa! Vuelve mañana 🔥' : `Hoy: inglés, código y seguridad (${done}/3)`}</h2></div>
    <div class="row" style="gap:14px"><div class="stat" style="text-align:right"><b>🔥 ${streak}</b><span>día${streak === 1 ? '' : 's'} seguido${streak === 1 ? '' : 's'}</span></div></div></div>
    <div class="grid mission-grid">${ms.map((m, i) => `<button class="tile mis ${today[m.a] ? 'is-done' : ''}" data-i="${i}" type="button"><div class="row" style="justify-content:space-between">${icon(m.ico)}<span class="chip ${today[m.a] ? 'ok' : ''}">${today[m.a] ? '✓ Hecho' : 'Pendiente'}</span></div><h3>${m.t}</h3><p>${esc(m.d)}</p></button>`).join('')}</div>
    <div class="row week-dots" aria-label="Tu semana">${week.map((w, i) => `<span class="wd ${w.future ? 'fut' : ''} n${w.n}" title="${w.k}: ${w.n} de 3"><b>${'LMMJVSD'[i]}</b></span>`).join('')}<span class="muted" style="font-size:.82rem">Cada área cuenta cuando ganas XP en ella. La misión cambia cada día.</span></div></section>`);
  const hero = $('.panel.hero', view);
  if (hero) hero.after(panel); else view.prepend(panel);
  $$('.mis', panel).forEach(b => b.addEventListener('click', () => { saveStore(); ms[+b.dataset.i].go(); }));
  const grid = $('.grid.wide', view);
  if (grid) {
    const E = extState(ST), ext = Object.keys(E.items).length;
    const extra = [
      ['ctf', 'CTF', 'Banderas escondidas en logs, tokens, Base64 y procesos sospechosos. Con caja de herramientas.', `${Object.keys((ST.ctf || {}).solved || {}).length}/${CTF.length} banderas`],
      ['devlab', 'Laboratorio Dev+Sec', 'Ordena código, encuentra vulnerabilidades y predice qué imprime: Python, PowerShell y JavaScript.', `${PARSONS.length + REVIEW.length + PREDICT.length} retos`],
      ['ingles', 'Inglés técnico', 'Vocabulario con audio, frases de trabajo, falsos amigos, dictado y entrevista en inglés.', `${Object.values(EN_VOCAB).reduce((a, l) => a + l.length, 0)} palabras`],
      ['formacion', 'Mi formación externa', 'Tus cursos de Coursera, Udemy y otras plataformas: avance, notas, horas y certificados.', ext ? `${ext} curso${ext === 1 ? '' : 's'}` : 'Agrega tus cursos'],
      ['trabajo', 'Mi trabajo 🔒', 'Apartado privado: PowerShell, SQL, VS Code, herramientas y notas cifradas.', 'Con contraseña']
    ];
    extra.forEach(([k, t, d, meta]) => grid.appendChild(h(`<a class="tile" href="#${k}"><div class="row" style="justify-content:space-between">${icon(k)}<span class="chip">${esc(meta)}</span></div><h3>${esc(t)}</h3><p>${esc(d)}</p></a>`)));
  }
};
