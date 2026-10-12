/* ===== Bases de datos: base de práctica (empresa ficticia) y lecciones 1-6 ===== */
/* Todo es ficticio: personas, equipos e IPs internas inventadas para practicar. */
const SQL_SCHEMA = `
CREATE TABLE departamentos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  piso INTEGER
);
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  nombre TEXT,
  departamento_id INTEGER REFERENCES departamentos(id),
  rol TEXT,              -- usuario | admin | directivo
  activo INTEGER DEFAULT 1,
  mfa INTEGER DEFAULT 0, -- 1 = tiene verificación en dos pasos
  creado TEXT
);
CREATE TABLE equipos (
  id INTEGER PRIMARY KEY,
  hostname TEXT UNIQUE,
  ip TEXT,
  so TEXT,
  departamento_id INTEGER REFERENCES departamentos(id),
  dias_sin_parche INTEGER,
  edr INTEGER DEFAULT 1  -- 1 = tiene EDR instalado
);
CREATE TABLE inicios_sesion (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  fecha TEXT,            -- 'AAAA-MM-DD HH:MM:SS'
  ip TEXT,
  pais TEXT,
  exito INTEGER,         -- 1 = entró, 0 = falló
  metodo TEXT            -- local | vpn | rdp
);
CREATE TABLE alertas (
  id INTEGER PRIMARY KEY,
  fecha TEXT,
  severidad TEXT,        -- baja | media | alta | critica
  tipo TEXT,
  equipo_id INTEGER REFERENCES equipos(id),
  ip_origen TEXT,
  estado TEXT            -- abierta | en_proceso | cerrada | falso_positivo
);
CREATE TABLE vulnerabilidades (
  id INTEGER PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id),
  cve TEXT,
  cvss REAL,
  descripcion TEXT,
  estado TEXT            -- abierta | parchada
);`;

