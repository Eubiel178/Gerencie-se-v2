/** Serializa uma lista de objetos simples pra CSV — sem biblioteca nova,
 * as regras de escape do formato (RFC 4180) são poucas: aspas dobram
 * (`"` → `""`), e um campo com vírgula/aspas/quebra de linha vai entre
 * aspas. Cabeçalho sempre vem das chaves do primeiro objeto (assume linhas
 * homogêneas, o que é sempre o caso aqui — vêm todas do mesmo mapeamento). */
export function toCsv<T extends object>(rows: T[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]) as (keyof T)[];
  const lines = [headers.map((header) => escapeCsvField(String(header))).join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvField(formatCsvValue(row[header]))).join(","));
  }

  return lines.join("\r\n");
}

function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
