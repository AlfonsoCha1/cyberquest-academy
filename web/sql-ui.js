/* ===== Bases de datos: SQLite real en el navegador, consola, lecciones, retos y examen ===== */
let SQLP = null, CONSOLE_DB = null;
function sqlEngine() {
  if (SQLP) return SQLP;
  const art = !!(window.CQ_CONFIG && window.CQ_CONFIG.artifact);
  // En la web se usa la versión WebAssembly guardada en la app; en Claude, la versión JS del CDN.
  const src = art ? 'https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/sql-asm.js' : 'vendor/sql-wasm.js';
  SQLP = new Promise((res, rej) => {
    if (window.initSqlJs) return res();
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error('No se pudo cargar el motor de base de datos. Revisa tu conexión y recarga.'));
    document.head.appendChild(s);
  }).then(() => window.initSqlJs(art ? {} : { locateFile: f => 'vendor/' + f })).catch(e => { SQLP = null; throw e; });
  return SQLP;
}
function sqlFresh(SQL) { const db = new SQL.Database(); db.exec(SQL_DB_SQL); return db; }
const sqlState = () => (ST.sql = Object.assign({ les: {}, ret: {}, exam: null }, ST.sql || {}));

/* ---------- ejecutar (con comandos estilo psql y sqlite3) ---------- */
function sqlTables(db) { const r = db.exec("SELECT name AS tabla FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"); return r[0] || { columns: ['tabla'], values: [] }; }
function sqlMeta(db, line) {
  const t = line.trim().replace(/;$/, '');
  if (/^(\\dt\+?|\.tables)$/i.test(t)) return [sqlTables(db)];
  let m = /^(?:\\d\+?|\.schema)\s+"?([\w]+)"?$/i.exec(t);
  if (m) {
    const r = db.exec(`PRAGMA table_info(${m[1]})`);
    if (!r.length) return [{ msg: `No existe la tabla "${m[1]}". Escribe \\dt para ver las tablas.`, err: true }];
    return [{ columns: ['columna', 'tipo', 'no nulo', 'por defecto', 'llave primaria'], values: r[0].values.map(v => [v[1], v[2] || '(sin tipo)', v[3] ? 'sí' : 'no', v[4], v[5] ? 'sí' : '']) }];
  }
  if (/^\.schema$/i.test(t)) { const r = db.exec("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY name"); return [r[0] ? { columns: ['definición'], values: r[0].values } : { msg: 'Sin tablas.' }]; }
  if (/^\\l$/.test(t)) return [{ columns: ['base', 'motor', 'nota'], values: [['academia', 'SQLite dentro de tu navegador', 'Los comandos \\dt y \\d de PostgreSQL se traducen aquí']] }];
  if (/^\\du$/.test(t)) return [{ msg: 'SQLite no tiene usuarios ni roles: el permiso es el del archivo. En PostgreSQL \\du lista roles y sus atributos (Superuser, Create role…). Repasa la lección "PostgreSQL a fondo".' }];
  if (/^(\\q|\.quit|\.exit)$/i.test(t)) return [{ msg: 'En psql \\q sale y en sqlite3 .quit. Aquí no hace falta salir.' }];
  if (/^(\.headers|\.mode)\b/i.test(t)) return [{ msg: 'En esta consola los resultados siempre se muestran como tabla con encabezados.' }];
  if (/^[\\.]\w/.test(t)) return [{ msg: `Comando "${t}" no disponible aquí. Prueba \\dt, \\d tabla, .tables o .schema tabla.`, err: true }];
  return null;
}
const PG_HINTS = [
  [/\bILIKE\b/i, 'ILIKE es de PostgreSQL; en SQLite usa LIKE (ya ignora mayúsculas en letras sin acento).'],
  [/\bnow\s*\(\s*\)/i, "now() es de PostgreSQL; en SQLite usa datetime('now')."],
  [/::\s*\w+/, 'El cast con :: es de PostgreSQL; en SQLite usa CAST(valor AS tipo).'],
  [/\binterval\s*'/i, "interval es de PostgreSQL; en SQLite usa datetime('now', '-1 day')."],
  [/\bSERIAL\b/i, 'SERIAL es de PostgreSQL; en SQLite usa INTEGER PRIMARY KEY.'],
  [/\bTOP\s+\d+/i, 'TOP es de SQL Server; aquí usa LIMIT al final.'],
  [/\bSHOW\s+TABLES\b/i, 'SHOW TABLES es de MySQL; aquí usa \\dt o .tables.']
];
function sqlFriendly(msg, sql) {
  let out = msg, m;
  if ((m = /no such table: (\S+)/.exec(msg))) out = `No existe la tabla "${m[1]}". Escribe \\dt para ver las tablas que hay.`;
  else if ((m = /no such column: (\S+)/.exec(msg))) out = `No existe la columna "${m[1]}". Revisa el nombre con \\d tabla o el alias de la tabla.`;
  else if ((m = /near "([^"]*)": syntax error/.exec(msg))) out = `Error de sintaxis cerca de "${m[1]}". Revisa comas, comillas y el orden: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.`;
  else if (/incomplete input/.test(msg)) out = 'La consulta está incompleta: falta cerrar una comilla, un paréntesis o terminar la instrucción.';
  else if ((m = /UNIQUE constraint failed: (\S+)/.exec(msg))) out = `Ya existe una fila con ese valor en ${m[1]} (debe ser único).`;
  else if (/FOREIGN KEY constraint failed/.test(msg)) out = 'Llave foránea: el valor que usaste no existe en la tabla relacionada.';
  else if ((m = /NOT NULL constraint failed: (\S+)/.exec(msg))) out = `${m[1]} no puede quedar vacío (NOT NULL).`;
  else if ((m = /table (\S+) already exists/.exec(msg))) out = `La tabla ${m[1]} ya existe. Si quieres empezar de cero, usa "Reiniciar base".`;
  else if (/misuse of aggregate/.test(msg)) out = 'Usaste COUNT, SUM, etc. en un lugar donde no va (por ejemplo en WHERE). Para filtrar grupos usa HAVING.';
  const tips = PG_HINTS.filter(([re]) => re.test(sql)).map(([, t]) => t);
  return out + (tips.length ? ' ' + tips.join(' ') : '');
}
function sqlRun(db, text) {
  const outs = []; let buf = [];
  const flush = () => {
    const sql = buf.join('\n').trim(); buf = [];
    if (!sql) return;
    try {
      const res = db.exec(sql);
      if (res.length) res.forEach(r => outs.push(r));
      else outs.push({ msg: `Listo. Filas modificadas: ${db.getRowsModified()}.` });
    } catch (e) { outs.push({ msg: sqlFriendly(String(e.message || e), sql), err: true }); }
  };
  for (const line of String(text).split('\n')) {
    if (/^\s*[\\.]\w/.test(line)) { flush(); outs.push(...(sqlMeta(db, line) || [])); }
    else buf.push(line);
  }
  flush();
  return outs;
}

/* ---------- calificar ---------- */
const sqlCell = v => v === null ? 'NULL' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : String(v);
const sqlRows = r => r ? r.values.map(row => row.map(sqlCell)) : [];
function sqlCompare(got, exp, ordered) {
  if (!got.length && exp.length) return 'Tu consulta no devolvió filas. Revisa el WHERE.';
  if (got.length && exp.length && got[0].length !== exp[0].length) return `Se esperaban ${exp[0].length} columna(s) y devolviste ${got[0].length}. Pide solo las columnas que dice el reto.`;
  if (got.length !== exp.length) return `Se esperaban ${exp.length} fila(s) y devolviste ${got.length}. ${got.length > exp.length ? 'Te sobran filas: falta filtrar o quitar repetidos (DISTINCT).' : 'Te faltan filas: el filtro es demasiado estricto.'}`;
  const ka = got.map(r => JSON.stringify(r)), kb = exp.map(r => JSON.stringify(r));
  const sa = [...ka].sort(), sb = [...kb].sort();
  if (sa.some((x, i) => x !== sb[i])) return 'Mismo número de filas, pero los valores no coinciden. Revisa el filtro y las columnas que elegiste.';
  if (ordered && ka.some((x, i) => x !== kb[i])) return 'Las filas son correctas pero el orden no. Revisa el ORDER BY.';
  return null;
}
function sqlCheck(SQL, ch, userSql) {
  if (!userSql.trim()) return { ok: false, msg: 'Escribe tu consulta primero.' };
  const mine = sqlFresh(SQL), ref = sqlFresh(SQL);
  try {
    let got, exp, outs;
    if (ch.mode === 'state') {
      outs = sqlRun(mine, userSql);
      const err = outs.find(o => o.err); if (err) return { ok: false, msg: err.msg, outs };
      ref.exec(ch.sql);
      got = sqlRows(mine.exec(ch.verify)[0]); exp = sqlRows(ref.exec(ch.verify)[0]);
      outs = mine.exec(ch.verify);
    } else {
      outs = sqlRun(mine, userSql);
      const err = outs.find(o => o.err); if (err) return { ok: false, msg: err.msg, outs };
      const sets = outs.filter(o => o.columns);
      got = sqlRows(sets[sets.length - 1]); exp = sqlRows(ref.exec(ch.sql).slice(-1)[0]);
    }
    const why = sqlCompare(got, exp, ch.ordered);
    return { ok: !why, msg: why || 'Correcto.', outs };
  } finally { mine.close(); ref.close(); }
}

/* ---------- piezas de interfaz ---------- */
function sqlResultHtml(outs) {
  if (!outs || !outs.length) return '';
  return outs.map(o => o.msg ? `<p class="${o.err ? 'sql-err' : 'muted'}">${esc(o.msg)}</p>`
    : `<div class="tbl-wrap"><table class="addr sqlres"><tr>${o.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${o.values.slice(0, 200).map(r => `<tr>${r.map(v => `<td class="mono">${v === null ? '<span class="muted">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('')}</table></div><p class="muted" style="font-size:.8rem">${o.values.length} fila(s)${o.values.length > 200 ? ' · se muestran las primeras 200' : ''}</p>`).join('');
}
let sqlEdN = 0;
function sqlEditor(opts) {
  const id = 'sqled' + (++sqlEdN);
  const el = h(`<div class="sql-ed"><label class="muted" for="${id}" style="font-size:.8rem">${esc(opts.label || 'Tu consulta')}</label>
    <textarea id="${id}" class="sql-ta" rows="${opts.rows || 5}" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="${esc(opts.placeholder || 'SELECT … FROM … ;')}"></textarea>
    <div class="row">${(opts.buttons || []).map((b, i) => `<button class="btn small ${b.primary ? 'primary' : ''}" data-b="${i}" type="button">${esc(b.label)}</button>`).join('')}<span class="muted" style="font-size:.78rem">Ctrl + Enter para ejecutar</span></div>
    <div class="sql-fb"></div><div class="sql-out"></div></div>`);
  const ta = $('textarea', el);
  if (opts.value) ta.value = opts.value;
  (opts.buttons || []).forEach((b, i) => $(`[data-b="${i}"]`, el).addEventListener('click', () => b.fn(ta.value, api)));
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); const p = (opts.buttons || []).find(b => b.primary); if (p) p.fn(ta.value, api); } });
  const api = { el, ta, fb: $('.sql-fb', el), out: $('.sql-out', el), set: v => { ta.value = v; } };
  return api;
}
const sqlFb = (box, ok, msg, extra) => { box.innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><h4>${ok ? 'Correcto' : 'Todavía no'}</h4><div>${esc(msg)}</div>${extra || ''}</div>`; };

/* ---------- vista principal ---------- */
VIEWS.sql = function (view) {
  const S = sqlState();
  view.appendChild(h(`<div class="head"><span class="eyebrow">Bases de datos</span><h1>SQL, PostgreSQL y SQLite</h1>
    <p class="lead">Aprende a consultar bases de datos con una base REAL dentro de tu navegador: una empresa ficticia con usuarios, inicios de sesión, alertas, equipos y vulnerabilidades. Cada lección trae ejercicio, mini examen y su uso en ciberseguridad.</p></div>`));
  const status = h('<p class="muted sql-status">Cargando el motor de base de datos…</p>');
  const tabs = h(`<div class="tabs" role="tablist"><button class="tab" data-t="lec">Lecciones</button><button class="tab" data-t="con">Consola</button><button class="tab" data-t="ret">Retos de investigación</button><button class="tab" data-t="exa">Examen</button></div>`);
  const host = h('<div class="view" style="gap:16px"></div>');
  view.appendChild(status); view.appendChild(tabs); view.appendChild(host);
  let SQL = null, tab = ST.sub.sqlTab || 'lec', pendingSql = null;
  const go2 = (t, sql) => { tab = t; pendingSql = sql || null; ST.sub.sqlTab = t; saveStore(); draw(); window.scrollTo(0, 0); };
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => go2(b.dataset.t)));
  sqlEngine().then(m => { SQL = m; if (!CONSOLE_DB) CONSOLE_DB = sqlFresh(SQL); status.textContent = 'Motor listo: SQLite corriendo en tu navegador. Nada sale de tu equipo.'; draw(); })
    .catch(e => { status.innerHTML = `<span class="sql-err">${esc(e.message)}</span> Puedes leer las lecciones; los ejercicios necesitan el motor.`; draw(); });

  function draw() {
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    host.innerHTML = '';
    ({ lec: drawLessons, con: drawConsole, ret: drawChallenges, exa: drawExam })[tab]();
  }

  /* ----- lecciones ----- */
  function drawLessons() {
    const done = SQL_LESSONS.filter(l => S.les[l.id]).length;
    host.appendChild(h(`<div class="row" style="justify-content:space-between"><span class="muted">${done} de ${SQL_LESSONS.length} lecciones completadas</span><div class="bar" style="flex:1;max-width:320px"><i style="width:${pct(done, SQL_LESSONS.length)}%"></i></div></div>`));
    const g = h('<div class="grid wide"></div>');
    g.innerHTML = SQL_LESSONS.map((l, i) => `<button class="tile" data-l="${l.id}"><div class="row" style="justify-content:space-between"><span class="chip plasma">${i + 1} · ${esc(l.nivel)}</span>${S.les[l.id] ? '<span class="chip ok">Completada</span>' : ''}</div><h3>${esc(l.t)}</h3><p>${esc(l.que.length > 120 ? l.que.slice(0, 117) + '…' : l.que)}</p></button>`).join('');
    $$('.tile', g).forEach(b => b.addEventListener('click', () => lesson(SQL_LESSONS.find(l => l.id === b.dataset.l))));
    host.appendChild(g);
  }
  function lesson(L) {
    host.innerHTML = ''; window.scrollTo(0, 0);
    const st = { ex: !!S.les[L.id], quiz: !!S.les[L.id] };
    const finish = () => { if (st.ex && st.quiz && !S.les[L.id]) { S.les[L.id] = Date.now(); saveStore(); addXP(40, 'Lección SQL: ' + L.t); toast('Lección completada'); } };
    const code = (sql, exp) => `<pre class="codeblk">${esc(sql)}</pre><p class="muted">${esc(exp)}</p>`;
    const box = h(`<article class="view" style="gap:14px">
      <div class="row"><button class="btn small back" type="button">← Todas las lecciones</button><span class="chip plasma">${esc(L.nivel)}</span></div>
      <h2>${esc(L.t)}</h2>
      <section class="panel"><span class="eyebrow">1 · Qué es</span><p style="color:var(--ink)">${esc(L.que)}</p>
        <span class="eyebrow">2 · Para qué sirve</span><p>${esc(L.para)}</p>
        <span class="eyebrow">3 · Cómo funciona</span><ol class="list">${L.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol></section>
      <section class="panel"><span class="eyebrow">4 · Sintaxis y parámetros</span><pre class="codeblk">${esc(L.sintaxis)}</pre>
        <dl class="dl">${L.params.map(([k, v]) => `<dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></section>
      <section class="panel"><span class="eyebrow">5 · Ejemplo normal</span>${code(L.ej.sql, L.ej.exp)}<div class="row"><button class="btn small try1" type="button">Probar en la consola</button></div>
        <span class="eyebrow">6 · Ejemplo en ciberseguridad</span>${code(L.sec.sql, L.sec.exp)}<div class="row"><button class="btn small try2" type="button">Probar en la consola</button></div></section>
      <section class="panel ex"><span class="eyebrow">7 · Ejercicio</span><p style="color:var(--ink)">${esc(L.ejercicio.ask)}</p></section>
      <section class="panel qz"><span class="eyebrow">8 · Mini examen</span></section>
      <section class="panel"><span class="eyebrow">10 · Recomendación</span><p class="note">${esc(L.tip)}</p></section></article>`);
    host.appendChild(box);
    $('.back', box).addEventListener('click', () => draw());
    $('.try1', box).addEventListener('click', () => go2('con', L.ej.sql));
    $('.try2', box).addEventListener('click', () => go2('con', L.sec.sql.startsWith('-- PostgreSQL real') || L.sec.sql.startsWith('-- Historial') ? '\\dt' : L.sec.sql));
    let fails = 0;
    const ed = sqlEditor({
      rows: 4, buttons: [
        { label: 'Comprobar', primary: true, fn: v => {
          if (!SQL) return toast('El motor todavía no carga');
          const r = sqlCheck(SQL, L.ejercicio, v);
          ed.out.innerHTML = sqlResultHtml(r.outs);
          if (r.ok) { st.ex = true; sqlFb(ed.fb, true, '9 · Por qué está bien: tu resultado coincide con el esperado. ' + L.sec.exp); finish(); }
          else { fails++; sqlFb(ed.fb, false, '9 · Por qué no: ' + r.msg, fails >= 2 ? `<div><span class="lbl">Pista</span><code>${esc(L.ejercicio.hint)}</code></div>` : ''); }
        } },
        { label: 'Ver pista', fn: () => sqlFb(ed.fb, false, 'Pista: ' + L.ejercicio.hint) }
      ]
    });
    $('.ex', box).appendChild(ed.el);
    const qbox = h('<div></div>'); $('.qz', box).appendChild(qbox);
    mountQuiz(qbox, { id: 'sql-' + L.id, title: 'Mini examen · ' + L.t, questions: L.quiz.map(([q, o, e]) => ({ q, o, a: 0, e, t: L.t })), xpEach: 4, onDone: s => { if (s >= 66) { st.quiz = true; finish(); } } });
  }

  /* ----- consola ----- */
  function drawConsole() {
    const wrap = h(`<div class="sql-con"><aside class="panel sql-schema"><h3>Tablas</h3><div class="sch"></div><button class="btn small rst" type="button">Reiniciar base</button><p class="muted" style="font-size:.8rem">Puedes usar \\dt, \\d tabla, .tables y .schema tabla.</p></aside><section class="panel ed"></section></div>`);
    host.appendChild(wrap);
    const drawSchema = () => {
      if (!CONSOLE_DB) { $('.sch', wrap).innerHTML = '<p class="muted">Esperando el motor…</p>'; return; }
      const t = sqlTables(CONSOLE_DB).values.map(v => v[0]);
      $('.sch', wrap).innerHTML = t.map(n => { const cols = CONSOLE_DB.exec(`PRAGMA table_info(${n})`)[0].values.map(c => c[1]); return `<details class="acc sch-t"><summary><button class="linkish" data-q="${esc(n)}" type="button">${esc(n)}</button></summary><div class="acc-body"><span class="mono" style="font-size:.8rem;color:var(--dim)">${cols.map(esc).join(', ')}</span></div></details>`; }).join('');
      $$('[data-q]', wrap).forEach(b => b.addEventListener('click', e => { e.preventDefault(); ed.set(`SELECT * FROM ${b.dataset.q} LIMIT 20;`); run(ed.ta.value); }));
    };
    const run = v => { if (!CONSOLE_DB) return toast('El motor todavía no carga'); ed.out.innerHTML = sqlResultHtml(sqlRun(CONSOLE_DB, v)); ed.fb.innerHTML = ''; drawSchema(); };
    const ed = sqlEditor({ rows: 8, label: 'Consulta (puedes escribir varias, separadas por ;)', value: pendingSql || 'SELECT * FROM alertas WHERE estado = \'abierta\';', buttons: [{ label: 'Ejecutar', primary: true, fn: run }, { label: 'Limpiar', fn: () => { ed.set(''); ed.out.innerHTML = ''; ed.ta.focus(); } }] });
    $('.ed', wrap).appendChild(ed.el);
    let armed = false;
    $('.rst', wrap).addEventListener('click', e => {
      if (!SQL) return;
      if (!armed) { armed = true; e.target.textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { armed = false; if (e.target.isConnected) e.target.textContent = 'Reiniciar base'; }, 3500); return; }
      CONSOLE_DB.close(); CONSOLE_DB = sqlFresh(SQL); armed = false; e.target.textContent = 'Reiniciar base'; drawSchema(); toast('Base reiniciada a sus datos originales');
    });
    drawSchema();
    if (pendingSql && CONSOLE_DB) run(pendingSql);
    pendingSql = null;
  }

  /* ----- retos ----- */
  function drawChallenges() {
    const done = SQL_CHALLENGES.filter(c => S.ret[c.id]).length;
    host.appendChild(h(`<p class="lead">Investiga el incidente de la empresa con consultas. Cada reto se califica solo comparando tu resultado con el correcto, así que puedes resolverlo a tu manera. Llevas ${done} de ${SQL_CHALLENGES.length}.</p>`));
    const g = h('<div class="grid wide"></div>');
    g.innerHTML = SQL_CHALLENGES.map((c, i) => `<button class="tile" data-c="${c.id}"><div class="row" style="justify-content:space-between"><span class="chip">${i + 1} · ${esc(c.nivel)}</span>${S.ret[c.id] ? '<span class="chip ok">Resuelto</span>' : ''}</div><h3>${esc(c.t)}</h3><p>${esc(c.ask)}</p></button>`).join('');
    $$('.tile', g).forEach(b => b.addEventListener('click', () => challenge(SQL_CHALLENGES.find(c => c.id === b.dataset.c))));
    host.appendChild(g);
  }
  function challenge(C) {
    host.innerHTML = ''; window.scrollTo(0, 0);
    let fails = 0;
    const box = h(`<div class="view" style="gap:14px"><div class="row"><button class="btn small back" type="button">← Todos los retos</button><span class="chip">${esc(C.nivel)}</span>${S.ret[C.id] ? '<span class="chip ok">Resuelto</span>' : ''}</div>
      <h2>${esc(C.t)}</h2><section class="panel"><p style="color:var(--ink)">${esc(C.ask)}</p><p class="muted" style="font-size:.85rem">Tablas: usuarios, departamentos, equipos, inicios_sesion, alertas, vulnerabilidades. Explóralas en la Consola si lo necesitas.</p></section><section class="panel ed"></section></div>`);
    host.appendChild(box);
    $('.back', box).addEventListener('click', () => draw());
    const ed = sqlEditor({ rows: 6, buttons: [
      { label: 'Comprobar', primary: true, fn: v => {
        if (!SQL) return toast('El motor todavía no carga');
        const r = sqlCheck(SQL, C, v); ed.out.innerHTML = sqlResultHtml(r.outs);
        if (r.ok) { const first = !S.ret[C.id]; S.ret[C.id] = Date.now(); saveStore(); if (first) addXP(30, 'Reto SQL: ' + C.t); sqlFb(ed.fb, true, C.why); }
        else { fails++; sqlFb(ed.fb, false, r.msg, fails >= 2 ? `<div class="row"><button class="btn small sol" type="button">Ver una solución</button></div>` : ''); const s = $('.sol', ed.fb); if (s) s.addEventListener('click', () => { ed.fb.innerHTML += `<pre class="codeblk">${esc(C.sql)}</pre>`; }); }
      } },
      { label: 'Pista', fn: () => sqlFb(ed.fb, false, 'Pista: ' + C.hint) }
    ] });
    $('.ed', box).appendChild(ed.el);
  }

  /* ----- examen ----- */
  function drawExam() {
    const last = S.exam;
    const intro = h(`<section class="panel hero"><h2>Examen de bases de datos</h2>
      <p>Dos partes: <b>15 preguntas</b> de teoría (SQL, PostgreSQL, SQLite y seguridad) y <b>5 consultas</b> sobre la base de la empresa. Al final ves tu calificación por tema y qué repasar.</p>
      ${last ? `<p class="muted">Último intento: ${last.total}% (teoría ${last.theory}%, práctica ${last.practice}/${SQL_EXAM_PRACTICE.length}) · mejor: ${last.best}%</p>` : ''}
      <div class="row"><button class="btn primary go" type="button">${last ? 'Presentar de nuevo' : 'Empezar examen'}</button></div></section>`);
    host.appendChild(intro);
    $('.go', intro).addEventListener('click', startExam);
  }
  function startExam() {
    host.innerHTML = ''; window.scrollTo(0, 0);
    const pool = SQL_LESSONS.flatMap(L => L.quiz.map(([q, o, e]) => ({ q, o, a: 0, e, t: L.t }))).concat(SQL_EXAM_THEORY_EXTRA.map(([q, o, e, t]) => ({ q, o, a: 0, e, t })));
    const qs = shuffle(pool).slice(0, 15);
    const box = h('<section class="panel"></section>'); host.appendChild(box);
    mountQuiz(box, { id: 'sql-examen-teoria', title: 'Examen · Parte 1: teoría', questions: qs, groupLabel: q => q.t, xpEach: 4, onDone: score => {
      const nx = h(`<div class="row"><button class="btn primary" type="button">Continuar a la parte 2: consultas</button></div>`);
      box.appendChild(nx); $('button', nx).addEventListener('click', () => practice(score));
    } });
  }
  function practice(theory) {
    if (!SQL) { toast('El motor todavía no carga'); return; }
    let i = 0; const res = [];
    const step = () => {
      host.innerHTML = ''; window.scrollTo(0, 0);
      if (i >= SQL_EXAM_PRACTICE.length) return report(theory, res);
      const P = SQL_EXAM_PRACTICE[i];
      const box = h(`<section class="panel"><div class="q-top"><span class="eyebrow">Examen · Parte 2: consultas</span><span class="chip">${i + 1} / ${SQL_EXAM_PRACTICE.length}</span></div><div class="bar"><i style="width:${pct(i, SQL_EXAM_PRACTICE.length)}%"></i></div><p class="q-text">${esc(P.ask)}</p><p class="muted" style="font-size:.85rem">Un solo envío por pregunta. Puedes probar tu consulta antes de enviarla.</p></section>`);
      host.appendChild(box);
      const ed = sqlEditor({ rows: 6, buttons: [
        { label: 'Enviar respuesta', primary: true, fn: v => {
          const r = sqlCheck(SQL, P, v); res.push({ P, ok: r.ok, msg: r.msg });
          sqlFb(ed.fb, r.ok, r.ok ? 'Bien.' : r.msg, `<div class="row"><button class="btn small primary nx" type="button">${i + 1 < SQL_EXAM_PRACTICE.length ? 'Siguiente' : 'Ver resultado'}</button></div>`);
          $$('button[data-b]', ed.el).forEach(b => b.disabled = true);
          $('.nx', ed.fb).addEventListener('click', () => { i++; step(); });
        } },
        { label: 'Probar (sin calificar)', fn: v => { const db = sqlFresh(SQL); ed.out.innerHTML = sqlResultHtml(sqlRun(db, v)); db.close(); } }
      ] });
      box.appendChild(ed.el);
    };
    step();
  }
  function report(theory, res) {
    const ok = res.filter(r => r.ok).length, pPct = pct(ok, res.length), total = Math.round(theory * 0.6 + pPct * 0.4);
    const prev = S.exam;
    S.exam = { total, theory, practice: ok, best: Math.max(total, prev ? prev.best : 0), date: new Date().toISOString() }; saveStore();
    addXP(Math.round(total / (prev ? 4 : 2)), 'Examen de bases de datos');
    const verdict = total >= 85 ? ['ok', 'Excelente: estás listo para usar SQL en una entrevista técnica.'] : total >= 70 ? ['warn', 'Aprobado. Repasa los temas marcados para llegar a 85%.'] : ['bad', 'Todavía no. Repasa las lecciones marcadas y vuelve a intentarlo: así se aprende.'];
    const wrongTopics = [...new Set(res.filter(r => !r.ok).map(r => r.P.tema))];
    host.appendChild(h(`<section class="panel hero"><span class="eyebrow">Resultado del examen</span>
      <div class="row" style="gap:18px"><span class="score-big" style="color:var(--${verdict[0] === 'ok' ? 'ok' : verdict[0] === 'warn' ? 'warn' : 'bad'})">${total}%</span><p style="color:var(--ink)">${esc(verdict[1])}</p></div>
      <table class="addr"><tr><th>Parte</th><th>Resultado</th><th>Peso</th></tr><tr><td>Teoría</td><td class="mono">${theory}%</td><td>60%</td></tr><tr><td>Consultas</td><td class="mono">${ok} de ${res.length} (${pPct}%)</td><td>40%</td></tr></table>
      <h3>Consultas</h3><ul class="list">${res.map(r => `<li>${r.ok ? '✓' : '✕'} ${esc(r.P.ask)}${r.ok ? '' : ` <span class="muted">— ${esc(r.msg)}</span>`}</li>`).join('')}</ul>
      ${wrongTopics.length ? `<p class="note">Repasa: ${esc(wrongTopics.join(', '))}. El desglose de teoría por tema está en la parte 1.</p>` : ''}
      <div class="row"><button class="btn primary again" type="button">Presentar de nuevo</button><button class="btn lec" type="button">Ir a las lecciones</button></div></section>`));
    $('.again', host).addEventListener('click', startExam);
    $('.lec', host).addEventListener('click', () => go2('lec'));
  }

  draw();
};
