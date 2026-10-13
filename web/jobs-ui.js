/* ===== Vacantes: prepárate para un trabajo real ===== */
function jobAnalyze(text) {
  const found = JOB_SKILLS.filter(s => s.re.test(text));
  const certs = JOB_CERTS.filter(([, re]) => re.test(text)).map(([n]) => n);
  const years = [...text.matchAll(/(\d{1,2})\s*\+?\s*a[ñn]os/gi)].map(m => +m[1]).filter(n => n > 0 && n < 40);
  const english = /ingl[eé]s|english/i.test(text);
  return { found, certs, years: [...new Set(years)], english };
}
const jobState = () => (ST.jobs = Object.assign({}, ST.jobs || {}));
const skillById = id => JOB_SKILLS.find(s => s.id === id);
const topicById = id => JOB_TOPICS.find(t => t.id === id);
function skillStatus(s) { return s.cubre.length ? (s.tema ? ['ok', 'En la academia + tema extra'] : ['ok', 'En la academia']) : s.tema ? ['plasma', 'Tema de vacantes'] : ['warn', 'Fuera de la academia por ahora']; }
function skillLinks(s, openTopic) {
  const links = s.cubre.map(([v, t]) => `<a class="btn small" href="#${v}">${esc(t)}</a>`);
  if (s.tema) links.push(`<button class="btn small tp" data-tp="${s.tema}" type="button">Tema: ${esc(topicById(s.tema).t)}</button>`);
  return links.join('');
}

