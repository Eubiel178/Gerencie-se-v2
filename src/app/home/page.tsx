import { getTaskAll } from "@/services/task";

import { Section, TasksList, TasksListHeader } from "@/components/home";
import { TaskListProvider } from "@/providers/TasksListContext";

const Home = async () => {
  const tasks = await getTaskAll();

  return (
    <Section>
      <TaskListProvider>
        <TasksListHeader />
        <TasksList tasksList={tasks} />
      </TaskListProvider>
    </Section>
  );
};

export default Home;
