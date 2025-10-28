self.addEventListener('install', (_event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (_event) => {
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
