/* ===== Caja de herramientas: decodificar, hashes, JWT, fechas, CSV → SQL y contraseñas =====
   Todo corre en tu navegador: nada se envía a ningún servidor. Lo usan el CTF y "Mi trabajo". */
const TOOLS = (() => {
  const te = new TextEncoder(), td = new TextDecoder('utf-8', { fatal: false });
  const bytesToB64 = b => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  function b64ToBytes(s) {
    let x = String(s || '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(x)) throw new Error('No es Base64 válido (solo letras, números, + / y = al final).');
    while (x.length % 4) x += '=';
    const bin = atob(x), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function hexToBytes(s) {
    const x = String(s || '').replace(/0x|\\x|[\s:,-]/gi, '');
    if (!/^([0-9a-f]{2})*$/i.test(x)) throw new Error('No es hexadecimal válido (pares de 0-9 y a-f).');
    const out = new Uint8Array(x.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(x.substr(i * 2, 2), 16);
    return out;
  }
  const bytesToHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  const utf16leEncode = s => { const out = new Uint8Array(s.length * 2); for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out[i * 2] = c & 255; out[i * 2 + 1] = c >> 8; } return out; };
  const utf16leDecode = b => { let s = ''; for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(b[i] | (b[i + 1] << 8)); return s; };
  const rot = (s, n) => String(s).replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + ((n % 26) + 26)) % 26 + b); });
  const printable = s => s.length > 0 && /^[\x20-\x7e\t\r\n]*$/.test(s);
  function xorBytes(b, key) { const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b[i] ^ key; return out; }
  function readBytes(input) { const s = String(input || '').trim(); return /^(0x)?([0-9a-f]{2}[\s:]?)+$/i.test(s) ? hexToBytes(s) : te.encode(s); }

  const OPS = {
    'b64-dec': ['Base64 → texto', s => td.decode(b64ToBytes(s))],
    'b64-enc': ['Texto → Base64', s => bytesToB64(te.encode(s))],
    'ps-dec': ['Base64 de PowerShell (-EncodedCommand) → texto', s => utf16leDecode(b64ToBytes(s.replace(/^.*-e(nc(odedcommand)?)?\s+/i, '').trim()))],
    'ps-enc': ['Texto → Base64 para PowerShell (UTF-16LE)', s => bytesToB64(utf16leEncode(s))],
    'hex-dec': ['Hexadecimal → texto', s => td.decode(hexToBytes(s))],
    'hex-enc': ['Texto → hexadecimal', s => bytesToHex(te.encode(s))],
    'url-dec': ['URL decode (%20 → espacio)', s => decodeURIComponent(s.replace(/\+/g, ' '))],
    'url-enc': ['URL encode', s => encodeURIComponent(s)],
    'rot13': ['ROT13 (César de 13)', s => rot(s, 13)],
    'rotn': ['César con desplazamiento N', (s, o) => rot(s, +o.n || 0)],
    'xor': ['XOR con una llave de un byte', (s, o) => { const k = parseInt(String(o.key || '0').replace(/^0x/i, ''), 16); if (!(k >= 0 && k <= 255)) throw new Error('La llave va en hexadecimal, de 00 a ff.'); const r = xorBytes(readBytes(s), k); const t = td.decode(r); return printable(t) ? t : bytesToHex(r) + '\n(el resultado no es texto legible: se muestra en hexadecimal)'; }],
    'xor-all': ['XOR: probar las 256 llaves y mostrar las legibles', s => { const b = readBytes(s), out = []; for (let k = 1; k < 256; k++) { const t = td.decode(xorBytes(b, k)); if (printable(t)) out.push(`llave 0x${k.toString(16).padStart(2, '0')}: ${t}`); } return out.length ? out.join('\n') : 'Ninguna llave de un byte da texto legible.'; }],
    'b64-hex': ['Base64 → hexadecimal', s => bytesToHex(b64ToBytes(s))]
  };
  function run(op, input, opts) { const f = OPS[op]; if (!f) throw new Error('Operación desconocida'); return f[1](String(input == null ? '' : input), opts || {}); }

  async function hash(alg, text) {
    if (!(globalThis.crypto && crypto.subtle)) throw new Error('Tu navegador no permite calcular hashes aquí (necesita https).');
    return bytesToHex(new Uint8Array(await crypto.subtle.digest(alg, te.encode(String(text)))));
  }
  function hashGuess(h) {
    const x = String(h || '').trim();
    if (/^\$2[aby]\$\d\d\$/.test(x)) return 'bcrypt (hash de contraseña con sal: es el correcto para guardar contraseñas)';
    if (/^\$argon2/.test(x)) return 'Argon2 (hash de contraseña moderno)';
    if (!/^[0-9a-f]+$/i.test(x)) return 'No parece un hash hexadecimal.';
    return { 32: 'MD5 (128 bits) o NTLM: roto para seguridad', 40: 'SHA-1 (160 bits): ya no se considera seguro', 56: 'SHA-224', 64: 'SHA-256 (256 bits)', 96: 'SHA-384', 128: 'SHA-512 (512 bits)' }[x.length] || `Longitud ${x.length}: no coincide con los hashes comunes.`;
  }
  function jwt(token) {
    const parts = String(token || '').trim().split('.');
    if (parts.length < 2) throw new Error('Un JWT tiene 3 partes separadas por puntos: encabezado.contenido.firma');
    const dec = p => JSON.parse(td.decode(b64ToBytes(p)));
    const header = dec(parts[0]), payload = dec(parts[1]);
    const warn = [];
    if (String(header.alg || '').toLowerCase() === 'none') warn.push('alg = none: el token NO tiene firma. Un servidor que lo acepte deja que cualquiera cambie su contenido.');
    if (!parts[2]) warn.push('No trae firma.');
    if (payload.exp) warn.push(`Vence: ${new Date(payload.exp * 1000).toISOString()}`);
    return { header, payload, warn };
  }
  function when(input) {
    const s = String(input || '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const d = new Date(s); if (isNaN(d)) throw new Error('Fecha no válida'); return [['Epoch (segundos)', String(Math.floor(d.getTime() / 1000))], ['Epoch (milisegundos)', String(d.getTime())], ['UTC', d.toISOString()]]; }
    if (!/^\d{9,19}$/.test(s)) throw new Error('Escribe un número (epoch, FILETIME o Chrome) o una fecha AAAA-MM-DD.');
    const n = Number(s), out = [];
    const fmt = ms => { const d = new Date(ms); return isNaN(d) ? null : `${d.toISOString()} (UTC) · ${d.toLocaleString('es-MX')} (tu hora)`; };
    const add = (t, ms) => { if (ms > 0 && ms < 8.64e15) { const f = fmt(ms); if (f && ms > Date.UTC(1990, 0) && ms < Date.UTC(2100, 0)) out.push([t, f]); } };
    add('Epoch en segundos (Linux, JWT)', n * 1000);
    add('Epoch en milisegundos (JavaScript)', n);
    add('Epoch en microsegundos', n / 1000);
    add('FILETIME de Windows (100 ns desde 1601)', n / 1e4 - 11644473600000);
    add('Chrome / WebKit (µs desde 1601)', n / 1000 - 11644473600000);
    return out.length ? out : [['Resultado', 'No coincide con un formato de fecha conocido entre 1990 y 2100.']];
  }
  function csvToInsert(csv, table, dialect) {
    const rows = (typeof extParseCSV === 'function' ? extParseCSV : parseCsvMini)(csv);
    if (rows.length < 2) throw new Error('Pega un CSV con encabezados y al menos una fila.');
    const t = String(table || 'tabla').trim();
    if (!/^[A-Za-z_][\w.]*$/.test(t)) throw new Error('Nombre de tabla inválido (letras, números, _ y punto).');
    const q = dialect === 'sqlserver' ? c => `[${c.replace(/]/g, ']]')}]` : dialect === 'mysql' ? c => '`' + c.replace(/`/g, '``') + '`' : c => `"${c.replace(/"/g, '""')}"`;
    const cols = rows[0].map(c => q(String(c).trim() || 'columna'));
    const lit = v => { const x = String(v); if (x === '') return 'NULL'; if (/^-?\d+(\.\d+)?$/.test(x) && !/^0\d/.test(x)) return x; return (dialect === 'sqlserver' ? 'N' : '') + `'${x.replace(/'/g, "''")}'`; };
    const body = rows.slice(1).map(r => `(${rows[0].map((_, i) => lit(r[i] == null ? '' : r[i])).join(', ')})`);
    const chunks = []; for (let i = 0; i < body.length; i += 500) chunks.push(`INSERT INTO ${t} (${cols.join(', ')}) VALUES\n  ${body.slice(i, i + 500).join(',\n  ')};`);
    return (dialect === 'sqlserver' ? 'BEGIN TRANSACTION;\n' : dialect === 'mysql' ? 'START TRANSACTION;\n' : 'BEGIN;\n') + chunks.join('\n') + '\n-- Revisa el resultado y luego: COMMIT; (o ROLLBACK; si algo salió mal)';
  }
  function parseCsvMini(text) { return String(text).trim().split(/\r?\n/).map(l => l.split(',')); }
  function password(len, sets) {
    const pools = { min: 'abcdefghijkmnopqrstuvwxyz', may: 'ABCDEFGHJKLMNPQRSTUVWXYZ', num: '23456789', sim: '!@#$%&*?-_=+' };
    const use = Object.keys(pools).filter(k => sets[k]);
    if (!use.length) throw new Error('Elige al menos un tipo de caracter.');
    const L = Math.max(8, Math.min(128, len | 0)), all = use.map(k => pools[k]).join('');
    const pick = s => { const lim = 256 - (256 % s.length), b = new Uint8Array(1); let x; do { crypto.getRandomValues(b); x = b[0]; } while (x >= lim); return s[x % s.length]; };
    let out; do { out = Array.from({ length: L }, () => pick(all)).join(''); } while (!use.every(k => [...out].some(c => pools[k].includes(c))));
    return { value: out, bits: Math.round(L * Math.log2(all.length)) };
  }
  return { OPS, run, hash, hashGuess, jwt, when, csvToInsert, password, b64ToBytes, bytesToHex, rot, utf16leEncode, bytesToB64 };
})();

