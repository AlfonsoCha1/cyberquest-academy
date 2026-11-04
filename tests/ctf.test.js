// Comprueba que los retos del CTF se pueden resolver con la caja de herramientas de la app.
// Las banderas NO se escriben aquí: se obtienen decodificando cada artefacto y se comparan con su hash.
// Uso: node tests/ctf.test.js
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const web = path.join(__dirname, '..', 'web');

const ctx = { console, TextEncoder, TextDecoder, btoa, atob, crypto: globalThis.crypto, module: undefined };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(web, 'tools.js'), 'utf8') + ';this.TOOLS = TOOLS;', ctx, { filename: 'tools.js' });
vm.runInContext(fs.readFileSync(path.join(web, 'ctf-data.js'), 'utf8') + ';this.CTF = CTF;', ctx, { filename: 'ctf-data.js' });
const { TOOLS, CTF } = ctx;

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const norm = s => { const m = /^cq\{(.*)\}$/i.exec(String(s).trim()); return m ? 'CQ{' + m[1].trim().toLowerCase() + '}' : s; };
const flagsIn = t => String(t).match(/CQ\{[^}]*\}/gi) || [];

// cómo se resuelve cada reto "de decodificar" usando solo las herramientas de la app
const solve = {
  c1: c => TOOLS.run('b64-dec', c.art.split('=').slice(1).join('=')),
  c2: c => TOOLS.run('rot13', c.art),
  c3: c => TOOLS.run('hex-dec', c.art),
  c4: c => TOOLS.run('ps-dec', c.art),
  c6: c => TOOLS.run('b64-dec', c.art.split('sesion=')[1]),
  c7: c => JSON.stringify(TOOLS.jwt(c.art).payload),
  c8: c => TOOLS.run('xor-all', c.art),
  c11: c => 'CQ{' + c.art.split('\n').map(l => l[0]).join('') + '}',
  c12: c => 'CQ{' + sha(c.art).slice(0, 8) + '}'
};

ok(CTF.length >= 12, 'hay al menos 12 retos');
ok(new Set(CTF.map(c => c.id)).size === CTF.length, 'ids únicos');
for (const c of CTF) {
  ok(/^[0-9a-f]{64}$/.test(c.h), `${c.id}: el hash es SHA-256`);
  ok(!/CQ\{/i.test(JSON.stringify({ ask: c.ask, hints: c.hints, learn: c.learn })) || /CQ\{(\.\.\.|…|cuenta_ip|puerto_proceso|palabra|nombre|8caracteres)/i.test(c.ask), `${c.id}: pistas y explicación no revelan la bandera`);
  ok(c.hints.length >= 1 && c.learn, `${c.id}: tiene pista y lección`);
  if (solve[c.id]) {
    const got = flagsIn(solve[c.id](c)).find(f => sha(norm(f)) === c.h);
    ok(!!got, `${c.id}: se resuelve con la caja de herramientas`);
  }
}
// la verificación acepta mayúsculas/minúsculas y espacios alrededor, como en la app
ok(norm('  cq{Hola}  ') === 'CQ{hola}', 'normaliza la bandera');
// el reto de identificar el hash usa un SHA-256 real de 64 caracteres
const c9 = CTF.find(c => c.id === 'c9');
ok(c9 && /SHA-256/.test(TOOLS.hashGuess(c9.art)), 'c9: la herramienta identifica el hash');

console.log(`${CTF.length} retos · ${Object.keys(solve).length} resueltos automáticamente`);
console.log(fails ? `\n${fails} fallas` : '\nTodo OK');
process.exit(fails ? 1 : 0);
