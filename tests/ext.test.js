// Pruebas de "Mi formación externa": identidad de cursos, enlaces seguros, importación sin duplicados y estadísticas.
// Uso: node tests/ext.test.js
const path = require('node:path');
const E = require(path.join(__dirname, '..', 'web', 'ext-core.js'));

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('  FAIL', m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

/* ---------- identidad canónica ---------- */
const key = u => E.extKeyFromUrl(E.extParseUrl(u).u);
eq(key('https://www.udemy.com/course/curso-completo-de-docker-de-cero-a-experto/learn/lecture/123456?start=0#overview'), 'udemy:curso-completo-de-docker-de-cero-a-experto', 'udemy /learn/lecture se ignora');
eq(key('https://www.udemy.com/course/curso-completo-de-docker-de-cero-a-experto/learn/practice/987'), 'udemy:curso-completo-de-docker-de-cero-a-experto', 'udemy /learn/practice se ignora');
eq(key('https://empresa.udemy.com/course/curso-completo-de-docker-de-cero-a-experto/'), 'udemy:curso-completo-de-docker-de-cero-a-experto', 'udemy business = mismo curso');
eq(key('https://www.coursera.org/learn/play-it-safe/home/week/2'), 'coursera:learn:play-it-safe', 'coursera learn');
eq(key('https://www.coursera.org/professional-certificates/google-cybersecurity?utm=x'), 'coursera:cert:google-cybersecurity', 'coursera certificado');
eq(key('https://www.coursera.org/specializations/algo'), 'coursera:spec:algo', 'coursera especialización');
ok(key('https://www.udemy.com/course/aws-a/') !== key('https://www.udemy.com/course/aws-b/'), 'cursos parecidos de Udemy NO se fusionan');
eq(key('https://learn.microsoft.com/es-es/training/paths/x/'), 'url:learn.microsoft.com/es-es/training/paths/x', 'otras plataformas: dominio + ruta');

/* ---------- enlaces peligrosos o inválidos ---------- */
for (const bad of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', 'https://usuario:clave@udemy.com/course/x', 'https://localhost/x', 'ftp://x.com/a', 'https://x.com/a b'])
  ok(!E.extParseUrl(bad).ok, 'debe rechazar ' + bad);
eq(E.extParseUrl('www.udemy.com/course/x/').url, 'https://www.udemy.com/course/x/', 'sin esquema se agrega https://');
const orig = 'https://www.udemy.com/course/curso-amazon-aws/learn/lecture/42?referralCode=ABC';
eq(E.extParseUrl(orig).url, orig, 'el enlace original se conserva completo');

/* ---------- estados, porcentajes, CSV ---------- */
eq(['Completado', 'In progress', 'pausado', 'Sin empezar', '', 'raro'].map(E.extMapState), ['hecho', 'progreso', 'pausa', 'sin', '', ''], 'estados');
eq(['32%', '32', ' 0 ', '150', 'abc', ''].map(E.extPct), [32, 32, 0, null, null, null], 'porcentajes');
eq(E.extParseCSV('a;b\n"x;1";"di ""hola"""\n'), [['a', 'b'], ['x;1', 'di "hola"']], 'CSV con punto y coma y comillas');

/* ---------- importación idempotente ---------- */
const ext = E.extBlank();
const csv = [
  'Programa,Orden,Curso,Estado,Porcentaje,Fecha,Fuente,URL',
  'Google Cybersecurity Professional Certificate,1,Foundations of Cybersecurity,Por confirmar,,,captura 1,https://www.coursera.org/learn/foundations-of-cybersecurity',
  'Google Cybersecurity Professional Certificate,2,Play It Safe: Manage Security Risks,En progreso,32%,2026-10-20,captura 2,https://www.coursera.org/learn/play-it-safe',
  'Google Cybersecurity Professional Certificate,3,Connect and Protect: Networks and Network Security,Sin empezar,,,captura 2,',
  'Microsoft Front-End Developer,,,,,,captura 7,'
].join('\n');
const plan1 = E.extPlan(ext, csv, { day: '2026-11-04' });
ok(!plan1.err, 'plan sin error ' + plan1.err);
eq(plan1.count('nuevo'), 5, 'nuevos en el primer plan (2 programas + 3 cursos)');
const r1 = E.extApply(ext, plan1, { name: 'inventario.csv' });
eq([r1.added.length, r1.programs, r1.before.items, r1.after.items], [3, 2, 0, 3], 'primera importación');
const pis = ext.items['coursera:learn:play-it-safe'];
eq([pis.estado, pis.pct, pis.pctAt, pis.pctSrc, pis.pctFuente], ['progreso', 32, '2026-10-20', 'captura', 'captura 2'], '32% queda como dato observado con fecha');
eq(ext.items['coursera:learn:foundations-of-cybersecurity'].estado, 'confirmar', 'Foundations queda Por confirmar');
const mfe = Object.values(ext.programs).find(p => /front-end/i.test(p.title));
ok(mfe && mfe.total == null && !Object.values(ext.items).some(i => i.prog === mfe.key), 'Microsoft Front-End sin temario: programa sin cursos inventados');
eq(mfe.prov, 'coursera', 'programa sin enlace toma la plataforma del resto del archivo');
const hint = E.extPlan(E.extBlank(), 'programa\nAlgún programa', { name: 'inventario_coursera.csv' });
eq(hint.rows[0].data.prov, 'coursera', 'el nombre del archivo indica la plataforma');
const gc = Object.values(ext.programs).find(p => /cybersecurity/i.test(p.title));
eq(gc.prov, 'coursera', 'programa deducido de sus cursos toma la plataforma de sus enlaces');
eq(Object.values(ext.items).filter(i => i.prog === gc.key).length, 3, 'cursos agrupados en su programa');

// el usuario edita y luego se vuelve a importar el mismo archivo: no se duplica ni se sobrescribe
E.extUpdate(ext, 'coursera:learn:play-it-safe', { pct: 45, notas: 'mis notas' });
const plan2 = E.extPlan(ext, csv, { day: '2026-11-05' });
const r2 = E.extApply(ext, plan2, { name: 'inventario.csv' });
eq([r2.added.length, r2.programs, r2.skipped.length, r2.after.items, Object.keys(ext.programs).length], [0, 0, 3, 3, 2], 'segunda importación no agrega nada');
eq([ext.items['coursera:learn:play-it-safe'].pct, ext.items['coursera:learn:play-it-safe'].notas, ext.items['coursera:learn:play-it-safe'].pctSrc], [45, 'mis notas', 'manual'], 'no sobrescribe lo que editó el usuario');

// lista de enlaces de Udemy (con /learn/ y parámetros): se guardan como Por confirmar con el enlace original
const links = ['https://www.udemy.com/course/curso-completo-de-docker-de-cero-a-experto/learn/lecture/1?x=1', 'https://www.udemy.com/course/curso-amazon-aws/learn/practice/9', 'https://www.udemy.com/course/curso-amazon-aws/'].join('\n');
const p3 = E.extPlan(ext, links);
eq([p3.count('nuevo'), p3.count('repetido')], [2, 1], 'enlaces: el mismo curso dos veces en el archivo se detecta');
const r3 = E.extApply(ext, p3);
const dk = ext.items['udemy:curso-completo-de-docker-de-cero-a-experto'];
eq([dk.estado, dk.url, dk.titleFromLink], ['confirmar', 'https://www.udemy.com/course/curso-completo-de-docker-de-cero-a-experto/learn/lecture/1?x=1', true], 'Udemy: Por confirmar, enlace original y título tomado del enlace');
eq(E.extApply(ext, E.extPlan(ext, links)).added.length, 0, 'enlaces importados dos veces: sin duplicados');

// catálogo de interés: no entra a "Mis cursos"
const intJson = JSON.stringify({ formato: 'cyberquest-formacion-externa', version: 1, interes: [{ proveedor: 'udemy', titulo: 'Curso que me recomendaron', url: 'https://www.udemy.com/course/recomendado-x/' }] });
const r4 = E.extApply(ext, E.extPlan(ext, intJson));
ok(r4.added.length === 1 && ext.interest['udemy:recomendado-x'] && !ext.items['udemy:recomendado-x'], 'cursos de interés van a su sección, no a Mis cursos');
eq(E.extApply(ext, E.extPlan(ext, intJson)).added.length, 0, 'interés importado dos veces: sin duplicados');

// posible duplicado: mismo título y proveedor, otro enlace → no se agrega solo
const dupe = E.extPlan(ext, 'curso,url\nPlay It Safe: Manage Security Risks,https://www.coursera.org/learn/play-it-safe-v2');
eq(dupe.count('posible'), 1, 'posible duplicado detectado');
const r5 = E.extApply(ext, dupe);
eq([r5.added.length, r5.possible.length], [0, 1], 'posible duplicado no se agrega automáticamente');
eq(E.extApply(ext, dupe, { forceKeys: ['coursera:learn:play-it-safe-v2'] }).added.length, 1, 'el usuario puede agregarlo de todos modos');

// enlaces maliciosos en un archivo se rechazan
const bad = E.extPlan(ext, 'curso,url\nMalo,javascript:alert(1)');
eq(bad.count('invalido'), 1, 'enlace javascript: rechazado al importar');

/* ---------- acciones ---------- */
ok(E.extAdd(ext, { title: 'Docker de cero', url: 'https://www.udemy.com/course/curso-completo-de-docker-de-cero-a-experto/' }).err, 'agregar a mano un curso existente avisa en vez de duplicar');
ok(E.extLog(ext, 'udemy:curso-amazon-aws', 25, '2026-11-04').ok, 'registrar minutos');
eq([ext.items['udemy:curso-amazon-aws'].horas, ext.items['udemy:curso-amazon-aws'].estado], [0.42, 'progreso'], 'registrar tiempo suma horas y pasa a En progreso');
ok(E.extLog(ext, 'udemy:curso-amazon-aws', 9999).err, 'minutos fuera de rango');
ok(E.extUpdate(ext, 'udemy:curso-amazon-aws', { url: 'javascript:alert(1)' }).err, 'editar con enlace peligroso se rechaza');
ok(E.extUpdate(ext, 'udemy:curso-amazon-aws', { pct: 150 }).err, 'porcentaje fuera de rango se rechaza');
const progKey = gc.key;
const linked = Object.values(ext.items).filter(i => i.prog === progKey).map(i => i.key);
ok(E.extRemoveProgram(ext, progKey) && linked.length === 3 && linked.every(k => ext.items[k] && ext.items[k].prog === ''), 'quitar un programa no borra sus cursos');
ok(E.extRemove(ext, 'udemy:curso-amazon-aws') && !ext.items['udemy:curso-amazon-aws'] && ext.ses.length === 1, 'quitar un curso borra solo ese registro (el tiempo estudiado se conserva)');
ok(E.extPromote(ext, 'udemy:recomendado-x', 'sin').ok && ext.items['udemy:recomendado-x'] && !ext.interest['udemy:recomendado-x'], 'mover de interés a mis cursos');

/* ---------- estadísticas derivadas ---------- */
const st = E.extStats(ext, new Date(2026, 10, 4));
eq([st.total, st.hecho, st.progreso, st.certs, st.weekMin], [Object.keys(ext.items).length, 0, 1, 0, 25], 'totales y minutos de la semana');
ok(st.pctN === Object.values(ext.items).filter(i => i.pct != null).length, 'el promedio solo cuenta cursos con porcentaje');
ok(st.cal.length === 12 && st.cal.every(c => c.length === 7), 'calendario de 12 semanas');
ok(st.cal.flat().some(c => c.d === '2026-11-04' && c.m === 25), 'el calendario muestra la sesión real');

/* ---------- respaldo: exportar y volver a importar en otro equipo ---------- */
const pack = JSON.stringify(E.extExport(ext));
const ext2 = E.extBlank();
const r6 = E.extApply(ext2, E.extPlan(ext2, pack));
eq([Object.keys(ext2.items).length, Object.keys(ext2.interest).length], [Object.keys(ext.items).length, Object.keys(ext.interest).length], 'respaldo restaura todo');
eq(E.extApply(ext2, E.extPlan(ext2, pack)).added.length, 0, 'restaurar dos veces no duplica');
const size = Buffer.byteLength(JSON.stringify(ext2));
// tamaño: 120 cursos con notas largas siguen cabiendo en el límite de 256 KB de la sincronización
const big = E.extBlank();
for (let i = 0; i < 120; i++) E.extAdd(big, { title: 'Curso ' + i, url: `https://www.udemy.com/course/curso-${i}/`, notas: 'x'.repeat(900) });
const bigSize = Buffer.byteLength(JSON.stringify(big));
ok(bigSize < 200 * 1024, '120 cursos con notas pesan ' + Math.round(bigSize / 1024) + ' KB');
console.log(`respaldo: ${Math.round(size / 1024 * 10) / 10} KB · 120 cursos con notas: ${Math.round(bigSize / 1024)} KB`);

console.log(fails ? `\n${fails} de ${n} fallas` : `\nTodo OK (${n} comprobaciones)`);
process.exit(fails ? 1 : 0);
