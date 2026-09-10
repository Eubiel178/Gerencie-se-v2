import "server-only";

import { LocalReading } from "./local-reading";

export function getReadingFetcher() {
  return new LocalReading();
}
