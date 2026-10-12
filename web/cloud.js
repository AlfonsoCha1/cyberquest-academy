/* ===== Nube: sincronizar progreso entre dispositivos e instalar la app ===== */
const CFG = window.CQ_CONFIG || {};
const SYNC_KEY = 'cyberquest-sync';
let SYNC = { code: '', at: '' };
try { SYNC = Object.assign(SYNC, JSON.parse(localStorage.getItem(SYNC_KEY) || '{}')); } catch (e) { }
const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(SYNC)); } catch (e) { } };
const apiOk = () => !!CFG.apiUrl && !CFG.artifact && /^https?:$/.test(location.protocol);
const apiBase = () => String(CFG.apiUrl || '').replace(/\/$/, '');

async function api(path, opts) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 75000); // Render gratis tarda hasta ~1 min en despertar
  try {
    const r = await fetch(apiBase() + path, Object.assign({ signal: ctl.signal, headers: { 'content-type': 'application/json' } }, opts || {}));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Error ' + r.status);
    return j;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('El servidor tardó demasiado. Si estaba dormido, intenta otra vez en un minuto.');
    if (e instanceof TypeError) throw new Error('No hay conexión con el servidor. Tu progreso sigue guardado en este dispositivo.');
    throw e;
  } finally { clearTimeout(t); }
}

/* despertar el servidor en cuanto abre la app y subir cambios solos */
if (apiOk()) {
  fetch(apiBase() + '/health', { mode: 'cors' }).catch(() => { });
  const baseSave = saveStore; let tm = null;
  saveStore = function () { baseSave(); if (SYNC.code) { clearTimeout(tm); tm = setTimeout(() => pushNow(true), 8000); } };
}
async function pushNow(quiet) {
  if (!SYNC.code) return;
  try { const r = await api('/api/sync/' + SYNC.code, { method: 'PUT', body: JSON.stringify({ data: ST }) }); SYNC.at = r.updatedAt; saveSync(); if (!quiet) toast('Progreso subido a la nube'); }
  catch (e) { if (!quiet) toast(e.message); }
}

/* botón con confirmación de dos toques (los diálogos del navegador no siempre funcionan) */
function twoTap(btn, label, fn) {
  let armed = false;
  btn.addEventListener('click', () => {
    if (!armed) { armed = true; btn.textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { if (btn.isConnected) { armed = false; btn.textContent = label; } }, 3500); return; }
    armed = false; btn.textContent = label; fn();
  });
}
const fmtDate = s => { try { return new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return s; } };

