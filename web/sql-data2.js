/* ===== Bases de datos: lecciones 7-12, retos de investigación y examen ===== */
SQL_LESSONS.push(
  {
    id: 'l7', t: 'Subconsultas y WITH (CTE)', nivel: 'Intermedio',
    que: 'Una subconsulta es una consulta dentro de otra. WITH (CTE) le pone nombre a una consulta para usarla como si fuera una tabla.',
    para: 'Preguntas de dos pasos: "usuarios deshabilitados QUE ADEMÁS entraron", "IPs que fallaron mucho Y luego lograron entrar".',
    pasos: ['Escribe primero la consulta interna y pruébala sola.', 'Úsala con IN (subconsulta) o en FROM.', 'Si se vuelve larga, pásala a WITH nombre AS (...).'],
    sintaxis: 'WITH sospechosas AS (\n  SELECT ip FROM inicios_sesion\n  WHERE exito = 0 GROUP BY ip HAVING COUNT(*) >= 5\n)\nSELECT * FROM inicios_sesion\nWHERE exito = 1 AND ip IN (SELECT ip FROM sospechosas);',
    params: [['IN (SELECT …)', 'que el valor esté en el resultado de la subconsulta'], ['EXISTS (SELECT …)', 'que la subconsulta devuelva algo'], ['WITH x AS (…)', 'consulta con nombre, solo vive en esa instrucción']],
    ej: { sql: 'SELECT hostname FROM equipos\nWHERE dias_sin_parche > (SELECT AVG(dias_sin_parche) FROM equipos);', exp: 'Equipos más atrasados que el promedio.' },
    sec: { sql: "WITH sospechosas AS (\n  SELECT ip FROM inicios_sesion\n  WHERE exito = 0 GROUP BY ip HAVING COUNT(*) >= 5\n)\nSELECT i.fecha, u.usuario, i.ip\nFROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id\nWHERE i.exito = 1 AND i.ip IN (SELECT ip FROM sospechosas);", exp: 'Fuerza bruta que FUNCIONÓ: la IP falló muchas veces y después entró. Esto es un incidente, no solo una alerta.' },
    ejercicio: { ask: 'Muestra el nombre de cuenta (usuario) de las cuentas DESACTIVADAS (activo = 0) que tienen al menos un inicio de sesión exitoso.', sql: 'SELECT usuario FROM usuarios WHERE activo = 0 AND id IN (SELECT usuario_id FROM inicios_sesion WHERE exito = 1)', hint: 'WHERE activo = 0 AND id IN (SELECT usuario_id FROM inicios_sesion WHERE exito = 1)' },
    quiz: [
      ['¿Para qué sirve WITH?', ['Para nombrar una consulta y usarla como tabla en la misma instrucción', 'Para crear una tabla permanente', 'Para dar permisos', 'Para borrar datos'], 'La CTE desaparece al terminar la consulta.'],
      ['¿Qué devuelve WHERE id IN (SELECT usuario_id FROM inicios_sesion WHERE exito = 1)?', ['Usuarios que tienen al menos un inicio exitoso', 'Usuarios sin inicios', 'Todos los inicios', 'Error'], 'IN revisa si el id aparece en la lista.'],
      ['Una cuenta desactivada con inicio exitoso indica…', ['Un control que falló o una cuenta mal dada de baja: hay que investigar', 'Que todo está bien', 'Un error de la base', 'Que el usuario cambió de puesto'], 'Al desactivar una cuenta también hay que cerrar sesiones, VPN y tokens.']
    ],
    tip: 'Arma las consultas por partes: prueba la de adentro, luego la de afuera. Así encuentras errores rápido.'
  },
  {
    id: 'l8', t: 'Modificar datos con cuidado', nivel: 'Intermedio',
    que: 'INSERT agrega filas, UPDATE las cambia y DELETE las borra. Una transacción (BEGIN … COMMIT) junta varios cambios para que pasen todos o ninguno.',
    para: 'Contener un incidente (desactivar una cuenta), registrar una IP bloqueada o corregir un inventario.',
    pasos: ['Primero haz un SELECT con el mismo WHERE para ver qué vas a tocar.', 'Inicia una transacción con BEGIN.', 'Ejecuta el UPDATE o DELETE con su WHERE.', 'Revisa el resultado; si está bien, COMMIT; si no, ROLLBACK.'],
    sintaxis: "BEGIN;\nUPDATE usuarios SET activo = 0 WHERE usuario = 'soporte_temp';\nSELECT usuario, activo FROM usuarios WHERE usuario = 'soporte_temp';\nCOMMIT;   -- o ROLLBACK; para deshacer",
    params: [['INSERT INTO t (cols) VALUES (…)', 'agrega una fila'], ['UPDATE t SET col = valor WHERE …', 'cambia filas'], ['DELETE FROM t WHERE …', 'borra filas'], ['BEGIN / COMMIT / ROLLBACK', 'iniciar, confirmar o deshacer cambios']],
    ej: { sql: "INSERT INTO departamentos (id, nombre, piso) VALUES (6, 'Seguridad', 3);\nSELECT * FROM departamentos;", exp: 'Agrega el departamento de Seguridad.' },
    sec: { sql: "BEGIN;\nUPDATE usuarios SET activo = 0 WHERE usuario = 'soporte_temp';\nUPDATE alertas SET estado = 'en_proceso' WHERE id = 8;\nCOMMIT;", exp: 'Contención: se desactiva la cuenta creada por el atacante y se marca la alerta en proceso, todo junto.' },
    ejercicio: { ask: "Contención: desactiva SOLO la cuenta soporte_temp (activo = 0). Las demás cuentas no deben cambiar.", mode: 'state', sql: "UPDATE usuarios SET activo = 0 WHERE usuario = 'soporte_temp'", verify: 'SELECT usuario FROM usuarios WHERE activo = 0 ORDER BY usuario', hint: "UPDATE usuarios SET activo = 0 WHERE usuario = 'soporte_temp';" },
    quiz: [
      ['¿Qué pasa con UPDATE usuarios SET activo = 0; sin WHERE?', ['Desactiva TODAS las cuentas', 'No hace nada', 'Desactiva la primera', 'Da error siempre'], 'El clásico error que tumba a toda la empresa. Siempre WHERE y siempre SELECT antes.'],
      ['¿Para qué sirve ROLLBACK?', ['Deshace los cambios de la transacción que no se han confirmado', 'Borra la base', 'Respalda la base', 'Reinicia el servidor'], 'Por eso se trabaja dentro de BEGIN … COMMIT.'],
      ['Antes de un DELETE en producción conviene…', ['Correr el SELECT con el mismo WHERE y tener respaldo', 'Apagar el antivirus', 'Avisar después', 'Usar LIMIT 1000'], 'Ves exactamente qué se va a borrar.']
    ],
    tip: 'En producción trabaja con un usuario que solo tenga los permisos necesarios: si tu cuenta no puede hacer DELETE, no puedes borrar por error.'
  },
  {
    id: 'l9', t: 'Crear tablas, llaves e índices', nivel: 'Intermedio',
    que: 'CREATE TABLE define columnas, tipos y reglas. La llave primaria identifica cada fila; la llave foránea asegura que una relación exista; un índice acelera búsquedas.',
    para: 'Guardar evidencia de un incidente, una lista de IPs bloqueadas o un inventario de activos con reglas que eviten datos basura.',
    pasos: ['Elige nombre y columnas.', 'Asigna tipo a cada columna (INTEGER, TEXT, REAL; en PostgreSQL también TIMESTAMPTZ, JSONB, INET).', 'Marca la llave primaria y las reglas (NOT NULL, UNIQUE, CHECK).', 'Agrega índices en columnas que filtras mucho.'],
    sintaxis: "CREATE TABLE bloqueos (\n  ip TEXT PRIMARY KEY,\n  motivo TEXT NOT NULL,\n  creado TEXT DEFAULT CURRENT_TIMESTAMP\n);\nCREATE INDEX idx_inicios_ip ON inicios_sesion(ip);",
    params: [['PRIMARY KEY', 'identificador único de cada fila'], ['REFERENCES t(col)', 'llave foránea: el valor debe existir en otra tabla'], ['NOT NULL / UNIQUE / CHECK', 'reglas de calidad de datos'], ['CREATE INDEX', 'acelera WHERE y JOIN sobre esa columna'], ['SERIAL / IDENTITY', 'en PostgreSQL, id que se incrementa solo (en SQLite: INTEGER PRIMARY KEY)']],
    ej: { sql: "CREATE TABLE notas (id INTEGER PRIMARY KEY, texto TEXT NOT NULL);\nINSERT INTO notas (texto) VALUES ('primera nota');\nSELECT * FROM notas;", exp: 'Una tabla mínima con id automático.' },
    sec: { sql: "CREATE TABLE evidencias (\n  id INTEGER PRIMARY KEY,\n  alerta_id INTEGER REFERENCES alertas(id),\n  archivo TEXT NOT NULL,\n  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),\n  recolectado TEXT DEFAULT CURRENT_TIMESTAMP\n);", exp: 'Cadena de custodia: cada evidencia ligada a su alerta y con un hash SHA-256 obligatorio de 64 caracteres.' },
    ejercicio: { ask: 'Crea la tabla bloqueos con columnas ip (llave primaria) y motivo, e inserta las IPs que tienen 5 o más inicios fallidos (puedes escribirlas o insertarlas con un SELECT).', mode: 'state', sql: "CREATE TABLE bloqueos (ip TEXT PRIMARY KEY, motivo TEXT); INSERT INTO bloqueos SELECT ip, 'fuerza bruta' FROM inicios_sesion WHERE exito = 0 GROUP BY ip HAVING COUNT(*) >= 5", verify: 'SELECT ip FROM bloqueos ORDER BY ip', hint: "CREATE TABLE bloqueos (ip TEXT PRIMARY KEY, motivo TEXT);\nINSERT INTO bloqueos SELECT ip, 'fuerza bruta' FROM inicios_sesion WHERE exito = 0 GROUP BY ip HAVING COUNT(*) >= 5;" },
    quiz: [
      ['¿Qué garantiza una llave foránea?', ['Que el valor exista en la tabla relacionada', 'Que el valor sea único', 'Que la tabla esté cifrada', 'Que la consulta sea rápida'], 'Evita alertas apuntando a equipos que no existen.'],
      ['¿Cuándo conviene un índice?', ['En columnas que filtras o unes seguido, como ip o fecha', 'En todas las columnas siempre', 'Nunca', 'Solo en tablas vacías'], 'Acelera lecturas, pero cada índice hace un poco más lentas las escrituras.'],
      ['En PostgreSQL, ¿qué tipo guarda una IP y permite buscar por red (192.168.0.0/16)?', ['INET', 'TEXT', 'INTEGER', 'BOOLEAN'], 'PostgreSQL tiene INET y CIDR con operadores de red.']
    ],
    tip: 'Diseña pensando en la investigación futura: fecha con zona horaria, usuario, IP y origen en cada evento.'
  },
  {
    id: 'l10', t: 'Seguridad de bases de datos e inyección SQL', nivel: 'Avanzado',
    que: 'La inyección SQL pasa cuando una app pega texto del usuario dentro de una consulta. El atacante escribe SQL en un formulario y la base lo ejecuta. Se evita con consultas parametrizadas.',
    para: 'Es de las vulnerabilidades web más explotadas (OWASP A03: Inyección). Además, una base mal protegida (contraseñas débiles, expuesta a Internet, sin cifrado) es objetivo directo.',
    pasos: ["Código vulnerable: \"SELECT * FROM cuentas WHERE usuario = '\" + entrada + \"'\".", "Si la entrada es ' OR '1'='1, la condición siempre es verdadera.", 'Solución: parámetros (?, $1) que el motor trata como DATOS, nunca como código.', 'Además: mínimo privilegio, cifrado, respaldos, auditoría y no exponer el puerto (5432, 3306) a Internet.'],
    sintaxis: "-- MAL (concatenar texto)\nconsulta = \"SELECT * FROM usuarios WHERE usuario = '\" + u + \"'\"\n-- BIEN (parámetros)\ncursor.execute(\"SELECT * FROM usuarios WHERE usuario = %s\", (u,))\n-- PostgreSQL: mínimo privilegio\nCREATE ROLE reportes LOGIN PASSWORD '…';\nGRANT SELECT ON alertas TO reportes;",
    params: [['?, $1, %s', 'marcadores de parámetro (según el lenguaje)'], ['GRANT / REVOKE', 'dar o quitar permisos en PostgreSQL, MySQL, SQL Server'], ['VIEW', 'muestra solo ciertas columnas a ciertos usuarios'], ['pg_hba.conf', 'en PostgreSQL decide quién se conecta, desde dónde y cómo'], ['pgaudit / logs', 'registro de quién consultó o cambió qué']],
    ej: { sql: "SELECT usuario, rol FROM usuarios WHERE usuario = 'lgarcia';", exp: 'Consulta normal: un solo usuario.' },
    sec: { sql: "-- Así se ve lo que hace un atacante si la app concatena:\nSELECT usuario, rol FROM usuarios WHERE usuario = '' OR '1'='1';", exp: "La entrada ' OR '1'='1 hizo que el WHERE siempre fuera verdadero: salen TODAS las cuentas. Con parámetros, el motor buscaría literalmente un usuario llamado ' OR '1'='1 y no encontraría nada." },
    ejercicio: { ask: "Muestra las alertas de tipo 'Inyección SQL' y de qué IP vinieron (columnas fecha, ip_origen y estado).", sql: "SELECT fecha, ip_origen, estado FROM alertas WHERE tipo = 'Inyección SQL'", hint: "WHERE tipo = 'Inyección SQL'" },
    quiz: [
      ['¿Cuál es la defensa principal contra la inyección SQL?', ['Consultas parametrizadas', 'Ocultar los errores', 'Usar contraseñas largas', 'Poner la base en otro puerto'], 'Filtrar caracteres ayuda poco; los parámetros separan código de datos.'],
      ["Ves en el log web: /buscar?q=' UNION SELECT usuario, clave FROM usuarios--. ¿Qué es?", ['Un intento de inyección SQL para robar credenciales', 'Tráfico normal', 'Un escaneo de puertos', 'Phishing'], 'UNION SELECT intenta pegar resultados de otra tabla.'],
      ['¿Qué permiso debería tener la cuenta que usa una app de reportes?', ['Solo SELECT en las tablas que necesita', 'Superusuario', 'Dueño de la base', 'Todos los permisos para no fallar'], 'Mínimo privilegio: si roban esa cuenta, el daño es menor.']
    ],
    tip: 'Nunca expongas PostgreSQL (5432), MySQL (3306) o SQL Server (1433) a Internet. Accede por VPN o por un servidor de salto.'
  },
  {
    id: 'l11', t: 'PostgreSQL a fondo', nivel: 'Avanzado',
    que: 'PostgreSQL es una base de datos de servidor, gratuita y muy usada en empresas y en la nube (AWS RDS, Azure, Supabase, Neon). Funciona como un servicio con usuarios, permisos y conexiones por red.',
    para: 'Muchas aplicaciones y herramientas de seguridad la usan por dentro. Saber administrarla y auditarla te sirve en SOC, nube y desarrollo.',
    pasos: ['Te conectas con psql: psql -h servidor -U usuario -d base.', 'Exploras con comandos que empiezan con \\ (\\dt, \\d tabla, \\du).', 'Consultas con SQL estándar más extras propios.', 'Administras roles, permisos, respaldos (pg_dump) y monitoreo (pg_stat_activity).'],
    sintaxis: "\\l            -- bases de datos\n\\c academia   -- conectarse a una base\n\\dt           -- tablas\n\\d usuarios   -- columnas de una tabla\n\\du           -- roles y permisos\n\\q            -- salir\nSELECT pid, usename, client_addr, query FROM pg_stat_activity;\nINSERT INTO bloqueos (ip, motivo) VALUES ('185.220.101.47', 'fuerza bruta') RETURNING *;",
    params: [['SERIAL / GENERATED … AS IDENTITY', 'id automático'], ['TIMESTAMPTZ', 'fecha y hora con zona horaria'], ['JSONB', 'guarda JSON y permite buscar dentro'], ['INET / CIDR', 'IPs y redes con operadores (<<= "está dentro de")'], ['RETURNING', 'devuelve las filas que insertaste o cambiaste'], ['EXPLAIN ANALYZE', 'muestra cómo ejecuta la consulta y cuánto tarda'], ['pg_dump', 'respaldo lógico de una base']],
    ej: { sql: '\\dt', exp: 'En esta consola puedes usar \\dt y \\d tabla como en psql (aquí el motor es SQLite, pero los comandos se traducen).' },
    sec: { sql: "-- PostgreSQL real (no corre en esta consola):\nSELECT usename, client_addr, backend_start, query\nFROM pg_stat_activity\nWHERE client_addr IS NOT NULL;", exp: 'Quién está conectado ahora, desde qué IP y qué está ejecutando. Útil si sospechas de una conexión rara.' },
    ejercicio: { ask: 'Usa el estilo PostgreSQL: muestra las columnas de la tabla alertas con \\d alertas. Luego escribe aquí una consulta que liste ip_origen y tipo de las alertas criticas.', sql: "SELECT ip_origen, tipo FROM alertas WHERE severidad = 'critica'", hint: "SELECT ip_origen, tipo FROM alertas WHERE severidad = 'critica';" },
    quiz: [
      ['En psql, ¿qué comando lista las tablas?', ['\\dt', '\\q', 'SHOW TABLES', '.tables'], 'SHOW TABLES es de MySQL y .tables de SQLite.'],
      ['¿Qué archivo de PostgreSQL controla quién se puede conectar y desde dónde?', ['pg_hba.conf', 'postgresql.log', 'hosts', 'my.cnf'], 'hba = host-based authentication.'],
      ['¿Para qué sirve RETURNING en PostgreSQL?', ['Para obtener las filas afectadas por un INSERT, UPDATE o DELETE', 'Para deshacer cambios', 'Para salir de psql', 'Para respaldar'], 'Te ahorra una segunda consulta.'],
      ['¿Qué tipo usarías para guardar la fecha de un evento de seguridad en PostgreSQL?', ['TIMESTAMPTZ', 'TEXT', 'INTEGER', 'BOOLEAN'], 'Con zona horaria evitas confusiones entre países.']
    ],
    tip: 'Para practicar PostgreSQL de verdad: instálalo en Linux (sudo apt install postgresql) o en Docker (docker run -e POSTGRES_PASSWORD=… -p 127.0.0.1:5432:5432 postgres). Fíjate que el puerto quede solo en 127.0.0.1.'
  },
  {
    id: 'l12', t: 'SQLite a fondo (y forense)', nivel: 'Avanzado',
    que: 'SQLite es una base de datos que vive en un solo archivo, sin servidor. Viene dentro de navegadores, celulares y muchísimas apps.',
    para: 'Para desarrollo rápido y, en seguridad, para forense: el historial de Chrome y Firefox, mensajes de apps móviles y configuraciones suelen ser archivos SQLite.',
    pasos: ['Abres el archivo: sqlite3 History.', 'Exploras con comandos que empiezan con punto (.tables, .schema).', 'Consultas con SQL normal.', 'En forense trabajas SIEMPRE sobre una copia, nunca sobre el original.'],
    sintaxis: ".tables              -- tablas\n.schema alertas      -- cómo se creó la tabla\n.headers on          -- mostrar nombres de columna\n.mode column         -- formato en columnas\nPRAGMA table_info(usuarios);\nPRAGMA integrity_check;",
    params: [['.tables / .schema', 'explorar la estructura'], ['PRAGMA table_info(t)', 'columnas y tipos'], ['PRAGMA integrity_check', 'revisa si el archivo está dañado'], ['-wal y -shm', 'archivos junto al .db con cambios recientes: cópialos también en forense']],
    ej: { sql: '.tables', exp: 'Lista las tablas, igual que \\dt.' },
    sec: { sql: "-- Historial de Chrome (en una COPIA del archivo History):\nSELECT url, title, datetime(last_visit_time/1000000 - 11644473600, 'unixepoch') AS visita\nFROM urls ORDER BY last_visit_time DESC LIMIT 20;", exp: 'Chrome guarda el tiempo en microsegundos desde 1601: la fórmula lo convierte a fecha normal. Así se reconstruye qué sitios visitó un equipo comprometido.' },
    ejercicio: { ask: 'Revisa la estructura con PRAGMA table_info(vulnerabilidades) y luego lista cve y cvss de las vulnerabilidades SIN parchar con CVSS mayor o igual a 9.', sql: "SELECT cve, cvss FROM vulnerabilidades WHERE estado = 'abierta' AND cvss >= 9", hint: "WHERE estado = 'abierta' AND cvss >= 9" },
    quiz: [
      ['¿Qué es lo primero que haces con un archivo SQLite que es evidencia?', ['Sacarle hash y trabajar sobre una copia', 'Abrirlo y editarlo', 'Borrar los archivos -wal', 'Subirlo a Internet para analizarlo'], 'Preservas la evidencia y su integridad.'],
      ['¿Qué comando de SQLite muestra cómo se creó una tabla?', ['.schema', '\\d', 'DESCRIBE', 'SHOW CREATE'], '\\d es de psql; DESCRIBE y SHOW CREATE son de MySQL.'],
      ['¿Dónde es común encontrar bases SQLite?', ['Navegadores, celulares y apps de escritorio', 'Solo en mainframes', 'Solo en servidores Oracle', 'En el BIOS'], 'Por eso aparece tanto en forense.']
    ],
    tip: 'Si te piden "saber SQL" en una vacante, practica las mismas consultas en SQLite (rápido) y en PostgreSQL (lo que verás en empresas).'
  }
);

