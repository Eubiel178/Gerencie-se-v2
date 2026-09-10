import dayjs, { Dayjs } from "dayjs";

export interface HabitStats {
  completedToday: boolean;
  currentStreak: number;
  completionsThisWeek: number;
}

/**
 * Calcula sequência (streak), conclusão de hoje e conclusões nos últimos
 * 7 dias a partir do conjunto de datas ("YYYY-MM-DD") em que o hábito foi
 * marcado como concluído. Função pura — sem banco, sem `server-only` —
 * para poder ser testada sem subir um Postgres (ver `streak.test.ts`).
 *
 * `now` é injetável para os testes serem determinísticos; em produção
 * (`LocalHabit.loadAll`) sempre é o momento real.
 */
export function calculateHabitStats(completedDates: Set<string>, now: Dayjs = dayjs()): HabitStats {
  const todayKey = now.format("YYYY-MM-DD");
  const completedToday = completedDates.has(todayKey);

  // Sequência "perdoa" o dia atual ainda não marcado (o dia não acabou) —
  // só quebra a sequência se ONTEM também estiver faltando.
  let cursor = completedToday ? now : now.subtract(1, "day");
  let currentStreak = 0;

  while (completedDates.has(cursor.format("YYYY-MM-DD"))) {
    currentStreak += 1;
    cursor = cursor.subtract(1, "day");
  }

  let completionsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    if (completedDates.has(now.subtract(i, "day").format("YYYY-MM-DD"))) {
      completionsThisWeek += 1;
    }
  }

  return { completedToday, currentStreak, completionsThisWeek };
}
