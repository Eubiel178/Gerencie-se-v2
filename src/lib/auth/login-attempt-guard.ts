// Lógica pura (sem banco, sem e-mail) de quando avisar o dono da conta
// por tentativas de login malsucedidas — separada de propósito do
// orquestrador que toca banco/e-mail (`login-attempt-tracker.ts`, que
// tem `"server-only"` e por isso não pode ser importado por um teste
// `node:test` puro). Ver o comentário da tabela `login_attempt` em
// `src/db/schema.ts` pra o raciocínio completo (por que só aviso, nunca
// bloqueio).
const ATTEMPT_WINDOW_MINUTES = 30;
const ALERT_THRESHOLD = 5;
const ALERT_COOLDOWN_MINUTES = 60;

export interface LoginAttemptState {
  failedCount: number;
  windowStartedAt: Date | null;
  lastAlertSentAt: Date | null;
}

export interface RecordFailedAttemptResult {
  nextState: LoginAttemptState;
  shouldSendAlert: boolean;
}

function minutesBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 60_000;
}

/**
 * Decide o próximo estado e se um alerta deve ser enviado. `state` nulo
 * = primeira tentativa falha já vista para este usuário.
 */
export function recordFailedAttempt(
  state: LoginAttemptState | null,
  now: Date
): RecordFailedAttemptResult {
  const windowExpired =
    !state?.windowStartedAt || minutesBetween(state.windowStartedAt, now) > ATTEMPT_WINDOW_MINUTES;

  const failedCount = windowExpired ? 1 : state!.failedCount + 1;
  const windowStartedAt = windowExpired ? now : state!.windowStartedAt!;
  const lastAlertSentAt = state?.lastAlertSentAt ?? null;

  const cooldownActive =
    !!lastAlertSentAt && minutesBetween(lastAlertSentAt, now) < ALERT_COOLDOWN_MINUTES;
  const shouldSendAlert = failedCount >= ALERT_THRESHOLD && !cooldownActive;

  return {
    // Depois de alertar, reinicia a contagem — o próximo alerta só
    // dispara depois de outro `ALERT_THRESHOLD` de tentativas (o
    // cooldown acima já cobre o caso de tentativas quase imediatas
    // depois do alerta).
    nextState: {
      failedCount: shouldSendAlert ? 0 : failedCount,
      windowStartedAt: shouldSendAlert ? now : windowStartedAt,
      lastAlertSentAt: shouldSendAlert ? now : lastAlertSentAt,
    },
    shouldSendAlert,
  };
}

/** Estado depois de um login bem-sucedido: sempre limpo por completo —
 * uma entrada correta encerra qualquer sequência de tentativas erradas
 * em andamento. */
export function resetLoginAttemptState(): LoginAttemptState {
  return { failedCount: 0, windowStartedAt: null, lastAlertSentAt: null };
}
