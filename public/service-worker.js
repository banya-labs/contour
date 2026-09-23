const VERSION = "contour-offline-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SHELL_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
  "/brand/contour-mark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/app/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline.html"))),
    );
    return;
  }

  if (["script", "style", "font", "image"].includes(request.destination)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      void caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
      return response;
    })));
  }
});
