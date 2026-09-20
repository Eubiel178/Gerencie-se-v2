import "server-only";

export const COOLDOWN_MS = 60_000;
export const AI_TIMEOUT_MS = 30_000;

export type ErrorCategory =
  | "rate_limit"
  | "timeout"
  | "server_error"
  | "auth_error"
  | "unknown";
