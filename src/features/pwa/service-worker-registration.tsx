"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (public/sw.js) só em produção — em
 * desenvolvimento o cache do worker atrapalharia o hot-reload do Next.
 * Sem UI própria: não renderiza nada, só dispara o registro como efeito
 * colateral no carregamento do app.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort: PWA é um extra, nunca deve quebrar o app se o
      // registro falhar (ex.: navegador sem suporte completo).
    });
  }, []);

  return null;
}
