import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";

import { RoutineHeader, RoutineList } from "./components";

import styles from "./routine.module.css";

export async function Routine() {
  const routineFetcher = getRoutineFetcher();
  const taskFetcher = getTaskFetcher();

  const [items, tasks, connections] = await Promise.all([
    routineFetcher.loadAll(),
    taskFetcher.loadAll(),
    getConnectionFetcher().loadAccepted(),
  ]);

  const taskOptions = tasks.map((task) => ({ id: task.id, title: task.title }));

  return (
    <section className={styles.section}>
      <RoutineHeader taskOptions={taskOptions} connections={connections} />
      <RoutineList items={items} taskOptions={taskOptions} connections={connections} />
    </section>
  );
}
