/* Offline support + cross-origin isolation (lets the engine use several CPU cores).
   Bump VERSION when you upload new files. */
const VERSION = "v104";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png",
  "stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm", "stockfish-19-lite.js", "stockfish-19-lite.wasm",
  "stockfish-19.js", "stockfish-19-single.js"];
const KEEP = k => k === "app-" + VERSION || k === "fonts" || k === "engine-full";
self.addEventListener("install", e => {
  e.waitUntil(caches.open("app-" + VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !KEEP(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function isolate(res) {                 // add the two headers that unlock SharedArrayBuffer (multi-core engine)
  if (!res || res.status === 0 || res.type === "opaque") return res;
  const h = new Headers(res.headers);
  h.set("Cross-Origin-Embedder-Policy", "require-corp");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", "same-origin");
  return new Response(res.body, {status: res.status, statusText: res.statusText, headers: h});
}
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.origin === location.origin) {                       // own files: cache first, then network
    e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open("app-" + VERSION).then(c => c.put(e.request, copy)); }
      return res;
    })).then(isolate));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {   // fonts: fetched with CORS so isolation allows them
    e.respondWith(caches.open("fonts").then(c => c.match(e.request.url).then(r => r || fetch(e.request.url, {mode: "cors", credentials: "omit"}).then(res => {
      c.put(e.request.url, res.clone()); return res;
    }))));
  }                                                          // anything else (Lichess, Chess.com, downloads): straight to the network
});
