export type ConnectionStatus = "pending" | "accepted" | "declined";

/**
 * Vínculo de colaboração entre duas contas (ex.: casal, família) — uma vez
 * aceito, cada pessoa pode escolher compartilhar tarefas/rotina/hábitos/
 * metas específicos com a outra (ver `sharedWithUserId` em cada domínio).
 * Nunca dá acesso a Hidratação, Corrida, Saúde ou Ciclo Menstrual — esses
 * continuam sempre privados, por serem dados mais sensíveis.
 */
export interface IConnection {
  id: string;
  status: ConnectionStatus;
  createdAt: Date;

  // Calculados a partir do ponto de vista de quem está logado — nunca
  // guardados assim no banco (a linha em si só tem requesterId/addresseeId).
  direction: "sent" | "received";
  otherPersonEmail: string;
  otherPersonName: string | null;
  otherPersonUserId: string | null;
}
