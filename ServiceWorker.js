// 《집에 가기 전에》 — WebBuilder.WriteServiceWorker가 만든 파일 (빌드할 때마다 새로 씀)
const cacheName = "beforehome-0.4.0-20261113091648";
const contentToCache = ["Build/Web.data.unityweb", "Build/Web.framework.js.unityweb", "Build/Web.loader.js", "Build/Web.wasm.unityweb", "TemplateData/style.css"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(cacheName).then(function (c) { return c.addAll(contentToCache); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== cacheName; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // 접속 서버(Relay 등)는 건드리지 않음
  const page = e.request.mode === 'navigate' || /\.(html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (page) {
    // 첫 페이지: 인터넷 먼저 (새 버전을 바로 받게), 안 되면 저장분
    e.respondWith(fetch(e.request).then(function (r) {
      const copy = r.clone(); caches.open(cacheName).then(function (c) { c.put(e.request, copy); }); return r;
    }).catch(function () { return caches.open(cacheName).then(function (c) { return c.match(e.request); }); }));
    return;
  }
  // 게임 파일: 이번 버전 저장분 먼저, 없으면 받아서 저장
  e.respondWith(caches.open(cacheName).then(function (c) {
    return c.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; });
    });
  }));
});
