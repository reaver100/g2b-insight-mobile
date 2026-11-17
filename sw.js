// 최소 서비스워커 — "홈 화면에 추가(PWA 설치)"가 되려면 필요합니다.
// 조회 데이터는 절대 캐시하지 않습니다(/.netlify/functions/ 요청은 항상 네트워크로 직행) —
// 화면 껍데기(HTML/아이콘/매니페스트)만 가볍게 캐시해 오프라인에서도 화면은 뜨게 합니다.
const CACHE = 'g2b-brief-shell-v1';
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // API 호출(조회 데이터)은 절대 캐시하지 않고 항상 네트워크로 — 이 앱의 핵심 원칙(캐시 없음)
  if (url.pathname.startsWith('/.netlify/functions/')) return;
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
