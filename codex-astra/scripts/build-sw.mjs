import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../dist/', import.meta.url);
async function files(dir = '') {
  const entries = await readdir(new URL(dir || '.', root), { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? files(`${dir}${e.name}/`) : [`${dir}${e.name}`]));
  return nested.flat().filter(f => f !== 'sw.js');
}
const assets = await files();
const digest = createHash('sha256');
digest.update(await readFile(new URL(import.meta.url)));
for (const asset of assets) digest.update(await readFile(new URL(asset, root)));
const version = digest.digest('hex').slice(0, 12);
await writeFile(new URL('sw.js', root), `
const PREFIX = 'sudam-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(['./', ...assets.map(a => './' + a)])};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Precached public build files have one representation. Module/font requests
  // carry Origin headers unlike addAll; Vary: Origin must not cause offline misses.
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try { return await fetch(event.request); } catch (error) {
      if (event.request.mode === 'navigate') {
        const shell = await cache.match(new URL('./', self.registration.scope).href, { ignoreVary: true });
        if (shell) return shell;
      }
      throw error;
    }
  }));
});
`);
console.log('Offline cache generated:', assets.length, 'assets; version', version);
