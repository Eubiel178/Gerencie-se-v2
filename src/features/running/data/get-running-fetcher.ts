import "server-only";

import { LocalRunning } from "./local-running";

export function getRunningFetcher() {
  return new LocalRunning();
}
