/* ===== Laboratorio Dev+Sec: interfaz ===== */
ICONS.devlab = '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>';
const devState = () => (ST.dev = Object.assign({ par: {}, rev: {} }, ST.dev || {}));
const PREDICT_Q = PREDICT.map(p => ({ q: `¿Qué imprime? (${p.lang})\n\n${p.code}`, o: p.o, a: 0, e: p.e, t: p.lang }));
regQuiz('dev-predict', '¿Qué imprime?', PREDICT_Q);
const DEV_RULES = [
  ['Nunca confíes en la entrada', 'Todo lo que viene del usuario, de un archivo o de otra API se valida: tipo, largo, formato y lista de valores permitidos.'],
  ['Parámetros, no concatenación', 'SQL, comandos y rutas se arman con parámetros o listas de argumentos, nunca pegando texto.'],
  ['Escapa al mostrar', 'Lo que pintas en HTML va con textContent o escapado. innerHTML solo con contenido tuyo.'],
  ['Secretos fuera del código', 'Claves y contraseñas en variables de entorno o un gestor de secretos. Si se subieron a Git, se rotan.'],
  ['Contraseñas con bcrypt o Argon2', 'Nunca MD5, SHA-1 ni SHA-256 solos, y nunca cifradas con una llave que se pueda recuperar.'],
  ['Revisa el permiso en cada petición', 'Tener sesión no es tener permiso: valida que el recurso sea de quien lo pide.'],
  ['Menor privilegio', 'La app, el script o la cuenta de servicio solo con los permisos que de verdad usan.'],
  ['Errores sin detalles al usuario', 'Al usuario un mensaje simple; el detalle técnico va al log (sin contraseñas ni tokens).'],
  ['Dependencias al día', 'Actualiza librerías, revisa avisos de seguridad y evita paquetes abandonados o con nombres parecidos a los oficiales.'],
  ['Registra lo importante', 'Inicios de sesión, cambios de permisos y errores: sin registro no hay detección.']
];

