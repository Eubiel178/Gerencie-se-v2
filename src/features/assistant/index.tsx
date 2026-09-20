import { getAssistantService } from "@/features/assistant/services/assistant-service";
import { IMascotState } from "@/features/focus/domain";

import { Widget } from "./components/widget";

export * from "./domain";
export * from "./actions";
export { getAssistantService } from "./services/assistant-service";
export { getAssistantPreferencesFetcher } from "./data/get-assistant-preferences-fetcher";
export { PreferencesPanel } from "./components/preferences-panel";

export async function Assistant({ mascot }: { mascot?: IMascotState }) {
  const snapshot = await getAssistantService().getSnapshot(mascot);

  if (!snapshot.enabled) return null;

  return (
    <Widget
      initialMessage={snapshot.message}
      reducedPresence={snapshot.reducedPresence}
      mascot={snapshot.mascot}
      executionSession={snapshot.executionSession}
      executionTaskTitle={snapshot.executionTaskTitle}
    />
  );
}
