const CACHE_NAME = "vectra-pwa-v2";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./maskable_icon_x48.png",
  "./maskable_icon_x72.png",
  "./maskable_icon_x96.png",
  "./maskable_icon_x128.png",
  "./maskable_icon_x192.png",
  "./maskable_icon_x384.png",
  "./maskable_icon_x512.png",
  "./favicon.png",
  "https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.min.js"
];

// Install: precache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache files individually so a single network glitch won't break all caching
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { mode: url.startsWith("http") ? "cors" : "same-origin" });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn(`[Vectra PWA] Failed to precache ${url}:`, err);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: offline-first with network fallback & dynamic caching
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // HTML navigation requests: Network-First with offline cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (_) {
          // Network failed, serve cached index.html
        }
        const cached = await caches.match("./index.html");
        return cached || Response.error();
      })()
    );
    return;
  }

  // Static assets & CDN libraries: Cache-First with Network fallback & cache update
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Fetch in background to update cache if online
        fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque")) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse);
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque")) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (cachedResponse) {
          return cachedResponse;
        }
        throw err;
      }
    })()
  );
});
