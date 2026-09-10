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
