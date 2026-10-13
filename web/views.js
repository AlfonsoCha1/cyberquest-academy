/* ===== Vistas restantes ===== */

VIEWS.inicio = function (view) {
  const r = rankOf(ST.xp);
  const secCount = SECPLUS.reduce((a, d) => a + d.questions.length, 0);
  const done = {
    redes: MISSIONS.filter(m => ST.net[m.id]).length,
    term: TERM_CHALLENGES.filter(c => ST.term[c.id]).length,
    cmds: Object.keys(ST.cmds).length,
    quiz: Object.keys(ST.quiz).length
  };
  const cards = [
    ['redes', 'Laboratorio de redes', 'Conecta PC, switch, router y firewall. Configura IPs y haz ping. Cada falla te explica el porqué.', `${done.redes}/${MISSIONS.filter(m => !m.free).length} misiones`],
    ['terminal', 'Terminal', 'Linux, CMD y PowerShell sobre equipos simulados que fueron atacados. Resuelve retos como analista.', `${done.term}/${TERM_CHALLENGES.length} retos`],
    ['comandos', 'Comandos', 'Linux, CMD y PowerShell: qué significan, qué hacen y su uso en seguridad.', `${done.cmds} dominados`],
    ['sql', 'Bases de datos', 'SQL, PostgreSQL y SQLite con una base real en tu navegador, retos de investigación y examen.', `${Object.keys((ST.sql || {}).les || {}).length}/${SQL_LESSONS.length} lecciones`],
    ['secplus', 'Security+ SY0-701', 'Tus 5 dominios con teoría, preguntas, simulacro y el proyecto integral.', `${secCount} preguntas`],
    ['cursos', 'Cursos', 'Google, Cisco, AWS, Linux y Docker: código, cómo explicarlo y mini exámenes.', `${COURSES.length} cursos`],
    ['ramas', 'Las 12 ramas', 'SOC, forense, nube, criptografía y más: conceptos, herramientas y quiz.', `${BRANCHES.length} ramas`],
    ['soc', 'Simulador SOC', 'Alertas con logs reales. Decide qué harías y compáralo con un profesional.', `${SOC_SCN.length} casos`],
    ['vacantes', 'Vacantes', 'Pega cualquier vacante y ve qué habilidades pide y qué te falta. Incluye un ejemplo desglosado y temas que suelen pedir.', 'Cualquier puesto'],
    ['imprevistos', 'Imprevistos', 'Lo que no viene en el curso pero pasa en el trabajo. Practica reaccionar.', `${IMPREVISTOS.length} casos`]
  ];
  view.appendChild(h(`<div class="head">
    <span class="eyebrow">CyberQuest Academy</span>
    <h1>Aprende ciberseguridad jugando, practicando y resolviendo</h1>
    <p class="lead">Del cable y la IP hasta el SOC. Basado en el temario de CompTIA Security+ y pensado para que, cuando algo pase en el trabajo, ya sepas resolverlo.</p>
  </div>`));
  view.appendChild(h(`<section class="panel hero">
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <div><span class="eyebrow">Tu progreso</span><h2>Nivel ${r.level} · ${esc(r.name)}</h2></div>
      <div class="stat" style="text-align:right"><b>${ST.xp}</b><span>XP · ${ST.answered} respuestas · ${pct(ST.correct, ST.answered)}% acierto</span></div>
    </div>
    <div class="bar"><i style="width:${r.pct}%"></i></div>
    <div class="row"><a class="btn primary" href="#${ST.last && ST.last !== 'inicio' ? ST.last : 'redes'}">${ST.xp > 0 ? 'Continuar donde me quedé' : 'Empezar por el laboratorio de redes'}</a><a class="btn" href="#progreso">Ver mi progreso</a></div>
  </section>`));
  const grid = h('<div class="grid wide"></div>');
  grid.innerHTML = cards.map(([k, t, d, meta]) => `<a class="tile" href="#${k}"><div class="row" style="justify-content:space-between">${icon(k)}<span class="chip">${esc(meta)}</span></div><h3>${esc(t)}</h3><p>${esc(d)}</p></a>`).join('');
  view.appendChild(grid);
  view.appendChild(h(`<section class="panel"><span class="eyebrow">En construcción</span><h3>Lo que sigue en la academia</h3>
    <ul class="list"><li>Profesora IA por texto y después por voz, para preguntarle y que te corrija.</li><li>Entrevistador IA para practicar entrevistas de analista SOC, con reporte de fortalezas y pendientes.</li><li>Diplomas internos en PDF al completar rutas.</li><li>App instalable (PWA) y progreso guardado en la nube entre tu PC y tu celular.</li></ul>
    <p class="muted" style="font-size:.85rem">Todavía no están activos: cuando estén listos aparecerán en el menú.</p></section>`));
  view.appendChild(h(`<p class="muted" style="font-size:.85rem">Entorno de práctica con fines educativos. Todo ocurre en simulaciones aisladas dentro de esta página; nada toca equipos o redes reales. Tu progreso se guarda solo en este navegador.</p>`));
};

