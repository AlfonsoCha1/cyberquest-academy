/* ===== Laboratorio de redes: fichas de equipos y misiones ===== */
const NETINFO = {
  pc: { que: 'Computadora de usuario final. Tiene una tarjeta de red (eth0) con una IP, una máscara y una puerta de enlace.', capa: 'Host: usa todas las capas', empresa: 'Las computadoras de los empleados. En un SOC se les llama endpoints y las vigila el EDR.', seg: 'Es el blanco favorito del phishing: un clic y el atacante ya tiene un pie dentro.' },
  laptop: { que: 'Computadora portátil. Aquí se conecta por Wi-Fi (wlan0) a un Access Point.', capa: 'Host', empresa: 'Equipos que entran y salen de la oficina. Se conectan a redes de casa, cafeterías y aeropuertos.', seg: 'Necesita cifrado de disco (BitLocker) y VPN: se puede perder o robar.' },
  server: { que: 'Equipo que ofrece servicios a otros: páginas web, archivos, correo, bases de datos.', capa: 'Host', empresa: 'Si Internet lo debe ver (un sitio web), se pone en la DMZ. Si es interno (archivos), en la LAN o en una red de servidores.', seg: 'Siempre con IP fija, parches al día y solo los puertos que necesita abiertos.' },
  printer: { que: 'También es un equipo de red con IP propia, aunque se nos olvide.', capa: 'Host', empresa: 'Impresoras, cámaras y relojes checadores son IoT: suelen tener contraseñas por defecto.', seg: 'Cambia credenciales por defecto y aísla los IoT en su propia red o VLAN.' },
  switch: { que: 'Conecta equipos de la MISMA red. Aprende la dirección MAC de quien está en cada puerto y manda cada trama solo al puerto correcto.', capa: 'Capa 2 (enlace de datos)', empresa: 'Está en cada piso o rack (IDF). Los administrables crean VLANs para separar departamentos.', seg: 'Un puerto libre es una puerta abierta: usa port security o 802.1X para que no cualquiera se conecte.' },
  ap: { que: 'Access Point: puente entre el Wi-Fi y la red cableada. Se conecta al switch por su puerto uplink.', capa: 'Capa 2', empresa: 'Hay varios en techos y pasillos. NO es un router: los equipos Wi-Fi quedan en la misma red que el switch.', seg: 'Usa WPA3 (o WPA2 como mínimo) y una red de invitados separada.' },
  router: { que: 'Une redes DISTINTAS. Cada interfaz pertenece a una red diferente y su IP es la puerta de enlace de esa red.', capa: 'Capa 3 (red)', empresa: 'Conecta departamentos, sucursales y la salida a Internet. Su ruta por defecto apunta al proveedor.', seg: 'Hace NAT: muchas IPs privadas salen a Internet con una sola IP pública.' },
  firewall: { que: 'Un router con reglas: decide qué tráfico pasa entre zonas (LAN, DMZ, WAN). Es stateful: recuerda las conexiones y deja regresar sus respuestas.', capa: 'Capa 3 a 7', empresa: 'Separa la red interna de Internet y de la DMZ, donde viven los servidores públicos.', seg: 'Regla de oro: Internet no entra a la LAN y la DMZ no inicia conexiones hacia la LAN.' },
  internet: { que: 'La red de tu proveedor (ISP). Su puerta es 203.0.113.1 y detrás está el servidor 8.8.8.8.', capa: 'Red externa', empresa: 'El enlace que contratas a Telmex, Totalplay, etc. Te dan una o varias IPs públicas.', seg: 'Internet no enruta IPs privadas: para salir necesitas NAT en tu router o firewall.' }
};

