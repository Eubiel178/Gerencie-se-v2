import "server-only";

import { LocalAssistantPreferences } from "./local-assistant-preferences";

export function getAssistantPreferencesFetcher() {
  return new LocalAssistantPreferences();
}
