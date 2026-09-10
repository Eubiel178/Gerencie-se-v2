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
