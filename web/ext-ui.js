/* ===== Mi formación externa: interfaz (rutas #formacion, #formacion/coursera, #formacion/udemy, …) ===== */
ICONS.formacion = '<path d="M4 4h10a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M17 8h3v12H7"/><path d="M8 9h5M8 13h5"/>';
const EXT_TABS = [['', 'Todos mis cursos'], ['coursera', 'Coursera'], ['udemy', 'Udemy'], ['otras', 'Otras plataformas'], ['interes', 'Cursos de interés'], ['progreso', 'Progreso y estadísticas'], ['agregar', 'Agregar o importar']];
const EXT_CHIP = { confirmar: 'warn', sin: '', progreso: 'volt', pausa: 'plasma', hecho: 'ok' };
const extS = () => extState(ST);
const extProvName = it => it.prov === 'otra' ? (it.provName || 'Otra plataforma') : EXT_PROVIDERS[it.prov];
const extSafeUrl = u => { const p = extParseUrl(u); return p.ok && p.u ? p.url : ''; };
const extLink = (url, label, cls) => { const u = extSafeUrl(url); return u ? `<a class="btn small ${cls || ''}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : ''; };
function extPctLabel(it) {
  if (it.pct == null) return 'Sin porcentaje registrado';
  const src = it.pctSrc === 'captura' ? 'observado en una captura' : it.pctSrc === 'importación' ? 'importado' : 'actualizado a mano';
  return `${it.pct}% · ${src} el ${it.pctAt}${it.pctSrc === 'manual' ? '' : ' (no se sincroniza solo con la plataforma)'}`;
}
function extAcademyGuide(it) {
  if (typeof COURSES === 'undefined') return null;
  return COURSES.find(c => { const p = extParseUrl(c.url); return (p.u && extKeyFromUrl(p.u) === it.key) || extNorm(c.name) === extNorm(it.title); }) || null;
}
function extDownload(name, text, type) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
    const a = h(`<a href="${url}" download="${esc(name)}" hidden></a>`); document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  } catch (e) { copyText(text, 'No se pudo descargar: lo copié al portapapeles'); }
}

/* ---------- vista principal ---------- */
function extView(view, sub) {
  const E = extS();
  view.appendChild(h(`<div class="head"><span class="eyebrow">Fuera de la academia</span><h1>Mi formación externa</h1>
    <p class="lead">Tu control personal de cursos de Coursera, Udemy y otras plataformas: avance, notas, horas, certificados y fechas. Es un registro tuyo: no copia ni reemplaza el contenido de esos cursos, y el avance lo capturas tú.</p></div>`));
  view.appendChild(h(`<nav class="tabs" aria-label="Apartados de Mi formación externa">${EXT_TABS.map(([k, t]) => `<a class="tab" href="#formacion${k ? '/' + k : ''}" ${k === sub ? 'aria-selected="true" aria-current="page"' : ''}>${esc(t)}</a>`).join('')}</nav>`));
  const host = h('<div class="view" style="gap:16px"></div>'); view.appendChild(host);
  if (sub === 'interes') return extInterest(host, E);
  if (sub === 'progreso') return extProgress(host, E);
  if (sub === 'agregar') return extAddImport(host, E);
  extList(host, E, { '': null, coursera: 'coursera', udemy: 'udemy', otras: 'otra' }[sub] || null, sub);
}
VIEWS.formacion = v => extView(v, '');
EXT_TABS.slice(1).forEach(([k]) => { VIEWS['formacion/' + k] = v => extView(v, k); });

/* ---------- lista de cursos con filtros ---------- */
function extList(host, E, prov, sub) {
  const F = ST.sub.extF = Object.assign({ q: '', estado: '', prog: '', orden: 'reciente' }, ST.sub.extF || {});
  const all = Object.values(E.items).filter(i => !prov || i.prov === prov);
  const progs = Object.values(E.programs).filter(p => !prov || p.prov === prov || all.some(i => i.prog === p.key));
  if (F.prog && !progs.some(p => p.key === F.prog)) F.prog = '';
  const bar = h(`<div class="panel ext-tools"><div class="ext-filters">
      <div class="field"><label for="ext-q">Buscar</label><input id="ext-q" type="search" placeholder="Título, institución, etiqueta o nota" value="${esc(F.q)}" autocomplete="off"></div>
      <div class="field"><label for="ext-e">Estado</label><select id="ext-e"><option value="">Todos</option>${EXT_STATES.map(([k, t]) => `<option value="${k}" ${F.estado === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="ext-p">Programa</label><select id="ext-p"><option value="">Todos</option><option value="-" ${F.prog === '-' ? 'selected' : ''}>Sin programa</option>${progs.map(p => `<option value="${esc(p.key)}" ${F.prog === p.key ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></div>
      <div class="field"><label for="ext-o">Ordenar</label><select id="ext-o">${[['reciente', 'Editados recientemente'], ['titulo', 'Título A-Z'], ['avance', 'Más avance'], ['menos', 'Menos avance'], ['programa', 'Programa y orden'], ['meta', 'Fecha meta']].map(([k, t]) => `<option value="${k}" ${F.orden === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    </div><div class="row"><a class="btn small primary" href="#formacion/agregar">+ Agregar o importar</a><button class="btn small clr" type="button">Limpiar filtros</button><span class="muted ext-count" style="font-size:.85rem"></span></div></div>`);
  host.appendChild(bar);
  const progBox = h('<div class="grid wide ext-progs"></div>'), grid = h('<div class="grid wide"></div>'), stage = h('<div hidden></div>');
  host.appendChild(progBox); host.appendChild(grid); host.appendChild(stage);

  function drawProgs() {
    const st = extStats(E);
    const rows = st.byProgram.filter(p => progs.some(x => x.key === p.key));
    progBox.hidden = !rows.length || !!F.prog;
    progBox.innerHTML = rows.map(p => {
      const P = E.programs[p.key];
      return `<div class="tile ext-prog"><div class="row" style="justify-content:space-between"><span class="chip plasma">Programa · ${esc(EXT_PROVIDERS[p.prov] || '')}</span><span class="chip ${p.total && p.hecho === p.total ? 'ok' : ''}">${p.total ? `${p.hecho} de ${p.total} completados` : 'Temario por confirmar'}</span></div>
        <h3>${esc(p.title)}</h3>${P.inst ? `<p>${esc(P.inst)}</p>` : ''}
        ${p.total ? `<div class="bar" role="img" aria-label="${p.hecho} de ${p.total} cursos completados"><i style="width:${pct(p.hecho, p.total)}%"></i></div>` : '<p class="muted ext-sm">Sin cursos registrados: no se inventan módulos. Agrégalos cuando los veas en la plataforma.</p>'}
        <p class="muted ext-sm">${p.linked} curso${p.linked === 1 ? '' : 's'} registrado${p.linked === 1 ? '' : 's'}${p.declared ? ` de ${p.declared} declarados` : ''}${p.confirmar ? ` · ${p.confirmar} por confirmar` : ''}</p>
        <div class="row">${p.linked ? `<button class="btn small" data-pf="${esc(p.key)}" type="button">Ver sus cursos</button>` : ''}${extLink(P.url, 'Abrir programa')}<button class="btn small" data-pe="${esc(p.key)}" type="button">Editar</button></div></div>`;
    }).join('');
    $$('[data-pf]', progBox).forEach(b => b.addEventListener('click', () => { F.prog = b.dataset.pf; saveStore(); $('#ext-p').value = F.prog; draw(); }));
    $$('[data-pe]', progBox).forEach(b => b.addEventListener('click', () => extProgramEditor(stage, [progBox, grid, bar], E, b.dataset.pe, () => { drawProgs(); draw(); })));
  }
  function filtered() {
    const q = extNorm(F.q);
    let xs = all.filter(i => (!F.estado || i.estado === F.estado) && (!F.prog || (F.prog === '-' ? !i.prog : i.prog === F.prog)));
    if (q) xs = xs.filter(i => extNorm([i.title, i.inst, i.notas, (i.tags || []).join(' '), (i.temas || []).join(' '), i.provName, (E.programs[i.prog] || {}).title].join(' ')).includes(q));
    const by = {
      reciente: (a, b) => (b.editado || '').localeCompare(a.editado || '') || a.title.localeCompare(b.title),
      titulo: (a, b) => a.title.localeCompare(b.title),
      avance: (a, b) => (b.pct == null ? -1 : b.pct) - (a.pct == null ? -1 : a.pct),
      menos: (a, b) => (a.pct == null ? 101 : a.pct) - (b.pct == null ? 101 : b.pct),
      programa: (a, b) => ((E.programs[a.prog] || {}).title || '~').localeCompare((E.programs[b.prog] || {}).title || '~') || (a.orden == null ? 999 : a.orden) - (b.orden == null ? 999 : b.orden),
      meta: (a, b) => (a.fin || '9999').localeCompare(b.fin || '9999')
    };
    return xs.sort(by[F.orden] || by.reciente);
  }
  function draw() {
    const xs = filtered();
    $('.ext-count', bar).textContent = `${xs.length} de ${all.length} curso${all.length === 1 ? '' : 's'}`;
    if (!all.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Todavía no tienes cursos${prov ? ' de ' + EXT_PROVIDERS[prov] : ''} aquí.<br><br><a class="btn small primary" href="#formacion/agregar">Agregar o importar mis cursos</a></div>`;
      return;
    }
    grid.innerHTML = xs.length ? xs.map(i => extCardHtml(i, E)).join('') : '<div class="empty" style="grid-column:1/-1">Ningún curso coincide con esos filtros.</div>';
    $$('[data-open]', grid).forEach(b => b.addEventListener('click', () => extDetail(stage, [progBox, grid, bar], E, b.dataset.open, () => { drawProgs(); draw(); })));
  }
  const upd = () => { F.q = $('#ext-q').value; F.estado = $('#ext-e').value; F.prog = $('#ext-p').value; F.orden = $('#ext-o').value; saveStore(); drawProgs(); draw(); };
  let t; $('#ext-q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(upd, 160); });
  ['#ext-e', '#ext-p', '#ext-o'].forEach(s => $(s).addEventListener('change', upd));
  $('.clr', bar).addEventListener('click', () => { Object.assign(F, { q: '', estado: '', prog: '', orden: 'reciente' }); saveStore(); go(location.hash.slice(1) || 'formacion'); });
  drawProgs(); draw();
  const pending = ST.sub.extOpen; if (pending && E.items[pending]) { ST.sub.extOpen = ''; extDetail(stage, [progBox, grid, bar], E, pending, () => { drawProgs(); draw(); }); }
}
function extCardHtml(it, E) {
  const prog = it.prog && E.programs[it.prog];
  return `<article class="tile ext-card"><div class="row" style="justify-content:space-between"><span class="chip">${esc(extProvName(it))}</span><span class="chip ${EXT_CHIP[it.estado] || ''}">${esc(extStateName(it.estado))}</span></div>
    <h3>${esc(it.title)}</h3>
    ${it.inst || prog ? `<p class="ext-sm">${[it.inst, prog ? `${prog.title}${it.orden != null ? ' · curso ' + it.orden : ''}` : ''].filter(Boolean).map(esc).join(' · ')}</p>` : ''}
    ${it.pct != null ? `<div class="bar" role="img" aria-label="Avance ${it.pct}%"><i style="width:${it.pct}%"></i></div>` : ''}
    <span class="muted ext-sm">${esc(extPctLabel(it))}</span>
    <div class="meta">${(it.tags || []).slice(0, 5).map(t => `<span class="chip">#${esc(t)}</span>`).join('')}${it.cert && it.cert.tiene ? '<span class="chip ok">Certificado</span>' : ''}${it.fin && it.estado !== 'hecho' ? `<span class="chip ${it.fin < extDay() ? 'bad' : ''}">Meta ${esc(it.fin)}</span>` : ''}${it.horas ? `<span class="chip">${it.horas} h</span>` : ''}${it.titleFromLink ? '<span class="chip warn">Título tomado del enlace</span>' : ''}</div>
    <div class="row">${extLink(it.url, 'Continuar estudiando', 'primary')}<button class="btn small" data-open="${esc(it.key)}" type="button">Ficha y notas</button></div></article>`;
}

/* ---------- ficha de un curso (editar, registrar estudio, quitar) ---------- */
function extDetail(stage, hide, E, key, back) {
  const it = E.items[key]; if (!it) return;
  hide.forEach(x => x.hidden = true); stage.hidden = false; stage.innerHTML = '';
  const close = () => { stage.hidden = true; stage.innerHTML = ''; hide.forEach(x => x.hidden = false); back(); window.scrollTo(0, 0); };
  const guide = extAcademyGuide(it);
  const progOpts = `<option value="">Sin programa</option>${Object.values(E.programs).map(p => `<option value="${esc(p.key)}" ${it.prog === p.key ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}`;
  const box = h(`<article class="view" style="gap:14px">
    <div class="row"><button class="btn small back" type="button">← Volver a la lista</button><span class="chip">${esc(extProvName(it))}</span><span class="chip ${EXT_CHIP[it.estado] || ''}">${esc(extStateName(it.estado))}</span></div>
    <h2>${esc(it.title)}</h2>
    <div class="row">${extLink(it.url, 'Continuar estudiando', 'primary')}<button class="btn small fstart" type="button">Modo enfoque 25 min</button></div>
    ${guide ? `<p class="note">La academia tiene una guía de estudio de este curso con conceptos, código y mini examen: <a href="#cursos" class="guide">Cursos → ${esc(guide.name)}</a></p>` : ''}
    ${it.titleFromLink ? '<p class="note">El título se tomó del enlace. Escríbelo tal como aparece en la plataforma.</p>' : ''}
    <section class="panel"><h3>Datos del curso</h3><div class="ext-form">
      <div class="field wide"><label for="f-title">Título</label><input id="f-title" maxlength="300" value="${esc(it.title)}"></div>
      <div class="field wide"><label for="f-url">Enlace original (el que abre "Continuar estudiando")</label><input id="f-url" type="url" maxlength="2048" value="${esc(it.url)}" placeholder="https://…"></div>
      <div class="field"><label for="f-inst">Institución o instructor</label><input id="f-inst" maxlength="120" value="${esc(it.inst)}"></div>
      ${it.prov === 'otra' ? `<div class="field"><label for="f-pn">Plataforma</label><input id="f-pn" maxlength="60" value="${esc(it.provName)}" placeholder="LinkedIn Learning, edX…"></div>` : ''}
      <div class="field"><label for="f-prog">Programa o especialización</label><select id="f-prog">${progOpts}</select></div>
      <div class="field"><label for="f-ord">Número dentro del programa</label><input id="f-ord" type="number" min="0" max="999" value="${it.orden == null ? '' : it.orden}"></div>
      <div class="field"><label for="f-est">Estado</label><select id="f-est">${EXT_STATES.map(([k, t]) => `<option value="${k}" ${it.estado === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="f-pct">Porcentaje (0 a 100, vacío si no lo sabes)</label><input id="f-pct" type="number" min="0" max="100" value="${it.pct == null ? '' : it.pct}"><span class="muted ext-sm">${esc(extPctLabel(it))}${it.pctFuente ? ' · fuente: ' + esc(it.pctFuente) : ''}</span></div>
      <div class="field"><label for="f-ini">Fecha de inicio</label><input id="f-ini" type="date" value="${esc(it.inicio)}"></div>
      <div class="field"><label for="f-fin">Fecha meta</label><input id="f-fin" type="date" value="${esc(it.fin)}"></div>
      <div class="field"><label for="f-hrs">Horas dedicadas</label><input id="f-hrs" type="number" min="0" max="10000" step="0.25" value="${it.horas || 0}"></div>
      <div class="field"><label for="f-meta">Objetivo semanal (horas)</label><input id="f-meta" type="number" min="0" max="80" step="0.5" value="${it.meta || 0}"></div>
      <div class="field"><label for="f-niv">Nivel (opcional)</label><input id="f-niv" maxlength="40" value="${esc(it.nivel)}" placeholder="Principiante, intermedio…"></div>
      <div class="field"><label for="f-tem">Temas (separados por coma)</label><input id="f-tem" value="${esc((it.temas || []).join(', '))}"></div>
      <div class="field"><label for="f-tag">Etiquetas (separadas por coma)</label><input id="f-tag" value="${esc((it.tags || []).join(', '))}" placeholder="soc, sql, entrevista"></div>
      <div class="field"><label class="ext-check"><input id="f-cert" type="checkbox" ${it.cert && it.cert.tiene ? 'checked' : ''}> Tengo el certificado</label><input id="f-certu" type="url" maxlength="2048" value="${esc(it.cert && it.cert.url || '')}" placeholder="Enlace de verificación (opcional)"></div>
      <div class="field wide"><label for="f-not">Notas personales (máximo 4000 caracteres)</label><textarea id="f-not" rows="6" maxlength="4000">${esc(it.notas)}</textarea></div>
    </div><div class="row"><button class="btn primary save" type="button">Guardar cambios</button><span class="msg-ext muted" role="status"></span></div></section>
    <section class="panel"><h3>Registrar estudio</h3><p class="muted">Suma minutos a tus horas y a tu calendario. Úsalo cuando estudies sin el modo enfoque.</p>
      <div class="row">${[15, 30, 45, 60].map(m => `<button class="btn small" data-m="${m}" type="button">+${m} min</button>`).join('')}<input class="logm" type="number" min="1" max="600" placeholder="min" style="width:90px" aria-label="Minutos"><button class="btn small logb" type="button">Registrar</button></div>
      ${it.inicio ? `<p class="muted ext-sm">Empezaste el ${esc(it.inicio)} · ${it.horas || 0} h en total.</p>` : ''}</section>
    <section class="panel"><h3>Quitar de mis cursos</h3><p class="muted">Solo borra tu registro de este curso (estado, notas y avance). No afecta a la plataforma, al programa ni a la academia. El tiempo que ya registraste sigue contando en tu calendario.</p><div class="row"><button class="btn small del" type="button">Quitar de mis cursos</button></div></section>
  </article>`);
  stage.appendChild(box); window.scrollTo(0, 0);
  $('.back', box).addEventListener('click', close);
  const g = $('.guide', box); if (g) g.addEventListener('click', () => { ST.sub.curso = guide.id; saveStore(); });
  $('.fstart', box).addEventListener('click', () => focusStart(key, 25));
  $('.save', box).addEventListener('click', () => {
    const v = id => $('#' + id, box) ? $('#' + id, box).value : undefined;
    const patch = { title: v('f-title'), url: v('f-url'), inst: v('f-inst'), prog: v('f-prog'), orden: v('f-ord'), estado: v('f-est'), pct: v('f-pct'), inicio: v('f-ini'), fin: v('f-fin'), horas: v('f-hrs'), meta: v('f-meta'), nivel: v('f-niv'), temas: v('f-tem'), tags: v('f-tag'), notas: v('f-not'), cert: { tiene: $('#f-cert', box).checked, url: v('f-certu') } };
    if (it.prov === 'otra') patch.provName = v('f-pn');
    const r = extUpdate(E, key, patch);
    const m = $('.msg-ext', box);
    if (r.err) { m.textContent = r.err; m.style.color = 'var(--bad)'; return; }
    saveStore(); toast('Curso guardado'); m.textContent = 'Guardado.'; m.style.color = 'var(--ok)';
    if (patch.estado === 'hecho' && it.estado !== 'hecho') addXP(25, 'Curso externo completado');
    extDetail(stage, hide, E, key, back);
  });
  const log = m => { const r = extLog(E, key, m); if (r.err) return toast(r.err); saveStore(); toast(`+${m} min registrados en ${it.title}`); extDetail(stage, hide, E, key, back); };
  $$('[data-m]', box).forEach(b => b.addEventListener('click', () => log(+b.dataset.m)));
  $('.logb', box).addEventListener('click', () => log(+$('.logm', box).value));
  twoTap($('.del', box), 'Quitar de mis cursos', () => { extRemove(E, key); saveStore(); toast('Curso quitado de tu lista'); close(); });
}

function extProgramEditor(stage, hide, E, pkey, back) {
  const p = E.programs[pkey]; if (!p) return;
  hide.forEach(x => x.hidden = true); stage.hidden = false; stage.innerHTML = '';
  const close = () => { stage.hidden = true; stage.innerHTML = ''; hide.forEach(x => x.hidden = false); back(); };
  const box = h(`<section class="panel"><div class="row"><button class="btn small back" type="button">← Volver</button><span class="chip plasma">Programa</span></div>
    <div class="ext-form">
      <div class="field wide"><label for="p-t">Nombre</label><input id="p-t" maxlength="300" value="${esc(p.title)}"></div>
      <div class="field wide"><label for="p-u">Enlace del programa</label><input id="p-u" type="url" value="${esc(p.url)}" placeholder="https://…"></div>
      <div class="field"><label for="p-i">Institución</label><input id="p-i" maxlength="120" value="${esc(p.inst)}"></div>
      <div class="field"><label for="p-n">Número de cursos del programa (si lo sabes)</label><input id="p-n" type="number" min="0" max="200" value="${p.total || ''}"></div>
      <div class="field wide"><label for="p-no">Nota</label><textarea id="p-no" rows="3" maxlength="600">${esc(p.nota)}</textarea></div>
    </div>
    <div class="row"><button class="btn primary save" type="button">Guardar</button><button class="btn small del" type="button">Quitar programa</button><span class="muted ext-sm">Quitar el programa no borra sus cursos: solo quedan "Sin programa".</span></div></section>`);
  stage.appendChild(box);
  $('.back', box).addEventListener('click', close);
  $('.save', box).addEventListener('click', () => {
    const t = extClip($('#p-t', box).value, 300); if (!t) return toast('El nombre no puede quedar vacío');
    const u = extParseUrl($('#p-u', box).value); if (!u.ok) return toast(u.msg);
    const n = +$('#p-n', box).value;
    Object.assign(p, { title: t, url: u.url, inst: extClip($('#p-i', box).value, 120), total: n > 0 ? Math.min(200, Math.round(n)) : null, nota: String($('#p-no', box).value).slice(0, 600) });
    saveStore(); toast('Programa guardado'); close();
  });
  twoTap($('.del', box), 'Quitar programa', () => { extRemoveProgram(E, pkey); saveStore(); toast('Programa quitado; sus cursos siguen en tu lista'); close(); });
}

/* ---------- cursos de interés (recomendaciones, no compras) ---------- */
function extInterest(host, E) {
  const xs = Object.values(E.interest).sort((a, b) => (b.creado || '').localeCompare(a.creado || '') || a.title.localeCompare(b.title));
  host.appendChild(h(`<p class="note">Aquí van cursos que te recomendaron o que viste en un catálogo. Estar aquí <b>no</b> significa que los compraste o que estás inscrito: no cuentan en tus estadísticas. Cuando empieces uno, muévelo a Mis cursos.</p>`));
  const grid = h('<div class="grid wide"></div>'); host.appendChild(grid);
  if (!xs.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Sin cursos de interés. Puedes agregarlos en "Agregar o importar" eligiendo el destino "Cursos de interés".<br><br><a class="btn small primary" href="#formacion/agregar">Agregar</a></div>'; return; }
  grid.innerHTML = xs.map(i => `<article class="tile"><div class="row" style="justify-content:space-between"><span class="chip">${esc(extProvName(i))}</span><span class="chip plasma">De interés</span></div>
    <h3>${esc(i.title)}</h3>${i.inst ? `<p class="ext-sm">${esc(i.inst)}</p>` : ''}${i.notas ? `<p class="muted ext-sm">${esc(i.notas)}</p>` : ''}
    <div class="row">${extLink(i.url, 'Ver en la plataforma')}<select data-st="${esc(i.key)}" aria-label="Estado al moverlo"><option value="sin">Sin empezar</option><option value="progreso">En progreso</option><option value="confirmar">Por confirmar</option></select><button class="btn small" data-mv="${esc(i.key)}" type="button">Mover a Mis cursos</button><button class="btn small" data-rm="${esc(i.key)}" type="button">Quitar</button></div></article>`).join('');
  $$('[data-mv]', grid).forEach(b => b.addEventListener('click', () => {
    const st = $(`[data-st="${CSS.escape(b.dataset.mv)}"]`, grid).value;
    const r = extPromote(E, b.dataset.mv, st); if (r.err) return toast(r.err);
    saveStore(); toast('Movido a Mis cursos'); ST.sub.extOpen = r.key; go('formacion');
  }));
  $$('[data-rm]', grid).forEach(b => twoTap(b, 'Quitar', () => { extRemove(E, b.dataset.rm, 'interest'); saveStore(); toast('Quitado de tu lista de interés'); go('formacion/interes'); }));
}

/* ---------- progreso y estadísticas ---------- */
function extProgress(host, E) {
  const st = extStats(E);
  const kpi = [['Cursos', st.total], ['Completados', st.hecho], ['En progreso', st.progreso], ['Pendientes', st.pendientes], ['Horas totales', st.horas], ['Certificados', st.certs]];
  host.appendChild(h(`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">${kpi.map(([t, v]) => `<div class="tile"><div class="stat"><b>${v}</b><span>${t}</span></div></div>`).join('')}</div>`));
  if (!st.total) host.appendChild(h('<div class="empty">Cuando agregues cursos, aquí verás tu avance real por plataforma y programa. <a href="#formacion/agregar">Agregar o importar</a></div>'));
  host.appendChild(h(`<p class="muted ext-sm">Pendientes = todo lo que no está completado (${st.sin} sin empezar, ${st.confirmar} por confirmar, ${st.pausa} pausados, ${st.progreso} en progreso). Avance promedio: ${st.pctAvg == null ? 'sin datos' : st.pctAvg + '%'}, calculado solo con los ${st.pctN} curso${st.pctN === 1 ? '' : 's'} que tienen porcentaje registrado.</p>`));

  // objetivo semanal + modo enfoque
  const goalH = +E.goal || 0;
  const gp = h(`<section class="panel hero"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Objetivo de la semana</span><h2>${Math.round(st.weekMin / 6) / 10} h estudiadas${goalH ? ` de ${goalH} h` : ''}</h2></div>
    <div class="row"><label class="muted" for="goal">Mi objetivo (h/semana)</label><input id="goal" type="number" min="0" max="80" step="0.5" value="${goalH || ''}" style="width:90px"><button class="btn small sg" type="button">Guardar</button></div></div>
    ${goalH ? `<div class="bar" role="img" aria-label="${pct(st.weekMin, st.goalMin)}% del objetivo"><i style="width:${Math.min(100, pct(st.weekMin, st.goalMin))}%"></i></div>` : '<p class="muted">Ponte un objetivo de horas por semana y mídelo con el modo enfoque.</p>'}
    <div class="row"><label class="muted" for="fsel">Modo enfoque:</label><select id="fsel"><option value="">Estudio en la academia</option>${Object.values(E.items).filter(i => i.estado !== 'hecho').map(i => `<option value="${esc(i.key)}">${esc(i.title)}</option>`).join('')}</select>${[25, 50].map(m => `<button class="btn small primary" data-f="${m}" type="button">${m} min</button>`).join('')}</div>
    <p class="muted ext-sm">El tiempo cuenta solo si terminas la sesión o la detienes tú; se guarda en tu calendario y en las horas del curso.</p></section>`);
  host.appendChild(gp);
  $('.sg', gp).addEventListener('click', () => { const n = +$('#goal', gp).value; if (!(n >= 0 && n <= 80)) return toast('Escribe un número de 0 a 80'); E.goal = n; saveStore(); toast('Objetivo guardado'); go('formacion/progreso'); });
  $$('[data-f]', gp).forEach(b => b.addEventListener('click', () => focusStart($('#fsel', gp).value, +b.dataset.f)));

  // calendario de estudio
  const lvl = m => m <= 0 ? 0 : m < 15 ? 1 : m < 30 ? 2 : m < 60 ? 3 : 4;
  const dn = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  host.appendChild(h(`<section class="panel"><h3>Calendario de estudio (12 semanas)</h3>
    <div class="heat-wrap"><div class="heat-days">${dn.map(d => `<span>${d}</span>`).join('')}</div><div class="heat" role="img" aria-label="${Math.round(st.totalSesMin / 6) / 10} horas registradas en 12 semanas">${st.cal.map(col => `<div class="heat-col">${col.map(c => `<i class="l${c.future ? 'x' : lvl(c.m)}" title="${c.d}: ${c.m} min"></i>`).join('')}</div>`).join('')}</div></div>
    <div class="row muted ext-sm"><span>Menos</span>${[0, 1, 2, 3, 4].map(l => `<i class="heat-key l${l}"></i>`).join('')}<span>Más</span><span>· Solo cuenta el tiempo que registras (botones o modo enfoque).</span></div>
    ${st.upcoming.length || st.overdue.length ? `<h3>Fechas meta</h3><ul class="list">${st.overdue.map(i => `<li><span class="chip bad">Vencida ${esc(i.fin)}</span> ${esc(i.title)}</li>`).join('')}${st.upcoming.map(i => `<li><span class="chip">${esc(i.fin)}</span> ${esc(i.title)}</li>`).join('')}</ul>` : '<p class="muted ext-sm">Sin fechas meta. Ponlas en la ficha de cada curso.</p>'}</section>`));

  // avance por plataforma y por programa
  if (st.byProv.length) host.appendChild(h(`<section class="panel"><h3>Avance por plataforma</h3><div class="tbl-wrap"><table class="addr"><tr><th>Plataforma</th><th>Cursos</th><th>Completados</th><th>Horas</th><th>Avance promedio</th></tr>${st.byProv.map(p => `<tr><td>${esc(p.name)}</td><td class="mono">${p.n}</td><td class="mono">${p.hecho} (${pct(p.hecho, p.n)}%)</td><td class="mono">${p.horas}</td><td class="mono">${p.pctAvg == null ? '—' : p.pctAvg + '%'} <span class="muted">(${p.pctN} con %)</span></td></tr>`).join('')}</table></div></section>`));
  if (st.byProgram.length) host.appendChild(h(`<section class="panel"><h3>Avance por programa o especialización</h3>${st.byProgram.map(p => `<div><div class="row" style="justify-content:space-between"><span>${esc(p.title)}</span><span class="mono">${p.total ? `${p.hecho}/${p.total}` : 'temario por confirmar'}</span></div>${p.total ? `<div class="bar"><i style="width:${pct(p.hecho, p.total)}%"></i></div>` : ''}${p.next ? `<span class="muted ext-sm">Sigue: ${esc(p.next.title)}</span>` : ''}</div>`).join('')}</section>`));

  // qué estudiar ahora y rutas de la academia
  const sug = extSuggest(E, st);
  const sp = h(`<section class="panel"><h3>¿Qué estudio ahora?</h3><p class="muted ext-sm">Sugerencias calculadas solo con tus registros (sin inteligencia artificial).</p>${sug.length ? `<ul class="list">${sug.map((s, i) => `<li><b>${esc(s.t)}</b> — ${esc(s.d)} ${s.key ? `<button class="linkish" data-sk="${esc(s.key)}" type="button">Abrir ficha</button>` : ''}${s.filter ? `<button class="linkish" data-sf="${s.filter}" type="button">Ver cuáles</button>` : ''}</li>`).join('')}</ul>` : '<p class="muted">Sin sugerencias por ahora: agrega cursos o registra tu avance.</p>'}
    <h3>Practica en la academia lo que estudias fuera</h3><div class="grid">${extRoutes(E).map(r => `<div class="tile"><h3>${esc(r.t)}</h3><p class="ext-sm">${r.mine.length ? `Tus cursos relacionados: ${r.mine.slice(0, 3).map(i => esc(i.title)).join(', ')}${r.mine.length > 3 ? '…' : ''}` : 'Todavía no tienes cursos externos de este tema.'}</p><div class="row">${r.links.map(([k, t]) => `<a class="btn small" href="#${k}">${esc(t)}</a>`).join('')}</div></div>`).join('')}</div></section>`);
  host.appendChild(sp);
  $$('[data-sk]', sp).forEach(b => b.addEventListener('click', () => { ST.sub.extOpen = b.dataset.sk; saveStore(); go('formacion'); }));
  $$('[data-sf]', sp).forEach(b => b.addEventListener('click', () => { ST.sub.extF = { q: '', estado: b.dataset.sf, prog: '', orden: 'reciente' }; saveStore(); go('formacion'); }));

  if ((E.imports || []).length) host.appendChild(h(`<section class="panel"><h3>Historial de importaciones</h3><div class="tbl-wrap"><table class="addr"><tr><th>Fecha</th><th>Origen</th><th>Agregados</th><th>Omitidos (ya existían)</th><th>Posibles duplicados</th><th>Inválidos</th><th>Cursos antes → después</th></tr>${E.imports.map(l => `<tr><td class="mono">${esc(fmtDate(l.at))}</td><td>${esc(l.origen)}</td><td class="mono">${l.added}${l.programs ? ` + ${l.programs} prog.` : ''}</td><td class="mono">${l.skipped}</td><td class="mono">${l.possible}</td><td class="mono">${l.invalid}</td><td class="mono">${l.before.items} → ${l.after.items}</td></tr>`).join('')}</table></div></section>`));
}

/* ---------- agregar a mano, importar y respaldar ---------- */
function extAddImport(host, E) {
  const progOpts = Object.values(E.programs).map(p => `<option value="${esc(p.key)}">${esc(p.title)}</option>`).join('');
  const add = h(`<section class="panel"><h2>Agregar un curso</h2><div class="ext-form">
      <div class="field"><label for="a-dest">Guardar en</label><select id="a-dest"><option value="items">Mis cursos</option><option value="interest">Cursos de interés (no lo he comprado)</option></select></div>
      <div class="field"><label for="a-prov">Plataforma</label><select id="a-prov"><option value="">Detectar por el enlace</option><option value="coursera">Coursera</option><option value="udemy">Udemy</option><option value="otra">Otra</option></select></div>
      <div class="field wide"><label for="a-title">Título (como aparece en la plataforma)</label><input id="a-title" maxlength="300"></div>
      <div class="field wide"><label for="a-url">Enlace original (se conserva tal cual, incluso /learn/…)</label><input id="a-url" type="url" maxlength="2048" placeholder="https://www.udemy.com/course/…"></div>
      <div class="field"><label for="a-inst">Institución o instructor</label><input id="a-inst" maxlength="120"></div>
      <div class="field"><label for="a-pn">Nombre de la plataforma (si es "Otra")</label><input id="a-pn" maxlength="60"></div>
      <div class="field"><label for="a-prog">Programa</label><select id="a-prog"><option value="">Sin programa</option>${progOpts}<option value="__new">+ Nuevo programa…</option></select></div>
      <div class="field"><label for="a-pnew">Nombre del programa nuevo</label><input id="a-pnew" maxlength="300" disabled></div>
      <div class="field"><label for="a-est">Estado</label><select id="a-est">${EXT_STATES.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
      <div class="field"><label for="a-pct">Porcentaje (opcional)</label><input id="a-pct" type="number" min="0" max="100"></div>
    </div><div class="row"><button class="btn primary go-add" type="button">Agregar</button><span class="msg-add muted" role="status"></span></div><div class="add-dupe"></div></section>`);
  host.appendChild(add);
  $('#a-prog', add).addEventListener('change', e => { $('#a-pnew', add).disabled = e.target.value !== '__new'; });
  const doAdd = force => {
    const m = $('.msg-add', add); m.style.color = 'var(--bad)';
    const raw = { title: $('#a-title', add).value, url: $('#a-url', add).value, prov: $('#a-prov', add).value, inst: $('#a-inst', add).value, provName: $('#a-pn', add).value, estado: $('#a-est', add).value, pct: $('#a-pct', add).value, force };
    let prog = $('#a-prog', add).value;
    if (prog === '__new') {
      const t = $('#a-pnew', add).value.trim(); if (!t) { m.textContent = 'Escribe el nombre del programa nuevo.'; return; }
      const p0 = extParseUrl(raw.url); const pv = raw.prov || (p0.ok && extProviderOf(p0.u)) || 'otra';
      const ex = extFindProgram(E, pv, t);
      if (ex) prog = ex.key; else { const mp = extMakeProgram({ title: t, prov: pv }); if (mp.err) { m.textContent = mp.err; return; } E.programs[mp.prog.key] = mp.prog; prog = mp.prog.key; }
    }
    raw.prog = prog;
    const dest = $('#a-dest', add).value;
    const r = extAdd(E, raw, dest);
    if (r.err) { m.textContent = r.err; if (r.key) { m.innerHTML = `${esc(r.err)} <button class="linkish op" type="button">Abrir su ficha</button>`; const b = $('.op', m); if (b) b.addEventListener('click', () => { ST.sub.extOpen = r.key; go('formacion'); }); } return; }
    if (r.possible) {
      $('.add-dupe', add).innerHTML = `<div class="fb"><h4>¿Es el mismo curso?</h4><div>Ya tienes "${esc(r.possible.title)}" en ${esc(extProvName(r.possible))} con otro enlace. Si son cursos distintos, agrégalo de todos modos.</div><div class="row"><button class="btn small primary fz" type="button">Agregar de todos modos</button></div></div>`;
      $('.fz', add).addEventListener('click', () => { $('.add-dupe', add).innerHTML = ''; doAdd(true); }); return;
    }
    saveStore(); toast(dest === 'interest' ? 'Agregado a Cursos de interés' : 'Curso agregado');
    if (dest === 'interest') go('formacion/interes'); else { ST.sub.extOpen = r.key; go('formacion'); }
  };
  $('.go-add', add).addEventListener('click', () => doAdd(false));

  // importar
  const imp = h(`<section class="panel"><h2>Importar tu lista</h2>
    <p class="muted">Acepta tu CSV (por ejemplo el inventario de Coursera o tus enlaces de Udemy), un JSON de respaldo de esta página, o una lista de enlaces (uno por renglón). Primero ves una vista previa; nada se guarda hasta que confirmas. Importar el mismo archivo dos veces no duplica nada y nunca sobrescribe lo que ya editaste.</p>
    <div class="row"><input type="file" class="imp-file" accept=".csv,.json,.txt,text/csv,application/json,text/plain" aria-label="Archivo CSV o JSON"></div>
    <div class="row"><label class="muted" for="imp-dest">Si el archivo no lo dice, guardar en:</label><select id="imp-dest"><option value="items">Mis cursos</option><option value="interest">Cursos de interés</option></select><label class="muted" for="imp-prov">Plataforma de las filas sin enlace:</label><select id="imp-prov"><option value="">Detectar</option><option value="coursera">Coursera</option><option value="udemy">Udemy</option><option value="otra">Otra</option></select></div>
    <div class="field"><label for="imp-ta">…o pega aquí el contenido</label><textarea id="imp-ta" rows="6" spellcheck="false" placeholder="Programa,Orden,Curso,Estado,Porcentaje,Fecha,Fuente,URL&#10;https://www.udemy.com/course/…"></textarea></div>
    <div class="row"><button class="btn primary prev" type="button">Revisar antes de importar</button></div><div class="imp-out"></div>
    <details class="acc"><summary><span>Columnas que reconoce el CSV</span></summary><div class="acc-body"><ul class="list">
      <li><b>Curso</b> (titulo, curso, nombre, title) y/o <b>URL</b> (url, enlace, link).</li><li><b>Programa</b> (programa, especialización, certificado): agrupa los cursos. Una fila con solo programa crea el programa sin cursos.</li>
      <li><b>Estado</b>: completado, en progreso, pausado, sin empezar; si no se entiende queda "Por confirmar".</li><li><b>Porcentaje</b>, <b>Fecha</b> y <b>Fuente</b>: se guardan como dato observado con su fecha (no como sincronización).</li>
      <li>También: orden, proveedor, institución, notas, nivel, temas, etiquetas, total y tipo (si dice "interés" va a Cursos de interés).</li><li>Se aceptan comas o punto y coma como separador.</li></ul></div></details></section>`);
  host.appendChild(imp);
  let plan = null, srcName = '';
  $('.imp-file', imp).addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 1024 * 1024) { toast('El archivo pesa más de 1 MB'); e.target.value = ''; return; }
    const rd = new FileReader(); rd.onload = () => { $('#imp-ta', imp).value = String(rd.result); srcName = f.name; preview(); }; rd.readAsText(f);
  });
  const out = $('.imp-out', imp);
  const LBL = { nuevo: ['ok', 'Nuevo'], existe: ['', 'Ya existe (se omite)'], posible: ['warn', 'Posible duplicado'], invalido: ['bad', 'Inválido'], repetido: ['bad', 'Repetido en el archivo'] };
  function preview() {
    const text = $('#imp-ta', imp).value;
    if (!text.trim()) return toast('Elige un archivo o pega el contenido');
    plan = extPlan(E, text, { dest: $('#imp-dest', imp).value, prov: $('#imp-prov', imp).value, name: srcName });
    if (plan.err) { out.innerHTML = `<div class="fb bad"><h4>No se pudo leer</h4><div>${esc(plan.err)}</div></div>`; plan = null; return; }
    const n = s => plan.count(s);
    const newCourses = plan.rows.filter(r => r.kind === 'curso' && r.status === 'nuevo').length, newProgs = plan.rows.filter(r => r.kind === 'programa' && r.status === 'nuevo').length;
    out.innerHTML = `<div class="panel" style="padding:12px"><div class="row"><span class="chip ok">${n('nuevo')} nuevos</span><span class="chip">${n('existe')} ya existen</span><span class="chip warn">${n('posible')} posibles duplicados</span><span class="chip bad">${n('invalido') + n('repetido')} inválidos</span><span class="muted ext-sm">Formato: ${esc(plan.kind)}</span></div>
      ${plan.unused && plan.unused.length ? `<p class="muted ext-sm">Columnas que no se usaron: ${plan.unused.map(esc).join(', ')}</p>` : ''}
      <div class="tbl-wrap"><table class="addr"><tr><th>Tipo</th><th>Título</th><th>Destino</th><th>Resultado</th></tr>${plan.rows.map(r => `<tr><td>${r.kind === 'programa' ? 'Programa' : 'Curso'}</td><td>${esc(r.title)}${r.data && r.data.titleFromLink ? ' <span class="chip warn">del enlace</span>' : ''}${r.data && r.data.pct != null ? ` <span class="muted">(${r.data.pct}%)</span>` : ''}</td><td>${r.kind === 'programa' ? '—' : r.dest === 'interest' ? 'Interés' : 'Mis cursos'}</td><td><span class="chip ${LBL[r.status][0]}">${LBL[r.status][1]}</span>${r.reason ? ` <span class="muted">${esc(r.reason)}</span>` : ''}${r.note ? ` <span class="muted">${esc(r.note)}</span>` : ''}${r.match && r.status === 'posible' ? ` <span class="muted">parecido a "${esc(r.match.title)}"</span>` : ''}</td></tr>`).join('')}</table></div>
      <div class="row"><button class="btn primary apply" type="button" ${newCourses + newProgs ? '' : 'disabled'}>Importar ${newCourses} curso${newCourses === 1 ? '' : 's'}${newProgs ? ` y ${newProgs} programa${newProgs === 1 ? '' : 's'}` : ''}</button><span class="muted ext-sm">Los posibles duplicados no se agregan solos: después de importar puedes agregarlos uno por uno.</span></div></div>`;
    const ap = $('.apply', out); if (ap) ap.addEventListener('click', apply);
  }
  function apply() {
    if (!plan) return;
    const res = extApply(E, plan, { name: srcName || (plan.kind === 'enlaces' ? 'lista de enlaces' : plan.kind === 'json' ? 'respaldo JSON' : 'CSV pegado') });
    saveStore(); toast(`Importados ${res.added.length} curso(s)`);
    report(res);
  }
  function report(res) {
    out.innerHTML = `<div class="fb good"><h4>Importación lista</h4>
      <div><span class="lbl">Antes</span>${res.before.items} cursos · ${res.before.interest} de interés · ${res.before.programs} programas</div>
      <div><span class="lbl">Después</span>${res.after.items} cursos · ${res.after.interest} de interés · ${res.after.programs} programas</div>
      <div><span class="lbl">Resultado</span>${res.added.length} agregados, ${res.programs} programas nuevos, ${res.skipped.length} omitidos porque ya existían, ${res.possible.length} posibles duplicados, ${res.invalid.length} inválidos.</div>
      ${res.possible.length ? `<div><span class="lbl">Posibles duplicados</span><ul class="list">${res.possible.map((r, i) => `<li>${esc(r.title)} <span class="muted">(parecido a "${esc(r.match.title)}")</span> <button class="btn small" data-force="${i}" type="button">Agregar de todos modos</button></li>`).join('')}</ul></div>` : ''}
      ${res.invalid.length ? `<div><span class="lbl">Inválidos</span><ul class="list">${res.invalid.map(r => `<li>${esc(r.title)}: ${esc(r.reason || '')}</li>`).join('')}</ul></div>` : ''}
      <div class="row"><a class="btn small primary" href="#formacion">Ver mis cursos</a><a class="btn small" href="#formacion/progreso">Ver estadísticas</a></div></div>`;
    $$('[data-force]', out).forEach(b => b.addEventListener('click', () => {
      const r = res.possible[+b.dataset.force];
      const one = { rows: [Object.assign({}, r, { status: 'nuevo' })], kind: 'manual' };
      const x = extApply(E, one, { name: 'duplicado confirmado' }); saveStore();
      b.replaceWith(h(`<span class="chip ${x.added.length ? 'ok' : ''}">${x.added.length ? 'Agregado' : 'Ya estaba'}</span>`));
    }));
  }
  $('.prev', imp).addEventListener('click', () => { srcName = srcName || ''; preview(); });

  // respaldo
  const bk = h(`<section class="panel"><h2>Respaldo</h2><p class="muted">Descarga toda tu formación externa en un archivo JSON. Lo puedes volver a importar aquí o en otro dispositivo sin duplicar nada. Recuerda que también viaja con la sincronización por código (Progreso).</p>
    <div class="row"><button class="btn small exp" type="button">Descargar respaldo (JSON)</button><button class="btn small csv" type="button">Descargar como CSV</button></div></section>`);
  host.appendChild(bk);
  $('.exp', bk).addEventListener('click', () => extDownload(`mi-formacion-${extDay()}.json`, JSON.stringify(extExport(E), null, 2)));
  $('.csv', bk).addEventListener('click', () => {
    const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [['Proveedor', 'Programa', 'Orden', 'Curso', 'Estado', 'Porcentaje', 'Horas', 'Inicio', 'Fecha meta', 'Certificado', 'Etiquetas', 'URL']].concat(Object.values(E.items).map(i => [extProvName(i), (E.programs[i.prog] || {}).title || '', i.orden == null ? '' : i.orden, i.title, extStateName(i.estado), i.pct == null ? '' : i.pct, i.horas, i.inicio, i.fin, i.cert && i.cert.tiene ? 'sí' : '', (i.tags || []).join(', '), i.url]));
    extDownload(`mi-formacion-${extDay()}.csv`, '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv');
  });
}

/* ===== Modo enfoque: temporizador que registra tiempo REAL de estudio ===== */
const FOCUS_KEY = 'cyberquest-focus';
let FOCUS = null, focusTimer = null;
function focusSave() { try { if (FOCUS) localStorage.setItem(FOCUS_KEY, JSON.stringify(FOCUS)); else localStorage.removeItem(FOCUS_KEY); } catch (e) { } }
function focusTitle() { if (!FOCUS) return ''; if (!FOCUS.key) return 'Estudio en la academia'; const it = extS().items[FOCUS.key]; return it ? it.title : 'Curso'; }
function focusLeft() { return FOCUS ? (FOCUS.paused ? FOCUS.left : Math.max(0, FOCUS.end - Date.now())) : 0; }
function focusStart(key, mins) {
  if (FOCUS) { toast('Ya tienes una sesión de enfoque abierta'); focusPill(); return; }
  FOCUS = { key: key || '', mins, start: Date.now(), end: Date.now() + mins * 60000, paused: false, left: 0 };
  focusSave(); focusRun(); toast(`Modo enfoque: ${mins} minutos. Concéntrate en una sola cosa.`);
}
function focusRun() { clearInterval(focusTimer); focusTimer = setInterval(focusTick, 1000); focusTick(); }
function focusTick() {
  if (!FOCUS) { clearInterval(focusTimer); focusPill(); return; }
  if (!FOCUS.paused && focusLeft() <= 0) { clearInterval(focusTimer); focusChime(); FOCUS.done = true; focusSave(); }
  focusPill();
}
function focusElapsedMin() { if (!FOCUS) return 0; const total = FOCUS.mins * 60000; return Math.max(0, Math.round((total - focusLeft()) / 60000)); }
function focusFinish(record) {
  if (!FOCUS) return;
  const m = FOCUS.done ? FOCUS.mins : focusElapsedMin();
  const key = FOCUS.key, title = focusTitle();
  FOCUS = null; focusSave(); clearInterval(focusTimer); focusPill();
  if (!record) return toast('Sesión descartada: no se registró tiempo');
  if (m < 1) return toast('La sesión duró menos de un minuto: no se registró');
  const E = extS(), r = extLog(E, key && E.items[key] ? key : '', m);
  if (r.err) return toast(r.err);
  saveStore(); addXP(Math.min(60, m), 'Modo enfoque: ' + title);
  toast(`${m} min registrados${key ? ' en ' + title : ''}. ¡Bien hecho!`);
  if (/^#formacion/.test(location.hash)) route();
}
function focusPill() {
  let el = document.getElementById('focusPill');
  if (!FOCUS) { if (el) el.remove(); document.title = 'CyberQuest Academy'; return; }
  if (!el) { el = h('<div id="focusPill" class="focus-pill" role="region" aria-label="Modo enfoque"></div>'); document.body.appendChild(el); }
  const left = focusLeft(), mm = String(Math.floor(left / 60000)).padStart(2, '0'), ss = String(Math.floor(left / 1000) % 60).padStart(2, '0');
  const sig = FOCUS.done ? 'done' : FOCUS.paused ? 'pause' : 'run';
  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig;
    el.innerHTML = FOCUS.done
      ? `<span class="fp-t">¡Sesión de ${FOCUS.mins} min terminada!</span><span class="fp-c">${esc(focusTitle())}</span><button class="btn small primary fp-rec" type="button">Registrar</button><button class="btn small fp-no" type="button">Descartar</button>`
      : `<span class="fp-time mono" aria-live="off"></span><span class="fp-c">${esc(focusTitle())}</span><button class="btn small fp-p" type="button">${FOCUS.paused ? 'Seguir' : 'Pausa'}</button><button class="btn small fp-stop" type="button" title="Termina antes y registra los minutos que llevas">Terminar</button><button class="btn small fp-no" type="button" title="Cancelar sin registrar">✕</button>`;
    const b = s => el.querySelector(s);
    if (b('.fp-rec')) b('.fp-rec').addEventListener('click', () => focusFinish(true));
    if (b('.fp-stop')) b('.fp-stop').addEventListener('click', () => focusFinish(true));
    if (b('.fp-no')) b('.fp-no').addEventListener('click', () => focusFinish(false));
    if (b('.fp-p')) b('.fp-p').addEventListener('click', () => { if (FOCUS.paused) { FOCUS.end = Date.now() + FOCUS.left; FOCUS.paused = false; } else { FOCUS.left = focusLeft(); FOCUS.paused = true; } focusSave(); el.dataset.sig = ''; focusPill(); });
  }
  const t = el.querySelector('.fp-time'); if (t) t.textContent = `⏱ ${mm}:${ss}`;
  document.title = FOCUS.done ? '✓ Sesión terminada · CyberQuest' : `${mm}:${ss} · Enfoque · CyberQuest`;
}
function focusChime() {
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const ctx = new A(), now = ctx.currentTime;
    [660, 880, 990].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.setValueAtTime(0.0001, now + i * 0.18); g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.18 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.5); o.connect(g); g.connect(ctx.destination); o.start(now + i * 0.18); o.stop(now + i * 0.18 + 0.55); });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) { }
}
/* al abrir la app: retomar la sesión o preguntar si se terminó mientras estaba cerrada */
(function focusResume() {
  try { FOCUS = JSON.parse(localStorage.getItem(FOCUS_KEY) || 'null'); } catch (e) { FOCUS = null; }
  if (!FOCUS || typeof FOCUS.end !== 'number') { FOCUS = null; return; }
  if (!FOCUS.paused && Date.now() >= FOCUS.end) FOCUS.done = true; // se terminó con la app cerrada: se pregunta antes de registrar
  const startUi = () => { if (FOCUS.done) focusPill(); else focusRun(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startUi); else startUi();
})();
