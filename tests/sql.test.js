// Prueba la base de práctica, las lecciones, los retos y el examen de SQL con el mismo motor (sql.js).
// Uso: node tests/sql.test.js
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const web = path.join(__dirname, '..', 'web');
const initSqlJs = require(path.join(web, 'vendor', 'sql-wasm.js'));

const ctx = { VIEWS: {}, ST: { sub: {} }, console, module: undefined };
vm.createContext(ctx);
for (const f of ['sql-data.js', 'sql-data2.js', 'sql-ui.js']) vm.runInContext(fs.readFileSync(path.join(web, f), 'utf8'), ctx, { filename: f });
const run = code => vm.runInContext(code, ctx);

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } };

initSqlJs({ locateFile: f => path.join(web, 'vendor', f) }).then(SQL => {
  ctx.SQL = SQL;
  const fresh = () => run('sqlFresh(SQL)');
  // la base se crea y tiene datos
  const db = fresh();
  const count = t => db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0];
  for (const t of ['departamentos', 'usuarios', 'equipos', 'inicios_sesion', 'alertas', 'vulnerabilidades']) ok(count(t) > 0, 'tabla vacía ' + t);
  console.log('filas:', ['usuarios', 'equipos', 'inicios_sesion', 'alertas', 'vulnerabilidades'].map(t => `${t}=${count(t)}`).join(' '));

  // ejemplos de las lecciones corren sin error (los que son solo de PostgreSQL se saltan)
  for (const L of run('SQL_LESSONS')) for (const ex of [L.ej, L.sec]) {
    if (/^-- (PostgreSQL real|Historial|MAL)/.test(ex.sql)) continue;
    const outs = run(`sqlRun(sqlFresh(SQL), ${JSON.stringify(ex.sql)})`);
    ok(!outs.some(o => o.err), `${L.id} ejemplo con error: ${(outs.find(o => o.err) || {}).msg}`);
  }
  // la respuesta correcta de cada ejercicio, reto y pregunta práctica pasa, y devuelve algo
  const items = [...run('SQL_LESSONS').map(L => ({ id: L.id, ...L.ejercicio })), ...run('SQL_CHALLENGES'), ...run('SQL_EXAM_PRACTICE')];
  for (const it of items) {
    ctx.__it = it;
    const r = run('sqlCheck(SQL, __it, __it.sql)');
    ok(r.ok, `${it.id}: la solución oficial no pasa (${r.msg})`);
    const d = fresh();
    const res = it.mode === 'state' ? (d.exec(it.sql), d.exec(it.verify)) : d.exec(it.sql);
    const rows = res.length ? res[res.length - 1].values : [];
    ok(rows.length > 0, `${it.id}: la solución no devuelve filas`);
    if (['r1', 'r2', 'r5', 'l7', 'r9', 'l9'].includes(it.id)) console.log(`${it.id}:`, JSON.stringify(rows));
  }
  // respuestas equivocadas se rechazan con un mensaje útil
  const bad = (id, sql) => { ctx.__it = items.find(x => x.id === id); ctx.__s = sql; return run('sqlCheck(SQL, __it, __s)'); };
  let r = bad('r1', 'SELECT ip FROM inicios_sesion'); ok(!r.ok && /columna/.test(r.msg), 'r1 columnas: ' + r.msg);
  r = bad('r6', 'SELECT hostname, dias_sin_parche FROM equipos WHERE dias_sin_parche > 90 ORDER BY dias_sin_parche'); ok(!r.ok && /orden/.test(r.msg), 'r6 orden: ' + r.msg);
  r = bad('r9', 'UPDATE usuarios SET activo = 0'); ok(!r.ok, 'r9 debe rechazar desactivar a todos');
  r = bad('r3', 'SELECT usuario FROM usuarioz'); ok(!r.ok && /No existe la tabla/.test(r.msg), 'error amigable: ' + r.msg);
  r = bad('r3', "SELECT usuario FROM usuarios WHERE rol ILIKE 'admin' AND mfa = 0"); ok(!r.ok && /ILIKE es de PostgreSQL/.test(r.msg), 'pista de PostgreSQL: ' + r.msg);
  // la misma respuesta escrita de otra forma también pasa
  r = bad('r3', "select usuario from usuarios where mfa = 0 and rol in ('admin')"); ok(r.ok, 'variante válida r3: ' + r.msg);
  // comandos estilo psql / sqlite3
  const meta = run(`sqlRun(sqlFresh(SQL), '\\\\dt')`); ok(meta[0].values.length === 6, '\\dt lista 6 tablas');
  const d2 = run(`sqlRun(sqlFresh(SQL), '\\\\d usuarios')`); ok(d2[0].values.some(v => v[0] === 'mfa'), '\\d usuarios muestra mfa');
  const t2 = run(`sqlRun(sqlFresh(SQL), '.tables\\nSELECT COUNT(*) FROM alertas;')`); ok(t2.length === 2, '.tables + consulta en el mismo bloque');
  // examen: hay suficientes preguntas de teoría
  const pool = run('SQL_LESSONS').reduce((a, L) => a + L.quiz.length, 0) + run('SQL_EXAM_THEORY_EXTRA').length;
  ok(pool >= 30, 'banco de teoría ' + pool);
  console.log('preguntas de teoría:', pool, '· lecciones:', run('SQL_LESSONS').length, '· retos:', run('SQL_CHALLENGES').length);
  console.log(fails ? `\n${fails} fallas` : '\nTodo OK');
  process.exit(fails ? 1 : 0);
});
