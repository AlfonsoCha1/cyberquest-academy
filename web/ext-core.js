/* ===== Mi formación externa: lógica sin interfaz (se prueba en Node con tests/ext.test.js) =====
   Es tu registro personal de cursos de otras plataformas. No copia ni reemplaza su contenido:
   solo guarda título, enlace, estado, avance, notas, horas y certificados que TÚ capturas.
   Vive en ST.ext, así que se guarda en el navegador y viaja con la sincronización por código. */
const EXT_PROVIDERS = { coursera: 'Coursera', udemy: 'Udemy', otra: 'Otra plataforma' };
const EXT_STATES = [['confirmar', 'Por confirmar'], ['sin', 'Sin empezar'], ['progreso', 'En progreso'], ['pausa', 'Pausado'], ['hecho', 'Completado']];
const EXT_LIMITS = { items: 500, interest: 300, programs: 100, title: 300, notes: 4000, tags: 20, tag: 40, sessions: 600 };
const extStateName = k => (EXT_STATES.find(s => s[0] === k) || EXT_STATES[0])[1];
const extBlank = () => ({ v: 1, items: {}, programs: {}, interest: {}, imports: [], goal: 0, ses: [] });
function extState(st) { st.ext = Object.assign(extBlank(), st.ext || {}); return st.ext; }

/* ---------- utilidades ---------- */
function extDay(d) { d = d || new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
function extNorm(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, ' ').trim();
}
const extClip = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
function extTitleFromSlug(slug) {
  const t = String(slug || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}

/* ---------- enlaces: validar y sacar la identidad del curso ----------
   La identidad se calcula con proveedor + ruta canónica del curso, sin /learn/lecture/…, sin parámetros.
   El enlace ORIGINAL se guarda tal cual para el botón "Continuar estudiando". */
function extParseUrl(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return { ok: true, url: '', u: null };
  if (s.length > 2048) return { ok: false, msg: 'El enlace es demasiado largo (máximo 2048 caracteres).' };
  if (/\s/.test(s)) return { ok: false, msg: 'El enlace no debe tener espacios.' };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(s);
  let u;
  try { u = new URL(hasScheme ? s : 'https://' + s); } catch (e) { return { ok: false, msg: 'No es un enlace válido.' }; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, msg: 'Solo se aceptan enlaces que empiecen con https:// o http://.' };
  if (u.username || u.password) return { ok: false, msg: 'El enlace no debe llevar usuario ni contraseña.' };
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) return { ok: false, msg: 'El enlace no tiene un dominio válido.' };
  return { ok: true, url: hasScheme ? s : 'https://' + s, u };
}
function extProviderOf(u) {
  if (!u) return '';
  const host = u.hostname.toLowerCase();
  if (/(^|\.)udemy\.com$/.test(host)) return 'udemy';
  if (/(^|\.)coursera\.org$/.test(host)) return 'coursera';
  return 'otra';
}
function extKeyFromUrl(u) {
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const segs = u.pathname.split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x).toLowerCase(); } catch (e) { return x.toLowerCase(); } });
  if (/(^|\.)udemy\.com$/.test(host)) {
    const i = segs.indexOf('course');
    if (i >= 0 && segs[i + 1]) return 'udemy:' + segs[i + 1];
  }
  if (/(^|\.)coursera\.org$/.test(host)) {
    for (const [seg, tag] of [['learn', 'learn'], ['professional-certificates', 'cert'], ['specializations', 'spec'], ['projects', 'proyecto'], ['degrees', 'grado']]) {
      const i = segs.indexOf(seg);
      if (i >= 0 && segs[i + 1]) return `coursera:${tag}:${segs[i + 1]}`;
    }
  }
  return 'url:' + host + (segs.length ? '/' + segs.join('/') : '');
}
const extSlugFromKey = k => (/^(?:udemy|coursera:[a-z]+):(.+)$/.exec(k) || [])[1] || '';
function extItemKey(prov, title, url) {
  const p = extParseUrl(url);
  if (p.ok && p.u) return extKeyFromUrl(p.u);
  return `titulo:${prov || 'otra'}:${extNorm(title)}`;
}
function extProgramKey(prov, title, url) {
  const p = extParseUrl(url);
  if (p.ok && p.u) return extKeyFromUrl(p.u);
  return `prog:${prov || 'otra'}:${extNorm(title)}`;
}

