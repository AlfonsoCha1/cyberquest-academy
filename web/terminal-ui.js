/* ===== Vistas: Terminal y Comandos ===== */
const TSESS = {};
const normAns = s => String(s || '').trim().toLowerCase().replace(/["'`\s]/g, '');

VIEWS.terminal = function (view) {
  let os = ST.sub.termOs || 'linux';
  view.appendChild(h(`<div class="head"><span class="eyebrow">Práctica · Línea de comandos</span><h1>Terminal</h1>
    <p class="lead">Escribe comandos reales sobre un equipo simulado: un servidor Linux que fue atacado y una PC con Windows con algo raro. Resuelve los retos como lo haría un analista.</p></div>`));
  const tabs = h('<div class="tabs" role="tablist"><button class="tab" data-os="linux">Linux (bash)</button><button class="tab" data-os="win">Windows (CMD y PowerShell)</button></div>');
  view.appendChild(tabs);
  const wrap = h('<div class="term-wrap"></div>'); view.appendChild(wrap);

  function render() {
    ST.sub.termOs = os; saveStore();
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.os === os)));
    const S = TSESS[os] || (TSESS[os] = Object.assign(TERM.create(os), { buf: [] }));
    if (!S.buf.length) S.buf.push(`<span class="dim">${os === 'linux' ? 'Servidor web01 (Ubuntu). Escribe help para ver los comandos o man <comando> para su ficha.' : 'Microsoft Windows [Versión 10.0.22631]. Escribe help para ver los comandos.'}</span>`);
    const quick = os === 'linux' ? ['ls -la', 'cat notas.txt', 'tail -n 5 /var/log/auth.log', 'grep Failed /var/log/auth.log | wc -l', 'ps aux', 'ss -tulpn', 'cat /etc/passwd'] : ['ipconfig', 'ipconfig /all', 'tasklist', 'netstat -ano', 'dir Downloads', 'net user', 'whoami'];
    wrap.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;min-width:0">
      <div class="term"><div class="term-bar"><i></i><i></i><i></i><span>${os === 'linux' ? 'alfonso@web01 — bash' : 'Símbolo del sistema — PC-ALFONSO'}</span></div>
        <div class="term-out" aria-live="polite">${S.buf.join('\n')}</div>
        <form class="term-in${os === 'win' ? ' win' : ''}"><label for="term-input">${esc(TERM.prompt(S))}</label><input id="term-input" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send"></form></div>
      <div class="row">${quick.map(q => `<button class="chip qk" style="cursor:pointer;font-family:var(--f-mono)">${esc(q)}</button>`).join('')}</div></div>
      <aside class="panel chal"></aside>`;
    const out = $('.term-out', wrap), form = $('form', wrap), inp = $('#term-input', wrap), lab = $('label', form);
    out.scrollTop = out.scrollHeight;
    let hi = S.hist.length;
    const pre = ST.sub.termPrefill; if (pre && pre.os === os) { inp.value = pre.c; delete ST.sub.termPrefill; saveStore(); }
    form.addEventListener('submit', e => {
      e.preventDefault(); const line = inp.value; inp.value = '';
      const p = TERM.prompt(S);
      const r = TERM.run(S, line, manText);
      if (r.clear) S.buf = [];
      else {
        S.buf.push(`<span class="pr${os === 'win' ? ' win' : ''}">${esc(p)}</span> ${esc(line)}`);
        if (r.err) S.buf.push(`<span class="err">${esc(r.err)}</span>`); else if (r.out) S.buf.push(esc(r.out));
      }
      if (S.buf.length > 400) S.buf = S.buf.slice(-400);
      out.innerHTML = S.buf.join('\n'); out.scrollTop = out.scrollHeight; lab.textContent = TERM.prompt(S); hi = S.hist.length;
      if (line.trim() && !ST.sub.termFirst) { ST.sub.termFirst = 1; addXP(10, 'Primer comando'); }
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { if (hi > 0) { hi--; inp.value = S.hist[hi] || ''; } e.preventDefault(); }
      if (e.key === 'ArrowDown') { if (hi < S.hist.length) { hi++; inp.value = S.hist[hi] || ''; } e.preventDefault(); }
      if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); S.buf = []; out.innerHTML = ''; }
    });
    $$('.qk', wrap).forEach(b => b.addEventListener('click', () => { inp.value = b.textContent; inp.focus(); }));
    renderChal($('.chal', wrap));
  }
  function renderChal(box) {
    const list = TERM_CHALLENGES.filter(c => c.os === os);
    const done = list.filter(c => ST.term[c.id]).length;
    let cur = list.find(c => c.id === ST.sub['termCur:' + os]) || list.find(c => !ST.term[c.id]) || list[0];
    const draw = () => {
      ST.sub['termCur:' + os] = cur.id; saveStore();
      const solved = ST.term[cur.id];
      box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Retos</h3><span class="chip ${done === list.length ? 'ok' : ''}">${list.filter(c => ST.term[c.id]).length}/${list.length}</span></div>
        <div class="row">${list.map((c, i) => `<button class="chip pick-c ${ST.term[c.id] ? 'ok' : ''}" data-id="${c.id}" style="cursor:pointer;${c.id === cur.id ? 'border-color:var(--volt);color:var(--ink)' : ''}">${i + 1}</button>`).join('')}</div>
        <div><span class="chip plasma">${esc(cur.lvl)}</span></div>
        <h3>${esc(cur.title)}</h3><p style="color:var(--ink)">${esc(cur.ask)}</p>
        <form class="row ansf"><input id="ans-${cur.id}" placeholder="Tu respuesta" autocomplete="off" style="flex:1;min-width:120px;font-family:var(--f-mono)"><button class="btn primary small">Comprobar</button></form>
        <div class="ans-msg"></div>
        <details class="acc"><summary>Pista: qué comando usar</summary><div class="acc-body"><pre class="codeblk">${esc(cur.hint)}</pre><button class="btn small use">Escribirlo en la terminal</button></div></details>
        ${solved ? `<div class="fb good"><h4>Resuelto</h4><div>${esc(cur.exp)}</div></div>` : ''}`;
      $$('.pick-c', box).forEach(b => b.addEventListener('click', () => { cur = list.find(c => c.id === b.dataset.id); draw(); }));
      $('.use', box).addEventListener('click', () => { const i = $('#term-input'); i.value = cur.hint.split('   ')[0]; i.focus(); });
      $('.ansf', box).addEventListener('submit', e => {
        e.preventDefault(); const v = normAns($(`#ans-${cur.id}`, box).value);
        if (cur.ans.some(a => normAns(a) === v)) {
          const first = !ST.term[cur.id]; ST.term[cur.id] = 1; saveStore(); if (first) addXP(40, 'Reto: ' + cur.title);
          draw(); const nx = list.find(c => !ST.term[c.id]);
          if (nx) $('.ans-msg', box).innerHTML = `<button class="btn small nxc">Siguiente reto: ${esc(nx.title)}</button>`, $('.nxc', box).addEventListener('click', () => { cur = nx; draw(); });
        } else $('.ans-msg', box).innerHTML = '<span class="chip bad">Todavía no. Revisa la salida del comando con calma.</span>';
      });
    };
    draw();
  }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { os = b.dataset.os; render(); }));
  render();
};

