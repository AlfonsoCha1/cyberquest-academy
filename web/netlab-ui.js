/* ===== Laboratorio de redes: interfaz ===== */
const GLYPH = {
  pc: '<rect x="4" y="6" width="32" height="22" rx="2"/><path d="M14 35h12M20 28v7"/>',
  laptop: '<rect x="8" y="8" width="24" height="17" rx="2"/><path d="M3 31h34l-3-6H6z"/>',
  server: '<rect x="8" y="4" width="24" height="9" rx="2"/><rect x="8" y="15.5" width="24" height="9" rx="2"/><rect x="8" y="27" width="24" height="9" rx="2"/><path d="M13 8.5h.1M13 20h.1M13 31.5h.1"/>',
  printer: '<rect x="5" y="14" width="30" height="14" rx="2"/><path d="M12 14V5h16v9M12 24h16v11H12z"/>',
  switch: '<rect x="3" y="12" width="34" height="16" rx="3"/><path d="M10 17h18l-3-2.5M30 23H12l3 2.5"/>',
  ap: '<circle cx="20" cy="28" r="3.5"/><path d="M13 21a10 10 0 0 1 14 0M8 15.5a17 17 0 0 1 24 0M20 31.5V37"/>',
  router: '<circle cx="20" cy="20" r="15"/><path d="M20 9v8M17 12l3-3 3 3M20 31v-8M17 28l3 3 3-3M9 20h8M12 17l-3 3 3 3M31 20h-8M28 17l3 3-3 3"/>',
  firewall: '<rect x="4" y="8" width="32" height="24" rx="2"/><path d="M4 16h32M4 24h32M14 8v8M26 8v8M20 16v8M11 24v8M29 24v8"/>',
  internet: '<path d="M12 31h17a7 7 0 0 0 1-14 10 10 0 0 0-19-2.5A7.5 7.5 0 0 0 12 31z"/>'
};
const GCOLOR = { pc: '#9cc9ff', laptop: '#9cc9ff', server: '#9cc9ff', printer: '#9cc9ff', switch: '#b48cff', ap: '#b48cff', router: '#3fa2ff', firewall: '#ffc24a', internet: '#35e0a1' };
const ZCOLOR = { LAN: '#3fa2ff', DMZ: '#ffc24a', WAN: '#35e0a1' };