/* ---------- interfaz reutilizable ---------- */
function toolsWidget(only) {
  const TABS = [['dec', 'Decodificar'], ['hash', 'Hashes'], ['jwt', 'JWT'], ['fecha', 'Fechas'], ['csv', 'CSV → SQL'], ['pass', 'Contraseñas']].filter(([k]) => !only || only.includes(k));
  const el = h(`<div class="tools"><div class="tabs" role="tablist">${TABS.map(([k, t]) => `<button class="tab" data-t="${k}" type="button">${t}</button>`).join('')}</div><div class="tools-body"></div><p class="muted" style="font-size:.8rem">Todo se calcula en tu navegador; nada se envía a internet. Úsalo solo con datos que tengas permiso de analizar.</p></div>`);
  const body = $('.tools-body', el);
  let cur = TABS[0][0];
  const out = (txt, err) => `<div class="field"><label>Resultado</label><textarea class="sql-ta tout" rows="5" readonly ${err ? 'style="color:var(--bad)"' : ''}>${esc(txt)}</textarea></div>`;
  const wireCopy = () => { const b = $('.cp', body); if (b) b.addEventListener('click', () => copyText($('.tout', body).value, 'Resultado copiado')); };
  const draws = {
    dec() {
      body.innerHTML = `<div class="field"><label for="t-in">Entrada</label><textarea id="t-in" class="sql-ta" rows="4" spellcheck="false"></textarea></div>
        <div class="row"><select id="t-op">${Object.entries(TOOLS.OPS).map(([k, [t]]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select><input id="t-n" type="number" value="3" style="width:70px" aria-label="Desplazamiento N" hidden><input id="t-k" value="2a" style="width:70px" aria-label="Llave en hexadecimal" hidden><button class="btn small primary go" type="button">Convertir</button><button class="btn small cp" type="button">Copiar resultado</button></div><div class="t-out">${out('')}</div>`;
      const op = $('#t-op', body);
      const sync = () => { $('#t-n', body).hidden = op.value !== 'rotn'; $('#t-k', body).hidden = op.value !== 'xor'; };
      op.addEventListener('change', sync); sync();
      const go2 = () => { try { $('.t-out', body).innerHTML = out(TOOLS.run(op.value, $('#t-in', body).value, { n: $('#t-n', body).value, key: $('#t-k', body).value })); } catch (e) { $('.t-out', body).innerHTML = out('Error: ' + e.message, true); } };
      $('.go', body).addEventListener('click', go2); wireCopy();
    },
    hash() {
      body.innerHTML = `<div class="field"><label for="h-in">Texto</label><textarea id="h-in" class="sql-ta" rows="3" spellcheck="false"></textarea></div>
        <div class="row"><button class="btn small primary go" type="button">Calcular SHA-256, SHA-1 y SHA-512</button><button class="btn small id" type="button">¿Qué hash es? (pega un hash)</button><button class="btn small cp" type="button">Copiar resultado</button></div><div class="t-out">${out('')}</div>
        <p class="muted" style="font-size:.8rem">Para archivos usa en Windows: Get-FileHash archivo -Algorithm SHA256 · en Linux: sha256sum archivo</p>`;
      $('.go', body).addEventListener('click', async () => { try { const t = $('#h-in', body).value; const r = await Promise.all(['SHA-256', 'SHA-1', 'SHA-512'].map(a => TOOLS.hash(a, t))); $('.t-out', body).innerHTML = out(`SHA-256: ${r[0]}\nSHA-1:   ${r[1]}\nSHA-512: ${r[2]}`); } catch (e) { $('.t-out', body).innerHTML = out('Error: ' + e.message, true); } });
      $('.id', body).addEventListener('click', () => { $('.t-out', body).innerHTML = out(TOOLS.hashGuess($('#h-in', body).value)); });
      wireCopy();
    },
    jwt() {
      body.innerHTML = `<div class="field"><label for="j-in">Token JWT</label><textarea id="j-in" class="sql-ta" rows="3" spellcheck="false" placeholder="eyJ…"></textarea></div><div class="row"><button class="btn small primary go" type="button">Decodificar</button><button class="btn small cp" type="button">Copiar resultado</button></div><div class="t-out">${out('')}</div>
        <p class="muted" style="font-size:.8rem">Decodificar no es verificar: cualquiera puede leer un JWT. Lo que lo protege es que el servidor revise la firma.</p>`;
      $('.go', body).addEventListener('click', () => { try { const r = TOOLS.jwt($('#j-in', body).value); $('.t-out', body).innerHTML = out(`Encabezado:\n${JSON.stringify(r.header, null, 2)}\n\nContenido:\n${JSON.stringify(r.payload, null, 2)}${r.warn.length ? '\n\nAvisos:\n- ' + r.warn.join('\n- ') : ''}`); } catch (e) { $('.t-out', body).innerHTML = out('Error: ' + e.message, true); } });
      wireCopy();
    },
    fecha() {
      body.innerHTML = `<div class="row"><input id="w-in" placeholder="1730700000 · 133748064000000000 · 2026-11-04" style="flex:1;min-width:0;font-family:var(--f-mono)" aria-label="Número o fecha"><button class="btn small primary go" type="button">Convertir</button><button class="btn small now" type="button">Ahora</button></div><div class="t-res"></div>
        <p class="muted" style="font-size:.8rem">Sirve para logs: epoch de Linux y JWT, milisegundos de JavaScript, FILETIME de Windows y fechas del historial de Chrome.</p>`;
      const go2 = () => { try { $('.t-res', body).innerHTML = `<table class="addr">${TOOLS.when($('#w-in', body).value).map(([a, b]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td></tr>`).join('')}</table>`; } catch (e) { $('.t-res', body).innerHTML = `<p class="sql-err">${esc(e.message)}</p>`; } };
      $('.go', body).addEventListener('click', go2);
      $('.now', body).addEventListener('click', () => { $('#w-in', body).value = String(Math.floor(Date.now() / 1000)); go2(); });
    },
    csv() {
      body.innerHTML = `<div class="field"><label for="c-in">CSV con encabezados (coma o punto y coma)</label><textarea id="c-in" class="sql-ta" rows="5" spellcheck="false" placeholder="usuario,correo,activo&#10;jperez,jperez@empresa.mx,1"></textarea></div>
        <div class="row"><input id="c-t" value="dbo.usuarios" style="width:180px" aria-label="Tabla destino"><select id="c-d"><option value="sqlserver">SQL Server</option><option value="postgres">PostgreSQL</option><option value="mysql">MySQL</option><option value="sqlite">SQLite</option></select><button class="btn small primary go" type="button">Generar INSERT</button><button class="btn small cp" type="button">Copiar resultado</button></div><div class="t-out">${out('')}</div>
        <p class="muted" style="font-size:.8rem">Las comillas simples se escapan solas y todo va dentro de una transacción para que revises antes de confirmar.</p>`;
      $('.go', body).addEventListener('click', () => { try { $('.t-out', body).innerHTML = out(TOOLS.csvToInsert($('#c-in', body).value, $('#c-t', body).value, $('#c-d', body).value)); } catch (e) { $('.t-out', body).innerHTML = out('Error: ' + e.message, true); } });
      wireCopy();
    },
    pass() {
      body.innerHTML = `<div class="row"><label class="muted" for="p-l">Largo</label><input id="p-l" type="number" min="8" max="128" value="20" style="width:80px">${[['min', 'minúsculas'], ['may', 'MAYÚSCULAS'], ['num', 'números'], ['sim', 'símbolos']].map(([k, t]) => `<label class="ext-check"><input type="checkbox" data-k="${k}" checked> ${t}</label>`).join('')}<button class="btn small primary go" type="button">Generar</button><button class="btn small cp" type="button">Copiar</button></div><div class="t-out">${out('')}</div>
        <p class="muted" style="font-size:.8rem">Se genera con el generador aleatorio criptográfico del navegador. Guárdala en un gestor de contraseñas, no en notas.</p>`;
      $('.go', body).addEventListener('click', () => { try { const sets = {}; $$('[data-k]', body).forEach(c => sets[c.dataset.k] = c.checked); const r = TOOLS.password(+$('#p-l', body).value, sets); $('.t-out', body).innerHTML = out(`${r.value}\n\nFuerza aproximada: ${r.bits} bits${r.bits >= 80 ? ' (muy buena)' : r.bits >= 60 ? ' (buena)' : ' (súbele el largo)'}`); } catch (e) { $('.t-out', body).innerHTML = out('Error: ' + e.message, true); } });
      wireCopy();
    }
  };
  const draw = () => { $$('.tab', el).forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === cur))); draws[cur](); };
  $$('.tab', el).forEach(b => b.addEventListener('click', () => { cur = b.dataset.t; draw(); }));
  draw();
  return el;
}
if (typeof module !== 'undefined') module.exports = { TOOLS };
