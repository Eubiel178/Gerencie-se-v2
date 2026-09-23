import "server-only";

import { LocalHydration } from "./local-hydration";

export function getHydrationFetcher() {
  return new LocalHydration();
}
