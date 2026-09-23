import "server-only";

import { LocalTask } from "@/features/tasks/data";
import { ITask } from "@/features/tasks/domain";
import {
  createCalendarEventForTask,
  deleteCalendarEventForTask,
  getCalendarEventSnapshot,
  isGoogleCalendarConnected,
  updateCalendarEventForTask,
} from "@/lib/integrations/google-calendar";

/**
 * Orquestra a sincronização App→Google de UMA tarefa, chamada depois que
 * ela já foi salva localmente (criada ou editada) — a tarefa NUNCA deixa
 * de ser salva por causa do Google; o pior caso é ficar com
 * `syncStatus: "ERROR"` e poder ser tentada de novo depois (retry).
 *
 * Regras (documentadas no relatório final):
 * - `syncEnabled` desmarcado + havia vínculo → apaga o evento no Google e
 *   desfaz o vínculo (a tarefa continua existindo só no app).
 * - `syncEnabled` marcado sem vínculo → cria o evento.
 * - `syncEnabled` marcado com vínculo → atualiza o evento existente.
 * - Qualquer falha de rede/API do Google não é propagada como erro da
 *   action — fica registrada em `syncStatus`/`syncError` na própria tarefa.
 */
export async function syncTaskToGoogle(
  task: ITask,
  repo: LocalTask
): Promise<void> {
  if (!task.syncEnabled) {
    if (task.googleEventId) {
      try {
        await deleteCalendarEventForTask(task.userId, task.googleEventId);
      } catch {
        // Best-effort — mesmo se a exclusão no Google falhar, seguimos
        // desfazendo o vínculo local: o usuário pediu para não sincronizar
        // mais essa tarefa, e isso precisa "colar" no app independente do
        // que acontecer do lado do Google.
      }
    }

    await repo.updateSyncState({
      id: task.id,
      googleEventId: null,
      syncStatus: "NONE",
      syncError: null,
      googleEventUpdatedAt: null,
    });

    return;
  }

  if (!task.scheduledAt) {
    await repo.updateSyncState({
      id: task.id,
      googleEventId: task.googleEventId ?? null,
      syncStatus: "ERROR",
      syncError: "Informe data e hora para sincronizar com o Google Agenda.",
    });

    return;
  }

  const connected = await isGoogleCalendarConnected(task.userId);

  if (!connected) {
    await repo.updateSyncState({
      id: task.id,
      googleEventId: task.googleEventId ?? null,
      syncStatus: "ERROR",
      syncError: "Google Agenda não está conectado.",
    });

    return;
  }

  const eventPayload = {
    title: task.title,
    description: task.description,
    scheduledAt: task.scheduledAt,
  };

  try {
    if (task.googleEventId) {
      const { updatedAt } = await updateCalendarEventForTask(
        task.userId,
        task.googleEventId,
        eventPayload
      );

      await repo.updateSyncState({
        id: task.id,
        googleEventId: task.googleEventId,
        syncStatus: "SYNCED",
        syncError: null,
        googleEventUpdatedAt: updatedAt,
      });
    } else {
      const { eventId, updatedAt } = await createCalendarEventForTask(
        task.userId,
        eventPayload
      );

      await repo.updateSyncState({
        id: task.id,
        googleEventId: eventId,
        syncStatus: "SYNCED",
        syncError: null,
        googleEventUpdatedAt: updatedAt,
      });
    }
  } catch {
    await repo.updateSyncState({
      id: task.id,
      googleEventId: task.googleEventId ?? null,
      syncStatus: "ERROR",
      syncError:
        "Não foi possível sincronizar com o Google Agenda. Tente novamente.",
    });
  }
}

/**
 * Sincronização Google→App: para cada tarefa vinculada, busca o evento
 * correspondente e aplica mudanças de título/descrição/data-hora feitas
 * diretamente no Google. Nunca importa eventos que não têm vínculo prévio
 * com uma tarefa (isso violaria a regra explícita de não importar a agenda
 * inteira).
 *
 * Modo de disparo: como o app roda localmente sem domínio público (não dá
 * pra receber webhooks do Google), a sincronização reversa é feita por
 * POLLING disparado a cada carregamento da página Home — não é um
 * agendamento em segundo plano de verdade, é best-effort a cada visita.
 * Documentado como limitação conhecida no relatório final.
 */
export async function syncTasksFromGoogle(
  tasks: ITask[],
  repo: LocalTask
): Promise<void> {
  const linkedTasks = tasks.filter(
    (task) => task.syncEnabled && task.googleEventId
  );

  if (linkedTasks.length === 0) return;

  await Promise.all(
    linkedTasks.map(async (task) => {
      if (!task.googleEventId) return;

      try {
        const snapshot = await getCalendarEventSnapshot(
          task.userId,
          task.googleEventId
        );

        if (snapshot === null) {
          // Evento foi excluído no Google — desfaz o vínculo, mas a
          // tarefa continua existindo no app (nunca perdemos a tarefa).
          await repo.unlinkFromGoogle(task.id);
          return;
        }

        const lastKnownUpdate = task.googleEventUpdatedAt ?? null;

        const hasChanged =
          !lastKnownUpdate || snapshot.updatedAt > lastKnownUpdate;

        if (!hasChanged) return;

        await repo.applyGoogleUpdate({
          id: task.id,
          title: snapshot.title || task.title,
          description: snapshot.description,
          scheduledAt: snapshot.scheduledAt,
          googleEventUpdatedAt: snapshot.updatedAt,
        });
      } catch {
        // Falha ao consultar o Google (rede, token expirado sem refresh
        // válido, etc.) nunca deve quebrar o carregamento da página — a
        // tarefa simplesmente não é atualizada nesta rodada de polling.
      }
    })
  );
}