/* ---------- estados y porcentajes que llegan escritos de muchas formas ---------- */
function extMapState(v) {
  const s = extNorm(v);
  if (!s) return '';
  if (/^(completad|complet|terminad|finalizad|hecho|done|aprobad|100)/.test(s)) return 'hecho';
  if (/(en progreso|in progress|cursando|iniciad|empezad|started|en curso|progreso)/.test(s)) return 'progreso';
  if (/(pausad|paused|pausa|detenid)/.test(s)) return 'pausa';
  if (/(sin empezar|not started|no iniciad|pendiente|sin iniciar|por empezar)/.test(s)) return 'sin';
  if (/(confirmar|desconocid|unknown|\?)/.test(s)) return 'confirmar';
  return '';
}
function extPct(v) {
  if (v == null || v === '') return null;
  const m = /(-?\d+(?:[.,]\d+)?)/.exec(String(v));
  if (!m) return null;
  const n = Math.round(parseFloat(m[1].replace(',', '.')));
  return n >= 0 && n <= 100 ? n : null;
}
function extDate(v) {
  const s = String(v == null ? '' : v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s); // dd/mm/aaaa
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}
function extTags(v) {
  const arr = Array.isArray(v) ? v : String(v == null ? '' : v).split(/[,;|]/);
  const out = [];
  for (const t of arr) { const c = extClip(t, EXT_LIMITS.tag); if (c && !out.some(x => x.toLowerCase() === c.toLowerCase())) out.push(c); if (out.length >= EXT_LIMITS.tags) break; }
  return out;
}

/* ---------- crear registros (validan y limpian todo lo que entra) ---------- */
function extMakeItem(raw, now) {
  const p = extParseUrl(raw.url);
  if (!p.ok) return { err: p.msg };
  const prov = EXT_PROVIDERS[raw.prov] ? raw.prov : (extProviderOf(p.u) || 'otra');
  let title = extClip(raw.title, EXT_LIMITS.title), titleFromLink = false;
  if (!title && p.u) { title = extTitleFromSlug(extSlugFromKey(extKeyFromUrl(p.u))); titleFromLink = !!title; }
  if (!title) return { err: 'Falta el título del curso.' };
  const pct = extPct(raw.pct);
  const day = now || extDay();
  const item = {
    key: extItemKey(prov, title, p.url), prov, provName: prov === 'otra' ? extClip(raw.provName, 60) : '',
    title, titleFromLink, url: p.url, inst: extClip(raw.inst, 120), nivel: extClip(raw.nivel, 40),
    temas: extTags(raw.temas), tags: extTags(raw.tags), prog: raw.prog || '', orden: Number.isFinite(+raw.orden) && raw.orden !== '' && raw.orden != null ? Math.max(0, Math.min(999, Math.round(+raw.orden))) : null,
    estado: EXT_STATES.some(s => s[0] === raw.estado) ? raw.estado : 'confirmar',
    pct, pctAt: pct != null ? (extDate(raw.pctAt) || day) : '', pctSrc: pct != null ? (raw.pctSrc || 'manual') : '',
    inicio: extDate(raw.inicio), fin: extDate(raw.fin), horas: Math.max(0, Math.min(10000, +raw.horas || 0)), meta: Math.max(0, Math.min(80, +raw.meta || 0)),
    cert: { tiene: !!(raw.cert && raw.cert.tiene), url: '' }, notas: String(raw.notas == null ? '' : raw.notas).slice(0, EXT_LIMITS.notes),
    src: extClip(raw.src, 80) || 'manual', creado: day, editado: day
  };
  if (raw.cert && raw.cert.url) { const c = extParseUrl(raw.cert.url); if (c.ok) item.cert.url = c.url; }
  return { item };
}
function extMakeProgram(raw, now) {
  const p = extParseUrl(raw.url);
  if (!p.ok) return { err: p.msg };
  const title = extClip(raw.title, EXT_LIMITS.title);
  if (!title) return { err: 'Falta el nombre del programa.' };
  const prov = EXT_PROVIDERS[raw.prov] ? raw.prov : (extProviderOf(p.u) || 'otra');
  const total = Number.isFinite(+raw.total) && +raw.total > 0 ? Math.min(200, Math.round(+raw.total)) : null;
  return { prog: { key: extProgramKey(prov, title, p.url), prov, title, url: p.url, inst: extClip(raw.inst, 120), total, nota: String(raw.nota == null ? '' : raw.nota).slice(0, 600), src: extClip(raw.src, 80) || 'manual', creado: now || extDay() } };
}
function extFindProgram(ext, prov, title) {
  const n = extNorm(title);
  return Object.values(ext.programs).find(p => extNorm(p.title) === n && (!prov || p.prov === prov)) || Object.values(ext.programs).find(p => extNorm(p.title) === n) || null;
}

/* ---------- comparar contra lo que ya tienes ----------
   exacto   = misma identidad (proveedor + curso) → se omite, nunca se sobrescribe.
   posible  = otra identidad pero mismo título y proveedor → no se agrega solo; tú decides.
   nuevo    = no existe. */
