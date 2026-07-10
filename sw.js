// EchoVibe Service Worker
self.addEventListener('install', (e) => {
  console.log('EchoVibe Service Worker Installed');
});

self.addEventListener('fetch', (e) => {
  // Keeps the app running smoothly online
  e.respondWith(fetch(e.request));
});