VIEWS.comandos = function (view) {
  let os = ST.sub.cmdOs || 'linux', q = '', cat = '';
  view.appendChild(h(`<div class="head"><span class="eyebrow">Referencia · Para estudiar y aplicar</span><h1>Comandos</h1>
    <p class="lead">Cada comando con lo que significa su nombre, qué hace, un ejemplo y cómo se usa en ciberseguridad. Márcalo cuando lo domines y pon a prueba lo que sabes con el mini examen.</p></div>`));
  const tabs = h(`<div class="tabs" role="tablist">${Object.entries(OSNAME).map(([k, v]) => `<button class="tab" data-os="${k}">${v}</button>`).join('')}</div>`);
  const bar = h('<div class="row"><input id="cmd-search" type="search" placeholder="Buscar: hash, puertos, usuarios…" style="flex:1;min-width:200px"><button class="btn primary exam">Mini examen</button></div>');
  const cats = h('<div class="row"></div>'), grid = h('<div class="grid wide"></div>'), stage = h('<div class="panel" hidden></div>');
  [tabs, bar, cats, stage, grid].forEach(x => view.appendChild(x));
  $('#cmd-search', bar).addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
  $('.exam', bar).addEventListener('click', () => {
    const quiz = QUIZZES['cmd-' + (os === 'linux' ? 'linux' : 'cmd')] || buildCmdQuiz(os === 'linux' ? 'linux' : 'cmd');
    const pick = shuffle(quiz.questions.map((x, i) => Object.assign({ _idx: i }, x))).slice(0, 12);
    grid.hidden = true; cats.hidden = true;
    quizStage(stage, quiz, { questions: pick, onClose: () => { stage.hidden = true; grid.hidden = false; cats.hidden = false; } });
  });
  function draw() {
    ST.sub.cmdOs = os; saveStore();
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.os === os)));
    const pool = CMDS.filter(c => c.os === os);
    const allCats = [...new Set(pool.map(c => c.cat))];
    const known = pool.filter(c => ST.cmds[c.key]).length;
    cats.innerHTML = `<button class="chip ct" data-c="" style="cursor:pointer;${!cat ? 'border-color:var(--volt);color:var(--ink)' : ''}">Todas</button>` + allCats.map(c => `<button class="chip ct" data-c="${esc(c)}" style="cursor:pointer;${cat === c ? 'border-color:var(--volt);color:var(--ink)' : ''}">${esc(c)}</button>`).join('') + `<span class="chip ok" style="margin-left:auto">Dominas ${known}/${pool.length}</span>`;
    $$('.ct', cats).forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; draw(); }));
    const list = pool.filter(c => (!cat || c.cat === cat) && (!q || (c.c + ' ' + c.que + ' ' + c.sec + ' ' + c.sig + ' ' + c.cat).toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(c => `<article class="tile cmd-card">
      <div class="row" style="justify-content:space-between"><span class="cmd">${esc(c.c)}</span><span class="chip">${esc(c.cat)}</span></div>
      <span class="muted" style="font-size:.85rem">Significa: <em>${esc(c.sig)}</em></span>
      <p class="use" style="color:var(--ink)">${esc(c.que)}</p>
      <pre class="codeblk">${esc(c.ej)}</pre>
      <p class="sec"><strong style="color:var(--plasma)">En ciberseguridad:</strong> ${esc(c.sec)}</p>
      <div class="row"><button class="btn small kn ${ST.cmds[c.key] ? '' : ''}" data-k="${esc(c.key)}">${ST.cmds[c.key] ? '✓ Lo domino' : 'Marcar como dominado'}</button>
      ${c.os !== 'ps' ? `<button class="btn small try" data-k="${esc(c.key)}">Probar en terminal</button>` : ''}</div></article>`).join('') : '<div class="empty">No hay comandos con ese filtro.</div>';
    $$('.kn', grid).forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; if (ST.cmds[k]) delete ST.cmds[k]; else { ST.cmds[k] = 1; addXP(3, 'Comando dominado'); } saveStore(); draw(); }));
    $$('.try', grid).forEach(b => b.addEventListener('click', () => { const c = CMDS.find(x => x.key === b.dataset.k); ST.sub.termOs = c.os === 'linux' ? 'linux' : 'win'; ST.sub.termPrefill = { os: ST.sub.termOs, c: c.ej }; saveStore(); go('terminal'); }));
  }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { os = b.dataset.os; cat = ''; draw(); }));
  draw();
};
