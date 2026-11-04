'use strict';
/*
 * CyberQuest Academy · API
 * Solo usa módulos de Node (pg es opcional, para Postgres).
 *
 *   GET    /health                 estado del servicio (también lo usa el keepalive)
 *   POST   /api/sync               guarda tu progreso y te da un código nuevo
 *   GET    /api/sync/:codigo       descarga tu progreso en otro dispositivo
 *   PUT    /api/sync/:codigo       actualiza tu progreso
 *   DELETE /api/sync/:codigo       borra tu progreso del servidor
 *   POST   /api/trabajo/abrir      revisa la contraseña del apartado "Mi trabajo"
 *
 * El código funciona como contraseña: quien lo tenga puede leer ese progreso.
 * No se guardan nombres, correos ni nada personal; solo XP, respuestas y misiones.
 *
 * Candado de "Mi trabajo": la contraseña NO está en el código. En la variable de entorno
 * TRABAJO_PIN_HASH va solo su hash (pbkdf2$sha256$iteraciones$sal$hash, genéralo con
 * node api/tools/pin-hash.js). Se limitan los intentos por IP y en total por hora.
 */
const http = require('node:http');
const crypto = require('node:crypto');
const { createStore } = require('./store');

const VERSION = '1.1.0';
const MAX_BODY = 256 * 1024;                     // 256 KB por progreso
const CODE_RE = /^CQ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I para dictarlo sin errores

function newCode() {
  const b = crypto.randomBytes(12);
  const ch = [...b].map(x => ALPHABET[x % 32]).join('');
  return `CQ-${ch.slice(0, 4)}-${ch.slice(4, 8)}-${ch.slice(8, 12)}`;
}

/* ---------- límite de peticiones por IP (en memoria) ---------- */
function rateLimiter(max, windowMs) {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.t > windowMs) hits.delete(k); }, windowMs).unref();
  return ip => {
    const now = Date.now(); const e = hits.get(ip);
    if (!e || now - e.t > windowMs) { hits.set(ip, { t: now, n: 1 }); return true; }
    e.n++; return e.n <= max;
  };
}

/* ---------- candado de "Mi trabajo" ---------- */
function parsePinSpec(spec) {
  const m = /^pbkdf2\$(sha256|sha512)\$(\d{5,7})\$([A-Za-z0-9+/=]{16,})\$([A-Za-z0-9+/=]{40,})$/.exec(String(spec || '').trim());
  if (!m) return null;
  return { digest: m[1], it: +m[2], salt: Buffer.from(m[3], 'base64'), hash: Buffer.from(m[4], 'base64') };
}
function checkPin(pin, spec) {
  return new Promise((resolve, reject) => crypto.pbkdf2(String(pin), spec.salt, spec.it, spec.hash.length, spec.digest, (e, k) => e ? reject(e) : resolve(k.length === spec.hash.length && crypto.timingSafeEqual(k, spec.hash))));
}

/* ---------- mantener despierto (Render gratis se duerme a los 15 min sin tráfico) ---------- */
function hourIn(tz) {
  try { return +new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date()); }
  catch { return new Date().getUTCHours(); }
}
function inWindow(spec, h) {               // spec "7-24": de 7:00 a 23:59
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(spec || ''); if (!m) return true;
  const a = +m[1], b = +m[2];
  return a <= b ? h >= a && h < b : h >= a || h < b;
}
function startKeepAlive(env, log) {
  const url = env.KEEPALIVE_URL || (env.RENDER_EXTERNAL_URL ? env.RENDER_EXTERNAL_URL + '/health' : '');
  if (!url || env.KEEPALIVE === 'off') return null;
  const every = Math.max(5, +(env.KEEPALIVE_MINUTES || 10)) * 60 * 1000;
  const tz = env.KEEPALIVE_TZ || 'America/Mexico_City', win = env.KEEPALIVE_HOURS || '7-24';
  const t = setInterval(() => {
    if (!inWindow(win, hourIn(tz))) return; // fuera de horario se deja dormir para ahorrar horas gratis
    fetch(url, { headers: { 'user-agent': 'cyberquest-keepalive' } }).catch(e => log('keepalive falló: ' + e.message));
  }, every);
  t.unref();
  log(`keepalive cada ${every / 60000} min de ${win} h (${tz}) → ${url}`);
  return t;
}

