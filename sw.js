const CACHE_NAME = 'treino-kayque-v1';

const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/data.js',
  './js/storage.js',
  './js/utils.js',
  './js/timer.js',
  './js/dashboard.js',
  './js/progression.js',
  './js/swipe.js',
  './js/ui.js',
  './js/workouts.js',
  './js/app.js',
  './js/events.js',
  './js/pwa.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/gifs/supino-maquina.gif',
  './assets/gifs/supino-leve.gif',
  './assets/gifs/stiff.gif',
  './assets/gifs/step-up.gif',
  './assets/gifs/step-up-leve.gif',
  './assets/gifs/rotacao-toracica.gif',
  './assets/gifs/respiracao-diafragmatica.gif',
  './assets/gifs/remada.gif',
  './assets/gifs/quadriceps.gif',
  './assets/gifs/puxador-frente.gif',
  './assets/gifs/prancha.gif',
  './assets/gifs/ponte-de-gluteo.gif',
  './assets/gifs/panturrilha.gif',
  './assets/gifs/mobilidade-de-quadril.gif',
  './assets/gifs/leg-press-unilateral.gif',
  './assets/gifs/isometria-de-adutor.gif',
  './assets/gifs/isometria-adutor.gif',
  './assets/gifs/extensora.gif',
  './assets/gifs/extensora-unilateral.gif',
  './assets/gifs/extensao-de-joelho-sentado.gif',
  './assets/gifs/elevacoes-de-joelho.gif',
  './assets/gifs/desenvolvimento-maquina.gif',
  './assets/gifs/dead-bug.gif',
  './assets/gifs/clamshell.gif',
  './assets/gifs/cat-camel.gif',
  './assets/gifs/caminhada-ou-bike.gif',
  './assets/gifs/bird-dog.gif',
  './assets/gifs/alongamento-flexor-quadril.gif',
  './assets/gifs/agachamentos-leves.gif',
  './assets/gifs/afundo.gif',
  './assets/gifs/afundo-leve.gif',
  './assets/gifs/adutores.gif',
  './assets/gifs/adutora.gif',
  './assets/gifs/aberturas-de-perna.gif',
  './assets/gifs/abdutora.gif'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if(request.method !== 'GET' || url.origin !== self.location.origin){
    return;
  }

  if(request.mode === 'navigate'){
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if(cachedResponse){
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        if(networkResponse.ok){
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return networkResponse;
      });
    })
  );
});
