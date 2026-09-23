import dayjs from "dayjs";

import { IAssistantMessage } from "@/features/assistant/domain";

import { IAssistantContext } from "./context";
import { InsightFact, phraseInsight } from "./insight-phrasing";

/**
 * Interface do "cérebro" do assistente — trocável no futuro (ex.: um
 * provedor que chame um modelo de IA de verdade por trás de uma rota da
 * própria API, nunca direto do cliente). Hoje só existe a implementação
 * baseada em regras abaixo, sem custo de IA nenhum, mas qualquer código
 * que dependa de `IAssistantProvider` funciona com qualquer implementação
 * futura sem mudar.
 */
export interface IAssistantProvider {
  buildMessages(context: IAssistantContext): IAssistantMessage[];
}

const OVERLOAD_THRESHOLD = 8;
const STREAK_HIGHLIGHT_MIN = 3;
const DEADLINE_WARNING_DAYS = 3;

/**
 * Gera mensagens sempre a partir de dado real (nunca frases motivacionais
 * genéricas) — ver item 25 do briefing original. Cada regra é
 * independente; `AssistantService` escolhe qual mostrar (`pickTopMessage`).
 */
export class RuleBasedAssistantProvider implements IAssistantProvider {
  buildMessages(context: IAssistantContext): IAssistantMessage[] {
    const now = dayjs(context.now ?? new Date());
    const personality = context.mascot.personality;
    const messages: IAssistantMessage[] = [];

    // Mesmo `id`/`tone` de sempre pra decidir prioridade (`pickTopMessage`)
    // — só o `text` muda de acordo com a personalidade (ver
    // `insight-phrasing.ts`), nunca o fato por trás dele.
    function push(id: string, tone: IAssistantMessage["tone"], fact: InsightFact) {
      messages.push({ id, tone, text: phraseInsight(fact, personality) });
    }

    const pendingTasks = context.tasks.filter((task) => !task.completed);
    const overdueTasks = pendingTasks.filter(
      (task) => task.scheduledAt && dayjs(task.scheduledAt).isBefore(now)
    );

    if (overdueTasks.length > 0) {
      push("overdue-tasks", "warning", {
        kind: "overdue-tasks",
        count: overdueTasks.length,
        oldestTitle: overdueTasks[0].title,
      });
    }

    const priorityTasks = context.tasks.filter(
      (task) => task.priority === "alta" || task.priority === "critica"
    );

    if (priorityTasks.length > 0) {
      const donePriority = priorityTasks.filter((task) => task.completed).length;

      if (donePriority === priorityTasks.length) {
        push("priority-tasks-done", "success", {
          kind: "priority-tasks-done",
          count: priorityTasks.length,
        });
      } else if (donePriority > 0) {
        push("priority-tasks-progress", "info", {
          kind: "priority-tasks-progress",
          done: donePriority,
          total: priorityTasks.length,
        });
      }
    }

    if (pendingTasks.length > OVERLOAD_THRESHOLD) {
      push("task-overload", "warning", { kind: "task-overload", count: pendingTasks.length });
    }

    const bestStreak = context.habits
      .filter((habit) => habit.frequency === "daily" && !habit.completedToday)
      .sort((a, b) => b.currentStreak - a.currentStreak)[0];

    if (bestStreak && bestStreak.currentStreak >= STREAK_HIGHLIGHT_MIN) {
      push("habit-streak-at-risk", "warning", {
        kind: "habit-streak-at-risk",
        title: bestStreak.title,
        streak: bestStreak.currentStreak,
      });
    }

    const urgentGoal = context.goals
      .filter((goal) => !goal.archived && goal.deadline && goal.progressPercent < 100)
      .map((goal) => ({ goal, daysLeft: dayjs(goal.deadline).diff(now, "day") }))
      .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= DEADLINE_WARNING_DAYS)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0];

    if (urgentGoal) {
      const { goal, daysLeft } = urgentGoal;
      push("goal-deadline-near", "warning", {
        kind: "goal-deadline-near",
        title: goal.title,
        daysLeft,
        progress: goal.progressPercent,
      });
    }

    const currentTime = now.format("HH:mm");
    const nextRoutineItem = [...context.routine]
      .filter((item) => item.time >= currentTime)
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    if (nextRoutineItem && messages.length === 0) {
      push("next-routine-item", "info", {
        kind: "next-routine-item",
        time: nextRoutineItem.time,
        title: nextRoutineItem.title,
      });
    }

    if (messages.length === 0 && pendingTasks.length === 0) {
      push("all-clear", "success", { kind: "all-clear" });
    }

    return messages;
  }
}

const TONE_RANK: Record<IAssistantMessage["tone"], number> = {
  warning: 2,
  success: 1,
  info: 0,
};

/** Mostra só uma mensagem por vez (nunca uma lista) — o assistente não
 * deve interromper o usuário com várias falas ao mesmo tempo. Avisos
 * (atraso, sobrecarga, prazo perto) vêm antes de comemorações. */
export function pickTopMessage(messages: IAssistantMessage[]): IAssistantMessage | null {
  if (messages.length === 0) return null;

  return [...messages].sort((a, b) => TONE_RANK[b.tone] - TONE_RANK[a.tone])[0];
}
