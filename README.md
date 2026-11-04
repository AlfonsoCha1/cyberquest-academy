# CyberQuest Academy

Academia de ciberseguridad para **aprender practicando**: armas redes y las arreglas, investigas equipos atacados desde una terminal, preparas CompTIA Security+ y resuelves incidentes como analista SOC. Cada error te explica **por qué** pasó, **cómo** se arregla y **cómo se ve en un trabajo real**.

**App:** https://cyberquest-academy.vercel.app · **API:** https://cyberquest-api-1h1g.onrender.com/health

> Academia abierta y gratuita para aprender ciberseguridad en comunidad: sin cuentas, sin anuncios y sin datos personales. Todo ocurre en simulaciones dentro del navegador: nada toca equipos o redes reales.

## Qué trae

| Sección | Qué haces |
|---|---|
| **Laboratorio de redes** | Conectas PC, laptop (Wi-Fi), servidor, impresora, switch, access point, router, firewall e Internet. Configuras IP, máscara, puerta de enlace y rutas, y haces ping paso a paso (ARP, NAT, zonas LAN/DMZ/WAN). 5 misiones de casa a empresa + 3 tickets de fallas reales + modo libre. |
| **Terminal** | Linux (servidor web atacado, 9 retos) y Windows CMD + PowerShell (PC comprometida, 8 retos): fuerza bruta, cuentas persistentes, procesos impostores, archivo hosts falso, eventos 4625/4624/4720/4732. |
| **Comandos** | Fichas de Linux, CMD y PowerShell: qué significan, qué hacen, ejemplo y uso en seguridad, con mini examen. |
| **Bases de datos** | SQL, PostgreSQL, SQLite y SQL Server con una base **real** en el navegador (SQLite vía sql.js): 13 lecciones con ejercicio y mini examen (incluye "SQL Server y T-SQL: lo que cambia"), consola con comandos `\dt`/`.tables` y pistas para traducir T-SQL, 10 retos de investigación que se califican solos y examen final con resultado por tema. |
| **Vacantes** | Pega una vacante y ve qué habilidades pide, cuáles ya practicas aquí y qué te falta. Un ejemplo de vacante desglosado con ruta de estudio, temas extra (EDR, Microsoft 365, DLP, IA, superficie de ataque, SaaS) y preguntas de entrevista. |
| **Security+ SY0-701** | Los 5 dominios con teoría, preguntas con explicación, simulacro y proyecto integral. |
| **Cursos** | Guías de cursos recomendados (Google, Cisco NetAcad, AWS, Linux, Docker, **Microsoft SQL Server (T-SQL)**, **SSIS** y **SAP para TI y seguridad**): conceptos, código explicado, cómo contarlo en una entrevista y mini examen. |
| **CTF** | 12 retos con bandera `CQ{…}` (Base64, ROT13, hex, XOR, PowerShell codificado, logs, cookies, JWT, hashes, procesos sospechosos). Las banderas se verifican por hash SHA-256: no están en el código. Incluye caja de herramientas. |
| **Laboratorio Dev+Sec** | Ordenar código (Python, PowerShell, JavaScript), encontrar la vulnerabilidad y elegir la corrección (categorías OWASP), "¿qué imprime?" y 10 reglas de código seguro. |
| **Inglés técnico** | 48 palabras con audio (síntesis del navegador), frases para soporte e incidentes, falsos amigos, lectura de tickets reales, dictado, entrevista en inglés y pronunciación. |
| **Mi formación externa** | Registro personal de cursos de Coursera, Udemy y otras plataformas: programas, estado, % observado o manual, notas, horas, fechas, certificados, cursos de interés, importación CSV/JSON/enlaces sin duplicados, estadísticas, calendario y modo enfoque (temporizador que registra tiempo real). |
| **Mi trabajo** 🔒 | Apartado con contraseña: recetario de PowerShell, SQL en 3 dialectos, atajos de VS Code, herramientas (decodificar, hashes, JWT, fechas, CSV→INSERT, contraseñas) y notas/bitácora cifradas con AES-GCM. |
| **Misión del día** | En Inicio: una tarea diaria de inglés, programación y ciberseguridad, con racha de días. |
| **Ramas, SOC e Imprevistos** | 12 especialidades, alertas con logs para decidir qué hacer y problemas que no vienen en el curso pero sí en el trabajo. |
| **Progreso** | XP, rangos, repaso de errores, exportar/borrar datos y sincronizar entre dispositivos con un código. |

## Instalarla como app

Funciona en PCs viejitas y potentes, celular y tablet. Una vez cargada, sirve **sin Internet**.

- **Windows (Chrome/Edge):** abre la app y haz clic en el ícono de instalar de la barra de direcciones.
- **Android (Chrome):** menú ⋮ → *Instalar app* / *Agregar a la pantalla principal*.
- **Linux / Kali:** con Chromium o Chrome igual que en Windows (`sudo apt install chromium`). Firefox no instala apps web, pero la abre normal.
- **iPhone/iPad (Safari):** Compartir → *Agregar a inicio*.

¿PC lenta? Activa **Modo ligero** (menú lateral o Progreso): quita brillos y animaciones. Se activa solo en equipos de 2 núcleos o menos.

## Estructura

