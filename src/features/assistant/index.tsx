import { getAssistantService } from "@/features/assistant/services/assistant-service";

import { Widget } from "./components/widget";

/**
 * Renderizado uma vez no layout de /home/* (ver `src/app/home/layout.tsx`).
 * Server Component: busca o snapshot (preferências + mensagem do momento)
 * e não desenha nada se o usuário desativou o assistente.
 */
export async function Assistant() {
  const snapshot = await getAssistantService().getSnapshot();

  if (!snapshot.enabled) return null;

  return (
    <Widget initialMessage={snapshot.message} reducedPresence={snapshot.reducedPresence} />
  );
}
