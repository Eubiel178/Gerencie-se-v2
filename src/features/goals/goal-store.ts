"use client";

import { create } from "zustand";

import type { IGoal } from "./domain";

interface GoalStore {
  goals: IGoal[];
  setGoals: (goals: IGoal[]) => void;
  replaceGoal: (goal: IGoal) => void;
  removeGoal: (goalId: string) => void;
}

/** Estado de interface dos objetivos. O banco continua sendo a fonte
 * persistente; esta store evita uma recarga completa da rota para cada
 * interação com uma única etapa. */
export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  setGoals: (goals) => set({ goals }),
  replaceGoal: (goal) => set((state) => ({
    goals: state.goals.map((current) => current.id === goal.id ? goal : current),
  })),
  removeGoal: (goalId) => set((state) => ({
    goals: state.goals.filter((goal) => goal.id !== goalId),
  })),
}));
