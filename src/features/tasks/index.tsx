import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { syncTasksFromGoogle } from "@/features/tasks/sync";
import { requireUserId } from "@/lib/auth";
import { isGoogleCalendarConnected } from "@/lib/integrations/google-calendar";

import { Section, TasksList, TasksListHeader } from "./components";
import { getTaskFetcher } from "./data/get-task-fetcher";

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
