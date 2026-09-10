import { IHydrationDay, IHydrationSummary } from "./hydration";

export type GetTodayHydration = {
  getToday: () => Promise<IHydrationSummary>;
};

// Últimos 7 dias (incluindo hoje) — usado pra um gráfico/lista simples de
// consistência, nunca guardado, sempre somado de `hydration_log` na hora.
export type LoadWeekHydration = {
  loadWeek: () => Promise<IHydrationDay[]>;
};

export type UpdateHydrationGoal = {
  updateGoal: (dailyGoalMl: number) => Promise<void>;
};
