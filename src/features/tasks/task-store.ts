"use client";

import { create } from "zustand";

import type { ITask, TaskPriority } from "@/features/tasks/domain";

export type TaskStatusFilter = "all" | "pending" | "completed" | "overdue";

interface TaskStore {
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
  removeTask: (taskId: string) => void;
  replaceTask: (task: ITask) => void;

  // Busca/filtros da lista — estado de UI puro (nunca persistido), numa
  // store compartilhada em vez da URL porque a busca por texto muda a
  // cada tecla: um `router.push` por letra digitada navegaria (e
  // recarregaria dados) a cada tecla, o que é caro e nada suave.
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: TaskStatusFilter;
  setStatusFilter: (status: TaskStatusFilter) => void;
  priorityFilter: TaskPriority | "all";
  setPriorityFilter: (priority: TaskPriority | "all") => void;
}

/** Estado de interface para tarefas. A fonte persistente continua sendo o
 * servidor; esta store dá atualização imediata e uma fonte compartilhada
 * entre componentes clientes da feature. */
export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) })),
  replaceTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((current) => current.id === task.id ? task : current),
    })),

  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  statusFilter: "all",
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  priorityFilter: "all",
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
}));
