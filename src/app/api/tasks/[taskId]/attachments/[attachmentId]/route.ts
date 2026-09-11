import { NextRequest, NextResponse } from "next/server";

import { getTaskAttachmentFetcher } from "@/features/tasks/data/get-task-attachment-fetcher";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;

  try {
    const attachment = await getTaskAttachmentFetcher().getAttachmentContent(attachmentId);

    if (!attachment) {
      return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(attachment.content), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        "Content-Length": String(attachment.sizeBytes),
      },
    });
  } catch {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;

  try {
    await getTaskAttachmentFetcher().deleteAttachment(attachmentId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover o anexo." }, { status: 400 });
  }
}