VIEWS.redes = function (view) {
  let mid = ST.sub.redes && MISSIONS.some(m => m.id === ST.sub.redes) ? ST.sub.redes : 'm1';
  let M, S, mode = 'move', sel = null, pending = null, drag = null, lastPing = null, history = [], lastChecks = null, tab = 'equipo', anim = null;

  view.appendChild(h(`<div class="head"><span class="eyebrow">Laboratorio · Redes</span><h1>Arma la red</h1>
    <p class="lead">Conecta equipos, configura sus IPs y prueba con ping. Cada falla te explica qué pasó, cómo arreglarlo y cómo se ve en un trabajo real.</p></div>`));
  const mtabs = h('<div class="tabs" role="tablist"></div>');
  view.appendChild(mtabs);
  const lab = h(`<div class="lab">
    <section class="panel mis" aria-label="Misión"></section>
    <section class="stage">
      <div class="toolbar" role="toolbar" aria-label="Herramientas">
        <button class="tool" data-mode="move">Mover</button><button class="tool" data-mode="cable">Cable</button>
        <button class="tool" data-mode="ping">Ping</button><button class="tool" data-mode="delete">Borrar</button><span class="sep"></span>
        ${Object.keys(GLYPH).map(t => `<button class="tool add" data-add="${t}" title="Agregar ${NET.LABEL[t]}"><svg viewBox="0 0 40 40" class="glyph" style="stroke:${GCOLOR[t]};fill:none;stroke-width:2.6">${GLYPH[t]}</svg>${NET.LABEL[t]}</button>`).join('')}
      </div>
      <div class="canvas-wrap"><svg viewBox="0 0 1000 600" role="img" aria-label="Diagrama de red"><g class="zones"></g><g class="wires"></g><g class="nodes"></g><g class="pk"></g></svg><div class="hintbar"></div></div>
    </section>
    <section class="panel insp" aria-label="Inspector">
      <div class="tabs" role="tablist"><button class="tab" data-tab="equipo">Equipo</button><button class="tab" data-tab="consola">Consola</button><button class="tab" data-tab="tabla">Tabla IP</button></div>
      <div class="insp-body"></div>
    </section></div>`);
  view.appendChild(lab);
  const svg = $('.canvas-wrap svg', lab), gZ = $('.zones', svg), gW = $('.wires', svg), gN = $('.nodes', svg), gP = $('.pk', svg);
  const hintbar = $('.hintbar', lab), wrapEl = $('.canvas-wrap', lab), mis = $('.mis', lab), body = $('.insp-body', lab);

  const persist = () => { ST.netState[mid] = S; saveStore(); };
  const D = id => NET.dev(S, id);
  const hintsUsed = () => ST.sub['hints:' + mid] || 0;

  function loadMission(id, fresh) {
    mid = id; ST.sub.redes = id; M = MISSIONS.find(m => m.id === id);
    S = (!fresh && ST.netState[id]) ? ST.netState[id] : buildMission(M);
    if (fresh) { ST.netState[id] = S; ST.sub['hints:' + id] = 0; }
    sel = null; pending = null; lastPing = null; lastChecks = null; history = [];
    saveStore(); drawTabs(); drawMission(); draw(); setMode('move'); setTab('equipo');
  }
  function drawTabs() {
    mtabs.innerHTML = MISSIONS.map((m, i) => `<button class="tab" role="tab" aria-selected="${m.id === mid}" data-m="${m.id}">${m.free ? 'Libre' : (i + 1) + '. ' + esc(m.title)}${ST.net[m.id] ? ' ✓' : ''}</button>`).join('');
    $$('.tab', mtabs).forEach(b => b.addEventListener('click', () => loadMission(b.dataset.m)));
  }

  /* ---------- misión ---------- */
  function checkText(c) {
    const a = D(c.from), b = D(c.to);
    return `${esc(a ? a.name : c.from)} → ${esc(b ? b.name : c.to)}: ${c.expect === 'ok' ? 'debe responder' : c.expect === 'blocked' ? 'debe salir BLOQUEADO' : 'NO debe llegar'}`;
  }
  function drawMission() {
    const done = ST.net[mid];
    const hu = hintsUsed();
    mis.innerHTML = `<div class="row"><span class="chip plasma">${esc(M.level)}</span><span class="chip">${esc(M.time)}</span>${M.ticket ? '<span class="chip warn">Ticket</span>' : ''}${done ? `<span class="chip ok">Completada · ${done} pts</span>` : ''}</div>
      <h2>${esc(M.title)}</h2><p>${esc(M.story)}</p>
      <div><span class="eyebrow">Objetivo</span><p style="color:var(--ink)">${esc(M.goal)}</p></div>
      ${M.checks.length ? `<ul class="checks">${M.checks.map((c, i) => `<li><span class="dot ${lastChecks ? (lastChecks[i].pass ? 'ok' : 'bad') : ''}"></span><span>${checkText(c)}</span></li>`).join('')}</ul>
      <div class="row"><button class="btn primary vf">Verificar misión</button></div>` : ''}
      <div class="row"><button class="btn small hb" ${hu >= M.hints.length ? 'disabled' : ''}>Pista ${hu}/${M.hints.length}${M.free ? '' : ' (−15 pts)'}</button><button class="btn small rs">Reiniciar</button></div>
      ${hu ? `<ol class="list">${M.hints.slice(0, hu).map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      <div class="done-slot"></div>`;
    const vf = $('.vf', mis); if (vf) vf.addEventListener('click', verify);
    $('.hb', mis).addEventListener('click', () => { ST.sub['hints:' + mid] = hu + 1; saveStore(); drawMission(); });
    const rs = $('.rs', mis);
    rs.addEventListener('click', () => {
      if (rs.dataset.armed) { loadMission(mid, true); toast('Misión reiniciada'); return; }
      rs.dataset.armed = '1'; rs.textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { if (rs.isConnected) { delete rs.dataset.armed; rs.textContent = 'Reiniciar'; } }, 3500);
    });
    if (done && M.learn) showDone(false);
  }
  function showDone(fresh) {
    const slot = $('.done-slot', mis);
    const idx = MISSIONS.findIndex(m => m.id === mid), next = MISSIONS[idx + 1];
    slot.innerHTML = `<div class="fb good"><h4>${fresh ? 'Misión completada' : 'Lo que aprendiste'}</h4><div>${esc(M.learn)}</div>
      ${M.real ? `<div><span class="lbl">En el trabajo real</span>${esc(M.real)}</div>` : ''}
      ${next ? `<div class="row"><button class="btn primary nm">Siguiente: ${esc(next.title)}</button></div>` : ''}</div>`;
    const nm = $('.nm', slot); if (nm) nm.addEventListener('click', () => loadMission(next.id));
  }
  function verify() {
    lastChecks = NET.runChecks(S, M.checks);
    const all = lastChecks.every(r => r.pass);
    if (all) {
      const score = Math.max(40, 100 - 15 * hintsUsed());
      const prev = ST.net[mid];
      ST.net[mid] = Math.max(prev || 0, score); saveStore();
      addXP(prev ? 10 : score, 'Misión: ' + M.title);
      drawTabs(); drawMission(); showDone(true);
    } else {
      drawMission();
      const bad = lastChecks.find(r => !r.pass);
      showPing(bad.r, bad.c.from, bad.c.to, bad.c.expect);
      toast('Aún no: revisa la Consola para ver qué falla');
    }
  }

  /* ---------- dibujo ---------- */
  function ipLabel(d) {
    const k = NET.KIND[d.type];
    if (k === 'l2') return { t: 'capa 2', bad: false };
    if (d.type === 'internet') return { t: '8.8.8.8', bad: false };
    const ps = NET.l3Ports(d);
    if (k === 'host') { const p = d.ports[0]; if (!p.ip) return { t: 'sin IP', bad: false }; const c = NET.hostCheck(p.ip, p.mask); return c.ok ? { t: p.ip.trim() + '/' + NET.parseMask(p.mask).bits, bad: false } : { t: p.ip.trim() || 'sin IP', bad: true }; }
    return { t: ps.length ? `${ps.length} interfaz${ps.length > 1 ? 'es' : ''} con IP` : 'sin IP', bad: false };
  }
  function draw() {
    // zonas del firewall
    let z = '';
    S.devices.filter(d => d.type === 'firewall').forEach(f => f.ports.forEach(p => {
      const seg = NET.segment(S, f.id, p.name); if (!seg.linked) return;
      const ids = new Set(); seg.endpoints.forEach(e => { ids.add(e.dev); e.via.forEach(v => ids.add(v.id)); });
      const l = NET.linkAt(S, f.id, p.name), o = NET.otherEnd(l, f.id, p.name); ids.add(o.dev); ids.delete(f.id);
      const pts = [...ids].map(D).filter(Boolean); if (!pts.length) return;
      const x0 = Math.min(...pts.map(d => d.x)) - 58, x1 = Math.max(...pts.map(d => d.x)) + 58, y0 = Math.min(...pts.map(d => d.y)) - 58, y1 = Math.max(...pts.map(d => d.y)) + 80;
      const zn = NET.ZONE[p.name], c = ZCOLOR[zn];
      z += `<rect class="zone" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="18" style="stroke:${c}"/><text class="zone-t" x="${x0 + 12}" y="${y0 + 18}" style="fill:${c}">${zn}</text>`;
    }));
    gZ.innerHTML = z;
    gW.innerHTML = S.links.map(l => {
      const a = D(l.a.dev), b = D(l.b.dev); if (!a || !b) return '';
      const wifi = NET.isWifi(l.a.port) || NET.isWifi(l.b.port);
      const lab = (d, port, o) => {
        if (NET.KIND[d.type] === 'host' || d.type === 'internet') return '';
        const len = Math.hypot(o.x - d.x, o.y - d.y) || 1, t = Math.min(0.42, 62 / len);
        const x = d.x + (o.x - d.x) * t, y = d.y + (o.y - d.y) * t;
        return `<circle class="led" cx="${x}" cy="${y}" r="3.5"/><text class="plabel" x="${x}" y="${y - 8}">${esc(port)}</text>`;
      };
      return `<g data-link="${l.id}"><line class="wire${wifi ? ' wifi' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><line class="wire-hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>${lab(a, l.a.port, b)}${lab(b, l.b.port, a)}</g>`;
    }).join('');
    gN.innerHTML = S.devices.map(d => {
      const ip = ipLabel(d);
      return `<g class="node${d.id === sel ? ' sel' : ''}${d.id === pending ? ' pick' : ''}" data-id="${d.id}" transform="translate(${d.x},${d.y})" tabindex="0" role="button" aria-label="${esc(d.name)}">
        <rect class="badge" x="-32" y="-32" width="64" height="64" rx="14"/>
        <g class="glyph" transform="translate(-20,-20)" style="stroke:${GCOLOR[d.type]}">${GLYPH[d.type]}</g>
        <text class="nm" y="50">${esc(d.name)}</text><text class="ip${ip.bad ? ' bad' : ''}" y="65">${esc(ip.t)}</text></g>`;
    }).join('');
  }
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const HINTS = { move: 'Arrastra los equipos. Toca uno para ver qué es y configurarlo.', cable: 'Toca el primer equipo y después el segundo para conectarlos.', ping: 'Toca el equipo que envía el ping y después el que lo recibe.', delete: 'Toca un equipo o un cable para borrarlo.' };
  function setMode(m) {
    mode = m; pending = null;
    $$('[data-mode]', lab).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    hintbar.textContent = HINTS[m]; closePicker(); draw();
  }
  $$('[data-mode]', lab).forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $$('[data-add]', lab).forEach(b => b.addEventListener('click', () => addDevice(b.dataset.add)));

  function addDevice(type) {
    const base = NET.LABEL[type].replace(' ', '');
    let n = S.devices.filter(d => d.type === type).length + 1, name = `${base}-${n}`;
    while (S.devices.some(d => d.name === name)) name = `${base}-${++n}`;
    let id = type + Date.now().toString(36);
    let x = 500, y = 300, tries = 0;
    while (tries++ < 40 && S.devices.some(d => Math.hypot(d.x - x, d.y - y) < 110)) { x = 120 + Math.random() * 760; y = 90 + Math.random() * 420; }
    S.devices.push(NET.makeDevice(type, id, name, Math.round(x), Math.round(y)));
    sel = id; persist(); draw(); setTab('equipo');
  }

  svg.addEventListener('pointerdown', e => {
    const n = e.target.closest('.node');
    if (n && mode === 'move') {
      const d = D(n.dataset.id), p = pt(e);
      drag = { id: d.id, dx: p.x - d.x, dy: p.y - d.y, moved: false };
      svg.setPointerCapture(e.pointerId);
    }
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const d = D(drag.id), p = pt(e);
    const nx = Math.max(40, Math.min(960, p.x - drag.dx)), ny = Math.max(40, Math.min(530, p.y - drag.dy));
    if (Math.abs(nx - d.x) + Math.abs(ny - d.y) > 2) drag.moved = true;
    d.x = Math.round(nx); d.y = Math.round(ny); draw();
  });
  svg.addEventListener('pointerup', e => {
    if (drag) { const id = drag.id, moved = drag.moved; drag = null; persist(); if (!moved) select(id); return; }
    const n = e.target.closest('.node'), w = e.target.closest('[data-link]');
    if (n) nodeClick(n.dataset.id);
    else if (w && mode === 'delete') { S.links = S.links.filter(l => l.id !== w.dataset.link); persist(); draw(); toast('Cable quitado'); }
    else if (!n && mode === 'move') { sel = null; draw(); if (tab === 'equipo') renderInsp(); }
  });
  svg.addEventListener('keydown', e => { const n = e.target.closest('.node'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nodeClick(n.dataset.id); } });

  function select(id) { sel = id; draw(); setTab('equipo'); }
  function nodeClick(id) {
    const d = D(id);
    if (mode === 'move') return select(id);
    if (mode === 'delete') {
      if (d.locked) return toast('Este equipo es parte de la misión: puedes quitarle cables, pero no borrarlo');
      S.devices = S.devices.filter(x => x.id !== id); S.links = S.links.filter(l => l.a.dev !== id && l.b.dev !== id);
      if (sel === id) sel = null; persist(); draw(); renderInsp(); return;
    }
    if (!pending) { pending = id; draw(); hintbar.textContent = mode === 'cable' ? `Cable desde ${d.name}: ahora toca el otro equipo.` : `Ping desde ${d.name}: ahora toca el destino.`; return; }
    const a = pending; pending = null; hintbar.textContent = HINTS[mode];
    if (mode === 'cable') connect(a, id); else runPing(a, id);
    draw();
  }

  /* ---------- cables ---------- */
  let picker = null;
  function closePicker() { if (picker) { picker.remove(); picker = null; } }
  function defaultPort(dev, opts, other) {
    if (dev.type === 'firewall') { if (other.type === 'internet' && opts.includes('outside')) return 'outside'; const pref = ['inside', 'dmz', 'outside'].find(p => opts.includes(p)); return pref; }
    if (dev.type === 'router' && other.type === 'internet') return opts[opts.length - 1];
    return opts[0];
  }
  function connect(aId, bId) {
    const r = NET.canConnect(S, aId, bId);
    if (!r.ok) { toast(r.msg); return; }
    const A = D(aId), B = D(bId);
    const pa = defaultPort(A, r.optsA, B), pb = defaultPort(B, r.optsB, A);
    const chooseA = ['router', 'firewall'].includes(A.type) && r.optsA.length > 1;
    const chooseB = ['router', 'firewall'].includes(B.type) && r.optsB.length > 1;
    const make = (x, y) => { S.links.push({ id: 'L' + Date.now().toString(36), a: { dev: aId, port: x }, b: { dev: bId, port: y } }); persist(); draw(); if (sel && tab === 'equipo') renderInsp(); toast(`Conectado: ${A.name} (${x}) ↔ ${B.name} (${y})`); };
    if (!chooseA && !chooseB) return make(pa, pb);
    closePicker();
    const sel1 = (d, opts, def, id) => `<div class="field"><label for="${id}">Interfaz de ${esc(d.name)}</label><select id="${id}">${opts.map(o => `<option ${o === def ? 'selected' : ''} value="${o}">${o}${d.type === 'firewall' ? ' (' + NET.ZONE[o] + ')' : ''}</option>`).join('')}</select></div>`;
    picker = h(`<div class="picker"><strong>¿Qué interfaz usas?</strong>
      <p class="muted" style="font-size:.85rem">Cada interfaz de un ${chooseA ? NET.LABEL[A.type] : NET.LABEL[B.type]} es una red distinta.${(A.type === 'firewall' || B.type === 'firewall') ? ' En el firewall, inside = LAN, dmz = DMZ, outside = Internet.' : ''}</p>
      <div class="two">${chooseA ? sel1(A, r.optsA, pa, 'pk-a') : ''}${chooseB ? sel1(B, r.optsB, pb, 'pk-b') : ''}</div>
      <div class="row"><button class="btn primary small ok">Conectar</button><button class="btn small no">Cancelar</button></div></div>`);
    wrapEl.appendChild(picker);
    $('.ok', picker).addEventListener('click', () => { const x = chooseA ? $('#pk-a', picker).value : pa, y = chooseB ? $('#pk-b', picker).value : pb; closePicker(); make(x, y); });
    $('.no', picker).addEventListener('click', closePicker);
  }

  /* ---------- ping ---------- */
  function runPing(a, b) {
    const r = NET.ping(S, a, b);
    showPing(r, a, b);
    animate(r);
  }
  function showPing(r, a, b, expect) {
    const A = D(a), B = D(b);
    lastPing = { r, a: A ? A.name : a, b: B ? B.name : b, expect };
    history.unshift(`${lastPing.a} → ${lastPing.b}: ${r.status === 'ok' ? 'responde' : r.status === 'blocked' ? 'bloqueado' : 'falla'}`); history = history.slice(0, 6);
    setTab('consola');
  }
  function animate(r) {
    if (anim) cancelAnimationFrame(anim); gP.innerHTML = '';
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const legs = [];
    r.steps.forEach(s => { if (s.path.length > 1) legs.push({ pts: s.path.map(D).filter(Boolean).map(d => [d.x, d.y]), back: s.back }); });
    if (!legs.length) return;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '7'); gP.appendChild(dot);
    const segs = []; legs.forEach(l => { for (let i = 0; i + 1 < l.pts.length; i++) segs.push({ a: l.pts[i], b: l.pts[i + 1], back: l.back }); });
    let k = 0, t0 = null;
    const step = ts => {
      if (!t0) t0 = ts; const sg = segs[k]; const len = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]) || 1; const dur = Math.max(260, len * 1.6);
      const u = Math.min(1, (ts - t0) / dur);
      dot.setAttribute('cx', sg.a[0] + (sg.b[0] - sg.a[0]) * u); dot.setAttribute('cy', sg.a[1] + (sg.b[1] - sg.a[1]) * u);
      dot.setAttribute('class', 'packet' + (sg.back ? ' back' : ''));
      if (u >= 1) { k++; t0 = null; if (k >= segs.length) { setTimeout(() => { gP.innerHTML = ''; }, 500); anim = null; return; } }
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  /* ---------- inspector ---------- */
  function setTab(t) {
    tab = t; $$('.insp .tab', lab).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    renderInsp();
  }
  $$('.insp .tab', lab).forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  const peer = (d, port) => { const l = NET.linkAt(S, d.id, port); if (!l) return 'sin cable'; const o = NET.otherEnd(l, d.id, port), od = D(o.dev); return `→ ${od ? od.name : '?'} (${o.port})`; };
  function hostMsg(d) {
    const p = d.ports[0], out = [];
    if (p.ip || p.mask) { const c = NET.hostCheck(p.ip, p.mask); out.push(c.ok ? `<span class="msg okm">Red: ${NET.netStr(p.ip, p.mask)}</span>` : `<span class="msg">${esc(c.msg)}</span>`); }
    const g = NET.gwCheck(p.ip, p.mask, d.gw); if (!g.ok) out.push(`<span class="msg">${esc(g.msg)}</span>`);
    const dup = NET.dupIps(S)[(p.ip || '').trim()]; if (dup) out.push(`<span class="msg">IP repetida en: ${esc(dup.join(', '))}</span>`);
    return out.join('<br>');
  }
  function ifaceMsg(d, p) {
    if (!p.ip && !p.mask) return '';
    const c = NET.hostCheck(p.ip, p.mask);
    const dup = c.ok && NET.dupIps(S)[p.ip.trim()];
    return c.ok ? `<span class="msg okm">Red ${NET.netStr(p.ip, p.mask)}</span>${dup ? `<br><span class="msg">IP repetida en: ${esc(dup.join(', '))}</span>` : ''}` : `<span class="msg">${esc(c.msg)}</span>`;
  }
  function gwMsg(d) {
    if (!d.gw || !d.gw.trim()) return '';
    if (NET.ipToInt(d.gw) === null) return '<span class="msg">Formato inválido.</span>';
    return NET.l3Ports(d).some(p => NET.sameNet(p.ip, d.gw, p.mask)) ? '<span class="msg okm">Siguiente salto alcanzable.</span>' : '<span class="msg">Ese salto no está en la red de ninguna interfaz.</span>';
  }
  function renderInsp() {
    if (tab === 'consola') return renderConsole();
    if (tab === 'tabla') return renderTable();
    const d = sel && D(sel);
    if (!d) {
      body.innerHTML = `<h3>Conoce los equipos</h3><p class="muted">Toca un equipo del diagrama para configurarlo, o abre una ficha:</p>
        ${Object.keys(NETINFO).map(t => `<details class="acc"><summary><span class="row"><svg viewBox="0 0 40 40" width="22" height="22" style="stroke:${GCOLOR[t]};fill:none;stroke-width:2.6">${GLYPH[t]}</svg>${NET.LABEL[t]}</span></summary><div class="acc-body">${infoHtml(t)}</div></details>`).join('')}`;
      return;
    }
    const k = NET.KIND[d.type];
    let cfg = '';
    if (k === 'host') {
      const p = d.ports[0];
      cfg = `<div class="iface"><div class="iface-h"><span>${p.name}</span><span class="muted">${esc(peer(d, p.name))}</span></div>
        <div class="field"><label for="f-ip">Dirección IP</label><input id="f-ip" data-f="ip" value="${esc(p.ip)}" placeholder="192.168.1.10" inputmode="decimal" autocomplete="off"></div>
        <div class="two"><div class="field"><label for="f-mask">Máscara</label><input id="f-mask" data-f="mask" value="${esc(p.mask)}" placeholder="255.255.255.0 o /24" autocomplete="off"></div>
        <div class="field"><label for="f-gw">Puerta de enlace</label><input id="f-gw" data-f="gw" value="${esc(d.gw)}" placeholder="192.168.1.1" inputmode="decimal" autocomplete="off"></div></div>
        <div class="field hm">${hostMsg(d)}</div></div>`;
    } else if (k === 'router' || k === 'firewall') {
      cfg = d.ports.map((p, i) => `<div class="iface"><div class="iface-h"><span>${p.name}${k === 'firewall' ? ` <span class="chip" style="color:${ZCOLOR[NET.ZONE[p.name]]}">${NET.ZONE[p.name]}</span>` : ''}</span><span class="muted">${esc(peer(d, p.name))}</span></div>
        <div class="two"><div class="field"><label for="f-ip${i}">IP</label><input id="f-ip${i}" data-pi="${i}" data-f="ip" value="${esc(p.ip)}" autocomplete="off" inputmode="decimal"></div>
        <div class="field"><label for="f-mk${i}">Máscara</label><input id="f-mk${i}" data-pi="${i}" data-f="mask" value="${esc(p.mask)}" autocomplete="off" placeholder="/24"></div></div>
        <div class="field im${i}">${ifaceMsg(d, p)}</div></div>`).join('') +
        `<div class="field"><label for="f-gw">Ruta por defecto (siguiente salto)</label><input id="f-gw" data-f="gw" value="${esc(d.gw)}" placeholder="203.0.113.1" autocomplete="off" inputmode="decimal"><div class="gm">${gwMsg(d)}</div></div>
        ${k === 'firewall' ? `<div class="panel" style="padding:12px"><strong>Política (conexiones nuevas)</strong><table class="addr"><tr><td>LAN → WAN</td><td class="mono" style="color:var(--ok)">permitido</td></tr><tr><td>LAN → DMZ</td><td class="mono" style="color:var(--ok)">permitido</td></tr><tr><td>DMZ → WAN</td><td class="mono" style="color:var(--ok)">permitido</td></tr><tr><td>DMZ → LAN</td><td class="mono" style="color:var(--bad)">denegado</td></tr><tr><td>WAN → LAN / DMZ</td><td class="mono" style="color:var(--bad)">denegado</td></tr></table><p class="muted" style="font-size:.84rem">Las respuestas siempre regresan: el firewall es stateful.</p></div>` : ''}`;
    } else if (k === 'l2') {
      cfg = `<p class="note">No necesita IP: reenvía tramas con direcciones MAC.</p><table class="addr"><tr><th>Puerto</th><th>Conectado a</th></tr>${d.ports.map(p => `<tr><td class="mono">${p.name}</td><td>${esc(peer(d, p.name).replace('→ ', ''))}</td></tr>`).join('')}</table>`;
    } else {
      cfg = `<dl class="dl"><dt>Puerta del ISP</dt><dd class="mono">203.0.113.1/24</dd><dt>Servidor de prueba</dt><dd class="mono">8.8.8.8</dd><dt>Puerto</dt><dd>${esc(peer(d, 'isp'))}</dd></dl>`;
    }
    body.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip" style="color:${GCOLOR[d.type]}">${NET.LABEL[d.type]}</span>${d.locked ? '<span class="chip">De la misión</span>' : ''}</div>
      <div class="field"><label for="f-name">Nombre</label><input id="f-name" value="${esc(d.name)}" ${d.type === 'internet' ? 'disabled' : ''} autocomplete="off"></div>
      ${cfg}
      <details class="acc"><summary>¿Qué es un ${NET.LABEL[d.type]}?</summary><div class="acc-body">${infoHtml(d.type)}</div></details>`;
    const nm = $('#f-name', body); nm.addEventListener('input', () => { d.name = nm.value.slice(0, 24) || d.name; persist(); draw(); });
    $$('input[data-f]', body).forEach(inp => inp.addEventListener('input', () => {
      const f = inp.dataset.f, v = inp.value.trim();
      if (f === 'gw') d.gw = v; else { const p = inp.dataset.pi != null ? d.ports[+inp.dataset.pi] : d.ports[0]; p[f] = v; }
      persist(); draw();
      if (k === 'host') $('.hm', body).innerHTML = hostMsg(d);
      else { d.ports.forEach((p, i) => { const m = $('.im' + i, body); if (m) m.innerHTML = ifaceMsg(d, p); }); const g = $('.gm', body); if (g) g.innerHTML = gwMsg(d); }
    }));
  }
  function infoHtml(t) {
    const x = NETINFO[t];
    return `<p style="color:var(--ink)">${esc(x.que)}</p><dl class="dl"><dt>Capa</dt><dd>${esc(x.capa)}</dd><dt>En la empresa</dt><dd>${esc(x.empresa)}</dd><dt>Seguridad</dt><dd>${esc(x.seg)}</dd></dl>`;
  }
  function renderConsole() {
    if (!lastPing) { body.innerHTML = '<div class="empty">Usa la herramienta Ping: toca el equipo que envía y luego el que recibe. Aquí verás el viaje del paquete paso a paso.</div>'; return; }
    const { r, a, b, expect } = lastPing;
    const verdict = r.status === 'ok' ? ['good', 'Ping exitoso'] : r.status === 'blocked' ? [expect === 'blocked' ? 'good' : 'bad', 'Bloqueado por el firewall'] : ['bad', 'El ping falló'];
    const cls = s => s.kind === 'block' ? 'block' : s.kind === 'nat' ? 'nat' : s.back ? 'back' : '';
    body.innerHTML = `<div class="fb ${verdict[0]}"><h4>${verdict[1]}</h4><span class="mono">${esc(a)} → ${esc(b)}</span>
      ${expect ? `<span class="muted">Se esperaba: ${expect === 'ok' ? 'que respondiera' : expect === 'blocked' ? 'que saliera bloqueado' : 'que NO llegara'}</span>` : ''}</div>
      <div class="trace"><ol>${r.steps.map(s => `<li class="${cls(s)}">${esc(s.text)}</li>`).join('')}</ol></div>
      ${r.err ? `<div class="fb ${r.status === 'blocked' && expect === 'blocked' ? 'good' : 'bad'}"><h4>${esc(r.err.title)}</h4>
        ${r.err.why ? `<div><span class="lbl">Por qué</span>${esc(r.err.why)}</div>` : ''}${r.err.fix ? `<div><span class="lbl">Cómo arreglarlo</span>${esc(r.err.fix)}</div>` : ''}${r.err.real ? `<div><span class="lbl">En el trabajo real</span>${esc(r.err.real)}</div>` : ''}</div>` : ''}
      ${history.length > 1 ? `<div><span class="eyebrow">Historial</span><ul class="list">${history.slice(1).map(x => `<li class="mono" style="font-size:.82rem">${esc(x)}</li>`).join('')}</ul></div>` : ''}`;
  }
  function tableRows() {
    const rows = [];
    S.devices.forEach(d => {
      const k = NET.KIND[d.type]; if (k === 'l2') return;
      const ps = k === 'host' || d.type === 'internet' ? [d.ports[0]] : d.ports.filter(p => p.ip || NET.linkAt(S, d.id, p.name));
      ps.forEach(p => {
        const m = NET.parseMask(p.mask || '');
        rows.push([d.name, p.name, p.ip ? p.ip + (m ? '/' + m.bits : '') : '—', d.type === 'internet' ? '—' : (d.gw || '—'), peer(d, p.name).replace('→ ', '')]);
      });
    });
    return rows;
  }
  function renderTable() {
    const rows = tableRows();
    body.innerHTML = `<p class="muted">Tabla de direccionamiento: así se documenta una red en una empresa.</p>
      <div class="tbl-wrap"><table class="addr"><tr><th>Equipo</th><th>Interfaz</th><th>IP</th><th>Gateway / ruta</th><th>Conectado a</th></tr>
      ${rows.map(r => `<tr><td>${esc(r[0])}</td><td class="mono">${esc(r[1])}</td><td class="mono">${esc(r[2])}</td><td class="mono">${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('')}</table></div>
      <div class="row"><button class="btn small cp">Copiar tabla</button></div>
      <div class="panel" style="padding:14px"><h3>Cómo se hace un buen diagrama</h3><ul class="list">
      <li>Cada equipo con nombre (hostname) y función.</li><li>Cada cable con la interfaz de cada lado (Gi0/0, Fa0/1).</li>
      <li>Cada red con su dirección y máscara (192.168.1.0/24) y su zona (LAN, DMZ, WAN).</li><li>Una leyenda de iconos y la fecha de la última actualización.</li></ul></div>`;
    $('.cp', body).addEventListener('click', () => copyText(['Equipo\tInterfaz\tIP\tGateway\tConectado a', ...rows.map(r => r.join('\t'))].join('\n'), 'Tabla copiada'));
  }

  loadMission(mid);
};
