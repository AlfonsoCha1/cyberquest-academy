'use strict';
/*
 * Genera el valor de TRABAJO_PIN_HASH para el candado de "Mi trabajo".
 * Uso:  node api/tools/pin-hash.js
 * Te pide la contraseña sin mostrarla y escribe una línea para pegar en Render
 * (Environment → TRABAJO_PIN_HASH). NO guardes la contraseña en ningún archivo ni en el repositorio.
 */
const crypto = require('node:crypto');
const readline = require('node:readline');
const ITER = 600000;
function make(pin) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(pin), salt, ITER, 32, 'sha256');
  return `pbkdf2$sha256$${ITER}$${salt.toString('base64')}$${hash.toString('base64')}`;
}
if (require.main === module) {
  if (process.env.PIN) { process.stdout.write(make(process.env.PIN) + '\n'); return; }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = s => { if (/contraseña/i.test(s)) process.stdout.write(s); };
  rl.question('Escribe la contraseña (no se verá): ', pin => {
    rl.close(); process.stdout.write('\n');
    if (!pin || pin.length < 4) { console.error('Mínimo 4 caracteres.'); process.exit(1); }
    console.log('\nPega esto en Render → cyberquest-api → Environment:\n\nTRABAJO_PIN_HASH=' + make(pin) + '\n');
  });
}
module.exports = { make };
