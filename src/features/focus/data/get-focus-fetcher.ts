import "server-only";

import { LocalFocusSession } from "./local-focus-session";
import { LocalMascot } from "./local-mascot";

export function getFocusFetcher() {
  return new LocalFocusSession();
}

export function getMascotFetcher() {
  return new LocalMascot();
}
