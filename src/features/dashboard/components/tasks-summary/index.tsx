import Link from "next/link";

import { EmptyState } from "@/components";
import { Badge, Card } from "@/features/dashboard/components/shared";

import { ITask } from "@/features/tasks/domain";
import { PRIORITY_LABELS } from "@/lib/shared/priority";

import styles from "./styles.module.css";

const PRIORITY_TONE: Record<ITask["priority"], "danger" | "warning" | "info" | "neutral"> = {
  critica: "danger",
  alta: "warning",
  media: "info",
  baixa: "neutral",
};

export function TasksSummary({ tasks }: { tasks: ITask[] }) {
  return (
    <Card title="Tarefas pendentes" href="/home/tasks" linkLabel="Ver todas">
      {tasks.length === 0 ? (
        <EmptyState tone="muted">Tudo em dia: não há tarefas pendentes agora. 🎉</EmptyState>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id} className={styles.item}>
              <Link href="/home/tasks" className={styles.link}>
                {task.title}
              </Link>
              <Badge tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
