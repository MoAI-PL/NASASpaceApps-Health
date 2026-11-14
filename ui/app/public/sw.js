// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Offline-first service worker: a crew far from Earth has no reliable network. On install it
// stores the page and every file the page loads (read from index.html); afterwards every
// request is answered from the device first and refreshed in the background when a network
// is there. All health data is bundled into the app, so nothing is ever sent anywhere.

const CACHE = "baseline-v2";

// ===== Install: store the app shell and its hashed assets =====
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const index = await fetch("./index.html", { cache: "no-cache" });
    const html = await index.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map((m) => m[1]);
    await cache.put("./index.html", index);
    await cache.addAll(["./", "./manifest.webmanifest", "./icon.svg", ...assets]);
    await self.skipWaiting();
  })());
});

// ===== Activate: drop caches from older versions =====
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// ===== Fetch: device first, network refresh in the background (same origin, GET only) =====
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = request.mode === "navigate" ? "./index.html" : request.url;
    const cached = await cache.match(key, { ignoreVary: true }); // module scripts are CORS requests
    const refresh = fetch(request).then((response) => {
      if (response.ok) cache.put(key, response.clone());
      return response;
    }).catch(() => null);
    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }
    return (await refresh) ?? Response.error();
  })());
});
