/* ===== Mi trabajo: apartado privado con candado =====
   - La contraseña NO está en el código. La primera vez en cada dispositivo la revisa el servidor
     (POST /api/trabajo/abrir, con límite de intentos); el servidor solo guarda un hash PBKDF2.
   - Tus notas y bitácora se cifran en el navegador con AES-GCM (llave derivada de tu contraseña,
     PBKDF2-SHA256, 600 000 iteraciones). En el dispositivo y en la sincronización solo viaja el cifrado.
   - El material de referencia (comandos, SQL, VS Code) es público como el resto de la academia. */
ICONS.trabajo = '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>';
const TB_ITER = 600000, TB_MAX = 150 * 1024, TB_IDLE = 20 * 60 * 1000;
let TB = { key: null, data: null, salt: null, it: TB_ITER, last: 0 }, tbFails = 0, tbWait = 0;
const tbState = () => (ST.trabajo = Object.assign({ vault: null }, ST.trabajo || {}));
const tbB64 = u8 => TOOLS.bytesToB64(u8);
const tbUnB64 = s => TOOLS.b64ToBytes(s);
async function tbKey(pin, salt, it) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function tbSeal(rekey) {
  const cur = tbState().vault;
  if (!rekey && cur && cur.salt && cur.salt !== tbB64(TB.salt)) { // se cargó otra copia (sincronización o respaldo): no la pisamos
    tbLock('Tus notas cambiaron en otro dispositivo o por un respaldo. Vuelve a abrir Mi trabajo.');
    throw new Error('Mi trabajo se cerró para no sobrescribir la copia nueva.');
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(TB.data));
  if (plain.length > TB_MAX) throw new Error('Tus notas pasan de 150 KB. Borra o exporta algunas antes de guardar.');
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, TB.key, plain));
  tbState().vault = { v: 1, kdf: 'PBKDF2-SHA256', it: TB.it, salt: tbB64(TB.salt), iv: tbB64(iv), ct: tbB64(ct) };
  saveStore();
}
async function tbOpenVault(pin, vault) {
  if (!vault || !(vault.it >= 100000 && vault.it <= 5000000) || !vault.salt || !vault.iv || !vault.ct) throw new Error('La bóveda guardada no es válida.');
  const salt = tbUnB64(vault.salt), key = await tbKey(pin, salt, vault.it);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: tbUnB64(vault.iv) }, key, tbUnB64(vault.ct)); // falla si la contraseña es otra
  return { key, salt, it: vault.it, data: JSON.parse(new TextDecoder().decode(pt)) };
}
const tbBlank = () => ({ notas: [], bitacora: [], creado: new Date().toISOString() });
function tbLock(msg) { TB = { key: null, data: null, salt: null, it: TB_ITER, last: 0 }; if (msg) toast(msg); if (location.hash === '#trabajo') route(); }
setInterval(() => { if (TB.key && Date.now() - TB.last > TB_IDLE) tbLock('Mi trabajo se cerró con llave por inactividad'); }, 30000);
const tbTouch = () => { TB.last = Date.now(); };
const tbId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

VIEWS.trabajo = function (view) {
  if (!TB.key) return tbLockScreen(view);
  tbTouch();
  tbHome(view);
};

