import dayjs from "dayjs";

import { auth } from "@/lib/auth";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";
import { getOnboardingStatus } from "@/features/onboarding/get-onboarding-status";
import { OnboardingChecklist } from "@/features/onboarding/components/onboarding-checklist";
import { getAchievementsStatus } from "@/features/achievements/get-achievements-status";
import { AchievementToasts } from "@/features/achievements/components/achievement-toasts";

import {
  GoalsProgress,
  Greeting,
  HabitsToday,
  HydrationMini,
  MascotCard,
  NextAction,
  TasksSummary,
} from "./components";
import { buildNextAction } from "./next-action";
import { greetingForHour } from "./greeting";

import styles from "./styles.module.css";

// Reexports pra permitir `import { X } from "@/features/dashboard"` em
// vez de caminhos profundos.
export * from "./components/shared";
export { buildNextAction } from "./next-action";

const PRIORITY_RANK = { critica: 3, alta: 2, media: 1, baixa: 0 } as const;

export async function Dashboard() {
  const [session, tasks, routine, habits, goals, mascot, hydrationToday] = await Promise.all([
    auth(),
    getTaskFetcher().loadAll(),
    getRoutineFetcher().loadAll(),
    getHabitFetcher().loadAll(),
    getGoalFetcher().loadAll(),
    getMascotFetcher().getMascot(),
    getHydrationFetcher().getToday(),
  ]);

  const onboarding = await getOnboardingStatus({ tasks, habits, goals, mascot });
  const achievementsStatus = await getAchievementsStatus({ tasks, habits, goals });

  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  const nextAction = buildNextAction({ tasks, routine, habits });

  const pendingTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
    .slice(0, 5);

  const activeGoals = [...goals]
    .filter((goal) => !goal.archived)
    .sort((a, b) => a.progressPercent - b.progressPercent)
    .slice(0, 3);

  // Capado no mesmo padrão de `pendingTasks`/`activeGoals` acima — sem
  // isso, uma lista de hábitos realista (8-15 itens) esticava essa
  // coluna do grid muito além da coluna ao lado (capada), forçando
  // scroll vertical na página inteira mesmo com conteúdo cabendo na tela
  // (achado numa auditoria de layout). Pendente hoje primeiro, é o que
  // precisa de atenção.
  const dashboardHabits = [...habits]
    .filter((habit) => !habit.archived)
    .sort((a, b) => Number(a.completedToday) - Number(b.completedToday))
    .slice(0, 5);

  const now = dayjs();
  const today = now.format("YYYY-MM-DD");

  const priorityTaskCount = tasks.filter(
    (task) => !task.completed && (task.priority === "alta" || task.priority === "critica")
  ).length;
  const pendingHabitCount = habits.filter(
    (habit) => !habit.archived && !habit.completedToday
  ).length;

  return (
    <div className={styles.grid}>
      <AchievementToasts items={achievementsStatus.newlyUnlocked} />

      {/* O <h1> da página mora dentro de `Greeting` - precisa vir ANTES de
          qualquer <h2> no DOM (ex.: o "Primeiros passos" do checklist
          logo abaixo), senão quem navega por heading no leitor de tela
          encontra um H2 antes de qualquer H1 existir (ordem de leitura
          quebrada - achado numa auditoria de acessibilidade). O grid
          (`styles.module.css`) não tem `order`/`grid-row` próprios -
          a ordem visual segue exatamente esta ordem do JSX. */}
      <div className={styles.hero}>
        <Greeting
          text={greetingForHour(now.hour(), firstName)}
          priorityTaskCount={priorityTaskCount}
          pendingHabitCount={pendingHabitCount}
          mainGoal={activeGoals[0] ?? null}
        />

        <NextAction action={nextAction} />
      </div>

      {!onboarding.dismissed && !onboarding.allDone && (
        <div className={styles.onboarding} data-tour="checklist">
          <OnboardingChecklist items={onboarding.items} />
        </div>
      )}

      <div className={styles.column}>
        <TasksSummary tasks={pendingTasks} />
        <GoalsProgress goals={activeGoals} />
      </div>

      <div className={styles.column}>
        <HabitsToday habits={dashboardHabits} today={today} />
        <MascotCard mascot={mascot} />
        <HydrationMini today={hydrationToday} />
      </div>
    </div>
  );
}
