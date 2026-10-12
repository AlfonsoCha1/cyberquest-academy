'use strict';
// Pruebas del API sin dependencias: node --test api/test.js
const test = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { createServer, newCode, inWindow, CODE_RE } = require('./server');

async function boot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-'));
  const server = await createServer({ DATA_DIR: dir, ALLOWED_ORIGINS: 'https://cyberquest.example' });
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base };
}

test('códigos con formato correcto y sin caracteres confusos', () => {
  for (let i = 0; i < 200; i++) assert.match(newCode(), CODE_RE);
});

test('ventana de horario del keepalive', () => {
  assert.equal(inWindow('7-24', 7), true);
  assert.equal(inWindow('7-24', 23), true);
  assert.equal(inWindow('7-24', 3), false);
  assert.equal(inWindow('22-6', 2), true);
  assert.equal(inWindow('22-6', 12), false);
});

test('ciclo completo: guardar, leer, actualizar y borrar', async () => {
  const { server, base } = await boot();
  try {
    let r = await fetch(base + '/health'); assert.equal(r.status, 200); assert.equal((await r.json()).ok, true);
    const progress = { xp: 120, net: { m1: 100 } };
    r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: progress }) });
    assert.equal(r.status, 201); const { code } = await r.json(); assert.match(code, CODE_RE);
    r = await fetch(base + '/api/sync/' + code.toLowerCase()); assert.equal(r.status, 200); assert.deepEqual((await r.json()).data, progress);
    r = await fetch(base + '/api/sync/' + code, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: { xp: 300 } }) });
    assert.equal(r.status, 200);
    r = await fetch(base + '/api/sync/' + code); assert.equal((await r.json()).data.xp, 300);
    r = await fetch(base + '/api/sync/' + code, { method: 'DELETE' }); assert.equal(r.status, 200);
    r = await fetch(base + '/api/sync/' + code); assert.equal(r.status, 404);
  } finally { server.close(); }
});

test('rechaza entradas malas y orígenes no permitidos', async () => {
  const { server, base } = await boot();
  try {
    let r = await fetch(base + '/api/sync/hola'); assert.equal(r.status, 400);
    r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{malo' }); assert.equal(r.status, 400);
    r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: [1, 2] }) }); assert.equal(r.status, 400);
    r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: { x: 'a'.repeat(300 * 1024) } }) }).catch(() => ({ status: 413 }));
    assert.equal(r.status, 413);
    r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://malo.example' }, body: JSON.stringify({ data: {} }) });
    assert.equal(r.status, 403);
    r = await fetch(base + '/api/sync', { method: 'OPTIONS', headers: { origin: 'https://cyberquest.example' } });
    assert.equal(r.status, 204); assert.equal(r.headers.get('access-control-allow-origin'), 'https://cyberquest.example');
  } finally { server.close(); }
});
