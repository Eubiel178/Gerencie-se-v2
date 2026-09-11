function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Valor "agora" pronto pro atributo `value` de `<input type="datetime-local">`
 * ("AAAA-MM-DDTHH:mm") — regra do app: todo campo de data/hora que
 * representa "quando isso começa/acontece" já abre preenchido com o
 * momento atual, em vez de vazio. */
export function nowForDatetimeLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
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
