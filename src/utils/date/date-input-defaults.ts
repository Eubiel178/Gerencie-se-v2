function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Formata qualquer `Date` pro valor de `<input type="datetime-local">`
 * ("AAAA-MM-DDTHH:mm"), sempre no fuso local — nunca `Date.toISOString()`,
 * que devolveria UTC. Reaproveitado por `nowForDatetimeLocal` (abaixo,
 * "agora" formatado) e por `google-calendar.ts` (formata uma data que já
 * existe, vinda de volta do Google) — mesma regra de formatação, duas
 * origens de data diferentes. */
export function formatDateForDatetimeLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Valor "agora" pronto pro atributo `value` de `<input type="datetime-local">`
 * — regra do app: todo campo de data/hora que representa "quando isso
 * começa/acontece" já abre preenchido com o momento atual, em vez de
 * vazio. */
export function nowForDatetimeLocal(): string {
  return formatDateForDatetimeLocalInput(new Date());
}

/** Mesma regra, pra `<input type="time">` ("HH:mm"). */
export function nowForTimeInput(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Mesma regra, pra `<input type="date">` ("AAAA-MM-DD"). */
export function todayForDateInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
