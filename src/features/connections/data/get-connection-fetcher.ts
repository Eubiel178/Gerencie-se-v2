import "server-only";

import { LocalConnection } from "./local-connection";

export function getConnectionFetcher() {
  return new LocalConnection();
}
