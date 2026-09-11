export interface WeeklySummary {
  name: string | null;
  email: string;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
  focusHours: number;
  bestHabitStreak: number;
  avgGoalProgress: number;
  runningKm: number;
  mascotName: string;
  mascotLevel: number;
  mascotXpIntoLevel: number;
  mascotXpForNextLevel: number;
}
