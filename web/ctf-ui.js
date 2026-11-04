/* ===== CTF: captura la bandera ===== */
ICONS.ctf = '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>';
const ctfState = () => (ST.ctf = Object.assign({ solved: {}, tries: {} }, ST.ctf || {}));
function ctfNormalize(s) { const x = String(s || '').trim(); const m = /^cq\{(.*)\}$/i.exec(x); return m ? 'CQ{' + m[1].trim().toLowerCase() + '}' : x; }
async function ctfCheck(ch, input) { return (await TOOLS.hash('SHA-256', ctfNormalize(input))) === ch.h; }

VIEWS.ctf = function (view) {
  const S = ctfState();
  const pts = CTF.filter(c => S.solved[c.id]).reduce((a, c) => a + c.pts, 0), max = CTF.reduce((a, c) => a + c.pts, 0);
  view.appendChild(h(`<div class="head"><span class="eyebrow">Capture the Flag</span><h1>CTF de la academia</h1>
    <p class="lead">Retos cortos como los de las competencias: decodificar, leer logs, revisar tokens y encontrar lo sospechoso. Cada reto esconde una bandera con formato <code>CQ{…}</code>. Todo es ficticio y ocurre en tu navegador.</p></div>`));
  view.appendChild(h(`<section class="panel hero"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Tu marcador</span><h2>${pts} de ${max} puntos</h2></div><div class="stat" style="text-align:right"><b>${Object.keys(S.solved).filter(id => CTF.some(c => c.id === id)).length}/${CTF.length}</b><span>banderas</span></div></div>
    <div class="bar"><i style="width:${pct(pts, max)}%"></i></div><p class="muted" style="font-size:.85rem">Las respuestas no están en el código de la página: se comprueban comparando su hash SHA-256, igual que en los CTF reales.</p></section>`));
  const cats = [...new Set(CTF.map(c => c.cat))];
  const filt = h(`<div class="tabs" role="tablist"><button class="tab" data-c="" type="button">Todos</button>${cats.map(c => `<button class="tab" data-c="${esc(c)}" type="button">${esc(c)}</button>`).join('')}</div>`);
  const grid = h('<div class="grid wide"></div>'), stage = h('<div hidden></div>');
  view.appendChild(filt); view.appendChild(grid); view.appendChild(stage);
  let cat = ST.sub.ctfCat || '';
  function draw() {
    $$('.tab', filt).forEach(b => b.setAttribute('aria-selected', String(b.dataset.c === cat)));
    grid.innerHTML = CTF.filter(c => !cat || c.cat === cat).map(c => `<button class="tile ctf-tile" data-id="${c.id}" type="button"><div class="row" style="justify-content:space-between"><span class="chip plasma">${esc(c.cat)}</span><span class="row" style="gap:6px"><span class="chip ${c.dif === 'Difícil' ? 'bad' : c.dif === 'Medio' ? 'warn' : ''}">${esc(c.dif)}</span><span class="chip">${c.pts} pts</span></span></div><h3>${S.solved[c.id] ? '🚩 ' : ''}${esc(c.t)}</h3><p>${esc(c.story)}</p>${S.solved[c.id] ? '<span class="chip ok">Resuelto</span>' : ''}</button>`).join('');
    $$('.ctf-tile', grid).forEach(b => b.addEventListener('click', () => open(b.dataset.id)));
  }
  $$('.tab', filt).forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; ST.sub.ctfCat = cat; saveStore(); draw(); }));
  function open(id) {
    const c = CTF.find(x => x.id === id);
    grid.hidden = true; filt.hidden = true; stage.hidden = false; stage.innerHTML = ''; window.scrollTo(0, 0);
    let shown = 0;
    const box = h(`<div class="view" style="gap:14px"><div class="row"><button class="btn small back" type="button">← Todos los retos</button><span class="chip plasma">${esc(c.cat)}</span><span class="chip">${esc(c.dif)} · ${c.pts} pts</span>${S.solved[c.id] ? '<span class="chip ok">Resuelto</span>' : ''}</div>
      <h2>${esc(c.t)}</h2><section class="panel"><p style="color:var(--ink)">${esc(c.story)}</p><pre class="scn-log ctf-art">${esc(c.art)}</pre><div class="row"><button class="btn small cpa" type="button">Copiar el artefacto</button></div><p class="note">${esc(c.ask)}</p>
      <div class="row"><input class="flag" placeholder="CQ{...}" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;font-family:var(--f-mono)" aria-label="Bandera"><button class="btn primary send" type="button">Enviar bandera</button></div><div class="ctf-fb"></div>
      <div class="row"><button class="btn small hint" type="button">Ver una pista</button><span class="muted hints-n" style="font-size:.85rem"></span></div><ul class="list hints"></ul></section>
      <section class="panel"><h3>Caja de herramientas</h3></section></div>`);
    stage.appendChild(box);
    $('.panel:last-child', box).appendChild(toolsWidget(['dec', 'hash', 'jwt', 'fecha']));
    $('.back', box).addEventListener('click', () => { stage.hidden = true; grid.hidden = false; filt.hidden = false; draw(); window.scrollTo(0, 0); });
    $('.cpa', box).addEventListener('click', () => copyText(c.art, 'Artefacto copiado'));
    const hn = () => { $('.hints-n', box).textContent = `${shown} de ${c.hints.length} pistas`; $('.hint', box).disabled = shown >= c.hints.length; };
    $('.hint', box).addEventListener('click', () => { if (shown < c.hints.length) { $('.hints', box).appendChild(h(`<li>${esc(c.hints[shown++])}</li>`)); hn(); } });
    hn();
    const send = async () => {
      const v = $('.flag', box).value; if (!v.trim()) return;
      S.tries[c.id] = (S.tries[c.id] || 0) + 1;
      let good = false; try { good = await ctfCheck(c, v); } catch (e) { $('.ctf-fb', box).innerHTML = `<div class="fb bad"><div>${esc(e.message)}</div></div>`; return; }
      if (good) {
        const first = !S.solved[c.id]; if (first) S.solved[c.id] = Date.now(); saveStore();
        if (first) addXP(c.pts - Math.min(c.pts / 2, shown * 5), 'CTF: ' + c.t);
        $('.ctf-fb', box).innerHTML = `<div class="fb good"><h4>🚩 ¡Bandera correcta!</h4><div><span class="lbl">Lo que aprendiste</span>${esc(c.learn)}</div></div>`;
      } else {
        saveStore();
        const fmt = /^CQ\{.+\}$/i.test(v.trim());
        $('.ctf-fb', box).innerHTML = `<div class="fb bad"><h4>Todavía no</h4><div>${fmt ? 'El formato está bien, pero esa no es la bandera. Revisa con calma o pide una pista.' : 'La bandera debe tener la forma CQ{…}.'}</div></div>`;
      }
    };
    $('.send', box).addEventListener('click', send);
    $('.flag', box).addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }
  draw();
  if (ST.sub.ctfOpen) { const id = ST.sub.ctfOpen; ST.sub.ctfOpen = ''; if (CTF.some(c => c.id === id)) open(id); }
};
