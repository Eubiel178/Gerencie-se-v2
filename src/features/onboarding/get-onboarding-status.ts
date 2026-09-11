import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { isGoogleCalendarConnected } from "@/lib/google-calendar";

import { ITask } from "@/features/tasks/domain";
import { IHabit } from "@/features/habits/domain";
import { IGoal } from "@/features/goals/domain";
import { IMascotState } from "@/features/focus/domain";

export interface OnboardingItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

export interface OnboardingStatus {
  dismissed: boolean;
  items: OnboardingItem[];
  allDone: boolean;
}

/** Calculado a partir do MESMO dado que o Dashboard já busca (nunca uma
 * segunda consulta) — quem chama isso passa o que já tem em mãos. Só
 * `onboardingDismissed` e a conexão do Google Agenda vêm de uma busca à
 * parte, porque nenhum outro lugar do Dashboard já lê isso. */
export async function getOnboardingStatus(data: {
  tasks: ITask[];
  habits: IHabit[];
  goals: IGoal[];
  mascot: IMascotState;
}): Promise<OnboardingStatus> {
  const userId = await requireUserId();

  const [row, googleConnected] = await Promise.all([
    db
      .select({ onboardingDismissed: userPreferences.onboardingDismissed })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1),
    isGoogleCalendarConnected(userId),
  ]);

  const mascotCustomized =
    data.mascot.name !== "Chunchumaru" ||
    data.mascot.species !== "blob" ||
    data.mascot.personality !== "afetuoso";

  const items: OnboardingItem[] = [
    { id: "task", label: "Criar sua primeira tarefa", done: data.tasks.length > 0, href: "/home/tasks" },
    { id: "habit", label: "Criar seu primeiro hábito", done: data.habits.length > 0, href: "/home/habits" },
    { id: "goal", label: "Criar seu primeiro objetivo", done: data.goals.length > 0, href: "/home/goals" },
    { id: "mascot", label: "Personalizar o mascote", done: mascotCustomized, href: "/home/settings" },
    { id: "google", label: "Conectar o Google Agenda", done: googleConnected, href: "/home/settings" },
  ];

  return {
    dismissed: row[0]?.onboardingDismissed ?? false,
    items,
    allDone: items.every((item) => item.done),
  };
}