function tbLockScreen(view) {
  const S = tbState(), hasVault = !!(S.vault && S.vault.ct);
  const cryptoOk = !!(window.crypto && crypto.subtle);
  view.appendChild(h(`<div class="head"><span class="eyebrow">Apartado privado</span><h1>Mi trabajo</h1><p class="lead">Tu espacio para el trabajo, aparte de la escuela: comandos de PowerShell, SQL para SQL Server, PostgreSQL y MySQL, atajos de VS Code, herramientas y tus notas y bitácora cifradas.</p></div>`));
  const box = h(`<section class="panel hero tb-lock"><div class="tb-lock-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="44" height="44">${ICONS.trabajo}</svg></div>
    <h2>Escribe tu contraseña</h2>
    ${cryptoOk ? `<div class="row"><input id="tb-pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="128" placeholder="Contraseña" aria-label="Contraseña de Mi trabajo" style="flex:1;min-width:0;max-width:280px;font-family:var(--f-mono)"><button class="btn primary open" type="button">Abrir</button></div><p class="tb-msg muted" role="status"></p>` : '<p class="sql-err">Este navegador no permite cifrar aquí (abre la academia con https en Chrome, Edge, Firefox o Safari actual).</p>'}
    <p class="muted" style="font-size:.85rem">${hasVault ? 'En este dispositivo ya está tu bóveda cifrada: se abre aquí mismo, incluso sin internet.' : 'La primera vez en cada dispositivo la contraseña se revisa en el servidor (puede tardar hasta un minuto si estaba dormido). Después tus notas quedan cifradas en este equipo.'}</p></section>`);
  view.appendChild(box);
  view.appendChild(h(`<p class="muted" style="font-size:.85rem">El resto de la academia está abierto para todos. Aquí solo entra quien tenga la contraseña; tus notas se guardan cifradas y nadie puede leerlas sin ella.</p>`));
  if (!cryptoOk) return;
  const msg = $('.tb-msg', box), inp = $('#tb-pin', box), btn = $('.open', box);
  const say = (t, bad) => { msg.textContent = t; msg.style.color = bad ? 'var(--bad)' : 'var(--dim)'; };
  async function open() {
    const pin = inp.value;
    if (!pin) return say('Escribe la contraseña.', true);
    if (Date.now() < tbWait) return say(`Demasiados intentos. Espera ${Math.ceil((tbWait - Date.now()) / 1000)} segundos.`, true);
    btn.disabled = true; say('Abriendo…');
    try {
      if (hasVault) {
        try { const r = await tbOpenVault(pin, S.vault); TB = Object.assign(r, { last: Date.now() }); }
        catch (e) { throw Object.assign(new Error('Contraseña incorrecta.'), { bad: true }); }
      } else {
        if (!apiOk()) throw new Error('La primera vez necesitas abrir la versión web con internet para verificar la contraseña.');
        say('Verificando en el servidor… (si estaba dormido tarda hasta un minuto)');
        try { await api('/api/trabajo/abrir', { method: 'POST', body: JSON.stringify({ pin }) }); }
        catch (e) { if (/incorrect/i.test(e.message)) throw Object.assign(new Error('Contraseña incorrecta.'), { bad: true }); throw e; }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        TB = { key: await tbKey(pin, salt, TB_ITER), salt, it: TB_ITER, data: tbBlank(), last: Date.now() };
        await tbSeal(true);
      }
      tbFails = 0; inp.value = ''; toast('Mi trabajo abierto'); route();
    } catch (e) {
      if (e.bad) { tbFails++; if (tbFails >= 5) { tbWait = Date.now() + 30000 * Math.pow(2, Math.min(4, tbFails - 5)); tbFails = 3; } }
      say(e.message, true); btn.disabled = false; inp.select();
    }
  }
  btn.addEventListener('click', open);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  setTimeout(() => inp.focus(), 50);
}

function tbHome(view) {
  const D = TB.data;
  view.appendChild(h(`<div class="head"><div class="row" style="justify-content:space-between"><span class="eyebrow">Apartado privado · abierto</span><button class="btn small lockb" type="button">🔒 Cerrar con llave</button></div><h1>Mi trabajo</h1>
    <p class="lead">Lo que necesitas a la mano en el trabajo: copia, adapta y ejecuta solo en equipos y bases que te toca administrar.</p></div>`));
  $('.lockb', view).addEventListener('click', () => tbLock('Cerrado con llave'));
  const T = [['ps', 'PowerShell'], ['sql', 'SQL'], ['vsc', 'VS Code'], ['her', 'Herramientas'], ['not', `Mis notas (${D.notas.length})`], ['bit', `Bitácora (${D.bitacora.length})`], ['can', 'Candado']];
  const tabs = h(`<div class="tabs" role="tablist">${T.map(([k, t]) => `<button class="tab" data-t="${k}" type="button">${esc(t)}</button>`).join('')}</div>`);
  const host = h('<div class="view" style="gap:16px"></div>'); view.appendChild(tabs); view.appendChild(host);
  let tab = ST.sub.tbTab || 'ps';
  const draw = () => { tbTouch(); ST.sub.tbTab = tab; saveStore(); $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); host.innerHTML = ''; ({ ps, sql, vsc, her, not, bit, can })[tab](); };
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; draw(); }));
  const codeCard = (t, code, extra) => `<div class="tile tb-cmd"><h3>${esc(t)}</h3><pre class="codeblk">${esc(code)}</pre>${extra || ''}<div class="row"><button class="btn small cp" data-c="${esc(code)}" type="button">Copiar</button></div></div>`;
  const wireCp = root => $$('.cp', root).forEach(b => b.addEventListener('click', () => { tbTouch(); copyText(b.dataset.c, 'Copiado'); }));
  const search = (ph, fn) => { const s = h(`<div class="row"><input type="search" placeholder="${esc(ph)}" style="flex:1;min-width:0" aria-label="Buscar"></div>`); $('input', s).addEventListener('input', e => fn(extNorm(e.target.value))); return s; };

  function ps() {
    const out = h('<div class="view" style="gap:14px"></div>');
    host.appendChild(h('<p class="muted">Abre PowerShell (en VS Code: terminal con Ctrl+Ñ). Los marcados con 🛡 necesitan abrirlo como administrador.</p>'));
    host.appendChild(search('Busca: disco, puerto, usuario bloqueado, eventos…', q => paint(q)));
    host.appendChild(out);
    const paint = q => {
      out.innerHTML = WORK_PS.map(g => { const items = g.items.filter(i => !q || extNorm(i.t + ' ' + i.que + ' ' + i.cmd + ' ' + g.cat).includes(q)); return items.length ? `<section><h3 style="margin:4px 0 8px">${esc(g.cat)}</h3><div class="grid wide">${items.map(i => codeCard((i.admin ? '🛡 ' : '') + i.t, i.cmd, `<p class="ext-sm">${esc(i.que)}</p>${i.cuidado ? `<p class="ext-sm" style="color:var(--warn)">⚠ ${esc(i.cuidado)}</p>` : ''}`)).join('')}</div></section>` : ''; }).join('') || '<div class="empty">Nada coincide con esa búsqueda.</div>';
      wireCp(out);
    };
    paint('');
  }
  function sql() {
    let d = ST.sub.tbDia || 'ss';
    const sel = h(`<div class="row"><span class="muted">Motor:</span>${[['ss', 'SQL Server'], ['pg', 'PostgreSQL'], ['my', 'MySQL']].map(([k, t]) => `<button class="btn small dia" data-d="${k}" type="button" aria-pressed="${k === d}">${t}</button>`).join('')}</div>`);
    const out = h('<div class="grid wide"></div>');
    host.appendChild(h('<p class="muted">Cambia el motor y el mismo recetario se adapta. Antes de cualquier UPDATE o DELETE, corre el SELECT con el mismo WHERE.</p>'));
    host.appendChild(sel); host.appendChild(search('Busca: duplicados, respaldo, conectados…', q => paint(q))); host.appendChild(out);
    const paint = q => { out.innerHTML = WORK_SQL.filter(x => !q || extNorm(x.t + ' ' + x[d] + ' ' + (x.nota || '')).includes(q)).map(x => codeCard(x.t, x[d], x.nota ? `<p class="ext-sm">${esc(x.nota)}</p>` : '')).join('') || '<div class="empty">Nada coincide.</div>'; wireCp(out); };
    $$('.dia', sel).forEach(b => b.addEventListener('click', () => { d = b.dataset.d; ST.sub.tbDia = d; saveStore(); $$('.dia', sel).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.d === d))); paint(''); }));
    paint('');
    host.appendChild(h('<p class="note">Para practicar sin miedo: Bases de datos tiene una base de práctica en tu navegador, y en Cursos está "Microsoft SQL Server (T-SQL)" y "SSIS". <a href="#sql">Ir a Bases de datos</a></p>'));
  }
  function vsc() {
    host.appendChild(h(`<div class="grid wide">${WORK_VSC.map(([g, l]) => `<div class="tile"><h3>${esc(g)}</h3><dl class="dl">${l.map(([k, v]) => `<dt><kbd class="kbd">${esc(k)}</kbd></dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`).join('')}</div>`));
    host.appendChild(h(`<section class="panel"><h3>Extensiones útiles para tu trabajo</h3><ul class="list">${WORK_VSC_EXT.map(([n, p, d]) => `<li><b style="color:var(--ink)">${esc(n)}</b> <span class="chip">${esc(p)}</span> — ${esc(d)}</li>`).join('')}</ul><p class="note">Seguridad: instala extensiones solo de editores verificados y revisa los permisos. Las extensiones falsas que imitan nombres populares son un ataque real.</p></section>`));
    const st = h(`<section class="panel"><h3>Ajustes recomendados (settings.json)</h3><p class="muted">Ctrl+Shift+P → "Preferences: Open User Settings (JSON)" y pega esto dentro de las llaves.</p><pre class="codeblk">${esc(WORK_VSC_SETTINGS)}</pre><div class="row"><button class="btn small cp" data-c="${esc(WORK_VSC_SETTINGS)}" type="button">Copiar</button></div></section>`);
    host.appendChild(st); wireCp(st);
  }
  function her() { host.appendChild(h('<section class="panel"><h3>Herramientas</h3></section>')); $('.panel', host).appendChild(toolsWidget()); }

  /* ----- notas cifradas ----- */
  function not() {
    const top = h(`<div class="row"><button class="btn small primary nw" type="button">+ Nueva nota</button><input type="search" class="nq" placeholder="Buscar en mis notas" style="flex:1;min-width:0" aria-label="Buscar notas"><button class="btn small ex" type="button">Exportar notas (JSON)</button></div>`);
    const list = h('<div class="grid wide"></div>'), ed = h('<div></div>');
    host.appendChild(h('<p class="muted">Snippets, procedimientos, consultas que usas seguido. Se guardan cifrados con tu contraseña. No guardes aquí contraseñas de otros sistemas: para eso usa un gestor de contraseñas.</p>'));
    host.appendChild(top); host.appendChild(ed); host.appendChild(list);
    const paint = q => {
      const xs = TB.data.notas.filter(n => !q || extNorm(n.t + ' ' + n.body + ' ' + (n.tags || []).join(' ')).includes(q)).sort((a, b) => b.at - a.at);
      list.innerHTML = xs.length ? xs.map(n => `<div class="tile"><div class="row" style="justify-content:space-between"><span class="chip plasma">${esc(n.lang)}</span><span class="muted ext-sm">${esc(new Date(n.at).toLocaleDateString('es-MX'))}</span></div><h3>${esc(n.t)}</h3><pre class="codeblk tb-pre">${esc(n.body.length > 600 ? n.body.slice(0, 600) + '\n…' : n.body)}</pre><div class="meta">${(n.tags || []).map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div><div class="row"><button class="btn small cp" data-c="${esc(n.body)}" type="button">Copiar</button><button class="btn small ed" data-id="${n.id}" type="button">Editar</button><button class="btn small rm" data-id="${n.id}" type="button">Borrar</button></div></div>`).join('') : `<div class="empty" style="grid-column:1/-1">${q ? 'Ninguna nota coincide.' : 'Todavía no tienes notas. Guarda aquí tu primer comando o procedimiento.'}</div>`;
      wireCp(list);
      $$('.ed', list).forEach(b => b.addEventListener('click', () => edit(TB.data.notas.find(n => n.id === b.dataset.id))));
      $$('.rm', list).forEach(b => twoTap(b, 'Borrar', async () => { TB.data.notas = TB.data.notas.filter(n => n.id !== b.dataset.id); await save('Nota borrada'); paint(''); }));
    };
    const save = async m => { tbTouch(); try { await tbSeal(); toast(m); } catch (e) { toast(e.message); } };
    function edit(n) {
      const x = n || { id: tbId(), t: '', lang: 'PowerShell', body: '', tags: [] };
      ed.innerHTML = `<section class="panel"><h3>${n ? 'Editar nota' : 'Nueva nota'}</h3><div class="ext-form"><div class="field wide"><label for="n-t">Título</label><input id="n-t" maxlength="150" value="${esc(x.t)}"></div>
        <div class="field"><label for="n-l">Tipo</label><select id="n-l">${['PowerShell', 'SQL', 'CMD', 'Bash', 'Python', 'Procedimiento', 'Texto'].map(l => `<option ${l === x.lang ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="n-g">Etiquetas (coma)</label><input id="n-g" value="${esc((x.tags || []).join(', '))}"></div>
        <div class="field wide"><label for="n-b">Contenido</label><textarea id="n-b" class="sql-ta" rows="8" maxlength="20000" spellcheck="false">${esc(x.body)}</textarea></div></div>
        <div class="row"><button class="btn primary sv" type="button">Guardar cifrado</button><button class="btn small cx" type="button">Cancelar</button></div></section>`;
      $('.cx', ed).addEventListener('click', () => { ed.innerHTML = ''; });
      $('.sv', ed).addEventListener('click', async () => {
        const t = $('#n-t', ed).value.trim().slice(0, 150), body = $('#n-b', ed).value.slice(0, 20000);
        if (!t || !body.trim()) return toast('Escribe un título y el contenido');
        Object.assign(x, { t, body, lang: $('#n-l', ed).value, tags: extTags($('#n-g', ed).value), at: Date.now() });
        if (!n) TB.data.notas.push(x);
        await save('Nota guardada y cifrada'); ed.innerHTML = ''; paint('');
      });
      $('#n-t', ed).focus();
    }
    $('.nw', top).addEventListener('click', () => edit(null));
    $('.nq', top).addEventListener('input', e => paint(extNorm(e.target.value)));
    $('.ex', top).addEventListener('click', () => extDownload(`mis-notas-${extDay()}.json`, JSON.stringify(TB.data.notas, null, 2)));
    paint('');
  }

  /* ----- bitácora cifrada ----- */
  function bit() {
    const B = TB.data.bitacora;
    const today = extDay(), wk = extDay(extWeekStart(new Date()));
    const weekMin = B.filter(b => b.d >= wk).reduce((a, b) => a + (+b.min || 0), 0);
    host.appendChild(h(`<p class="muted">Anota cada ticket o tarea: te sirve para tu reporte semanal, tu evaluación y para no olvidar cómo resolviste algo. Se guarda cifrada.</p>`));
    host.appendChild(h(`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))"><div class="tile"><div class="stat"><b>${B.filter(b => b.d === today).length}</b><span>Registros de hoy</span></div></div><div class="tile"><div class="stat"><b>${Math.round(weekMin / 6) / 10} h</b><span>Esta semana</span></div></div><div class="tile"><div class="stat"><b>${B.filter(b => b.est === 'abierto').length}</b><span>Pendientes abiertos</span></div></div></div>`));
    const form = h(`<section class="panel"><h3>Nuevo registro</h3><div class="ext-form">
      <div class="field"><label for="b-d">Fecha</label><input id="b-d" type="date" value="${today}"></div>
      <div class="field"><label for="b-t">Ticket o tarea</label><input id="b-t" maxlength="80" placeholder="INC-1234 / Alta de usuario"></div>
      <div class="field wide"><label for="b-q">Qué hice y cómo lo resolví</label><textarea id="b-q" rows="3" maxlength="2000"></textarea></div>
      <div class="field"><label for="b-m">Minutos</label><input id="b-m" type="number" min="0" max="1440" value="30"></div>
      <div class="field"><label for="b-e">Estado</label><select id="b-e"><option value="resuelto">Resuelto</option><option value="abierto">Abierto / en espera</option></select></div>
    </div><div class="row"><button class="btn primary sv" type="button">Guardar cifrado</button><button class="btn small csv" type="button">Exportar a CSV</button></div></section>`);
    host.appendChild(form);
    const list = h('<div class="tbl-wrap"></div>'); host.appendChild(list);
    const paint = () => {
      const xs = B.slice().sort((a, b) => b.d.localeCompare(a.d) || b.at - a.at).slice(0, 200);
      list.innerHTML = xs.length ? `<table class="addr"><tr><th>Fecha</th><th>Ticket</th><th>Qué hice</th><th>Min</th><th>Estado</th><th></th></tr>${xs.map(b => `<tr><td class="mono">${esc(b.d)}</td><td>${esc(b.t)}</td><td style="white-space:normal;min-width:220px">${esc(b.q)}</td><td class="mono">${b.min}</td><td><button class="linkish st" data-id="${b.id}" type="button">${b.est === 'abierto' ? '⏳ abierto' : '✓ resuelto'}</button></td><td><button class="btn small rm" data-id="${b.id}" type="button">Borrar</button></td></tr>`).join('')}</table>` : '<div class="empty">Sin registros todavía.</div>';
      $$('.st', list).forEach(b => b.addEventListener('click', async () => { const x = B.find(y => y.id === b.dataset.id); x.est = x.est === 'abierto' ? 'resuelto' : 'abierto'; await tbSeal(); paint(); }));
      $$('.rm', list).forEach(b => twoTap(b, 'Borrar', async () => { const i = B.findIndex(y => y.id === b.dataset.id); if (i >= 0) B.splice(i, 1); await tbSeal(); toast('Registro borrado'); paint(); }));
    };
    $('.sv', form).addEventListener('click', async () => {
      const q = $('#b-q', form).value.trim(); if (!q) return toast('Escribe qué hiciste');
      const d = extDate($('#b-d', form).value) || today, m = Math.max(0, Math.min(1440, +$('#b-m', form).value || 0));
      B.push({ id: tbId(), d, t: $('#b-t', form).value.trim().slice(0, 80), q: q.slice(0, 2000), min: m, est: $('#b-e', form).value, at: Date.now() });
      try { tbTouch(); await tbSeal(); toast('Registro guardado y cifrado'); $('#b-q', form).value = ''; $('#b-t', form).value = ''; paint(); } catch (e) { B.pop(); toast(e.message); }
    });
    $('.csv', form).addEventListener('click', () => { const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`; extDownload(`bitacora-${today}.csv`, '﻿' + [['Fecha', 'Ticket', 'Qué hice', 'Minutos', 'Estado']].concat(B.map(b => [b.d, b.t, b.q, b.min, b.est])).map(r => r.map(q).join(',')).join('\r\n'), 'text/csv'); });
    paint();
  }

  /* ----- candado ----- */
  function can() {
    const box = h(`<section class="panel"><h3>Cómo te protege</h3><ul class="list">
      <li>Tu contraseña no está escrita en el código público: el servidor guarda solo un hash y limita los intentos.</li>
      <li>Tus notas y bitácora se cifran con AES-256-GCM usando una llave que sale de tu contraseña. Sin ella no se pueden leer, ni en este equipo ni en la copia sincronizada.</li>
      <li>Se cierra solo tras ${TB_IDLE / 60000} minutos sin usarlo, al recargar la página o con el botón 🔒.</li>
      <li>Los comandos, el SQL y los atajos son material de referencia público, como el resto de la academia.</li></ul></section>`);
    host.appendChild(box);
    const ch = h(`<section class="panel"><h3>Cambiar la contraseña de tus notas</h3><p class="muted">Vuelve a cifrar tus notas con una contraseña nueva en este dispositivo (y en la copia sincronizada cuando se suba). Para cambiar también la que revisa el servidor la primera vez en un dispositivo nuevo, pídeselo a quien administra la academia.</p>
      <div class="ext-form"><div class="field"><label for="c-a">Contraseña actual</label><input id="c-a" type="password" autocomplete="current-password"></div><div class="field"><label for="c-n">Nueva (mínimo 8 caracteres)</label><input id="c-n" type="password" autocomplete="new-password"></div><div class="field"><label for="c-r">Repite la nueva</label><input id="c-r" type="password" autocomplete="new-password"></div></div>
      <div class="row"><button class="btn primary go" type="button">Cambiar y volver a cifrar</button><span class="muted cmsg" role="status"></span></div></section>`);
    host.appendChild(ch);
    $('.go', ch).addEventListener('click', async () => {
      const m = $('.cmsg', ch), a = $('#c-a', ch).value, n = $('#c-n', ch).value, r = $('#c-r', ch).value;
      m.style.color = 'var(--bad)';
      if (n.length < 8) return m.textContent = 'La nueva debe tener al menos 8 caracteres.';
      if (n !== r) return m.textContent = 'Las dos contraseñas nuevas no coinciden.';
      try { await tbOpenVault(a, tbState().vault); } catch (e) { return m.textContent = 'La contraseña actual no es correcta.'; }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      TB.key = await tbKey(n, salt, TB_ITER); TB.salt = salt; TB.it = TB_ITER;
      await tbSeal(true); m.style.color = 'var(--ok)'; m.textContent = 'Listo: tus notas quedaron cifradas con la nueva contraseña.';
      $$('input', ch).forEach(i => { i.value = ''; });
    });
  }
  draw();
}
