import { useTask } from "../hooks/use-task";

import { Section, TasksList, TasksListHeader } from "./components";

export async function Home() {
  const { fetcher } = useTask();

  const tasksList = await fetcher.loadAll({ id: "1" });

  return (
    <Section>
      <TasksListHeader />

      <TasksList tasksList={tasksList} />
    </Section>
  );
}
