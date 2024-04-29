import { Section, TasksList, TasksListHeader } from "./components";

export function Home() {
  // const tasks = await getTaskAll();

  return (
    <Section>
      {/* <TaskListProvider> */}
      <TasksListHeader />
      <TasksList tasksList={[]} />
      {/* </TaskListProvider> */}
    </Section>
  );
}
