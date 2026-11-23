/* ISKCON Hadapsar v20 - bounded public-page, same-origin offline disk cache.
 * Never cache APIs, credentials, donation transactions, user data or third-party responses.
 */
'use strict';
const VERSION = 'iskcon-v20-media2';
const PAGES = VERSION + '-pages', ASSETS = VERSION + '-assets', CORE = VERSION + '-core';
const CORE_FILES = ['/', '/offline.html', '/temple-runtime.js','/temple-share.js?v=2'];
const DONATION = /^(?:\/)(?:dono|granth-daan|seva-|temple-development|admin|payment|login|signup|account|contact|privacy|terms)/i;
const STATIC_ASSET = /\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?)$/i;
const PAGE = /^\/(?:[a-zA-Z0-9_-]+\.html)?$/;
function publicPage(u) {
  return u.origin === self.location.origin && !DONATION.test(u.pathname) &&
    PAGE.test(u.pathname) && !u.search && !u.hash;
}
function publicAsset(u) {
  return u.origin === self.location.origin && STATIC_ASSET.test(u.pathname) &&
    !/\/(?:admin|api|user|private|payment|token|secret)\b/i.test(u.pathname);
}
function cacheable(r) {
  if (!r || !r.ok || r.type !== 'basic' || r.status !== 200) return false;
  const cc = r.headers.get('cache-control') || '';
  if (/no-store|private/i.test(cc) || r.headers.has('set-cookie')) return false;
  return true;
}
async function boundedPut(cacheName, request, response, limit, maxBytes) {
  if (!cacheable(response)) return;
  const length = Number(response.headers.get('content-length') || 0);
  if (length > maxBytes) return;
  // For missing length, bounded read prevents saving oversized responses.
  let copy = response.clone();
  if (!length) {
    try {
      const body = await copy.clone().arrayBuffer();
      if (body.byteLength > maxBytes) return;
    } catch (_) { return; }
  }
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, copy);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
  } catch (_) { /* Quota/cache errors must never block the page */ }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CORE);
      await Promise.all(CORE_FILES.map(async path => {
        try {
          const response = await fetch(path, {cache:'reload'});
          if (cacheable(response)) await cache.put(path,response);
        } catch (_) {}
      }));
    } finally { await self.skipWaiting(); }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('iskcon-v') && ![PAGES,ASSETS,CORE].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('authorization') || req.headers.has('range')) return;
  let url; try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin === self.location.origin && url.pathname === '/temple-share.js') {
    event.respondWith((async () => {
      const cache = await caches.open(CORE);
      try {
        const response = await fetch(req, {cache:'no-cache'});
        if (!response.ok) throw Error('Share settings unavailable');
        if (cacheable(response)) await cache.put(req,response.clone());
        return response;
      } catch (error) {
        const saved = await cache.match(req);
        if (saved) return saved;
        throw error;
      }
    })());
    return;
  }
  if (req.mode === 'navigate' && publicPage(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(PAGES);
      const cached = await cache.match(req);
      const refresh = (async () => {
        const response = await fetch(req);
        await boundedPut(PAGES, req, response, 14, 450 * 1024);
        return response;
      })();
      if (cached) {
        event.waitUntil(refresh.catch(() => {}));
        return cached;
      }
      try { return await refresh; }
      catch (_) {
        return (await caches.match('/offline.html')) ||
          new Response('ISKCON Hadapsar: Offline. Connect once to save this page.', {status:503,headers:{'content-type':'text/plain'}});
      }
    })());
    return;
  }
  if (publicAsset(url) && ['script','style','image','font'].includes(req.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const response = await fetch(req);
      event.waitUntil(boundedPut(ASSETS, req, response, 36, 800 * 1024));
      return response;
    })());
  }
});
self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'ISKCON_CACHE_CURRENT') return;
  try {
    const url = new URL(event.data.url);
    if (!publicPage(url)) return;
    event.waitUntil((async () => {
      const cache = await caches.open(PAGES);
      const hit = await cache.match(url.href);
      if (hit) return;
      const response = await fetch(url.href, {cache:'reload'});
      await boundedPut(PAGES, url.href, response, 14, 450 * 1024);
    })().catch(()=>{}));
  } catch (_) {}
});