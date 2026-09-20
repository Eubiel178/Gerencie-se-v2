import { NextResponse } from "next/server";
import { and, eq, isNotNull, isNull, lt, or } from "drizzle-orm";

import { db } from "@/db/client";
import { executionSessions, tasks } from "@/db/schema";
import { isValidCronSecret } from "@/lib/cron-auth";
import { sendPushToUser } from "@/lib/web-push";

/**
 * Check-in push para sessões de execução paradas ou pausadas há muito tempo.
 *
 * Regras:
 * - Sessão "active" sem atualização há 30+ minutos → "Como tá indo com [tarefa]?"
 * - Sessão "paused" sem atualização há 15+ minutos → "Quando quiser voltar, é só clicar"
 * - Só envia 1 check-in por sessão a cada 30 minutos (lastCheckinSentAt)
 *
 * Chamado por agendador externo via POST com CRON_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado — check-ins de execução estão desligados." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronSecret(authHeader, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const now = new Date();

  // Sessões active sem update há 30+ min e sem check-in nas últimas 30 min
  const staleActive = await db
    .select({
      id: executionSessions.id,
      userId: executionSessions.userId,
      taskId: executionSessions.taskId,
      updatedAt: executionSessions.updatedAt,
      lastCheckinSentAt: executionSessions.lastCheckinSentAt,
    })
    .from(executionSessions)
    .where(
      and(
        eq(executionSessions.status, "active"),
        lt(executionSessions.updatedAt, new Date(now.getTime() - 30 * 60 * 1000)),
        or(
          isNull(executionSessions.lastCheckinSentAt),
          lt(executionSessions.lastCheckinSentAt, new Date(now.getTime() - 30 * 60 * 1000))
        )
      )
    );

  // Sessões paused sem update há 15+ min e sem check-in nas últimas 30 min
  const stalePaused = await db
    .select({
      id: executionSessions.id,
      userId: executionSessions.userId,
      taskId: executionSessions.taskId,
      updatedAt: executionSessions.updatedAt,
      lastCheckinSentAt: executionSessions.lastCheckinSentAt,
    })
    .from(executionSessions)
    .where(
      and(
        eq(executionSessions.status, "paused"),
        lt(executionSessions.updatedAt, new Date(now.getTime() - 15 * 60 * 1000)),
        or(
          isNull(executionSessions.lastCheckinSentAt),
          lt(executionSessions.lastCheckinSentAt, new Date(now.getTime() - 30 * 60 * 1000))
        )
      )
    );

  const candidates = [...staleActive, ...stalePaused];

  if (candidates.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Busca títulos das tarefas
  const taskIds = [...new Set(candidates.map((c) => c.taskId))];
  const taskRows = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(or(...taskIds.map((id) => eq(tasks.id, id))));
  const taskTitleMap = new Map(taskRows.map((t) => [t.id, t.title]));

  let sent = 0;

  await Promise.all(
    candidates.map(async (session) => {
      const title = taskTitleMap.get(session.taskId) ?? "sua tarefa";
      const isPaused = session.updatedAt < new Date(now.getTime() - 15 * 60 * 1000)
        && session.lastCheckinSentAt === null;
      // Determina se é paused ou active baseado no updatedAt
      const minutesSinceUpdate = (now.getTime() - session.updatedAt.getTime()) / 60000;

      let body: string;
      let tag: string;

      if (minutesSinceUpdate >= 30) {
        // Sessão provavelmente pausada ou abandonada
        body = `Quando quiser voltar com "${title}", é só abrir o app.`;
        tag = `exec-checkin-paused-${session.id}`;
      } else {
        // Sessão ativa mas sem atualização
        body = `Como tá indo com "${title}"?`;
        tag = `exec-checkin-active-${session.id}`;
      }

      // Marca check-in enviado ANTES de mandar (evita duplicata em caso de retry)
      await db
        .update(executionSessions)
        .set({ lastCheckinSentAt: now })
        .where(eq(executionSessions.id, session.id));

      await sendPushToUser(session.userId, {
        title: "Gerencie-se",
        body,
        tag,
        url: "/home/tasks",
      });

      sent++;
    })
  );

  return NextResponse.json({ sent });
}
