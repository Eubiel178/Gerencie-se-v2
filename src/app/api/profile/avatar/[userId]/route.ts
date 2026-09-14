import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

/**
 * Serve o avatar enviado pelo usuário (`users.avatarContent`, guardado
 * como `bytea`, mesmo padrão do anexo de tarefa). Diferente da rota de
 * anexo (`Content-Disposition: attachment`, força download de
 * propósito), aqui precisa ser `inline` — o avatar é renderizado direto
 * num `<img src="...">` no header/Configurações, nunca baixado.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const [user] = await db
    .select({ avatarContent: users.avatarContent, avatarMimeType: users.avatarMimeType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.avatarContent || !user.avatarMimeType) {
    return NextResponse.json({ error: "Avatar não encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(user.avatarContent), {
    headers: {
      "Content-Type": user.avatarMimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