```
web/      App estática (HTML + CSS + JS sin dependencias) · PWA con service worker
  engine.js        motor de red: IPs, máscaras, ARP, rutas, NAT, firewall y ping
  term-engine.js   terminal simulada Linux / CMD / PowerShell
  *-data.js        contenido: misiones, comandos, cursos, ramas, escenarios, Security+
  cloud.js         sincronización con el API e instalación de la app
  sql-*.js         base de práctica, lecciones, retos y examen de SQL
  jobs-*.js        analizador de vacantes, vacantes reales y temas que piden
  ext-core.js      formación externa: identidad de cursos, importación idempotente y estadísticas (sin interfaz)
  ext-ui.js        formación externa: vistas, ficha, importador y modo enfoque
  tools.js         caja de herramientas compartida (CTF y Mi trabajo)
  ctf-*.js         retos CTF (solo hashes de las banderas)
  devlab-*.js      laboratorio Dev+Sec
  ingles-*.js      inglés técnico
  trabajo-*.js     Mi trabajo (candado y cifrado)
  daily.js         misión del día y racha
  vendor/          motor SQLite (sql.js, licencia MIT)
api/      API en Node (sin framework) para sincronizar progreso
tests/    pruebas: laboratorio de redes, SQL, formación externa y CTF
tools/    íconos y versión de un solo archivo para Claude
```

## Correrla en tu compu

```bash
# App (abre http://localhost:8080)
python3 -m http.server 8080 -d web

# API (http://localhost:3000/health)
cd api && npm install && npm start

# Pruebas
node tests/netlab.test.js
node tests/sql.test.js
node tests/ext.test.js
node tests/ctf.test.js
cd api && npm test
```

## API

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/health` | Estado del servicio |
| POST | `/api/sync` | Sube tu progreso y devuelve un código `CQ-XXXX-XXXX-XXXX` |
| GET | `/api/sync/:codigo` | Baja tu progreso en otro dispositivo |
| PUT | `/api/sync/:codigo` | Actualiza tu progreso |
| DELETE | `/api/sync/:codigo` | Borra tu progreso del servidor |
| POST | `/api/trabajo/abrir` | Revisa la contraseña de "Mi trabajo" (5 intentos cada 15 min por IP y 40 por hora en total) |

El código funciona como contraseña. No se guardan nombres ni correos: solo XP, respuestas y misiones. Límite de 256 KB por progreso, límite de peticiones por IP y CORS solo para la app.

## Despliegue

**Vercel (frontend):** proyecto con *Root Directory* `web`, sin comando de build. Cada push a `main` se publica solo.

**Render (backend):** servicio web Node, plan Free.
- Build: `cd api && npm ci --omit=dev` · Start: `node api/server.js`

| Variable | Valor |
|---|---|
| `ALLOWED_ORIGINS` | `https://cyberquest-academy.vercel.app` (separa varias con coma) |
| `KEEPALIVE_HOURS` | `7-24` (horas en que no se duerme) |
| `KEEPALIVE_TZ` | `America/Mexico_City` |
| `DATABASE_URL` | *(opcional)* Postgres para guardar la sincronización para siempre |
| `TRABAJO_PIN_HASH` | Hash de la contraseña de "Mi trabajo" (genéralo con `node api/tools/pin-hash.js`). Nunca pongas la contraseña en el repositorio. |

### Mantenerlo despierto

Render Free duerme el servicio a los 15 min sin tráfico y da **750 horas al mes por workspace, compartidas** con tus otros servicios gratis. Por eso no se deja despierto 24/7:

1. El API se hace ping a sí mismo cada 10 min, solo de **7:00 a 23:59 (hora de México)**: unas 527 h/mes.
2. El workflow `.github/workflows/keepalive.yml` lo despierta cada hora en ese horario (por si se reinició).
3. Al abrir la app, ella misma despierta al API.

Sin `DATABASE_URL`, la sincronización vive en un archivo temporal: Render lo borra al reiniciar o redesplegar. Tu progreso **siempre** queda en cada dispositivo; si se pierde la copia en la nube, solo vuelve a subirla. Para guardarla para siempre conecta un Postgres gratuito que no caduque (por ejemplo Neon) en `DATABASE_URL`. El Postgres gratis de Render caduca a los 30 días.

## Para la comunidad

- Compártela con quien esté empezando: solo necesitan el enlace, no hay registro.
- Cada persona lleva su propio progreso en su navegador. Nadie ve el avance de otros.
- ¿Encontraste un error o tienes un caso real que debería estar aquí? Abre un *issue* con la descripción y lo agregamos.

## Seguridad

- Ninguna clave va en el frontend. La futura profesora IA usará el API como intermediario.
- Cabeceras de seguridad en Vercel (CSP, `nosniff`, `X-Frame-Options`, `Permissions-Policy`).
- El API valida formato y tamaño, limita peticiones y solo acepta orígenes permitidos.

## Hoja de ruta

1. Profesora IA por texto (vía el API).
2. Entrevistador IA para analista SOC con reporte.
3. Voz (Web Speech API como primera opción gratuita).
4. Diplomas internos en PDF.
5. Laboratorios de AWS, Docker, VLANs y ACLs.

## Aviso legal

Material educativo original. Los ejemplos (empresas, vacantes, datos) son ficticios. Consulta los términos de servicio y el aviso de privacidad dentro de la app (menú lateral). Los cursos mencionados (Google/Coursera, Cisco NetAcad, CompTIA, Udemy) son referencias de estudio; este proyecto no está afiliado a ellos y no incluye sus materiales ni exámenes.
