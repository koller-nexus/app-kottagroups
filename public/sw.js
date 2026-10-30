// Service worker mínimo (specs/029-pwa-installable). Só guarda a página "Sem conexão" e a mostra
// quando uma navegação falha na rede. Nunca guarda API, páginas nem dados de conta.
// Mude o número do cache quando os arquivos de OFFLINE_FILES mudarem.
const CACHE = "kotta-offline-v1";
const CACHE_PREFIX = "kotta-offline-";
const OFFLINE_PAGE = "/offline.html";
const OFFLINE_FILES = [OFFLINE_PAGE, "/offline.css", "/offline.js", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Os arquivos da página offline também vêm do cache: sem rede, nem o CSS nem o botão carregariam.
  if (request.mode !== "navigate") {
    const { pathname } = new URL(request.url);
    if (OFFLINE_FILES.includes(pathname)) {
      event.respondWith(caches.match(pathname).then((hit) => hit || fetch(request)));
    }
    return;
  }
  // Só falha de rede vira página offline; resposta HTTP, de qualquer status, segue como veio.
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_PAGE)));
});