/* ---------- servidor ---------- */
async function createServer(env = process.env) {
  const store = await createStore(env);
  const origins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowOrigin = o => !!o && (origins.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o));
  const limitWrite = rateLimiter(30, 10 * 60 * 1000);   // 30 escrituras cada 10 min por IP
  const limitRead = rateLimiter(120, 10 * 60 * 1000);
  const limitPin = rateLimiter(+env.TRABAJO_MAX_INTENTOS || 5, 15 * 60 * 1000);  // 5 intentos cada 15 min por IP
  const pinGlobal = { t: Date.now(), n: 0, max: +env.TRABAJO_MAX_HORA || 40 };   // y 40 por hora para todos juntos
  const pinSpec = parsePinSpec(env.TRABAJO_PIN_HASH);
  if (env.TRABAJO_PIN_HASH && !pinSpec) console.error('TRABAJO_PIN_HASH tiene un formato inválido: el candado queda desactivado.');
  const started = Date.now();

  const send = (res, status, obj, extra) => {
    res.writeHead(status, Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, extra || {}));
    res.end(obj === undefined ? '' : JSON.stringify(obj));
  };
  const readBody = req => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('El progreso es demasiado grande (máximo 256 KB).'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
  const parseData = raw => {
    let body; try { body = JSON.parse(raw || '{}'); } catch { throw Object.assign(new Error('El cuerpo no es JSON válido.'), { status: 400 }); }
    const data = body && body.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Falta "data" con tu progreso.'), { status: 400 });
    return data;
  };

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const cors = allowOrigin(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' } : {};
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
    const url = new URL(req.url, 'http://x');
    try {
      if (req.method === 'OPTIONS') return send(res, origin && !cors['access-control-allow-origin'] ? 403 : 204);
      if (url.pathname === '/' || url.pathname === '/health') {
        return send(res, 200, { ok: true, service: 'cyberquest-api', version: VERSION, storage: store.kind, trabajo: !!pinSpec, uptimeSec: Math.round((Date.now() - started) / 1000) });
      }
      if (url.pathname === '/api/trabajo/abrir') {
        if (origin && !cors['access-control-allow-origin']) return send(res, 403, { error: 'Origen no permitido.' });
        if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido.' });
        if (!pinSpec) return send(res, 503, { error: 'El candado de Mi trabajo no está configurado en el servidor.' });
        const now = Date.now(); if (now - pinGlobal.t > 3600 * 1000) { pinGlobal.t = now; pinGlobal.n = 0; }
        if (!limitPin(ip) || ++pinGlobal.n > pinGlobal.max) return send(res, 429, { error: 'Demasiados intentos. Espera unos minutos.' });
        let body; try { body = JSON.parse(await readBody(req) || '{}'); } catch { return send(res, 400, { error: 'El cuerpo no es JSON válido.' }); }
        const pin = body && body.pin;
        if (typeof pin !== 'string' || pin.length < 4 || pin.length > 128) return send(res, 400, { error: 'Contraseña con formato inválido.' });
        const ok = await checkPin(pin, pinSpec);
        if (!ok) { await new Promise(r => setTimeout(r, 400)); return send(res, 401, { error: 'Contraseña incorrecta.' }); }
        return send(res, 200, { ok: true });
      }
      const m = /^\/api\/sync(?:\/([^/]+))?$/.exec(url.pathname);
      if (!m) return send(res, 404, { error: 'Ruta no encontrada.' });
      if (origin && !cors['access-control-allow-origin']) return send(res, 403, { error: 'Origen no permitido.' });
      const code = m[1] ? decodeURIComponent(m[1]).toUpperCase() : null;
      if (code && !CODE_RE.test(code)) return send(res, 400, { error: 'Código inválido. Tiene la forma CQ-XXXX-XXXX-XXXX.' });
      const write = req.method !== 'GET';
      if (!(write ? limitWrite : limitRead)(ip)) return send(res, 429, { error: 'Demasiadas peticiones. Espera unos minutos.' });

      if (!code && req.method === 'POST') {
        const data = parseData(await readBody(req));
        let c = newCode(); while (await store.get(c)) c = newCode();
        const r = await store.put(c, data);
        return send(res, 201, { code: c, updatedAt: r.updatedAt });
      }
      if (code && req.method === 'GET') {
        const r = await store.get(code);
        return r ? send(res, 200, r) : send(res, 404, { error: 'No hay progreso guardado con ese código (o el servidor se reinició).' });
      }
      if (code && req.method === 'PUT') {
        const data = parseData(await readBody(req));
        const r = await store.put(code, data);
        return send(res, 200, { code, updatedAt: r.updatedAt });
      }
      if (code && req.method === 'DELETE') {
        const had = await store.del(code);
        return send(res, had ? 200 : 404, had ? { deleted: true } : { error: 'Ese código no existe.' });
      }
      return send(res, 405, { error: 'Método no permitido.' });
    } catch (e) {
      if (!e.status) console.error(e);
      return send(res, e.status || 500, { error: e.status ? e.message : 'Error interno.' });
    }
  });
  server.store = store;
  server.trabajo = !!pinSpec;
  return server;
}

if (require.main === module) {
  const log = m => console.log(`[cyberquest-api] ${m}`);
  createServer().then(server => {
    const port = +process.env.PORT || 3000;
    server.listen(port, () => {
      log(`v${VERSION} escuchando en :${port} · almacenamiento: ${server.store.kind} · candado Mi trabajo: ${server.trabajo ? 'configurado' : 'sin configurar'}`);
      startKeepAlive(process.env, log);
    });
  }).catch(e => { console.error('No arrancó:', e); process.exit(1); });
}

module.exports = { createServer, newCode, inWindow, CODE_RE, parsePinSpec };
