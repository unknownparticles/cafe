import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

/** 清单与版本均来自构建内容，确保重新部署时不会复用旧配方缓存。 */
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : `${directory}/${entry.name}`));
  return nested.flat();
}
const files = (await walk('dist')).filter(file => !file.endsWith('/sw.js')).sort();
const hash = createHash('sha256');
for (const file of files) { hash.update(file); hash.update(await readFile(file)); }
const version = hash.digest('hex').slice(0, 16);
const assets = files.map(file => file.slice(5));
const worker = `// Generated from build content. Do not edit the output.
const VERSION = '${version}';
const CORE = 'ritual-core-' + VERSION;
const IMAGES = 'ritual-images-' + VERSION;
const BASE = new URL('./', self.location).pathname;
const ASSETS = ${JSON.stringify(assets)};
const IMAGE_LIMIT = 64;
const isImage = path => path.startsWith('assets/cards/');

self.addEventListener('install', event => {
  // No skipWaiting: an old page keeps its matching worker until all old tabs close.
  // Four tiny original SVG illustrations are core offline content, not remote photos.
  event.waitUntil(caches.open(CORE).then(cache => cache.addAll(ASSETS.map(path => BASE + path))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Activation occurs after previous controlled clients close, so old versions are now unused.
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ritual-') && key !== CORE && key !== IMAGES).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const path = url.pathname.slice(BASE.length);
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CORE);
      try {
        const response = await fetch(request);
        if (response.ok) {
          const text = await response.clone().text();
          // A newer HTML may reference assets absent from this worker; retain the matching shell.
          const shellAssets = ASSETS.filter(asset => asset.endsWith('.js') || asset.endsWith('.css'));
          if (shellAssets.every(asset => text.includes(asset))) return response;
        }
      } catch {}
      return await cache.match(BASE + 'index.html') || await cache.match(BASE + 'offline.html');
    })());
    return;
  }
  if (!ASSETS.includes(path)) return;
  event.respondWith((async () => {
    const core = await caches.open(CORE);
    const bundled = await core.match(BASE + path);
    if (bundled) return bundled;
    const cache = await caches.open(isImage(path) ? IMAGES : CORE);
    const cached = await cache.match(BASE + path);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      await cache.put(BASE + path, response.clone());
      if (isImage(path)) {
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - IMAGE_LIMIT)).map(key => cache.delete(key)));
      }
    }
    return response;
  })());
});
`;
await writeFile('dist/sw.js', worker);
console.log(`Service Worker ${version}: ${assets.length} assets; images cached on demand.`);
