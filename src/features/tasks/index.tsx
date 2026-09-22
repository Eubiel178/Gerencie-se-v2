import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { syncTasksFromGoogle } from "@/features/tasks/sync";
import { requireUserId } from "@/lib/auth";
import { isGoogleCalendarConnected } from "@/lib/integrations/google-calendar";

import { Section, TasksList, TasksListHeader } from "./components";
import { getTaskFetcher } from "./data/get-task-fetcher";

export async function Home() {
  const fetcher = getTaskFetcher();

  // Independente de tudo abaixo (nunca depende de tarefas/sincronização
  // Google) - dispara em paralelo em vez de só começar depois que o resto
  // termina. Achado real: essa cadeia inteira, serializada, era a causa
  // do lag percebido navegando pra esta página (ex.: passo do tour que
  // aponta pra "Nova Tarefa") - `getConnectionFetcher().loadAccepted()`
  // não precisava esperar a volta e meia de rede do Google Agenda pra
  // sequer começar.
  const connectionsPromise = getConnectionFetcher().loadAccepted();

  const userId = await requireUserId();
  const isGoogleConnected = await isGoogleCalendarConnected(userId);

  let tasksList = await fetcher.loadAll();

  // Sincronização Google→App: feita aqui, a cada carregamento da Home,
  // porque o app roda localmente sem domínio público pra receber webhooks
  // do Google (decisão de polling já aprovada no plano). Só tarefas com
  // vínculo prévio (`googleEventId`) são checadas — nunca importamos a
  // agenda inteira do usuário. Só recarrega a lista quando há de fato uma
  // sincronização a considerar (nunca uma segunda consulta à toa pra
  // quem não conectou o Google Agenda).
  if (isGoogleConnected) {
    await syncTasksFromGoogle(tasksList, fetcher);
    tasksList = await fetcher.loadAll();
  }

  const connections = await connectionsPromise;

  return (
    <Section>
      <TasksListHeader isGoogleConnected={isGoogleConnected} connections={connections} />

      <TasksList tasksList={tasksList} isGoogleConnected={isGoogleConnected} connections={connections} />
    </Section>
  );
}