/* ---------- Security+ ---------- */
VIEWS.secplus = function (view) {
  let tab = ST.sub.secTab || 'd1';
  view.appendChild(h(`<div class="head"><span class="eyebrow">CompTIA Security+ · SY0-701</span><h1>Security+</h1>
    <p class="lead">Los 5 dominios del examen SY0-701. Estudia la teoría, pon a prueba cada dominio, haz el simulacro y resuelve el proyecto integral.</p></div>`));
  const bars = SECPLUS.map(d => { const q = ST.quiz['sec-' + d.id]; return `<div class="tile" style="gap:6px"><div class="row" style="justify-content:space-between"><strong>D${d.n} · ${esc(d.short)}</strong><span class="chip">${d.w}%</span></div><div class="bar"><i style="width:${q ? q.best : 0}%"></i></div><span class="muted" style="font-size:.8rem">${q ? 'Mejor: ' + q.best + '%' : 'Sin intentar'}</span></div>`; }).join('');
  view.appendChild(h(`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${bars}</div>`));
  view.appendChild(h(`<div class="row"><button class="btn primary mock">Simulacro de examen (30 preguntas)</button><button class="btn proj">Proyecto de Seguridad Integral</button></div>`));
  const tabs = h(`<div class="tabs" role="tablist">${SECPLUS.map(d => `<button class="tab" data-t="${d.id}">D${d.n}</button>`).join('')}</div>`);
  const host = h('<div></div>');
  view.appendChild(tabs); view.appendChild(host);

  $('.mock', view).addEventListener('click', () => {
    const pick = shuffle(SEC_ALL.map(q => Object.assign({ _qid: q._qid, _i: q._i }, q))).slice(0, 30);
    host.innerHTML = ''; tabs.hidden = true;
    const box = h('<div class="panel"></div>'); host.appendChild(box);
    mountQuiz(box, { id: 'sec-mock', title: 'Simulacro Security+', questions: pick, keepOrder: true, groupLabel: q => q.d, xpEach: 4, onClose: () => { tabs.hidden = false; render(); } });
    box.scrollIntoView({ block: 'start' });
  });
  $('.proj', view).addEventListener('click', () => { ST.sub.secTab = 'proj'; renderProject(); });

  function renderProject() {
    tabs.hidden = true; host.innerHTML = '';
    const p = h(`<div class="panel"><div class="row" style="justify-content:space-between"><h2>Proyecto de Seguridad Integral</h2><button class="btn small back">Volver a los dominios</button></div>
      <p class="lead">Es una plantilla de práctica: para cada escenario, aplicas todo lo aprendido. Primero intenta llenarlo tú; luego compara con una respuesta modelo. No hay una sola correcta: lo importante es el razonamiento.</p></div>`);
    host.appendChild(p);
    PROJECT.forEach((row, i) => {
      const acc = h(`<details class="acc"><summary><span>Escenario ${i + 1}: ${esc(row.esc)}</span></summary><div class="acc-body"></div></details>`);
      const body = $('.acc-body', acc);
      body.innerHTML = PROJECT_COLS.map((c, j) => `<div><span class="lbl" style="font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--plasma)">${esc(c)}</span><p style="color:var(--ink)">${esc(row.a[j])}</p></div>`).join('');
      p.appendChild(acc);
    });
    $('.back', p).addEventListener('click', () => { ST.sub.secTab = 'd1'; render(); });
  }
  function render() {
    if (tab === 'proj') return renderProject();
    tabs.hidden = false;
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    const d = SECPLUS.find(x => x.id === tab); ST.sub.secTab = tab; saveStore();
    host.innerHTML = '';
    const wrap = h(`<div class="view" style="gap:16px"><div class="head"><span class="eyebrow">Dominio ${d.n} · ${d.w}% del examen</span><h2>${esc(d.name)}</h2></div></div>`);
    d.topics.forEach(t => {
      const acc = h(`<details class="acc"><summary><span>${esc(t.t)}</span></summary><div class="acc-body"><p class="note">${esc(t.idea)}</p><ul class="list">${t.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="muted" style="font-size:.8rem">Tus lecciones: ${t.files.slice(0, 6).map(f => esc(f.replace(/-/g, ' '))).join(' · ')}${t.files.length > 6 ? ' …' : ''}</p></div></details>`);
      wrap.appendChild(acc);
    });
    const qbox = h('<div class="panel"></div>');
    wrap.appendChild(h(`<div class="row"><span class="eyebrow">Pon a prueba el dominio ${d.n}</span></div>`));
    wrap.appendChild(qbox);
    host.appendChild(wrap);
    mountQuiz(qbox, { id: 'sec-' + d.id, title: `Dominio ${d.n} · ${d.short}`, questions: d.questions, groupLabel: q => q.t, xpEach: 5 });
  }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; render(); }));
  render();
};

