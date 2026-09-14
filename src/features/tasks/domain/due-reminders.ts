export interface ReminderCandidateTask {
  id: string;
  userId: string;
  title: string;
  scheduledAt: string;
  reminderOffsetsMinutes: number[];
}

export interface DueReminder {
  taskId: string;
  userId: string;
  title: string;
  offsetMinutes: number;
}

// Se o cron ficar fora do ar (ou o job do cron-job.org falhar) por mais
// que isso, o lembrete perdido não é mais mandado — melhor silenciar do
// que avisar "faltam 5 min" horas depois de a tarefa já ter passado.
const MAX_STALENESS_MS = 2 * 60 * 60 * 1000;

export function reminderSentKey(taskId: string, offsetMinutes: number): string {
  return `${taskId}:${offsetMinutes}`;
}

/**
 * Função pura: dado o estado atual (tarefas candidatas + o que já foi
 * enviado), decide quais (tarefa, offset) devem disparar push agora. Não
 * toca banco nem rede — só a regra "já passou da hora, ainda não é tarde
 * demais, e ainda não foi enviado" — pra poder testar sem servidor/DB
 * (ver `send-push-reminders` route, que só busca os dados e chama isto).
 */
export function computeDueReminders(
  tasks: ReminderCandidateTask[],
  alreadySent: ReadonlySet<string>,
  now: Date = new Date()
): DueReminder[] {
  const nowMs = now.getTime();
  const due: DueReminder[] = [];

  for (const task of tasks) {
    const scheduledMs = new Date(task.scheduledAt).getTime();
    if (Number.isNaN(scheduledMs)) continue;

    for (const offsetMinutes of task.reminderOffsetsMinutes) {
      if (alreadySent.has(reminderSentKey(task.id, offsetMinutes))) continue;

      const fireAtMs = scheduledMs - offsetMinutes * 60 * 1000;
      if (fireAtMs > nowMs) continue;
      if (fireAtMs <= nowMs - MAX_STALENESS_MS) continue;

      due.push({ taskId: task.id, userId: task.userId, title: task.title, offsetMinutes });
    }
  }

  return due;
}
