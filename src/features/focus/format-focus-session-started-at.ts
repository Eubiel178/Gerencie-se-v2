/**
 * Formata o instante de início de uma sessão sempre no fuso IANA informado.
 * O banco armazena instantes UTC (`timestamptz`); nunca faça ajustes manuais
 * de horas aqui, pois o offset varia conforme o fuso e o horário de verão.
 */
export function formatFocusSessionStartedAt(startedAt: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: isValidTimeZone(timeZone) ? timeZone : "UTC",
  }).format(startedAt);
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}
