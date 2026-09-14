import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";

import { History, Timer } from "./components";

import styles from "./focus.module.css";

// Reexports pra permitir `import { X } from "@/features/focus"` em vez
// de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getFocusFetcher, getMascotFetcher } from "./data/get-focus-fetcher";
export { MascotSettings } from "./components/mascot-settings";

interface FocusProps {
  // Vem de `?taskId=...` (ver botão "Focar nesta tarefa" no card de
  // tarefa) - só usado pra pré-selecionar a tarefa quando NENHUMA sessão
  // já está rodando (ver abaixo).
  taskId?: string;
}

export async function Focus({ taskId }: FocusProps = {}) {
  const focusFetcher = getFocusFetcher();
  const mascotFetcher = getMascotFetcher();

  const [activeSession, mascot, history] = await Promise.all([
    focusFetcher.getActive(),
    mascotFetcher.getMascot(),
    focusFetcher.loadHistory(),
  ]);

  // Se já existe uma sessão rodando, a tarefa associada A ELA manda -
  // ignora o `?taskId=` da URL (só faz sentido pra começar uma sessão
  // nova). Só existe um foco por vez (ver `StartFocusSession`), então
  // nunca faz sentido os dois discordarem.
  const effectiveTaskId = activeSession ? activeSession.taskId : taskId;

  const task = effectiveTaskId ? await getTaskFetcher().getById(effectiveTaskId) : null;

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Focus Timer</h1>
        <p className={styles.subheading}>Escolha um tempo e mergulhe em uma única tarefa.</p>
      </div>

      <Timer initialSession={activeSession} mascot={mascot} task={task} />

      <div>
        <h2 className={styles.historyTitle}>Histórico</h2>
        <History sessions={history} />
      </div>
    </section>
  );
}
