import { HeatmapWeek } from "./build-habit-heatmap";

export interface ConsistencyWeekPoint {
  /** Domingo da semana (ver `buildHabitHeatmap` — mesma convenção). */
  weekStartDate: string;
  weekEndDate: string;
  /** Média de conclusão da semana, 0–100 — só considera dias que já
   * aconteceram (uma semana em andamento não fica artificialmente baixa
   * só por ainda ter dias futuros sem chance de serem marcados). */
  percent: number;
}

/**
 * Agrega a grade dia-a-dia (`buildHabitHeatmap`) em um ponto por semana —
 * a mesma fonte de dados do mapa de calor antigo, só que resumida pra um
 * gráfico de tendência (ver `HabitConsistencyChart`), bem mais fácil de
 * ler que uma grade de quadrados coloridos pra quem não é dev.
 */
export function buildHabitConsistencyTrend(weeks: HeatmapWeek[]): ConsistencyWeekPoint[] {
  return weeks.map((week) => {
    const pastDays = week.filter((day) => !day.isFuture);
    const average =
      pastDays.length > 0
        ? pastDays.reduce((sum, day) => sum + Math.min(day.ratio, 1), 0) / pastDays.length
        : 0;

    return {
      weekStartDate: week[0].date,
      weekEndDate: week[6].date,
      percent: Math.round(average * 100),
    };
  });
}
