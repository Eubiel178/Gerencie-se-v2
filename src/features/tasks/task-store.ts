"use client";

import { create } from "zustand";

import type { ITask } from "@/features/tasks/domain";

interface TaskStore {
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
  removeTask: (taskId: string) => void;
  replaceTask: (task: ITask) => void;
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
}));
