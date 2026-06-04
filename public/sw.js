const CACHE_NAME = "jee-simulator-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/public/manifest.json",
  "/assets/logo-512.png"
];

// Install Service Worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching primary assets for offline usage...");
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("Some assets could not be cached on install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing outdated cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch events
self.addEventListener("fetch", (e) => {
  // Do not intercept recommendations api requests (must be live or failback)
  if (e.request.url.includes("/api/recommendations")) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Cache new static files
        if (
          networkResponse.status === 200 &&
          (e.request.url.startsWith(self.location.origin) || e.request.url.includes("fonts.googleapis.com"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // fallback for index html on navigation requests
        if (e.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
