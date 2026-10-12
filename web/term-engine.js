/* ===== Terminal simulada: sistema de archivos y comandos (Linux, CMD y PowerShell) ===== */
const TERM = (() => {
  /* ---------- contenido de Linux ---------- */
  function authLog() {
    const L = []; let t = 3 * 3600 + 2 * 60;
    const ts = () => { t += 7 + (L.length * 13) % 29; const hh = String(Math.floor(t / 3600)).padStart(2, '0'), mm = String(Math.floor(t / 60) % 60).padStart(2, '0'), ss = String(t % 60).padStart(2, '0'); return `Oct 12 ${hh}:${mm}:${ss}`; };
    const pid = () => 2000 + (L.length * 37) % 900;
    const port = () => 40000 + (L.length * 911) % 20000;
    L.push(`${ts()} web01 sshd[${pid()}]: Accepted publickey for alfonso from 192.168.1.20 port ${port()} ssh2`);
    L.push(`${ts()} web01 sshd[${pid()}]: pam_unix(sshd:session): session opened for user alfonso`);
    const seq = [];
    for (let i = 0; i < 23; i++) seq.push(['root', '185.220.101.47']);
    for (let i = 0; i < 9; i++) seq.splice(3 + i * 3, 0, ['admin', '45.95.147.236']);
    for (let i = 0; i < 5; i++) seq.splice(5 + i * 6, 0, ['ubuntu', '103.152.79.12']);
    seq.forEach(([u, ip]) => L.push(`${ts()} web01 sshd[${pid()}]: Failed password for ${u} from ${ip} port ${port()} ssh2`));
    L.push(`${ts()} web01 sshd[${pid()}]: Accepted password for root from 185.220.101.47 port ${port()} ssh2`);
    L.push(`${ts()} web01 sshd[${pid()}]: pam_unix(sshd:session): session opened for user root`);
    L.push(`${ts()} web01 useradd[${pid()}]: new user: name=backup2, UID=0, GID=0, home=/home/backup2, shell=/bin/bash`);
    L.push(`${ts()} web01 sudo:  alfonso : TTY=pts/0 ; PWD=/home/alfonso ; USER=root ; COMMAND=/usr/bin/apt update`);
    return L.join('\n') + '\n';
  }
  const ACCESS = [
    '192.168.1.20 - - [12/Oct/2026:09:01:12] "GET / HTTP/1.1" 200 5120 "Mozilla/5.0"',
    '192.168.1.31 - - [12/Oct/2026:09:01:40] "GET /productos.php?id=4 HTTP/1.1" 200 2210 "Mozilla/5.0"',
    '192.0.2.50 - - [12/Oct/2026:09:03:02] "GET /admin/ HTTP/1.1" 404 210 "Nikto/2.5.0"',
    '192.0.2.50 - - [12/Oct/2026:09:03:02] "GET /phpmyadmin/ HTTP/1.1" 404 210 "Nikto/2.5.0"',
    '192.0.2.50 - - [12/Oct/2026:09:03:03] "GET /.env HTTP/1.1" 404 210 "Nikto/2.5.0"',
    '198.51.100.23 - - [12/Oct/2026:09:07:44] "GET /productos.php?id=1\' HTTP/1.1" 500 98 "Mozilla/5.0"',
    '198.51.100.23 - - [12/Oct/2026:09:08:10] "GET /productos.php?id=1 UNION SELECT usuario,password FROM usuarios-- HTTP/1.1" 200 3301 "Mozilla/5.0"',
    '198.51.100.88 - - [12/Oct/2026:09:15:21] "GET /buscar?q=<script>alert(1)</script> HTTP/1.1" 200 1800 "Mozilla/5.0"',
    '192.168.1.31 - - [12/Oct/2026:09:20:05] "POST /login.php HTTP/1.1" 302 0 "Mozilla/5.0"',
    '192.168.1.44 - - [12/Oct/2026:09:22:17] "GET /contacto HTTP/1.1" 200 1500 "Mozilla/5.0"'
  ].join('\n') + '\n';
  const PASSWD = ['root:x:0:0:root:/root:/bin/bash', 'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin', 'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin', 'sshd:x:110:65534::/run/sshd:/usr/sbin/nologin', 'mysql:x:112:117:MySQL Server:/nonexistent:/bin/false', 'alfonso:x:1000:1000:Alfonso:/home/alfonso:/bin/bash', 'backup2:x:0:0::/home/backup2:/bin/bash'].join('\n') + '\n';
  const LFS = {
    '/home/alfonso/notas.txt': 'Pendientes del lunes:\n- Revisar alertas del SIEM\n- Parchar web01 (apache)\n- Cambiar contraseña de la impresora del 2do piso\n',
    '/home/alfonso/.credenciales_viejas.txt': 'usuario: admin\npassword: Verano2019!\n# ¡Esto NO debería existir en texto plano!\n',
    '/home/alfonso/.bash_history': 'ls -la\ncd /var/log\ntail auth.log\nsudo apt update\n',
    '/home/alfonso/reportes/ventas_q3.csv': 'mes,region,monto\njulio,norte,120500\nagosto,norte,98000\nseptiembre,sur,143200\n',
    '/home/alfonso/scripts/backup.sh': '#!/bin/bash\n# Respalda la carpeta de reportes con fecha\nFECHA=$(date +%F)\ntar -czf /backups/reportes_$FECHA.tar.gz /home/alfonso/reportes\necho "Respaldo listo: $FECHA"\n',
    '/var/log/auth.log': authLog(),
    '/var/log/syslog': 'Oct 12 03:40:02 web01 CRON[3110]: (root) CMD (/tmp/.x/kworkerd -o pool.minexmr.example:4444)\nOct 12 04:00:01 web01 systemd[1]: Started Daily apt download activities.\n',
    '/var/log/apache2/access.log': ACCESS,
    '/etc/passwd': PASSWD,
    '/etc/hosts': '127.0.0.1\tlocalhost\n192.168.1.10\tweb01\n',
    '/etc/ssh/sshd_config': 'Port 22\nPermitRootLogin yes\nPasswordAuthentication yes\n# Recomendado: PermitRootLogin no y solo llaves\n',
    '/tmp/.x/kworkerd': '\u007fELF (binario)\n',
    '/var/www/html/index.html': '<h1>Tienda Ejemplo</h1>\n'
  };
  const LDIRS = ['/', '/home', '/home/alfonso', '/home/alfonso/reportes', '/home/alfonso/scripts', '/var', '/var/log', '/var/log/apache2', '/etc', '/etc/ssh', '/tmp', '/tmp/.x', '/var/www', '/var/www/html', '/root'];
  const PS = `USER       PID %CPU %MEM COMMAND
root         1  0.0  0.4 /sbin/init
root       812  0.0  0.6 /usr/sbin/sshd -D
www-data  1022  0.3  2.1 /usr/sbin/apache2 -k start
mysql     1101  0.8  6.5 /usr/sbin/mysqld
root      3110 98.7 12.0 /tmp/.x/kworkerd -o pool.minexmr.example:4444
root      3377  0.0  0.1 nc -lvnp 4444
alfonso   3402  0.0  0.2 -bash
alfonso   3460  0.0  0.1 ps aux
`;
  const SS = `Netid State  Local Address:Port  Peer Address:Port  Process
tcp   LISTEN 0.0.0.0:22          0.0.0.0:*          users:(("sshd",pid=812))
tcp   LISTEN 0.0.0.0:80          0.0.0.0:*          users:(("apache2",pid=1022))
tcp   LISTEN 127.0.0.1:3306      0.0.0.0:*          users:(("mysqld",pid=1101))
tcp   LISTEN 0.0.0.0:4444        0.0.0.0:*          users:(("nc",pid=3377))
`;
  const IPA = `1: lo: <LOOPBACK,UP> mtu 65536
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500
    link/ether 52:54:00:a1:b2:c3
    inet 192.168.1.10/24 brd 192.168.1.255 scope global eth0
`;
  const FAKEHASH = p => { let h1 = 0x811c9dc5; for (const c of p) h1 = Math.imul(h1 ^ c.charCodeAt(0), 16777619) >>> 0; let s = ''; for (let i = 0; i < 8; i++) { h1 = Math.imul(h1 ^ (i * 2654435761), 16777619) >>> 0; s += h1.toString(16).padStart(8, '0'); } return s; };

  /* ---------- contenido de Windows ---------- */
  const W = 'C:\\Users\\alfonso';
  const WFS = {
    [W + '\\Desktop\\nota.txt']: 'Recordar: no compartir la contraseña del Wi-Fi de la oficina.\r\n',
    [W + '\\Documents\\inventario.txt']: 'Laptop-Ventas-01  Dell  Win11\r\nLaptop-Conta-02   HP    Win10 (sin soporte en 2025!)\r\nImpresora-2P      Ricoh firmware 2019\r\n',
    [W + '\\Downloads\\factura_2026.pdf.exe']: 'MZ (ejecutable)\r\n',
    [W + '\\Downloads\\manual_vpn.pdf']: '%PDF-1.7\r\n',
    'C:\\Windows\\System32\\drivers\\etc\\hosts': '# Archivo hosts de Windows\r\n127.0.0.1       localhost\r\n45.13.22.9      www.bancomex.com\r\n45.13.22.9      bancomex.com\r\n'
  };
  const WDIRS = ['C:\\', 'C:\\Users', W, W + '\\Desktop', W + '\\Documents', W + '\\Downloads', 'C:\\Windows', 'C:\\Windows\\System32', 'C:\\Windows\\System32\\drivers', 'C:\\Windows\\System32\\drivers\\etc'];
  const TASKS = [['System Idle Process', 0, '8 K'], ['System', 4, '144 K'], ['svchost.exe', 1012, '24,312 K'], ['explorer.exe', 3880, '98,104 K'], ['chrome.exe', 5120, '210,532 K'], ['OneDrive.exe', 6022, '40,226 K'], ['svch0st.exe', 4321, '61,880 K'], ['cmd.exe', 7100, '4,120 K']];
  const NETSTAT = `
Conexiones activas

  Proto  Dirección local          Dirección remota        Estado           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING        1012
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING        4
  TCP    192.168.1.20:52114     142.250.72.14:443      ESTABLISHED      5120
  TCP    192.168.1.20:52190     13.107.42.16:443       ESTABLISHED      6022
  TCP    192.168.1.20:53001     91.240.118.172:443     ESTABLISHED      4321
`;
  const IPCONFIG = `
Configuración IP de Windows

Adaptador de Ethernet Ethernet:

   Sufijo DNS específico para la conexión. . :
   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.20
   Máscara de subred . . . . . . . . . . . . : 255.255.255.0
   Puerta de enlace predeterminada . . . . . : 192.168.1.254
`;
  const IPCONFIG_ALL = `
Configuración IP de Windows

   Nombre de host. . . . . . . . . : PC-ALFONSO

Adaptador de Ethernet Ethernet:

   Descripción . . . . . . . . . . . . . . . : Intel(R) Ethernet Connection
   Dirección física. . . . . . . . . . . . . : 3C-52-82-1A-7F-09
   DHCP habilitado . . . . . . . . . . . . . : sí
   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.20(Preferido)
   Máscara de subred . . . . . . . . . . . . : 255.255.255.0
   Concesión obtenida. . . . . . . . . . . . : lunes, 12 de octubre de 2026 08:02:11
   Puerta de enlace predeterminada . . . . . : 192.168.1.254
   Servidor DHCP . . . . . . . . . . . . . . : 192.168.1.254
   Servidores DNS. . . . . . . . . . . . . . : 192.168.1.254
                                               8.8.8.8
`;
  // Registro de seguridad de Windows (simulado): [fecha, id, mensaje]
  const WEVENTS = [
    ['12/10/2026 08:02:30', 4624, 'Inicio de sesión correcto · Cuenta: alfonso · Tipo: 2 (en el teclado)'],
    ['12/10/2026 03:12:40', 4624, 'Inicio de sesión correcto · Cuenta: soporte_temp · Origen: 91.240.118.172 · Tipo: 10 (Escritorio remoto)'],
    ['12/10/2026 03:10:20', 4732, 'Miembro agregado a grupo · Grupo: Administradores · Cuenta agregada: soporte_temp · Por: Administrador'],
    ['12/10/2026 03:10:15', 4720, 'Cuenta de usuario creada · Cuenta nueva: soporte_temp · Creada por: Administrador'],
    ['12/10/2026 03:08:02', 4624, 'Inicio de sesión correcto · Cuenta: Administrador · Origen: 91.240.118.172 · Tipo: 10 (Escritorio remoto)'],
    ['12/10/2026 03:07:51', 4625, 'Error de inicio de sesión · Cuenta: Administrador · Origen: 91.240.118.172 · Tipo: 10'],
    ['12/10/2026 03:07:33', 4625, 'Error de inicio de sesión · Cuenta: Administrador · Origen: 91.240.118.172 · Tipo: 10'],
    ['12/10/2026 03:07:12', 4625, 'Error de inicio de sesión · Cuenta: admin · Origen: 91.240.118.172 · Tipo: 10'],
    ['12/10/2026 03:06:58', 4625, 'Error de inicio de sesión · Cuenta: Administrador · Origen: 91.240.118.172 · Tipo: 10'],
    ['12/10/2026 03:06:41', 4625, 'Error de inicio de sesión · Cuenta: administrator · Origen: 91.240.118.172 · Tipo: 10'],
    ['12/10/2026 03:06:20', 4625, 'Error de inicio de sesión · Cuenta: Administrador · Origen: 91.240.118.172 · Tipo: 10'],
    ['11/10/2026 18:31:09', 4634, 'Cierre de sesión · Cuenta: alfonso']
  ];
  const WPATH = { 'svchost.exe': 'C:\\Windows\\System32\\svchost.exe', 'explorer.exe': 'C:\\Windows\\explorer.exe', 'chrome.exe': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'OneDrive.exe': 'C:\\Users\\alfonso\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe', 'svch0st.exe': 'C:\\Users\\alfonso\\AppData\\Roaming\\svch0st.exe', 'cmd.exe': 'C:\\Windows\\System32\\cmd.exe' };
  const PINGOK = { '8.8.8.8': '8.8.8.8', 'google.com': '142.250.72.14', '192.168.1.254': '192.168.1.254', '1.1.1.1': '1.1.1.1', 'localhost': '127.0.0.1', '127.0.0.1': '127.0.0.1', '192.168.1.10': '192.168.1.10' };

  /* ---------- utilidades ---------- */
  function tokenize(s) {
    const out = []; let cur = '', q = null, has = false;
    for (const c of s) {
      if (q) { if (c === q) q = null; else cur += c; continue; }
      if (c === '"' || c === "'") { q = c; has = true; continue; }
      if (/\s/.test(c)) { if (cur || has) { out.push(cur); cur = ''; has = false; } continue; }
      cur += c;
    }
    if (cur || has) out.push(cur);
    return out;
  }
  function splitPipes(s) { const parts = []; let cur = '', q = null; for (const c of s) { if (q) { if (c === q) q = null; cur += c; continue; } if (c === '"' || c === "'") { q = c; cur += c; continue; } if (c === '|') { parts.push(cur); cur = ''; continue; } cur += c; } parts.push(cur); return parts.map(x => x.trim()); }
  const lines = t => t.replace(/\n$/, '').split('\n');
  const globRe = g => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');

  /* ---------- sesión ---------- */
  function create(os) {
    const S = { os, cwd: os === 'linux' ? '/home/alfonso' : W, hist: [], perms: {}, killed: {} };
    S.perms['/home/alfonso/scripts/backup.sh'] = '-rw-r--r--';
    return S;
  }
  const prompt = S => S.os === 'linux' ? `alfonso@web01:${S.cwd.replace('/home/alfonso', '~')}$` : `${S.cwd}>`;

  /* ---------- Linux ---------- */
  function lres(S, p) {
    if (!p || p === '~') return '/home/alfonso';
    if (p.startsWith('~/')) p = '/home/alfonso/' + p.slice(2);
    const parts = (p.startsWith('/') ? p : S.cwd + '/' + p).split('/');
    const st = []; for (const x of parts) { if (!x || x === '.') continue; if (x === '..') st.pop(); else st.push(x); }
    return '/' + st.join('/');
  }
  const lIsDir = p => LDIRS.includes(p);
  const lIsFile = p => Object.prototype.hasOwnProperty.call(LFS, p);
  function lChildren(dir) {
    const pre = dir === '/' ? '/' : dir + '/', set = new Map();
    [...Object.keys(LFS), ...LDIRS].forEach(p => { if (p !== dir && p.startsWith(pre)) { const name = p.slice(pre.length).split('/')[0]; const full = pre + name; set.set(name, lIsDir(full)); } });
    return [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
  const lperm = (S, full, isDir) => S.perms[full] || (isDir ? 'drwxr-xr-x' : full.endsWith('.sh') ? '-rwxr-xr-x' : '-rw-r--r--');
  const lread = (S, f) => { const p = lres(S, f); if (lIsFile(p)) return { t: LFS[p] }; if (lIsDir(p)) return { e: `${f}: Es un directorio` }; return { e: `${f}: No existe el archivo o el directorio` }; };

  const LCMD = {
    help: () => 'Comandos disponibles: pwd ls cd cat head tail grep wc sort uniq cut awk find whoami id hostname uname date echo ps ss netstat ip ping history chmod sha256sum sudo clear man\nUsa | para encadenar: grep "Failed" /var/log/auth.log | wc -l\nEscribe man <comando> para ver qué hace.',
    pwd: S => S.cwd,
    whoami: () => 'alfonso',
    id: () => 'uid=1000(alfonso) gid=1000(alfonso) grupos=1000(alfonso),27(sudo)',
    hostname: () => 'web01',
    uname: (S, a) => a.includes('-a') ? 'Linux web01 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux' : 'Linux',
    date: () => 'lun 12 oct 2026 15:30:00 CST',
    echo: (S, a) => a.join(' '),
    history: S => S.hist.map((x, i) => String(i + 1).padStart(4) + '  ' + x).join('\n'),
    ps: () => PS.trimEnd(),
    ss: () => SS.trimEnd(),
    netstat: () => SS.trimEnd(),
    ip: (S, a) => a[0] === 'a' || a[0] === 'addr' ? IPA.trimEnd() : a[0] === 'r' || a[0] === 'route' ? 'default via 192.168.1.1 dev eth0\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10' : 'Uso: ip a | ip route',
    ifconfig: () => 'ifconfig es antiguo; en Linux moderno usa: ip a',
    sudo: () => ({ e: 'Simulador: aquí no hay sudo. En un sistema real, sudo ejecuta un comando como administrador y queda registrado en /var/log/auth.log.' }),
    cd: (S, a) => { const p = lres(S, a[0] || '~'); if (!lIsDir(p)) return { e: `cd: ${a[0]}: No existe el directorio` }; if (p === '/root') return { e: 'cd: /root: Permiso denegado' }; S.cwd = p; return ''; },
    ls: (S, a) => {
      const flags = a.filter(x => x.startsWith('-')).join(''), args = a.filter(x => !x.startsWith('-'));
      const p = lres(S, args[0] || '.');
      if (lIsFile(p)) return flags.includes('l') ? `${lperm(S, p, false)} 1 alfonso alfonso ${String(LFS[p].length).padStart(5)} oct 12 09:00 ${args[0]}` : args[0];
      if (!lIsDir(p)) return { e: `ls: no se puede acceder a '${args[0]}': No existe el archivo o el directorio` };
      if (p === '/root') return { e: "ls: no se puede abrir el directorio '/root': Permiso denegado" };
      let items = lChildren(p); if (!flags.includes('a')) items = items.filter(([n]) => !n.startsWith('.'));
      if (flags.includes('l')) return items.map(([n, d]) => { const full = (p === '/' ? '' : p) + '/' + n; return `${lperm(S, full, d)} 1 ${p.startsWith('/home') ? 'alfonso alfonso' : 'root    root   '} ${String(d ? 4096 : LFS[full].length).padStart(5)} oct 12 09:00 ${n}${d ? '/' : ''}`; }).join('\n');
      return items.map(([n, d]) => n + (d ? '/' : '')).join('  ');
    },
    cat: (S, a, inp) => { if (!a.length) return inp || ''; const out = []; for (const f of a) { const r = lread(S, f); if (r.e) return { e: 'cat: ' + r.e }; out.push(r.t.replace(/\n$/, '')); } return out.join('\n'); },
    head: (S, a, inp) => { let n = 10; const i = a.indexOf('-n'); if (i >= 0) { n = +a[i + 1]; a.splice(i, 2); } else if (a[0] && /^-\d+$/.test(a[0])) n = +a.shift().slice(1); const src = a[0] ? lread(S, a[0]) : { t: inp || '' }; if (src.e) return { e: 'head: ' + src.e }; return lines(src.t).slice(0, n).join('\n'); },
    tail: (S, a, inp) => { let n = 10; a = a.filter(x => x !== "-f"); const i = a.indexOf('-n'); if (i >= 0) { n = +a[i + 1]; a.splice(i, 2); } else if (a[0] && /^-\d+$/.test(a[0])) n = +a.shift().slice(1); const src = a[0] ? lread(S, a[0]) : { t: inp || '' }; if (src.e) return { e: 'tail: ' + src.e }; const L = lines(src.t); return L.slice(Math.max(0, L.length - n)).join('\n'); },
    grep: (S, a, inp) => {
      const fl = a.filter(x => /^-[a-z]+$/.test(x)).join(''), rest = a.filter(x => !/^-[a-z]+$/.test(x));
      const pat = rest[0]; if (pat == null) return { e: 'Uso: grep [-i -c -v -n] "texto" archivo' };
      const src = rest[1] ? lread(S, rest[1]) : { t: inp || '' }; if (src.e) return { e: 'grep: ' + src.e };
      let re; try { re = new RegExp(pat, fl.includes('i') ? 'i' : ''); } catch (e) { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), fl.includes('i') ? 'i' : ''); }
      const res = []; lines(src.t).forEach((l, i) => { const m = re.test(l); if (m !== fl.includes('v')) res.push((fl.includes('n') ? (i + 1) + ':' : '') + l); });
      return fl.includes('c') ? String(res.length) : res.join('\n');
    },
    wc: (S, a, inp) => { const fl = a.filter(x => x.startsWith('-')).join(''), f = a.find(x => !x.startsWith('-')); const src = f ? lread(S, f) : { t: inp || '' }; if (src.e) return { e: 'wc: ' + src.e }; const L = src.t ? lines(src.t).length : 0; if (fl.includes('l')) return String(L); return `${L} ${src.t.split(/\s+/).filter(Boolean).length} ${src.t.length}`; },
    sort: (S, a, inp) => { const fl = a.filter(x => x.startsWith('-')).join(''), f = a.find(x => !x.startsWith('-')); const src = f ? lread(S, f) : { t: inp || '' }; if (src.e) return { e: 'sort: ' + src.e }; let L = lines(src.t); L.sort(fl.includes('n') ? (x, y) => parseFloat(x) - parseFloat(y) : (x, y) => x.localeCompare(y)); if (fl.includes('r')) L.reverse(); return L.join('\n'); },
    uniq: (S, a, inp) => { const c = a.includes('-c'); const L = lines(inp || ''), out = []; L.forEach(l => { const last = out[out.length - 1]; if (last && last[0] === l) last[1]++; else out.push([l, 1]); }); return out.map(([l, n]) => c ? String(n).padStart(7) + ' ' + l : l).join('\n'); },
    cut: (S, a, inp) => { const di = a.indexOf('-d'), fi = a.indexOf('-f'); const d = di >= 0 ? a[di + 1] : '\t', fs = fi >= 0 ? a[fi + 1] : '1'; const f = a.filter((x, i) => !x.startsWith('-') && i !== di + 1 && i !== fi + 1)[0]; const src = f ? lread(S, f) : { t: inp || '' }; if (src.e) return { e: 'cut: ' + src.e }; const idx = fs.split(',').map(x => +x - 1); return lines(src.t).map(l => { const p = l.split(d); return idx.map(i => p[i] || '').join(d); }).join('\n'); },
    awk: (S, a, inp) => { const prog = a[0] || ''; const m = prog.match(/^\{\s*print\s+(.+?)\s*\}$/); if (!m) return { e: "Simulador: awk solo soporta '{print $N}' (por ejemplo awk '{print $1}')" }; const f = a[1]; const src = f ? lread(S, f) : { t: inp || '' }; if (src.e) return { e: 'awk: ' + src.e }; const cols = m[1].split(',').map(x => x.trim()); return lines(src.t).map(l => { const p = l.trim().split(/\s+/); return cols.map(c => c === '$0' ? l : c === '$NF' ? p[p.length - 1] : /^\$\d+$/.test(c) ? (p[+c.slice(1) - 1] || '') : c.replace(/^"|"$/g, '')).join(' '); }).join('\n'); },
    find: (S, a) => { const ni = a.indexOf('-name'); const base = lres(S, a[0] && a[0] !== '-name' ? a[0] : '.'); const re = ni >= 0 ? globRe(a[ni + 1] || '*') : /.*/; return [...Object.keys(LFS), ...LDIRS].filter(p => p.startsWith(base === '/' ? '/' : base + '/') || p === base).filter(p => re.test(p.split('/').pop())).sort().join('\n') || ''; },
    chmod: (S, a) => { const [mode, f] = a; const p = lres(S, f || ''); if (!lIsFile(p)) return { e: `chmod: no se puede acceder a '${f}'` }; const map = { '755': '-rwxr-xr-x', '700': '-rwx------', '644': '-rw-r--r--', '600': '-rw-------', '777': '-rwxrwxrwx', '+x': '-rwxr-xr-x' }; if (!map[mode]) return { e: 'Simulador: usa 755, 700, 644, 600, 777 o +x' }; S.perms[p] = map[mode]; return mode === '777' ? 'Hecho. Ojo: 777 deja que CUALQUIER usuario modifique el archivo. Casi nunca es buena idea.' : ''; },
    sha256sum: (S, a) => { const p = lres(S, a[0] || ''); if (!lIsFile(p)) return { e: `sha256sum: ${a[0] || ''}: No existe el archivo` }; return FAKEHASH(LFS[p] + p) + '  ' + a[0]; },
    ping: (S, a) => { const host = a.filter(x => !x.startsWith('-') && !/^\d+$/.test(x))[0]; if (!host) return { e: 'Uso: ping -c 4 8.8.8.8' }; const ip = PINGOK[host]; if (!ip) return { e: `ping: ${host}: Nombre o servicio desconocido` }; return `PING ${host} (${ip}) 56(84) bytes de datos.\n` + [1, 2, 3, 4].map(i => `64 bytes desde ${ip}: icmp_seq=${i} ttl=117 tiempo=${(14 + i * 1.3).toFixed(1)} ms`).join('\n') + `\n--- ${host} estadísticas ---\n4 paquetes transmitidos, 4 recibidos, 0% pérdida`; },
    clear: () => ({ clear: true })
  };

  /* ---------- Windows CMD ---------- */
  const wnorm = p => p.replace(/\//g, '\\');
  function wres(S, p) {
    if (!p) return S.cwd; p = wnorm(p);
    let base = /^[a-z]:/i.test(p) ? '' : p.startsWith('\\') ? S.cwd.slice(0, 2) : S.cwd;
    const parts = (base ? base + '\\' + p : p).split('\\');
    const st = []; for (const x of parts) { if (!x || x === '.') continue; if (x === '..') { if (st.length > 1) st.pop(); } else st.push(x); }
    return st.length === 1 ? st[0].toUpperCase() + '\\' : st[0].toUpperCase() + '\\' + st.slice(1).join('\\');
  }
  const wfind = (list, p) => list.find(x => x.toLowerCase() === p.toLowerCase());
  const wIsDir = p => !!wfind(WDIRS, p);
  const wFile = p => wfind(Object.keys(WFS), p);
  function wChildren(dir) {
    const pre = (dir.endsWith('\\') ? dir : dir + '\\').toLowerCase(), m = new Map();
    [...Object.keys(WFS), ...WDIRS].forEach(p => { if (p.toLowerCase().startsWith(pre) && p.toLowerCase() !== dir.toLowerCase()) { const name = p.slice(pre.length).split('\\')[0]; if (name) m.set(name, wIsDir(p.slice(0, pre.length) + name)); } });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
  const wread = (S, f) => { const p = wFile(wres(S, f)); return p ? { t: WFS[p] } : { e: 'El sistema no puede encontrar el archivo especificado.' }; };
  const WCMD = {
    help: () => 'CMD: dir cd type cls echo ipconfig ping tracert nslookup netstat tasklist taskkill whoami hostname net systeminfo findstr find getmac arp ver\nPowerShell: escribe Get-Help para ver los cmdlets (Get-Process, Get-WinEvent, Get-NetTCPConnection...)\nEncadena con |, por ejemplo: netstat -ano | findstr ESTABLISHED\nEscribe help <comando> o man <comando> para ver qué hace.',
    cls: () => ({ clear: true }),
    ver: () => 'Microsoft Windows [Versión 10.0.22631.4317]',
    echo: (S, a) => a.join(' '),
    hostname: () => 'PC-ALFONSO',
    whoami: (S, a) => a.includes('/priv') ? 'Privilegio                     Estado\nSeChangeNotifyPrivilege        Habilitada\nSeShutdownPrivilege            Deshabilitado' : 'pc-alfonso\\alfonso',
    cd: (S, a) => { if (!a.length) return S.cwd; const p = wres(S, a.join(' ')); const d = wfind(WDIRS, p); if (!d) return { e: 'El sistema no puede encontrar la ruta especificada.' }; S.cwd = d; return ''; },
    dir: (S, a) => {
      const p = wres(S, a.filter(x => !x.startsWith('/')).join(' ') || '.'); const d = wfind(WDIRS, p);
      if (!d) return { e: 'No se encuentra el archivo' };
      const items = wChildren(d);
      return ` Directorio de ${d}\n\n` + items.map(([n, isd]) => `12/10/2026  09:00 a. m.    ${isd ? '<DIR>         ' : String((WFS[(d.endsWith('\\') ? d : d + '\\') + n] || '').length * 1024).padStart(14)} ${n}`).join('\n') + `\n               ${items.filter(x => !x[1]).length} archivos`;
    },
    type: (S, a, inp) => { if (!a.length) return { e: 'Uso: type archivo.txt' }; const r = wread(S, a.join(' ')); if (r.e) return { e: r.e }; if (/\.exe$/i.test(a.join(' '))) return 'MZ... (es un ejecutable, no un PDF)'; return r.t.replace(/\r/g, '').replace(/\n$/, ''); },
    ipconfig: (S, a) => (a.some(x => x.toLowerCase() === '/all') ? IPCONFIG_ALL : IPCONFIG).trim(),
    getmac: () => 'Dirección física    Nombre de transporte\n=================== ====================\n3C-52-82-1A-7F-09   \\Device\\Tcpip_{4F2A}',
    arp: () => 'Interfaz: 192.168.1.20 --- 0x7\n  Dirección de Internet  Dirección física      Tipo\n  192.168.1.254          a4-91-b1-0c-22-10     dinámico\n  192.168.1.31           3c-52-82-44-10-ab     dinámico\n  192.168.1.255          ff-ff-ff-ff-ff-ff     estático',
    ping: (S, a) => { const host = a.filter(x => !x.startsWith('-') && !x.startsWith('/') && !/^\d+$/.test(x))[0]; if (!host) return { e: 'Uso: ping 8.8.8.8' }; const ip = PINGOK[host.toLowerCase()]; if (!ip) return { e: `La solicitud de ping no pudo encontrar el host ${host}. Compruebe el nombre y vuelva a intentarlo.` }; return `Haciendo ping a ${host} [${ip}] con 32 bytes de datos:\n` + [1, 2, 3, 4].map(i => `Respuesta desde ${ip}: bytes=32 tiempo=${14 + i}ms TTL=117`).join('\n') + `\n\nEstadísticas de ping para ${ip}:\n    Paquetes: enviados = 4, recibidos = 4, perdidos = 0 (0% perdidos)`; },
    tracert: (S, a) => `Traza a ${a[0] || '8.8.8.8'} sobre un máximo de 30 saltos\n\n  1     1 ms     1 ms     1 ms  192.168.1.254\n  2     8 ms     7 ms     8 ms  10.180.0.1\n  3    12 ms    11 ms    12 ms  201.154.12.1\n  4    15 ms    14 ms    15 ms  ${PINGOK[(a[0] || '').toLowerCase()] || '8.8.8.8'}\n\nTraza completa.`,
    nslookup: (S, a) => { const n = (a[0] || '').toLowerCase(); if (n.includes('bancomex')) return 'Servidor:  192.168.1.254\nNombre:  bancomex.com\nAddress:  200.57.10.5\n\n(DNS dice 200.57.10.5, pero el archivo hosts de esta PC la manda a 45.13.22.9)'; return n ? `Servidor:  192.168.1.254\nAddress:  192.168.1.254\n\nRespuesta no autoritativa:\nNombre:  ${n}\nAddress:  ${PINGOK[n] || '142.250.72.14'}` : { e: 'Uso: nslookup google.com' }; },
    netstat: S => NETSTAT.split('\n').filter(l => !Object.keys(S.killed).some(pid => l.trim().endsWith(' ' + pid))).join('\n').trim(),
    tasklist: S => 'Nombre de imagen               PID Uso de memoria\n========================= ======== ==============\n' + TASKS.filter(t => !S.killed[t[1]]).map(t => t[0].padEnd(25) + String(t[1]).padStart(9) + ' ' + t[2].padStart(14)).join('\n'),
    taskkill: (S, a) => { const i = a.findIndex(x => x.toLowerCase() === '/pid'); const pid = i >= 0 ? +a[i + 1] : NaN; const t = TASKS.find(x => x[1] === pid); if (!t || S.killed[pid]) return { e: `Error: no se encontró el proceso "${a[i + 1] || ''}".` }; if (pid === 4) return { e: 'Error: acceso denegado. Es un proceso crítico del sistema.' }; S.killed[pid] = 1; return `Correcto: se terminó el proceso con PID ${pid} (${t[0]}).${pid === 4321 ? '\nAntes de matar un proceso sospechoso en un trabajo real: aísla el equipo y guarda evidencia (memoria, hash del archivo).' : ''}`; },
    net: (S, a) => { const s = a.map(x => x.toLowerCase()).join(' '); if (s === 'user') return 'Cuentas de usuario de \\\\PC-ALFONSO\n-------------------------------------------------------------------------------\nAdministrador            alfonso                  Invitado\nsoporte_temp\nSe ha completado el comando correctamente.'; if (s.startsWith('localgroup administradores') || s.startsWith('localgroup administrators')) return 'Nombre de alias     Administradores\n-------------------------------------------------------------------------------\nAdministrador\nalfonso\nsoporte_temp\nSe ha completado el comando correctamente.'; if (s.startsWith('user soporte_temp')) return 'Nombre de usuario          soporte_temp\nCuenta activa              Sí\nÚltima contraseña establecida  03/10/2026\nÚltimo inicio de sesión     12/10/2026 03:12:40\nMiembros del grupo local   *Administradores'; return 'Uso: net user | net user <usuario> | net localgroup administradores'; },
    systeminfo: () => 'Nombre de host:            PC-ALFONSO\nNombre del sistema operativo: Microsoft Windows 11 Pro\nVersión del sistema operativo: 10.0.22631 N/D Compilación 22631\nRevisiones:                3 revisiones instaladas.\nTarjeta(s) de red:         1 Tarjetas de interfaz de red instaladas.',
    findstr: (S, a, inp) => { const fl = a.filter(x => /^\/[a-z]$/i.test(x)).map(x => x.toLowerCase()); const rest = a.filter(x => !/^\/[a-z]$/i.test(x)); const pat = rest[0]; if (pat == null) return { e: 'Uso: findstr "texto" archivo' }; const src = rest[1] ? wread(S, rest[1]) : { t: inp || '' }; if (src.e) return { e: src.e }; const ci = fl.includes('/i'), words = pat.split(' ').filter(Boolean); const res = src.t.replace(/\r/g, '').split('\n').filter(l => words.some(w => ci ? l.toLowerCase().includes(w.toLowerCase()) : l.includes(w))); return (fl.includes('/v') ? src.t.replace(/\r/g, '').split('\n').filter(l => !res.includes(l)) : res).join('\n'); },
    find: (S, a, inp) => { const c = a.some(x => x.toLowerCase() === '/c'); const pat = a.find(x => !x.startsWith('/')); if (!pat) return { e: 'Uso: find "texto" archivo' }; const f = a.filter(x => !x.startsWith('/'))[1]; const src = f ? wread(S, f) : { t: inp || '' }; if (src.e) return { e: src.e }; const res = src.t.replace(/\r/g, '').split('\n').filter(l => l.includes(pat)); return c ? String(res.length) : res.join('\n'); },
    /* ----- PowerShell (cmdlets más usados en soporte y en un SOC) ----- */
    'get-help': () => 'PowerShell en este simulador:\nGet-Process  Stop-Process  Get-Service  Get-NetTCPConnection  Get-NetIPConfiguration  Get-NetIPAddress\nTest-NetConnection  Resolve-DnsName  Get-LocalUser  Get-LocalGroupMember  Get-WinEvent  Get-ScheduledTask\nGet-FileHash  Get-MpComputerStatus  Get-ChildItem  Get-Content  Get-ExecutionPolicy  Clear-Host\nEn tuberías: Select-String  Measure-Object  Select-Object -First N\nEjemplo: Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625} | Measure-Object',
    'get-command': (S, a) => WCMD['get-help'](S, a),
    'clear-host': () => ({ clear: true }),
    'get-executionpolicy': () => 'RemoteSigned',
    'get-mpcomputerstatus': () => 'AMServiceEnabled          : True\nAntivirusEnabled          : True\nRealTimeProtectionEnabled : False\nAntivirusSignatureAge     : 9\nQuickScanAge              : 12\n\n(Ojo: la protección en tiempo real está APAGADA y las firmas tienen 9 días. Un malware suele hacer justo eso.)',
    'get-process': (S, a) => {
      const ni = a.findIndex(x => /^-name$/i.test(x)), filt = ni >= 0 ? (a[ni + 1] || '').toLowerCase().replace(/\.exe$/, '') : (a[0] && !a[0].startsWith('-') ? a[0].toLowerCase().replace(/\.exe$/, '') : null);
      const rows = TASKS.filter(t => !S.killed[t[1]] && t[1] > 4).filter(t => !filt || globRe(filt).test(t[0].replace(/\.exe$/, '')));
      if (!rows.length) return { e: `Get-Process : No se encuentra ningún proceso con el nombre "${filt}".` };
      return '   Id ProcessName      CPU(s) Path\n   -- -----------      ------ ----\n' + rows.map(t => String(t[1]).padStart(5) + ' ' + t[0].replace(/\.exe$/, '').padEnd(16) + ' ' + (t[0] === 'svch0st.exe' ? '1843.2' : t[0] === 'chrome.exe' ? '312.7' : '12.4').padStart(6) + ' ' + (WPATH[t[0]] || '')).join('\n');
    },
    'stop-process': (S, a) => { const i = a.findIndex(x => /^-id$/i.test(x)); if (i < 0) return { e: 'Uso: Stop-Process -Id 4321' }; const r = WCMD.taskkill(S, ['/pid', a[i + 1]]); return r.e ? { e: 'Stop-Process : ' + r.e } : r.replace(/^Correcto: se terminó/, 'Se detuvo'); },
    'get-service': () => 'Status   Name           DisplayName\n------   ----           -----------\nRunning  WinDefend      Microsoft Defender Antivirus\nRunning  mpssvc         Firewall de Windows Defender\nRunning  TermService    Servicios de Escritorio remoto\nRunning  Spooler        Cola de impresión\nStopped  wuauserv       Windows Update\nRunning  EventLog       Registro de eventos de Windows',
    'get-nettcpconnection': (S, a) => {
      const si = a.findIndex(x => /^-state$/i.test(x)), pi = a.findIndex(x => /^-owningprocess$/i.test(x));
      const st = si >= 0 ? (a[si + 1] || '').toLowerCase() : null, pid = pi >= 0 ? a[pi + 1] : null;
      const rows = NETSTAT.trim().split('\n').slice(3).map(l => l.trim().split(/\s+/)).filter(c => c.length === 5 && !S.killed[c[4]])
        .map(c => ({ la: c[1].split(':')[0], lp: c[1].split(':')[1], ra: c[2].split(':')[0], rp: c[2].split(':')[1], s: c[3] === 'LISTENING' ? 'Listen' : 'Established', pid: c[4] }))
        .filter(r => (!st || r.s.toLowerCase() === st) && (!pid || r.pid === pid));
      return 'LocalAddress   LocalPort RemoteAddress    RemotePort State       OwningProcess\n------------   --------- -------------    ---------- -----       -------------\n' + rows.map(r => r.la.padEnd(15) + r.lp.padStart(9) + ' ' + r.ra.padEnd(16) + r.rp.padStart(10) + ' ' + r.s.padEnd(11) + ' ' + r.pid.padStart(13)).join('\n');
    },
    'get-netipconfiguration': () => 'InterfaceAlias       : Ethernet\nInterfaceDescription : Intel(R) Ethernet Connection\nIPv4Address          : 192.168.1.20\nIPv4DefaultGateway   : 192.168.1.254\nDNSServer            : 192.168.1.254\n                       8.8.8.8',
    'get-netipaddress': () => 'IPAddress     InterfaceAlias  PrefixLength PrefixOrigin\n---------     --------------  ------------ ------------\n192.168.1.20  Ethernet                  24 Dhcp\n127.0.0.1     Loopback                   8 WellKnown',
    'test-netconnection': (S, a) => {
      const pi = a.findIndex(x => /^-port$/i.test(x)), port = pi >= 0 ? a[pi + 1] : null;
      const host = (a.filter((x, i) => !x.startsWith('-') && i !== pi + 1)[0] || '8.8.8.8').toLowerCase(), ip = PINGOK[host] || (/^\d+\.\d+\.\d+\.\d+$/.test(host) ? host : null);
      if (!ip) return { e: `ADVERTENCIA: No se pudo resolver el nombre: ${host}` };
      return `ComputerName     : ${host}\nRemoteAddress    : ${ip}\n` + (port ? `RemotePort       : ${port}\nInterfaceAlias   : Ethernet\nSourceAddress    : 192.168.1.20\nTcpTestSucceeded : ${['80', '443', '53'].includes(port) ? 'True' : 'False'}` : `InterfaceAlias   : Ethernet\nSourceAddress    : 192.168.1.20\nPingSucceeded    : True\nPingReplyDetails (RTT) : 15 ms`);
    },
    'resolve-dnsname': (S, a) => { const n = (a.find(x => !x.startsWith('-')) || '').toLowerCase(); if (!n) return { e: 'Uso: Resolve-DnsName google.com' }; const ip = n.includes('bancomex') ? '200.57.10.5' : PINGOK[n] || '142.250.72.14'; return `Name             Type   TTL   Section    IPAddress\n----             ----   ---   -------    ---------\n${n.padEnd(16)} A      300   Answer     ${ip}`; },
    'get-localuser': () => 'Name          Enabled Description\n----          ------- -----------\nAdministrador True    Cuenta integrada para administrar el equipo\nalfonso       True\nInvitado      False   Cuenta integrada para acceso de invitados\nsoporte_temp  True    Soporte temporal',
    'get-localgroupmember': (S, a) => { const g = (a.find(x => !x.startsWith('-')) || '').toLowerCase(); if (!/^administ/.test(g)) return { e: 'Uso: Get-LocalGroupMember Administradores' }; return 'ObjectClass Name                       PrincipalSource\n----------- ----                       ---------------\nUsuario     PC-ALFONSO\\Administrador   Local\nUsuario     PC-ALFONSO\\alfonso         Local\nUsuario     PC-ALFONSO\\soporte_temp    Local'; },
    'get-winevent': (S, a) => {
      const s = a.join(' '); if (!/security|seguridad/i.test(s)) return { e: 'Simulador: solo está el registro Security. Ejemplo: Get-WinEvent -LogName Security -MaxEvents 10' };
      const im = s.match(/Id\s*=\s*([\d,\s]+)/i), mm = s.match(/-MaxEvents\s+(\d+)/i);
      const ids = im ? im[1].split(',').map(x => +x.trim()).filter(Boolean) : null;
      let rows = WEVENTS.filter(e => !ids || ids.includes(e[1])); if (mm) rows = rows.slice(0, +mm[1]);
      if (!rows.length) return { e: 'Get-WinEvent : No se encontraron eventos que coincidan con los criterios.' };
      return 'TimeCreated            Id Message\n-----------            -- -------\n' + rows.map(e => `${e[0]} ${String(e[1]).padStart(5)} ${e[2]}`).join('\n');
    },
    'get-eventlog': (S, a) => { const i = a.findIndex(x => /^-instanceid$/i.test(x)); return WCMD['get-winevent'](S, ['-LogName', 'Security'].concat(i >= 0 ? ['Id=' + a[i + 1]] : [])); },
    'get-scheduledtask': () => 'TaskName                   State   Ejecuta (simulador)\n--------                   -----   -------------------\nMicrosoftEdgeUpdateCore    Ready   C:\\Program Files (x86)\\Microsoft\\EdgeUpdate\\MicrosoftEdgeUpdate.exe\nOneDrive Standalone Update Ready   C:\\Users\\alfonso\\AppData\\Local\\Microsoft\\OneDrive\\OneDriveStandaloneUpdater.exe\nWindowsUpdateHelper        Ready   C:\\Users\\alfonso\\AppData\\Roaming\\svch0st.exe\n\n(En Windows real la ruta se ve con (Get-ScheduledTask -TaskName X).Actions)',
    'get-filehash': (S, a) => { const p = a.filter(x => !x.startsWith('-') && !/^(sha256|md5|sha1)$/i.test(x)).join(' '); if (!p) return { e: 'Uso: Get-FileHash .\\archivo.exe' }; const full = /svch0st/i.test(p) ? WPATH['svch0st.exe'] : wFile(wres(S, p)); if (!full) return { e: `Get-FileHash : No se encuentra la ruta '${p}' porque no existe.` }; return `Algorithm Hash${' '.repeat(60)} Path\n--------- ----${' '.repeat(60)} ----\nSHA256    ${FAKEHASH(full).toUpperCase()} ${full}`; },
    'get-childitem': (S, a) => WCMD.dir(S, a.filter(x => !/^-(force|recurse)$/i.test(x))),
    'get-content': (S, a, inp) => WCMD.type(S, a, inp),
    'select-string': (S, a, inp) => { const pat = a.find(x => !x.startsWith('-')); if (!pat) return { e: 'Uso: ... | Select-String "texto"' }; return (inp || '').split('\n').filter(l => l.toLowerCase().includes(pat.toLowerCase())).join('\n'); },
    'measure-object': (S, a, inp) => { const L = (inp || '').split('\n').filter(l => l.trim()); const data = L.length > 1 && /^[-\s]+$/.test(L[1]) ? L.length - 2 : L.length; return `Count    : ${data}`; },
    'select-object': (S, a, inp) => { const i = a.findIndex(x => /^-first$/i.test(x)); const n = i >= 0 ? +a[i + 1] : 10; const L = (inp || '').split('\n'); const head = L.length > 1 && /^[-\s]+$/.test(L[1]) ? 2 : 0; return L.slice(0, head + n).join('\n'); },
    sfc: () => 'Simulador: sfc /scannow revisa y repara archivos de sistema de Windows. Requiere CMD como administrador y tarda varios minutos.',
    shutdown: () => ({ e: 'Simulador: no apaguemos nada. shutdown /r /t 0 reinicia, shutdown /s /t 0 apaga.' }),
    clear: () => ({ e: "En CMD se usa 'cls' para limpiar la pantalla." }),
    ls: () => ({ e: "'ls' no existe en CMD: usa 'dir'. (En PowerShell real sí funciona como alias de Get-ChildItem.)" }),
    cat: () => ({ e: "'cat' no existe en CMD: usa 'type' o, en PowerShell, Get-Content." }),
    grep: () => ({ e: "'grep' no se reconoce... En CMD usa 'findstr'." }),
    ifconfig: () => ({ e: "'ifconfig' no se reconoce... En Windows es 'ipconfig'." })
  };

  /* ---------- ejecución ---------- */
  const WALIAS = { gps: 'get-process', gci: 'get-childitem', gc: 'get-content', sls: 'select-string', measure: 'measure-object', select: 'select-object', spps: 'stop-process', gsv: 'get-service' };
  function run(S, line, manFn) {
    line = line.trim(); if (!line) return { out: '' };
    S.hist.push(line);
    const table = S.os === 'linux' ? LCMD : WCMD;
    let input = null;
    for (const part of splitPipes(line)) {
      const tk = tokenize(part); if (!tk.length) continue;
      let name = S.os === 'linux' ? tk[0] : tk[0].toLowerCase(); const args = tk.slice(1);
      if (S.os !== 'linux' && WALIAS[name]) name = WALIAS[name];
      if ((name === 'man' || ((name === 'help' || name === 'get-help') && args.length)) && manFn) { return { out: manFn(S.os, (args[0] || '').toLowerCase()) }; }
      const fn = table[name];
      if (!fn) return { err: S.os === 'linux' ? `${tk[0]}: orden no encontrada. Escribe help para ver los comandos.` : `'${tk[0]}' no se reconoce como un comando interno o externo,\nprograma o archivo por lotes ejecutable. Escribe help.` };
      const r = fn(S, args, input);
      if (r && r.clear) return { clear: true };
      if (r && r.e) return { err: r.e };
      input = r == null ? '' : String(r);
    }
    return { out: input || '' };
  }
  return { create, run, prompt };
})();
if (typeof module !== 'undefined') module.exports = TERM;
