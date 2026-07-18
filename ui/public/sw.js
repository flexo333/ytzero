self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// A fetch handler is required for the browser to treat this as an installable
// PWA (Android Chrome will not offer "Install app" without one). This one is a
// no-op: the browser handles every request normally, so behaviour is unchanged.
self.addEventListener("fetch", () => {});
