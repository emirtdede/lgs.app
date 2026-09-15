// LGS 2027 Study Tracker Service Worker
const CACHE_NAME = "lgs2027-shell-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
];

// Install: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic navigation, Cache-first for static icons/assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML / App navigation: network-first, with cached fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Fallback to cached root
        const root = await caches.match("/");
        if (root) return root;

        return new Response(
          `<!DOCTYPE html>
          <html lang="tr">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Çevrimdışı - LGS 2027</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
              .card { background: #1e293b; padding: 32px; border-radius: 20px; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
              h1 { font-size: 20px; margin-bottom: 12px; color: #60a5fa; }
              p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
              button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>İnternet Bağlantısı Yok</h1>
              <p>LGS 2027 çevrimdışı modda çalışabilir. İnternet bağlantınız sağlandığında verileriniz otomatik eşitlenecektir.</p>
              <button onclick="window.location.reload()">Tekrar Dene</button>
            </div>
          </body>
          </html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      })
    );
  }
});

// Notification Click: Focus existing client window or open URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/today";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
