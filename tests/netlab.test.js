// Prueba la lógica del laboratorio: cada misión debe poder resolverse y los tickets deben empezar rotos.
const path = require('node:path').join(__dirname, '..', 'web') + '/';
global.NET = require(path + 'engine.js');
const { MISSIONS, buildMission } = require(path + 'netlab-data.js');
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  FAIL', msg); } };
const M = id => MISSIONS.find(m => m.id === id);
const D = (S, id) => NET.dev(S, id);
const ip = (S, id, v, gw, port) => { const d = D(S, id); const p = port ? d.ports.find(x => x.name === port) : d.ports[0]; const [a, m] = v.split('/'); p.ip = a; p.mask = '/' + m; if (gw !== undefined) d.gw = gw; };
let n = 0;
const link = (S, a, pa, b, pb) => S.links.push({ id: 'T' + (n++), a: { dev: a, port: pa }, b: { dev: b, port: pb } });
const unlink = (S, a, b) => { S.links = S.links.filter(l => !((l.a.dev === a && l.b.dev === b) || (l.a.dev === b && l.b.dev === a))); };
function verify(id, S, label) {
  const r = NET.runChecks(S, M(id).checks);
  r.forEach(x => ok(x.pass, `${id} ${label}: ${x.c.from}->${x.c.to} esperado ${x.c.expect}, salió ${x.r.status} ${x.r.err ? '(' + x.r.err.title + ')' : ''}`));
  return r;
}
const SOL = {
  m1(S) { link(S, 'pc1', 'eth0', 'pc2', 'eth0'); ip(S, 'pc1', '192.168.1.10/24'); ip(S, 'pc2', '192.168.1.11/24'); },
  m2(S) { ['pc1', 'pc2', 'pc3'].forEach((p, i) => { link(S, p, 'eth0', 'sw1', 'Fa0/' + (i + 1)); ip(S, p, '192.168.1.' + (10 + i) + '/24'); }); },
  m3(S) {
    link(S, 'pcv', 'eth0', 'sw1', 'Fa0/1'); link(S, 'sw1', 'Fa0/8', 'r1', 'Gi0/0'); link(S, 'r1', 'Gi0/1', 'sw2', 'Fa0/8'); link(S, 'pcc', 'eth0', 'sw2', 'Fa0/1');
    ip(S, 'r1', '192.168.10.1/24', undefined, 'Gi0/0'); ip(S, 'r1', '192.168.20.1/24', undefined, 'Gi0/1');
    ip(S, 'pcv', '192.168.10.10/24', '192.168.10.1'); ip(S, 'pcc', '192.168.20.10/24', '192.168.20.1');
  },
  m4(S) {
    link(S, 'pc1', 'eth0', 'sw1', 'Fa0/1'); link(S, 'lap1', 'wlan0', 'ap1', 'wifi1'); link(S, 'ap1', 'uplink', 'sw1', 'Fa0/2');
    link(S, 'sw1', 'Fa0/8', 'r1', 'Gi0/0'); link(S, 'r1', 'Gi0/1', 'inet', 'isp');
    ip(S, 'r1', '192.168.1.1/24', '203.0.113.1', 'Gi0/0'); ip(S, 'r1', '203.0.113.2/24', undefined, 'Gi0/1');
    ip(S, 'pc1', '192.168.1.10/24', '192.168.1.1'); ip(S, 'lap1', '192.168.1.11/24', '192.168.1.1');
  },
  m5(S) {
    ['pc1', 'pc2', 'prn1'].forEach((p, i) => link(S, p, 'eth0', 'sw1', 'Fa0/' + (i + 1)));
    link(S, 'sw1', 'Fa0/8', 'fw1', 'inside'); link(S, 'web1', 'eth0', 'fw1', 'dmz'); link(S, 'fw1', 'outside', 'inet', 'isp');
    ip(S, 'fw1', '192.168.1.1/24', '203.0.113.1', 'inside'); ip(S, 'fw1', '172.16.0.1/24', undefined, 'dmz'); ip(S, 'fw1', '203.0.113.2/24', undefined, 'outside');
    ip(S, 'pc1', '192.168.1.10/24', '192.168.1.1'); ip(S, 'pc2', '192.168.1.11/24', '192.168.1.1'); ip(S, 'prn1', '192.168.1.50/24', '192.168.1.1');
    ip(S, 'web1', '172.16.0.10/24', '172.16.0.1');
  },
  m6(S) { link(S, 'pc2', 'eth0', 'sw1', 'Fa0/2'); D(S, 'pc1').gw = '192.168.30.1'; D(S, 'r1').gw = '203.0.113.1'; },
  m7(S) { ip(S, 'rec2', '192.168.1.21/24'); ip(S, 'prn1', '192.168.1.50/24'); link(S, 'ap1', 'uplink', 'sw1', 'Fa0/4'); },
  m8(S) { unlink(S, 'sw1', 'r1'); link(S, 'sw1', 'Fa0/8', 'r1', 'Gi0/0'); D(S, 'v2').gw = '192.168.10.1'; D(S, 'srv').gw = '192.168.20.1'; }
};

