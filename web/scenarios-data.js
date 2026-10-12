/* ===== Escenarios de decisiones: SOC (con logs) e Imprevistos de la vida real ===== */
const SOC_SCN = [
  { id: 'soc1', area: 'SOC · Triage', sev: 'alta', title: 'Fuerza bruta contra SSH', sit: 'Son las 9:10. El SIEM levanta una alerta: muchísimos "Failed password" contra el servidor web01 desde una sola IP, y al final un "Accepted".',
    log: 'Oct 12 09:03 web01 sshd: Failed password for root from 185.220.101.47\nOct 12 09:03 web01 sshd: Failed password for root from 185.220.101.47\n... (34 intentos más) ...\nOct 12 09:07 web01 sshd: Accepted password for root from 185.220.101.47\nOct 12 09:08 web01 useradd: new user: name=backup2, UID=0',
    steps: [
      { ask: '¿Qué dice este patrón?', opts: [
        { t: 'Fue fuerza bruta y además LOGRÓ entrar como root', s: 2, fb: 'Correcto. El "Accepted" tras decenas de fallos y luego un useradd con UID 0 confirman compromiso, no solo intento.' },
        { t: 'Solo intentos fallidos, no pasó nada', s: 0, fb: 'Ojo: hay un "Accepted password for root" y la creación de una cuenta. El atacante entró.' },
        { t: 'Es un falso positivo del SIEM', s: 0, fb: 'El patrón es demasiado claro: decenas de fallos, un acceso y una cuenta nueva con UID 0.' }] },
      { ask: '¿Cuál es tu primera acción?', opts: [
        { t: 'Aislar web01 de la red y preservar evidencia (memoria y logs)', s: 2, fb: 'Correcto: contener primero sin destruir evidencia. Después se erradica.' },
        { t: 'Apagar y formatear el servidor de inmediato', s: 0, fb: 'Formatear destruye la evidencia y quizá la disponibilidad del servicio. Primero aislar y preservar.' },
        { t: 'Cambiar la contraseña de root y seguir como si nada', s: 1, fb: 'Cambiar la credencial ayuda, pero la cuenta backup2 (UID 0) sigue siendo una puerta trasera. Hay que aislar e investigar a fondo.' }] },
      { ask: 'Para evitar que se repita, ¿qué recomiendas?', opts: [
        { t: 'Deshabilitar login de root, usar llaves + MFA y bloquear por intentos (fail2ban)', s: 2, fb: 'Correcto: ataca la causa. El servidor tenía PermitRootLogin yes y contraseñas.' },
        { t: 'Cambiar el puerto de SSH y ya', s: 1, fb: 'Mover el puerto reduce ruido, pero no detiene a un atacante serio. Las llaves y el MFA sí.' },
        { t: 'Nada, ya cambiaste la contraseña', s: 0, fb: 'Sin cerrar la causa, volverá a pasar.' }] }
    ],
    pro: 'Confirmar el compromiso, aislar web01 preservando evidencia, buscar la IP y los IoCs (la cuenta backup2, el puerto 4444) en los demás equipos, erradicar la persistencia, restaurar desde un respaldo limpio y endurecer SSH (sin root, con llaves y MFA, con fail2ban).',
    learn: 'Fases de respuesta a incidentes: identificar → contener → erradicar → recuperar → lecciones aprendidas. Nunca destruyas evidencia al contener.' },
  { id: 'soc2', area: 'SOC · Phishing', sev: 'media', title: 'Correo sospechoso del "banco"', sit: 'Un empleado reporta un correo urgente de "Soporte TI" pidiendo confirmar su contraseña en un enlace. El dominio del enlace es it-soporte-verificacion.com.',
    log: 'De: Soporte TI <soporte@it-soporte-verificacion.com>\nAsunto: ACCIÓN URGENTE: su cuenta será suspendida\nEnlace: http://it-soporte-verificacion.com/login?u=alfonso',
    steps: [
      { ask: '¿Qué tipo de ataque es?', opts: [
        { t: 'Phishing: suplanta a TI con urgencia para robar la contraseña', s: 2, fb: 'Correcto: dominio falso, urgencia y petición de credenciales. Clásico.' },
        { t: 'Un correo legítimo de mantenimiento', s: 0, fb: 'TI nunca pide tu contraseña por un enlace. El dominio no es el de la empresa.' },
        { t: 'Un ataque DDoS', s: 0, fb: 'El DDoS satura servicios; esto es ingeniería social.' }] },
      { ask: 'El empleado dice que NO hizo clic. ¿Qué haces?', opts: [
        { t: 'Felicitarlo por reportar, bloquear el dominio y buscar si otros lo recibieron', s: 2, fb: 'Correcto: reconoces el buen reflejo, contienes y mides el alcance.' },
        { t: 'Regañarlo por recibir el correo', s: 0, fb: 'Castigar el reporte hace que la próxima vez no reporten. Reportar es exactamente lo que debía hacer.' },
        { t: 'Borrar solo su correo y cerrar el caso', s: 1, fb: 'Falta lo importante: ¿a cuántos más les llegó? Hay que bloquear el dominio y revisar.' }] },
      { ask: 'Otro compañero sí hizo clic y escribió su contraseña. ¿Qué es lo primero?', opts: [
        { t: 'Restablecer su contraseña de inmediato y revisar accesos recientes', s: 2, fb: 'Correcto: la credencial ya está comprometida. Cambiarla y revisar si la usaron.' },
        { t: 'Esperar a ver si pasa algo', s: 0, fb: 'Esperar le da tiempo al atacante de usar la credencial.' },
        { t: 'Solo avisarle que tenga más cuidado', s: 0, fb: 'La contraseña ya está en manos del atacante: hay que cambiarla ya.' }] }
    ],
    pro: 'Confirmar el phishing, agradecer el reporte, bloquear el dominio y el remitente, buscar quién más lo recibió o hizo clic, restablecer las contraseñas afectadas con MFA y usarlo como ejemplo en la próxima campaña de concientización.',
    learn: 'Señales de phishing: urgencia, dominio parecido pero falso y petición de credenciales. Reportar siempre es la conducta correcta; el MFA habría limitado el daño.' },
  { id: 'soc3', area: 'SOC · Endpoint', sev: 'alta', title: 'CPU al 100% de madrugada', sit: 'Un servidor lleva horas al 100% de CPU desde la madrugada. En los procesos aparece "kworkerd" en /tmp/.x conectándose a un pool de minería.',
    log: 'root 3110 98.7 12.0 /tmp/.x/kworkerd -o pool.minexmr.example:4444\nsyslog: CRON (root) CMD (/tmp/.x/kworkerd -o pool...)',
    steps: [
      { ask: '¿Qué está pasando?', opts: [
        { t: 'Cryptojacking: un minero disfrazado de proceso del sistema', s: 2, fb: 'Correcto: imita a kworker, vive en /tmp oculto y mina hacia un pool.' },
        { t: 'Un proceso normal del kernel', s: 0, fb: 'El kworker real no vive en /tmp/.x ni se conecta a un pool de minería.' },
        { t: 'Un respaldo pesado', s: 0, fb: 'Un respaldo no se conecta a un pool de criptomonedas.' }] },
      { ask: 'Matas el proceso y a los 5 minutos vuelve. ¿Por qué?', opts: [
        { t: 'Hay una tarea de cron que lo relanza: hay que quitarla', s: 2, fb: 'Correcto: el syslog muestra CRON ejecutándolo. Sin quitar la persistencia, revive.' },
        { t: 'El proceso es inmortal', s: 0, fb: 'Nada es inmortal: algo lo está relanzando. Revisa cron y servicios.' },
        { t: 'Hay que comprar más CPU', s: 0, fb: 'El problema no es capacidad, es malware con persistencia.' }] }
    ],
    pro: 'Aislar el equipo, sacar el hash del binario como IoC, quitar la persistencia (cron) antes de matar el proceso, buscar cómo entró (vulnerabilidad o credencial), limpiar o restaurar y buscar el mismo IoC en el resto de la flota.',
    learn: 'Matar el proceso sin quitar la persistencia (cron, servicio, tarea programada) es inútil: vuelve. Siempre busca el mecanismo que lo relanza.' }
];

