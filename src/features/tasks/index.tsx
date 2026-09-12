import { requireUserId } from "@/lib/require-user-id";
import { isGoogleCalendarConnected } from "@/lib/google-calendar";
import { syncTasksFromGoogle } from "@/features/tasks/sync";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";

import { getTaskFetcher } from "./data/get-task-fetcher";

import { Section, TasksList, TasksListHeader } from "./components";

// Reexports pra permitir `import { X } from "@/features/tasks"` em vez
// de caminhos profundos.
export * from "./domain";
export * from "./actions";
export * from "./filter-tasks";
export * from "./sort-tasks";
export * from "./task-store";
export * from "./sync";
export { getTaskFetcher } from "./data/get-task-fetcher";
export { useFormTags } from "./hooks/use-form-tags";
export { TaskReminders } from "./components/reminder-scheduler";
export { NotificationsToggle } from "./components/reminder-scheduler/notifications-toggle";
export { AttachmentsField } from "./components/attachments-field";

export async function Home() {
  const fetcher = getTaskFetcher();

  const userId = await requireUserId();
  const isGoogleConnected = await isGoogleCalendarConnected(userId);

  // Sincronização Google→App: feita aqui, a cada carregamento da Home,
  // porque o app roda localmente sem domínio público pra receber webhooks
  // do Google (decisão de polling já aprovada no plano). Só tarefas com
  // vínculo prévio (`googleEventId`) são checadas — nunca importamos a
  // agenda inteira do usuário.
  if (isGoogleConnected) {
    const tasksBeforeSync = await fetcher.loadAll();
    await syncTasksFromGoogle(tasksBeforeSync, fetcher);
  }

  const [tasksList, connections] = await Promise.all([
    fetcher.loadAll(),
    getConnectionFetcher().loadAccepted(),
  ]);

  return (
    <Section>
      <TasksListHeader isGoogleConnected={isGoogleConnected} connections={connections} />

      <TasksList tasksList={tasksList} isGoogleConnected={isGoogleConnected} connections={connections} />
    </Section>
  );
}
