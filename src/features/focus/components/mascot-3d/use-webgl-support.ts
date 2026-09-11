import { useSyncExternalStore } from "react";

let cachedSupport: boolean | null = null;

function checkWebglSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}

function getSnapshot(): boolean {
  cachedSupport ??= checkWebglSupport();
  return cachedSupport;
}

// Nunca muda depois de montado — não existe evento de "WebGL ficou
// disponível agora", então o subscribe não precisa notificar nada.
function subscribe(): () => void {
  return () => {};
}

/** Detecta, no cliente, se o navegador consegue abrir um contexto WebGL
 * antes de tentar montar a cena Three.js. `null` no servidor (onde não
 * existe `document`) — quem usa trata como "ainda não sei" e mostra o
 * mascote em CSS até confirmar suporte. */
export function useWebglSupport(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
