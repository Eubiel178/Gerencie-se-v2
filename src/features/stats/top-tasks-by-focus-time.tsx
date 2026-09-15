import { TaskFocusTime } from "./calculations";

import styles from "./stats.module.css";

interface TopTasksByFocusTimeProps {
  tasks: TaskFocusTime[];
}

/**
 * Ranking horizontal (maior barra = mais tempo) das tarefas em que mais se
 * focou — de propósito não é um gráfico de evolução no tempo (isso já é o
 * resto da tela, ver `FocusWeeksChart`): aqui a pergunta é "em que eu mais
 * gastei meu tempo de foco", não "quando".
 */
export function TopTasksByFocusTime({ tasks }: TopTasksByFocusTimeProps) {
  if (tasks.length === 0) {
    return <p className={styles.hint}>Nenhuma sessão de foco associada a uma tarefa ainda.</p>;
  }

  const maxMinutes = Math.max(...tasks.map((task) => task.totalMinutes));

  return (
    <ul className={styles.taskTimeList}>
      {tasks.map((task) => (
        <li key={task.taskId} className={styles.taskTimeRow}>
          <span className={styles.taskTimeTitle}>{task.title}</span>

          <div className={styles.taskTimeBarTrack}>
            <div
              className={styles.taskTimeBarFill}
              style={{ width: `${Math.max(4, (task.totalMinutes / maxMinutes) * 100)}%` }}
              aria-hidden="true"
            />
          </div>

          <span className={styles.taskTimeMinutes}>{formatMinutes(task.totalMinutes)}</span>
        </li>
      ))}
    </ul>
  );
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h${minutes}min`;
}
