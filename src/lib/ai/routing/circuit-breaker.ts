import "server-only";

import { COOLDOWN_MS } from "../config";
import type { ErrorCategory } from "../config";

const modelCooldowns = new Map<string, number>();
const lastError = new Map<string, ErrorCategory | null>();

function modelKey(provider: string, model: string): string {
  return `${provider}/${model}`;
}

export function isModelCoolingDown(provider: string, model: string): boolean {
  const until = modelCooldowns.get(modelKey(provider, model)) ?? 0;
  return Date.now() < until;
}

export function markModelRateLimited(provider: string, model: string): void {
  modelCooldowns.set(modelKey(provider, model), Date.now() + COOLDOWN_MS);
  lastError.set(modelKey(provider, model), "rate_limit");
  console.log(`[AI] provider=${provider} model=${model} status=rate_limited cooldown=60s`);
}

export function markModelError(provider: string, model: string, errorType: Exclude<ErrorCategory, "rate_limit">): void {
  lastError.set(modelKey(provider, model), errorType);
}

export function clearModelError(provider: string, model: string): void {
  lastError.set(modelKey(provider, model), null);
}

/**
 * Verifica se um provider está "esgotado" — se o último erro de qualquer
 * um de seus modelos indica uma limitação que afeta o provider inteiro.
 *
 * Regra conservadora: só marca como esgotado se o último erro foi
 * auth_error (chave inválida/expirada). Rate limits são tratados
 * como model-specific por padrão.
 */
export function isProviderUnavailable(providerName: string, models: readonly string[]): boolean {
  for (const model of models) {
    const err = lastError.get(modelKey(providerName, model));
    if (err === "auth_error") return true;
  }
  return false;
}