/* ---------- Cursos ---------- */
VIEWS.cursos = function (view) {
  let cur = ST.sub.curso || COURSES[0].id;
  view.appendChild(h(`<div class="head"><span class="eyebrow">Cursos</span><h1>Cursos recomendados</h1>
    <p class="lead">Google, Cisco, AWS, Linux y Docker: los conceptos, el código que de verdad se usa con su explicación, cómo contarlo en una entrevista y un mini examen de cada uno.</p></div>`));
  const tabs = h(`<div class="tabs" role="tablist">${COURSES.map(c => `<button class="tab" data-c="${c.id}">${esc(c.name)}</button>`).join('')}</div>`);
  const host = h('<div></div>');
  view.appendChild(tabs); view.appendChild(host);
  function render() {
    const c = COURSES.find(x => x.id === cur); ST.sub.curso = cur; saveStore();
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.c === cur)));
    host.innerHTML = '';
    const wrap = h(`<div class="view" style="gap:16px"><div class="head"><span class="eyebrow">${esc(c.org)}</span><h2>${esc(c.name)}</h2><p class="lead">${esc(c.intro)}</p><div class="row"><a class="btn small" href="${esc(c.url)}" target="_blank" rel="noopener">Abrir el curso ↗</a></div>${c.note ? `<p class="note">${esc(c.note)}</p>` : ''}</div></div>`);
    c.sections.forEach(s => wrap.appendChild(h(`<details class="acc"><summary><span>${esc(s.t)}</span></summary><div class="acc-body"><ul class="list">${s.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></details>`)));
    const code = h(`<div class="panel"><h3>Código que se usa (con explicación)</h3></div>`);
    c.code.forEach(cb => code.appendChild(h(`<div><div class="row" style="justify-content:space-between"><strong>${esc(cb.t)}</strong><span class="chip">${esc(cb.lang)}</span></div><pre class="codeblk">${esc(cb.code)}</pre><p class="muted">${esc(cb.exp)}</p></div>`)));
    wrap.appendChild(code);
    const exp = h(`<div class="panel"><h3>Cómo explicarlo en una entrevista</h3></div>`);
    c.explain.forEach(([q, a]) => exp.appendChild(h(`<details class="acc" style="border:0;background:none"><summary style="padding:8px 0"><span>${esc(q)}</span></summary><div class="acc-body" style="padding:0 0 10px"><p class="note">${esc(a)}</p></div></details>`)));
    wrap.appendChild(exp);
    wrap.appendChild(h(`<div class="row"><span class="eyebrow">Mini examen</span></div>`));
    const qbox = h('<div class="panel"></div>'); wrap.appendChild(qbox);
    host.appendChild(wrap);
    mountQuiz(qbox, { id: 'curso-' + c.id, title: 'Mini examen · ' + c.name, questions: c.questions, groupLabel: q => q.t, xpEach: 5 });
  }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { cur = b.dataset.c; render(); window.scrollTo(0, 0); }));
  render();
};

