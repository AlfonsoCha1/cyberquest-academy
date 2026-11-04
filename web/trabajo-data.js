/* ===== Mi trabajo: recetario para el día a día (PowerShell, SQL y VS Code) =====
   Material de referencia original. Úsalo solo en equipos y bases que te toca administrar. */
const WORK_PS = [
  { cat: 'Equipo e inventario', items: [
    { t: 'Sistema, versión y último reinicio', cmd: 'Get-CimInstance Win32_OperatingSystem | Select-Object CSName, Caption, Version, LastBootUpTime', que: 'Nombre del equipo, Windows instalado, versión y cuándo se reinició.' },
    { t: 'Número de serie del equipo', cmd: 'Get-CimInstance Win32_BIOS | Select-Object SerialNumber, Manufacturer', que: 'Para inventario o garantía, sin voltear la laptop.' },
    { t: 'Espacio libre en discos', cmd: "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{n='LibreGB';e={[math]::Round($_.Free/1GB,1)}}, @{n='UsadoGB';e={[math]::Round($_.Used/1GB,1)}}", que: 'Gigas libres y usados por unidad.' },
    { t: 'Últimas actualizaciones instaladas', cmd: 'Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10 HotFixID, Description, InstalledOn', que: 'Para saber si el equipo está al día con parches.' },
    { t: 'Programas instalados', cmd: "Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Where-Object DisplayName | Select-Object DisplayName, DisplayVersion, Publisher | Sort-Object DisplayName", que: 'Lista desde el registro (más rápido y seguro que Win32_Product, que puede reparar instalaciones sin avisar).' }
  ] },
  { cat: 'Red', items: [
    { t: 'IP, puerta de enlace y DNS', cmd: 'Get-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway, DNSServer', que: 'Lo mismo que ipconfig /all pero ordenado.' },
    { t: '¿Llego a un servidor y puerto?', cmd: 'Test-NetConnection servidor.empresa.local -Port 443', que: 'TcpTestSucceeded : True significa que el puerto responde. Ideal para descartar firewall.' },
    { t: 'Resolver un nombre', cmd: 'Resolve-DnsName intranet.empresa.local', que: 'Qué IP devuelve el DNS. Si falla aquí, el problema es de DNS, no de la app.' },
    { t: 'Puertos que escuchan y qué proceso los abre', cmd: 'Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess, @{n="Proceso";e={(Get-Process -Id $_.OwningProcess).ProcessName}} | Sort-Object LocalPort', que: 'Para encontrar servicios inesperados (como el svch0st del CTF).' },
    { t: 'Limpiar la caché de DNS', cmd: 'Clear-DnsClientCache', que: 'Cuando un sitio cambió de IP y el equipo sigue yendo a la vieja.', admin: true }
  ] },
  { cat: 'Procesos y servicios', items: [
    { t: 'Los 10 procesos que más CPU usan', cmd: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, CPU, @{n="MemMB";e={[math]::Round($_.WorkingSet64/1MB)}}', que: 'Para "la compu está lenta".' },
    { t: 'Línea de comandos de cada proceso', cmd: 'Get-CimInstance Win32_Process | Select-Object Name, ProcessId, ParentProcessId, CommandLine', que: 'En un incidente revela PowerShell codificado, rutas raras o procesos lanzados por Office.', admin: true },
    { t: 'Servicios automáticos que están detenidos', cmd: "Get-CimInstance Win32_Service | Where-Object { $_.StartMode -eq 'Auto' -and $_.State -ne 'Running' } | Select-Object Name, DisplayName, State", que: 'Un antivirus o respaldo detenido puede ser falla… o un atacante.' },
    { t: 'Reiniciar un servicio', cmd: 'Restart-Service -Name Spooler -Verbose', que: 'Ejemplo: la cola de impresión atorada.', admin: true },
    { t: 'Terminar un proceso', cmd: 'Stop-Process -Id 1234 -Confirm', que: 'Cierra un proceso por su Id.', admin: true, cuidado: 'Confirma el Id antes: terminar el proceso equivocado puede tumbar el equipo o perder trabajo del usuario.' }
  ] },
  { cat: 'Usuarios y grupos', items: [
    { t: 'Usuarios locales', cmd: 'Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordLastSet', que: 'Cuentas del equipo: busca cuentas que no reconozcas o activas sin uso.' },
    { t: 'Quién es administrador local', cmd: 'Get-LocalGroupMember -SID S-1-5-32-544', que: 'Usa el SID del grupo Administradores, así funciona aunque Windows esté en español ("Administradores").' },
    { t: 'Datos de un usuario del dominio', cmd: 'Get-ADUser jperez -Properties LockedOut, LastLogonDate, PasswordLastSet, Enabled', que: 'Requiere el módulo ActiveDirectory (RSAT).' },
    { t: 'Cuentas bloqueadas en el dominio', cmd: 'Search-ADAccount -LockedOut | Select-Object Name, SamAccountName', que: 'Requiere RSAT. Muchas cuentas bloqueadas a la vez pueden ser un ataque de rociado de contraseñas.' },
    { t: 'Desbloquear una cuenta del dominio', cmd: 'Unlock-ADAccount -Identity jperez', que: 'Después de confirmar la identidad del usuario por un canal confiable.', admin: true }
  ] },
  { cat: 'Eventos y logs', items: [
    { t: 'Inicios de sesión fallidos (24 h)', cmd: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; StartTime=(Get-Date).AddHours(-24)} -MaxEvents 50 | Select-Object TimeCreated, Message", que: 'Evento 4625. Muchos seguidos = posible fuerza bruta.', admin: true },
    { t: 'Usuarios creados o agregados a grupos', cmd: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4720,4732; StartTime=(Get-Date).AddDays(-7)} | Select-Object TimeCreated, Id, Message", que: '4720 = cuenta creada, 4732 = agregada a un grupo local (por ejemplo Administradores).', admin: true },
    { t: 'Errores del sistema recientes', cmd: "Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 20 | Select-Object TimeCreated, ProviderName, Message", que: 'Level 2 = error. Útil para pantallas azules, discos y drivers.' },
    { t: 'Buscar una palabra en logs de texto', cmd: "Select-String -Path C:\\Logs\\*.log -Pattern 'error|denied' | Select-Object Filename, LineNumber, Line", que: 'Como grep en Linux; acepta expresiones regulares.' }
  ] },
  { cat: 'Archivos', items: [
    { t: 'Los 10 archivos más grandes de una carpeta', cmd: "Get-ChildItem C:\\Users\\usuario -Recurse -File -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 10 FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}", que: 'Para "se llenó el disco".' },
    { t: 'Archivos modificados en las últimas 24 h', cmd: 'Get-ChildItem C:\\Datos -Recurse -File | Where-Object LastWriteTime -gt (Get-Date).AddDays(-1)', que: 'Si aparecen miles con extensiones raras, piensa en ransomware y aísla el equipo.' },
    { t: 'Hash SHA-256 de un archivo', cmd: 'Get-FileHash .\\archivo.exe -Algorithm SHA256', que: 'Para buscarlo en VirusTotal o documentar evidencia (sin subir el archivo).' },
    { t: 'Desbloquear un script descargado', cmd: 'Unblock-File -Path .\\script.ps1', que: 'Windows marca lo que bajas de internet. Hazlo solo con scripts que revisaste y vienen de una fuente confiable.', cuidado: 'Quitar la marca hace que Windows confíe en el archivo: nunca lo hagas con algo que no leíste.' }
  ] },
  { cat: 'Reportes y scripts', items: [
    { t: 'Exportar cualquier resultado a CSV (Excel)', cmd: 'Get-LocalUser | Select-Object Name, Enabled, LastLogon | Export-Csv usuarios.csv -NoTypeInformation -Encoding UTF8', que: 'Agrega | Export-Csv al final de casi cualquier comando.' },
    { t: 'Ver la política de ejecución', cmd: 'Get-ExecutionPolicy -List', que: 'Dice por qué un script no corre.' },
    { t: 'Permitir tus scripts locales (solo tu usuario)', cmd: 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned', que: 'Tus scripts corren; los descargados necesitan firma o Unblock-File. No cambia la de todo el equipo.' },
    { t: 'Qué versión de PowerShell tengo', cmd: '$PSVersionTable.PSVersion', que: 'Windows trae 5.1; PowerShell 7 se instala aparte y convive con él.' },
    { t: 'Ayuda con ejemplos de cualquier comando', cmd: 'Get-Help Get-Process -Examples', que: 'Si no trae ejemplos, corre Update-Help como administrador una vez.' },
    { t: 'Ejecutar un comando en otro equipo', cmd: 'Invoke-Command -ComputerName PC-OFICINA01 -ScriptBlock { Get-Service Spooler }', que: 'Requiere WinRM habilitado y permiso. Útil para revisar varios equipos a la vez.', admin: true }
  ] }
];

/* SQL de todos los días en 3 dialectos */
const WORK_SQL = [
  { t: 'Ver las tablas de la base', ss: "SELECT TABLE_SCHEMA, TABLE_NAME\nFROM INFORMATION_SCHEMA.TABLES\nWHERE TABLE_TYPE = 'BASE TABLE'\nORDER BY 1, 2;", pg: "SELECT table_schema, table_name\nFROM information_schema.tables\nWHERE table_type = 'BASE TABLE'\n  AND table_schema NOT IN ('pg_catalog', 'information_schema')\nORDER BY 1, 2;", my: 'SHOW TABLES;' },
  { t: 'Columnas y tipos de una tabla', ss: "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE\nFROM INFORMATION_SCHEMA.COLUMNS\nWHERE TABLE_NAME = 'clientes'\nORDER BY ORDINAL_POSITION;", pg: "SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = 'clientes'\nORDER BY ordinal_position;", my: 'DESCRIBE clientes;' },
  { t: 'Primeras 10 filas para conocer los datos', ss: 'SELECT TOP 10 * FROM dbo.clientes;', pg: 'SELECT * FROM clientes LIMIT 10;', my: 'SELECT * FROM clientes LIMIT 10;', nota: 'Nunca hagas SELECT * sin límite en una tabla grande de producción.' },
  { t: 'Buscar duplicados', ss: 'SELECT correo, COUNT(*) AS veces\nFROM dbo.clientes\nGROUP BY correo\nHAVING COUNT(*) > 1\nORDER BY veces DESC;', pg: 'SELECT correo, COUNT(*) AS veces\nFROM clientes\nGROUP BY correo\nHAVING COUNT(*) > 1\nORDER BY veces DESC;', my: 'SELECT correo, COUNT(*) AS veces\nFROM clientes\nGROUP BY correo\nHAVING COUNT(*) > 1\nORDER BY veces DESC;' },
  { t: 'Registros de las últimas 24 horas', ss: 'SELECT *\nFROM dbo.pedidos\nWHERE fecha >= DATEADD(hour, -24, GETDATE());', pg: "SELECT *\nFROM pedidos\nWHERE fecha >= now() - interval '24 hours';", my: 'SELECT *\nFROM pedidos\nWHERE fecha >= NOW() - INTERVAL 24 HOUR;' },
  { t: 'Cuántos por día', ss: 'SELECT CAST(fecha AS date) AS dia, COUNT(*) AS total\nFROM dbo.pedidos\nGROUP BY CAST(fecha AS date)\nORDER BY dia;', pg: 'SELECT fecha::date AS dia, COUNT(*) AS total\nFROM pedidos\nGROUP BY 1\nORDER BY 1;', my: 'SELECT DATE(fecha) AS dia, COUNT(*) AS total\nFROM pedidos\nGROUP BY DATE(fecha)\nORDER BY dia;' },
  { t: 'Clientes que nunca han comprado', ss: 'SELECT c.id, c.nombre\nFROM dbo.clientes c\nLEFT JOIN dbo.pedidos p ON p.cliente_id = c.id\nWHERE p.id IS NULL;', pg: 'SELECT c.id, c.nombre\nFROM clientes c\nLEFT JOIN pedidos p ON p.cliente_id = c.id\nWHERE p.id IS NULL;', my: 'SELECT c.id, c.nombre\nFROM clientes c\nLEFT JOIN pedidos p ON p.cliente_id = c.id\nWHERE p.id IS NULL;' },
  { t: 'Cambiar datos con red de seguridad', ss: "BEGIN TRANSACTION;\nUPDATE dbo.clientes SET correo = N'nuevo@empresa.mx' WHERE id = 42;\nSELECT id, correo FROM dbo.clientes WHERE id = 42;  -- revisa\n-- Si está bien: COMMIT;   Si no: ROLLBACK;", pg: "BEGIN;\nUPDATE clientes SET correo = 'nuevo@empresa.mx' WHERE id = 42;\nSELECT id, correo FROM clientes WHERE id = 42;  -- revisa\n-- Si está bien: COMMIT;   Si no: ROLLBACK;", my: "START TRANSACTION;\nUPDATE clientes SET correo = 'nuevo@empresa.mx' WHERE id = 42;\nSELECT id, correo FROM clientes WHERE id = 42;  -- revisa\n-- Si está bien: COMMIT;   Si no: ROLLBACK;", nota: 'Escribe primero el SELECT con el mismo WHERE y cuenta las filas. Un UPDATE o DELETE sin WHERE cambia toda la tabla.' },
  { t: 'Quién está conectado', ss: 'SELECT session_id, login_name, host_name, program_name, status\nFROM sys.dm_exec_sessions\nWHERE is_user_process = 1;', pg: 'SELECT pid, usename, client_addr, application_name, state\nFROM pg_stat_activity;', my: 'SHOW PROCESSLIST;', nota: 'Necesita permisos de administración de la base.' },
  { t: 'Tamaño de las tablas', ss: "EXEC sp_spaceused 'dbo.pedidos';", pg: 'SELECT relname AS tabla, pg_size_pretty(pg_total_relation_size(relid)) AS tamano\nFROM pg_catalog.pg_statio_user_tables\nORDER BY pg_total_relation_size(relid) DESC;', my: 'SELECT table_name, ROUND((data_length + index_length) / 1024 / 1024, 1) AS mb\nFROM information_schema.tables\nWHERE table_schema = DATABASE()\nORDER BY mb DESC;' },
  { t: 'Respaldo de una base', ss: "BACKUP DATABASE Ventas\nTO DISK = N'D:\\Respaldos\\Ventas.bak'\nWITH CHECKSUM, INIT;", pg: '-- desde la terminal, no desde SQL:\npg_dump -U usuario -F c -f ventas.dump ventas', my: '-- desde la terminal, no desde SQL:\nmysqldump -u usuario -p ventas > ventas.sql', nota: 'Un respaldo que nunca restauraste no está probado. Guárdalo fuera del servidor y protegido.' },
  { t: 'Usuario de solo lectura para reportes', ss: "CREATE LOGIN reportes WITH PASSWORD = N'<contraseña-larga-y-única>';\nUSE Ventas;\nCREATE USER reportes FOR LOGIN reportes;\nALTER ROLE db_datareader ADD MEMBER reportes;", pg: "CREATE ROLE reportes LOGIN PASSWORD '<contraseña-larga-y-única>';\nGRANT CONNECT ON DATABASE ventas TO reportes;\nGRANT USAGE ON SCHEMA public TO reportes;\nGRANT SELECT ON ALL TABLES IN SCHEMA public TO reportes;", my: "CREATE USER 'reportes'@'%' IDENTIFIED BY '<contraseña-larga-y-única>';\nGRANT SELECT ON ventas.* TO 'reportes'@'%';", nota: 'Menor privilegio: quien solo consulta no necesita escribir. Genera la contraseña en Herramientas → Contraseñas.' }
];

/* VS Code (Windows). En Mac cambia Ctrl por Cmd y Alt por Option. */
const WORK_VSC = [
  ['Lo esencial', [['Ctrl+Shift+P', 'Paleta de comandos: busca cualquier acción por nombre'], ['Ctrl+P', 'Abrir un archivo por su nombre'], ['Ctrl+Ñ o Ctrl+`', 'Abrir o cerrar la terminal integrada'], ['Ctrl+B', 'Mostrar u ocultar la barra lateral'], ['Ctrl+,', 'Configuración']]],
  ['Editar rápido', [['Alt+↑ / Alt+↓', 'Mover la línea arriba o abajo'], ['Shift+Alt+↓', 'Duplicar la línea'], ['Ctrl+Shift+K', 'Borrar la línea'], ['Ctrl+/', 'Comentar o descomentar'], ['Shift+Alt+F', 'Dar formato al documento']]],
  ['Varios cursores', [['Ctrl+D', 'Seleccionar la siguiente coincidencia'], ['Ctrl+Shift+L', 'Seleccionar todas las coincidencias'], ['Alt+clic', 'Agregar un cursor donde hagas clic'], ['Ctrl+Alt+↑ / ↓', 'Agregar un cursor arriba o abajo']]],
  ['Buscar y navegar', [['Ctrl+F / Ctrl+H', 'Buscar / reemplazar en el archivo (el botón .* activa expresiones regulares)'], ['Ctrl+Shift+F', 'Buscar en todos los archivos'], ['Ctrl+G', 'Ir a una línea'], ['F12', 'Ir a la definición'], ['F2', 'Renombrar un símbolo en todo el proyecto']]],
  ['PowerShell y SQL', [['F8', 'PowerShell: ejecutar la selección o la línea actual'], ['F5', 'PowerShell: ejecutar el script completo'], ['Ctrl+Shift+E', 'Extensión MSSQL: ejecutar la consulta (si cambiaste atajos, búscalo en la paleta)'], ['Ctrl+K Ctrl+0', 'Plegar todo; Ctrl+K Ctrl+J para desplegar']]]
];
const WORK_VSC_EXT = [
  ['PowerShell', 'Microsoft', 'Colores, ayuda al escribir, depurador y ejecutar con F8.'],
  ['SQL Server (mssql)', 'Microsoft', 'Conectar a SQL Server y Azure SQL, ejecutar consultas y ver resultados.'],
  ['Python', 'Microsoft', 'Ejecutar y depurar scripts de Python.'],
  ['Remote - SSH', 'Microsoft', 'Editar archivos de un servidor Linux como si fueran locales.'],
  ['Markdown (incluido)', 'VS Code', 'Vista previa con Ctrl+Shift+V para documentar procedimientos.']
];
const WORK_VSC_SETTINGS = `{
  "files.autoSave": "afterDelay",
  "editor.formatOnSave": true,
  "files.trimTrailingWhitespace": true,
  "editor.renderWhitespace": "boundary",
  "editor.minimap.enabled": false,
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}`;
