import dayjs from "dayjs";

import { ITask } from "@/features/tasks/domain";
import { IRoutineItem } from "@/features/routine/domain";
import { IHabit } from "@/features/habits/domain";

export type NextActionKind = "resumed" | "overdue" | "scheduled" | "routine" | "priority" | "habit" | "none";

export interface INextAction {
  kind: NextActionKind;
  label: string;
  title: string;
  href: string;
}

const PRIORITY_RANK: Record<ITask["priority"], number> = {
  critica: 3,
  alta: 2,
  media: 1,
  baixa: 0,
};

/**
 * "Próxima ação" do dashboard: em vez de listar tudo, aponta uma única
 * coisa concreta para fazer agora — reduz a paralisia de decisão. Ordem
 * de prioridade: tarefa atrasada > próxima tarefa agendada hoje > próximo
 * item de rotina > tarefa prioritária sem horário > hábito pendente >
 * nenhuma pendência.
 */
export function buildNextAction(params: {
  tasks: ITask[];
  routine: IRoutineItem[];
  habits: IHabit[];
  now?: Date;
}): INextAction {
  const now = dayjs(params.now ?? new Date());
  const pendingTasks = params.tasks.filter((task) => !task.completed);

  // Retomar uma tarefa já começada vem antes de tudo: voltar de uma
  // interrupção custa caro (reengajar contexto), então evitamos mandar a
  // pessoa pra outra coisa antes de oferecer continuar o que já estava
  // em andamento.
  const resumedTask = pendingTasks
    .filter((task) => task.startedAt)
    .sort((a, b) => dayjs(b.startedAt).valueOf() - dayjs(a.startedAt).valueOf())[0];

  if (resumedTask) {
    return {
      kind: "resumed",
      label: "Continuar de onde parou",
      title: resumedTask.title,
      href: "/home/tasks",
    };
  }

  const overdue = pendingTasks
    .filter((task) => task.scheduledAt && dayjs(task.scheduledAt).isBefore(now))
    .sort((a, b) => dayjs(a.scheduledAt).valueOf() - dayjs(b.scheduledAt).valueOf())[0];

  if (overdue) {
    return {
      kind: "overdue",
      label: dayjs(overdue.scheduledAt).format("DD/MM HH:mm"),
      title: overdue.title,
      href: "/home/tasks",
    };
  }

  const nextScheduled = pendingTasks
    .filter((task) => task.scheduledAt && !dayjs(task.scheduledAt).isBefore(now))
    .sort((a, b) => dayjs(a.scheduledAt).valueOf() - dayjs(b.scheduledAt).valueOf())[0];

  if (nextScheduled) {
    return {
      kind: "scheduled",
      label: dayjs(nextScheduled.scheduledAt).format("HH:mm"),
      title: nextScheduled.title,
      href: "/home/tasks",
    };
  }

  const currentTime = now.format("HH:mm");
  const nextRoutine = [...params.routine]
    .filter((item) => item.time >= currentTime)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  if (nextRoutine) {
    return {
      kind: "routine",
      label: nextRoutine.time,
      title: nextRoutine.title,
      href: "/home/routine",
    };
  }

  const topPriorityTask = [...pendingTasks].sort(
    (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
  )[0];

  // Antes só entrava aqui com prioridade alta/crítica - uma tarefa pendente
  // média/baixa e sem horário (o caso mais comum: "despejo mental" via
  // captura rápida) nunca batia em nenhum ramo acima e caía direto em
  // "Tudo em dia" mesmo com tarefas de verdade esperando (achado em
  // auditoria visual: banner "Nenhuma pendência" ao lado de uma lista com
  // 3 tarefas). Qualquer tarefa pendente agora conta como próxima ação -
  // só o rótulo muda conforme a prioridade real.
  if (topPriorityTask) {
    const isHighPriority = PRIORITY_RANK[topPriorityTask.priority] >= PRIORITY_RANK.alta;

    return {
      kind: "priority",
      label: isHighPriority ? "Prioridade alta" : "Tarefa pendente",
      title: topPriorityTask.title,
      href: "/home/tasks",
    };
  }

  const pendingHabit = params.habits.find((habit) => !habit.completedToday && !habit.archived);

  if (pendingHabit) {
    return {
      kind: "habit",
      label: "Hábito pendente",
      title: pendingHabit.title,
      href: "/home/habits",
    };
  }

  return {
    kind: "none",
    label: "Tudo em dia",
    title: "Nenhuma pendência agora — bom momento para planejar o dia ou descansar.",
    href: "/home/tasks",
  };
}