/* ---------- Ramas ---------- */
VIEWS.ramas = function (view) {
  view.appendChild(h(`<div class="head"><span class="eyebrow">Especialidades</span><h1>Las 12 ramas de la ciberseguridad</h1>
    <p class="lead">Para qué sirve cada una, qué hace en el día a día, sus herramientas y a dónde lleva. Empieza por SOC / Blue Team: es la puerta de entrada que estás buscando.</p></div>`));
  const grid = h('<div class="grid wide"></div>');
  const stage = h('<div hidden></div>');
  view.appendChild(grid); view.appendChild(stage);
  function drawGrid() {
    grid.innerHTML = BRANCHES.map(b => { const q = ST.quiz['rama-' + b.id]; return `<button class="tile" data-id="${b.id}"><div class="row" style="justify-content:space-between">${b.prio ? '<span class="chip plasma">Empieza aquí</span>' : '<span class="chip">Rama</span>'}${q ? `<span class="chip ${q.best >= 80 ? 'ok' : ''}">${q.best}%</span>` : ''}</div><h3>${esc(b.name)}</h3><p>${esc(b.que)}</p></button>`; }).join('');
    $$('.tile', grid).forEach(btn => btn.addEventListener('click', () => open(btn.dataset.id)));
  }
  function open(id) {
    const b = BRANCHES.find(x => x.id === id); grid.hidden = true; stage.hidden = false; stage.innerHTML = '';
    const wrap = h(`<div class="view" style="gap:16px"><div class="row"><button class="btn small back">← Todas las ramas</button></div>
      <div class="head"><span class="eyebrow">Rama${b.prio ? ' · Prioritaria' : ''}</span><h2>${esc(b.name)}</h2><p class="lead">${esc(b.que)}</p></div></div>`);
    wrap.appendChild(h(`<div class="grid"><div class="panel"><h3>En el día a día</h3><ul class="list">${b.dia.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="panel"><h3>Conceptos clave</h3><dl class="dl">${b.conceptos.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
      <div class="panel"><h3>Herramientas</h3><div class="row">${b.tools.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div><h3 style="margin-top:8px">Hacia dónde lleva</h3><p>${esc(b.roles)}</p><p class="muted" style="font-size:.85rem">Certificaciones: ${esc(b.certs)}</p></div></div>`));
    wrap.insertBefore(h(`<div class="panel hero"><h3>Qué hacer ahora</h3><ol class="list"><li><b>Lee</b> "En el día a día" y los conceptos clave de abajo (5 min).</li>${b.links && b.links.length ? '<li><b>Practica</b> con los botones de "Practícala aquí".</li>' : ''}<li><b>Contesta el quiz</b> al final: con 80% o más la rama queda marcada como dominada.</li><li><b>Repasa</b> lo que falles en Progreso y pasa a la siguiente rama.</li></ol></div>`), wrap.children[1].nextSibling);
    if (b.links && b.links.length) wrap.appendChild(h(`<div class="panel"><h3>Practícala aquí</h3><div class="row">${b.links.map(([k, t]) => `<a class="btn small" href="#${k}">${esc(t)} →</a>`).join('')}</div></div>`));
    wrap.appendChild(h(`<div class="row"><span class="eyebrow">Quiz de ${esc(b.name)}</span></div>`));
    const qbox = h('<div class="panel"></div>'); wrap.appendChild(qbox);
    stage.appendChild(wrap);
    $('.back', wrap).addEventListener('click', () => { stage.hidden = true; grid.hidden = false; drawGrid(); window.scrollTo(0, 0); });
    mountQuiz(qbox, { id: 'rama-' + b.id, title: 'Quiz · ' + b.name, questions: b.questions, xpEach: 5 });
    window.scrollTo(0, 0);
  }
  drawGrid();
};

/* ---------- SOC e Imprevistos ---------- */
VIEWS.soc = function (view) {
  view.appendChild(h(`<div class="head"><span class="eyebrow">Simulador SOC · Blue Team</span><h1>Simulador SOC</h1>
    <p class="lead">Llega una alerta con sus logs. Tú decides qué harías en cada paso y comparas con lo que haría un profesional. No se trata de teclear comandos, sino de tomar buenas decisiones bajo presión.</p></div>`));
  scenarioList(view, SOC_SCN, 'soc');
};
VIEWS.imprevistos = function (view) {
  view.appendChild(h(`<div class="head"><span class="eyebrow">Imprevistos · La vida real</span><h1>Lo que pasa en el trabajo</h1>
    <p class="lead">Situaciones que no vienen en el curso pero que te van a tocar: un ransomware, una llamada sospechosa, media oficina sin Internet. Practica reaccionar bien, en frío, antes de que pase de verdad.</p></div>`));
  scenarioList(view, IMPREVISTOS, 'imp');
};