/* ---------- retos de investigación (consultas que se califican solas) ---------- */
const SQL_CHALLENGES = [
  { id: 'r1', t: 'La IP más insistente', nivel: 'Básico', ask: '¿Qué IP tiene más inicios de sesión fallidos? Devuelve dos columnas: la IP y el número de fallos (solo la primera).', sql: 'SELECT ip, COUNT(*) FROM inicios_sesion WHERE exito = 0 GROUP BY ip ORDER BY COUNT(*) DESC LIMIT 1', hint: 'WHERE exito = 0 GROUP BY ip ORDER BY COUNT(*) DESC LIMIT 1', why: 'Contar fallos por IP es la base de cualquier regla de fuerza bruta en un SIEM.' },
  { id: 'r2', t: '¿Funcionó el ataque?', nivel: 'Intermedio', ask: '¿Con qué cuentas (columna usuario) se entró con éxito desde 185.220.101.47? Sin repetidos.', sql: "SELECT DISTINCT u.usuario FROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id WHERE i.ip = '185.220.101.47' AND i.exito = 1", hint: "JOIN usuarios u ON u.id = i.usuario_id WHERE i.ip = '185.220.101.47' AND i.exito = 1", why: 'Fallos seguidos de un éxito desde la misma IP = cuenta comprometida. Se escala como incidente.' },
  { id: 'r3', t: 'Admins sin MFA', nivel: 'Básico', ask: 'Lista las cuentas (usuario) con rol admin que NO tienen MFA.', sql: "SELECT usuario FROM usuarios WHERE rol = 'admin' AND mfa = 0", hint: "WHERE rol = 'admin' AND mfa = 0", why: 'Cuentas privilegiadas sin MFA son la puerta favorita del atacante. Es de lo primero que revisa una auditoría.' },
  { id: 'r4', t: 'Cuenta fantasma', nivel: 'Intermedio', ask: 'Encuentra las cuentas desactivadas que tienen inicios de sesión exitosos. Devuelve usuario, fecha e ip de esos inicios.', sql: 'SELECT u.usuario, i.fecha, i.ip FROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id WHERE u.activo = 0 AND i.exito = 1', hint: 'JOIN … WHERE u.activo = 0 AND i.exito = 1', why: 'Bajas mal hechas: la cuenta se marcó inactiva pero la VPN siguió aceptándola.' },
  { id: 'r5', t: 'Viaje imposible', nivel: 'Avanzado', ask: '¿Qué usuarios tuvieron inicios EXITOSOS desde 2 o más países distintos el mismo día? Devuelve usuario y día.', sql: "SELECT u.usuario, date(i.fecha) FROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id WHERE i.exito = 1 GROUP BY u.usuario, date(i.fecha) HAVING COUNT(DISTINCT i.pais) >= 2", hint: 'GROUP BY u.usuario, date(i.fecha) HAVING COUNT(DISTINCT i.pais) >= 2', why: 'Nadie viaja de México a Nigeria en 40 minutos: credenciales robadas o una VPN rara. Microsoft Entra ID y los SIEM tienen esta detección.' },
  { id: 'r6', t: 'Parches atrasados', nivel: 'Básico', ask: 'Equipos con más de 90 días sin parche: hostname y dias_sin_parche, del más atrasado al menos.', sql: 'SELECT hostname, dias_sin_parche FROM equipos WHERE dias_sin_parche > 90 ORDER BY dias_sin_parche DESC', ordered: true, hint: 'WHERE dias_sin_parche > 90 ORDER BY dias_sin_parche DESC', why: 'La gestión de vulnerabilidades empieza por saber qué está atrasado y priorizar.' },
  { id: 'r7', t: 'Prioridad de remediación', nivel: 'Intermedio', ask: 'Vulnerabilidades ABIERTAS con CVSS de 9 o más: hostname, cve y cvss.', sql: "SELECT e.hostname, v.cve, v.cvss FROM vulnerabilidades v JOIN equipos e ON e.id = v.equipo_id WHERE v.estado = 'abierta' AND v.cvss >= 9", hint: "JOIN equipos e ON e.id = v.equipo_id WHERE v.estado = 'abierta' AND v.cvss >= 9", why: 'Enfoque basado en riesgo: primero lo crítico y expuesto. En la vida real también se cruza con EPSS y el catálogo KEV de CISA.' },
  { id: 'r8', t: 'Equipos sin EDR', nivel: 'Intermedio', ask: 'Equipos sin EDR (edr = 0): hostname y nombre del departamento.', sql: 'SELECT e.hostname, d.nombre FROM equipos e JOIN departamentos d ON d.id = e.departamento_id WHERE e.edr = 0', hint: 'JOIN departamentos d ON d.id = e.departamento_id WHERE e.edr = 0', why: 'Un equipo sin EDR es un punto ciego: si lo atacan, el SOC no ve nada.' },
  { id: 'r9', t: 'Contención', nivel: 'Intermedio', mode: 'state', ask: 'Desactiva la cuenta soporte_temp y cambia a en_proceso la alerta 8. Nada más debe cambiar.', sql: "UPDATE usuarios SET activo = 0 WHERE usuario = 'soporte_temp'; UPDATE alertas SET estado = 'en_proceso' WHERE id = 8", verify: "SELECT 'cuenta:' || usuario FROM usuarios WHERE activo = 0 UNION ALL SELECT 'alerta:' || id || ':' || estado FROM alertas WHERE estado = 'en_proceso'", hint: "UPDATE usuarios SET activo = 0 WHERE usuario = 'soporte_temp';\nUPDATE alertas SET estado = 'en_proceso' WHERE id = 8;", why: 'Contener primero (cortar el acceso), investigar después. Y siempre con WHERE.' },
  { id: 'r10', t: 'Reporte para el jefe', nivel: 'Avanzado', ask: 'Cuántas alertas ABIERTAS hay por severidad, de la más grave a la menos (critica, alta, media, baja). Dos columnas: severidad y total.', sql: "SELECT severidad, COUNT(*) FROM alertas WHERE estado = 'abierta' GROUP BY severidad ORDER BY CASE severidad WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END", ordered: true, hint: "ORDER BY CASE severidad WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END", why: 'CASE te deja ordenar por importancia y no por orden alfabético. Así se ven los reportes ejecutivos.' }
];

