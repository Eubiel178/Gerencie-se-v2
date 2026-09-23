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
              // Clona JÁ AQUI, antes de qualquer outra coisa tocar em
              // `response` — o corpo de um Response só pode ser lido UMA
              // vez, então quanto mais tarde clona, maior a chance de
              // outra parte do navegador já ter começado a consumi-lo.
              const responseToCache = response.clone();

              // `event.waitUntil` mantém o service worker vivo até este
              // `cache.put` terminar - sem isso, o navegador podia encerrar
              // o worker assim que `event.respondWith` resolvesse (a
              // página já tem sua resposta), cortando essa gravação no
              // meio e sobrando uma promise rejeitada sem `.catch()`
              // (erro relatado no console: "Failed to execute 'clone' on
              // 'Response': Response body is already used"). O `.catch`
              // final garante que uma falha aqui (rede instável, cota de
              // cache do navegador etc.) nunca vira um erro não tratado -
              // cachear é um bônus de performance, nunca algo que deveria
              // quebrar o carregamento do asset.
              event.waitUntil(
                caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(request, responseToCache))
                  .catch(() => {})
              );
            }
            return response;
          })
          .catch(() => cached);

        return cached ?? network;
      })
    );
  }
});

// Notificação push (lembretes de tarefa, mesmo com o site fechado - ver
// `src/lib/web-push.ts`). O payload é o JSON que o servidor manda em
// `webpush.sendNotification`, então tudo aqui é dado que o próprio app
// gerou, nunca conteúdo de terceiro.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Payload não era JSON válido - mostra uma notificação genérica em
    // vez de deixar o evento em silêncio.
  }

  const title = data.title || "Gerencie-se";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag,
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      data: { url: data.url || "/home/tasks" },
    })
  );
});

// Clique na notificação: foca uma aba já aberta na URL certa, ou abre uma
// nova - nunca duas abas do mesmo app por causa de um clique.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/home/tasks";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((client) => client.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
