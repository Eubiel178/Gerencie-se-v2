import { getTaskAll } from "@/services/task";

import { Section, TasksList, TasksListHeader } from "@/components/home";

const Home = async () => {
  const tasks = await getTaskAll();

  return (
    <Section>
      <TasksListHeader />
      <TasksList tasksList={tasks} />
    </Section>
  );
};

export default Home;