VIEWS.devlab = function (view) {
  const D = devState();
  view.appendChild(h(`<div class="head"><span class="eyebrow">Programación + ciberseguridad</span><h1>Laboratorio Dev+Sec</h1>
    <p class="lead">Para ser buen desarrollador y buen analista a la vez: ordena código real, encuentra la vulnerabilidad antes que el atacante y predice qué hace un programa sin ejecutarlo. Python, PowerShell y JavaScript.</p></div>`));
  const done = [Object.keys(D.par).length, Object.keys(D.rev).length, (ST.quiz['dev-predict'] || {}).best || 0];
  view.appendChild(h(`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
    <div class="tile"><div class="stat"><b>${done[0]}/${PARSONS.length}</b><span>Códigos ordenados</span></div><div class="bar"><i style="width:${pct(done[0], PARSONS.length)}%"></i></div></div>
    <div class="tile"><div class="stat"><b>${done[1]}/${REVIEW.length}</b><span>Vulnerabilidades encontradas</span></div><div class="bar"><i style="width:${pct(done[1], REVIEW.length)}%"></i></div></div>
    <div class="tile"><div class="stat"><b>${done[2]}%</b><span>Mejor resultado en "¿Qué imprime?"</span></div><div class="bar"><i style="width:${done[2]}%"></i></div></div></div>`));
  const tabs = h('<div class="tabs" role="tablist"><button class="tab" data-t="par" type="button">Ordena el código</button><button class="tab" data-t="rev" type="button">Encuentra la vulnerabilidad</button><button class="tab" data-t="pre" type="button">¿Qué imprime?</button><button class="tab" data-t="reg" type="button">10 reglas de código seguro</button></div>');
  const host = h('<div class="view" style="gap:16px"></div>');
  view.appendChild(tabs); view.appendChild(host);
  let tab = ST.sub.devTab || 'par';
  function draw() {
    ST.sub.devTab = tab; saveStore();
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    host.innerHTML = '';
    ({ par: listPar, rev: listRev, pre: predict, reg: rules })[tab]();
  }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; draw(); }));

  function listPar() {
    const g = h('<div class="grid wide"></div>');
    g.innerHTML = PARSONS.map(p => `<button class="tile" data-p="${p.id}" type="button"><div class="row" style="justify-content:space-between"><span class="chip plasma">${esc(p.lang)}</span>${D.par[p.id] ? '<span class="chip ok">Resuelto</span>' : `<span class="chip">${p.lines.length} líneas</span>`}</div><h3>${esc(p.t)}</h3><p>${esc(p.ask)}</p></button>`).join('');
    $$('[data-p]', g).forEach(b => b.addEventListener('click', () => parsons(PARSONS.find(x => x.id === b.dataset.p))));
    host.appendChild(g);
  }
  function parsons(P) {
    host.innerHTML = ''; window.scrollTo(0, 0);
    const key = i => (P.g && P.g[i]) || 'L' + i;
    let order = shuffle(P.lines.map((_, i) => i));
    if (order.every((x, i) => x === i)) order.reverse();
    let fails = 0;
    const box = h(`<div class="view" style="gap:14px"><div class="row"><button class="btn small back" type="button">← Todos los retos</button><span class="chip plasma">${esc(P.lang)}</span></div><h2>${esc(P.t)}</h2>
      <section class="panel"><p style="color:var(--ink)">${esc(P.ask)}</p><p class="muted" style="font-size:.85rem">Mueve cada línea con las flechas. La sangría ya viene puesta: úsala como pista.</p><ol class="parsons"></ol>
      <div class="row"><button class="btn primary chk" type="button">Comprobar</button><button class="btn small mix" type="button">Revolver de nuevo</button></div><div class="par-fb"></div></section></div>`);
    host.appendChild(box);
    $('.back', box).addEventListener('click', draw);
    const list = $('.parsons', box);
    function paint(focusIdx) {
      list.innerHTML = order.map((li, pos) => `<li class="pl"><code class="pl-code">${esc(P.lines[li])}</code><span class="pl-btns"><button class="btn small" data-up="${pos}" type="button" aria-label="Subir línea" ${pos === 0 ? 'disabled' : ''}>↑</button><button class="btn small" data-dn="${pos}" type="button" aria-label="Bajar línea" ${pos === order.length - 1 ? 'disabled' : ''}>↓</button></span></li>`).join('');
      $$('[data-up]', list).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.up; [order[i - 1], order[i]] = [order[i], order[i - 1]]; paint(`[data-up="${i - 1}"]`); }));
      $$('[data-dn]', list).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.dn; [order[i + 1], order[i]] = [order[i], order[i + 1]]; paint(`[data-dn="${i + 1}"]`); }));
      if (focusIdx) { const f = $(focusIdx, list); if (f && !f.disabled) f.focus({ preventScroll: true }); }
    }
    paint();
    $('.mix', box).addEventListener('click', () => { order = shuffle(order); paint(); $('.par-fb', box).innerHTML = ''; });
    $('.chk', box).addEventListener('click', () => {
      const good = order.every((li, pos) => key(li) === key(pos));
      if (good) {
        const first = !D.par[P.id]; D.par[P.id] = Date.now(); saveStore(); if (first) addXP(30, 'Código ordenado: ' + P.t);
        $('.par-fb', box).innerHTML = `<div class="fb good"><h4>¡Correcto!</h4><div>${esc(P.exp)}</div><pre class="codeblk">${esc(P.lines.join('\n'))}</pre></div>`;
      } else {
        fails++;
        const firstBad = order.findIndex((li, pos) => key(li) !== key(pos));
        $('.par-fb', box).innerHTML = `<div class="fb bad"><h4>Todavía no</h4><div>${fails >= 2 ? `La primera línea fuera de lugar es la número ${firstBad + 1}.` : 'Revisa qué se necesita primero (variables, encabezado de la función) y dónde abre y cierra cada bloque.'}</div></div>`;
      }
    });
  }

  function listRev() {
    const g = h('<div class="grid wide"></div>');
    g.innerHTML = REVIEW.map(r => `<button class="tile" data-r="${r.id}" type="button"><div class="row" style="justify-content:space-between"><span class="chip plasma">${esc(r.lang)}</span>${D.rev[r.id] ? '<span class="chip ok">Encontrada</span>' : '<span class="chip warn">Código con falla</span>'}</div><h3>${esc(r.t)}</h3><p>${D.rev[r.id] ? esc(r.owasp) : 'Encuentra la línea vulnerable y elige la corrección.'}</p></button>`).join('');
    $$('[data-r]', g).forEach(b => b.addEventListener('click', () => review(REVIEW.find(x => x.id === b.dataset.r))));
    host.appendChild(g);
  }
  function review(R) {
    host.innerHTML = ''; window.scrollTo(0, 0);
    let misses = 0;
    const box = h(`<div class="view" style="gap:14px"><div class="row"><button class="btn small back" type="button">← Todos los retos</button><span class="chip plasma">${esc(R.lang)}</span></div><h2>${esc(R.t)}</h2>
      <section class="panel"><p style="color:var(--ink)">Paso 1: toca la línea que tiene la vulnerabilidad.</p><div class="rv-code">${R.lines.map((l, i) => `<button class="rv-line" data-i="${i}" type="button"><span class="rv-n">${i + 1}</span><code>${esc(l)}</code></button>`).join('')}</div><div class="rv-fb"></div></section></div>`);
    host.appendChild(box);
    $('.back', box).addEventListener('click', draw);
    const fb = $('.rv-fb', box);
    $$('.rv-line', box).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== R.bad) { misses++; b.classList.add('miss'); fb.innerHTML = `<div class="fb bad"><h4>Esa línea no es el problema</h4><div>${misses >= 2 ? 'Pista: busca dónde entra un dato que controla otra persona y qué se hace con él.' : 'Piensa: ¿qué dato viene de fuera y cómo se usa?'}</div></div>`; return; }
      $$('.rv-line', box).forEach(x => { x.disabled = true; x.classList.toggle('hit', +x.dataset.i === R.bad); });
      const opts = shuffle(R.fixes.map((t, k) => ({ t, k })));
      fb.innerHTML = `<div class="fb good"><h4>Línea ${R.bad + 1}: ahí está</h4><div>Paso 2: ¿cómo lo corriges?</div><div class="q-opts">${opts.map((o, n) => `<button class="opt" data-k="${o.k}" type="button"><span class="k">${LETTERS[n]}</span><span>${esc(o.t)}</span></button>`).join('')}</div><div class="fx"></div></div>`;
      $$('.opt', fb).forEach(o => o.addEventListener('click', () => {
        const ok = +o.dataset.k === 0;
        $$('.opt', fb).forEach(x => { x.disabled = true; if (+x.dataset.k === 0) x.classList.add('right'); else if (x === o) x.classList.add('wrong'); });
        if (ok) { const first = !D.rev[R.id]; D.rev[R.id] = Date.now(); saveStore(); if (first) addXP(misses ? 25 : 40, 'Vulnerabilidad encontrada: ' + R.t); }
        $('.fx', fb).appendChild(h(`<div class="fb ${ok ? 'good' : 'bad'}"><h4>${ok ? 'Bien corregido' : 'Esa corrección no basta'}</h4><div><span class="lbl">Categoría OWASP</span>${esc(R.owasp)}</div><div><span class="lbl">Por qué</span>${esc(R.exp)}</div>${ok ? '' : '<div class="row"><button class="btn small again" type="button">Intentar otra vez</button></div>'}</div>`));
        const ag = $('.again', fb); if (ag) ag.addEventListener('click', () => review(R));
      }));
    }));
  }

  function predict() {
    const box = h('<div class="panel devq"></div>'); host.appendChild(box);
    host.insertBefore(h('<p class="lead">Leer código y adivinar qué hace es la habilidad que más usas al revisar un script sospechoso o depurar. Aquí no se ejecuta nada: piénsalo antes de contestar.</p>'), box);
    mountQuiz(box, { id: 'dev-predict', title: '¿Qué imprime?', questions: PREDICT_Q, groupLabel: q => q.t, xpEach: 6 });
  }
  function rules() {
    host.appendChild(h(`<section class="panel"><h2>10 reglas de código seguro</h2><p class="muted">Resumen para tener a la mano. Cada reto de este laboratorio practica una o varias.</p><ol class="list">${DEV_RULES.map(([t, d]) => `<li><b style="color:var(--ink)">${esc(t)}.</b> ${esc(d)}</li>`).join('')}</ol>
      <p class="note">Siguiente nivel: revisa el proyecto OWASP Top 10 y practica en laboratorios legales como OWASP Juice Shop en tu propia computadora.</p></section>`));
  }
  draw();
};