VIEWS.vacantes = function (view) {
  const J = jobState();
  view.appendChild(h(`<div class="head"><span class="eyebrow">Vacantes</span><h1>Prepárate para cualquier vacante</h1>
    <p class="lead">Pega el texto de la vacante que te interese (de cualquier empresa o puesto) y te digo qué habilidades pide, cuáles ya practicas aquí y qué te falta. Abajo hay un ejemplo ya desglosado para que veas cómo se usa.</p></div>`));
  const tabs = h('<div class="tabs" role="tablist"><button class="tab" data-t="ana">Analizar una vacante</button><button class="tab" data-t="vac">Ejemplo desglosado</button><button class="tab" data-t="tem">Temas que piden</button></div>');
  const host = h('<div class="view" style="gap:16px"></div>');
  view.appendChild(tabs); view.appendChild(host);
  let tab = ST.sub.jobTab || 'ana';
  const setTab = t => { tab = t; ST.sub.jobTab = t; saveStore(); draw(); };
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => setTab(b.dataset.t)));
  const wireTopics = root => $$('.tp', root).forEach(b => b.addEventListener('click', () => openTopic(b.dataset.tp)));

  function draw() {
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    host.innerHTML = '';
    ({ ana: drawAnalyzer, vac: drawJobs, tem: drawTopics })[tab]();
  }

  /* ----- analizador ----- */
  function drawAnalyzer() {
    const box = h(`<section class="panel"><div class="field"><label for="job-text">Pega aquí el texto de la vacante (responsabilidades y requisitos)</label>
      <textarea id="job-text" rows="8" placeholder="Ejemplo: Buscamos Analista SOC con experiencia en SIEM (Splunk o Sentinel), respuesta a incidentes, Linux, Python y deseable Security+…"></textarea></div>
      <div class="row"><button class="btn primary an" type="button">Analizar</button><button class="btn ej" type="button">Probar con una vacante de ejemplo</button><span class="muted" style="font-size:.82rem">El texto no sale de tu equipo.</span></div></section>`);
    const out = h('<div class="view" style="gap:14px"></div>');
    host.appendChild(box); host.appendChild(out);
    const ta = $('#job-text', box);
    try { ta.value = localStorage.getItem('cyberquest-job-text') || ''; } catch (e) { }
    const run = () => {
      const text = ta.value.trim();
      try { localStorage.setItem('cyberquest-job-text', text); } catch (e) { }
      if (text.length < 40) { out.innerHTML = '<div class="empty">Pega un poco más de texto: al menos los requisitos.</div>'; return; }
      const r = jobAnalyze(text);
      if (!r.found.length) { out.innerHTML = '<div class="empty">No encontré habilidades de ciberseguridad conocidas en ese texto. Revisa que pegaste la parte de requisitos.</div>'; return; }
      const covered = r.found.filter(s => s.cubre.length || s.tema).length;
      out.innerHTML = `<section class="panel hero"><span class="eyebrow">Resultado</span><h2>La academia cubre ${covered} de ${r.found.length} habilidades que pide</h2>
        <div class="bar"><i style="width:${pct(covered, r.found.length)}%"></i></div>
        <div class="row">${r.years.length ? `<span class="chip warn">Experiencia: ${r.years.join(' / ')} años</span>` : ''}${r.certs.map(c => `<span class="chip plasma">Certificación: ${esc(c)}</span>`).join('')}${r.english ? '<span class="chip warn">Pide inglés</span>' : ''}</div></section>
        <div class="grid wide">${r.found.map(s => { const [cls, lab] = skillStatus(s); return `<div class="tile"><div class="row" style="justify-content:space-between"><h3>${esc(s.n)}</h3><span class="chip ${cls}">${esc(lab)}</span></div>
          <div class="row">${skillLinks(s)}</div>
          <details class="acc" style="border:0;background:none"><summary style="padding:6px 0"><span>Pregunta de entrevista probable</span></summary><div class="acc-body" style="padding:0"><p style="color:var(--ink)">${esc(s.q[0])}</p><p class="note">${esc(s.q[1])}</p></div></details></div>`; }).join('')}</div>
        <section class="panel"><h3>Practica con un quiz de esta vacante</h3><div class="qz"></div></section>`;
      wireTopics(out);
      const qs = r.found.filter(s => s.tema).flatMap(s => topicById(s.tema).quiz.map(([q, o, e]) => ({ q, o, a: 0, e, t: s.n })));
      if (qs.length) mountQuiz($('.qz', out), { id: 'vacante-analizada', title: 'Quiz de la vacante', questions: shuffle(qs).slice(0, 10), groupLabel: q => q.t, xpEach: 4 });
      else $('.qz', out).innerHTML = '<p class="muted">Todo lo que pide ya está en la academia: practica en las secciones enlazadas arriba.</p>';
    };
    $('.an', box).addEventListener('click', run);
    $('.ej', box).addEventListener('click', () => {
      const j = JOBS[0];
      ta.value = [j.titulo, j.mision, ...j.responsabilidades.map(r => r[0]), ...j.tecnicos.map(t => t[0]), j.perfil].join('\n');
      run();
    });
    if (ta.value.trim().length >= 40) run();
  }

  /* ----- vacantes guardadas ----- */
  function drawJobs() {
    const g = h('<div class="grid wide"></div>');
    g.innerHTML = JOBS.map(j => { const st = J[j.id] || { steps: {} }; const d = Object.keys(st.steps || {}).length; return `<button class="tile" data-j="${j.id}"><div class="row" style="justify-content:space-between"><span class="chip plasma">${esc(j.empresa)}</span><span class="chip">${d}/${j.ruta.length} pasos</span></div><h3>${esc(j.titulo)}</h3><p>${esc(j.lugar)} · ${esc(j.sueldo)}</p></button>`; }).join('');
    $$('.tile', g).forEach(b => b.addEventListener('click', () => job(JOBS.find(j => j.id === b.dataset.j))));
    host.appendChild(g);
    host.appendChild(h('<p class="muted" style="font-size:.88rem">Esta vacante es totalmente inventada (empresa y datos ficticios) y solo muestra cómo se desglosa. Para la tuya, pégala en "Analizar una vacante": funciona con cualquier puesto.</p>'));
  }
  function job(j) {
    host.innerHTML = ''; window.scrollTo(0, 0);
    const st = J[j.id] = Object.assign({ steps: {} }, J[j.id] || {});
    const skillChips = ids => ids.map(id => { const s = skillById(id); const [cls] = skillStatus(s); return `<span class="chip ${cls}">${esc(s.n)}</span>`; }).join('');
    const allSkills = [...new Set(j.tecnicos.flatMap(t => t[1]))].map(skillById);
    const box = h(`<article class="view" style="gap:14px">
      <div class="row"><button class="btn small back" type="button">← Ejemplo</button><span class="chip warn">Vacante inventada</span></div>
      <section class="panel hero"><span class="eyebrow">${esc(j.empresa)} · ${esc(j.lugar)}</span><h2>${esc(j.titulo)}</h2>
        <p>${esc(j.mision)}</p><div class="row"><span class="chip">${esc(j.sueldo)}</span><span class="chip">${esc(j.contrato)}</span><span class="chip">Publicada: ${esc(j.publicada)}</span></div></section>
      <section class="panel"><h3>Qué harías</h3><ul class="list">${j.responsabilidades.map(([t, ids]) => `<li>${esc(t)}<div class="row" style="margin-top:4px">${skillChips(ids)}</div></li>`).join('')}</ul></section>
      <section class="panel"><h3>Qué piden y dónde lo practicas</h3><div class="tbl-wrap"><table class="addr"><tr><th>Requisito</th><th>Dónde practicarlo</th></tr>${j.tecnicos.map(([t, ids]) => `<tr><td>${esc(t)}</td><td><div class="row">${ids.map(id => skillLinks(skillById(id))).join('')}</div></td></tr>`).join('')}</table></div>
        <p class="muted" style="font-size:.88rem"><b>Perfil:</b> ${esc(j.perfil)}</p><p class="note">${esc(j.nota)}</p></section>
      <section class="panel"><h3>Tu ruta para esta vacante</h3><ol class="checks ruta">${j.ruta.map(([t, v, why], i) => `<li><input type="checkbox" id="rt-${i}" ${st.steps[i] ? 'checked' : ''}><label for="rt-${i}"><b>${esc(t)}</b> <span class="muted">— ${esc(why)}</span></label>${['temas', 'entrevista'].includes(v) ? '' : ` <a class="btn small" href="#${v}">Ir</a>`}</li>`).join('')}</ol></section>
      <section class="panel"><h3>Preguntas de entrevista</h3><div class="iq"></div></section>
      <section class="panel"><h3>Competencias que van a evaluar</h3><p>${j.competencias.map(esc).join(' · ')}</p><p class="muted" style="font-size:.88rem">Prepara un ejemplo real de cada una con la fórmula situación, acción y resultado.</p></section>
      <section class="panel"><h3>Quiz de la vacante</h3><div class="qz"></div></section></article>`);
    host.appendChild(box);
    $('.back', box).addEventListener('click', () => draw());
    wireTopics(box);
    $$('.ruta input', box).forEach((c, i) => c.addEventListener('change', () => { if (c.checked) st.steps[i] = Date.now(); else delete st.steps[i]; saveStore(); if (c.checked && Object.keys(st.steps).length === j.ruta.length) addXP(100, 'Ruta completa: ' + j.titulo); }));
    const iq = [...allSkills.map(s => s.q), ...j.extra];
    $('.iq', box).innerHTML = iq.map(([q, a]) => `<details class="acc" style="border:0;background:none"><summary style="padding:8px 0"><span>${esc(q)}</span></summary><div class="acc-body" style="padding:0 0 10px"><p class="note">${esc(a)}</p></div></details>`).join('');
    mountQuiz($('.qz', box), { id: 'vacante-' + j.id, title: 'Quiz · ' + j.titulo, questions: j.quiz.map(([q, o, e]) => ({ q, o, a: 0, e, t: j.empresa })), xpEach: 6 });
  }

  /* ----- temas que piden las vacantes ----- */
  function drawTopics() {
    const g = h('<div class="grid wide"></div>');
    g.innerHTML = JOB_TOPICS.map(t => `<button class="tile tp" data-tp="${t.id}"><h3>${esc(t.t)}</h3><p>${esc(t.que.length > 130 ? t.que.slice(0, 127) + '…' : t.que)}</p>${(J.topics || {})[t.id] ? '<span class="chip ok">Repasado</span>' : ''}</button>`).join('');
    host.appendChild(g); wireTopics(g);
  }
  function openTopic(id) {
    const T = topicById(id); tab = 'tem'; ST.sub.jobTab = 'tem';
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    host.innerHTML = ''; window.scrollTo(0, 0);
    const box = h(`<article class="view" style="gap:14px"><div class="row"><button class="btn small back" type="button">← Temas</button></div><h2>${esc(T.t)}</h2>
      <section class="panel"><span class="eyebrow">Qué es</span><p style="color:var(--ink)">${esc(T.que)}</p><span class="eyebrow">Para qué sirve</span><p>${esc(T.para)}</p>
        <span class="eyebrow">Cómo funciona</span><ol class="list">${T.como.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
        <span class="eyebrow">Herramientas</span><p>${esc(T.tools)}</p></section>
      <section class="panel"><span class="eyebrow">Caso real</span><pre class="codeblk" style="white-space:pre-wrap">${esc(T.caso)}</pre></section>
      <section class="panel"><span class="eyebrow">Mini examen</span><div class="qz"></div></section></article>`);
    host.appendChild(box);
    $('.back', box).addEventListener('click', () => draw());
    mountQuiz($('.qz', box), { id: 'tema-' + T.id, title: 'Mini examen · ' + T.t, questions: T.quiz.map(([q, o, e]) => ({ q, o, a: 0, e, t: T.t })), xpEach: 5, onDone: s => { if (s >= 50) { J.topics = Object.assign({}, J.topics, { [T.id]: Date.now() }); saveStore(); } } });
  }

  draw();
};
