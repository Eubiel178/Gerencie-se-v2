import "server-only";

import { LocalCycle } from "./local-cycle";

export function getCycleFetcher() {
  return new LocalCycle();
}
