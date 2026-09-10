import { Header } from "@/components";
import { Assistant } from "@/features/assistant";
import { TaskReminders } from "@/features/tasks/components/reminder-scheduler";
import styles from "./home-layout.module.css";

// As tarefas e eventos são dados dinâmicos e específicos de cada usuário —
// não fazem sentido pré-renderizados estaticamente no build. Isso também
// evita que uma falha de API no momento do build derrube o `next build`
// inteiro (o build só falharia se a API estivesse fora do ar em tempo de
// requisição real, e aí o `error.tsx` entra em ação).
export const dynamic = "force-dynamic";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.shell}>
      <Header />

      <main className={styles.main}>{children}</main>

      <Assistant />
      <TaskReminders />
    </div>
  );
};

export default HomeLayout;
