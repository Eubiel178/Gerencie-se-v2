const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toLocalDate(d: Date): { year: number; month: number; day: number } {
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
}

function sameDay(a: Date, b: Date): boolean {
  const ad = toLocalDate(a);
  const bd = toLocalDate(b);
  return ad.year === bd.year && ad.month === bd.month && ad.day === bd.day;
}

function isYesterday(d: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return sameDay(d, yesterday);
}

/** "Hoje" / "Ontem" / "DD/MM/AAAA" — sem horário, para usar como cabeçalho
 *  de um grupo de itens do mesmo dia (ex.: linha do tempo do chat do
 *  Companion, onde o horário já aparece em cada mensagem individualmente). */
export function formatDayLabel(date: Date | null | undefined): string | null {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();

  if (sameDay(d, today)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return dateFormatter.format(d);
}

/** "HH:mm" isolado, sem dia — para mensagens/itens já agrupados por dia. */
export function formatTimeOnly(date: Date | null | undefined): string | null {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);
  return timeFormatter.format(d);
}

export function formatTemporalContext(date: Date | null | undefined): string | null {
  const day = formatDayLabel(date);
  const time = formatTimeOnly(date);
  if (!day || !time) return null;

  return `${day} às ${time}`;
}

export function formatCompletionLabel(date: Date | null | undefined): string {
  const ctx = formatTemporalContext(date);
  return ctx ? `Concluída · ${ctx}` : "Concluída";
}
