const CACHE_NAME = 'oualdeco-v2';

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Installation
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(FILES_TO_CACHE);
            })
    );

    // Active immédiatement le nouveau service worker
    self.skipWaiting();
});

// Activation
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(cacheName) {
                        return cacheName !== CACHE_NAME;
                    })
                    .map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Gestion des requêtes
self.addEventListener('fetch', function(event) {

    // Les requêtes API doivent TOUJOURS passer par le réseau
    if (event.request.url.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request)
        );
        return;
    }

    // Pour les fichiers de l'application :
    // réseau d'abord, puis cache si hors connexion
    event.respondWith(
        fetch(event.request)
            .then(function(response) {

                // On ne met en cache que les réponses valides
                if (
                    response &&
                    response.status === 200 &&
                    response.type === 'basic'
                ) {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }

                return response;
            })
            .catch(function() {
                return caches.match(event.request);
            })
    );
});
