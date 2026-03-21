self.addEventListener('install', () => {
  console.log('SW Installed');
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
