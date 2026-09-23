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
    lines.push(
      headers.map((header) => escapeCsvField(neutralizeFormulaPrefix(formatCsvValue(row[header])))).join(",")
    );
  }

  return lines.join("\r\n");
}

function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

// Formula injection (CSV Injection / CWE-1236): ao contrário do .xlsx
// (gerado por `toXlsx`, onde o ExcelJS grava cada valor com tipo "texto"
// explícito), um CSV não carrega metadado de tipo — se um campo começa
// com "=", "+", "-", "@" ou tab, Excel/Planilhas Google interpretam como
// fórmula ao ABRIR o arquivo, não como texto. Como um título de tarefa
// pode vir de alguém que só compartilhou a tarefa com você (ver
// `sharedWithUserId`), um colaborador mal-intencionado poderia plantar
// uma fórmula que roda quando você exporta e abre o CSV. Mitigação
// recomendada pela OWASP: prefixar com aspas simples — a maioria das
// planilhas passa a tratar o campo como texto puro.
const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

function neutralizeFormulaPrefix(value: string): string {
  if (value.length === 0) return value;
  return FORMULA_TRIGGER_CHARS.has(value[0]) ? `'${value}` : value;
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
