import ExcelJS from "exceljs";

/** Gera um .xlsx de verdade (não um CSV com outra extensão) a partir de
 * uma lista de objetos simples — mesmo contrato de `toCsv`, mas abre
 * direto no Excel/Google Planilhas com colunas já nomeadas e datas como
 * data de verdade, sem tela de importação nem problema de separador. */
export async function toXlsx<T extends object>(rows: T[], sheetName = "Dados"): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]) as (keyof T)[];

    sheet.columns = headers.map((header) => ({
      header: String(header),
      key: String(header),
      width: 22,
    }));
    sheet.getRow(1).font = { bold: true };

    for (const row of rows) {
      sheet.addRow(formatXlsxRow(row, headers));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function formatXlsxRow<T extends object>(row: T, headers: (keyof T)[]): Record<string, unknown> {
  const formatted: Record<string, unknown> = {};

  for (const header of headers) {
    formatted[String(header)] = formatXlsxValue(row[header]);
  }

  return formatted;
}

function formatXlsxValue(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.join("; ");
  return value;
}
