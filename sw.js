// Caches the app shell so the diary opens offline. Nutrition lookups still need a connection.
const CACHE = "fuellog-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Never cache API calls; always go to the network for fresh nutrition data
  if (url.hostname.includes("openfoodfacts") || url.hostname.includes("nal.usda.gov")) return;
  if (e.request.method !== "GET") return;
  // Network first, falling back to cache
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname === "unpkg.com")) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
