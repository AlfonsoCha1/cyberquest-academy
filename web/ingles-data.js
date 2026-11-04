/* ===== Inglés técnico para TI y ciberseguridad (contenido original) ===== */
/* [inglés, español, ejemplo en inglés] */
const EN_VOCAB = {
  'Soporte y operación': [
    ['ticket', 'ticket, caso de soporte', 'I opened a ticket for the printer issue.'],
    ['to troubleshoot', 'diagnosticar y resolver una falla', 'Let me troubleshoot the connection first.'],
    ['issue', 'problema, falla', 'The issue started after the update.'],
    ['workaround', 'solución temporal', 'We have a workaround until the patch is ready.'],
    ['to escalate', 'escalar (pasar a un nivel superior)', 'I will escalate this to the network team.'],
    ['outage', 'caída del servicio', 'The email outage lasted two hours.'],
    ['downtime', 'tiempo fuera de servicio', 'The upgrade needs thirty minutes of downtime.'],
    ['to reboot', 'reiniciar', 'Please reboot your laptop and try again.'],
    ['to roll back', 'regresar a la versión anterior', 'The update failed, so we rolled it back.'],
    ['password reset', 'restablecimiento de contraseña', 'I sent you a password reset link.'],
    ['locked out', 'con la cuenta bloqueada', 'The user is locked out after five failed attempts.'],
    ['root cause', 'causa raíz', 'We found the root cause: an expired certificate.']
  ],
  'Ciberseguridad': [
    ['threat', 'amenaza', 'Phishing is the most common threat for our users.'],
    ['vulnerability', 'vulnerabilidad', 'This vulnerability allows remote code execution.'],
    ['breach', 'brecha, filtración', 'The breach exposed customer emails.'],
    ['to mitigate', 'mitigar, reducir el riesgo', 'We mitigated the risk by blocking the port.'],
    ['to remediate', 'corregir de fondo', 'The team must remediate critical findings in 15 days.'],
    ['false positive', 'falso positivo', 'The alert was a false positive: it was a backup job.'],
    ['to triage', 'clasificar y priorizar alertas', 'I triage new alerts every morning.'],
    ['least privilege', 'menor privilegio', 'Service accounts should follow least privilege.'],
    ['to contain', 'contener (aislar)', 'We contained the incident by isolating the host.'],
    ['indicator of compromise (IOC)', 'indicador de compromiso', 'We added the IP to our list of IOCs.'],
    ['endpoint', 'equipo final (PC, laptop, servidor)', 'The EDR agent is installed on every endpoint.'],
    ['to patch', 'parchar, actualizar', 'Patch the server before the weekend.']
  ],
  'Programación': [
    ['bug', 'error en el código', 'I fixed a bug in the login form.'],
    ['to debug', 'depurar', 'I am debugging the script line by line.'],
    ['to deploy', 'desplegar, publicar', 'We deploy to production on Fridays only in emergencies.'],
    ['branch', 'rama', 'Create a new branch for this feature.'],
    ['to merge', 'fusionar', 'I merged the pull request after the review.'],
    ['pull request', 'solicitud de cambios', 'Please review my pull request.'],
    ['deprecated', 'obsoleto (ya no recomendado)', 'This function is deprecated; use the new one.'],
    ['edge case', 'caso límite', 'An empty file is an edge case we did not test.'],
    ['to refactor', 'reestructurar el código sin cambiar lo que hace', 'I refactored the function to make it shorter.'],
    ['backward compatible', 'compatible con versiones anteriores', 'The new API is backward compatible.'],
    ['environment variable', 'variable de entorno', 'Store the API key in an environment variable.'],
    ['to hardcode', 'escribir un valor fijo en el código', 'Never hardcode passwords.']
  ],
  'Reuniones y correo': [
    ['stand-up', 'junta diaria corta', 'In the stand-up I share what I did yesterday.'],
    ['blocker', 'bloqueo, impedimento', 'My blocker is that I do not have VPN access.'],
    ['to follow up', 'dar seguimiento', 'I will follow up with the vendor tomorrow.'],
    ['ETA', 'hora o fecha estimada', 'What is the ETA for the fix?'],
    ['heads-up', 'aviso previo', 'Just a heads-up: the server will restart at 6 pm.'],
    ['on track', 'en tiempo, según el plan', 'The migration is on track.'],
    ['to wrap up', 'terminar, cerrar', "Let's wrap up the meeting."],
    ['FYI', 'para tu información', 'FYI, the report is in the shared folder.'],
    ['to reach out', 'contactar', 'Feel free to reach out if you have questions.'],
    ['deadline', 'fecha límite', 'The deadline is next Monday.'],
    ['to sync', 'reunirse para alinearse', "Let's sync after lunch."],
    ['action item', 'tarea pendiente acordada', 'I have two action items from the meeting.']
  ]
};
/* frases útiles: [inglés, español, situación] */
const EN_PHRASES = [
  ['Could you share your screen, please?', '¿Podrías compartir tu pantalla, por favor?', 'Soporte remoto'],
  ['When did the issue start?', '¿Cuándo empezó el problema?', 'Soporte remoto'],
  ['Have you made any recent changes?', '¿Hiciste algún cambio reciente?', 'Soporte remoto'],
  ["I'm going to restart the service. It will take about two minutes.", 'Voy a reiniciar el servicio. Tardará unos dos minutos.', 'Soporte remoto'],
  ["I'm not sure, but I will find out and get back to you today.", 'No estoy seguro, pero lo averiguo y te respondo hoy.', 'Soporte remoto'],
  ['We detected suspicious activity on your account.', 'Detectamos actividad sospechosa en tu cuenta.', 'Incidente'],
  ['Please do not click the link or open the attachment.', 'Por favor no abras el enlace ni el adjunto.', 'Incidente'],
  ['The affected host has been isolated from the network.', 'El equipo afectado se aisló de la red.', 'Incidente'],
  ['We are still investigating and will send an update in one hour.', 'Seguimos investigando y enviaremos una actualización en una hora.', 'Incidente'],
  ['Yesterday I worked on the firewall rules. Today I will review the alerts. No blockers.', 'Ayer trabajé en las reglas del firewall. Hoy reviso las alertas. Sin bloqueos.', 'Junta diaria'],
  ["I'm blocked because I'm waiting for access to the server.", 'Estoy bloqueado porque espero acceso al servidor.', 'Junta diaria'],
  ['Could you clarify what you mean by "urgent"?', '¿Me aclaras qué quieres decir con "urgente"?', 'Junta diaria'],
  ['Sorry, could you repeat that more slowly?', 'Perdón, ¿lo puedes repetir más despacio?', 'Junta diaria'],
  ['Thank you for your time. I look forward to hearing from you.', 'Gracias por tu tiempo. Quedo atento a tu respuesta.', 'Entrevista'],
  ["That's a great question. Let me think for a second.", 'Muy buena pregunta. Déjame pensarlo un segundo.', 'Entrevista'],
  ["I haven't used that tool yet, but I learn fast and I have used similar ones.", 'Todavía no uso esa herramienta, pero aprendo rápido y he usado otras parecidas.', 'Entrevista'],
  ['Please find attached the report.', 'Adjunto encontrarás el reporte.', 'Correo'],
  ['Just following up on my previous email.', 'Solo doy seguimiento a mi correo anterior.', 'Correo'],
  ['Let me know if you need anything else.', 'Avísame si necesitas algo más.', 'Correo'],
  ['Thanks for the heads-up.', 'Gracias por el aviso.', 'Correo']
];
/* falsos amigos: [pregunta, correcta, incorrectas…, explicación] */
const EN_FALSE = [
  ['"Actually" significa…', 'En realidad, de hecho', 'Actualmente', 'Activamente', 'Exactamente', '"Actualmente" se dice currently o nowadays.'],
  ['"Eventually" significa…', 'Con el tiempo, al final', 'Eventualmente (a veces)', 'Por evento', 'De inmediato', '"Eventualmente" en el sentido de "a veces" es occasionally.'],
  ['"Library" significa…', 'Biblioteca (también librería de código)', 'Librería (tienda de libros)', 'Libreta', 'Libertad', 'La tienda de libros es bookstore. En programación, library sí es librería de código.'],
  ['"To assist" significa…', 'Ayudar', 'Asistir a un evento', 'Insistir', 'Asustar', 'Asistir a una junta es to attend a meeting.'],
  ['"To attend" significa…', 'Asistir (ir a)', 'Atender a un cliente', 'Tender', 'Intentar', 'Atender a alguien es to help, to serve o to take care of.'],
  ['"Sensible" significa…', 'Sensato, razonable', 'Sensible (emocional)', 'Sensorial', 'Sencillo', 'Sensible en el sentido de "se emociona fácil" es sensitive. Datos sensibles = sensitive data.'],
  ['"To realize" significa…', 'Darse cuenta', 'Realizar (hacer)', 'Reaccionar', 'Relajar', 'Realizar una tarea es to carry out o to do.'],
  ['"Career" significa…', 'Trayectoria profesional', 'Carrera universitaria', 'Carretera', 'Cartera', 'La carrera universitaria es degree o major.'],
  ['"To support" significa…', 'Apoyar, dar soporte', 'Soportar (aguantar)', 'Suponer', 'Superar', 'Aguantar algo molesto es to stand o to put up with.'],
  ['"Embarrassed" significa…', 'Apenado, avergonzado', 'Embarazada', 'Embarrado', 'Enojado', 'Embarazada es pregnant.'],
  ['"Exit" significa…', 'Salida', 'Éxito', 'Exigir', 'Existir', 'Éxito es success.'],
  ['"To record" significa…', 'Grabar, registrar', 'Recordar', 'Recorrer', 'Recortar', 'Recordar es to remember o to remind (recordarle a alguien).'],
  ['"Sensitive data" significa…', 'Datos sensibles (confidenciales)', 'Datos sensatos', 'Datos sentimentales', 'Datos del sensor', 'En seguridad, sensitive data es información que se debe proteger.'],
  ['"Fabric" significa…', 'Tela', 'Fábrica', 'Fabricante', 'Fábula', 'Fábrica es factory o plant.']
];
/* lecturas cortas: { t, tipo, texto, qs:[[pregunta, correcta, incorrectas…]] } */
const EN_READ = [
  { id: 'r1', t: 'A support ticket', tipo: 'Ticket',
    texto: 'Ticket #4821 – Priority: High\nUser: Laura M. (Finance)\nDescription: Since this morning I cannot access the shared drive. I get an "access denied" message. I can still open my email and the internet works. My colleague next to me has the same problem. We need the drive to close the month today.\nUpdate (10:42): Confirmed. The Finance group was removed from the folder permissions during last night\'s migration. Permissions restored. Waiting for user confirmation.',
    qs: [['What is the problem?', 'Two users cannot access a shared drive', 'The internet is down', 'The email is not working', 'The laptop does not turn on'], ['What was the root cause?', 'A group lost its permissions during a migration', 'A virus deleted the files', 'The user forgot her password', 'The printer was offline'], ['What is the current status?', 'Fixed, waiting for the user to confirm', 'Escalated to the vendor', 'Not started', 'Closed without a fix']] },
  { id: 'r2', t: 'An incident update', tipo: 'Correo',
    texto: 'Subject: Security incident – update #2\nHi team,\nAt 09:15 our SOC detected unusual outbound traffic from a server in the DMZ. The server was isolated at 09:32 and no other hosts show the same behavior. Initial analysis suggests a vulnerable plugin was exploited. We are collecting evidence and we will patch all servers that use the same plugin before 18:00. Please do not restart the affected server; it is needed for the investigation.\nNext update: 13:00.\nCarlos, Incident Response',
    qs: [['What did the SOC detect?', 'Unusual outbound traffic from a server', 'A phishing email', 'A power outage', 'A lost laptop'], ['Why should nobody restart the server?', 'It is evidence for the investigation', 'It is too old', 'It will delete the plugin', 'It belongs to another company'], ['When is the next update?', 'At 13:00', 'At 09:32', 'At 18:00', 'Tomorrow']] },
  { id: 'r3', t: 'A stand-up update', tipo: 'Junta',
    texto: 'Yesterday I finished the script that exports the list of inactive users. I tested it in the lab and it works, but it is slow with more than ten thousand users. Today I will try to improve the query and then send it for review. I have one blocker: I still need read access to the production directory. I sent the request on Monday.',
    qs: [['What did the person finish yesterday?', 'A script to export inactive users', 'A firewall migration', 'A security training', 'A password reset'], ['What is the problem with the script?', 'It is slow with many users', 'It deletes users', 'It does not run', 'It needs a license'], ['What is the blocker?', 'Waiting for read access to production', 'The lab is down', 'The manager is on vacation', 'There is no internet']] },
  { id: 'r4', t: 'A job posting', tipo: 'Vacante',
    texto: 'Junior SOC Analyst (Remote, LATAM)\nResponsibilities: monitor alerts in our SIEM, triage and escalate incidents, document findings, and support phishing investigations.\nRequirements: basic knowledge of networking (TCP/IP, DNS), Windows and Linux logs, and at least intermediate English. Security+ is a plus. Willingness to work rotating shifts.\nNice to have: SQL, Python or PowerShell scripting.',
    qs: [['Which certification is mentioned as "a plus"?', 'Security+', 'CCNA', 'CISSP', 'AWS'], ['What does "rotating shifts" mean?', 'Turnos que cambian', 'Trabajo de medio tiempo', 'Solo fines de semana', 'Horario fijo'], ['Which skill is "nice to have" (not required)?', 'Python or PowerShell scripting', 'Networking basics', 'Intermediate English', 'Reading logs']] }
];
/* dictado: oraciones que se escuchan y se escriben */
const EN_DICT = [
  'Please restart your computer.',
  'The server is down.',
  'I opened a new ticket.',
  'Do not share your password.',
  'The alert was a false positive.',
  'We isolated the infected laptop.',
  'Can you check the firewall logs?',
  'The backup finished at midnight.',
  'I will follow up tomorrow morning.',
  'Two factor authentication is enabled.',
  'The update fixed the vulnerability.',
  'What time did the incident start?'
];
/* entrevista: { q, es, tip, model } */
const EN_INTERVIEW = [
  { id: 'i1', q: 'Tell me about yourself.', es: 'Háblame de ti.', tip: 'Presente, pasado, futuro en 60 segundos: quién eres hoy, qué has hecho que sea relevante y por qué quieres este puesto.',
    model: "I'm a systems engineer from Mexico. I have experience in IT support and network administration, and I'm now focused on cybersecurity. I'm completing the Google Cybersecurity certificate and I practice every week with labs about logs, SQL and incident response. I'm looking for a junior SOC role where I can keep learning and help the team protect the company." },
  { id: 'i2', q: 'Why do you want to work in cybersecurity?', es: '¿Por qué quieres trabajar en ciberseguridad?', tip: 'Una razón real y concreta, no "porque paga bien".',
    model: 'In my IT support jobs I saw how one phishing email or one weak password can stop a whole team. I enjoy investigating problems and finding the root cause, so protecting systems feels like the natural next step for me.' },
  { id: 'i3', q: 'Describe a technical problem you solved.', es: 'Describe un problema técnico que resolviste.', tip: 'Usa STAR: Situación, Tarea, Acción y Resultado. El resultado con un dato si puedes.',
    model: 'In my last job, several test machines were failing at random (situation). I had to find out why before the next production run (task). I compared the logs, noticed that the failures matched a network timeout, and worked with the network team to change the switch configuration (action). The failures stopped and we saved hours of retesting every week (result).' },
  { id: 'i4', q: "What do you do when you don't know the answer?", es: '¿Qué haces cuando no sabes la respuesta?', tip: 'Muestra método: investigar, probar en un lugar seguro, pedir ayuda a tiempo y documentar.',
    model: "First, I say clearly that I'm not sure. Then I check the documentation and the logs, and I test in a safe environment. If it is urgent or I'm stuck, I ask a teammate early instead of losing time. When I solve it, I document it so the next person can find it." },
  { id: 'i5', q: 'A user reports a suspicious email. What do you do?', es: 'Un usuario reporta un correo sospechoso. ¿Qué haces?', tip: 'Pasos en orden. Es la pregunta más común para SOC junior.',
    model: 'I thank the user and ask them not to click anything. I check the sender, the links and the attachments in a safe way. If it is malicious, I block the sender and the URLs, search for the same email in other mailboxes and remove it, and check if anyone clicked. Then I document the case and share a short warning if needed.' },
  { id: 'i6', q: 'Can you explain the CIA triad?', es: '¿Puedes explicar la tríada CIA?', tip: 'Define y da un ejemplo de cada una.',
    model: 'CIA stands for confidentiality, integrity and availability. Confidentiality means only authorized people can see the data, for example with encryption and access control. Integrity means the data is not changed without permission, for example with hashes. Availability means the systems work when people need them, for example with backups and redundancy.' },
  { id: 'i7', q: 'What is your biggest weakness?', es: '¿Cuál es tu mayor debilidad?', tip: 'Una debilidad real, no grave para el puesto, y lo que haces para mejorarla.',
    model: "My English speaking is not as strong as my reading. I read technical documentation in English every day, and now I practice speaking with interview simulations and by explaining my labs out loud. I'm improving every month." },
  { id: 'i8', q: 'Do you have any questions for us?', es: '¿Tienes alguna pregunta para nosotros?', tip: 'Siempre di que sí. Pregunta por el equipo, el día a día o cómo miden el éxito.',
    model: 'Yes, thank you. What does a typical day look like for a junior analyst on your team? And how do you support new people while they learn your tools?' }
];
/* pronunciación difícil para hispanohablantes: [palabra, cómo suena (aprox.), nota] */
const EN_PRON = [
  ['data', 'DÉI-ta (o DÁ-ta)', 'Las dos se aceptan.'],
  ['cache', 'KASH', 'Suena igual que cash (dinero), no "ca-ché".'],
  ['router', 'RÁU-ter', 'En Estados Unidos rima con "outer".'],
  ['Linux', 'LÍ-nux', 'La i corta, como en "list".'],
  ['SQL', 'ES-kiu-el o SÍ-kuel', 'Las dos formas se usan en el trabajo.'],
  ['GUI', 'GÚ-i', 'Se dice como "gooey".'],
  ['suite', 'SUÍT', 'Igual que "sweet".'],
  ['admin', 'ÁD-min', 'El acento va al principio.'],
  ['protocol', 'PRÓU-to-col', 'Acento en la primera sílaba.'],
  ['architecture', 'ÁR-ki-tek-cher', 'La ch suena como k.'],
  ['hierarchy', 'JÁI-e-rar-ki', 'La h suena suave y la primera sílaba es "jái".'],
  ['vulnerability', 'vol-ne-ra-BÍ-li-ti', 'El acento fuerte va en "bi".']
];
