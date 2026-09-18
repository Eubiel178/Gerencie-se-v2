import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";

import { ReminderScheduler, type ReminderTask } from "./scheduler";

/** Renderizado uma vez no layout de /home/* (mesmo padrão do JARVIS) -
 * busca as tarefas com lembrete configurado e delega o agendamento em si
 * para o Client Component, que decide se pode notificar. */
export async function TaskReminders() {
  const tasks = await getTaskFetcher().loadReminderTasks();

  const reminderTasks: ReminderTask[] = tasks
    .filter(
      (task) =>
        !task.completed && task.scheduledAt && task.reminderOffsetsMinutes?.length
    )
    .map((task) => ({
      id: task.id,
      title: task.title,
      scheduledAt: task.scheduledAt as string,
      reminderOffsetsMinutes: task.reminderOffsetsMinutes ?? [],
    }));

  if (reminderTasks.length === 0) return null;

  return <ReminderScheduler tasks={reminderTasks} />;
}
