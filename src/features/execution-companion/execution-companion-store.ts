"use client";

import { create } from "zustand";

import type { IExecutionSession } from "./domain/types";

interface ExecutionCompanionStore {
  session: IExecutionSession | null;
  setSession: (session: IExecutionSession | null) => void;
  updateSession: (patch: Partial<IExecutionSession>) => void;

  intention: { taskId: string } | null;
  setIntention: (intention: { taskId: string } | null) => void;

  reset: () => void;
}

const initialState = {
  session: null,
  intention: null,
};

export const useExecutionCompanionStore = create<ExecutionCompanionStore>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

  updateSession: (patch) =>
    set((state) => ({
      session: state.session ? { ...state.session, ...patch } : null,
    })),

  setIntention: (intention) => set({ intention }),

  reset: () => set(initialState),
}));