function extClassify(ext, item, where) {
  const pool = where === 'interest' ? ext.interest : ext.items;
  if (pool[item.key]) return { status: 'existe', match: pool[item.key] };
  if (where === 'interest' && ext.items[item.key]) return { status: 'existe', match: ext.items[item.key], note: 'Ya está en tus cursos' };
  const n = extNorm(item.title);
  const sim = Object.values(pool).find(x => x.prov === item.prov && extNorm(x.title) === n);
  if (sim) return { status: 'posible', match: sim };
  return { status: 'nuevo' };
}

/* ---------- leer archivos: CSV (coma o punto y coma, con comillas) y JSON ---------- */
function extParseCSV(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const first = src.split(/\r?\n/)[0] || '';
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.includes('\t') && !first.includes(',') ? '\t' : ',');
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"' && cell === '') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && src[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}
const EXT_COLS = {
  title: ['titulo', 'curso', 'course', 'nombre', 'name', 'title', 'modulo', 'nombre del curso', 'course name', 'nombre curso'],
  url: ['url', 'enlace', 'link', 'liga', 'href', 'enlace original', 'url original', 'enlace del curso', 'course url'],
  prov: ['proveedor', 'plataforma', 'provider', 'platform', 'sitio'],
  prog: ['programa', 'especializacion', 'certificado', 'certificate', 'program', 'specialization', 'ruta', 'certificado profesional', 'professional certificate'],
  orden: ['orden', 'order', 'numero', 'no', 'num', 'n', 'curso no', 'posicion'],
  estado: ['estado', 'status', 'situacion'],
  pct: ['porcentaje', 'progreso', 'avance', 'progress', 'percent', 'porcentaje observado', 'avance observado'],
  inst: ['institucion', 'organizacion', 'institution', 'instructor', 'autor', 'impartido por', 'universidad', 'empresa', 'ofrecido por'],
  pctAt: ['fecha', 'fecha observacion', 'fecha de observacion', 'fecha captura', 'observado', 'date', 'ultima actualizacion'],
  fuente: ['fuente', 'evidencia', 'captura', 'source'],
  notas: ['notas', 'nota', 'notes', 'comentario', 'comentarios', 'observaciones'],
  dest: ['tipo', 'destino', 'seccion', 'lista', 'categoria'],
  total: ['total', 'total cursos', 'cursos total', 'numero de cursos', 'cursos'],
  nivel: ['nivel', 'level'], temas: ['temas', 'topics', 'habilidades', 'skills'], tags: ['tags', 'etiquetas']
};
function extMapHeader(cells) {
  const map = {}, unused = [];
  cells.forEach((h, i) => {
    const n = extNorm(h);
    const f = Object.keys(EXT_COLS).find(k => EXT_COLS[k].includes(n) && map[k] == null);
    if (f) map[f] = i; else if (n) unused.push(String(h).trim());
  });
  return { map, unused };
}
const extIsInterest = v => /interes|recomend|wishlist|deseo|catalogo|explorar/.test(extNorm(v));

