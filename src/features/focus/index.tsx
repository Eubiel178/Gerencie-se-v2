import Link from "next/link";

import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getCurrentUserTimezone } from "@/features/profile/get-user-timezone";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { sortTasksByPriority } from "@/features/tasks/sort-tasks";

import { History, Timer } from "./components";

import styles from "./styles.module.css";

// Reexports pra permitir `import { X } from "@/features/focus"` em vez
// de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getFocusFetcher, getMascotFetcher } from "./data/get-focus-fetcher";
export { MascotSettings } from "./components/mascot-settings";
export { FocusSessionProvider, useFocusSession } from "./focus-session-context";
export { FocusMiniWidget } from "./components/focus-mini-widget";

interface FocusProps {
  // Vem de `?taskId=...` (ver botão "Focar nesta tarefa" no card de
  // tarefa) - só usado pra pré-selecionar a tarefa quando NENHUMA sessão
  // já está rodando (ver abaixo).
  taskId?: string;
}

export async function Focus({ taskId }: FocusProps = {}) {
  const focusFetcher = getFocusFetcher();
  const mascotFetcher = getMascotFetcher();

  const [activeSession, mascot, history, allTasks, timeZone] = await Promise.all([
    focusFetcher.getActive(),
    mascotFetcher.getMascot(),
    focusFetcher.loadHistory(),
    getTaskFetcher().loadAll(),
    getCurrentUserTimezone(),
  ]);

  // Se já existe uma sessão rodando, a tarefa associada A ELA manda -
  // ignora o `?taskId=` da URL (só faz sentido pra começar uma sessão
  // nova). Só existe um foco por vez (ver `StartFocusSession`), então
  // nunca faz sentido os dois discordarem.
  const effectiveTaskId = activeSession ? activeSession.taskId : taskId;

  // `allTasks` já inclui tarefas compartilhadas COM o usuário (ver
  // `LoadAllTasks`), e o seletor abaixo (`pendingTasks`) oferece essas
  // tarefas como opção pra focar - então a busca do "task" atual também
  // precisa aceitar uma tarefa compartilhada, não só uma própria.
  // `getTaskFetcher().getById` é restrito a tarefas do próprio dono (ver
  // `LocalTask.getById`), o que fazia o nome da tarefa sumir da tela de
  // Foco sempre que a sessão era de uma tarefa compartilhada (achado numa
  // revisão de código) - reaproveitar `allTasks` corrige isso e evita uma
  // segunda consulta ao banco.
  const task = effectiveTaskId ? (allTasks.find((candidate) => candidate.id === effectiveTaskId) ?? null) : null;

  // Tarefas que a pessoa pode escolher direto aqui, sem precisar voltar pra
  // tela de Tarefas e clicar em "Focar nesta tarefa" primeiro.
  const pendingTasks = sortTasksByPriority(allTasks.filter((candidate) => !candidate.completed)).map(
    (candidate) => ({ id: candidate.id, title: candidate.title })
  );

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Foco</h1>
        <p className={styles.subheading}>Escolha um tempo e mergulhe em uma única tarefa.</p>
      </div>

      <Timer mascot={mascot} task={task} pendingTasks={pendingTasks} />

      <div>
        {/* Só as últimas 10 sessões (ver `LocalFocusSession.loadHistory`) -
            de propósito curto pra não virar uma lista sem fim aqui; quem
            quiser o histórico completo e quanto tempo foi pra cada tarefa
            encontra em Estatísticas. */}
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Histórico</h2>
          <Link href="/home/stats" className={styles.historyLink}>
            Ver relatório completo
          </Link>
        </div>
        <History sessions={history} timeZone={timeZone} />
      </div>
    </section>
  );
}
