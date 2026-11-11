/* Offline support: the app's own files are cached on first visit. Bump VERSION when you upload new files. */
const VERSION = "v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png",
  "stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open("app-" + VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== "app-" + VERSION && k !== "fonts").map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.origin === location.origin) {                       // own files: cache first, then network
    e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open("app-" + VERSION).then(c => c.put(e.request, copy)); return res;
    })));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {   // fonts: keep a copy for offline use
    e.respondWith(caches.open("fonts").then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => {
      c.put(e.request, res.clone()); return res;
    }))));
  }                                                          // anything else (Lichess, Chess.com): straight to the network
});
