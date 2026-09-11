import { getAssistantService } from "@/features/assistant/services/assistant-service";

import { Widget } from "./components/widget";

// Reexports pra permitir `import { X } from "@/features/assistant"` em
// vez de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getAssistantService } from "./services/assistant-service";
export { getAssistantPreferencesFetcher } from "./data/get-assistant-preferences-fetcher";
export { PreferencesPanel } from "./components/preferences-panel";

/**
 * Renderizado uma vez no layout de /home/* (ver `src/app/home/layout.tsx`).
 * Server Component: busca o snapshot (preferências + mensagem do momento)
 * e não desenha nada se o usuário desativou o assistente.
 */
export async function Assistant() {
  const snapshot = await getAssistantService().getSnapshot();

  if (!snapshot.enabled) return null;

  return (
    <Widget
      initialMessage={snapshot.message}
      reducedPresence={snapshot.reducedPresence}
      mascot={snapshot.mascot}
    />
  );
}
