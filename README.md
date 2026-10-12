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
| **Bases de datos** | SQL, PostgreSQL y SQLite con una base **real** en el navegador (SQLite vía sql.js): 12 lecciones con ejercicio y mini examen, consola con comandos `\dt`/`.tables`, 10 retos de investigación que se califican solos y examen final con resultado por tema. |
| **Vacantes** | Pega una vacante y ve qué habilidades pide, cuáles ya practicas aquí y qué te falta. Vacantes reales desglosadas con ruta de estudio, temas extra (EDR, Microsoft 365, DLP, IA, superficie de ataque, SaaS) y preguntas de entrevista. |
| **Security+ SY0-701** | Los 5 dominios con teoría, preguntas con explicación, simulacro y proyecto integral. |
| **Cursos** | Temario de cursos recomendados (Google, Cisco NetAcad, AWS, Linux y Docker): conceptos, código explicado y cómo contarlo en una entrevista. |
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
  vendor/          motor SQLite (sql.js, licencia MIT)
api/      API en Node (sin framework) para sincronizar progreso
tests/    pruebas del laboratorio de redes
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

## Aviso

Material educativo original. Los cursos mencionados (Google/Coursera, Cisco NetAcad, CompTIA, Udemy) son referencias de estudio; este proyecto no está afiliado a ellos y no incluye sus materiales ni exámenes.
