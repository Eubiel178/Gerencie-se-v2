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
