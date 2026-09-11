// Teto único de tamanho por arquivo, usado tanto na validação do
// frontend (antes de disparar o upload) quanto no backend (na rota que
// efetivamente grava o anexo — nunca confiar só no lado do cliente).
//
// Por que 10 MB é seguro aqui: o upload passa por um Route Handler
// (`request.formData()`), não por uma Server Action — Server Actions têm
// um limite de corpo de 1 MB por padrão no Next.js
// (`experimental.serverActions.bodySizeLimit`), mas Route Handlers não
// têm nenhum teto embutido, então o único limite real é este. O arquivo
// é guardado como `bytea` direto no Postgres (sem storage externo), o
// que também não impõe um teto menor pra esse tamanho.
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function isFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > MAX_ATTACHMENT_SIZE_BYTES;
}

/** Formata bytes como "8,2 MB" / "512 KB" — unidade amigável e
 * consistente com o que a interface mostra antes/depois do upload. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${formatNumber(kb)} KB`;

  const mb = kb / 1024;
  return `${formatNumber(mb)} MB`;
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  return text.replace(".", ",");
}
