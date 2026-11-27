/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Hors ligne : on met en cache le jeu à l'installation, puis on sert depuis le cache.
import { self } from '$app/service-worker';
import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/environment';

const CACHE = `meri-${version}`;
const FILES = [...immutable, ...assets, ...prerendered].map((f) => f.path);

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
	e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});
self.addEventListener('fetch', (e) => {
	if (e.request.method !== 'GET') return;
	e.respondWith(
		caches.match(e.request).then((hit) => hit ?? fetch(e.request).catch(() => caches.match('./') as Promise<Response>))
	);
});
