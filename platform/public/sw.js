/* CEDA Innovation Hub service worker.
 *
 * - App shell + static assets: cache-first (fast repeat visits, works offline)
 * - Navigations: network-first, falling back to the cached shell
 * - Supabase API + realtime: never cached (live data must stay live)
 */
const SHELL_CACHE = 'ceda-shell-v1';
const ASSET_CACHE = 'ceda-assets-v1';

const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/ceda-icon.png'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Never cache the API or the realtime socket
    if (url.origin !== self.location.origin || url.pathname.startsWith('/rest/')) return;

    // Navigations: network first, shell fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(res => {
                    const copy = res.clone();
                    caches.open(SHELL_CACHE).then(c => c.put('/index.html', copy));
                    return res;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Static assets: cache first, then network + cache the result
    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(res => {
            if (res.ok && (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(png|svg|ttf|woff2?|css|js)$/))) {
                const copy = res.clone();
                caches.open(ASSET_CACHE).then(c => c.put(request, copy));
            }
            return res;
        }))
    );
});
