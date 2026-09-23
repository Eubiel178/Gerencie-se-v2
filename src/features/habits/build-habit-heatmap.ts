import dayjs, { Dayjs } from "dayjs";

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  count: number;
  /** count / totalHabits — 0 (nenhum), entre 0 e 1 (parcial), >=1 (dia
   * completo: todo hábito ativo foi marcado). */
  ratio: number;
  isFuture: boolean;
}

/** Uma semana = 7 dias (domingo a sábado), pra desenhar em colunas como o
 * gráfico de contribuições do GitHub — cada `week[i]` é uma coluna. */
export type HeatmapWeek = HeatmapDay[];

/** Função pura — monta a grade a partir das datas de conclusão já
 * buscadas (`LoadHabitCompletionsInRange`, uma entrada por hábito
 * concluído naquele dia — repetida a data conta quantos hábitos
 * diferentes bateram naquele dia). Sem banco, sem sessão, testável
 * isoladamente. */
export function buildHabitHeatmap(
  completionDates: string[],
  totalHabits: number,
  weeksBack: number = 26,
  now: Dayjs = dayjs()
): HeatmapWeek[] {
  const countByDate = new Map<string, number>();
  for (const date of completionDates) {
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  // Começa no domingo da semana mais antiga, pra toda coluna ter 7 dias
  // completos (mesma convenção do GitHub).
  const todayIndex = now.day(); // 0 (domingo) .. 6 (sábado)
  const gridEnd = now.add(6 - todayIndex, "day");
  const gridStart = gridEnd.subtract(weeksBack * 7 - 1, "day");

  const weeks: HeatmapWeek[] = [];
  const days: HeatmapDay[] = [];

  for (let i = 0; i < weeksBack * 7; i++) {
    const date = gridStart.add(i, "day");
    const dateKey = date.format("YYYY-MM-DD");
    const count = countByDate.get(dateKey) ?? 0;

    days.push({
      date: dateKey,
      count,
      ratio: totalHabits > 0 ? count / totalHabits : 0,
      isFuture: date.isAfter(now, "day"),
    });
  }

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}