/* ---------- Progreso ---------- */
VIEWS.progreso = function (view) {
  const r = rankOf(ST.xp);
  view.appendChild(h(`<div class="head"><span class="eyebrow">Tu avance</span><h1>Progreso</h1>
    <p class="lead">Todo se guarda solo en este navegador. Aquí ves tu nivel, lo que llevas de cada sección y los temas que fallaste para repasarlos.</p></div>`));
  view.appendChild(h(`<section class="panel"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Rango actual</span><h2>Nivel ${r.level} · ${esc(r.name)}</h2></div><div class="stat" style="text-align:right"><b>${ST.xp}</b><span>XP totales</span></div></div><div class="bar"><i style="width:${r.pct}%"></i></div>${r.to > r.from ? `<span class="muted">Te faltan ${r.to - ST.xp} XP para el siguiente rango</span>` : '<span class="muted">Rango máximo alcanzado</span>'}</section>`));
  const stats = [
    ['Misiones de red', MISSIONS.filter(m => ST.net[m.id]).length, MISSIONS.length],
    ['Retos de terminal', TERM_CHALLENGES.filter(c => ST.term[c.id]).length, TERM_CHALLENGES.length],
    ['Comandos dominados', Object.keys(ST.cmds).length, CMDS.length],
    ['Escenarios resueltos', Object.keys(ST.scn).length, SOC_SCN.length + IMPREVISTOS.length],
    ['Quizzes presentados', Object.keys(ST.quiz).length, Object.keys(QUIZZES).length],
    ['Precisión global', pct(ST.correct, ST.answered), 100, '%']
  ];
  const g = h('<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))"></div>');
  g.innerHTML = stats.map(([t, a, b, u]) => `<div class="tile"><div class="stat"><b>${a}${u || ''}${u ? '' : ` <span class="muted" style="font-size:1rem">/ ${b}</span>`}</b><span>${esc(t)}</span></div><div class="bar"><i style="width:${pct(a, b)}%"></i></div></div>`).join('');
  view.appendChild(g);

  const wrongKeys = Object.keys(ST.wrong);
  const repaso = h('<section class="panel"></section>');
  function drawRepaso() {
    const keys = Object.keys(ST.wrong);
    const items = keys.map(k => { const w = ST.wrong[k]; const quiz = QUIZZES[w.qid]; const q = quiz && quiz.questions[w.i]; return q ? { k, q, w } : null; }).filter(Boolean);
    repaso.innerHTML = `<div class="row" style="justify-content:space-between"><h2>Repaso de errores</h2>${items.length ? `<button class="btn primary small rp">Repasar ${items.length}</button>` : ''}</div>`;
    if (!items.length) { repaso.appendChild(h('<div class="empty">Sin errores pendientes. Cuando falles una pregunta, aquí aparece para repasarla.</div>')); return; }
    const ul = h(`<ul class="list">${items.slice(0, 12).map(it => `<li>${esc(it.q.t || it.q.q)}</li>`).join('')}${items.length > 12 ? `<li class="muted">… y ${items.length - 12} más</li>` : ''}</ul>`);
    repaso.appendChild(ul);
    $('.rp', repaso).addEventListener('click', () => {
      const qs = items.map(it => Object.assign({ _qid: it.w.qid, _i: it.w.i }, it.q));
      const box = h('<div class="panel"></div>'); repaso.innerHTML = ''; repaso.appendChild(box);
      mountQuiz(box, { id: 'repaso', title: 'Repaso de errores', questions: qs, xpEach: 3, onClose: drawRepaso });
    });
  }
  drawRepaso();
  view.appendChild(repaso);

  const data = h(`<section class="panel"><h2>Tus datos</h2><p class="muted">Tu progreso vive solo en este navegador (no se sube a ningún lado). Puedes exportarlo como respaldo o borrarlo por completo.</p>
    <div class="row"><button class="btn small exp">Exportar (copiar)</button><button class="btn small imp">Importar</button><button class="btn small del">Borrar todo</button></div><div class="io"></div><div class="row"><button class="btn small lt" type="button">Cambiar modo ligero</button><span class="muted" style="font-size:.85rem">Apaga brillos y animaciones para PCs viejas.</span></div></section>`);
  view.appendChild(data);
  $('.lt', data).addEventListener('click', toggleLite);
  $('.exp', data).addEventListener('click', () => copyText(JSON.stringify(ST), 'Progreso copiado. Pégalo en un archivo para guardarlo.'));
  $('.imp', data).addEventListener('click', () => {
    $('.io', data).innerHTML = '<div class="field"><label>Pega aquí tu respaldo y toca Cargar</label><textarea rows="4" class="imp-ta"></textarea></div><button class="btn small primary load">Cargar</button>';
    $('.load', data).addEventListener('click', () => { try { const obj = JSON.parse($('.imp-ta', data).value); ST = Object.assign(blank(), obj); saveStore(); toast('Progreso importado'); go('progreso'); } catch (e) { toast('Ese texto no es un respaldo válido'); } });
  });
  let armed = false;
  $('.del', data).addEventListener('click', e => {
    if (!armed) { armed = true; e.target.textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { if (e.target.isConnected) { armed = false; e.target.textContent = 'Borrar todo'; } }, 3500); return; }
    try { localStorage.removeItem(STORE_KEY); } catch (err) { } ST = blank(); saveStore(); toast('Progreso borrado'); go('inicio');
  });
};
