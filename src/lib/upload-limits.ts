// Teto único de tamanho por arquivo, usado tanto na validação do
// frontend (antes de disparar o upload) quanto no backend (na rota que
// efetivamente grava o anexo — nunca confiar só no lado do cliente).
//
// Por que 4 MB, não mais: hospedado na Vercel, toda Serverless Function
// (incluindo Route Handlers) tem um teto de corpo de requisição de 4,5 MB
// imposto pela própria plataforma, antes mesmo do código rodar — não é
// algo que o Next.js ou este arquivo controle. Passar disso faria a
// requisição falhar na Vercel com um erro genérico da plataforma, não com
// a mensagem amigável abaixo. 4 MB deixa margem de segurança para o
// overhead do multipart/form-data. O arquivo é guardado como `bytea`
// direto no Postgres (sem storage externo).
export const MAX_ATTACHMENT_SIZE_BYTES = 4 * 1024 * 1024;

export function isFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > MAX_ATTACHMENT_SIZE_BYTES;
}

// Allowlist de tipo de anexo — cobre o que faz sentido para um anexo de
// tarefa (foto/comprovante/documento), exclui executáveis e scripts por
// não estarem na lista. Limitação conhecida: `file.type` vem do
// navegador a partir da extensão, não do conteúdo real do arquivo (não
// fazemos leitura de "magic bytes") — por isso a mitigação principal
// contra conteúdo malicioso continua sendo servir todo anexo com
// `Content-Disposition: attachment` (força download, nunca renderiza
// inline no navegador), não esta allowlist. Ver seção 50 do guia do
// projeto: "não confie apenas na extensão do arquivo" — esta checagem é
// só uma camada a mais, não a única.
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export const ALLOWED_ATTACHMENT_ACCEPT = [...ALLOWED_ATTACHMENT_MIME_TYPES].join(",");

export function isAttachmentTypeAllowed(mimeType: string): boolean {
  return ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType);
}

// Allowlist própria e mais estreita pra avatar — diferente de anexo de
// tarefa (que aceita PDF/Word/etc.), avatar só pode ser imagem.
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function isAvatarTypeAllowed(mimeType: string): boolean {
  return ALLOWED_AVATAR_MIME_TYPES.has(mimeType);
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
