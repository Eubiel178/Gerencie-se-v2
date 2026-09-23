export function formatDeadline(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayLabel =
    day.getTime() === startOfToday.getTime()
      ? "Hoje"
      : day.getTime() === startOfTomorrow.getTime()
        ? "Amanhã"
        : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
            .format(date)
            .replace(".", "");
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dayLabel}, até ${time}`;
}

export function isOverdue(value: string): boolean {
  return new Date(value) < new Date();
}

export function formatRemaining(seconds: number): string {
  if (seconds < 60) return "agora";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}min`
    : `${minutes} min`;
}

/** Tempo decorrido desde que a execução (re)começou — "Fazendo agora · X".
 *  Diferente de `formatRemaining` (contagem regressiva do foco/Pomodoro):
 *  aqui o tempo AUMENTA, então o texto precisa do "há" pra não soar como
 *  se fosse quanto falta. */
export function formatElapsed(seconds: number): string {
  if (seconds < 60) return "agora";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0
    ? `há ${hours}h ${String(minutes).padStart(2, "0")}min`
    : `há ${minutes} min`;
}

/** Mesmo formato curto de `formatElapsed` ("há X min"), mas a partir de
 * uma data em vez de segundos já contados - usado pelo badge "Pausada"
 * (`task.pausedAt`). Existe pra "Fazendo agora" e "Pausada" terem o MESMO
 * tamanho de texto no badge: antes, "Pausada" usava
 * `formatTemporalContext` ("Hoje às 14:32" ou "22/09/2026 às 14:32",
 * bem mais longo que "há 12 min") - a diferença de comprimento fazia a
 * linha de status quebrar (ou deixar de quebrar) ao alternar entre os
 * dois estados, e o card inteiro "crescia e encolhia" a cada pausar/
 * retomar (achado relatado). */
export function formatElapsedSince(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  return formatElapsed(seconds);
}