function sqlSeed() {
  const q = v => v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
  const ins = (t, rows) => rows.map(r => `INSERT INTO ${t} VALUES (${r.map(q).join(', ')});`).join('\n');
  const deps = [[1, 'Ventas', 1], [2, 'Contabilidad', 2], [3, 'TI', 3], [4, 'Recursos Humanos', 2], [5, 'Dirección', 4]];
  const users = [
    [1, 'lgarcia', 'Laura García', 1, 'usuario', 1, 1, '2024-02-10'], [2, 'mrodriguez', 'Mario Rodríguez', 1, 'usuario', 1, 0, '2023-11-05'],
    [3, 'alopez', 'Ana López', 2, 'usuario', 1, 1, '2022-06-21'], [4, 'jperez', 'Jorge Pérez', 2, 'usuario', 0, 0, '2021-03-15'],
    [5, 'shernandez', 'Sofía Hernández', 3, 'admin', 1, 1, '2020-09-01'], [6, 'admin', 'Administrador', 3, 'admin', 1, 0, '2019-01-01'],
    [7, 'soporte_temp', 'Soporte temporal', 3, 'admin', 1, 0, '2026-10-03'], [8, 'cmartinez', 'Carlos Martínez', 4, 'usuario', 1, 1, '2023-04-18'],
    [9, 'dsanchez', 'Diana Sánchez', 5, 'directivo', 1, 1, '2018-07-30'], [10, 'rtorres', 'Raúl Torres', 1, 'usuario', 1, 0, '2025-01-12'],
    [11, 'pflores', 'Paola Flores', 2, 'usuario', 1, 1, '2024-08-25'], [12, 'gruiz', 'Gabriel Ruiz', 3, 'usuario', 1, 1, '2025-05-02']
  ];
  const eq = [
    [1, 'VEN-PC01', '192.168.10.11', 'Windows 11', 1, 5, 1], [2, 'VEN-PC02', '192.168.10.12', 'Windows 10', 1, 94, 1],
    [3, 'CON-PC01', '192.168.20.11', 'Windows 11', 2, 12, 1], [4, 'CON-PC02', '192.168.20.12', 'Windows 10', 2, 131, 0],
    [5, 'TI-SRV-WEB', '172.16.0.10', 'Ubuntu 22.04', 3, 41, 1], [6, 'TI-SRV-DC', '192.168.30.5', 'Windows Server 2019', 3, 67, 1],
    [7, 'TI-SRV-FILES', '192.168.30.6', 'Windows Server 2016', 3, 210, 1], [8, 'RH-PC01', '192.168.40.11', 'Windows 11', 4, 3, 1],
    [9, 'DIR-LAP01', '192.168.50.21', 'Windows 11', 5, 8, 1], [10, 'TI-SRV-DB', '192.168.30.7', 'Ubuntu 20.04', 3, 155, 0],
    [11, 'VEN-LAP03', '192.168.10.33', 'macOS 14', 1, 20, 0], [12, 'TI-PRN01', '192.168.30.50', 'Firmware de impresora', 3, 400, 0]
  ];
  const log = []; let id = 1;
  const add = (u, f, ip, pais, ok, m) => log.push([id++, u, f, ip, pais, ok, m]);
  const normal = [[1, '192.168.10.11'], [2, '192.168.10.12'], [3, '192.168.20.11'], [5, '192.168.30.20'], [8, '192.168.40.11'], [9, '192.168.50.21'], [10, '192.168.10.33'], [11, '192.168.20.14'], [12, '192.168.30.21']];
  ['2026-10-05', '2026-10-06', '2026-10-07'].forEach((d, di) => normal.forEach(([u, ip], k) => add(u, `${d} 08:${String(5 + k * 4 + di).padStart(2, '0')}:00`, ip, 'MX', 1, 'local')));
  add(9, '2026-10-08 08:31:10', '192.168.50.21', 'MX', 0, 'local'); add(9, '2026-10-08 08:31:40', '192.168.50.21', 'MX', 0, 'local'); add(9, '2026-10-08 08:32:05', '192.168.50.21', 'MX', 1, 'local');
  add(4, '2026-10-08 22:15:03', '189.203.5.77', 'MX', 1, 'vpn');                    // cuenta deshabilitada que entra
  add(2, '2026-10-09 09:05:22', '201.141.20.15', 'MX', 1, 'vpn');                    // viaje imposible
  add(2, '2026-10-09 09:48:51', '102.89.34.7', 'NG', 1, 'vpn');
  [1, 2, 3, 8, 9, 10, 11, 12].forEach((u, k) => add(u, `2026-10-11 02:4${k}:10`, '45.13.22.9', 'NL', 0, 'vpn')); // password spraying
  for (let k = 0; k < 24; k++) add(6, `2026-10-11 03:0${Math.floor(k / 4)}:${String((k % 4) * 15).padStart(2, '0')}`, '185.220.101.47', 'RU', 0, 'rdp'); // fuerza bruta
  add(6, '2026-10-11 03:07:12', '185.220.101.47', 'RU', 1, 'rdp');
  add(7, '2026-10-11 03:12:40', '185.220.101.47', 'RU', 1, 'rdp');
  const al = [
    [1, '2026-10-11 03:05:00', 'alta', 'Fuerza bruta RDP', 6, '185.220.101.47', 'abierta'], [2, '2026-10-11 02:45:00', 'media', 'Password spraying', 6, '45.13.22.9', 'abierta'],
    [3, '2026-10-09 09:50:00', 'alta', 'Viaje imposible', null, '102.89.34.7', 'en_proceso'], [4, '2026-10-10 11:20:00', 'media', 'Phishing reportado', 1, '91.240.118.172', 'cerrada'],
    [5, '2026-10-10 11:32:00', 'critica', 'Malware detectado', 2, '91.240.118.172', 'abierta'], [6, '2026-10-07 16:02:00', 'baja', 'Escaneo de puertos', 5, '198.51.100.23', 'falso_positivo'],
    [7, '2026-10-08 13:40:00', 'alta', 'Inyección SQL', 5, '198.51.100.23', 'en_proceso'], [8, '2026-10-11 03:15:00', 'critica', 'Cuenta privilegiada creada', 6, '185.220.101.47', 'abierta'],
    [9, '2026-10-06 10:10:00', 'media', 'Exfiltración DLP', 3, null, 'cerrada'], [10, '2026-10-11 04:02:00', 'alta', 'PowerShell codificado', 7, '185.220.101.47', 'abierta'],
    [11, '2026-10-05 12:00:00', 'baja', 'Antivirus desactualizado', 4, null, 'abierta'], [12, '2026-10-09 18:30:00', 'media', 'Uso de IA no autorizada', 9, null, 'en_proceso'],
    [13, '2026-10-08 22:16:00', 'media', 'Inicio de sesión de cuenta deshabilitada', null, '189.203.5.77', 'abierta'], [14, '2026-10-07 09:00:00', 'baja', 'Escaneo de puertos', 5, '203.0.113.50', 'falso_positivo'],
    [15, '2026-10-10 15:45:00', 'media', 'Macro de Office bloqueada', 3, null, 'cerrada']
  ];
  const vu = [
    [1, 5, 'CVE-2021-44228', 10.0, 'Log4Shell: ejecución remota en Apache Log4j', 'abierta'], [2, 6, 'CVE-2020-1472', 10.0, 'Zerologon: toma del controlador de dominio', 'parchada'],
    [3, 7, 'CVE-2019-0708', 9.8, 'BlueKeep: ejecución remota por RDP', 'abierta'], [4, 7, 'CVE-2017-0144', 8.1, 'EternalBlue: SMBv1 (usado por WannaCry)', 'abierta'],
    [5, 2, 'CVE-2022-30190', 7.8, 'Follina: ejecución vía MSDT desde Office', 'abierta'], [6, 4, 'CVE-2022-30190', 7.8, 'Follina: ejecución vía MSDT desde Office', 'abierta'],
    [7, 6, 'CVE-2021-34527', 8.8, 'PrintNightmare: cola de impresión de Windows', 'parchada'], [8, 12, null, 7.5, 'Contraseña de fábrica en el panel web', 'abierta'],
    [9, 10, 'CVE-2014-0160', 7.5, 'Heartbleed: fuga de memoria en OpenSSL', 'abierta'], [10, 9, 'CVE-2023-23397', 9.8, 'Outlook: robo de hash NTLM sin clic', 'parchada'],
    [11, 3, 'CVE-2023-23397', 9.8, 'Outlook: robo de hash NTLM sin clic', 'abierta']
  ];
  return [ins('departamentos', deps), ins('usuarios', users), ins('equipos', eq), ins('inicios_sesion', log), ins('alertas', al), ins('vulnerabilidades', vu)].join('\n');
}
const SQL_DB_SQL = 'PRAGMA foreign_keys = ON;\n' + SQL_SCHEMA + '\n' + sqlSeed();

