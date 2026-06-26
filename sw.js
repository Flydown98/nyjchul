const CACHE='nyj-sheets-calendar-v2-configured';
const ASSETS=['./','./index.html','./styles.css','./app.js','./config.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./assets/signature_horizontal_color.png','./assets/symbol_color.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request))));
