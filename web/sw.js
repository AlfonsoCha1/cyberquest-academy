/* Service worker: guarda la app para abrirla rápido y sin Internet.
   Estrategia: responde desde la caché al instante y actualiza en segundo plano
   (la versión nueva aparece la siguiente vez que abras la app). */
const CACHE = 'cyberquest-v4';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon.svg',
  'config.js', 'app.js', 'engine.js', 'term-engine.js', 'netlab-data.js', 'cmds-data.js', 'courses-data.js', 'branches-data.js',
  'scenarios-data.js', 'secplus-a.js', 'secplus-b.js', 'netlab-ui.js', 'terminal-ui.js', 'sql-data.js', 'sql-data2.js', 'sql-ui.js',
  'jobs-data.js', 'jobs-data2.js', 'jobs-ui.js', 'views.js', 'cloud.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('cyberquest-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return; // el API va directo a la red
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: sameOrigin });
    const network = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') return cache.match('index.html');
    return new Response('', { status: 504, statusText: 'Sin conexión' });
  }));
});
