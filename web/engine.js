/* ===== Arma la Red — motor de red (lógica pura, se prueba con Node) ===== */
const NET = (() => {
  const KIND = { pc: 'host', laptop: 'host', server: 'host', printer: 'host', switch: 'l2', ap: 'l2', router: 'router', firewall: 'firewall', internet: 'internet' };
  const LABEL = { pc: 'PC', laptop: 'Laptop', server: 'Servidor', printer: 'Impresora', switch: 'Switch', ap: 'Access Point', router: 'Router', firewall: 'Firewall', internet: 'Internet' };
  const PORTS = {
    pc: ['eth0'], laptop: ['wlan0'], server: ['eth0'], printer: ['eth0'],
    switch: ['Fa0/1', 'Fa0/2', 'Fa0/3', 'Fa0/4', 'Fa0/5', 'Fa0/6', 'Fa0/7', 'Fa0/8'],
    ap: ['uplink', 'wifi1', 'wifi2', 'wifi3', 'wifi4'],
    router: ['Gi0/0', 'Gi0/1', 'Gi0/2', 'Gi0/3'],
    firewall: ['inside', 'dmz', 'outside'],
    internet: ['isp']
  };
  const ZONE = { inside: 'LAN', dmz: 'DMZ', outside: 'WAN' };
  // Política fija del firewall: zona origen -> zonas destino permitidas (conexiones nuevas)
  const POLICY = { SELF: { LAN: 1, DMZ: 1, WAN: 1 }, LAN: { LAN: 1, DMZ: 1, WAN: 1 }, DMZ: { DMZ: 1, WAN: 1 }, WAN: { WAN: 1 } };
  const INET_IP = '203.0.113.1', INET_MASK = '255.255.255.0';

  /* ---------- direcciones ---------- */
  function ipToInt(s) {
    if (typeof s !== 'string') return null;
    const p = s.trim().split('.');
    if (p.length !== 4) return null;
    let n = 0;
    for (const x of p) {
      if (!/^\d{1,3}$/.test(x)) return null;
      const v = +x; if (v > 255) return null;
      n = n * 256 + v;
    }
    return n >>> 0;
  }
  const intToIp = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  function parseMask(s) {
    if (typeof s !== 'string') return null;
    const t = s.trim().replace(/^\//, '');
    let bits;
    if (/^\d{1,2}$/.test(t)) { bits = +t; if (bits > 32) return null; }
    else {
      const n = ipToInt(t); if (n === null) return null;
      bits = 0; let zero = false;
      for (let i = 31; i >= 0; i--) {
        if ((n >>> i) & 1) { if (zero) return null; bits++; } else zero = true;
      }
    }
    return { bits, int: bits === 0 ? 0 : ((0xFFFFFFFF << (32 - bits)) >>> 0) };
  }
  function netStr(ip, mask) {
    const i = ipToInt(ip), m = parseMask(mask);
    if (i === null || !m) return '?';
    return intToIp((i & m.int) >>> 0) + '/' + m.bits;
  }
  function sameNet(a, b, mask) {
    const x = ipToInt(a), y = ipToInt(b), m = parseMask(mask);
    if (x === null || y === null || !m) return false;
    return ((x & m.int) >>> 0) === ((y & m.int) >>> 0);
  }
  function isPrivate(ip) {
    const n = ipToInt(ip); if (n === null) return false;
    return (n >>> 24) === 10 || (n >>> 20) === 0xAC1 || (n >>> 16) === 0xC0A8;
  }
  function hostCheck(ip, mask) {
    if (!ip || !String(ip).trim()) return { ok: false, msg: 'Falta la IP.' };
    const n = ipToInt(ip);
    if (n === null) return { ok: false, msg: 'Formato inválido: son 4 números del 0 al 255 separados por puntos.' };
    if (!mask || !String(mask).trim()) return { ok: false, msg: 'Falta la máscara (por ejemplo 255.255.255.0 o /24).' };
    const m = parseMask(mask);
    if (!m) return { ok: false, msg: 'Máscara inválida. Prueba 255.255.255.0 (/24).' };
    if (m.bits < 8) return { ok: false, msg: 'Esa máscara abarca demasiadas direcciones. Para practicar usa /24.' };
    const first = n >>> 24;
    if (first === 127) return { ok: false, msg: '127.x.x.x es loopback: solo apunta al mismo equipo.' };
    if (first === 0 || first >= 224) return { ok: false, msg: 'Esa IP no se puede asignar a un equipo.' };
    if (m.bits <= 30) {
      const net = (n & m.int) >>> 0, bc = (net | (~m.int >>> 0)) >>> 0;
      if (n === net) return { ok: false, msg: `${ip.trim()} es la dirección de RED de ${intToIp(net)}/${m.bits}; no se asigna a equipos.` };
      if (n === bc) return { ok: false, msg: `${ip.trim()} es la dirección de BROADCAST de esa red; no se asigna a equipos.` };
    }
    return { ok: true };
  }
  function gwCheck(ip, mask, gw) {
    if (!gw || !String(gw).trim()) return { ok: true, empty: true };
    if (ipToInt(gw) === null) return { ok: false, msg: 'La puerta de enlace tiene formato inválido.' };
    if (!hostCheck(ip, mask).ok) return { ok: true };
    if (ipToInt(gw) === ipToInt(ip)) return { ok: false, msg: 'La puerta de enlace no puede ser la IP del mismo equipo.' };
    if (!sameNet(ip, gw, mask)) return { ok: false, msg: `${gw.trim()} no está en la red ${netStr(ip, mask)}. La puerta de enlace siempre está en tu misma red.` };
    return { ok: true };
  }

  /* ---------- topología ---------- */
  const dev = (s, id) => s.devices.find(d => d.id === id);
  const portOf = (d, name) => d && d.ports.find(p => p.name === name);
  const linkAt = (s, id, port) => s.links.find(l => (l.a.dev === id && l.a.port === port) || (l.b.dev === id && l.b.port === port));
  const otherEnd = (l, id, port) => (l.a.dev === id && l.a.port === port) ? l.b : l.a;
  const isWifi = name => /^(wlan|wifi)/.test(name);
  const l3Ports = d => KIND[d.type] === 'l2' ? [] : d.ports.filter(p => hostCheck(p.ip, p.mask).ok);
  const INET_TARGET = '8.8.8.8';
  const ownsIp = (d, ip) => l3Ports(d).some(p => ipToInt(p.ip) === ipToInt(ip)) || (d.type === 'internet' && ipToInt(ip) === ipToInt(INET_TARGET));
  const destIp = d => { if (d.type === 'internet') return INET_TARGET; const p = l3Ports(d)[0]; return p ? p.ip.trim() : null; };

  function makeDevice(type, id, name, x, y) {
    const d = { id, type, name, x, y, gw: '', ports: PORTS[type].map(n => ({ name: n, ip: '', mask: '' })) };
    if (type === 'internet') { d.ports[0].ip = INET_IP; d.ports[0].mask = INET_MASK; d.fixed = true; }
    return d;
  }
  const freePorts = (s, d) => d.ports.filter(p => !linkAt(s, d.id, p.name)).map(p => p.name);
  const compatible = (pa, pb) => {
    const wa = isWifi(pa), wb = isWifi(pb);
    if (wa !== wb) return false;
    if (!wa) return true;
    return pa.startsWith('wlan') !== pb.startsWith('wlan');
  };
  function canConnect(s, aId, bId) {
    const A = dev(s, aId), B = dev(s, bId);
    if (!A || !B) return { ok: false, msg: 'Elige dos equipos.' };
    if (A.id === B.id) return { ok: false, msg: 'No puedes conectar un equipo consigo mismo.' };
    if (s.links.some(l => (l.a.dev === A.id && l.b.dev === B.id) || (l.a.dev === B.id && l.b.dev === A.id)))
      return { ok: false, msg: `Ya hay un cable entre ${A.name} y ${B.name}.` };
    const fa = freePorts(s, A), fb = freePorts(s, B);
    if (!fa.length) return { ok: false, msg: `${A.name} ya no tiene puertos libres.` };
    if (!fb.length) return { ok: false, msg: `${B.name} ya no tiene puertos libres.` };
    const optsA = fa.filter(p => fb.some(q => compatible(p, q)));
    const optsB = fb.filter(q => fa.some(p => compatible(p, q)));
    if (!optsA.length) {
      const lap = A.type === 'laptop' ? A : B.type === 'laptop' ? B : null;
      if (lap) return { ok: false, msg: `${lap.name} se conecta por Wi-Fi: conéctala a un Access Point.` };
      if (A.type === 'ap' || B.type === 'ap') return { ok: false, msg: 'Al Access Point le quedan solo puertos Wi-Fi libres, o su puerto uplink ya está ocupado.' };
      return { ok: false, msg: 'Esos puertos no son compatibles.' };
    }
    return { ok: true, optsA, optsB };
  }
  function segment(s, id, port) {
    const res = { linked: false, endpoints: [] };
    const l = linkAt(s, id, port); if (!l) return res;
    res.linked = true;
    const seen = new Set(), q = [{ e: otherEnd(l, id, port), path: [] }];
    while (q.length) {
      const { e, path } = q.shift(); const d = dev(s, e.dev); if (!d) continue;
      if (KIND[d.type] === 'l2') {
        if (seen.has(d.id)) continue; seen.add(d.id);
        const np = path.concat({ id: d.id, name: d.name });
        for (const p of d.ports) {
          if (p.name === e.port) continue;
          const l2 = linkAt(s, d.id, p.name);
          if (l2) q.push({ e: otherEnd(l2, d.id, p.name), path: np });
        }
      } else if (!(d.id === id && e.port === port)) res.endpoints.push({ dev: d.id, port: e.port, via: path });
    }
    return res;
  }
  function dupIps(s) {
    const m = {};
    for (const d of s.devices) for (const p of l3Ports(d)) (m[p.ip.trim()] = m[p.ip.trim()] || []).push(d.name);
    return Object.fromEntries(Object.entries(m).filter(([, v]) => v.length > 1));
  }

  /* ---------- explicaciones de error ---------- */
  const E = {
    generic: t => ({ title: t, why: '', fix: '', real: '' }),
    same: d => ({ title: 'Origen y destino son el mismo equipo', why: `Elegiste ${d.name} dos veces.`, fix: 'Toca primero el equipo que envía y después otro distinto que recibe.', real: 'Hacer ping a tu propia IP (o a 127.0.0.1) solo prueba que tu tarjeta de red funciona.' }),
    l2: d => ({ title: `${d.name} no participa en el ping`, why: `Un ${LABEL[d.type]} trabaja en capa 2: reenvía tramas usando direcciones MAC y aquí no tiene IP.`, fix: 'Elige un PC, laptop, servidor, impresora, router, firewall o Internet.', real: 'Los switches administrables sí tienen una IP de gestión, pero solo sirve para configurarlos.' }),
    noIp: d => ({ title: `${d.name} no tiene IP`, why: 'Para enviar o recibir un ping, el equipo necesita una dirección IP válida.', fix: `Selecciona ${d.name} y escribe su IP y su máscara.`, real: 'Un equipo sin IP, o con 169.254.x.x, está aislado: suele indicar que el DHCP no respondió.' }),
    badIp: (d, msg) => ({ title: `IP mal configurada en ${d.name}`, why: msg, fix: `Selecciona ${d.name} y usa una IP de host válida, por ejemplo 192.168.1.10 con máscara 255.255.255.0.`, real: 'Un error de dedo en la IP o en la máscara es de los tickets más comunes en soporte.' }),
    dupIp: (a, b, ip) => ({ title: `IP duplicada: ${ip}`, why: `${a.name} y ${b.name} tienen la misma IP, así que la red no sabe a cuál entregar.`, fix: 'Cada equipo necesita una IP única dentro de su red. Cambia el último número de uno de los dos.', real: 'Windows avisa "conflicto de direcciones IP". Por eso las empresas usan DHCP y reservan IPs fijas para servidores e impresoras.' }),
    noCable: (d, port) => ({ title: `${d.name} no tiene cable en ${port}`, why: 'Sin conexión física (capa 1) no pasa nada, aunque la IP esté perfecta.', fix: `Con la herramienta Cable, conecta ${d.name} al equipo que le corresponde.`, real: 'Lo primero que revisa soporte: ¿está conectado el cable? ¿prende la luz de enlace del puerto?' }),
    noGateway: (d, dst) => ({ title: `${d.name} no tiene puerta de enlace`, why: `${dst} está en otra red. Un equipo solo habla directo con su propia red; para salir necesita una puerta de enlace: la IP del router en su red.`, fix: `Selecciona ${d.name} y en "Puerta de enlace" pon la IP de la interfaz del router o firewall que está en su misma red.`, real: 'El clásico "veo la impresora pero no tengo Internet" casi siempre es un gateway faltante o incorrecto.' }),
    gwBad: (d, msg) => ({ title: `Puerta de enlace incorrecta en ${d.name}`, why: msg, fix: 'La puerta de enlace debe ser la IP del router en la MISMA red que el equipo.', real: 'En Windows la revisas con ipconfig; en Linux con ip route.' }),
    arp: (s, d, port, ip, seg) => {
      const who = seg.endpoints.map(e => { const x = dev(s, e.dev), p = portOf(x, e.port); return `${x.name} (${p && p.ip ? p.ip : 'sin IP'})`; });
      return { title: `Nadie responde a ${ip}`, why: `${d.name} preguntó por ${port} "¿quién tiene ${ip}?" (ARP) y nadie contestó. ${who.length ? 'En ese segmento solo están: ' + who.join(', ') + '.' : 'Del otro lado del cable no hay ningún equipo con IP.'}`, fix: `Revisa que el equipo con ${ip} esté conectado a este mismo switch o segmento y que su IP esté bien escrita.`, real: 'ARP traduce una IP a una dirección MAC. Con "arp -a" ves a quién conoce tu equipo en su red local.' };
    },
    noRoute: (r, dst) => ({ title: `${r.name} no sabe llegar a ${dst}`, why: 'Un router solo conoce las redes de sus interfaces y las rutas que le configuras. Ninguna interfaz está en esa red y no tiene ruta por defecto.', fix: `Configura en ${r.name} una interfaz en la red de ${dst}, o una ruta por defecto hacia el proveedor de Internet.`, real: 'En equipos Cisco la tabla se ve con "show ip route". Si la red no aparece, el paquete se descarta.' }),
    gwUnreach: r => ({ title: `Ruta por defecto inalcanzable en ${r.name}`, why: `La ruta por defecto apunta a ${r.gw}, pero esa IP no está en la red de ninguna de sus interfaces.`, fix: 'El siguiente salto debe ser una IP vecina, en la misma red que alguna interfaz (por ejemplo la del proveedor: 203.0.113.1).', real: 'El siguiente salto de una ruta siempre tiene que estar directamente conectado.' }),
    blocked: (f, zin, zout) => ({ title: `Bloqueado por ${f.name}`, why: `La política del firewall no permite conexiones nuevas de la zona ${zin} hacia la zona ${zout}.`, fix: zin === 'DMZ' && zout === 'LAN' ? 'Esto es lo correcto: la DMZ nunca debe iniciar conexiones hacia la LAN.' : 'Si este tráfico debiera pasar, haría falta una regla nueva. En este laboratorio la política es fija.', real: 'Si un atacante toma el servidor web de la DMZ, esta regla le impide saltar a las computadoras de la empresa (movimiento lateral).' }),
    inet: pkt => isPrivate(pkt.dst)
      ? { title: 'Internet no enruta IPs privadas', why: `${pkt.dst} es una IP privada (10.x, 172.16–31.x o 192.168.x). Esas direcciones se repiten en millones de redes, así que Internet no sabe a cuál regresar.`, fix: 'Si ese equipo debería estar en tu oficina, revisa su IP: quizá quedó en una red que tu router no conoce y el paquete se fue a Internet. Si estás saliendo a Internet, el router o firewall necesita una IP pública en su interfaz WAN (por ejemplo 203.0.113.2/24) para hacer NAT.', real: 'NAT es lo que permite que toda una oficina salga a Internet con una sola IP pública.' }
      : { title: `Internet no conoce ${pkt.dst}`, why: 'En este laboratorio el proveedor solo conoce la red 203.0.113.0/24 y el servidor 8.8.8.8.', fix: 'Usa una IP de 203.0.113.0/24 (por ejemplo 203.0.113.2) en la interfaz WAN.', real: '203.0.113.0/24 es un rango reservado para documentación y ejemplos.' },
    ttl: () => ({ title: 'Bucle de enrutamiento', why: 'El paquete dio vueltas entre routers hasta que su TTL llegó a cero.', fix: 'Revisa las rutas por defecto: dos routers no deben apuntarse entre sí.', real: 'traceroute (tracert en Windows) muestra cada salto y deja ver estos bucles.' }),
    reply: inner => ({ title: 'La ida llegó, pero la respuesta no regresó', why: `${inner.title}. ${inner.why}`, fix: inner.fix, real: 'Un ping necesita ida y vuelta. Pasa mucho: el servidor recibe tu paquete pero no tiene gateway para responder.' })
  };

  /* ---------- simulación de ping ---------- */
  const step = (ctx, kind, text, path) => ctx.steps.push({ kind, text, path: path || [], back: ctx.reply });
  const fail = err => ({ status: 'fail', err });

  function route(s, startId, pkt, ctx) {
    let cur = dev(s, startId), ingress = null, ttl = 16;
    while (ttl-- > 0) {
      if (ctx.reply) {
        const nat = ctx.nat.find(x => x.dev === cur.id && x.pub === pkt.dst);
        if (nat) {
          step(ctx, 'nat', `${cur.name} recuerda la traducción NAT y cambia el destino ${pkt.dst} → ${nat.orig}.`, [cur.id]);
          pkt.dst = nat.orig; ctx.nat = ctx.nat.filter(x => x !== nat);
        } else if (ownsIp(cur, pkt.dst)) return { status: 'arrived', at: cur };
      } else if (ownsIp(cur, pkt.dst)) return { status: 'arrived', at: cur };

      const k = KIND[cur.type];
      let egress, nextHop;
      if (k === 'host' || k === 'internet') {
        const p = cur.ports[0], hc = hostCheck(p.ip, p.mask);
        if (!hc.ok) return fail(E.badIp(cur, hc.msg));
        if (k === 'internet' && !sameNet(p.ip, pkt.dst, p.mask)) return fail(E.inet(pkt));
        if (sameNet(p.ip, pkt.dst, p.mask)) {
          nextHop = pkt.dst.trim();
          step(ctx, 'info', `${pkt.dst} está en su misma red (${netStr(p.ip, p.mask)}) → ${cur.name} lo envía directo.`, [cur.id]);
        } else {
          if (!cur.gw || !cur.gw.trim()) return fail(E.noGateway(cur, pkt.dst));
          const g = gwCheck(p.ip, p.mask, cur.gw); if (!g.ok) return fail(E.gwBad(cur, g.msg));
          nextHop = cur.gw.trim();
          step(ctx, 'info', `${pkt.dst} está fuera de su red (${netStr(p.ip, p.mask)}) → ${cur.name} lo manda a su puerta de enlace ${nextHop}.`, [cur.id]);
        }
        egress = p;
      } else {
        const ps = l3Ports(cur), conn = ps.find(p => sameNet(p.ip, pkt.dst, p.mask));
        if (conn) {
          egress = conn; nextHop = pkt.dst.trim();
          step(ctx, 'route', `${cur.name} revisa su tabla de rutas: ${netStr(conn.ip, conn.mask)} está conectada en ${conn.name}.`, [cur.id]);
        } else if (cur.gw && cur.gw.trim()) {
          const via = ps.find(p => sameNet(p.ip, cur.gw.trim(), p.mask));
          if (!via) return fail(E.gwUnreach(cur));
          egress = via; nextHop = cur.gw.trim();
          step(ctx, 'route', `${cur.name} no tiene la red de ${pkt.dst}; usa su ruta por defecto → ${nextHop} (sale por ${via.name}).`, [cur.id]);
        } else return fail(E.noRoute(cur, pkt.dst));
        if (k === 'firewall') {
          const zin = ingress ? ZONE[ingress] : 'SELF', zout = ZONE[egress.name];
          if (ctx.reply) step(ctx, 'fw', `${cur.name}: es la respuesta de una conexión que ya conoce (stateful) → la deja pasar.`, [cur.id]);
          else if (POLICY[zin] && POLICY[zin][zout]) step(ctx, 'fw', `${cur.name}: regla ${zin} → ${zout}: PERMITIDO.`, [cur.id]);
          else { step(ctx, 'block', `${cur.name}: regla ${zin} → ${zout}: DENEGADO.`, [cur.id]); return { status: 'blocked', err: E.blocked(cur, zin, zout) }; }
        }
        if (!ctx.reply && isPrivate(pkt.src) && !isPrivate(egress.ip)) {
          ctx.nat.push({ dev: cur.id, pub: egress.ip.trim(), orig: pkt.src });
          step(ctx, 'nat', `NAT: ${cur.name} cambia el origen privado ${pkt.src} por su IP pública ${egress.ip.trim()}.`, [cur.id]);
          pkt.src = egress.ip.trim();
        }
      }
      const seg = segment(s, cur.id, egress.name);
      if (!seg.linked) return fail(E.noCable(cur, egress.name));
      const tgt = seg.endpoints.find(e => { const p = portOf(dev(s, e.dev), e.port); return p && ipToInt(p.ip) !== null && ipToInt(p.ip) === ipToInt(nextHop); });
      if (!tgt) return fail(E.arp(s, cur, egress.name, nextHop, seg));
      const td = dev(s, tgt.dev);
      const viaTxt = tgt.via.length ? `, pasa por ${tgt.via.map(v => v.name).join(' → ')}` : '';
      step(ctx, 'hop', `Sale por ${egress.name}${viaTxt} y llega a ${td.name} (${tgt.port}).`, [cur.id, ...tgt.via.map(v => v.id), td.id]);
      ingress = tgt.port; cur = td;
    }
    return fail(E.ttl());
  }

  function srcIpFor(d, dst) {
    const ps = l3Ports(d); if (!ps.length) return null;
    const c = ps.find(p => sameNet(p.ip, dst, p.mask)); if (c) return c.ip.trim();
    if (d.gw) { const g = ps.find(p => sameNet(p.ip, d.gw, p.mask)); if (g) return g.ip.trim(); }
    return ps[0].ip.trim();
  }

  function ping(s, srcId, dstId) {
    const S = dev(s, srcId), D = dev(s, dstId), steps = [];
    const done = (status, err) => ({ status, err, steps });
    if (!S || !D) return done('fail', E.generic('Elige origen y destino.'));
    if (S.id === D.id) return done('fail', E.same(S));
    if (KIND[S.type] === 'l2') return done('fail', E.l2(S));
    if (KIND[D.type] === 'l2') return done('fail', E.l2(D));
    for (const X of [S, D]) if (KIND[X.type] === 'host') {
      const p = X.ports[0];
      if (!p.ip.trim() && !p.mask.trim()) return done('fail', E.noIp(X));
      const hc = hostCheck(p.ip, p.mask); if (!hc.ok) return done('fail', E.badIp(X, hc.msg));
    }
    const dstIp = destIp(D); if (!dstIp) return done('fail', E.noIp(D));
    const srcIp = srcIpFor(S, dstIp); if (!srcIp) return done('fail', E.noIp(S));
    if (ownsIp(S, dstIp)) return done('fail', E.dupIp(S, D, dstIp));
    const ctx = { steps, nat: [], reply: false };
    step(ctx, 'start', `Ping de ${S.name} (${srcIp}) a ${D.name} (${dstIp}).`, [S.id]);
    const pkt = { src: srcIp, dst: dstIp };
    const r1 = route(s, S.id, pkt, ctx);
    if (r1.status === 'blocked') return done('blocked', r1.err);
    if (r1.status !== 'arrived') return done('fail', r1.err);
    if (r1.at.id !== D.id) return done('fail', E.dupIp(r1.at, D, dstIp));
    step(ctx, 'arrive', `Llegó a ${D.name}. Ahora ${D.name} contesta (echo reply) a ${pkt.src}.`, [D.id]);
    ctx.reply = true;
    const r2 = route(s, D.id, { src: dstIp, dst: pkt.src }, ctx);
    if (r2.status !== 'arrived') return done('fail', E.reply(r2.err || E.generic('Error desconocido')));
    if (r2.at.id !== S.id) return done('fail', E.reply(E.dupIp(r2.at, S, srcIp)));
    step(ctx, 'ok', `La respuesta llegó a ${S.name}. Ping exitoso.`, [S.id]);
    return done('ok', null);
  }

  // expect: 'ok' | 'blocked' (lo frena el firewall) | 'noreach' (cualquier cosa menos ok)
  const passes = (c, r) => c.expect === 'noreach' ? r.status !== 'ok' : r.status === c.expect;
  const runChecks = (s, checks) => checks.map(c => { const r = ping(s, c.from, c.to); return { c, r, pass: passes(c, r) }; });

  return { KIND, LABEL, PORTS, ZONE, POLICY, INET_IP, INET_MASK, INET_TARGET, ipToInt, intToIp, parseMask, netStr, sameNet, isPrivate, hostCheck, gwCheck,
    dev, portOf, linkAt, otherEnd, isWifi, l3Ports, destIp, makeDevice, freePorts, canConnect, segment, dupIps,
    ping, passes, runChecks };
})();
if (typeof module !== 'undefined') module.exports = NET;