/* ---------- lecciones ----------
   Cada lección: qué es, para qué, paso a paso, sintaxis y parámetros, ejemplo normal,
   ejemplo de ciberseguridad, ejercicio en la consola, mini examen y recomendación. */
const SQL_LESSONS = [
  {
    id: 'l1', t: '¿Qué es una base de datos?', nivel: 'Principiante',
    que: 'Una base de datos guarda información ordenada en tablas, como hojas de cálculo con reglas. Cada tabla tiene columnas (qué se guarda) y filas (cada registro). SQL es el idioma para preguntarle cosas.',
    para: 'Casi todo sistema guarda datos en una: usuarios de una app, ventas, logs de seguridad. Un analista SOC consulta bases de datos y SIEMs con lenguajes parecidos a SQL todo el día.',
    pasos: ['Le escribes una consulta en SQL.', 'El motor (SQLite, PostgreSQL, MySQL, SQL Server) la interpreta.', 'Busca en las tablas y te devuelve una tabla de resultados.'],
    sintaxis: 'SELECT columnas FROM tabla;',
    params: [['SELECT', 'qué columnas quieres ver (* = todas)'], ['FROM', 'de qué tabla'], [';', 'termina la instrucción']],
    ej: { sql: 'SELECT * FROM departamentos;', exp: 'Muestra todas las columnas y filas de la tabla departamentos.' },
    sec: { sql: 'SELECT usuario, rol, activo, mfa FROM usuarios;', exp: 'Revisión rápida de cuentas: quién es admin, quién está activo y quién no tiene verificación en dos pasos.' },
    ejercicio: { ask: 'Muestra todas las columnas de la tabla equipos.', sql: 'SELECT * FROM equipos', hint: 'SELECT * FROM equipos;' },
    quiz: [
      ['¿Qué es una fila en una tabla?', ['Un registro: por ejemplo, un usuario o un inicio de sesión', 'Una columna con el nombre del dato', 'El nombre de la base de datos', 'Una contraseña'], 'Las columnas dicen qué datos hay; cada fila es un registro.'],
      ['¿Cuál de estos guarda toda la base de datos en un solo archivo?', ['SQLite', 'PostgreSQL', 'SQL Server', 'Oracle'], 'SQLite es un archivo .db; los otros son servidores con servicio y usuarios.'],
      ['¿Qué hace SELECT * FROM usuarios?', ['Muestra todas las columnas de todos los usuarios', 'Borra la tabla usuarios', 'Crea la tabla usuarios', 'Muestra solo la primera fila'], '* significa todas las columnas; sin WHERE trae todas las filas.']
    ],
    tip: 'Antes de consultar una base que no conoces, mira qué tablas y columnas tiene: en la consola usa \\dt y \\d usuarios (estilo PostgreSQL) o .tables y .schema (estilo SQLite).'
  },
  {
    id: 'l2', t: 'Elegir columnas, ordenar y limitar', nivel: 'Principiante',
    que: 'Puedes pedir solo las columnas que necesitas, ponerles otro nombre (alias), ordenar el resultado y quedarte con los primeros N.',
    para: 'En un incidente no quieres 10,000 filas: quieres las más importantes primero, como los equipos con más días sin parche.',
    pasos: ['Escribe las columnas separadas por coma.', 'Usa AS para renombrar una columna en el resultado.', 'ORDER BY ordena (ASC de menor a mayor, DESC de mayor a menor).', 'LIMIT corta el resultado.'],
    sintaxis: 'SELECT col1, col2 AS alias\nFROM tabla\nORDER BY col2 DESC\nLIMIT 5;',
    params: [['AS', 'pone un nombre más claro a la columna'], ['ORDER BY', 'columna por la que se ordena'], ['DESC / ASC', 'descendente / ascendente (ASC es el de siempre)'], ['LIMIT n', 'máximo de filas (en SQL Server se usa TOP n)']],
    ej: { sql: 'SELECT nombre, piso FROM departamentos ORDER BY piso;', exp: 'Departamentos ordenados por piso, del más bajo al más alto.' },
    sec: { sql: 'SELECT hostname, so, dias_sin_parche AS dias\nFROM equipos\nORDER BY dias_sin_parche DESC\nLIMIT 5;', exp: 'Los 5 equipos más atrasados en parches: tu primera lista de prioridades.' },
    ejercicio: { ask: 'Muestra hostname y dias_sin_parche de los 3 equipos con MÁS días sin parche, del mayor al menor.', sql: 'SELECT hostname, dias_sin_parche FROM equipos ORDER BY dias_sin_parche DESC LIMIT 3', ordered: true, hint: 'ORDER BY dias_sin_parche DESC LIMIT 3' },
    quiz: [
      ['¿Qué hace ORDER BY cvss DESC?', ['Ordena del CVSS más alto al más bajo', 'Borra los CVSS bajos', 'Ordena del más bajo al más alto', 'Agrupa por CVSS'], 'DESC = descendente.'],
      ['¿Para qué sirve LIMIT 10?', ['Para quedarte con máximo 10 filas', 'Para mostrar 10 columnas', 'Para borrar 10 filas', 'Para esperar 10 segundos'], 'Útil para ver un "top 10".'],
      ['SELECT ip AS origen FROM alertas; ¿qué cambia?', ['El nombre de la columna en el resultado', 'El nombre de la columna en la tabla para siempre', 'Los datos de la IP', 'Nada'], 'El alias solo existe en el resultado de esa consulta.']
    ],
    tip: 'Nunca dependas del orden "natural" de una tabla: si el orden importa, ponle ORDER BY.'
  },
  {
    id: 'l3', t: 'Filtrar con WHERE', nivel: 'Básico',
    que: 'WHERE se queda solo con las filas que cumplen una condición.',
    para: 'Filtrar es el 80% del trabajo de investigación: inicios fallidos, una IP específica, alertas abiertas, CVSS altos.',
    pasos: ['Escribe la condición después de WHERE.', 'Combina condiciones con AND (todas) u OR (alguna).', 'Usa paréntesis cuando mezcles AND y OR.', 'El texto va entre comillas simples: \'abierta\'.'],
    sintaxis: "SELECT * FROM tabla\nWHERE columna = 'valor' AND otra > 5;",
    params: [['= <> < > <= >=', 'igual, distinto, menor, mayor…'], ['AND / OR / NOT', 'combinar condiciones'], ["IN ('a','b')", 'que sea alguno de la lista'], ['BETWEEN x AND y', 'dentro de un rango (incluye extremos)'], ["LIKE '%texto%'", '% = cualquier cosa, _ = un carácter'], ['IS NULL', 'que no tenga valor (nunca uses = NULL)']],
    ej: { sql: "SELECT nombre FROM usuarios WHERE departamento_id = 1;", exp: 'Usuarios del departamento 1 (Ventas).' },
    sec: { sql: "SELECT fecha, ip, pais FROM inicios_sesion\nWHERE exito = 0 AND pais <> 'MX';", exp: 'Inicios de sesión fallidos desde fuera de México: candidatos a ataque.' },
    ejercicio: { ask: 'Muestra todas las alertas con severidad alta o critica que sigan abiertas.', sql: "SELECT * FROM alertas WHERE severidad IN ('alta','critica') AND estado = 'abierta'", hint: "WHERE severidad IN ('alta','critica') AND estado = 'abierta'" },
    quiz: [
      ["¿Qué devuelve WHERE pais = 'MX' OR pais = 'US' AND exito = 0?", ['Todos los de MX más los de US fallidos (AND va primero)', 'Solo los fallidos de MX y US', 'Nada', 'Error de sintaxis'], 'AND tiene prioridad sobre OR. Con paréntesis queda claro lo que quieres.'],
      ['¿Cómo buscas filas sin CVE registrado?', ['WHERE cve IS NULL', 'WHERE cve = NULL', "WHERE cve = ''", 'WHERE NOT cve'], 'NULL no es igual a nada, ni a NULL: se usa IS NULL.'],
      ["¿Qué encuentra LIKE '%Server%'?", ['Textos que contienen "Server" en cualquier parte', 'Solo el texto exacto "Server"', 'Textos que terminan en Server', 'Nada, LIKE no existe'], '% representa cualquier cantidad de caracteres.']
    ],
    tip: "En PostgreSQL LIKE distingue mayúsculas y existe ILIKE para ignorarlas. En SQLite LIKE no distingue mayúsculas en letras sin acento."
  },
  {
    id: 'l4', t: 'Contar y agrupar', nivel: 'Básico',
    que: 'Las funciones de agregación resumen muchas filas en un número: cuántas, suma, promedio, mínimo, máximo. GROUP BY hace ese resumen por grupo.',
    para: 'Es la base de detectar fuerza bruta (contar fallos por IP), ver qué equipos tienen más vulnerabilidades o cuántas alertas hay por severidad.',
    pasos: ['Elige la columna por la que agrupas (por ejemplo ip).', 'Aplica la función (COUNT(*)).', 'Usa HAVING para filtrar grupos (WHERE filtra filas antes de agrupar).', 'Ordena por el conteo.'],
    sintaxis: 'SELECT columna, COUNT(*) AS total\nFROM tabla\nWHERE condicion\nGROUP BY columna\nHAVING COUNT(*) > 5\nORDER BY total DESC;',
    params: [['COUNT(*)', 'cuántas filas'], ['SUM / AVG', 'suma / promedio'], ['MIN / MAX', 'menor / mayor (también en fechas)'], ['GROUP BY', 'un resultado por cada valor distinto'], ['HAVING', 'condición sobre el grupo ya contado']],
    ej: { sql: 'SELECT departamento_id, COUNT(*) AS personas\nFROM usuarios GROUP BY departamento_id;', exp: 'Cuántas personas hay por departamento.' },
    sec: { sql: 'SELECT ip, COUNT(*) AS fallos\nFROM inicios_sesion\nWHERE exito = 0\nGROUP BY ip\nHAVING COUNT(*) >= 5\nORDER BY fallos DESC;', exp: 'Detección de fuerza bruta: IPs con 5 o más intentos fallidos. Es casi la misma lógica que una regla de SIEM.' },
    ejercicio: { ask: 'Cuenta cuántas alertas hay por severidad (dos columnas: severidad y total).', sql: 'SELECT severidad, COUNT(*) FROM alertas GROUP BY severidad', hint: 'GROUP BY severidad' },
    quiz: [
      ['¿Qué diferencia hay entre WHERE y HAVING?', ['WHERE filtra filas antes de agrupar; HAVING filtra grupos ya contados', 'Son iguales', 'HAVING solo sirve con texto', 'WHERE va después de GROUP BY'], 'Por eso COUNT(*) va en HAVING, no en WHERE.'],
      ['¿Qué consulta detecta IPs con muchos fallos?', ['SELECT ip, COUNT(*) FROM inicios_sesion WHERE exito=0 GROUP BY ip', 'SELECT * FROM inicios_sesion ORDER BY ip', 'SELECT COUNT(ip) FROM usuarios', 'SELECT ip FROM alertas WHERE ip IS NULL'], 'Filtras los fallidos y cuentas por IP.'],
      ['AVG(cvss) devuelve…', ['El promedio del CVSS', 'El CVSS más alto', 'Cuántos CVSS hay', 'La suma'], 'AVG = average, promedio.']
    ],
    tip: 'Si usas GROUP BY, cada columna del SELECT debe estar en el GROUP BY o dentro de una función (COUNT, MAX…). PostgreSQL te marca error si no; SQLite es más permisivo y puede darte datos engañosos.'
  },
  {
    id: 'l5', t: 'Unir tablas con JOIN', nivel: 'Intermedio',
    que: 'JOIN combina filas de dos tablas que se relacionan por una columna (normalmente un id).',
    para: 'Los logs guardan usuario_id, no el nombre. Para un reporte necesitas unir inicios_sesion con usuarios, o vulnerabilidades con equipos.',
    pasos: ['Escribe la tabla principal en FROM con un alias corto (i).', 'Agrega JOIN otra_tabla alias ON la relación.', 'Usa alias.columna para no confundirte.', 'LEFT JOIN conserva filas aunque no tengan pareja.'],
    sintaxis: 'SELECT u.usuario, i.fecha, i.ip\nFROM inicios_sesion i\nJOIN usuarios u ON u.id = i.usuario_id;',
    params: [['JOIN (INNER)', 'solo filas que tienen pareja en las dos tablas'], ['LEFT JOIN', 'todas las de la izquierda; si no hay pareja, columnas en NULL'], ['ON', 'la condición que las relaciona'], ['alias', 'nombre corto de la tabla (u, i, e)']],
    ej: { sql: 'SELECT u.usuario, d.nombre AS departamento\nFROM usuarios u\nJOIN departamentos d ON d.id = u.departamento_id;', exp: 'Cada usuario con el nombre de su departamento.' },
    sec: { sql: "SELECT e.hostname, v.cve, v.cvss\nFROM vulnerabilidades v\nJOIN equipos e ON e.id = v.equipo_id\nWHERE v.estado = 'abierta'\nORDER BY v.cvss DESC;", exp: 'Vulnerabilidades abiertas con el nombre del equipo, las más graves primero: lo que le entregas al equipo de TI para parchar.' },
    ejercicio: { ask: 'Muestra el usuario (nombre de cuenta) y el país de cada inicio de sesión EXITOSO hecho fuera de México.', sql: "SELECT u.usuario, i.pais FROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id WHERE i.exito = 1 AND i.pais <> 'MX'", hint: "JOIN usuarios u ON u.id = i.usuario_id WHERE i.exito = 1 AND i.pais <> 'MX'" },
    quiz: [
      ['¿Qué hace LEFT JOIN equipos e ON e.id = a.equipo_id desde alertas a?', ['Muestra todas las alertas, aunque no tengan equipo (con NULL)', 'Solo alertas con equipo', 'Solo equipos sin alertas', 'Borra alertas sin equipo'], 'LEFT conserva todo lo de la tabla izquierda.'],
      ['¿Por qué se usa u.id = i.usuario_id?', ['Porque usuario_id en inicios_sesion apunta al id de usuarios', 'Porque son textos iguales', 'Porque así se ordena', 'Para crear la tabla'], 'Es la llave foránea: la relación entre tablas.'],
      ['Un JOIN sin ON (o con ON mal puesto) puede…', ['Multiplicar las filas: cada fila con todas las de la otra tabla', 'Dar error siempre', 'Devolver cero filas siempre', 'Borrar datos'], 'Es el producto cartesiano: 70 × 12 = 840 filas sin sentido.']
    ],
    tip: 'Si tu resultado tiene muchas más filas de las que esperabas, revisa el ON del JOIN.'
  },
  {
    id: 'l6', t: 'Fechas y texto', nivel: 'Intermedio',
    que: 'Las bases tienen funciones para trabajar con fechas (extraer la hora, el día, restar tiempo) y con texto (mayúsculas, recortar, unir).',
    para: 'Detectar actividad fuera de horario, agrupar por día, normalizar nombres de usuario o armar mensajes para un reporte.',
    pasos: ['En SQLite las fechas se guardan como texto ISO: 2026-10-11 03:07:12.', 'strftime(\'%H\', fecha) saca la hora; date(fecha) saca el día.', 'En PostgreSQL usas tipos de verdad (TIMESTAMPTZ) y funciones como EXTRACT, date_trunc y now() - interval.', 'Para texto: lower(), upper(), substr(), y || para unir.'],
    sintaxis: "-- SQLite\nSELECT strftime('%H', fecha) AS hora FROM inicios_sesion;\n-- PostgreSQL\nSELECT EXTRACT(HOUR FROM fecha) FROM inicios_sesion;\nSELECT * FROM inicios_sesion WHERE fecha > now() - interval '24 hours';",
    params: [["date(fecha)", 'solo el día (SQLite)'], ["strftime('%H', fecha)", 'la hora como texto 00-23 (SQLite)'], ["datetime('now', '-1 day')", 'hace un día (SQLite)'], ["now() - interval '1 day'", 'lo mismo en PostgreSQL'], ['a || b', 'une textos (en SQL Server se usa +)']],
    ej: { sql: "SELECT date(fecha) AS dia, COUNT(*) AS inicios\nFROM inicios_sesion GROUP BY dia;", exp: 'Inicios de sesión por día.' },
    sec: { sql: "SELECT u.usuario, i.fecha, i.ip\nFROM inicios_sesion i JOIN usuarios u ON u.id = i.usuario_id\nWHERE i.exito = 1 AND strftime('%H', i.fecha) BETWEEN '00' AND '05';", exp: 'Inicios exitosos de madrugada (00:00 a 05:59): fuera de horario, merecen revisión.' },
    ejercicio: { ask: 'Lista los inicios de sesión (todas las columnas) ocurridos entre las 00:00 y las 05:59, exitosos o no.', sql: "SELECT * FROM inicios_sesion WHERE strftime('%H', fecha) BETWEEN '00' AND '05'", hint: "WHERE strftime('%H', fecha) BETWEEN '00' AND '05'" },
    quiz: [
      ["En SQLite, strftime('%H', '2026-10-11 03:07:12') devuelve…", ["'03'", "'07'", "'2026'", "'11'"], '%H es la hora en formato 24 h.'],
      ['¿Cómo pides lo de las últimas 24 horas en PostgreSQL?', ["WHERE fecha > now() - interval '24 hours'", 'WHERE fecha > today()', "WHERE fecha LIKE '24h'", 'WHERE fecha > 24'], 'now() y los interval son de PostgreSQL.'],
      ['¿Por qué guardar fechas en formato AAAA-MM-DD?', ['Porque así se ordenan bien como texto', 'Porque es más bonito', 'Porque ocupa menos', 'Porque lo pide la ley'], 'Año primero = orden alfabético igual al cronológico.']
    ],
    tip: 'Ojo con las zonas horarias: guarda en UTC (en PostgreSQL usa TIMESTAMPTZ) y convierte al mostrar. Un incidente con horas mal convertidas cuenta una historia falsa.'
  }
];
