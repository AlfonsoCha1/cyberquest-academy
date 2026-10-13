/* ===== Términos de servicio y aviso de privacidad ===== */
const LEGAL_DATE = '12 de octubre de 2026';
const LEGAL = {
  terminos: { t: 'Términos de servicio', s: [
    ['Qué es CyberQuest Academy', 'Es una herramienta gratuita y comunitaria para aprender ciberseguridad. Todo ocurre en simulaciones dentro de tu navegador: las redes, terminales, bases de datos y casos son ficticios. Al usarla aceptas estos términos.'],
    ['Solo con fines educativos', 'El contenido es material de estudio general. No es asesoría profesional, legal ni de seguridad para tu empresa, y no garantiza aprobar un examen, conseguir un empleo ni proteger un sistema real.'],
    ['Uso responsable', 'Lo que aprendes aquí solo debe aplicarse en sistemas propios o con autorización escrita de su dueño. Está prohibido usarlo para acceder, dañar o espiar sistemas o personas sin permiso. Eres el único responsable de lo que hagas fuera de la academia.'],
    ['Contenido original y ejemplos ficticios', 'Las lecciones, preguntas y casos están escritos para este proyecto. Las empresas, personas, vacantes, IPs y datos de los ejemplos son inventados; cualquier parecido con la realidad es coincidencia. No incluimos exámenes ni materiales de terceros.'],
    ['Marcas y cursos de terceros', 'Google, Coursera, Cisco, NetAcad, CompTIA, AWS, Microsoft, Udemy, Docker, Linux, PostgreSQL, SQLite y otras marcas pertenecen a sus dueños. Este proyecto no está afiliado, patrocinado ni avalado por ellos. Los enlaces son solo referencia de estudio.'],
    ['Sin garantía', 'El servicio se ofrece "tal cual" y "según disponibilidad". Puede tener errores, cambiar o dejar de funcionar sin aviso. La sincronización en la nube es opcional y no garantiza conservar tu progreso: tu copia principal está en tu dispositivo.'],
    ['Límite de responsabilidad', 'En la medida que permita la ley, quienes mantienen este proyecto no responden por pérdidas o daños (incluida la pérdida de datos o de progreso) derivados del uso o de no poder usar la academia.'],
    ['Lo que no debes hacer', 'No intentes saturar, atacar o abusar del servicio ni de su API, ni usarlo para actividades ilegales.'],
    ['Cambios', 'Podemos actualizar estos términos. Seguir usando la academia después de un cambio significa que lo aceptas. La fecha de arriba indica la última revisión.']
  ] },
  privacidad: { t: 'Aviso de privacidad', s: [
    ['Resumen', 'No hay cuentas, ni anuncios, ni rastreadores. No pedimos nombre, correo ni teléfono.'],
    ['Lo que se guarda en tu dispositivo', 'Tu progreso (XP, respuestas, misiones, preferencias) y el último texto de vacante que pegaste se guardan en el almacenamiento local de tu navegador. Nunca salen de ahí, salvo que actives la sincronización. Puedes exportarlos o borrarlos en Progreso, o limpiando los datos del sitio.'],
    ['Texto de vacantes', 'El análisis de una vacante se hace en tu navegador. El texto no se envía a ningún servidor.'],
    ['Sincronización opcional', 'Si la usas, se envía al servidor solo tu progreso (XP, respuestas y misiones) y se te da un código tipo CQ-XXXX-XXXX-XXXX que funciona como contraseña: quien lo tenga puede leer y modificar esa copia, así que no lo compartas. Puedes borrar tu copia del servidor cuando quieras desde Progreso. No se guardan nombres ni correos.'],
    ['Datos técnicos que recibe el hosting', 'Como en cualquier sitio web, los proveedores que lo alojan (Vercel y Render) pueden registrar tu dirección IP, tipo de navegador y fecha de acceso por seguridad y funcionamiento. No usamos esos registros para identificarte. Las tipografías se cargan desde Google Fonts, lo que comparte tu IP con Google.'],
    ['Sin venta ni cesión de datos', 'No vendemos ni compartimos datos con terceros con fines comerciales ni de publicidad.'],
    ['Cookies', 'No usamos cookies de seguimiento. Usamos almacenamiento local del navegador y un service worker para que la app funcione sin Internet.'],
    ['Menores', 'La academia no está dirigida a menores de 13 años. Si eres menor, úsala con apoyo de un adulto.'],
    ['Tus derechos', 'Puedes consultar, exportar, corregir o borrar tus datos en cualquier momento desde Progreso. Como no tenemos tu identidad, no podemos recuperar un código perdido.'],
    ['Contacto y cambios', 'Para dudas o solicitudes abre un issue en el repositorio público del proyecto en GitHub. Si este aviso cambia, se actualiza la fecha de arriba.']
  ] }
};
VIEWS.legal = function (view) {
  let cur = ST.sub.legal || 'terminos';
  view.appendChild(h(`<div class="head"><span class="eyebrow">Legal</span><h1>Términos y privacidad</h1><p class="lead">Última actualización: ${LEGAL_DATE}.</p></div>`));
  const tabs = h('<div class="tabs" role="tablist"><button class="tab" data-t="terminos">Términos de servicio</button><button class="tab" data-t="privacidad">Aviso de privacidad</button></div>');
  const host = h('<div class="view" style="gap:12px"></div>');
  view.appendChild(tabs); view.appendChild(host);
  function draw() {
    ST.sub.legal = cur; saveStore();
    $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === cur)));
    host.innerHTML = LEGAL[cur].s.map(([t, p], i) => `<section class="panel"><h3>${i + 1}. ${esc(t)}</h3><p>${esc(p)}</p></section>`).join('');
  }
  $$('.tab', tabs).forEach(b => b.addEventListener('click', () => { cur = b.dataset.t; draw(); }));
  draw();
};
