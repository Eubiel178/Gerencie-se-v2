"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import {
  startExecutionSessionAction,
  pauseExecutionSessionAction,
  resumeExecutionSessionAction,
  completeExecutionSessionAction,
  abandonExecutionSessionAction,
} from "@/features/execution-companion/actions";
import { useExecutionCompanionStore } from "@/features/execution-companion/execution-companion-store";
import { emitMascotEvent } from "@/features/mascot-pet";
import type { IExecutionSession } from "@/features/execution-companion/domain/types";

interface ExecutionCompanionContextValue {
  session: IExecutionSession | null;
  intention: { taskId: string } | null;

  startSession: (taskId: string) => Promise<{ error: string | null }>;
  pauseSession: () => Promise<{ error: string | null }>;
  resumeSession: () => Promise<{ error: string | null }>;
  completeSession: () => Promise<{ error: string | null }>;
  abandonSession: () => Promise<{ error: string | null }>;
}

const ExecutionCompanionContext = createContext<ExecutionCompanionContextValue | null>(null);

export function ExecutionCompanionProvider({
  children,
  initialSession,
  initialIntention,
}: {
  children: React.ReactNode;
  initialSession: IExecutionSession | null;
  initialIntention: { taskId: string } | null;
}) {
  const store = useExecutionCompanionStore();
  const storeRef = useRef(store);
  const restoredRef = useRef(false);

  useEffect(() => {
    storeRef.current = store;
  });

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (initialSession) {
      store.setSession(initialSession);
      store.setIntention(initialIntention);
    }
  }, [initialSession, initialIntention]);

  const startSession = useCallback(async (taskId: string) => {
    const s = storeRef.current;

    try {
      const result = await startExecutionSessionAction({ taskId });

      if (result.error) {
        return { error: result.error };
      }

      if (result.session) {
        s.setSession(result.session);
        s.setIntention({ taskId });
        emitMascotEvent("execution-started");
      }

      return { error: null };
    } finally {
      // no-op
    }
  }, []);

  const pauseSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão ativa." };

    emitMascotEvent("execution-distracted");

    const result = await pauseExecutionSessionAction({ sessionId: session.id });
    if (!result.error) {
      s.updateSession({ status: "paused", pausedAt: new Date() });
    }
    return result;
  }, []);

  const resumeSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await resumeExecutionSessionAction({ sessionId: session.id });
    if (!result.error) {
      s.updateSession({ status: "active", pausedAt: null });
      emitMascotEvent("execution-resumed");
    }
    return result;
  }, []);

  const completeSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    emitMascotEvent("execution-completed");

    const result = await completeExecutionSessionAction({ sessionId: session.id });
    if (!result.error) {
      s.updateSession({ status: "completed", completedAt: new Date() });
      s.setIntention(null);

      setTimeout(() => {
        s.reset();
      }, 3000);
    }
    return result;
  }, []);

  const abandonSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await abandonExecutionSessionAction({ sessionId: session.id });
    if (!result.error) {
      s.reset();
    }
    return result;
  }, []);

  return (
    <ExecutionCompanionContext.Provider
      value={{
        session: store.session,
        intention: store.intention,
        startSession,
        pauseSession,
        resumeSession,
        completeSession,
        abandonSession,
      }}
    >
      {children}
    </ExecutionCompanionContext.Provider>
  );
}

export function useExecutionCompanion(): ExecutionCompanionContextValue {
  const context = useContext(ExecutionCompanionContext);
  if (!context) {
    throw new Error("useExecutionCompanion precisa ser usado dentro de um ExecutionCompanionProvider");
  }
  return context;
}
