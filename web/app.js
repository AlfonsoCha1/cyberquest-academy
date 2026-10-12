/* ===== Núcleo: almacenamiento, navegación, quiz, escenarios ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;

/* ---------- progreso ---------- */
const STORE_KEY = 'cyberquest-academy-v1';
const blank = () => ({ xp: 0, quiz: {}, wrong: {}, scn: {}, net: {}, netState: {}, term: {}, cmds: {}, answered: 0, correct: 0, last: 'inicio', sub: {} });
let ST = blank();
function loadStore() { try { const raw = localStorage.getItem(STORE_KEY); if (raw) ST = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* sin almacenamiento: se juega igual */ } }
function saveStore() { try { localStorage.setItem(STORE_KEY, JSON.stringify(ST)); } catch (e) { } }
const RANKS = [[0, 'Recluta'], [300, 'Aprendiz'], [800, 'Analista en formación'], [1600, 'Analista Jr (práctica)'], [3000, 'Analista (práctica)'], [5000, 'Especialista (práctica)'], [8000, 'Arquitecto (práctica)']];
function rankOf(xp) {
  let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  return { level: i + 1, name: cur[1], from: cur[0], to: next ? next[0] : cur[0], pct: next ? pct(xp - cur[0], next[0] - cur[0]) : 100 };
}
function addXP(n, why) { if (n <= 0) return; ST.xp += n; saveStore(); toast(`+${n} XP · ${why}`); renderSideXp(); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- modo ligero (PCs viejas) ---------- */
const LITE_KEY = 'cyberquest-lite';
const autoLite = () => { const n = navigator; return !!((n.hardwareConcurrency && n.hardwareConcurrency <= 2) || (n.deviceMemory && n.deviceMemory <= 2) || (n.connection && n.connection.saveData)); };
function liteOn() { let v = null; try { v = localStorage.getItem(LITE_KEY); } catch (e) { } return v === null ? autoLite() : v === '1'; }
function applyLite() {
  const on = liteOn(); document.documentElement.classList.toggle('lite', on);
  const b = document.getElementById('liteBtn'); if (b) { b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Modo ligero: activado' : 'Modo ligero: desactivado'; }
}
function toggleLite() {
  const on = !document.documentElement.classList.contains('lite');
  try { localStorage.setItem(LITE_KEY, on ? '1' : '0'); } catch (e) { }
  applyLite(); toast(on ? 'Modo ligero activado: sin efectos, ideal para PCs viejas' : 'Efectos visuales activados');
}

/* ---------- navegación ---------- */
const ICONS = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  redes: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
  terminal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 9l3 3-3 3M12 15h5"/>',
  comandos: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  secplus: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
  cursos: '<path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9v6c0 1.5 3 3 6 3s6-1.5 6-3V9"/>',
  ramas: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="19" r="2.5"/><path d="M6 8.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 13.5v3"/>',
  soc: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
  imprevistos: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
  progreso: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
};
const SECTIONS = [
  ['inicio', 'Inicio'], ['redes', 'Laboratorio de redes'], ['terminal', 'Terminal'], ['comandos', 'Comandos'],
  ['secplus', 'Security+'], ['cursos', 'Cursos'], ['ramas', 'Ramas'], ['soc', 'Simulador SOC'],
  ['imprevistos', 'Imprevistos'], ['progreso', 'Progreso']
];
const VIEWS = {};
const icon = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;
function renderNav(cur) {
  $('#nav').innerHTML = SECTIONS.map(([k, t]) => `<a class="nav-i" href="#${k}" ${k === cur ? 'aria-current="page"' : ''}>${icon(k)}<span>${t}</span></a>`).join('');
}
function renderSideXp() {
  const r = rankOf(ST.xp);
  $('#sideXp').innerHTML = `<div class="row" style="justify-content:space-between"><span class="rank">Nv ${r.level} · ${esc(r.name)}</span></div>
    <div class="bar" style="margin:8px 0 6px"><i style="width:${r.pct}%"></i></div><small>${ST.xp} XP${r.to > r.from ? ` · siguiente en ${r.to}` : ''}</small>`;
}
function go(name) { if (location.hash !== '#' + name) location.hash = name; else route(); }
function route() {
  const name = (location.hash || '').replace('#', '') || ST.last || 'inicio';
  const key = VIEWS[name] ? name : 'inicio';
  ST.last = key; saveStore();
  renderNav(key);
  const view = $('#view'); view.innerHTML = '';
  VIEWS[key](view);
  window.scrollTo(0, 0);
}

/* ---------- registro de quizzes ---------- */
const QUIZZES = {};
function regQuiz(id, title, questions, meta) { QUIZZES[id] = Object.assign({ id, title, questions }, meta || {}); return QUIZZES[id]; }
const LETTERS = 'ABCDEF';

/* opts: { id, title, questions:[{q,o,a,e,t,r,d}], groupLabel?:fn, onDone?:fn, xpEach?:n, mode?:'normal'|'review' } */
function mountQuiz(el, opts) {
  const qs = opts.questions.map((q, idx) => ({ q, idx: q._idx != null ? q._idx : idx, perm: shuffle(q.o.map((_, i) => i)) }));
  const order = opts.keepOrder ? qs : shuffle(qs);
  let i = 0, right = 0; const log = [];
  const quizId = opts.id;
  function show() {
    if (i >= order.length) return finish();
    const { q, perm } = order[i];
    el.innerHTML = '';
    const box = h(`<div class="quiz">
      <div class="q-top"><span class="eyebrow">${esc(opts.title || '')}</span><span class="chip">${i + 1} / ${order.length}</span></div>
      <div class="bar"><i style="width:${pct(i, order.length)}%"></i></div>
      <p class="q-text">${esc(q.q)}</p>
      <div class="q-opts">${perm.map((oi, k) => `<button class="opt" data-oi="${oi}"><span class="k">${LETTERS[k]}</span><span>${esc(q.o[oi])}</span></button>`).join('')}</div>
      <div class="fb-slot"></div></div>`);
    el.appendChild(box);
    $$('.opt', box).forEach(b => b.addEventListener('click', () => answer(+b.dataset.oi, box)));
    $('.opt', box).focus({ preventScroll: true });
  }
  function answer(oi, box) {
    const item = order[i], q = item.q, ok = oi === q.a;
    $$('.opt', box).forEach(b => { b.disabled = true; const v = +b.dataset.oi; if (v === q.a) b.classList.add('right'); else if (v === oi) b.classList.add('wrong'); });
    const qid = q._qid || quizId, qi = q._i != null ? q._i : item.idx, key = qid + ':' + qi;
    ST.answered++;
    if (ok) { right++; ST.correct++; delete ST.wrong[key]; } else ST.wrong[key] = { qid, i: qi, t: Date.now() };
    saveStore();
    log.push({ q, ok, pick: oi });
    const fb = h(`<div class="fb ${ok ? 'good' : 'bad'}">
      <h4>${ok ? 'Correcto' : 'No es esa'}</h4>
      ${ok ? '' : `<div><span class="lbl">La correcta</span>${esc(q.o[q.a])}</div>`}
      <div><span class="lbl">Por qué</span>${esc(q.e || '')}</div>
      ${q.t ? `<div><span class="lbl">${ok ? 'Concepto' : 'Repasa'}</span>${esc(q.t)}</div>` : ''}
      ${q.r ? `<div><span class="lbl">En el trabajo real</span>${esc(q.r)}</div>` : ''}
      <div class="row"><button class="btn primary nx">${i + 1 < order.length ? 'Siguiente' : 'Ver resultado'}</button></div></div>`);
    $('.fb-slot', box).appendChild(fb);
    const nx = $('.nx', fb); nx.addEventListener('click', () => { i++; show(); }); nx.focus({ preventScroll: true });
  }
  function finish() {
    const score = pct(right, order.length);
    const prev = ST.quiz[quizId] || { best: 0, runs: 0 };
    const first = prev.runs === 0;
    ST.quiz[quizId] = { best: Math.max(prev.best, score), runs: prev.runs + 1, last: score, n: order.length };
    saveStore();
    const xp = right * (opts.xpEach || 5) * (first ? 1 : 0.5) + (score >= 80 ? 20 : 0);
    addXP(Math.round(xp), opts.title || 'Quiz');
    let groups = '';
    if (opts.groupLabel) {
      const g = {};
      log.forEach(x => { const k = opts.groupLabel(x.q); g[k] = g[k] || [0, 0]; g[k][1]++; if (x.ok) g[k][0]++; });
      groups = `<div class="panel"><h3>Resultado por dominio</h3>${Object.entries(g).map(([k, [a, b]]) => `<div><div class="row" style="justify-content:space-between"><span>${esc(k)}</span><span class="mono">${a}/${b} · ${pct(a, b)}%</span></div><div class="bar"><i style="width:${pct(a, b)}%"></i></div></div>`).join('')}</div>`;
    }
    const missed = log.filter(x => !x.ok);
    el.innerHTML = '';
    el.appendChild(h(`<div class="quiz">
      <div class="row" style="gap:18px"><span class="score-big" style="color:${score >= 80 ? 'var(--ok)' : score >= 60 ? 'var(--warn)' : 'var(--bad)'}">${score}%</span>
      <div><h3>${right} de ${order.length} correctas</h3><p class="muted">${score >= 80 ? 'Listo para el siguiente tema.' : score >= 60 ? 'Vas bien. Repasa los temas marcados y vuelve a intentarlo.' : 'Repasa la teoría de estos temas y vuelve a intentarlo: así se aprende.'}</p></div></div>
      ${groups}
      ${missed.length ? `<div class="panel"><h3>Para repasar</h3><ul class="list">${missed.map(x => `<li>${esc(x.q.t || x.q.q)}</li>`).join('')}</ul></div>` : ''}
      <div class="row"><button class="btn primary again">Intentar de nuevo</button>${opts.onClose ? '<button class="btn close">Volver</button>' : ''}</div></div>`));
    $('.again', el).addEventListener('click', () => mountQuiz(el, opts));
    if (opts.onClose) $('.close', el).addEventListener('click', opts.onClose);
    if (opts.onDone) opts.onDone(score);
  }
  show();
}

/* ---------- escenarios con decisiones ---------- */
/* scn: { id, title, area, sev?, sit, log?, steps:[{ask, opts:[{t, s:0|1|2, fb}]}], pro, learn? } */
function mountScenario(el, scn, onClose) {
  let st = 0, pts = 0;
  const max = scn.steps.length * 2;
  const grade = s => s === 2 ? ['good', 'Buena decisión'] : s === 1 ? ['', 'Aceptable, pero hay algo mejor'] : ['bad', 'Riesgoso'];
  function show() {
    el.innerHTML = '';
    const step = scn.steps[st];
    const box = h(`<div class="quiz">
      <div class="q-top"><span class="eyebrow">${esc(scn.area || '')}</span><span class="row">${scn.sev ? `<span class="sev ${scn.sev}">${scn.sev.toUpperCase()}</span>` : ''}<span class="chip">Paso ${st + 1} / ${scn.steps.length}</span></span></div>
      <h2>${esc(scn.title)}</h2>
      ${st === 0 ? `<p>${esc(scn.sit)}</p>` : ''}
      ${scn.log && st === 0 ? `<pre class="scn-log">${esc(scn.log)}</pre>` : ''}
      <p class="q-text">${esc(step.ask)}</p>
      <div class="q-opts">${step.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${LETTERS[k]}</span><span>${esc(o.t)}</span></button>`).join('')}</div>
      <div class="fb-slot"></div></div>`);
    el.appendChild(box);
    $$('.opt', box).forEach(b => b.addEventListener('click', () => {
      const o = step.opts[+b.dataset.k]; pts += o.s;
      const best = Math.max(...step.opts.map(x => x.s));
      $$('.opt', box).forEach(x => { x.disabled = true; const oo = step.opts[+x.dataset.k]; if (oo.s === best) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
      const [cls, lab] = grade(o.s);
      const fb = h(`<div class="fb ${cls}"><h4>${lab}</h4><div>${esc(o.fb)}</div>
        <div class="row"><button class="btn primary nx">${st + 1 < scn.steps.length ? 'Continuar' : 'Ver cierre'}</button></div></div>`);
      $('.fb-slot', box).appendChild(fb);
      $('.nx', fb).addEventListener('click', () => { st++; st < scn.steps.length ? show() : finish(); });
      $('.nx', fb).focus({ preventScroll: true });
    }));
  }
  function finish() {
    const score = pct(pts, max);
    const prev = ST.scn[scn.id];
    ST.scn[scn.id] = Math.max(prev || 0, score); saveStore();
    addXP(Math.round(pts * (prev == null ? 10 : 4)), scn.title);
    el.innerHTML = '';
    el.appendChild(h(`<div class="quiz">
      <div class="row" style="gap:18px"><span class="score-big" style="color:${score >= 80 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--bad)'}">${score}%</span><div><h3>${esc(scn.title)}</h3><p class="muted">Puntaje de tus decisiones</p></div></div>
      <div class="panel"><h3>Lo que haría un profesional</h3><p style="color:var(--ink)">${esc(scn.pro)}</p>${scn.learn ? `<div class="note">${esc(scn.learn)}</div>` : ''}</div>
      <div class="row"><button class="btn primary again">Repetir</button>${onClose ? '<button class="btn close">Volver a la lista</button>' : ''}</div></div>`));
    $('.again', el).addEventListener('click', () => mountScenario(el, scn, onClose));
    if (onClose) $('.close', el).addEventListener('click', onClose);
  }
  show();
}

/* lista de escenarios reutilizable (SOC e Imprevistos) */
function scenarioList(view, list, key) {
  const wrap = h('<div class="grid wide"></div>');
  const stage = h('<div class="panel" hidden></div>');
  const draw = () => {
    wrap.innerHTML = list.map(s => {
      const sc = ST.scn[s.id];
      return `<button class="tile" data-id="${s.id}"><div class="row" style="justify-content:space-between">${s.sev ? `<span class="sev ${s.sev}">${s.sev.toUpperCase()}</span>` : `<span class="chip plasma">${esc(s.area)}</span>`}${sc != null ? `<span class="chip ${sc >= 80 ? 'ok' : 'warn'}">${sc}%</span>` : '<span class="chip">Nuevo</span>'}</div><h3>${esc(s.title)}</h3><p>${esc(s.sit.length > 130 ? s.sit.slice(0, 127) + '…' : s.sit)}</p></button>`;
    }).join('');
    $$('.tile', wrap).forEach(b => b.addEventListener('click', () => open(b.dataset.id)));
  };
  const open = id => {
    const s = list.find(x => x.id === id); wrap.hidden = true; stage.hidden = false;
    mountScenario(stage, s, () => { stage.hidden = true; wrap.hidden = false; draw(); });
    stage.scrollIntoView({ block: 'start' });
  };
  draw(); view.appendChild(wrap); view.appendChild(stage);
}

/* contenedor de quiz con botón de cerrar dentro de una vista */
function quizStage(host, quiz, extra) {
  host.hidden = false;
  mountQuiz(host, Object.assign({ id: quiz.id, title: quiz.title, questions: quiz.questions }, extra || {}));
  host.scrollIntoView({ block: 'start' });
}

function copyText(text, okMsg) {
  const done = () => toast(okMsg || 'Copiado');
  try { navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done)); } catch (e) { fallbackCopy(text, done); }
}
function fallbackCopy(text, done) {
  const ta = h('<textarea style="position:fixed;left:-9999px"></textarea>'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('Selecciona el texto y cópialo manualmente'); } ta.remove();
}
