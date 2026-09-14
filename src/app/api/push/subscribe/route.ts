import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Guarda (ou atualiza) a inscrição push do navegador que acabou de se
 * registrar. Reenviar a mesma inscrição (ex.: usuário clica "Ativar" de
 * novo) é seguro — `endpoint` é único, então vira um upsert em vez de
 * duplicar a linha.
 */
export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const body = (await request.json().catch(() => null)) as SubscribeBody | null;

  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: body.keys.p256dh, auth: body.keys.auth },
    });

  return NextResponse.json({ ok: true });
}

/** Remove a inscrição (usuário desativou nas Configurações). Filtra por
 * `userId` também, não só `endpoint` — nunca deixa uma requisição apagar
 * a inscrição de outra conta só sabendo o endpoint alheio. */
export async function DELETE(request: NextRequest) {
  const userId = await requireUserId();
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;

  if (!body?.endpoint) {
    return NextResponse.json({ error: "Endpoint não informado." }, { status: 400 });
  }

  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.userId, userId)));

  return NextResponse.json({ ok: true });
}
