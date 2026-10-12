'use strict';
/*
 * Almacenamiento del progreso sincronizado.
 * - Con DATABASE_URL: Postgres (permanente). Sirve Neon, Supabase o Render Postgres.
 * - Sin DATABASE_URL: archivo JSON en DATA_DIR. En Render gratis ese disco es temporal:
 *   se borra en cada despliegue o reinicio. El progreso siempre queda también en el navegador.
 */
const fs = require('node:fs');
const path = require('node:path');

function fileStore(dir) {
  const file = path.join(dir, 'sync.json');
  let db = {};
  try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { db = {}; }
  let timer = null;
  const flush = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file + '.tmp', JSON.stringify(db)); fs.renameSync(file + '.tmp', file); }
      catch (e) { console.error('No se pudo guardar sync.json:', e.message); }
    }, 200);
  };
  return {
    kind: 'archivo (temporal en Render gratis)',
    async get(code) { return db[code] || null; },
    async put(code, data) { const updatedAt = new Date().toISOString(); db[code] = { data, updatedAt }; flush(); return { updatedAt }; },
    async del(code) { const had = !!db[code]; delete db[code]; flush(); return had; },
    async count() { return Object.keys(db).length; }
  };
}

async function pgStore(url) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 3 });
  await pool.query(`CREATE TABLE IF NOT EXISTS cq_sync (
    code TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  return {
    kind: 'postgres',
    async get(code) {
      const r = await pool.query('SELECT data, updated_at FROM cq_sync WHERE code = $1', [code]);
      return r.rows[0] ? { data: r.rows[0].data, updatedAt: r.rows[0].updated_at.toISOString() } : null;
    },
    async put(code, data) {
      const r = await pool.query(`INSERT INTO cq_sync (code, data, updated_at) VALUES ($1, $2, now())
        ON CONFLICT (code) DO UPDATE SET data = EXCLUDED.data, updated_at = now() RETURNING updated_at`, [code, data]);
      return { updatedAt: r.rows[0].updated_at.toISOString() };
    },
    async del(code) { const r = await pool.query('DELETE FROM cq_sync WHERE code = $1', [code]); return r.rowCount > 0; },
    async count() { const r = await pool.query('SELECT count(*)::int AS n FROM cq_sync'); return r.rows[0].n; }
  };
}

async function createStore(env = process.env) {
  if (env.DATABASE_URL) return pgStore(env.DATABASE_URL);
  return fileStore(env.DATA_DIR || path.join(__dirname, 'data'));
}

module.exports = { createStore, fileStore };