const IMPREVISTOS = [
  { id: 'i1', area: 'Vida real · Soporte', title: 'Ransomware en una PC', sit: 'Una compañera te llama asustada: su pantalla muestra un mensaje que dice que sus archivos están cifrados y piden un pago. Tú pasabas por ahí.',
    steps: [
      { ask: '¿Qué haces en los primeros segundos?', opts: [
        { t: 'Desconectar el equipo de la red (cable y Wi-Fi), sin apagarlo', s: 2, fb: 'Correcto: aislar frena que el ransomware se propague a las carpetas de red y a otros equipos. No lo apagas para no perder evidencia en memoria.' },
        { t: 'Pagar rápido para recuperar los archivos', s: 0, fb: 'Pagar no garantiza nada y financia el crimen. La organización decide, no el usuario, y casi siempre la respuesta es no pagar.' },
        { t: 'Apagar todas las computadoras de la oficina', s: 1, fb: 'Aislar el equipo afectado sí; apagar todo a ciegas causa más caos y pierde evidencia. Avisa al equipo de seguridad.' }] },
      { ask: 'Ya lo aislaste. ¿Qué sigue?', opts: [
        { t: 'Avisar a seguridad/TI y NO borrar nada', s: 2, fb: 'Correcto: se reporta y se preserva el equipo como evidencia para investigar el alcance.' },
        { t: 'Formatear la PC de inmediato', s: 0, fb: 'Destruyes la evidencia y la posibilidad de saber qué más tocó. Se restaura desde respaldo tras investigar.' },
        { t: 'Conectar un USB para copiar sus archivos "a salvo"', s: 0, fb: 'Podrías infectar el USB y propagar el ransomware.' }] },
      { ask: '¿Qué pregunta clave hace la diferencia para recuperarse?', opts: [
        { t: '¿Tenemos respaldos recientes y funcionan?', s: 2, fb: 'Correcto: un buen respaldo (y probado) es lo que permite recuperar sin pagar.' },
        { t: '¿Cuánto piden de rescate?', s: 0, fb: 'El monto no importa si tienes respaldos. La pregunta es si puedes restaurar.' },
        { t: '¿Quién tuvo la culpa?', s: 0, fb: 'Las culpas van al final (lecciones aprendidas). Primero recuperar la operación.' }] }
    ],
    pro: 'Aislar sin apagar, avisar a seguridad, no pagar, preservar evidencia, identificar la variante y el alcance, restaurar desde respaldos limpios y cerrar la vía de entrada. Después: reforzar respaldos probados, EDR y concientización.',
    learn: 'Lo que salva de un ransomware no es el antivirus, son los respaldos probados y la segmentación. Aislar rápido evita que un equipo se vuelva toda la empresa.' },
  { id: 'i2', area: 'Vida real · Oficina', title: 'Una llamada del "director"', sit: 'Trabajas y te llama alguien que dice ser el director general. Con tono molesto y prisa, te pide que le des acceso a un sistema "ahora mismo, no hay tiempo para procesos".',
    steps: [
      { ask: '¿Cómo reaccionas?', opts: [
        { t: 'Verificar su identidad por un canal oficial antes de hacer nada', s: 2, fb: 'Correcto: la autoridad y la urgencia son las palancas del fraude. Confirmar por otro canal es lo profesional, no una falta de respeto.' },
        { t: 'Obedecer de inmediato porque es el director', s: 0, fb: 'Justo lo que busca el atacante: que la autoridad y la prisa te hagan saltarte el proceso.' },
        { t: 'Colgar sin más y no decir nada', s: 1, fb: 'Bien que no obedeces, pero hay que reportarlo: puede ser un ataque dirigido a toda la empresa.' }] },
      { ask: 'Insiste y te amenaza con reportarte. ¿Qué haces?', opts: [
        { t: 'Mantener la calma, seguir el proceso y reportar el intento a seguridad', s: 2, fb: 'Correcto: la presión es parte del guion. Un directivo real entiende los controles; un atacante los odia.' },
        { t: 'Ceder para evitarte problemas', s: 0, fb: 'Ceder bajo presión es exactamente el objetivo del ataque.' },
        { t: 'Darle solo "un poquito" de acceso', s: 0, fb: 'Un poco de acceso indebido sigue siendo una brecha.' }] }
    ],
    pro: 'No actuar por presión. Verificar la identidad por un canal conocido (no el que da quien llama), seguir el proceso de aprobación y reportar el intento. Para pagos o accesos sensibles, exigir doble aprobación.',
    learn: 'Es un intento de ingeniería social (vishing / BEC) usando autoridad y urgencia. El control que lo detiene es verificar por otro canal y no saltarse el proceso por miedo.' },
  { id: 'i3', area: 'Vida real · Red', title: 'Media oficina sin Internet', sit: 'Llegas y la mitad de la oficina no tiene Internet; la otra mitad sí. Nadie sabe qué cambió. Te toca resolverlo.',
    steps: [
      { ask: '¿Por dónde empiezas a diagnosticar?', opts: [
        { t: 'Confirmar el alcance: quiénes sí y quiénes no, y qué tienen en común', s: 2, fb: 'Correcto: si falla "la mitad", seguramente comparten un switch, una VLAN o un rango de IP. Delimitar es el primer paso.' },
        { t: 'Reiniciar todos los equipos de la oficina', s: 0, fb: 'Reiniciar a ciegas rara vez resuelve y no te dice la causa.' },
        { t: 'Llamar al proveedor de Internet de inmediato', s: 1, fb: 'Si la otra mitad sí navega, el enlace del proveedor probablemente está bien. El problema es interno.' }] },
      { ask: 'En una PC sin Internet, ¿qué revisas primero?', opts: [
        { t: 'ipconfig: ver si tiene IP válida y gateway, y hacer ping al gateway', s: 2, fb: 'Correcto: de abajo hacia arriba. Si no hay IP o no responde el gateway, el problema es la red local, no Internet.' },
        { t: 'Reinstalar el navegador', s: 0, fb: 'El navegador no tiene que ver con que toda la máquina esté sin red.' },
        { t: 'Cambiar la contraseña del usuario', s: 0, fb: 'No es un problema de credenciales.' }] },
      { ask: 'Ves que las PCs sin Internet tienen IP 169.254.x.x. ¿Qué significa?', opts: [
        { t: 'No recibieron IP del DHCP: revisar el servidor DHCP o ese switch', s: 2, fb: 'Correcto: 169.254.x.x (APIPA) significa que el DHCP no respondió. Apunta al switch de ese grupo o al servidor DHCP.' },
        { t: 'Que tienen virus', s: 0, fb: 'Una 169.254 es señal de DHCP, no de malware por sí sola.' },
        { t: 'Que el Internet del proveedor se cayó', s: 0, fb: 'Si fuera el proveedor, nadie navegaría. Es un problema interno de asignación de IP.' }] }
    ],
    pro: 'Delimitar el alcance (qué comparten los afectados), diagnosticar de abajo hacia arriba (cable, IP/gateway, DNS), interpretar la IP 169.254 como fallo de DHCP y revisar el switch o servidor correspondiente. Documentar la causa en el ticket.',
    learn: 'El método vence a la adivinanza: ping al gateway, luego a 8.8.8.8, luego por nombre. Una 169.254.x.x casi siempre es DHCP. Practícalo en el Laboratorio de redes.' },
  { id: 'i4', area: 'Vida real · Datos', title: 'USB encontrado en el estacionamiento', sit: 'Un compañero encontró una memoria USB en el estacionamiento y, curioso, la va a conectar a su computadora de la oficina "para ver de quién es".',
    steps: [
      { ask: '¿Qué le dices?', opts: [
        { t: 'Que no la conecte: puede ser un cebo con malware', s: 2, fb: 'Correcto: dejar USBs es una técnica real (baiting). Al conectarla puede ejecutar malware automáticamente.' },
        { t: 'Que la conecte, total es solo una USB', s: 0, fb: 'Una USB "perdida" a propósito es un vector de ataque conocido.' },
        { t: 'Que la conecte pero en modo incógnito del navegador', s: 0, fb: 'El modo incógnito no protege del malware de una USB; no tiene nada que ver.' }] },
      { ask: '¿Qué es lo correcto con esa USB?', opts: [
        { t: 'Entregarla a seguridad/TI para analizarla en un equipo aislado', s: 2, fb: 'Correcto: si hay que revisarla, se hace en un entorno controlado y aislado, no en una PC de producción.' },
        { t: 'Tirarla a la basura sin más', s: 1, fb: 'Mejor que conectarla, pero avisar a seguridad permite saber si hubo un intento dirigido a la empresa.' },
        { t: 'Llevársela a casa para revisarla ahí', s: 0, fb: 'Mueves el riesgo a tu casa y no resuelves nada.' }] }
    ],
    pro: 'No conectar medios desconocidos. Entregarlos a seguridad para analizarlos en un entorno aislado. A nivel organización: deshabilitar el autorun, controlar puertos USB por política y concientizar sobre el baiting.',
    learn: 'El baiting (cebo) explota la curiosidad humana. La defensa es la política (bloquear USB, deshabilitar autorun) y la concientización.' }
];
