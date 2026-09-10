import dayjs from "dayjs";

import { IAssistantMessage } from "@/features/assistant/domain";

import { IAssistantContext } from "./context";

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
    const messages: IAssistantMessage[] = [];

    const pendingTasks = context.tasks.filter((task) => !task.completed);
    const overdueTasks = pendingTasks.filter(
      (task) => task.scheduledAt && dayjs(task.scheduledAt).isBefore(now)
    );

    if (overdueTasks.length > 0) {
      messages.push({
        id: "overdue-tasks",
        tone: "warning",
        text:
          overdueTasks.length === 1
            ? `A tarefa "${overdueTasks[0].title}" está atrasada.`
            : `Você tem ${overdueTasks.length} tarefas atrasadas. A mais antiga é "${overdueTasks[0].title}".`,
      });
    }

    const priorityTasks = context.tasks.filter(
      (task) => task.priority === "alta" || task.priority === "critica"
    );

    if (priorityTasks.length > 0) {
      const donePriority = priorityTasks.filter((task) => task.completed).length;

      if (donePriority === priorityTasks.length) {
        messages.push({
          id: "priority-tasks-done",
          tone: "success",
          text: `Você concluiu todas as ${priorityTasks.length} tarefas prioritárias de hoje.`,
        });
      } else if (donePriority > 0) {
        messages.push({
          id: "priority-tasks-progress",
          tone: "info",
          text: `Você já concluiu ${donePriority} das ${priorityTasks.length} tarefas prioritárias.`,
        });
      }
    }

    if (pendingTasks.length > OVERLOAD_THRESHOLD) {
      messages.push({
        id: "task-overload",
        tone: "warning",
        text: `Você tem ${pendingTasks.length} tarefas pendentes — talvez seja hora de reorganizar prioridades.`,
      });
    }

    const bestStreak = context.habits
      .filter((habit) => habit.frequency === "daily" && !habit.completedToday)
      .sort((a, b) => b.currentStreak - a.currentStreak)[0];

    if (bestStreak && bestStreak.currentStreak >= STREAK_HIGHLIGHT_MIN) {
      messages.push({
        id: "habit-streak-at-risk",
        tone: "warning",
        text: `Sua sequência em "${bestStreak.title}" está em ${bestStreak.currentStreak} dias — não perca hoje.`,
      });
    }

    const urgentGoal = context.goals
      .filter((goal) => !goal.archived && goal.deadline && goal.progressPercent < 100)
      .map((goal) => ({ goal, daysLeft: dayjs(goal.deadline).diff(now, "day") }))
      .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= DEADLINE_WARNING_DAYS)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0];

    if (urgentGoal) {
      const { goal, daysLeft } = urgentGoal;
      messages.push({
        id: "goal-deadline-near",
        tone: "warning",
        text:
          daysLeft === 0
            ? `O prazo de "${goal.title}" é hoje e o progresso está em ${goal.progressPercent}%.`
            : `O prazo de "${goal.title}" é em ${daysLeft} dia(s) e o progresso está em ${goal.progressPercent}%.`,
      });
    }

    const currentTime = now.format("HH:mm");
    const nextRoutineItem = [...context.routine]
      .filter((item) => item.time >= currentTime)
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    if (nextRoutineItem && messages.length === 0) {
      messages.push({
        id: "next-routine-item",
        tone: "info",
        text: `Próximo da rotina: ${nextRoutineItem.time} — ${nextRoutineItem.title}.`,
      });
    }

    if (messages.length === 0 && pendingTasks.length === 0) {
      messages.push({
        id: "all-clear",
        tone: "success",
        text: "Nenhuma tarefa pendente agora — bom momento para planejar ou descansar.",
      });
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
