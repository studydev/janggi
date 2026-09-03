/**
 * 서비스 워커 — 오프라인에서도 로컬 대국이 되도록 앱 셸을 캐시한다.
 * 규칙 엔진은 전부 클라이언트에서 돌기 때문에, 셸만 있으면 네트워크 없이 대국이 가능하다.
 */
const CACHE = 'janggi-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 문서 요청: 네트워크 우선, 실패하면 캐시된 셸로 (SPA 라우팅 대비)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html').then((r) => r ?? Response.error())),
    );
    return;
  }

  // 정적 자산: 캐시 우선, 없으면 받아서 캐시
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
