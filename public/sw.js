// GAZIOAI service worker — small, conservative, no dependencies.
// Static assets: cache-first. Navigations: network-first with cache fallback
// so returning users get instant loads and offline still opens the shell.
const CACHE = "gazioai-v1";
const PRECACHE = ["/manifest.json", "/launchericon-192x192.png", "/launchericon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touch API traffic, streaming responses, or anything with a query.
  if (url.pathname.startsWith("/api/") || url.search) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match("/"))
            .then((cached) => cached ?? Response.error()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const cacheable =
          response.ok &&
          (url.pathname.startsWith("/_next/static/") || PRECACHE.includes(url.pathname));
        if (cacheable) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return response;
      });
    }),
  );
});
