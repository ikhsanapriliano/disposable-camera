const CACHE_NAME = "disposable-camera-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (
    request.url.includes("/_next/") ||
    request.url.includes("/api/") ||
    request.url.includes("supabase.co")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              const clone = response.clone();
              cache.put(request, clone);
              return response;
            })
        )
      )
    );
  }
});