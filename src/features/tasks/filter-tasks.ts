import dayjs, { Dayjs } from "dayjs";

import { ITask, TaskPriority } from "./domain";
import { TaskStatusFilter } from "./task-store";

export interface TaskFilters {
  searchQuery: string;
  statusFilter: TaskStatusFilter;
  priorityFilter: TaskPriority | "all";
  // Modo de baixa energia: esconde "alta"/"critica" — dias assim, só o
  // que é mais leve de encarar aparece.
  lowEnergyMode?: boolean;
}

/** Função pura (sem store, sem banco) pra poder ser testada isoladamente —
 * `TasksList` só chama isso com o que já leu da store. Busca por título é
 * sempre "contém" (case-insensitive), nunca exata. */
export function filterTasks(tasks: ITask[], filters: TaskFilters, now: Dayjs = dayjs()): ITask[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    if (query && !task.title.toLowerCase().includes(query)) return false;
    if (filters.priorityFilter !== "all" && task.priority !== filters.priorityFilter) return false;
    if (filters.lowEnergyMode && (task.priority === "alta" || task.priority === "critica")) return false;

    if (filters.statusFilter === "pending" && task.completed) return false;
    if (filters.statusFilter === "completed" && !task.completed) return false;
    if (filters.statusFilter === "overdue") {
      const isOverdue = !task.completed && !!task.scheduledAt && dayjs(task.scheduledAt).isBefore(now);
      if (!isOverdue) return false;
    }

    return true;
  });
}
