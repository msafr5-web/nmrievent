/* Service Worker — nmrievent PWA
 * - الملفات الثابتة المجزّأة (_next/static) والصور: Cache First (آمنة لأن أسماءها تتغير مع المحتوى)
 * - صفحات التنقل: Network First مع الرجوع إلى نسخة مخزنة ثم صفحة /offline
 * - لا يُخزَّن أبدًا: /api/* والـ PDF والطلبات غير GET
 */
const VERSION = "v1";
const STATIC = `nmr-static-${VERSION}`;
const PAGES = `nmr-pages-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_PAGES = 30;
const MAX_STATIC = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.endsWith(".pdf") || url.pathname === "/profile") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(request, copy)).then(() => trim(PAGES, MAX_PAGES));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(request, copy)).then(() => trim(STATIC, MAX_STATIC));
            }
            return res;
          }),
      ),
    );
  }
});
