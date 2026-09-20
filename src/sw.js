// ============================================================
// TaskCanvas — Service Worker
// Cache app shell supaya aplikasi bisa dibuka offline setelah
// di-install ke homescreen.
// Strategi: network-first (versi terbaru saat online, cache
// sebagai cadangan saat offline) supaya perubahan file selalu
// langsung terlihat tanpa perlu menaikkan versi cache.
// ============================================================

const CACHE_NAME = "taskcanvas-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Saat di-install: simpan seluruh app shell ke cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Saat diaktifkan: hapus cache versi lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

// Strategi network-first: ambil dari network dulu (selalu versi
// terbaru), simpan salinannya ke cache, dan gunakan cache hanya
// sebagai cadangan saat offline.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
