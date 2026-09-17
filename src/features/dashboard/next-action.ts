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
  /** Só preenchido quando a ação vem de uma tarefa (todas menos "routine",
   * "habit" e "none") — usado pra colorir o card conforme a prioridade
   * real, em vez de uma cor fixa igual pra qualquer "kind: priority". */
  priority?: ITask["priority"];
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
      priority: resumedTask.priority,
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
      priority: overdue.priority,
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
      priority: nextScheduled.priority,
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
    // Antes, qualquer tarefa que caísse aqui (inclusive "crítica") sempre
    // mostrava o rótulo fixo "Prioridade alta" — o texto nunca refletia
    // o nível real, e por tabela o card também tinha sempre a MESMA cor
    // (ver `next-action/index.tsx`/`.module.css`), não importa a
    // prioridade de verdade (achado relatado: cor/rótulo sempre iguais).
    const label =
      topPriorityTask.priority === "critica"
        ? "Prioridade crítica"
        : topPriorityTask.priority === "alta"
          ? "Prioridade alta"
          : "Tarefa pendente";

    return {
      kind: "priority",
      label,
      title: topPriorityTask.title,
      href: "/home/tasks",
      priority: topPriorityTask.priority,
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