/* Convierte cualquier entrada (JSON del formato propio, CSV o lista de enlaces) a filas normalizadas. */
function extRowsFrom(input, opts) {
  opts = opts || {};
  const text = String(input || '').trim();
  const rows = []; let unused = [], kind = '';
  const push = r => rows.push(Object.assign({ dest: opts.dest || 'items' }, r));
  if (/^[{[]/.test(text)) {
    let obj; try { obj = JSON.parse(text); } catch (e) { return { err: 'El archivo JSON no se pudo leer: ' + e.message }; }
    kind = 'json';
    const pack = Array.isArray(obj) ? { cursos: obj } : obj;
    if (pack.formato && pack.formato !== 'cyberquest-formacion-externa') return { err: 'Ese JSON no es una lista de formación externa de CyberQuest.' };
    (pack.programas || []).forEach(p => push({ kind: 'programa', title: p.titulo || p.title, url: p.url || '', prov: p.proveedor || p.prov, inst: p.institucion || p.inst, total: p.total_cursos != null ? p.total_cursos : p.total, nota: p.nota || p.notas }));
    (pack.cursos || []).forEach(c => push({ kind: 'curso', title: c.titulo || c.title, url: c.url || c.enlace || '', prov: c.proveedor || c.prov, inst: c.institucion || c.inst, progTitle: c.programa || '', orden: c.orden, estado: c.estado, pct: c.porcentaje_observado && typeof c.porcentaje_observado === 'object' ? c.porcentaje_observado.valor : (c.porcentaje != null ? c.porcentaje : c.pct), pctAt: c.porcentaje_observado && c.porcentaje_observado.fecha, fuente: c.porcentaje_observado && c.porcentaje_observado.fuente || c.fuente, notas: c.notas, nivel: c.nivel, temas: c.temas, tags: c.tags, dest: c.destino === 'interes' ? 'interest' : (opts.dest || 'items') }));
    (pack.interes || []).forEach(c => push({ kind: 'curso', title: c.titulo || c.title, url: c.url || '', prov: c.proveedor || c.prov, inst: c.institucion || c.inst, notas: c.nota || c.notas, temas: c.temas, dest: 'interest' }));
    return { rows, unused, kind, packId: extClip(pack.id, 80) };
  }
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length && lines.every(l => /^(https?:\/\/|www\.)\S+$/i.test(l))) {
    kind = 'enlaces';
    lines.forEach(l => push({ kind: 'curso', url: l }));
    return { rows, unused, kind };
  }
  kind = 'csv';
  const table = extParseCSV(text);
  if (table.length < 2) return { err: 'El CSV necesita una fila de encabezados y al menos una fila de datos.' };
  const { map, unused: un } = extMapHeader(table[0]); unused = un;
  if (map.title == null && map.url == null && map.prog == null) return { err: 'No encontré columnas de título, enlace o programa. Encabezados leídos: ' + table[0].join(', ') };
  const get = (r, k) => map[k] != null ? String(r[map[k]] == null ? '' : r[map[k]]).trim() : '';
  for (const r of table.slice(1)) {
    const title = get(r, 'title'), url = get(r, 'url'), prog = get(r, 'prog');
    const dest = map.dest != null && extIsInterest(get(r, 'dest')) ? 'interest' : (opts.dest || 'items');
    if (!title && !url && prog) { push({ kind: 'programa', title: prog, prov: get(r, 'prov'), inst: get(r, 'inst'), total: get(r, 'total'), nota: get(r, 'notas') }); continue; }
    if (!title && !url) continue;
    push({ kind: 'curso', title, url, prov: get(r, 'prov'), inst: get(r, 'inst'), progTitle: prog, orden: get(r, 'orden'), estado: get(r, 'estado'), pct: get(r, 'pct'), pctAt: get(r, 'pctAt'), fuente: get(r, 'fuente'), notas: get(r, 'notas'), nivel: get(r, 'nivel'), temas: get(r, 'temas'), tags: get(r, 'tags'), total: get(r, 'total'), dest });
  }
  return { rows, unused, kind };
}
function extProvKey(v, url) {
  const n = extNorm(v);
  if (/coursera/.test(n)) return 'coursera';
  if (/udemy/.test(n)) return 'udemy';
  const p = extParseUrl(url);
  return (p.ok && extProviderOf(p.u)) || (n ? 'otra' : '');
}

/* Plan de importación: qué se agregaría, qué ya existe y qué parece duplicado. No cambia nada. */
function extPlan(ext, input, opts) {
  const parsed = extRowsFrom(input, opts);
  if (parsed.err) return { err: parsed.err };
  const day = (opts && opts.day) || extDay();
  const plan = { kind: parsed.kind, packId: parsed.packId || '', unused: parsed.unused, rows: [] };
  // Plataforma por defecto para filas sin enlace ni proveedor: la que elijas, la del nombre del archivo
  // (p. ej. inventario_coursera.csv) o la única plataforma que aparece en el resto del archivo.
  const known = new Set(parsed.rows.map(r => extProvKey(r.prov, r.url)).filter(p => p && p !== 'otra'));
  const fileHint = /coursera/i.test((opts && opts.name) || '') ? 'coursera' : /udemy/i.test((opts && opts.name) || '') ? 'udemy' : '';
  const defProv = (opts && EXT_PROVIDERS[opts.prov] && opts.prov) || fileHint || (known.size === 1 ? [...known][0] : '');
  parsed.rows.forEach(r => { if (!extProvKey(r.prov, r.url) && defProv) r.prov = defProv; });
  plan.defProv = defProv;
  const seenItems = new Set(), seenInt = new Set(), seenProg = new Set();
  // programas declarados explícitamente o mencionados por los cursos
  const progRows = parsed.rows.filter(r => r.kind === 'programa');
  const progTitles = new Map();
  progRows.forEach(r => progTitles.set(extNorm(r.title), r));
  parsed.rows.filter(r => r.kind === 'curso' && r.progTitle).forEach(r => { const n = extNorm(r.progTitle); if (!progTitles.has(n)) progTitles.set(n, { kind: 'programa', title: r.progTitle, prov: extProvKey(r.prov, r.url) || defProv, url: '', implied: true }); });
  for (const r of progTitles.values()) {
    const prov = extProvKey(r.prov, r.url);
    const courses = parsed.rows.filter(c => c.kind === 'curso' && c.progTitle && extNorm(c.progTitle) === extNorm(r.title));
    const made = extMakeProgram({ title: r.title, url: r.url, prov, inst: r.inst, total: r.total != null && r.total !== '' ? r.total : (courses.length || null), nota: r.nota, src: 'importación' }, day);
    if (made.err) { plan.rows.push({ kind: 'programa', title: r.title || '(sin nombre)', status: 'invalido', reason: made.err }); continue; }
    const p = made.prog;
    if (seenProg.has(p.key)) continue; seenProg.add(p.key);
    const existing = ext.programs[p.key] || extFindProgram(ext, p.prov, p.title);
    plan.rows.push({ kind: 'programa', title: p.title, data: p, status: existing ? 'existe' : 'nuevo', match: existing || null, key: existing ? existing.key : p.key, empty: !courses.length });
  }
  for (const r of parsed.rows.filter(x => x.kind === 'curso')) {
    const prov = extProvKey(r.prov, r.url);
    const estado = extMapState(r.estado) || 'confirmar';
    const pct = extPct(r.pct);
    const made = extMakeItem({ title: r.title, url: r.url, prov, inst: r.inst, orden: r.orden, estado, pct, pctAt: r.pctAt, pctSrc: pct != null ? (r.fuente ? 'captura' : 'importación') : '', notas: r.notas, nivel: r.nivel, temas: r.temas, tags: r.tags, src: 'importación' }, day);
    if (made.err) { plan.rows.push({ kind: 'curso', title: r.title || r.url || '(vacío)', status: 'invalido', reason: made.err, dest: r.dest }); continue; }
    const it = made.item;
    if (r.fuente) it.pctFuente = extClip(r.fuente, 160);
    if (r.progTitle) { const pr = plan.rows.find(x => x.kind === 'programa' && x.data && extNorm(x.title) === extNorm(r.progTitle)); if (pr) it.prog = pr.key; }
    const where = r.dest === 'interest' ? 'interest' : 'items';
    const seen = where === 'interest' ? seenInt : seenItems;
    if (seen.has(it.key)) { plan.rows.push({ kind: 'curso', title: it.title, status: 'repetido', reason: 'Aparece dos veces en el archivo', dest: where, key: it.key }); continue; }
    seen.add(it.key);
    const c = extClassify(ext, it, where);
    plan.rows.push({ kind: 'curso', title: it.title, data: it, status: c.status, match: c.match || null, note: c.note || '', dest: where, key: it.key });
  }
  plan.count = s => plan.rows.filter(r => r.status === s).length;
  return plan;
}

/* Aplica SOLO lo nuevo (y, si los pides, posibles duplicados concretos). Ejecutarlo dos veces no duplica nada. */
function extApply(ext, plan, opts) {
  opts = opts || {};
  const force = new Set(opts.forceKeys || []);
  const before = { items: Object.keys(ext.items).length, interest: Object.keys(ext.interest).length, programs: Object.keys(ext.programs).length };
  const res = { added: [], skipped: [], possible: [], invalid: [], programs: 0 };
  for (const r of plan.rows) {
    if (r.kind === 'programa') {
      if (r.status === 'nuevo' && !ext.programs[r.data.key] && Object.keys(ext.programs).length < EXT_LIMITS.programs) { ext.programs[r.data.key] = r.data; res.programs++; }
      continue;
    }
    if (r.status === 'invalido' || r.status === 'repetido') { res.invalid.push(r); continue; }
    const pool = r.dest === 'interest' ? ext.interest : ext.items;
    let item = r.data;
    if (r.status === 'existe') { res.skipped.push(r); continue; }
    if (r.status === 'posible' && !force.has(item.key)) { res.possible.push(r); continue; }
    if (pool[item.key] || (r.dest === 'interest' && ext.items[item.key])) { res.skipped.push(r); continue; } // ya entró (p. ej. al repetir)
    if (Object.keys(pool).length >= (r.dest === 'interest' ? EXT_LIMITS.interest : EXT_LIMITS.items)) { res.invalid.push(Object.assign({}, r, { reason: 'Llegaste al límite de cursos' })); continue; }
    if (r.dest === 'interest') item = extToInterest(item);
    pool[item.key] = Object.assign({}, item);
    res.added.push(r);
  }
  const after = { items: Object.keys(ext.items).length, interest: Object.keys(ext.interest).length, programs: Object.keys(ext.programs).length };
  const log = { at: new Date().toISOString(), origen: extClip(opts.name || plan.kind, 80), added: res.added.length, skipped: res.skipped.length, possible: res.possible.length, invalid: res.invalid.length, programs: res.programs, before, after };
  ext.imports = [log].concat(ext.imports || []).slice(0, 30);
  return Object.assign(res, { before, after, log });
}
function extToInterest(it) { return { key: it.key, prov: it.prov, provName: it.provName || '', title: it.title, titleFromLink: !!it.titleFromLink, url: it.url, inst: it.inst || '', temas: it.temas || [], notas: it.notas || '', src: it.src || 'manual', creado: it.creado || extDay() }; }

/* ---------- acciones del usuario ---------- */
function extAdd(ext, raw, where) {
  const made = extMakeItem(raw);
  if (made.err) return { err: made.err };
  const it = made.item;
  const c = extClassify(ext, it, where === 'interest' ? 'interest' : 'items');
  if (c.status === 'existe') return { err: c.note || 'Ese curso ya está en tu lista.', key: c.match.key };
  if (c.status === 'posible' && !raw.force) return { possible: c.match, item: it };
  if (where === 'interest') { if (Object.keys(ext.interest).length >= EXT_LIMITS.interest) return { err: 'Llegaste al límite de cursos de interés.' }; ext.interest[it.key] = extToInterest(it); }
  else { if (Object.keys(ext.items).length >= EXT_LIMITS.items) return { err: 'Llegaste al límite de cursos.' }; ext.items[it.key] = it; }
  return { ok: true, key: it.key };
}
/* Actualiza los campos editables de un curso. La identidad (key) no cambia aunque cambie el enlace. */
function extUpdate(ext, key, patch) {
  const it = ext.items[key]; if (!it) return { err: 'Ese curso ya no existe.' };
  const out = Object.assign({}, it);
  if ('url' in patch) { const p = extParseUrl(patch.url); if (!p.ok) return { err: p.msg }; out.url = p.url; }
  if ('title' in patch) { const t = extClip(patch.title, EXT_LIMITS.title); if (!t) return { err: 'El título no puede quedar vacío.' }; out.title = t; out.titleFromLink = false; }
  if ('estado' in patch && EXT_STATES.some(s => s[0] === patch.estado)) out.estado = patch.estado;
  if ('pct' in patch) {
    const n = patch.pct === '' || patch.pct == null ? null : extPct(patch.pct);
    if (patch.pct !== '' && patch.pct != null && n == null) return { err: 'El porcentaje debe ser un número de 0 a 100.' };
    if (n !== it.pct) { out.pct = n; out.pctAt = n == null ? '' : extDay(); out.pctSrc = n == null ? '' : 'manual'; delete out.pctFuente; }
  }
  for (const k of ['inst', 'nivel', 'provName']) if (k in patch) out[k] = extClip(patch[k], k === 'inst' ? 120 : 60);
  for (const k of ['inicio', 'fin']) if (k in patch) { const d = extDate(patch[k]); if (patch[k] && !d) return { err: 'Fecha inválida.' }; out[k] = d; }
  if ('horas' in patch) { const n = +patch.horas; if (!(n >= 0 && n <= 10000)) return { err: 'Las horas deben ser un número entre 0 y 10000.' }; out.horas = Math.round(n * 100) / 100; }
  if ('meta' in patch) { const n = +patch.meta; if (!(n >= 0 && n <= 80)) return { err: 'El objetivo semanal debe estar entre 0 y 80 horas.' }; out.meta = n; }
  if ('notas' in patch) out.notas = String(patch.notas || '').slice(0, EXT_LIMITS.notes);
  if ('tags' in patch) out.tags = extTags(patch.tags);
  if ('temas' in patch) out.temas = extTags(patch.temas);
  if ('prog' in patch) out.prog = patch.prog && ext.programs[patch.prog] ? patch.prog : '';
  if ('orden' in patch) out.orden = patch.orden === '' || patch.orden == null ? null : Math.max(0, Math.min(999, Math.round(+patch.orden) || 0));
  if ('cert' in patch) {
    const c = { tiene: !!patch.cert.tiene, url: '' };
    if (patch.cert.url) { const p = extParseUrl(patch.cert.url); if (!p.ok) return { err: 'Enlace del certificado: ' + p.msg }; c.url = p.url; }
    out.cert = c;
  }
  if (out.estado === 'hecho' && out.pct != null && out.pct < 100 && 'estado' in patch && patch.estado === 'hecho' && !('pct' in patch)) { out.pct = 100; out.pctAt = extDay(); out.pctSrc = 'manual'; }
  out.editado = extDay();
  ext.items[key] = out;
  return { ok: true, item: out };
}
/* Quitar = borrar SOLO tu registro de ese curso. No toca programas, ni la academia, ni tu tiempo ya registrado. */
function extRemove(ext, key, where) { const pool = where === 'interest' ? ext.interest : ext.items; if (!pool[key]) return false; delete pool[key]; return true; }
function extRemoveProgram(ext, pkey) {
  if (!ext.programs[pkey]) return false;
  delete ext.programs[pkey];
  Object.values(ext.items).forEach(it => { if (it.prog === pkey) it.prog = ''; });
  return true;
}
function extPromote(ext, key, estado) {
  const i = ext.interest[key]; if (!i) return { err: 'Ya no está en tu lista de interés.' };
  if (ext.items[key]) { delete ext.interest[key]; return { ok: true, key, already: true }; }
  const made = extMakeItem({ title: i.title, url: i.url, prov: i.prov, provName: i.provName, inst: i.inst, temas: i.temas, notas: i.notas, estado: estado || 'sin', src: 'interés' });
  if (made.err) return { err: made.err };
  made.item.key = key; made.item.titleFromLink = !!i.titleFromLink;
  ext.items[key] = made.item; delete ext.interest[key];
  return { ok: true, key };
}
function extLog(ext, key, minutes, day) {
  const m = Math.round(+minutes);
  if (!(m > 0 && m <= 600)) return { err: 'Registra entre 1 y 600 minutos.' };
  if (!key) { ext.ses = (ext.ses || []).concat([{ d: day || extDay(), m, k: '' }]).slice(-EXT_LIMITS.sessions); return { ok: true }; } // estudio en la academia
  const it = ext.items[key]; if (!it) return { err: 'Ese curso ya no existe.' };
  ext.ses = (ext.ses || []).concat([{ d: day || extDay(), m, k: key }]).slice(-EXT_LIMITS.sessions);
  it.horas = Math.round((it.horas + m / 60) * 100) / 100;
  if (it.estado === 'sin' || it.estado === 'confirmar') it.estado = 'progreso';
  if (!it.inicio) it.inicio = day || extDay();
  it.editado = extDay();
  return { ok: true };
}

/* ---------- estadísticas: todo sale de tus registros, nada inventado ---------- */
function extWeekStart(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return x; }
function extStats(ext, today) {
  const now = today || new Date();
  const items = Object.values(ext.items);
  const by = k => items.filter(i => i.estado === k).length;
  const withPct = items.filter(i => i.pct != null);
  const st = {
    total: items.length, hecho: by('hecho'), progreso: by('progreso'), pausa: by('pausa'), sin: by('sin'), confirmar: by('confirmar'),
    horas: Math.round(items.reduce((a, i) => a + (+i.horas || 0), 0) * 10) / 10,
    certs: items.filter(i => i.cert && i.cert.tiene).length,
    pctN: withPct.length, pctAvg: withPct.length ? Math.round(withPct.reduce((a, i) => a + i.pct, 0) / withPct.length) : null,
    interest: Object.keys(ext.interest).length
  };
  st.pendientes = st.total - st.hecho;
  st.byProv = Object.keys(EXT_PROVIDERS).map(p => {
    const xs = items.filter(i => i.prov === p), wp = xs.filter(i => i.pct != null);
    return { prov: p, name: EXT_PROVIDERS[p], n: xs.length, hecho: xs.filter(i => i.estado === 'hecho').length, horas: Math.round(xs.reduce((a, i) => a + (+i.horas || 0), 0) * 10) / 10, pctN: wp.length, pctAvg: wp.length ? Math.round(wp.reduce((a, i) => a + i.pct, 0) / wp.length) : null };
  }).filter(x => x.n);
  st.byProgram = Object.values(ext.programs).map(p => {
    const xs = items.filter(i => i.prog === p.key).sort((a, b) => (a.orden == null ? 999 : a.orden) - (b.orden == null ? 999 : b.orden) || a.title.localeCompare(b.title));
    const total = Math.max(p.total || 0, xs.length);
    return { key: p.key, title: p.title, prov: p.prov, linked: xs.length, declared: p.total, total, hecho: xs.filter(i => i.estado === 'hecho').length, confirmar: xs.filter(i => i.estado === 'confirmar').length, next: xs.find(i => i.estado !== 'hecho') || null };
  });
  // semana actual (lunes a domingo) y calendario de 12 semanas, con sesiones reales
  const ws = extWeekStart(now), wsDay = extDay(ws);
  const ses = ext.ses || [];
  st.weekMin = ses.filter(s => s.d >= wsDay && s.d <= extDay(now)).reduce((a, s) => a + s.m, 0);
  st.goalMin = Math.round((+ext.goal || 0) * 60);
  const days = {}; ses.forEach(s => { days[s.d] = (days[s.d] || 0) + s.m; });
  const start = new Date(ws); start.setDate(start.getDate() - 7 * 11);
  st.cal = [];
  for (let w = 0; w < 12; w++) { const col = []; for (let d = 0; d < 7; d++) { const x = new Date(start); x.setDate(start.getDate() + w * 7 + d); const k = extDay(x); col.push({ d: k, m: days[k] || 0, future: x > now }); } st.cal.push(col); }
  st.totalSesMin = ses.reduce((a, s) => a + s.m, 0);
  st.upcoming = items.filter(i => i.fin && i.estado !== 'hecho' && i.fin >= extDay(now)).sort((a, b) => a.fin.localeCompare(b.fin)).slice(0, 6);
  st.overdue = items.filter(i => i.fin && i.estado !== 'hecho' && i.fin < extDay(now));
  return st;
}
/* Sugerencias "qué estudio ahora", solo con tus datos (sin IA). */
function extSuggest(ext, st) {
  const out = [], items = Object.values(ext.items);
  const prog = items.filter(i => i.estado === 'progreso').sort((a, b) => (b.pct == null ? -1 : b.pct) - (a.pct == null ? -1 : a.pct));
  if (prog[0]) out.push({ t: `Termina "${prog[0].title}"`, d: prog[0].pct != null ? `Llevas ${prog[0].pct}% (dato ${prog[0].pctSrc === 'manual' ? 'que capturaste' : 'observado'} el ${prog[0].pctAt}).` : 'Está en progreso, sin porcentaje registrado.', key: prog[0].key });
  st.byProgram.filter(p => p.next && (!prog[0] || p.next.key !== prog[0].key)).slice(0, 2).forEach(p => out.push({ t: `Siguiente en ${p.title}: "${p.next.title}"`, d: `${p.hecho} de ${p.total} cursos completados en ese programa.`, key: p.next.key }));
  if (st.confirmar) out.push({ t: `Confirma el estado de ${st.confirmar} curso${st.confirmar === 1 ? '' : 's'}`, d: 'Están como "Por confirmar": revisa en la plataforma si ya los empezaste o terminaste.', filter: 'confirmar' });
  if (st.goalMin && st.weekMin < st.goalMin) out.push({ t: `Te faltan ${Math.ceil((st.goalMin - st.weekMin) / 60 * 10) / 10} h para tu objetivo de la semana`, d: 'Usa el modo enfoque para registrar tu tiempo real de estudio.' });
  st.overdue.slice(0, 2).forEach(i => out.push({ t: `Se pasó la fecha meta de "${i.title}"`, d: `Era el ${i.fin}. Ajusta la fecha o retómalo.`, key: i.key }));
  return out.slice(0, 6);
}
/* Rutas de práctica de la academia relacionadas con tus cursos externos (por palabras clave). */
const EXT_ROUTES = [
  { id: 'soc', t: 'Ruta SOC Jr', re: /\bsoc\b|siem|security|seguridad|cyber|ciber|incident|blue team|splunk|threat|amenaza/i, links: [['soc', 'Simulador SOC'], ['terminal', 'Terminal: equipos atacados'], ['ctf', 'CTF'], ['secplus', 'Security+']] },
  { id: 'sql', t: 'Ruta SQL', re: /\bsql\b|database|bases? de datos|postgres|mysql|sql server|data/i, links: [['sql', 'Bases de datos'], ['cursos', 'Curso SQL Server (T-SQL)']] },
  { id: 'ps', t: 'Ruta PowerShell y automatización', re: /powershell|windows|automat|python|script|linux|bash/i, links: [['comandos', 'Comandos'], ['terminal', 'Terminal Windows'], ['devlab', 'Laboratorio Dev+Sec']] }
];
function extRoutes(ext) {
  const items = Object.values(ext.items);
  return EXT_ROUTES.map(r => ({ id: r.id, t: r.t, links: r.links, mine: items.filter(i => r.re.test(i.title + ' ' + (i.temas || []).join(' ') + ' ' + (i.tags || []).join(' '))) }));
}
/* Paquete exportable (se puede volver a importar sin duplicar). */
function extExport(ext) {
  const progTitle = k => (ext.programs[k] || {}).title || '';
  return {
    formato: 'cyberquest-formacion-externa', version: 1, id: 'respaldo-' + extDay(), generado: new Date().toISOString(),
    programas: Object.values(ext.programs).map(p => ({ proveedor: p.prov, titulo: p.title, url: p.url, institucion: p.inst, total_cursos: p.total, nota: p.nota })),
    cursos: Object.values(ext.items).map(i => ({ proveedor: i.prov, titulo: i.title, url: i.url, institucion: i.inst, programa: progTitle(i.prog), orden: i.orden, estado: i.estado, porcentaje: i.pct, nivel: i.nivel, temas: i.temas, tags: i.tags, notas: i.notas })),
    interes: Object.values(ext.interest).map(i => ({ proveedor: i.prov, titulo: i.title, url: i.url, institucion: i.inst, nota: i.notas, temas: i.temas }))
  };
}

if (typeof module !== 'undefined') module.exports = { EXT_PROVIDERS, EXT_STATES, extBlank, extState, extDay, extNorm, extParseUrl, extKeyFromUrl, extItemKey, extMapState, extPct, extDate, extParseCSV, extRowsFrom, extPlan, extApply, extAdd, extUpdate, extRemove, extRemoveProgram, extPromote, extLog, extStats, extSuggest, extRoutes, extExport, extMakeItem, extTitleFromSlug };
