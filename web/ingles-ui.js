/* ===== Inglés técnico: interfaz (la voz usa la síntesis del navegador; no graba ni envía tu voz) ===== */
ICONS.ingles = '<path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c0 3-3 7-7 9"/><path d="M13 21l4-9 4 9M14.5 18h5"/>';
const enState = () => (ST.en = Object.assign({ voc: {}, dict: {}, ans: {} }, ST.en || {}));
const enTTS = (() => {
  const ok = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  let voice = null;
  const pick = () => { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /^en[-_]US/i.test(v.lang) && /natural|google|microsoft/i.test(v.name)) || vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; };
  if (ok) { pick(); if ('onvoiceschanged' in speechSynthesis) speechSynthesis.addEventListener('voiceschanged', pick); }
  return {
    ok,
    say(text, rate) { if (!ok) return toast('Tu navegador no tiene voz para leer en inglés'); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; if (voice) u.voice = voice; u.rate = rate || 0.92; speechSynthesis.speak(u); }
  };
})();
const enBtn = (text, slow) => enTTS.ok ? `<button class="btn small say" data-say="${esc(text)}" ${slow ? 'data-slow="1"' : ''} type="button" aria-label="Escuchar${slow ? ' despacio' : ''}">${slow ? '🐢' : '🔊'}</button>` : '';
const enWire = root => $$('.say', root).forEach(b => b.addEventListener('click', () => enTTS.say(b.dataset.say, b.dataset.slow ? 0.65 : 0.92)));
const EN_VOC_Q = Object.entries(EN_VOCAB).map(([cat, list], ci) => {
  const qs = list.map(([en, es, ex]) => { const others = shuffle(list.filter(x => x[1] !== es)).slice(0, 3).map(x => x[1]); return { q: `¿Qué significa "${en}"?  —  ${ex}`, o: [es, ...others], a: 0, e: `${en} = ${es}. Ejemplo: ${ex}`, t: cat }; });
  return regQuiz('en-voc-' + ci, 'Vocabulario · ' + cat, qs);
});
regQuiz('en-false', 'Falsos amigos', EN_FALSE.map(([q, a, b, c, d, e]) => ({ q, o: [a, b, c, d], a: 0, e, t: 'Falsos amigos' })));
EN_READ.forEach(r => regQuiz('en-read-' + r.id, 'Lectura · ' + r.t, r.qs.map(([q, ...o]) => ({ q, o, a: 0, e: 'La respuesta está en el texto: vuelve a leerlo buscando esas palabras.', t: r.tipo }))));
function enNorm(s) { return String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

VIEWS.ingles = function (view) {
  const S = enState();
  const known = Object.keys(S.voc).length, total = Object.values(EN_VOCAB).reduce((a, l) => a + l.length, 0);
  view.appendChild(h(`<div class="head"><span class="eyebrow">English for IT</span><h1>Inglés técnico</h1>
    <p class="lead">El inglés que de verdad usas en soporte, ciberseguridad y programación: vocabulario con audio, frases para el trabajo, falsos amigos, lectura de tickets reales, dictado y entrevista. Pensado para hispanohablantes.</p></div>`));
  view.appendChild(h(`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
    <div class="tile"><div class="stat"><b>${known}/${total}</b><span>Palabras que ya sabes</span></div><div class="bar"><i style="width:${pct(known, total)}%"></i></div></div>
    <div class="tile"><div class="stat"><b>${Object.keys(S.dict).length}/${EN_DICT.length}</b><span>Dictados correctos</span></div><div class="bar"><i style="width:${pct(Object.keys(S.dict).length, EN_DICT.length)}%"></i></div></div>
    <div class="tile"><div class="stat"><b>${Object.keys(S.ans).length}/${EN_INTERVIEW.length}</b><span>Respuestas de entrevista escritas</span></div><div class="bar"><i style="width:${pct(Object.keys(S.ans).length, EN_INTERVIEW.length)}%"></i></div></div></div>`));
  if (!enTTS.ok) view.appendChild(h('<p class="note">Tu navegador no tiene voz en inglés, así que los botones de audio no aparecen. En Chrome o Edge sí funcionan.</p>'));
  const T = [['voc', 'Vocabulario'], ['fra', 'Frases'], ['fal', 'Falsos amigos'], ['lec', 'Lectura'], ['dic', 'Dictado'], ['ent', 'Entrevista'], ['pro', 'Pronunciación']];
  const tabs = h(`<div class="tabs" role="tablist">${T.map(([k, t]) => `<button class="tab" data-t="${k}" type="button">${t}</button>`).join('')}</div>`);
  const host = h('<div class="view" style="gap:16px"></div>');
  view.appendChild(tabs); view.appendChild(host);
  let tab = ST.sub.enTab || 'voc';
  function draw() { ST.sub.enTab = tab; saveStore(); $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); host.innerHTML = ''; ({ voc, fra, fal, lec, dic, ent, pro })[tab](); enWire(host); }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; draw(); }));

  function voc() {
    const cats = Object.keys(EN_VOCAB); let ci = Math.min(+ST.sub.enCat || 0, cats.length - 1);
    const sel = h(`<div class="row"><label class="muted" for="en-cat">Tema</label><select id="en-cat">${cats.map((c, i) => `<option value="${i}" ${i === ci ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><button class="btn small primary qz" type="button">Practicar con quiz</button></div>`);
    const grid = h('<div class="grid wide en-cards"></div>'), qbox = h('<div class="panel" hidden></div>');
    host.appendChild(sel); host.appendChild(qbox); host.appendChild(grid);
    const paint = () => {
      grid.innerHTML = EN_VOCAB[cats[ci]].map(([en, es, ex]) => `<div class="tile"><div class="row" style="justify-content:space-between"><h3>${esc(en)}</h3><span class="row" style="gap:4px">${enBtn(en)}${S.voc[en] ? '<span class="chip ok">La sé</span>' : ''}</span></div>
        <details><summary class="muted">Ver significado</summary><p style="color:var(--ink)">${esc(es)}</p></details><p class="ext-sm"><i>${esc(ex)}</i> ${enBtn(ex)}</p>
        <div class="row"><button class="btn small kn" data-w="${esc(en)}" type="button">${S.voc[en] ? 'Repasarla otra vez' : 'Ya la sé'}</button></div></div>`).join('');
      enWire(grid);
      $$('.kn', grid).forEach(b => b.addEventListener('click', () => { const w = b.dataset.w; if (S.voc[w]) delete S.voc[w]; else S.voc[w] = Date.now(); saveStore(); paint(); }));
    };
    $('#en-cat', sel).addEventListener('change', e => { ci = +e.target.value; ST.sub.enCat = ci; saveStore(); qbox.hidden = true; paint(); });
    $('.qz', sel).addEventListener('click', () => { qbox.hidden = false; const Q = EN_VOC_Q[ci]; mountQuiz(qbox, { id: Q.id, title: Q.title, questions: Q.questions, xpEach: 4 }); qbox.scrollIntoView({ block: 'start' }); });
    paint();
  }
  function fra() {
    const groups = [...new Set(EN_PHRASES.map(p => p[2]))];
    host.appendChild(h(`<p class="muted">Escucha, repite en voz alta y luego escríbela sin ver. Con 🐢 se oye despacio.</p>`));
    groups.forEach(g => host.appendChild(h(`<section class="panel"><h3>${esc(g)}</h3><ul class="list en-ph">${EN_PHRASES.filter(p => p[2] === g).map(([en, es]) => `<li><span class="row" style="gap:6px">${enBtn(en)}${enBtn(en, true)}<b style="color:var(--ink)">${esc(en)}</b></span><span class="muted">${esc(es)}</span></li>`).join('')}</ul></section>`)));
  }
  function fal() {
    host.appendChild(h('<p class="lead">Palabras que se parecen al español pero significan otra cosa. Son las que más delatan en una junta o en un correo.</p>'));
    const box = h('<div class="panel"></div>'); host.appendChild(box);
    mountQuiz(box, { id: 'en-false', title: 'Falsos amigos', questions: QUIZZES['en-false'].questions, xpEach: 4 });
  }
  function lec() {
    const g = h('<div class="grid wide"></div>'), stage = h('<div></div>');
    g.innerHTML = EN_READ.map(r => { const q = ST.quiz['en-read-' + r.id]; return `<button class="tile" data-r="${r.id}" type="button"><div class="row" style="justify-content:space-between"><span class="chip plasma">${esc(r.tipo)}</span>${q ? `<span class="chip ${q.best >= 66 ? 'ok' : 'warn'}">${q.best}%</span>` : ''}</div><h3>${esc(r.t)}</h3><p>${esc(r.texto.slice(0, 110))}…</p></button>`; }).join('');
    host.appendChild(g); host.appendChild(stage);
    $$('[data-r]', g).forEach(b => b.addEventListener('click', () => {
      const r = EN_READ.find(x => x.id === b.dataset.r); g.hidden = true;
      stage.innerHTML = ''; const box = h(`<div class="view" style="gap:14px"><div class="row"><button class="btn small back" type="button">← Lecturas</button>${enBtn(r.texto)}${enBtn(r.texto, true)}</div><section class="panel"><h2>${esc(r.t)}</h2><pre class="en-text">${esc(r.texto)}</pre></section><div class="panel qb"></div></div>`);
      stage.appendChild(box); enWire(box);
      $('.back', box).addEventListener('click', () => { stage.innerHTML = ''; g.hidden = false; draw(); });
      const Q = QUIZZES['en-read-' + r.id]; mountQuiz($('.qb', box), { id: Q.id, title: Q.title, questions: Q.questions, keepOrder: true, xpEach: 5 });
    }));
  }
  function dic() {
    let i = Math.min(+ST.sub.enDict || 0, EN_DICT.length - 1);
    const box = h('<section class="panel"></section>'); host.appendChild(box);
    const paint = () => {
      const s = EN_DICT[i];
      box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Dictado ${i + 1} de ${EN_DICT.length}</h3>${S.dict[i] ? '<span class="chip ok">Correcto antes</span>' : ''}</div>
        ${enTTS.ok ? `<div class="row">${enBtn(s)}${enBtn(s, true)}<span class="muted">Escucha y escribe exactamente lo que oyes.</span></div>` : `<div class="row"><button class="btn small flash" type="button">Mostrar la frase 3 segundos</button><span class="muted">Sin voz en este navegador: memorízala y escríbela.</span></div><p class="mono flash-t" hidden>${esc(s)}</p>`}
        <input class="dict-in" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="Escribe aquí en inglés" style="width:100%" aria-label="Lo que escuchaste">
        <div class="row"><button class="btn primary chk" type="button">Comprobar</button><button class="btn small prev" type="button" ${i === 0 ? 'disabled' : ''}>Anterior</button><button class="btn small next" type="button" ${i === EN_DICT.length - 1 ? 'disabled' : ''}>Siguiente</button></div><div class="dict-fb"></div>`;
      enWire(box);
      const fl = $('.flash', box); if (fl) fl.addEventListener('click', () => { const t = $('.flash-t', box); t.hidden = false; setTimeout(() => { t.hidden = true; }, 3000); });
      const move = d => { i += d; ST.sub.enDict = i; saveStore(); paint(); };
      $('.prev', box).addEventListener('click', () => move(-1)); $('.next', box).addEventListener('click', () => move(1));
      const chk = () => {
        const target = s;
        const want = enNorm(target).split(' '), got = enNorm($('.dict-in', box).value).split(' ').filter(Boolean);
        const okN = want.filter((w, k) => got[k] === w).length, score = pct(okN, want.length);
        const words = target.split(/\s+/).map((w, k) => `<span class="${got[k] === want[k] ? 'w-ok' : 'w-bad'}">${esc(w)}</span>`).join(' ');
        if (score === 100 && !S.dict[i]) { S.dict[i] = Date.now(); saveStore(); addXP(8, 'Dictado en inglés'); }
        $('.dict-fb', box).innerHTML = `<div class="fb ${score === 100 ? 'good' : 'bad'}"><h4>${score === 100 ? 'Perfecto' : score + '% de palabras bien'}</h4><div class="dict-words">${words}</div>${score < 100 ? '<div class="muted">En verde lo que escribiste bien. Escúchala despacio e inténtalo otra vez.</div>' : ''}</div>`;
      };
      $('.chk', box).addEventListener('click', chk);
      $('.dict-in', box).addEventListener('keydown', e => { if (e.key === 'Enter') chk(); });
    };
    paint();
  }
  function ent() {
    host.appendChild(h(`<p class="lead">Escribe tu propia respuesta, léela en voz alta tres veces y compárala con el ejemplo. Las respuestas modelo son para adaptar a tu historia, no para memorizar.</p>`));
    EN_INTERVIEW.forEach(q => {
      const mine = S.ans[q.id] || '';
      const sec = h(`<details class="acc"><summary><span>${esc(q.q)} <span class="muted">· ${esc(q.es)}</span></span>${mine ? '<span class="chip ok">Respondida</span>' : ''}</summary><div class="acc-body">
        <div class="row">${enBtn(q.q)}<span class="note" style="flex:1">${esc(q.tip)}</span></div>
        <div class="field"><label for="ans-${q.id}">Tu respuesta en inglés</label><textarea id="ans-${q.id}" rows="4" maxlength="2000">${esc(mine)}</textarea><span class="muted ext-sm wc"></span></div>
        <div class="row"><button class="btn small primary sv" type="button">Guardar mi respuesta</button>${enBtn(q.model)}${enBtn(q.model, true)}<button class="btn small sm" type="button">Ver respuesta ejemplo</button></div>
        <p class="model" hidden style="color:var(--ink)">${esc(q.model)}</p></div></details>`);
      host.appendChild(sec);
      const ta = $('textarea', sec), wc = () => { const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; $('.wc', sec).textContent = `${n} palabras · ideal entre 40 y 120 para responder en 30 a 60 segundos.`; };
      ta.addEventListener('input', wc); wc();
      $('.sm', sec).addEventListener('click', () => { const m = $('.model', sec); m.hidden = !m.hidden; });
      $('.sv', sec).addEventListener('click', () => { const v = ta.value.trim().slice(0, 2000); if (v.split(/\s+/).length < 8) return toast('Escribe al menos un par de oraciones'); const first = !S.ans[q.id]; S.ans[q.id] = v; saveStore(); toast('Respuesta guardada'); if (first) addXP(15, 'Entrevista en inglés'); });
    });
  }
  function pro() {
    host.appendChild(h(`<section class="panel"><h3>Palabras de TI que más se pronuncian mal</h3><p class="muted">La "pronunciación aproximada" está escrita como se leería en español. Escucha, repite y grábate con el celular para compararte.</p>
      <div class="tbl-wrap"><table class="addr"><tr><th>Palabra</th><th>Suena como</th><th>Nota</th><th></th></tr>${EN_PRON.map(([w, s, n]) => `<tr><td><b>${esc(w)}</b></td><td class="mono">${esc(s)}</td><td>${esc(n)}</td><td>${enBtn(w)}${enBtn(w, true)}</td></tr>`).join('')}</table></div></section>`));
  }
  draw();
};
