import dayjs from "dayjs";

import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { HabitHeatmap } from "./components/habit-heatmap";

import { HabitsHeader, HabitsList } from "./components";

import styles from "./habits.module.css";

// 52 semanas = ~1 ano de histórico, em 2 páginas de 26 semanas (6 meses)
// cada no mapa de calor.
const HEATMAP_WEEKS_BACK = 52;

export async function Habits() {
  const [habitsList, goalsList, connections, completionDates] = await Promise.all([
    getHabitFetcher().loadAll(),
    getGoalFetcher().loadAll(),
    getConnectionFetcher().loadAccepted(),
    getHabitFetcher().loadCompletionDatesInRange(dayjs().subtract(HEATMAP_WEEKS_BACK, "week").toDate()),
  ]);

  const goalOptions = goalsList.map((goal) => ({ id: goal.id, title: goal.title }));

  return (
    <section className={styles.section}>
      <HabitsHeader connections={connections} goalOptions={goalOptions} />
      <HabitsList habitsList={habitsList} connections={connections} goalOptions={goalOptions} />

      {habitsList.length > 0 && (
        <div className={styles.heatmapSection}>
          <h2 className={styles.heatmapTitle}>Consistência</h2>
          <HabitHeatmap
            completionDates={completionDates}
            totalHabits={habitsList.length}
            fetchedWeeksBack={HEATMAP_WEEKS_BACK}
          />
        </div>
      )}
    </section>
  );
}
