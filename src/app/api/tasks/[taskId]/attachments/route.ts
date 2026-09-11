import { NextRequest, NextResponse } from "next/server";

import { getTaskAttachmentFetcher } from "@/features/tasks/data/get-task-attachment-fetcher";
import { MAX_ATTACHMENT_SIZE_BYTES, formatFileSize } from "@/lib/upload-limits";

const TOO_LARGE_MESSAGE = `Arquivo muito grande. O tamanho máximo permitido é ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)} por arquivo.`;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  try {
    const attachments = await getTaskAttachmentFetcher().listAttachments(taskId);
    return NextResponse.json({ attachments });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os anexos." }, { status: 404 });
  }
}

/**
 * Upload de anexo. De propósito um Route Handler, não uma Server Action:
 * Server Actions têm um limite de corpo de 1MB por padrão no Next.js, e
 * aqui o teto real é `MAX_ATTACHMENT_SIZE_BYTES` (10MB) — um Route
 * Handler lendo `request.formData()` não tem esse teto embutido.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  // Checagem rápida pelo cabeçalho antes de gastar tempo parseando o
  // corpo inteiro — `Content-Length` inclui os boundaries do
  // multipart/form-data, por isso a folga de 5%; a checagem que realmente
  // decide é sempre `file.size` depois do parse, abaixo.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ATTACHMENT_SIZE_BYTES * 1.05) {
    return NextResponse.json({ error: TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  // `file.size` vem do que o Next efetivamente leu do corpo da
  // requisição (não é um valor que o cliente possa forjar independente
  // do conteúdo real) — nunca confia só na validação já feita no
  // frontend antes de chegar aqui.
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json({ error: TOO_LARGE_MESSAGE }, { status: 413 });
  }

  try {
    const content = Buffer.from(await file.arrayBuffer());

    const attachment = await getTaskAttachmentFetcher().addAttachment({
      taskId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      content,
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar o arquivo." }, { status: 400 });
  }
}
