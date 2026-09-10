import "server-only";

import { LocalHealth } from "./local-health";

export function getHealthFetcher() {
  return new LocalHealth();
}
