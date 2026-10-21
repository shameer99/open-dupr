// Replace the previous Workbox worker at the same URL, including installed PWAs.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("workbox-")).map((key) => caches.delete(key)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: "window" });
    await Promise.allSettled(windows.map((client) => client.navigate(client.url)));
  })());
});