for (const m of MISSIONS.filter(m => !m.free)) {
  const S0 = buildMission(m);
  const start = NET.runChecks(S0, m.checks);
  ok(start.some(x => !x.pass), `${m.id}: la misión no debe empezar resuelta`);
  if (m.ticket) console.log(`${m.id} inicio:`, start.map(x => `${x.c.from}->${x.c.to}=${x.r.status}${x.r.err ? ' [' + x.r.err.title + ']' : ''}`).join(' | '));
  const S = buildMission(m); SOL[m.id](S);
  const r = verify(m.id, S, 'solución');
  console.log(`${m.id} ${r.every(x => x.pass) ? 'OK' : 'NO'} (${r.length} pruebas)`);
}

// Casos sueltos del motor
const T = NET;
ok(T.hostCheck('192.168.1.0', '/24').ok === false, 'dirección de red rechazada');
ok(T.hostCheck('192.168.1.255', '255.255.255.0').ok === false, 'broadcast rechazado');
ok(T.hostCheck('192.168.1.10', '255.255.0.255').ok === false, 'máscara no contigua rechazada');
ok(T.hostCheck('10.0.0.5', '/8').ok === true, '/8 válido');
ok(T.gwCheck('192.168.1.10', '/24', '192.168.2.1').ok === false, 'gateway fuera de la red');
// m5: el servidor de la DMZ no debe llegar a la LAN aunque se pruebe directo
{ const S = buildMission(M('m5')); SOL.m5(S);
  const r = T.ping(S, 'web1', 'pc1'); ok(r.status === 'blocked' && /DMZ → LAN/.test(r.steps.map(s => s.text).join(' ')), 'DMZ→LAN bloqueado con regla visible');
  const r2 = T.ping(S, 'inet', 'pc1'); ok(r2.status === 'fail', 'Internet no llega a IP privada de la LAN');
  ok(T.passes({ expect: 'noreach' }, r2), 'noreach pasa cuando no llega');
  const r3 = T.ping(S, 'pc1', 'inet'); ok(r3.steps.some(s => s.kind === 'nat'), 'hay NAT al salir a Internet');
  ok(r3.status === 'ok', 'LAN sale a Internet'); }
// m8: con solo el cable corregido, la ida llega pero la respuesta no (servidor sin gateway)
{ const S = buildMission(M('m8')); unlink(S, 'sw1', 'r1'); link(S, 'sw1', 'Fa0/8', 'r1', 'Gi0/0');
  const r = T.ping(S, 'v1', 'srv'); ok(r.status === 'fail' && /respuesta no regresó/.test(r.err.title), 'm8: falla de regreso por gateway del servidor: ' + (r.err && r.err.title)); }
// m7: ping entre PCs con la misma IP explica el duplicado
{ const S = buildMission(M('m7')); const r = T.ping(S, 'rec1', 'rec2'); ok(/duplicada/.test(r.err.title), 'm7: IP duplicada detectada'); }
// Wi-Fi: laptop no se conecta por cable a un switch
{ const S = buildMission(M('m4')); const c = T.canConnect(S, 'lap1', 'sw1'); ok(!c.ok && /Wi-Fi/.test(c.msg), 'laptop a switch rechazado por Wi-Fi'); }

console.log(fails ? `\n${fails} fallas` : '\nTodo OK');
process.exit(fails ? 1 : 0);
