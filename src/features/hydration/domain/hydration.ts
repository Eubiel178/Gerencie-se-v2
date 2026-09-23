export interface IHydrationLog {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  amountMl: number;
  loggedAt: Date;
}

// Resumo do dia — soma dos registros + meta do usuário, sempre calculado
// na hora (nunca guardado).
export interface IHydrationSummary {
  date: string;
  totalMl: number;
  goalMl: number;
  logs: IHydrationLog[];
}

export interface IHydrationDay {
  date: string; // "YYYY-MM-DD"
  totalMl: number;
}

/** % da meta batida hoje, sempre travado em 100 (beber além da meta não
 * estoura a barra visual) — repetido antes entre o tracker e o mini-widget
 * do dashboard. */
export function calculateHydrationGoalPercent(day: Pick<IHydrationSummary, "totalMl" | "goalMl">): number {
  if (day.goalMl <= 0) return 0;
  return Math.min(100, Math.round((day.totalMl / day.goalMl) * 100));
}
