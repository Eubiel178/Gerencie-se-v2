import "server-only";

import { and, eq, or } from "drizzle-orm";

import { db } from "@/db/client";
import { connections } from "@/db/schema";

/**
 * Verifica se existe um vínculo ACEITO entre os dois usuários — chamado
 * por qualquer feature (tasks, routine, habits, goals) antes de aceitar
 * um `sharedWithUserId` vindo do cliente. Sem essa checagem, qualquer
 * usuário autenticado poderia compartilhar (dar acesso à própria tarefa
 * PARA, ou pior, se apropriar de acesso alheio) com qualquer outro id de
 * usuário só adivinhando/sabendo o UUID — mesma classe de bug do IDOR já
 * corrigido em Goals.
 */
export async function assertAcceptedConnection(userId: string, targetUserId: string): Promise<void> {
  if (userId === targetUserId) {
    throw new Error("Não é possível compartilhar consigo mesmo.");
  }

  const [row] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.status, "accepted"),
        or(
          and(eq(connections.requesterId, userId), eq(connections.addresseeId, targetUserId)),
          and(eq(connections.requesterId, targetUserId), eq(connections.addresseeId, userId))
        )
      )
    )
    .limit(1);

  if (!row) {
    throw new Error("Você não tem um vínculo aceito com essa pessoa.");
  }
}
