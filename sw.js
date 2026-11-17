// 최소 서비스워커 — "홈 화면에 추가(PWA 설치)"가 되려면 필요합니다.
// 조회 데이터는 절대 캐시하지 않습니다(/.netlify/functions/ 요청은 항상 네트워크로 직행) —
// 화면 자체(HTML)는 네트워크 우선(항상 최신 버전을 먼저 시도)으로 바꾸고, 오프라인일 때만
// 캐시된 이전 화면을 보여줍니다 — 그래야 코드를 고쳐 배포할 때마다 폰에 이미 설치된 앱도
// 다음에 열 때 자동으로 최신 화면을 받습니다(이전에는 캐시 우선이라 자동 업데이트가 안 됐음).
// 아이콘·매니페스트처럼 거의 안 바뀌는 파일만 캐시 우선(오프라인 지원용)으로 둡니다.
const CACHE = 'g2b-brief-shell-v2';
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

  const isShellPage = event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isShellPage) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