/* Formato de equipos: [tipo, id, nombre, x, y, config]; config = { ip, mask, gw } o { ports: {Gi0/0:[ip,mask]}, gw } */
const MISSIONS = [
  {
    id: 'm1', title: 'Dos PCs, un cable', level: 'Principiante', time: '5 min',
    story: 'Tu primer día en soporte. Te piden que dos computadoras de la misma oficina se puedan comunicar.',
    goal: 'Conecta PC-1 con PC-2 y haz que se respondan el ping.',
    devices: [['pc', 'pc1', 'PC-1', 260, 300], ['pc', 'pc2', 'PC-2', 740, 300]],
    checks: [{ from: 'pc1', to: 'pc2', expect: 'ok' }],
    hints: ['Elige la herramienta Cable, toca PC-1 y luego PC-2.', 'Selecciona cada PC y ponle IP de la misma red: 192.168.1.10 y 192.168.1.11, máscara 255.255.255.0.', 'No hace falta puerta de enlace: están en la misma red. Usa Ping, toca PC-1 y luego PC-2.'],
    learn: 'Dos equipos en la misma red se hablan directo. La máscara /24 (255.255.255.0) dice que los tres primeros números (192.168.1) son la red y el último identifica al equipo.',
    real: 'Así se prueba un cable o una tarjeta de red sospechosa: conectas dos equipos directo y haces ping.'
  },
  {
    id: 'm2', title: 'Llega el switch', level: 'Principiante', time: '8 min',
    story: 'Ya son tres personas en la oficina y una PC solo tiene un puerto de red. Compraron un switch.',
    goal: 'Conecta las tres PCs al switch y logra ping entre todas.',
    devices: [['pc', 'pc1', 'PC-1', 200, 150], ['pc', 'pc2', 'PC-2', 200, 450], ['pc', 'pc3', 'PC-3', 800, 300], ['switch', 'sw1', 'Switch-1', 500, 300]],
    checks: [{ from: 'pc1', to: 'pc2', expect: 'ok' }, { from: 'pc1', to: 'pc3', expect: 'ok' }, { from: 'pc2', to: 'pc3', expect: 'ok' }],
    hints: ['Cada PC va con un cable al switch, no entre ellas.', 'El switch no necesita IP: solo reenvía.', 'Usa 192.168.1.10, .11 y .12 con máscara 255.255.255.0.'],
    learn: 'El switch une equipos de la misma red. Trabaja con direcciones MAC (capa 2), por eso no le configuras IP.',
    real: 'En una empresa cada piso tiene su switch en un rack. Cuando "nadie del piso tiene red", lo primero es revisar ese switch.'
  },
  {
    id: 'm3', title: 'Dos departamentos', level: 'Básico', time: '12 min',
    story: 'Ventas usa la red 192.168.10.0/24 y Contabilidad la 192.168.20.0/24. Ventas necesita mandar reportes a Contabilidad.',
    goal: 'Une las dos redes con el router y logra ping de Ventas-1 a Conta-1 (ida y vuelta).',
    devices: [['pc', 'pcv', 'Ventas-1', 120, 150], ['switch', 'sw1', 'Switch-Ventas', 280, 330], ['router', 'r1', 'Router-1', 500, 330], ['switch', 'sw2', 'Switch-Conta', 720, 330], ['pc', 'pcc', 'Conta-1', 880, 150]],
    checks: [{ from: 'pcv', to: 'pcc', expect: 'ok' }, { from: 'pcc', to: 'pcv', expect: 'ok' }],
    hints: ['Cada switch va a una interfaz distinta del router.', 'Al router ponle 192.168.10.1/24 en la interfaz de Ventas y 192.168.20.1/24 en la de Contabilidad.', 'Ventas-1: IP 192.168.10.10 y puerta de enlace 192.168.10.1. Conta-1: IP 192.168.20.10 y puerta de enlace 192.168.20.1.'],
    learn: 'Un equipo solo habla directo con su red. Para llegar a otra red manda el paquete a su puerta de enlace: la IP del router en su propia red.',
    real: 'Separar departamentos en redes distintas limita el daño: si un malware entra a Ventas, no ve directo a Contabilidad.'
  },
  {
    id: 'm4', title: 'Salida a Internet', level: 'Básico', time: '15 min',
    story: 'Una oficina pequeña: una PC fija, una laptop por Wi-Fi y un router hacia el proveedor de Internet.',
    goal: 'Que la PC y la laptop lleguen a Internet (8.8.8.8) y se vean entre ellas.',
    devices: [['pc', 'pc1', 'PC-1', 150, 140], ['laptop', 'lap1', 'Laptop-1', 150, 480], ['ap', 'ap1', 'AP-1', 330, 480], ['switch', 'sw1', 'Switch-1', 420, 300], ['router', 'r1', 'Router-1', 640, 300], ['internet', 'inet', 'Internet', 870, 300]],
    checks: [{ from: 'pc1', to: 'inet', expect: 'ok' }, { from: 'lap1', to: 'inet', expect: 'ok' }, { from: 'pc1', to: 'lap1', expect: 'ok' }],
    hints: ['La laptop va por Wi-Fi al AP; el AP va por su uplink al switch.', 'Red interna 192.168.1.0/24 con el router en 192.168.1.1. La interfaz hacia Internet lleva 203.0.113.2/24.', 'Al router ponle ruta por defecto 203.0.113.1 (el proveedor). El NAT lo hace solo al salir por la IP pública.'],
    learn: 'La ruta por defecto es el "si no sé dónde está, mándalo al proveedor". El NAT cambia tu IP privada por la pública al salir y la regresa al volver.',
    real: 'Es literalmente el módem-router de tu casa: red 192.168.x.x adentro, una IP pública afuera.'
  },
  {
    id: 'm5', title: 'Empresa con DMZ', level: 'Intermedio', time: '20 min',
    story: 'La empresa publica su sitio web. El servidor web debe estar en la DMZ: accesible y aislado de las computadoras de los empleados.',
    goal: 'LAN y DMZ salen a Internet, la LAN llega al servidor web y la impresora, pero el servidor web NO puede llegar a la LAN.',
    devices: [['pc', 'pc1', 'PC-1', 110, 130], ['pc', 'pc2', 'PC-2', 110, 300], ['printer', 'prn1', 'Impresora-1', 110, 470], ['switch', 'sw1', 'Switch-LAN', 300, 300], ['firewall', 'fw1', 'Firewall-1', 540, 300], ['server', 'web1', 'Web-DMZ', 540, 510], ['internet', 'inet', 'Internet', 830, 300]],
    checks: [{ from: 'pc1', to: 'inet', expect: 'ok' }, { from: 'web1', to: 'inet', expect: 'ok' }, { from: 'pc1', to: 'web1', expect: 'ok' }, { from: 'pc2', to: 'prn1', expect: 'ok' }, { from: 'web1', to: 'pc1', expect: 'blocked' }],
    hints: ['Interfaces del firewall: inside va al switch, dmz al servidor, outside a Internet.', 'LAN 192.168.1.0/24 (firewall inside 192.168.1.1), DMZ 172.16.0.0/24 (firewall dmz 172.16.0.1), outside 203.0.113.2/24.', 'Firewall con ruta por defecto 203.0.113.1. Cada equipo con su puerta de enlace: el firewall en su red.'],
    learn: 'La DMZ es una zona intermedia. Si atacan el servidor web, el firewall impide que desde ahí se llegue a la LAN. La prueba de Web-DMZ → PC-1 debe salir BLOQUEADA.',
    real: 'Movimiento lateral: el atacante entra por lo expuesto y luego busca saltar a lo valioso. La segmentación se lo impide.'
  },
  {
    id: 'm6', title: 'Ticket: Contabilidad sin Internet', level: 'Intermedio', time: '15 min', ticket: true,
    story: 'Ticket #4021, lunes 8:05. "Ni Conta-1 ni Conta-2 tienen Internet. El viernes funcionaba." La red ya está armada: alguien movió cosas el fin de semana.',
    goal: 'Encuentra y corrige las fallas hasta que Conta-1 y Conta-2 lleguen a Internet.',
    devices: [
      ['pc', 'pc1', 'Conta-1', 140, 170, { ip: '192.168.30.10', mask: '255.255.255.0', gw: '192.168.30.254' }],
      ['pc', 'pc2', 'Conta-2', 140, 450, { ip: '192.168.30.11', mask: '255.255.255.0', gw: '192.168.30.1' }],
      ['switch', 'sw1', 'Switch-Conta', 360, 310],
      ['router', 'r1', 'Router-1', 600, 310, { ports: { 'Gi0/0': ['192.168.30.1', '255.255.255.0'], 'Gi0/1': ['203.0.113.2', '255.255.255.0'] }, gw: '' }],
      ['internet', 'inet', 'Internet', 850, 310]
    ],
    links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['sw1', 'Fa0/8', 'r1', 'Gi0/0'], ['r1', 'Gi0/1', 'inet', 'isp']],
    checks: [{ from: 'pc1', to: 'inet', expect: 'ok' }, { from: 'pc2', to: 'inet', expect: 'ok' }],
    hints: ['Haz ping desde cada PC y lee la explicación: cada falla te dice qué revisar.', 'Hay tres fallas: un cable, una puerta de enlace y una ruta.', 'Conta-1 apunta a .254 pero el router es .1; Conta-2 no tiene cable; al router le falta la ruta por defecto 203.0.113.1.'],
    learn: 'Para diagnosticar se va de abajo hacia arriba: cable (capa 1), IP y gateway del equipo, y después las rutas del router.',
    real: 'Este es un ticket real de todos los días. Se resuelve con método, no adivinando: ping al gateway, ping a 8.8.8.8, revisar cable.'
  },
  {
    id: 'm7', title: 'Ticket: Recepción a medias', level: 'Intermedio', time: '15 min', ticket: true,
    story: 'Ticket #4107, martes 9:40. "En Recepción una PC dice conflicto de IP, nadie puede imprimir y la laptop del gerente tiene Wi-Fi pero no carga nada." Nadie tocó el router.',
    goal: 'Que Recepción-1, Recepción-2 y la laptop impriman y salgan a Internet.',
    devices: [
      ['pc', 'rec1', 'Recepción-1', 140, 130, { ip: '192.168.1.20', mask: '255.255.255.0', gw: '192.168.1.1' }],
      ['pc', 'rec2', 'Recepción-2', 140, 310, { ip: '192.168.1.20', mask: '255.255.255.0', gw: '192.168.1.1' }],
      ['printer', 'prn1', 'Impresora-1', 140, 490, { ip: '192.168.2.50', mask: '255.255.255.0', gw: '192.168.1.1' }],
      ['switch', 'sw1', 'Switch-1', 400, 310],
      ['ap', 'ap1', 'AP-Gerencia', 420, 500],
      ['laptop', 'lap1', 'Laptop-Gerente', 680, 500, { ip: '192.168.1.40', mask: '255.255.255.0', gw: '192.168.1.1' }],
      ['router', 'r1', 'Router-1', 660, 310, { ports: { 'Gi0/0': ['192.168.1.1', '255.255.255.0'], 'Gi0/1': ['203.0.113.2', '255.255.255.0'] }, gw: '203.0.113.1' }],
      ['internet', 'inet', 'Internet', 880, 310]
    ],
    links: [['rec1', 'eth0', 'sw1', 'Fa0/1'], ['rec2', 'eth0', 'sw1', 'Fa0/2'], ['prn1', 'eth0', 'sw1', 'Fa0/3'], ['lap1', 'wlan0', 'ap1', 'wifi1'], ['sw1', 'Fa0/8', 'r1', 'Gi0/0'], ['r1', 'Gi0/1', 'inet', 'isp']],
    checks: [{ from: 'rec1', to: 'rec2', expect: 'ok' }, { from: 'rec1', to: 'prn1', expect: 'ok' }, { from: 'rec2', to: 'inet', expect: 'ok' }, { from: 'lap1', to: 'prn1', expect: 'ok' }, { from: 'lap1', to: 'inet', expect: 'ok' }],
    hints: ['Haz ping de Recepción-1 a Recepción-2 y lee el error: te dice exactamente qué pasa.', 'Revisa la IP de la impresora: ¿está en la red 192.168.1.x como todos los demás?', 'La laptop sí está conectada al AP por Wi-Fi, pero ¿el AP tiene cable hacia el switch?'],
    learn: 'Tres fallas clásicas de oficina: una IP duplicada, un equipo en otra red por un error de dedo y un access point sin cable de subida. Las tres se ven igual para el usuario ("no funciona"), pero el ping y su explicación te dicen cuál es cuál.',
    real: 'Por eso las impresoras llevan IP fija reservada y documentada, y las PCs reciben IP por DHCP: así se evitan los duplicados.'
  },
  {
    id: 'm8', title: 'Ticket: el servidor no contesta', level: 'Avanzado', time: '20 min', ticket: true,
    story: 'Ticket #4150, jueves 17:55. "Ventas no puede abrir la carpeta compartida del servidor de archivos. Ayer movieron el rack." El servidor está prendido y el router no marca alarmas.',
    goal: 'Que Ventas-1 y Ventas-2 lleguen al servidor de archivos y que el servidor les pueda responder.',
    devices: [
      ['pc', 'v1', 'Ventas-1', 120, 160, { ip: '192.168.10.10', mask: '255.255.255.0', gw: '192.168.10.1' }],
      ['pc', 'v2', 'Ventas-2', 120, 440, { ip: '192.168.10.11', mask: '255.255.255.0', gw: '192.168.1.1' }],
      ['switch', 'sw1', 'Switch-Ventas', 300, 300],
      ['router', 'r1', 'Router-1', 500, 300, { ports: { 'Gi0/0': ['192.168.10.1', '255.255.255.0'], 'Gi0/1': ['192.168.20.1', '255.255.255.0'] }, gw: '' }],
      ['switch', 'sw2', 'Switch-Servidores', 700, 300],
      ['server', 'srv', 'Servidor-Archivos', 880, 300, { ip: '192.168.20.5', mask: '255.255.255.0', gw: '' }]
    ],
    links: [['v1', 'eth0', 'sw1', 'Fa0/1'], ['v2', 'eth0', 'sw1', 'Fa0/2'], ['sw1', 'Fa0/8', 'r1', 'Gi0/2'], ['r1', 'Gi0/1', 'sw2', 'Fa0/8'], ['srv', 'eth0', 'sw2', 'Fa0/1']],
    checks: [{ from: 'v1', to: 'srv', expect: 'ok' }, { from: 'v2', to: 'srv', expect: 'ok' }, { from: 'srv', to: 'v2', expect: 'ok' }],
    hints: ['Haz ping de Ventas-1 a su puerta de enlace (Router-1) y mira la Consola: ¿quién está del otro lado del cable?', 'Revisa en qué interfaz del router quedó conectado el cable del Switch-Ventas después de mover el rack.', 'Cuando la ida ya llegue, fíjate en la respuesta: ¿el servidor sabe a quién mandársela? Revisa también la puerta de enlace de Ventas-2.'],
    learn: 'Un ping es ida y vuelta: el servidor también necesita su puerta de enlace para contestar a otra red. Y un cable en el puerto equivocado del router se comporta igual que uno desconectado.',
    real: 'Después de mover equipos, compara contra la documentación (tabla de direccionamiento): qué cable va en qué puerto. Sin documentación, ese ticket tarda horas.'
  },
  {
    id: 'libre', title: 'Modo libre', level: 'Libre', time: 'Sin límite', free: true,
    story: 'Arma la red que quieras: tu casa, tu escuela o la empresa de tus sueños.',
    goal: 'Agrega equipos, conéctalos, configura y prueba con ping. Revisa la Tabla IP para documentar tu diseño.',
    devices: [], checks: [], hints: ['Empieza por el centro: un switch o un router, y de ahí hacia afuera.'],
    learn: '', real: ''
  }
];

function buildMission(m) {
  const s = { devices: [], links: [] };
  for (const [type, id, name, x, y, cfg] of m.devices) {
    const d = NET.makeDevice(type, id, name, x, y);
    d.locked = true;
    if (cfg) {
      if (cfg.ip !== undefined) { d.ports[0].ip = cfg.ip; d.ports[0].mask = cfg.mask || ''; }
      if (cfg.ports) for (const [pn, [ip, mask]] of Object.entries(cfg.ports)) { const p = d.ports.find(q => q.name === pn); if (p) { p.ip = ip; p.mask = mask; } }
      if (cfg.gw !== undefined) d.gw = cfg.gw;
    }
    s.devices.push(d);
  }
  (m.links || []).forEach(([a, pa, b, pb], i) => s.links.push({ id: 'L' + i, a: { dev: a, port: pa }, b: { dev: b, port: pb } }));
  return s;
}
if (typeof module !== 'undefined') module.exports = { NETINFO, MISSIONS, buildMission };
