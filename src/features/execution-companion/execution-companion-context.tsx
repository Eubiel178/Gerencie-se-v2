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
  pauseTaskExecutionAction,
  resumeTaskExecutionAction,
  completeExecutionSessionAction,
  abandonTaskExecutionAction,
} from "@/features/execution-companion/actions";
import type { IExecutionSession } from "@/features/execution-companion/domain/types";
import { useExecutionCompanionStore } from "@/features/execution-companion/execution-companion-store";
import { emitMascotEvent } from "@/features/mascot-pet";
import type { ActionResult } from "@/types/action-result";

interface ExecutionCompanionContextValue {
  session: IExecutionSession | null;
  intention: { taskId: string } | null;

  startSession: (taskId: string) => Promise<ActionResult & { switched?: boolean; previousTaskId?: string }>;
  pauseSession: () => Promise<ActionResult>;
  resumeSession: () => Promise<ActionResult>;
  completeSession: () => Promise<ActionResult>;
  abandonSession: () => Promise<ActionResult>;
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

    const result = await startExecutionSessionAction({ taskId });

    if (result.error) {
      return { error: result.error };
    }

    if (result.session) {
      s.setSession(result.session);
      s.setIntention({ taskId });
      emitMascotEvent("execution-started");
    }

    return { error: null, switched: result.switched, previousTaskId: result.previousTaskId };
  }, []);

  const pauseSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão ativa." };

    // `task.work_status` e `execution_session.status` são escritos juntos,
    // numa única transação no servidor - ver `pauseTaskExecutionAction`
    // pro motivo (evita a tarefa e a sessão discordarem por um instante).
    const result = await pauseTaskExecutionAction({ taskId: session.taskId, sessionId: session.id });
    if (!result.error) {
      const now = new Date();
      s.updateSession({ status: "paused", pausedAt: now, updatedAt: now });
      emitMascotEvent("execution-distracted");
    }
    return result;
  }, []);

  const resumeSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await resumeTaskExecutionAction({ taskId: session.taskId, sessionId: session.id });
    if (!result.error) {
      const now = new Date();
      s.updateSession({ status: "active", pausedAt: null, resumedAt: now, updatedAt: now });
      emitMascotEvent("execution-resumed");
    }
    return result;
  }, []);

  const completeSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await completeExecutionSessionAction({ sessionId: session.id });
    if (!result.error) {
      s.updateSession({ status: "completed", completedAt: new Date() });
      s.setIntention(null);
      emitMascotEvent("execution-completed");
      s.reset();
    }
    return result;
  }, []);

  const abandonSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await abandonTaskExecutionAction({ taskId: session.taskId, sessionId: session.id });
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
