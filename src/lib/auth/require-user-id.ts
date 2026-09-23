import "server-only";

import { auth } from "@/lib/auth";

/**
 * Resolve o id do usuário autenticado a partir da sessão do servidor.
 *
 * Nunca aceitamos um userId vindo do cliente (body, query, etc.) para não
 * permitir que um usuário read/escreva dados de outro só trocando um valor
 * na requisição — toda a camada de dados (`LocalTask`, `LocalEvent`) chama
 * esta função internamente para descobrir de quem são os dados.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  return userId;
}

/** Mesma ideia de `requireUserId`, mas também com o e-mail da sessão —
 * usado por `features/connections` para resolver convites pendentes pelo
 * e-mail de quem está logado. Nunca aceita e-mail vindo do cliente, só o
 * da sessão autenticada. */
export async function requireCurrentUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    throw new Error("Usuário não autenticado.");
  }

  return { id: userId, email };
}
