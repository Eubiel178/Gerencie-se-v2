import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import * as domain from "@/features/connections/domain";

import { db } from "@/db/client";
import { connections, users } from "@/db/schema";
import { requireCurrentUser } from "@/lib/require-user-id";
import { sendEmail } from "@/lib/email";
import { inviteEmailHtml } from "../email-templates";

/**
 * Implementação local (Drizzle + Postgres) do vínculo de colaboração.
 *
 * Match por e-mail, sem token de link: sempre que alguém carrega a lista
 * de conexões (`loadAll`), qualquer convite pendente endereçado ao e-mail
 * da sessão atual é resolvido ali mesmo (`addresseeId` preenchido) — cobre
 * tanto quem já tinha conta na hora do convite quanto quem se cadastrou
 * depois com aquele e-mail.
 */
export class LocalConnection
  implements
    domain.CreateConnection,
    domain.LoadAllConnections,
    domain.LoadAcceptedConnections,
    domain.RespondConnection,
    domain.DeleteConnection
{
  async invite(params: domain.CreateConnection.Params): Promise<{ id: string; error: string | null }> {
    const me = await requireCurrentUser();
    const email = params.email.trim().toLowerCase();

    if (email === me.email.toLowerCase()) {
      return { id: "", error: "Você não pode se convidar." };
    }

    const [existing] = await db
      .select({ id: connections.id, status: connections.status })
      .from(connections)
      .where(
        and(
          eq(connections.requesterId, me.id),
          eq(connections.addresseeEmail, email),
          or(eq(connections.status, "pending"), eq(connections.status, "accepted"))
        )
      )
      .limit(1);

    if (existing) {
      return { id: existing.id, error: "Você já tem um convite ou vínculo com esse e-mail." };
    }

    const [existingAccount] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const id = crypto.randomUUID();

    await db.insert(connections).values({
      id,
      requesterId: me.id,
      addresseeId: existingAccount?.id ?? null,
      addresseeEmail: email,
    });

    // Convite já existe no banco nesse ponto — o e-mail é só um aviso por
    // cima, nunca deve travar a resposta esperando o SMTP (o Gmail
    // demora bem mais que uma API de e-mail transacional dedicada, ver
    // `src/lib/email.ts`). Erro de envio só vai pro log do servidor, não
    // trava/mostra erro pra quem convidou — o vínculo já existe e some
    // pra pessoa convidada assim que ela entrar/criar conta com esse
    // e-mail de qualquer forma.
    sendEmail({
      to: email,
      subject: "Convite para colaborar no Gerencie-se",
      html: inviteEmailHtml({ inviterName: me.email, hasAccount: !!existingAccount }),
    }).then((result) => {
      if (result.error) console.error("[connections] falha ao enviar e-mail de convite:", result.error);
    });

    return { id, error: null };
  }

  async loadAll(): Promise<domain.LoadAllConnections.Model> {
    const me = await requireCurrentUser();

    // Resolve convites pendentes endereçados ao meu e-mail antes de listar
    // — cobre o caso de eu ter me cadastrado DEPOIS de alguém me convidar.
    await db
      .update(connections)
      .set({ addresseeId: me.id })
      .where(and(eq(connections.addresseeEmail, me.email.toLowerCase()), isNull(connections.addresseeId)));

    const rows = await db
      .select()
      .from(connections)
      .where(or(eq(connections.requesterId, me.id), eq(connections.addresseeId, me.id)));

    const otherPartyIds = rows
      .map((row) => (row.requesterId === me.id ? row.addresseeId : row.requesterId))
      .filter((id): id is string => !!id);

    const otherPartyUsers =
      otherPartyIds.length === 0
        ? []
        : await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, otherPartyIds));

    const userById = new Map(otherPartyUsers.map((user) => [user.id, user]));

    return rows.map((row) => {
      const isRequester = row.requesterId === me.id;
      const otherPersonUserId = isRequester ? row.addresseeId : row.requesterId;
      const otherPersonUser = otherPersonUserId ? userById.get(otherPersonUserId) : undefined;

      return {
        id: row.id,
        status: row.status,
        createdAt: row.createdAt,
        direction: isRequester ? "sent" : "received",
        otherPersonEmail: isRequester ? row.addresseeEmail : otherPersonUser?.email ?? "",
        otherPersonName: otherPersonUser?.name ?? null,
        otherPersonUserId: otherPersonUserId ?? null,
      };
    });
  }

  async loadAccepted(): Promise<domain.LoadAcceptedConnections.Model> {
    const all = await this.loadAll();

    return all
      .filter((connection) => connection.status === "accepted" && connection.otherPersonUserId)
      .map((connection) => ({
        userId: connection.otherPersonUserId as string,
        label: connection.otherPersonName || connection.otherPersonEmail,
      }));
  }

  async respond(params: domain.RespondConnection.Params): Promise<void> {
    const me = await requireCurrentUser();

    await db
      .update(connections)
      .set({
        status: params.accept ? "accepted" : "declined",
        respondedAt: new Date(),
      })
      .where(
        and(
          eq(connections.id, params.id),
          eq(connections.addresseeId, me.id),
          eq(connections.status, "pending")
        )
      );
  }

  async delete(params: domain.DeleteConnection.Params): Promise<void> {
    const me = await requireCurrentUser();

    await db
      .delete(connections)
      .where(
        and(
          eq(connections.id, params.id),
          or(eq(connections.requesterId, me.id), eq(connections.addresseeId, me.id))
        )
      );
  }
}
