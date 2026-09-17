import { IGoal } from "@/features/goals/domain";

import styles from "./styles.module.css";

interface GreetingProps {
  text: string;
  priorityTaskCount: number;
  pendingHabitCount: number;
  mainGoal: IGoal | null;
}

/** Resumo diário (item 39 do plano): não é uma lista de tudo, é um
 * parágrafo curto com os números que importam pra decidir o dia — a
 * "próxima ação" (componente irmão) já cobre O QUE fazer agora; este
 * cobre QUANTO tem pela frente. */
export function Greeting({ text, priorityTaskCount, pendingHabitCount, mainGoal }: GreetingProps) {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>{text}</h1>

      <p className={styles.summary}>
        Hoje você tem{" "}
        <strong>
          {priorityTaskCount} {priorityTaskCount === 1 ? "tarefa prioritária" : "tarefas prioritárias"}
        </strong>{" "}
        e{" "}
        <strong>
          {pendingHabitCount} {pendingHabitCount === 1 ? "hábito pendente" : "hábitos pendentes"}
        </strong>
        .
        {mainGoal && (
          <>
            {" "}
            Meta principal: <strong>{mainGoal.title}</strong> ({mainGoal.progressPercent}%).
          </>
        )}
      </p>
    </div>
  );
}
