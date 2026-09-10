// Service worker do Gerencie-se — dá instalabilidade (PWA) e uma tela de
// fallback quando o usuário perde conexão. NÃO tenta oferecer CRUD
// offline de verdade: quase todo dado (tarefas, hábitos, metas...) vem de
// Server Components/Actions que precisam de uma conexão real com o
// banco. Fingir que isso funciona offline seria inventar uma capacidade
// que o navegador não tem — só o "app shell" (rota /offline, ícone,
// manifest) e assets estáticos ficam em cache.
const CACHE_NAME = "gerencie-se-shell-v1";
const APP_SHELL = ["/offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só GET é cacheável com segurança — POSTs de Server Actions nunca
  // devem passar por cache.
  if (request.method !== "GET") return;

  // Navegação de página: tenta a rede primeiro (dado sempre fresco);
  // se falhar (offline), cai para a tela /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // Assets estáticos (CSS/JS/imagens/fontes): cache-first, com a rede
  // como respaldo e atualização em segundo plano.
  const isStaticAsset = ["style", "script", "image", "font"].includes(
    request.destination
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);

        return cached ?? network;
      })
    );
  }
});
