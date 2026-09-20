import { NextResponse } from "next/server";
import { and, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { tasks, taskReminderSent, users, userPreferences } from "@/db/schema";
import { isValidCronSecret } from "@/lib/integrations/cron-auth";
import { sendPushToUser } from "@/lib/notifications/web-push";
import { sendEmail } from "@/lib/email";
import { deserializeReminders } from "@/features/tasks/data/local-task";
import { computeDueReminders, reminderSentKey, ReminderCandidateTask } from "@/features/tasks/domain/due-reminders";
import { renderTaskReminderEmail } from "@/features/tasks/reminder-email-template";

/**
 * Dispara push (Web Push, chega mesmo com o navegador fechado) para
 * lembretes de tarefa que acabaram de vencer — pensado pra ser chamado a
 * cada poucos minutos por um agendador EXTERNO (mesma ideia de
 * `/api/cron/weekly-summary`; ver `docs/DEPLOY.md`). Reenviar o mesmo
 * (tarefa, offset) nunca acontece de propósito: `task_reminder_sent`
 * guarda o que já foi mandado (ver `computeDueReminders`).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado — lembretes por push estão desligados." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronSecret(authHeader, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const candidateRows = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      scheduledAt: tasks.scheduledAt,
      reminderOffsetsMinutes: tasks.reminderOffsetsMinutes,
    })
    .from(tasks)
    .where(and(eq(tasks.completed, false), isNotNull(tasks.scheduledAt), isNotNull(tasks.reminderOffsetsMinutes)));

  const candidateTasks: ReminderCandidateTask[] = candidateRows
    .map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      scheduledAt: row.scheduledAt as string,
      reminderOffsetsMinutes: deserializeReminders(row.reminderOffsetsMinutes) ?? [],
    }))
    .filter((task) => task.reminderOffsetsMinutes.length > 0);

  if (candidateTasks.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const sentRows = await db
    .select({ taskId: taskReminderSent.taskId, offsetMinutes: taskReminderSent.offsetMinutes })
    .from(taskReminderSent)
    .where(
      inArray(
        taskReminderSent.taskId,
        candidateTasks.map((task) => task.id)
      )
    );
  const alreadySent = new Set(sentRows.map((row) => reminderSentKey(row.taskId, row.offsetMinutes)));

  const due = computeDueReminders(candidateTasks, alreadySent);

  // Quem optou pelo 2º canal (e-mail, `Configurações → Notificações`) —
  // consulta restrita só aos usuários realmente envolvidos neste lote,
  // não a tabela inteira.
  const dueUserIds = [...new Set(due.map((reminder) => reminder.userId))];
  const emailOptInRows =
    dueUserIds.length > 0
      ? await db
          .select({ userId: users.id, email: users.email, emailTaskReminders: userPreferences.emailTaskReminders })
          .from(users)
          .innerJoin(userPreferences, eq(userPreferences.userId, users.id))
          .where(and(inArray(users.id, dueUserIds), eq(userPreferences.emailTaskReminders, true)))
      : [];
  const emailByUserId = new Map(
    emailOptInRows.filter((row) => row.email).map((row) => [row.userId, row.email as string])
  );

  await Promise.all(
    due.map(async (reminder) => {
      // Reserva o envio ANTES de mandar o push — mesmo que `sendPushToUser`
      // falhe ou demore, uma segunda chamada do cron (ex.: reexecução
      // manual) nunca manda o mesmo lembrete duas vezes.
      await db
        .insert(taskReminderSent)
        .values({ taskId: reminder.taskId, offsetMinutes: reminder.offsetMinutes })
        .onConflictDoNothing();

      const label =
        reminder.offsetMinutes === 0
          ? "Começa agora"
          : reminder.offsetMinutes < 60
            ? `Em ${reminder.offsetMinutes} min`
            : `Em ${Math.round(reminder.offsetMinutes / 60)}h`;

      const email = emailByUserId.get(reminder.userId);

      await Promise.all([
        sendPushToUser(reminder.userId, {
          title: reminder.title,
          body: label,
          tag: `task-${reminder.taskId}-${reminder.offsetMinutes}`,
          url: "/home/tasks",
        }),
        email
          ? sendEmail({
              to: email,
              subject: `Lembrete: ${reminder.title}`,
              html: renderTaskReminderEmail(reminder.title, label),
            })
          : Promise.resolve(),
      ]);
    })
  );

  return NextResponse.json({ sent: due.length });
}