function syncPanel() {
  const el = h('<section class="panel" id="sync"></section>');
  if (!apiOk()) {
    el.innerHTML = `<h2>Sincronizar entre dispositivos</h2><p class="muted">La sincronización funciona en la versión web${CFG.webUrl ? `: <a href="${esc(CFG.webUrl)}" target="_blank" rel="noopener">${esc(CFG.webUrl.replace(/^https?:\/\//, ''))}</a>` : ''}. Aquí usa Exportar e Importar para pasar tu progreso.</p>`;
    return el;
  }
  const busy = (b, on) => { b.disabled = on; if (on) b.dataset.t = b.textContent, b.textContent = 'Conectando…'; else if (b.dataset.t) b.textContent = b.dataset.t; };
  function draw() {
    if (SYNC.code) {
      el.innerHTML = `<div class="row" style="justify-content:space-between"><h2>Sincronizar entre dispositivos</h2><span class="chip ok">Conectado</span></div>
        <p class="muted">Tu código (guárdalo como una contraseña):</p>
        <div class="row"><code class="sync-code">${esc(SYNC.code)}</code><button class="btn small cp" type="button">Copiar</button></div>
        <p class="muted" style="font-size:.88rem">${SYNC.at ? 'Última subida: ' + esc(fmtDate(SYNC.at)) + '. ' : ''}Tus avances se suben solos unos segundos después de cada cambio. En tu otra compu o celular entra a Progreso y escribe este código.</p>
        <div class="row"><button class="btn small primary up" type="button">Subir ahora</button><button class="btn small down" type="button">Bajar de la nube</button><button class="btn small forget" type="button">Desconectar este dispositivo</button><button class="btn small rm" type="button">Borrar de la nube</button></div>
        <p class="muted note-st" style="font-size:.84rem"></p>`;
      $('.cp', el).addEventListener('click', () => copyText(SYNC.code, 'Código copiado'));
      $('.up', el).addEventListener('click', async e => { busy(e.target, true); await pushNow(false); busy(e.target, false); draw(); });
      twoTap($('.down', el), 'Bajar de la nube', async () => {
        try { const r = await api('/api/sync/' + SYNC.code); ST = Object.assign(blank(), r.data); saveStore(); SYNC.at = r.updatedAt; saveSync(); toast('Progreso descargado'); renderSideXp(); go('progreso'); }
        catch (e) { toast(e.message); }
      });
      $('.forget', el).addEventListener('click', () => { SYNC = { code: '', at: '' }; saveSync(); toast('Este dispositivo ya no se sincroniza'); draw(); });
      twoTap($('.rm', el), 'Borrar de la nube', async () => {
        try { await api('/api/sync/' + SYNC.code, { method: 'DELETE' }); } catch (e) { if (!/no existe/i.test(e.message)) return toast(e.message); }
        SYNC = { code: '', at: '' }; saveSync(); toast('Borrado del servidor. Tu progreso local sigue aquí.'); draw();
      });
    } else {
      el.innerHTML = `<h2>Sincronizar entre dispositivos</h2>
        <p class="muted">Sube tu progreso y recibe un código. Con ese código lo bajas en tu otra compu, en la laptop o en el celular. No se guarda tu nombre ni tu correo.</p>
        <div class="row"><button class="btn small primary new" type="button">Crear mi código y subir</button></div>
        <div class="field" style="max-width:420px"><label for="sync-in">¿Ya tienes un código?</label><div class="row"><input id="sync-in" placeholder="CQ-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" style="flex:1;min-width:0;font-family:var(--f-mono)"><button class="btn small get" type="button">Conectar y bajar</button></div></div>
        <p class="muted note-st" style="font-size:.84rem"></p>`;
      $('.new', el).addEventListener('click', async e => {
        busy(e.target, true);
        try { const r = await api('/api/sync', { method: 'POST', body: JSON.stringify({ data: ST }) }); SYNC = { code: r.code, at: r.updatedAt }; saveSync(); toast('Listo: progreso en la nube'); draw(); }
        catch (err) { toast(err.message); busy(e.target, false); }
      });
      $('.get', el).addEventListener('click', async e => {
        const code = $('#sync-in', el).value.trim().toUpperCase();
        if (!/^CQ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return toast('El código tiene la forma CQ-XXXX-XXXX-XXXX');
        busy(e.target, true);
        try { const r = await api('/api/sync/' + code); ST = Object.assign(blank(), r.data); SYNC = { code, at: r.updatedAt }; saveSync(); saveStore(); renderSideXp(); toast('Progreso descargado'); go('progreso'); }
        catch (err) { toast(err.message); busy(e.target, false); }
      });
    }
    api('/health').then(s => { const n = $('.note-st', el); if (n && s.storage !== 'postgres') n.textContent = 'Nota: el servidor gratuito puede reiniciarse y perder la copia de la nube. Tu progreso siempre queda en cada dispositivo; si pasa, solo vuelve a subirlo.'; }).catch(() => { });
  }
  draw();
  return el;
}
const baseProgreso = VIEWS.progreso;
VIEWS.progreso = function (view) { baseProgreso(view); view.appendChild(syncPanel()); };

/* ---------- instalar como app (PWA) ---------- */
let installEvt = null;
const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; const b = document.getElementById('installBtn'); if (b) b.hidden = false; });
window.addEventListener('appinstalled', () => { installEvt = null; toast('CyberQuest quedó instalada'); });
const swOk = () => 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !CFG.artifact;
if (swOk()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}

ICONS.app = '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>';
SECTIONS.push(['app', 'Instalar app']);
VIEWS.app = function (view) {
  const canHere = swOk();
  view.appendChild(h(`<div class="head"><span class="eyebrow">Descargar aplicación</span><h1>Instala CyberQuest en tus equipos</h1>
    <p class="lead">Es una app web: se instala desde el navegador, ocupa muy poco espacio, abre en su propia ventana y funciona sin Internet una vez cargada. Sirve igual en una PC viejita que en una potente.</p></div>`));
  let status;
  if (standalone()) status = '<div class="fb good"><h4>Ya la estás usando como app</h4><div>Puedes abrirla desde tu menú de inicio, escritorio o pantalla principal.</div></div>';
  else if (canHere) status = `<div class="row"><button class="btn primary" id="installBtn" type="button" ${installEvt ? '' : 'hidden'}>Instalar ahora</button><span class="muted">${installEvt ? 'Tu navegador permite instalarla con un clic.' : 'Si no ves el botón, usa los pasos de tu equipo aquí abajo.'}</span></div>`;
  else status = `<div class="note">Para instalarla, abre la versión web${CFG.webUrl ? `: <a href="${esc(CFG.webUrl)}" target="_blank" rel="noopener">${esc(CFG.webUrl.replace(/^https?:\/\//, ''))}</a>` : ''} y sigue los pasos de tu equipo.</div>`;
  const st = h(`<section class="panel hero"><h2>Estado</h2>${status}</section>`);
  view.appendChild(st);
  const ib = $('#installBtn', st);
  if (ib) ib.addEventListener('click', async () => { if (!installEvt) return toast('Usa el menú del navegador para instalarla'); installEvt.prompt(); const r = await installEvt.userChoice; if (r.outcome === 'accepted') toast('Instalando…'); installEvt = null; ib.hidden = true; });
  const steps = [
    ['Windows (Chrome o Edge)', ['Abre la app en Chrome o Edge.', 'En la barra de direcciones aparece un ícono de instalar (una pantalla con flecha). Haz clic.', 'Si no aparece: menú ⋮ → "Transmitir, guardar y compartir" → "Instalar página como aplicación" (en Edge: menú … → Aplicaciones → Instalar este sitio).', 'Queda en el menú Inicio y la puedes anclar a la barra de tareas.']],
    ['Android (Chrome)', ['Abre la app en Chrome.', 'Toca el aviso "Instalar app", o menú ⋮ → "Agregar a la pantalla principal" / "Instalar app".', 'Aparece un ícono como cualquier otra app.']],
    ['Linux y Kali', ['Con Chromium o Google Chrome: igual que en Windows, ícono de instalar en la barra de direcciones.', 'En Kali puedes instalar Chromium con: sudo apt install chromium', 'Firefox no instala apps web: ahí úsala como pestaña normal o márcala como favorito; funciona igual.']],
    ['iPhone y iPad (Safari)', ['Abre la app en Safari.', 'Toca Compartir → "Agregar a inicio".']]
  ];
  const g = h('<div class="grid wide"></div>');
  g.innerHTML = steps.map(([t, l]) => `<div class="tile"><h3>${esc(t)}</h3><ol class="list">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`).join('');
  view.appendChild(g);
  view.appendChild(h(`<section class="panel"><h2>Qué funciona sin Internet</h2>
    <div class="two" style="gap:16px"><div><span class="eyebrow">Sin Internet</span><ul class="list"><li>Laboratorio de redes, terminales y comandos</li><li>Security+, cursos, ramas, SOC e imprevistos</li><li>Quizzes, XP y progreso en ese equipo</li></ul></div>
    <div><span class="eyebrow">Necesita Internet</span><ul class="list"><li>Sincronizar progreso entre dispositivos</li><li>Abrir los enlaces de tus cursos</li><li>La profesora IA y la voz, cuando estén listas</li></ul></div></div>
    <p class="muted" style="font-size:.88rem">¿PC lenta? Activa el modo ligero (abajo en el menú o en Progreso): quita brillos y animaciones.</p></section>`));
};