/* ---------- examen final ---------- */
const SQL_EXAM_THEORY_EXTRA = [
  ['¿Qué significa SQL?', ['Structured Query Language', 'Secure Query Login', 'System Quality Level', 'Simple Question List'], 'Lenguaje estructurado de consultas.', 'Conceptos'],
  ['¿Qué base de datos NO necesita un servidor corriendo?', ['SQLite', 'PostgreSQL', 'MySQL', 'SQL Server'], 'SQLite es una librería que lee y escribe un archivo.', 'Conceptos'],
  ['¿En qué orden se escriben las partes de una consulta?', ['SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT', 'FROM, SELECT, ORDER BY, WHERE', 'WHERE, SELECT, FROM', 'SELECT, WHERE, FROM, LIMIT'], 'Ese orden es obligatorio; si lo cambias hay error de sintaxis.', 'Consultas'],
  ['¿Qué puerto usa PostgreSQL por defecto?', ['5432', '3306', '1433', '1521'], '3306 es MySQL, 1433 SQL Server y 1521 Oracle.', 'PostgreSQL'],
  ['COUNT(DISTINCT pais) cuenta…', ['Cuántos países diferentes hay', 'Cuántas filas hay', 'Cuántos países nulos hay', 'El país más repetido'], 'DISTINCT quita repetidos antes de contar.', 'Agregación'],
  ['¿Qué hace un respaldo con pg_dump?', ['Exporta una base de PostgreSQL a un archivo para restaurarla después', 'Borra la base', 'Cifra la red', 'Reinicia el servicio'], 'Los respaldos se prueban restaurándolos, no solo creándolos.', 'PostgreSQL'],
  ['Un usuario de la app de reportes ejecuta DROP TABLE. ¿Qué control falló?', ['Mínimo privilegio: no debía tener ese permiso', 'El antivirus', 'El firewall de la PC', 'El DNS'], 'Con solo SELECT, ese comando habría sido rechazado.', 'Seguridad'],
  ['¿Qué consulta es vulnerable a inyección?', ['La que arma el SQL pegando el texto que escribe el usuario', 'La que usa parámetros $1', 'La que usa una vista', 'La que tiene LIMIT'], 'Concatenar entrada del usuario es el error de raíz.', 'Seguridad']
];
const SQL_EXAM_PRACTICE = [
  { id: 'e1', ask: '¿Cuántas alertas están abiertas? (una columna con el número)', sql: "SELECT COUNT(*) FROM alertas WHERE estado = 'abierta'", tema: 'Agregación' },
  { id: 'e2', ask: 'Usuarios (columna usuario) del departamento TI. Usa el nombre del departamento, no el número.', sql: "SELECT u.usuario FROM usuarios u JOIN departamentos d ON d.id = u.departamento_id WHERE d.nombre = 'TI'", tema: 'JOIN' },
  { id: 'e3', ask: 'Para cada equipo con vulnerabilidades abiertas: hostname y cuántas tiene abiertas.', sql: "SELECT e.hostname, COUNT(*) FROM vulnerabilidades v JOIN equipos e ON e.id = v.equipo_id WHERE v.estado = 'abierta' GROUP BY e.hostname", tema: 'JOIN y agrupación' },
  { id: 'e4', ask: 'Último inicio de sesión EXITOSO de cada cuenta ACTIVA: usuario y fecha más reciente.', sql: 'SELECT u.usuario, MAX(i.fecha) FROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id WHERE u.activo = 1 AND i.exito = 1 GROUP BY u.usuario', tema: 'Agregación' },
  { id: 'e5', ask: 'Tipos de alerta (columna tipo, sin repetir) que vinieron de una IP que también aparece en inicios_sesion.', sql: 'SELECT DISTINCT tipo FROM alertas WHERE ip_origen IN (SELECT ip FROM inicios_sesion)', tema: 'Subconsultas' }
];
if (typeof module !== 'undefined') module.exports = { SQL_LESSONS, SQL_CHALLENGES, SQL_EXAM_THEORY_EXTRA, SQL_EXAM_PRACTICE };
