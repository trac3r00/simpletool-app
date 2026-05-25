/**
 * SimpleTool Service Worker
 * Cache strategy:
 * - Static assets (CSS, JS, fonts): cache-first
 * - Tool pages (HTML): network-first with stale-while-revalidate fallback
 * - Never cache: sitemap, robots.txt, ad scripts, analytics
 */

var CACHE_NAME = 'simpletool-v1';

var STATIC_ASSETS = [
  '/styles.css',
  '/favicon.ico',
  '/manifest.json'
];

var NEVER_CACHE = [
  '/sitemap.xml',
  '/robots.txt',
  'pagead2.googlesyndication.com',
  'adsbygoogle',
  'cloudflareinsights.com',
  'googletagmanager.com'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

function shouldNeverCache(url) {
  return NEVER_CACHE.some(function(pattern) {
    return url.indexOf(pattern) !== -1;
  });
}

function isStaticAsset(url) {
  var path = new URL(url).pathname;
  return path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.woff2') ||
         path.endsWith('.ico') || path.endsWith('.png') || path.endsWith('.jpg') ||
         path.startsWith('/vendor/');
}

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  if (event.request.method !== 'GET') return;
  if (shouldNeverCache(url)) return;

  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              return cache.put(event.request, clone);
            }).catch(function() {});
          }
          return response;
        }).catch(function() { return new Response('Service unavailable', { status: 408 }); });
      })
    );
  } else {
    // Network-only for HTML pages — never cache because CSP nonces are per-request
    // Stale nonces from cache would block all inline scripts
    event.respondWith(fetch(event.request).catch(function() { return new Response('Service unavailable', { status: 503 }); }));
  }
});
