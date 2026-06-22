
const CACHE = "kz-v11";
const ASSETS = [
  "index.html", "cart.html", "track.html",
  "menu-data.js", "script.js", "supabase.js", "cart-script.js", "track-script.js",
  "styles.css", "cart.css", "track.css",
  "manifest.json", "favicon.svg", "logo-kz.png", "icon-192.png", "icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: always prefer fresh files when online (ordering needs the
// network anyway), and fall back to cache only when offline. This guarantees a
// returning visitor never runs stale app code.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
